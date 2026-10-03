/**
 * Pure derivation: raw Fashion Product Images labels → catalog items.
 *
 * The dataset only labels each product with ONE season and ONE usage, so the
 * old "usage → tags" mapping left 2/3 of the wizard's moods/destinations
 * (約會 · 社交聚會 · 舒適 · 居家) with almost no candidates and spring with
 * ~1% of items. Tags and seasons are now derived from the garment type first
 * (what you'd actually wear it for), refined by usage + colour.
 *
 *   pnpm derive:catalog    # scripts/data/fashion-selected.json → src/lib/catalog-data.json
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Cat = "tops" | "bottoms" | "outerwear" | "accessories";
type Season = "spring" | "summer" | "autumn" | "winter";
type Gender = "female" | "male" | "unisex";

export interface RawRow {
  id: string;
  gender: string;
  articleType: string;
  baseColour: string;
  season: string;
  usage: string;
  /** Only needed while aligning image paths; not kept in fashion-selected.json. */
  year?: number;
  productDisplayName?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: Cat;
  gender: Gender;
  seasons: Season[];
  colors: string[];
  tags: string[];
  imageUrl: string;
}

/** Thermal class of a garment type — drives the season set. */
type Warmth = "light" | "mid" | "warm" | "layer" | "any" | "sun" | "chill";

export const ARTICLE: Record<string, { category: Cat; label: string; warmth: Warmth; tags: string[] }> = {
  Tshirts: { category: "tops", label: "T恤", warmth: "light", tags: ["放鬆", "休閒漫步"] },
  Shirts: { category: "tops", label: "襯衫", warmth: "mid", tags: ["休閒漫步", "約會"] },
  Tops: { category: "tops", label: "上衣", warmth: "light", tags: ["約會", "休閒漫步"] },
  Tunics: { category: "tops", label: "長版上衣", warmth: "light", tags: ["優雅", "休閒漫步"] },
  Kurtas: { category: "tops", label: "印度長衫", warmth: "light", tags: ["優雅"] },
  Sweaters: { category: "tops", label: "針織毛衣", warmth: "warm", tags: ["舒適", "居家", "約會"] },
  Sweatshirts: { category: "tops", label: "大學T", warmth: "warm", tags: ["舒適", "居家", "休閒漫步"] },
  Jackets: { category: "outerwear", label: "外套", warmth: "layer", tags: ["休閒漫步", "活力"] },
  Blazers: { category: "outerwear", label: "西裝外套", warmth: "layer", tags: ["工作", "專業", "社交聚會"] },
  "Rain Jacket": { category: "outerwear", label: "風雨衣", warmth: "layer", tags: ["活力", "休閒漫步"] },
  "Nehru Jackets": { category: "outerwear", label: "立領外套", warmth: "layer", tags: ["優雅", "社交聚會"] },
  Waistcoat: { category: "outerwear", label: "背心", warmth: "mid", tags: ["優雅", "工作"] },
  Jeans: { category: "bottoms", label: "牛仔褲", warmth: "mid", tags: ["休閒漫步", "放鬆", "約會"] },
  Trousers: { category: "bottoms", label: "長褲", warmth: "mid", tags: ["休閒漫步"] },
  "Track Pants": { category: "bottoms", label: "運動長褲", warmth: "mid", tags: ["舒適", "居家", "活力"] },
  Shorts: { category: "bottoms", label: "短褲", warmth: "light", tags: ["放鬆", "活力", "休閒漫步"] },
  Skirts: { category: "bottoms", label: "裙", warmth: "light", tags: ["約會", "優雅"] },
  Capris: { category: "bottoms", label: "七分褲", warmth: "light", tags: ["放鬆", "休閒漫步"] },
  Leggings: { category: "bottoms", label: "內搭褲", warmth: "mid", tags: ["舒適", "居家", "活力"] },
  Backpacks: { category: "accessories", label: "後背包", warmth: "any", tags: ["休閒漫步", "活力"] },
  Handbags: { category: "accessories", label: "手提包", warmth: "any", tags: ["約會", "優雅", "工作"] },
  Clutches: { category: "accessories", label: "手拿包", warmth: "any", tags: ["社交聚會", "約會", "優雅"] },
  "Laptop Bag": { category: "accessories", label: "電腦包", warmth: "any", tags: ["工作", "專業"] },
  "Duffel Bag": { category: "accessories", label: "旅行袋", warmth: "any", tags: ["活力", "休閒漫步"] },
  "Messenger Bag": { category: "accessories", label: "郵差包", warmth: "any", tags: ["工作", "休閒漫步"] },
  Shrug: { category: "outerwear", label: "罩衫外套", warmth: "mid", tags: ["優雅", "約會"] },
  Jeggings: { category: "bottoms", label: "彈性窄管褲", warmth: "mid", tags: ["休閒漫步", "活力"] },
  "Lounge Pants": { category: "bottoms", label: "居家長褲", warmth: "mid", tags: ["居家", "舒適", "放鬆"] },
  "Lounge Shorts": { category: "bottoms", label: "居家短褲", warmth: "light", tags: ["居家", "舒適", "放鬆"] },
  Watches: { category: "accessories", label: "手錶", warmth: "any", tags: ["工作", "專業", "優雅"] },
  Sunglasses: { category: "accessories", label: "太陽眼鏡", warmth: "sun", tags: ["休閒漫步", "活力", "約會"] },
  Belts: { category: "accessories", label: "皮帶", warmth: "any", tags: ["工作", "專業"] },
  Scarves: { category: "accessories", label: "圍巾", warmth: "chill", tags: ["優雅", "約會", "舒適"] },
  Stoles: { category: "accessories", label: "披肩", warmth: "chill", tags: ["優雅", "社交聚會"] },
  Mufflers: { category: "accessories", label: "毛線圍巾", warmth: "chill", tags: ["舒適", "休閒漫步"] },
  Caps: { category: "accessories", label: "棒球帽", warmth: "sun", tags: ["活力", "休閒漫步"] },
  Ties: { category: "accessories", label: "領帶", warmth: "any", tags: ["工作", "專業", "社交聚會"] },
};

