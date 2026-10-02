/** Hvad "amount"-feltet i leveringsdagbogen betyder for de forskellige tjenester */
export const AMOUNT_LABELS: Record<string, string> = {
  "taenk-paa-dig": "Minutter tænkt",
  lussing: "Rødme på kinden (1–10)",
  "mad-til-hjemloese": "Beløb brugt på mad (kr.)",
  kiva: "Beløb lånt ud (kr.)",
  "jeg-lytter": "Minutter lyttet",
  "jeg-hepper-paa-dig": "Decibel (cirka)",
};

/** Tjenester hvor et sted på kortet giver mening */
export const MAP_PRODUCTS = ["baenk", "stykke-af-himlen", "en-sky-efter-dig", "besoeg-din-ven", "politisk-tale"];

/** Tjenester der vises på himmelglobussen */
export const SKY_PRODUCTS = ["stykke-af-himlen", "en-sky-efter-dig"];
