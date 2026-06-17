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

/* ─── Makeup ─────────────────────────────────────────────────────────────── */
export async function listMakeup(): Promise<Makeup[]> {
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
}

export async function deleteMakeup(id: string): Promise<void> {
  await db.delete(makeupTable).where(eq(makeupTable.id, id));
}

/* ─── Perfume ────────────────────────────────────────────────────────────── */
export async function listPerfume(): Promise<Perfume[]> {
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
}

export async function deletePerfume(id: string): Promise<void> {
  await db.delete(perfumeTable).where(eq(perfumeTable.id, id));
}

/* ─── 全域 catalog 調整（覆蓋既有項 + 新增全域項）────────────────────────── */
export interface GlobalCatalog {
  overrides: Record<string, Partial<Item>>;
  hidden: string[];
  extras: Item[];
}

export async function getGlobalCatalog(): Promise<GlobalCatalog> {
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
}

export async function deleteExtra(id: string): Promise<void> {
  await db.delete(catalogExtras).where(eq(catalogExtras.id, id));
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
}

export async function removeOverride(catalogId: string): Promise<void> {
  await db.delete(catalogOverrides).where(eq(catalogOverrides.catalogId, catalogId));
}
