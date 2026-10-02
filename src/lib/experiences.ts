import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { SOLD_STATUSES } from "./queries";

export type PublicDelivery = Awaited<ReturnType<typeof getPublicDeliveries>>[number];

/** Offentlige leverancer fra dagbogen, evt. kun for bestemte tjenester */
export async function getPublicDeliveries(slugs?: string[]) {
  const products = slugs
    ? await db.query.products.findMany({ where: inArray(s.products.slug, slugs), columns: { id: true } })
    : [];
  const rows = await db.query.deliveries.findMany({
    where: and(
      eq(s.deliveries.isPublic, true),
      slugs ? inArray(s.deliveries.productId, products.length ? products.map((p) => p.id) : [-1]) : undefined,
    ),
    orderBy: desc(s.deliveries.deliveredAt),
    with: { product: { columns: { slug: true, name: true, emoji: true, color: true } } },
  });
  // Send kun det, der må vises offentligt
  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    note: d.note,
    dedicatedTo: d.dedicatedTo,
    placeName: d.placeName,
    lat: d.lat,
    lng: d.lng,
    photoUrl: d.photoUrl,
    amount: d.amount,
    deliveredAt: d.deliveredAt.toISOString(),
    product: d.product,
  }));
}

/** Antal solgte og omsætning for bestemte tjenester (kun betalte ordrer, uden bonusser) */
export async function getSalesFor(slugs: string[]) {
  const rows = await db
    .select({
      slug: s.products.slug,
      qty: sql<number>`coalesce(sum(${s.orderItems.quantity}), 0)`,
      revenue: sql<number>`coalesce(sum(${s.orderItems.lineTotal}), 0)`,
    })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
    .innerJoin(s.products, eq(s.products.id, s.orderItems.productId))
    .where(
      and(
        inArray(s.orders.status, [...SOLD_STATUSES]),
        inArray(s.products.slug, slugs),
        eq(s.orderItems.isBonus, false),
      ),
    )
    .groupBy(s.products.slug);
  return Object.fromEntries(rows.map((r) => [r.slug, { qty: Number(r.qty), revenue: Number(r.revenue) }])) as Record<
    string,
    { qty: number; revenue: number } | undefined
  >;
}

/** Seneste køb fra folk, der har sagt ja til at blive nævnt – til live-tickeren */
export async function getRecentMentions(limit = 12) {
  const rows = await db
    .select({
      nickname: s.customers.nickname,
      name: s.customers.name,
      product: s.orderItems.productName,
      slug: s.products.slug,
      emoji: s.products.emoji,
      at: s.orders.paidAt,
      giftRecipient: s.orders.giftRecipient,
      isGift: s.orders.isGift,
    })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
    .innerJoin(s.customers, eq(s.customers.id, s.orders.customerId))
    .leftJoin(s.products, eq(s.products.id, s.orderItems.productId))
    .where(
      and(inArray(s.orders.status, [...SOLD_STATUSES]), eq(s.customers.allowMention, true), eq(s.orderItems.isBonus, false)),
    )
    .orderBy(desc(s.orders.paidAt))
    .limit(limit);
  return rows.map((r) => ({
    who: r.nickname || r.name.split(" ")[0],
    product: r.product,
    slug: r.slug,
    emoji: r.emoji ?? "💛",
    at: r.at?.toISOString() ?? null,
    gift: r.isGift,
  }));
}
