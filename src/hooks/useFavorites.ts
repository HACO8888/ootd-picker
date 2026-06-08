"use client";

import { useCallback, useSyncExternalStore } from "react";
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

  const addFav = useCallback((outfit: Outfit, name?: string) => addFavoriteToStore(outfit, name), []);
  const deleteFav = useCallback((id: string) => deleteFavoriteFromStore(id), []);
  const renameFav = useCallback((id: string, name: string) => renameFavoriteInStore(id, name), []);
  const replaceAll = useCallback((list: Favorite[]) => setFavoritesInStore(list), []);

  return { favorites, addFav, deleteFav, renameFav, replaceAll };
}
