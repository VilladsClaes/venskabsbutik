"use server";

import { randomBytes } from "node:crypto";
import { eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";

/* ---------- Bestilling ---------- */

const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, "Skriv dit navn").max(120),
    email: z.string().trim().max(200).email("Ugyldig e-mail").or(z.literal("")),
    phone: z.string().trim().max(30),
    nickname: z.string().trim().max(60),
    allowMention: z.boolean(),
  }),
  note: z.string().trim().max(2000),
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        variantId: z.number().int().optional(),
        customPrice: z.number().int().positive().optional(),
        quantity: z.number().int().min(1).max(999),
        answers: z.record(z.string(), z.string().max(2000)),
      }),
    )
    .min(1, "Kurven er tom")
    .max(50),
  website: z.string().max(0).optional(), // honningfælde mod spam-robotter
});

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderResult = { ok: true; orderNumber: string; token: string } | { ok: false; error: string };

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldige oplysninger" };
  const { customer, items, note } = parsed.data;
  if (!customer.email && !customer.phone)
    return { ok: false, error: "Skriv enten din e-mail eller dit telefonnummer, så jeg kan kontakte dig" };

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await db.query.products.findMany({
    where: inArray(s.products.id, productIds),
    with: { variants: true, questions: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: Omit<typeof s.orderItems.$inferInsert, "orderId">[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || !p.active) return { ok: false, error: "Et af produkterne findes ikke længere – fjern det fra kurven" };

    const variant = item.variantId ? p.variants.find((v) => v.id === item.variantId && v.active) : undefined;
    if (item.variantId && !variant) return { ok: false, error: `Udgaven af "${p.name}" findes ikke længere` };
    if (!item.variantId && p.variants.some((v) => v.active))
      return { ok: false, error: `Vælg en udgave af "${p.name}"` };

    let unitPrice = variant?.price ?? p.price;
    let quantity = item.quantity;
    if (p.priceKind === "custom") {
      const cp = item.customPrice;
      if (!cp || cp % 100 !== (p.priceEndsWith ?? 0) || (p.minPrice != null && cp < p.minPrice))
        return { ok: false, error: `Beløbet for "${p.name}" er ugyldigt` };
      unitPrice = cp;
      quantity = 1;
    } else if (p.priceKind === "fixed") {
      quantity = 1;
    }

    const answers = p.questions.map((q) => ({ question: q.label, answer: (item.answers[String(q.id)] ?? "").trim() }));
    const missing = p.questions.find((q, i) => q.required && !answers[i].answer);
    if (missing) return { ok: false, error: `Svar på "${missing.label}" for ${p.name}` };

    lines.push({
      productId: p.id,
      variantId: variant?.id ?? null,
      productName: p.name,
      variantName: variant?.name ?? null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      answers: answers.filter((a) => a.answer),
    });
  }

  const total = lines.reduce((n, l) => n + (l.lineTotal ?? 0), 0);
  const token = randomBytes(18).toString("base64url");
  const email = customer.email.toLowerCase() || null;
  const phone = customer.phone.replace(/\s/g, "") || null;

  const orderNumber = await db.transaction(async (tx) => {
    // Genkend kunder der har købt før (på e-mail eller telefon)
    const matchers = [email ? eq(s.customers.email, email) : undefined, phone ? eq(s.customers.phone, phone) : undefined].filter(
      (m) => m !== undefined,
    );
    const existing = await tx.query.customers.findFirst({ where: or(...matchers) });
    let customerId: number;
    if (existing) {
      customerId = existing.id;
      await tx
        .update(s.customers)
        .set({
          name: customer.name,
          email: email ?? existing.email,
          phone: phone ?? existing.phone,
          nickname: customer.nickname || existing.nickname,
          allowMention: customer.allowMention,
        })
        .where(eq(s.customers.id, existing.id));
    } else {
      const [c] = await tx
        .insert(s.customers)
        .values({ name: customer.name, email, phone, nickname: customer.nickname || null, allowMention: customer.allowMention })
        .returning({ id: s.customers.id });
      customerId = c.id;
    }

    const [order] = await tx
      .insert(s.orders)
      .values({ orderNumber: `tmp-${token}`, accessToken: token, customerId, total, customerNote: note })
      .returning({ id: s.orders.id });
    const number = `VC-${1000 + order.id}`;
    await tx.update(s.orders).set({ orderNumber: number }).where(eq(s.orders.id, order.id));
    await tx.insert(s.orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
    return number;
  });

  return { ok: true, orderNumber, token };
}

/* ---------- Anmeldelser ---------- */

const testimonialSchema = z.object({
  productId: z.coerce.number().int(),
  authorName: z.string().trim().min(1, "Skriv dit navn").max(60),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(5, "Skriv lidt mere 😊").max(1000),
  emoji: z.string().trim().max(8).default("😊"),
  website: z.string().max(0).optional(),
});

export type TestimonialState = { ok?: boolean; error?: string };

export async function submitTestimonial(_prev: TestimonialState, form: FormData): Promise<TestimonialState> {
  const parsed = testimonialSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Noget gik galt" };
  const { productId, authorName, rating, text, emoji } = parsed.data;
  const data = { productId, authorName, rating, text, emoji };
  const product = await db.query.products.findFirst({ where: eq(s.products.id, data.productId) });
  if (!product) return { error: "Produktet findes ikke" };
  await db.insert(s.testimonials).values({ ...data, emoji: data.emoji || "😊", status: "pending" });
  return { ok: true };
}
