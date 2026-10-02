import type { Metadata } from "next";
import { DriftingClouds } from "@/components/sky";
import { WishlistView } from "@/components/wishlist-view";
import { getShopProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ønskeliste",
  description: "Venskabsfragmenter jeg ønsker mig – køb ét som gave!",
};

export default async function WishlistPage({ searchParams }: PageProps<"/oenskeliste">) {
  const { liste } = await searchParams;
  const shared =
    typeof liste === "string"
      ? liste
          .split(",")
          .map((s) => s.trim())
          .filter((s) => /^[a-z0-9-]+$/.test(s))
          .slice(0, 50)
      : null;
  const products = await getShopProducts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.villadsclaes.dk";

  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-ink bg-gradient-to-b from-[#ffe5ec] to-cream">
        <DriftingClouds count={3} />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-14 text-center">
          <p className="animate-float text-6xl" aria-hidden="true">💖</p>
          <h1 className="mt-2 text-5xl font-bold sm:text-6xl">{shared ? "En vens ønskeliste" : "Min ønskeliste"}</h1>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <WishlistView products={products} sharedSlugs={shared} siteUrl={siteUrl} />
      </div>
    </>
  );
}
