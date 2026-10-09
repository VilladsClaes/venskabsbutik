import type { PaymentMethod } from "@/db/schema";

/** Stripe kræver et mindstebeløb pr. betaling */
export const STRIPE_MIN_OERE = 250;

export const METHOD_INFO: Record<PaymentMethod, { label: string; emoji: string; text: string; color: string }> = {
  mobilepay: { label: "Vipps MobilePay", emoji: "💙", text: "Overfør med ordrenummeret i beskeden", color: "#5a78ff" },
  stripe: { label: "Kort, Apple Pay og Google Pay", emoji: "💳", text: "Betal sikkert med det samme via Stripe", color: "#635bff" },
  paypal: { label: "PayPal", emoji: "🅿️", text: "Betal med din PayPal-konto", color: "#0070ba" },
  bank: { label: "Bankoverførsel", emoji: "🏦", text: "Overfør fra din netbank", color: "#2ec4b6" },
  crypto: { label: "Krypto", emoji: "🪙", text: "Bitcoin og venner – omregnet til dagskurs", color: "#f7931a" },
  venskab: { label: "Betal med venskab", emoji: "💛", text: "Byttehandel: giv mig en tjeneste tilbage", color: "#ff70a6" },
};

export const METHOD_ORDER: PaymentMethod[] = ["mobilepay", "stripe", "paypal", "bank", "crypto", "venskab"];

export type Wallet = { coin: string; network: string; address: string };

/** "BTC | Bitcoin | bc1q..." – én tegnebog pr. linje */
export function parseWallets(text: string | undefined): Wallet[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((p) => p.length >= 3 && p[0] && p[2])
    .map(([coin, network, address]) => ({ coin: coin.toUpperCase(), network, address }));
}

export type PaymentConfig = {
  enabled: PaymentMethod[];
  mobilepayNumber?: string;
  bank?: { reg: string; account: string; name: string };
  /** PayPal: e-mail giver en "Køb nu"-side med beløb og ordrenummer; ellers et paypal.me/.biz-link */
  paypal?: { email?: string; profileUrl?: string; profileHasAmount: boolean };
  wallets: Wallet[];
  stripe: boolean;
};

export function getPaymentConfig(settings: Record<string, string>): PaymentConfig {
  const wanted = (settings.paymentMethods ?? METHOD_ORDER.join(","))
    .split(",")
    .map((m) => m.trim()) as PaymentMethod[];
  const wallets = parseWallets(settings.cryptoWallets);
  const bank =
    settings.bankReg && settings.bankAccount
      ? { reg: settings.bankReg, account: settings.bankAccount, name: settings.bankName ?? "" }
      : undefined;
  const cfg: PaymentConfig = {
    enabled: [],
    mobilepayNumber: settings.mobilepayNumber || undefined,
    bank,
    paypal: parsePaypal(settings.paypalEmail, settings.paypalMe),
    wallets,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  };
  // En metode vises kun, hvis den er slået til OG sat op
  const ready: Record<PaymentMethod, boolean> = {
    mobilepay: !!cfg.mobilepayNumber,
    bank: !!cfg.bank,
    paypal: !!cfg.paypal,
    stripe: cfg.stripe,
    crypto: wallets.length > 0,
    venskab: true,
  };
  cfg.enabled = METHOD_ORDER.filter((m) => wanted.includes(m) && ready[m]);
  return cfg;
}

/** Læser PayPal-opsætningen: e-mail og/eller et paypal.me- eller paypal.biz-link (eller bare brugernavnet) */
function parsePaypal(email: string | undefined, profile: string | undefined): PaymentConfig["paypal"] {
  const mail = email?.trim();
  const raw = profile?.trim() ?? "";
  let profileUrl: string | undefined;
  let profileHasAmount = false;
  const biz = raw.match(/paypal\.(?:biz|com\/biz\/profile)\/([^/?#\s]+)/i);
  const me = raw.match(/paypal\.me\/([^/?#\s]+)/i);
  if (biz) profileUrl = `https://www.paypal.biz/${biz[1]}`;
  else if (me || /^[\w.-]+$/.test(raw)) {
    profileUrl = `https://www.paypal.me/${me ? me[1] : raw}`;
    profileHasAmount = true;
  }
  if (!mail && !profileUrl) return undefined;
  return { email: mail && /.+@.+\..+/.test(mail) ? mail : undefined, profileUrl, profileHasAmount };
}

/**
 * Link til PayPal-betaling. Med e-mail bruges PayPals "Køb nu"-side, hvor beløb og ordrenummer
 * er udfyldt på forhånd (virker med erhvervskonti). Ellers paypal.me (med beløb) eller paypal.biz.
 */
export function paypalLink(
  cfg: NonNullable<PaymentConfig["paypal"]>,
  order: { orderNumber: string; total: number },
  returnUrl?: string,
): { url: string; amountFilled: boolean } {
  const amount = (order.total / 100).toFixed(2);
  if (cfg.email) {
    const p = new URLSearchParams({
      cmd: "_xclick",
      business: cfg.email,
      item_name: `Venskabsbutikken – ordre ${order.orderNumber}`,
      invoice: order.orderNumber,
      amount,
      currency_code: "DKK",
      no_shipping: "1",
      lc: "DK",
      ...(returnUrl ? { return: returnUrl, cancel_return: returnUrl } : {}),
    });
    return { url: `https://www.paypal.com/cgi-bin/webscr?${p}`, amountFilled: true };
  }
  if (cfg.profileHasAmount) return { url: `${cfg.profileUrl}/${amount}DKK`, amountFilled: true };
  return { url: cfg.profileUrl!, amountFilled: false };
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usd-coin",
  USDT: "tether",
  SOL: "solana",
  LTC: "litecoin",
  DOGE: "dogecoin",
  ADA: "cardano",
};
const DECIMALS: Record<string, number> = { BTC: 8, ETH: 6, USDC: 2, USDT: 2, SOL: 4, LTC: 6, DOGE: 2, ADA: 2 };

/** Henter dagskursen i kroner (CoinGecko, gratis og uden nøgle) */
export async function cryptoRateDkk(coin: string): Promise<number | null> {
  const id = COINGECKO_IDS[coin.toUpperCase()];
  if (!id) return null;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=dkk`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, { dkk?: number }>;
    return data[id]?.dkk ?? null;
  } catch {
    return null;
  }
}

export function cryptoAmount(coin: string, oere: number, rateDkk: number) {
  const d = DECIMALS[coin.toUpperCase()] ?? 6;
  // Rund op, så beløbet altid dækker
  const raw = oere / 100 / rateDkk;
  const factor = 10 ** d;
  return (Math.ceil(raw * factor) / factor).toFixed(d);
}

/** Betalings-URI til QR-koden, så wallet-apps kan udfylde beløbet */
export function cryptoUri(w: { coin: string; address: string }, amount: string) {
  if (w.coin === "BTC") return `bitcoin:${w.address}?amount=${amount}`;
  if (w.coin === "LTC") return `litecoin:${w.address}?amount=${amount}`;
  return w.address;
}
