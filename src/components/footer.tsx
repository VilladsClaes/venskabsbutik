import Link from "next/link";
import { Cloud } from "./sky";

const TAGLINES = [
  "Jeg tænker på dig 💭",
  "Jeg dukker faktisk op 🎩",
  "Jeg digter om dig 📜",
  "Jeg tager din skyld på mig 🙋",
  "Jeg vander dine blomster 🌱",
  "Jeg luller dig i søvn 🌙",
  "Jeg giver dig et stykke af himlen 🌤️",
  "Jeg får dig til at grine i en uge 🤣",
];

export function Marquee({ items = TAGLINES, className = "" }: { items?: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden border-y-[3px] border-ink bg-coral py-3 text-white ${className}`}>
      <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 font-display text-xl font-semibold">
        {row.map((t, i) => (
          <span key={i} className="whitespace-nowrap" aria-hidden={i >= items.length}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Footer({ phone, mobilepay }: { phone: string; mobilepay: string }) {
  return (
    <footer className="mt-24">
      <Marquee />
      <div className="relative overflow-hidden bg-ocean text-white">
        <Cloud width={160} face className="absolute -left-6 top-6 opacity-30" />
        <Cloud width={120} className="absolute right-10 bottom-4 opacity-25" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-bold">🌞 Venskabsbutikken</p>
            <p className="mt-3 text-white/90">
              Venskaber til salg. Små fragmenter af et rigtigt venskab – leveret med et smil af Villads Claes.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Butikken</p>
            <ul className="mt-3 space-y-1.5 text-white/90">
              <li><Link className="hover:underline" href="/tjenester">Alle tjenester</Link></li>
              <li><Link className="hover:underline" href="/oplevelser">Oplevelser</Link></li>
              <li><Link className="hover:underline" href="/priser">Sådan betaler du</Link></li>
              <li><Link className="hover:underline" href="/kurv">Din kurv</Link></li>
              <li><Link className="hover:underline" href="/oenskeliste">Min ønskeliste</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Venskabet</p>
            <ul className="mt-3 space-y-1.5 text-white/90">
              <li><Link className="hover:underline" href="/om-venskaber">Hvorfor sælge venskaber?</Link></li>
              <li><Link className="hover:underline" href="/om-villads">Hvem er Villads?</Link></li>
              <li><Link className="hover:underline" href="/bogen">Bogen der ændrede verden</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Snak med mig</p>
            <ul className="mt-3 space-y-1.5 text-white/90">
              <li>
                📞 <a className="hover:underline" href={`tel:+45${phone}`}>{phone.replace(/(\d{2})(?=\d)/g, "$1 ")}</a>
              </li>
              <li>
                💬{" "}
                <a className="hover:underline" href={`https://wa.me/45${phone}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
              <li>💙 MobilePay: {mobilepay}</li>
            </ul>
          </div>
        </div>
        <p className="relative pb-6 text-center text-sm text-white/75">
          © {new Date().getFullYear()} Villads Claes · Lavet med 💛 og en lille smule postmoderne pis ·{" "}
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}
