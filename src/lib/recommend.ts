// Recommendation engine + image fallback.
// Exact context weights stay aligned with the PRD contract, while softer
// semantic and outfit-level scores keep sparse catalog tags from producing odd
// combinations.
import { IMG, MAKEUP_LOOKBOOK, PERFUME_LOOKBOOK, TRANSLATE } from "./data";
import { evaluateHarmony } from "./color-harmony";
import type {
  Item,
  Makeup,
  Perfume,
  Outfit,
  OOTDSet,
  Reason,
  Category,
  Season,
  Weather,
  Gender,
} from "./types";

const DIRECT_DESTINATION_WEIGHT = 5;
const DIRECT_WEATHER_WEIGHT = 4;
const DIRECT_MOOD_WEIGHT = 3;

type WeightedTag = { tag: string; score: number };

const DESTINATION_TAG_AFFINITY: Record<string, WeightedTag[]> = {
  工作: [
    { tag: "專業", score: 3 },
    { tag: "優雅", score: 1.2 },
  ],
  約會: [
    { tag: "優雅", score: 3 },
    { tag: "舒適", score: 1.5 },
    { tag: "放鬆", score: 1 },
    { tag: "休閒漫步", score: 0.6 },
  ],
  休閒漫步: [
    { tag: "放鬆", score: 2.5 },
    { tag: "活力", score: 1.6 },
    { tag: "舒適", score: 1 },
  ],
  社交聚會: [
    { tag: "優雅", score: 2.8 },
    { tag: "活力", score: 2.2 },
    { tag: "約會", score: 2 },
    { tag: "專業", score: 1.2 },
  ],
  居家: [
    { tag: "舒適", score: 3 },
    { tag: "放鬆", score: 2.6 },
  ],
};

const MOOD_TAG_AFFINITY: Record<string, WeightedTag[]> = {
  活力: [
    { tag: "休閒漫步", score: 1.6 },
    { tag: "放鬆", score: 0.8 },
  ],
  放鬆: [
    { tag: "休閒漫步", score: 2 },
    { tag: "舒適", score: 1.8 },
    { tag: "居家", score: 1.4 },
  ],
  專業: [
    { tag: "工作", score: 2.6 },
    { tag: "優雅", score: 1.1 },
  ],
  優雅: [
    { tag: "約會", score: 2.2 },
    { tag: "社交聚會", score: 1.6 },
    { tag: "工作", score: 0.8 },
  ],
  舒適: [
    { tag: "放鬆", score: 2.8 },
    { tag: "居家", score: 2.4 },
    { tag: "休閒漫步", score: 1.1 },
  ],
};

interface StyleProfile {
  formal: number;
  casual: number;
  sporty: number;
  cozy: number;
  elegant: number;
  statement: number;
  utility: number;
  warmth: number;
  lightness: number;
  rainReady: number;
  coldRisk: number;
}

