import { decodeJwt } from "jose";
import type { CalendarProvider } from "@/db/schema";

// Google Calendar og Microsoft Outlook (Graph) taler vi med direkte over HTTP –
// det er få kald, så der er ingen grund til at trække deres store SDK'er ind.

export type Interval = { start: Date; end: Date };

export type CalendarEventData = {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  url: string;
};

export type Attendee = { email: string; name: string };

/** Deltagere der skal på eller af posten. Andre gæster, Villads selv har inviteret, bliver stående. */
export type AttendeeChanges = { add: Attendee[]; remove: string[] };

export type TokenSet = { accessToken: string; expiresIn: number; refreshToken?: string; email?: string };

export type ProviderApi = {
  label: string;
  emoji: string;
  configured: () => boolean;
  authUrl: (state: string, redirectUri: string) => string;
  exchangeCode: (code: string, redirectUri: string) => Promise<TokenSet>;
  refresh: (refreshToken: string) => Promise<TokenSet>;
  busy: (token: string, calendarId: string, from: Date, to: Date) => Promise<Interval[]>;
  /** Opretter eller opdaterer posten og returnerer dens id (kan være nyt, hvis den gamle var slettet) */
  upsertEvent: (
    token: string,
    calendarId: string,
    externalId: string | undefined,
    ev: CalendarEventData,
    attendees?: AttendeeChanges,
  ) => Promise<string>;
  deleteEvent: (token: string, calendarId: string, externalId: string) => Promise<void>;
};

