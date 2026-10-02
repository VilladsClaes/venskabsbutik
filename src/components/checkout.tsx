"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions";
import { formatKr } from "@/lib/money";
import { useCart } from "./cart";

export type CatalogEntry = {
  id: number;
  active: boolean;
  priceKind: "fixed" | "per_unit" | "custom";
  price: number;
  variants: { id: number; price: number | null }[];
  questions: { id: number; label: string; kind: "text" | "textarea" | "date" | "datetime"; required: boolean }[];
};

export function Checkout({ catalog, mobilepay }: { catalog: Record<number, CatalogEntry>; mobilepay: string }) {
  const { lines, ready, setQuantity, remove, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", nickname: "", allowMention: true });
  const [note, setNote] = useState("");

  // Brug altid de aktuelle priser fra databasen
  const priced = useMemo(
    () =>
      lines.map((l) => {
        const c = catalog[l.productId];
        if (!c || !c.active) return { line: l, entry: undefined, unit: l.unitPrice, missing: true };
        const v = l.variantId ? c.variants.find((x) => x.id === l.variantId) : undefined;
        const unit = c.priceKind === "custom" ? (l.customPrice ?? l.unitPrice) : (v?.price ?? c.price);
        return { line: l, entry: c, unit, missing: false };
      }),
    [lines, catalog],
  );
  const total = priced.reduce((n, p) => n + (p.missing ? 0 : p.unit * p.line.quantity), 0);
  const hasMissing = priced.some((p) => p.missing);

  if (!ready) return <p className="py-20 text-center text-2xl">⏳</p>;

  if (lines.length === 0)
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <p className="animate-float text-7xl" aria-hidden="true">🧺</p>
        <h2 className="mt-4 text-3xl font-bold">Din kurv er tom</h2>
        <p className="mt-2 text-ink-soft">Men dit hjerte behøver ikke at være det.</p>
        <Link href="/tjenester" className="btn btn-coral mt-6">
          Find et venskab 🎁
        </Link>
      </div>
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createOrder({
        customer,
        note,
        website: "",
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          customPrice: l.customPrice,
          quantity: l.quantity,
          answers: answers[l.key] ?? {},
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      clear();
      router.push(`/ordre/${res.orderNumber}?k=${res.token}`);
    });
  }

  const field = (k: keyof typeof customer) => ({
    value: customer[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomer((c) => ({ ...c, [k]: e.target.value })),
  });

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        {priced.map(({ line, entry, unit, missing }) => (
          <div key={line.key} className="card animate-pop-in overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div
                className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-[3px] border-ink text-4xl"
                style={{ background: line.color }}
              >
                {line.image ? (
                  <Image src={line.image} alt="" fill sizes="80px" unoptimized={line.image.endsWith(".gif")} className="object-cover" />
                ) : (
                  <span aria-hidden="true">{line.emoji}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/tjenester/${line.slug}`} className="font-display text-xl font-bold hover:underline">
                  {line.name}
                </Link>
                {line.variantName && <p className="text-sm font-semibold text-ink-soft">{line.variantName}</p>}
                {missing ? (
                  <p className="font-bold text-coral">Denne tjeneste findes ikke længere</p>
                ) : (
                  <p className="font-display text-lg font-bold">
                    {formatKr(unit * line.quantity)}
                    {line.quantity > 1 && (
                      <span className="text-sm font-semibold text-ink-soft">
                        {" "}
                        ({line.quantity} {line.unitLabel ?? "stk."} × {formatKr(unit)})
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {entry?.priceKind === "per_unit" && (
                  <label className="flex items-center gap-1 text-sm font-semibold">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      className="input !w-20 !py-1 text-center"
                      value={line.quantity}
                      onChange={(e) => setQuantity(line.key, Math.max(1, parseInt(e.target.value) || 1))}
                      aria-label={`Antal ${line.unitLabel ?? ""}`}
                    />
                    {line.unitLabel}
                  </label>
                )}
                <button
                  type="button"
                  className="text-sm font-bold text-coral hover:underline"
                  onClick={() => remove(line.key)}
                >
                  Fjern ✖
                </button>
              </div>
            </div>
            {entry && entry.questions.length > 0 && (
              <div className="space-y-3 border-t-[3px] border-dashed border-ink/25 bg-cream/60 p-4">
                <p className="font-display font-semibold">Fortæl mig lidt om bestillingen 📝</p>
                {entry.questions.map((q) => {
                  const value = answers[line.key]?.[q.id] ?? "";
                  const set = (v: string) =>
                    setAnswers((a) => ({ ...a, [line.key]: { ...a[line.key], [q.id]: v } }));
                  return (
                    <label key={q.id} className="block">
                      <span className="text-sm font-bold">
                        {q.label}
                        {q.required && <span className="text-coral"> *</span>}
                      </span>
                      {q.kind === "textarea" ? (
                        <textarea className="input mt-1 min-h-20" required={q.required} value={value} onChange={(e) => set(e.target.value)} />
                      ) : (
                        <input
                          className="input mt-1"
                          type={q.kind === "date" ? "date" : q.kind === "datetime" ? "datetime-local" : "text"}
                          required={q.required}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-3 p-5">
          <h2 className="text-2xl font-bold">Hvem er du, min nye ven? 🤝</h2>
          <label className="block">
            <span className="text-sm font-bold">Navn <span className="text-coral">*</span></span>
            <input className="input mt-1" required autoComplete="name" {...field("name")} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">E-mail</span>
            <input className="input mt-1" type="email" autoComplete="email" {...field("email")} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Telefon</span>
            <input className="input mt-1" type="tel" autoComplete="tel" {...field("phone")} />
          </label>
          <p className="text-xs text-ink-soft">Skriv e-mail eller telefon (eller begge), så jeg kan kontakte dig.</p>
          <label className="block">
            <span className="text-sm font-bold">Dæknavn (valgfrit)</span>
            <input className="input mt-1" placeholder="Fx “Den hemmelige ven”" {...field("nickname")} />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-coral"
              checked={customer.allowMention}
              onChange={(e) => setCustomer((c) => ({ ...c, allowMention: e.target.checked }))}
            />
            <span>Villads må gerne skrive om, at jeg har købt – med mit fornavn eller dæknavn.</span>
          </label>
          <label className="block">
            <span className="text-sm font-bold">Besked til Villads (valgfrit)</span>
            <textarea className="input mt-1 min-h-20" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>

        <div className="card space-y-4 bg-sun p-5">
          <div className="flex items-end justify-between">
            <span className="font-display text-xl font-bold">I alt</span>
            <span className="font-display text-4xl font-bold">{formatKr(total)}</span>
          </div>
          <p className="flex gap-2 rounded-2xl border-2 border-ink bg-white/70 p-3 text-sm font-semibold">
            <span aria-hidden="true">💙</span>
            Du betaler med MobilePay til {mobilepay} på næste side – med dit ordrenummer i beskeden.
          </p>
          {error && (
            <p className="rounded-2xl border-2 border-ink bg-coral p-3 font-bold text-white" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-coral w-full text-lg" disabled={pending || hasMissing}>
            {pending ? "Opretter din ordre … ⏳" : "Bestil venskabet 🎉"}
          </button>
        </div>
      </div>
    </form>
  );
}
