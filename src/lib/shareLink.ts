// Encode/decode an outfit as a shareable URL. Only ids are encoded; the target
// device reconstructs from the static catalog + lookbooks (no localStorage
// dependency). Garments that live only in the sharer's private wardrobe (c_*)
// can't be resolved cross-device — those slots become null and `missing` is set.
import { getCatalog } from "./catalog";
import { buildCloset, MAKEUP_LOOKBOOK, PERFUME_LOOKBOOK } from "./data";
import { buildReasons } from "./recommend";
import { evaluateHarmony } from "./color-harmony";
import type { Outfit, Item, Gender, Weather } from "./types";

export function encodeShareParams(o: Outfit): string {
  const p = new URLSearchParams();
  if (o.top) p.set("t", o.top.id);
  if (o.bottom) p.set("b", o.bottom.id);
  if (o.outerwear) p.set("o", o.outerwear.id);
  if (o.accessory) p.set("a", o.accessory.id);
  p.set("m", o.makeup.id);
  p.set("p", o.perfume.id);
  p.set("g", o.context.gender);
  p.set("w", o.context.weather);
  if (o.context.mood) p.set("mood", o.context.mood);
  if (o.context.destination) p.set("dest", o.context.destination);
  return p.toString();
}

let RESOLVE_INDEX: Map<string, Item> | null = null;
function resolveItem(id: string): Item | null {
  if (!RESOLVE_INDEX) {
    RESOLVE_INDEX = new Map();
    for (const i of [...getCatalog(), ...buildCloset()]) RESOLVE_INDEX.set(i.id, i);
  }
  return RESOLVE_INDEX.get(id) ?? null;
}

/**
 * Reconstruct an outfit from share params. Returns null for an invalid link
 * (missing weather/makeup/perfume). `missing` flags that some private garments
 * couldn't be resolved on this device.
 */
export function decodeShareParams(params: URLSearchParams): { outfit: Outfit; missing: boolean } | null {
  const weather = params.get("w") as Weather | null;
  const makeup = MAKEUP_LOOKBOOK.find((m) => m.id === params.get("m"));
  const perfume = PERFUME_LOOKBOOK.find((p) => p.id === params.get("p"));
  if (!weather || !makeup || !perfume) return null;

  let missing = false;
  const slot = (key: string): Item | null => {
    const id = params.get(key);
    if (!id) return null;
    const item = resolveItem(id);
    if (!item) missing = true;
    return item;
  };

  const outfit: Outfit = {
    top: slot("t"),
    bottom: slot("b"),
    outerwear: slot("o"),
    accessory: slot("a"),
    makeup,
    perfume,
    context: {
      weather,
      mood: params.get("mood") ?? "",
      destination: params.get("dest") ?? "",
      gender: (params.get("g") as Gender) || "unisex",
    },
  };
  outfit.harmony = evaluateHarmony(outfit);
  outfit.reasons = buildReasons(outfit);
  return { outfit, missing };
}
