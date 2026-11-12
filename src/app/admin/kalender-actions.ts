"use server";

import type { GeoJsonObject } from "geojson";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { CALENDAR_PROVIDERS, type CalendarProvider } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { removeConnection, removeEventFromCalendars, saveIcsUrl, syncEventToCalendars } from "@/lib/calendar";
import { fetchIcsBusy } from "@/lib/calendar/ics-busy";
import { INVITE_EMAIL_SETTING } from "@/lib/calendar/invites";
import { fromLocalInput } from "@/lib/dates";
import { activateEvent, announceConfirmed, cancelEvent, getSeatsTaken, notifyInterested, removeSignup } from "@/lib/events";
import { parseKr } from "@/lib/money";

function refresh() {
  revalidatePath("/", "layout");
}

function back(msg: string, id?: number): never {
  redirect(`/admin/kalender${id ? `/${id}` : ""}?besked=${encodeURIComponent(msg)}`);
}

export async function disconnectCalendar(provider: CalendarProvider) {
  await requireAdmin();
  if (!CALENDAR_PROVIDERS.includes(provider)) return;
  await removeConnection(provider);
  refresh();
}

export async function setPrimaryCalendar(provider: CalendarProvider) {
  await requireAdmin();
  if (!CALENDAR_PROVIDERS.includes(provider)) return;
  await db
    .insert(s.settings)
    .values({ key: "calendarPrimary", value: provider })
    .onConflictDoUpdate({ target: s.settings.key, set: { value: provider } });
  refresh();
}

/** Gemmer linket til den publicerede Outlook-kalender – efter at have tjekket, at det kan læses */
export async function saveOutlookIcs(form: FormData) {
  await requireAdmin();
  const raw = String(form.get("icsUrl") ?? "").trim();
  if (!raw) {
    await saveIcsUrl(null);
    refresh();
    back("Outlook-linket er fjernet");
  }
  const url = raw.replace(/^webcal:\/\//i, "https://");
  if (!/^https:\/\/\S+$/i.test(url)) back("Linket skal starte med https:// eller webcal://");
  let count: number;
  try {
    const now = new Date();
    count = (await fetchIcsBusy(url, now, new Date(now.getTime() + 30 * 86400_000))).length;
  } catch (e) {
    back(`Linket kunne ikke læses: ${e instanceof Error ? e.message : String(e)}`);
  }
  await saveIcsUrl(url);
  refresh();
  back(`Outlook er koblet på ✅ – fandt ${count} optagede tidsrum de næste 30 dage`);
}

/** Din Outlook-adresse: event-invitationer sendes dertil som mødeindkaldelser */
export async function saveInviteEmail(form: FormData) {
  await requireAdmin();
  const email = String(form.get("inviteEmail") ?? "").trim().toLowerCase();
  if (!email) {
    await db.delete(s.settings).where(eq(s.settings.key, INVITE_EMAIL_SETTING));
    refresh();
    back("Invitationer til Outlook er slået fra");
  }
  if (!z.string().email().safeParse(email).success) back("Det ligner ikke en e-mailadresse");
  await db
    .insert(s.settings)
    .values({ key: INVITE_EMAIL_SETTING, value: email })
    .onConflictDoUpdate({ target: s.settings.key, set: { value: email } });
  refresh();
  back(`Event-invitationer sendes nu til ${email} ✅ – kommende events opdateres, næste gang de gemmes eller får en tilmelding`);
}

/* ---------- Ruter: GPX eller GeoJSON -> GeoJSON ---------- */

/** Læser en GPX-fil (fra Komoot, Strava, Garmin, Google My Maps …) som en linje */
function gpxToGeojson(gpx: string): GeoJsonObject | null {
  const segments: [number, number][][] = [];
  for (const seg of gpx.match(/<(trkseg|rte)\b[\s\S]*?<\/\1>/g) ?? [gpx]) {
    const coords = [...seg.matchAll(/<(?:trkpt|rtept)\b[^>]*?\blat="([-\d.]+)"[^>]*?\blon="([-\d.]+)"|<(?:trkpt|rtept)\b[^>]*?\blon="([-\d.]+)"[^>]*?\blat="([-\d.]+)"/g)].map(
      (m) => (m[1] ? [+m[2], +m[1]] : [+m[3], +m[4]]) as [number, number],
    );
    if (coords.length > 1) segments.push(coords);
  }
  if (!segments.length) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: segments.length === 1 ? { type: "LineString", coordinates: segments[0] } : { type: "MultiLineString", coordinates: segments },
  } as GeoJsonObject;
}

async function readRoute(file: File | null): Promise<GeoJsonObject | null | "invalid"> {
  if (!file || file.size === 0) return null;
  if (file.size > 3_000_000) return "invalid";
  const text = await file.text();
  if (/<gpx\b/i.test(text)) return gpxToGeojson(text) ?? "invalid";
  try {
    const geo = JSON.parse(text) as GeoJsonObject;
    return ["Feature", "FeatureCollection", "LineString", "MultiLineString", "GeometryCollection"].includes(geo?.type) ? geo : "invalid";
  } catch {
    return "invalid";
  }
}

/* ---------- Events ---------- */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

const eventSchema = z.object({
  title: z.string().trim().min(1, "Skriv en titel").max(120),
  slug: z.string().trim().max(60),
  emoji: z.string().trim().max(8),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Ugyldig farve"),
  summary: z.string().trim().max(300),
  description: z.string().trim().max(10000),
  location: z.string().trim().max(200),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Vælg start"),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Vælg slut"),
  price: z.string(),
  capacity: z.string(),
  minParticipants: z.string(),
  signupDeadline: z.string().regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/, "Ugyldig frist"),
  practicalInfo: z.string().trim().max(5000),
  productId: z.string(),
});

