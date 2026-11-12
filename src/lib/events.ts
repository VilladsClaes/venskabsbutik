import { and, asc, eq, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { after } from "next/server";
import { db, schema as s } from "@/db";
import type { PaymentMethod } from "@/db/schema";
import { syncEventToCalendars } from "./calendar";
import { buildIcs } from "./calendar/ics";
import {
  sendAdminNotice,
  sendEventCancelled,
  sendEventGo,
  sendNewDate,
  sendPaymentReminder,
} from "./event-emails";
import { eventPageUrl, eventPlainText, firstName, formatEventTime } from "./event-text";
import { esc } from "./email";
import { getPaymentConfig } from "./payments";
import { getSettings } from "./queries";

export { effectiveDeadline, firstName, formatEventTime } from "./event-text";

/** Så mange dage har man til at betale, når eventet er bekræftet */
export const PAYMENT_DAYS = 3;

/* ---------- Læsning ---------- */

/** Pladser der er taget (alle der ikke har meldt fra) */
export async function getSeatsTaken(eventIds: number[]): Promise<Map<number, number>> {
  if (eventIds.length === 0) return new Map();
  const rows = await db
    .select({ eventId: s.eventSignups.eventId, seats: sql<number>`sum(${s.eventSignups.seats})` })
    .from(s.eventSignups)
    .where(and(inArray(s.eventSignups.eventId, eventIds), ne(s.eventSignups.status, "annulleret")))
    .groupBy(s.eventSignups.eventId);
  return new Map(rows.map((r) => [r.eventId, Number(r.seats)]));
}

/** Fornavne på dem der kommer (null = vil ikke vises) – i tilmeldingsrækkefølge */
async function getParticipants(eventIds: number[]): Promise<Map<number, (string | null)[]>> {
  const out = new Map<number, (string | null)[]>();
  if (eventIds.length === 0) return out;
  const rows = await db
    .select({ eventId: s.eventSignups.eventId, name: s.eventSignups.name, hide: s.eventSignups.hideName, seats: s.eventSignups.seats })
    .from(s.eventSignups)
    .where(and(inArray(s.eventSignups.eventId, eventIds), ne(s.eventSignups.status, "annulleret")))
    .orderBy(asc(s.eventSignups.createdAt), asc(s.eventSignups.id));
  for (const r of rows) {
    const list = out.get(r.eventId) ?? [];
    list.push(r.hide ? null : firstName(r.name));
    // Gamle tilmeldinger kunne have flere pladser på én række
    for (let i = 1; i < r.seats; i++) list.push(null);
    out.set(r.eventId, list);
  }
  return out;
}

function withCounts<T extends { id: number; capacity: number | null }>(rows: T[], taken: Map<number, number>, names: Map<number, (string | null)[]>) {
  return rows.map((e) => {
    const seatsTaken = taken.get(e.id) ?? 0;
    return {
      ...e,
      seatsTaken,
      seatsLeft: e.capacity == null ? null : Math.max(0, e.capacity - seatsTaken),
      participants: names.get(e.id) ?? [],
    };
  });
}

export type PublicEvent = Awaited<ReturnType<typeof getUpcomingEvents>>[number];

export async function getUpcomingEvents(from = new Date(), to?: Date) {
  const rows = await db.query.events.findMany({
    where: and(eq(s.events.published, true), ne(s.events.status, "aflyst"), gte(s.events.endsAt, from), to ? lt(s.events.startsAt, to) : undefined),
    orderBy: asc(s.events.startsAt),
    columns: { routeGeojson: false, externalIds: false, syncError: false },
    extras: { hasRoute: sql<number>`${s.events.routeGeojson} is not null`.as("has_route") },
    with: { product: { columns: { slug: true, name: true } } },
  });
  const ids = rows.map((r) => r.id);
  const [taken, names] = await Promise.all([getSeatsTaken(ids), getParticipants(ids)]);
  return withCounts(rows, taken, names).map((e) => ({ ...e, hasRoute: !!e.hasRoute }));
}

/** Kommende datoer for en aktivitet (til produktsiden) */
export async function getActivityDates(productId: number) {
  const rows = await db.query.events.findMany({
    where: and(eq(s.events.productId, productId), eq(s.events.published, true), ne(s.events.status, "aflyst"), gte(s.events.startsAt, new Date())),
    orderBy: asc(s.events.startsAt),
    columns: { id: true, slug: true, title: true, startsAt: true, endsAt: true, location: true, price: true, capacity: true, minParticipants: true, status: true, signupDeadline: true },
  });
  const ids = rows.map((r) => r.id);
  const [taken, names] = await Promise.all([getSeatsTaken(ids), getParticipants(ids)]);
  return withCounts(rows, taken, names);
}

/** Et event til eventsiden – også aflyste, så linket stadig giver mening */
export async function getEventBySlug(slug: string) {
  const event = await db.query.events.findFirst({
    where: and(eq(s.events.slug, slug), eq(s.events.published, true)),
    columns: { externalIds: false, syncError: false },
    with: { product: { columns: { slug: true, name: true, emoji: true } } },
  });
  if (!event) return null;
  const [taken, names] = await Promise.all([getSeatsTaken([event.id]), getParticipants([event.id])]);
  return withCounts([event], taken, names)[0];
}

/** Kommende events med rute – vises på rutekortet */
export async function getEventRoutes() {
  const rows = await db.query.events.findMany({
    where: and(eq(s.events.published, true), ne(s.events.status, "aflyst"), gte(s.events.endsAt, new Date()), sql`${s.events.routeGeojson} is not null`),
    orderBy: asc(s.events.startsAt),
    columns: { slug: true, title: true, emoji: true, color: true, startsAt: true, endsAt: true, routeGeojson: true },
  });
  return rows.filter((r) => r.routeGeojson);
}

/** En tilmelding (gruppe) ud fra nøglen i afmeldingslinket */
export async function getSignupGroup(token: string) {
  if (!/^[\w-]{10,60}$/.test(token)) return null;
  const rows = await db.query.eventSignups.findMany({
    where: eq(s.eventSignups.groupToken, token),
    orderBy: [asc(s.eventSignups.id)],
    with: {
      event: { columns: { externalIds: false, syncError: false, routeGeojson: false }, with: { product: { columns: { slug: true, name: true } } } },
      order: { columns: { orderNumber: true, accessToken: true, status: true, total: true } },
    },
  });
  if (rows.length === 0) return null;
  const taken = (await getSeatsTaken([rows[0].eventId])).get(rows[0].eventId) ?? 0;
  return { event: { ...rows[0].event, seatsTaken: taken }, signups: rows };
}

/* ---------- Ordrer ---------- */

/** Betalingsmåde ordren starter med – kunden kan skifte på ordresiden */
function defaultMethod(enabled: PaymentMethod[]): PaymentMethod {
  return (["mobilepay", "bank", "stripe", "paypal"] as const).find((m) => enabled.includes(m)) ?? enabled[0] ?? "venskab";
}

async function upsertCustomer(name: string, email: string, phone: string | null) {
  const existing = await db.query.customers.findFirst({
    where: (c, { or, eq }) => or(eq(c.email, email), phone ? eq(c.phone, phone) : undefined),
  });
  if (existing) {
    await db
      .update(s.customers)
      .set({ email, phone: phone ?? existing.phone })
      .where(eq(s.customers.id, existing.id));
    return existing.id;
  }
  const [c] = await db.insert(s.customers).values({ name, email, phone, allowMention: false }).returning({ id: s.customers.id });
  return c.id;
}

/**
 * Laver ordren for en tilmelding, når eventet gennemføres. Den der tilmeldte betaler for hele
 * gruppen. Gør intet hvis gruppen allerede har en ordre (sikker at kalde flere gange).
 */
export async function createOrderForGroup(token: string): Promise<number | null> {
  const group = await db.query.eventSignups.findMany({
    where: and(eq(s.eventSignups.groupToken, token), eq(s.eventSignups.status, "tilmeldt")),
    orderBy: asc(s.eventSignups.id),
    with: { event: true },
  });
  if (group.length === 0) return null;
  const event = group[0].event;
  const payer = group.find((x) => x.isBooker) ?? group[0];
  const seats = group.reduce((n, x) => n + x.seats, 0);
  const total = event.price * seats;
  const free = total === 0;
  const method = free ? "venskab" : defaultMethod(getPaymentConfig(await getSettings()).enabled);
  const accessToken = token.slice(0, 24);
  const customerId = await upsertCustomer(payer.name, payer.email, payer.phone);

  const [order] = await db
    .insert(s.orders)
    .values({
      orderNumber: `tmp-${token}`,
      accessToken,
      customerId,
      total,
      customerNote: group.map((x) => x.note).filter(Boolean).join("\n"),
      paymentMethod: method,
      ...(free ? { status: "betalt" as const, paidAt: new Date() } : {}),
    })
    .returning({ id: s.orders.id });
  const orderNumber = `VC-${1000 + order.id}`;
  await db.update(s.orders).set({ orderNumber }).where(eq(s.orders.id, order.id));
  await db.insert(s.orderItems).values({
    orderId: order.id,
    productId: event.productId,
    eventId: event.id,
    productName: `${event.emoji} ${event.title}`,
    variantName: formatEventTime(event.startsAt, event.endsAt),
    unitPrice: event.price,
    quantity: seats,
    lineTotal: total,
    answers: [
      ...(event.location ? [{ question: "Sted", answer: event.location }] : []),
      { question: "Deltagere", answer: group.map((x) => x.name).join(", ") },
    ],
  });
  // Kun rækker der stadig er "tilmeldt" – en samtidig kørsel får 0 rækker og rydder op
  const updated = await db
    .update(s.eventSignups)
    .set({ status: "bekraeftet", orderId: order.id })
    .where(and(eq(s.eventSignups.groupToken, token), eq(s.eventSignups.status, "tilmeldt")))
    .returning({ id: s.eventSignups.id });
  if (updated.length === 0) {
    await db.delete(s.orders).where(eq(s.orders.id, order.id));
    return null;
  }
  return order.id;
}

/* ---------- Overgange ---------- */

/**
 * Minimum er nået: eventet gennemføres, og alle tilmeldinger får en ordre.
 * Returnerer true hvis det var dette kald, der skiftede status (så sendes mails bagefter).
 */
export async function activateEvent(eventId: number): Promise<boolean> {
  const changed = await db
    .update(s.events)
    .set({ status: "gennemfoeres", confirmedAt: new Date() })
    .where(and(eq(s.events.id, eventId), eq(s.events.status, "samler")))
    .returning({ id: s.events.id });
  if (changed.length === 0) return false;
  const groups = await db
    .selectDistinct({ token: s.eventSignups.groupToken })
    .from(s.eventSignups)
    .where(and(eq(s.eventSignups.eventId, eventId), eq(s.eventSignups.status, "tilmeldt")));
  for (const g of groups) await createOrderForGroup(g.token);
  return true;
}

type EventRow = typeof s.events.$inferSelect;

/** Kalenderinvitation + "vi kører"-mail til de grupper, der netop er bekræftet */
export async function announceConfirmed(eventId: number, tokens?: string[]) {
  const result = await syncEventToCalendars(eventId);
  const event = await db.query.events.findFirst({ where: eq(s.events.id, eventId) });
  if (!event) return;
  const signups = await db.query.eventSignups.findMany({
    where: and(
      eq(s.eventSignups.eventId, eventId),
      eq(s.eventSignups.status, "bekraeftet"),
      tokens ? inArray(s.eventSignups.groupToken, tokens) : undefined,
    ),
    orderBy: asc(s.eventSignups.id),
    with: { order: { columns: { id: true, orderNumber: true, accessToken: true, total: true } } },
  });
  for (const x of signups) {
    const group = signups.filter((y) => y.groupToken === x.groupToken);
    const payer = group.find((y) => y.isBooker) ?? group[0];
    const isPayer = payer.id === x.id;
    await sendEventGo({
      to: x.email,
      name: x.name,
      event,
      token: x.groupToken,
      invitedByCalendar: result.attendeesSynced,
      ics: result.attendeesSynced ? undefined : icsFor(event, x, group.length),
      payment: isPayer && x.order ? { order: x.order, total: x.order.total, seats: group.reduce((n, y) => n + y.seats, 0) } : undefined,
      paidBy: isPayer ? undefined : payer.name,
    });
  }
  return result;
}

function icsFor(event: EventRow, x: { id: number; email: string; name: string }, seatsTaken: number) {
  return buildIcs(
    {
      uid: `event-${event.id}-signup-${x.id}`,
      title: `${event.emoji} ${event.title}`,
      description: eventPlainText(event, seatsTaken),
      location: event.location,
      start: event.startsAt,
      end: event.endsAt,
      url: eventPageUrl(event.slug),
      attendee: { email: x.email, name: x.name },
    },
    "REQUEST",
  );
}

/** Aflyser eventet: ubetalte ordrer annulleres, alle får besked og posten fjernes fra kalenderen */
export async function cancelEvent(eventId: number, reason: string) {
  const changed = await db
    .update(s.events)
    .set({ status: "aflyst", cancelledAt: new Date(), cancelReason: reason })
    .where(and(eq(s.events.id, eventId), ne(s.events.status, "aflyst")))
    .returning();
  if (changed.length === 0) return false;
  const event = changed[0];
  const signups = await db.query.eventSignups.findMany({
    where: and(eq(s.eventSignups.eventId, eventId), ne(s.eventSignups.status, "annulleret")),
    with: { order: { columns: { id: true, status: true, orderNumber: true } } },
  });
  const unpaid = [...new Set(signups.filter((x) => x.order?.status === "afventer_betaling").map((x) => x.order!.id))];
  if (unpaid.length) await db.update(s.orders).set({ status: "annulleret" }).where(inArray(s.orders.id, unpaid));
  await syncEventToCalendars(eventId);
  for (const x of signups) {
    const paid = !!x.order && x.order.status !== "afventer_betaling" && x.order.status !== "annulleret" && x.isBooker && event.price > 0;
    await sendEventCancelled({ to: x.email, name: x.name, event, reason, paid });
  }
  const refunds = [...new Set(signups.filter((x) => x.order && !unpaid.includes(x.order.id) && x.order.status !== "annulleret" && event.price > 0).map((x) => x.order!.orderNumber))];
  const settings = await getSettings();
  await sendAdminNotice(
    settings.contactEmail,
    `Aflyst: ${event.emoji} ${event.title}`,
    `<p>${esc(reason)}</p><p>${signups.length} tilmeldte har fået besked.</p>${refunds.length ? `<p><b>Skal have pengene retur:</b> ${refunds.join(", ")}</p>` : ""}`,
    eventId,
  );
  return true;
}

/** Ordren er annulleret (af Villads): deltagerne på den ordre er ikke med længere */
export async function cancelEventSignups(orderId: number) {
  const signups = await db.query.eventSignups.findMany({
    where: and(eq(s.eventSignups.orderId, orderId), ne(s.eventSignups.status, "annulleret")),
    columns: { id: true, eventId: true },
  });
  if (signups.length === 0) return;
  await db
    .update(s.eventSignups)
    .set({ status: "annulleret" })
    .where(inArray(s.eventSignups.id, signups.map((x) => x.id)));
  for (const eventId of new Set(signups.map((x) => x.eventId))) await syncEventToCalendars(eventId);
}

/** Ordrestatus → tilmeldinger. Invitationen sendes allerede, når eventet gennemføres, så kun annullering betyder noget. */
export async function syncSignupsWithOrderStatus(orderId: number, status: (typeof s.ORDER_STATUSES)[number]) {
  if (status === "annulleret") await cancelEventSignups(orderId);
}

/**
 * Fjerner én deltager (Villads i admin). Er der en ubetalt ordre, rettes antal og beløb,
 * så betaleren kun betaler for dem der kommer.
 */
export async function removeSignup(signupId: number) {
  const x = await db.query.eventSignups.findFirst({ where: eq(s.eventSignups.id, signupId), with: { event: true } });
  if (!x || x.status === "annulleret") return;
  await db.update(s.eventSignups).set({ status: "annulleret" }).where(eq(s.eventSignups.id, signupId));
  if (x.orderId) {
    const order = await db.query.orders.findFirst({ where: eq(s.orders.id, x.orderId), with: { items: true } });
    if (order?.status === "afventer_betaling") {
      const left = await db.query.eventSignups.findMany({
        where: and(eq(s.eventSignups.orderId, order.id), ne(s.eventSignups.status, "annulleret")),
        columns: { seats: true },
      });
      const seats = left.reduce((n, y) => n + y.seats, 0);
      const item = order.items.find((i) => i.eventId === x.eventId);
      if (seats === 0) await db.update(s.orders).set({ status: "annulleret" }).where(eq(s.orders.id, order.id));
      else if (item) {
        const total = x.event.price * seats;
        await db.update(s.orderItems).set({ quantity: seats, lineTotal: total }).where(eq(s.orderItems.id, item.id));
        await db.update(s.orders).set({ total: order.total - item.lineTotal + total }).where(eq(s.orders.id, order.id));
      }
    }
  }
  await syncEventToCalendars(x.eventId);
}

/* ---------- Frister og påmindelser ---------- */

/**
 * Kører jævnligt (cron + når nogen kigger på events):
 * - frist passeret uden nok tilmeldte → aflys
 * - frist passeret med nok (fx hvis Villads har sænket minimum) → gennemfør
 * - ubetalt efter PAYMENT_DAYS dage → én venlig påmindelse, og Villads får en liste
 */
export async function processEventDeadlines(now = new Date()) {
  const due = await db.query.events.findMany({
    where: and(eq(s.events.status, "samler"), lte(sql`coalesce(${s.events.signupDeadline}, ${s.events.startsAt})`, Math.floor(now.getTime() / 1000))),
  });
  const taken = await getSeatsTaken(due.map((e) => e.id));
  for (const e of due) {
    const n = taken.get(e.id) ?? 0;
    if (n >= e.minParticipants) {
      if (await activateEvent(e.id)) await announceConfirmed(e.id);
    } else {
      await cancelEvent(
        e.id,
        n === 0
          ? `Der var desværre ingen tilmeldte til ${e.title}, så det bliver ikke til noget denne gang.`
          : `Vi blev kun ${n} af de ${e.minParticipants}, der skulle til, så ${e.title} bliver desværre ikke til noget denne gang.`,
      );
    }
  }

  // Betalingspåmindelser
  const cutoff = new Date(now.getTime() - PAYMENT_DAYS * 86400_000);
  const unpaid = await db
    .select({
      orderId: s.orders.id,
      orderNumber: s.orders.orderNumber,
      accessToken: s.orders.accessToken,
      total: s.orders.total,
      eventId: s.eventSignups.eventId,
    })
    .from(s.eventSignups)
    .innerJoin(s.orders, eq(s.orders.id, s.eventSignups.orderId))
    .innerJoin(s.events, eq(s.events.id, s.eventSignups.eventId))
    .where(
      and(
        eq(s.eventSignups.status, "bekraeftet"),
        eq(s.orders.status, "afventer_betaling"),
        lte(s.orders.createdAt, cutoff),
        sql`${s.eventSignups.paymentRemindedAt} is null`,
        eq(s.events.status, "gennemfoeres"),
        gte(s.events.startsAt, now),
      ),
    )
    .groupBy(s.orders.id);
  if (unpaid.length === 0) return;
  const reminded: string[] = [];
  for (const u of unpaid) {
    const [event, payer] = await Promise.all([
      db.query.events.findFirst({ where: eq(s.events.id, u.eventId) }),
      db.query.eventSignups.findFirst({
        where: and(eq(s.eventSignups.orderId, u.orderId), ne(s.eventSignups.status, "annulleret")),
        orderBy: [sql`${s.eventSignups.isBooker} desc`, asc(s.eventSignups.id)],
      }),
    ]);
    if (!event || !payer) continue;
    await sendPaymentReminder({ to: payer.email, name: payer.name, event, order: u, total: u.total });
    await db.update(s.eventSignups).set({ paymentRemindedAt: now }).where(eq(s.eventSignups.orderId, u.orderId));
    reminded.push(`${esc(payer.name)} – ${esc(`${event.emoji} ${event.title}`)} (${u.orderNumber})`);
  }
  const settings = await getSettings();
  await sendAdminNotice(
    settings.contactEmail,
    `${reminded.length} har ikke betalt for events`,
    `<p>De har fået en påmindelse. Du kan fjerne dem fra eventet i admin, hvis det trækker ud:</p><ul>${reminded.map((r) => `<li>${r}</li>`).join("")}</ul>`,
  );
}

let lastCheck = 0;
/** Tjekker frister efter svaret – højst hvert 5. minut pr. server */
export function checkDeadlinesSoon() {
  if (Date.now() - lastCheck < 5 * 60_000) return;
  lastCheck = Date.now();
  after(() => processEventDeadlines().catch((e) => console.error("Eventfrister fejlede", e)));
}

/** Ny dato på en aktivitet: giv dem besked, der har sagt de er interesserede */
export async function notifyInterested(eventId: number) {
  const event = await db.query.events.findFirst({ where: eq(s.events.id, eventId) });
  if (!event?.productId || !event.published || event.status === "aflyst") return 0;
  const interested = await db.query.activityInterests.findMany({ where: eq(s.activityInterests.productId, event.productId) });
  for (const i of interested) await sendNewDate({ to: i.email, name: i.name, event });
  return interested.length;
}
