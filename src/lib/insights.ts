// Pure wardrobe-analytics engine — no React, no I/O. Inputs are plain arrays
// (Item[], Favorite[], optional WearLog[]); outputs are plain stat objects so
// the whole module is trivially testable.
import type { Item, Favorite, WearLog, Category, Season } from "./types";

const CATEGORIES: Category[] = ["tops", "bottoms", "outerwear", "accessories"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
/** Core occasions we expect a balanced wardrobe to cover. */
const CORE_OCCASIONS = ["工作", "約會", "休閒漫步", "社交聚會", "居家"];

/* ─── Composition ───────────────────────────────────────────────────────── */
export interface ClosetStats {
  total: number;
  byCategory: Record<Category, number>;
  bySeason: Record<Season, number>;
  byBrand: { brand: string; count: number }[];
  byColor: { color: string; count: number }[];
}

export function computeClosetStats(closet: Item[]): ClosetStats {
  const byCategory = { tops: 0, bottoms: 0, outerwear: 0, accessories: 0 } as Record<Category, number>;
  const bySeason = { spring: 0, summer: 0, autumn: 0, winter: 0 } as Record<Season, number>;
  const brandMap = new Map<string, number>();
  const colorMap = new Map<string, number>();

  for (const item of closet) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    for (const s of item.seasons) bySeason[s] = (bySeason[s] ?? 0) + 1;
    brandMap.set(item.brand, (brandMap.get(item.brand) ?? 0) + 1);
    for (const c of item.colors) colorMap.set(c, (colorMap.get(c) ?? 0) + 1);
  }

  const sortDesc = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]);

  return {
    total: closet.length,
    byCategory,
    bySeason,
    byBrand: sortDesc(brandMap).map(([brand, count]) => ({ brand, count })),
    byColor: sortDesc(colorMap).map(([color, count]) => ({ color, count })),
  };
}

/* ─── Usage frequency ───────────────────────────────────────────────────── */
export interface UsageStat {
  item: Item;
  count: number;
}
export interface UsageReport {
  ranked: UsageStat[];
  mostUsed: UsageStat[];
  neverUsed: Item[];
  totalFavorites: number;
  totalWears: number;
}

/**
 * How often each wardrobe item appears across saved favorites (and, if given,
 * the wear log — weighted higher because an actually-worn outfit is a stronger
 * signal than a saved one). Items are matched by id.
 */
