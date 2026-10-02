import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { RisingEmojis } from "@/components/sky";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Bogen der ændrede verden",
  description: "Sådan får du en million – af Villads Claes.",
};

export default async function BookPage() {
  const settings = await getSettings();
  const phone = settings.contactPhone ?? "60614309";
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#e0f0ff] to-cream">
      <RisingEmojis count={12} emojis={["💰", "📕", "🤑", "✨", "💸"]} />
      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 md:grid-cols-2">
        <Reveal className="mx-auto w-full max-w-xs">
          <div className="card relative aspect-[2/3] rotate-3 overflow-hidden transition hover:rotate-0">
            <Image
              src="/images/site/bog.png"
              alt="Bogforside: Sådan får du en million af Villads Claes"
              fill
              priority
              sizes="320px"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="font-display text-lg font-semibold text-coral">Køb min bog</p>
          <h1 className="text-5xl font-bold sm:text-6xl">Bogen der ændrede verden</h1>
          <p className="mt-4 text-xl font-semibold">“Sådan får du en million” – af Villads Claes.</p>
          <p className="mt-4 text-lg">
            Omtalt på YouTube som en af de eneste bøger, man bør have på sin hylde. 📚
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/45${phone}?text=${encodeURIComponent("Jeg vil gerne købe din bog!")}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-coral text-lg"
            >
              Bestil bogen 📕
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
