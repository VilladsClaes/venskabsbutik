import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { deleteEvent, resyncEvent, saveEvent, setSignupStatus } from "@/app/admin/kalender-actions";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { CALENDAR_PROVIDERS } from "@/db/schema";
import { PROVIDERS } from "@/lib/calendar";
import { toLocalInput } from "@/lib/dates";
import { EVENT_TEMPLATES } from "@/lib/event-templates";
import { formatAmount } from "@/lib/money";

const SIGNUP_LABEL = { afventer: "⏳ Afventer betaling", bekraeftet: "✅ Bekræftet", annulleret: "✖ Annulleret" } as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export default async function EventAdmin({ params, searchParams }: PageProps<"/admin/kalender/[id]">) {
  const { id: rawId } = await params;
  const { besked, skabelon, start, titel } = await searchParams;
  const id = rawId === "ny" ? null : Number(rawId);
  if (rawId !== "ny" && !Number.isInteger(id)) notFound();

  const [event, products] = await Promise.all([
    id
      ? db.query.events.findFirst({
          where: eq(s.events.id, id),
          with: { signups: { orderBy: desc(s.eventSignups.createdAt), with: { order: { columns: { id: true, orderNumber: true, status: true } } } } },
        })
      : undefined,
    db.query.products.findMany({ columns: { id: true, slug: true, name: true, emoji: true }, orderBy: asc(s.products.name) }),
  ]);
  if (id && !event) notFound();

  // Nyt event: udfyld fra skabelon (og evt. dato fra fødselsdagslisten)
  const tpl = EVENT_TEMPLATES.find((t) => t.key === skabelon);
  const defaultStart = typeof start === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start) ? start : undefined;
  const startInput = event ? toLocalInput(event.startsAt) : (defaultStart ?? `${toLocalInput(new Date(new Date().getTime() + 7 * 86400_000)).slice(0, 10)}T18:00`);
  const endInput = event
    ? toLocalInput(event.endsAt)
    : (() => {
        const [d, t] = startInput.split("T");
        const h = Math.min(23, +t.slice(0, 2) + (tpl?.hours ?? 3));
        return `${d}T${String(h).padStart(2, "0")}:${h === 23 ? "59" : t.slice(3)}`;
      })();
  const v = {
    title: event?.title ?? (typeof titel === "string" ? titel : tpl?.title) ?? "",
    slug: event?.slug ?? "",
    emoji: event?.emoji ?? tpl?.emoji ?? "🎉",
    color: event?.color ?? tpl?.color ?? "#ffd23f",
    summary: event?.summary ?? tpl?.summary ?? "",
    description: event?.description ?? "",
    location: event?.location ?? tpl?.location ?? "",
    price: event ? formatAmount(event.price) : tpl ? formatAmount(tpl.price) : "",
    capacity: event ? (event.capacity ?? "") : (tpl?.capacity ?? ""),
    productId: event?.productId ?? products.find((p) => p.slug === tpl?.productSlug)?.id ?? "",
    published: event?.published ?? true,
  };
  const seats = event?.signups.filter((x) => x.status !== "annulleret").reduce((n, x) => n + x.seats, 0) ?? 0;

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/kalender" className="text-sm font-semibold underline">
        ← Kalender
      </Link>
      <AdminTitle sub={event ? <Link href={`/kalender/${event.slug}`} className="underline" target="_blank">Se eventet ↗</Link> : undefined}>
        {event ? `${event.emoji} ${event.title}` : "Nyt event"}
      </AdminTitle>
      {besked && (
        <p className="rounded-2xl border-[3px] border-ink bg-mint px-4 py-3 font-semibold" role="status">
          {String(besked)}
        </p>
      )}
      {event?.syncError && (
        <p className="whitespace-pre-line rounded-2xl border-[3px] border-ink bg-coral/20 px-4 py-3 text-sm font-semibold">⚠️ {event.syncError}</p>
      )}

      <form action={saveEvent.bind(null, id)} className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Titel">
            <input name="title" required defaultValue={v.title} className="input" placeholder="Fx Bow combat i Fælledparken" />
          </Field>
        </div>
        <div className="grid grid-cols-[80px_80px_1fr] gap-3 sm:col-span-2">
          <Field label="Emoji">
            <input name="emoji" defaultValue={v.emoji} className="input text-center text-xl" />
          </Field>
          <Field label="Farve">
            <input name="color" type="color" defaultValue={v.color} className="input !h-11 !p-1" />
          </Field>
          <Field label="Adresse (slug)" hint="Tom = laves ud fra titlen">
            <input name="slug" defaultValue={v.slug} className="input" />
          </Field>
        </div>
        <Field label="Start">
          <input name="startsAt" type="datetime-local" required defaultValue={startInput} className="input" />
        </Field>
        <Field label="Slut">
          <input name="endsAt" type="datetime-local" required defaultValue={endInput} className="input" />
        </Field>
        <Field label="Pris pr. plads (kr.)" hint="Tom eller 0 = gratis">
          <input name="price" defaultValue={v.price} inputMode="decimal" className="input" />
        </Field>
        <Field label="Antal pladser" hint="Tom = ubegrænset">
          <input name="capacity" type="number" min={0} defaultValue={v.capacity} className="input" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Sted">
            <input name="location" defaultValue={v.location} className="input" placeholder="Fx Fælledparken, København" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Kort beskrivelse" hint="Vises på kortet i kalenderen og i invitationen">
            <input name="summary" defaultValue={v.summary} maxLength={300} className="input" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Beskrivelse">
            <textarea name="description" defaultValue={v.description} className="input min-h-32" />
          </Field>
        </div>
        <Field label="Hører til produktet" hint="Fx Fødselsdag – så linker eventet til produktsiden">
          <select name="productId" defaultValue={String(v.productId)} className="input">
            <option value="">Intet</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rute til kortet (GPX eller GeoJSON)" hint={event?.routeGeojson ? "Der er allerede en rute – upload en ny for at erstatte den" : "Fx eksporteret fra Komoot, Strava eller Google My Maps"}>
          <input name="route" type="file" accept=".gpx,.geojson,.json,application/gpx+xml,application/geo+json" className="input" />
        </Field>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" name="published" defaultChecked={v.published} className="h-5 w-5 accent-coral" />
            Vis i kalenderen
          </label>
          {event?.routeGeojson && (
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" name="removeRoute" className="h-5 w-5 accent-coral" />
              Fjern ruten
            </label>
          )}
          <button className="btn btn-sun ml-auto">{event ? "Gem og synkronisér" : "Opret event"}</button>
        </div>
      </form>

      {event && (
        <>
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <h2 className="text-xl font-bold">
                Deltagere ({seats}
                {event.capacity != null && ` / ${event.capacity}`} pladser)
              </h2>
              <span className="text-sm text-ink-soft">
                I kalender:{" "}
                {CALENDAR_PROVIDERS.filter((p) => event.externalIds[p])
                  .map((p) => PROVIDERS[p].label)
                  .join(", ") || "ingen"}
              </span>
            </div>
            {event.signups.length === 0 ? (
              <p className="px-5 pb-5 text-ink-soft">Ingen tilmeldinger endnu.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink text-white">
                    <tr>
                      <th className="px-4 py-2">Navn</th>
                      <th className="px-4 py-2">Pladser</th>
                      <th className="px-4 py-2">Ordre</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Kalender</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {event.signups.map((x, i) => (
                      <tr key={x.id} className={i % 2 ? "bg-cream/60" : "bg-white"}>
                        <td className="px-4 py-2">
                          <span className="font-bold">{x.name}</span>
                          <span className="block text-xs text-ink-soft">{x.email}</span>
                        </td>
                        <td className="px-4 py-2">{x.seats}</td>
                        <td className="px-4 py-2">
                          <Link href={`/admin/ordrer/${x.order.id}`} className="font-bold underline">
                            {x.order.orderNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">{SIGNUP_LABEL[x.status]}</td>
                        <td className="px-4 py-2 text-xs">
                          {x.calendarSyncedAt ? `📅 ${formatDate(x.calendarSyncedAt)}` : x.status === "bekraeftet" ? "📧 .ics sendt" : "–"}
                          {x.syncError && <span className="block font-bold text-coral" title={x.syncError}>⚠️ fejl</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          {x.status !== "bekraeftet" && (
                            <form action={setSignupStatus.bind(null, x.id, "bekraeftet")} className="inline">
                              <button className="text-xs font-bold underline">Bekræft</button>
                            </form>
                          )}
                          {x.status !== "annulleret" && (
                            <form action={setSignupStatus.bind(null, x.id, "annulleret")} className="ml-2 inline">
                              <button className="text-xs font-bold text-coral underline">Fjern</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="border-t-2 border-ink/10 px-5 py-3 text-xs text-ink-soft">
              Deltagere bekræftes automatisk, når ordren er betalt (eller du sætter den til “Betalt”). “Bekræft” her
              springer betalingen over – fx hvis I har aftalt det udenom.
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            <form action={resyncEvent.bind(null, event.id)}>
              <button className="btn btn-white">🔄 Synkronisér med kalenderne igen</button>
            </form>
            <form action={deleteEvent.bind(null, event.id)}>
              <button className="btn btn-white text-coral">🗑️ Slet event (deltagerne får en aflysning)</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
