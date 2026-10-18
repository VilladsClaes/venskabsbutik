import type { Metadata } from "next";
import Link from "next/link";
import { EventCalendar } from "@/components/event-calendar";
import { ExperienceHero } from "@/components/experience-bits";
import { Reveal } from "@/components/reveal";
import { buildMonth, monthKey, parseMonth, shiftMonth } from "@/lib/calendar-month";
import { formatEventTime, getUpcomingEvents } from "@/lib/events";
import { formatKr } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Min kalender",
  description: "Se hvornår Villads er ledig, og køb dig adgang til events: fødselsdage, bow combat, paintball, gyserfilm og cykelture.",
};

export default async function CalendarPage({ searchParams }: PageProps<"/kalender">) {
  const { m } = await searchParams;
  const now = new Date();
  const current = parseMonth(undefined, now);
  const shown = parseMonth(typeof m === "string" ? m : undefined, now);
  const [month, upcoming] = await Promise.all([buildMonth(shown.y, shown.m, now), getUpcomingEvents(now)]);
  const prevKey = monthKey(shiftMonth(shown, -1));
  const nextKey = monthKey(shiftMonth(shown, 1));
  const today = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" });

  return (
    <>
      <ExperienceHero emoji="🗓️" title="Min kalender" color="#cdb4db" back={{ href: "/", label: "← Forsiden" }}>
        Her kan du se, hvornår jeg er ledig – og de dage, hvor du kan købe dig adgang til at være med. Når du har betalt,
        lander eventet direkte i din egen kalender.
      </ExperienceHero>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <EventCalendar
          key={month.key}
          month={month}
          today={today}
          prev={monthKey(shown) === monthKey(current) ? undefined : prevKey}
          next={monthKey(parseMonth(nextKey, now)) === nextKey ? nextKey : undefined}
        />

        <section>
          <h2 className="text-3xl font-bold">Kommende events 🎟️</h2>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-ink-soft">Ingen events lige nu – kig forbi igen snart, eller kom med til min næste fødselsdag 🎂</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e, i) => (
                <Reveal as="li" key={e.id} delay={(i % 3) * 80}>
                  <Link
                    href={`/kalender/${e.slug}`}
                    className="card flex h-full flex-col p-5 transition hover:-translate-y-1"
                    style={{ background: `color-mix(in srgb, ${e.color} 30%, white)` }}
                  >
                    <span className="text-5xl" aria-hidden="true">{e.emoji}</span>
                    <span className="mt-2 font-display text-2xl font-bold leading-tight">{e.title}</span>
                    <span className="mt-1 text-sm font-semibold first-letter:uppercase">{formatEventTime(e.startsAt, e.endsAt)}</span>
                    {e.summary && <span className="mt-2 text-sm">{e.summary}</span>}
                    <span className="mt-auto flex items-center justify-between gap-2 pt-4 font-bold">
                      <span>{e.price ? formatKr(e.price) : "Gratis"}</span>
                      <span className="text-sm">
                        {e.hasRoute && "🗺️ "}
                        {e.seatsLeft == null ? "" : e.seatsLeft ? `${e.seatsLeft} pladser tilbage` : "Fuldt booket"}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </section>

        <section className="card bg-cream p-6">
          <h2 className="text-2xl font-bold">Sådan virker det 🤝</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>Find et event i kalenderen, og meld dig til med din e-mail.</li>
            <li>Betal det angivne beløb – med MobilePay, kort, venskab eller hvad du nu foretrækker.</li>
            <li>Når betalingen er registreret, sender jeg en kalenderinvitation til din e-mail – så ligger eventet i din Google- eller Outlook-kalender, og ændringer kommer automatisk med.</li>
          </ol>
        </section>
      </div>
    </>
  );
}