export function computeUsage(
  closet: Item[],
  sources: { favorites: Favorite[]; wearLog?: WearLog[] },
): UsageReport {
  const { favorites, wearLog = [] } = sources;
  const counts = new Map<string, number>();
  const bump = (id: string | undefined, by: number) => {
    if (id) counts.set(id, (counts.get(id) ?? 0) + by);
  };

  for (const f of favorites) {
    bump(f.outfit.top?.id, 1);
    bump(f.outfit.bottom?.id, 1);
    bump(f.outfit.outerwear?.id, 1);
    bump(f.outfit.accessory?.id, 1);
  }
  for (const w of wearLog) {
    bump(w.outfit.top?.id, 1);
    bump(w.outfit.bottom?.id, 1);
    bump(w.outfit.outerwear?.id, 1);
    bump(w.outfit.accessory?.id, 1);
  }

  const ranked: UsageStat[] = closet
    .map((item) => ({ item, count: counts.get(item.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    ranked,
    mostUsed: ranked.filter((s) => s.count > 0).slice(0, 6),
    neverUsed: ranked.filter((s) => s.count === 0).map((s) => s.item),
    totalFavorites: favorites.length,
    totalWears: wearLog.length,
  };
}

/* ─── Gap analysis ──────────────────────────────────────────────────────── */
export interface Gap {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  /** Query used to pull catalog suggestions to fill the gap. */
  query: { category?: Category; season?: Season; tag?: string };
}

const seasonLabel: Record<Season, string> = { spring: "春季", summer: "夏季", autumn: "秋季", winter: "冬季" };

export function detectGaps(closet: Item[]): Gap[] {
  const gaps: Gap[] = [];
  const inCat = (c: Category) => closet.filter((i) => i.category === c);

  // Empty wardrobe → guide to build a base, not a pile of micro-gaps.
  if (closet.length === 0) return gaps;

  // 1. Each season should have at least one piece of outerwear.
  for (const s of SEASONS) {
    const outerwear = inCat("outerwear").filter((i) => i.seasons.includes(s));
    if (outerwear.length === 0) {
      gaps.push({
        id: `outer-${s}`,
        severity: s === "winter" ? "high" : "medium",
        title: `${seasonLabel[s]}外套`,
        message: `你的${seasonLabel[s]}還沒有外套，遇到變天可能不夠保暖。`,
        query: { category: "outerwear", season: s },
      });
    }
  }

  // 2. Each season should have a couple of tops + bottoms to mix.
  for (const s of SEASONS) {
    const tops = inCat("tops").filter((i) => i.seasons.includes(s)).length;
    const bottoms = inCat("bottoms").filter((i) => i.seasons.includes(s)).length;
    if (tops < 2) {
      gaps.push({
        id: `tops-${s}`,
        severity: "low",
        title: `${seasonLabel[s]}上衣`,
        message: `${seasonLabel[s]}的上衣選擇偏少（${tops} 件），多一點才好替換。`,
        query: { category: "tops", season: s },
      });
    }
    if (bottoms < 2) {
      gaps.push({
        id: `bottoms-${s}`,
        severity: "low",
        title: `${seasonLabel[s]}下著`,
        message: `${seasonLabel[s]}的下著選擇偏少（${bottoms} 件）。`,
        query: { category: "bottoms", season: s },
      });
    }
  }

  // 3. Core occasions should each have something to wear.
  for (const occ of CORE_OCCASIONS) {
    const count = closet.filter((i) => i.tags.includes(occ)).length;
    if (count === 0) {
      gaps.push({
        id: `occ-${occ}`,
        severity: "medium",
        title: `${occ}場合`,
        message: `衣櫥裡還沒有適合「${occ}」的單品。`,
        query: { tag: occ },
      });
    }
  }

  // 4. Obvious category imbalance (have tops but no bottoms, or vice versa).
  if (inCat("tops").length > 0 && inCat("bottoms").length === 0) {
    gaps.push({ id: "balance-bottoms", severity: "high", title: "缺少下著", message: "你有上衣卻沒有任何下著，先補幾件褲子或裙子吧。", query: { category: "bottoms" } });
  }
  if (inCat("bottoms").length > 0 && inCat("tops").length === 0) {
    gaps.push({ id: "balance-tops", severity: "high", title: "缺少上衣", message: "你有下著卻沒有任何上衣。", query: { category: "tops" } });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return gaps.sort((a, b) => order[a.severity] - order[b.severity]);
}

/**
 * Pull up to `limit` catalog items that fill a gap. Degrades gracefully: if the
 * full query has too few matches (the catalog is thin for some occasions), it
 * relaxes to category-only so the user still gets something.
 */
export function suggestForGap(
  gap: Gap,
  catalog: Item[],
  excludeIds: Set<string>,
  limit = 8,
): { items: Item[]; relaxed: boolean } {
  const { category, season, tag } = gap.query;
  const matches = (i: Item, useTag: boolean, useSeason: boolean) =>
    !excludeIds.has(i.id) &&
    (category ? i.category === category : true) &&
    (useSeason && season ? i.seasons.includes(season) : true) &&
    (useTag && tag ? i.tags.includes(tag) : true);

  const strict = catalog.filter((i) => matches(i, true, true));
  if (strict.length >= limit) return { items: strict.slice(0, limit), relaxed: false };

  // Relax: drop the (often very sparse) tag/season filter, keep category.
  const relaxed = catalog.filter((i) => matches(i, false, false));
  const merged = [...strict, ...relaxed.filter((i) => !strict.some((s) => s.id === i.id))];
  return { items: merged.slice(0, limit), relaxed: merged.length > strict.length };
}
