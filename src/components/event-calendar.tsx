"use client";

import Link from "next/link";
import { useState } from "react";
import type { CalendarDay, CalendarMonth } from "@/lib/calendar-month";
import { formatKr } from "@/lib/money";

const WEEKDAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
// Dagens tidslinje vises fra kl. 7 til midnat – om natten sover jeg (som regel)
const VIEW_FROM = 7 * 60;
const VIEW_TO = 24 * 60;

const pct = (min: number) => `${(Math.min(Math.max(min, VIEW_FROM), VIEW_TO) - VIEW_FROM) / (VIEW_TO - VIEW_FROM) * 100}%`;
const width = (a: number, b: number) =>
  `${(Math.max(0, Math.min(b, VIEW_TO) - Math.max(a, VIEW_FROM)) / (VIEW_TO - VIEW_FROM)) * 100}%`;
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}.${String(min % 60).padStart(2, "0")}`;

/** Hvor stor en del af dagen (7–24) er optaget */
function busyShare(day: CalendarDay) {
  const covered = day.busy.reduce((n, b) => n + Math.max(0, Math.min(b.to, VIEW_TO) - Math.max(b.from, VIEW_FROM)), 0);
  return covered / (VIEW_TO - VIEW_FROM);
}

function freeSlots(day: CalendarDay) {
  const out: { from: number; to: number }[] = [];
  let cursor = VIEW_FROM;
  for (const b of [...day.busy].sort((a, c) => a.from - c.from)) {
    if (b.from - cursor >= 60) out.push({ from: cursor, to: Math.min(b.from, VIEW_TO) });
    cursor = Math.max(cursor, b.to);
  }
  if (VIEW_TO - cursor >= 60) out.push({ from: cursor, to: VIEW_TO });
  return out;
}

export function EventCalendar({ month, prev, next, today }: { month: CalendarMonth; prev?: string; next?: string; today: string }) {
  const firstInteresting = month.days.find((d) => !d.past && d.events.length) ?? month.days.find((d) => d.date === today);
  const [selected, setSelected] = useState(firstInteresting?.date ?? month.days[0].date);
  const day = month.days.find((d) => d.date === selected) ?? month.days[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-sun px-4 py-3">
          {prev ? (
            <Link href={`/kalender?m=${prev}`} scroll={false} className="btn btn-white !px-3 !py-1" aria-label="Forrige måned">
              ←
            </Link>
          ) : (
            <span className="w-10" />
          )}
          <h2 className="text-2xl font-bold">{month.label}</h2>
          {next ? (
            <Link href={`/kalender?m=${next}`} scroll={false} className="btn btn-white !px-3 !py-1" aria-label="Næste måned">
              →
            </Link>
          ) : (
            <span className="w-10" />
          )}
        </div>
        <div className="grid grid-cols-7 border-b-2 border-ink/20 bg-cream text-center text-xs font-bold text-ink-soft">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1.5">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-ink/10">
          {Array.from({ length: month.firstWeekday }, (_, i) => (
            <div key={`tom-${i}`} className="bg-white/60" />
          ))}
          {month.days.map((d) => {
            const share = busyShare(d);
            const isSel = d.date === selected;
            const label = [
              d.date,
              d.events.map((e) => e.title).join(", "),
              d.milestones.map((x) => x.label).join(", "),
              month.hasBusyData ? (share >= 0.95 ? "optaget" : share > 0 ? "delvist optaget" : "ledig") : "",
            ]
              .filter(Boolean)
              .join(" – ");
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelected(d.date)}
                aria-pressed={isSel}
                aria-label={label}
                className={`relative flex min-h-16 flex-col items-stretch gap-1 p-1 text-left transition sm:min-h-24 sm:p-1.5 ${
                  isSel ? "z-10 bg-sun/60 outline outline-[3px] outline-ink" : "bg-white hover:bg-cream"
                } ${d.past ? "opacity-45" : ""}`}
              >
                <span className={`text-sm font-bold ${d.date === today ? "grid h-6 w-6 place-items-center rounded-full bg-coral text-white" : ""}`}>
                  {+d.date.slice(8)}
                </span>
                <span className="flex flex-wrap gap-0.5 text-base leading-none sm:text-lg" aria-hidden="true">
                  {d.events.map((e) => (
                    <span key={e.slug} title={e.title}>
                      {e.emoji}
                    </span>
                  ))}
                  {d.milestones.map((x) => (
                    <span key={x.label} title={x.label}>
                      {x.emoji}
                    </span>
                  ))}
                </span>
                {d.events[0] && (
                  <span
                    className="hidden truncate rounded-md border border-ink px-1 text-[11px] font-bold sm:block"
                    style={{ background: d.events[0].color }}
                  >
                    {d.events[0].title}
                  </span>
                )}
                {month.hasBusyData && !d.past && (
                  <span className="relative mt-auto block h-1.5 overflow-hidden rounded-full bg-mint/50" aria-hidden="true">
                    {d.busy.map((b, i) => (
                      <span key={i} className="absolute inset-y-0 bg-coral" style={{ left: pct(b.from), width: width(b.from, b.to) }} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {month.hasBusyData && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-ink/20 bg-cream px-4 py-2 text-xs font-semibold text-ink-soft">
            <span>
              <span className="mr-1 inline-block h-2 w-4 rounded-full bg-mint/50 align-middle" /> ledig
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-4 rounded-full bg-coral align-middle" /> optaget
            </span>
            <span>🎂 rund fødselsdag · 🎉 event du kan komme med til</span>
          </p>
        )}
      </div>

      <DayDetail day={day} hasBusyData={month.hasBusyData} />
    </div>
  );
}

function DayDetail({ day, hasBusyData }: { day: CalendarDay; hasBusyData: boolean }) {
  const date = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const free = freeSlots(day);
  const hours = [8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <div className="card space-y-4 p-5 lg:sticky lg:top-24 lg:self-start" aria-live="polite">
      <h3 className="text-2xl font-bold first-letter:uppercase">{date}</h3>

      {hasBusyData && !day.past && (
        <div>
          <div className="relative h-8 overflow-hidden rounded-xl border-2 border-ink bg-mint/40">
            {day.busy.map((b, i) => (
              <span
                key={i}
                className="absolute inset-y-0 bg-coral/85"
                style={{ left: pct(b.from), width: width(b.from, b.to) }}
                title={`Optaget ${hhmm(b.from)}–${hhmm(b.to)}`}
              />
            ))}
            {day.events.map((e) => (
              <span
                key={e.slug}
                className="absolute inset-y-1 rounded-md border-2 border-ink"
                style={{ left: pct(e.from), width: width(e.from, e.to), background: e.color }}
                title={e.title}
              />
            ))}
          </div>
          <div className="relative mt-1 h-4 text-[10px] font-semibold text-ink-soft">
            {hours.map((h) => (
              <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h * 60) }}>
                {h}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold">
            {free.length === 0
              ? "😅 Jeg er optaget det meste af dagen."
              : `🟢 Ledig ${free.map((f) => `${hhmm(f.from)}–${hhmm(f.to)}`).join(", ")}`}
          </p>
        </div>
      )}

      {day.events.map((e) => (
        <Link
          key={e.slug}
          href={`/kalender/${e.slug}`}
          className="block rounded-2xl border-[3px] border-ink p-4 shadow-[0_3px_0_0_#2b2d42] transition hover:-translate-y-0.5"
          style={{ background: `color-mix(in srgb, ${e.color} 35%, white)` }}
        >
          <span className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden="true">{e.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold leading-tight">{e.title}</span>
              <span className="block text-sm font-semibold">kl. {e.time}</span>
              <span className="mt-1 block text-sm">
                {e.price ? `${formatKr(e.price)} pr. plads` : "Gratis"}
                {e.seatsLeft != null && ` · ${e.seatsLeft ? `${e.seatsLeft} pladser tilbage` : "Fuldt booket"}`}
              </span>
            </span>
            <span className="font-bold" aria-hidden="true">→</span>
          </span>
        </Link>
      ))}

      {day.milestones.map((x) => (
        <Link
          key={x.label}
          href="/tjenester/foedselsdag"
          className="block rounded-2xl border-[3px] border-dashed border-ink bg-[#ffe5ec] p-4 transition hover:bg-[#ffd6e0]"
        >
          <span className="font-display text-lg font-bold">
            {x.emoji} Min fødselsdag: {x.label}
          </span>
          <span className="block text-sm">Foreslået fest – køb dig adgang til fødselsdagen →</span>
        </Link>
      ))}

      {!day.events.length && !day.milestones.length && (
        <p className="text-ink-soft">
          Intet planlagt event den dag.{" "}
          {!day.past && free.length > 0 && hasBusyData && "Har du en idé? Skriv til mig – måske kan vi finde på noget i et ledigt hul."}
        </p>
      )}
    </div>
  );
}
