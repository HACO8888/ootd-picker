// localStorage persistence — ported from legacy app.js, made SSR-safe.
// Storage keys are kept identical to v10 so existing user data still loads.
import { buildCloset } from "./data";
import { getAutoImage } from "./recommend";
import type { Item, Favorite, Outfit, Category, Season } from "./types";

const STORAGE_KEY = "ootd_picker_closet_v10";
const FAVORITES_KEY = "ootd_picker_favorites_v10";

const hasWindow = () => typeof window !== "undefined";

/* ─── Closet ─────────────────────────────────────────────────────────────── */
export function getCloset(): Item[] {
  if (!hasWindow()) return buildCloset();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = buildCloset();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as Item[];
  } catch {
    return buildCloset();
  }
}

export function saveCloset(closet: Item[]): void {
  if (!hasWindow()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
}

export function addClosetItem(
  name: string,
  category: Category,
  seasons: Season[],
  colors: string | string[],
  tags: string | string[],
  imageUrl: string,
  brand?: string,
): Item[] {
  const closet = getCloset();
  const colorsArr = Array.isArray(colors) ? colors : [colors];
  const finalImg = imageUrl || getAutoImage(name, category, colorsArr);
  const item: Item = {
    id: "c_" + Date.now(),
    name,
    brand: brand || "自訂",
    category,
    seasons,
    colors: colorsArr,
    tags: Array.isArray(tags) ? tags : [tags],
    imageUrl: finalImg,
  };
  const next = [item, ...closet];
  saveCloset(next);
  return next;
}

export function deleteClosetItem(id: string): Item[] {
  const next = getCloset().filter((i) => i.id !== id);
  saveCloset(next);
  return next;
}

/* ─── Favorites ──────────────────────────────────────────────────────────── */
export function getFavorites(): Favorite[] {
  if (!hasWindow()) return [];
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Favorite[];
  } catch {
    return [];
  }
}

export function addFavorite(outfit: Outfit): Favorite[] {
  const favorites = getFavorites();
  const fav: Favorite = {
    id: "f_" + Date.now(),
    date: new Date().toLocaleDateString("zh-Hant"),
    outfit,
  };
  const next = [fav, ...favorites];
  if (hasWindow()) localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function deleteFavorite(id: string): Favorite[] {
  const next = getFavorites().filter((f) => f.id !== id);
  if (hasWindow()) localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}
