"use server";

import type { GeoJsonObject } from "geojson";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { CALENDAR_PROVIDERS, type CalendarProvider } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { removeConnection, removeEventFromCalendars, syncEventToCalendars } from "@/lib/calendar";
import { fromLocalInput } from "@/lib/dates";
import { cancelEventSignups, confirmEventSignups } from "@/lib/events";
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
    productId: d.productId ? Number(d.productId) : null,
    published: form.get("published") === "on",
    ...(route ? { routeGeojson: route } : form.get("removeRoute") === "on" ? { routeGeojson: null } : {}),
  };

  let eventId = id;
  if (id) await db.update(s.events).set(values).where(eq(s.events.id, id));
  else [{ id: eventId }] = await db.insert(s.events).values(values).returning({ id: s.events.id });

  const result = await syncEventToCalendars(eventId!);
  refresh();
  back(
    result.errors.length
      ? `Gemt – men kalenderen fejlede: ${result.errors[0]}`
      : result.synced.length
        ? `Gemt og synkroniseret med ${result.synced.join(" og ")} ✅`
        : "Gemt ✅",
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
  await db.delete(s.events).where(eq(s.events.id, id));
  refresh();
  back(`“${event.title}” er slettet og fjernet fra kalenderne`);
}

/** Villads kan selv bekræfte eller fjerne en deltager – fx hvis betalingen er aftalt udenom */
export async function setSignupStatus(signupId: number, status: "bekraeftet" | "annulleret") {
  await requireAdmin();
  const signup = await db.query.eventSignups.findFirst({ where: eq(s.eventSignups.id, signupId) });
  if (!signup) return;
  if (status === "bekraeftet") {
    await db.update(s.eventSignups).set({ status: "afventer" }).where(eq(s.eventSignups.id, signupId));
    await confirmEventSignups(signup.orderId);
  } else {
    await cancelEventSignups(signup.orderId);
  }
  refresh();
}
