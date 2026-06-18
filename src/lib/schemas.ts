// Shared zod schemas for runtime validation of untrusted input (API request
// bodies, imported JSON, decoded share links). zod was already a dependency but
// previously unused — every endpoint relied on `as` casts. These schemas gate
// shape/enum/size; routes feed the original parsed body to the repo so no field
// is silently dropped on round-trip.
import { z } from "zod";

/* ─── size caps (abuse / DoS hardening) ──────────────────────────────────── */
export const MAX_TEXT = 300;
export const MAX_ID = 100;
export const MAX_ARR = 50;
/** data: URL images inflate ~33%; uploads are downscaled to ~800px client-side,
 *  so a couple hundred KB is normal — cap generously but finitely. */
export const MAX_IMAGE = 2_000_000;
export const MAX_CLOSET_ITEMS = 5000;
export const MAX_FAVORITES = 2000;
export const MAX_WEARLOGS = 5000;
/** Raw request-body byte cap (Next 16 route handlers have no default limit). */
export const MAX_BODY_BYTES = 8_000_000;

/* ─── enums ───────────────────────────────────────────────────────────────── */
export const categorySchema = z.enum(["tops", "bottoms", "outerwear", "accessories"]);
export const seasonSchema = z.enum(["spring", "summer", "autumn", "winter"]);
export const weatherSchema = z.enum(["sunny", "cloudy", "rainy", "cold"]);
export const genderSchema = z.enum(["female", "male", "unisex"]);

const shortStr = z.string().max(MAX_TEXT);
const strArr = z.array(z.string().max(MAX_TEXT)).max(MAX_ARR);

/* ─── garment item ───────────────────────────────────────────────────────── */
export const itemSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  brand: shortStr,
  name: z.string().min(1).max(MAX_TEXT),
  category: categorySchema,
  seasons: z.array(seasonSchema).max(8),
  colors: strArr,
  tags: strArr,
  imageUrl: z.string().max(MAX_IMAGE),
  updatedAt: z.number().optional(),
});

/* ─── makeup / perfume (full — used by admin CRUD) ───────────────────────── */
export const makeupSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  name: z.string().min(1).max(MAX_TEXT),
  gender: z.array(genderSchema).max(3),
  tags: strArr,
  weather: z.array(weatherSchema).max(4),
  focus: shortStr,
  eye: shortStr,
  lip: shortStr,
  blush: shortStr,
  highlight: shortStr,
  colors: strArr,
  makeupImageUrl: z.string().max(MAX_IMAGE),
});

export const perfumeSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  name: z.string().min(1).max(MAX_TEXT),
  gender: z.array(genderSchema).max(3),
  tags: strArr,
  weather: z.array(weatherSchema).max(4),
  topNote: shortStr,
  heartNote: shortStr,
  baseNote: shortStr,
  style: shortStr,
  intensity: shortStr,
  perfumeImageUrl: z.string().max(MAX_IMAGE),
});

/* ─── outfit (nested in favorites / wear logs) ───────────────────────────── */
// Lenient on optional descriptive fields but REQUIRES context + makeup/perfume
// name so consumers (DayDetailDrawer/FavoritesDrawer) can't crash dereferencing
// undefined. Slots are nullable items.
const outfitMakeup = makeupSchema.partial().extend({
  id: z.string().min(1).max(MAX_ID),
  name: z.string().min(1).max(MAX_TEXT),
});
const outfitPerfume = perfumeSchema.partial().extend({
  id: z.string().min(1).max(MAX_ID),
  name: z.string().min(1).max(MAX_TEXT),
});

export const outfitContextSchema = z.object({
  weather: weatherSchema,
  mood: shortStr,
  destination: shortStr,
  gender: genderSchema,
});

export const outfitSchema = z.object({
  top: itemSchema.nullable(),
  bottom: itemSchema.nullable(),
  outerwear: itemSchema.nullable(),
  accessory: itemSchema.nullable(),
  makeup: outfitMakeup,
  perfume: outfitPerfume,
  context: outfitContextSchema,
  // derived, recomputed on load — accept whatever is present.
  reasons: z.array(z.unknown()).max(20).optional(),
  harmony: z.unknown().optional(),
});

/* ─── favorites / wear logs ──────────────────────────────────────────────── */
export const favoriteSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  date: z.string().max(MAX_TEXT),
  name: z.string().max(MAX_TEXT).optional(),
  outfit: outfitSchema,
  updatedAt: z.number().optional(),
});

export const wearLogSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  date: z.string().max(MAX_TEXT),
  outfit: outfitSchema,
  note: z.string().max(2000).optional(),
  favoriteId: z.string().max(MAX_ID).optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export const favoritesArraySchema = z.array(favoriteSchema).max(MAX_FAVORITES);
export const wearLogsArraySchema = z.array(wearLogSchema).max(MAX_WEARLOGS);

/* ─── closet deltas (sync PUT) ───────────────────────────────────────────── */
const overridePatchSchema = itemSchema.partial();

export const closetDeltasSchema = z.object({
  userItems: z.array(itemSchema).max(MAX_CLOSET_ITEMS),
  hidden: z.array(z.string().max(MAX_ID)).max(MAX_CLOSET_ITEMS),
  overrides: z.record(z.string().max(MAX_ID), overridePatchSchema).optional(),
});

/* ─── admin payloads ─────────────────────────────────────────────────────── */
export const idBodySchema = z.object({ id: z.string().min(1).max(MAX_ID) });

export const userPatchSchema = z
  .object({
    id: z.string().min(1).max(MAX_ID),
    role: z.enum(["user", "admin"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: "role 或 status 至少需提供一項",
  });

export const catalogItemSchema = itemSchema; // admin global extra
export const catalogOverrideSchema = z.object({
  catalogId: z.string().min(1).max(MAX_ID),
  patch: overridePatchSchema.nullable(),
});

export const moderationSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  action: z.enum(["approved", "rejected"]),
  reason: z.string().max(500).optional(),
});