export const COLOR: Record<string, string> = {
  Black: "黑色", White: "白色", "Off White": "米白色", Cream: "奶油色", Beige: "米色",
  Grey: "灰色", "Grey Melange": "麻灰", Charcoal: "碳灰", Silver: "銀色",
  Blue: "藍色", "Navy Blue": "藏青", "Sea Green": "海綠", Teal: "藍綠", "Turquoise Blue": "土耳其藍", Steel: "鋼藍",
  Red: "紅色", Maroon: "酒紅", Burgundy: "勃根地紅", Rust: "鏽紅", Pink: "粉色", Rose: "玫瑰粉", Magenta: "洋紅", Peach: "蜜桃色",
  Green: "綠色", Olive: "墨綠", "Lime Green": "萊姆綠", "Fluorescent Green": "螢光綠",
  Yellow: "黃色", Mustard: "芥末黃", Gold: "金色",
  Brown: "咖啡色", "Coffee Brown": "咖啡色", Khaki: "卡其色", Tan: "棕褐", Bronze: "古銅", Copper: "銅色", Nude: "裸色", Skin: "膚色",
  Purple: "紫色", Lavender: "薰衣草紫", Mauve: "淺紫", Orange: "橘色", Multi: "多色", Metallic: "金屬色",
};

const GENDER: Record<string, Gender> = { Men: "male", Boys: "male", Women: "female", Girls: "female", Unisex: "unisex" };

const SEASON: Record<string, Season> = { Summer: "summer", Fall: "autumn", Winter: "winter", Spring: "spring" };

/** Base seasons per thermal class; the dataset's own season is added when compatible. */
const WARMTH_SEASONS: Record<Warmth, Season[]> = {
  light: ["spring", "summer"],
  mid: ["spring", "autumn"],
  warm: ["autumn", "winter"],
  layer: ["spring", "autumn", "winter"],
  any: ["spring", "summer", "autumn", "winter"],
  sun: ["spring", "summer"],
  chill: ["autumn", "winter"],
};
const WARMTH_FORBIDS: Partial<Record<Warmth, Season>> = { light: "winter", warm: "summer", layer: "summer", sun: "winter", chill: "summer" };

