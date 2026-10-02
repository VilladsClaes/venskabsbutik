"use server";

import { randomBytes } from "node:crypto";
import { asc, eq, inArray, or } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { DAILY_BONUS_SLUG, pickDaily } from "@/lib/daily";
import { sendOrderEmails } from "@/lib/email";
import { getSettings } from "@/lib/queries";

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
  gift: z
    .object({
      enabled: z.boolean(),
      recipient: z.string().trim().max(80),
      message: z.string().trim().max(1000),
    })
    .optional(),
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

/** "2026-10-10T07:30" -> "lørdag 10. oktober 2026 kl. 07.30" */
function prettyAnswer(kind: string, value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m || (kind !== "date" && kind !== "datetime")) return value;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  const day = d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return m[4] ? `${day} kl. ${m[4]}.${m[5]}` : day;
}

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderResult = { ok: true; orderNumber: string; token: string } | { ok: false; error: string };

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldige oplysninger" };
  const { customer, items, note, gift } = parsed.data;
  if (gift?.enabled && !gift.recipient) return { ok: false, error: "Skriv navnet på den, gaven er til" };
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

    const answers = p.questions.map((q) => ({
      question: q.label,
      answer: prettyAnswer(q.kind, (item.answers[String(q.id)] ?? "").trim()),
    }));
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

  // Dagens venskab: køber man dagens udvalgte, følger en gratis bonus med
  const candidates = await db.query.products.findMany({
    where: eq(s.products.active, true),
    columns: { id: true, slug: true },
  });
  const daily = pickDaily(candidates.filter((c) => c.slug !== DAILY_BONUS_SLUG));
  if (daily && lines.some((l) => l.productId === daily.id)) {
    const bonus = await db.query.products.findFirst({
      where: eq(s.products.slug, DAILY_BONUS_SLUG),
      with: { variants: { where: eq(s.productVariants.active, true), orderBy: asc(s.productVariants.sortOrder), limit: 1 } },
    });
    if (bonus?.active) {
      lines.push({
        productId: bonus.id,
        variantId: bonus.variants[0]?.id ?? null,
        productName: bonus.name,
        variantName: bonus.variants[0]?.name ?? null,
        unitPrice: 0,
        quantity: 1,
        lineTotal: 0,
        isBonus: true,
        answers: [{ question: "Bonus", answer: "Gratis med Dagens venskab 🎁" }],
      });
    }
  }

  const total = lines.reduce((n, l) => n + (l.lineTotal ?? 0), 0);
  const token = randomBytes(18).toString("base64url");
  const giftToken = gift?.enabled ? randomBytes(18).toString("base64url") : null;
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
      .values({
        orderNumber: `tmp-${token}`,
        accessToken: token,
        customerId,
        total,
        customerNote: note,
        isGift: !!gift?.enabled,
        giftRecipient: gift?.enabled ? gift.recipient : null,
        giftMessage: gift?.enabled ? gift.message : null,
        giftToken,
      })
      .returning({ id: s.orders.id });
    const number = `VC-${1000 + order.id}`;
    await tx.update(s.orders).set({ orderNumber: number }).where(eq(s.orders.id, order.id));
    await tx.insert(s.orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
    return number;
  });

  // Bekræftelser sendes efter svaret, så kunden ikke venter på e-mailen
  after(async () => {
    const settings = await getSettings();
    await sendOrderEmails(
      {
        orderNumber,
        accessToken: token,
        total,
        status: "afventer_betaling",
        isGift: !!gift?.enabled,
        giftRecipient: gift?.recipient ?? null,
        customer: { name: customer.name, email, phone },
        items: lines.map((l) => ({
          productName: l.productName,
          variantName: l.variantName ?? null,
          quantity: l.quantity ?? 1,
          lineTotal: l.lineTotal,
          isBonus: !!l.isBonus,
        })),
      },
      settings.mobilepayNumber ?? "60614309",
      settings.contactEmail,
    );
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
