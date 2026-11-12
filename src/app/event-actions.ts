"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { syncEventToCalendars } from "@/lib/calendar";
import { esc } from "@/lib/email";
import { sendAdminNotice, sendSignedUp, sendWithdrawn } from "@/lib/event-emails";
import { activateEvent, announceConfirmed, createOrderForGroup, effectiveDeadline, getSeatsTaken } from "@/lib/events";
import { getSettings } from "@/lib/queries";

const person = z.object({
  name: z.string().trim().min(1, "Skriv et navn").max(120),
  email: z.string().trim().toLowerCase().max(200).email("Skriv en gyldig e-mail – den bruges til kalenderinvitationen"),
});

const signupSchema = z.object({
  eventId: z.number().int(),
  booker: person.extend({ phone: z.string().trim().max(30) }),
  guests: z.array(person).max(9),
  hideName: z.boolean(),
  note: z.string().trim().max(2000),
  website: z.string().max(0).optional(), // honningfælde mod spam-robotter
});

export type EventSignupInput = z.infer<typeof signupSchema>;
export type EventSignupResult = { ok: true; token: string } | { ok: false; error: string };

/**
 * Tilmelding: én række pr. person, uden betaling. Når minimum er nået, gennemføres eventet,
 * og først da laves ordren og kalenderinvitationen. Er eventet allerede bekræftet, sker det med det samme.
 */
export async function signUpForEvent(input: EventSignupInput): Promise<EventSignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldige oplysninger" };
  const { eventId, booker, guests, hideName, note } = parsed.data;

  const event = await db.query.events.findFirst({ where: and(eq(s.events.id, eventId), eq(s.events.published, true)) });
  if (!event) return { ok: false, error: "Eventet findes ikke længere" };
  if (event.status === "aflyst") return { ok: false, error: "Eventet er desværre aflyst" };
  const now = new Date();
  if (event.startsAt <= now) return { ok: false, error: "Eventet er allerede gået i gang" };
  if (event.status === "samler" && effectiveDeadline(event) <= now) return { ok: false, error: "Fristen for tilmelding er overskredet" };

  const people = [{ ...booker, isBooker: true }, ...guests.map((g) => ({ ...g, phone: "", isBooker: false }))];
  const emails = people.map((p) => p.email);
  if (new Set(emails).size !== emails.length) return { ok: false, error: "Hver person skal have sin egen e-mail – den bruges til kalenderinvitationen" };

  const token = randomBytes(18).toString("base64url");
  const created = await db.transaction(async (tx) => {
    const already = await tx.query.eventSignups.findFirst({
      where: and(eq(s.eventSignups.eventId, eventId), ne(s.eventSignups.status, "annulleret"), inArray(s.eventSignups.email, emails)),
      columns: { email: true },
    });
    if (already) return { error: `${already.email} er allerede tilmeldt 🙂` };
    if (event.capacity != null) {
      const [{ taken }] = await tx
        .select({ taken: sql<number>`coalesce(sum(${s.eventSignups.seats}), 0)` })
        .from(s.eventSignups)
        .where(and(eq(s.eventSignups.eventId, eventId), ne(s.eventSignups.status, "annulleret")));
      const left = event.capacity - Number(taken);
      if (left < people.length) return { error: left > 0 ? `Der er kun ${left} ${left === 1 ? "plads" : "pladser"} tilbage` : "Eventet er desværre fuldt booket" };
    }
    await tx.insert(s.eventSignups).values(
      people.map((p) => ({
        eventId,
        groupToken: token,
        isBooker: p.isBooker,
        name: p.name,
        email: p.email,
        phone: p.phone.replace(/\s/g, "") || null,
        note: p.isBooker ? note : "",
        hideName,
      })),
    );
    return { ok: true };
  });
  if ("error" in created) return { ok: false, error: created.error! };

  const taken = (await getSeatsTaken([eventId])).get(eventId) ?? 0;
  if (event.status === "gennemfoeres") {
    // Eventet kører allerede: ordre og invitation med det samme
    await createOrderForGroup(token);
    after(() => announceConfirmed(eventId, [token]));
  } else if (taken >= event.minParticipants && (await activateEvent(eventId))) {
    after(async () => {
      await announceConfirmed(eventId);
      const settings = await getSettings();
      await sendAdminNotice(
        settings.contactEmail,
        `${event.emoji} ${event.title} bliver til noget! ✅`,
        `<p>${taken} er tilmeldt (minimum ${event.minParticipants}). Alle har fået en invitation${event.price ? " og besked om at betale" : ""}, og din kalenderpost er skiftet fra “måske” til optaget.</p>`,
        eventId,
      );
    });
  } else {
    after(async () => {
      await syncEventToCalendars(eventId); // opdaterer antallet på "måske"-posten
      for (const p of people) {
        await sendSignedUp({ to: p.email, name: p.name, bookerName: p.isBooker ? null : booker.name, event, seatsTaken: taken, token, isBooker: p.isBooker });
      }
      const settings = await getSettings();
      await sendAdminNotice(
        settings.contactEmail,
        `Ny tilmelding: ${event.emoji} ${event.title} (${taken}/${event.minParticipants})`,
        `<p>${people.map((p) => esc(p.name)).join(", ")} har meldt sig til.</p>${note ? `<p>“${esc(note)}”</p>` : ""}`,
        eventId,
      );
    });
  }
  revalidatePath("/", "layout");
  return { ok: true, token };
}

