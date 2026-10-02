import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { formatKr } from "@/lib/money";
import { SOLD_STATUSES } from "@/lib/queries";

export default async function CustomersPage() {
  const rows = await db
    .select({
      id: s.customers.id,
      name: s.customers.name,
      nickname: s.customers.nickname,
      email: s.customers.email,
      phone: s.customers.phone,
      orders: sql<number>`count(${s.orders.id})`,
      spent: sql<number>`coalesce(sum(case when ${inArray(s.orders.status, [...SOLD_STATUSES])} then ${s.orders.total} end), 0)`,
      lastOrder: sql<number | null>`max(${s.orders.createdAt})`,
    })
    .from(s.customers)
    .leftJoin(s.orders, eq(s.orders.customerId, s.customers.id))
    .groupBy(s.customers.id)
    .orderBy(desc(sql`max(${s.orders.createdAt})`));

  return (
    <div>
      <AdminTitle sub={`${rows.length} venner i alt`}>Kunder 🤝</AdminTitle>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-4 py-2">Navn</th>
              <th className="px-4 py-2">Kontakt</th>
              <th className="px-4 py-2 text-right">Ordrer</th>
              <th className="px-4 py-2 text-right">Købt for</th>
              <th className="px-4 py-2">Seneste ordre</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  Ingen kunder endnu 🌱
                </td>
              </tr>
            )}
            {rows.map((c, i) => (
              <tr key={c.id} className={i % 2 ? "bg-cream/60" : "bg-white"}>
                <td className="px-4 py-2">
                  <Link href={`/admin/kunder/${c.id}`} className="font-bold underline">
                    {c.name}
                  </Link>
                  {c.nickname && <span className="text-ink-soft"> ({c.nickname})</span>}
                </td>
                <td className="px-4 py-2">
                  {c.email && <span className="block">{c.email}</span>}
                  {c.phone && <span className="block">{c.phone}</span>}
                </td>
                <td className="px-4 py-2 text-right font-bold">{Number(c.orders)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-display font-bold">
                  {formatKr(Number(c.spent))}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  {c.lastOrder ? formatDate(new Date(Number(c.lastOrder) * 1000), false) : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
