import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/venskab.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("✅ Databasen er opdateret");
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
