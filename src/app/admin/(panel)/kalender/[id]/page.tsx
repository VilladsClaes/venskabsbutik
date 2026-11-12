import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { cancelEventAction, confirmEventNow, deleteEvent, removeSignupAction, resyncEvent, saveEvent } from "@/app/admin/kalender-actions";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { CALENDAR_PROVIDERS } from "@/db/schema";
import { PROVIDERS } from "@/lib/calendar";
import { toLocalInput } from "@/lib/dates";
import { EVENT_TEMPLATES } from "@/lib/event-templates";
import { effectiveDeadline, PAYMENT_DAYS } from "@/lib/events";
import { formatAmount } from "@/lib/money";

const SIGNUP_LABEL = { tilmeldt: "📝 Tilmeldt", bekraeftet: "✅ Med", annulleret: "✖ Fjernet/afmeldt" } as const;
const EVENT_STATUS = {
  samler: { label: "📝 Samler tilmeldte", bg: "bg-sun", text: "Står som “måske” i din kalender. Når minimum er nået, bliver alle inviteret og bedt om at betale." },
  gennemfoeres: { label: "✅ Gennemføres", bg: "bg-mint", text: "Alle tilmeldte er på kalenderposten og har fået besked om betaling. Nye tilmeldinger bliver inviteret med det samme." },
  aflyst: { label: "✖ Aflyst", bg: "bg-coral/30", text: "Deltagerne har fået besked, og posten er fjernet fra kalenderen." },
} as const;
const ORDER_LABEL: Record<string, string> = { afventer_betaling: "⏳ Ikke betalt", betalt: "💰 Betalt", i_gang: "💰 Betalt", leveret: "💰 Betalt", annulleret: "✖ Annulleret" };

