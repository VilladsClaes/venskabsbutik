/** Dagens dato i Danmark som "YYYY-MM-DD" */
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Copenhagen" }).format(now);
}

/** Vælger deterministisk "Dagens venskab" – det samme for alle besøgende hele dagen */
export function pickDaily<T extends { id: number }>(items: T[], key = todayKey()): T | undefined {
  if (!items.length) return undefined;
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const sorted = [...items].sort((a, b) => a.id - b.id);
  return sorted[Math.abs(h) % sorted.length];
}

/** Bonussen der følger med, når man køber Dagens venskab */
export const DAILY_BONUS_SLUG = "taenk-paa-dig";
