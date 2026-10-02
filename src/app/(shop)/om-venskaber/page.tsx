import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { DriftingClouds, Rainbow, RisingEmojis } from "@/components/sky";

export const metadata: Metadata = {
  title: "Om venskaber – hvorfor sælge venskaber?",
  description: "Jeg er træt af, at vi aldrig ses. Vi skal være i hinandens liv. Så meget som muligt.",
};

const TRUTHS = [
  { a: "Venner er nogen, der stabler papkasser", b: "Det handler om at være nyttig", img: "venskaber-1.jpg", e: "📦" },
  { a: "Venner er nogen, der er taknemmelige", b: "Det handler om at deles", img: "venskaber-2.jpg", e: "🙏" },
  { a: "Venner er nogen, der bygger lego sammen", b: "Det handler om at lege", img: "venskaber-3.jpg", e: "🧱" },
  { a: "Venner er nogen, der fjoller", b: "Det handler om ikke at tage det hele for tungt", img: "venskaber-4.jpg", e: "🤪" },
  { a: "Venner er nogen, man binder sig til", b: "Det handler om loyalitet", img: "venskaber-5.jpg", e: "⛓️" },
  { a: "Venner er nogen, man er nøgen med", b: "Det handler om at være sig selv", img: "venskaber-6.jpg", e: "🛁" },
  { a: "Venner er nogen, der er med til festerne", b: "Det handler om at dukke op", img: "venskaber-7.jpg", e: "🕯️" },
  { a: "Venner er nogen, der samarbejder", b: "Det handler om en fælles sag", img: "venskaber-8.jpg", e: "🤝" },
];

export default function FriendshipPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#ffe5ec] to-cream">
        <DriftingClouds count={4} />
        <RisingEmojis count={10} emojis={["💛", "🤝", "🥰", "🌈", "😄"]} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center">
          <Rainbow width={340} className="mx-auto max-w-full" />
          <h1 className="-mt-8 text-5xl font-bold sm:text-7xl">Om venskaber</h1>
          <p className="mt-4 text-xl font-semibold">Hvad kan du få ud af det her postmoderne pis?</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4">
        <Reveal className="card -rotate-1 bg-sun p-8 text-xl leading-relaxed sm:p-10">
          <p>
            Jeg har lavet denne side for at provokere. <strong>Jeg er træt af, at vi aldrig ses.</strong> Jeg tænker over,
            om det er mig, der er et bestemt sted i livet, eller om alle mennesker er ved at glide fra hinanden.
          </p>
          <p className="mt-4">
            Det vil jeg lave om på. Vi skal ses. Vi skal være i hinandens liv. Så meget som muligt. Du kan her købe dig
            til mit venskab.
          </p>
          <p className="mt-4">
            Kunne du også få mit venskab helt gratis? <strong>Ja, det kunne du også.</strong> Du bestemmer, hvad du vil.
            Så længe jeg er en del af det, du finder ud af. 💛
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <ul className="grid gap-10 sm:grid-cols-2">
          {TRUTHS.map((t, i) => (
            <Reveal as="li" key={t.a} delay={(i % 2) * 120} className={i % 2 ? "sm:mt-16" : ""}>
              <figure className={`card group overflow-hidden ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
                <div className="relative aspect-[4/3] border-b-[3px] border-ink">
                  <Image
                    src={`/images/site/${t.img}`}
                    alt={t.a}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span
                    className="absolute -bottom-6 right-5 grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink bg-white text-3xl animate-bob"
                    style={{ animationDelay: `${i * 0.3}s` }}
                    aria-hidden="true"
                  >
                    {t.e}
                  </span>
                </div>
                <figcaption className="p-6">
                  <p className="font-display text-2xl font-bold">{t.a}</p>
                  <p className="mt-1 text-lg font-semibold text-coral">{t.b}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-20 text-center">
        <Reveal>
          <h2 className="text-4xl font-bold">Klar til at blive venner? 🤗</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/tjenester" className="btn btn-coral text-lg">
              Se venskabstjenesterne
            </Link>
            <Link href="/om-villads" className="btn btn-white text-lg">
              Lær mig at kende først
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
