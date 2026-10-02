"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { burstConfetti } from "./confetti";

type Item = { slug: string; name: string; emoji: string; color: string };
const SEGMENTS = 10;

function shuffle<T>(a: T[]) {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Lykkehjul der vælger en tilfældig tjeneste */
export function SurpriseWheel({ items }: { items: Item[] }) {
  const [segments, setSegments] = useState(() => items.slice(0, SEGMENTS));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Item | null>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const n = segments.length;
  const slice = 360 / n;

  function spin() {
    if (spinning || !items.length) return;
    const next = shuffle(items).slice(0, SEGMENTS);
    const idx = Math.floor(Math.random() * next.length);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSegments(next);
    setWinner(null);
    // Pilen sidder øverst: drej så midten af det vindende felt lander under den
    const target = 360 - (idx * (360 / next.length) + 360 / next.length / 2);
    const turns = reduce ? 0 : 5 * 360;
    setRotation((r) => r - (r % 360) + turns + target);
    setSpinning(true);
    setTimeout(
      () => {
        setSpinning(false);
        setWinner(next[idx]);
        const r = wheel.current?.getBoundingClientRect();
        if (r) burstConfetti(r.left + r.width / 2, r.top + r.height / 3, 30);
      },
      reduce ? 50 : 4200,
    );
  }

  const gradient = segments.map((s, i) => `${s.color} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ");

  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="relative mx-auto w-full max-w-sm">
        <div className="absolute left-1/2 top-[-14px] z-10 -translate-x-1/2 text-4xl drop-shadow" aria-hidden="true">
          🔻
        </div>
        <div
          ref={wheel}
          className="relative aspect-square rounded-full border-[5px] border-ink shadow-[0_8px_0_0_#2b2d42]"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.1s cubic-bezier(.17,.67,.21,1)" : "none",
          }}
          aria-hidden="true"
        >
          {segments.map((s, i) => {
            const a = ((i * slice + slice / 2) * Math.PI) / 180;
            return (
              <span
                key={s.slug}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl"
                style={{ left: `${50 + 36 * Math.sin(a)}%`, top: `${50 - 36 * Math.cos(a)}%` }}
              >
                {s.emoji}
              </span>
            );
          })}
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[4px] border-ink bg-white text-3xl">
            🌞
          </span>
        </div>
      </div>
      <div className="text-center md:text-left">
        <h2 className="text-4xl font-bold">Kan du ikke vælge? 🎡</h2>
        <p className="mt-2 text-lg text-ink-soft">Drej lykkehjulet, så finder skæbnen dit næste venskab.</p>
        <button type="button" className="btn btn-coral mt-6 text-lg" onClick={spin} disabled={spinning}>
          {spinning ? "Hjulet drejer … 🌀" : "Overrask mig! ✨"}
        </button>
        <div aria-live="polite" className="min-h-28">
          {winner && (
            <div className="card mt-6 animate-pop-in p-5" style={{ background: `color-mix(in srgb, ${winner.color} 25%, white)` }}>
              <p className="font-display text-sm font-semibold text-coral">Skæbnen har talt:</p>
              <p className="font-display text-2xl font-bold">
                {winner.emoji} {winner.name}
              </p>
              <Link href={`/tjenester/${winner.slug}`} className="btn btn-sun mt-3 !py-1.5">
                Se venskabet →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
