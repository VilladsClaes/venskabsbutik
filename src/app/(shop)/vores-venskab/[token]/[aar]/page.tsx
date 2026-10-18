import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { RisingEmojis } from "@/components/sky";
import { db, schema as s } from "@/db";
import { isAdmin } from "@/lib/auth";
import { getInsight } from "@/lib/insight";
import { formatFuzzyDate, INTERACTION_INFO, RELATION_INFO } from "@/lib/life-archive";
import { MONTH_LETTERS, yearSummary } from "@/lib/wrapped";

export const metadata: Metadata = {
  title: "Vores år",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function WrappedPage({ params }: PageProps<"/vores-venskab/[token]/[aar]">) {
  const { token, aar } = await params;
  const year = Number(aar);
  if (!/^\d{4}$/.test(aar)) notFound();
  const [c, letter, admin] = await Promise.all([
    getInsight(token),
    db.query.yearLetters.findFirst({ where: eq(s.yearLetters.year, year) }),
    isAdmin(),
  ]);
  // Vennerne ser først året, når brevet er udgivet. Villads kan se det på forhånd
  if (!c || (!letter?.published && !admin)) notFound();

  const sm = yearSummary(year, c.interactions, c.periods);
  if (sm.moments.length === 0) notFound();
  const note = c.yearNotes.find((n) => n.year === year)?.body.trim();
  const rel = c.relation ? RELATION_INFO[c.relation] : RELATION_INFO.andet;
  const firstName = (c.nickname || c.name).split(" ")[0];
  const top = sm.kinds[0];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#ffe5ec] via-cream to-sky/60">
      <RisingEmojis count={10} emojis={[rel.emoji, ...sm.kinds.map((k) => k.emoji), "✨"]} />
      <div className="relative z-10 mx-auto max-w-3xl space-y-8 px-4 py-12">
        {!letter?.published && (
          <p className="rounded-xl border-2 border-dashed border-ink bg-white p-3 text-center text-sm font-semibold">
            👀 Forhåndsvisning: {year} er ikke udgivet endnu, så kun du kan se siden.
          </p>
        )}

        <header className="space-y-3 text-center">
          <p className="font-display text-7xl font-bold sm:text-8xl">{year}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Vores år, {firstName}</h1>
          {sm.nthYear && sm.nthYear > 1 && (
            <p className="text-lg text-ink-soft">Vores {sm.nthYear}. år sammen i mit liv</p>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat big={String(sm.moments.length)} small={sm.moments.length === 1 ? "øjeblik" : "øjeblikke"} />
          {top && <Stat big={top.emoji} small={`mest ${top.label.toLowerCase()} (${top.n})`} />}
          <Stat
            big={sm.activeMonths ? `${sm.activeMonths}/12` : "💛"}
            small={sm.activeMonths ? "måneder med dig" : sm.closenessLabel ? sm.closenessLabel.toLowerCase() : "hele året"}
          />
        </section>

        {sm.activeMonths > 0 && (
          <div className="card flex gap-1 p-3" aria-label="Måneder vi sås">
            {sm.months.map((on, i) => (
              <span
                key={i}
                className={`grid h-10 flex-1 place-items-center rounded-lg font-display font-bold ${on ? "bg-sun" : "bg-ink/5 text-ink/30"}`}
              >
                {MONTH_LETTERS[i]}
              </span>
            ))}
          </div>
        )}

        {sm.highlight && (
          <blockquote className="card rotate-[-1deg] space-y-1 bg-white p-6 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">Årets øjeblik</p>
            <p className="font-display text-2xl font-bold">
              {INTERACTION_INFO[sm.highlight.kind].emoji} {sm.highlight.title}
            </p>
            {sm.highlight.body && <p className="text-lg">“{sm.highlight.body}”</p>}
          </blockquote>
        )}

        {note && (
          <section className="card space-y-2 bg-sun/40 p-6">
            <h2 className="text-xl font-bold">Til dig</h2>
            <p className="whitespace-pre-line text-lg">{note}</p>
          </section>
        )}

        <section className="card space-y-3 p-6">
          <h2 className="text-xl font-bold">Det vi nåede</h2>
          <ol className="space-y-2">
            {sm.moments.map((m, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-xl" aria-hidden="true">
                  {INTERACTION_INFO[m.kind].emoji}
                </span>
                <span>
                  <span className="text-sm text-ink-soft">{formatFuzzyDate(m.date)}</span>
                  <span className="block font-semibold">{m.title}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {letter && (letter.title || letter.body) && (
          <section className="card space-y-3 p-6">
            <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">Årets gang fra Villads</p>
            {letter.title && <h2 className="text-2xl font-bold">{letter.title}</h2>}
            <p className="whitespace-pre-line text-lg leading-relaxed">{letter.body}</p>
          </section>
        )}

        <p className="text-center text-sm">
          <Link href={`/vores-venskab/${token}`} className="font-semibold underline">
            Se hele vores venskab og dine data →
          </Link>
        </p>
      </div>
    </div>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="card p-5 text-center">
      <p className="font-display text-5xl font-bold">{big}</p>
      <p className="mt-1 font-semibold text-ink-soft">{small}</p>
    </div>
  );
}