/** Colours that read as dressy / statement. */
const STATEMENT_COLOURS = new Set(["金色", "銀色", "金屬色", "紅色", "酒紅", "勃根地紅", "洋紅", "古銅", "銅色"]);
const SOFT_COLOURS = new Set(["粉色", "玫瑰粉", "蜜桃色", "薰衣草紫", "淺紫", "奶油色", "米白色", "裸色"]);

const MAX_TAGS = 4;

/** Rows whose photo is corrupt or contradicts its own colour label. */
export const BROKEN_IDS = new Set(["30869", "26370"]);

export function deriveSeasons(row: Pick<RawRow, "articleType" | "season">): Season[] {
  const a = ARTICLE[row.articleType];
  const base = new Set(WARMTH_SEASONS[a.warmth]);
  const ds = SEASON[row.season];
  if (ds && WARMTH_FORBIDS[a.warmth] !== ds) base.add(ds);
  const order: Season[] = ["spring", "summer", "autumn", "winter"];
  return order.filter((s) => base.has(s));
}

export function deriveTags(row: Pick<RawRow, "articleType" | "usage" | "gender">, colour: string): string[] {
  const a = ARTICLE[row.articleType];
  // Usage first (it is the dataset's explicit intent), then type defaults.
  const out: string[] = [];
  const add = (...t: string[]) => t.forEach((x) => !out.includes(x) && out.push(x));
  switch (row.usage) {
    case "Formal":
      add("工作", "專業");
      break;
    case "Smart Casual":
      add("工作", "休閒漫步");
      break;
    case "Party":
      add("社交聚會", "約會");
      break;
    case "Sports":
      add("活力");
      break;
    case "Ethnic":
      add("優雅");
      break;
  }
  // Type-specific refinements that depend on usage.
  if (row.articleType === "Shirts" && (row.usage === "Formal" || row.usage === "Smart Casual")) add("專業");
  if (row.articleType === "Trousers" && row.usage !== "Casual" && row.usage !== "Sports") add("工作", "專業");
  if (row.articleType === "Trousers" && row.usage === "Casual") add("休閒漫步", "放鬆");
  add(...a.tags);
  if (STATEMENT_COLOURS.has(colour) && a.category !== "bottoms") add("社交聚會");
  if (SOFT_COLOURS.has(colour) && row.gender !== "Men") add("約會");
  // Guarantee one mood tag so every item can answer "心情" in the wizard.
  const MOODS = ["活力", "放鬆", "專業", "優雅", "舒適"];
  const tags = out.slice(0, MAX_TAGS);
  if (!tags.some((t) => MOODS.includes(t))) {
    const mood = a.category === "accessories" ? "優雅" : row.usage === "Sports" ? "活力" : "放鬆";
    tags[Math.min(tags.length, MAX_TAGS - 1)] = mood;
  }
  return tags;
}

export function deriveItem(row: RawRow): CatalogItem | null {
  const a = ARTICLE[row.articleType];
  if (!a) return null;
  const colour = COLOR[row.baseColour] ?? "多色";
  return {
    id: `fp_${row.id}`,
    name: `${colour}${a.label}`,
    category: a.category,
    gender: GENDER[row.gender] ?? "unisex",
    seasons: deriveSeasons(row),
    colors: [colour],
    tags: deriveTags(row, colour),
    imageUrl: `/images/catalog/fp/${row.id}.jpg`,
  };
}

export function deriveCatalog(rows: RawRow[]): CatalogItem[] {
  return rows
    .filter((r) => !BROKEN_IDS.has(r.id))
    .map(deriveItem).filter((x): x is CatalogItem => x !== null);
}

// CLI: re-derive from the committed raw selection (no network).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const SELECTED = path.resolve("scripts/data/fashion-selected.json");
  const CATALOG = path.resolve("src/lib/catalog-data.json");
  const rows = JSON.parse(await readFile(SELECTED, "utf8")) as RawRow[];
  const items = deriveCatalog(rows);
  await writeFile(CATALOG, JSON.stringify(items));
  console.log(`完成：${items.length} 件 → ${CATALOG}`);
}
