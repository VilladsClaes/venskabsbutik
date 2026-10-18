import ICAL from "ical.js";
import { fromLocalInput } from "../dates";
import type { Interval } from "./providers";

// Private Microsoft-konti kan ikke længere registrere apps, så Outlook læses i stedet fra en
// publiceret kalender (Outlook.com → Indstillinger → Kalender → Delte kalendere → Udgiv en
// kalender → "Kan se, hvornår jeg er optaget"). Linket giver kun tidsrum, aldrig titler.

const pad = (n: number) => String(n).padStart(2, "0");

/** Heldagsbegivenheder og tider uden tidszone tolkes som dansk tid */
function toDate(t: ICAL.Time): Date {
  const day = `${t.year}-${pad(t.month)}-${pad(t.day)}`;
  if (t.isDate) return fromLocalInput(`${day}T00:00`);
  if (!t.zone || t.zone.tzid === "floating") return fromLocalInput(`${day}T${pad(t.hour)}:${pad(t.minute)}`);
  return t.toJSDate();
}

/** Er begivenheden markeret som "ledig" (fx en påmindelse), tæller den ikke */
function isFree(c: ICAL.Component) {
  const transp = String(c.getFirstPropertyValue("transp") ?? "").toUpperCase();
  const busy = String(c.getFirstPropertyValue("x-microsoft-cdo-busystatus") ?? "").toUpperCase();
  const status = String(c.getFirstPropertyValue("status") ?? "").toUpperCase();
  return transp === "TRANSPARENT" || busy === "FREE" || status === "CANCELLED";
}

export function parseIcsBusy(text: string, from: Date, to: Date): Interval[] {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(tz);

  // Gentagne begivenheder: flyttede eller aflyste forekomster ligger som undtagelser med samme UID
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Component[] = [];
  for (const c of root.getAllSubcomponents("vevent")) {
    if (c.hasProperty("recurrence-id")) exceptions.push(c);
    else masters.set(String(c.getFirstPropertyValue("uid") ?? Math.random()), new ICAL.Event(c));
  }
  for (const c of exceptions) masters.get(String(c.getFirstPropertyValue("uid")))?.relateException(c);

  const out: Interval[] = [];
  const add = (start: Date, end: Date) => {
    if (start < to && end > from && end > start) out.push({ start, end });
  };
  for (const ev of masters.values()) {
    if (!ev.isRecurring()) {
      if (!isFree(ev.component)) add(toDate(ev.startDate), toDate(ev.endDate ?? ev.startDate));
      continue;
    }
    const it = ev.iterator();
    for (let i = 0, next = it.next(); next && i < 5000; i++, next = it.next()) {
      const d = ev.getOccurrenceDetails(next);
      const start = toDate(d.startDate);
      if (start >= to) break;
      if (!isFree(d.item.component)) add(start, toDate(d.endDate));
    }
  }
  return out;
}

export async function fetchIcsBusy(url: string, from: Date, to: Date): Promise<Interval[]> {
  const res = await fetch(url.trim().replace(/^webcal:\/\//i, "https://"), {
    cache: "no-store",
    headers: { "User-Agent": "Venskabsbutikken-kalender" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Kalenderlinket svarede ${res.status}`);
  const text = await res.text();
  if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Linket er ikke en kalender (.ics)");
  return parseIcsBusy(text, from, to);
}
