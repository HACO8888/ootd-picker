// Curated catalog: built from the 17 clean studio product photos (the originals),
// each expanded into a few series/occasion variants. Every item therefore shows a
// plain garment-only photo whose colour and type match its name exactly. ~340 items.
import { buildCloset } from "./data";
import type { Item } from "./types";

// Enable per-item generated images (scripts/generate-images.ts) when ready.
const USE_GEN = process.env.NEXT_PUBLIC_USE_GENERATED_IMAGES === "1";

const SERIES = ["都會", "假日", "極簡", "學院", "微旅"];
const OCCASIONS = ["通勤", "休閒", "約會", "旅行"];

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

/**
 * The catalog: each of the 17 clean base garments × 5 series × 4 occasions.
 * Base name/colour/photo are kept intact (so text always matches the image);
 * only an abstract series + occasion prefix varies to give distinct names.
 */
export function getCatalog(): Item[] {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  const base = buildCloset();
  const items: Item[] = [];
  let idx = 0;
  for (const item of base) {
    for (const series of SERIES) {
      for (const occasion of OCCASIONS) {
        items.push({
          ...item,
          id: `cat_${idx}`,
          name: `${series}系列・${occasion}款 ${item.name}`,
          imageUrl: USE_GEN ? `/images/catalog/gen/cat_${idx}.png` : item.imageUrl,
        });
        idx++;
      }
    }
  }
  items.sort((a, b) => hash(a.id) - hash(b.id));
  CATALOG_CACHE = items;
  return CATALOG_CACHE;
}

export const CATALOG_SIZE = (): number => getCatalog().length;
