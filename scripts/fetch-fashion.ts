/**
 * Build the catalog from the MIT-licensed "Fashion Product Images" dataset
 * (Param Aggarwal / Myntra): clean white-background e-commerce shots WITH
 * colour + type + gender + usage labels. Each item is one unique product photo
 * whose name matches the picture (colour + garment type from its own labels).
 *
 *   pnpm fetch:fashion            # labels → select → download hi-res → derive
 *   pnpm fetch:fashion --refresh  # re-download the label / image-path caches
 *   pnpm derive:catalog           # re-derive tags/seasons only (no network)
 *
 * Sources (no Kaggle account needed)
 *   - labels:      styles.csv mirror on Hugging Face (nreimers/fashion-dataset)
 *   - image paths: the `image.path` column of 0x-74/FASHION-DF (same row order as
 *                  styles.csv). Only that tiny column is range-read (~0.7 MB per
 *                  shard) — the 7 GB of embedded image bytes are never fetched.
 *   - images:      the original Myntra CDN file for that path, resized to 460px
 *                  (same size/quality as the existing catalog photos).
 *
 * Every id already in the catalog is kept (user hidden/override rows and share
 * links key on them); new rows top the catalog up per type × gender.
 * scripts/data/fashion-selected.json keeps the raw labels of the selected rows
 * so tags can be re-derived (and tuned against `pnpm eval:recommend`) offline.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { parquetMetadataAsync, parquetReadObjects, type AsyncBuffer } from "hyparquet";
import { ARTICLE, deriveCatalog, type RawRow } from "./catalog-derive";

const STYLES_URL = "https://huggingface.co/datasets/nreimers/fashion-dataset/resolve/main/train.csv";
const PATHS_URL = (shard: number) =>
  `https://huggingface.co/datasets/0x-74/FASHION-DF/resolve/main/data/train-${String(shard).padStart(5, "0")}-of-00016.parquet`;
const CDN = "https://assets.myntassets.com/v1/images/style/properties/";

const CACHE_DIR = path.resolve("scripts/.cache");
const STYLES_CACHE = path.join(CACHE_DIR, "styles.csv");
const PATHS_CACHE = path.join(CACHE_DIR, "fashiondf-paths.json");
const FP_DIR = path.resolve("public/images/catalog/fp");
const SELECTED = path.resolve("scripts/data/fashion-selected.json");
const CATALOG = path.resolve("src/lib/catalog-data.json");

const REFRESH = process.argv.includes("--refresh");
const WIDTH = 460;
const QUALITY = 78;
const CONCURRENCY = 12;

/**
 * Max items per dataset articleType (existing ids are always kept, even above
 * the cap). Scarce-but-useful types are taken in full; accessories now span
 * watches / sunglasses / scarves / belts / caps / ties instead of bags only.
 */
