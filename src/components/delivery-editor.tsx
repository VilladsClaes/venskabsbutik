"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveDelivery, type DeliveryFormData } from "@/app/admin/actions";
import { AMOUNT_LABELS } from "@/lib/delivery-kinds";
import { MapView } from "./map-view";
import { UploadButton } from "./upload-button";

type ProductOpt = { id: number; name: string; emoji: string; slug: string };
type OrderOpt = { id: number; orderNumber: string; customerName: string; mention: string | null };

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function DeliveryEditor({
  initial,
  products,
  orders,
}: {
  initial: DeliveryFormData;
  products: ProductOpt[];
  orders: OrderOpt[];
}) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [gpsMsg, setGpsMsg] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof DeliveryFormData>(k: K, v: DeliveryFormData[K]) => setD((x) => ({ ...x, [k]: v }));
  const product = products.find((p) => p.id === d.productId);
  const amountLabel = product ? AMOUNT_LABELS[product.slug] : undefined;

  function locateMe() {
    if (!navigator.geolocation) return setGpsMsg("Din browser kan ikke finde din position");
    setGpsMsg("Finder dig … 🛰️");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setD((x) => ({ ...x, lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) }));
        setGpsMsg(`Fundet ✅ (±${Math.round(pos.coords.accuracy)} m)`);
      },
      () => setGpsMsg("Kunne ikke finde din position – tillad placering, eller klik på kortet"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function pickOrder(id: number | null) {
    const o = orders.find((x) => x.id === id);
    setD((x) => ({ ...x, orderId: id, dedicatedTo: x.dedicatedTo || o?.mention || null }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await saveDelivery(d);
      if (!res.ok) return setMsg({ ok: false, text: res.error });
      setMsg({ ok: true, text: "Gemt i dagbogen! 📔" });
      if (!d.id) router.replace(`/admin/leverancer/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
      <section className="card space-y-4 p-5">
        <h2 className="text-xl font-bold">Hvad har du leveret?</h2>
        <Field label="Tjeneste">
          <select
            className="input"
            value={d.productId ?? ""}
            onChange={(e) => set("productId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Vælg …</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ordre (valgfrit)" hint="Vælger du en ordre, foreslås køberens navn – hvis de har sagt ja til at blive nævnt">
          <select
            className="input"
            value={d.orderId ?? ""}
            onChange={(e) => pickOrder(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Ingen</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} – {o.customerName}
                {o.mention ? "" : " (må ikke nævnes)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Titel" hint="Fx “Bænken ved Moesgaard Strand” eller “Lussing til Kasper”">
          <input className="input" required value={d.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Til (vises offentligt)" hint="Fornavn eller dæknavn. Lad stå tomt for at være anonym.">
          <input className="input" value={d.dedicatedTo ?? ""} onChange={(e) => set("dedicatedTo", e.target.value || null)} />
        </Field>
        <Field label="Lille tekst">
          <textarea className="input min-h-24" value={d.note} onChange={(e) => set("note", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hvornår">
            <input
              type="datetime-local"
              className="input"
              value={d.deliveredAt}
              onChange={(e) => set("deliveredAt", e.target.value)}
              required
            />
          </Field>
          {amountLabel && (
            <Field label={amountLabel}>
              <input
                type="number"
                step="any"
                className="input"
                value={d.amount ?? ""}
                onChange={(e) => set("amount", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
          )}
        </div>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-coral" checked={d.isPublic} onChange={(e) => set("isPublic", e.target.checked)} />
          Vis offentligt (kort, globus, tællere)
        </label>
      </section>

      <div className="space-y-6">
        <section className="card space-y-3 p-5">
          <h2 className="text-xl font-bold">Hvor? 📍</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-sun !py-1.5" onClick={locateMe}>
              📍 Brug min position
            </button>
            {gpsMsg && <span className="text-sm font-semibold">{gpsMsg}</span>}
            {d.lat != null && (
              <button type="button" className="text-sm font-bold text-coral" onClick={() => setD((x) => ({ ...x, lat: null, lng: null }))}>
                Fjern sted
              </button>
            )}
          </div>
          <p className="text-xs text-ink-soft">…eller klik på kortet for at sætte nålen.</p>
          <MapView
            className="h-72"
            fit={false}
            center={d.lat != null && d.lng != null ? [d.lat, d.lng] : [56.15, 10.2]}
            zoom={d.lat != null ? 13 : 7}
            picked={d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null}
            onPick={(lat, lng) => setD((x) => ({ ...x, lat: +lat.toFixed(6), lng: +lng.toFixed(6) }))}
          />
          <Field label="Stedets navn">
            <input className="input" value={d.placeName ?? ""} onChange={(e) => set("placeName", e.target.value || null)} placeholder="Fx Moesgaard Strand" />
          </Field>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-xl font-bold">Foto 📸</h2>
          {d.photoUrl && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-[3px] border-ink">
              <Image src={d.photoUrl} alt="" fill sizes="600px" className="object-cover" unoptimized={d.photoUrl.endsWith(".gif")} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <UploadButton folder="leverancer" onUploaded={(url) => set("photoUrl", url)} label={d.photoUrl ? "📤 Skift foto" : "📤 Upload foto"} />
            {d.photoUrl && (
              <button type="button" className="text-sm font-bold text-coral" onClick={() => set("photoUrl", null)}>
                Fjern foto
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 flex items-center gap-4 xl:col-span-2">
        <button className="btn btn-coral text-lg" disabled={pending}>
          {pending ? "Gemmer …" : "Gem i dagbogen 📔"}
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
