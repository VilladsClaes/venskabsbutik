import type { Metadata } from "next";
import Link from "next/link";
import { BuyCta, ExperienceHero, StatTile } from "@/components/experience-bits";
import { RouteMap } from "@/components/route-map";
import { formatEventTime, getEventRoutes } from "@/lib/events";
import routes from "@/lib/routes.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rutekortet",
  description: "Villads' cykel- og vandreruter gennem Europa – tegnet på kortet.",
};

export default async function RoutesPage() {
  // Cykelture o.l. fra kalenderen kommer automatisk med på kortet
  const eventRoutes = (await getEventRoutes()).map((e) => ({
    slug: `event-${e.slug}`,
    name: `${e.emoji} ${e.title}`,
    caption: `Kom med! ${formatEventTime(e.startsAt, e.endsAt)}`,
    color: e.color,
    geojson: e.routeGeojson!,
    href: `/kalender/${e.slug}`,
  }));
  return (
    <>
      <ExperienceHero emoji="🚲" title="Rutekortet" color="#a0e7e5">
        Fra Lillehammer til Santiago, rundt om Nordsøen og gennem Irland. Her er de ruter, jeg har planlagt – klik på en
        rute for at se etapen. Måske er din den næste?
      </ExperienceHero>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile emoji="🗺️" value={routes.length} label="ruter" />
          <StatTile emoji="🚩" value={routes.reduce((n, r) => n + r.lines, 0)} label="etaper" />
          <StatTile emoji="🇪🇺" value="7" label="lande og mere til" />
        </div>
        {eventRoutes.length > 0 && (
          <div className="card bg-sun p-4">
            <p className="font-display text-lg font-bold">🚲 Ture du kan komme med på</p>
            <ul className="mt-1 space-y-1">
              {eventRoutes.map((r) => (
                <li key={r.slug}>
                  <Link href={r.href} className="font-semibold underline">
                    {r.name}
                  </Link>{" "}
                  <span className="text-sm first-letter:uppercase">– {r.caption.replace("Kom med! ", "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <RouteMap routes={[...eventRoutes, ...routes]} />
        <BuyCta slug="cykelruter" label="Få din egen rute planlagt 🚲" />
      </div>
    </>
  );
}
