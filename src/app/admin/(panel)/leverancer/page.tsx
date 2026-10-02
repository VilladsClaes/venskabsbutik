import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";

export default async function DeliveriesAdmin() {
  const list = await db.query.deliveries.findMany({
    orderBy: desc(s.deliveries.deliveredAt),
    with: { product: { columns: { name: true, emoji: true } }, order: { columns: { orderNumber: true } } },
  });
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminTitle sub="Skriv ned hvad du har leveret – så dukker det op på bænkekortet, himmelglobussen, væggen og tællerne">
          Leveringsdagbog 📔
        </AdminTitle>
        <Link href="/admin/leverancer/ny" className="btn btn-coral">
          + Ny levering
        </Link>
      </div>
      {list.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-5xl" aria-hidden="true">🪑</p>
          <p className="mt-2 font-display text-xl font-bold">Dagbogen er tom</p>
          <p className="text-ink-soft">Næste gang du sidder på en bænk, så tryk “Ny levering” på mobilen og “Brug min position”.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-2">Hvad</th>
                <th className="px-4 py-2">Tjeneste</th>
                <th className="px-4 py-2">Til</th>
                <th className="px-4 py-2">Sted</th>
                <th className="px-4 py-2">Dato</th>
                <th className="px-4 py-2">Synlig</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d, i) => (
                <tr key={d.id} className={i % 2 ? "bg-cream/60" : "bg-white"}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/leverancer/${d.id}`} className="font-bold underline">
                      {d.photoUrl ? "📸 " : ""}
                      {d.title}
                    </Link>
                    {d.order && <span className="block text-xs text-ink-soft">{d.order.orderNumber}</span>}
                  </td>
                  <td className="px-4 py-2">{d.product ? `${d.product.emoji} ${d.product.name}` : "–"}</td>
                  <td className="px-4 py-2">{d.dedicatedTo ?? "–"}</td>
                  <td className="px-4 py-2">{d.lat != null ? `📍 ${d.placeName ?? "på kortet"}` : (d.placeName ?? "–")}</td>
                  <td className="whitespace-nowrap px-4 py-2">{formatDate(d.deliveredAt, false)}</td>
                  <td className="px-4 py-2">{d.isPublic ? "🟢" : "⚪"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
