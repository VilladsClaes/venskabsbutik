import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { SOLD_STATUSES } from "./queries";

export async function getDashboard() {
  const sold = inArray(s.orders.status, [...SOLD_STATUSES]);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const sixMonthsAgo = new Date(monthStart);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  const [[totals], [month], [pending], [customers], [pendingReviews], perMonth, topProducts, recent] =
    await Promise.all([
      db.select({ revenue: sql<number>`coalesce(sum(${s.orders.total}),0)`, n: sql<number>`count(*)` }).from(s.orders).where(sold),
      db
        .select({ revenue: sql<number>`coalesce(sum(${s.orders.total}),0)`, n: sql<number>`count(*)` })
        .from(s.orders)
        .where(and(sold, gte(s.orders.createdAt, monthStart))),
      db
        .select({ n: sql<number>`count(*)`, sum: sql<number>`coalesce(sum(${s.orders.total}),0)` })
        .from(s.orders)
        .where(eq(s.orders.status, "afventer_betaling")),
      db.select({ n: sql<number>`count(*)` }).from(s.customers),
      db.select({ n: sql<number>`count(*)` }).from(s.testimonials).where(eq(s.testimonials.status, "pending")),
      db
        .select({
          month: sql<string>`strftime('%Y-%m', ${s.orders.createdAt}, 'unixepoch', 'localtime')`,
          revenue: sql<number>`sum(${s.orders.total})`,
          n: sql<number>`count(*)`,
        })
        .from(s.orders)
        .where(and(sold, gte(s.orders.createdAt, sixMonthsAgo)))
        .groupBy(sql`1`),
      db
        .select({
          productId: s.orderItems.productId,
          name: s.orderItems.productName,
          qty: sql<number>`sum(${s.orderItems.quantity})`,
          revenue: sql<number>`sum(${s.orderItems.lineTotal})`,
        })
        .from(s.orderItems)
        .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
        .where(sold)
        .groupBy(s.orderItems.productId, s.orderItems.productName)
        .orderBy(desc(sql`sum(${s.orderItems.lineTotal})`))
        .limit(8),
      db.query.orders.findMany({
        orderBy: desc(s.orders.createdAt),
        limit: 8,
        with: { customer: { columns: { name: true } } },
      }),
    ]);

  // Udfyld måneder uden salg, så grafen altid viser 6 søjler
  const months: { key: string; label: string; revenue: number; n: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = perMonth.find((r) => r.month === key);
    months.push({
      key,
      label: d.toLocaleDateString("da-DK", { month: "short" }),
      revenue: Number(row?.revenue ?? 0),
      n: Number(row?.n ?? 0),
    });
  }

  return {
    revenue: Number(totals.revenue),
    orders: Number(totals.n),
    monthRevenue: Number(month.revenue),
    monthOrders: Number(month.n),
    pendingOrders: Number(pending.n),
    pendingAmount: Number(pending.sum),
    customers: Number(customers.n),
    pendingReviews: Number(pendingReviews.n),
    months,
    topProducts: topProducts.map((t) => ({ ...t, qty: Number(t.qty), revenue: Number(t.revenue) })),
    recent,
  };
}
