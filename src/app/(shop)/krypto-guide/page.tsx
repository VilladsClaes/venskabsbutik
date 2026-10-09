import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceHero } from "@/components/experience-bits";
import { Reveal } from "@/components/reveal";
import { getPaymentConfig } from "@/lib/payments";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Første gang med krypto? – en guide",
  description: "Sådan betaler du med Bitcoin eller anden krypto i Venskabsbutikken – trin for trin, også hvis du aldrig har prøvet det før.",
};

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum (Ether)",
  USDC: "USD Coin",
  USDT: "Tether",
  SOL: "Solana",
  LTC: "Litecoin",
  DOGE: "Dogecoin",
  ADA: "Cardano",
};

const TIMES: Record<string, string> = {
  BTC: "typisk 10–60 minutter",
  ETH: "typisk få minutter",
  USDC: "typisk få minutter",
  USDT: "typisk få minutter",
  SOL: "typisk under ét minut",
  LTC: "typisk 5–30 minutter",
  DOGE: "typisk få minutter",
  ADA: "typisk få minutter",
};

function Step({ n, emoji, title, children }: { n: number; emoji: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal as="li" className="card relative p-6 pl-20">
      <span className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink bg-sun font-display text-xl font-bold">
        {n}
      </span>
      <h3 className="text-2xl font-bold">
        {title} <span aria-hidden="true">{emoji}</span>
      </h3>
      <div className="mt-2 space-y-2 text-lg">{children}</div>
    </Reveal>
  );
}

