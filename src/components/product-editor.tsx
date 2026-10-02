"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProduct, type ProductFormData } from "@/app/admin/actions";
import { formatAmount, parseKr } from "@/lib/money";

type Category = { id: number; name: string; emoji: string };

const kr = (oere: number | null) => (oere == null ? "" : formatAmount(oere));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

function move<T>(arr: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function ProductEditor({ initial, categories }: { initial: ProductFormData; categories: Category[] }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [priceText, setPriceText] = useState(kr(initial.price));
  const [minText, setMinText] = useState(kr(initial.minPrice));
  const [variantPrices, setVariantPrices] = useState(initial.variants.map((v) => kr(v.price)));
  const [goodForText, setGoodForText] = useState(initial.goodFor.join("\n"));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) => setP((x) => ({ ...x, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseKr(priceText);
    if (price == null) return setMsg({ ok: false, text: "Ugyldig pris" });
    const variants = p.variants.map((v, i) => ({ ...v, price: variantPrices[i]?.trim() ? parseKr(variantPrices[i]) : null }));
    const data: ProductFormData = {
      ...p,
      price,
      minPrice: minText.trim() ? parseKr(minText) : null,
      goodFor: goodForText.split("\n").map((s) => s.trim()).filter(Boolean),
      variants,
    };
    setMsg(null);
    start(async () => {
      const res = await saveProduct(data);
      if (!res.ok) return setMsg({ ok: false, text: res.error });
      setMsg({ ok: true, text: "Gemt! 🎉" });
      if (!p.id) router.replace(`/admin/produkter/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Section title="Grundoplysninger">
          <div className="grid gap-4 sm:grid-cols-[1fr_90px_90px]">
            <Field label="Navn">
              <input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Emoji">
              <input className="input text-center text-xl" value={p.emoji} onChange={(e) => set("emoji", e.target.value)} required />
            </Field>
            <Field label="Farve">
              <input type="color" className="h-[50px] w-full cursor-pointer rounded-2xl border-[3px] border-ink" value={p.color} onChange={(e) => set("color", e.target.value)} />
            </Field>
          </div>
          <Field label="Slug (webadresse)" hint={`/tjenester/${p.slug || "..."}`}>
            <input className="input font-mono" value={p.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} required pattern="[a-z0-9-]+" />
          </Field>
          <Field label="Tagline" hint='Den korte "Jeg ..."-sætning'>
            <input className="input" value={p.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Overskrift på produktsiden">
            <input className="input" value={p.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label="Kort beskrivelse (vises på kortet)">
            <input className="input" value={p.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
          <Field label="Beskrivelse" hint="Tom linje = nyt afsnit">
            <textarea className="input min-h-48" value={p.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Godt til …" hint="Én pr. linje">
            <textarea className="input min-h-24" value={goodForText} onChange={(e) => setGoodForText(e.target.value)} />
          </Field>
          <Field label="Med småt">
            <textarea className="input min-h-20" value={p.finePrint} onChange={(e) => set("finePrint", e.target.value)} />
          </Field>
          <Field label="Levering">
            <input className="input" value={p.delivery} onChange={(e) => set("delivery", e.target.value)} />
          </Field>
          <Field label="Kategori">
            <select className="input" value={p.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}>
              <option value="">Ingen</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-coral" checked={p.active} onChange={(e) => set("active", e.target.checked)} />
              Aktiv (vises i butikken)
            </label>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-coral" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} />
              Udvalgt på forsiden
            </label>
            <label className="flex items-center gap-2 font-semibold">
              Sortering
              <input type="number" className="input !w-24 !py-1" value={p.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </label>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Pris 💸">
          <Field label="Pristype">
            <select className="input" value={p.priceKind} onChange={(e) => set("priceKind", e.target.value as ProductFormData["priceKind"])}>
              <option value="fixed">Fast pris</option>
              <option value="per_unit">Pris pr. enhed (fx pr. m²)</option>
              <option value="custom">Kunden vælger beløbet</option>
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={p.priceKind === "custom" ? "Forslag til beløb (kr.)" : "Pris (kr.)"} hint="Prisen er også varenummeret – hold den unik">
              <input className="input" inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value)} required />
            </Field>
            {p.priceKind === "per_unit" && (
              <Field label="Enhed">
                <input className="input" value={p.unitLabel ?? ""} onChange={(e) => set("unitLabel", e.target.value || null)} placeholder="m²" />
              </Field>
            )}
            {p.priceKind === "custom" && (
              <>
                <Field label="Skal ende på (øre)" hint="Fx 25 → beløbet skal ende på ,25">
                  <input className="input" type="number" min={0} max={99} value={p.priceEndsWith ?? 0} onChange={(e) => set("priceEndsWith", Number(e.target.value))} />
                </Field>
                <Field label="Mindstebeløb (kr.)">
                  <input className="input" inputMode="decimal" value={minText} onChange={(e) => setMinText(e.target.value)} />
                </Field>
              </>
            )}
            <Field label="Gentagelse" hint='Fx "pr. måned" (valgfrit)'>
              <input className="input" value={p.recurringLabel ?? ""} onChange={(e) => set("recurringLabel", e.target.value || null)} />
            </Field>
          </div>
        </Section>

        <Section title="Varianter / udgaver">
          <p className="text-sm text-ink-soft">Lad prisen stå tom for at bruge produktets pris.</p>
          {p.variants.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2">
              <input className="input min-w-48 flex-1" value={v.name} placeholder="Navn" required onChange={(e) => set("variants", p.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="input !w-28" inputMode="decimal" placeholder="Pris" value={variantPrices[i] ?? ""} onChange={(e) => setVariantPrices((vp) => vp.map((x, j) => (j === i ? e.target.value : x)))} />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={v.active} onChange={(e) => set("variants", p.variants.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} />
                aktiv
              </label>
              <button type="button" aria-label="Flyt op" onClick={() => { set("variants", move(p.variants, i, -1)); setVariantPrices((vp) => move(vp, i, -1)); }}>⬆️</button>
              <button type="button" aria-label="Fjern variant" className="text-coral" onClick={() => { set("variants", p.variants.filter((_, j) => j !== i)); setVariantPrices((vp) => vp.filter((_, j) => j !== i)); }}>✖</button>
            </div>
          ))}
          <button type="button" className="btn btn-white !py-1.5 text-sm" onClick={() => { set("variants", [...p.variants, { name: "", price: null, active: true }]); setVariantPrices((vp) => [...vp, ""]); }}>
            + Tilføj variant
          </button>
        </Section>

        <Section title="Billeder og video 📸">
          <p className="text-sm text-ink-soft">
            Billeder: læg filen i <code>public/images/products/</code> og skriv stien, fx <code>/images/products/lussing.jpg</code>. YouTube: skriv videoens id (fx <code>b2Wab89xhOc</code>).
          </p>
          {p.media.map((m, i) => {
            const upd = (patch: Partial<typeof m>) => set("media", p.media.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <div key={m.id ?? `new-${i}`} className="space-y-2 rounded-2xl border-2 border-ink/20 p-3">
                <div className="flex flex-wrap gap-2">
                  <select className="input !w-32" value={m.kind} onChange={(e) => upd({ kind: e.target.value as typeof m.kind })}>
                    <option value="image">Billede</option>
                    <option value="youtube">YouTube</option>
                    <option value="video">Videofil</option>
                  </select>
                  <input className="input min-w-48 flex-1 font-mono text-sm" value={m.url} required placeholder={m.kind === "youtube" ? "YouTube-id" : "/images/products/..."} onChange={(e) => upd({ url: e.target.value })} />
                  <button type="button" aria-label="Flyt op" onClick={() => set("media", move(p.media, i, -1))}>⬆️</button>
                  <button type="button" aria-label="Fjern" className="text-coral" onClick={() => set("media", p.media.filter((_, j) => j !== i))}>✖</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input className="input min-w-40 flex-1 text-sm" placeholder="Alt-tekst (beskriv billedet)" value={m.alt} onChange={(e) => upd({ alt: e.target.value })} />
                  <input className="input min-w-40 flex-1 text-sm" placeholder="Billedtekst" value={m.caption} onChange={(e) => upd({ caption: e.target.value })} />
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={m.isExample} onChange={(e) => upd({ isExample: e.target.checked })} />
                    fra tidligere køber
                  </label>
                </div>
              </div>
            );
          })}
          <button type="button" className="btn btn-white !py-1.5 text-sm" onClick={() => set("media", [...p.media, { kind: "image", url: "", alt: "", caption: "", isExample: false }])}>
            + Tilføj medie
          </button>
        </Section>

        <Section title="Spørgsmål ved bestilling 📝">
          {p.questions.map((q, i) => {
            const upd = (patch: Partial<typeof q>) => set("questions", p.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <div key={q.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2">
                <input className="input min-w-48 flex-1" value={q.label} required placeholder="Spørgsmål" onChange={(e) => upd({ label: e.target.value })} />
                <select className="input !w-32" value={q.kind} onChange={(e) => upd({ kind: e.target.value as typeof q.kind })}>
                  <option value="text">Kort tekst</option>
                  <option value="textarea">Lang tekst</option>
                  <option value="date">Dato</option>
                  <option value="datetime">Dato + tid</option>
                </select>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={q.required} onChange={(e) => upd({ required: e.target.checked })} />
                  påkrævet
                </label>
                <button type="button" aria-label="Flyt op" onClick={() => set("questions", move(p.questions, i, -1))}>⬆️</button>
                <button type="button" aria-label="Fjern" className="text-coral" onClick={() => set("questions", p.questions.filter((_, j) => j !== i))}>✖</button>
              </div>
            );
          })}
          <button type="button" className="btn btn-white !py-1.5 text-sm" onClick={() => set("questions", [...p.questions, { label: "", kind: "text", required: false }])}>
            + Tilføj spørgsmål
          </button>
        </Section>
      </div>

      <div className="sticky bottom-4 z-10 flex items-center gap-4 xl:col-span-2">
        <button className="btn btn-coral text-lg" disabled={pending}>
          {pending ? "Gemmer …" : "Gem produkt 💾"}
        </button>
        {msg && (
          <p className={`rounded-full border-2 border-ink px-4 py-1.5 font-bold ${msg.ok ? "bg-mint" : "bg-coral text-white"}`} role="status">
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}
