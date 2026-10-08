import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { DriftingClouds, Sun } from "@/components/sky";
import { formatKr, priceCode } from "@/lib/money";
import { getPaymentConfig, METHOD_INFO } from "@/lib/payments";
import { getSettings, getShopProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Sådan betaler du – priser og varenumre",
  description: "Du køber, når du åbner MobilePay og sender beløbet. Prisen er også varenummeret!",
};

export default async function PricesPage() {
  const [products, settings] = await Promise.all([getShopProducts(), getSettings()]);
  const mp = settings.mobilepayNumber ?? "60614309";
  const methods = getPaymentConfig(settings).enabled;
  const sorted = [...products].sort((a, b) => a.fromPrice - b.fromPrice);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sky to-cream">
        <DriftingClouds count={4} />
        <Sun size={150} className="absolute right-4 top-4 hidden sm:block" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="animate-float text-6xl" aria-hidden="true">💸</p>
          <h1 className="mt-2 text-5xl font-bold sm:text-6xl">Sådan betaler du</h1>
          <p className="mt-4 text-xl font-semibold">
            Du køber, når du åbner din MobilePay-app og sender beløbet til{" "}
            <span className="whitespace-nowrap rounded-lg bg-mobilepay px-2 text-white">{mp}</span>
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-2">
        <Reveal className="card -rotate-1 p-7">
          <h2 className="text-3xl font-bold">Prisen er varenummeret 🤯</h2>
          <p className="mt-3 text-lg">
            Priserne er unikke, så jeg kan bruge MobilePay-overførslerne som varenummer. Hvis du fx overfører{" "}
            <strong>5 kr. og 40 øre</strong>, så får du en lussing – fordi en lussing har varenummer <strong>5,4</strong>.
          </p>
          <p className="mt-3 text-lg">
            Nogle varer har variable priser, hvor det er de sidste to cifre, der er vigtige. Du kan fx overføre 200,25 kr.
            eller 533,25 kr. for mad til en hjemløs – så længe det ender på <strong>,25</strong>.
          </p>
        </Reveal>
        <Reveal className="card rotate-1 bg-sun p-7" delay={120}>
          <h2 className="text-3xl font-bold">Nu endnu nemmere ✨</h2>
          <ol className="mt-3 space-y-3 text-lg">
            <li>🛒 Læg dine venskaber i kurven – gerne flere på én gang.</li>
            <li>📝 Bestil, og få et ordrenummer, fx <strong>VC-1042</strong>.</li>
            <li>💸 Vælg hvordan du vil betale – du får vejledningen med det samme.</li>
            <li>🎉 Når betalingen er modtaget, går jeg i gang!</li>
          </ol>
        </Reveal>
        <Reveal className="card p-7 md:col-span-2" delay={60}>
          <h2 className="text-3xl font-bold">Du kan betale med</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {methods.map((m) => (
              <li
                key={m}
                className="flex items-center gap-3 rounded-2xl border-[3px] border-ink px-4 py-3"
                style={{ background: `color-mix(in srgb, ${METHOD_INFO[m].color} 18%, white)` }}
              >
                <span className="text-3xl" aria-hidden="true">{METHOD_INFO[m].emoji}</span>
                <span>
                  <span className="block font-display text-lg font-bold">{METHOD_INFO[m].label}</span>
                  <span className="block text-sm text-ink-soft">{METHOD_INFO[m].text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="card p-7 md:col-span-2" delay={60}>
          <p className="text-lg">
            Vær opmærksom på, at jeg på et tidspunkt vil skrive om, hvem der har købt hvad – med fornavn eller dæknavn.
            Hvis du har et problem med det, så sæt bare et kryds ved bestillingen, så gør jeg det ikke. Jeg er her ikke
            for at blive uvenner. 😇
          </p>
          <p className="mt-3 text-lg font-semibold">
            Forstår du det ikke? Ring til mig på{" "}
            <a className="underline" href={`tel:+45${settings.contactPhone ?? mp}`}>
              {settings.contactPhone ?? mp}
            </a>
            .
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-16">
        <Reveal>
          <h2 className="text-center text-4xl font-bold">Hele prislisten 📋</h2>
          <p className="mt-2 text-center text-ink-soft">Køb mit venskab – sammensæt selv, hvad vores relation skal bestå i.</p>
        </Reveal>
        <Reveal className="card mt-8 overflow-hidden" delay={80}>
          <table className="w-full text-left">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-3 font-display">Venskabselement</th>
                <th className="px-4 py-3 text-right font-display">Varenr.</th>
                <th className="px-4 py-3 text-right font-display">Pris</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} className={i % 2 ? "bg-cream" : "bg-white"}>
                  <td className="px-4 py-2.5">
                    <Link href={`/tjenester/${p.slug}`} className="font-semibold hover:underline">
                      <span aria-hidden="true">{p.emoji} </span>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-soft">
                    {p.priceKind === "custom" ? `*,${String(p.priceEndsWith ?? 0).padStart(2, "0")}` : priceCode(p.fromPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-display font-bold">
                    {p.priceKind === "custom"
                      ? "Du vælger"
                      : `${p.hasVariantPrices ? "fra " : ""}${formatKr(p.fromPrice)}${p.unitLabel ? ` / ${p.unitLabel}` : ""}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>
    </>
  );
}
