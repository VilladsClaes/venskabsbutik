import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** Ordrestatusser der tæller som et salg */
export const SOLD_STATUSES = ["betalt", "i_gang", "leveret"] as const;

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(s.settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSoldCounts(): Promise<Map<number, number>> {
  const rows = await db
    .select({ productId: s.orderItems.productId, sold: sql<number>`sum(${s.orderItems.quantity})` })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
    .where(inArray(s.orders.status, [...SOLD_STATUSES]))
    .groupBy(s.orderItems.productId);
  return new Map(rows.filter((r) => r.productId != null).map((r) => [r.productId!, Number(r.sold)]));
}

export async function getCategories() {
  return db.query.categories.findMany({ orderBy: asc(s.categories.sortOrder) });
}

export type ShopProduct = Awaited<ReturnType<typeof getShopProducts>>[number];

export async function getShopProducts() {
  const [rows, sold] = await Promise.all([
    db.query.products.findMany({
      where: eq(s.products.active, true),
      orderBy: [asc(s.products.sortOrder), asc(s.products.id)],
      with: {
        category: true,
        media: { where: eq(s.productMedia.kind, "image"), orderBy: asc(s.productMedia.sortOrder), limit: 1 },
        variants: { where: eq(s.productVariants.active, true), columns: { price: true } },
      },
    }),
    getSoldCounts(),
  ]);
  return rows.map((p) => {
    const variantPrices = p.variants.map((v) => v.price ?? p.price);
    return {
      ...p,
      image: p.media[0]?.url as string | undefined,
      fromPrice: variantPrices.length ? Math.min(...variantPrices) : p.price,
      hasVariantPrices: new Set(variantPrices).size > 1,
      sold: sold.get(p.id) ?? 0,
    };
  });
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(s.products.slug, slug), eq(s.products.active, true)),
    with: {
      category: true,
      variants: { where: eq(s.productVariants.active, true), orderBy: asc(s.productVariants.sortOrder) },
      media: { orderBy: asc(s.productMedia.sortOrder) },
      questions: { orderBy: asc(s.productQuestions.sortOrder) },
      testimonials: {
        where: eq(s.testimonials.status, "published"),
        orderBy: [asc(s.testimonials.isSample), desc(s.testimonials.createdAt)],
      },
    },
  });
  if (!product) return null;
  const sold = (await getSoldCounts()).get(product.id) ?? 0;
  return { ...product, sold };
}

export async function getPublishedTestimonials(limit = 12) {
  return db.query.testimonials.findMany({
    where: eq(s.testimonials.status, "published"),
    orderBy: [asc(s.testimonials.isSample), desc(s.testimonials.createdAt)],
    limit,
    with: { product: { columns: { slug: true, name: true, emoji: true } } },
  });
}

export async function getShopStats() {
  const [[orders], [customers]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(s.orders)
      .where(inArray(s.orders.status, [...SOLD_STATUSES])),
    db.select({ n: sql<number>`count(*)` }).from(s.customers),
  ]);
  return { orders: Number(orders.n), customers: Number(customers.n) };
}