export default async function CryptoGuidePage() {
  const cfg = getPaymentConfig(await getSettings());
  const coins = cfg.wallets;

  return (
    <>
      <ExperienceHero
        emoji="🪙"
        title="Første gang med krypto?"
        color="#ffe0b3"
        back={{ href: "/priser", label: "← Sådan betaler du" }}
      >
        Bare rolig – det er nemmere end det lyder. Her er hele turen fra “hvad er en wallet?” til “betalt!”, trin for trin.
      </ExperienceHero>

      <div className="mx-auto max-w-3xl space-y-12 px-4 py-10">
        {coins.length > 0 && (
          <Reveal className="card bg-[#fff3b0] p-5">
            <p className="font-display text-lg font-bold">I Venskabsbutikken kan du betale med:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {coins.map((c) => (
                <li key={c.coin} className="rounded-full border-2 border-ink bg-white px-3 py-1 font-bold">
                  {c.coin} – {COIN_NAMES[c.coin] ?? c.coin} <span className="font-normal text-ink-soft">({c.network}-netværket)</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <section>
          <h2 className="text-3xl font-bold">De tre ord, du skal kende 🧠</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Wallet", e: "👛", d: "En app, der holder styr på dine kryptopenge – ligesom en pung. Den kan ligge i en børs-app eller være en selvstændig app." },
              { t: "Adresse", e: "📬", d: "Et langt “kontonummer” til at modtage krypto. Min adresse står på din ordreside – også som QR-kode." },
              { t: "Netværk", e: "🛤️", d: "Den “vej” pengene sendes ad, fx Bitcoin eller Ethereum. Mønt og netværk skal passe, ellers går pengene tabt." },
            ].map((x) => (
              <div key={x.t} className="card p-4">
                <dt className="font-display text-xl font-bold">
                  <span aria-hidden="true">{x.e}</span> {x.t}
                </dt>
                <dd className="mt-1 text-ink-soft">{x.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-3xl font-bold">Sådan gør du – den nemme vej 🛣️</h2>
          <p className="mt-2 text-lg text-ink-soft">
            Den nemmeste vej for nybegyndere er en <strong>børs-app</strong>: Du køber kryptoen i appen og sender den direkte
            videre til mig. Så har du både “bank” og wallet samme sted.
          </p>
          <ol className="mt-6 space-y-5">
            <Step n={1} emoji="📱" title="Hent en børs-app">
              <p>
                Vælg en app, der er godkendt til at handle krypto i EU. Kendte eksempler i Danmark er <strong>Coinbase</strong>,{" "}
                <strong>Kraken</strong>, <strong>Bitpanda</strong>, <strong>Firi</strong> og <strong>Revolut</strong>.
              </p>
              <p className="text-base text-ink-soft">
                Jeg har ingen aftale med nogen af dem og anbefaler ikke én frem for en anden. Tjek selv gebyrer, og om appen
                kan sende krypto ud (ikke alle kan).
              </p>
            </Step>
            <Step n={2} emoji="🪪" title="Opret en konto">
              <p>
                Du skal bekræfte, hvem du er – typisk med MitID eller pas og en selfie. Det er et lovkrav i EU og tager som regel
                5–15 minutter. Første gang kan det tage op til et døgn, før du bliver godkendt.
              </p>
            </Step>
            <Step n={3} emoji="💸" title="Sæt kroner ind">
              <p>
                Fyld penge på med betalingskort, Apple Pay/Google Pay eller bankoverførsel – afhængigt af appen. Kort er
                hurtigst; bankoverførsel er ofte billigst.
              </p>
            </Step>
            <Step n={4} emoji="🛒" title="Køb mønten">
              <p>
                Køb den mønt, du vil betale med (se øverst). Køb <strong>lidt mere</strong> end ordrens beløb – appen tager
                ofte et lille gebyr, når du sender krypto ud.
              </p>
            </Step>
            <Step n={5} emoji="📤" title="Send til mig">
              <ol className="ml-5 list-decimal space-y-1">
                <li>Tryk på mønten og vælg <strong>“Send”</strong> (nogle apps kalder det “Udbetal” eller “Withdraw”).</li>
                <li>
                  <strong>Scan QR-koden</strong> på din ordreside – eller tryk “Kopiér” ved adressen og indsæt den.
                </li>
                <li>
                  Vælg <strong>det rigtige netværk</strong> – det står ved adressen på ordresiden (fx “Bitcoin” eller
                  “Ethereum”).
                </li>
                <li>
                  Skriv <strong>præcis det beløb</strong>, der står på ordresiden, i mønten (fx 0,00018113 BTC) – ikke i kroner.
                </li>
                <li>Tjek at de første og sidste tegn i adressen passer, og godkend.</li>
              </ol>
            </Step>
            <Step n={6} emoji="⏳" title="Vent lidt – så er du færdig">
              <p>
                Betalingen skal bekræftes på netværket. Det tager{" "}
                {coins.length ? coins.map((c) => `${TIMES[c.coin] ?? "lidt tid"} for ${c.coin}`).join(", ") : "lidt tid"}.
                Når jeg kan se den, markerer jeg ordren som betalt, og du får besked. 🎉
              </p>
            </Step>
          </ol>
        </section>

        <Reveal className="card bg-[#ffe5ec] p-6">
          <h2 className="text-2xl font-bold">Gode råd og sikkerhed 🛡️</h2>
          <ul className="mt-3 space-y-2 text-lg">
            <li>
              🙅 <strong>Del aldrig din gendannelsesfrase</strong> (de 12–24 ord). Hverken jeg eller nogen app har brug for
              den. Spørger nogen efter den, er det svindel.
            </li>
            <li>🔍 Tjek altid mønt, netværk og adresse to gange. Krypto kan ikke fortrydes, hvis den sendes forkert.</li>
            <li>
              🪙 Ved helt små beløb kan netværksgebyret være større end selve købet – især for Bitcoin. Til små ordrer er
              Vipps MobilePay eller “Betal med venskab” ofte smartere.
            </li>
            <li>📈 Kryptokurser svinger. Beløbet på ordresiden er låst i 30 minutter – derefter kan du hente en ny kurs.</li>
            <li>🧾 Gem gerne kvitteringen fra appen, til du har fået besked om, at ordren er betalt.</li>
          </ul>
        </Reveal>

        <Reveal className="card p-6">
          <h2 className="text-2xl font-bold">Vil du have din egen wallet? 👛</h2>
          <p className="mt-2 text-lg">
            Når du er blevet varm i trøjen, kan du flytte dine mønter til en <strong>selvstændig wallet-app</strong>, hvor kun du
            har nøglen – fx Exodus, Trust Wallet, MetaMask (Ethereum) eller BlueWallet (Bitcoin). Så er det dig selv, der passer
            på gendannelsesfrasen: skriv den på papir og gem den et sikkert sted. Til at betale i butikken er en børs-app dog
            helt fint.
          </p>
        </Reveal>

        <div className="text-center">
          <p className="text-lg">Gået i stå? Ring til mig, så hjælper jeg dig igennem. 📞</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/priser" className="btn btn-white">
              Andre betalingsmåder
            </Link>
            <Link href="/tjenester" className="btn btn-coral">
              Find et venskab 🎁
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