export class CalendarApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CalendarApiError(res.status, `${res.status} ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const json = (body: unknown) => ({ body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const form = (body: Record<string, string>) => ({
  body: new URLSearchParams(body).toString(),
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

type OAuthTokenResponse = { access_token: string; expires_in: number; refresh_token?: string; id_token?: string };

function emailFromIdToken(idToken?: string): string | undefined {
  if (!idToken) return undefined;
  const claims = decodeJwt(idToken) as { email?: string; preferred_username?: string };
  return claims.email ?? claims.preferred_username;
}

const toTokenSet = (t: OAuthTokenResponse): TokenSet => ({
  accessToken: t.access_token,
  expiresIn: t.expires_in,
  refreshToken: t.refresh_token,
  email: emailFromIdToken(t.id_token),
});

function mergeAttendees<T>(
  existing: T[],
  emailOf: (a: T) => string,
  changes: AttendeeChanges,
  make: (a: Attendee) => T,
): T[] {
  const remove = new Set(changes.remove.map((e) => e.toLowerCase()));
  const kept = existing.filter((a) => !remove.has(emailOf(a).toLowerCase()));
  const have = new Set(kept.map((a) => emailOf(a).toLowerCase()));
  return [...kept, ...changes.add.filter((a) => !have.has(a.email.toLowerCase())).map(make)];
}

/* ---------- Google ---------- */

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

type GoogleAttendee = { email: string; displayName?: string; responseStatus?: string; organizer?: boolean; self?: boolean };

const google: ProviderApi = {
  label: "Google Kalender",
  emoji: "📆",
  configured: () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
  authUrl: (state, redirectUri) =>
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    }),
  exchangeCode: async (code, redirectUri) =>
    toTokenSet(
      await call<OAuthTokenResponse>("https://oauth2.googleapis.com/token", {
        method: "POST",
        ...form({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }),
    ),
  refresh: async (refreshToken) =>
    toTokenSet(
      await call<OAuthTokenResponse>("https://oauth2.googleapis.com/token", {
        method: "POST",
        ...form({
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
        }),
      }),
    ),
  busy: async (token, calendarId, from, to) => {
    const res = await call<{ calendars: Record<string, { busy?: { start: string; end: string }[] }> }>(
      `${GOOGLE_API}/freeBusy`,
      { method: "POST", token, ...json({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: calendarId }] }) },
    );
    const cal = res.calendars[calendarId] ?? Object.values(res.calendars)[0];
    return (cal?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  },
  upsertEvent: async (token, calendarId, externalId, ev, attendees) => {
    const base = `${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events`;
    const body: Record<string, unknown> = {
      summary: ev.title,
      description: `${ev.description}\n\n${ev.url}`.trim(),
      location: ev.location,
      start: { dateTime: ev.start.toISOString(), timeZone: "Europe/Copenhagen" },
      end: { dateTime: ev.end.toISOString(), timeZone: "Europe/Copenhagen" },
      source: { title: "Venskabsbutikken", url: ev.url },
      // Deltagerne kender ikke nødvendigvis hinanden – deres e-mails holdes skjult
      guestsCanSeeOtherGuests: false,
      guestsCanInviteOthers: false,
    };
    if (externalId) {
      try {
        if (attendees) {
          const current = await call<{ attendees?: GoogleAttendee[] }>(`${base}/${externalId}?fields=attendees`, { token });
          body.attendees = mergeAttendees(current.attendees ?? [], (a) => a.email, attendees, (a) => ({
            email: a.email,
            displayName: a.name,
          }));
        }
        const res = await call<{ id: string }>(`${base}/${externalId}?sendUpdates=all`, { method: "PATCH", token, ...json(body) });
        return res.id;
      } catch (e) {
        // Slettet i kalenderen? Så laver vi en ny post
        if (!(e instanceof CalendarApiError) || (e.status !== 404 && e.status !== 410)) throw e;
      }
    }
    if (attendees) body.attendees = attendees.add.map((a) => ({ email: a.email, displayName: a.name }));
    const res = await call<{ id: string }>(`${base}?sendUpdates=all`, { method: "POST", token, ...json(body) });
    return res.id;
  },
  deleteEvent: async (token, calendarId, externalId) => {
    try {
      await call(`${GOOGLE_API}/calendars/${encodeURIComponent(calendarId)}/events/${externalId}?sendUpdates=all`, {
        method: "DELETE",
        token,
      });
    } catch (e) {
      if (!(e instanceof CalendarApiError) || (e.status !== 404 && e.status !== 410)) throw e;
    }
  },
};

/* ---------- Outlook (Microsoft Graph) ---------- */

const GRAPH = "https://graph.microsoft.com/v1.0";
const MS_SCOPES = ["openid", "email", "offline_access", "User.Read", "Calendars.ReadWrite"];
// "common" tillader både private Outlook.com/Hotmail-konti og arbejds-/skolekonti
const msTenant = () => process.env.MICROSOFT_TENANT || "common";
const msBase = (calendarId: string) => (calendarId && calendarId !== "primary" ? `${GRAPH}/me/calendars/${calendarId}` : `${GRAPH}/me`);
/** Graph vil have tider uden "Z", med tidszonen ved siden af */
const graphTime = (d: Date) => ({ dateTime: d.toISOString().replace(/Z$/, ""), timeZone: "UTC" });

type GraphAttendee = { emailAddress: { address: string; name?: string }; type: string };

async function msToken(params: Record<string, string>) {
  return toTokenSet(
    await call<OAuthTokenResponse>(`https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/token`, {
      method: "POST",
      ...form({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        scope: MS_SCOPES.join(" "),
        ...params,
      }),
    }),
  );
}

const outlook: ProviderApi = {
  label: "Outlook-kalender",
  emoji: "📅",
  configured: () => !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET,
  authUrl: (state, redirectUri) =>
    `https://login.microsoftonline.com/${msTenant()}/oauth2/v2.0/authorize?` +
    new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      response_mode: "query",
      scope: MS_SCOPES.join(" "),
      prompt: "select_account",
      state,
    }),
  exchangeCode: (code, redirectUri) => msToken({ code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  refresh: (refreshToken) => msToken({ refresh_token: refreshToken, grant_type: "refresh_token" }),
  busy: async (token, calendarId, from, to) => {
    type Page = {
      value: { start: { dateTime: string }; end: { dateTime: string }; showAs: string; isCancelled?: boolean }[];
      "@odata.nextLink"?: string;
    };
    let url: string | undefined =
      `${msBase(calendarId)}/calendarView?` +
      new URLSearchParams({
        startDateTime: from.toISOString(),
        endDateTime: to.toISOString(),
        $select: "start,end,showAs,isCancelled",
        $top: "500",
      });
    const out: Interval[] = [];
    for (let page = 0; url && page < 10; page++) {
      const res: Page = await call<Page>(url, { token, headers: { Prefer: 'outlook.timezone="UTC"' } });
      for (const e of res.value) {
        if (e.isCancelled || e.showAs === "free" || e.showAs === "workingElsewhere") continue;
        out.push({ start: new Date(`${e.start.dateTime.slice(0, 19)}Z`), end: new Date(`${e.end.dateTime.slice(0, 19)}Z`) });
      }
      url = res["@odata.nextLink"];
    }
    return out;
  },
  upsertEvent: async (token, calendarId, externalId, ev, attendees) => {
    const body: Record<string, unknown> = {
      subject: ev.title,
      body: { contentType: "text", content: `${ev.description}\n\n${ev.url}`.trim() },
      start: graphTime(ev.start),
      end: graphTime(ev.end),
      location: { displayName: ev.location },
      hideAttendees: true,
      allowNewTimeProposals: false,
    };
    const make = (a: Attendee): GraphAttendee => ({ emailAddress: { address: a.email, name: a.name }, type: "required" });
    if (externalId) {
      try {
        if (attendees) {
          const current = await call<{ attendees?: GraphAttendee[] }>(`${GRAPH}/me/events/${externalId}?$select=attendees`, { token });
          body.attendees = mergeAttendees(current.attendees ?? [], (a) => a.emailAddress.address, attendees, make);
        }
        // Graph sender selv invitationer til nye deltagere
        const res = await call<{ id: string }>(`${GRAPH}/me/events/${externalId}`, { method: "PATCH", token, ...json(body) });
        return res.id;
      } catch (e) {
        if (!(e instanceof CalendarApiError) || e.status !== 404) throw e;
      }
    }
    if (attendees) body.attendees = attendees.add.map(make);
    const res = await call<{ id: string }>(`${msBase(calendarId)}/events`, { method: "POST", token, ...json(body) });
    return res.id;
  },
  deleteEvent: async (token, _calendarId, externalId) => {
    try {
      // "cancel" sender en aflysning til deltagerne; virker kun hvis der er deltagere
      await call(`${GRAPH}/me/events/${externalId}/cancel`, { method: "POST", token, ...json({ comment: "Eventet er aflyst." }) });
    } catch (e) {
      if (e instanceof CalendarApiError && e.status === 404) return;
      try {
        await call(`${GRAPH}/me/events/${externalId}`, { method: "DELETE", token });
      } catch (e2) {
        if (!(e2 instanceof CalendarApiError) || e2.status !== 404) throw e2;
      }
    }
  },
};

export const PROVIDERS: Record<CalendarProvider, ProviderApi> = { google, outlook };
