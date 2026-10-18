import { cookies } from "next/headers";
import { CALENDAR_PROVIDERS, type CalendarProvider } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { PROVIDERS, redirectUri, saveConnection, STATE_COOKIE } from "@/lib/calendar";
import { safeEqual } from "@/lib/tokens";

const backTo = (req: Request) => (msg: string) =>
  Response.redirect(new URL(`/admin/kalender?besked=${encodeURIComponent(msg)}`, req.url));

// Google/Microsoft sender Villads tilbage hertil med en engangskode, som byttes til en varig nøgle
export async function GET(req: Request, ctx: RouteContext<"/api/kalender/[provider]/callback">) {
  if (!(await isAdmin())) return new Response("Kun for admin", { status: 401 });
  const { provider } = await ctx.params;
  if (!CALENDAR_PROVIDERS.includes(provider as CalendarProvider)) return new Response("Ukendt kalender", { status: 404 });
  const p = provider as CalendarProvider;
  const back = backTo(req);

  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  jar.delete({ name: STATE_COOKIE, path: "/api/kalender" });
  if (url.searchParams.get("error")) return back(`Afbrudt: ${url.searchParams.get("error_description") ?? url.searchParams.get("error")}`);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code");
  if (!code || !safeEqual(`${p}:${state}`, expected)) return back("Login udløb eller passede ikke – prøv igen");

  try {
    const tokens = await PROVIDERS[p].exchangeCode(code, redirectUri(p));
    await saveConnection(p, tokens);
  } catch (e) {
    console.error("Kalender-tilslutning fejlede", e);
    return back(`Kunne ikke tilslutte ${PROVIDERS[p].label}: ${String(e).slice(0, 160)}`);
  }
  return back(`${PROVIDERS[p].label} er tilsluttet ✅`);
}