/** Standardfrist: 3 dage før start kl. 12 */
function defaultDeadline(startInput: string) {
  const d = new Date(`${startInput.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 3);
  return `${d.toISOString().slice(0, 10)}T12:00`;
}

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
  const { besked, skabelon, start, titel, aktivitet } = await searchParams;
  const id = rawId === "ny" ? null : Number(rawId);
  if (rawId !== "ny" && !Number.isInteger(id)) notFound();

  const [event, products] = await Promise.all([
    id
      ? db.query.events.findFirst({
          where: eq(s.events.id, id),
          with: {
            signups: {
              orderBy: [asc(s.eventSignups.createdAt), asc(s.eventSignups.id)],
              with: { order: { columns: { id: true, orderNumber: true, status: true, total: true, createdAt: true } } },
            },
          },
        })
      : undefined,
    db.query.products.findMany({
      columns: { id: true, slug: true, name: true, emoji: true, color: true, summary: true, price: true, isActivity: true },
      orderBy: asc(s.products.name),
    }),
  ]);
  if (id && !event) notFound();

  // Nyt event: udfyld fra skabelon (og evt. dato fra fødselsdagslisten)
  // …eller fra en aktivitet ("Planlæg dato" ud for de interesserede)
  const activity = typeof aktivitet === "string" ? products.find((p) => p.id === Number(aktivitet)) : undefined;
  const tpl =
    EVENT_TEMPLATES.find((t) => t.key === skabelon) ??
    (activity ? EVENT_TEMPLATES.find((t) => t.productSlug === activity.slug && t.activity) : undefined);
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
    title: event?.title ?? (typeof titel === "string" ? titel : (tpl?.title ?? activity?.name)) ?? "",
    slug: event?.slug ?? "",
    emoji: event?.emoji ?? tpl?.emoji ?? activity?.emoji ?? "🎉",
    color: event?.color ?? tpl?.color ?? activity?.color ?? "#ffd23f",
    summary: event?.summary ?? tpl?.summary ?? activity?.summary ?? "",
    description: event?.description ?? "",
    location: event?.location ?? tpl?.location ?? "",
    price: event ? formatAmount(event.price) : tpl ? formatAmount(tpl.price) : activity ? formatAmount(activity.price) : "",
    capacity: event ? (event.capacity ?? "") : (tpl?.capacity ?? ""),
    minParticipants: event?.minParticipants ?? tpl?.minParticipants ?? 3,
    signupDeadline: event ? (event.signupDeadline ? toLocalInput(event.signupDeadline) : "") : defaultDeadline(startInput),
    practicalInfo: event?.practicalInfo ?? tpl?.practicalInfo ?? "",
    productId: event?.productId ?? activity?.id ?? products.find((p) => p.slug === tpl?.productSlug)?.id ?? "",
    published: event?.published ?? true,
  };
  const seats = event?.signups.filter((x) => x.status !== "annulleret").reduce((n, x) => n + x.seats, 0) ?? 0;
  const now = new Date();
  const status = event ? EVENT_STATUS[event.status] : null;
  const bookerOf = (token: string) => event?.signups.find((y) => y.groupToken === token && y.isBooker);

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

      {event && status && (
        <section className={`card ${status.bg} space-y-3 p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">{status.label}</h2>
            <p className="font-display text-xl font-bold">
              {seats} / min. {event.minParticipants}
              {event.capacity != null && <span className="text-base font-semibold text-ink-soft"> · {event.capacity} pladser</span>}
            </p>
          </div>
          <p>{status.text}</p>
          {event.status === "samler" && (
            <p className="text-sm font-semibold">
              Frist: {formatDate(effectiveDeadline(event))} – er minimum ikke nået da, aflyses eventet automatisk.
            </p>
          )}
          {event.status === "aflyst" && event.cancelReason && <p className="text-sm">“{event.cancelReason}”</p>}
          {event.status !== "aflyst" && event.startsAt > now && (
            <div className="flex flex-wrap items-end gap-3 border-t-2 border-ink/10 pt-3">
              {event.status === "samler" && (
                <form action={confirmEventNow.bind(null, event.id)}>
                  <button className="btn btn-white">✅ Gennemfør nu ({seats} tilmeldte)</button>
                </form>
              )}
              <form action={cancelEventAction.bind(null, event.id)} className="flex flex-1 flex-wrap items-end gap-2">
                <label className="min-w-56 flex-1">
                  <span className="text-xs font-bold">Besked til deltagerne ved aflysning</span>
                  <input name="reason" className="input mt-1" placeholder="Fx: Jeg er desværre blevet syg 🤒" />
                </label>
                <button className="btn btn-white text-coral">Aflys event</button>
              </form>
            </div>
          )}
        </section>
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
        <Field label="Mindst antal deltagere" hint="Eventet gennemføres (og der bedes om betaling), når så mange er tilmeldt">
          <input name="minParticipants" type="number" min={1} required defaultValue={v.minParticipants} className="input" />
        </Field>
        <Field label="Tilmeldingsfrist" hint="Er minimum ikke nået her, aflyses eventet automatisk. Tom = når eventet starter">
          <input name="signupDeadline" type="datetime-local" defaultValue={v.signupDeadline} className="input" />
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
          <Field label="Praktisk information" hint="Mødested, hvad man skal have med, transport … Kommer med i kalenderposten og i “vi kører”-mailen">
            <textarea name="practicalInfo" defaultValue={v.practicalInfo} className="input min-h-24" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Beskrivelse">
            <textarea name="description" defaultValue={v.description} className="input min-h-32" />
          </Field>
        </div>
        <Field label="Hører til produktet" hint="Vælg aktiviteten – så vises datoen på produktsiden, og kalenderposten linker dertil">
          <select name="productId" defaultValue={String(v.productId)} className="input">
            <option value="">Intet</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
                {p.isActivity ? " (aktivitet)" : ""}
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
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Betaling</th>
                      <th className="px-4 py-2">Kalender</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {event.signups.map((x, i) => {
                      const booker = x.isBooker ? null : bookerOf(x.groupToken);
                      const overdue =
                        x.order?.status === "afventer_betaling" && now.getTime() - x.order.createdAt.getTime() > PAYMENT_DAYS * 86400_000;
                      return (
                        <tr key={x.id} className={`${i % 2 ? "bg-cream/60" : "bg-white"} ${x.status === "annulleret" ? "opacity-50" : ""}`}>
                          <td className="px-4 py-2">
                            <span className="font-bold">{x.name}</span>
                            {x.hideName && <span title="Vil ikke vises på siden"> 🙈</span>}
                            <span className="block text-xs text-ink-soft">
                              {x.email}
                              {x.phone ? ` · ${x.phone}` : ""}
                            </span>
                            {booker && <span className="block text-xs text-ink-soft">Med {booker.name}</span>}
                            {x.note && <span className="block text-xs italic">“{x.note}”</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">{SIGNUP_LABEL[x.status]}</td>
                          <td className="whitespace-nowrap px-4 py-2">
                            {x.order ? (
                              <>
                                <Link href={`/admin/ordrer/${x.order.id}`} className="font-bold underline">
                                  {x.order.orderNumber}
                                </Link>
                                {x.isBooker && (
                                  <span className={`block text-xs font-bold ${overdue ? "text-coral" : ""}`}>{ORDER_LABEL[x.order.status]}</span>
                                )}
                                {x.paymentRemindedAt && <span className="block text-xs text-ink-soft">påmindet {formatDate(x.paymentRemindedAt)}</span>}
                              </>
                            ) : (
                              <span className="text-xs text-ink-soft">{x.status === "tilmeldt" ? "Når eventet gennemføres" : "–"}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {x.calendarSyncedAt ? `📅 ${formatDate(x.calendarSyncedAt)}` : x.status === "bekraeftet" ? "📧 .ics sendt" : "–"}
                            {x.syncError && (
                              <span className="block font-bold text-coral" title={x.syncError}>
                                ⚠️ fejl
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right">
                            {x.status !== "annulleret" && (
                              <form action={removeSignupAction.bind(null, x.id)} className="inline">
                                <button className="text-xs font-bold text-coral underline">Fjern</button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="border-t-2 border-ink/10 px-5 py-3 text-xs text-ink-soft">
              Den der tilmelder, betaler for sine venner. Har nogen ikke betalt efter {PAYMENT_DAYS} dage, får de én påmindelse, og
              du får en mail. “Fjern” tager personen af kalenderposten og retter beløbet på en ubetalt ordre.
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
