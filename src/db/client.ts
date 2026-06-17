// Drizzle + postgres.js client.
// 以全域單例快取連線，避免 Next.js dev 熱重載反覆建立連線池。
import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as {
  __ootdSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__ootdSql ?? postgres(connectionString, { max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.__ootdSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
