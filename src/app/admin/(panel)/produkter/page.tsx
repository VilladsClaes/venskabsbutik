import Link from "next/link";
import { asc } from "drizzle-orm";
import { toggleProduct } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { formatKr, priceCode } from "@/lib/money";
import { getSoldCounts } from "@/lib/queries";

export default async function ProductsAdmin() {
  const [products, sold] = await Promise.all([
    db.query.products.findMany({
      orderBy: [asc(s.products.sortOrder), asc(s.products.id)],
      with: { category: true, variants: { columns: { id: true } }, media: { columns: { id: true } } },
    }),
    getSoldCounts(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminTitle sub={`${products.length} tjenester · ${products.filter((p) => p.active).length} aktive`}>
          Produkter 🎁
        </AdminTitle>
        <Link href="/admin/produkter/ny" className="btn btn-coral">
          + Nyt produkt
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-4 py-2">Tjeneste</th>
              <th className="px-4 py-2">Kategori</th>
              <th className="px-4 py-2 text-right">Pris</th>
              <th className="px-4 py-2 text-right">Solgt</th>
              <th className="px-4 py-2 text-center">Udvalgt</th>
              <th className="px-4 py-2 text-center">Aktiv</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className={`${i % 2 ? "bg-cream/60" : "bg-white"} ${p.active ? "" : "opacity-50"}`}>
                <td className="px-4 py-2">
                  <Link href={`/admin/produkter/${p.id}`} className="font-bold underline">
                    {p.emoji} {p.name}
                  </Link>
                  <span className="block text-xs text-ink-soft">
                    {p.variants.length} varianter · {p.media.length} medier
                  </span>
                </td>
                <td className="px-4 py-2">{p.category ? `${p.category.emoji} ${p.category.name}` : "–"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-display font-bold">
                  {p.priceKind === "custom" ? `*,${String(p.priceEndsWith ?? 0).padStart(2, "0")}` : formatKr(p.price)}
                  <span className="block text-xs font-normal text-ink-soft">varenr. {priceCode(p.price)}</span>
                </td>
                <td className="px-4 py-2 text-right font-bold">{sold.get(p.id) ?? 0}</td>
                <td className="px-4 py-2 text-center">
                  <form action={toggleProduct.bind(null, p.id, "featured")}>
                    <button aria-label={p.featured ? "Fjern fra udvalgte" : "Gør til udvalgt"} className="text-xl">
                      {p.featured ? "⭐" : "☆"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-center">
                  <form action={toggleProduct.bind(null, p.id, "active")}>
                    <button aria-label={p.active ? "Deaktivér" : "Aktivér"} className="text-xl">
                      {p.active ? "🟢" : "⚪"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
