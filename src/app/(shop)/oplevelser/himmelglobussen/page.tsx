import type { Metadata } from "next";
import { BuyCta, ExperienceHero, StatTile } from "@/components/experience-bits";
import { SkyGlobe } from "@/components/sky-globe";
import { getPublicDeliveries } from "@/lib/experiences";
import { SKY_PRODUCTS } from "@/lib/delivery-kinds";

export const metadata: Metadata = {
  title: "Himmelglobussen",
  description: "En 3D-globus med himlen over jorden – og alle de stykker himmel, folk har købt.",
};

export default async function SkyGlobePage({ searchParams }: PageProps<"/oplevelser/himmelglobussen">) {
  const { himmel } = await searchParams;
  const skies = await getPublicDeliveries(SKY_PRODUCTS);
  const clouds = skies.filter((s) => s.product?.slug === "en-sky-efter-dig").length;

  return (
    <>
      <ExperienceHero emoji="🌍" title="Himmelglobussen" color="#9bf6ff">
        Himlen over jorden er delt op i stykker. De gule er købt – og under hver af dem har jeg stået og kigget op og
        tænkt på en ven. Drej globussen, og klik på et stykke.
      </ExperienceHero>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="grid grid-cols-3 gap-4">
          <StatTile emoji="🌤️" value={skies.length - clouds} label="stykker himmel" />
          <StatTile emoji="☁️" value={clouds} label="skyer opkaldt" />
          <StatTile emoji="🗺️" value={new Set(skies.map((s) => s.placeName).filter(Boolean)).size} label="steder" />
        </div>
        <SkyGlobe deliveries={skies} focusId={typeof himmel === "string" ? Number(himmel) : undefined} />
        <p className="text-center text-sm text-ink-soft">Træk for at dreje · rul eller knib for at zoome</p>
        <div className="flex flex-wrap justify-center gap-3">
          <BuyCta slug="stykke-af-himlen" label="Køb et stykke himmel 🌤️" />
          <BuyCta slug="en-sky-efter-dig" label="Få en sky opkaldt efter dig ☁️" />
        </div>
      </div>
    </>
  );
}
