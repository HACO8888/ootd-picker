// Pure helpers for the wear log — local-date math + month/recency queries.
// Dates are stored as local ISO "YYYY-MM-DD" (never toISOString(), which would
// shift by the UTC offset and land on the wrong calendar day).
import type { WearLog } from "./types";

/** Format a Date as a local ISO date string "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today as a local ISO date string. */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Group the logs of a given month by their ISO date.
 * `month` is 0-indexed (0 = January), matching Date#getMonth.
 * Each day's logs are sorted oldest→newest by createdAt.
 */
export function logsForMonth(
  logs: WearLog[],
  year: number,
  month: number,
): Record<string, WearLog[]> {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const map: Record<string, WearLog[]> = {};
  for (const l of logs) {
    if (l.date.startsWith(prefix)) (map[l.date] ??= []).push(l);
  }
  for (const k in map) map[k].sort((a, b) => a.createdAt - b.createdAt);
  return map;
}

/** Logs worn within the last `days` days (inclusive of today). */
export function wornWithinDays(logs: WearLog[], days: number, now: Date = new Date()): WearLog[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = toISODate(cutoff);
  // ISO "YYYY-MM-DD" sorts lexicographically == chronologically.
  return logs.filter((l) => l.date >= cutoffISO);
}

/** Set of garment ids worn within the last `days` days — for repeat-wear hints. */
export function recentlyWornItemIds(
  logs: WearLog[],
  days: number,
  now: Date = new Date(),
): Set<string> {
  const ids = new Set<string>();
  for (const l of wornWithinDays(logs, days, now)) {
    for (const slot of [l.outfit.top, l.outfit.bottom, l.outfit.outerwear, l.outfit.accessory]) {
      if (slot) ids.add(slot.id);
    }
  }
  return ids;
}
