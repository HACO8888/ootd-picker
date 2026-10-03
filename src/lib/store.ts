// Shared external stores for closet + favorites, built on useSyncExternalStore.
// This keeps every component in sync (saving in the picker instantly updates the
// favorites drawer) and reads localStorage the React-blessed way (no effect).
import { getCatalog, onCatalogRegistered } from "./catalog";
import { buildCloset } from "./data";
import {
  getCloset,
  getUserCloset,
  addClosetItem as persistAdd,
  deleteClosetItem as persistDelete,
  updateClosetItem as persistUpdate,
  getFavorites,
  addFavorite as persistAddFav,
  deleteFavorite as persistDeleteFav,
  renameFavorite as persistRenameFav,
  setFavorites as persistSetFavs,
  getWearLogs,
  addWearLog as persistAddWearLog,
  deleteWearLog as persistDeleteWearLog,
  updateWearLogNote as persistUpdateWearLogNote,
  setWearLogs as persistSetWearLogs,
} from "./storage";
import { enqueueSync, registerStoreRefresh } from "./sync";
import type { Item, Favorite, Outfit, Category, Season, WearLog } from "./types";

/* ─── generic tiny store ─────────────────────────────────────────────────── */
function createStore<T>(serverValue: () => T, read: () => T) {
  let cache: T | null = null;
  let server: T | null = null;
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
      // Lazy + memoized: stable across renders, and computed after the page's
      // catalog source has registered.
      if (server === null) server = serverValue();
      return server;
    },
    set(value: T) {
      cache = value;
      emit();
    },
  };
}

// Server-side snapshots (memoized on first use, so referentially constant).
const SERVER_FAVORITES: Favorite[] = [];
const SERVER_WEAR_LOGS: WearLog[] = [];

export const closetStore = createStore<Item[]>(getCatalog, getCloset);
export const userClosetStore = createStore<Item[]>(buildCloset, getUserCloset);
export const favoritesStore = createStore<Favorite[]>(() => SERVER_FAVORITES, getFavorites);
export const wearLogStore = createStore<WearLog[]>(() => SERVER_WEAR_LOGS, getWearLogs);

// Keep the user-closet view in sync whenever the composed closet mutates.
function syncUserCloset() {
  userClosetStore.set(getUserCloset());
}

/** Re-read every store from localStorage — called by sync after a login merge. */
export function refreshAllStores() {
  closetStore.set(getCloset());
  userClosetStore.set(getUserCloset());
  favoritesStore.set(getFavorites());
  wearLogStore.set(getWearLogs());
}
registerStoreRefresh(refreshAllStores);
// A page that needs the catalog registers it on import; if the closet store
// was already read without it (e.g. after an overlay refresh on another page),
// rebuild it now.
onCatalogRegistered(() => {
  if (typeof window !== "undefined") closetStore.set(getCloset());
});

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
  syncUserCloset();
  enqueueSync("closet");
}

export function deleteClosetItemFromStore(id: string) {
  closetStore.set(persistDelete(id));
  syncUserCloset();
  enqueueSync("closet");
}

export function updateClosetItemInStore(id: string, patch: Partial<Omit<Item, "id">>) {
  closetStore.set(persistUpdate(id, patch));
  syncUserCloset();
  enqueueSync("closet");
}

/* ─── favorites mutators ─────────────────────────────────────────────────── */
export function addFavoriteToStore(outfit: Outfit, name?: string) {
  favoritesStore.set(persistAddFav(outfit, name));
  enqueueSync("favorites");
}

export function deleteFavoriteFromStore(id: string) {
  favoritesStore.set(persistDeleteFav(id));
  enqueueSync("favorites");
}

export function renameFavoriteInStore(id: string, name: string) {
  favoritesStore.set(persistRenameFav(id, name));
  enqueueSync("favorites");
}

export function setFavoritesInStore(list: Favorite[]) {
  favoritesStore.set(persistSetFavs(list));
  enqueueSync("favorites");
}

/* ─── wear-log mutators ──────────────────────────────────────────────────── */
export function addWearLogToStore(
  outfit: Outfit,
  date: string,
  opts?: { note?: string; favoriteId?: string },
) {
  wearLogStore.set(persistAddWearLog(outfit, date, opts));
  enqueueSync("wearlogs");
}

export function deleteWearLogFromStore(id: string) {
  wearLogStore.set(persistDeleteWearLog(id));
  enqueueSync("wearlogs");
}

export function updateWearLogNoteInStore(id: string, note: string) {
  wearLogStore.set(persistUpdateWearLogNote(id, note));
  enqueueSync("wearlogs");
}

export function setWearLogsInStore(list: WearLog[]) {
  wearLogStore.set(persistSetWearLogs(list));
  enqueueSync("wearlogs");
}
