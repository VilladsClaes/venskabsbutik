import { formatKr } from "./money";
import { SITE_URL } from "./site";

// Tekster om et event, der bruges både i kalenderposten og i e-mails.
// Ingen database-import her, så filen kan bruges fra både lib/calendar og lib/events.

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

/** "onsdag 2. december kl. 12.00" */
export function formatMoment(d: Date) {
  return `${d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })} kl. ${d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}`;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export const eventPageUrl = (slug: string) => `${SITE_URL}/kalender/${slug}`;
export const productPageUrl = (slug: string) => `${SITE_URL}/tjenester/${slug}`;

/** Fristen for tilmelding: er minimum ikke nået her, aflyses eventet */
export const effectiveDeadline = (e: { signupDeadline: Date | null; startsAt: Date }) => e.signupDeadline ?? e.startsAt;

export type EventForText = {
  slug: string;
  title: string;
  emoji: string;
  summary: string;
  description: string;
  practicalInfo: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  price: number;
  minParticipants: number;
  capacity: number | null;
  signupDeadline: Date | null;
  status: "samler" | "gennemfoeres" | "aflyst";
  product?: { slug: string; name: string } | null;
};

/** Alt det praktiske i ren tekst – til kalenderposten (Outlook/Google) og .ics-filer */
export function eventPlainText(e: EventForText, seatsTaken: number) {
  const lines: string[] = [];
  if (e.status === "samler") {
    const missing = Math.max(0, e.minParticipants - seatsTaken);
    lines.push(
      `❔ MÅSKE – samler tilmeldte: ${seatsTaken} af mindst ${e.minParticipants}` +
        (missing ? ` (mangler ${missing})` : "") +
        `. Frist: ${formatMoment(effectiveDeadline(e))}.`,
      "",
    );
  }
  if (e.summary) lines.push(e.summary, "");
  lines.push(`🕒 ${formatEventTime(e.startsAt, e.endsAt)}`);
  if (e.location) lines.push(`📍 ${e.location}`);
  lines.push(`💰 ${e.price ? `${formatKr(e.price)} pr. person` : "Gratis"}`);
  lines.push(`👥 ${seatsTaken} tilmeldt${e.capacity != null ? ` af ${e.capacity} pladser` : ""}`);
  if (e.practicalInfo) lines.push("", "PRAKTISK", e.practicalInfo);
  if (e.description) lines.push("", e.description);
  lines.push("", `Tilmelding og deltagere: ${eventPageUrl(e.slug)}`);
  if (e.product) lines.push(`Om ${e.product.name}: ${productPageUrl(e.product.slug)}`);
  lines.push("", "Arrangeret af Villads via Venskabsbutikken 💛");
  return lines.join("\n");
}
