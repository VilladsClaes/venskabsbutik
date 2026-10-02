/** 540 -> "5,40 kr." */
export function formatKr(oere: number): string {
  const kr = oere / 100;
  return (
    kr.toLocaleString("da-DK", {
      minimumFractionDigits: Number.isInteger(kr) ? 0 : 2,
      maximumFractionDigits: 2,
    }) + " kr."
  );
}

/** Beløbet som det skal tastes i MobilePay: 540 -> "5,40" */
export function formatAmount(oere: number): string {
  return (oere / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Prisen som "varenummer", som på den gamle side: 540 -> "5,4", 700 -> "7" */
export function priceCode(oere: number): string {
  return (oere / 100).toLocaleString("da-DK", { maximumFractionDigits: 2 });
}

/** "12,5" eller "12.50" -> 1250. Returnerer null ved ugyldigt input. */
export function parseKr(input: string): number | null {
  const cleaned = input.trim().replace(/\s|kr\.?/gi, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
