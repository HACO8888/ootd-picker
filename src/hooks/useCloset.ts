"use client";

import { useSyncExternalStore } from "react";
import {
  closetStore,
  addClosetItemToStore,
  deleteClosetItemFromStore,
  updateClosetItemInStore,
} from "@/lib/store";
import type { Category, Item, Season } from "@/lib/types";

/** Subscribes to the shared closet store (synced across all components). */
export function useCloset() {
  const closet = useSyncExternalStore(
    closetStore.subscribe,
    closetStore.getSnapshot,
    closetStore.getServerSnapshot,
  );

  // The React Compiler memoizes these — no manual useCallback needed.
  const addItem = (
    name: string,
    category: Category,
    seasons: Season[],
    colors: string | string[],
    tags: string | string[],
    imageUrl: string,
    brand?: string,
  ) => addClosetItemToStore(name, category, seasons, colors, tags, imageUrl, brand);

  const deleteItem = (id: string) => deleteClosetItemFromStore(id);
  const updateItem = (id: string, patch: Partial<Omit<Item, "id">>) => updateClosetItemInStore(id, patch);

  return { closet, addItem, deleteItem, updateItem };
}
