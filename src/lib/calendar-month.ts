import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { upcomingMilestones } from "./birthday";
import { getBusy } from "./calendar";
import { fromLocalInput } from "./dates";
import { getUpcomingEvents } from "./events";

// Byg en måned til den offentlige kalender: hvornår er Villads optaget, og hvilke events kan man komme med til.
// Kun tidsrummene vises – aldrig hvad Villads laver.

export type DayEvent = {
  slug: string;
  title: string;
  emoji: string;
  color: string;
  /** Minutter efter midnat (dansk tid), klippet til dagen */
  from: number;
  to: number;
  time: string;
  price: number;
  seatsLeft: number | null;
};

export type CalendarDay = {
  date: string;
  /** Optagede tidsrum i minutter efter midnat */
  busy: { from: number; to: number }[];
  events: DayEvent[];
  milestones: { label: string; emoji: string }[];
  past: boolean;
};

export type CalendarMonth = {
  key: string;
  label: string;
  /** 0 = mandag */
  firstWeekday: number;
  days: CalendarDay[];
  hasBusyData: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dayStart = (y: number, m: number, d: number) => fromLocalInput(`${y}-${pad(m)}-${pad(d)}T00:00`);
const time = (d: Date) => d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen" });

/** "2026-11" -> { y: 2026, m: 11 }. Ugyldigt eller udenfor rækkevidde -> denne måned */
export function parseMonth(value: string | undefined, now = new Date()) {
  const today = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" });
  const cur = { y: +today.slice(0, 4), m: +today.slice(5, 7) };
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return cur;
  const y = +match[1];
  const m = +match[2];
  const diff = (y - cur.y) * 12 + (m - cur.m);
  if (m < 1 || m > 12 || diff < 0 || diff > 18) return cur;
  return { y, m };
}

export function shiftMonth({ y, m }: { y: number; m: number }, by: number) {
  const i = y * 12 + (m - 1) + by;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
}

export const monthKey = ({ y, m }: { y: number; m: number }) => `${y}-${pad(m)}`;

export async function buildMonth(y: number, m: number, now = new Date()): Promise<CalendarMonth> {
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const starts = Array.from({ length: daysInMonth + 1 }, (_, i) =>
    i < daysInMonth ? dayStart(y, m, i + 1) : dayStart(shiftMonth({ y, m }, 1).y, shiftMonth({ y, m }, 1).m, 1),
  );
  const from = starts[0];
  const to = starts[daysInMonth];

  const [busy, events, birthday] = await Promise.all([
    getBusy(from, to),
    getUpcomingEvents(from > now ? from : now, to),
    db.query.products.findFirst({ where: eq(s.products.slug, "foedselsdag"), columns: { id: true, active: true } }),
  ]);
  // Runde fødselsdage foreslås automatisk – medmindre der allerede er et rigtigt event den dag
  const milestones = birthday?.active ? upcomingMilestones(now, 60).filter((x) => x.date >= from && x.date < to) : [];

  const days: CalendarDay[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const start = starts[i].getTime();
    const end = starts[i + 1].getTime();
    const clip = (a: Date, b: Date) => ({
      from: Math.max(0, Math.round((a.getTime() - start) / 60000)),
      to: Math.min((end - start) / 60000, Math.round((b.getTime() - start) / 60000)),
    });
    const overlapping = events.filter((e) => e.startsAt.getTime() < end && e.endsAt.getTime() > start);
    const dayEvents = overlapping.map((e) => ({
        slug: e.slug,
        title: e.title,
        emoji: e.emoji,
        color: e.color,
        ...clip(e.startsAt, e.endsAt),
        time: `${time(e.startsAt)}–${time(e.endsAt)}`,
        price: e.price,
        seatsLeft: e.seatsLeft,
      }));
    const dayMilestones = overlapping.some((e) => e.product?.slug === "foedselsdag")
      ? []
      : milestones
          .filter((x) => x.date.getTime() >= start && x.date.getTime() < end)
          .map((x) => ({ label: x.label, emoji: x.emoji }));
    days.push({
      date: `${y}-${pad(m)}-${pad(i + 1)}`,
      busy: busy.intervals.filter((b) => b.start.getTime() < end && b.end.getTime() > start).map((b) => clip(b.start, b.end)),
      events: dayEvents,
      milestones: dayMilestones,
      past: end <= now.getTime(),
    });
  }

  const label = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("da-DK", { month: "long", year: "numeric", timeZone: "UTC" });
  return {
    key: monthKey({ y, m }),
    label: label.charAt(0).toUpperCase() + label.slice(1),
    firstWeekday: (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7,
    days,
    hasBusyData: busy.sources.length > 0,
  };
}
