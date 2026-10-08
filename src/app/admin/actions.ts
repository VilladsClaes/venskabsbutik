"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { MEDIA_KINDS, ORDER_STATUSES, PAYMENT_METHODS, PRICE_KINDS, QUESTION_KINDS, TESTIMONIAL_STATUSES } from "@/db/schema";
import { destroySession, requireAdmin } from "@/lib/auth";
import { fromLocalInput } from "@/lib/dates";
import { sendStatusEmail } from "@/lib/email";
import { parseKr } from "@/lib/money";
import { registerPayment } from "@/lib/order-payments";
import { saveUpload } from "@/lib/upload";

function refresh() {
  revalidatePath("/", "layout");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- Ordrer ---------- */

export async function setOrderStatus(orderId: number, status: (typeof ORDER_STATUSES)[number]) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) throw new Error("Ugyldig status");
  const now = new Date();
  const order = await db.query.orders.findFirst({ where: eq(s.orders.id, orderId) });
  if (!order) return;
  await db
    .update(s.orders)
    .set({
      status,
      paidAt: status !== "afventer_betaling" && status !== "annulleret" ? (order.paidAt ?? now) : order.paidAt,
      deliveredAt: status === "leveret" ? (order.deliveredAt ?? now) : order.deliveredAt,
    })
    .where(eq(s.orders.id, orderId));
  if (status !== order.status) notifyStatus(orderId);
  refresh();
}

/** Sender statusmail til kunden efter svaret (kun hvis e-mail er sat op) */
function notifyStatus(orderId: number) {
  after(async () => {
    const o = await db.query.orders.findFirst({
      where: eq(s.orders.id, orderId),
      with: { customer: true, items: true },
    });
    if (o) await sendStatusEmail(o);
  });
}

export async function addPayment(orderId: number, form: FormData) {
  await requireAdmin();
  const amount = parseKr(String(form.get("amount") ?? ""));
  if (!amount) return;
  const method = String(form.get("method") ?? "mobilepay") as (typeof PAYMENT_METHODS)[number];
  await registerPayment({
    orderId,
    amount,
    method: PAYMENT_METHODS.includes(method) ? method : "mobilepay",
    reference: String(form.get("reference") ?? ""),
    note: String(form.get("note") ?? ""),
  });
  refresh();
}

export async function deletePayment(paymentId: number) {
  await requireAdmin();
  await db.delete(s.payments).where(eq(s.payments.id, paymentId));
  refresh();
}

export async function saveOrderNote(orderId: number, form: FormData) {
  await requireAdmin();
  await db
    .update(s.orders)
    .set({ adminNote: String(form.get("adminNote") ?? "").slice(0, 5000) })
    .where(eq(s.orders.id, orderId));
  refresh();
}

/* ---------- Kunder ---------- */

export async function saveCustomer(customerId: number, form: FormData) {
  await requireAdmin();
  await db
    .update(s.customers)
    .set({
      name: String(form.get("name") ?? "").slice(0, 120) || "Ukendt",
      email: String(form.get("email") ?? "").trim().toLowerCase() || null,
      phone: String(form.get("phone") ?? "").replace(/\s/g, "") || null,
      nickname: String(form.get("nickname") ?? "").trim() || null,
      allowMention: form.get("allowMention") === "on",
      notes: String(form.get("notes") ?? "").slice(0, 5000),
    })
    .where(eq(s.customers.id, customerId));
  refresh();
}

/* ---------- Anmeldelser ---------- */

export async function setTestimonialStatus(id: number, status: (typeof TESTIMONIAL_STATUSES)[number]) {
  await requireAdmin();
  if (!TESTIMONIAL_STATUSES.includes(status)) throw new Error("Ugyldig status");
  await db.update(s.testimonials).set({ status }).where(eq(s.testimonials.id, id));
  refresh();
}

export async function deleteTestimonial(id: number) {
  await requireAdmin();
  await db.delete(s.testimonials).where(eq(s.testimonials.id, id));
  refresh();
}

export async function deleteSampleTestimonials() {
  await requireAdmin();
  await db.delete(s.testimonials).where(eq(s.testimonials.isSample, true));
  refresh();
}

export async function createTestimonial(form: FormData) {
  await requireAdmin();
  const productId = Number(form.get("productId")) || null;
  const text = String(form.get("text") ?? "").trim();
  const authorName = String(form.get("authorName") ?? "").trim();
  if (!text || !authorName) return;
  await db.insert(s.testimonials).values({
    productId,
    authorName: authorName.slice(0, 60),
    text: text.slice(0, 1000),
    emoji: String(form.get("emoji") ?? "😊").slice(0, 8) || "😊",
    rating: Math.min(5, Math.max(1, Number(form.get("rating")) || 5)),
    status: "published",
  });
  refresh();
}

/* ---------- Produkter ---------- */

