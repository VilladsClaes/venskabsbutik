import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { CopyButton } from "@/components/copy-button";
import { Rainbow, Sun } from "@/components/sky";
import { db, schema as s } from "@/db";
import { formatAmount, formatKr } from "@/lib/money";
import { STATUS_INFO } from "@/lib/order-status";
import { friendshipLevel } from "@/lib/friendship";
import { getSettings, SOLD_STATUSES } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { safeEqual } from "@/lib/tokens";

export const metadata: Metadata = { title: "Din ordre", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/ordre/[nummer]">) {
  const { nummer } = await params;
  const { k } = await searchParams;
  const order = await db.query.orders.findFirst({
    where: eq(s.orders.orderNumber, decodeURIComponent(nummer)),
    with: { items: true, customer: { columns: { id: true, name: true } } },
  });
  if (!order || !safeEqual(k, order.accessToken)) notFound();

  const settings = await getSettings();
  const mp = settings.mobilepayNumber ?? "60614309";
  const status = STATUS_INFO[order.status];
  const waiting = order.status === "afventer_betaling";
  const firstName = order.customer.name.split(" ")[0];
  const [{ paid }] = await db
    .select({ paid: sql<number>`coalesce(sum(${s.orders.total}), 0)` })
    .from(s.orders)
    .where(and(eq(s.orders.customerId, order.customer.id), inArray(s.orders.status, [...SOLD_STATUSES])));
  const friendship = friendshipLevel(Number(paid));
  const giftUrl = order.isGift && order.giftToken ? `${SITE_URL}/gave/${order.orderNumber}?g=${order.giftToken}` : null;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-sky to-cream" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="relative text-center">
          <Rainbow width={360} className="mx-auto max-w-full" />
          <Sun size={110} className="absolute -top-4 right-0 sm:right-10" />
          <h1 className="-mt-10 text-4xl font-bold sm:text-5xl">
            {waiting ? `Tak, ${firstName}! 🎉` : `Hej igen, ${firstName}! 👋`}
          </h1>
          <p className="mt-3 text-lg font-semibold">
            Ordre <span className="rounded-lg bg-white px-2 font-display">{order.orderNumber}</span> ·{" "}
            <span className="rounded-full px-2.5 py-0.5" style={{ background: status.color }}>
              {status.emoji} {status.label}
            </span>
          </p>
          <p className="mt-2 text-ink-soft">{status.customerText}</p>
        </div>

        {waiting && (
          <section className="card mt-10 animate-pop-in overflow-hidden" aria-labelledby="betal">
            <div className="bg-mobilepay px-6 py-4 text-white">
              <h2 id="betal" className="text-2xl font-bold">
                💙 Betal med MobilePay
              </h2>
              <p className="font-semibold text-white/90">Åbn MobilePay-appen og send en betaling sådan her:</p>
            </div>
            <dl className="divide-y-2 divide-dashed divide-ink/20">
              {[
                { k: "1. Send til nummer", v: mp, copy: mp },
                { k: "2. Beløb", v: `${formatAmount(order.total)} kr.`, copy: formatAmount(order.total) },
                { k: "3. Skriv i beskeden", v: order.orderNumber, copy: order.orderNumber },
              ].map((row) => (
                <div key={row.k} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <dt className="font-semibold text-ink-soft">{row.k}</dt>
                  <dd className="flex items-center gap-3">
                    <span className="font-display text-2xl font-bold">{row.v}</span>
                    <CopyButton value={row.copy} label={row.k} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="bg-[#fff3b0] px-6 py-4 text-sm font-semibold">
              ☝️ Husk ordrenummeret i beskeden – så ved jeg, at betalingen er fra dig. Når jeg har modtaget den, går jeg i
              gang og kontakter dig.
            </p>
          </section>
        )}

        <section className="card mt-8 p-6">
          <h2 className="text-2xl font-bold">Det har du bestilt</h2>
          <ul className="mt-4 divide-y-2 divide-dashed divide-ink/20">
            {order.items.map((it) => (
              <li key={it.id} className="py-3">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">
                    {it.productName}
                    {it.variantName && <span className="text-ink-soft"> – {it.variantName}</span>}
                    {it.quantity > 1 && <span className="text-ink-soft"> × {it.quantity}</span>}
                  </span>
                  <span className="font-display font-bold">{it.isBonus ? "🎁 Gratis" : formatKr(it.lineTotal)}</span>
                </div>
                {it.answers.length > 0 && (
                  <ul className="mt-1 text-sm text-ink-soft">
                    {it.answers.map((a) => (
                      <li key={a.question}>
                        <strong>{a.question}</strong> {a.answer}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t-[3px] border-ink pt-3 font-display text-xl font-bold">
            <span>I alt</span>
            <span>{formatKr(order.total)}</span>
          </div>
        </section>

        {giftUrl && (
          <section className="card mt-8 bg-[#ffe5ec] p-6">
            <h2 className="text-2xl font-bold">🎁 Gavekort til {order.giftRecipient}</h2>
            <p className="mt-1">
              Send dette link til {order.giftRecipient}. Der pakkes en gave op med konfetti – og der står ingen priser.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a href={giftUrl} target="_blank" rel="noreferrer" className="btn btn-coral !py-1.5">
                Se gavekortet ✨
              </a>
              <CopyButton value={giftUrl} label="gavekortets link" />
            </div>
          </section>
        )}

        <section className="card mt-8 overflow-hidden" style={{ background: friendship.level.color }}>
          <div className="flex items-center gap-4 p-6">
            <span className="text-6xl" aria-hidden="true">{friendship.level.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-soft">Vores venskabsniveau</p>
              <h2 className="text-3xl font-bold">{friendship.level.name}</h2>
              <p>{friendship.level.text}</p>
            </div>
          </div>
          {friendship.next && (
            <div className="border-t-[3px] border-dashed border-ink/20 bg-white/60 px-6 py-4">
              <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
                <div className="h-full bg-coral" style={{ width: `${Math.round(friendship.progress * 100)}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold">
                {formatKr(friendship.missing)} mere, så bliver vi {friendship.next.emoji} <strong>{friendship.next.name}</strong>
              </p>
            </div>
          )}
        </section>

        {!waiting && order.status !== "annulleret" && (
          <div className="mt-6 text-center">
            <a href={`/ordre/${order.orderNumber}/certifikat?k=${order.accessToken}`} className="btn btn-white">
              📜 Hent dit venskabscertifikat
            </a>
          </div>
        )}

        <p className="mt-8 text-center text-ink-soft">
          Gem linket til denne side, hvis du vil følge din ordre. Spørgsmål? Ring på{" "}
          <a className="font-bold underline" href={`tel:+45${settings.contactPhone ?? mp}`}>
            {settings.contactPhone ?? mp}
          </a>
          .
        </p>
        <div className="mt-6 text-center">
          <Link href="/tjenester" className="btn btn-sun">
            Køb mere venskab 💛
          </Link>
        </div>
      </div>
    </div>
  );
}
