import type { Metadata } from "next";
import Link from "next/link";
import { FriendshipSubscription } from "@/components/friendship-subscription";
import { Reveal } from "@/components/reveal";
import { DriftingClouds, Sun } from "@/components/sky";
import { getPaymentConfig, paypalLink } from "@/lib/payments";
import { getSettings } from "@/lib/queries";
import {
  breakEvenMonth,
  formatDuration,
  formatMonthly,
  LAST_TIER,
  TIERS,
  totalAfter,
  type SubscriptionMethod,
} from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Venskabsabonnementet – jo længere vi er venner, jo billigere bliver det",
  description:
    "Start på 79 kr. om måneden. Prisen falder hvert år, og efter 10 år betaler jeg dig. Uanmeldte kaffebesøg og uopfordrede råd er inkluderet.",
};

/** Lille trappediagram: en søjle pr. venskabsår, den sidste under nul */
function PriceStairs() {
  const max = TIERS[0].price;
  const min = LAST_TIER.price;
  const W = 640;
  const H = 280;
  const pad = { top: 28, bottom: 54, left: 8, right: 8 };
  const y = (v: number) => pad.top + ((max - v) / (max - min)) * (H - pad.top - pad.bottom);
  const bw = (W - pad.left - pad.right) / TIERS.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Månedsprisen falder fra 79 kr. i år 1 til minus 5 kr. fra år 10">
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="#2b2d42" strokeWidth={3} />
      {TIERS.map((t, i) => {
        const x = pad.left + i * bw + 5;
        const top = Math.min(y(t.price), y(0));
        const h = Math.max(Math.abs(y(t.price) - y(0)), 3);
        const neg = t.price < 0;
        return (
          <g key={t.year}>
            <rect
              x={x}
              y={top}
              width={bw - 10}
              height={h}
              rx={8}
              fill={neg ? "#06d6a0" : t.price === 0 ? "#bde0fe" : i < 3 ? "#ff6b6b" : i < 6 ? "#ffb703" : "#ffd23f"}
              stroke="#2b2d42"
              strokeWidth={3}
            />
            <text
              x={x + (bw - 10) / 2}
              y={neg ? top + h + 16 : top - 8}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fill="#2b2d42"
            >
              {formatMonthly(t.price).replace(" kr.", "")}
            </text>
            <text x={x + (bw - 10) / 2} y={H - 6} textAnchor="middle" fontSize={13} fill="#5c5f7a">
              {t.year === LAST_TIER.year ? `år ${t.year}+` : `år ${t.year}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function SubscriptionPage() {
  const settings = await getSettings();
  const cfg = getPaymentConfig(settings);
  const mp = settings.mobilepayNumber || "60614309";
  const bmac = settings.buymeacoffeeUrl?.trim() || undefined;
  const methods: SubscriptionMethod[] = [
    ...(cfg.bank ? (["bank"] as const) : []),
    "mobilepay",
    ...(cfg.paypal ? (["paypal"] as const) : []),
    ...(bmac ? (["buymeacoffee"] as const) : []),
  ];
  const breakEven = breakEvenMonth();
  const paidBeforeRefund = totalAfter((LAST_TIER.year - 1) * 12);
  const paypal = cfg.paypal ? paypalLink(cfg.paypal, { orderNumber: "Venskabsabonnement", total: TIERS[0].price }) : null;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sky to-cream">
        <DriftingClouds count={4} />
        <Sun size={150} className="absolute right-4 top-4 hidden sm:block" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="animate-float text-6xl" aria-hidden="true">📉</p>
          <h1 className="mt-2 text-5xl font-bold sm:text-6xl">Venskabsabonnementet</h1>
          <p className="mt-4 text-xl font-semibold">
            Det eneste abonnement, der bliver <em>billigere</em>, jo længere du har det. Start på 79 kr. om måneden – og
            efter 10 år betaler jeg dig.
          </p>
          <a href="#tegn" className="btn btn-coral mt-6 text-lg">
            Beregn din pris ↓
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-[1.4fr_1fr]">
        <Reveal className="card p-6">
          <h2 className="text-3xl font-bold">Prisen falder hvert år 🪜</h2>
          <p className="mt-2 text-lg">
            På hver venskabsdag falder månedsprisen med 10 kr. I år 9 er venskabet gratis. Fra år 10 er det{" "}
            <strong>rentabelt</strong>: så overfører jeg 5 kr. til dig. Hver måned. Resten af livet.
          </p>
          <div className="mt-4">
            <PriceStairs />
          </div>
        </Reveal>
        <Reveal className="card rotate-1 bg-mint p-6" delay={120}>
          <h2 className="text-3xl font-bold">Regnestykket 🧮</h2>
          <p className="mt-3 text-lg">
            I de første 9 år betaler du i alt <strong>{formatMonthly(paidBeforeRefund)}</strong>.
          </p>
          <p className="mt-3 text-lg">
            Med 5 kr. retur om måneden har du fået det hele tilbage efter{" "}
            <strong>{formatDuration(breakEven)}</strong> venskab.
          </p>
          <p className="mt-3 text-lg font-semibold">Vi ses på plejehjemmet. Jeg tager kaffen med. ☕</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-16">
        <Reveal>
          <h2 className="text-center text-4xl font-bold">Det får du for pengene 🎁</h2>
          <p className="mt-2 text-center text-ink-soft">
            Alle fordele fra de tidligere trin følger med, så et langt venskab rummer det hele.
          </p>
        </Reveal>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal
              as="li"
              key={t.year}
              delay={(i % 3) * 60}
              className={`card flex flex-col p-5 ${t.price < 0 ? "bg-mint lg:col-span-3" : t.price === 0 ? "bg-sky" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                    {t.year === LAST_TIER.year ? `År ${t.year} og frem` : `År ${t.year}`}
                  </p>
                  <h3 className="text-2xl font-bold">
                    <span aria-hidden="true">{t.emoji} </span>
                    {t.name}
                  </h3>
                </div>
                <p className="whitespace-nowrap rounded-full border-[3px] border-ink bg-sun px-3 py-1 font-display text-lg font-bold">
                  {formatMonthly(t.price)}/md.
                </p>
              </div>
              <p className="mt-1 italic text-ink-soft">{t.tagline}</p>
              <ul className="mt-3 space-y-1.5">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden="true">✔️</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="tegn" className="mx-auto max-w-5xl scroll-mt-24 px-4 pt-16">
        <Reveal>
          <h2 className="mb-6 text-center text-4xl font-bold">Hvad koster vores venskab? 💸</h2>
        </Reveal>
        <FriendshipSubscription methods={methods} />
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-16">
        <Reveal>
          <h2 className="text-center text-4xl font-bold">Sådan sætter du betalingen op 🔁</h2>
          <p className="mt-2 text-center text-ink-soft">
            Du får en mail på vores venskabsdag, så du kan rette beløbet, når prisen falder.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {cfg.bank && (
            <Reveal className="card p-6 md:col-span-2">
              <p className="inline-block rounded-full bg-mint px-3 py-0.5 text-sm font-bold">Anbefalet · gratis</p>
              <h3 className="mt-2 text-2xl font-bold">🏦 Fast overførsel fra din netbank</h3>
              <p className="mt-2">
                Alle danske banker kan lave en fast, månedlig overførsel. Den kører af sig selv, koster ingenting, og du
                kan rette beløbet hvert år.
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5">
                <li>Gå til “Betal og overfør” → “Ny overførsel” i netbanken eller bankens app.</li>
                <li>
                  Modtager: reg.nr. <strong className="font-mono">{cfg.bank.reg}</strong>, konto{" "}
                  <strong className="font-mono">{cfg.bank.account}</strong>
                  {cfg.bank.name && <> ({cfg.bank.name})</>}.
                </li>
                <li>Beløb: din pris fra beregneren ovenfor.</li>
                <li>Vælg “Gentag” / “Fast overførsel” hver måned, fx den 1.</li>
                <li>
                  Tekst til modtager: <strong>Venskab + dit fornavn</strong>.
                </li>
              </ol>
            </Reveal>
          )}
          <Reveal className="card p-6">
            <h3 className="text-2xl font-bold">💙 MobilePay</h3>
            <p className="mt-2">
              Send din månedspris til{" "}
              <span className="whitespace-nowrap rounded-lg bg-mobilepay px-2 font-bold text-white">{mp}</span> med
              beskeden <strong>Abonnement</strong>.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Mellem to privatpersoner kan MobilePay ikke trække et fast beløb af sig selv. Sæt en påmindelse i
              kalenderen den 1. hver måned – det er også en god anledning til at tænke på mig.
            </p>
          </Reveal>
          {paypal && (
            <Reveal className="card p-6" delay={60}>
              <h3 className="text-2xl font-bold">🅿️ PayPal</h3>
              <p className="mt-2">Betal måned for måned med din PayPal-konto.</p>
              <a href={paypal.url} target="_blank" rel="noreferrer" className="btn btn-white mt-3">
                Betal første måned med PayPal ↗
              </a>
              <p className="mt-2 text-sm text-ink-soft">
                Automatiske PayPal-abonnementer kræver en erhvervskonto, så indtil videre er det manuelt.
              </p>
            </Reveal>
          )}
          {bmac && (
            <Reveal className="card p-6" delay={120}>
              <h3 className="text-2xl font-bold">☕ Buy Me a Coffee</h3>
              <p className="mt-2">
                Vælg det medlemskab, der passer til dit venskabsår. Det trækkes automatisk hver måned med kort eller
                PayPal.
              </p>
              <a href={bmac} target="_blank" rel="noreferrer" className="btn btn-sun mt-3">
                Vælg medlemskab ↗
              </a>
              <p className="mt-2 text-sm text-ink-soft">
                Buy Me a Coffee tager 5 % i gebyr. Det er prisen for, at en tredjepart blander sig i vores venskab.
              </p>
            </Reveal>
          )}
          <Reveal className="card bg-sun p-6 md:col-span-2" delay={60}>
            <h3 className="text-2xl font-bold">📜 Med småt</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Prisen reguleres ikke efter nettoprisindekset. Den reguleres efter, hvor mange gange du har hørt min historie fra Roskilde 2009.</li>
              <li>Uanmeldte kaffebesøg kan ikke overføres til andre venner eller veksles til kontanter.</li>
              <li>Opsiger du og fortryder, starter du forfra på 79 kr. Venskab er ikke noget, man pauser.</li>
              <li>
                Udbetalingen på 5 kr. sker til dit MobilePay-nummer. Jeg forbeholder mig retten til at runde op, hvis du har
                haft det svært.
              </li>
            </ul>
            <p className="mt-3">
              Vil du hellere have det gamle abonnement med digte og himmelstykker?{" "}
              <Link href="/tjenester/venskabsabonnement" className="font-bold underline">
                Det findes stadig
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
