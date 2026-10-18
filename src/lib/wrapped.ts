import type { InteractionKind } from "@/db/schema";
import { BIRTH } from "./birthday";
import { INTENSITY_LABELS, INTERACTION_INFO, intensityByYear, type Period } from "./life-archive";

/** Venskab-wrapped: ét år med én person, som et "årets gang"-brev */

type Moment = { date: string; kind: InteractionKind; title: string; body: string };

export function yearOf(date: string) {
  return Number(date.slice(0, 4));
}

export function yearSummary(year: number, moments: Moment[], periods: Period[]) {
  const ofYear = moments.filter((m) => yearOf(m.date) === year).sort((a, b) => a.date.localeCompare(b.date));
  const counts = new Map<InteractionKind, number>();
  for (const m of ofYear) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
  const kinds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kind, n]) => ({ kind, n, ...INTERACTION_INFO[kind] }));

  const months = new Array<boolean>(12).fill(false);
  for (const m of ofYear) {
    const mo = Number(m.date.slice(5, 7));
    if (mo) months[mo - 1] = true;
  }

  // Hvor mange kalenderår har vi kendt hinanden – fra første periode eller første øjeblik
  const firstFromPeriods = periods.length ? BIRTH.year + Math.floor(Math.min(...periods.map((p) => p.fromAge))) : Infinity;
  const firstFromMoments = moments.length ? Math.min(...moments.map((m) => yearOf(m.date))) : Infinity;
  const first = Math.min(firstFromPeriods, firstFromMoments);
  const nthYear = Number.isFinite(first) ? year - first + 1 : null;

  const ageThatYear = year - BIRTH.year;
  const closeness = ageThatYear >= 0 && ageThatYear < 100 ? intensityByYear(periods)[ageThatYear] : 0;

  return {
    year,
    moments: ofYear,
    kinds,
    months,
    activeMonths: months.filter(Boolean).length,
    nthYear,
    closeness,
    closenessLabel: closeness ? INTENSITY_LABELS[closeness] : null,
    highlight: ofYear.find((m) => m.body.trim()) ?? ofYear.at(-1) ?? null,
  };
}

export const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
