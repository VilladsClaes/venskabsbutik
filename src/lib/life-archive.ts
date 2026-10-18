import type { InteractionKind, InteractionSource, RelationKind } from "@/db/schema";
import { BIRTH } from "./birthday";

/** Venne-arkivet: hvornår i Villads' liv folk har været der, og hvad vi har lavet sammen */

export const LIFESPAN = 100;

export const RELATION_INFO: Record<RelationKind, { label: string; emoji: string; color: string }> = {
  familie: { label: "Familie", emoji: "🏡", color: "#ffb703" },
  barndom: { label: "Barndom", emoji: "🧸", color: "#ff8fab" },
  skole: { label: "Folkeskole", emoji: "🎒", color: "#8ecae6" },
  gymnasium: { label: "Gymnasium", emoji: "🎓", color: "#4d96ff" },
  studie: { label: "Studie", emoji: "📚", color: "#a66cff" },
  kaerlighed: { label: "Kærlighed", emoji: "💘", color: "#ff6b6b" },
  arbejde: { label: "Arbejde", emoji: "💼", color: "#5c5f7a" },
  nabo: { label: "Nabo", emoji: "🏘️", color: "#06d6a0" },
  fritid: { label: "Fritid", emoji: "⚽", color: "#2a9d8f" },
  rejse: { label: "Rejse", emoji: "🧳", color: "#e76f51" },
  tilfaeldig: { label: "Tilfældigt møde", emoji: "🍀", color: "#90be6d" },
  andet: { label: "Andet", emoji: "✨", color: "#b8a1d9" },
};

export const INTERACTION_INFO: Record<InteractionKind, { label: string; emoji: string }> = {
  samtale: { label: "Samtale", emoji: "💬" },
  opkald: { label: "Opkald", emoji: "📞" },
  beskeder: { label: "Beskeder", emoji: "📱" },
  brev: { label: "Brev / kort", emoji: "✉️" },
  maaltid: { label: "Måltid", emoji: "🍝" },
  fest: { label: "Fest", emoji: "🎉" },
  rejse: { label: "Rejse", emoji: "🧳" },
  oplevelse: { label: "Oplevelse", emoji: "🎟️" },
  hjaelp: { label: "Hjælp", emoji: "🛠️" },
  svaer_tid: { label: "Svær tid", emoji: "🫂" },
  kaerlighed: { label: "Kærlighed", emoji: "💘" },
  konflikt: { label: "Konflikt", emoji: "⚡" },
  gensyn: { label: "Gensyn", emoji: "🔁" },
  milepael: { label: "Milepæl", emoji: "🏁" },
  andet: { label: "Andet", emoji: "✨" },
};

export const SOURCE_INFO: Record<InteractionSource, string> = {
  hukommelse: "Hukommelse",
  dagbog: "Dagbog",
  sms: "SMS",
  opkald: "Opkaldsliste",
  email: "E-mail",
  kalender: "Kalender",
  sociale_medier: "Sociale medier",
  foto: "Foto",
};

export const INTENSITY_LABELS = ["", "Sporadisk", "Af og til", "Jævnligt", "Tæt", "Hver dag"] as const;

const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;
const birth = () => Date.UTC(BIRTH.year, BIRTH.month - 1, BIRTH.day);

/** Villads' alder (med decimaler) på et givet tidspunkt */
export function villadsAge(at = new Date()) {
  return (at.getTime() - birth()) / YEAR_MS;
}

/** "2004", "2004-06" eller "2004-06-21" → Villads' alder. Upræcise datoer lægges midt i perioden */
export function ageAtDate(date: string): number | null {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(date.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const t = Date.UTC(Number(y), mo ? Number(mo) - 1 : 6, d ? Number(d) : mo ? 15 : 1);
  return (t - birth()) / YEAR_MS;
}

/** Hvilket år Villads havde en given alder */
export function yearAtAge(age: number) {
  return BIRTH.year + Math.floor(age + (BIRTH.month - 1) / 12);
}

const MONTHS = ["jan.", "feb.", "mar.", "apr.", "maj", "jun.", "jul.", "aug.", "sep.", "okt.", "nov.", "dec."];

export function formatFuzzyDate(date: string) {
  const [y, mo, d] = date.split("-");
  if (!mo) return y;
  if (!d) return `${MONTHS[Number(mo) - 1]} ${y}`;
  return `${Number(d)}. ${MONTHS[Number(mo) - 1]} ${y}`;
}

export function isFuzzyDate(date: string) {
  return ageAtDate(date) !== null;
}

export type Period = { fromAge: number; toAge: number | null; intensity: number; label: string };

/** Højeste intensitet personen har i hvert leveår 0–99 (0 = ikke aktiv) */
export function intensityByYear(periods: Period[], nowAge = villadsAge()) {
  const years = new Array<number>(LIFESPAN).fill(0);
  for (const p of periods) {
    const to = p.toAge ?? nowAge;
    for (let y = Math.max(0, Math.floor(p.fromAge)); y < Math.min(LIFESPAN, Math.ceil(to)); y++) {
      years[y] = Math.max(years[y], p.intensity);
    }
  }
  return years;
}

/** Kort opsummering: "17–25 år" eller "fra 33 år" */
export function activeSpan(periods: Period[]) {
  if (periods.length === 0) return null;
  const from = Math.min(...periods.map((p) => p.fromAge));
  const ongoing = periods.some((p) => p.toAge === null);
  const to = Math.max(...periods.map((p) => p.toAge ?? 0));
  return ongoing ? `fra ${Math.floor(from)} år` : `${Math.floor(from)}–${Math.ceil(to)} år`;
}
