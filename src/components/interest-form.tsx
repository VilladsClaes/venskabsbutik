"use client";

import { useState, useTransition } from "react";
import { registerInterest } from "@/app/event-actions";

/** "Ingen dato der passer? Sig at du er interesseret" – får en mail, når der kommer en ny dato */
export function InterestForm({ productId, hasDates }: { productId: number; hasDates: boolean }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(!hasDates);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ name: "", email: "", note: "" });

  if (done)
    return (
      <p className="card animate-pop-in bg-mint p-4 font-semibold" role="status">
        Tak! Jeg giver dig besked, når der kommer en dato 💛
      </p>
    );
  if (!open)
    return (
      <button type="button" className="font-bold underline" onClick={() => setOpen(true)}>
        Ingen dato der passer? Sig at du er interesseret
      </button>
    );

  return (
    <form
      className="card space-y-3 bg-cream p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        startTransition(async () => {
          const res = await registerInterest({ productId, ...f, website: "" });
          if (res.ok) setDone(true);
          else setError(res.error ?? "Det gik ikke");
        });
      }}
    >
      <p className="font-display text-lg font-bold">{hasDates ? "Ingen dato der passer?" : "Der er ingen dato endnu"} 🙋</p>
      <p className="text-sm">Sig at du er interesseret, så får du en mail, når jeg planlægger en ny dato.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" required placeholder="Navn" aria-label="Navn" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input
          className="input"
          required
          type="email"
          placeholder="E-mail"
          aria-label="E-mail"
          autoComplete="email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
      </div>
      <input
        className="input"
        placeholder="Hvornår passer det dig? (valgfrit)"
        aria-label="Hvornår passer det dig?"
        value={f.note}
        onChange={(e) => setF({ ...f, note: e.target.value })}
      />
      {error && (
        <p className="font-bold text-coral" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-coral" disabled={pending}>
        {pending ? "Gemmer …" : "Jeg er interesseret"}
      </button>
    </form>
  );
}
