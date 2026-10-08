import QRCode from "qrcode";
import { startStripePayment, switchPaymentMethod } from "@/app/actions";
import type { PaymentDetails, PaymentMethod } from "@/db/schema";
import { formatAmount } from "@/lib/money";
import { cryptoUri, METHOD_INFO, paypalLink, STRIPE_MIN_OERE, type PaymentConfig } from "@/lib/payments";
import { CopyButton } from "./copy-button";

type Order = {
  orderNumber: string;
  accessToken: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails | null;
};

/** Hvor gammel kryptokursen er (beregnes på serveren ved hver visning) */
function minutesSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

function Rows({ rows }: { rows: { k: string; v: string; copy?: string }[] }) {
  return (
    <dl className="divide-y-2 divide-dashed divide-ink/20">
      {rows.map((row) => (
        <div key={row.k} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <dt className="font-semibold text-ink-soft">{row.k}</dt>
          <dd className="flex min-w-0 items-center gap-3">
            <span className="break-all font-display text-xl font-bold sm:text-2xl">{row.v}</span>
            {row.copy && <CopyButton value={row.copy} label={row.k} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export async function PaymentPanel({
  order,
  cfg,
  justPaidWithStripe,
}: {
  order: Order;
  cfg: PaymentConfig;
  justPaidWithStripe: boolean;
}) {
  const info = METHOD_INFO[order.paymentMethod];
  const amount = formatAmount(order.total);
  const crypto = order.paymentDetails?.crypto;
  const cryptoQr = crypto ? await QRCode.toString(cryptoUri(crypto, crypto.amount), { type: "svg", margin: 1, width: 220 }) : null;
  const quoteAgeMin = crypto ? minutesSince(crypto.quotedAt) : 0;
  const switchAction = switchPaymentMethod.bind(null, order.orderNumber, order.accessToken);
  const others = cfg.enabled.filter((m) => m !== order.paymentMethod && !(m === "stripe" && order.total < STRIPE_MIN_OERE));

  return (
    <section className="card mt-10 animate-pop-in overflow-hidden" aria-labelledby="betal">
      <div className="px-6 py-4 text-white" style={{ background: info.color }}>
        <h2 id="betal" className="text-2xl font-bold">
          {info.emoji} {order.paymentMethod === "venskab" ? "Betal med venskab" : `Betal med ${info.label}`}
        </h2>
      </div>

      {order.paymentMethod === "mobilepay" && (
        <>
          <p className="px-6 pt-4 font-semibold">Åbn Vipps MobilePay-appen og send en betaling sådan her:</p>
          <Rows
            rows={[
              { k: "1. Send til nummer", v: cfg.mobilepayNumber ?? "", copy: cfg.mobilepayNumber },
              { k: "2. Beløb", v: `${amount} kr.`, copy: amount },
              { k: "3. Skriv i beskeden", v: order.orderNumber, copy: order.orderNumber },
            ]}
          />
        </>
      )}

      {order.paymentMethod === "bank" && cfg.bank && (
        <>
          <p className="px-6 pt-4 font-semibold">Overfør fra din netbank:</p>
          <Rows
            rows={[
              { k: "Reg.nr.", v: cfg.bank.reg, copy: cfg.bank.reg },
              { k: "Kontonummer", v: cfg.bank.account, copy: cfg.bank.account },
              ...(cfg.bank.name ? [{ k: "Modtager", v: cfg.bank.name }] : []),
              { k: "Beløb", v: `${amount} kr.`, copy: amount },
              { k: "Tekst til modtager", v: order.orderNumber, copy: order.orderNumber },
            ]}
          />
          <p className="px-6 pb-4 text-sm text-ink-soft">En almindelig bankoverførsel tager typisk 1–2 bankdage.</p>
        </>
      )}

      {order.paymentMethod === "paypal" && cfg.paypalMe && (
        <div className="space-y-4 p-6">
          <p className="font-semibold">Tryk på knappen – beløbet er udfyldt. Skriv dit ordrenummer i beskeden til mig.</p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={paypalLink(cfg.paypalMe, order.total)} target="_blank" rel="noreferrer" className="btn text-white" style={{ background: info.color }}>
              🅿️ Betal {amount} kr. med PayPal
            </a>
            <span className="font-display text-xl font-bold">{order.orderNumber}</span>
            <CopyButton value={order.orderNumber} label="ordrenummer" />
          </div>
        </div>
      )}

      {order.paymentMethod === "stripe" && (
        <div className="space-y-4 p-6">
          {justPaidWithStripe ? (
            <p className="rounded-2xl border-2 border-ink bg-mint p-4 font-semibold">
              🎉 Tak! Stripe bekræfter din betaling – siden opdateres om et øjeblik. Genindlæs gerne om lidt.
            </p>
          ) : (
            <p className="font-semibold">Betal sikkert med kort, Apple Pay, Google Pay eller MobilePay via Stripe.</p>
          )}
          <form action={startStripePayment.bind(null, order.orderNumber, order.accessToken)}>
            <button className="btn text-white" style={{ background: info.color }}>
              💳 {justPaidWithStripe ? "Prøv igen" : `Betal ${amount} kr. nu`}
            </button>
          </form>
        </div>
      )}

      {order.paymentMethod === "crypto" && crypto && (
        <div className="grid items-center gap-6 p-6 sm:grid-cols-[220px_1fr]">
          <div
            className="mx-auto overflow-hidden rounded-2xl border-[3px] border-ink bg-white"
            role="img"
            aria-label={`QR-kode til ${crypto.coin}-adressen`}
            dangerouslySetInnerHTML={{ __html: cryptoQr! }}
          />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink-soft">Send præcis</p>
              <p className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold">
                {crypto.amount} {crypto.coin}
                <CopyButton value={crypto.amount} label="beløb" />
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-soft">Til adressen ({crypto.network})</p>
              <p className="flex flex-wrap items-center gap-2 break-all font-mono text-sm">
                {crypto.address}
                <CopyButton value={crypto.address} label="adresse" />
              </p>
            </div>
            <p className="text-sm text-ink-soft">
              Kurs: 1 {crypto.coin} = {crypto.rateDkk.toLocaleString("da-DK")} kr. ({amount} kr.). Send kun {crypto.coin} på{" "}
              {crypto.network}-netværket.
            </p>
            {quoteAgeMin > 30 && (
              <form action={switchAction}>
                <input type="hidden" name="method" value="crypto" />
                <input type="hidden" name="cryptoCoin" value={crypto.coin} />
                <button className="btn btn-sun !py-1.5 text-sm">🔄 Kursen er over 30 min. gammel – hent ny</button>
              </form>
            )}
          </div>
        </div>
      )}

      {order.paymentMethod === "venskab" && (
        <div className="space-y-3 p-6">
          <p className="font-semibold">Du har tilbudt at betale med venskab:</p>
          <blockquote className="rounded-2xl border-[3px] border-dashed border-pink bg-[#ffe5ec] p-4 text-lg italic">
            “{order.paymentDetails?.barterOffer}”
          </blockquote>
          <p>Jeg kigger på dit tilbud og vender tilbage. Når byttet er aftalt, markerer jeg ordren som betalt. 💛</p>
        </div>
      )}

      {order.paymentMethod === "crypto" && (
        <p className="bg-[#fff3b0] px-6 py-4 text-sm font-semibold">
          ☝️ Send præcis det viste beløb, så kan jeg genkende din betaling. Jeg går i gang, når den er bekræftet på
          netværket.
        </p>
      )}

      {(order.paymentMethod === "mobilepay" || order.paymentMethod === "bank" || order.paymentMethod === "paypal") && (
        <p className="bg-[#fff3b0] px-6 py-4 text-sm font-semibold">
          ☝️ Husk ordrenummeret {order.orderNumber} – så ved jeg, at betalingen er fra dig. Når jeg har modtaget den, går jeg i
          gang og kontakter dig.
        </p>
      )}

      {others.length > 0 && (
        <details className="border-t-[3px] border-dashed border-ink/20 px-6 py-4">
          <summary className="cursor-pointer font-display font-semibold">Vil du hellere betale på en anden måde?</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map((m) => (
              <form key={m} action={switchAction} className="rounded-2xl border-2 border-ink/30 p-3">
                <input type="hidden" name="method" value={m} />
                {m === "venskab" && (
                  <textarea
                    name="barterOffer"
                    required
                    minLength={5}
                    className="input mb-2 min-h-16 text-sm"
                    placeholder="Hvad vil du give til gengæld?"
                  />
                )}
                {m === "crypto" && cfg.wallets.length > 1 && (
                  <select name="cryptoCoin" className="input mb-2 text-sm" aria-label="Mønt">
                    {cfg.wallets.map((w) => (
                      <option key={w.coin} value={w.coin}>
                        {w.coin} ({w.network})
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn btn-white w-full !py-1.5 text-sm">
                  {METHOD_INFO[m].emoji} {METHOD_INFO[m].label}
                </button>
              </form>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
