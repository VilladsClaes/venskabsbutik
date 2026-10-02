import type { Metadata } from "next";
import Image from "next/image";
import { BuyCta, ExperienceHero, formatDay, StatTile } from "@/components/experience-bits";
import { Reveal } from "@/components/reveal";
import { getPublicDeliveries, getSalesFor } from "@/lib/experiences";

export const metadata: Metadata = {
  title: "Lussing-hitlisten",
  description: "Rødme-skalaen og de mest dramatiske lussinger i Venskabsbutikkens historie.",
};

const REDNESS = ["Knap synlig", "Let rosa", "Rosa", "Laksefarvet", "Tydeligt rød", "Rød", "Tomatrød", "Brandbilrød", "Kogt hummer", "Glødende"];

export default async function SlapChartPage() {
  const [slaps, sales] = await Promise.all([getPublicDeliveries(["lussing"]), getSalesFor(["lussing"])]);
  const ranked = [...slaps].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  const avg = slaps.length ? slaps.reduce((n, s) => n + (s.amount ?? 0), 0) / slaps.length : 0;
  const podium = ranked.slice(0, 3);
  const order = [1, 0, 2];

  return (
    <>
      <ExperienceHero emoji="👋" title="Lussing-hitlisten" color="#ff8fab">
        Hver lussing måles på den officielle rødme-skala fra 1 til 10. Her er de mest dramatiske.
      </ExperienceHero>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <div className="grid grid-cols-3 gap-4">
          <StatTile emoji="👋" value={Math.max(slaps.length, sales.lussing?.qty ?? 0)} label="lussinger uddelt" />
          <StatTile emoji="🍅" value={avg.toFixed(1).replace(".", ",")} label="gennemsnitlig rødme" />
          <StatTile emoji="🔥" value={ranked[0]?.amount ?? 0} label="rekord" />
        </div>

        {podium.length > 0 ? (
          <div className="flex items-end justify-center gap-3 pt-6">
            {order.map((i) => {
              const s = podium[i];
              if (!s) return <div key={i} className="w-28 sm:w-40" />;
              const h = ["h-44", "h-32", "h-24"][i];
              return (
                <Reveal key={s.id} delay={i * 150} className="flex w-28 flex-col items-center sm:w-40">
                  <p className="text-4xl" aria-hidden="true">{["🥇", "🥈", "🥉"][i]}</p>
                  <p className="text-center font-display font-bold">{s.dedicatedTo ?? "Hemmelig"}</p>
                  <div className={`card mt-2 grid w-full place-items-center bg-coral text-white ${h}`}>
                    <span className="font-display text-4xl font-bold">{s.amount ?? "?"}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-5xl" aria-hidden="true">🫣</p>
            <p className="mt-2 font-display text-xl font-bold">Ingen lussinger på listen endnu</p>
            <p className="text-ink-soft">Kinden venter.</p>
          </div>
        )}

        <section aria-labelledby="skala">
          <h2 id="skala" className="text-3xl font-bold">Rødme-skalaen</h2>
          <ol className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {REDNESS.map((r, i) => (
              <li key={r} className="text-center">
                <div
                  className="mx-auto h-12 w-12 rounded-full border-[3px] border-ink"
                  style={{ background: `hsl(${12 - i}, ${40 + i * 6}%, ${88 - i * 5}%)` }}
                />
                <p className="mt-1 font-display font-bold">{i + 1}</p>
                <p className="text-xs leading-tight text-ink-soft">{r}</p>
              </li>
            ))}
          </ol>
        </section>

        {ranked.length > 0 && (
          <ol className="space-y-3">
            {ranked.map((s, i) => (
              <Reveal as="li" key={s.id} delay={Math.min(i, 6) * 50} className="card flex items-center gap-4 p-3">
                <span className="w-8 text-center font-display text-2xl font-bold">{i + 1}</span>
                {s.photoUrl && (
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-ink">
                    <Image src={s.photoUrl} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold">{s.dedicatedTo ?? s.title}</span>
                  <span className="block text-sm text-ink-soft">
                    {s.note ? `${s.note} · ` : ""}
                    {formatDay(s.deliveredAt)}
                  </span>
                </span>
                <span className="w-28 sm:w-48" aria-label={`Rødme ${s.amount ?? 0} af 10`}>
                  <span className="block h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <span
                      className="block h-full bg-gradient-to-r from-pink to-coral"
                      style={{ width: `${((s.amount ?? 0) / 10) * 100}%` }}
                    />
                  </span>
                  <span className="text-xs font-bold">{REDNESS[Math.max(0, Math.min(9, Math.round(s.amount ?? 1) - 1))]}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        )}
        <BuyCta slug="lussing" label="Kom på hitlisten 👋" />
      </div>
    </>
  );
}
