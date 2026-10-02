import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { deleteDelivery, type DeliveryFormData } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { DeliveryEditor } from "@/components/delivery-editor";
import { db, schema as s } from "@/db";
import { toLocalInput } from "@/lib/dates";

export default async function EditDelivery({ params, searchParams }: PageProps<"/admin/leverancer/[id]">) {
  const { id } = await params;
  const { produkt, ordre } = await searchParams;

  const [products, orders] = await Promise.all([
    db.query.products.findMany({ columns: { id: true, name: true, emoji: true, slug: true }, orderBy: asc(s.products.name) }),
    db.query.orders.findMany({
      orderBy: desc(s.orders.createdAt),
      limit: 150,
      columns: { id: true, orderNumber: true },
      with: { customer: { columns: { name: true, nickname: true, allowMention: true } } },
    }),
  ]);

  let initial: DeliveryFormData = {
    productId: typeof produkt === "string" ? Number(produkt) || null : null,
    orderId: typeof ordre === "string" ? Number(ordre) || null : null,
    title: "",
    note: "",
    dedicatedTo: null,
    placeName: null,
    lat: null,
    lng: null,
    photoUrl: null,
    amount: null,
    deliveredAt: toLocalInput(new Date()),
    isPublic: true,
  };
  if (id !== "ny") {
    const d = await db.query.deliveries.findFirst({ where: eq(s.deliveries.id, Number(id)) });
    if (!d) notFound();
    initial = {
      id: d.id,
      productId: d.productId,
      orderId: d.orderId,
      title: d.title,
      note: d.note,
      dedicatedTo: d.dedicatedTo,
      placeName: d.placeName,
      lat: d.lat,
      lng: d.lng,
      photoUrl: d.photoUrl,
      amount: d.amount,
      deliveredAt: toLocalInput(d.deliveredAt),
      isPublic: d.isPublic,
    };
  }

  return (
    <div>
      <Link href="/admin/leverancer" className="font-semibold underline">
        ← Leveringsdagbog
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <AdminTitle>{initial.id ? initial.title : "Ny levering ✨"}</AdminTitle>
        {initial.id && (
          <form action={deleteDelivery.bind(null, initial.id)}>
            <button className="btn btn-white text-coral">Slet</button>
          </form>
        )}
      </div>
      <DeliveryEditor
        key={initial.id ?? "ny"}
        initial={initial}
        products={products}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customer.name,
          mention: o.customer.allowMention ? o.customer.nickname || o.customer.name.split(" ")[0] : null,
        }))}
      />
    </div>
  );
}
