// Procedurally generated catalog (>10,000 styles).
// Deterministic (no Math.random / Date) so server and client build the exact
// same array — required for a stable useSyncExternalStore server snapshot.
// Each item carries its real colour, so thumbnails are colour-accurate swatches
// (rendered by SmartImage) instead of reusing a handful of photos.
import type { Item, Category, Season } from "./types";

const BRANDS = ["UNIQLO", "NET", "GU"];

// 16 colours with display name + hex (drives the swatch thumbnail).
// Names equal to a sidebar filter swatch (白色/奶油色/焦糖色/鼠尾草綠/靛藍) stay filterable.
const COLORS: { name: string; hex: string }[] = [
  { name: "白色", hex: "#f4f3ee" },
  { name: "奶油色", hex: "#efe7d3" },
  { name: "米白色", hex: "#e7ddc9" },
  { name: "卡其色", hex: "#b39a72" },
  { name: "焦糖色", hex: "#a4682f" },
  { name: "咖啡色", hex: "#6b4a33" },
  { name: "黑色", hex: "#22231f" },
  { name: "靛藍", hex: "#2c3a5c" },
  { name: "藏青", hex: "#1f2a44" },
  { name: "鼠尾草綠", hex: "#54643b" },
  { name: "墨綠", hex: "#2f4030" },
  { name: "灰色", hex: "#8c8c84" },
  { name: "粉色", hex: "#e3a4b4" },
  { name: "酒紅", hex: "#6f2434" },
  { name: "天藍", hex: "#7da6cd" },
  { name: "杏色", hex: "#dfb597" },
];

const SERIES = ["都會", "假日", "極簡"];

interface TypeDef {
  name: string;
  seasonBias?: Season[];
  tags: string[];
}

const TOPS: TypeDef[] = [
  { name: "圓領T恤", tags: ["放鬆", "休閒漫步"] },
  { name: "V領T恤", tags: ["放鬆", "工作"] },
  { name: "Polo衫", tags: ["工作", "休閒漫步"] },
  { name: "連帽大學T", tags: ["活力", "放鬆"], seasonBias: ["autumn", "spring"] },
  { name: "圓領大學T", tags: ["放鬆", "活力"], seasonBias: ["autumn", "spring"] },
  { name: "襯衫", tags: ["工作", "專業"] },
  { name: "罩衫", tags: ["優雅", "約會"] },
  { name: "針織毛衣", tags: ["舒適", "優雅"], seasonBias: ["autumn", "winter"] },
  { name: "高領毛衣", tags: ["舒適", "優雅"], seasonBias: ["winter"] },
  { name: "背心", tags: ["活力", "休閒漫步"], seasonBias: ["summer"] },
];

const BOTTOMS: TypeDef[] = [
  { name: "牛仔褲", tags: ["放鬆", "休閒漫步"] },
  { name: "西裝長褲", tags: ["專業", "工作"] },
  { name: "休閒短褲", tags: ["活力", "休閒漫步"], seasonBias: ["summer"] },
  { name: "百褶裙", tags: ["優雅", "約會"] },
  { name: "A字裙", tags: ["優雅", "約會"] },
  { name: "闊腿寬褲", tags: ["優雅", "放鬆"] },
  { name: "錐形褲", tags: ["工作", "休閒漫步"] },
  { name: "工裝褲", tags: ["活力", "休閒漫步"] },
];

const OUTER: TypeDef[] = [
  { name: "牛仔外套", tags: ["活力", "休閒漫步"], seasonBias: ["spring", "autumn"] },
  { name: "皮革外套", tags: ["活力", "社交聚會"], seasonBias: ["spring", "autumn"] },
  { name: "西裝外套", tags: ["專業", "工作"], seasonBias: ["spring", "autumn"] },
  { name: "風衣", tags: ["優雅", "工作"], seasonBias: ["spring", "autumn"] },
  { name: "羽絨外套", tags: ["舒適", "休閒漫步"], seasonBias: ["winter"] },
  { name: "鋪棉大衣", tags: ["舒適", "優雅"], seasonBias: ["winter"] },
  { name: "針織開衫", tags: ["舒適", "放鬆"], seasonBias: ["autumn", "spring"] },
  { name: "防風外套", tags: ["活力", "休閒漫步"], seasonBias: ["autumn", "spring"] },
];

