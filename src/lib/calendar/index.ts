import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { CALENDAR_PROVIDERS, type CalendarProvider } from "@/db/schema";
import { SITE_URL } from "../site";
import { decrypt, encrypt } from "./crypto";
import { PROVIDERS, type AttendeeChanges, type Interval } from "./providers";

export { PROVIDERS } from "./providers";
export type { Interval } from "./providers";

type Connection = typeof s.calendarConnections.$inferSelect;

/** Cookie der beskytter login-rundturen mod forfalskede tilbagekald */
export const STATE_COOKIE = "vb_kalender_state";

export const redirectUri = (provider: CalendarProvider) => `${SITE_URL}/api/kalender/${provider}/callback`;

export async function getConnections(): Promise<Connection[]> {
  return db.select().from(s.calendarConnections);
}

/**
 * Kalenderen, hvor deltagerne bliver inviteret. Er begge tilsluttet, lægges eventet også
 * i den anden – men uden deltagere, så ingen får to invitationer.
 */
export function primaryProvider(conns: Connection[], setting?: string): CalendarProvider | null {
  const wanted = conns.find((c) => c.provider === setting);
  if (wanted) return wanted.provider;
  return CALENDAR_PROVIDERS.find((p) => conns.some((c) => c.provider === p)) ?? null;
}

export async function saveConnection(
  provider: CalendarProvider,
  tokens: { accessToken: string; expiresIn: number; refreshToken?: string; email?: string },
) {
  const existing = (await getConnections()).find((c) => c.provider === provider);
  const refresh = tokens.refreshToken ?? (existing ? decrypt(existing.refreshToken) : undefined);
  if (!refresh) throw new Error("Kalenderen gav ingen varig adgang – fjern appens adgang i din konto og prøv igen");
  const values = {
    provider,
    accountEmail: tokens.email ?? existing?.accountEmail ?? "",
    refreshToken: encrypt(refresh),
    accessToken: encrypt(tokens.accessToken),
    accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    lastError: null,
  };
  await db
    .insert(s.calendarConnections)
    .values(values)
    .onConflictDoUpdate({ target: s.calendarConnections.provider, set: values });
  busyCache.clear();
}

export async function removeConnection(provider: CalendarProvider) {
  await db.delete(s.calendarConnections).where(eq(s.calendarConnections.provider, provider));
  busyCache.clear();
}

async function accessToken(conn: Connection): Promise<string> {
  if (conn.accessToken && conn.accessTokenExpiresAt && conn.accessTokenExpiresAt.getTime() > Date.now() + 60_000) {
    return decrypt(conn.accessToken);
  }
  try {
    const t = await PROVIDERS[conn.provider].refresh(decrypt(conn.refreshToken));
    await db
      .update(s.calendarConnections)
      .set({
        accessToken: encrypt(t.accessToken),
        accessTokenExpiresAt: new Date(Date.now() + t.expiresIn * 1000),
        // Microsoft udskifter nøglen ved hver fornyelse
        ...(t.refreshToken ? { refreshToken: encrypt(t.refreshToken) } : {}),
        lastError: null,
      })
      .where(eq(s.calendarConnections.id, conn.id));
    return t.accessToken;
  } catch (e) {
    await setConnectionError(conn, `Adgangen kunne ikke fornyes – tilslut kalenderen igen (${String(e).slice(0, 200)})`);
    throw e;
  }
}

async function setConnectionError(conn: Connection, error: string | null) {
  await db.update(s.calendarConnections).set({ lastError: error }).where(eq(s.calendarConnections.id, conn.id));
}

/* ---------- Ledig / optaget ---------- */

const BUSY_TTL = 5 * 60_000;
const busyCache = new Map<string, { at: number; data: Interval[] }>();

/** Optagede tidsrum fra alle tilsluttede kalendere (uden titler – kun hvornår) */
export async function getBusy(from: Date, to: Date): Promise<{ intervals: Interval[]; sources: CalendarProvider[] }> {
  const conns = await getConnections();
  const key = `${from.toISOString()}|${to.toISOString()}|${conns.map((c) => c.provider).join(",")}`;
  const hit = busyCache.get(key);
  if (hit && Date.now() - hit.at < BUSY_TTL) return { intervals: hit.data, sources: conns.map((c) => c.provider) };

  const results = await Promise.all(
    conns.map(async (c) => {
      try {
        return await PROVIDERS[c.provider].busy(await accessToken(c), c.calendarId, from, to);
      } catch (e) {
        console.error(`Kunne ikke læse ${c.provider}-kalenderen`, e);
        return [];
      }
    }),
  );
  const data = mergeIntervals(results.flat());
  if (busyCache.size > 50) busyCache.clear();
  busyCache.set(key, { at: Date.now(), data });
  return { intervals: data, sources: conns.map((c) => c.provider) };
}

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = [...list].sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start.getTime() <= last.end.getTime()) {
      if (i.end > last.end) last.end = i.end;
    } else out.push({ start: new Date(i.start), end: new Date(i.end) });
  }
  return out;
}

