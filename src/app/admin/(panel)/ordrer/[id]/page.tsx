import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { addPayment, deletePayment, saveOrderNote, setOrderStatus } from "@/app/admin/actions";
import { AdminTitle, formatDate, StatusPill } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { ORDER_STATUSES } from "@/db/schema";
import { formatAmount, formatKr } from "@/lib/money";
import { STATUS_INFO } from "@/lib/order-status";
import { METHOD_INFO, METHOD_ORDER } from "@/lib/payments";
import { SITE_URL } from "@/lib/site";

export default async function OrderDetail({ params }: PageProps<"/admin/ordrer/[id]">) {
  const { id } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(s.orders.id, Number(id)),
    with: { customer: true, items: true, payments: true },
  });
  if (!order) notFound();
  const paid = order.payments.reduce((n, p) => n + p.amount, 0);
  const customerLink = `${SITE_URL}/ordre/${order.orderNumber}?k=${order.accessToken}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/ordrer" className="font-semibold underline">
        ← Alle ordrer
      </Link>
      <AdminTitle sub={`Oprettet ${formatDate(order.createdAt)}`}>
        {order.orderNumber} <StatusPill status={order.status} />
      </AdminTitle>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-xl font-bold">Indhold</h2>
            <ul className="mt-3 divide-y-2 divide-dashed divide-ink/15">
              {order.items.map((it) => (
                <li key={it.id} className="py-3">
                  <div className="flex justify-between gap-4 font-semibold">
                    <span>
                      {it.productId ? (
                        <Link href={`/admin/produkter/${it.productId}`} className="underline">
                          {it.productName}
                        </Link>
                      ) : (
                        it.productName
                      )}
                      {it.variantName && <span className="text-ink-soft"> – {it.variantName}</span>}
                      {it.quantity > 1 && (
                        <span className="text-ink-soft">
                          {" "}
                          ({it.quantity} × {formatKr(it.unitPrice)})
                        </span>
                      )}
                    </span>
                    <span className="font-display">{it.isBonus ? "🎁 Gratis" : formatKr(it.lineTotal)}</span>
                  </div>
                  {it.answers.length > 0 && (
                    <dl className="mt-2 space-y-1 rounded-xl bg-cream p-3 text-sm">
                      {it.answers.map((a) => (
                        <div key={a.question}>
                          <dt className="font-bold">{a.question}</dt>
                          <dd className="whitespace-pre-wrap">{a.answer}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t-[3px] border-ink pt-3 font-display text-xl font-bold">
              <span>I alt</span>
              <span>{formatKr(order.total)}</span>
            </div>
            {order.isGift && (
              <div className="mt-4 rounded-xl bg-[#ffe5ec] p-3">
                <p className="text-sm font-bold">🎁 Gave til {order.giftRecipient}</p>
                {order.giftMessage && <p className="whitespace-pre-wrap">“{order.giftMessage}”</p>}
                {order.giftToken && (
                  <a className="text-xs underline" href={`${SITE_URL}/gave/${order.orderNumber}?g=${order.giftToken}`}>
                    Gavekortets link (send til modtageren)
                  </a>
                )}
              </div>
            )}
            {order.customerNote && (
              <div className="mt-4 rounded-xl bg-[#fff3b0] p-3">
                <p className="text-sm font-bold">Besked fra kunden</p>
                <p className="whitespace-pre-wrap">{order.customerNote}</p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-bold">Skift status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ORDER_STATUSES.map((st) => (
                <form key={st} action={setOrderStatus.bind(null, order.id, st)}>
                  <button
                    className="btn !px-3 !py-1.5 text-sm"
                    style={{ background: STATUS_INFO[st].color }}
                    disabled={order.status === st}
                  >
                    {STATUS_INFO[st].emoji} {STATUS_INFO[st].label}
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              Betalt: {formatDate(order.paidAt)} · Leveret: {formatDate(order.deliveredAt)}
            </p>
            <Link
              href={`/admin/leverancer/ny?ordre=${order.id}${order.items[0]?.productId ? `&produkt=${order.items[0].productId}` : ""}`}
              className="btn btn-white mt-4 !py-1.5 text-sm"
            >
              📔 Skriv levering i dagbogen
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-bold">Noter (kun for dig)</h2>
            <form action={saveOrderNote.bind(null, order.id)} className="mt-3 space-y-2">
              <textarea name="adminNote" defaultValue={order.adminNote} className="input min-h-24" />
              <button className="btn btn-white !py-1.5">Gem note</button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-xl font-bold">Kunde</h2>
            <p className="mt-2 font-semibold">
              <Link href={`/admin/kunder/${order.customer.id}`} className="underline">
                {order.customer.name}
              </Link>
              {order.customer.nickname && <span className="text-ink-soft"> ({order.customer.nickname})</span>}
            </p>
            {order.customer.email && (
              <p>
                ✉️ <a className="underline" href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
              </p>
            )}
            {order.customer.phone && (
              <p>
                📞 <a className="underline" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
              </p>
            )}
            <p className="mt-2 text-sm">
              {order.customer.allowMention ? "✅ Må gerne nævnes" : "🙅 Må ikke nævnes"}
            </p>
            <p className="mt-3 break-all text-xs text-ink-soft">
              Kundens ordreside: <a className="underline" href={customerLink}>{customerLink}</a>
            </p>
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-bold">Betalinger 💙</h2>
            <p className="mt-2 rounded-xl px-3 py-2 font-bold text-white" style={{ background: METHOD_INFO[order.paymentMethod].color }}>
              {METHOD_INFO[order.paymentMethod].emoji} Valgt: {METHOD_INFO[order.paymentMethod].label}
            </p>
            {order.paymentDetails?.barterOffer && (
              <p className="mt-2 rounded-xl bg-[#ffe5ec] p-3 text-sm">
                <strong>Byttetilbud:</strong> “{order.paymentDetails.barterOffer}”
              </p>
            )}
            {order.paymentDetails?.crypto && (
              <p className="mt-2 break-all rounded-xl bg-cream p-3 text-sm">
                <strong>
                  {order.paymentDetails.crypto.amount} {order.paymentDetails.crypto.coin}
                </strong>{" "}
                ({order.paymentDetails.crypto.network}) til {order.paymentDetails.crypto.address}
                <br />
                Kurs {order.paymentDetails.crypto.rateDkk.toLocaleString("da-DK")} kr. ·{" "}
                {formatDate(new Date(order.paymentDetails.crypto.quotedAt))}
              </p>
            )}
            {order.stripeSessionId && (
              <p className="mt-2 break-all text-xs text-ink-soft">Stripe: {order.stripeSessionId}</p>
            )}
            <p className="mt-1 text-sm">
              Modtaget {formatKr(paid)} af {formatKr(order.total)}
              {paid >= order.total ? " ✅" : ""}
            </p>
            {order.payments.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2">
                    <span>
                      {METHOD_INFO[p.method].emoji} <strong>{formatKr(p.amount)}</strong> · {formatDate(p.receivedAt)}
                      {p.reference && ` · ${p.reference}`}
                      {p.note && <span className="block text-ink-soft">{p.note}</span>}
                    </span>
                    <form action={deletePayment.bind(null, p.id)}>
                      <button className="text-coral" aria-label="Slet betaling">
                        ✖
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={addPayment.bind(null, order.id)} className="mt-4 space-y-2">
              <label className="block text-sm font-bold">
                Beløb modtaget (kr.)
                <input
                  name="amount"
                  className="input mt-1"
                  defaultValue={formatAmount(Math.max(0, order.total - paid))}
                  inputMode="decimal"
                  required
                />
              </label>
              <label className="block text-sm font-bold">
                Betalingsmåde
                <select name="method" defaultValue={order.paymentMethod} className="input mt-1">
                  {METHOD_ORDER.map((m) => (
                    <option key={m} value={m}>
                      {METHOD_INFO[m].emoji} {METHOD_INFO[m].label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-ink-soft">
                Ved “Betal med venskab” registrerer du ordrens beløb, når byttet er aftalt.
              </p>
              <label className="block text-sm font-bold">
                Besked / reference
                <input name="reference" className="input mt-1" defaultValue={order.orderNumber} />
              </label>
              <label className="block text-sm font-bold">
                Note
                <input name="note" className="input mt-1" />
              </label>
              <button className="btn btn-mint w-full">Registrér betaling</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
