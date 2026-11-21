import { desc } from "drizzle-orm";
import { setSubscriptionStatus } from "@/app/admin/actions";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { formatDuration, formatMonthly, monthsBetween, nextPriceDrop, tierFor } from "@/lib/subscription";

const METHOD: Record<string, string> = {
  bank: "🏦 Netbank",
  mobilepay: "💙 MobilePay",
  paypal: "🅿️ PayPal",
  buymeacoffee: "☕ Buy Me a Coffee",
};

export default async function SubscriptionsAdmin() {
  const subs = await db.query.friendshipSubscriptions.findMany({ orderBy: desc(s.friendshipSubscriptions.createdAt) });
  const now = new Date();
  const rows = subs.map((sub) => ({ ...sub, tier: tierFor(sub.friendsSince, now) }));
  const active = rows.filter((r) => r.status === "aktiv");
  const income = active.filter((r) => r.tier.price > 0).reduce((sum, r) => sum + r.tier.price, 0);
  const owed = active.filter((r) => r.tier.price < 0).reduce((sum, r) => sum - r.tier.price, 0);

  return (
    <div className="space-y-6">
      <AdminTitle sub="Prisen falder automatisk på venskabsdagen, og abonnenten får en mail om det">
        Abonnementer 📉
      </AdminTitle>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm font-bold text-ink-soft">Aktive abonnenter</p>
          <p className="font-display text-3xl font-bold">{active.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-bold text-ink-soft">Du får pr. måned</p>
          <p className="font-display text-3xl font-bold">{formatMonthly(income)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-bold text-ink-soft">Du skal betale pr. måned</p>
          <p className={`font-display text-3xl font-bold ${owed ? "text-coral" : ""}`}>{formatMonthly(owed)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="card p-6 text-lg">Ingen abonnenter endnu. Del linket til /abonnement med dine venner.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-3 py-2">Ven</th>
                <th className="px-3 py-2">Venner i</th>
                <th className="px-3 py-2">Trin</th>
                <th className="px-3 py-2 text-right">Pris/md.</th>
                <th className="px-3 py-2">Næste prisfald</th>
                <th className="px-3 py-2">Betaler med</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`${i % 2 ? "bg-cream" : "bg-white"} ${r.status === "opsagt" ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2">
                    <p className="font-bold">{r.name}</p>
                    <p className="text-ink-soft">
                      {r.email}
                      {r.phone && ` · ${r.phone}`}
                    </p>
                    {r.note && <p className="mt-1 italic">“{r.note}”</p>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDuration(monthsBetween(r.friendsSince, now))}
                    <p className="text-ink-soft">siden {formatDate(r.friendsSince, false)}</p>
                  </td>
                  <td className="px-3 py-2">
                    {r.tier.emoji} {r.tier.name}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2 text-right font-display font-bold ${r.tier.price < 0 ? "text-coral" : ""}`}>
                    {formatMonthly(r.tier.price)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(nextPriceDrop(r.friendsSince, now), false)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{METHOD[r.method] ?? r.method}</td>
                  <td className="px-3 py-2">
                    <form action={setSubscriptionStatus.bind(null, r.id, r.status === "aktiv" ? "opsagt" : "aktiv")}>
                      <button className="btn btn-white !px-2.5 !py-1 text-xs">
                        {r.status === "aktiv" ? "✅ Aktiv – opsig" : "⏸️ Opsagt – genaktivér"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
