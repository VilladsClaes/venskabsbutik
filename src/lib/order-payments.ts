import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { PaymentMethod } from "@/db/schema";
import { sendStatusEmail } from "./email";

/**
 * Registrerer en indbetaling og sætter ordren til "Betalt", når hele beløbet er dækket.
 * Returnerer true hvis ordren netop blev betalt.
 */
export async function registerPayment(input: {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}): Promise<boolean> {
  const order = await db.query.orders.findFirst({ where: eq(s.orders.id, input.orderId), with: { payments: true } });
  if (!order) return false;
  // Stripe kan sende samme besked flere gange – undgå dobbelte betalinger
  if (input.reference && order.payments.some((p) => p.reference === input.reference)) return false;
  await db.insert(s.payments).values({
    orderId: input.orderId,
    amount: input.amount,
    method: input.method,
    reference: (input.reference ?? "").slice(0, 200),
    note: (input.note ?? "").slice(0, 500),
  });
  const paid = order.payments.reduce((n, p) => n + p.amount, 0) + input.amount;
  if (order.status === "afventer_betaling" && paid >= order.total) {
    await db
      .update(s.orders)
      .set({ status: "betalt", paidAt: new Date(), paymentMethod: input.method })
      .where(and(eq(s.orders.id, input.orderId), eq(s.orders.status, "afventer_betaling")));
    const full = await db.query.orders.findFirst({
      where: eq(s.orders.id, input.orderId),
      with: { customer: true, items: true },
    });
    if (full) await sendStatusEmail(full);
    return true;
  }
  return false;
}
