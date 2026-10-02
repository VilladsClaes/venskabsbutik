import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
  createTestimonial,
  deleteSampleTestimonials,
  deleteTestimonial,
  setTestimonialStatus,
} from "@/app/admin/actions";
import { AdminTitle, formatDate } from "@/components/admin-ui";
import { db, schema as s } from "@/db";
import { TESTIMONIAL_STATUSES, type TestimonialStatus } from "@/db/schema";

const LABEL: Record<TestimonialStatus, string> = { pending: "⏳ Venter", published: "✅ Vist", hidden: "🙈 Skjult" };

export default async function TestimonialsAdmin({ searchParams }: PageProps<"/admin/anmeldelser">) {
  const { status } = await searchParams;
  const filter = TESTIMONIAL_STATUSES.includes(status as TestimonialStatus) ? (status as TestimonialStatus) : undefined;
  const [list, products, [samples]] = await Promise.all([
    db.query.testimonials.findMany({
      where: filter ? eq(s.testimonials.status, filter) : undefined,
      orderBy: [
        asc(sql`case ${s.testimonials.status} when 'pending' then 0 else 1 end`),
        desc(s.testimonials.createdAt),
      ],
      with: { product: { columns: { name: true, emoji: true, slug: true } } },
    }),
    db.query.products.findMany({ columns: { id: true, name: true, emoji: true }, orderBy: asc(s.products.name) }),
    db.select({ n: sql<number>`count(*)` }).from(s.testimonials).where(eq(s.testimonials.isSample, true)),
  ]);
  const tab = (active: boolean) =>
    `rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${active ? "bg-ink text-white" : "bg-white"}`;

  return (
    <div className="space-y-6">
      <AdminTitle sub="Nye anmeldelser fra kunderne skal godkendes, før de vises">Anmeldelser 💬</AdminTitle>

      {Number(samples.n) > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3 bg-[#fff3b0] p-4">
          <p className="font-semibold">
            Der er {Number(samples.n)} eksempel-anmeldelser fra opsætningen. De er markeret med “eksempel” i
            butikken. Slet dem, når du har fået rigtige anmeldelser.
          </p>
          <form action={deleteSampleTestimonials}>
            <button className="btn btn-coral !py-1.5 text-sm">Slet alle eksempler</button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/anmeldelser" className={tab(!filter)}>
          Alle
        </Link>
        {TESTIMONIAL_STATUSES.map((st) => (
          <Link key={st} href={`/admin/anmeldelser?status=${st}`} className={tab(filter === st)}>
            {LABEL[st]}
          </Link>
        ))}
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {list.map((t) => (
          <li key={t.id} className={`card p-4 ${t.status === "pending" ? "ring-4 ring-sun" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-bold">
                {t.emoji} {t.authorName} · {"★".repeat(t.rating)}
                {t.isSample && <span className="ml-2 rounded-full bg-ink/10 px-2 text-xs">eksempel</span>}
              </span>
              <span className="text-ink-soft">{formatDate(t.createdAt, false)}</span>
            </div>
            <p className="mt-2">“{t.text}”</p>
            <p className="mt-1 text-sm text-ink-soft">
              {t.product ? `${t.product.emoji} ${t.product.name}` : "Generel"} · {LABEL[t.status]}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.status !== "published" && (
                <form action={setTestimonialStatus.bind(null, t.id, "published")}>
                  <button className="btn btn-mint !px-3 !py-1 text-sm">Vis</button>
                </form>
              )}
              {t.status !== "hidden" && (
                <form action={setTestimonialStatus.bind(null, t.id, "hidden")}>
                  <button className="btn btn-white !px-3 !py-1 text-sm">Skjul</button>
                </form>
              )}
              <form action={deleteTestimonial.bind(null, t.id)}>
                <button className="btn btn-white !px-3 !py-1 text-sm text-coral">Slet</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form action={createTestimonial} className="card max-w-2xl space-y-3 p-5">
        <h2 className="text-xl font-bold">Tilføj en anmeldelse, du har fået (fx på sms)</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_80px_80px]">
          <input name="authorName" className="input" placeholder="Navn" required />
          <input name="emoji" className="input text-center" defaultValue="😊" aria-label="Emoji" />
          <select name="rating" className="input" defaultValue="5" aria-label="Stjerner">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}★
              </option>
            ))}
          </select>
        </div>
        <select name="productId" className="input" aria-label="Produkt">
          <option value="">Generel (intet produkt)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
        <textarea name="text" className="input min-h-24" placeholder="Hvad sagde de?" required />
        <button className="btn btn-sun">Tilføj og vis</button>
      </form>
    </div>
  );
}
