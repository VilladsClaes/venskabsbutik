import { INTENSITY_LABELS, intensityByYear, LIFESPAN, yearAtAge, type Period } from "@/lib/life-archive";

type Moment = { age: number; emoji: string; title: string };

/**
 * Villads' liv fra 0 til 100 år som en strimmel. Søjlehøjden viser hvor tæt personen var på hvert år,
 * prikkerne er enkelte interaktioner, og fremtiden (efter i dag) står skraveret og venter.
 */
export function LifeTimeline({
  periods,
  moments = [],
  color,
  nowAge,
  compact = false,
  label,
}: {
  periods: Period[];
  moments?: Moment[];
  color: string;
  nowAge: number;
  compact?: boolean;
  label: string;
}) {
  const years = intensityByYear(periods, nowAge);
  const W = 1000;
  const H = compact ? 28 : 120;
  const top = compact ? 2 : 10;
  const bars = H - top;
  const x = (age: number) => (Math.max(0, Math.min(LIFESPAN, age)) / LIFESPAN) * W;
  const pid = `future-${compact ? "c" : "f"}`;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={compact ? "block h-7 w-full" : "block h-auto w-full"}
        preserveAspectRatio={compact ? "none" : undefined}
        role="img"
        aria-label={label}
      >
        <defs>
          <pattern id={pid} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#2b2d42" strokeOpacity="0.12" strokeWidth="3" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="#fff" />
        <rect x={x(nowAge)} y={0} width={W - x(nowAge)} height={H} fill={`url(#${pid})`} />
        {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((a) => (
          <line key={a} x1={x(a)} x2={x(a)} y1={0} y2={H} stroke="#2b2d42" strokeOpacity="0.1" />
        ))}
        {years.map((v, age) =>
          v ? (
            <rect
              key={age}
              x={x(age) + 0.5}
              y={H - (bars * v) / 5}
              width={W / LIFESPAN - 1}
              height={(bars * v) / 5}
              fill={color}
              fillOpacity={0.35 + v * 0.13}
            >
              <title>{`${age} år (${yearAtAge(age)}): ${INTENSITY_LABELS[v]}`}</title>
            </rect>
          ) : null,
        )}
        {!compact &&
          moments.map((m, i) => (
            <g key={i}>
              <circle cx={x(m.age)} cy={H - 6} r={4} fill="#2b2d42" stroke="#fff" strokeWidth={1.5} />
              <title>{`${m.emoji} ${m.title} (${Math.floor(m.age)} år)`}</title>
            </g>
          ))}
        <line x1={x(nowAge)} x2={x(nowAge)} y1={0} y2={H} stroke="#ff6b6b" strokeWidth={compact ? 2 : 3} />
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="#2b2d42" strokeWidth={compact ? 2 : 3} />
      </svg>
      {!compact && (
        <div className="relative h-5 text-xs font-bold text-ink-soft" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => i * 10).map((a) => (
            <span
              key={a}
              className={`absolute top-0.5 ${a % 20 ? "hidden sm:block" : ""}`}
              style={{ left: `${a}%`, transform: `translateX(${a === 0 ? 0 : a === 100 ? -100 : -50}%)` }}
            >
              {a}
            </span>
          ))}
        </div>
      )}
      {!compact && (
        <figcaption className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-ink-soft">
          <span>Min alder i år · søjlehøjde = hvor tæt vi var · prikker = øjeblikke</span>
          <span>
            <span className="inline-block h-2 w-3 bg-coral align-middle" /> i dag ({Math.floor(nowAge)} år) · skraveret = det,
            der endnu ikke er levet
          </span>
        </figcaption>
      )}
    </figure>
  );
}
