import type { Metadata } from "next";
import { ProductBrowser } from "@/components/product-browser";
import { DriftingClouds } from "@/components/sky";
import { getCategories, getShopProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Alle venskabstjenester",
  description: "Alle tjenesterne er elementer af venskaber. Ting som jeg faktisk vil gøre for dig.",
};

export default async function ServicesPage({ searchParams }: PageProps<"/tjenester">) {
  const { kategori } = await searchParams;
  const [products, categories] = await Promise.all([getShopProducts(), getCategories()]);
  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-ink bg-gradient-to-b from-sky to-cream">
        <DriftingClouds count={4} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-6xl animate-float" aria-hidden="true">🎁</p>
          <h1 className="mt-2 text-5xl font-bold sm:text-6xl">Venskabstjenesterne</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold">
            Alle tjenesterne er elementer af venskaber. Ting som jeg faktisk vil gøre for dig. Undervejs vil du opdage,
            at jeg er en reel ven. Du kan stole på mig, regne med mig, bruge mig i dit liv. Når du har brug for mig, så
            er jeg der <span className="whitespace-nowrap">(mod betaling)</span>. 😇
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ProductBrowser
          products={products}
          categories={categories}
          initialCategory={typeof kategori === "string" ? kategori : undefined}
        />
      </div>
    </>
  );
}
