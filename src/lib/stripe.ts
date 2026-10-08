import Stripe from "stripe";
import { SITE_URL } from "./site";

let client: Stripe | null = null;

/** Stripe oprettes først, når den bruges – så butikken kan bygges uden nøgler */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY mangler");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Opretter en Stripe-betalingsside for en ordre og returnerer adressen */
export async function createCheckoutSession(order: {
  id: number;
  orderNumber: string;
  accessToken: string;
  total: number;
  email: string | null;
}) {
  const back = `${SITE_URL}/ordre/${order.orderNumber}?k=${order.accessToken}`;
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    locale: "da",
    currency: "dkk",
    customer_email: order.email ?? undefined,
    client_reference_id: String(order.id),
    metadata: { orderId: String(order.id), orderNumber: order.orderNumber },
    // Ét samlet beløb – selve indholdet står på ordresiden
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "dkk",
          unit_amount: order.total,
          product_data: { name: `Venskabsbutikken – ordre ${order.orderNumber}` },
        },
      },
    ],
    success_url: `${back}&betalt=1`,
    cancel_url: back,
  });
  if (!session.url) throw new Error("Stripe gav ingen betalingsadresse");
  return { id: session.id, url: session.url };
}
