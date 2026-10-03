/**
 * Insert the makeup / perfume lookbook (src/lib/data.ts, incl. lookbook-extra)
 * into the database. Existing rows are left untouched (ON CONFLICT DO NOTHING),
 * so looks edited in the admin panel are never overwritten.
 *
 *   pnpm seed:lookbook --dry-run   # show what would be inserted
 *   pnpm seed:lookbook             # insert into $DATABASE_URL (.env)
 *
 * Self-contained postgres connection: src/db/client.ts is `server-only` and
 * throws outside Next.
 */
import "dotenv/config";
import postgres from "postgres";
import { SEED_MAKEUP, SEED_PERFUME } from "../src/lib/data";

const DRY = process.argv.includes("--dry-run");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("缺少 DATABASE_URL");
  const sql = postgres(url, { max: 1 });
  try {
    for (const [table, rows] of [
      ["makeup", SEED_MAKEUP],
      ["perfume", SEED_PERFUME],
    ] as const) {
      const existing = new Set((await sql<{ id: string }[]>`select id from ${sql(table)}`).map((r) => r.id));
      const fresh = rows.filter((r) => !existing.has(r.id));
      console.log(`${table}：DB 現有 ${existing.size} 筆，seed ${rows.length} 筆，新增 ${fresh.length} 筆`);
      if (DRY || !fresh.length) {
        if (fresh.length) console.log(`  （dry-run）${fresh.map((r) => r.id).join(", ")}`);
        continue;
      }
      const now = Date.now();
      await sql`
        insert into ${sql(table)} (id, data, updated_at)
        values ${sql(fresh.map((r) => [r.id, sql.json(JSON.parse(JSON.stringify(r))), now]))}
        on conflict (id) do nothing
      `;
      const after = await sql<{ n: number }[]>`select count(*)::int as n from ${sql(table)}`;
      console.log(`  完成，DB 現有 ${after[0].n} 筆`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
