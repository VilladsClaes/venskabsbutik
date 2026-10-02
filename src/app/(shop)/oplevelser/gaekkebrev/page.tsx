import type { Metadata } from "next";
import { ExperienceHero } from "@/components/experience-bits";
import { GaekkebrevWorkshop } from "@/components/gaekkebrev-workshop";

export const metadata: Metadata = {
  title: "Gækkebrev-værkstedet",
  description: "Klip dit eget gækkebrev digitalt – og bestil et rigtigt fra Villads.",
};

export default function GaekkebrevPage() {
  return (
    <>
      <ExperienceHero emoji="✂️" title="Gækkebrev-værkstedet" color="#f1d5dc">
        Klip, skriv og gæt. Lav dit eget gækkebrev her – hent det som billede og send det til en ven. Eller få mig til at
        klippe et rigtigt i papir.
      </ExperienceHero>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <GaekkebrevWorkshop />
      </div>
    </>
  );
}
