import { button, esc, layout, send } from "./email";
import { effectiveDeadline, eventPageUrl, firstName, formatEventTime, formatMoment } from "./event-text";
import { formatKr } from "./money";
import { SITE_URL } from "./site";

// E-mails i tilmeldingsflowet: tilmeldt → (gennemføres | aflyst) → evt. betalingspåmindelse

type Ev = {
  slug: string;
  title: string;
  emoji: string;
  location: string;
  practicalInfo: string;
  startsAt: Date;
  endsAt: Date;
  price: number;
  minParticipants: number;
  signupDeadline: Date | null;
};

const manageUrl = (token: string) => `${SITE_URL}/tilmelding/${token}`;
const orderUrl = (o: { orderNumber: string; accessToken: string }) => `${SITE_URL}/ordre/${o.orderNumber}?k=${o.accessToken}`;

function eventBox(e: Ev) {
  return `<p style="background:#fff8e7;border:2px solid #2b2d42;border-radius:14px;padding:12px 14px">
    <b>${esc(`${e.emoji} ${e.title}`)}</b><br>🕒 ${esc(formatEventTime(e.startsAt, e.endsAt))}${e.location ? `<br>📍 ${esc(e.location)}` : ""}<br>💰 ${e.price ? `${formatKr(e.price)} pr. person` : "Gratis"}</p>`;
}

const practical = (e: Ev) =>
  e.practicalInfo ? `<p><b>Praktisk</b></p><p style="white-space:pre-line">${esc(e.practicalInfo)}</p>` : "";

/** Lige efter tilmelding, mens eventet samler tilmeldte */
export async function sendSignedUp(input: {
  to: string;
  name: string;
  bookerName: string | null;
  event: Ev;
  seatsTaken: number;
  token: string;
  isBooker: boolean;
}) {
  const e = input.event;
  const missing = Math.max(0, e.minParticipants - input.seatsTaken);
  const intro = input.bookerName
    ? `<p>${esc(firstName(input.bookerName))} har meldt dig til – hvor hyggeligt! 🎉</p>`
    : `<p>Du er på listen! 🎉</p>`;
  await send(
    input.to,
    `Du er tilmeldt: ${e.emoji} ${e.title}`,
    layout(
      `Hej ${esc(firstName(input.name))}!`,
      `${intro}${eventBox(e)}
      <p>Vi er <b>${input.seatsTaken}</b> tilmeldt og skal være mindst <b>${e.minParticipants}</b>${missing ? ` – der mangler ${missing}` : ""}.
      Når vi er nok, får du en kalenderinvitation${e.price ? " og besked om betaling" : ""}. Du betaler ikke noget, før det er sikkert, at det bliver til noget.</p>
      <p>Fristen er ${esc(formatMoment(effectiveDeadline(e)))}. Bliver vi ikke nok, aflyser jeg og giver besked.</p>
      <p>💡 Kender du nogen, der skal med? Send dem linket: <a href="${eventPageUrl(e.slug)}">${esc(eventPageUrl(e.slug).replace(/^https?:\/\//, ""))}</a></p>
      ${input.isBooker ? `<p style="font-size:13px"><a href="${manageUrl(input.token)}">Se eller afmeld din tilmelding</a></p>` : ""}`,
    ),
  );
}

