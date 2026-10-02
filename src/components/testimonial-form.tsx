"use client";

import { useActionState, useState } from "react";
import { submitTestimonial, type TestimonialState } from "@/app/actions";

const EMOJIS = ["😊", "😂", "🥰", "🤯", "😇", "🥹", "🔥", "🌈"];

export function TestimonialForm({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState<TestimonialState, FormData>(submitTestimonial, {});
  const [rating, setRating] = useState(5);
  const [emoji, setEmoji] = useState("😊");

  if (state.ok)
    return (
      <div className="card animate-pop-in bg-mint p-6 text-center">
        <p className="text-5xl" aria-hidden="true">🥳</p>
        <p className="mt-2 font-display text-2xl font-bold">Tak, min ven!</p>
        <p>Din anmeldelse bliver vist, så snart jeg har læst den.</p>
      </div>
    );

  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="emoji" value={emoji} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <p className="font-display text-xl font-bold">Har du købt denne? Fortæl de andre! ✍️</p>
      <div className="flex flex-wrap items-center gap-4">
        <div role="radiogroup" aria-label="Antal stjerner" className="flex text-3xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} stjerner`}
              onClick={() => setRating(n)}
              className={`transition hover:scale-125 ${n <= rating ? "text-sun-deep" : "text-ink/20"}`}
            >
              ★
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Vælg en emoji" className="flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              role="radio"
              aria-checked={emoji === e}
              onClick={() => setEmoji(e)}
              className={`grid h-10 w-10 place-items-center rounded-full text-xl transition hover:scale-110 ${
                emoji === e ? "bg-sun ring-[3px] ring-ink" : "bg-cream"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="font-semibold">Dit navn (eller dæknavn)</span>
        <input name="authorName" className="input mt-1" required maxLength={60} />
      </label>
      <label className="block">
        <span className="font-semibold">Din oplevelse</span>
        <textarea name="text" className="input mt-1 min-h-28" required minLength={5} maxLength={1000} />
      </label>
      {state.error && <p className="font-bold text-coral">{state.error}</p>}
      <button className="btn btn-sun" disabled={pending}>
        {pending ? "Sender …" : "Send anmeldelse 💌"}
      </button>
    </form>
  );
}
