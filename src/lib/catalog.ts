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

/** The full catalog: one item per real labelled product photo. */
export function getCatalog(): Item[] {
  if (CATALOG_CACHE) return CATALOG_CACHE;
  const items: Item[] = (data as RawItem[]).map((it, idx) => ({
    id: it.id,
    brand: BRANDS[idx % BRANDS.length],
    name: it.name,
    category: it.category,
    seasons: it.seasons,
    colors: it.colors,
    tags: it.tags,
    imageUrl: USE_GEN ? `/images/catalog/gen/${it.id}.png` : it.imageUrl,
  }));
  items.sort((a, b) => hash(a.id) - hash(b.id));
  CATALOG_CACHE = items;
  return CATALOG_CACHE;
}

export const CATALOG_SIZE = (): number => getCatalog().length;
