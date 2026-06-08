/**
 * Batch-generate one product image per catalog item via the OpenAI Images API.
 *
 *   OPENAI_API_KEY=sk-... pnpm gen:images            # generate ALL (~13k, $$$)
 *   OPENAI_API_KEY=sk-... pnpm gen:images --limit 20 # quick test batch
 *
 * Output: public/images/catalog/gen/<id>.png  (resumable — existing files are skipped)
 * After generating everything, enable them by setting:
 *   NEXT_PUBLIC_USE_GENERATED_IMAGES=1
 *
 * WARNING: ~13,248 images at ~US$0.04 each ≈ US$530 and several hours.
 * Cost and the API key are yours — this script just orchestrates the calls.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { getCatalog } from "../src/lib/catalog";
import type { Item } from "../src/lib/types";

const API_KEY = process.env.OPENAI_API_KEY;
const OUT_DIR = path.resolve("public/images/catalog/gen");
const CONCURRENCY = 5;
const SIZE = "1024x1024";

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const COLOR_EN: Record<string, string> = {
  白色: "white", 奶油色: "cream", 米白色: "off-white", 卡其色: "khaki",
  焦糖色: "caramel brown", 咖啡色: "coffee brown", 黑色: "black", 靛藍: "indigo blue",
  藏青: "navy", 鼠尾草綠: "sage green", 墨綠: "dark green", 灰色: "grey",
  粉色: "pink", 酒紅: "wine red", 天藍: "sky blue", 杏色: "apricot",
};

function garmentEn(category: string, name: string): string {
  if (category === "tops") {
    if (/連帽/.test(name)) return "hoodie";
    if (/襯衫|罩衫/.test(name)) return "button-up shirt";
    if (/Polo/.test(name)) return "polo shirt";
    if (/毛衣|針織|高領/.test(name)) return "knit sweater";
    if (/背心/.test(name)) return "sleeveless vest top";
    return "t-shirt";
  }
  if (category === "bottoms") {
    if (/裙/.test(name)) return "pleated skirt";
    if (/短褲/.test(name)) return "shorts";
    if (/寬褲|闊腿/.test(name)) return "wide-leg trousers";
    return "trousers";
  }
  if (category === "outerwear") {
    if (/風衣|大衣/.test(name)) return "long coat";
    if (/開衫/.test(name)) return "knit cardigan";
    return "jacket";
  }
  if (/後背/.test(name)) return "backpack";
  if (/斜背|腰/.test(name)) return "crossbody bag";
  return "handbag";
}

function promptFor(item: Item): string {
  const color = COLOR_EN[item.colors[0]] ?? item.colors[0];
  const garment = garmentEn(item.category, item.name);
  return `Professional e-commerce product photograph of a ${color} ${garment}, neatly presented on a plain off-white studio background, soft even lighting, centered, sharp focus, high detail, no people, no text, no logo.`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateOne(item: Item): Promise<"skip" | "ok" | "fail"> {
  const outPath = path.join(OUT_DIR, `${item.id}.png`);
  if (await exists(outPath)) return "skip";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: "gpt-image-1", prompt: promptFor(item), size: SIZE, n: 1 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const json = await res.json();
      const b64 = json?.data?.[0]?.b64_json;
      if (!b64) throw new Error("no image data in response");
      await writeFile(outPath, Buffer.from(b64, "base64"));
      return "ok";
    } catch (err) {
      if (attempt === 3) {
        console.error(`  ✗ ${item.id}: ${err instanceof Error ? err.message : err}`);
        return "fail";
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return "fail";
}

async function main() {
  if (!API_KEY) {
    console.error("✗ 缺少 OPENAI_API_KEY。請先 `export OPENAI_API_KEY=sk-...` 再執行。");
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });
  const items = getCatalog().slice(0, LIMIT);
  console.log(`準備生成 ${items.length} 張圖 → ${OUT_DIR}`);

  let ok = 0, skip = 0, fail = 0, done = 0;
  const queue = [...items];
  async function worker() {
    while (queue.length) {
      const item = queue.shift()!;
      const r = await generateOne(item);
      if (r === "ok") ok++;
      else if (r === "skip") skip++;
      else fail++;
      if (++done % 50 === 0 || done === items.length) {
        console.log(`  進度 ${done}/${items.length}　ok=${ok} skip=${skip} fail=${fail}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`完成：ok=${ok} skip=${skip} fail=${fail}`);
  console.log("全部完成後，設定環境變數 NEXT_PUBLIC_USE_GENERATED_IMAGES=1 即可啟用生成圖。");
}

main();
