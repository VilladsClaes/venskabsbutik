/** Villads' fødselsdag og de "runde" fødselsdage man kan komme med til */
export const BIRTH = { year: 1986, month: 10, day: 21 };

const DAY = 24 * 60 * 60 * 1000;

function birthDate() {
  return new Date(Date.UTC(BIRTH.year, BIRTH.month - 1, BIRTH.day, 12));
}

export type Milestone = { key: string; label: string; date: Date; emoji: string };

/** Næste runde fødselsdage: hele år, 1.000 dage, 100 måneder, 1.000 uger og sjove tal */
export function upcomingMilestones(from = new Date(), count = 6): Milestone[] {
  const b = birthDate();
  const out: Milestone[] = [];
  const add = (key: string, label: string, date: Date, emoji: string) => {
    if (date.getTime() > from.getTime() - DAY) out.push({ key, label, date, emoji });
  };
  for (let y = 10; y <= 100; y += 1) {
    const d = new Date(Date.UTC(BIRTH.year + y, BIRTH.month - 1, BIRTH.day, 12));
    if (y % 10 === 0) add(`y${y}`, `${y} år`, d, "🎂");
    else add(`y${y}`, `${y}-års fødselsdag`, d, "🎈");
  }
  for (let n = 10000; n <= 30000; n += 1000) add(`d${n}`, `${n.toLocaleString("da-DK")} dage`, new Date(b.getTime() + n * DAY), "📅");
  for (let n = 400; n <= 1000; n += 100) {
    const d = new Date(Date.UTC(BIRTH.year, BIRTH.month - 1 + n, BIRTH.day, 12));
    add(`m${n}`, `${n} måneder`, d, "🗓️");
  }
  for (let n = 2000; n <= 5000; n += 500) add(`w${n}`, `${n.toLocaleString("da-DK")} uger`, new Date(b.getTime() + n * 7 * DAY), "🧁");
  for (const n of [12345, 13579, 15000, 17777, 22222]) add(`s${n}`, `${n.toLocaleString("da-DK")} dage (sjovt tal!)`, new Date(b.getTime() + n * DAY), "✨");
  const seen = new Set<string>();
  return out
    .sort((a, c) => a.date.getTime() - c.date.getTime())
    .filter((m) => {
      const k = m.date.toISOString().slice(0, 10);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, count);
}

export function ageInDays(at = new Date()) {
  return Math.floor((at.getTime() - birthDate().getTime()) / DAY);
}
