// Catalog sourced from the MIT-licensed Fashion Product Images dataset
// (scripts/fetch-fashion.ts → catalog-data.json). Each item is one unique
// clean white-background product photo, named from the dataset's own colour +
// type labels, so the text always matches the image. No repetition.
import data from "./catalog-data.json";
import type { Item } from "./types";

// Enable per-item generated images (scripts/generate-images.ts) when ready.
const USE_GEN = process.env.NEXT_PUBLIC_USE_GENERATED_IMAGES === "1";
const BRANDS = ["UNIQLO", "NET", "GU"];

interface RawItem {
  id: string;
  name: string;
  category: Item["category"];
  seasons: Item["seasons"];
  colors: string[];
  tags: string[];
  imageUrl: string;
}

// FNV-1a hash → deterministic scramble for varied grid neighbours.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

let CATALOG_CACHE: Item[] | null = null;

// 管理員後台維護的全域目錄調整：覆蓋既有項、下架既有項、新增全域項。
// 客戶端載入 /api/catalog/global 後以 setCatalogOverlay 套用。
interface CatalogOverlay {
  overrides: Record<string, Partial<Item>>;
  hidden: string[];
  extras: Item[];
}
let OVERLAY: CatalogOverlay = { overrides: {}, hidden: [], extras: [] };

/** 套用全域目錄調整並清快取（下次 getCatalog 重建）。 */
export function setCatalogOverlay(overlay: Partial<CatalogOverlay>): void {
  OVERLAY = {
    overrides: overlay.overrides ?? {},
    hidden: overlay.hidden ?? [],
    extras: overlay.extras ?? [],
  };
  CATALOG_CACHE = null;
}

/** The full catalog: one item per real labelled product photo. */
export function getCatalog(): Item[] {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  const hidden = new Set(OVERLAY.hidden);
  const items: Item[] = (data as RawItem[]).flatMap((it, idx) => {
    if (hidden.has(it.id)) return [];
    const base: Item = {
      id: it.id,
      brand: BRANDS[idx % BRANDS.length],
      name: it.name,
      category: it.category,
      seasons: it.seasons,
      colors: it.colors,
      tags: it.tags,
      imageUrl: USE_GEN ? `/images/catalog/gen/${it.id}.png` : it.imageUrl,
    };
    const ov = OVERLAY.overrides[it.id];
    return [ov ? { ...base, ...ov } : base];
  });
  const all = [...OVERLAY.extras, ...items];
  all.sort((a, b) => hash(a.id) - hash(b.id));
  CATALOG_CACHE = all;
  return CATALOG_CACHE;
}
