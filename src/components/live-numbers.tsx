"use client";

import { useEffect, useRef, useState } from "react";

/** Tal der tæller op, når det kommer til syne */
export function CountUp({ value, decimals = 0, duration = 1600 }: { value: number; decimals?: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- vis slutværdien med det samme uden animation
      setShown(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setShown(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);
  return (
    <span ref={ref}>
      {shown.toLocaleString("da-DK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live nedtælling til et tidspunkt */
export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- uret må først starte i browseren
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = parts(target - (now ?? target));
  const box = (n: number, label: string) => (
    <div className="card min-w-20 px-3 py-3 text-center">
      <p className="font-display text-4xl font-bold tabular-nums sm:text-5xl">{now == null ? "–" : n}</p>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
    </div>
  );
  return (
    <div className="flex flex-wrap justify-center gap-3" aria-live="off">
      {box(p.d, "dage")}
      {box(p.h, "timer")}
      {box(p.m, "minutter")}
      {box(p.s, "sekunder")}
    </div>
  );
}

/** Tæller der går op hvert sekund (fx dage/sekunder siden noget) */
export function LiveSince({ from, unit = "seconds" }: { from: string; unit?: "seconds" | "minutes" }) {
  const start = new Date(from).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- uret må først starte i browseren
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now == null) return <span>–</span>;
  const diff = (now - start) / 1000;
  return <span className="tabular-nums">{Math.floor(unit === "minutes" ? diff / 60 : diff).toLocaleString("da-DK")}</span>;
}
