import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventSignup } from "@/components/event-signup";
import { ExperienceHero } from "@/components/experience-bits";
import { Countdown } from "@/components/live-numbers";
import { MapView } from "@/components/map-view";
import { ShareBar } from "@/components/share";
import { eventUrl, googleAddLink, outlookAddLink } from "@/lib/calendar/ics";
import { formatEventTime, getEventBySlug } from "@/lib/events";
import { formatKr } from "@/lib/money";
import { getPaymentConfig } from "@/lib/payments";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/kalender/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) return {};
  return {
    title: `${e.title} – ${formatEventTime(e.startsAt, e.endsAt)}`,
    description: e.summary || `Kom med til ${e.title} med Villads.`,
    alternates: { canonical: eventUrl(e.slug) },
    openGraph: { title: `${e.emoji} ${e.title}`, description: e.summary, url: eventUrl(e.slug), type: "website" },
  };
}

export default async function EventPage({ params }: PageProps<"/kalender/[slug]">) {
  const { slug } = await params;
  const [event, settings] = await Promise.all([getEventBySlug(slug), getSettings()]);
  if (!event) notFound();
  const payCfg = getPaymentConfig(settings);
  const started = event.startsAt < new Date();
  const when = formatEventTime(event.startsAt, event.endsAt);
  const cal = {
    title: `${event.emoji} ${event.title}`,
    description: event.summary,
    location: event.location,
    start: event.startsAt,
    end: event.endsAt,
    url: eventUrl(event.slug),
  };

  // Strukturerede data, så Google kan vise eventet i søgeresultaterne
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.location ? { location: { "@type": "Place", name: event.location, address: event.location } } : {}),
    organizer: { "@type": "Person", name: "Villads Claes" },
    offers: {
      "@type": "Offer",
      price: (event.price / 100).toFixed(2),
      priceCurrency: "DKK",
      url: eventUrl(event.slug),
      availability: event.seatsLeft === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ExperienceHero emoji={event.emoji} title={event.title} color={event.color} back={{ href: "/kalender", label: "← Hele kalenderen" }}>
        <span className="first-letter:uppercase">{when}</span>
        {event.location && <span className="block">📍 {event.location}</span>}
      </ExperienceHero>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold">{event.price ? formatKr(event.price) : "Gratis"}</p>
              <p className="text-sm font-semibold text-ink-soft">pr. plads</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold">{event.seatsLeft ?? "∞"}</p>
              <p className="text-sm font-semibold text-ink-soft">pladser tilbage</p>
            </div>
            {event.product && (
              <Link href={`/tjenester/${event.product.slug}`} className="card col-span-2 p-4 text-center hover:bg-cream sm:col-span-1">
                <p className="font-display text-2xl" aria-hidden="true">{event.product.emoji}</p>
                <p className="text-sm font-semibold underline">{event.product.name}</p>
              </Link>
            )}
          </div>
          {!started && (
            <div className="card bg-sun p-5 text-center">
              <p className="font-display font-semibold">Der er</p>
              <Countdown to={event.startsAt.toISOString()} />
            </div>
          )}
          {event.summary && <p className="text-xl font-semibold">{event.summary}</p>}
          {event.description && <div className="whitespace-pre-line text-lg leading-relaxed">{event.description}</div>}
          {event.routeGeojson && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">Ruten 🗺️</h2>
              <MapView routes={[{ id: event.slug, name: event.title, color: event.color, geojson: event.routeGeojson }]} className="h-[420px]" />
              <p className="mt-2 text-sm">
                Ruten ligger også på{" "}
                <Link href="/oplevelser/ruterne" className="font-bold underline">
                  rutekortet
                </Link>
                .
              </p>
            </section>
          )}
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="self-center">Gem datoen:</span>
            <a className="btn btn-white !py-1.5 text-sm" href={googleAddLink(cal)} target="_blank" rel="noopener">
              Google
            </a>
            <a className="btn btn-white !py-1.5 text-sm" href={outlookAddLink(cal)} target="_blank" rel="noopener">
              Outlook
            </a>
            <a className="btn btn-white !py-1.5 text-sm" href={`/kalender/${event.slug}/ics`}>
              Apple / .ics
            </a>
          </div>
          <ShareBar url={eventUrl(event.slug)} title={`${event.emoji} ${event.title}`} text={event.summary || `Kom med til ${event.title}!`} />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          {started ? (
            <div className="card bg-cream p-6 text-center font-display text-xl font-bold">Eventet er gået i gang 🎉</div>
          ) : (
            <EventSignup
              event={{ id: event.id, title: event.title, price: event.price, seatsLeft: event.seatsLeft }}
              methods={payCfg.enabled}
              coins={payCfg.wallets.map((w) => ({ coin: w.coin, network: w.network }))}
            />
          )}
        </div>
      </div>
    </>
  );
}
