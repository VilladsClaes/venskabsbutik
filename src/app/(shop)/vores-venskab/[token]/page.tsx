import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { LifeTimeline } from "@/components/life-timeline";
import { PrintButton } from "@/components/print-button";
import { db, schema as s } from "@/db";
import { getInsight } from "@/lib/insight";
import {
  activeSpan,
  ageAtDate,
  formatFuzzyDate,
  INTENSITY_LABELS,
  INTERACTION_INFO,
  RELATION_INFO,
  SOURCE_INFO,
  villadsAge,
} from "@/lib/life-archive";
import { formatKr } from "@/lib/money";
import { STATUS_INFO } from "@/lib/order-status";
import { getSettings } from "@/lib/queries";
import { yearOf } from "@/lib/wrapped";

export const metadata: Metadata = {
  title: "Vores venskab",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function OurFriendshipPage({ params }: PageProps<"/vores-venskab/[token]">) {
  const { token } = await params;
  const c = await getInsight(token);
  if (!c) notFound();
  after(() => db.update(s.customers).set({ insightViewedAt: new Date() }).where(eq(s.customers.id, c.id)));

  const [settings, letters] = await Promise.all([
    getSettings(),
    db.query.yearLetters.findMany({ where: eq(s.yearLetters.published, true), columns: { year: true } }),
  ]);
  const ourYears = [...new Set(c.interactions.map((i) => yearOf(i.date)))]
    .filter((y) => letters.some((l) => l.year === y))
    .sort((a, b) => b - a);
  const contact = settings.contactEmail ?? "villadsclaes@gmail.com";
  const nowAge = villadsAge();
  const rel = c.relation ? RELATION_INFO[c.relation] : RELATION_INFO.andet;
  const firstName = (c.nickname || c.name).split(" ")[0];
  const span = activeSpan(c.periods);
  const moments = c.interactions.flatMap((i) => {
    const age = ageAtDate(i.date);
    return age === null ? [] : [{ age, emoji: INTERACTION_INFO[i.kind].emoji, title: i.title }];
  });
  const text = (label: string, value: string) =>
    value.trim() ? (
      <div>
        <h3 className="font-bold">{label}</h3>
        <p className="mt-1 whitespace-pre-line">{value}</p>
      </div>
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <p className="text-5xl" aria-hidden="true">
          {rel.emoji}
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">Hej {firstName}, her er vores venskab</h1>
        <p className="text-lg text-ink-soft">
          Det her er alt, hvad jeg har skrevet ned om dig og os. Det er dit, og du må se det hele.
        </p>
      </header>

      {ourYears.length > 0 && (
        <nav className="flex flex-wrap justify-center gap-2" aria-label="Vores år">
          {ourYears.map((y) => (
            <a key={y} href={`/vores-venskab/${token}/${y}`} className="btn btn-sun">
              💌 Vores {y}
            </a>
          ))}
        </nav>
      )}

      <section className="card space-y-3 p-5">
        <h2 className="text-2xl font-bold">Dig i mit liv{span && <span className="text-ink-soft"> · {span}</span>}</h2>
        <LifeTimeline
          periods={c.periods}
          moments={moments}
          color={rel.color}
          nowAge={nowAge}
          label={`Tidslinje over ${firstName} i Villads' liv fra 0 til 100 år`}
        />
        {c.periods.length > 0 && (
          <ul className="space-y-1 text-sm">
            {c.periods.map((p, i) => (
              <li key={i}>
                Da jeg var {Math.floor(p.fromAge)}–{p.toAge === null ? "nu" : Math.ceil(p.toAge)}: {INTENSITY_LABELS[p.intensity].toLowerCase()}
                {p.label && <> · {p.label}</>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(c.howWeMet || c.together || c.aboutThem) && (
        <section className="card space-y-4 p-5">
          {text("Sådan mødtes vi", c.howWeMet)}
          {text("Det vi har sammen", c.together)}
          {text("Det jeg ved om dig", c.aboutThem)}
        </section>
      )}

      {c.interactions.length > 0 && (
        <section className="card space-y-4 p-5">
          <h2 className="text-2xl font-bold">Vores øjeblikke ({c.interactions.length})</h2>
          <ol className="space-y-3">
            {c.interactions.map((i, n) => (
              <li key={n} className="flex gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {INTERACTION_INFO[i.kind].emoji}
                </span>
                <div>
                  <p className="text-sm text-ink-soft">
                    {formatFuzzyDate(i.date)} · {INTERACTION_INFO[i.kind].label} · kilde: {SOURCE_INFO[i.source].toLowerCase()}
                  </p>
                  <p className="font-bold">{i.title}</p>
                  {i.body && <p className="whitespace-pre-line text-sm">{i.body}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {c.orders.length > 0 && (
        <section className="card space-y-3 p-5">
          <h2 className="text-2xl font-bold">Det du har købt i butikken</h2>
          <ul className="space-y-2">
            {c.orders.map((o) => (
              <li key={o.orderNumber} className="flex flex-wrap justify-between gap-2 border-b-2 border-ink/10 pb-2">
                <span>
                  <b>{o.orderNumber}</b> · {o.items.map((it) => it.productName).join(", ")}
                </span>
                <span>
                  {STATUS_INFO[o.status].emoji} {formatKr(o.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card space-y-4 bg-cream p-5">
        <h2 className="text-2xl font-bold">Dine oplysninger og dine rettigheder</h2>
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-bold">Navn</dt>
          <dd>{c.name}</dd>
          <dt className="font-bold">E-mail</dt>
          <dd>{c.email ?? "–"}</dd>
          <dt className="font-bold">Telefon</dt>
          <dd>{c.phone ?? "–"}</dd>
          <dt className="font-bold">Fødselsår</dt>
          <dd>{c.birthYear ?? "–"}</dd>
          <dt className="font-bold">Må nævnes</dt>
          <dd>{c.allowMention ? "Ja, med fornavn eller dæknavn" : "Nej"}</dd>
          {c.notes.trim() && (
            <>
              <dt className="font-bold">Mine noter</dt>
              <dd className="whitespace-pre-line">{c.notes}</dd>
            </>
          )}
        </dl>
        <p className="text-sm">
          Du har ret til at få rettet, hvad der er forkert, få slettet det hele eller sige nej til, at jeg gemmer det.
          Skriv til{" "}
          <a className="font-bold underline" href={`mailto:${contact}?subject=${encodeURIComponent("Vores venskab – mine data")}`}>
            {contact}
          </a>
          , så ordner jeg det inden for en måned. Du kan også klage til Datatilsynet.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={`/vores-venskab/${token}/data`} className="btn btn-sun">
            ⬇️ Download alle mine data (JSON)
          </a>
          <PrintButton />
        </div>
        <p className="text-xs text-ink-soft">
          Linket er personligt. Del det kun, hvis du vil have, at andre skal se det.
        </p>
      </section>
    </div>
  );
}
