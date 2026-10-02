import type { Metadata } from "next";
import Image from "next/image";
import { DeliveryMap } from "@/components/delivery-map";
import { BuyCta, ExperienceHero, formatDay, StatTile } from "@/components/experience-bits";
import { Reveal } from "@/components/reveal";
import { getPublicDeliveries } from "@/lib/experiences";

export const metadata: Metadata = {
  title: "Bænkekortet",
  description: "Alle de bænke, Villads har siddet på og tænkt på folk.",
};

export default async function BenchMapPage({ searchParams }: PageProps<"/oplevelser/baenkekortet">) {
  const { baenk } = await searchParams;
  const benches = await getPublicDeliveries(["baenk"]);
  const onMap = benches.filter((b) => b.lat != null);
  const people = new Set(benches.map((b) => b.dedicatedTo).filter(Boolean)).size;

  return (
    <>
      <ExperienceHero emoji="🪑" title="Bænkekortet" color="#bde0fe">
        Hver nål er en bænk, hvor jeg har siddet med madpakke og bog og tænkt på nogen. Hver bænk bruges kun én gang.
      </ExperienceHero>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="grid grid-cols-3 gap-4">
          <StatTile emoji="🪑" value={benches.length} label="bænke siddet på" />
          <StatTile emoji="💛" value={people} label="mennesker tænkt på" />
          <StatTile emoji="🥪" value={benches.length} label="madpakker spist" />
        </div>
        <div className="relative">
          <DeliveryMap deliveries={onMap} emoji="🪑" focusId={typeof baenk === "string" ? Number(baenk) : undefined} />
          {onMap.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center">
              <p className="card bg-white/95 px-6 py-4 text-center font-display text-xl font-bold">
                Ingen bænke endnu 🌱
                <span className="block text-base font-semibold text-ink-soft">Køb den første – så sidder jeg på den for dig!</span>
              </p>
            </div>
          )}
        </div>
        {benches.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benches.map((b, i) => (
              <Reveal as="li" key={b.id} delay={(i % 3) * 80} className="card overflow-hidden">
                {b.photoUrl && (
                  <div className="relative aspect-[4/3] border-b-[3px] border-ink">
                    <Image src={b.photoUrl} alt={b.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-display text-lg font-bold">{b.title}</p>
                  {b.dedicatedTo && <p>💛 Til {b.dedicatedTo}</p>}
                  <p className="text-sm text-ink-soft">
                    {b.placeName ? `📍 ${b.placeName} · ` : ""}
                    {formatDay(b.deliveredAt)}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        )}
        <BuyCta slug="baenk" label="Få din egen bænk 🪑" />
      </div>
    </>
  );
}
