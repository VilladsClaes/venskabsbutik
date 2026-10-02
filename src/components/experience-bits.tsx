import Link from "next/link";
import type { ReactNode } from "react";
import { DriftingClouds } from "./sky";

/** Fælles topsektion til oplevelsessiderne */
export function ExperienceHero({
  emoji,
  title,
  children,
  color = "#bde0fe",
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
  color?: string;
}) {
  return (
    <section
      className="relative overflow-hidden border-b-[3px] border-ink"
      style={{ background: `linear-gradient(180deg, ${color}, #fff8e7)` }}
    >
      <DriftingClouds count={3} />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 text-center">
        <Link href="/oplevelser" className="text-sm font-semibold underline">
          ← Alle oplevelser
        </Link>
        <p className="mt-3 animate-float text-6xl" aria-hidden="true">
          {emoji}
        </p>
        <h1 className="mt-2 text-5xl font-bold sm:text-6xl">{title}</h1>
        {children && <div className="mx-auto mt-4 max-w-2xl text-lg font-semibold">{children}</div>}
      </div>
    </section>
  );
}

export function StatTile({ value, label, emoji }: { value: ReactNode; label: string; emoji: string }) {
  return (
    <div className="card px-4 py-4 text-center">
      <p className="font-display text-4xl font-bold">
        <span aria-hidden="true">{emoji} </span>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink-soft">{label}</p>
    </div>
  );
}

export function BuyCta({ slug, label }: { slug: string; label: string }) {
  return (
    <div className="mt-12 text-center">
      <Link href={`/tjenester/${slug}`} className="btn btn-coral text-lg">
        {label}
      </Link>
    </div>
  );
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
}