export async function saveEvent(id: number | null, form: FormData) {
  await requireAdmin();
  const parsed = eventSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) back(parsed.error.issues[0]?.message ?? "Ugyldige oplysninger", id ?? undefined);
  const d = parsed.data;
  const startsAt = fromLocalInput(d.startsAt);
  const endsAt = fromLocalInput(d.endsAt);
  if (endsAt <= startsAt) back("Slut skal være efter start", id ?? undefined);
  const price = d.price.trim() ? parseKr(d.price) : 0;
  if (price == null) back("Ugyldig pris", id ?? undefined);
  const capacity = d.capacity.trim() ? Math.max(0, parseInt(d.capacity) || 0) : null;
  const minParticipants = Math.max(1, parseInt(d.minParticipants) || 1);
  if (capacity != null && minParticipants > capacity) back("Minimum kan ikke være større end antal pladser", id ?? undefined);
  const signupDeadline = d.signupDeadline ? fromLocalInput(d.signupDeadline) : null;
  if (signupDeadline && signupDeadline > startsAt) back("Tilmeldingsfristen skal være før start", id ?? undefined);
  const route = await readRoute(form.get("route") as File | null);
  if (route === "invalid") back("Ruten kunne ikke læses – brug en GPX- eller GeoJSON-fil", id ?? undefined);

  let slug = slugify(d.slug || d.title) || "event";
  const clash = await db.query.events.findFirst({ where: eq(s.events.slug, slug), columns: { id: true } });
  if (clash && clash.id !== id) slug = `${slug}-${startsAt.toISOString().slice(0, 10)}`;

  const values = {
    title: d.title,
    slug,
    emoji: d.emoji || "🎉",
    color: d.color,
    summary: d.summary,
    description: d.description,
    location: d.location,
    startsAt,
    endsAt,
    price,
    capacity,
    minParticipants,
    signupDeadline,
    practicalInfo: d.practicalInfo,
    productId: d.productId ? Number(d.productId) : null,
    published: form.get("published") === "on",
    ...(route ? { routeGeojson: route } : form.get("removeRoute") === "on" ? { routeGeojson: null } : {}),
  };

  let eventId = id;
  if (id) await db.update(s.events).set(values).where(eq(s.events.id, id));
  else [{ id: eventId }] = await db.insert(s.events).values(values).returning({ id: s.events.id });

  // Sænket minimum, så der allerede er nok? Så gennemføres det med det samme
  const saved = await db.query.events.findFirst({ where: eq(s.events.id, eventId!) });
  const taken = (await getSeatsTaken([eventId!])).get(eventId!) ?? 0;
  let extra = "";
  if (saved?.status === "samler" && saved.published && taken > 0 && taken >= saved.minParticipants && (await activateEvent(eventId!))) {
    await announceConfirmed(eventId!);
    extra = " Der er nok tilmeldte, så eventet gennemføres nu – alle er inviteret.";
  }
  if (!id && values.published && values.productId) {
    const n = await notifyInterested(eventId!);
    if (n) extra += ` ${n} interesserede har fået besked om datoen.`;
  }

  const result = await syncEventToCalendars(eventId!);
  refresh();
  back(
    (result.errors.length
      ? `Gemt – men kalenderen fejlede: ${result.errors[0]}`
      : result.synced.length
        ? `Gemt og synkroniseret med ${result.synced.join(" og ")} ✅`
        : "Gemt ✅") + extra,
    eventId!,
  );
}

export async function resyncEvent(id: number) {
  await requireAdmin();
  const result = await syncEventToCalendars(id);
  refresh();
  back(result.errors.length ? `Fejl: ${result.errors.join(" · ")}` : `Synkroniseret med ${result.synced.join(" og ") || "ingen kalendere"} ✅`, id);
}

export async function deleteEvent(id: number) {
  await requireAdmin();
  const event = await db.query.events.findFirst({ where: eq(s.events.id, id) });
  if (!event) return;
  await removeEventFromCalendars(event.externalIds);
  // Ordrerne bliver stående (de er bogført) – de peger bare ikke på eventet længere
  await db.update(s.orderItems).set({ eventId: null }).where(eq(s.orderItems.eventId, id));
  await db.delete(s.events).where(eq(s.events.id, id));
  refresh();
  back(`“${event.title}” er slettet og fjernet fra kalenderne`);
}

/** Fjern en deltager – fx en der ikke har betalt. Ubetalte ordrer rettes til. */
export async function removeSignupAction(signupId: number) {
  await requireAdmin();
  await removeSignup(signupId);
  refresh();
}

/** Gennemfør eventet nu, selvom minimum ikke er nået */
export async function confirmEventNow(id: number) {
  await requireAdmin();
  const ok = await activateEvent(id);
  if (ok) await announceConfirmed(id);
  refresh();
  back(ok ? "Eventet gennemføres ✅ – alle tilmeldte er inviteret" : "Eventet samlede ikke tilmeldte længere", id);
}

export async function cancelEventAction(id: number, form: FormData) {
  await requireAdmin();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 1000) || "Eventet er desværre aflyst.";
  const ok = await cancelEvent(id, reason);
  refresh();
  back(ok ? "Eventet er aflyst – deltagerne har fået besked, og posten er fjernet fra kalenderen" : "Eventet var allerede aflyst", id);
}
