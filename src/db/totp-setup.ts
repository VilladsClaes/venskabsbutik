import { randomBytes } from "node:crypto";
import QRCode from "qrcode";

// Laver en ny hemmelighed til admin-2FA og viser en QR-kode, der scannes med en godkendelsesapp
// (1Password, Google Authenticator, Authy …). Læg hemmeligheden i ADMIN_TOTP_SECRET.
//   npm run admin:totp

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const bits = [...randomBytes(20)].map((b) => b.toString(2).padStart(8, "0")).join("");
const secret = bits.match(/.{5}/g)!.map((b) => alphabet[parseInt(b, 2)]).join("");

const uri = `otpauth://totp/${encodeURIComponent("Venskabsbutikken:admin")}?secret=${secret}&issuer=Venskabsbutikken&algorithm=SHA1&digits=6&period=30`;

QRCode.toString(uri, { type: "terminal", small: true }).then((qr) => {
  console.log(qr);
  console.log(`ADMIN_TOTP_SECRET=${secret}\n`);
  console.log("Scan koden, og læg linjen ovenfor i .env.local og i Vercel. Vis den ikke til andre.");
});
