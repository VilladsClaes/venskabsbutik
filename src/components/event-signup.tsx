"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpForEvent } from "@/app/event-actions";
import type { PaymentMethod } from "@/db/schema";
import { formatKr } from "@/lib/money";
import { METHOD_INFO, STRIPE_MIN_OERE } from "@/lib/payments";

export function EventSignup({
  event,
  methods,
  coins,
}: {
  event: { id: number; title: string; price: number; seatsLeft: number | null };
  methods: PaymentMethod[];
  coins: { coin: string; network: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [seats, setSeats] = useState(1);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", allowMention: true });
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "venskab");
  const [barterOffer, setBarterOffer] = useState("");
  const [cryptoCoin, setCryptoCoin] = useState(coins[0]?.coin ?? "");

  const maxSeats = Math.min(20, event.seatsLeft ?? 20);
  const total = event.price * seats;
  const free = total === 0;

  if (event.seatsLeft === 0)
    return (
      <div className="card bg-cream p-6 text-center">
        <p className="text-5xl" aria-hidden="true">😢</p>
        <p className="mt-2 font-display text-2xl font-bold">Fuldt booket</p>
        <p className="text-ink-soft">Skriv til mig, hvis du vil på venteliste.</p>
      </div>
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await signUpForEvent({
        eventId: event.id,
        seats,
        customer,
        note,
        payment: { method, barterOffer, cryptoCoin },
        website: "",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.redirectUrl) window.location.href = res.redirectUrl;
      else router.push(`/ordre/${res.orderNumber}?k=${res.token}`);
    });
  }

  const field = (k: "name" | "email" | "phone") => ({
    value: customer[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomer((c) => ({ ...c, [k]: e.target.value })),
  });

  return (
    <form onSubmit={submit} className="card space-y-4 p-5" id="tilmeld">
      <h2 className="text-2xl font-bold">Meld dig til 🎟️</h2>
      <label className="block">
        <span className="text-sm font-bold">Navn <span className="text-coral">*</span></span>
        <input className="input mt-1" required autoComplete="name" {...field("name")} />
      </label>
      <label className="block">
        <span className="text-sm font-bold">E-mail <span className="text-coral">*</span></span>
        <input className="input mt-1" type="email" required autoComplete="email" {...field("email")} />
        <span className="mt-1 block text-xs text-ink-soft">
          Brug den e-mail, din Google- eller Outlook-kalender hører til – så lander invitationen det rigtige sted.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-bold">Telefon (valgfrit)</span>
        <input className="input mt-1" type="tel" autoComplete="tel" {...field("phone")} />
      </label>
      <div>
        <span className="text-sm font-bold">Antal pladser</span>
        <div className="mt-1 flex items-center gap-2">
          <button type="button" className="btn btn-white !h-10 !w-10 !p-0" onClick={() => setSeats((n) => Math.max(1, n - 1))} aria-label="Færre pladser">
            −
          </button>
          <span className="w-10 text-center font-display text-xl font-bold" aria-live="polite">{seats}</span>
          <button
            type="button"
            className="btn btn-white !h-10 !w-10 !p-0"
            onClick={() => setSeats((n) => Math.min(maxSeats, n + 1))}
            disabled={seats >= maxSeats}
            aria-label="Flere pladser"
          >
            +
          </button>
          {event.seatsLeft != null && <span className="text-sm text-ink-soft">{event.seatsLeft} tilbage</span>}
        </div>
      </div>
      <label className="block">
        <span className="text-sm font-bold">Besked til Villads (valgfrit)</span>
        <textarea className="input mt-1 min-h-16" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-coral"
          checked={customer.allowMention}
          onChange={(e) => setCustomer((c) => ({ ...c, allowMention: e.target.checked }))}
        />
        <span>Villads må gerne fortælle, at jeg var med – med mit fornavn.</span>
      </label>

      <div className="space-y-3 rounded-2xl border-[3px] border-ink bg-sun p-4">
        <div className="flex items-end justify-between">
          <span className="font-display text-lg font-bold">I alt</span>
          <span className="font-display text-3xl font-bold">{free ? "Gratis" : formatKr(total)}</span>
        </div>
        {!free && (
          <fieldset className="space-y-2">
            <legend className="mb-1 font-display font-bold">Hvordan vil du betale?</legend>
            {methods.map((m) => {
              const info = METHOD_INFO[m];
              const tooSmall = m === "stripe" && total < STRIPE_MIN_OERE;
              return (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink px-3 py-1.5 ${
                    method === m ? "bg-white" : "bg-white/50"
                  } ${tooSmall ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="betaling"
                    className="h-4 w-4 accent-coral"
                    checked={method === m}
                    disabled={tooSmall}
                    onChange={() => setMethod(m)}
                  />
                  <span aria-hidden="true">{info.emoji}</span>
                  <span className="text-sm font-bold">{info.label}</span>
                </label>
              );
            })}
          </fieldset>
        )}
        {!free && method === "venskab" && (
          <label className="block">
            <span className="text-sm font-bold">Hvad vil du give mig til gengæld? <span className="text-coral">*</span></span>
            <textarea
              className="input mt-1 min-h-16"
              required
              minLength={5}
              maxLength={1000}
              value={barterOffer}
              onChange={(e) => setBarterOffer(e.target.value)}
            />
          </label>
        )}
        {!free && method === "crypto" && coins.length > 1 && (
          <select className="input" value={cryptoCoin} onChange={(e) => setCryptoCoin(e.target.value)} aria-label="Mønt">
            {coins.map((c) => (
              <option key={c.coin} value={c.coin}>
                {c.coin} ({c.network})
              </option>
            ))}
          </select>
        )}
        <p className="text-sm font-semibold">
          📅 {free ? "Du får en kalenderinvitation med det samme." : "Når betalingen er registreret, får du en kalenderinvitation på din e-mail."}
        </p>
        {error && (
          <p className="rounded-2xl border-2 border-ink bg-coral p-3 font-bold text-white" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-coral w-full text-lg" disabled={pending}>
          {pending ? "Melder dig til … ⏳" : free ? "Meld mig til 🎉" : `Meld mig til og betal ${formatKr(total)}`}
        </button>
      </div>
    </form>
  );
}
