import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Kalendernøglerne giver adgang til Villads' kalender, så de gemmes krypteret i databasen.
// Nøglen udledes af SESSION_SECRET – skiftes den, skal kalenderne tilsluttes igen.

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET mangler eller er for kort (mindst 32 tegn)");
  return createHash("sha256").update(`kalender:${s}`).digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(packed: string): string {
  const [iv, tag, data] = packed.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
