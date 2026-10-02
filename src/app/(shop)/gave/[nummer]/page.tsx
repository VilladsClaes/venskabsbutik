import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { GiftReveal } from "@/components/gift-reveal";
import { DriftingClouds, RisingEmojis } from "@/components/sky";
import { db, schema as s } from "@/db";
import { safeEqual } from "@/lib/tokens";

export const metadata: Metadata = { title: "Du har fået en gave! 🎁", robots: { index: false } };

export default async function GiftPage({ params, searchParams }: PageProps<"/gave/[nummer]">) {
  const { nummer } = await params;
  const { g } = await searchParams;
  const order = await db.query.orders.findFirst({
    where: eq(s.orders.orderNumber, decodeURIComponent(nummer)),
    with: {
      customer: { columns: { name: true, nickname: true } },
      items: { with: { product: { columns: { emoji: true } } } },
    },
  });
  if (!order || !order.isGift || !safeEqual(g, order.giftToken)) notFound();

  return (
    <section className="relative min-h-[80vh] overflow-hidden bg-gradient-to-b from-[#ffe5ec] via-sky to-cream">
      <DriftingClouds count={4} />
      <RisingEmojis count={14} emojis={["💝", "🎈", "🎉", "💛", "✨", "🥳"]} />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-16">
        <GiftReveal
          recipient={order.giftRecipient ?? "dig"}
          from={order.customer.nickname || order.customer.name.split(" ")[0]}
          message={order.giftMessage}
          items={order.items.map((i) => ({
            name: i.productName,
            variant: i.variantName,
            emoji: i.product?.emoji ?? "💛",
          }))}
        />
      </div>
    </section>
  );
}
