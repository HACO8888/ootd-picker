"use client";

import { useSyncExternalStore } from "react";
import { userClosetStore } from "@/lib/store";

/**
 * Subscribes to the user's own wardrobe (curated defaults + uploads, minus the
 * shared catalog). Kept in sync with closet mutations via the store.
 */
export function useUserCloset() {
  const userCloset = useSyncExternalStore(
    userClosetStore.subscribe,
    userClosetStore.getSnapshot,
    userClosetStore.getServerSnapshot,
  );
  return { userCloset };
}
