import { saveSettings } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { PAYMENT_METHODS } from "@/db/schema";
import { emailEnabled } from "@/lib/email";
import { getPaymentConfig, METHOD_INFO } from "@/lib/payments";
import { getSettings } from "@/lib/queries";
import { uploadsEnabled } from "@/lib/upload";

function Field({ name, label, hint, value }: { name: string; label: string; hint?: string; value?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input name={name} defaultValue={value ?? ""} className="input mt-1" />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export default async function SettingsPage() {
  const settings = await getSettings();
  const cfg = getPaymentConfig(settings);
  const wanted = (settings.paymentMethods ?? PAYMENT_METHODS.join(",")).split(",");
  const needs: Record<string, string> = {
    mobilepay: cfg.mobilepayNumber ? "" : "Mangler MobilePay-nummer",
    bank: cfg.bank ? "" : "Mangler reg.nr. og kontonummer",
    paypal: cfg.paypal ? "" : "Mangler PayPal-e-mail eller -link",
    stripe: cfg.stripe ? "" : "Mangler Stripe-nøgler i Vercel",
    crypto: cfg.wallets.length ? "" : "Mangler en tegnebog",
    venskab: "",
  };

  return (
    <div>
      <AdminTitle>Indstillinger ⚙️</AdminTitle>
      <form action={saveSettings} className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="text-xl font-bold">Kontakt</h2>
          <Field name="contactPhone" label="Telefon til kontakt" hint="Bruges til “Ring til mig” og WhatsApp" value={settings.contactPhone} />
          <Field name="contactEmail" label="E-mail til kontakt" hint="Her får du besked om nye ordrer" value={settings.contactEmail} />
          <Field name="introVideo" label="Intro-video på forsiden (YouTube-id)" hint="Fx b2Wab89xhOc" value={settings.introVideo} />
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-xl font-bold">Betalingsmåder</h2>
          <p className="text-sm text-ink-soft">Slå til og fra. En metode vises kun i kurven, når den også er sat op.</p>
          {PAYMENT_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2">
              <input type="checkbox" name={`method_${m}`} defaultChecked={wanted.includes(m)} className="h-5 w-5 accent-coral" />
              <span className="text-xl" aria-hidden="true">{METHOD_INFO[m].emoji}</span>
              <span className="flex-1">
                <span className="block font-bold">{METHOD_INFO[m].label}</span>
                <span className={`text-xs ${needs[m] ? "font-bold text-coral" : "text-ink-soft"}`}>
                  {needs[m] || (cfg.enabled.includes(m) ? "Vises i kurven ✅" : "Slået fra")}
                </span>
              </span>
            </label>
          ))}
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-xl font-bold">💙 Vipps MobilePay</h2>
          <Field name="mobilepayNumber" label="Nummer" value={settings.mobilepayNumber} />
          <Field name="mobilepayName" label="Navn" value={settings.mobilepayName} />
          <h2 className="pt-2 text-xl font-bold">🏦 Bankoverførsel</h2>
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <Field name="bankReg" label="Reg.nr." value={settings.bankReg} />
            <Field name="bankAccount" label="Kontonummer" value={settings.bankAccount} />
          </div>
          <Field name="bankName" label="Kontohaver (valgfrit)" value={settings.bankName} />
          <h2 className="pt-2 text-xl font-bold">🅿️ PayPal</h2>
          <Field
            name="paypalEmail"
            label="PayPal-e-mail (anbefalet)"
            hint="Den e-mail din PayPal-konto er oprettet med. Så udfyldes beløb og ordrenummer automatisk for kunden."
            value={settings.paypalEmail}
          />
          <Field
            name="paypalMe"
            label="Eller dit PayPal-link"
            hint="Fx https://www.paypal.biz/ditnavn eller paypal.me/ditnavn – bruges hvis der ikke er en e-mail"
            value={settings.paypalMe}
          />
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-xl font-bold">🪙 Krypto</h2>
          <label className="block">
            <span className="text-sm font-bold">Tegnebøger – én pr. linje</span>
            <textarea
              name="cryptoWallets"
              defaultValue={settings.cryptoWallets ?? ""}
              className="input mt-1 min-h-28 font-mono text-sm"
              placeholder={"BTC | Bitcoin | bc1q...\nETH | Ethereum | 0x...\nUSDC | Ethereum | 0x..."}
            />
            <span className="mt-1 block text-xs text-ink-soft">
              Format: MØNT | netværk | modtageradresse. Understøttet: BTC, ETH, USDC, USDT, SOL, LTC, DOGE, ADA. Del aldrig din
              hemmelige gendannelsesfrase – kun modtageradressen.
            </span>
          </label>
          {cfg.wallets.length > 0 && (
            <ul className="space-y-1 text-sm">
              {cfg.wallets.map((w) => (
                <li key={w.coin + w.address} className="break-all rounded-xl bg-cream px-3 py-1.5">
                  <strong>{w.coin}</strong> ({w.network}): {w.address}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="lg:col-span-2">
          <button className="btn btn-sun">Gem indstillinger</button>
        </div>
      </form>

      <section className="card mt-8 max-w-5xl space-y-3 p-5">
        <h2 className="text-xl font-bold">Tilslutninger</h2>
        {[
          {
            ok: emailEnabled(),
            name: "E-mail via Simply",
            off: "Slået fra – kræver SMTP_USER og SMTP_PASS i Vercel",
            on: `Mails sendes fra ${process.env.EMAIL_FROM ?? process.env.SMTP_USER}`,
          },
          {
            ok: cfg.stripe && !!process.env.STRIPE_WEBHOOK_SECRET,
            name: "Stripe (kort, Apple Pay, Google Pay, MobilePay)",
            off: cfg.stripe
              ? "Mangler STRIPE_WEBHOOK_SECRET – betalinger bliver ikke registreret automatisk"
              : "Slået fra – kræver STRIPE_SECRET_KEY og STRIPE_WEBHOOK_SECRET i Vercel",
            on: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "Testtilstand – ingen rigtige penge" : "Live – rigtige betalinger",
          },
          {
            ok: uploadsEnabled(),
            name: "Billedupload",
            off: "Slået fra – kræver en Vercel Blob-butik (BLOB_READ_WRITE_TOKEN)",
            on: process.env.BLOB_READ_WRITE_TOKEN ? "Billeder gemmes i Vercel Blob" : "Lokalt: billeder gemmes i public/uploads",
          },
          {
            ok: !!process.env.VERCEL,
            name: "Besøgsstatistik (Vercel Analytics)",
            off: "Kører kun på Vercel",
            on: "Klar – slå “Web Analytics” til under projektets Analytics-fane i Vercel",
          },
        ].map((x) => (
          <div key={x.name} className="flex gap-3 rounded-2xl bg-cream p-3">
            <span className="text-xl" aria-hidden="true">{x.ok ? "🟢" : "⚪"}</span>
            <span>
              <span className="block font-bold">{x.name}</span>
              <span className="text-sm text-ink-soft">{x.ok ? x.on : x.off}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
