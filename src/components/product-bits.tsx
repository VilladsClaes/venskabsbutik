import Image from "next/image";
import Link from "next/link";
import { formatKr, priceCode } from "@/lib/money";
import type { ShopProduct } from "@/lib/queries";

/** Produktbillede – eller en farverig emoji-illustration hvis der endnu ikke er et foto */
export function ProductVisual({
  image,
  emoji,
  color,
  alt,
  sizes = "(max-width: 640px) 100vw, 33vw",
  priority = false,
  className = "",
}: {
  image?: string | null;
  emoji: string;
  color: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (image) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ background: color }}>
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={image.endsWith(".gif")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }
  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 30% 25%, #ffffffaa, transparent 55%), ${color}` }}
      role="img"
      aria-label={alt}
    >
      <span className="absolute left-4 top-3 text-2xl opacity-60">✨</span>
      <span className="absolute bottom-4 right-5 text-xl opacity-60">💛</span>
      <span className="text-7xl drop-shadow-[0_4px_0_rgba(43,45,66,0.35)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
        {emoji}
      </span>
    </div>
  );
}

export function PriceLabel({ product }: { product: Pick<ShopProduct, "priceKind" | "price" | "fromPrice" | "hasVariantPrices" | "unitLabel" | "priceEndsWith" | "recurringLabel"> }) {
  if (product.priceKind === "custom")
    return (
      <span>
        Du vælger · slutter på ,{String(product.priceEndsWith ?? 0).padStart(2, "0")}
      </span>
    );
  return (
    <span>
      {product.hasVariantPrices && "fra "}
      {formatKr(product.fromPrice)}
      {product.priceKind === "per_unit" && product.unitLabel && ` pr. ${product.unitLabel}`}
      {product.recurringLabel && ` ${product.recurringLabel}`}
    </span>
  );
}

export function ProductCard({ product, index = 0 }: { product: ShopProduct; index?: number }) {
  const tilt = ["-rotate-1", "rotate-1", "rotate-0", "-rotate-[0.5deg]"][index % 4];
  return (
    <Link
      href={`/tjenester/${product.slug}`}
      className={`group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[0_10px_0_0_rgba(43,45,66,0.9)] ${tilt}`}
    >
      <ProductVisual
        image={product.image}
        emoji={product.emoji}
        color={product.color}
        alt={product.name}
        className="aspect-[4/3] border-b-[3px] border-ink"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-coral">
          <span aria-hidden="true">{product.emoji} </span>
          {product.tagline}
        </p>
        <h3 className="font-display text-xl font-bold leading-tight">{product.name}</h3>
        <p className="text-ink-soft">{product.summary}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 font-display font-bold">
            <PriceLabel product={product} />
          </span>
          {product.sold > 0 && (
            <span className="text-sm font-semibold text-ink-soft">🔥 {product.sold} solgt</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Den oprindelige ide: prisen er også varenummeret */
export function PriceCodeBadge({ price }: { price: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-ink-soft ring-2 ring-ink/20">
      Varenr. {priceCode(price)}
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sun-deep" aria-label={`${rating} ud af 5 stjerner`}>
      {"★".repeat(rating)}
      <span className="text-ink/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function TestimonialCard({
  t,
  showProduct = false,
  index = 0,
}: {
  t: {
    authorName: string;
    text: string;
    emoji: string;
    rating: number;
    isSample: boolean;
    product?: { slug: string; name: string; emoji: string } | null;
  };
  showProduct?: boolean;
  index?: number;
}) {
  const bg = ["bg-white", "bg-[#fff3b0]", "bg-[#d8f3dc]", "bg-[#ffe5ec]", "bg-[#e0f0ff]"][index % 5];
  return (
    <figure className={`card relative flex h-full flex-col gap-3 p-5 ${bg}`}>
      <span
        className="absolute -right-3 -top-4 grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink bg-sun text-2xl animate-bob"
        style={{ animationDelay: `${index * 0.4}s` }}
        aria-hidden="true"
      >
        {t.emoji}
      </span>
      <Stars rating={t.rating} />
      <blockquote className="flex-1 text-lg leading-snug">“{t.text}”</blockquote>
      <figcaption className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span>– {t.authorName}</span>
        {showProduct && t.product && (
          <Link href={`/tjenester/${t.product.slug}`} className="text-coral hover:underline">
            om {t.product.name}
          </Link>
        )}
        {t.isSample && (
          <span
            className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-bold text-ink-soft"
            title="Eksempeltekst – erstattes af rigtige anmeldelser"
          >
            eksempel
          </span>
        )}
      </figcaption>
    </figure>
  );
}
