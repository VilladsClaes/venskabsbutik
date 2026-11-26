import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema as s } from "@/db";

const COOKIE = "vb_admin";
const MAX_AGE = 60 * 60 * 12; // 12 timer for en almindelig session
/** "Husk denne computer": en godkendt computer er logget ind i et år uden at spørge igen */
const DEVICE_COOKIE = "vb_device";
const DEVICE_MAX_AGE = 60 * 60 * 24 * 365;
/** Tælles op af "Glem alle computere", så alle tidligere godkendte computere mister adgangen */
const DEVICE_GEN_KEY = "admin_device_generation";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET mangler eller er for kort (mindst 32 tegn)");
  return new TextEncoder().encode(s);
}

/** Sammenligner adgangskoden i konstant tid */
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/* ---------- 2FA (TOTP, RFC 6238) ---------- */

const TOTP_STEP = 30;
const LAST_STEP_KEY = "admin_totp_last_step";

function totpSecret(): Buffer | null {
  const raw = process.env.ADMIN_TOTP_SECRET?.replace(/[\s=]/g, "").toUpperCase();
  if (!raw) return null;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of raw) {
    const v = alphabet.indexOf(ch);
    if (v < 0) throw new Error("ADMIN_TOTP_SECRET skal være base32 (A–Z og 2–7)");
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes = bits.match(/.{8}/g)?.map((b) => parseInt(b, 2)) ?? [];
  if (bytes.length < 10) throw new Error("ADMIN_TOTP_SECRET er for kort (mindst 16 tegn)");
  return Buffer.from(bytes);
}

/** 2FA er slået til, når ADMIN_TOTP_SECRET er sat */
export function totpEnabled() {
  return totpSecret() !== null;
}

function hotp(key: Buffer, counter: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", key).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/**
 * Tjekker en 6-cifret kode (±30 sek. for urforskydning). En kode kan kun bruges én gang:
 * det senest brugte tidstrin gemmes i settings, så en opsnappet kode ikke kan genbruges.
 */
async function checkTotp(input: string): Promise<boolean> {
  const key = totpSecret();
  if (!key) return true;
  const code = input.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  const now = Math.floor(Date.now() / 1000 / TOTP_STEP);
  const step = [now - 1, now, now + 1].find((c) => timingSafeEqual(Buffer.from(hotp(key, c)), Buffer.from(code)));
  if (step === undefined) return false;
  // Kun ét login pr. tidstrin – opdateringen lykkes kun, hvis trinnet er nyere end det sidst brugte
  const res = await db
    .insert(s.settings)
    .values({ key: LAST_STEP_KEY, value: String(step) })
    .onConflictDoUpdate({
      target: s.settings.key,
      set: { value: String(step) },
      setWhere: sql`cast(${s.settings.value} as integer) < ${step}`,
    })
    .returning({ key: s.settings.key });
  return res.length > 0;
}

/* ---------- Rate limiting ---------- */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_GLOBAL = 25; // bremser også gæt fordelt på mange IP-adresser

async function clientIpHash() {
  const h = await headers();
  // Vercel sætter selv x-real-ip / x-forwarded-for, så klienten ikke kan forfalske dem
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "ukendt";
  return createHash("sha256").update(`login:${ip}`).digest("base64url");
}

/** Antal minutter, til der må forsøges igen – 0 = fri bane */
async function lockedFor(ipHash: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [mine, all] = await Promise.all([
    db.select({ n: sql<number>`count(*)`, first: sql<number>`min(${s.loginAttempts.createdAt})` }).from(s.loginAttempts)
      .where(and(eq(s.loginAttempts.ipHash, ipHash), gt(s.loginAttempts.createdAt, since))),
    db.select({ n: sql<number>`count(*)`, first: sql<number>`min(${s.loginAttempts.createdAt})` }).from(s.loginAttempts)
      .where(gt(s.loginAttempts.createdAt, since)),
  ]);
  const blocked = mine[0].n >= MAX_PER_IP ? mine[0] : all[0].n >= MAX_GLOBAL ? all[0] : null;
  if (!blocked) return 0;
  return Math.max(1, Math.ceil((blocked.first * 1000 + WINDOW_MS - Date.now()) / 60_000));
}

export type LoginResult = { ok: true } | { ok: false; error: "forkert" | "laast"; minutes?: number };

/** Hele login-tjekket: rate limit, adgangskode og evt. 2FA-kode */
export async function attemptLogin(password: string, code: string, remember = false): Promise<LoginResult> {
  const ipHash = await clientIpHash();
  const minutes = await lockedFor(ipHash);
  if (minutes) return { ok: false, error: "laast", minutes };

  // Koden tjekkes kun efter en rigtig adgangskode, så gæt ikke brænder engangskoder af
  const ok = checkPassword(password) && (await checkTotp(code));
  if (!ok) {
    await db.insert(s.loginAttempts).values({ ipHash });
    // Ryd gamle forsøg op en gang imellem
    if (Math.random() < 0.1) await db.delete(s.loginAttempts).where(lt(s.loginAttempts.createdAt, new Date(Date.now() - 86_400_000)));
    return { ok: false, error: "forkert" };
  }
  await db.delete(s.loginAttempts).where(eq(s.loginAttempts.ipHash, ipHash));
  await createSession();
  if (remember) await rememberDevice();
  return { ok: true };
}

/* ---------- Session ---------- */

async function createSession() {
  const token = await new SignJWT({ role: "admin", mfa: totpEnabled() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, cookieOpts(MAX_AGE));
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

async function deviceGeneration(): Promise<number> {
  const [row] = await db.select({ value: s.settings.value }).from(s.settings).where(eq(s.settings.key, DEVICE_GEN_KEY));
  return Number(row?.value ?? 0) || 0;
}

/** Godkender denne computer: den forbliver logget ind i et år */
async function rememberDevice() {
  const token = await new SignJWT({ role: "admin-device", mfa: totpEnabled(), gen: await deviceGeneration() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DEVICE_MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(DEVICE_COOKIE, token, cookieOpts(DEVICE_MAX_AGE));
}

/** Er denne computer godkendt? */
export async function isTrustedDevice(): Promise<boolean> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return (
      payload.role === "admin-device" &&
      (!totpEnabled() || payload.mfa === true) &&
      payload.gen === (await deviceGeneration())
    );
  } catch {
    return false;
  }
}

/** Log ud på denne computer (og glem den) */
export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(DEVICE_COOKIE);
}

/** Alle godkendte computere – også denne – skal logge ind igen */
export async function forgetAllDevices() {
  const next = String((await deviceGeneration()) + 1);
  await db
    .insert(s.settings)
    .values({ key: DEVICE_GEN_KEY, value: next })
    .onConflictDoUpdate({ target: s.settings.key, set: { value: next } });
  await destroySession();
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
      // Slås 2FA til, gælder sessioner fra før ikke længere
      if (payload.role === "admin" && (!totpEnabled() || payload.mfa === true)) return true;
    } catch {
      // udløbet eller ugyldig – prøv den godkendte computer
    }
  }
  return isTrustedDevice();
}

/** Bruges i alle admin-sider og -handlinger */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
