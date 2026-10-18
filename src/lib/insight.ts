import { asc, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/**
 * Alt butikken har gemt om én person – det de har ret til at se og tage med sig (GDPR art. 15 og 20).
 * Kun hemmelige nøgler og rent tekniske felter er udeladt; noter og betragtninger er med.
 */
export async function getInsight(token: string) {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) return null;
  const c = await db.query.customers.findFirst({
    where: eq(s.customers.insightToken, token),
    with: {
      periods: { orderBy: asc(s.friendPeriods.fromAge) },
      interactions: { orderBy: asc(s.interactions.date) },
      yearNotes: { orderBy: asc(s.yearNotes.year) },
      orders: {
        orderBy: desc(s.orders.createdAt),
        columns: {
          orderNumber: true,
          status: true,
          paymentMethod: true,
          total: true,
          customerNote: true,
          isGift: true,
          giftRecipient: true,
          giftMessage: true,
          adminNote: true,
          paidAt: true,
          deliveredAt: true,
          createdAt: true,
        },
        with: {
          items: { columns: { productName: true, variantName: true, unitPrice: true, quantity: true, lineTotal: true, answers: true } },
        },
      },
    },
  });
  if (!c) return null;
  return c;
}

export type Insight = NonNullable<Awaited<ReturnType<typeof getInsight>>>;

/** Maskinlæsbar udgave til download */
export function insightExport(c: Insight) {
  return {
    eksporteret: new Date().toISOString(),
    dataansvarlig: "Villads Claes · Venskabsbutikken",
    forklaring:
      "Alle oplysninger Venskabsbutikken har om dig. Perioder er angivet i Villads' alder. Datoer for øjeblikke kan være upræcise (år eller måned).",
    person: {
      navn: c.name,
      email: c.email,
      telefon: c.phone,
      daeknavn: c.nickname,
      maaNaevnes: c.allowMention,
      relation: c.relation,
      foedselsaar: c.birthYear,
      saadanMoedtesVi: c.howWeMet,
      hvadVilladsVedOmDig: c.aboutThem,
      detViHarSammen: c.together,
      noter: c.notes,
      oprettet: c.createdAt,
      opdateret: c.updatedAt,
    },
    perioder: c.periods.map((p) => ({ fraAlder: p.fromAge, tilAlder: p.toAge, intensitet: p.intensity, beskrivelse: p.label })),
    oejeblikke: c.interactions.map((i) => ({ dato: i.date, type: i.kind, overskrift: i.title, tekst: i.body, kilde: i.source })),
    aaretsGangHilsner: c.yearNotes.map((n) => ({ aar: n.year, tekst: n.body })),
    ordrer: c.orders,
  };
}
