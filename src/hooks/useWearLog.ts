"use client";

import { useSyncExternalStore } from "react";
import {
  wearLogStore,
  addWearLogToStore,
  deleteWearLogFromStore,
  updateWearLogNoteInStore,
  setWearLogsInStore,
} from "@/lib/store";
import type { Outfit, WearLog } from "@/lib/types";

/** Subscribes to the shared wear-log store (synced across all components). */
export function useWearLog() {
  const wearLogs = useSyncExternalStore(
    wearLogStore.subscribe,
    wearLogStore.getSnapshot,
    wearLogStore.getServerSnapshot,
  );

  // The React Compiler memoizes these — no manual useCallback needed.
  const logWear = (outfit: Outfit, date: string, opts?: { note?: string; favoriteId?: string }) =>
    addWearLogToStore(outfit, date, opts);
  const deleteLog = (id: string) => deleteWearLogFromStore(id);
  const updateNote = (id: string, note: string) => updateWearLogNoteInStore(id, note);
  const replaceAll = (list: WearLog[]) => setWearLogsInStore(list);

  return { wearLogs, logWear, deleteLog, updateNote, replaceAll };
}
