/**
 * Replace the low-res catalog thumbnails with high-resolution versions of the
 * SAME products, downloaded from the original Myntra CDN (URLs from the dataset's
 * images.csv) and resized to a sensible display width to keep the repo lean.
 *
 *   pnpm tsx scripts/upgrade-hires.ts            # uses scripts/.images-urls.csv
 *   pnpm tsx scripts/upgrade-hires.ts <csv> <width>
 *
 * Images are MIT-licensed (Fashion Product Images dataset).
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CSV = process.argv[2] ?? path.resolve("scripts/.images-urls.csv");
const WIDTH = parseInt(process.argv[3] ?? "500", 10);
const QUALITY = 78;
const FP_DIR = path.resolve("public/images/catalog/fp");
const CONCURRENCY = 16;

async function main() {
  // id -> Myntra URL
  const csv = await readFile(CSV, "utf8");
  const url = new Map<string, string>();
  for (const line of csv.split("\n").slice(1)) {
    const i = line.indexOf(",");
    if (i < 0) continue;
    const id = line.slice(0, i).replace(/\.jpg$/i, "").trim();
    const link = line.slice(i + 1).trim();
    if (id && link) url.set(id, link);
  }

  // Only upgrade ids we actually use in the catalog.
  const ids = (await readdir(FP_DIR)).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, ""));
  console.log(`要升級 ${ids.length} 張（寬 ${WIDTH}px）`);

  let ok = 0, fail = 0, done = 0;
  const queue = [...ids];
  async function worker() {
    while (queue.length) {
      const id = queue.shift()!;
      const link = url.get(id);
      if (!link) { fail++; done++; continue; }
      try {
        const res = await fetch(link, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const out = await sharp(buf)
          .resize({ width: WIDTH, withoutEnlargement: true })
          .jpeg({ quality: QUALITY, mozjpeg: true })
          .toBuffer();
        await writeFile(path.join(FP_DIR, `${id}.jpg`), out);
        ok++;
      } catch {
        fail++;
      }
      if (++done % 200 === 0) console.log(`  ${done}/${ids.length}　ok=${ok} fail=${fail}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`完成：ok=${ok} fail=${fail}`);
}

main();
