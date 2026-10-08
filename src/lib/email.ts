import nodemailer, { type Transporter } from "nodemailer";
import type { OrderStatus, PaymentDetails, PaymentMethod } from "@/db/schema";
import { formatAmount, formatKr } from "./money";
import { STATUS_INFO } from "./order-status";
import { METHOD_INFO, paypalLink, type PaymentConfig } from "./payments";
import { SITE_URL } from "./site";

// E-mails sendes gennem din egen postkasse hos Simply.com (SMTP).
// Uden SMTP_USER og SMTP_PASS springes de bare over, så butikken virker fint uden.

export function emailEnabled() {
  return !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
}

let transport: Transporter | null = null;
function getTransport() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.simply.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

async function send(to: string, subject: string, html: string) {
  if (!emailEnabled()) return;
  try {
    await getTransport().sendMail({
      from: process.env.EMAIL_FROM ?? `Venskabsbutikken <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("E-mail fejlede", e);
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html lang="da"><body style="margin:0;background:#fff8e7;font-family:Arial,Helvetica,sans-serif;color:#2b2d42">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#ffd23f;border:3px solid #2b2d42;border-radius:20px;padding:16px 20px;font-size:22px;font-weight:bold">🌞 Venskabsbutikken</div>
    <div style="background:#fff;border:3px solid #2b2d42;border-radius:20px;padding:20px;margin-top:16px">
      <h1 style="font-size:24px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:12px;color:#5c5f7a;text-align:center;margin-top:16px">Venskabsbutikken · ${esc(SITE_URL.replace(/^https?:\/\//, ""))}</p>
  </div></body></html>`;
}

export type OrderForEmail = {
  orderNumber: string;
  accessToken: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails | null;
  isGift: boolean;
  giftRecipient: string | null;
  customer: { name: string; email: string | null; phone: string | null };
  items: { productName: string; variantName: string | null; quantity: number; lineTotal: number; isBonus: boolean }[];
};

function itemsTable(o: OrderForEmail) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.productName)}${i.variantName ? ` – ${esc(i.variantName)}` : ""}${i.quantity > 1 ? ` × ${i.quantity}` : ""}${i.isBonus ? " 🎁" : ""}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${i.isBonus ? "Gratis" : formatKr(i.lineTotal)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border-top:2px dashed #ccc;margin:12px 0">${rows}<tr><td style="padding-top:8px;border-top:3px solid #2b2d42;font-weight:bold">I alt</td><td style="padding-top:8px;border-top:3px solid #2b2d42;text-align:right;font-weight:bold">${formatKr(o.total)}</td></tr></table>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#ff6b6b;color:#fff;border:3px solid #2b2d42;border-radius:999px;padding:10px 20px;text-decoration:none;font-weight:bold">${label}</a></p>`;

/** Betalingsvejledning til e-mailen – samme indhold som på ordresiden */
function paymentHtml(o: OrderForEmail, cfg: PaymentConfig) {
  const amount = `${formatAmount(o.total)} kr.`;
  const ref = `<b>${o.orderNumber}</b>`;
  switch (o.paymentMethod) {
    case "mobilepay":
      return `<p>Betal med Vipps MobilePay:</p><ol><li>Send til <b>${esc(cfg.mobilepayNumber ?? "")}</b></li><li>Beløb: <b>${amount}</b></li><li>Skriv ${ref} i beskeden</li></ol>`;
    case "bank":
      return `<p>Betal med bankoverførsel:</p><ol><li>Reg.nr. <b>${esc(cfg.bank?.reg ?? "")}</b> · Konto <b>${esc(cfg.bank?.account ?? "")}</b></li><li>Beløb: <b>${amount}</b></li><li>Tekst til modtager: ${ref}</li></ol>`;
    case "paypal":
      return cfg.paypalMe
        ? `<p>Betal med PayPal – husk ${ref} i beskeden:</p>${button(paypalLink(cfg.paypalMe, o.total), `Betal ${amount} med PayPal`)}`
        : "";
    case "stripe":
      return `<p>Du kan betale med kort på din ordreside, hvis du ikke allerede har gjort det.</p>`;
    case "crypto": {
      const c = o.paymentDetails?.crypto;
      return c
        ? `<p>Betal med ${esc(c.coin)} (${esc(c.network)}):</p><ol><li>Send <b>${esc(c.amount)} ${esc(c.coin)}</b></li><li>til <code style="word-break:break-all">${esc(c.address)}</code></li></ol><p style="font-size:13px;color:#5c5f7a">Kursen gælder i 30 minutter. QR-kode findes på ordresiden.</p>`
        : "";
    }
    case "venskab":
      return `<p>Du betaler med venskab 💛. Villads kigger på dit tilbud og vender tilbage:</p><blockquote style="border-left:4px solid #ff70a6;padding-left:12px">${esc(o.paymentDetails?.barterOffer ?? "")}</blockquote>`;
  }
}

export async function sendOrderEmails(o: OrderForEmail, cfg: PaymentConfig, adminEmail?: string) {
  const link = `${SITE_URL}/ordre/${o.orderNumber}?k=${o.accessToken}`;
  const method = METHOD_INFO[o.paymentMethod];
  if (o.customer.email) {
    await send(
      o.customer.email,
      `Tak for din bestilling ${o.orderNumber} 💛`,
      layout(
        `Tak, ${esc(o.customer.name.split(" ")[0])}! 🎉`,
        `<p>Din bestilling er modtaget.</p>${paymentHtml(o, cfg)}${itemsTable(o)}${button(link, "Se din ordre")}`,
      ),
    );
  }
  if (adminEmail) {
    await send(
      adminEmail,
      `Ny ordre ${o.orderNumber}: ${formatKr(o.total)} (${method.label})`,
      layout(
        `Ny ordre fra ${esc(o.customer.name)} 🛎️`,
        `<p>${method.emoji} ${esc(method.label)}</p>
        <p>${o.customer.email ? esc(o.customer.email) : ""} ${o.customer.phone ? esc(o.customer.phone) : ""}</p>
        ${o.isGift ? `<p>🎁 Gave til <b>${esc(o.giftRecipient ?? "")}</b></p>` : ""}
        ${o.paymentMethod === "venskab" ? `<p>Byttetilbud: “${esc(o.paymentDetails?.barterOffer ?? "")}”</p>` : ""}
        ${itemsTable(o)}${button(`${SITE_URL}/admin`, "Åbn admin")}`,
      ),
    );
  }
}

export async function sendStatusEmail(o: OrderForEmail) {
  if (!o.customer.email || o.status === "afventer_betaling") return;
  const s = STATUS_INFO[o.status];
  const link = `${SITE_URL}/ordre/${o.orderNumber}?k=${o.accessToken}`;
  await send(
    o.customer.email,
    `${s.emoji} Ordre ${o.orderNumber}: ${s.label}`,
    layout(`${s.emoji} ${s.label}`, `<p>${esc(s.customerText)}</p>${itemsTable(o)}${button(link, "Se din ordre")}`),
  );
}
