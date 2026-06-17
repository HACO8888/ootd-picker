// Drizzle schema — PostgreSQL.
// Auth.js (NextAuth v5) 標準四表 (user/account/session/verificationToken) +
// 應用自有資料表 (衣櫥 delta / 收藏 / 穿搭日誌 / 目錄管理 / 妝容香水)。
//
// 同步約定：所有「使用者擁有」的資料表都帶 updatedAt(ms) 與 deletedAt(ms, soft delete
// tombstone)，供登入合併時做 union-by-id + last-write-wins。
import {
  pgTable,
  pgEnum,
  text,
  integer,
  bigint,
  jsonb,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type {
  Item,
  Outfit,
  Category,
  Season,
  Makeup,
  Perfume,
} from "@/lib/types";

/* ─── enums ──────────────────────────────────────────────────────────────── */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["active", "suspended"]);
export const moderationEnum = pgEnum("moderation_status", [
  "pending",
  "approved",
  "rejected",
]);

/* ─── Auth.js core tables ────────────────────────────────────────────────── */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // 應用擴充欄位
  role: roleEnum("role").notNull().default("user"),
  status: statusEnum("status").notNull().default("active"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/* ─── 使用者衣櫥 delta（對應 storage.ts 三個 localStorage key）─────────────── */

// user-added items（id 前綴 c_）
export const closetItems = pgTable(
  "closet_item",
  {
    id: text("id").primaryKey(), // "c_…"
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    brand: text("brand").notNull().default("自訂"),
    category: text("category").$type<Category>().notNull(),
    seasons: jsonb("seasons").$type<Season[]>().notNull().default([]),
    colors: jsonb("colors").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url").notNull().default(""),
    moderationStatus: moderationEnum("moderation_status")
      .notNull()
      .default("pending"),
    moderatedAt: bigint("moderated_at", { mode: "number" }),
    rejectReason: text("reject_reason"),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [
    index("closet_item_user_idx").on(t.userId),
    index("closet_item_user_updated_idx").on(t.userId, t.updatedAt),
    index("closet_item_moderation_idx").on(t.moderationStatus),
  ],
);

// 隱藏的 catalog ids
export const hiddenCatalogItems = pgTable(
  "hidden_catalog_item",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    catalogId: text("catalog_id").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.catalogId] })],
);

// per-item overrides（Record<id, Partial<Item>>）
export const overrides = pgTable(
  "override",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    patch: jsonb("patch").$type<Partial<Item>>().notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId] })],
);

/* ─── 收藏 / 穿搭日誌 ──────────────────────────────────────────────────────── */
export const favorites = pgTable(
  "favorite",
  {
    id: text("id").primaryKey(), // "f_…"
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name"),
    date: text("date").notNull(),
    outfit: jsonb("outfit").$type<Outfit>().notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [index("favorite_user_updated_idx").on(t.userId, t.updatedAt)],
);

export const wearLogs = pgTable(
  "wear_log",
  {
    id: text("id").primaryKey(), // "w_…"
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    outfit: jsonb("outfit").$type<Outfit>().notNull(),
    note: text("note"),
    favoriteId: text("favorite_id"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [index("wear_log_user_date_idx").on(t.userId, t.date)],
);

/* ─── 目錄管理（全域，由 admin 維護）──────────────────────────────────────── */

// 對檔案 catalog 的全域覆蓋
export const catalogOverrides = pgTable("catalog_override", {
  catalogId: text("catalog_id").primaryKey(),
  patch: jsonb("patch").$type<Partial<Item>>().notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

// admin 新增的全域服裝
export const catalogExtras = pgTable(
  "catalog_extra",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    brand: text("brand").notNull().default(""),
    category: text("category").$type<Category>().notNull(),
    seasons: jsonb("seasons").$type<Season[]>().notNull().default([]),
    colors: jsonb("colors").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url").notNull().default(""),
    moderationStatus: moderationEnum("moderation_status")
      .notNull()
      .default("approved"),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [index("catalog_extra_moderation_idx").on(t.moderationStatus)],
);

// 妝容 / 香水（seed 自 data.ts，admin 可 CRUD）
export const makeup = pgTable("makeup", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Makeup>().notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const perfume = pgTable("perfume", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<Perfume>().notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
