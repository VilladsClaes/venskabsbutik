import type { Metadata } from "next";
import { BuyCta, ExperienceHero, formatDay } from "@/components/experience-bits";
import { CountUp } from "@/components/live-numbers";
import { Reveal } from "@/components/reveal";
import { getPublicDeliveries, getSalesFor } from "@/lib/experiences";

export const metadata: Metadata = {
  title: "Godhedstermometret",
  description: "Mad til hjemløse og lån til iværksættere – så meget godt har vi gjort sammen.",
};

/** Målet vokser, hver gang det nås */
function goalFor(kr: number, start: number) {
  let g = start;
  while (kr >= g) g *= 2;
  return g;
}

function Thermometer({ kr, goal, color, label }: { kr: number; goal: number; color: string; label: string }) {
  const pct = Math.min(100, (kr / goal) * 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-80 w-16 rounded-t-full border-[4px] border-ink bg-white">
        <div
          className="absolute inset-x-1 bottom-1 rounded-t-full transition-[height] duration-1000"
          style={{ height: `calc(${pct}% - 8px)`, background: color }}
        />
        {[25, 50, 75].map((t) => (
          <span key={t} className="absolute -right-3 h-[3px] w-4 bg-ink" style={{ bottom: `${t}%` }} />
        ))}
      </div>
      <div className="-mt-2 h-20 w-20 rounded-full border-[4px] border-ink" style={{ background: color }} />
      <p className="mt-3 font-display text-3xl font-bold">
        <CountUp value={kr} /> kr.
      </p>
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-ink-soft">Mål: {goal.toLocaleString("da-DK")} kr.</p>
    </div>
  );
}

export default async function GoodnessPage() {
  const [sales, deeds] = await Promise.all([
    getSalesFor(["mad-til-hjemloese", "kiva"]),
    getPublicDeliveries(["mad-til-hjemloese", "kiva"]),
  ]);
  const food = Math.round((sales["mad-til-hjemloese"]?.revenue ?? 0) / 100);
  const kiva = Math.round((sales.kiva?.revenue ?? 0) / 100);

  return (
    <>
      <ExperienceHero emoji="🌡️" title="Godhedstermometret" color="#b7efc5">
        Alt, hvad I køber af “Mad til en hjemløs” og “Investér med Kiva”, går ubeskåret til det gode formål. Så meget har
        vi gjort sammen:
      </ExperienceHero>
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-10">
        <div className="flex flex-wrap justify-center gap-16">
          <Thermometer kr={food} goal={goalFor(food, 1000)} color="#ff8fab" label="🥪 mad til hjemløse" />
          <Thermometer kr={kiva} goal={goalFor(kiva, 1000)} color="#06d6a0" label="🌱 lånt ud via Kiva" />
        </div>
        {deeds.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold">Gode gerninger 💚</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {deeds.map((d, i) => (
                <Reveal as="li" key={d.id} delay={(i % 2) * 80} className="card p-4">
                  <p className="font-display text-lg font-bold">
                    {d.product?.emoji} {d.title}
                  </p>
                  {d.amount != null && <p className="font-bold">{d.amount.toLocaleString("da-DK")} kr.</p>}
                  {d.dedicatedTo && <p>I {d.dedicatedTo}s navn</p>}
                  {d.note && <p className="text-sm">{d.note}</p>}
                  <p className="text-sm text-ink-soft">{formatDay(d.deliveredAt)}</p>
                </Reveal>
              ))}
            </ul>
          </section>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <BuyCta slug="mad-til-hjemloese" label="Giv mad til en hjemløs 🥪" />
          <BuyCta slug="kiva" label="Lån ud via Kiva 🌱" />
        </div>
      </div>
    </>
  );
}
