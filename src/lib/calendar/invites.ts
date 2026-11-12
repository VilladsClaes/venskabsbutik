import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { InviteState } from "@/db/schema";
import { emailEnabled, esc, layout, sendInvite } from "../email";
import { eventPageUrl, eventPlainText, formatEventTime, productPageUrl } from "../event-text";
import { buildInvite } from "./ics";

/**
 * Villads' Outlook er en privat konto, som kun kan læses (via det publicerede ICS-link). Derfor
 * kommer eventet i hans Outlook som en rigtig mødeindkaldelse over e-mail:
 *
 * - samler tilmeldte → "måske"-indkaldelse kun til Villads (står som foreløbig i kalenderen)
 * - gennemføres → opdatering til Villads med alle deltagere som mødedeltagere, og en indkaldelse til
 *   hver deltager (som kun ser sig selv og Villads – deltagernes e-mails deles ikke med hinanden)
 * - aflyst → aflysning til alle
 *
 * Der sendes kun noget, når der faktisk er ændret noget (se InviteState).
 */
export const INVITE_EMAIL_SETTING = "outlookInviteEmail";

type EventWithSignups = typeof s.events.$inferSelect & {
  signups: (typeof s.eventSignups.$inferSelect)[];
  product: { slug: string; name: string } | null;
};

export async function getInviteEmail(): Promise<string | null> {
  const row = await db.query.settings.findFirst({ where: eq(s.settings.key, INVITE_EMAIL_SETTING) });
  return row?.value || null;
}

/** Returnerer true, hvis deltagerne har fået en kalenderinvitation */
export async function syncEventInvites(event: EventWithSignups): Promise<boolean> {
  const villads = await getInviteEmail();
  if (!villads || !emailEnabled()) return false;

  const prev: InviteState = event.inviteState ?? { status: "cancelled", attendees: [], hash: "" };
  const hadPost = !!event.inviteState && prev.status !== "cancelled";
  const tentative = event.status === "samler";
  const remove = !event.published || event.status === "aflyst";
  const active = event.signups.filter((x) => x.status !== "annulleret");
  const seatsTaken = active.reduce((n, x) => n + x.seats, 0);
  const people = new Map<string, string>();
  for (const x of event.signups) if (x.status === "bekraeftet") people.set(x.email.toLowerCase(), x.name);
  people.delete(villads.toLowerCase());
  const confirmed = [...people.keys()];

  // Ændringer i titel/tid/sted/praktisk giver en opdatering til alle – antallet af tilmeldte gør ikke
  const hash = createHash("sha256")
    .update([event.title, event.emoji, event.startsAt.toISOString(), event.endsAt.toISOString(), event.location, event.summary, event.practicalInfo, event.description].join("|"))
    .digest("base64url")
    .slice(0, 16);

  const base = {
    uid: `event-${event.id}-invite`,
    title: tentative ? `❔ Måske: ${event.emoji} ${event.title}` : `${event.emoji} ${event.title}`,
    description: eventPlainText(event, seatsTaken),
    location: event.location,
    start: event.startsAt,
    end: event.endsAt,
    url: event.product ? productPageUrl(event.product.slug) : eventPageUrl(event.slug),
    tentative,
  };
  const when = formatEventTime(event.startsAt, event.endsAt);
  const me = { email: villads, name: "Villads" };
  const html = (text: string) =>
    layout(esc(`${event.emoji} ${event.title}`), `<p>${esc(when)}${event.location ? `<br>📍 ${esc(event.location)}` : ""}</p><p>${text}</p><p><a href="${eventPageUrl(event.slug)}">Se eventet</a></p>`);

  let sequence = event.inviteSequence;
  let next: InviteState;

  if (remove) {
    if (!hadPost) return false;
    sequence++;
    const cancel = (attendees: { email: string; name: string }[]) => buildInvite({ ...base, sequence, method: "CANCEL", attendees });
    await sendInvite(villads, `Aflyst: ${event.emoji} ${event.title}`, html("Eventet er aflyst."), cancel([me, ...prev.attendees.map((e) => ({ email: e, name: e }))]), "CANCEL");
    for (const e of prev.attendees) {
      await sendInvite(e, `Aflyst: ${event.emoji} ${event.title}`, html(esc(event.cancelReason ?? "Eventet er aflyst.")), cancel([me, { email: e, name: e }]), "CANCEL");
    }
    next = { status: "cancelled", attendees: [], hash };
  } else if (tentative) {
    if (prev.status === "tentative" && prev.hash === hash) return false;
    sequence++;
    await sendInvite(
      villads,
      `❔ Måske: ${event.emoji} ${event.title}`,
      html(`Foreløbig post, så tiden er holdt fri. Den bliver til en rigtig aftale med alle deltagere, når mindst ${event.minParticipants} er tilmeldt – eller aflyst ved fristen.`),
      buildInvite({ ...base, sequence, method: "REQUEST", attendees: [me] }),
      "REQUEST",
    );
    next = { status: "tentative", attendees: [], hash };
  } else {
    const before = prev.status === "confirmed" ? prev.attendees : [];
    const added = confirmed.filter((e) => !before.includes(e));
    const removed = before.filter((e) => !people.has(e));
    const changed = prev.status !== "confirmed" || prev.hash !== hash;
    if (!changed && added.length === 0 && removed.length === 0) return confirmed.length > 0;
    sequence++;
    const all = confirmed.map((e) => ({ email: e, name: people.get(e)! }));
    await sendInvite(
      villads,
      `✅ ${event.emoji} ${event.title} – ${confirmed.length} deltagere`,
      html(`Eventet gennemføres. Deltagere: ${all.map((a) => esc(a.name)).join(", ")}.`),
      buildInvite({ ...base, sequence, method: "REQUEST", attendees: [me, ...all] }),
      "REQUEST",
    );
    for (const a of changed ? all : all.filter((x) => added.includes(x.email))) {
      await sendInvite(
        a.email,
        `📅 Invitation: ${event.emoji} ${event.title}`,
        html("Sig ja til invitationen, så ligger eventet i din kalender – og ændringer kommer automatisk med."),
        buildInvite({ ...base, sequence, method: "REQUEST", attendees: [me, a] }),
        "REQUEST",
      );
    }
    for (const e of removed) {
      await sendInvite(e, `Du er ikke længere med: ${event.emoji} ${event.title}`, html("Du er taget af deltagerlisten."), buildInvite({ ...base, sequence, method: "CANCEL", attendees: [{ email: e, name: e }] }), "CANCEL");
    }
    next = { status: "confirmed", attendees: confirmed, hash };
  }

  await db.update(s.events).set({ inviteSequence: sequence, inviteState: next }).where(eq(s.events.id, event.id));
  return next.status === "confirmed" && confirmed.length > 0;
}