const ACCESSORIES: TypeDef[] = [
  { name: "後背包", tags: ["工作", "活力", "休閒漫步"] },
  { name: "手提包", tags: ["優雅", "工作", "約會"] },
  { name: "斜背包", tags: ["休閒漫步", "活力"] },
  { name: "托特包", tags: ["工作", "休閒漫步"] },
  { name: "腰包", tags: ["活力", "休閒漫步"] },
  { name: "肩背包", tags: ["優雅", "約會"] },
];

const TOP_MATERIALS = ["棉質", "亞麻", "針織", "雪紡"];
const BOTTOM_MATERIALS = ["棉質", "丹寧", "西裝布"];
const OUTER_MATERIALS = ["棉質", "尼龍", "羊毛"];
const ACC_MATERIALS = ["皮革", "尼龍"];
const FITS = ["合身", "標準", "寬鬆"];

function materialSeasons(material: string): Season[] {
  if (material === "亞麻" || material === "雪紡") return ["spring", "summer"];
  if (material === "針織" || material === "羊毛") return ["autumn", "winter"];
  return ["spring", "summer", "autumn", "winter"];
}

function resolveSeasons(t: TypeDef, material: string): Season[] {
  if (t.seasonBias && t.seasonBias.length) return t.seasonBias;
  return materialSeasons(material);
}

// Five naming templates, chosen by index, to avoid rows of near-identical names.
function composeName(
  idx: number,
  color: string,
  material: string,
  fit: string,
  type: string,
  series: string,
): string {
  switch (idx % 5) {
    case 0:
      return `${color}${material}${type}`;
    case 1:
      return `${series}系列 ${color}${type}`;
    case 2:
      return `${color}${fit}版${type}`;
    case 3:
      return `${material}質感${color}${type}`;
    default:
      return `${color}${material}${type}（${series}）`;
  }
}

// FNV-1a hash → used to scramble catalog order so neighbouring cards differ
// across colour / type / category instead of only by the innermost attribute.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildCategory(
  category: Category,
  types: TypeDef[],
  materials: string[],
  fits: string[],
  startIdx: number,
): Item[] {
  const items: Item[] = [];
  let idx = startIdx;
  for (const color of COLORS) {
    for (const series of SERIES) {
      for (const t of types) {
        for (const material of materials) {
          for (const fit of fits) {
            const name = composeName(idx, color.name, material, fit, t.name, series);
            items.push({
              id: `cat_${idx}`,
              brand: BRANDS[idx % BRANDS.length],
              name,
              category,
              seasons: resolveSeasons(t, material),
              colors: [color.name],
              tags: t.tags,
              imageUrl: `swatch:${color.hex}:${category}`,
            });
            idx++;
          }
        }
      }
    }
  }
  return items;
}

function buildAccessories(startIdx: number): Item[] {
  const items: Item[] = [];
  let idx = startIdx;
  for (const color of COLORS) {
    for (const series of SERIES) {
      for (const t of ACCESSORIES) {
        for (const material of ACC_MATERIALS) {
          const name = composeName(idx, color.name, material, "標準", t.name, series);
          items.push({
            id: `cat_${idx}`,
            brand: BRANDS[idx % BRANDS.length],
            name,
            category: "accessories",
            seasons: ["spring", "summer", "autumn", "winter"],
            colors: [color.name],
            tags: t.tags,
            imageUrl: `swatch:${color.hex}:accessories`,
          });
          idx++;
        }
      }
    }
  }
  return items;
}

let CATALOG_CACHE: Item[] | null = null;

/** The full generated catalog (>10,000 items), scrambled for visual variety. */
export function getCatalog(): Item[] {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  const tops = buildCategory("tops", TOPS, TOP_MATERIALS, FITS, 0);
  const bottoms = buildCategory("bottoms", BOTTOMS, BOTTOM_MATERIALS, FITS, tops.length);
  const outer = buildCategory("outerwear", OUTER, OUTER_MATERIALS, FITS, tops.length + bottoms.length);
  const acc = buildAccessories(tops.length + bottoms.length + outer.length);
  const all = [...tops, ...bottoms, ...outer, ...acc];
  // Deterministic scramble so the grid (and category views) show varied
  // neighbours rather than three near-identical items in a row.
  all.sort((a, b) => hash(a.id) - hash(b.id));
  CATALOG_CACHE = all;
  return CATALOG_CACHE;
}

export const CATALOG_SIZE = (): number => getCatalog().length;