/** Eventet gennemføres: til hver deltager. Betaleren får betalingslinket. */
export async function sendEventGo(input: {
  to: string;
  name: string;
  event: Ev;
  invitedByCalendar: boolean;
  ics?: string;
  /** Kun til den, der betaler for gruppen */
  payment?: { order: { orderNumber: string; accessToken: string }; total: number; seats: number };
  paidBy?: string;
  token: string;
}) {
  const e = input.event;
  const cal = input.invitedByCalendar
    ? "<p>📅 Du har fået en kalenderinvitation fra Villads – sig ja til den, så ligger eventet i din kalender.</p>"
    : "<p>📅 Kalenderfilen er vedhæftet – åbn den for at lægge eventet i din kalender.</p>";
  const pay = input.payment
    ? input.payment.total > 0
      ? `<p><b>Betaling:</b> ${formatKr(input.payment.total)}${input.payment.seats > 1 ? ` for ${input.payment.seats} personer` : ""}. Betal inden for 3 dage – du vælger selv betalingsmåde.</p>${button(orderUrl(input.payment.order), `Betal ${formatKr(input.payment.total)}`)}`
      : ""
    : input.paidBy && e.price
      ? `<p>${esc(firstName(input.paidBy))} betaler for dig.</p>`
      : "";
  await send(
    input.to,
    `Det bliver til noget! ${e.emoji} ${e.title} ✅`,
    layout(
      `Vi kører, ${esc(firstName(input.name))}! 🎉`,
      `<p>Der er nok tilmeldte, så det er nu sikkert, at vi ses.</p>${eventBox(e)}${pay}${cal}${practical(e)}
      ${button(eventPageUrl(e.slug), "Se eventet og hvem der kommer")}
      <p style="font-size:13px"><a href="${manageUrl(input.token)}">Din tilmelding</a></p>`,
    ),
    input.ics ? [{ filename: "event.ics", content: input.ics, contentType: "text/calendar; charset=utf-8; method=REQUEST" }] : undefined,
  );
}

export async function sendEventCancelled(input: { to: string; name: string; event: Ev; reason: string; paid: boolean }) {
  const e = input.event;
  await send(
    input.to,
    `Aflyst: ${e.emoji} ${e.title}`,
    layout(
      `Øv, ${esc(firstName(input.name))} 😢`,
      `<p>${esc(input.reason)}</p>${eventBox(e)}
      <p>${input.paid ? "Du har betalt – jeg sender pengene retur hurtigst muligt." : "Du har ikke betalt noget, så der er intet at gøre."} Tak fordi du ville være med – vi prøver igen en anden gang 💛</p>`,
    ),
  );
}

export async function sendPaymentReminder(input: {
  to: string;
  name: string;
  event: Ev;
  order: { orderNumber: string; accessToken: string };
  total: number;
}) {
  const e = input.event;
  await send(
    input.to,
    `Påmindelse: betaling for ${e.emoji} ${e.title}`,
    layout(
      `Hej ${esc(firstName(input.name))} 👋`,
      `<p>Vi glæder os til at se dig! Jeg mangler bare din betaling på ${formatKr(input.total)}.</p>${eventBox(e)}${button(orderUrl(input.order), `Betal ${formatKr(input.total)}`)}
      <p style="font-size:13px">Har du allerede betalt? Så går beskederne bare over kryds – se bort fra denne.</p>`,
    ),
  );
}

export async function sendWithdrawn(input: { to: string; name: string; event: Ev }) {
  const e = input.event;
  await send(
    input.to,
    `Du er afmeldt: ${e.emoji} ${e.title}`,
    layout(`Du er afmeldt`, `<p>Hej ${esc(firstName(input.name))} – du er nu afmeldt.</p>${eventBox(e)}<p>Du er velkommen tilbage, hvis du ombestemmer dig 💛</p>${button(eventPageUrl(e.slug), "Se eventet")}`),
  );
}

/** Ny dato på en aktivitet, nogen har sagt de er interesserede i */
export async function sendNewDate(input: { to: string; name: string; event: Ev }) {
  const e = input.event;
  await send(
    input.to,
    `Ny dato: ${e.emoji} ${e.title}`,
    layout(
      `Hej ${esc(firstName(input.name))}!`,
      `<p>Du sagde, du var interesseret i ${esc(e.title)} – nu er der en dato:</p>${eventBox(e)}
      <p>Vi skal være mindst ${e.minParticipants}. Du betaler først, når det er sikkert, at det bliver til noget.</p>${button(eventPageUrl(e.slug), "Meld dig til")}`,
    ),
  );
}

/** Kort besked til Villads */
export async function sendAdminNotice(to: string | undefined, subject: string, html: string, eventId?: number) {
  if (!to) return;
  await send(to, subject, layout(esc(subject), `${html}${eventId ? button(`${SITE_URL}/admin/kalender/${eventId}`, "Åbn i admin") : ""}`));
}
