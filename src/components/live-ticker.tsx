"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Mention = { who: string; product: string; slug: string | null; emoji: string; at: string | null; gift: boolean };

function ago(iso: string | null) {
  if (!iso) return "for nylig";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "lige nu";
  if (min < 60) return `for ${min} minutter siden`;
  const h = Math.round(min / 60);
  if (h < 24) return `for ${h} ${h === 1 ? "time" : "timer"} siden`;
  const d = Math.round(h / 24);
  return d < 30 ? `for ${d} ${d === 1 ? "dag" : "dage"} siden` : "for et stykke tid siden";
}

/** Små bobler nederst i hjørnet med de seneste køb (kun folk der har sagt ja til at blive nævnt) */
export function LiveTicker({ mentions }: { mentions: Mention[] }) {
  const [i, setI] = useState(-1);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!mentions.length) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- husk at brugeren har lukket tickeren
      if (sessionStorage.getItem("ticker-lukket")) return setClosed(true);
    } catch {
      /* ingen lagring */
    }
    const first = setTimeout(() => setI(0), 6000);
    const t = setInterval(() => setI((x) => (x + 1) % mentions.length), 12000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [mentions.length]);

  if (closed || i < 0 || !mentions[i]) return null;
  const m = mentions[i];
  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-[calc(100vw-2rem)] sm:max-w-xs" role="status">
      <div key={i} className="card relative flex animate-pop-in items-center gap-3 bg-white py-2.5 pl-3 pr-8">
        <span className="text-3xl" aria-hidden="true">{m.emoji}</span>
        <p className="text-sm leading-snug">
          <strong>{m.who}</strong> {m.gift ? "gav" : "købte"}{" "}
          {m.slug ? (
            <Link href={`/tjenester/${m.slug}`} className="font-bold underline">
              {m.product}
            </Link>
          ) : (
            <strong>{m.product}</strong>
          )}
          {m.gift ? " i gave" : ""} <span className="text-ink-soft">{ago(m.at)}</span>
        </p>
        <button
          type="button"
          className="absolute right-2 top-1.5 text-sm text-ink-soft"
          aria-label="Skjul"
          onClick={() => {
            setClosed(true);
            try {
              sessionStorage.setItem("ticker-lukket", "1");
            } catch {
              /* ingen lagring */
            }
          }}
        >
          ✖
        </button>
      </div>
    </div>
  );
}
