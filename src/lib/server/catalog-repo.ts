// 目錄管理資料存取（server-only）：makeup / perfume CRUD + 全域 catalog 調整。
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  makeup as makeupTable,
  perfume as perfumeTable,
  catalogExtras,
  catalogOverrides,
} from "@/db/schema";
import { SEED_MAKEUP, SEED_PERFUME } from "@/lib/data";
import type { Makeup, Perfume, Item } from "@/lib/types";

/* ─── 公開讀取快取 ─────────────────────────────────────────────────────────
   /api/looks 與 /api/catalog/global 每次頁面載入都會呼叫（訪客也是），直接查 DB
   會讓匿名流量和登入使用者搶同一個 5 條連線池。資料只由 admin 修改，故在記憶體
   快取 60 秒，admin 寫入時清除（單一 instance；多 instance 時最多延遲 60 秒）。
   快取 Promise 本身，同時進來的請求共用同一次查詢。 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key));
  return value;
}

function invalidate(): void {
  cache.clear();
}

/* ─── Makeup ─────────────────────────────────────────────────────────────── */
export function listMakeup(): Promise<Makeup[]> {
  return cached("makeup", loadMakeup);
}

async function loadMakeup(): Promise<Makeup[]> {
  let rows = await db.select().from(makeupTable);
  if (rows.length === 0) {
    // 首次存取：以 data.ts 為 seed 灌入 DB。
    await db
      .insert(makeupTable)
      .values(SEED_MAKEUP.map((m) => ({ id: m.id, data: m, updatedAt: Date.now() })))
      .onConflictDoNothing();
    rows = await db.select().from(makeupTable);
  }
  return rows.map((r) => r.data);
}

export async function upsertMakeup(item: Makeup): Promise<void> {
  await db
    .insert(makeupTable)
    .values({ id: item.id, data: item, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: makeupTable.id,
      set: { data: item, updatedAt: Date.now() },
    });
  invalidate();
}

export async function deleteMakeup(id: string): Promise<void> {
  await db.delete(makeupTable).where(eq(makeupTable.id, id));
  invalidate();
}

/* ─── Perfume ────────────────────────────────────────────────────────────── */
export function listPerfume(): Promise<Perfume[]> {
  return cached("perfume", loadPerfume);
}

async function loadPerfume(): Promise<Perfume[]> {
  let rows = await db.select().from(perfumeTable);
  if (rows.length === 0) {
    await db
      .insert(perfumeTable)
      .values(SEED_PERFUME.map((p) => ({ id: p.id, data: p, updatedAt: Date.now() })))
      .onConflictDoNothing();
    rows = await db.select().from(perfumeTable);
  }
  return rows.map((r) => r.data);
}

export async function upsertPerfume(item: Perfume): Promise<void> {
  await db
    .insert(perfumeTable)
    .values({ id: item.id, data: item, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: perfumeTable.id,
      set: { data: item, updatedAt: Date.now() },
    });
  invalidate();
}

export async function deletePerfume(id: string): Promise<void> {
  await db.delete(perfumeTable).where(eq(perfumeTable.id, id));
  invalidate();
}

/* ─── 全域 catalog 調整（覆蓋既有項 + 新增全域項）────────────────────────── */
export interface GlobalCatalog {
  overrides: Record<string, Partial<Item>>;
  hidden: string[];
  extras: Item[];
}

export function getGlobalCatalog(): Promise<GlobalCatalog> {
  return cached("global", loadGlobalCatalog);
}

async function loadGlobalCatalog(): Promise<GlobalCatalog> {
  const [overrides, extras] = await Promise.all([
    db.select().from(catalogOverrides),
    db.select().from(catalogExtras),
  ]);
  return {
    overrides: Object.fromEntries(overrides.map((r) => [r.catalogId, r.patch])),
    extras: extras.map((r) => ({
      id: r.id,
      brand: r.brand,
      name: r.name,
      category: r.category,
      seasons: r.seasons,
      colors: r.colors,
      tags: r.tags,
      imageUrl: r.imageUrl,
    })),
    // 預留：全域隱藏目錄項的能力（前台 overlay 已支援過濾），但尚無對應資料表
    // 與 admin 介面，故目前一律回傳空陣列＝不隱藏任何項目。
    hidden: [],
  };
}

export async function upsertExtra(item: Item): Promise<void> {
  await db
    .insert(catalogExtras)
    .values({
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category,
      seasons: item.seasons,
      colors: item.colors,
      tags: item.tags,
      imageUrl: item.imageUrl,
      moderationStatus: "approved",
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: catalogExtras.id,
      set: {
        name: item.name,
        brand: item.brand,
        category: item.category,
        seasons: item.seasons,
        colors: item.colors,
        tags: item.tags,
        imageUrl: item.imageUrl,
        updatedAt: Date.now(),
      },
    });
  invalidate();
}

export async function deleteExtra(id: string): Promise<void> {
  await db.delete(catalogExtras).where(eq(catalogExtras.id, id));
  invalidate();
}

export async function setOverride(
  catalogId: string,
  patch: Partial<Item>,
): Promise<void> {
  await db
    .insert(catalogOverrides)
    .values({ catalogId, patch, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: catalogOverrides.catalogId,
      set: { patch, updatedAt: Date.now() },
    });
  invalidate();
}

export async function removeOverride(catalogId: string): Promise<void> {
  await db.delete(catalogOverrides).where(eq(catalogOverrides.catalogId, catalogId));
  invalidate();
}
