import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "./schema";

// Opdigtede testpersoner til venne-arkivet, så tidslinjer og Livets væv kan prøves af uden rigtige data.
//   npm run db:seed-arkiv            → tilføjer testpersonerne (springer over, hvis de findes)
//   npm run db:seed-arkiv -- --fjern → sletter alle testpersoner igen
// Nægter at køre mod en database på nettet, medmindre --ja-produktion er med.

type Seed = {
  name: string;
  relation: s.RelationKind;
  birthYear?: number;
  howWeMet: string;
  aboutThem?: string;
  together?: string;
  periods: [from: number, to: number | null, intensity: number, label: string][];
  moments: [date: string, kind: s.InteractionKind, title: string, body?: string, source?: s.InteractionSource][];
};

const PEOPLE: Seed[] = [
  {
    name: "Testperson Mikkel Sandkasse",
    relation: "barndom",
    birthYear: 1986,
    howWeMet: "Samme vuggestue. Ifølge mor slog han mig med en spade første dag.",
    together: "Hulen bag garagerne. Hemmeligt kodesprog, som ingen af os kan huske i dag.",
    periods: [
      [2, 6, 3, "Vuggestue og børnehave"],
      [6, 13, 5, "Hver eftermiddag efter skole"],
      [13, 15, 2, "Han flyttede til Aarhus"],
    ],
    moments: [
      ["1993-07", "oplevelse", "Hulen bliver bygget", "Tre uger, to rustne søm og en presenning."],
      ["1999-08-14", "brev", "Første brev fra Aarhus", undefined, "dagbog"],
      ["2001", "gensyn", "Sidste sommer på cykel"],
    ],
  },
  {
    name: "Testperson Sofie Fredagsbar",
    relation: "gymnasium",
    birthYear: 1987,
    howWeMet: "Placeret ved siden af hinanden i 1.g-matematik, fordi vi begge kom for sent.",
    aboutThem: "Bor i Odense med to børn. Arbejder som jordemoder. Hader stadig koriander.",
    together: "Fredagsbaren, studieturen til Prag, sangen vi altid synger forkert.",
    periods: [
      [16, 19, 5, "Gymnasiet"],
      [19, 25, 3, "Studietid i hver sin by"],
      [25, 34, 1, "Julekort og fødselsdagshilsner"],
      [37, null, 2, "Fundet hinanden igen"],
    ],
    moments: [
      ["2003-08", "samtale", "Matematiktimen hvor det startede"],
      ["2005-03", "rejse", "Studietur til Prag", "Vi farede vild og endte til jazzkoncert.", "foto"],
      ["2006-06-23", "fest", "Studenterfest i hendes forældres have"],
      ["2014-12", "brev", "Julekort med billede af første barn", undefined, "foto"],
      ["2024-05-11", "gensyn", "20-års jubilæum", "Som om der ikke var gået en dag.", "kalender"],
      ["2026-02-14", "opkald", "Langt opkald om at blive 40", undefined, "opkald"],
      ["2026-08-02", "maaltid", "Frokost i Odense"],
    ],
  },
  {
    name: "Testperson Laura Sommerforelskelse",
    relation: "kaerlighed",
    howWeMet: "Roskilde Festival 2007, i køen til de eneste fungerende toiletter.",
    periods: [
      [20.7, 21.2, 5, "Forelskelsen"],
      [21.2, 23.6, 4, "Sammen"],
      [23.6, 25, 1, "Efter bruddet"],
    ],
    moments: [
      ["2007-07-05", "kaerlighed", "Toiletkøen på Roskilde"],
      ["2008-04", "rejse", "Interrail til Lissabon", undefined, "dagbog"],
      ["2010-05", "konflikt", "Bruddet", "Det var ingens skyld. Det tog lang tid at forstå.", "dagbog"],
      ["2011-11", "beskeder", "En venlig sms efter et halvt år", undefined, "sms"],
    ],
  },
  {
    name: "Testperson Jonas Læsesal",
    relation: "studie",
    birthYear: 1985,
    howWeMet: "Det eneste ledige bord på læsesalen. Han havde en termokande med.",
    together: "Termokandekaffe. En podcast, vi aldrig fik udgivet.",
    periods: [
      [21, 27, 4, "Studiet"],
      [27, null, 3, "Fast tirsdagsopkald"],
    ],
    moments: [
      ["2008-09", "samtale", "Termokandemødet"],
      ["2012-01", "hjaelp", "Han hjalp mig med at flytte fire etager op", "Pizza på gulvet bagefter.", "kalender"],
      ["2019-03", "svaer_tid", "Han ringede hver dag, da jeg var syg", undefined, "opkald"],
      ["2026-01-06", "opkald", "Første tirsdagsopkald i det nye år", undefined, "opkald"],
      ["2026-06", "oplevelse", "Vi optog endelig et podcastafsnit"],
      ["2026-09-15", "opkald", "Tirsdagsopkald nr. 500 (cirka)", undefined, "opkald"],
    ],
  },
  {
    name: "Testperson Thi Rygsæk",
    relation: "rejse",
    howWeMet: "Natbus i Vietnam, hvor vi delte en pose litchier.",
    periods: [
      [24.3, 24.6, 5, "Tre ugers rejse"],
      [24.6, 31, 2, "Breve og mails"],
      [31, null, 1, "Sporadiske hilsner"],
    ],
    moments: [
      ["2011-02", "rejse", "Natbussen til Hội An"],
      ["2012-10", "brev", "Brev med en presset blomst", undefined, "dagbog"],
      ["2026-04", "beskeder", "Billede af en litchi uden tekst", undefined, "sociale_medier"],
    ],
  },
  {
    name: "Testperson Henrik Kaffeautomat",
    relation: "arbejde",
    howWeMet: "Første arbejdsdag. Kaffeautomaten var i stykker, og han viste mig den hemmelige knap.",
    periods: [
      [29, 35, 3, "Kolleger"],
      [35, null, 1, "En øl om året"],
    ],
    moments: [
      ["2016-03", "samtale", "Den hemmelige knap"],
      ["2021-12", "fest", "Hans afskedsreception"],
    ],
  },
  {
    name: "Testperson Gudrun Opgang",
    relation: "nabo",
    birthYear: 1941,
    howWeMet: "Hun bankede på med boller den dag, jeg flyttede ind.",
    aboutThem: "Har boet i opgangen siden 1968. Kan alle navnene på opgangens katte gennem tiden.",
    together: "Lørdagskaffe. Hun vander mine planter, jeg bærer hendes indkøb.",
    periods: [[33, null, 4, "Naboer"]],
    moments: [
      ["2020-04", "hjaelp", "Indkøb under nedlukningen", undefined, "kalender"],
      ["2023-12-24", "maaltid", "Juleaften, da hendes familie ikke kunne komme"],
      ["2026-03", "maaltid", "Lørdagskaffe med ny kage"],
      ["2026-07", "hjaelp", "Planterne overlevede min ferie"],
    ],
  },
  {
    name: "Testperson Faster Grete",
    relation: "familie",
    howWeMet: "Hun var der fra dag ét.",
    together: "Hendes sommerhus. Kortspillet, hun altid snyder i.",
    periods: [
      [0, 18, 3, "Sommerferier"],
      [18, null, 2, "Fødselsdage og jul"],
    ],
    moments: [
      ["1996-07", "rejse", "Sommerhuset i Vejers"],
      ["2016-10-21", "fest", "Min 30-års fødselsdag"],
      ["2026-10-21", "fest", "Min 40-års fødselsdag", "Hun holdt tale. Alle græd.", "kalender"],
    ],
  },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./data/venskab.db";
  if (!url.startsWith("file:") && !process.argv.includes("--ja-produktion")) {
    throw new Error(`Nægter at lægge testpersoner i ${url}. Tilføj --ja-produktion, hvis det er meningen.`);
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema: s });

  if (process.argv.includes("--fjern")) {
    const gone = await db.delete(s.customers).where(eq(s.customers.isSample, true)).returning({ id: s.customers.id });
    console.log(`🧹 Fjernede ${gone.length} testpersoner`);
    client.close();
    return;
  }

  let created = 0;
  for (const p of PEOPLE) {
    const existing = await db.query.customers.findFirst({ where: (t, { eq }) => eq(t.name, p.name) });
    if (existing) continue;
    const [row] = await db
      .insert(s.customers)
      .values({
        name: p.name,
        origin: "arkiv",
        relation: p.relation,
        birthYear: p.birthYear ?? null,
        howWeMet: p.howWeMet,
        aboutThem: p.aboutThem ?? "",
        together: p.together ?? "",
        allowMention: false,
        isSample: true,
      })
      .returning({ id: s.customers.id });
    await db.insert(s.friendPeriods).values(
      p.periods.map(([fromAge, toAge, intensity, label]) => ({ customerId: row.id, fromAge, toAge, intensity, label })),
    );
    await db.insert(s.interactions).values(
      p.moments.map(([date, kind, title, body, source]) => ({
        customerId: row.id,
        date,
        kind,
        title,
        body: body ?? "",
        source: source ?? "hukommelse",
      })),
    );
    created++;
  }
  console.log(`✅ ${created} testpersoner lagt i venne-arkivet`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
