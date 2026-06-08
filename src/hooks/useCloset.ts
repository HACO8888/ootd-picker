"use client";

import { useCallback, useSyncExternalStore } from "react";
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

  const addItem = useCallback(
    (
      name: string,
      category: Category,
      seasons: Season[],
      colors: string | string[],
      tags: string | string[],
      imageUrl: string,
      brand?: string,
    ) => addClosetItemToStore(name, category, seasons, colors, tags, imageUrl, brand),
    [],
  );

  const deleteItem = useCallback((id: string) => deleteClosetItemFromStore(id), []);

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<Item, "id">>) => updateClosetItemInStore(id, patch),
    [],
  );

  return { closet, addItem, deleteItem, updateItem };
}
