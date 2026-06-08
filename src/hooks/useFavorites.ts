"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  favoritesStore,
  addFavoriteToStore,
  deleteFavoriteFromStore,
} from "@/lib/store";
import type { Outfit } from "@/lib/types";

/** Subscribes to the shared favorites store (synced across all components). */
export function useFavorites() {
  const favorites = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );

  const addFav = useCallback((outfit: Outfit) => addFavoriteToStore(outfit), []);
  const deleteFav = useCallback((id: string) => deleteFavoriteFromStore(id), []);

  return { favorites, addFav, deleteFav };
}
