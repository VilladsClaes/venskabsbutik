"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { PAYMENT_METHODS, type PaymentDetails } from "@/db/schema";
import { sendOrderEmails } from "@/lib/email";
import { confirmEventSignups, formatEventTime } from "@/lib/events";
import { cryptoAmount, cryptoRateDkk, getPaymentConfig, STRIPE_MIN_OERE } from "@/lib/payments";
import { getSettings } from "@/lib/queries";
import { createCheckoutSession } from "@/lib/stripe";

const signupSchema = z.object({
  eventId: z.number().int(),
  seats: z.number().int().min(1).max(20),
  customer: z.object({
    name: z.string().trim().min(1, "Skriv dit navn").max(120),
    email: z.string().trim().max(200).email("Skriv din e-mail – den bruges til kalenderinvitationen"),
    phone: z.string().trim().max(30),
    allowMention: z.boolean(),
  }),
  note: z.string().trim().max(2000),
  payment: z.object({
    method: z.enum(PAYMENT_METHODS),
    barterOffer: z.string().trim().max(1000).optional(),
    cryptoCoin: z.string().trim().max(10).optional(),
  }),
  website: z.string().max(0).optional(), // honningfælde mod spam-robotter
});

export type EventSignupInput = z.infer<typeof signupSchema>;
export type EventSignupResult =
  | { ok: true; orderNumber: string; token: string; redirectUrl?: string }
  | { ok: false; error: string };

/**
 * Tilmelding til et event = en ordre med én billetlinje. Når ordren er betalt, kommer
 * kundens e-mail på kalenderposten, og eventet dukker op i kundens egen kalender.
 */
export async function signUpForEvent(input: EventSignupInput): Promise<EventSignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldige oplysninger" };
  const { eventId, seats, customer, note, payment } = parsed.data;

  const event = await db.query.events.findFirst({ where: and(eq(s.events.id, eventId), eq(s.events.published, true)) });
  if (!event) return { ok: false, error: "Eventet findes ikke længere" };
  if (event.startsAt.getTime() < Date.now()) return { ok: false, error: "Eventet er allerede gået i gang" };

  const total = event.price * seats;
  const free = total === 0;
  const settings = await getSettings();
  const payCfg = getPaymentConfig(settings);
  let paymentDetails: PaymentDetails | null = null;
  if (!free) {
    if (!payCfg.enabled.includes(payment.method)) return { ok: false, error: "Den betalingsmåde er ikke tilgængelig lige nu" };
    if (payment.method === "stripe" && total < STRIPE_MIN_OERE)
      return { ok: false, error: "Kortbetaling kræver mindst 2,50 kr. – vælg en anden betalingsmåde" };
    if (payment.method === "venskab") {
      if ((payment.barterOffer ?? "").length < 5) return { ok: false, error: "Fortæl hvad du vil give til gengæld 💛" };
      paymentDetails = { barterOffer: payment.barterOffer };
    }
    if (payment.method === "crypto") {
      const wallet = payCfg.wallets.find((w) => w.coin === payment.cryptoCoin) ?? payCfg.wallets[0];
      const rate = await cryptoRateDkk(wallet.coin);
      if (!rate) return { ok: false, error: "Kunne ikke hente kryptokursen lige nu – prøv igen om lidt" };
      paymentDetails = {
        crypto: {
          coin: wallet.coin,
          network: wallet.network,
          address: wallet.address,
          amount: cryptoAmount(wallet.coin, total, rate),
          rateDkk: rate,
          quotedAt: new Date().toISOString(),
        },
      };
    }
  }
  const method = free ? "venskab" : payment.method;
  const when = formatEventTime(event.startsAt, event.endsAt);
  const line = {
    productId: event.productId,
    eventId: event.id,
    productName: `${event.emoji} ${event.title}`,
    variantName: when,
    unitPrice: event.price,
    quantity: seats,
    lineTotal: total,
    answers: event.location ? [{ question: "Sted", answer: event.location }] : [],
  };

  const token = randomBytes(18).toString("base64url");
  const email = customer.email.toLowerCase();
  const phone = customer.phone.replace(/\s/g, "") || null;

  const created = await db.transaction(async (tx) => {
    if (event.capacity != null) {
      const [{ taken }] = await tx
        .select({ taken: sql<number>`coalesce(sum(${s.eventSignups.seats}), 0)` })
        .from(s.eventSignups)
        .where(and(eq(s.eventSignups.eventId, event.id), ne(s.eventSignups.status, "annulleret")));
      const left = event.capacity - Number(taken);
      if (left < seats) return { error: left > 0 ? `Der er kun ${left} pladser tilbage` : "Eventet er desværre fuldt booket" };
    }

    // Genkend kunder der har købt før (på e-mail eller telefon)
    const existing = await tx.query.customers.findFirst({
      where: or(eq(s.customers.email, email), phone ? eq(s.customers.phone, phone) : undefined),
    });
    let customerId: number;
    if (existing) {
      customerId = existing.id;
      await tx
        .update(s.customers)
        .set({ name: customer.name, email, phone: phone ?? existing.phone, allowMention: customer.allowMention })
        .where(eq(s.customers.id, existing.id));
    } else {
      const [c] = await tx
        .insert(s.customers)
        .values({ name: customer.name, email, phone, allowMention: customer.allowMention })
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
        paymentMethod: method,
        paymentDetails,
        ...(free ? { status: "betalt" as const, paidAt: new Date() } : {}),
      })
      .returning({ id: s.orders.id });
    const number = `VC-${1000 + order.id}`;
    await tx.update(s.orders).set({ orderNumber: number }).where(eq(s.orders.id, order.id));
    await tx.insert(s.orderItems).values({ ...line, orderId: order.id });
    await tx.insert(s.eventSignups).values({ eventId: event.id, orderId: order.id, name: customer.name, email, seats });
    return { number, id: order.id };
  });
  if ("error" in created) return { ok: false, error: created.error! };
  const orderNumber = created.number;

  let redirectUrl: string | undefined;
  if (!free && method === "stripe") {
    try {
      const session = await createCheckoutSession({ id: created.id, orderNumber, accessToken: token, total, email });
      await db.update(s.orders).set({ stripeSessionId: session.id }).where(eq(s.orders.id, created.id));
      redirectUrl = session.url;
    } catch (e) {
      console.error("Stripe fejlede", e);
    }
  }

  after(async () => {
    if (free) {
      await confirmEventSignups(created.id);
      return;
    }
    await sendOrderEmails(
      {
        orderNumber,
        accessToken: token,
        total,
        status: "afventer_betaling",
        paymentMethod: method,
        paymentDetails,
        isGift: false,
        giftRecipient: null,
        customer: { name: customer.name, email, phone },
        items: [{ productName: line.productName, variantName: line.variantName, quantity: seats, lineTotal: total, isBonus: false }],
      },
      payCfg,
      settings.contactEmail,
    );
  });

  return { ok: true, orderNumber, token, redirectUrl };
}
