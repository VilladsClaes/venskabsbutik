import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { DriftingClouds, Sun } from "@/components/sky";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Om Villads – lær mig at kende",
  description: "Hvem er jeg? Lær mig at kende, inden du bliver min ven.",
};

const LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/VilladsClaes", e: "📘" },
  { label: "Instagram", href: "https://instagram.com/villadsclaes", e: "📸" },
  { label: "YouTube", href: "https://www.youtube.com/user/VilladsClaes/", e: "▶️" },
  { label: "LinkedIn", href: "https://www.linkedin.com/pub/villads-claes/10/193/5a", e: "💼" },
  { label: "Substack", href: "https://villadsclaes.substack.com/", e: "✍️" },
  { label: "Medium", href: "https://medium.com/@villadsclaes", e: "📰" },
  { label: "SoundCloud", href: "https://soundcloud.com/villadsclaes", e: "🎵" },
  { label: "GitHub", href: "https://github.com/VilladsClaes", e: "🐙" },
  { label: "Fiverr", href: "https://www.fiverr.com/villadsclaes", e: "🧑‍💻" },
  { label: "Telegram", href: "https://telegram.me/villadsclaes", e: "✈️" },
  { label: "Pinterest", href: "http://www.pinterest.com/villadsclaes/", e: "📌" },
  { label: "Ønskeseddel", href: "https://www.amazon.com/hz/wishlist/dl/invite/gWDJbHG?ref_=wl_share", e: "🎁" },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const phone = settings.contactPhone ?? "60614309";
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sky to-cream">
        <DriftingClouds count={4} />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <Reveal className="relative z-10 mx-auto w-full max-w-sm">
            <Sun size={130} className="absolute -right-8 -top-10 z-10" />
            <div className="card relative aspect-[4/5] -rotate-2 overflow-hidden">
              <Image src="/images/site/villads.jpg" alt="Villads Claes" fill priority sizes="400px" className="object-cover" />
            </div>
            <span className="absolute -bottom-5 -left-4 rotate-[-8deg] rounded-full border-[3px] border-ink bg-sun px-4 py-2 font-display text-lg font-bold shadow-[0_4px_0_0_#2b2d42]">
              Hej! Det er mig 👋
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="text-5xl font-bold sm:text-6xl">Hvem er jeg?</h1>
            <p className="mt-2 text-xl font-semibold text-coral">Lær mig at kende, inden du bliver min ven.</p>
            <div className="mt-6 space-y-4 text-lg">
              <p>
                Jeg hedder <strong>Villads Claes</strong>, er født den 21. oktober 1986 og bor i Aarhus. Jeg er
                lærerstuderende, forfatter til bogen, der ændrede verden, og vært på podcasten{" "}
                <em>Du bør kommentere</em>.
              </p>
              <p>
                Jeg startede Venskabsbutikken, fordi jeg er træt af, at vi aldrig ses. Alle tjenesterne her er ting, jeg
                faktisk vil gøre for dig. Jeg er på mange måder en bedre ven end nogen af dine andre venner. (Mod
                betaling.)
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`tel:+45${phone}`} className="btn btn-coral">
                📞 Ring til mig
              </a>
              <a
                href={`https://wa.me/45${phone}?text=${encodeURIComponent("Jeg vil meget gerne snakke med dig")}`}
                className="btn btn-mint"
                target="_blank"
                rel="noreferrer"
              >
                💬 WhatsApp
              </a>
              <Link href="/bogen" className="btn btn-white">
                📕 Min bog
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <Reveal>
          <h2 className="text-center text-4xl font-bold">Find mig derude 🌍</h2>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {LINKS.map((l, i) => (
            <Reveal as="li" key={l.label} delay={(i % 4) * 60}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="group card flex items-center gap-3 px-4 py-3 font-display text-lg font-semibold transition hover:-translate-y-1 hover:bg-[#fff3b0]"
              >
                <span className="text-2xl transition group-hover:animate-wiggle" aria-hidden="true">
                  {l.e}
                </span>
                {l.label}
              </a>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
