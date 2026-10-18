import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Kryptering af venne-arkivets følsomme tekstfelter (AES-256-GCM) med nøglen i ARCHIVE_ENCRYPTION_KEY.
// Krypterede værdier gemmes som "enc:v1:<iv>.<tag>.<data>" (base64url). Alt uden præfikset er gammel
// klartekst og læses, som det er, indtil `npm run db:krypter-arkiv` har krypteret det.
// Feltets navn ("customers.about_them") bruges som AAD, så en værdi ikke kan flyttes til et andet felt.

const PREFIX = "enc:v1:";

let cachedKey: Buffer | null | undefined;
let warned = false;

function key(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.ARCHIVE_ENCRYPTION_KEY?.trim();
  if (!raw) return (cachedKey = null);
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64url");
  if (buf.length !== 32) throw new Error("ARCHIVE_ENCRYPTION_KEY skal være 32 byte (base64url eller 64 hex-tegn)");
  return (cachedKey = buf);
}

export function hasEncryptionKey() {
  return key() !== null;
}

export function isEncrypted(value: string) {
  return value.startsWith(PREFIX);
}

/** Krypterer en værdi til databasen. Tom tekst gemmes tom. */
export function encryptField(plain: string, context: string): string {
  if (plain === "") return plain;
  const k = key();
  if (!k) {
    if (process.env.NODE_ENV === "production") throw new Error("ARCHIVE_ENCRYPTION_KEY mangler – venne-arkivet gemmes ikke i klartekst");
    if (!warned) console.warn("⚠️  ARCHIVE_ENCRYPTION_KEY er ikke sat – arkivfelter gemmes i klartekst (kun i udvikling)");
    warned = true;
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

/** Dekrypterer en værdi fra databasen. Klartekst (fra før krypteringen) returneres uændret. */
export function decryptField(stored: string, context: string): string {
  if (!isEncrypted(stored)) return stored;
  const k = key();
  if (!k) throw new Error("ARCHIVE_ENCRYPTION_KEY mangler – krypterede arkivfelter kan ikke læses");
  const [iv, tag, data] = stored.slice(PREFIX.length).split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", k, iv);
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** De felter, der krypteres – bruges af skemaet og af migreringsscriptet */
export const ENCRYPTED_FIELDS = {
  customers: ["about_them", "together", "notes", "how_we_met"],
  interactions: ["body", "title"],
  year_notes: ["body"],
} as const;
