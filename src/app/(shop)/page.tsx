import Image from "next/image";
import Link from "next/link";
import { ProductCard, TestimonialCard } from "@/components/product-bits";
import { Reveal } from "@/components/reveal";
import { DriftingClouds, Rainbow, RisingEmojis, Sun, Wave } from "@/components/sky";
import { SurpriseWheel } from "@/components/surprise-wheel";
import { YouTube } from "@/components/youtube";
import { DAILY_BONUS_SLUG, pickDaily } from "@/lib/daily";
import { EXPERIENCES } from "@/lib/experience-list";
import { getCategories, getPublishedTestimonials, getSettings, getShopProducts, getShopStats } from "@/lib/queries";

export default async function HomePage() {
  const [products, categories, testimonials, settings, stats] = await Promise.all([
    getShopProducts(),
    getCategories(),
    getPublishedTestimonials(6),
    getSettings(),
    getShopStats(),
  ]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const cheapest = Math.min(...products.map((p) => p.fromPrice));
  const daily = pickDaily(products.filter((p) => p.slug !== DAILY_BONUS_SLUG));
  const bonus = products.find((p) => p.slug === DAILY_BONUS_SLUG);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-deep via-sky to-cream">
        <DriftingClouds />
        <RisingEmojis count={12} />
        <Sun size={190} className="absolute -right-6 -top-6 sm:right-8 sm:top-6 sm:h-[240px] sm:w-[240px]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-16 text-center sm:pt-24">
          <Rainbow width={520} className="absolute top-6 -z-0 max-w-[110%] opacity-90 sm:top-10" />
          <p className="relative animate-pop-in rounded-full border-[3px] border-ink bg-white px-4 py-1.5 font-display font-semibold shadow-[0_4px_0_0_#2b2d42]">
            ✨ Nu med {products.length} forskellige venskabsfragmenter ✨
          </p>
          <h1
            className="relative mt-6 animate-pop-in text-5xl font-bold leading-[0.95] sm:text-7xl md:text-8xl"
            style={{ animationDelay: "120ms" }}
          >
            Venskaber
            <br />
            <span className="relative inline-block -rotate-2 rounded-3xl border-[4px] border-ink bg-sun px-4 pb-2 shadow-[0_7px_0_0_#2b2d42]">
              til salg!
            </span>{" "}
            <span className="inline-block animate-float" aria-hidden="true">
              🤗
            </span>
          </h1>
          <p
            className="relative mt-8 max-w-xl animate-pop-in text-lg font-semibold sm:text-xl"
            style={{ animationDelay: "240ms" }}
          >
            Jeg er træt af, at vi aldrig ses. Så nu kan du købe dig til mit venskab – i små, overkommelige
            bidder. Fra {cheapest / 100} kr. 💛
          </p>
          <div
            className="relative mt-8 flex animate-pop-in flex-wrap justify-center gap-3"
            style={{ animationDelay: "360ms" }}
          >
            <Link href="/tjenester" className="btn btn-coral text-lg">
              Find dit venskab 🎁
            </Link>
            <a href="#video" className="btn btn-white text-lg">
              Hør mig forklare ▶
            </a>
          </div>
          <dl className="relative mt-12 grid w-full max-w-2xl grid-cols-3 gap-3">
            {[
              { n: products.length, l: "tjenester", e: "🎁" },
              { n: stats.orders, l: "venskaber solgt", e: "🔥" },
              { n: stats.customers, l: "nye venner", e: "🤝" },
            ].map((s, i) => (
              <div key={s.l} className="card animate-pop-in px-2 py-3" style={{ animationDelay: `${480 + i * 100}ms` }}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-3xl font-bold">
                  <span aria-hidden="true">{s.e} </span>
                  {s.n}
                </dd>
                <dd className="text-sm font-semibold text-ink-soft">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-12">
        <Reveal className="text-center">
          <h2 className="text-4xl font-bold sm:text-5xl">
            Hør mig forklare <span className="wavy-underline">Venskabsbutikken</span>
          </h2>
          <p className="mt-3 text-lg text-ink-soft">Start med denne video – køb bagefter et af venskabsfragmenterne.</p>
        </Reveal>
        <Reveal className="mt-8 rotate-1" delay={100}>
          <YouTube id={settings.introVideo ?? "b2Wab89xhOc"} title="Køb venskaber og venskabstjenester" />
        </Reveal>
      </section>

      {/* DAGENS VENSKAB */}
      {daily && (
        <section className="mx-auto max-w-5xl px-4 pt-20">
          <Reveal className="card relative grid items-center gap-6 overflow-visible bg-[#fff3b0] p-6 sm:grid-cols-[200px_1fr] sm:p-8">
            <span className="absolute -top-5 left-6 rotate-[-4deg] rounded-full border-[3px] border-ink bg-coral px-4 py-1 font-display font-bold text-white shadow-[0_4px_0_0_#2b2d42]">
              ⭐ Dagens venskab
            </span>
            <div
              className="grid aspect-square place-items-center rounded-3xl border-[3px] border-ink text-8xl"
              style={{ background: daily.color }}
              aria-hidden="true"
            >
              <span className="animate-float">{daily.emoji}</span>
            </div>
            <div>
              <p className="font-display font-semibold text-coral">{daily.tagline}</p>
              <h2 className="text-4xl font-bold">{daily.name}</h2>
              <p className="mt-2 text-lg">{daily.summary}</p>
              {bonus && (
                <p className="mt-3 font-semibold">
                  🎁 Køb den i dag, og få <strong>“{bonus.name}”</strong> gratis med oveni!
                </p>
              )}
              <Link href={`/tjenester/${daily.slug}`} className="btn btn-coral mt-4">
                Se dagens venskab →
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* UDVALGTE */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold text-coral">Mest populære lige nu</p>
            <h2 className="text-4xl font-bold sm:text-5xl">Udvalgte venskaber 🌟</h2>
          </div>
          <Link href="/tjenester" className="btn btn-sun">
            Se alle {products.length} →
          </Link>
        </Reveal>
        <ul className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 4) * 80}>
              <ProductCard product={p} index={i} />
            </Reveal>
          ))}
        </ul>
      </section>

      {/* SÅDAN VIRKER DET */}
      <section className="mt-24">
        <Wave color="#ffd23f" />
        <div className="bg-sun">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <Reveal className="text-center">
              <h2 className="text-4xl font-bold sm:text-5xl">Sådan køber du et venskab</h2>
              <p className="mt-3 text-lg font-semibold">Tre skridt. Nul bureaukrati. Masser af kærlighed.</p>
            </Reveal>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                { e: "🛒", t: "Vælg dit venskab", d: "Find den tjeneste, der passer til dig, og læg den i kurven." },
                {
                  e: "📝",
                  t: "Fortæl mig lidt",
                  d: "Svar på et par spørgsmål, så jeg ved hvor, hvornår og hvem. Du får et ordrenummer.",
                },
                {
                  e: "💙",
                  t: "Betal med MobilePay",
                  d: `Send beløbet til ${settings.mobilepayNumber ?? "60614309"} og skriv dit ordrenummer i beskeden. Så går jeg i gang!`,
                },
              ].map((s, i) => (
                <Reveal as="li" key={s.t} delay={i * 120} className="card relative p-6 pt-10 text-center">
                  <span className="absolute -top-7 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border-[3px] border-ink bg-coral font-display text-2xl font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="inline-block animate-bob text-5xl" style={{ animationDelay: `${i * 0.5}s` }} aria-hidden="true">
                    {s.e}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold">{s.t}</h3>
                  <p className="mt-2 text-ink-soft">{s.d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
        <Wave color="#ffd23f" flip />
      </section>

      {/* KATEGORIER */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <Reveal>
          <h2 className="text-center text-4xl font-bold sm:text-5xl">Hvilken slags ven har du brug for?</h2>
        </Reveal>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c, i) => {
            const n = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Reveal as="li" key={c.id} delay={i * 70}>
                <Link
                  href={`/tjenester?kategori=${c.slug}`}
                  className="group card flex h-full flex-col items-center p-5 text-center transition hover:-translate-y-1 hover:bg-[#fff3b0]"
                >
                  <span className="text-5xl transition group-hover:animate-wiggle" aria-hidden="true">
                    {c.emoji}
                  </span>
                  <h3 className="mt-3 text-xl font-bold">{c.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
                  <span className="mt-auto pt-3 text-sm font-bold text-coral">{n} tjenester →</span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* LYKKEHJUL */}
      <section className="mx-auto max-w-5xl px-4 pt-24">
        <Reveal>
          <SurpriseWheel items={products.map((p) => ({ slug: p.slug, name: p.name, emoji: p.emoji, color: p.color }))} />
        </Reveal>
      </section>

      {/* OPLEVELSER */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold text-coral">Se venskaberne leve</p>
            <h2 className="text-4xl font-bold sm:text-5xl">Oplevelser 🎡</h2>
          </div>
          <Link href="/oplevelser" className="btn btn-sun">
            Alle oplevelser →
          </Link>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {EXPERIENCES.map((e, i) => (
            <Reveal as="li" key={e.slug} delay={(i % 5) * 60}>
              <Link
                href={`/oplevelser/${e.slug}`}
                className="group card flex h-full flex-col items-center p-4 text-center transition hover:-translate-y-1"
                style={{ background: `color-mix(in srgb, ${e.color} 30%, white)` }}
              >
                <span className="text-4xl transition group-hover:animate-wiggle" aria-hidden="true">
                  {e.emoji}
                </span>
                <span className="mt-2 font-display font-bold leading-tight">{e.title}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ANMELDELSER */}
      {testimonials.length > 0 && (
        <section className="relative mt-24 overflow-hidden bg-[#ffe5ec] py-20">
          <DriftingClouds count={3} faces={false} />
          <div className="relative z-10 mx-auto max-w-6xl px-4">
            <Reveal className="text-center">
              <h2 className="text-4xl font-bold sm:text-5xl">Det siger mine nye venner 🥰</h2>
            </Reveal>
            <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal as="li" key={t.id} delay={(i % 3) * 100}>
                  <TestimonialCard t={t} showProduct index={i} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* HVEM / HVORFOR */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-24 md:grid-cols-2">
        <Reveal>
          <Link href="/om-villads" className="group card flex h-full flex-col overflow-hidden">
            <div className="relative aspect-[4/3] border-b-[3px] border-ink">
              <Image
                src="/images/site/villads.jpg"
                alt="Villads Claes smiler"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h2 className="text-3xl font-bold">Hvem er jeg? 🙋‍♂️</h2>
              <p className="mt-2 text-lg text-ink-soft">Lær mig at kende, inden du bliver min ven.</p>
            </div>
          </Link>
        </Reveal>
        <Reveal delay={120}>
          <Link href="/om-venskaber" className="group card flex h-full flex-col overflow-hidden">
            <div className="relative aspect-[4/3] border-b-[3px] border-ink">
              <Image
                src="/images/site/venskaber-0.jpg"
                alt="Venner der fjoller sammen"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h2 className="text-3xl font-bold">Hvorfor sælge venskaber? 🤔</h2>
              <p className="mt-2 text-lg text-ink-soft">Hvad kan du få ud af det her postmoderne pis?</p>
            </div>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
