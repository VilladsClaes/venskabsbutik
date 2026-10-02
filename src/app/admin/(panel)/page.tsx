import Link from "next/link";
import { AdminTitle, OrderTable } from "@/components/admin-ui";
import { getDashboard } from "@/lib/admin-queries";
import { formatKr } from "@/lib/money";

function Tile({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

export default async function Dashboard() {
  const d = await getDashboard();
  const maxMonth = Math.max(1, ...d.months.map((m) => m.revenue));
  const maxTop = Math.max(1, ...d.topProducts.map((t) => t.revenue));

  return (
    <div className="space-y-8">
      <AdminTitle sub="Sådan går det med venskaberne">Overblik 📊</AdminTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Omsætning i alt" value={formatKr(d.revenue)} sub={`${d.orders} betalte ordrer`} />
        <Tile label="Denne måned" value={formatKr(d.monthRevenue)} sub={`${d.monthOrders} ordrer`} />
        <Tile
          label="Afventer betaling"
          value={String(d.pendingOrders)}
          sub={`${formatKr(d.pendingAmount)} udestående`}
          href="/admin/ordrer?status=afventer_betaling"
        />
        <Tile
          label="Kunder"
          value={String(d.customers)}
          sub={d.pendingReviews ? `${d.pendingReviews} anmeldelser venter` : "Ingen anmeldelser venter"}
          href={d.pendingReviews ? "/admin/anmeldelser?status=pending" : "/admin/kunder"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="pr-maaned">
          <h2 id="pr-maaned" className="text-xl font-bold">
            Omsætning pr. måned
          </h2>
          <div className="mt-6 flex h-48 items-end gap-3 border-b-2 border-ink/15" aria-hidden="true">
            {d.months.map((m) => (
              <div key={m.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-[4px] bg-ocean transition group-hover:brightness-110"
                  style={{ height: `${(m.revenue / maxMonth) * 100}%`, minHeight: m.revenue ? 4 : 0 }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-semibold text-white group-hover:block">
                  {formatKr(m.revenue)} · {m.n} ordrer
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-center text-xs font-semibold text-ink-soft" aria-hidden="true">
            {d.months.map((m) => (
              <span key={m.key} className="flex-1">
                {m.label}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>Omsætning pr. måned</caption>
            <tbody>
              {d.months.map((m) => (
                <tr key={m.key}>
                  <th>{m.label}</th>
                  <td>{formatKr(m.revenue)}</td>
                  <td>{m.n} ordrer</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-bold">Mest solgte tjenester</h2>
          {d.topProducts.length === 0 ? (
            <p className="mt-4 text-ink-soft">Ingen betalte ordrer endnu. Snart! 🌱</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {d.topProducts.map((t) => (
                <li key={`${t.productId}-${t.name}`}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{t.name}</span>
                    <span>
                      {formatKr(t.revenue)} <span className="text-ink-soft">· {t.qty} stk.</span>
                    </span>
                  </div>
                  <div className="mt-1 h-3 rounded-[4px] bg-ink/5">
                    <div className="h-3 rounded-[4px] bg-ocean" style={{ width: `${(t.revenue / maxTop) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-xl font-bold">Seneste ordrer</h2>
          <Link href="/admin/ordrer" className="font-semibold underline">
            Alle ordrer →
          </Link>
        </div>
        <OrderTable orders={d.recent} />
      </section>
    </div>
  );
}