const productSchema = z.object({
  id: z.number().int().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug må kun indeholde a-z, 0-9 og bindestreg"),
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(160),
  headline: z.string().trim().max(200),
  summary: z.string().trim().max(400),
  description: z.string().max(10000),
  goodFor: z.array(z.string().trim().min(1).max(200)).max(30),
  finePrint: z.string().max(2000),
  delivery: z.string().max(500),
  emoji: z.string().trim().min(1).max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  categoryId: z.number().int().nullable(),
  priceKind: z.enum(PRICE_KINDS),
  price: z.number().int().min(0),
  unitLabel: z.string().trim().max(20).nullable(),
  priceEndsWith: z.number().int().min(0).max(99).nullable(),
  minPrice: z.number().int().min(0).nullable(),
  recurringLabel: z.string().trim().max(40).nullable(),
  active: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  variants: z
    .array(
      z.object({
        id: z.number().int().optional(),
        name: z.string().trim().min(1).max(200),
        price: z.number().int().min(0).nullable(),
        active: z.boolean(),
      }),
    )
    .max(50),
  media: z
    .array(
      z.object({
        id: z.number().int().optional(),
        kind: z.enum(MEDIA_KINDS),
        url: z.string().trim().min(1).max(500),
        alt: z.string().max(300),
        caption: z.string().max(300),
        isExample: z.boolean(),
      }),
    )
    .max(50),
  questions: z
    .array(
      z.object({
        id: z.number().int().optional(),
        label: z.string().trim().min(1).max(300),
        kind: z.enum(QUESTION_KINDS),
        required: z.boolean(),
      }),
    )
    .max(30),
});

export type ProductFormData = z.infer<typeof productSchema>;

export async function saveProduct(input: ProductFormData): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: `${i.path.join(".")}: ${i.message}` };
  }
  const { id, variants, media, questions, ...fields } = parsed.data;

  const clash = await db.query.products.findFirst({ where: eq(s.products.slug, fields.slug) });
  if (clash && clash.id !== id) return { ok: false, error: "Der findes allerede et produkt med den slug" };

  const productId = await db.transaction(async (tx) => {
    let pid: number;
    if (id) {
      await tx.update(s.products).set(fields).where(eq(s.products.id, id));
      pid = id;
    } else {
      const [row] = await tx.insert(s.products).values(fields).returning({ id: s.products.id });
      pid = row.id;
    }

    // Synkronisér underliste: slet fjernede, opdatér eksisterende, indsæt nye
    async function sync<T extends { id?: number }>(
      table: typeof s.productVariants | typeof s.productMedia | typeof s.productQuestions,
      rows: T[],
    ) {
      const keep = rows.map((r) => r.id).filter((x): x is number => !!x);
      await tx
        .delete(table)
        .where(and(eq(table.productId, pid), keep.length ? notInArray(table.id, keep) : sql`1=1`));
      for (const [i, r] of rows.entries()) {
        const { id: rowId, ...values } = r;
        const data = { ...values, productId: pid, sortOrder: i };
        if (rowId) await tx.update(table).set(data).where(and(eq(table.id, rowId), eq(table.productId, pid)));
        else await tx.insert(table).values(data);
      }
    }
    await sync(s.productVariants, variants);
    await sync(s.productMedia, media);
    await sync(s.productQuestions, questions);
    return pid;
  });

  refresh();
  return { ok: true, id: productId };
}

export async function toggleProduct(id: number, field: "active" | "featured") {
  await requireAdmin();
  const p = await db.query.products.findFirst({ where: eq(s.products.id, id) });
  if (!p) return;
  await db
    .update(s.products)
    .set(field === "active" ? { active: !p.active } : { featured: !p.featured })
    .where(eq(s.products.id, id));
  refresh();
}

/* ---------- Indstillinger ---------- */

const SETTING_KEYS = [
  "mobilepayNumber",
  "mobilepayName",
  "contactPhone",
  "contactEmail",
  "introVideo",
  "bankReg",
  "bankAccount",
  "bankName",
  "paypalMe",
] as const;

export async function saveSettings(form: FormData) {
  await requireAdmin();
  const upsert = (key: string, value: string) =>
    db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  for (const key of SETTING_KEYS) await upsert(key, String(form.get(key) ?? "").trim().slice(0, 300));
  // Tegnebøger: én pr. linje, "MØNT | netværk | adresse"
  await upsert("cryptoWallets", String(form.get("cryptoWallets") ?? "").trim().slice(0, 3000));
  const methods = PAYMENT_METHODS.filter((m) => form.get(`method_${m}`) === "on");
  await upsert("paymentMethods", methods.join(","));
  refresh();
}

/* ---------- Upload ---------- */

export async function uploadMedia(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Vælg en fil" };
  try {
    return { ok: true, url: await saveUpload(file, String(form.get("folder") ?? "diverse")) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload fejlede" };
  }
}

/* ---------- Leveringsdagbog ---------- */

const deliverySchema = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().nullable(),
  orderId: z.number().int().nullable(),
  title: z.string().trim().min(1, "Skriv en titel").max(200),
  note: z.string().max(5000),
  dedicatedTo: z.string().trim().max(120).nullable(),
  placeName: z.string().trim().max(200).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  photoUrl: z.string().trim().max(500).nullable(),
  amount: z.number().nullable(),
  deliveredAt: z.string().min(8),
  isPublic: z.boolean(),
});

export type DeliveryFormData = z.infer<typeof deliverySchema>;

export async function saveDelivery(
  input: DeliveryFormData,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = deliverySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldige oplysninger" };
  const { id, deliveredAt, ...rest } = parsed.data;
  const when = fromLocalInput(deliveredAt);
  if (Number.isNaN(when.getTime())) return { ok: false, error: "Ugyldig dato" };
  const values = { ...rest, deliveredAt: when };
  let rowId = id;
  if (id) await db.update(s.deliveries).set(values).where(eq(s.deliveries.id, id));
  else [{ id: rowId }] = await db.insert(s.deliveries).values(values).returning({ id: s.deliveries.id });
  refresh();
  return { ok: true, id: rowId! };
}

export async function deleteDelivery(id: number) {
  await requireAdmin();
  await db.delete(s.deliveries).where(eq(s.deliveries.id, id));
  refresh();
  redirect("/admin/leverancer");
}
