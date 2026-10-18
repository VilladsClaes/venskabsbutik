import Link from "next/link";
import { eq, inArray, sql } from "drizzle-orm";
import { createMissingInsightLinks, saveYearLetter, saveYearNote } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { CopyButton } from "@/components/copy-button";
import { db, schema as s } from "@/db";
import { RELATION_INFO } from "@/lib/life-archive";
import { SITE_URL } from "@/lib/site";
import { MONTH_LETTERS, yearSummary } from "@/lib/wrapped";

export const metadata = { title: "Årets gang" };

export default async function YearPage({ searchParams }: PageProps<"/admin/aarets-gang">) {
  const { aar } = await searchParams;
  const years = (
    await db
      .selectDistinct({ y: sql<number>`cast(substr(${s.interactions.date}, 1, 4) as integer)` })
      .from(s.interactions)
  )
    .map((r) => Number(r.y))
    .sort((a, b) => b - a);
  const thisYear = new Date().getFullYear();
  const year = Number(aar) || (years.includes(thisYear) ? thisYear : (years[0] ?? thisYear));

  const letter = await db.query.yearLetters.findFirst({ where: eq(s.yearLetters.year, year) });
  const ids = (
    await db
      .selectDistinct({ id: s.interactions.customerId })
      .from(s.interactions)
      .where(sql`substr(${s.interactions.date}, 1, 4) = ${String(year)}`)
  ).map((r) => r.id);
  const people = (
    await db.query.customers.findMany({
      where: inArray(s.customers.id, ids.length ? ids : [-1]),
      with: { interactions: true, periods: true, yearNotes: { where: eq(s.yearNotes.year, year) } },
    })
  )
    .map((c) => ({ ...c, summary: yearSummary(year, c.interactions, c.periods) }))
    .sort((a, b) => b.summary.moments.length - a.summary.moments.length || a.name.localeCompare(b.name, "da"));
  const missingLinks = people.filter((p) => !p.insightToken).map((p) => p.id);
  const totalMoments = people.reduce((n, p) => n + p.summary.moments.length, 0);

  return (
    <div className="space-y-6">
      <AdminTitle sub={`${people.length} venner med ${totalMoments} øjeblikke i ${year} · som et julebrev, bare personligt`}>
        Årets gang {year} 💌
      </AdminTitle>

      <nav className="flex flex-wrap gap-2" aria-label="Vælg år">
        {[...new Set([thisYear, ...years])].sort((a, b) => b - a).map((y) => (
          <Link
            key={y}
            href={`/admin/aarets-gang?aar=${y}`}
            className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold ${y === year ? "bg-ink text-white" : "bg-white"}`}
          >
            {y}
          </Link>
        ))}
      </nav>

      <form action={saveYearLetter.bind(null, year)} className="card space-y-3 p-5">
        <h2 className="text-xl font-bold">Brevet til alle</h2>
        <p className="text-sm text-ink-soft">
          Det fælles “årets gang”: hvad der er sket i dit liv i {year}. Alle årets venner ser det øverst i deres wrapped.
        </p>
        <input
          name="title"
          defaultValue={letter?.title ?? ""}
          className="input"
          placeholder={`Fx “${year}: året jeg blev 40”`}
          aria-label="Overskrift"
        />
        <textarea
          name="body"
          defaultValue={letter?.body ?? ""}
          className="input min-h-48"
          placeholder="Kære ven …"
          aria-label="Brevet"
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={letter?.published} className="h-4 w-4 accent-coral" />
          Udgivet: vennerne kan se {year} på deres link
        </label>
        <button className="btn btn-sun">Gem brevet</button>
      </form>

      {missingLinks.length > 0 && (
        <form
          action={createMissingInsightLinks.bind(null, missingLinks)}
          className="card flex flex-wrap items-center justify-between gap-3 bg-cream p-5"
        >
          <p>
            <b>{missingLinks.length}</b> af årets venner har intet personligt link endnu.
          </p>
          <button className="btn btn-sun">Opret links til dem</button>
        </form>
      )}

      <ul className="grid gap-4 lg:grid-cols-2">
        {people.map((p) => {
          const rel = p.relation ? RELATION_INFO[p.relation] : RELATION_INFO.andet;
          const url = p.insightToken ? `${SITE_URL}/vores-venskab/${p.insightToken}/${year}` : null;
          const sm = p.summary;
          return (
            <li key={p.id} className="card space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/kunder/${p.id}`} className="text-lg font-bold underline">
                    {rel.emoji} {p.name}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    {sm.moments.length} øjeblikke
                    {sm.nthYear && sm.nthYear > 0 ? ` · vores ${sm.nthYear}. år` : ""}
                    {sm.closenessLabel ? ` · ${sm.closenessLabel.toLowerCase()}` : ""}
                  </p>
                </div>
                <p className="text-xl" title={sm.kinds.map((k) => `${k.n} × ${k.label}`).join(", ")}>
                  {sm.kinds.map((k) => k.emoji).join("")}
                </p>
              </div>
              <div className="flex gap-1" aria-label="Måneder med øjeblikke">
                {sm.months.map((on, i) => (
                  <span
                    key={i}
                    className={`grid h-6 flex-1 place-items-center rounded text-xs font-bold ${on ? "bg-sun" : "bg-ink/5 text-ink/30"}`}
                  >
                    {MONTH_LETTERS[i]}
                  </span>
                ))}
              </div>
              <form action={saveYearNote.bind(null, p.id, year)} className="space-y-2">
                <textarea
                  name="body"
                  defaultValue={p.yearNotes[0]?.body ?? ""}
                  className="input min-h-20"
                  placeholder={`Personlig hilsen til ${p.name.split(" ")[0]} …`}
                  aria-label={`Personlig hilsen til ${p.name}`}
                />
                <button className="btn btn-white !py-1 text-sm">Gem hilsen</button>
              </form>
              {url ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a href={url} target="_blank" className="text-sm font-semibold underline">
                    Se {p.name.split(" ")[0]}s {year} ↗
                  </a>
                  <CopyButton value={url} label="Kopiér link" />
                  {p.email && (
                    <a
                      className="btn btn-white !px-3 !py-1 text-sm"
                      href={`mailto:${p.email}?subject=${encodeURIComponent(`Vores ${year}`)}&body=${encodeURIComponent(`Kære ${p.name.split(" ")[0]}\n\nHer er vores år sammen:\n${url}\n\nKærlig hilsen\nVillads`)}`}
                    >
                      ✉️ Skriv mail
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">Intet link endnu</p>
              )}
            </li>
          );
        })}
      </ul>
      {people.length === 0 && <p className="text-ink-soft">Ingen øjeblikke i {year} endnu.</p>}
    </div>
  );
}
