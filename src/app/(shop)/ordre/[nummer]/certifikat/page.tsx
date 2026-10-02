import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PrintButton } from "@/components/print-button";
import { Sun } from "@/components/sky";
import { db, schema as s } from "@/db";
import { SOLD_STATUSES } from "@/lib/queries";
import { safeEqual } from "@/lib/tokens";

export const metadata: Metadata = { title: "Venskabscertifikat", robots: { index: false } };

export default async function CertificatePage({ params, searchParams }: PageProps<"/ordre/[nummer]/certifikat">) {
  const { nummer } = await params;
  const { k } = await searchParams;
  const order = await db.query.orders.findFirst({
    where: eq(s.orders.orderNumber, decodeURIComponent(nummer)),
    with: { customer: { columns: { name: true } }, items: true },
  });
  if (!order || !safeEqual(k, order.accessToken)) notFound();
  const paid = (SOLD_STATUSES as readonly string[]).includes(order.status);
  const holder = order.isGift && order.giftRecipient ? order.giftRecipient : order.customer.name;
  const date = (order.paidAt ?? order.createdAt).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 print:p-0">
      <style>{`@media print { header, footer, [role=status], .no-print { display:none !important } body { background:#fff } @page { size: A4 landscape; margin: 10mm } }`}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-ink-soft">Tip: Vælg “Gem som PDF” i udskriftsvinduet for at få det som PDF.</p>
        <PrintButton />
      </div>
      {!paid && (
        <p className="no-print mb-4 rounded-2xl border-2 border-ink bg-sun p-3 text-center font-bold">
          ⏳ Certifikatet bliver gyldigt, når betalingen er modtaget.
        </p>
      )}
      <article className="relative aspect-[1.414] overflow-hidden rounded-[2rem] border-[10px] border-double border-ink bg-[#fffdf5] p-10 text-center shadow-[0_10px_0_0_#2b2d42] print:shadow-none">
        <div className="absolute inset-4 rounded-[1.4rem] border-[3px] border-dashed border-sun-deep" aria-hidden="true" />
        <Sun size={110} className="absolute left-8 top-8" />
        <span className="absolute right-10 top-10 text-6xl" aria-hidden="true">🌈</span>
        <div className="relative flex h-full flex-col items-center justify-center">
          <p className="font-display text-lg font-semibold uppercase tracking-[0.3em] text-coral">Officielt</p>
          <h1 className="mt-1 text-5xl font-bold sm:text-6xl">Venskabscertifikat</h1>
          <p className="mt-6 text-lg">Hermed bekræftes det, at</p>
          <p className="mt-2 font-display text-5xl font-bold text-ocean">{holder}</p>
          <p className="mt-4 max-w-xl text-lg">er en ægte ven af Villads Claes og har erhvervet følgende venskabsfragmenter:</p>
          <p className="mt-3 max-w-2xl font-display text-xl font-bold">
            {order.items.map((i) => i.productName).join(" · ")}
          </p>
          <div className="mt-10 flex w-full max-w-2xl items-end justify-between gap-6 text-left">
            <div>
              <p className="font-display text-2xl" style={{ fontFamily: "cursive" }}>
                Villads Claes
              </p>
              <p className="border-t-2 border-ink pt-1 text-sm">Underskrift, din ven</p>
            </div>
            <div className="grid h-24 w-24 rotate-12 place-items-center rounded-full border-[4px] border-coral text-center font-display text-xs font-bold leading-tight text-coral">
              GODKENDT
              <br />
              VEN
              <br />✓
            </div>
            <div className="text-right">
              <p className="font-display text-xl">{date}</p>
              <p className="border-t-2 border-ink pt-1 text-sm">Certifikat nr. {order.orderNumber}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
