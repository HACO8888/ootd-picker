// 同步資料存取層（server-only）。每個 collection 提供 load(讀快照) 與
// save(整包取代) — push=replace 語意，登入合併在 client 端先 union 後再整包推上來。
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  closetItems,
  hiddenCatalogItems,
  overrides as overridesTable,
  favorites as favoritesTable,
  wearLogs as wearLogsTable,
} from "@/db/schema";
import type { Item, Favorite, WearLog } from "@/lib/types";
import type { ClosetDeltas } from "@/lib/storage";

/* ─── Closet deltas (user items + hidden + overrides) ────────────────────── */
export type ClosetSnapshot = ClosetDeltas & { rejectedIds: string[] };

export async function loadCloset(userId: string): Promise<ClosetSnapshot> {
  const [items, hidden, ovr] = await Promise.all([
    db.select().from(closetItems).where(eq(closetItems.userId, userId)),
    db.select().from(hiddenCatalogItems).where(eq(hiddenCatalogItems.userId, userId)),
    db.select().from(overridesTable).where(eq(overridesTable.userId, userId)),
  ]);
  const live = items.filter((r) => r.deletedAt == null);
  return {
    // 排除被拒項目，讓它們不會再回流到 client。
    userItems: live
      .filter((r) => r.moderationStatus !== "rejected")
      .map((r) => ({
        id: r.id,
        brand: r.brand,
        name: r.name,
        category: r.category,
        seasons: r.seasons,
        colors: r.colors,
        tags: r.tags,
        imageUrl: r.imageUrl,
        updatedAt: r.updatedAt,
      })),
    hidden: hidden.filter((r) => r.deletedAt == null).map((r) => r.catalogId),
    overrides: Object.fromEntries(
      ovr.filter((r) => r.deletedAt == null).map((r) => [r.itemId, r.patch]),
    ),
    rejectedIds: live.filter((r) => r.moderationStatus === "rejected").map((r) => r.id),
  };
}

export async function saveCloset(userId: string, d: ClosetDeltas): Promise<void> {
  const now = Date.now();
  // 保留既有審核結果：push=replace 會 delete+insert，若不保留則已審項目會重置成 pending。
  const existing = await db
    .select({
      id: closetItems.id,
      moderationStatus: closetItems.moderationStatus,
      moderatedAt: closetItems.moderatedAt,
      rejectReason: closetItems.rejectReason,
    })
    .from(closetItems)
    .where(eq(closetItems.userId, userId));
  const prev = new Map(existing.map((r) => [r.id, r]));

  await db.transaction(async (tx) => {
    await tx.delete(closetItems).where(eq(closetItems.userId, userId));
    await tx.delete(hiddenCatalogItems).where(eq(hiddenCatalogItems.userId, userId));
    await tx.delete(overridesTable).where(eq(overridesTable.userId, userId));

    if (d.userItems.length) {
      await tx.insert(closetItems).values(
        d.userItems.map((i) => {
          const p = prev.get(i.id);
          return {
            id: i.id,
            userId,
            name: i.name,
            brand: i.brand,
            category: i.category,
            seasons: i.seasons,
            colors: i.colors,
            tags: i.tags,
            imageUrl: i.imageUrl,
            // 沿用既有審核狀態；新項目預設待審。
            moderationStatus: p?.moderationStatus ?? ("pending" as const),
            moderatedAt: p?.moderatedAt ?? null,
            rejectReason: p?.rejectReason ?? null,
            updatedAt: i.updatedAt ?? now,
          };
        }),
      );
    }
    if (d.hidden.length) {
      await tx.insert(hiddenCatalogItems).values(
        d.hidden.map((catalogId) => ({ userId, catalogId, updatedAt: now })),
      );
    }
    const ovrEntries = Object.entries(d.overrides);
    if (ovrEntries.length) {
      await tx.insert(overridesTable).values(
        ovrEntries.map(([itemId, patch]) => ({ userId, itemId, patch, updatedAt: now })),
      );
    }
  });
}

/* ─── Favorites ──────────────────────────────────────────────────────────── */
export async function loadFavorites(userId: string): Promise<Favorite[]> {
  const rows = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  return rows
    .filter((r) => r.deletedAt == null)
    .map((r) => ({
      id: r.id,
      date: r.date,
      name: r.name ?? undefined,
      outfit: r.outfit,
      updatedAt: r.updatedAt,
    }));
}

export async function saveFavorites(userId: string, list: Favorite[]): Promise<void> {
  const now = Date.now();
  await db.transaction(async (tx) => {
    await tx.delete(favoritesTable).where(eq(favoritesTable.userId, userId));
    if (list.length) {
      await tx.insert(favoritesTable).values(
        list.map((f) => ({
          id: f.id,
          userId,
          name: f.name ?? null,
          date: f.date,
          outfit: f.outfit,
          updatedAt: f.updatedAt ?? now,
        })),
      );
    }
  });
}

/* ─── Wear logs ──────────────────────────────────────────────────────────── */
export async function loadWearLogs(userId: string): Promise<WearLog[]> {
  const rows = await db
    .select()
    .from(wearLogsTable)
    .where(eq(wearLogsTable.userId, userId));
  return rows
    .filter((r) => r.deletedAt == null)
    .map((r) => ({
      id: r.id,
      date: r.date,
      outfit: r.outfit,
      note: r.note ?? undefined,
      favoriteId: r.favoriteId ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
}

export async function saveWearLogs(userId: string, list: WearLog[]): Promise<void> {
  const now = Date.now();
  await db.transaction(async (tx) => {
    await tx.delete(wearLogsTable).where(eq(wearLogsTable.userId, userId));
    if (list.length) {
      await tx.insert(wearLogsTable).values(
        list.map((l) => ({
          id: l.id,
          userId,
          date: l.date,
          outfit: l.outfit,
          note: l.note ?? null,
          favoriteId: l.favoriteId ?? null,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt ?? now,
        })),
      );
    }
  });
}
