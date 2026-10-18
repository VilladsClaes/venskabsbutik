import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import {
  addInteraction,
  addPeriod,
  createInsightLink,
  deleteArchivePerson,
  deleteInteraction,
  deletePeriod,
  revokeInsightLink,
  saveCustomer,
} from "@/app/admin/actions";
import { CopyButton } from "@/components/copy-button";
import { AdminTitle, formatDate, OrderTable } from "@/components/admin-ui";
import { LifeTimeline } from "@/components/life-timeline";
import { db, schema as s } from "@/db";
import { INTERACTION_KINDS, INTERACTION_SOURCES, RELATION_KINDS } from "@/db/schema";
import {
  activeSpan,
  ageAtDate,
  formatFuzzyDate,
  INTENSITY_LABELS,
  INTERACTION_INFO,
  RELATION_INFO,
  SOURCE_INFO,
  villadsAge,
  yearAtAge,
} from "@/lib/life-archive";
import { SITE_URL } from "@/lib/site";

export default async function CustomerDetail({ params }: PageProps<"/admin/kunder/[id]">) {
  const { id } = await params;
  const c = await db.query.customers.findFirst({
    where: eq(s.customers.id, Number(id)),
    with: {
      orders: { orderBy: desc(s.orders.createdAt) },
      periods: { orderBy: asc(s.friendPeriods.fromAge) },
      interactions: { orderBy: desc(s.interactions.date) },
    },
  });
  if (!c) notFound();
  const orders = c.orders.map((o) => ({ ...o, customer: { name: c.name } }));
  const nowAge = villadsAge();
  const rel = c.relation ? RELATION_INFO[c.relation] : RELATION_INFO.andet;
  const span = activeSpan(c.periods);
  const moments = c.interactions.flatMap((i) => {
    const age = ageAtDate(i.date);
    return age === null ? [] : [{ age, emoji: INTERACTION_INFO[i.kind].emoji, title: i.title }];
  });
  const fields = [
    ["name", "Navn", c.name],
    ["email", "E-mail", c.email ?? ""],
    ["phone", "Telefon", c.phone ?? ""],
    ["nickname", "Dæknavn", c.nickname ?? ""],
  ] as const;

  return (
    <div className="space-y-6">
      <Link href={c.origin === "arkiv" ? "/admin/kunder?vis=arkiv" : "/admin/kunder"} className="font-semibold underline">
        ← Alle kunder
      </Link>
      <AdminTitle
        sub={
          <>
            {rel.emoji} {c.relation ? rel.label : "Ingen relation valgt"}
            {span && <> · aktiv {span}</>}
            {" · "}
            {c.origin === "arkiv" ? "fra venne-arkivet" : `kunde siden ${formatDate(c.createdAt, false)}`}
            {c.isSample && " · 🧪 opdigtet testperson"}
          </>
        }
      >
        {c.name}
      </AdminTitle>

      <section className="card space-y-3 p-5">
        <h2 className="text-xl font-bold">Vores tid sammen i mit liv</h2>
        <LifeTimeline
          periods={c.periods}
          moments={moments}
          color={rel.color}
          nowAge={nowAge}
          label={`Tidslinje over ${c.name} i Villads' liv fra 0 til 100 år`}
        />
        {c.periods.length === 0 && (
          <p className="text-ink-soft">Ingen perioder endnu. Tilføj en nedenfor, så lyser tidslinjen op.</p>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 bg-cream p-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-bold">🔑 Indsigtslink</h2>
          <p className="text-sm text-ink-soft">
            Alt på denne side, også noter og “hvad jeg ved om dem”, kan {c.name.split(" ")[0]} se og downloade via linket.
            Skriv kun det, du kan stå inde for.
          </p>
          {c.insightToken && (
            <p className="break-all text-sm">
              <a href={`/vores-venskab/${c.insightToken}`} target="_blank" className="font-semibold underline">
                {SITE_URL}/vores-venskab/{c.insightToken}
              </a>
              <span className="block text-ink-soft">
                Oprettet {formatDate(c.insightCreatedAt)} ·{" "}
                {c.insightViewedAt ? `sidst åbnet ${formatDate(c.insightViewedAt)}` : "ikke åbnet endnu"}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {c.insightToken && <CopyButton value={`${SITE_URL}/vores-venskab/${c.insightToken}`} label="Kopiér link" />}
          <form action={createInsightLink.bind(null, c.id)}>
            <button className="btn btn-sun">{c.insightToken ? "Nyt link" : "Opret link"}</button>
          </form>
          {c.insightToken && (
            <form action={revokeInsightLink.bind(null, c.id)}>
              <button className="btn btn-white">Luk link</button>
            </form>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <form action={saveCustomer.bind(null, c.id)} className="card space-y-3 p-5">
            <h2 className="text-xl font-bold">Oplysninger</h2>
            {fields.map(([name, label, value]) => (
              <label key={name} className="block text-sm font-bold">
                {label}
                <input name={name} defaultValue={value} className="input mt-1" />
              </label>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                Relation
                <select name="relation" defaultValue={c.relation ?? ""} className="input mt-1">
                  <option value="">–</option>
                  {RELATION_KINDS.map((r) => (
                    <option key={r} value={r}>
                      {RELATION_INFO[r].emoji} {RELATION_INFO[r].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Fødselsår
                <input
                  name="birthYear"
                  inputMode="numeric"
                  defaultValue={c.birthYear ?? ""}
                  className="input mt-1"
                />
              </label>
            </div>
            <label className="block text-sm font-bold">
              Sådan mødtes vi
              <textarea name="howWeMet" defaultValue={c.howWeMet} className="input mt-1 min-h-20" />
            </label>
            <label className="block text-sm font-bold">
              Hvad jeg ved om dem
              <textarea name="aboutThem" defaultValue={c.aboutThem} className="input mt-1 min-h-28" />
            </label>
            <label className="block text-sm font-bold">
              Det vi har sammen
              <span className="block font-normal text-ink-soft">Steder, indforståede jokes, fælles venner, traditioner</span>
              <textarea name="together" defaultValue={c.together} className="input mt-1 min-h-28" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name="allowMention"
                defaultChecked={c.allowMention}
                className="h-4 w-4 accent-coral"
              />
              Må nævnes med fornavn/dæknavn
            </label>
            <label className="block text-sm font-bold">
              Noter
              <textarea name="notes" defaultValue={c.notes} className="input mt-1 min-h-20" />
            </label>
            <button className="btn btn-sun">Gem</button>
          </form>

          <section className="card space-y-4 p-5">
            <h2 className="text-xl font-bold">Perioder ({c.periods.length})</h2>
            <ul className="space-y-2">
              {c.periods.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 rounded-xl border-2 border-ink/15 p-3">
                  <div>
                    <p className="font-bold">
                      {fmtAge(p.fromAge)}–{p.toAge === null ? "nu" : fmtAge(p.toAge)} år
                      <span className="font-normal text-ink-soft">
                        {" "}
                        ({yearAtAge(p.fromAge)}–{p.toAge === null ? "" : yearAtAge(p.toAge)})
                      </span>
                    </p>
                    <p className="text-sm">
                      {"●".repeat(p.intensity)}
                      <span className="text-ink/20">{"●".repeat(5 - p.intensity)}</span> {INTENSITY_LABELS[p.intensity]}
                      {p.label && <> · {p.label}</>}
                    </p>
                  </div>
                  <form action={deletePeriod.bind(null, p.id)}>
                    <button className="text-sm font-semibold text-coral underline" aria-label="Slet periode">
                      Slet
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={addPeriod.bind(null, c.id)} className="space-y-3 rounded-xl bg-cream p-3">
              <p className="text-sm font-bold">Ny periode (min alder)</p>
              <div className="grid grid-cols-3 gap-2">
                <label className="block text-sm font-bold">
                  Fra
                  <input name="fromAge" inputMode="decimal" required className="input mt-1" placeholder="17" />
                </label>
                <label className="block text-sm font-bold">
                  Til
                  <input name="toAge" inputMode="decimal" className="input mt-1" placeholder="tom = nu" />
                </label>
                <label className="block text-sm font-bold">
                  Hvor tæt
                  <select name="intensity" defaultValue="3" className="input mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} – {INTENSITY_LABELS[n]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <input name="label" className="input" placeholder="Fx “2.g og fredagsbarer”" />
              <button className="btn btn-sun">Tilføj periode</button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-xl font-bold">Øjeblikke ({c.interactions.length})</h2>
            <form action={addInteraction.bind(null, c.id)} className="space-y-3 rounded-xl bg-cream p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block text-sm font-bold">
                  Hvornår
                  <input name="date" required className="input mt-1" placeholder="2004, 2004-06 el. 2004-06-21" />
                </label>
                <label className="block text-sm font-bold">
                  Hvad
                  <select name="kind" className="input mt-1">
                    {INTERACTION_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {INTERACTION_INFO[k].emoji} {INTERACTION_INFO[k].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  Kilde
                  <select name="source" className="input mt-1">
                    {INTERACTION_SOURCES.map((k) => (
                      <option key={k} value={k}>
                        {SOURCE_INFO[k]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <input name="title" required className="input" placeholder="Overskrift, fx “Natten på Skagen Gren”" />
              <textarea name="body" className="input min-h-20" placeholder="Hvad skete der? Hvad betød det?" />
              <button className="btn btn-sun">Tilføj øjeblik</button>
            </form>
            {c.interactions.length === 0 ? (
              <p className="text-ink-soft">Ingen øjeblikke endnu.</p>
            ) : (
              <ol className="relative space-y-4 border-l-[3px] border-ink/15 pl-5">
                {c.interactions.map((i) => {
                  const age = ageAtDate(i.date);
                  return (
                    <li key={i.id} className="relative">
                      <span
                        className="absolute -left-[33px] top-0 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-white text-sm"
                        aria-hidden="true"
                      >
                        {INTERACTION_INFO[i.kind].emoji}
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-ink-soft">
                            {formatFuzzyDate(i.date)}
                            {age !== null && <> · jeg var {Math.floor(age)}</>} · {INTERACTION_INFO[i.kind].label} ·{" "}
                            {SOURCE_INFO[i.source]}
                          </p>
                          <p className="font-bold">{i.title}</p>
                          {i.body && <p className="mt-1 whitespace-pre-line text-sm">{i.body}</p>}
                        </div>
                        <form action={deleteInteraction.bind(null, i.id)}>
                          <button className="text-sm font-semibold text-coral underline" aria-label="Slet øjeblik">
                            Slet
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="card overflow-hidden">
            <h2 className="p-5 text-xl font-bold">Ordrer ({orders.length})</h2>
            <OrderTable orders={orders} />
          </section>

          {orders.length === 0 && (
            <details className="text-right text-sm">
              <summary className="cursor-pointer font-semibold text-ink-soft">Slet fra arkivet …</summary>
              <form action={deleteArchivePerson.bind(null, c.id)} className="mt-2">
                <button className="btn bg-coral text-white">
                  Ja, slet {c.name} med alle perioder og øjeblikke
                </button>
              </form>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtAge(n: number) {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("da-DK", { maximumFractionDigits: 1 });
}
