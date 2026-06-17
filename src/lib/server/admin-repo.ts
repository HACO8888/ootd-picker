// 管理員後台資料存取（server-only）。
import "server-only";
import { eq, sql, desc, count, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  users,
  closetItems,
  favorites as favoritesTable,
  wearLogs as wearLogsTable,
} from "@/db/schema";
import type { Role, AccountStatus } from "@/lib/auth.types";
import { loadCloset, loadFavorites, loadWearLogs } from "./sync-repo";

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  closetCount: number;
  favoriteCount: number;
  wearLogCount: number;
}

/** 使用者列表 + 各自的衣物/收藏/日誌筆數。 */
export async function listUsers(): Promise<AdminUserRow[]> {
  // 分別以 groupBy 取各表計數，再於 JS 合併（避開相關子查詢的欄位限定陷阱）。
  const [base, closetCounts, favCounts, logCounts] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db
      .select({ userId: closetItems.userId, n: count() })
      .from(closetItems)
      .where(isNull(closetItems.deletedAt))
      .groupBy(closetItems.userId),
    db
      .select({ userId: favoritesTable.userId, n: count() })
      .from(favoritesTable)
      .where(isNull(favoritesTable.deletedAt))
      .groupBy(favoritesTable.userId),
    db
      .select({ userId: wearLogsTable.userId, n: count() })
      .from(wearLogsTable)
      .where(isNull(wearLogsTable.deletedAt))
      .groupBy(wearLogsTable.userId),
  ]);

  const toMap = (rows: { userId: string; n: number }[]) =>
    new Map(rows.map((r) => [r.userId, Number(r.n)]));
  const closetMap = toMap(closetCounts);
  const favMap = toMap(favCounts);
  const logMap = toMap(logCounts);

  return base.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    closetCount: closetMap.get(r.id) ?? 0,
    favoriteCount: favMap.get(r.id) ?? 0,
    wearLogCount: logMap.get(r.id) ?? 0,
  }));
}

export async function updateUser(
  id: string,
  patch: { role?: Role; status?: AccountStatus },
): Promise<void> {
  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  // child rows 經 onDelete cascade 一併移除。
  await db.delete(users).where(eq(users.id, id));
}

/** 單一使用者的完整資料（衣櫥/收藏/日誌），供 admin 檢視。 */
export async function getUserData(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) return null;
  const [closet, favorites, wearLogs] = await Promise.all([
    loadCloset(id),
    loadFavorites(id),
    loadWearLogs(id),
  ]);
  return {
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      image: u.image,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    },
    closet,
    favorites,
    wearLogs,
  };
}

export interface AdminStats {
  totalUsers: number;
  admins: number;
  suspended: number;
  activeUsers: number; // 有任何收藏或日誌的人
  totalClosetItems: number;
  totalFavorites: number;
  totalWearLogs: number;
  topTags: { tag: string; count: number }[];
}

/* ─── 內容稽核 ───────────────────────────────────────────────────────────── */
export interface ModerationRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  tags: string[];
  imageUrl: string;
  updatedAt: number;
  ownerId: string;
  ownerEmail: string | null;
  ownerName: string | null;
}

/** 待審的使用者上傳衣物（含擁有者資訊）。 */
export async function listPendingModeration(): Promise<ModerationRow[]> {
  const rows = await db
    .select({
      id: closetItems.id,
      name: closetItems.name,
      brand: closetItems.brand,
      category: closetItems.category,
      tags: closetItems.tags,
      imageUrl: closetItems.imageUrl,
      updatedAt: closetItems.updatedAt,
      ownerId: users.id,
      ownerEmail: users.email,
      ownerName: users.name,
    })
    .from(closetItems)
    .innerJoin(users, eq(closetItems.userId, users.id))
    .where(
      sql`${closetItems.moderationStatus} = 'pending' and ${closetItems.deletedAt} is null`,
    )
    .orderBy(desc(closetItems.updatedAt))
    .limit(200);
  return rows.map((r) => ({ ...r, tags: r.tags as string[] }));
}

export async function moderateItem(
  id: string,
  action: "approved" | "rejected",
  reason?: string,
): Promise<void> {
  await db
    .update(closetItems)
    .set({
      moderationStatus: action,
      moderatedAt: Date.now(),
      rejectReason: action === "rejected" ? (reason ?? null) : null,
    })
    .where(eq(closetItems.id, id));
}

export async function getStats(): Promise<AdminStats> {
  const [counts] = await db
    .select({
      totalUsers: sql<number>`count(*)`,
      admins: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
      suspended: sql<number>`count(*) filter (where ${users.status} = 'suspended')`,
    })
    .from(users);

  const [agg] = await db
    .select({
      totalClosetItems: sql<number>`(select count(*) from ${closetItems} where ${closetItems.deletedAt} is null)`,
      totalFavorites: sql<number>`(select count(*) from ${favoritesTable} where ${favoritesTable.deletedAt} is null)`,
      totalWearLogs: sql<number>`(select count(*) from ${wearLogsTable} where ${wearLogsTable.deletedAt} is null)`,
      activeUsers: sql<number>`(select count(distinct uid) from (select ${favoritesTable.userId} as uid from ${favoritesTable} where ${favoritesTable.deletedAt} is null union select ${wearLogsTable.userId} from ${wearLogsTable} where ${wearLogsTable.deletedAt} is null) t)`,
    })
    .from(users)
    .limit(1);

  // 熱門標籤：把所有未刪除衣物的 tags 攤平後計數（jsonb_array_elements_text）。
  const tagRows = await db.execute<{ tag: string; count: number }>(sql`
    select tag, count(*)::int as count
    from ${closetItems}, jsonb_array_elements_text(${closetItems.tags}) as tag
    where ${closetItems.deletedAt} is null
    group by tag
    order by count desc
    limit 12
  `);

  return {
    totalUsers: Number(counts.totalUsers),
    admins: Number(counts.admins),
    suspended: Number(counts.suspended),
    activeUsers: Number(agg.activeUsers),
    totalClosetItems: Number(agg.totalClosetItems),
    totalFavorites: Number(agg.totalFavorites),
    totalWearLogs: Number(agg.totalWearLogs),
    topTags: Array.from(tagRows).map((r) => ({ tag: r.tag, count: Number(r.count) })),
  };
}