/* ---------- Events → kalenderen ---------- */

export type SyncResult = { synced: CalendarProvider[]; errors: string[]; attendeesSynced: boolean };

/**
 * Lægger eventet i de tilsluttede kalendere og skriver bekræftede deltagere på posten,
 * så de får en invitation og eventet dukker op i deres egen kalender.
 */
export async function syncEventToCalendars(eventId: number): Promise<SyncResult> {
  const event = await db.query.events.findFirst({ where: eq(s.events.id, eventId), with: { signups: true } });
  const result: SyncResult = { synced: [], errors: [], attendeesSynced: false };
  if (!event) return result;

  const [conns, setting] = await Promise.all([
    getConnections(),
    db.query.settings.findFirst({ where: eq(s.settings.key, "calendarPrimary") }),
  ]);
  if (conns.length === 0) return result;
  const primary = primaryProvider(conns, setting?.value);

  const confirmed = event.signups.filter((x) => x.status === "bekraeftet");
  const confirmedEmails = new Set(confirmed.map((x) => x.email.toLowerCase()));
  const attendees: AttendeeChanges = {
    add: confirmed.map((x) => ({ email: x.email, name: x.name })),
    remove: event.signups
      .filter((x) => x.status === "annulleret" && !confirmedEmails.has(x.email.toLowerCase()))
      .map((x) => x.email),
  };

  const ids = { ...event.externalIds };
  for (const c of conns) {
    const api = PROVIDERS[c.provider];
    try {
      const token = await accessToken(c);
      if (!event.published) {
        if (ids[c.provider]) await api.deleteEvent(token, c.calendarId, ids[c.provider]!);
        delete ids[c.provider];
        continue;
      }
      ids[c.provider] = await api.upsertEvent(
        token,
        c.calendarId,
        ids[c.provider],
        {
          title: `${event.emoji} ${event.title}`,
          description: [event.summary, event.description].filter(Boolean).join("\n\n"),
          location: event.location,
          start: event.startsAt,
          end: event.endsAt,
          url: `${SITE_URL}/kalender/${event.slug}`,
        },
        c.provider === primary ? attendees : undefined,
      );
      result.synced.push(c.provider);
      if (c.provider === primary) result.attendeesSynced = true;
      if (c.lastError) await setConnectionError(c, null);
    } catch (e) {
      console.error(`Kunne ikke lægge event ${event.id} i ${c.provider}`, e);
      result.errors.push(`${api.label}: ${String(e).slice(0, 200)}`);
    }
  }

  await db
    .update(s.events)
    .set({ externalIds: ids, syncError: result.errors.join("\n") || null })
    .where(eq(s.events.id, event.id));
  if (result.attendeesSynced) {
    for (const x of confirmed) {
      await db
        .update(s.eventSignups)
        .set({ calendarSyncedAt: new Date(), syncError: null })
        .where(eq(s.eventSignups.id, x.id));
    }
  } else if (primary && result.errors.length) {
    for (const x of confirmed.filter((x) => !x.calendarSyncedAt)) {
      await db.update(s.eventSignups).set({ syncError: result.errors[0] }).where(eq(s.eventSignups.id, x.id));
    }
  }
  busyCache.clear();
  return result;
}

/** Fjerner eventet fra alle kalendere (deltagerne får en aflysning) */
export async function removeEventFromCalendars(externalIds: Partial<Record<CalendarProvider, string>>) {
  const conns = await getConnections();
  for (const c of conns) {
    const id = externalIds[c.provider];
    if (!id) continue;
    try {
      await PROVIDERS[c.provider].deleteEvent(await accessToken(c), c.calendarId, id);
    } catch (e) {
      console.error(`Kunne ikke slette event i ${c.provider}`, e);
    }
  }
  busyCache.clear();
}
