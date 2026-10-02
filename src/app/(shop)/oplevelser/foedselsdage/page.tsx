import type { Metadata } from "next";
import { BuyCta, ExperienceHero } from "@/components/experience-bits";
import { Countdown, CountUp } from "@/components/live-numbers";
import { Reveal } from "@/components/reveal";
import { ageInDays, upcomingMilestones } from "@/lib/birthday";

export const metadata: Metadata = {
  title: "Fødselsdags-nedtællingen",
  description: "Live nedtælling til Villads' næste runde fødselsdag. Kom med!",
};

export default function BirthdayPage() {
  const milestones = upcomingMilestones(new Date(), 8);
  const next = milestones[0];

  return (
    <>
      <ExperienceHero emoji="🎂" title="Fødselsdags-nedtællingen" color="#ffb4a2">
        Hver dag er i teorien min fødselsdag. Men nogle dage er rundere end andre. Jeg er i dag{" "}
        <CountUp value={ageInDays()} /> dage gammel.
      </ExperienceHero>
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        {next && (
          <section className="card bg-sun p-6 text-center sm:p-10">
            <p className="font-display text-lg font-semibold">Næste runde fødselsdag</p>
            <h2 className="mt-1 text-4xl font-bold sm:text-5xl">
              {next.emoji} {next.label}
            </h2>
            <p className="mt-1 text-lg font-semibold">
              {next.date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="mt-6">
              <Countdown to={next.date.toISOString()} />
            </div>
          </section>
        )}
        <section>
          <h2 className="text-3xl font-bold">Kommende fester 🎉</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {milestones.slice(1).map((m, i) => (
              <Reveal as="li" key={m.key} delay={(i % 2) * 80} className="card flex items-center gap-4 p-4">
                <span className="text-4xl" aria-hidden="true">{m.emoji}</span>
                <span>
                  <span className="block font-display text-xl font-bold">{m.label}</span>
                  <span className="text-ink-soft">
                    {m.date.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </span>
              </Reveal>
            ))}
          </ul>
        </section>
        <BuyCta slug="foedselsdag" label="Kom med til festen 🎂" />
      </div>
    </>
  );
}
