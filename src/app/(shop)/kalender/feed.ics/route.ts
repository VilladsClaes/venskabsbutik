import { buildIcsFeed, eventUrl } from "@/lib/calendar/ics";
import { getUpcomingEvents } from "@/lib/events";

// Abonnementskalender med alle offentlige events. Outlook, Apple og Google henter den
// selv igen med jævne mellemrum, så nye og flyttede events kommer automatisk med.
export async function GET() {
  const since = new Date(Date.now() - 30 * 86400_000);
  const events = await getUpcomingEvents(since);
  const ics = buildIcsFeed(
    events.map((e) => ({
      uid: `event-${e.id}`,
      title: `${e.emoji} ${e.title}`,
      description: e.summary,
      location: e.location,
      start: e.startsAt,
      end: e.endsAt,
      url: eventUrl(e.slug),
    })),
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
