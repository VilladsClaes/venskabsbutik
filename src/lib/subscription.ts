/**
 * Venskabsabonnementet: prisen falder for hvert år, I har været venner.
 * År 1 koster 79 kr./md., så falder det 10 kr. om året, til venskabet i år 10
 * bliver rentabelt, og jeg betaler 5 kr./md. tilbage. Beløb er i øre.
 */

export type SubscriptionTier = {
  /** Venskabsår, 1-baseret. Det sidste trin gælder resten af livet. */
  year: number;
  /** Månedspris i øre – negativ betyder, at jeg betaler dig */
  price: number;
  name: string;
  emoji: string;
  tagline: string;
  /** Det, der kommer til på dette trin (alt fra tidligere trin følger med) */
  perks: string[];
};

export const TIERS: SubscriptionTier[] = [
  {
    year: 1,
    price: 7900,
    name: "Prøveperioden",
    emoji: "🤝",
    tagline: "Vi er stadig høflige over for hinanden",
    perks: [
      "“Vi skal ses snart!” – uden at nævne en dato",
      "Ét kaffebesøg, aftalt tre uger i forvejen",
      "Grin af dine jokes, også dem der ikke er sjove",
      "Jeg tager skoene af i entréen uden at blive bedt om det",
    ],
  },
  {
    year: 2,
    price: 6900,
    name: "Kaffevennen",
    emoji: "☕",
    tagline: "Nu ringer jeg ikke længere på – jeg banker bare og går ind",
    perks: [
      "Uanmeldt kaffebesøg (højst ét pr. kvartal)",
      "Jeg husker din fødselsdag (med lidt hjælp fra Facebook)",
      "Ret til at sige “det samme som sidst” på din café",
    ],
  },
  {
    year: 3,
    price: 5900,
    name: "Flyttehjælperen",
    emoji: "📦",
    tagline: "Jeg bærer kasser – men kun op til 2. sal",
    perks: [
      "Hjælp til flytning mod pizza og øl",
      "Jeg låner din boremaskine og glemmer at aflevere den",
      "Ærlig mening om din nye frisure (spørg ikke, hvis du ikke vil vide det)",
    ],
  },
  {
    year: 4,
    price: 4900,
    name: "Karriererådgiveren",
    emoji: "💼",
    tagline: "Jeg har tænkt lidt over dit liv – mere end du har",
    perks: [
      "Kommentarer om din karrierevej (“Har du overvejet at blive lærer?”)",
      "Uopfordret LinkedIn-anbefaling i færdigheden “Excel”",
      "Jeg spørger til lønforhandlingen hver gang, vi ses",
    ],
  },
  {
    year: 5,
    price: 3900,
    name: "Opdrageren",
    emoji: "🧸",
    tagline: "Jeg har ingen børn, men jeg har mange meninger om dine",
    perks: [
      "Uopfordret opdragelsesrådgivning – også foran børnene",
      "Jeg giver dine børn slik lige før aftensmaden",
      "Den samme anekdote fra 2009, fortalt med stigende detaljegrad",
    ],
  },
  {
    year: 6,
    price: 2900,
    name: "Køleskabsvennen",
    emoji: "🧀",
    tagline: "Jeg spørger ikke længere – jeg tager bare",
    perks: [
      "Uanmeldte kaffebesøg uden loft",
      "Fri adgang til dit køleskab, inkl. de sidste rester",
      "Jeg kender din wi-fi-kode udenad",
    ],
  },
  {
    year: 7,
    price: 1900,
    name: "Næsten familie",
    emoji: "🏡",
    tagline: "Din mor spørger efter mig, når jeg ikke er med",
    perks: [
      "Uopfordret rådgivning om dit boliglån, din pension og dit tag",
      "Fast plads ved juleaftensbordet (jeg tager selv risalamanden med)",
      "Jeg kalder dine forældre ved fornavn",
    ],
  },
  {
    year: 8,
    price: 900,
    name: "Inventaret",
    emoji: "🛋️",
    tagline: "Jeg følger med huset, hvis du sælger det",
    perks: [
      "Egen nøgle (og jeg bruger den)",
      "Jeg sover på sofaen uden at spørge",
      "Jeg ved, hvor saksen ligger. Det gør du ikke.",
    ],
  },
  {
    year: 9,
    price: 0,
    name: "Nulpunktet",
    emoji: "🫶",
    tagline: "Venskabet er gratis. Det har det egentlig altid været.",
    perks: [
      "Tavshed, der ikke er akavet",
      "Aflysning i sidste øjeblik uden dårlig samvittighed",
      "Vi ses ikke i et halvt år og fortsætter, hvor vi slap",
    ],
  },
  {
    year: 10,
    price: -500,
    name: "Det rentable venskab",
    emoji: "📈",
    tagline: "Nu betaler jeg dig. Hver måned. Resten af livet.",
    perks: [
      "Jeg overfører 5 kr. til dig hver måned",
      "Tale til din 60-års fødselsdag (med de pinlige historier)",
      "Reserveret værelse ved siden af dit på plejehjemmet",
      "Jeg bærer kisten – eller du bærer min. Vi skiftes.",
    ],
  },
];

export const LAST_TIER = TIERS[TIERS.length - 1];

/** Hele måneder fra start til nu (0 i den første måned) */
export function monthsBetween(start: Date, now: Date): number {
  let m = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) m -= 1;
  return Math.max(0, m);
}

/** Trinnet for den N'te måned af venskabet (0-baseret) */
export function tierForMonth(month: number): SubscriptionTier {
  return TIERS[Math.min(Math.floor(month / 12), TIERS.length - 1)];
}

export function tierFor(friendsSince: Date, now = new Date()): SubscriptionTier {
  return tierForMonth(monthsBetween(friendsSince, now));
}

/** Samlet betalt (netto) efter et antal måneder */
export function totalAfter(months: number): number {
  let sum = 0;
  for (let m = 0; m < months; m++) sum += tierForMonth(m).price;
  return sum;
}

/** Måneden hvor det samlede regnskab går i nul – dvs. hvornår venskabet har tjent sig selv hjem */
export function breakEvenMonth(): number {
  const paidBeforeRefund = TIERS.filter((t) => t.price > 0).reduce((s, t) => s + t.price * 12, 0);
  const firstRefundMonth = (LAST_TIER.year - 1) * 12;
  return firstRefundMonth + Math.ceil(paidBeforeRefund / -LAST_TIER.price);
}

/** Dato for næste prisfald (næste venskabsdag), eller null når prisen ikke falder mere */
export function nextPriceDrop(friendsSince: Date, now = new Date()): Date | null {
  const months = monthsBetween(friendsSince, now);
  const year = Math.floor(months / 12) + 1;
  if (year >= LAST_TIER.year) return null;
  const d = new Date(friendsSince);
  d.setFullYear(friendsSince.getFullYear() + year);
  return d;
}

/** "79 kr.", "0 kr." eller "−5 kr." – med rigtigt minustegn */
export function formatMonthly(oere: number): string {
  const kr = Math.abs(oere) / 100;
  return `${oere < 0 ? "−" : ""}${kr.toLocaleString("da-DK", { maximumFractionDigits: 2 })} kr.`;
}

/** "79 år og 5 måneder" */
export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const years = y === 1 ? "1 år" : `${y} år`;
  if (!m) return years;
  return `${years} og ${m} ${m === 1 ? "måned" : "måneder"}`;
}

export const SUBSCRIPTION_METHODS = ["bank", "mobilepay", "paypal", "buymeacoffee"] as const;
export type SubscriptionMethod = (typeof SUBSCRIPTION_METHODS)[number];
