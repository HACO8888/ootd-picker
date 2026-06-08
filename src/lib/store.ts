// Shared external stores for closet + favorites, built on useSyncExternalStore.
// This keeps every component in sync (saving in the picker instantly updates the
// favorites drawer) and reads localStorage the React-blessed way (no effect).
import { getCatalog } from "./catalog";
import {
  getCloset,
  addClosetItem as persistAdd,
  deleteClosetItem as persistDelete,
  updateClosetItem as persistUpdate,
  getFavorites,
  addFavorite as persistAddFav,
  deleteFavorite as persistDeleteFav,
  renameFavorite as persistRenameFav,
  setFavorites as persistSetFavs,
} from "./storage";
import type { Item, Favorite, Outfit, Category, Season } from "./types";

/* ─── generic tiny store ─────────────────────────────────────────────────── */
function createStore<T>(serverValue: T, read: () => T) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot(): T {
      if (cache === null) cache = read();
      return cache;
    },
    getServerSnapshot(): T {
      return serverValue;
    },
    set(value: T) {
      cache = value;
      emit();
    },
  };
}

// Stable server-side snapshots (must be referentially constant across renders).
const SERVER_CLOSET = getCatalog();
const SERVER_FAVORITES: Favorite[] = [];

export const closetStore = createStore<Item[]>(SERVER_CLOSET, getCloset);
export const favoritesStore = createStore<Favorite[]>(SERVER_FAVORITES, getFavorites);

/* ─── closet mutators ────────────────────────────────────────────────────── */
export function addClosetItemToStore(
  name: string,
  category: Category,
  seasons: Season[],
  colors: string | string[],
  tags: string | string[],
  imageUrl: string,
  brand?: string,
) {
  closetStore.set(persistAdd(name, category, seasons, colors, tags, imageUrl, brand));
}

export function deleteClosetItemFromStore(id: string) {
  closetStore.set(persistDelete(id));
}

export function updateClosetItemInStore(id: string, patch: Partial<Omit<Item, "id">>) {
  closetStore.set(persistUpdate(id, patch));
}

/* ─── favorites mutators ─────────────────────────────────────────────────── */
export function addFavoriteToStore(outfit: Outfit, name?: string) {
  favoritesStore.set(persistAddFav(outfit, name));
}

export function deleteFavoriteFromStore(id: string) {
  favoritesStore.set(persistDeleteFav(id));
}

export function renameFavoriteInStore(id: string, name: string) {
  favoritesStore.set(persistRenameFav(id, name));
}

export function setFavoritesInStore(list: Favorite[]) {
  favoritesStore.set(persistSetFavs(list));
}