const TYPE_CAPS: Record<string, number> = {
  Tshirts: 330, Shirts: 330, Tops: 300, Tunics: 81, Kurtas: 220, Sweaters: 300, Sweatshirts: 260,
  Jackets: 300, Blazers: 20, "Rain Jacket": 30, "Nehru Jackets": 10, Waistcoat: 20, Shrug: 10,
  Jeans: 300, Trousers: 320, "Track Pants": 200, Shorts: 260, Skirts: 130, Capris: 120, Leggings: 100,
  Jeggings: 40, "Lounge Pants": 70, "Lounge Shorts": 40,
  Backpacks: 240, Handbags: 300, Clutches: 260, "Laptop Bag": 90, "Duffel Bag": 90, "Messenger Bag": 50,
  Watches: 260, Sunglasses: 200, Belts: 160, Scarves: 120, Stoles: 90, Mufflers: 40, Caps: 150, Ties: 120,
};
/** No single gender may take more than this share of a type's slots. */
const GENDER_SHARE = 0.65;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function fetchRetry(url: string, init: RequestInit = {}, tries = 6): Promise<Response> {
  for (let a = 0; ; a++) {
    try {
      const res = await fetch(url, { ...init, redirect: "follow", signal: AbortSignal.timeout(60_000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (a >= tries - 1) throw e;
      await sleep(1500 * 2 ** a);
    }
  }
}

/* ─── 1. labels ───────────────────────────────────────────────────────────── */
async function loadStyles(): Promise<RawRow[]> {
  if (REFRESH || !(await exists(STYLES_CACHE))) {
    const res = await fetchRetry(STYLES_URL);
    await writeFile(STYLES_CACHE, await res.text());
  }
  const lines = (await readFile(STYLES_CACHE, "utf8")).trim().split("\n").slice(1);
  return lines.map((l) => {
    const c = l.split(",");
    return {
      id: c[0],
      gender: c[1],
      articleType: c[4],
      baseColour: c[5],
      season: c[6],
      year: Number(c[7]) || 0,
      usage: c[8],
      // The display name is the only field that may itself contain commas.
      productDisplayName: c.slice(9).join(",").trim(),
    };
  });
}

/* ─── 2. image paths (range-read one parquet column) ──────────────────────── */
function rangeBuffer(url: string, byteLength: number): AsyncBuffer {
  return {
    byteLength,
    slice: async (start: number, end = byteLength) => {
      const res = await fetchRetry(url, { headers: { Range: `bytes=${start}-${end - 1}` } });
      if (res.status !== 206 && res.status !== 200) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    },
  };
}

async function loadImagePaths(styles: RawRow[]): Promise<Map<string, string>> {
  let shards: Record<string, [string, string][]> = {};
  if (!REFRESH && (await exists(PATHS_CACHE))) shards = JSON.parse(await readFile(PATHS_CACHE, "utf8"));
  for (let s = 0; s < 16; s++) {
    if (shards[s]) continue;
    const url = PATHS_URL(s);
    const head = await fetchRetry(url, { method: "HEAD" });
    const file = rangeBuffer(url, Number(head.headers.get("content-length")));
    const md = await parquetMetadataAsync(file);
    // Drop the heavy image.bytes leaf so only image.path + text are planned/fetched.
    const schema = md.schema
      .filter((e) => e.name !== "bytes")
      .map((e) => (e.name === "image" ? { ...e, num_children: 1 } : e));
    const row_groups = md.row_groups.map((rg) => ({
      ...rg,
      columns: rg.columns.filter((c) => c.meta_data?.path_in_schema.join(".") !== "image.bytes"),
    }));
    const rows = (await parquetReadObjects({
      file,
      metadata: { ...md, schema, row_groups },
      columns: ["image", "text"],
    })) as { image?: { path?: string }; text?: string }[];
    shards[s] = rows.map((r) => [r.text ?? "", r.image?.path ?? ""]);
    await writeFile(PATHS_CACHE, JSON.stringify(shards));
    console.log(`  圖片路徑 shard ${s + 1}/16：${rows.length} 筆`);
  }

  // FASHION-DF keeps styles.csv's row order but dropped a handful of rows, so
  // align sequentially on the display name with a small look-ahead.
  const rows = Object.keys(shards)
    .sort((a, b) => Number(a) - Number(b))
    .flatMap((k) => shards[k]);
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const out = new Map<string, string>();
  let i = 0;
  let j = 0;
  while (i < rows.length && j < styles.length) {
    if (norm(rows[i][0]) === norm(styles[j].productDisplayName ?? "")) {
      if (rows[i][1]) out.set(styles[j].id, rows[i][1]);
      i++;
      j++;
      continue;
    }
    let skipped = false;
    for (let k = 1; k < 6 && !skipped; k++) {
      if (j + k < styles.length && norm(rows[i][0]) === norm(styles[j + k].productDisplayName ?? "")) {
        j += k;
        skipped = true;
      } else if (i + k < rows.length && norm(rows[i + k][0]) === norm(styles[j].productDisplayName ?? "")) {
        i += k;
        skipped = true;
      }
    }
    if (!skipped) {
      i++;
      j++;
    }
  }
  return out;
}

/* ─── 3. select ───────────────────────────────────────────────────────────── */
/** Stable pseudo-random order so re-runs pick the same rows. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function select(all: RawRow[], existingIds: Set<string>, paths: Map<string, string>): RawRow[] {
  const byId = new Map(all.map((r) => [r.id, r]));
  const picked: RawRow[] = [];
  const perType: Record<string, number> = {};
  const perTypeGender: Record<string, number> = {};
  const bump = (r: RawRow) => {
    perType[r.articleType] = (perType[r.articleType] ?? 0) + 1;
    const k = `${r.articleType}|${r.gender}`;
    perTypeGender[k] = (perTypeGender[k] ?? 0) + 1;
  };

  for (const id of existingIds) {
    const r = byId.get(id);
    if (r) {
      picked.push(r);
      bump(r);
    } else console.warn(`  既有 id ${id} 不在 styles.csv，略過`);
  }

  // New candidates: adults only, a usable colour, a known image, stable order.
  const candidates = all
    .filter((r) => !existingIds.has(r.id) && ARTICLE[r.articleType] && TYPE_CAPS[r.articleType])
    .filter((r) => ["Men", "Women", "Unisex"].includes(r.gender))
    .filter((r) => r.baseColour && r.baseColour !== "NA" && paths.has(r.id))
    .sort((a, b) => hash(a.id) - hash(b.id));

  for (const r of candidates) {
    const cap = TYPE_CAPS[r.articleType];
    if ((perType[r.articleType] ?? 0) >= cap) continue;
    const genderCap = Math.max(20, Math.ceil(cap * GENDER_SHARE));
    if (r.gender !== "Unisex" && (perTypeGender[`${r.articleType}|${r.gender}`] ?? 0) >= genderCap) continue;
    picked.push(r);
    bump(r);
  }
  return picked;
}

/* ─── 4. download ─────────────────────────────────────────────────────────── */
async function download(rows: RawRow[], paths: Map<string, string>): Promise<Set<string>> {
  await mkdir(FP_DIR, { recursive: true });
  const ok = new Set<string>();
  const queue: RawRow[] = [];
  for (const r of rows) {
    if (await exists(path.join(FP_DIR, `${r.id}.jpg`))) ok.add(r.id);
    else queue.push(r);
  }
  const total = queue.length;
  console.log(`圖片：已存在 ${ok.size}，需下載 ${total}`);
  let done = 0;
  let fail = 0;
  async function worker() {
    while (queue.length) {
      const r = queue.shift()!;
      try {
        const res = await fetchRetry(CDN + paths.get(r.id), {}, 3);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const out = await sharp(Buffer.from(await res.arrayBuffer()))
          .resize({ width: WIDTH, withoutEnlargement: true })
          .jpeg({ quality: QUALITY, mozjpeg: true })
          .toBuffer();
        await writeFile(path.join(FP_DIR, `${r.id}.jpg`), out);
        ok.add(r.id);
      } catch {
        fail++;
      }
      if (++done % 250 === 0) console.log(`  下載 ${done}/${total}（失敗 ${fail}）`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`下載完成：失敗 ${fail}`);
  return ok;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  const styles = await loadStyles();
  const paths = await loadImagePaths(styles);
  console.log(`標籤 ${styles.length} 筆，對應到圖片 ${paths.size} 筆`);

  const current = JSON.parse(await readFile(CATALOG, "utf8")) as { id: string }[];
  const existingIds = new Set(current.map((i) => i.id.replace(/^fp_/, "")));
  const selected = select(styles, existingIds, paths);
  const downloaded = await download(selected, paths);
  const final = selected.filter((r) => downloaded.has(r.id));

  await mkdir(path.dirname(SELECTED), { recursive: true });
  // Keep only what derive needs, so the committed raw selection stays small.
  const slim = final.map(({ id, gender, articleType, baseColour, season, usage }) => ({ id, gender, articleType, baseColour, season, usage }));
  await writeFile(SELECTED, JSON.stringify(slim));
  const items = deriveCatalog(final);
  await writeFile(CATALOG, JSON.stringify(items));

  const byCat: Record<string, number> = {};
  items.forEach((i) => (byCat[i.category] = (byCat[i.category] ?? 0) + 1));
  console.log(`完成：${items.length} 件 → ${CATALOG}`);
  console.log("分類:", byCat);
  console.log("接著執行 pnpm eval:recommend 與 pnpm build");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
