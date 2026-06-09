"use client";

import { useSyncExternalStore } from "react";
import {
  favoritesStore,
  addFavoriteToStore,
  deleteFavoriteFromStore,
  renameFavoriteInStore,
  setFavoritesInStore,
} from "@/lib/store";
import type { Favorite, Outfit } from "@/lib/types";

/** Subscribes to the shared favorites store (synced across all components). */
export function useFavorites() {
  const favorites = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );

  // The React Compiler memoizes these — no manual useCallback needed.
  const addFav = (outfit: Outfit, name?: string) => addFavoriteToStore(outfit, name);
  const deleteFav = (id: string) => deleteFavoriteFromStore(id);
  const renameFav = (id: string, name: string) => renameFavoriteInStore(id, name);
  const replaceAll = (list: Favorite[]) => setFavoritesInStore(list);

  return { favorites, addFav, deleteFav, renameFav, replaceAll };
}
