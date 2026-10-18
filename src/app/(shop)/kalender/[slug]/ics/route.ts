import { buildIcs, eventUrl } from "@/lib/calendar/ics";
import { getEventBySlug } from "@/lib/events";

// "Gem datoen" som .ics-fil – virker i Apple Kalender, Outlook, Google og alle andre
export async function GET(_req: Request, ctx: RouteContext<"/kalender/[slug]/ics">) {
  const { slug } = await ctx.params;
  const e = await getEventBySlug(slug);
  if (!e) return new Response("Eventet findes ikke", { status: 404 });
  const ics = buildIcs({
    uid: `event-${e.id}`,
    title: `${e.emoji} ${e.title}`,
    description: e.summary,
    location: e.location,
    start: e.startsAt,
    end: e.endsAt,
    url: eventUrl(e.slug),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
