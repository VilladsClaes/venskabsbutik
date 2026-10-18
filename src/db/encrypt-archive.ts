import { createClient } from "@libsql/client";
import { ENCRYPTED_FIELDS, encryptField, hasEncryptionKey, isEncrypted } from "../lib/field-crypto";

// Engangsscript: krypterer venne-arkivets felter, der stadig ligger i klartekst.
//   npm run db:krypter-arkiv                  → viser, hvor mange felter der mangler (ændrer intet)
//   npm run db:krypter-arkiv -- --kør         → krypterer dem
// Mod en database på nettet skal --ja-produktion også være med. Kan køres igen uden skade:
// felter, der allerede er krypteret, springes over.

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./data/venskab.db";
  const run = process.argv.includes("--kør");
  if (!hasEncryptionKey()) throw new Error("ARCHIVE_ENCRYPTION_KEY er ikke sat");
  if (run && !url.startsWith("file:") && !process.argv.includes("--ja-produktion")) {
    throw new Error(`Nægter at ændre ${url}. Tilføj --ja-produktion, hvis det er meningen.`);
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

  let total = 0;
  for (const [table, columns] of Object.entries(ENCRYPTED_FIELDS)) {
    const rows = await client.execute(`select id, ${columns.join(", ")} from ${table}`);
    const updates = [];
    for (const row of rows.rows) {
      const set: Record<string, string> = {};
      for (const col of columns) {
        const v = row[col];
        if (typeof v === "string" && v !== "" && !isEncrypted(v)) set[col] = encryptField(v, `${table}.${col}`);
      }
      const cols = Object.keys(set);
      if (!cols.length) continue;
      total += cols.length;
      updates.push({
        sql: `update ${table} set ${cols.map((c) => `${c} = ?`).join(", ")} where id = ?`,
        args: [...cols.map((c) => set[c]), Number(row.id)],
      });
    }
    console.log(`${table}: ${updates.length} af ${rows.rows.length} rækker har klartekst`);
    // Én transaktion pr. tabel – enten krypteres alle rækker, eller ingen
    if (run && updates.length) await client.batch(updates, "write");
  }

  console.log(run ? `🔒 Krypterede ${total} felter` : `${total} felter mangler. Kør igen med --kør for at kryptere dem.`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
