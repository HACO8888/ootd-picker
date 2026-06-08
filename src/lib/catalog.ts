// Procedurally generated catalog (>10,000 styles).
// Deterministic (no Math.random / Date) so server and client build the exact
// same array — required for a stable useSyncExternalStore server snapshot.
// Images reuse the existing photo pool via getAutoImage (keyword-based mapping).
import { getAutoImage } from "./recommend";
import type { Item, Category, Season } from "./types";

const BRANDS = ["UNIQLO", "NET", "GU"];

// 16 colors — names that equal a closet filter swatch (白色/奶油色/焦糖色/鼠尾草綠/靛藍)
// will be matched by the sidebar colour filter.
const COLORS = [
  "白色", "奶油色", "米白色", "卡其色", "焦糖色", "咖啡色", "黑色", "靛藍",
  "藏青", "鼠尾草綠", "墨綠", "灰色", "粉色", "酒紅", "天藍", "杏色",
];

const STYLES = ["經典", "時尚", "復古"];

interface TypeDef {
  name: string;
  /** Coarse season bias; merged with material rules. */
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
    for (const style of STYLES) {
      for (const t of types) {
        for (const material of materials) {
          for (const fit of fits) {
            const name = `${style}${color}${material}${fit}${t.name}`;
            const colors = [color];
            items.push({
              id: `cat_${idx}`,
              brand: BRANDS[idx % BRANDS.length],
              name,
              category,
              seasons: resolveSeasons(t, material),
              colors,
              tags: t.tags,
              imageUrl: getAutoImage(name, category, colors),
            });
            idx++;
          }
        }
      }
    }
  }
  return items;
}

// Accessories have no "fit" axis → single pseudo-fit to keep the loop uniform.
function buildAccessories(startIdx: number): Item[] {
  const items: Item[] = [];
  let idx = startIdx;
  for (const color of COLORS) {
    for (const style of STYLES) {
      for (const t of ACCESSORIES) {
        for (const material of ACC_MATERIALS) {
          const name = `${style}${color}${material}${t.name}`;
          const colors = [color];
          items.push({
            id: `cat_${idx}`,
            brand: BRANDS[idx % BRANDS.length],
            name,
            category: "accessories",
            seasons: ["spring", "summer", "autumn", "winter"],
            colors,
            tags: t.tags,
            imageUrl: getAutoImage(name, "accessories", colors),
          });
          idx++;
        }
      }
    }
  }
  return items;
}

let CATALOG_CACHE: Item[] | null = null;

/** The full generated catalog (>10,000 items). Built once, memoised. */
export function getCatalog(): Item[] {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  const tops = buildCategory("tops", TOPS, TOP_MATERIALS, FITS, 0);
  const bottoms = buildCategory("bottoms", BOTTOMS, BOTTOM_MATERIALS, FITS, tops.length);
  const outer = buildCategory("outerwear", OUTER, OUTER_MATERIALS, FITS, tops.length + bottoms.length);
  const acc = buildAccessories(tops.length + bottoms.length + outer.length);
  CATALOG_CACHE = [...tops, ...bottoms, ...outer, ...acc];
  return CATALOG_CACHE;
}

export const CATALOG_SIZE = (): number => getCatalog().length;
