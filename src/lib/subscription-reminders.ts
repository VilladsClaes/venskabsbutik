import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { button, esc, layout, send } from "./email";
import { SITE_URL } from "./site";
import { formatMonthly, LAST_TIER, TIERS } from "./subscription";

/**
 * Kører hver morgen: på venskabsdagen får abonnenten besked om den nye (lavere) pris,
 * så den faste overførsel kan rettes. Når venskabet bliver rentabelt, får jeg også besked.
 */
export async function sendAnniversaryReminders(now = new Date()) {
  const subs = await db.query.friendshipSubscriptions.findMany({
    where: eq(s.friendshipSubscriptions.status, "aktiv"),
  });
  const settings = Object.fromEntries((await db.select().from(s.settings)).map((r) => [r.key, r.value]));
  let sent = 0;
  for (const sub of subs) {
    const since = sub.friendsSince;
    if (since.getMonth() !== now.getMonth() || since.getDate() !== now.getDate()) continue;
    const years = now.getFullYear() - since.getFullYear();
    // Kun når prisen faktisk skifter (år 2 til og med det rentable trin)
    if (years < 1 || years + 1 > LAST_TIER.year) continue;
    const tier = TIERS[years];
    const before = TIERS[years - 1];
    const first = esc(sub.name.split(" ")[0]);
    const refund = tier.price < 0;
    await send(
      sub.email,
      refund ? "Tillykke – vores venskab er nu rentabelt 📈" : `Tillykke med ${years} års venskab 🎂 Din pris falder`,
      layout(
        `Tillykke med de ${years} år, ${first}! ${tier.emoji}`,
        `<p>Du rykker op på trinnet <b>${esc(tier.name)}</b>: ${esc(tier.tagline)}</p>
        <p>Din månedspris går fra <b>${formatMonthly(before.price)}</b> til <b>${formatMonthly(tier.price)}</b>.</p>
        ${
          refund
            ? "<p>Du skal stoppe din faste overførsel. Fra nu af er det mig, der betaler dig 5 kr. om måneden. 🥲</p>"
            : tier.price === 0
              ? "<p>Du kan stoppe din faste overførsel – venskabet er gratis i år.</p>"
              : "<p>Husk at rette beløbet på din faste overførsel.</p>"
        }
        <p>Nye fordele i år:</p><ul>${tier.perks.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        ${button(`${SITE_URL}/abonnement`, "Se dit abonnement")}`,
      ),
    );
    if (refund && settings.contactEmail)
      await send(
        settings.contactEmail,
        `Du skal nu betale ${sub.name} 5 kr. om måneden`,
        layout(
          "Et venskab er blevet rentabelt 📈",
          `<p>${esc(sub.name)} har været din ven i ${years} år. Opret en fast overførsel på 5 kr./md.</p>
          <p>${esc(sub.email)} ${sub.phone ? esc(sub.phone) : ""}</p>`,
        ),
      );
    sent++;
  }
  return sent;
}
