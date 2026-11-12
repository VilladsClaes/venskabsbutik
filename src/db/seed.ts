import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "./schema";
import { EVENT_TEMPLATES } from "../lib/event-templates";
import { seedCategories, seedProducts, seedSettings } from "./seed-data";

// Fylder databasen med butikkens produkter. Kan køres flere gange:
// eksisterende produkter (matchet på slug) springes over, så dine ændringer ikke overskrives.

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/venskab.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema: s });

  const catIds = new Map<string, number>();
  for (const [i, c] of seedCategories.entries()) {
    const existing = await db.query.categories.findFirst({ where: (t, { eq }) => eq(t.slug, c.slug) });
    if (existing) {
      catIds.set(c.slug, existing.id);
      continue;
    }
    const [row] = await db
      .insert(s.categories)
      .values({ ...c, sortOrder: i })
      .returning({ id: s.categories.id });
    catIds.set(c.slug, row.id);
  }

  let created = 0;
  for (const [i, p] of seedProducts.entries()) {
    const existing = await db.query.products.findFirst({ where: (t, { eq }) => eq(t.slug, p.slug) });
    if (existing) continue;

    const [row] = await db
      .insert(s.products)
      .values({
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        headline: p.headline,
        summary: p.summary,
        description: p.description,
        goodFor: p.goodFor ?? [],
        finePrint: p.finePrint ?? "",
        delivery: p.delivery ?? "",
        emoji: p.emoji,
        color: p.color,
        categoryId: catIds.get(p.category) ?? null,
        priceKind: p.priceKind ?? "fixed",
        price: p.price,
        unitLabel: p.unitLabel,
        priceEndsWith: p.priceEndsWith,
        minPrice: p.minPrice,
        recurringLabel: p.recurringLabel,
        featured: p.featured ?? false,
        sortOrder: i,
        legacyUrl: `https://sites.google.com/view/venskab${p.legacyPath}`,
      })
      .returning({ id: s.products.id });

    if (p.variants?.length)
      await db.insert(s.productVariants).values(
        p.variants.map((v, j) => ({ productId: row.id, name: v.name, price: v.price ?? null, sortOrder: j })),
      );
    if (p.media?.length)
      await db.insert(s.productMedia).values(
        p.media.map((m, j) => ({
          productId: row.id,
          kind: m.kind,
          url: m.url,
          alt: m.alt ?? "",
          caption: m.caption ?? "",
          isExample: m.isExample ?? false,
          sortOrder: j,
        })),
      );
    const questions = p.questions ?? [];
    if (questions.length)
      await db.insert(s.productQuestions).values(
        questions.map((q, j) => ({
          productId: row.id,
          label: q.label,
          kind: q.kind ?? "text",
          required: q.required ?? false,
          sortOrder: j,
        })),
      );
    if (p.sampleTestimonials?.length)
      await db.insert(s.testimonials).values(
        p.sampleTestimonials.map((t) => ({
          productId: row.id,
          authorName: t.authorName,
          text: t.text,
          emoji: t.emoji,
          rating: t.rating ?? 5,
          status: "published" as const,
          isSample: true,
        })),
      );
    created++;
  }

  // Fælles oplevelser: aktiviteter man tilmelder sig (fra skabelonerne i lib/event-templates.ts)
  let activityCat = await db.query.categories.findFirst({ where: (t, { eq }) => eq(t.slug, "faelles-oplevelser") });
  if (!activityCat) {
    [activityCat] = await db
      .insert(s.categories)
      .values({
        slug: "faelles-oplevelser",
        name: "Fælles oplevelser",
        emoji: "🏕️",
        description: "Ting vi laver sammen. Meld dig til en dato – vi kører, når vi er nok.",
        sortOrder: seedCategories.length,
      })
      .returning();
  }
  let activities = 0;
  for (const [i, t] of EVENT_TEMPLATES.entries()) {
    if (!t.activity || !t.productSlug) continue;
    const existing = await db.query.products.findFirst({ where: (p, { eq }) => eq(p.slug, t.productSlug!) });
    if (existing) continue;
    await db.insert(s.products).values({
      slug: t.productSlug,
      name: t.title,
      tagline: t.activity.tagline,
      headline: t.activity.headline,
      summary: t.summary,
      description: t.activity.description,
      goodFor: t.activity.goodFor,
      finePrint: "Du betaler først, når der er nok tilmeldte til, at det bliver til noget.",
      delivery: "📅 Du får en kalenderinvitation, når datoen er bekræftet",
      emoji: t.emoji,
      color: t.color,
      categoryId: activityCat.id,
      price: t.price,
      unitLabel: "person",
      isActivity: true,
      sortOrder: 1000 + i,
    });
    activities++;
  }
  console.log(`🏕️ ${activities} nye aktiviteter`);

  for (const [key, value] of Object.entries(seedSettings)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }

  console.log(`🌈 Seed færdig: ${created} nye produkter (${seedProducts.length - created} fandtes allerede)`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
