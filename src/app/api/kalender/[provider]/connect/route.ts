import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { CALENDAR_PROVIDERS, type CalendarProvider } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { PROVIDERS, redirectUri, STATE_COOKIE } from "@/lib/calendar";

// Sender Villads videre til Google/Microsoft for at give adgang til kalenderen
export async function GET(_req: Request, ctx: RouteContext<"/api/kalender/[provider]/connect">) {
  if (!(await isAdmin())) return new Response("Kun for admin", { status: 401 });
  const { provider } = await ctx.params;
  if (!CALENDAR_PROVIDERS.includes(provider as CalendarProvider)) return new Response("Ukendt kalender", { status: 404 });
  const api = PROVIDERS[provider as CalendarProvider];
  if (!api.configured()) return new Response(`${api.label} er ikke sat op – se README`, { status: 400 });

  const state = randomBytes(18).toString("base64url");
  (await cookies()).set(STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/kalender",
    maxAge: 600,
  });
  return Response.redirect(api.authUrl(state, redirectUri(provider as CalendarProvider)));
}
