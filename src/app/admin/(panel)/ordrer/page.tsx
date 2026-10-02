import Link from "next/link";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { AdminTitle, OrderTable } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { STATUS_INFO } from "@/lib/order-status";

export default async function OrdersPage({ searchParams }: PageProps<"/admin/ordrer">) {
  const { status, q } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const search = typeof q === "string" ? q.trim() : "";

  const counts = await db
    .select({ status: s.orders.status, n: sql<number>`count(*)` })
    .from(s.orders)
    .groupBy(s.orders.status);
  const countOf = (st: string) => Number(counts.find((c) => c.status === st)?.n ?? 0);

  const orders = await db.query.orders.findMany({
    where: (o, { and }) =>
      and(
        filter ? eq(o.status, filter) : undefined,
        search
          ? or(
              like(o.orderNumber, `%${search}%`),
              sql`${o.customerId} in (select id from customers where name like ${`%${search}%`} or email like ${`%${search}%`} or phone like ${`%${search}%`})`,
            )
          : undefined,
      ),
    orderBy: desc(s.orders.createdAt),
    limit: 200,
    with: { customer: { columns: { name: true } } },
  });

  const tab = (active: boolean) =>
    `whitespace-nowrap rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${active ? "bg-ink text-white" : "bg-white"}`;

  return (
    <div>
      <AdminTitle sub="Markér ordrer som betalt, når MobilePay-overførslen er modtaget">Ordrer 🧾</AdminTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/admin/ordrer" className={tab(!filter)}>
          Alle ({counts.reduce((n, c) => n + Number(c.n), 0)})
        </Link>
        {ORDER_STATUSES.map((st) => (
          <Link key={st} href={`/admin/ordrer?status=${st}`} className={tab(filter === st)}>
            {STATUS_INFO[st].emoji} {STATUS_INFO[st].label} ({countOf(st)})
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {filter && <input type="hidden" name="status" value={filter} />}
          <input name="q" defaultValue={search} placeholder="Søg ordre, navn, tlf …" className="input !w-56 !py-1.5" />
          <button className="btn btn-white !py-1.5">Søg</button>
        </form>
      </div>
      <div className="card overflow-hidden">
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
