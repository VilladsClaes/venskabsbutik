import { timingSafeEqual } from "node:crypto";

/** Sammenligner hemmelige nøgler i konstant tid */
export function safeEqual(a: unknown, b: string | null | undefined): boolean {
  if (typeof a !== "string" || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
