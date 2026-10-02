import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/venskab.db";

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };

// Genbrug forbindelsen ved hot-reload i udvikling
const client =
  globalForDb.libsql ??
  createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

if (url.startsWith("file:")) {
  void client.execute("PRAGMA foreign_keys = ON");
}

export const db = drizzle(client, { schema });
export { schema };
