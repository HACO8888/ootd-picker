// Procedurally generated catalog (>10,000 styles).
// Deterministic (no Math.random / Date) so server and client build the exact
// same array — required for a stable useSyncExternalStore server snapshot.
// Each item carries its real colour, so thumbnails are colour-accurate swatches
// (rendered by SmartImage) instead of reusing a handful of photos.
import { IMG } from "./data";
import type { Item, Category, Season } from "./types";

const BRANDS = ["UNIQLO", "NET", "GU"];

// Real product photos: the original 17 studio shots + verified Unsplash photos.
const C = (f: string) => `/images/catalog/${f}`;
const PHOTOS = {
  tshirtLight: [IMG.white_tshirt, C("tshirt_white.jpg")],
  tshirtDark: [IMG.black_tshirt],
  shirt: [IMG.flannel_shirt, IMG.linen_blouse, C("shirt_white.jpg"), C("shirt_blue.jpg")],
  sweater: [IMG.pink_sweater, C("sweater_beige.jpg"), C("sweater_grey.jpg")],
  hoodie: [IMG.blue_hoodie, C("hoodie_grey.jpg")],
  pantsDark: [IMG.black_trousers],
  pantsLight: [IMG.blue_jeans, C("jeans_blue.jpg")],
  widepants: [IMG.wide_pants],
  shorts: [IMG.khaki_shorts, C("shorts_khaki.jpg")],
  skirt: [IMG.pleated_skirt, C("skirt_black.jpg")],
  jacket: [IMG.denim_jacket, IMG.leather_jacket, C("jacket_leather.jpg")],
  coat: [IMG.trench_coat, IMG.white_puffer, C("coat_camel.jpg")],
  cardigan: [IMG.pink_sweater, C("sweater_beige.jpg")],
  backpack: [IMG.black_backpack, C("backpack_black.jpg")],
  handbag: [IMG.leather_handbag, C("handbag_brown.jpg")],
  crossbag: [IMG.leather_handbag, IMG.black_backpack],
};

// When generated images exist (see scripts/generate-images.ts), enable them with
// NEXT_PUBLIC_USE_GENERATED_IMAGES=1 to serve one unique photo per item.
const USE_GEN = process.env.NEXT_PUBLIC_USE_GENERATED_IMAGES === "1";

const DARK_COLOR = /黑|藏青|靛|墨綠|咖啡|酒紅/;
const pick = (arr: string[], idx: number) => arr[idx % arr.length];

/** The image for catalog item #idx: a generated one if enabled, else a photo. */
function imageForItem(idx: number, silhouette: string, colorName: string): string {
  if (USE_GEN) return `/images/catalog/gen/cat_${idx}.png`;
  return catalogPhoto(silhouette, colorName, idx);
}

/** Map a silhouette + colour to a real product photo (deterministic spread). */
function catalogPhoto(silhouette: string, colorName: string, idx: number): string {
  const dark = DARK_COLOR.test(colorName);
  switch (silhouette) {
    case "tshirt":
    case "polo":
    case "vest":
      return dark ? PHOTOS.tshirtDark[0] : pick(PHOTOS.tshirtLight, idx);
    case "shirt":
      return pick(PHOTOS.shirt, idx);
    case "sweater":
      return pick(PHOTOS.sweater, idx);
    case "hoodie":
      return pick(PHOTOS.hoodie, idx);
    case "pants":
      return dark ? PHOTOS.pantsDark[0] : pick(PHOTOS.pantsLight, idx);
    case "widepants":
      return PHOTOS.widepants[0];
    case "shorts":
      return pick(PHOTOS.shorts, idx);
    case "skirt":
      return pick(PHOTOS.skirt, idx);
    case "jacket":
      return pick(PHOTOS.jacket, idx);
    case "coat":
      return pick(PHOTOS.coat, idx);
    case "cardigan":
      return pick(PHOTOS.cardigan, idx);
    case "backpack":
      return pick(PHOTOS.backpack, idx);
    case "handbag":
      return pick(PHOTOS.handbag, idx);
    case "crossbag":
      return pick(PHOTOS.crossbag, idx);
    default:
      return IMG.white_tshirt;
  }
}

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

/** Map a garment type to one of the drawable SVG silhouettes (see SmartImage). */
function silhouetteFor(category: Category, typeName: string): string {
  if (category === "tops") {
    if (/連帽/.test(typeName)) return "hoodie";
    if (/襯衫|罩衫/.test(typeName)) return "shirt";
    if (/Polo/.test(typeName)) return "polo";
    if (/毛衣|針織|高領/.test(typeName)) return "sweater";
    if (/背心/.test(typeName)) return "vest";
    return "tshirt";
  }
  if (category === "bottoms") {
    if (/裙/.test(typeName)) return "skirt";
    if (/短褲/.test(typeName)) return "shorts";
    if (/寬褲|闊腿/.test(typeName)) return "widepants";
    return "pants";
  }
  if (category === "outerwear") {
    if (/風衣|大衣/.test(typeName)) return "coat";
    if (/開衫/.test(typeName)) return "cardigan";
    return "jacket";
  }
  if (/後背/.test(typeName)) return "backpack";
  if (/斜背|腰/.test(typeName)) return "crossbag";
  return "handbag";
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
              imageUrl: imageForItem(idx, silhouetteFor(category, t.name), color.name),
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
            imageUrl: imageForItem(idx, silhouetteFor("accessories", t.name), color.name),
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
