/** "4 af 6 tilmeldt – 2 mangler før vi kører 🎯" med bjælke og fornavne */
export function EventProgress({
  status,
  seatsTaken,
  minParticipants,
  capacity,
  participants,
  compact = false,
}: {
  status: "samler" | "gennemfoeres" | "aflyst";
  seatsTaken: number;
  minParticipants: number;
  capacity: number | null;
  participants?: (string | null)[];
  compact?: boolean;
}) {
  const missing = Math.max(0, minParticipants - seatsTaken);
  const goal = status === "samler" ? minParticipants : (capacity ?? Math.max(minParticipants, seatsTaken));
  const pct = goal ? Math.min(100, Math.round((seatsTaken / goal) * 100)) : 100;
  const named = (participants ?? []).filter((n): n is string => !!n);
  const anonymous = (participants ?? []).length - named.length;

  const headline =
    status === "aflyst"
      ? "Aflyst"
      : status === "gennemfoeres"
        ? `Det bliver til noget! ${seatsTaken} kommer${capacity != null ? ` · ${Math.max(0, capacity - seatsTaken)} pladser tilbage` : ""} ✅`
        : seatsTaken === 0
          ? `Bliv den første! Vi skal være mindst ${minParticipants} 🎯`
          : `${seatsTaken} af ${minParticipants} tilmeldt – ${missing} mangler før vi kører 🎯`;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <p className={`font-display font-bold ${compact ? "text-sm" : "text-lg"}`}>{headline}</p>
      {status !== "aflyst" && (
        <div
          className={`overflow-hidden rounded-full border-2 border-ink bg-white ${compact ? "h-3" : "h-5"}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={seatsTaken}
          aria-label={headline}
        >
          <div className={`h-full ${status === "gennemfoeres" ? "bg-mint" : "bg-coral"} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {!compact && named.length + anonymous > 0 && (
        <p className="text-sm">
          <span className="font-bold">Med:</span> {named.join(", ")}
          {anonymous > 0 && `${named.length ? " + " : ""}${anonymous} ${anonymous === 1 ? "anonym" : "anonyme"}`}
        </p>
      )}
    </div>
  );
}
