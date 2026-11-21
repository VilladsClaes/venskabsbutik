"use client";

import { useActionState, useState } from "react";
import { subscribeFriendship, type SubscriptionState } from "@/app/actions";
import {
  breakEvenMonth,
  formatDuration,
  formatMonthly,
  monthsBetween,
  nextPriceDrop,
  tierForMonth,
  totalAfter,
  type SubscriptionMethod,
} from "@/lib/subscription";

const METHOD_LABEL: Record<SubscriptionMethod, string> = {
  bank: "🏦 Fast overførsel fra netbank",
  mobilepay: "💙 MobilePay hver måned",
  paypal: "🅿️ PayPal",
  buymeacoffee: "☕ Buy Me a Coffee",
};

const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function FriendshipSubscription({ methods }: { methods: SubscriptionMethod[] }) {
  const [today] = useState(() => new Date());
  const [since, setSince] = useState(() => toInput(today));
  const [state, action, pending] = useActionState<SubscriptionState, FormData>(subscribeFriendship, {});

  const sinceDate = /^\d{4}-\d{2}-\d{2}$/.test(since) ? new Date(`${since}T12:00:00`) : today;
  const valid = !Number.isNaN(sinceDate.getTime()) && sinceDate <= today;
  const months = valid ? monthsBetween(sinceDate, today) : 0;
  const tier = tierForMonth(months);
  const paid = totalAfter(months);
  const drop = valid ? nextPriceDrop(sinceDate, today) : null;
  const breakEven = breakEvenMonth();
  const left = breakEven - months;

  if (state.ok)
    return (
      <div className="card animate-pop-in bg-mint p-8 text-center">
        <p className="text-6xl" aria-hidden="true">🥳</p>
        <p className="mt-2 font-display text-3xl font-bold">Velkommen som abonnent!</p>
        <p className="mt-2 text-lg">
          Du er på trinnet <strong>{state.tierName}</strong> og betaler{" "}
          <strong>{formatMonthly(state.price ?? 0)}</strong> om måneden. Sæt den faste overførsel op herunder – du
          får en mail på vores venskabsdag, når prisen falder.
        </p>
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="card space-y-4 bg-sun p-6">
        <label className="block">
          <span className="font-display text-xl font-bold">Hvornår blev vi venner?</span>
          <input
            type="date"
            className="input mt-2"
            value={since}
            max={toInput(today)}
            min="1900-01-01"
            onChange={(e) => setSince(e.target.value)}
          />
          <span className="mt-1 block text-sm">Er vi allerede venner, starter du længere nede ad trappen.</span>
        </label>
        <div className="rounded-2xl border-[3px] border-ink bg-white p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">Din pris lige nu</p>
          <p className={`font-display text-5xl font-bold ${tier.price < 0 ? "text-mint" : ""}`}>
            {formatMonthly(tier.price)}
            <span className="text-xl"> / md.</span>
          </p>
          <p className="mt-1 font-semibold">
            {tier.emoji} {tier.name} · venskabsår {Math.floor(months / 12) + 1}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/70 p-3">
            <dt className="font-bold">Venner i</dt>
            <dd className="font-display text-lg">{months ? formatDuration(months) : "under en måned"}</dd>
          </div>
          <div className="rounded-2xl bg-white/70 p-3">
            <dt className="font-bold">Næste prisfald</dt>
            <dd className="font-display text-lg">
              {drop ? drop.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" }) : "Aldrig – du er i mål"}
            </dd>
          </div>
          <div className="rounded-2xl bg-white/70 p-3">
            <dt className="font-bold">Havde du abonneret fra start</dt>
            <dd className="font-display text-lg">{formatMonthly(paid).replace(" kr.", " kr. betalt")}</dd>
          </div>
          <div className="rounded-2xl bg-white/70 p-3">
            <dt className="font-bold">Venskabet går i nul</dt>
            <dd className="font-display text-lg">{left > 0 ? `om ${formatDuration(left)}` : "Det er sket! 🎉"}</dd>
          </div>
        </dl>
      </div>

      <form action={action} className="card space-y-4 p-6">
        <input type="hidden" name="friendsSince" value={since} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <p className="font-display text-2xl font-bold">Tegn abonnement ✍️</p>
        <label className="block">
          <span className="text-sm font-bold">Dit navn</span>
          <input name="name" required maxLength={80} className="input mt-1" autoComplete="name" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">E-mail</span>
            <input name="email" type="email" required maxLength={120} className="input mt-1" autoComplete="email" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Telefon (valgfrit)</span>
            <input name="phone" type="tel" maxLength={20} className="input mt-1" autoComplete="tel" />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-bold">Sådan betaler jeg</legend>
          <div className="mt-1 grid gap-2">
            {methods.map((m, i) => (
              <label key={m} className="flex items-center gap-3 rounded-2xl border-[3px] border-ink px-3 py-2">
                <input type="radio" name="method" value={m} defaultChecked={i === 0} required />
                <span className="font-semibold">{METHOD_LABEL[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="text-sm font-bold">Noget jeg skal vide? (valgfrit)</span>
          <textarea name="note" maxLength={500} className="input mt-1 min-h-20" placeholder="Fx: Jeg er allergisk over for uopfordrede råd" />
        </label>
        {state.error && <p className="font-bold text-coral" role="alert">{state.error}</p>}
        <button className="btn btn-coral w-full justify-center text-lg" disabled={pending || !valid}>
          {pending ? "Et øjeblik…" : `Start abonnement til ${formatMonthly(tier.price)}/md.`}
        </button>
        <p className="text-xs text-ink-soft">
          Ingen binding. Du kan opsige, når du vil – men så starter du forfra på 79 kr., hvis du fortryder.
        </p>
      </form>
    </div>
  );
}
