import type { Metadata } from "next";
import { BuyCta, ExperienceHero, formatDay, StatTile } from "@/components/experience-bits";
import { CountUp, LiveSince } from "@/components/live-numbers";
import { Reveal } from "@/components/reveal";
import { getPublicDeliveries, getSalesFor } from "@/lib/experiences";

export const metadata: Metadata = {
  title: "Tankemåleren",
  description: "Hvor mange mennesker har Villads tænkt på – og i hvor mange minutter?",
};

export default async function ThoughtMeterPage() {
  const [thoughts, sales] = await Promise.all([
    getPublicDeliveries(["taenk-paa-dig", "jeg-lytter"]),
    getSalesFor(["taenk-paa-dig", "venskabsabonnement"]),
  ]);
  // Hvert solgt "Tænke på dig" er mindst ét minut – dagbogen kan registrere flere
  const loggedMinutes = thoughts.reduce((n, t) => n + (t.amount ?? 1), 0);
  const soldThoughts = (sales["taenk-paa-dig"]?.qty ?? 0) + (sales["venskabsabonnement"]?.qty ?? 0);
  const minutes = Math.max(loggedMinutes, soldThoughts);
  const people = Math.max(new Set(thoughts.map((t) => t.dedicatedTo).filter(Boolean)).size, soldThoughts);
  const last = thoughts[0];

  return (
    <>
      <ExperienceHero emoji="💭" title="Tankemåleren" color="#ffc6ff">
        Luk øjnene og vid, at nogen derude tænker på dig. Her kan du se, hvor meget.
      </ExperienceHero>
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <div className="card relative overflow-hidden bg-[#ffe5ec] p-8 text-center">
          <p className="font-display text-lg font-semibold">Villads har tænkt på</p>
          <p className="font-display text-7xl font-bold sm:text-8xl">
            <CountUp value={people} />
          </p>
          <p className="font-display text-xl font-semibold">mennesker i</p>
          <p className="font-display text-6xl font-bold text-coral sm:text-7xl">
            <CountUp value={minutes} />
          </p>
          <p className="font-display text-xl font-semibold">minutter 💭</p>
          {["💭", "💛", "🧠", "✨"].map((e, i) => (
            <span
              key={e}
              className="absolute animate-float text-4xl opacity-70"
              style={{ left: `${8 + i * 26}%`, top: i % 2 ? "12%" : "70%", animationDelay: `${i * 0.8}s` }}
              aria-hidden="true"
            >
              {e}
            </span>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile emoji="⏱️" value={<CountUp value={minutes * 60} />} label="sekunder i alt" />
          <StatTile emoji="🙂" value={minutes ? (minutes / Math.max(1, people)).toFixed(1).replace(".", ",") : "0"} label="minutter pr. person" />
          <StatTile
            emoji="🕰️"
            value={last ? <LiveSince from={last.deliveredAt} unit="minutes" /> : "–"}
            label="minutter siden sidste tanke"
          />
        </div>

        {thoughts.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold">Tidslinje over tanker</h2>
            <ol className="mt-6 space-y-4 border-l-[3px] border-dashed border-ink/30 pl-6">
              {thoughts.slice(0, 50).map((t, i) => (
                <Reveal as="li" key={t.id} delay={Math.min(i, 6) * 60} className="relative">
                  <span className="absolute -left-[38px] top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-pink text-sm">
                    💭
                  </span>
                  <div className="card p-4">
                    <p className="font-display text-lg font-bold">
                      {t.dedicatedTo ? `Tænkte på ${t.dedicatedTo}` : t.title}
                      {t.amount ? ` i ${t.amount.toLocaleString("da-DK")} min.` : ""}
                    </p>
                    {t.note && <p>{t.note}</p>}
                    <p className="text-sm text-ink-soft">{formatDay(t.deliveredAt)}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </section>
        )}
        <BuyCta slug="taenk-paa-dig" label="Få mig til at tænke på dig 💭" />
      </div>
    </>
  );
}
