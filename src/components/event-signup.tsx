"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpForEvent } from "@/app/event-actions";
import { formatKr } from "@/lib/money";

type Guest = { name: string; email: string };

/** Tilmelding: dig selv + evt. venner (hver med e-mail, så alle får en kalenderinvitation). Ingen betaling endnu. */
export function EventSignup({
  event,
}: {
  event: {
    id: number;
    price: number;
    seatsLeft: number | null;
    status: "samler" | "gennemfoeres" | "aflyst";
    minParticipants: number;
    deadlineText: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [booker, setBooker] = useState({ name: "", email: "", phone: "" });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [hideName, setHideName] = useState(false);
  const [note, setNote] = useState("");

  const people = 1 + guests.length;
  const maxPeople = Math.min(10, event.seatsLeft ?? 10);
  const total = event.price * people;
  const confirmed = event.status === "gennemfoeres";

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
      const res = await signUpForEvent({ eventId: event.id, booker, guests, hideName, note, website: "" });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/tilmelding/${res.token}?ny=1`);
    });
  }

  const setGuest = (i: number, k: keyof Guest, v: string) => setGuests((g) => g.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <form onSubmit={submit} className="card space-y-4 p-5" id="tilmeld">
      <h2 className="text-2xl font-bold">Meld dig til 🙋</h2>
      <label className="block">
        <span className="text-sm font-bold">Dit navn <span className="text-coral">*</span></span>
        <input className="input mt-1" required autoComplete="name" value={booker.name} onChange={(e) => setBooker((b) => ({ ...b, name: e.target.value }))} />
      </label>
      <label className="block">
        <span className="text-sm font-bold">Din e-mail <span className="text-coral">*</span></span>
        <input
          className="input mt-1"
          type="email"
          required
          autoComplete="email"
          value={booker.email}
          onChange={(e) => setBooker((b) => ({ ...b, email: e.target.value }))}
        />
        <span className="mt-1 block text-xs text-ink-soft">Brug den e-mail, din kalender hører til – så lander invitationen det rigtige sted.</span>
      </label>
      <label className="block">
        <span className="text-sm font-bold">Telefon (valgfrit)</span>
        <input className="input mt-1" type="tel" autoComplete="tel" value={booker.phone} onChange={(e) => setBooker((b) => ({ ...b, phone: e.target.value }))} />
      </label>

      {guests.map((g, i) => (
        <fieldset key={i} className="space-y-2 rounded-2xl border-2 border-dashed border-ink/40 p-3">
          <legend className="px-1 text-sm font-bold">Ven {i + 1}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" required placeholder="Navn" aria-label={`Ven ${i + 1}: navn`} value={g.name} onChange={(e) => setGuest(i, "name", e.target.value)} />
            <input
              className="input"
              required
              type="email"
              placeholder="E-mail"
              aria-label={`Ven ${i + 1}: e-mail`}
              value={g.email}
              onChange={(e) => setGuest(i, "email", e.target.value)}
            />
          </div>
          <button type="button" className="text-xs font-bold text-coral underline" onClick={() => setGuests((x) => x.filter((_, j) => j !== i))}>
            Fjern
          </button>
        </fieldset>
      ))}
      {people < maxPeople && (
        <button type="button" className="btn btn-white w-full !py-2" onClick={() => setGuests((g) => [...g, { name: "", email: "" }])}>
          + Tag en ven med
        </button>
      )}

      <label className="block">
        <span className="text-sm font-bold">Besked til Villads (valgfrit)</span>
        <textarea className="input mt-1 min-h-16" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-coral" checked={hideName} onChange={(e) => setHideName(e.target.checked)} />
        <span>Vis ikke {guests.length ? "vores navne" : "mit navn"} på siden (vi tæller stadig med)</span>
      </label>

      <div className="space-y-3 rounded-2xl border-[3px] border-ink bg-sun p-4">
        <div className="flex items-end justify-between">
          <span className="font-display text-lg font-bold">{people > 1 ? `${people} personer` : "Pris"}</span>
          <span className="font-display text-3xl font-bold">{total ? formatKr(total) : "Gratis"}</span>
        </div>
        <p className="text-sm font-semibold">
          {confirmed
            ? `✅ Eventet er bekræftet – du får en kalenderinvitation med det samme${total ? " og et link til betaling" : ""}.`
            : `💛 Du betaler ikke noget nu. Når vi er mindst ${event.minParticipants}, får ${guests.length ? "I" : "du"} en kalenderinvitation${total ? ", og du bliver bedt om at betale" : ""}. Bliver vi ikke nok inden ${event.deadlineText}, aflyses det, og du hører fra mig.`}
        </p>
        {error && (
          <p className="rounded-2xl border-2 border-ink bg-coral p-3 font-bold text-white" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-coral w-full text-lg" disabled={pending}>
          {pending ? "Melder dig til … ⏳" : people > 1 ? `Tilmeld ${people} personer 🎉` : "Meld mig til 🎉"}
        </button>
      </div>
    </form>
  );
}
