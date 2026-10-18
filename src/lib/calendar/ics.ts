import { SITE_URL } from "../site";

const HOST = new URL(SITE_URL).hostname;

// .ics-filer virker i alle kalendere (Google, Outlook, Apple). Bruges når kunden selv
// vil tilføje eventet, og som reserve hvis Villads' kalender ikke er tilsluttet.

export type IcsEvent = {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  url: string;
  attendee?: { email: string; name: string };
};

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Linjer må højst være 75 bytes ifølge standarden – ombryd uden at dele et tegn (fx en emoji) */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch);
    if (bytes + size > 74) {
      out.push(cur);
      cur = " ";
      bytes = 1;
    }
    cur += ch;
    bytes += size;
  }
  out.push(cur);
  return out.join("\r\n");
}

function vevent(ev: IcsEvent, organizer: string) {
  return [
    "BEGIN:VEVENT",
    `UID:${ev.uid}@${HOST}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(ev.start)}`,
    `DTEND:${stamp(ev.end)}`,
    `SUMMARY:${escape(ev.title)}`,
    `DESCRIPTION:${escape(`${ev.description}\n\n${ev.url}`.trim())}`,
    `LOCATION:${escape(ev.location)}`,
    `URL:${ev.url}`,
    `ORGANIZER;CN=Villads Claes:mailto:${organizer}`,
    ...(ev.attendee
      ? [`ATTENDEE;CN=${escape(ev.attendee.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${ev.attendee.email}`]
      : []),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

function calendar(events: IcsEvent[], method: "PUBLISH" | "REQUEST", extra: string[] = []) {
  const organizer = process.env.SMTP_USER ?? `kalender@${HOST}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Venskabsbutikken//Kalender//DA",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    ...extra,
    ...events.flatMap((ev) => vevent(ev, organizer)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function buildIcs(ev: IcsEvent, method: "PUBLISH" | "REQUEST" = "PUBLISH") {
  return calendar([ev], method);
}

/** Abonnementskalender med alle events – fx til Outlook eller Apple Kalender */
export function buildIcsFeed(events: IcsEvent[]) {
  return calendar(events, "PUBLISH", [
    "X-WR-CALNAME:Villads' events",
    "X-WR-TIMEZONE:Europe/Copenhagen",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ]);
}

/** Link der åbner "Opret begivenhed" i Google Kalender med det hele udfyldt */
export function googleAddLink(ev: Omit<IcsEvent, "uid">) {
  return (
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      text: ev.title,
      dates: `${stamp(ev.start)}/${stamp(ev.end)}`,
      details: `${ev.description}\n\n${ev.url}`.trim(),
      location: ev.location,
    })
  );
}

/** Link der åbner en ny begivenhed i Outlook på nettet */
export function outlookAddLink(ev: Omit<IcsEvent, "uid">) {
  return (
    "https://outlook.live.com/calendar/0/action/compose?" +
    new URLSearchParams({
      rru: "addevent",
      subject: ev.title,
      startdt: ev.start.toISOString(),
      enddt: ev.end.toISOString(),
      body: `${ev.description}\n\n${ev.url}`.trim(),
      location: ev.location,
    })
  );
}

export const eventUrl = (slug: string) => `${SITE_URL}/kalender/${slug}`;
