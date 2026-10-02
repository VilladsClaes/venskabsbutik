import type { Metadata } from "next";
import { BuyCta, ExperienceHero, StatTile } from "@/components/experience-bits";
import { RouteMap } from "@/components/route-map";
import routes from "@/lib/routes.json";

export const metadata: Metadata = {
  title: "Rutekortet",
  description: "Villads' cykel- og vandreruter gennem Europa – tegnet på kortet.",
};

export default function RoutesPage() {
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
        <RouteMap routes={routes} />
        <BuyCta slug="cykelruter" label="Få din egen rute planlagt 🚲" />
      </div>
    </>
  );
}
