import { getInsight, insightExport } from "@/lib/insight";

/** Personens egne data som JSON-fil (dataportabilitet, GDPR art. 20) */
export async function GET(_req: Request, ctx: RouteContext<"/vores-venskab/[token]/data">) {
  const { token } = await ctx.params;
  const c = await getInsight(token);
  if (!c) return new Response("Ikke fundet", { status: 404 });
  const slug = c.name.toLowerCase().replace(/[^a-z0-9æøå]+/g, "-").replace(/^-|-$/g, "") || "mine-data";
  return new Response(JSON.stringify(insightExport(c), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vores-venskab-${encodeURIComponent(slug)}.json"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
