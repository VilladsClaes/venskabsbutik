const TZ = "Europe/Copenhagen";

/** Minutter Danmark er foran UTC på et givent tidspunkt (60 om vinteren, 120 om sommeren) */
function offsetMinutes(at: Date) {
  const local = new Date(at.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

/** "2026-10-02T14:30" (dansk tid) -> Date */
export function fromLocalInput(value: string): Date {
  const asUtc = new Date(`${value}:00Z`.replace(/:00:00Z$/, ":00Z"));
  if (Number.isNaN(asUtc.getTime())) return asUtc;
  return new Date(asUtc.getTime() - offsetMinutes(asUtc) * 60000);
}

/** Date -> "2026-10-02T14:30" i dansk tid, til <input type="datetime-local"> */
export function toLocalInput(d: Date): string {
  const local = new Date(d.getTime() + offsetMinutes(d) * 60000);
  return local.toISOString().slice(0, 16);
}
