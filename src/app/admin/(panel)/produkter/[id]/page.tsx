import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import type { ProductFormData } from "@/app/admin/actions";
import { AdminTitle } from "@/components/admin-ui";
import { ProductEditor } from "@/components/product-editor";
import { db, schema as s } from "@/db";
import { getCategories, getSoldCounts } from "@/lib/queries";

const EMPTY: ProductFormData = {
  slug: "",
  name: "",
  tagline: "Jeg ...",
  headline: "",
  summary: "",
  description: "",
  goodFor: [],
  finePrint: "",
  delivery: "",
  emoji: "😊",
  color: "#ffd23f",
  categoryId: null,
  priceKind: "fixed",
  price: 0,
  unitLabel: null,
  priceEndsWith: null,
  minPrice: null,
  recurringLabel: null,
  active: false,
  featured: false,
  sortOrder: 100,
  variants: [],
  media: [],
  questions: [],
};

export default async function EditProduct({ params }: PageProps<"/admin/produkter/[id]">) {
  const { id } = await params;
  const categories = await getCategories();

  let initial = EMPTY;
  let sold = 0;
  if (id !== "ny") {
    const p = await db.query.products.findFirst({
      where: eq(s.products.id, Number(id)),
      with: {
        variants: { orderBy: asc(s.productVariants.sortOrder) },
        media: { orderBy: asc(s.productMedia.sortOrder) },
        questions: { orderBy: asc(s.productQuestions.sortOrder) },
      },
    });
    if (!p) notFound();
    sold = (await getSoldCounts()).get(p.id) ?? 0;
    initial = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      headline: p.headline,
      summary: p.summary,
      description: p.description,
      goodFor: p.goodFor,
      finePrint: p.finePrint,
      delivery: p.delivery,
      emoji: p.emoji,
      color: p.color,
      categoryId: p.categoryId,
      priceKind: p.priceKind,
      price: p.price,
      unitLabel: p.unitLabel,
      priceEndsWith: p.priceEndsWith,
      minPrice: p.minPrice,
      recurringLabel: p.recurringLabel,
      active: p.active,
      featured: p.featured,
      sortOrder: p.sortOrder,
      variants: p.variants.map(({ id, name, price, active }) => ({ id, name, price, active })),
      media: p.media.map(({ id, kind, url, alt, caption, isExample }) => ({ id, kind, url, alt, caption, isExample })),
      questions: p.questions.map(({ id, label, kind, required }) => ({ id, label, kind, required })),
    };
  }

  return (
    <div>
      <Link href="/admin/produkter" className="font-semibold underline">
        ← Alle produkter
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <AdminTitle sub={initial.id ? `${sold} solgt` : "Nyt produkt starter som inaktivt"}>
          {initial.id ? `${initial.emoji} ${initial.name}` : "Nyt produkt ✨"}
        </AdminTitle>
        {initial.id && (
          <Link href={`/tjenester/${initial.slug}`} target="_blank" className="btn btn-white">
            Se i butikken ↗
          </Link>
        )}
      </div>
      <ProductEditor key={initial.id ?? "ny"} initial={initial} categories={categories} />
    </div>
  );
}
