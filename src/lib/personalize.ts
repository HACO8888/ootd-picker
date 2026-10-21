// Personal style taste — learnt from the garments a user saved (favorites) and
// actually wore (wear logs). Pure, no React / I/O.
//
// Taste is kept at the ATTRIBUTE level (colour, garment type), never item ids:
// an id-level boost would fight the engine's "worn in the last 7 days" penalty
// and would only ever re-suggest the same pieces, whereas attributes transfer
// to garments the user hasn't tried yet.
import { garmentTypeOf } from "./garment-vocab";
import type { Favorite, Item, Outfit, WearLog } from "./types";

export interface StyleTaste {
  /** Colour → relative affinity 0..1 (1 = the user's most-chosen colour). */
  colors: Record<string, number>;
  /** Garment type (T恤 / 牛仔褲 …) → relative affinity 0..1. */
  types: Record<string, number>;
  /** Number of saved / worn garments the taste was learnt from. */
  samples: number;
}

/** A worn outfit is a stronger signal than one merely saved. */
const FAVORITE_WEIGHT = 1;
const WORN_WEIGHT = 1.5;
/** Fewer garments than this is noise — no personalisation. */
export const MIN_TASTE_SAMPLES = 3;
/** Affinity at or above which an attribute counts as a clear preference (used for UI copy). */
export const STRONG_AFFINITY = 0.6;

const garmentsOf = (o: Outfit): Item[] => [o.top, o.bottom, o.outerwear, o.accessory].filter((i): i is Item => Boolean(i));

function normalize(counts: Map<string, number>): Record<string, number> {
  const max = Math.max(0, ...counts.values());
  const out: Record<string, number> = {};
  if (max > 0) for (const [k, v] of counts) out[k] = Math.round((v / max) * 100) / 100;
  return out;
}

/** Learn a taste profile, or null when there isn't enough history yet. */
export function learnTaste(favorites: Favorite[], wearLogs: WearLog[]): StyleTaste | null {
  const colors = new Map<string, number>();
  const types = new Map<string, number>();
  let samples = 0;
  const add = (o: Outfit | undefined, w: number) => {
    if (!o) return;
    for (const i of garmentsOf(o)) {
      samples++;
      for (const c of new Set(i.colors)) colors.set(c, (colors.get(c) ?? 0) + w);
      const t = garmentTypeOf(i.name);
      if (t) types.set(t, (types.get(t) ?? 0) + w);
    }
  };
  for (const f of favorites) add(f.outfit, FAVORITE_WEIGHT);
  for (const l of wearLogs) add(l.outfit, WORN_WEIGHT);
  if (samples < MIN_TASTE_SAMPLES) return null;
  return { colors: normalize(colors), types: normalize(types), samples };
}

/** The user's clearly preferred colours / types present on a garment. */
export function tasteMatches(i: Item, taste: StyleTaste): string[] {
  const out = i.colors.filter((c) => (taste.colors[c] ?? 0) >= STRONG_AFFINITY);
  const t = garmentTypeOf(i.name);
  if (t && (taste.types[t] ?? 0) >= STRONG_AFFINITY) out.push(t);
  return out;
}
