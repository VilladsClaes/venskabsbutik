"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { formatKr, parseKr, priceCode } from "@/lib/money";
import { useCart } from "./cart";
import { burstConfetti } from "./confetti";

export type BuyableProduct = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  color: string;
  image?: string;
  priceKind: "fixed" | "per_unit" | "custom";
  price: number;
  unitLabel: string | null;
  priceEndsWith: number | null;
  minPrice: number | null;
  recurringLabel: string | null;
  variants: { id: number; name: string; price: number | null }[];
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export function AddToCart({ product }: { product: BuyableProduct }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState<number | undefined>(product.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState(product.priceKind === "custom" ? priceCode(product.price) : "");
  const [added, setAdded] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  const variant = product.variants.find((v) => v.id === variantId);
  const unitPrice = variant?.price ?? product.price;
  const variantsHavePrices = product.variants.some((v) => v.price != null);

  let customPrice: number | null = null;
  let customError = "";
  if (product.priceKind === "custom") {
    const ends = product.priceEndsWith ?? 0;
    customPrice = parseKr(custom);
    if (customPrice == null) customError = "Skriv et beløb, fx 200,25";
    else if (customPrice % 100 !== ends)
      customError = `Beløbet skal ende på ,${pad2(ends)} – fx ${Math.floor(customPrice / 100)},${pad2(ends)}`;
    else if (product.minPrice && customPrice < product.minPrice) customError = `Mindst ${formatKr(product.minPrice)}`;
  }

  const linePrice = product.priceKind === "custom" ? (customPrice ?? 0) : unitPrice;
  const quantity = product.priceKind === "per_unit" ? qty : 1;
  const canAdd = product.priceKind !== "custom" || !customError;

  function handleAdd() {
    if (!canAdd) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      emoji: product.emoji,
      color: product.color,
      image: product.image,
      variantId: variant?.id,
      variantName: variant?.name,
      customPrice: product.priceKind === "custom" ? linePrice : undefined,
      unitPrice: linePrice,
      quantity,
      unitLabel: product.unitLabel ?? undefined,
    });
    const r = btn.current?.getBoundingClientRect();
    if (r) burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
    setAdded(true);
  }

  return (
    <div className="card space-y-5 p-5" style={{ background: `color-mix(in srgb, ${product.color} 18%, white)` }}>
      {product.variants.length > 0 && (
        <fieldset>
          <legend className="font-display text-lg font-bold">Vælg din udgave</legend>
          <div className="mt-2 grid gap-2">
            {product.variants.map((v) => {
              const checked = v.id === variantId;
              return (
                <label
                  key={v.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] border-ink px-3 py-2 transition ${
                    checked ? "bg-sun shadow-[0_3px_0_0_#2b2d42]" : "bg-white hover:bg-cream"
                  }`}
                >
                  <input
                    type="radio"
                    name="variant"
                    className="h-4 w-4 accent-coral"
                    checked={checked}
                    onChange={() => setVariantId(v.id)}
                  />
                  <span className="flex-1 font-semibold">{v.name}</span>
                  {variantsHavePrices && (
                    <span className="font-display font-bold">{formatKr(v.price ?? product.price)}</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.priceKind === "custom" && (
        <label className="block">
          <span className="font-display text-lg font-bold">Hvor meget vil du give?</span>
          <span className="mt-2 flex items-center gap-2">
            <input
              className="input !w-40 text-lg font-bold"
              inputMode="decimal"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={!!customError}
              aria-describedby="custom-hint"
            />
            <span className="font-bold">kr.</span>
          </span>
          <span
            id="custom-hint"
            className={`mt-1 block text-sm ${customError ? "font-bold text-coral" : "text-ink-soft"}`}
          >
            {customError ||
              `Beløbet skal ende på ,${pad2(product.priceEndsWith ?? 0)} – så ved jeg, hvad det er til.`}
          </span>
        </label>
      )}

      {product.priceKind === "per_unit" && (
        <div>
          <span className="font-display text-lg font-bold">Hvor mange {product.unitLabel}?</span>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="btn btn-white !h-11 !w-11 !p-0"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Færre"
            >
              −
            </button>
            <input
              className="input !w-20 text-center text-lg font-bold"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
              aria-label={`Antal ${product.unitLabel}`}
            />
            <button
              type="button"
              className="btn btn-white !h-11 !w-11 !p-0"
              onClick={() => setQty((q) => Math.min(999, q + 1))}
              aria-label="Flere"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/30 pt-4">
        <div>
          <p className="text-sm font-semibold text-ink-soft">Pris</p>
          <p className="font-display text-3xl font-bold">
            {formatKr(linePrice * quantity)}
            {product.recurringLabel && <span className="text-base font-semibold"> {product.recurringLabel}</span>}
          </p>
        </div>
        <button ref={btn} type="button" className="btn btn-coral text-lg" disabled={!canAdd} onClick={handleAdd}>
          Læg i kurven 🧺
        </button>
      </div>

      {added && (
        <p className="animate-pop-in rounded-2xl border-[3px] border-ink bg-mint px-4 py-3 font-semibold" role="status">
          🎉 Lagt i kurven!{" "}
          <Link href="/kurv" className="underline">
            Gå til kurven →
          </Link>
        </p>
      )}
    </div>
  );
}
