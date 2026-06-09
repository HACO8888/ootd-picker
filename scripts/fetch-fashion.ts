/**
 * Build the catalog from the MIT-licensed "Fashion Product Images" dataset on
 * Hugging Face (clean white-background e-commerce shots WITH colour + type
 * labels). Each downloaded image becomes one unique item whose name matches the
 * photo (colour + garment type from the dataset's own labels).
 *
 *   pnpm fetch:fashion            # default target
 *   pnpm fetch:fashion --target 2500 --per-type 250
 *
 * Output: public/images/catalog/fp/<id>.jpg  +  src/lib/catalog-data.json
 * Then:   pnpm build
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HF = "https://datasets-server.huggingface.co/rows?dataset=ashraq/fashion-product-images-small&config=default&split=train";
const FP_DIR = path.resolve("public/images/catalog/fp");
const OUT_JSON = path.resolve("src/lib/catalog-data.json");

const a = (k: string, d: number) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? parseInt(process.argv[i + 1], 10) : d;
};
const TARGET = a("--target", 2400);
const PER_TYPE = a("--per-type", 240);
const SCAN_LIMIT = a("--scan", 12000);

type Cat = "tops" | "bottoms" | "outerwear" | "accessories";
const ARTICLE: Record<string, { category: Cat; label: string }> = {
  Tshirts: { category: "tops", label: "T恤" },
  Shirts: { category: "tops", label: "襯衫" },
  Tops: { category: "tops", label: "上衣" },
  Tunics: { category: "tops", label: "長版上衣" },
  Kurtas: { category: "tops", label: "印度長衫" },
  Sweaters: { category: "tops", label: "針織毛衣" },
  Sweatshirts: { category: "tops", label: "大學T" },
  Jackets: { category: "outerwear", label: "外套" },
  Blazers: { category: "outerwear", label: "西裝外套" },
  "Rain Jacket": { category: "outerwear", label: "風雨衣" },
  "Nehru Jackets": { category: "outerwear", label: "立領外套" },
  Waistcoat: { category: "outerwear", label: "背心" },
  Jeans: { category: "bottoms", label: "牛仔褲" },
  Trousers: { category: "bottoms", label: "長褲" },
  "Track Pants": { category: "bottoms", label: "運動長褲" },
  Shorts: { category: "bottoms", label: "短褲" },
  Skirts: { category: "bottoms", label: "裙" },
  Capris: { category: "bottoms", label: "七分褲" },
  Leggings: { category: "bottoms", label: "內搭褲" },
  Backpacks: { category: "accessories", label: "後背包" },
  Handbags: { category: "accessories", label: "手提包" },
  Clutches: { category: "accessories", label: "手拿包" },
  "Laptop Bag": { category: "accessories", label: "電腦包" },
  "Duffel Bag": { category: "accessories", label: "旅行袋" },
  "Messenger Bag": { category: "accessories", label: "郵差包" },
};

const COLOR: Record<string, string> = {
  Black: "黑色", White: "白色", "Off White": "米白色", Cream: "奶油色", Beige: "米色",
  Grey: "灰色", "Grey Melange": "麻灰", Charcoal: "碳灰", Silver: "銀色",
  Blue: "藍色", "Navy Blue": "藏青", "Sea Green": "海綠", Teal: "藍綠", "Turquoise Blue": "土耳其藍", "Steel": "鋼藍",
  Red: "紅色", Maroon: "酒紅", Burgundy: "勃根地紅", Rust: "鏽紅", Pink: "粉色", Rose: "玫瑰粉", Magenta: "洋紅", Peach: "蜜桃色",
  Green: "綠色", Olive: "墨綠", "Lime Green": "萊姆綠", "Fluorescent Green": "螢光綠",
  Yellow: "黃色", Mustard: "芥末黃", Gold: "金色",
  Brown: "咖啡色", "Coffee Brown": "咖啡色", Khaki: "卡其色", Tan: "棕褐", Bronze: "古銅", Copper: "銅色", Nude: "裸色", Skin: "膚色",
  Purple: "紫色", Lavender: "薰衣草紫", Mauve: "淺紫", Orange: "橘色", Multi: "多色", Metallic: "金屬色",
};

const SEASON: Record<string, string> = { Summer: "summer", Fall: "autumn", Winter: "winter", Spring: "spring" };
const USAGE_TAGS: Record<string, string[]> = {
  Casual: ["休閒漫步", "放鬆"], Formal: ["工作", "專業"], Sports: ["活力"],
  Ethnic: ["優雅"], Party: ["社交聚會", "約會"], "Smart Casual": ["工作", "休閒漫步"], Travel: ["休閒漫步"],
};

interface OutItem {
  id: string; name: string; category: Cat; seasons: string[]; colors: string[]; tags: string[]; imageUrl: string;
}

async function rows(offset: number) {
  const res = await fetch(`${HF}&offset=${offset}&length=100`);
  if (!res.ok) throw new Error(`HF ${res.status}`);
  const json = await res.json();
  return json.rows as { row: Record<string, unknown> }[];
}

async function main() {
  await mkdir(FP_DIR, { recursive: true });
  const out: OutItem[] = [];
  const perType: Record<string, number> = {};
  let offset = 0;
  while (out.length < TARGET && offset < SCAN_LIMIT) {
    let batch;
    try {
      batch = await rows(offset);
    } catch (e) {
      console.error(`offset ${offset} 失敗：${e instanceof Error ? e.message : e}`);
      break;
    }
    if (!batch.length) break;
    for (const { row } of batch) {
      const at = row.articleType as string;
      const map = ARTICLE[at];
      if (!map) continue;
      if ((perType[at] ?? 0) >= PER_TYPE) continue;
      const id = String(row.id);
      const src = (row.image as { src: string }).src;
      const file = path.join(FP_DIR, `${id}.jpg`);
      try {
        const img = await fetch(src);
        if (!img.ok) continue;
        await writeFile(file, Buffer.from(await img.arrayBuffer()));
      } catch {
        continue;
      }
      const colorEn = row.baseColour as string;
      const color = COLOR[colorEn] ?? "多色";
      const seasonZh = SEASON[row.season as string];
      const seasons = seasonZh ? [seasonZh] : ["spring", "summer", "autumn", "winter"];
      const tags = USAGE_TAGS[row.usage as string] ?? ["休閒漫步"];
      out.push({
        id: `fp_${id}`,
        name: `${color}${map.label}`,
        category: map.category,
        seasons,
        colors: [color],
        tags,
        imageUrl: `/images/catalog/fp/${id}.jpg`,
      });
      perType[at] = (perType[at] ?? 0) + 1;
      if (out.length >= TARGET) break;
    }
    offset += 100;
    if (offset % 1000 === 0) console.log(`  掃描 ${offset}，已收 ${out.length} 件`);
  }
  await writeFile(OUT_JSON, JSON.stringify(out));
  const byCat: Record<string, number> = {};
  out.forEach((i) => (byCat[i.category] = (byCat[i.category] ?? 0) + 1));
  console.log(`完成：${out.length} 件 → ${OUT_JSON}`);
  console.log("分類:", byCat);
  console.log("接著執行 pnpm build");
}

main();
