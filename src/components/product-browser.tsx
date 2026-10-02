"use client";

import { useMemo, useState } from "react";
import type { ShopProduct } from "@/lib/queries";
import { ProductCard } from "./product-bits";

type Category = { id: number; slug: string; name: string; emoji: string };
type Sort = "anbefalet" | "billigst" | "dyrest" | "populaer";

export function ProductBrowser({
  products,
  categories,
  initialCategory,
}: {
  products: ShopProduct[];
  categories: Category[];
  initialCategory?: string;
}) {
  const [cat, setCat] = useState<string | null>(initialCategory ?? null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("anbefalet");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (cat && p.category?.slug !== cat) return false;
      if (!needle) return true;
      return [p.name, p.tagline, p.summary, p.headline].some((s) => s.toLowerCase().includes(needle));
    });
    if (sort === "billigst") return [...list].sort((a, b) => a.fromPrice - b.fromPrice);
    if (sort === "dyrest") return [...list].sort((a, b) => b.fromPrice - a.fromPrice);
    if (sort === "populaer") return [...list].sort((a, b) => b.sold - a.sold);
    return list;
  }, [products, cat, q, sort]);

  const chip = (active: boolean) =>
    `rounded-full border-[3px] border-ink px-4 py-1.5 font-display font-semibold transition hover:-translate-y-0.5 ${
      active ? "bg-ink text-white" : "bg-white"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrér efter kategori">
          <button type="button" className={chip(cat === null)} onClick={() => setCat(null)} aria-pressed={cat === null}>
            🌈 Alle
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={chip(cat === c.slug)}
              aria-pressed={cat === c.slug}
              onClick={() => setCat(cat === c.slug ? null : c.slug)}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <label className="relative flex-1 lg:w-56">
            <span className="sr-only">Søg</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              🔎
            </span>
            <input
              className="input !rounded-full !py-1.5 pl-9"
              placeholder="Søg fx “digt”"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Sortér</span>
            <select
              className="input !w-auto !rounded-full !py-1.5"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <option value="anbefalet">Anbefalet</option>
              <option value="populaer">Mest solgte</option>
              <option value="billigst">Billigst først</option>
              <option value="dyrest">Dyrest først</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 font-semibold text-ink-soft" aria-live="polite">
        {shown.length} {shown.length === 1 ? "tjeneste" : "tjenester"}
      </p>

      {shown.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-5xl" aria-hidden="true">🙈</p>
          <p className="mt-3 font-display text-2xl font-bold">Ingen venskaber matcher</p>
          <p className="text-ink-soft">Prøv et andet ord – eller ring til mig, så finder vi på noget.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((p, i) => (
            <li key={p.id} className="animate-pop-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              <ProductCard product={p} index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