/** Afmelding via linket i mailen – kun mens eventet samler tilmeldte */
export async function withdrawSignup(token: string): Promise<{ ok: boolean; error?: string }> {
  const group = await db.query.eventSignups.findMany({
    where: and(eq(s.eventSignups.groupToken, token), eq(s.eventSignups.status, "tilmeldt")),
    with: { event: true },
  });
  if (group.length === 0) return { ok: false, error: "Tilmeldingen findes ikke, eller du er allerede afmeldt" };
  const event = group[0].event;
  if (event.status !== "samler")
    return { ok: false, error: "Eventet er bekræftet, så de andre regner med dig – skriv til Villads, hvis du ikke kan alligevel" };
  await db
    .update(s.eventSignups)
    .set({ status: "annulleret" })
    .where(and(eq(s.eventSignups.groupToken, token), eq(s.eventSignups.status, "tilmeldt")));
  after(async () => {
    await syncEventToCalendars(event.id);
    const booker = group.find((x) => x.isBooker) ?? group[0];
    await sendWithdrawn({ to: booker.email, name: booker.name, event });
    const settings = await getSettings();
    await sendAdminNotice(
      settings.contactEmail,
      `Afmelding: ${event.emoji} ${event.title}`,
      `<p>${group.map((x) => esc(x.name)).join(", ")} har meldt fra.</p>`,
      event.id,
    );
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

const interestSchema = z.object({
  productId: z.number().int(),
  name: z.string().trim().min(1, "Skriv dit navn").max(120),
  email: z.string().trim().toLowerCase().max(200).email("Skriv en gyldig e-mail"),
  note: z.string().trim().max(1000),
  website: z.string().max(0).optional(),
});

/** "Sig at du er interesseret" – får besked når der kommer en ny dato */
export async function registerInterest(input: z.infer<typeof interestSchema>): Promise<{ ok: boolean; error?: string }> {
  const parsed = interestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldige oplysninger" };
  const d = parsed.data;
  const product = await db.query.products.findFirst({
    where: and(eq(s.products.id, d.productId), eq(s.products.active, true), eq(s.products.isActivity, true)),
    columns: { id: true, name: true, emoji: true },
  });
  if (!product) return { ok: false, error: "Aktiviteten findes ikke" };
  await db
    .insert(s.activityInterests)
    .values({ productId: product.id, name: d.name, email: d.email, note: d.note })
    .onConflictDoUpdate({
      target: [s.activityInterests.productId, s.activityInterests.email],
      set: { name: d.name, note: d.note },
    });
  after(async () => {
    const settings = await getSettings();
    await sendAdminNotice(
      settings.contactEmail,
      `${d.name} er interesseret i ${product.emoji} ${product.name}`,
      `${d.note ? `<p>“${esc(d.note)}”</p>` : ""}<p>Planlæg en dato i admin under Kalender.</p>`,
    );
  });
  return { ok: true };
}
