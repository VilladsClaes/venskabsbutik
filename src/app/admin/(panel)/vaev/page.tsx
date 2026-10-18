import Link from "next/link";
import { AdminTitle } from "@/components/admin-ui";
import { LifeTimeline } from "@/components/life-timeline";
import { db } from "@/db";
import { RELATION_KINDS, type RelationKind } from "@/db/schema";
import { activeSpan, intensityByYear, LIFESPAN, RELATION_INFO, villadsAge, yearAtAge } from "@/lib/life-archive";

export const metadata = { title: "Livets væv" };

export default async function WeavePage({ searchParams }: PageProps<"/admin/vaev">) {
  const { relation } = await searchParams;
  const filter = RELATION_KINDS.includes(relation as RelationKind) ? (relation as RelationKind) : null;
  const nowAge = villadsAge();

  const people = (await db.query.customers.findMany({ with: { periods: true } }))
    .filter((c) => c.periods.length > 0)
    .map((c) => ({ ...c, start: Math.min(...c.periods.map((p) => p.fromAge)) }))
    .sort((a, b) => a.start - b.start || a.name.localeCompare(b.name, "da"));
  const shown = filter ? people.filter((p) => p.relation === filter) : people;
  const used = RELATION_KINDS.filter((r) => people.some((p) => p.relation === r));

  // Hvor mange mennesker var omkring mig hvert år – og hvor tæt
  const crowd = new Array<number>(LIFESPAN).fill(0);
  const warmth = new Array<number>(LIFESPAN).fill(0);
  for (const p of shown) {
    intensityByYear(p.periods, nowAge).forEach((v, age) => {
      if (v) {
        crowd[age]++;
        warmth[age] += v;
      }
    });
  }
  const maxWarmth = Math.max(1, ...warmth);
  const busiest = crowd.indexOf(Math.max(...crowd));

  return (
    <div className="space-y-6">
      <AdminTitle
        sub={`${shown.length} mennesker vævet ind i mit liv${busiest >= 0 && crowd[busiest] ? ` · flest omkring mig som ${busiest}-årig (${crowd[busiest]} på én gang)` : ""}`}
      >
        Livets væv 🧶
      </AdminTitle>

      <nav className="flex flex-wrap gap-2" aria-label="Filtrér relation">
        <Chip href="/admin/vaev" active={!filter}>
          Alle
        </Chip>
        {used.map((r) => (
          <Chip key={r} href={`/admin/vaev?relation=${r}`} active={filter === r} color={RELATION_INFO[r].color}>
            {RELATION_INFO[r].emoji} {RELATION_INFO[r].label}
          </Chip>
        ))}
      </nav>

      <section className="card space-y-2 p-5">
        <h2 className="text-xl font-bold">Hvor varmt var der omkring mig?</h2>
        <svg viewBox="0 0 1000 120" className="block h-auto w-full" role="img" aria-label="Antal mennesker og nærhed pr. leveår">
          <rect x={0} y={0} width={1000} height={120} fill="#fff" />
          {warmth.map((w, age) =>
            w ? (
              <rect key={age} x={age * 10 + 0.5} y={120 - (110 * w) / maxWarmth} width={9} height={(110 * w) / maxWarmth} fill="#ffb703">
                <title>{`${age} år (${yearAtAge(age)}): ${crowd[age]} mennesker`}</title>
              </rect>
            ) : null,
          )}
          <line x1={nowAge * 10} x2={nowAge * 10} y1={0} y2={120} stroke="#ff6b6b" strokeWidth={3} />
          <rect x={0} y={0} width={1000} height={120} fill="none" stroke="#2b2d42" strokeWidth={3} />
        </svg>
        <Decades />
      </section>

      <section className="card p-5">
        {shown.length === 0 ? (
          <p className="text-ink-soft">
            Ingen perioder endnu. Tilføj perioder på{" "}
            <Link href="/admin/kunder" className="underline">
              kundesiderne
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-1.5">
            <li className="grid grid-cols-[8rem_1fr] gap-3 sm:grid-cols-[12rem_1fr]" aria-hidden="true">
              <span />
              <Decades />
            </li>
            {shown.map((p) => {
              const rel = p.relation ? RELATION_INFO[p.relation] : RELATION_INFO.andet;
              return (
                <li key={p.id} className="grid grid-cols-[8rem_1fr] items-center gap-3 sm:grid-cols-[12rem_1fr]">
                  <Link href={`/admin/kunder/${p.id}`} className="truncate text-sm font-bold underline" title={p.name}>
                    {rel.emoji} {p.name}
                  </Link>
                  <LifeTimeline
                    periods={p.periods}
                    color={rel.color}
                    nowAge={nowAge}
                    compact
                    label={`${p.name}: ${activeSpan(p.periods)}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Decades() {
  return (
    <div className="relative h-5 text-xs font-bold text-ink-soft">
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
  );
}

function Chip({ href, active, color, children }: { href: string; active: boolean; color?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold ${active ? "bg-ink text-white" : "bg-white"}`}
      style={!active && color ? { boxShadow: `inset 0 -4px 0 ${color}` } : undefined}
    >
      {children}
    </Link>
  );
}
