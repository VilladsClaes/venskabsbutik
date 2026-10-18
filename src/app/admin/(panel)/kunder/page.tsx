import Link from "next/link";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { createArchivePerson } from "@/app/admin/actions";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { LifeTimeline } from "@/components/life-timeline";
import { db, schema as s } from "@/db";
import { RELATION_KINDS } from "@/db/schema";
import { activeSpan, RELATION_INFO, villadsAge, type Period } from "@/lib/life-archive";
import { formatKr } from "@/lib/money";
import { SOLD_STATUSES } from "@/lib/queries";

const VIEWS = [
  { key: "alle", label: "Alle" },
  { key: "butik", label: "🛒 Butikskunder" },
  { key: "arkiv", label: "📔 Venne-arkivet" },
] as const;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/kunder">) {
  const { vis } = await searchParams;
  const view = VIEWS.find((v) => v.key === vis)?.key ?? "alle";

  const rows = await db
    .select({
      id: s.customers.id,
      name: s.customers.name,
      nickname: s.customers.nickname,
      email: s.customers.email,
      phone: s.customers.phone,
      origin: s.customers.origin,
      relation: s.customers.relation,
      orders: sql<number>`count(${s.orders.id})`,
      spent: sql<number>`coalesce(sum(case when ${inArray(s.orders.status, [...SOLD_STATUSES])} then ${s.orders.total} end), 0)`,
      lastOrder: sql<number | null>`max(${s.orders.createdAt})`,
    })
    .from(s.customers)
    .leftJoin(s.orders, eq(s.orders.customerId, s.customers.id))
    .where(view === "alle" ? undefined : eq(s.customers.origin, view))
    .groupBy(s.customers.id)
    .orderBy(desc(sql`max(${s.orders.createdAt})`), asc(s.customers.name));

  const periods = await db.select().from(s.friendPeriods);
  const byCustomer = new Map<number, Period[]>();
  for (const p of periods) byCustomer.set(p.customerId, [...(byCustomer.get(p.customerId) ?? []), p]);
  const nowAge = villadsAge();

  return (
    <div className="space-y-6">
      <AdminTitle
        sub={
          <>
            {rows.length} venner ·{" "}
            <Link href="/admin/vaev" className="font-semibold underline">
              Se Livets væv 🧶
            </Link>
          </>
        }
      >
        Kunder 🤝
      </AdminTitle>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <nav className="flex flex-wrap gap-2" aria-label="Vis kunder">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={v.key === "alle" ? "/admin/kunder" : `/admin/kunder?vis=${v.key}`}
              className={`rounded-full border-2 border-ink px-3 py-1 font-semibold ${view === v.key ? "bg-ink text-white" : "bg-white"}`}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <form action={createArchivePerson} className="grid w-full gap-2 sm:w-auto sm:grid-cols-[11rem_10rem_auto]">
          <input name="name" required placeholder="Navn" className="input" aria-label="Navn" />
          <select name="relation" className="input" aria-label="Relation" defaultValue="">
            <option value="">Relation …</option>
            {RELATION_KINDS.map((r) => (
              <option key={r} value={r}>
                {RELATION_INFO[r].emoji} {RELATION_INFO[r].label}
              </option>
            ))}
          </select>
          <button className="btn btn-sun">+ Føj til arkivet</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="px-4 py-2">Navn</th>
              <th className="min-w-56 px-4 py-2">I mit liv (0–100 år)</th>
              <th className="px-4 py-2">Kontakt</th>
              <th className="px-4 py-2 text-right">Ordrer</th>
              <th className="px-4 py-2 text-right">Købt for</th>
              <th className="px-4 py-2">Seneste ordre</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">
                  Ingen kunder endnu 🌱
                </td>
              </tr>
            )}
            {rows.map((c, i) => {
              const rel = c.relation ? RELATION_INFO[c.relation] : RELATION_INFO.andet;
              const ps = byCustomer.get(c.id) ?? [];
              return (
                <tr key={c.id} className={i % 2 ? "bg-cream/60" : "bg-white"}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/kunder/${c.id}`} className="font-bold underline">
                      {c.name}
                    </Link>
                    {c.nickname && <span className="text-ink-soft"> ({c.nickname})</span>}
                    <span className="block text-xs text-ink-soft">
                      {c.relation ? `${rel.emoji} ${rel.label}` : c.origin === "butik" ? "🛒 Butik" : "📔 Arkiv"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {ps.length > 0 ? (
                      <>
                        <LifeTimeline periods={ps} color={rel.color} nowAge={nowAge} compact label={`${c.name}: ${activeSpan(ps)}`} />
                        <span className="text-xs text-ink-soft">{activeSpan(ps)}</span>
                      </>
                    ) : (
                      <span className="text-ink-soft">–</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {c.email && <span className="block">{c.email}</span>}
                    {c.phone && <span className="block">{c.phone}</span>}
                  </td>
                  <td className="px-4 py-2 text-right font-bold">{Number(c.orders)}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right font-display font-bold">
                    {formatKr(Number(c.spent))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {c.lastOrder ? formatDate(new Date(Number(c.lastOrder) * 1000), false) : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