const ZERO_PROFILE: StyleProfile = {
  formal: 0,
  casual: 0,
  sporty: 0,
  cozy: 0,
  elegant: 0,
  statement: 0,
  utility: 0,
  warmth: 0,
  lightness: 0,
  rainReady: 0,
  coldRisk: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════
   getAutoImage — smart fallback for user-added items
   ═══════════════════════════════════════════════════════════════════════════ */
export function getAutoImage(
  name: string,
  category: Category,
  colors: string[],
): string {
  const c = (colors || []).join(" ");
  const dark = /黑|深|藏青|靛|暗/.test(c);
  const n = name;
  if (category === "tops") {
    if (/格紋/.test(n) && /襯衫|法蘭絨/.test(n)) return IMG.flannel_shirt;
    if (/襯衫|罩衫|亞麻/.test(n)) return IMG.linen_blouse;
    if (/連帽|帽T|大學T|帽衫|衛衣/.test(n)) return IMG.blue_hoodie;
    if (/針織|毛衣|開衫/.test(n)) return IMG.pink_sweater;
    if (dark) return IMG.black_tshirt;
    return IMG.white_tshirt;
  }
  if (category === "bottoms") {
    if (/短褲/.test(n)) return IMG.khaki_shorts;
    if (/裙/.test(n)) return IMG.pleated_skirt;
    if (/牛仔/.test(n)) return IMG.blue_jeans;
    if (/寬褲|闊腿/.test(n)) return IMG.wide_pants;
    return IMG.black_trousers;
  }
  if (category === "outerwear") {
    if (/牛仔/.test(n)) return IMG.denim_jacket;
    if (/皮革|仿皮/.test(n)) return IMG.leather_jacket;
    if (/風衣/.test(n)) return IMG.trench_coat;
    if (/羽絨|鋪棉/.test(n)) return IMG.white_puffer;
    return IMG.trench_coat;
  }
  if (category === "accessories") {
    if (/後背包|背包/.test(n)) return IMG.black_backpack;
    return IMG.leather_handbag;
  }
  return IMG.white_tshirt;
}

/** Seasons relevant to a given weather (shared by the engine and item swaps). */
export function seasonsForWeather(weather: Weather): Season[] {
  return weather === "sunny"
    ? ["summer", "spring"]
    : weather === "cloudy"
      ? ["spring", "autumn"]
      : weather === "rainy"
        ? ["autumn", "spring", "winter"]
        : weather === "cold"
          ? ["winter", "autumn"]
          : ["spring", "summer", "autumn", "winter"];
}

function itemText(i: Item | null | undefined): string {
  if (!i) return "";
  return `${i.name} ${i.tags.join(" ")} ${i.colors.join(" ")}`;
}

// Memoize per Item object — scoreItem calls profileFor ~3x per item and a
// single generate scores thousands of items, each running ~12 regexes. Items
// are immutable (overrides clone), so caching by identity is safe. Returned
// profiles are never mutated by callers (sumProfiles/score* only read them).
const profileCache = new WeakMap<Item, StyleProfile>();

function profileFor(i: Item | null | undefined): StyleProfile {
  if (!i) return ZERO_PROFILE;
  const cached = profileCache.get(i);
  if (cached) return cached;
  const text = itemText(i);
  const p: StyleProfile = { ...ZERO_PROFILE };

  if (i.tags.includes("工作") || i.tags.includes("專業")) p.formal += 1.5;
  if (i.tags.includes("休閒漫步") || i.tags.includes("放鬆")) p.casual += 1.2;
  if (i.tags.includes("活力")) p.sporty += 1.3;
  if (i.tags.includes("舒適") || i.tags.includes("居家") || i.tags.includes("放鬆")) p.cozy += 1.2;
  if (i.tags.includes("優雅") || i.tags.includes("約會")) p.elegant += 1.5;
  if (i.tags.includes("社交聚會")) p.statement += 1.8;

  if (/襯衫|西裝|長褲|風衣/.test(text)) p.formal += 1.1;
  if (/西裝|電腦包|郵差包/.test(text)) p.formal += 0.8;
  if (/T恤|牛仔|短褲|後背包|大學T|內搭褲/.test(text)) p.casual += 1;
  if (/運動|短褲|後背包|大學T|內搭褲/.test(text)) p.sporty += 1;
  if (/針織|毛衣|法蘭絨|大學T|運動長褲|內搭褲/.test(text)) p.cozy += 1.1;
  if (/裙|寬褲|闊腿|針織|毛衣|手提包|手拿包|風衣|印度長衫/.test(text)) p.elegant += 1;
  if (/皮革|手拿包|金色|銀色|紅色|酒紅|勃根地紅|洋紅|亮片/.test(text)) p.statement += 1.1;
  if (/後背包|電腦包|旅行袋|郵差包|尼龍|風雨衣/.test(text)) p.utility += 1.3;

  if (/羽絨|鋪棉|針織|毛衣|法蘭絨|外套|風衣|長袖|長褲|大學T/.test(text)) p.warmth += 1.2;
  if (/T恤|短袖|短褲|亞麻|七分褲|背心/.test(text)) p.lightness += 1.2;
  if (/風雨衣|風衣|尼龍|外套|後背包|電腦包/.test(text)) p.rainReady += 1;
  if (/短褲|短袖|七分褲|背心|亞麻/.test(text)) p.coldRisk += 1.5;

  profileCache.set(i, p);
  return p;
}

function relatedTagScore(tags: string[], target: string, affinity: Record<string, WeightedTag[]>): number {
  if (tags.includes(target)) return 0;
  return (affinity[target] ?? []).reduce((best, item) => (tags.includes(item.tag) ? Math.max(best, item.score) : best), 0);
}

function destinationStyleScore(i: Item, destination: string): number {
  const p = profileFor(i);
  switch (destination) {
    case "工作":
      return p.formal * 1.15 + p.utility * 0.55 + p.elegant * 0.2 - p.sporty * 0.45 - p.cozy * 0.25;
    case "約會":
      return p.elegant * 1.1 + p.statement * 0.55 + p.cozy * 0.2 - p.utility * 0.35 - p.sporty * 0.45;
    case "休閒漫步":
      return p.casual * 1 + p.sporty * 0.45 + p.utility * 0.25 - p.formal * 0.2;
    case "社交聚會":
      return p.statement * 1.15 + p.elegant * 0.85 + p.sporty * 0.25 - p.cozy * 0.45 - p.utility * 0.25;
    case "居家":
      return p.cozy * 1.15 + p.casual * 0.55 - p.formal * 0.55 - p.statement * 0.35;
    default:
      return 0;
  }
}

function moodStyleScore(i: Item, mood: string): number {
  const p = profileFor(i);
  switch (mood) {
    case "活力":
      return p.sporty * 1 + p.casual * 0.35 + p.statement * 0.25 - p.formal * 0.2;
    case "放鬆":
      return p.casual * 0.8 + p.cozy * 0.75 - p.statement * 0.25;
    case "專業":
      return p.formal * 1.05 + p.utility * 0.35 - p.sporty * 0.35 - p.cozy * 0.25;
    case "優雅":
      return p.elegant * 1 + p.formal * 0.25 + p.statement * 0.2 - p.sporty * 0.35;
    case "舒適":
      return p.cozy * 1.1 + p.casual * 0.45 - p.formal * 0.35 - p.statement * 0.25;
    default:
      return 0;
  }
}

function weatherPracticalityScore(i: Item, weather: Weather): number {
  const p = profileFor(i);
  switch (weather) {
    case "cold":
      return p.warmth * 1.15 - p.lightness * 0.8 - p.coldRisk * 1.7;
    case "rainy":
      return p.rainReady * 1.1 + p.utility * 0.25 - p.lightness * 0.35;
    case "sunny":
      return p.lightness * 0.65 - p.warmth * (i.category === "outerwear" ? 0.9 : 0.25);
    case "cloudy":
      return p.warmth * 0.25 + p.rainReady * 0.15;
  }
}

function genderStyleScore(i: Item, gender: Gender | undefined): number {
  if (gender !== "male") return 0;
  const text = itemText(i);
  let s = 0;
  if (/襯衫|T恤|長褲|牛仔褲|運動長褲|外套|西裝|後背包|電腦包|郵差包|旅行袋/.test(text)) s += 1.8;
  if (/襯衫/.test(text)) s += 1.4;
  if (/裙|洋裝|連衣裙/.test(text)) s -= 12;
  if (/內搭褲/.test(text)) s -= 8;
  if (/手提包|手拿包/.test(text)) s -= 11;
  if (i.category === "accessories" && !/後背包|電腦包|郵差包|旅行袋/.test(text)) s -= 4;
  if (/印度長衫/.test(text)) s -= 12;
  if (/長版上衣/.test(text)) s -= 6;
  if (/粉色|蜜桃色|蕾絲/.test(text)) s -= 0.8;
  return s;
}

function itemHasIntentMatch(i: Item, ctx: ClothCtx, intent: "destination" | "mood"): boolean {
  if (intent === "destination") {
    return (
      i.tags.includes(ctx.destination) ||
      relatedTagScore(i.tags, ctx.destination, DESTINATION_TAG_AFFINITY) > 0 ||
      destinationStyleScore(i, ctx.destination) >= 1.2
    );
  }
  return (
    i.tags.includes(ctx.mood) ||
    relatedTagScore(i.tags, ctx.mood, MOOD_TAG_AFFINITY) > 0 ||
    moodStyleScore(i, ctx.mood) >= 1.2
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GARMENT SCORING (shared by generateOOTD, generateOOTDSet and item swaps)
   ═══════════════════════════════════════════════════════════════════════════ */

/** The garment-relevant slice of the wizard context. */
export interface ClothCtx {
  weather: Weather;
  mood: string;
  destination: string;
  gender?: Gender;
}

/**
 * How well a garment fits the chosen context. Season is now a *soft* signal in
 * the score (weather finally counts directly) rather than a hard pre-filter, so
 * a slightly out-of-season but on-purpose piece can still surface — and a piece
 * that matches nothing scores 0 and is excluded by the match floor below.
 */
export function scoreItem(i: Item, ctx: ClothCtx): number {
  const ts = seasonsForWeather(ctx.weather);
  let s = 0;
  if (i.tags.includes(ctx.destination)) s += DIRECT_DESTINATION_WEIGHT; // 場合（最重）
  else s += relatedTagScore(i.tags, ctx.destination, DESTINATION_TAG_AFFINITY);

  if (i.seasons.some((x) => ts.includes(x))) s += DIRECT_WEATHER_WEIGHT; // 天氣/季節（軟加權）

  if (i.tags.includes(ctx.mood)) s += DIRECT_MOOD_WEIGHT; // 心情
  else s += relatedTagScore(i.tags, ctx.mood, MOOD_TAG_AFFINITY);

  s += destinationStyleScore(i, ctx.destination);
  s += moodStyleScore(i, ctx.mood);
  s += weatherPracticalityScore(i, ctx.weather);
  s += genderStyleScore(i, ctx.gender);

  return Math.max(0, Math.round(s * 10) / 10);
}

type Scored = { i: Item; s: number };

const COLOR_PREFIX_RE =
  /^(白色|黑色|灰色|碳灰|麻灰|米色|米白色|奶油色|卡其色|裸色|銀色|金色|銅色|多色|紅色|紅格紋|鏽紅|蜜桃色|棕褐|古銅|咖啡色|橘色|焦糖色|黃色|芥末黃|綠色|墨綠|海綠|藍綠|土耳其藍|淡藍色|藍色|藏青|薰衣草紫|紫色|淺紫|粉色|洋紅|酒紅|勃根地紅)/;

function itemVariantKey(i: Item | null | undefined): string {
  return i ? `${i.name}|${i.colors.join("/")}` : "";
}

function itemTypeKey(i: Item | null | undefined): string {
  return i ? i.name.replace(COLOR_PREFIX_RE, "") : "";
}

/** Candidates in a category, gated by the match floor (score > 0), best first. */
function rankCategory(closet: Item[], cat: Category, ctx: ClothCtx): Scored[] {
  return closet
    .filter((i) => i.category === cat)
    .map((i) => ({ i, s: scoreItem(i, ctx) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
}

function uniqueRankedItems(pool: Scored[], limit: number, maxPerType = 3): Item[] {
  const seen = new Set<string>();
  const typeCounts = new Map<string, number>();
  const items: Item[] = [];
  for (const x of pool) {
    const key = itemVariantKey(x.i);
    const type = itemTypeKey(x.i);
    if (seen.has(key)) continue;
    if ((typeCounts.get(type) ?? 0) >= maxPerType) continue;
    seen.add(key);
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    items.push(x.i);
    if (items.length >= limit) break;
  }
  return items;
}

/**
 * Weighted random over the top-K candidates, probability ∝ score² — biases hard
 * toward the best fit while keeping enough variety for "重新生成" to feel alive.
 */
function weightedPick(pool: Scored[], k = 5): Item | null {
  if (!pool.length) return null;
  const top = pool.slice(0, k);
  const w = top.map((x) => x.s * x.s);
  const total = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let n = 0; n < top.length; n++) {
    r -= w[n];
    if (r <= 0) return top[n].i;
  }
  return top[0].i;
}

function bestEffortCategory(closet: Item[], cat: Category, ctx: ClothCtx, limit = 1): Item[] {
  return closet
    .filter((i) => i.category === cat)
    .map((i) => ({ i, s: scoreItem(i, ctx) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.i);
}

function outfitItems(outfit: Outfit): Item[] {
  return [outfit.top, outfit.bottom, outfit.outerwear, outfit.accessory].filter(Boolean) as Item[];
}

function sumProfiles(items: Item[]): StyleProfile {
  return items.reduce<StyleProfile>(
    (sum, item) => {
      const p = profileFor(item);
      return {
        formal: sum.formal + p.formal,
        casual: sum.casual + p.casual,
        sporty: sum.sporty + p.sporty,
        cozy: sum.cozy + p.cozy,
        elegant: sum.elegant + p.elegant,
        statement: sum.statement + p.statement,
        utility: sum.utility + p.utility,
        warmth: sum.warmth + p.warmth,
        lightness: sum.lightness + p.lightness,
        rainReady: sum.rainReady + p.rainReady,
        coldRisk: sum.coldRisk + p.coldRisk,
      };
    },
    { ...ZERO_PROFILE },
  );
}

function styleGap(a: StyleProfile, b: StyleProfile): number {
  return (
    Math.abs(a.formal - b.formal) +
    Math.abs(a.sporty - b.sporty) +
    Math.abs(a.cozy - b.cozy) +
    Math.abs(a.elegant - b.elegant) +
    Math.abs(a.statement - b.statement)
  );
}

function outfitFitScore(outfit: Outfit, ctx: ClothCtx): number {
  return outfitItems(outfit).reduce((sum, item) => sum + scoreItem(item, ctx), 0);
}

function outfitCompatibilityScore(outfit: Outfit, ctx: ClothCtx): number {
  const items = outfitItems(outfit);
  const total = sumProfiles(items);
  const top = profileFor(outfit.top);
  const bottom = profileFor(outfit.bottom);
  const outer = profileFor(outfit.outerwear);
  const accessory = profileFor(outfit.accessory);
  const bottomText = itemText(outfit.bottom);
  const accessoryText = itemText(outfit.accessory);
  let s = 0;

  if (outfit.top && outfit.bottom) {
    const gap = styleGap(top, bottom);
    s -= Math.min(9, gap * 0.8);
    if (top.formal >= 2 && bottom.formal >= 2) s += 4;
    if (top.casual >= 1 && bottom.casual >= 1) s += 3;
    if (top.elegant >= 1.8 && bottom.elegant >= 1.2) s += 3;
    if (top.sporty >= 1.5 && bottom.sporty >= 1.5) s += 3;
    if (top.formal >= 2 && bottom.sporty >= 1.5) s -= 5;
    if (top.sporty >= 1.5 && bottom.formal >= 2) s -= 4;
    if (top.elegant >= 2 && bottom.sporty >= 1.5) s -= 5;
  }

  if (outfit.outerwear) {
    const core = sumProfiles([outfit.top, outfit.bottom].filter(Boolean) as Item[]);
    s -= Math.min(5, styleGap(core, outer) * 0.35);
    if (outer.formal >= 1 && core.formal >= 2) s += 2.5;
    if (outer.casual >= 1 && core.casual >= 2) s += 2;
  }

  switch (ctx.destination) {
    case "工作":
      s += total.formal * 1.2 + total.utility * 0.35 - total.sporty * 0.6 - total.cozy * 0.35;
      if (/短褲|運動長褲|內搭褲/.test(bottomText)) s -= 10;
      if (total.formal < 2) s -= 7;
      break;
    case "約會":
      s += total.elegant * 1.1 + total.statement * 0.45 + accessory.elegant * 0.5 - total.utility * 0.35;
      if (/運動長褲|內搭褲/.test(bottomText)) s -= 9;
      if (/旅行袋|電腦包|後背包|郵差包/.test(accessoryText)) s -= 14;
      if (outfit.accessory && accessory.elegant + accessory.statement < 1) s -= 12;
      if (outfit.accessory && accessory.utility > 1) s -= 8;
      if (total.elegant < 2) s -= 5;
      break;
    case "休閒漫步":
      s += total.casual * 0.9 + total.sporty * 0.35 + total.utility * 0.2 - total.formal * 0.2;
      break;
    case "社交聚會":
      s += total.statement * 1.1 + total.elegant * 0.75 + accessory.statement * 0.5 - total.cozy * 0.55;
      if (/運動長褲|內搭褲/.test(bottomText)) s -= 8;
      if (/旅行袋|電腦包|後背包|郵差包/.test(accessoryText)) s -= 10;
      if (outfit.accessory && accessory.elegant + accessory.statement < 1) s -= 8;
      if (total.statement + total.elegant < 2.5) s -= 6;
      break;
    case "居家":
      s += total.cozy * 1.15 + total.casual * 0.45 - total.formal * 0.8 - total.statement * 0.4;
      break;
  }

  switch (ctx.weather) {
    case "cold":
      s += total.warmth * 0.8 - total.coldRisk * 1.3;
      if (!outfit.outerwear) s -= 24;
      break;
    case "rainy":
      s += total.rainReady * 0.7 + total.utility * 0.25;
      if (!outfit.outerwear) s -= 20;
      break;
    case "sunny":
      s += total.lightness * 0.35 - total.warmth * 0.25;
      if (outfit.outerwear) s -= 8;
      break;
    case "cloudy":
      s += total.warmth * 0.2 + total.rainReady * 0.2;
      break;
  }

  if (ctx.gender === "male") {
    for (const item of items) {
      const text = itemText(item);
      if (/裙|洋裝|連衣裙/.test(text)) s -= 18;
      if (/內搭褲/.test(text)) s -= 12;
      if (/手提包|手拿包/.test(text)) s -= 14;
      if (item.category === "accessories" && !/後背包|電腦包|郵差包|旅行袋/.test(text)) s -= 7;
      if (/印度長衫/.test(text)) s -= 16;
      if (/長版上衣/.test(text)) s -= 9;
    }
  }

  return Math.round(s * 10) / 10;
}

function totalOutfitScore(outfit: Outfit, ctx: ClothCtx): number {
  const harmony = outfit.harmony ?? evaluateHarmony(outfit);
  const harmonyPenalty = harmony.verdict === "clash" ? -35 : harmony.verdict === "caution" ? -12 : 0;
  return outfitFitScore(outfit, ctx) * 10 + outfitCompatibilityScore(outfit, ctx) * 4 + harmony.score * 1.2 + harmonyPenalty;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

/** Best-matching makeup look for a context (gender-filtered, highest score). */
export function bestMakeup(weather: Weather, mood: string, destination: string, gender: Gender): Makeup {
  const genderMatches = (m: Makeup) =>
    gender === "male"
      ? m.gender.includes("male")
      : gender === "female"
        ? m.gender.includes("female")
        : m.gender.includes("unisex") || m.gender.includes("female") || m.gender.includes("male");
  const mScore = (m: Makeup) => {
    let s = 0;
    if (m.gender.includes(gender)) s += 4;
    else if (m.gender.includes("unisex")) s += 1.5;
    if (m.weather.includes(weather)) s += 4;
    m.tags.forEach((t) => {
      if (t === mood) s += 3;
      if (t === destination) s += 2;
    });
    return s;
  };
  // 防止空陣列 reduce 崩潰：若某性別過濾後無妝容（admin 刪光該性別+unisex 妝容），
  // 退回整本 lookbook 取最高分，避免 generateOOTDSet/picker 整個崩潰。
  const valid = MAKEUP_LOOKBOOK.filter(genderMatches);
  const pool = valid.length ? valid : MAKEUP_LOOKBOOK;
  return pool.reduce((best, m) => (mScore(m) > mScore(best) ? m : best));
}

/** Best-matching perfume for a context (highest score). */
export function bestPerfume(weather: Weather, mood: string, destination: string, gender: Gender): Perfume {
  const pScore = (p: Perfume) => {
    let s = 0;
    if (p.gender.includes(gender) || p.gender.includes("unisex")) s += 5;
    if (p.weather.includes(weather)) s += 3;
    p.tags.forEach((t) => {
      if (t === mood) s += 2;
      if (t === destination) s += 1;
    });
    return s;
  };
  return PERFUME_LOOKBOOK.reduce((best, p) => (pScore(p) > pScore(best) ? p : best));
}

/**
 * Human-readable reasons for an outfit. Pure + idempotent, so it can be called
 * again after a swap or when loading an old favorite that lacks reasons.
 */
export function buildReasons(outfit: Outfit): Reason[] {
  const { weather, mood, destination, gender } = outfit.context;
  const ctx: ClothCtx = { weather, mood, destination, gender };
  const reasons: Reason[] = [];
  const garments = [outfit.top, outfit.bottom, outfit.outerwear, outfit.accessory].filter(Boolean) as Item[];

  // Weather / outerwear
  if (outfit.outerwear) {
    const name = outfit.outerwear.name;
    if (weather === "rainy") reasons.push({ kind: "outerwear", slot: "outerwear", text: `下雨天，搭一件${name}擋風遮雨。` });
    else if (weather === "cold") reasons.push({ kind: "outerwear", slot: "outerwear", text: `天氣寒冷，加上${name}保暖。` });
    else reasons.push({ kind: "outerwear", slot: "outerwear", text: `微涼天氣，外搭${name}剛剛好。` });
  }

  // Season
  reasons.push({ kind: "season", text: `依${TRANSLATE.weather[weather]}挑選當季單品。` });

  // Destination / mood (one note each if any garment matches)
  if (garments.some((i) => itemHasIntentMatch(i, ctx, "destination")))
    reasons.push({ kind: "destination", text: `貼近你選的「${destination}」場合。` });
  if (garments.some((i) => itemHasIntentMatch(i, ctx, "mood")))
    reasons.push({ kind: "mood", text: `呼應「${mood}」的心情。` });

  // Colour harmony notes
  const harmony = outfit.harmony ?? evaluateHarmony(outfit);
  for (const note of harmony.notes.slice(0, 2)) reasons.push({ kind: "color", text: note });

  return reasons;
}

/**
 * Generate several *distinct* outfits for the same context (A/B comparison).
 * Builds candidate combos from the best-fitting, match-floored garments per
 * category, ranks each full outfit by **selection-fit first, colour-harmony
 * second**, then greedily selects diverse combos. Returns fewer than `count`
 * when the wardrobe is too small to form distinct outfits.
 */
export function generateOOTDSet(
  closet: Item[],
  weather: Weather,
  mood: string,
  destination: string,
  gender: Gender = "unisex",
  count = 3,
): OOTDSet {
  const context = { weather, mood, destination, gender };
  const ctx: ClothCtx = { weather, mood, destination, gender };

  const rankedTops = rankCategory(closet, "tops", ctx);
  const rankedBottoms = rankCategory(closet, "bottoms", ctx);
  const accs = rankCategory(closet, "accessories", ctx); // optional — may be empty
  const outers = rankCategory(closet, "outerwear", ctx); // optional — may be empty
  const makeup = bestMakeup(weather, mood, destination, gender);
  const perfume = bestPerfume(weather, mood, destination, gender);

  const wantOuter = weather === "cold" || weather === "rainy";
  // Pool sizes bound the combo space (top × bottom × accessory × outer); 8×8 is
  // ample for picking `count` diverse outfits while keeping the work modest.
  const topPool = rankedTops.length ? uniqueRankedItems(rankedTops, 8) : bestEffortCategory(closet, "tops", ctx);
  const botPool = rankedBottoms.length ? uniqueRankedItems(rankedBottoms, 8) : bestEffortCategory(closet, "bottoms", ctx);
  const accPool = uniqueRankedItems(accs, 6);
  const outerPool = outers.length
    ? uniqueRankedItems(outers, 5)
    : wantOuter
      ? bestEffortCategory(closet, "outerwear", ctx, 3)
      : [];
  const accessoryOptions: (Item | null)[] = accPool.length ? [null, ...accPool] : [null];
  const outerOptions: (Item | null)[] = wantOuter
    ? outerPool.length
      ? outerPool
      : [null]
    : weather === "cloudy"
      ? [null, ...outerPool.slice(0, 3)]
      : [null];

  // Build candidates WITHOUT reasons (harmony is needed for scoring; reasons are
  // only attached to the few chosen outfits below — buildReasons on all ~thousands
  // of discarded combos was pure waste).
  const assemble = (top: Item | null, bottom: Item | null, accessory: Item | null, outerwear: Item | null): Outfit => {
    const o: Outfit = { top, bottom, outerwear, accessory, makeup, perfume, context };
    o.harmony = evaluateHarmony(o);
    return o;
  };

  // Build candidates from a wider high-fit pool. Full-outfit ranking handles
  // style coherence, so we do not need to over-randomize the seed garments.
  const combos: Outfit[] = [];
  const ti = topPool.length || 1;
  const bi = botPool.length || 1;
  for (let i = 0; i < ti; i++) {
    for (let j = 0; j < bi; j++) {
      for (const accessory of accessoryOptions) {
        for (const outerwear of outerOptions) {
          combos.push(assemble(topPool[i] ?? null, botPool[j] ?? null, accessory, outerwear));
        }
      }
    }
  }

  const total = (o: Outfit) => totalOutfitScore(o, ctx);

  // Greedily pick diverse outfits (avoid near-duplicates).
  const idsOf = (o: Outfit) => [o.top?.id, o.bottom?.id, o.outerwear?.id, o.accessory?.id];
  const keysOf = (o: Outfit) => [itemVariantKey(o.top), itemVariantKey(o.bottom), itemVariantKey(o.outerwear), itemVariantKey(o.accessory)];
  const sameCore = (a: Outfit, b: Outfit) =>
    Boolean(
      itemVariantKey(a.top) &&
        itemVariantKey(a.top) === itemVariantKey(b.top) &&
        itemVariantKey(a.bottom) &&
        itemVariantKey(a.bottom) === itemVariantKey(b.bottom),
    );
  const sameCoreType = (a: Outfit, b: Outfit) =>
    Boolean(
      itemTypeKey(a.top) &&
        itemTypeKey(a.top) === itemTypeKey(b.top) &&
        itemTypeKey(a.bottom) &&
        itemTypeKey(a.bottom) === itemTypeKey(b.bottom),
    );
  const overlap = (a: Outfit, b: Outfit) => {
    const ai = idsOf(a);
    const bi2 = idsOf(b);
    const ak = keysOf(a);
    const bk = keysOf(b);
    return ai.filter((id, k) => (id && id === bi2[k]) || (ak[k] && ak[k] === bk[k])).length;
  };
  const sorted = combos
    .map((outfit) => ({ outfit, score: total(outfit) + Math.random() * 2 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.outfit);
  const chosen: Outfit[] = [];
  for (const c of sorted) {
    if (chosen.length >= count) break;
    if (!chosen.some((o) => sameCore(o, c) || sameCoreType(o, c) || overlap(o, c) >= 3)) chosen.push(c);
  }
  // Top up with remaining combos if diversity left us short.
  for (const c of sorted) {
    if (chosen.length >= count) break;
    if (!chosen.includes(c)) chosen.push(c);
  }

  const fallback = assemble(
    topPool[0] ?? null,
    botPool[0] ?? null,
    accPool[0] ?? null,
    wantOuter ? (outerPool[0] ?? null) : null,
  );
  // Attach reasons only to the returned outfits.
  const outfits = (chosen.length ? chosen : [fallback]).map((o) => {
    o.reasons = buildReasons(o);
    return o;
  });
  return { outfits, context };
}

/**
 * Pick a replacement garment for a slot, excluding the current one (powers the
 * item "swap" button). Same matching as the engine: match-floored + weighted by
 * fit, falling back to any other piece in the category so a swap always works.
 */
export function swapClosetItem(
  cat: Category,
  currentId: string,
  closet: Item[],
  ctx: ClothCtx,
  currentOutfit?: Outfit,
): Item | null {
  const ranked = rankCategory(closet, cat, ctx).filter((x) => x.i.id !== currentId);
  if (currentOutfit && ranked.length) {
    const withItem = (item: Item): Outfit => {
      const base = { ...currentOutfit };
      if (cat === "tops") base.top = item;
      else if (cat === "bottoms") base.bottom = item;
      else if (cat === "outerwear") base.outerwear = item;
      else base.accessory = item;
      base.harmony = evaluateHarmony(base);
      return base;
    };
    const outfitAware = ranked
      .map((x) => {
        const next = withItem(x.i);
        return {
          i: x.i,
          s: Math.max(0.1, x.s * 4 + outfitCompatibilityScore(next, ctx) * 2 + (next.harmony?.score ?? 0) * 0.2),
        };
      })
      .sort((a, b) => b.s - a.s);
    const picked = weightedPick(outfitAware, 8);
    if (picked) return picked;
  }
  const picked = weightedPick(ranked);
  if (picked) return picked;
  const others = closet.filter((i) => i.category === cat && i.id !== currentId);
  return others.length ? others[Math.floor(Math.random() * others.length)] : null;
}

/** Pick a makeup look excluding the current one (powers the "swap" button). */
export function swapMakeupLook(
  current: Makeup,
  ctx: { weather: Weather; mood: string; destination: string; gender: Gender },
): Makeup {
  const genderMatches = (m: Makeup) =>
    ctx.gender === "male"
      ? m.gender.includes("male")
      : ctx.gender === "female"
        ? m.gender.includes("female")
        : m.gender.includes("unisex") || m.gender.includes("female") || m.gender.includes("male");
  const mScore = (m: Makeup) => {
    let s = 0;
    if (m.gender.includes(ctx.gender)) s += 4;
    else if (m.gender.includes("unisex")) s += 1.5;
    if (m.weather.includes(ctx.weather)) s += 4;
    m.tags.forEach((t) => {
      if (t === ctx.mood) s += 3;
      if (t === ctx.destination) s += 2;
    });
    return s;
  };
  const valid = MAKEUP_LOOKBOOK.filter(genderMatches);
  const available = valid.filter((m) => m.id !== current.id).sort((a, b) => mScore(b) - mScore(a));
  if (!available.length) return current;
  const pool = available.slice(0, Math.min(3, available.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Pick a perfume excluding the current one (powers the "swap" button). */
export function swapPerfumePick(
  current: Perfume,
  ctx: { weather: Weather; mood: string; destination: string; gender: Gender },
): Perfume {
  const pScore = (p: Perfume) => {
    let s = 0;
    if (p.gender.includes(ctx.gender) || p.gender.includes("unisex")) s += 5;
    if (p.weather.includes(ctx.weather)) s += 3;
    p.tags.forEach((t) => {
      if (t === ctx.mood) s += 2;
      if (t === ctx.destination) s += 1;
    });
    return s;
  };
  const available = PERFUME_LOOKBOOK.filter(
    (p) => p.id !== current.id && (ctx.gender === "unisex" || p.gender.includes(ctx.gender) || p.gender.includes("unisex")),
  ).sort((a, b) => pScore(b) - pScore(a));
  if (!available.length) return current;
  const pool = available.slice(0, Math.min(3, available.length));
  return pool[Math.floor(Math.random() * pool.length)];
}
