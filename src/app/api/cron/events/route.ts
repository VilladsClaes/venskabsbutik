import { processEventDeadlines } from "@/lib/events";

// Kører hver morgen via Vercel Cron (se vercel.json): aflyser events uden nok tilmeldte ved
// fristen og sender betalingspåmindelser. Siderne med events tjekker også selv løbende.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Ikke tilladt", { status: 401 });
  }
  await processEventDeadlines();
  return Response.json({ ok: true });
}
