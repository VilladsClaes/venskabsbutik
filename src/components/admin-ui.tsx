import Link from "next/link";
import type { OrderStatus } from "@/db/schema";
import { formatKr } from "@/lib/money";
import { STATUS_INFO } from "@/lib/order-status";
import { METHOD_INFO } from "@/lib/payments";
import type { PaymentMethod } from "@/db/schema";

export function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS_INFO[status];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink px-2.5 py-0.5 text-sm font-bold"
      style={{ background: s.color }}
    >
      <span aria-hidden="true">{s.emoji}</span> {s.label}
    </span>
  );
}

export function AdminTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold">{children}</h1>
      {sub && <p className="mt-1 text-ink-soft">{sub}</p>}
    </div>
  );
}

export function formatDate(d: Date | null | undefined, withTime = true) {
  if (!d) return "–";
  return d.toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function OrderTable({
  orders,
}: {
  orders: {
    id: number;
    orderNumber: string;
    status: Parameters<typeof StatusPill>[0]["status"];
    total: number;
    createdAt: Date;
    paymentMethod?: PaymentMethod;
    customer: { name: string };
  }[];
}) {
  if (orders.length === 0) return <p className="px-5 pb-5 text-ink-soft">Ingen ordrer endnu.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink text-white">
          <tr>
            <th className="px-4 py-2">Ordre</th>
            <th className="px-4 py-2">Kunde</th>
            <th className="px-4 py-2">Dato</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Beløb</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.id} className={i % 2 ? "bg-cream/60" : "bg-white"}>
              <td className="px-4 py-2 font-bold">
                <Link href={`/admin/ordrer/${o.id}`} className="underline">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-2">{o.customer.name}</td>
              <td className="whitespace-nowrap px-4 py-2">{formatDate(o.createdAt)}</td>
              <td className="px-4 py-2">
                <StatusPill status={o.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-display font-bold">
                {o.paymentMethod && (
                  <span className="mr-1" title={METHOD_INFO[o.paymentMethod].label}>
                    {METHOD_INFO[o.paymentMethod].emoji}
                  </span>
                )}
                {formatKr(o.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
