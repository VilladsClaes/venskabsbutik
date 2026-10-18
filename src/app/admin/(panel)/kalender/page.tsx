import Link from "next/link";
import { asc, desc, gte, lt } from "drizzle-orm";
import { disconnectCalendar, saveOutlookIcs, setPrimaryCalendar } from "@/app/admin/kalender-actions";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { CALENDAR_PROVIDERS } from "@/db/schema";
import { upcomingMilestones } from "@/lib/birthday";
import { getConnections, getIcsUrl, PROVIDERS, primaryProvider, redirectUri } from "@/lib/calendar";
import { toLocalInput } from "@/lib/dates";
import { EVENT_TEMPLATES } from "@/lib/event-templates";
import { getSeatsTaken } from "@/lib/events";
import { formatKr } from "@/lib/money";
import { getSettings } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export default async function CalendarAdmin({ searchParams }: PageProps<"/admin/kalender">) {
  const { besked } = await searchParams;
  const now = new Date();
  const [conns, icsUrl, settings, upcoming, past] = await Promise.all([
    getConnections(),
    getIcsUrl(),
    getSettings(),
    db.query.events.findMany({ where: gte(s.events.endsAt, now), orderBy: asc(s.events.startsAt) }),
    db.query.events.findMany({ where: lt(s.events.endsAt, now), orderBy: desc(s.events.startsAt), limit: 20 }),
  ]);
  const primary = primaryProvider(conns, settings.calendarPrimary);
  const taken = await getSeatsTaken([...upcoming, ...past].map((e) => e.id));
  const birthdays = upcomingMilestones(now, 4);

  const EventRow = ({ e }: { e: (typeof upcoming)[number] }) => (
    <tr className="border-t border-ink/10">
      <td className="px-4 py-2">
        <Link href={`/admin/kalender/${e.id}`} className="font-bold underline">
          {e.emoji} {e.title}
        </Link>
        {!e.published && <span className="ml-2 rounded-full bg-ink/10 px-2 text-xs font-bold">Kladde</span>}
        {e.syncError && <span className="ml-2 text-xs font-bold text-coral" title={e.syncError}>⚠️ synkfejl</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-2">{formatDate(e.startsAt)}</td>
      <td className="px-4 py-2 text-right">{e.price ? formatKr(e.price) : "Gratis"}</td>
      <td className="px-4 py-2 text-right">
        {taken.get(e.id) ?? 0}
        {e.capacity != null && ` / ${e.capacity}`}
      </td>
      <td className="px-4 py-2 text-center" title={Object.keys(e.externalIds).join(", ") || "Ikke i nogen kalender"}>
        {CALENDAR_PROVIDERS.map((p) => (e.externalIds[p] ? PROVIDERS[p].emoji : "")).join(" ") || "–"}
      </td>
    </tr>
  );

  return (
    <div className="max-w-5xl space-y-8">
      <AdminTitle sub="Events folk kan købe sig adgang til – og din ledig/optaget-status fra Google og Outlook.">
        Kalender 🗓️
      </AdminTitle>
      {besked && (
        <p className="rounded-2xl border-[3px] border-ink bg-mint px-4 py-3 font-semibold" role="status">
          {String(besked)}
        </p>
      )}

      <section className="card space-y-3 p-5">
        <h2 className="text-xl font-bold">Tilsluttede kalendere</h2>
        <p className="text-sm text-ink-soft">
          Ledig/optaget læses fra alle tilsluttede kalendere (kun tidsrum – aldrig titler). Events lægges i dem alle, men
          deltagerne inviteres kun fra hovedkalenderen, så de ikke får to invitationer.
        </p>
        {/* Outlook-login kræver en arbejds-/skolekonto – private konti bruger det publicerede link nedenfor */}
        {CALENDAR_PROVIDERS.filter((p) => p === "google" || PROVIDERS[p].configured() || conns.some((c) => c.provider === p)).map((p) => {
          const api = PROVIDERS[p];
          const c = conns.find((x) => x.provider === p);
          return (
            <div key={p} className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-3">
              <span className="text-2xl" aria-hidden="true">{c ? "🟢" : "⚪"}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  {api.emoji} {api.label}
                  {c && primary === p && <span className="ml-2 rounded-full bg-sun px-2 text-xs">Hovedkalender</span>}
                </span>
                <span className="block text-sm text-ink-soft">
                  {c
                    ? `${c.accountEmail || "Tilsluttet"} · siden ${formatDate(c.createdAt, false)}`
                    : api.configured()
                      ? "Ikke tilsluttet"
                      : `Mangler ${p === "google" ? "GOOGLE_CLIENT_ID og GOOGLE_CLIENT_SECRET" : "MICROSOFT_CLIENT_ID og MICROSOFT_CLIENT_SECRET"} – se README`}
                </span>
                {c?.lastError && <span className="block text-sm font-bold text-coral">{c.lastError}</span>}
                {!c && api.configured() && (
                  <span className="block break-all text-xs text-ink-soft">Omdirigerings-URI: {redirectUri(p)}</span>
                )}
              </span>
              {c ? (
                <span className="flex gap-2">
                  {primary !== p && (
                    <form action={setPrimaryCalendar.bind(null, p)}>
                      <button className="btn btn-white !py-1 text-sm">Gør til hovedkalender</button>
                    </form>
                  )}
                  <a href={`/api/kalender/${p}/connect`} className="btn btn-white !py-1 text-sm">
                    Tilslut igen
                  </a>
                  <form action={disconnectCalendar.bind(null, p)}>
                    <button className="btn btn-white !py-1 text-sm">Afbryd</button>
                  </form>
                </span>
              ) : (
                api.configured() && (
                  <a href={`/api/kalender/${p}/connect`} className="btn btn-sun !py-1.5">
                    Tilslut
                  </a>
                )
              )}
            </div>
          );
        })}
        <div className="space-y-2 rounded-2xl bg-cream p-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{icsUrl ? "🟢" : "⚪"}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">📅 Outlook (privat konto) – ledig/optaget</span>
              <span className="block text-sm text-ink-soft">
                {icsUrl ? `Læser fra ${new URL(icsUrl).host} · kun hvornår du er optaget` : "Ikke koblet på"}
              </span>
            </span>
          </div>
          <details className="text-sm" open={!icsUrl}>
            <summary className="cursor-pointer font-bold">Sådan kobler du Outlook på</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Åbn{" "}
                <a href="https://outlook.live.com/calendar/0/options/calendar/SharedCalendars" target="_blank" rel="noopener" className="underline">
                  Outlook.com → Indstillinger → Kalender → Delte kalendere
                </a>
                .
              </li>
              <li>Under <b>Udgiv en kalender</b>: vælg din kalender og <b>“Kan se, hvornår jeg er optaget”</b>, og klik Udgiv.</li>
              <li>Kopiér <b>ICS</b>-linket og sæt det ind her.</li>
            </ol>
          </details>
          <form action={saveOutlookIcs} className="flex flex-wrap gap-2">
            <input
              name="icsUrl"
              type="url"
              defaultValue={icsUrl ?? ""}
              placeholder="https://outlook.live.com/owa/calendar/…/calendar.ics"
              className="input min-w-0 flex-1 !py-1.5 text-sm"
              aria-label="ICS-link til din publicerede Outlook-kalender"
            />
            <button className="btn btn-sun !py-1.5">{icsUrl ? "Gem" : "Kobl på"}</button>
          </form>
          {icsUrl && <p className="text-xs text-ink-soft">Tøm feltet og klik Gem for at fjerne linket.</p>}
          <p className="border-t border-ink/10 pt-2 text-sm">
            <b>Se dine events i Outlook:</b> Tilføj kalender → <i>Abonner fra internettet</i> → indsæt{" "}
            <code className="break-all rounded bg-white px-1">{SITE_URL}/kalender/feed.ics</code>
          </p>
        </div>

        {conns.length === 0 && (
          <p className="text-sm font-semibold">
            Uden en tilsluttet kalender virker events stadig – deltagerne får så en .ics-fil på mail i stedet for en invitation.
          </p>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-xl font-bold">Kommende events</h2>
          <Link href="/admin/kalender/ny" className="btn btn-coral !py-1.5">
            + Nyt event
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {EVENT_TEMPLATES.map((t) => (
            <Link
              key={t.key}
              href={`/admin/kalender/ny?skabelon=${t.key}`}
              className="rounded-full border-2 border-ink px-3 py-1 text-sm font-bold hover:bg-cream"
              style={{ background: `color-mix(in srgb, ${t.color} 30%, white)` }}
            >
              {t.emoji} {t.title}
            </Link>
          ))}
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 pb-5 text-ink-soft">Ingen kommende events.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="px-4 py-2">Event</th>
                  <th className="px-4 py-2">Start</th>
                  <th className="px-4 py-2 text-right">Pris</th>
                  <th className="px-4 py-2 text-right">Pladser</th>
                  <th className="px-4 py-2 text-center">Kalender</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="text-xl font-bold">🎂 Runde fødselsdage</h2>
        <p className="text-sm text-ink-soft">
          Vises automatisk som forslag i kalenderen. Opret et rigtigt event, når du vil sælge pladser til en af dem.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {birthdays.map((b) => {
            const start = toLocalInput(new Date(b.date.getTime() + 6 * 3600_000)).slice(0, 10) + "T18:00";
            return (
              <li key={b.key} className="flex items-center justify-between gap-2 rounded-2xl bg-cream px-3 py-2">
                <span>
                  <span className="font-bold">
                    {b.emoji} {b.label}
                  </span>
                  <span className="block text-sm text-ink-soft">{formatDate(b.date, false)}</span>
                </span>
                <Link
                  href={`/admin/kalender/ny?skabelon=foedselsdag&start=${start}&titel=${encodeURIComponent(`Min ${b.label}`)}`}
                  className="btn btn-white !py-1 text-sm"
                >
                  Opret event
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {past.length > 0 && (
        <section className="card overflow-hidden">
          <h2 className="p-5 text-xl font-bold">Tidligere events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {past.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
