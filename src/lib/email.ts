import { formatAmount, formatKr } from "./money";
import { STATUS_INFO } from "./order-status";
import { SITE_URL } from "./site";
import type { OrderStatus } from "@/db/schema";

// E-mails sendes via Resend (resend.com). Uden RESEND_API_KEY springes de bare over,
// så butikken virker fint, indtil e-mail er sat op.

export function emailEnabled() {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

async function send(to: string, subject: string, html: string) {
  if (!emailEnabled()) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html }),
    });
    if (!res.ok) console.error("E-mail fejlede", res.status, await res.text());
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

type OrderForEmail = {
  orderNumber: string;
  accessToken: string;
  total: number;
  status: OrderStatus;
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

export async function sendOrderEmails(o: OrderForEmail, mobilepay: string, adminEmail?: string) {
  const link = `${SITE_URL}/ordre/${o.orderNumber}?k=${o.accessToken}`;
  if (o.customer.email) {
    await send(
      o.customer.email,
      `Tak for din bestilling ${o.orderNumber} 💛`,
      layout(
        `Tak, ${esc(o.customer.name.split(" ")[0])}! 🎉`,
        `<p>Din bestilling er modtaget. Betal med MobilePay sådan her:</p>
        <ol><li>Send til <b>${esc(mobilepay)}</b></li><li>Beløb: <b>${formatAmount(o.total)} kr.</b></li><li>Skriv <b>${o.orderNumber}</b> i beskeden</li></ol>
        ${itemsTable(o)}${button(link, "Se din ordre")}`,
      ),
    );
  }
  if (adminEmail) {
    await send(
      adminEmail,
      `Ny ordre ${o.orderNumber}: ${formatKr(o.total)}`,
      layout(
        `Ny ordre fra ${esc(o.customer.name)} 🛎️`,
        `<p>${o.customer.email ? esc(o.customer.email) : ""} ${o.customer.phone ? esc(o.customer.phone) : ""}</p>
        ${o.isGift ? `<p>🎁 Gave til <b>${esc(o.giftRecipient ?? "")}</b></p>` : ""}
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
