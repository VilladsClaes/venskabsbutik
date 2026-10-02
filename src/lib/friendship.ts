/** Venskabsniveauer – jo mere man har købt (betalt), jo tættere er man */
export const LEVELS = [
  { min: 0, name: "Bekendt", emoji: "👋", color: "#e0f0ff", text: "Vi har hilst på hinanden. Det er en start!" },
  { min: 2000, name: "Ven", emoji: "🙂", color: "#d8f3dc", text: "Vi er officielt venner. Jeg husker dit navn." },
  { min: 10000, name: "God ven", emoji: "😊", color: "#fff3b0", text: "Du må gerne komme uanmeldt forbi." },
  { min: 30000, name: "Bedste ven", emoji: "🤗", color: "#ffe5ec", text: "Du er på listen over folk, jeg ringer til, når der sker noget." },
  { min: 100000, name: "Sjæleven", emoji: "💛", color: "#ffd23f", text: "Vi er bundet for livet. Der er ingen vej tilbage." },
] as const;

export function friendshipLevel(paidOere: number) {
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (paidOere >= l.min) index = i;
  });
  const level = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next ? (paidOere - level.min) / (next.min - level.min) : 1;
  return { level, next, index, progress: Math.max(0, Math.min(1, progress)), missing: next ? next.min - paidOere : 0 };
}
