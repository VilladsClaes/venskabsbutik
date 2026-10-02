import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BuyCta, ExperienceHero } from "@/components/experience-bits";
import { getPublicDeliveries } from "@/lib/experiences";

export const metadata: Metadata = {
  title: "Væggen",
  description: "Villads' stuevæg med alle de venner, der har købt en plads i hans hjem.",
};

const FRAMES = ["#c9a227", "#8d5b3a", "#2b2d42", "#ff6b6b", "#4d96ff", "#06d6a0"];

export default async function WallPage() {
  const portraits = (await getPublicDeliveries(["billede-i-mit-hjem", "papfigur-paa-ferie"])).filter((p) => p.photoUrl);
  const slots = Math.max(6, portraits.length + 2);

  return (
    <>
      <ExperienceHero emoji="🖼️" title="Væggen" color="#ffe8a3">
        Hvis du er en ægte ven, så hænger du på min væg. Her er alle dem, der gør. (Hold musen over et billede.)
      </ExperienceHero>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div
          className="card relative overflow-hidden p-6 sm:p-10"
          style={{
            backgroundColor: "#f6efe0",
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(166,108,255,.08) 0 18px, transparent 18px 36px), radial-gradient(circle at 18px 18px, rgba(255,107,107,.15) 3px, transparent 4px)",
            backgroundSize: "36px 36px, 36px 36px",
          }}
        >
          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: slots }, (_, i) => {
              const p = portraits[i];
              const tilt = [-4, 3, -2, 5, -3, 2][i % 6];
              const frame = FRAMES[i % FRAMES.length];
              return (
                <li key={p?.id ?? `tom-${i}`} className="flex flex-col items-center">
                  {/* søm og snor */}
                  <span className="h-3 w-3 rounded-full bg-ink" aria-hidden="true" />
                  <span className="h-6 w-px bg-ink/50" aria-hidden="true" />
                  <figure
                    className="group w-full origin-top transition-transform duration-700 hover:[transform:rotate(0deg)_scale(1.04)]"
                    style={{ transform: `rotate(${tilt}deg)` }}
                  >
                    <div
                      className="relative aspect-[4/5] w-full overflow-hidden border-[10px] shadow-[0_10px_20px_rgba(0,0,0,.25)]"
                      style={{ borderColor: frame, background: p ? "#fff" : "#fffaf0" }}
                    >
                      {p ? (
                        <Image src={p.photoUrl!} alt={p.dedicatedTo ?? p.title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                      ) : (
                        <Link
                          href="/tjenester/billede-i-mit-hjem"
                          className="grid h-full place-items-center p-3 text-center font-display font-bold text-ink-soft hover:text-coral"
                        >
                          <span>
                            <span className="block text-4xl" aria-hidden="true">🫥</span>
                            Din plads?
                          </span>
                        </Link>
                      )}
                    </div>
                    {p && (
                      <figcaption className="mx-auto -mt-1 w-fit rounded-b-lg bg-[#c9a227] px-3 py-1 text-center font-display text-sm font-bold text-white">
                        {p.dedicatedTo ?? "En hemmelig ven"}
                      </figcaption>
                    )}
                  </figure>
                </li>
              );
            })}
          </ul>
          {/* lidt stueinventar */}
          <div className="mt-12 flex items-end justify-between text-5xl" aria-hidden="true">
            <span>🪴</span>
            <span>🛋️</span>
            <span>🕯️</span>
          </div>
        </div>
        <BuyCta slug="billede-i-mit-hjem" label="Kom op at hænge på væggen 🖼️" />
      </div>
    </>
  );
}
