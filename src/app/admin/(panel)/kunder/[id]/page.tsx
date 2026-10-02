import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { saveCustomer } from "@/app/admin/actions";
import { AdminTitle, formatDate, OrderTable } from "@/components/admin-ui";
import { db, schema as s } from "@/db";

export default async function CustomerDetail({ params }: PageProps<"/admin/kunder/[id]">) {
  const { id } = await params;
  const c = await db.query.customers.findFirst({
    where: eq(s.customers.id, Number(id)),
    with: { orders: { orderBy: desc(s.orders.createdAt) } },
  });
  if (!c) notFound();
  const orders = c.orders.map((o) => ({ ...o, customer: { name: c.name } }));
  const fields = [
    ["name", "Navn", c.name],
    ["email", "E-mail", c.email ?? ""],
    ["phone", "Telefon", c.phone ?? ""],
    ["nickname", "Dæknavn", c.nickname ?? ""],
  ] as const;

  return (
    <div className="space-y-6">
      <Link href="/admin/kunder" className="font-semibold underline">
        ← Alle kunder
      </Link>
      <AdminTitle sub={`Kunde siden ${formatDate(c.createdAt, false)}`}>{c.name}</AdminTitle>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <form action={saveCustomer.bind(null, c.id)} className="card space-y-3 p-5">
          <h2 className="text-xl font-bold">Oplysninger</h2>
          {fields.map(([name, label, value]) => (
            <label key={name} className="block text-sm font-bold">
              {label}
              <input name={name} defaultValue={value} className="input mt-1" />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="allowMention"
              defaultChecked={c.allowMention}
              className="h-4 w-4 accent-coral"
            />
            Må nævnes med fornavn/dæknavn
          </label>
          <label className="block text-sm font-bold">
            Noter
            <textarea name="notes" defaultValue={c.notes} className="input mt-1 min-h-28" />
          </label>
          <button className="btn btn-sun">Gem</button>
        </form>
        <section className="card overflow-hidden">
          <h2 className="p-5 text-xl font-bold">Ordrer ({orders.length})</h2>
          <OrderTable orders={orders} />
        </section>
      </div>
    </div>
  );
}
