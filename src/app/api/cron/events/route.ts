import { processEventDeadlines } from "@/lib/events";
import { sendAnniversaryReminders } from "@/lib/subscription-reminders";

// Kører hver morgen via Vercel Cron (se vercel.json): aflyser events uden nok tilmeldte ved
// fristen, sender betalingspåmindelser og giver abonnenter besked om ny pris på venskabsdagen.
// Siderne med events tjekker også selv løbende.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Ikke tilladt", { status: 401 });
  }
  await processEventDeadlines();
  // Fejler abonnementerne, skal eventfristerne stadig være kørt
  const anniversaries = await sendAnniversaryReminders().catch((e) => {
    console.error("Venskabsdags-påmindelser fejlede", e);
    return null;
  });
  return Response.json({ ok: true, anniversaries });
}
