import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = SITE_URL;
  const products = await db
    .select({ slug: s.products.slug, updatedAt: s.products.updatedAt })
    .from(s.products)
    .where(eq(s.products.active, true));
  const pages = ["", "/tjenester", "/om-venskaber", "/priser", "/om-villads", "/bogen"];
  return [
    ...pages.map((p) => ({ url: `${site}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.7 : 1 })),
    ...products.map((p) => ({ url: `${site}/tjenester/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}
