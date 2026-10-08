import { revalidatePath } from "next/cache";
import { registerPayment } from "@/lib/order-payments";
import { getStripe } from "@/lib/stripe";

// Stripe kalder denne adresse, når en kunde har betalt. Signaturen tjekkes,
// så ingen kan forfalske en betaling.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Mangler opsætning", { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Ugyldig signatur", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId ?? session.client_reference_id);
    if (orderId && session.payment_status === "paid" && session.amount_total) {
      await registerPayment({
        orderId,
        amount: session.amount_total,
        method: "stripe",
        reference: session.id,
        note: "Betalt via Stripe",
      });
      revalidatePath("/", "layout");
    }
  }
  return Response.json({ received: true });
}
