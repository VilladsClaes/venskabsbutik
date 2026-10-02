import type { Metadata } from "next";
import { Checkout, type CatalogEntry } from "@/components/checkout";
import { db } from "@/db";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Din kurv", robots: { index: false } };

export default async function CartPage() {
  const [products, settings] = await Promise.all([
    db.query.products.findMany({
      columns: { id: true, active: true, priceKind: true, price: true },
      with: {
        variants: { columns: { id: true, price: true, active: true } },
        questions: { orderBy: (q, { asc }) => asc(q.sortOrder) },
      },
    }),
    getSettings(),
  ]);
  const catalog: Record<number, CatalogEntry> = Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        active: p.active,
        priceKind: p.priceKind,
        price: p.price,
        variants: p.variants.filter((v) => v.active).map((v) => ({ id: v.id, price: v.price })),
        questions: p.questions.map((q) => ({ id: q.id, label: q.label, kind: q.kind, required: q.required })),
      },
    ]),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-5xl font-bold">
        Din kurv <span className="inline-block animate-float" aria-hidden="true">🧺</span>
      </h1>
      <Checkout catalog={catalog} mobilepay={settings.mobilepayNumber ?? "60614309"} />
    </div>
  );
}
