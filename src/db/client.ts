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

// 每條連線的伺服器端時限：連線池只有 5 條、所有使用者共用，單一請求的慢查詢、
// 鎖等待或卡住的交易不可無限期佔住連線（否則其他人的 session 檢查、同步都得排隊）。
const sql =
  globalForDb.__ootdSql ??
  postgres(connectionString, {
    max: 5,
    connection: {
      statement_timeout: 15_000,
      lock_timeout: 5_000,
      idle_in_transaction_session_timeout: 15_000,
    },
  });
if (process.env.NODE_ENV !== "production") globalForDb.__ootdSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
