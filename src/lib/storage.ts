// localStorage persistence — SSR-safe.
// Closet model (v11): a large static CATALOG (>10,000 items) composed with the
// user's own additions, hidden catalog ids and per-item overrides. Only the
// user's deltas are stored in localStorage, so the catalog never bloats it.
import { getAutoImage } from "./recommend";
import { getCatalog } from "./catalog";
import { buildCloset } from "./data";
import type { Item, Favorite, Outfit, Category, Season, WearLog } from "./types";

const LEGACY_CLOSET_KEY = "ootd_picker_closet_v10";
const USER_KEY = "ootd_picker_user_items_v11";
const HIDDEN_KEY = "ootd_picker_hidden_v11";
const OVERRIDE_KEY = "ootd_picker_overrides_v11";
const FAVORITES_KEY = "ootd_picker_favorites_v10";
const WEAR_LOG_KEY = "ootd_picker_wear_log_v1";

const hasWindow = () => typeof window !== "undefined";

/** Collision-resistant id with a type prefix (Date.now() alone collides on
 *  same-ms adds — rapid clicks / batches — corrupting edit/delete-by-id). */
function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return prefix + rand;
}

function read<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** localStorage 已滿時拋出的可辨識錯誤，供 UI 顯示友善訊息。 */
export class StorageQuotaError extends Error {
  constructor() {
    super("本機儲存空間不足，請刪除部分單品或縮小上傳圖片後再試。");
    this.name = "StorageQuotaError";
  }
}

function write(key: string, value: unknown): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // 配額超出（多為過大的上傳 data URL）：拋出可辨識錯誤而非靜默失敗。
    if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.code === 22)) {
      throw new StorageQuotaError();
    }
    throw err;
  }
}

/* ─── Closet (catalog ⊕ user deltas) ─────────────────────────────────────── */
function readUser(): Item[] {
  return read<Item[]>(USER_KEY, []);
}
function readHidden(): string[] {
  return read<string[]>(HIDDEN_KEY, []);
}
function readOverrides(): Record<string, Partial<Item>> {
  return read<Record<string, Partial<Item>>>(OVERRIDE_KEY, {});
}

/* ─── Closet delta snapshot (for cloud sync) ─────────────────────────────── */
export interface ClosetDeltas {
  userItems: Item[];
  hidden: string[];
  overrides: Record<string, Partial<Item>>;
}

/** The user's closet deltas — the three localStorage keys as one snapshot. */
export function getClosetDeltas(): ClosetDeltas {
  if (!hasWindow()) return { userItems: [], hidden: [], overrides: {} };
  migrate();
  return { userItems: readUser(), hidden: readHidden(), overrides: readOverrides() };
}

/** Replace all closet deltas (used by sync merge). Returns the composed closet. */
export function setClosetDeltas(d: ClosetDeltas): Item[] {
  write(USER_KEY, d.userItems);
  write(HIDDEN_KEY, d.hidden);
  write(OVERRIDE_KEY, d.overrides);
  return compose();
}

/** One-time migration: lift v10 user-added items (id `c_…`) into the v11 store. */
function migrate(): void {
  if (!hasWindow()) return;
  if (localStorage.getItem(USER_KEY) !== null) return; // already migrated
  const legacy = read<Item[]>(LEGACY_CLOSET_KEY, []);
  const userItems = legacy.filter((i) => typeof i.id === "string" && i.id.startsWith("c_"));
  write(USER_KEY, userItems);
}

function compose(): Item[] {
  const user = readUser();
  const hidden = new Set(readHidden());
  const overrides = readOverrides();
  // Single pass: drop hidden ids and apply per-item overrides.
  const catalog = getCatalog().flatMap((i) =>
    hidden.has(i.id) ? [] : [overrides[i.id] ? { ...i, ...overrides[i.id] } : i],
  );
  return [...user, ...catalog];
}

export function getCloset(): Item[] {
  if (!hasWindow()) return getCatalog();
  migrate();
  return compose();
}

/**
 * The user's *own* wardrobe — the curated defaults (buildCloset) plus the user's
 * uploads, with overrides applied and hidden ids removed. Excludes the large
 * shared catalog, so wardrobe statistics describe the user, not the dataset.
 */
export function getUserCloset(): Item[] {
  if (!hasWindow()) return buildCloset();
  migrate();
  const user = readUser();
  const hidden = new Set(readHidden());
  const overrides = readOverrides();
  const defaults = buildCloset().flatMap((i) =>
    hidden.has(i.id) ? [] : [overrides[i.id] ? { ...i, ...overrides[i.id] } : i],
  );
  return [...user, ...defaults];
}

export function addClosetItem(
  name: string,
  category: Category,
  seasons: Season[],
  colors: string | string[],
  tags: string | string[],
  imageUrl: string,
  brand?: string,
): Item[] {
  const colorsArr = Array.isArray(colors) ? colors : [colors];
  const item: Item = {
    id: uid("c_"),
    name,
    brand: brand || "自訂",
    category,
    seasons,
    colors: colorsArr,
    tags: Array.isArray(tags) ? tags : [tags],
    imageUrl: imageUrl || getAutoImage(name, category, colorsArr),
    updatedAt: Date.now(),
  };
  write(USER_KEY, [item, ...readUser()]);
  return compose();
}

export function deleteClosetItem(id: string): Item[] {
  const user = readUser();
  if (user.some((i) => i.id === id)) {
    write(USER_KEY, user.filter((i) => i.id !== id));
  } else {
    const hidden = new Set(readHidden());
    hidden.add(id);
    write(HIDDEN_KEY, [...hidden]);
  }
  return compose();
}

