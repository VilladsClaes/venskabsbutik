"use client";

import Link from "next/link";
import type { ShopProduct } from "@/lib/queries";
import { formatKr } from "@/lib/money";
import { ProductCard } from "./product-bits";
import { ShareBar } from "./share";
import { useWishlist } from "./wishlist";

export function WishlistView({
  products,
  sharedSlugs,
  siteUrl,
}: {
  products: ShopProduct[];
  /** Slugs fra et delt link (?liste=...). Hvis sat, vises en vens ønskeliste. */
  sharedSlugs: string[] | null;
  siteUrl: string;
}) {
  const wishlist = useWishlist();
  const shared = sharedSlugs !== null;
  const slugs = shared ? sharedSlugs : wishlist.slugs;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = slugs.map((s) => bySlug.get(s)).filter((p): p is ShopProduct => !!p);
  const total = items.reduce((n, p) => n + p.fromPrice, 0);

  if (!shared && !wishlist.ready) return <p className="py-20 text-center text-2xl">⏳</p>;

  if (items.length === 0)
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <p className="animate-float text-7xl" aria-hidden="true">🤍</p>
        <h2 className="mt-4 text-3xl font-bold">{shared ? "Ønskelisten er tom" : "Din ønskeliste er tom"}</h2>
        <p className="mt-2 text-ink-soft">
          Tryk på “Gem på min ønskeliste” på en tjeneste, så samler jeg dem her – klar til at dele.
        </p>
        <Link href="/tjenester" className="btn btn-coral mt-6">
          Find noget at ønske dig 🎁
        </Link>
      </div>
    );

  const shareUrl = `${siteUrl}/oenskeliste?liste=${items.map((p) => p.slug).join(",")}`;

  return (
    <div className="space-y-10">
      {shared ? (
        <div className="card bg-[#fff3b0] p-6 text-center">
          <p className="font-display text-2xl font-bold">🎁 Nogen ønsker sig venskab!</p>
          <p className="mt-1">
            Her er {items.length} venskabsfragmenter, din ven drømmer om. Køb et som gave – eller gem dem på din egen
            liste.
          </p>
        </div>
      ) : (
        <ShareBar
          url={shareUrl}
          title="Min ønskeliste i Venskabsbutikken"
          text={`Jeg ønsker mig venskab! 💛 Se min ønskeliste med ${items.length} ting fra Venskabsbutikken`}
        />
      )}

      <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <li key={p.id} className="relative animate-pop-in" style={{ animationDelay: `${i * 50}ms` }}>
            <ProductCard product={p} index={i} />
            {shared ? (
              !wishlist.has(p.slug) && (
                <button
                  type="button"
                  onClick={() => wishlist.toggle(p.slug)}
                  className="btn btn-white absolute -right-2 -top-3 !px-3 !py-1 text-sm"
                >
                  🤍 Gem
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => wishlist.remove(p.slug)}
                className="btn btn-white absolute -right-2 -top-3 !px-3 !py-1 text-sm"
                aria-label={`Fjern ${p.name} fra ønskelisten`}
              >
                ✖ Fjern
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="text-center font-display text-xl font-bold">
        Hele listen fra {formatKr(total)} 💛
      </p>
    </div>
  );
}
