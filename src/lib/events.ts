import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { syncEventToCalendars } from "./calendar";
import { buildIcs, eventUrl } from "./calendar/ics";
import { sendEventConfirmation } from "./email";
import { SITE_URL } from "./site";

const TZ = "Europe/Copenhagen";

/** "lørdag 14. november kl. 19.00–23.00" */
export function formatEventTime(start: Date, end: Date) {
  const day = start.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const t = (d: Date) => d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  const sameDay = start.toLocaleDateString("da-DK", { timeZone: TZ }) === end.toLocaleDateString("da-DK", { timeZone: TZ });
  if (sameDay) return `${day} kl. ${t(start)}–${t(end)}`;
  const endDay = end.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  return `${day} kl. ${t(start)} – ${endDay} kl. ${t(end)}`;
}

/** Pladser der er taget: bekræftede plus dem, der venter på betaling */
export async function getSeatsTaken(eventIds: number[]): Promise<Map<number, number>> {
  if (eventIds.length === 0) return new Map();
  const rows = await db
    .select({ eventId: s.eventSignups.eventId, seats: sql<number>`sum(${s.eventSignups.seats})` })
    .from(s.eventSignups)
    .where(and(inArray(s.eventSignups.eventId, eventIds), ne(s.eventSignups.status, "annulleret")))
    .groupBy(s.eventSignups.eventId);
  return new Map(rows.map((r) => [r.eventId, Number(r.seats)]));
}

export type PublicEvent = Awaited<ReturnType<typeof getUpcomingEvents>>[number];

export async function getUpcomingEvents(from = new Date(), to?: Date) {
  const rows = await db.query.events.findMany({
    where: and(eq(s.events.published, true), gte(s.events.endsAt, from), to ? lt(s.events.startsAt, to) : undefined),
    orderBy: asc(s.events.startsAt),
    columns: { routeGeojson: false, externalIds: false, syncError: false },
    extras: { hasRoute: sql<number>`${s.events.routeGeojson} is not null`.as("has_route") },
    with: { product: { columns: { slug: true, name: true } } },
  });
  const taken = await getSeatsTaken(rows.map((r) => r.id));
  return rows.map((e) => ({
    ...e,
    hasRoute: !!e.hasRoute,
    seatsTaken: taken.get(e.id) ?? 0,
    seatsLeft: e.capacity == null ? null : Math.max(0, e.capacity - (taken.get(e.id) ?? 0)),
  }));
}

export async function getEventBySlug(slug: string) {
  const event = await db.query.events.findFirst({
    where: and(eq(s.events.slug, slug), eq(s.events.published, true)),
    columns: { externalIds: false, syncError: false },
    with: { product: { columns: { slug: true, name: true, emoji: true } } },
  });
  if (!event) return null;
  const taken = (await getSeatsTaken([event.id])).get(event.id) ?? 0;
  return {
    ...event,
    seatsTaken: taken,
    seatsLeft: event.capacity == null ? null : Math.max(0, event.capacity - taken),
  };
}

/** Kommende events med rute – vises på rutekortet */
export async function getEventRoutes() {
  const rows = await db.query.events.findMany({
    where: and(eq(s.events.published, true), gte(s.events.endsAt, new Date()), sql`${s.events.routeGeojson} is not null`),
    orderBy: asc(s.events.startsAt),
    columns: { slug: true, title: true, emoji: true, color: true, startsAt: true, endsAt: true, routeGeojson: true },
  });
  return rows.filter((r) => r.routeGeojson);
}

/**
 * Kaldes når en ordre er betalt: bekræfter tilmeldingerne, skriver deltagerne på
 * kalenderposten (så eventet lander i deres kalender) og sender en bekræftelse.
 */
export async function confirmEventSignups(orderId: number) {
  const signups = await db.query.eventSignups.findMany({
    where: and(eq(s.eventSignups.orderId, orderId), eq(s.eventSignups.status, "afventer")),
    with: { event: true, order: { columns: { orderNumber: true, accessToken: true } } },
  });
  if (signups.length === 0) return;
  await db
    .update(s.eventSignups)
    .set({ status: "bekraeftet" })
    .where(inArray(s.eventSignups.id, signups.map((x) => x.id)));

  for (const eventId of new Set(signups.map((x) => x.eventId))) {
    const result = await syncEventToCalendars(eventId);
    for (const x of signups.filter((x) => x.eventId === eventId)) {
      const ev = x.event;
      const data = {
        uid: `event-${ev.id}-signup-${x.id}`,
        title: `${ev.emoji} ${ev.title}`,
        description: ev.summary,
        location: ev.location,
        start: ev.startsAt,
        end: ev.endsAt,
        url: eventUrl(ev.slug),
        attendee: { email: x.email, name: x.name },
      };
      await sendEventConfirmation({
        to: x.email,
        name: x.name,
        title: data.title,
        when: formatEventTime(ev.startsAt, ev.endsAt),
        location: ev.location,
        seats: x.seats,
        eventLink: data.url,
        orderLink: `${SITE_URL}/ordre/${x.order.orderNumber}?k=${x.order.accessToken}`,
        invitedByCalendar: result.attendeesSynced,
        ics: result.attendeesSynced ? undefined : buildIcs(data, "REQUEST"),
      });
    }
  }
}

/** Kaldes når en ordre annulleres: frigiver pladserne og fjerner deltagerne fra kalenderposten */
export async function cancelEventSignups(orderId: number) {
  const signups = await db.query.eventSignups.findMany({
    where: and(eq(s.eventSignups.orderId, orderId), ne(s.eventSignups.status, "annulleret")),
    columns: { id: true, eventId: true, status: true },
  });
  if (signups.length === 0) return;
  await db
    .update(s.eventSignups)
    .set({ status: "annulleret" })
    .where(inArray(s.eventSignups.id, signups.map((x) => x.id)));
  for (const eventId of new Set(signups.filter((x) => x.status === "bekraeftet").map((x) => x.eventId))) {
    await syncEventToCalendars(eventId);
  }
}

/** Ordrestatus → tilmeldingsstatus. Bruges både af betalinger og når Villads selv skifter status. */
export async function syncSignupsWithOrderStatus(orderId: number, status: (typeof s.ORDER_STATUSES)[number]) {
  if (status === "annulleret") await cancelEventSignups(orderId);
  else if (status !== "afventer_betaling") await confirmEventSignups(orderId);
}