export function updateClosetItem(id: string, patch: Partial<Omit<Item, "id">>): Item[] {
  const user = readUser();
  if (user.some((i) => i.id === id)) {
    write(USER_KEY, user.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)));
  } else {
    const overrides = readOverrides();
    overrides[id] = { ...overrides[id], ...patch };
    write(OVERRIDE_KEY, overrides);
  }
  return compose();
}

/* ─── Favorites ──────────────────────────────────────────────────────────── */
export function getFavorites(): Favorite[] {
  if (!hasWindow()) return [];
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Favorite[];
  } catch {
    return [];
  }
}

function persistFavorites(list: Favorite[]): Favorite[] {
  if (hasWindow()) localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  return list;
}

export function addFavorite(outfit: Outfit, name?: string): Favorite[] {
  const fav: Favorite = {
    id: uid("f_"),
    date: new Date().toLocaleDateString("zh-Hant"),
    name: name?.trim() || undefined,
    outfit,
    updatedAt: Date.now(),
  };
  return persistFavorites([fav, ...getFavorites()]);
}

export function deleteFavorite(id: string): Favorite[] {
  return persistFavorites(getFavorites().filter((f) => f.id !== id));
}

export function renameFavorite(id: string, name: string): Favorite[] {
  const trimmed = name.trim();
  return persistFavorites(
    getFavorites().map((f) =>
      f.id === id ? { ...f, name: trimmed || undefined, updatedAt: Date.now() } : f,
    ),
  );
}

/** Replace the whole favorites list (used by import). */
export function setFavorites(list: Favorite[]): Favorite[] {
  return persistFavorites(list);
}

/** A garment slot must be null/absent or a minimally Item-shaped object. */
function isItemLike(s: unknown): boolean {
  if (s == null) return true;
  if (typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.category === "string";
}

/** Validate an imported outfit so consumers (drawers/calendar) never crash
 *  dereferencing a missing context/makeup/perfume or a malformed garment. */
function isValidOutfit(outfit: unknown): boolean {
  if (!outfit || typeof outfit !== "object") return false;
  const o = outfit as Record<string, unknown>;
  const ctx = o.context as Record<string, unknown> | undefined;
  if (!ctx || typeof ctx.weather !== "string") return false;
  const mk = o.makeup as Record<string, unknown> | undefined;
  if (!mk || typeof mk.name !== "string") return false;
  const pf = o.perfume as Record<string, unknown> | undefined;
  if (!pf || typeof pf.name !== "string") return false;
  return (["top", "bottom", "outerwear", "accessory"] as const).every((k) => isItemLike(o[k]));
}

/** Parse + validate an exported favorites JSON string. Throws on bad shape.
 *  Stamps updatedAt so imported records reliably win the login last-write-wins. */
export function parseFavoritesJSON(raw: string): Favorite[] {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("格式錯誤：根節點需為陣列");
  for (const f of data) {
    if (!f || typeof f.id !== "string" || !isValidOutfit(f.outfit)) {
      throw new Error("格式錯誤：缺少或不正確的必要欄位");
    }
  }
  const now = Date.now();
  return (data as Favorite[]).map((f) => ({ ...f, updatedAt: now }));
}

/* ─── Wear log (outfits actually worn, keyed by local ISO date) ──────────────── */
export function getWearLogs(): WearLog[] {
  if (!hasWindow()) return [];
  const raw = localStorage.getItem(WEAR_LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WearLog[];
  } catch {
    return [];
  }
}

function persistWearLogs(list: WearLog[]): WearLog[] {
  if (hasWindow()) localStorage.setItem(WEAR_LOG_KEY, JSON.stringify(list));
  return list;
}

export function addWearLog(
  outfit: Outfit,
  date: string,
  opts?: { note?: string; favoriteId?: string },
): WearLog[] {
  const now = Date.now();
  const log: WearLog = {
    id: "w_" + now + "_" + Math.random().toString(36).slice(2, 7),
    date,
    outfit,
    note: opts?.note?.trim() || undefined,
    favoriteId: opts?.favoriteId,
    createdAt: now,
    updatedAt: now,
  };
  // Newest first; the journal regroups by date anyway.
  return persistWearLogs([log, ...getWearLogs()]);
}

export function deleteWearLog(id: string): WearLog[] {
  return persistWearLogs(getWearLogs().filter((l) => l.id !== id));
}

export function updateWearLogNote(id: string, note: string): WearLog[] {
  const trimmed = note.trim();
  return persistWearLogs(
    getWearLogs().map((l) =>
      l.id === id ? { ...l, note: trimmed || undefined, updatedAt: Date.now() } : l,
    ),
  );
}

/** Replace the whole wear-log list (used by import). */
export function setWearLogs(list: WearLog[]): WearLog[] {
  return persistWearLogs(list);
}

/** Parse + validate an exported wear-log JSON string. Throws on bad shape.
 *  Validates outfit.context/makeup (DayDetailDrawer dereferences them) and
 *  stamps updatedAt/createdAt so imported records win the login merge. */
export function parseWearLogsJSON(raw: string): WearLog[] {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("格式錯誤：根節點需為陣列");
  for (const l of data) {
    if (!l || typeof l.id !== "string" || typeof l.date !== "string" || !isValidOutfit(l.outfit)) {
      throw new Error("格式錯誤：缺少或不正確的必要欄位");
    }
  }
  const now = Date.now();
  return (data as WearLog[]).map((l) => ({
    ...l,
    createdAt: typeof l.createdAt === "number" ? l.createdAt : now,
    updatedAt: now,
  }));
}
