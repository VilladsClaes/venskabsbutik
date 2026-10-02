import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { Gallery } from "@/components/gallery";
import { PriceCodeBadge, ProductCard, Stars, TestimonialCard } from "@/components/product-bits";
import { Reveal } from "@/components/reveal";
import { ShareBar } from "@/components/share";
import { DriftingClouds } from "@/components/sky";
import { TestimonialForm } from "@/components/testimonial-form";
import { YouTube } from "@/components/youtube";
import { getProductBySlug, getShopProducts } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

function lowestPrice(p: { price: number; variants: { price: number | null }[] }) {
  const prices = p.variants.map((v) => v.price ?? p.price);
  return { low: prices.length ? Math.min(...prices) : p.price, high: prices.length ? Math.max(...prices) : p.price };
}

export async function generateMetadata({ params }: PageProps<"/tjenester/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const url = `${SITE}/tjenester/${p.slug}`;
  const { low } = lowestPrice(p);
  const image = { url: `${SITE}/og/${p.slug}`, width: 1200, height: 630, alt: `${p.name} – ${p.tagline}` };
  return {
    title: `${p.name} – ${p.tagline}`,
    description: p.summary,
    alternates: { canonical: url },
    openGraph: { title: `${p.emoji} ${p.name}`, description: p.summary, url, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: `${p.emoji} ${p.name}`, description: p.summary, images: [image.url] },
    other: { "product:price:amount": (low / 100).toFixed(2), "product:price:currency": "DKK" },
  };
}

