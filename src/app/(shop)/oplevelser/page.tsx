import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { DriftingClouds, Rainbow, RisingEmojis } from "@/components/sky";
import { EXPERIENCES } from "@/lib/experience-list";

export const metadata: Metadata = {
  title: "Oplevelser – kort, globus og tællere",
  description: "Bænkekortet, himmelglobussen, tankemåleren og meget mere: se venskaberne leve.",
};

export default function ExperiencesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-ink bg-gradient-to-b from-sky-deep via-sky to-cream">
        <DriftingClouds count={4} />
        <RisingEmojis count={10} emojis={["🪑", "🌍", "💭", "👋", "🎂", "🚲", "🖼️", "🌡️", "✂️", "🌙"]} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
          <Rainbow width={340} className="mx-auto max-w-full" />
          <h1 className="-mt-8 text-5xl font-bold sm:text-7xl">Oplevelser</h1>
          <p className="mt-4 text-xl font-semibold">
            Venskaberne lever! Se hvor jeg har siddet, hvad jeg har tænkt, og hvem der hænger på min væg.
          </p>
        </div>
      </section>
      <ul className="mx-auto grid max-w-6xl gap-7 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {EXPERIENCES.map((e, i) => (
          <Reveal as="li" key={e.slug} delay={(i % 3) * 80}>
            <Link
              href={`/oplevelser/${e.slug}`}
              className={`group card flex h-full flex-col overflow-hidden transition hover:-translate-y-1.5 ${i % 2 ? "rotate-1" : "-rotate-1"} hover:rotate-0`}
            >
              <div
                className="grid aspect-[16/9] place-items-center border-b-[3px] border-ink"
                style={{ background: `radial-gradient(circle at 30% 25%, #ffffffaa, transparent 55%), ${e.color}` }}
              >
                <span className="text-7xl transition group-hover:scale-110 group-hover:animate-wiggle" aria-hidden="true">
                  {e.emoji}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-2xl font-bold">{e.title}</h2>
                <p className="mt-1 flex-1 text-ink-soft">{e.text}</p>
                <span className="mt-3 font-bold text-coral">Se det →</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </>
  );
}
