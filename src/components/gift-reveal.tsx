"use client";

import { useRef, useState } from "react";
import { burstConfetti } from "./confetti";

export function GiftReveal({
  recipient,
  from,
  message,
  items,
}: {
  recipient: string;
  from: string;
  message: string | null;
  items: { name: string; emoji: string; variant: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLButtonElement>(null);

  function unwrap() {
    const r = box.current?.getBoundingClientRect();
    setOpen(true);
    if (r) {
      burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 40);
      setTimeout(() => burstConfetti(r.left + r.width / 2, r.top, 30), 350);
    }
  }

  if (!open)
    return (
      <div className="text-center">
        <p className="font-display text-2xl font-bold">Kære {recipient}, der er en gave til dig! 💝</p>
        <button
          ref={box}
          type="button"
          onClick={unwrap}
          className="group mx-auto mt-8 block animate-bob text-[9rem] leading-none transition hover:scale-110"
          aria-label="Åbn gaven"
        >
          <span className="inline-block group-hover:animate-wiggle">🎁</span>
        </button>
        <button type="button" onClick={unwrap} className="btn btn-coral mt-6 text-lg">
          Åbn gaven ✨
        </button>
      </div>
    );

  return (
    <div className="card mx-auto max-w-xl animate-pop-in bg-white p-8 text-center">
      <p className="text-6xl" aria-hidden="true">🥳</p>
      <h2 className="mt-2 text-4xl font-bold">Til {recipient}</h2>
      <p className="mt-1 text-lg font-semibold text-ink-soft">fra {from} – leveret af Villads</p>
      {message && (
        <blockquote className="mt-6 rounded-2xl border-[3px] border-dashed border-pink bg-[#ffe5ec] p-5 text-lg italic">
          “{message}”
        </blockquote>
      )}
      <p className="mt-8 font-display text-xl font-bold">Du har fået:</p>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="animate-pop-in rounded-2xl border-[3px] border-ink bg-sun px-4 py-3 font-display text-lg font-bold"
            style={{ animationDelay: `${300 + i * 150}ms` }}
          >
            {it.emoji} {it.name}
            {it.variant && <span className="block text-sm font-semibold">{it.variant}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-ink-soft">
        Villads kontakter {from} for at aftale detaljerne. Glæd dig! 💛
      </p>
    </div>
  );
}