export default async function ProductPage({ params }: PageProps<"/tjenester/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = product.media.filter((m) => m.kind === "image");
  const videos = product.media.filter((m) => m.kind === "youtube");
  const related = (await getShopProducts())
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 4);
  const reviews = product.testimonials;
  const avg = reviews.length ? Math.round(reviews.reduce((n, t) => n + t.rating, 0) / reviews.length) : 0;
  const url = `${SITE}/tjenester/${product.slug}`;
  const { low, high } = lowestPrice(product);
  const photo = images.find((m) => !m.isExample)?.url;

  // Strukturerede produktdata (schema.org) – læses af Google, Ønskeskyen og andre ønskeliste-tjenester.
  // Kun rigtige anmeldelser tælles med, ikke eksempelteksterne.
  const realReviews = reviews.filter((t) => !t.isSample);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    url,
    image: [`${SITE}/og/${product.slug}`, ...(photo ? [`${SITE}${photo}`] : [])],
    sku: product.slug,
    brand: { "@type": "Brand", name: "Venskabsbutikken" },
    category: product.category?.name,
    offers:
      product.priceKind === "custom" || low === high
        ? {
            "@type": "Offer",
            price: (low / 100).toFixed(2),
            priceCurrency: "DKK",
            availability: "https://schema.org/InStock",
            url,
          }
        : {
            "@type": "AggregateOffer",
            lowPrice: (low / 100).toFixed(2),
            highPrice: (high / 100).toFixed(2),
            offerCount: product.variants.length,
            priceCurrency: "DKK",
            availability: "https://schema.org/InStock",
            url,
          },
    ...(realReviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (realReviews.reduce((n, t) => n + t.rating, 0) / realReviews.length).toFixed(1),
            reviewCount: realReviews.length,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify + escape af "<" forhindrer at indhold kan bryde ud af script-tagget
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${product.color}55, #fff8e7 70%)` }}>
        <DriftingClouds count={3} />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-6">
          <nav aria-label="Brødkrummer" className="text-sm font-semibold text-ink-soft">
            <Link href="/tjenester" className="hover:underline">
              Tjenester
            </Link>
            {product.category && (
              <>
                {" "}/{" "}
                <Link href={`/tjenester?kategori=${product.category.slug}`} className="hover:underline">
                  {product.category.emoji} {product.category.name}
                </Link>
              </>
            )}
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <Gallery
              images={images.map((m) => ({ url: m.url, alt: m.alt, caption: m.caption, isExample: m.isExample }))}
              emoji={product.emoji}
              color={product.color}
              name={product.name}
            />

            <div>
              <p className="inline-flex animate-pop-in items-center gap-2 rounded-full border-[3px] border-ink bg-white px-3 py-1 font-display font-semibold">
                <span aria-hidden="true">{product.emoji}</span> {product.tagline}
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{product.headline}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink-soft">
                <PriceCodeBadge price={product.price} />
                {reviews.length > 0 && (
                  <a href="#anmeldelser" className="hover:underline">
                    <Stars rating={avg} /> {reviews.length} {reviews.length === 1 ? "anmeldelse" : "anmeldelser"}
                  </a>
                )}
                {product.sold > 0 && <span>🔥 {product.sold} solgt</span>}
              </div>
              <p className="mt-5 text-xl font-semibold">{product.summary}</p>

              <div className="mt-6">
                <AddToCart
                  product={{
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    emoji: product.emoji,
                    color: product.color,
                    image: images[0]?.url,
                    priceKind: product.priceKind,
                    price: product.price,
                    unitLabel: product.unitLabel,
                    priceEndsWith: product.priceEndsWith,
                    minPrice: product.minPrice,
                    recurringLabel: product.recurringLabel,
                    variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
                  }}
                />
              </div>
              {product.delivery && (
                <p className="mt-4 flex gap-2 font-semibold">
                  <span aria-hidden="true">🚚</span> {product.delivery}
                </p>
              )}
              <div className="mt-6">
                <ShareBar
                  url={url}
                  title={`${product.name} – Venskabsbutikken`}
                  text={`${product.emoji} ${product.tagline}! Se “${product.name}” i Venskabsbutikken`}
                  image={`${SITE}/og/${product.slug}`}
                  slug={product.slug}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <h2 className="text-3xl font-bold">Hvad får du? 🎁</h2>
          <div className="mt-4 space-y-4 text-lg leading-relaxed">
            {product.description.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Reveal>
        <div className="space-y-6">
          {product.goodFor.length > 0 && (
            <Reveal className="card rotate-1 bg-[#fff3b0] p-5">
              <h2 className="text-2xl font-bold">Godt til … 👍</h2>
              <ul className="mt-3 space-y-2">
                {product.goodFor.map((g) => (
                  <li key={g} className="flex gap-2 font-semibold">
                    <span aria-hidden="true">✅</span> {g}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {product.finePrint && (
            <Reveal className="card -rotate-1 bg-[#e0f0ff] p-5" delay={100}>
              <h2 className="text-2xl font-bold">Med småt 🔍</h2>
              <p className="mt-2">{product.finePrint}</p>
            </Reveal>
          )}
        </div>
      </section>

      {videos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <Reveal>
            <h2 className="text-3xl font-bold">Se det i aktion 🎬</h2>
          </Reveal>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {videos.map((v, i) => (
              <Reveal key={v.id} delay={i * 100}>
                <YouTube id={v.url} title={v.caption || product.name} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section id="anmeldelser" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16">
        <Reveal>
          <h2 className="text-3xl font-bold">Det siger mine venner 💬</h2>
        </Reveal>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {reviews.length > 0 ? (
            <ul className="grid gap-7 sm:grid-cols-2">
              {reviews.map((t, i) => (
                <Reveal as="li" key={t.id} delay={(i % 2) * 100}>
                  <TestimonialCard t={t} index={i} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="card grid place-items-center p-10 text-center">
              <p className="text-5xl" aria-hidden="true">🌱</p>
              <p className="mt-2 font-display text-xl font-bold">Bliv den første til at anmelde!</p>
            </div>
          )}
          <TestimonialForm productId={product.id} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <Reveal>
            <h2 className="text-3xl font-bold">Andre venskaber du måske kan lide 💛</h2>
          </Reveal>
          <ul className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 80}>
                <ProductCard product={p} index={i} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
