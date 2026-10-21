// Recommendation engine + image fallback.
//
// Pipeline (see PRD §8 D-REC-2 for the rationale and measured impact):
//   1. Hard constraints  — garments that are wrong for the context are removed
//      before scoring (gender cut, weather, venue). Pools fall back to the
//      gender-only rule, then to the whole category, so a set is never empty.
//   2. scoreItem         — the PRD contract weights (destination +5, weather /
//      season +4, mood +3) plus *bounded* semantic scores derived from the
//      garment TYPE (T恤 / 西裝外套 / 手拿包 …), so sparse tags can't dominate.
//   3. Stochastic pools  — each category pool is drawn from the top candidates
//      with Gumbel noise, so 「重新生成」 explores the catalog instead of
//      re-ranking the same eight pieces; recently worn pieces are down-weighted.
//   4. Outfit ranking    — fit + top/bottom/outer/accessory compatibility +
//      colour harmony, then a diversity-aware greedy pick of distinct outfits.
//   5. Makeup / perfume  — scored with the same tag affinities and picked per
//      outfit, preferring a different look for each candidate.
//   6. Personal taste    — optional, learnt from favorites / wear logs
//      (personalize.ts); a bounded bonus on garments that already fit the
//      context, so it reorders good candidates but never bypasses the rules.
import { IMG, MAKEUP_LOOKBOOK, PERFUME_LOOKBOOK, TRANSLATE } from "./data";
import { evaluateHarmony } from "./color-harmony";
import { garmentTypeOf, type GarmentType } from "./garment-vocab";
import { tasteMatches, type StyleTaste } from "./personalize";
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
/** Semantic (type-derived) scores are clamped so they refine, not override, the contract weights. */
const STYLE_SCORE_CAP = 4;
/** Women's-cut garment offered to a female user who chose 女生, and vice versa. */
const GENDER_MATCH_BONUS = 1.5;
/** Men's-cut garment in a female context (allowed, but rarely the best pick). */
const CROSS_GENDER_PENALTY = 6;
/** Per-piece penalty for something worn in the last 7 days. */
const RECENT_WEAR_PENALTY = 3;
/** Max bonus from the learnt personal taste — below the mood weight: it breaks ties, not rules. */
const TASTE_BONUS_CAP = 2;
/** Gumbel temperature for pool sampling / outfit ranking (score units). */
const POOL_TEMPERATURE = 1.2;
const OUTFIT_TEMPERATURE = 6;

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

/* ═══════════════════════════════════════════════════════════════════════════
   GARMENT KNOWLEDGE — what each garment type is good for
   ═══════════════════════════════════════════════════════════════════════════ */

type P = Partial<StyleProfile>;

/**
 * Garment types recognised in item names (catalog names are colour + type,
 * curated / user names contain the type word). Keyed by the shared vocabulary
 * in garment-vocab.ts, so the AI tagger and the engine can't drift apart.
 */
const TYPE_PROFILE: Record<GarmentType, P> = {
  // tops
  T恤: { casual: 1.5, sporty: 0.5, lightness: 1.5, coldRisk: 0.5 },
  襯衫: { formal: 1.8, elegant: 0.6, casual: 0.4, warmth: 0.6 },
  罩衫: { elegant: 1.2, lightness: 1 },
  上衣: { elegant: 1, casual: 1, statement: 0.4, lightness: 1.2 },
  長版上衣: { elegant: 1.2, casual: 0.8, lightness: 1 },
  印度長衫: { elegant: 1.5, casual: 0.3, statement: 0.4, lightness: 1 },
  針織毛衣: { cozy: 2, elegant: 1, warmth: 2.2 },
  毛衣: { cozy: 2, elegant: 1, warmth: 2.2 },
  開衫: { cozy: 1.6, elegant: 1.2, warmth: 1.6 },
  大學T: { casual: 1.5, cozy: 1.5, sporty: 1, warmth: 1.5 },
  帽T: { casual: 1.5, cozy: 1.5, sporty: 1, warmth: 1.5 },
  連帽: { casual: 1.5, cozy: 1.5, sporty: 1, warmth: 1.5 },
  // outerwear
  外套: { casual: 1.2, utility: 0.6, warmth: 1.8, rainReady: 0.8 },
  西裝外套: { formal: 3, elegant: 1.2, statement: 0.5, warmth: 1.2 },
  風雨衣: { utility: 1.8, sporty: 1, rainReady: 3, warmth: 1 },
  風衣: { formal: 1.5, elegant: 1.5, rainReady: 1.6, warmth: 1.2 },
  立領外套: { formal: 1.5, elegant: 1.5, statement: 0.6, warmth: 0.8 },
  背心: { formal: 1.5, elegant: 1, warmth: 0.5 },
  罩衫外套: { elegant: 1.5, lightness: 0.8, warmth: 0.5 },
  // bottoms
  牛仔褲: { casual: 2, warmth: 0.8 },
  長褲: { formal: 1.6, elegant: 0.6, warmth: 0.8 },
  寬褲: { elegant: 1.6, casual: 0.6, lightness: 0.6 },
  闊腿: { elegant: 1.6, casual: 0.6, lightness: 0.6 },
  運動長褲: { sporty: 2.2, casual: 1, cozy: 1, warmth: 0.6 },
  居家長褲: { cozy: 2.5, casual: 1, warmth: 0.6 },
  居家短褲: { cozy: 2.2, casual: 1, lightness: 1.2, coldRisk: 2 },
  短褲: { casual: 1.6, sporty: 1, lightness: 2, coldRisk: 2.5 },
  七分褲: { casual: 1.2, lightness: 1.4, coldRisk: 1.5 },
  內搭褲: { cozy: 1.5, sporty: 1, casual: 0.8, warmth: 0.5 },
  彈性窄管褲: { casual: 1.4, elegant: 0.4, warmth: 0.6 },
  裙: { elegant: 2, statement: 0.4, lightness: 0.8, coldRisk: 0.6 },
  // accessories
  後背包: { utility: 2.2, casual: 1.2, sporty: 0.8 },
  背包: { utility: 2.2, casual: 1.2, sporty: 0.8 },
  手提包: { elegant: 2, formal: 0.8, statement: 0.6 },
  手拿包: { elegant: 1.8, statement: 2.2 },
  電腦包: { formal: 1.8, utility: 2 },
  旅行袋: { utility: 2.2, sporty: 1.2, casual: 0.6 },
  郵差包: { utility: 1.4, casual: 1, formal: 0.6 },
  手錶: { formal: 1.4, elegant: 1, statement: 0.4 },
  太陽眼鏡: { casual: 1, statement: 1, lightness: 1 },
  皮帶: { formal: 1.2, casual: 0.6 },
  圍巾: { cozy: 1.6, elegant: 0.8, warmth: 2 },
  毛線圍巾: { cozy: 1.8, casual: 0.6, warmth: 2.2 },
  披肩: { elegant: 2, statement: 1, warmth: 0.8 },
  棒球帽: { casual: 1.4, sporty: 1.4, lightness: 0.6 },
  領帶: { formal: 3, statement: 0.4 },
};

/** Material / detail words that shift a garment's profile. */
const MODIFIERS: [RegExp, P][] = [
  [/西裝/, { formal: 1 }],
  [/皮革|仿皮/, { statement: 1, rainReady: 0.3 }],
  [/羽絨|鋪棉/, { warmth: 2.5, cozy: 0.5 }],
  [/法蘭絨|格紋/, { cozy: 0.8, casual: 0.4 }],
  [/亞麻|棉麻/, { lightness: 1 }],
  [/短袖/, { lightness: 0.8, coldRisk: 0.6 }],
  [/長袖/, { warmth: 0.5 }],
  [/尼龍/, { utility: 0.6, rainReady: 0.5 }],
  [/運動/, { sporty: 1 }],
  [/亮片|金屬/, { statement: 1.5 }],
  [/牛仔/, { casual: 0.6 }],
];

const STATEMENT_COLOURS = new Set(["金色", "銀色", "金屬色", "紅色", "酒紅", "勃根地紅", "洋紅", "古銅"]);

/** Types that are women's cuts when the item carries no explicit gender. */
const FEMININE_TYPES = new Set(["裙", "手提包", "手拿包", "印度長衫", "長版上衣", "內搭褲", "彈性窄管褲", "罩衫外套", "披肩"]);
const MASCULINE_TYPES = new Set(["領帶"]);

const typeCache = new WeakMap<Item, GarmentType | "">();
/** The garment type word found in the item's name ("" when unknown). */
function garmentType(i: Item | null | undefined): GarmentType | "" {
  if (!i) return "";
  const cached = typeCache.get(i);
  if (cached !== undefined) return cached;
  const t = garmentTypeOf(i.name);
  typeCache.set(i, t);
  return t;
}

/** The item's own gender label, else inferred from its type. */
function itemGender(i: Item): Gender {
  if (i.gender) return i.gender;
  const t = garmentType(i);
  return FEMININE_TYPES.has(t) ? "female" : MASCULINE_TYPES.has(t) ? "male" : "unisex";
}

function add(p: StyleProfile, d: P, k = 1) {
  for (const key in d) p[key as keyof StyleProfile] += (d[key as keyof StyleProfile] ?? 0) * k;
}

// Memoize per Item object — profiles are read many times per generate. Items
// are immutable (overrides clone), so caching by identity is safe.
const profileCache = new WeakMap<Item, StyleProfile>();

function profileFor(i: Item | null | undefined): StyleProfile {
  if (!i) return ZERO_PROFILE;
  const cached = profileCache.get(i);
  if (cached) return cached;
  const p: StyleProfile = { ...ZERO_PROFILE };
  const type = garmentType(i);
  if (type) add(p, TYPE_PROFILE[type]);
  for (const [re, d] of MODIFIERS) if (re.test(i.name)) add(p, d);
  if (i.colors.some((c) => STATEMENT_COLOURS.has(c))) p.statement += 1;

  // Tags refine the type (and are the only signal for unrecognised uploads).
  const k = type ? 0.6 : 1.4;
  if (i.tags.includes("工作") || i.tags.includes("專業")) p.formal += 1.2 * k;
  if (i.tags.includes("休閒漫步") || i.tags.includes("放鬆")) p.casual += k;
  if (i.tags.includes("活力")) p.sporty += k;
  if (i.tags.includes("舒適") || i.tags.includes("居家")) p.cozy += k;
  if (i.tags.includes("優雅") || i.tags.includes("約會")) p.elegant += k;
  if (i.tags.includes("社交聚會")) p.statement += 1.3 * k;

  profileCache.set(i, p);
  return p;
}

function relatedTagScore(tags: string[], target: string, affinity: Record<string, WeightedTag[]>): number {
  if (tags.includes(target)) return 0;
  return (affinity[target] ?? []).reduce((best, item) => (tags.includes(item.tag) ? Math.max(best, item.score) : best), 0);
}

const clampStyle = (n: number) => Math.max(-STYLE_SCORE_CAP, Math.min(STYLE_SCORE_CAP, n));

function destinationStyleScore(i: Item, destination: string): number {
  const p = profileFor(i);
  switch (destination) {
    case "工作":
      return p.formal * 1.15 + p.utility * 0.4 + p.elegant * 0.3 - p.sporty * 0.6 - p.cozy * 0.4;
    case "約會":
      return p.elegant * 1.1 + p.statement * 0.55 + p.cozy * 0.2 - p.utility * 0.6 - p.sporty * 0.5;
    case "休閒漫步":
      return p.casual * 1 + p.sporty * 0.45 + p.utility * 0.25 - p.formal * 0.35;
    case "社交聚會":
      return p.statement * 1.15 + p.elegant * 0.85 + p.sporty * 0.2 - p.cozy * 0.5 - p.utility * 0.5;
    case "居家":
      return p.cozy * 1.2 + p.casual * 0.55 - p.formal * 0.7 - p.statement * 0.45 - p.utility * 0.4;
    default:
      return 0;
  }
}

function moodStyleScore(i: Item, mood: string): number {
  const p = profileFor(i);
  switch (mood) {
    case "活力":
      return p.sporty * 1 + p.casual * 0.35 + p.statement * 0.35 - p.formal * 0.2;
    case "放鬆":
      return p.casual * 0.8 + p.cozy * 0.75 - p.statement * 0.25 - p.formal * 0.2;
    case "專業":
      return p.formal * 1.05 + p.utility * 0.3 - p.sporty * 0.4 - p.cozy * 0.3;
    case "優雅":
      return p.elegant * 1 + p.formal * 0.25 + p.statement * 0.2 - p.sporty * 0.4 - p.utility * 0.3;
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
      return p.lightness * 0.65 - p.warmth * (i.category === "outerwear" ? 0.9 : 0.35);
    case "cloudy":
      return p.warmth * 0.25 + p.rainReady * 0.15;
  }
}

function genderStyleScore(i: Item, gender: Gender | undefined): number {
  const g = itemGender(i);
  if (gender === "male") return g === "female" ? -12 : g === "male" ? GENDER_MATCH_BONUS : 0;
  if (gender === "female") return g === "male" ? -CROSS_GENDER_PENALTY : g === "female" ? GENDER_MATCH_BONUS : 0;
  return g === "unisex" ? GENDER_MATCH_BONUS : 0;
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
   HARD CONSTRAINTS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Garment types that are never right for a venue (by category). */
const VENUE_EXCLUDES: Record<string, Partial<Record<Category, string[]>>> = {
  工作: {
    bottoms: ["短褲", "運動長褲", "內搭褲", "居家長褲", "居家短褲", "七分褲"],
    accessories: ["旅行袋", "棒球帽", "太陽眼鏡"],
  },
  約會: {
    bottoms: ["運動長褲", "內搭褲", "居家長褲", "居家短褲"],
    accessories: ["後背包", "背包", "電腦包", "旅行袋", "領帶"],
  },
  社交聚會: {
    bottoms: ["運動長褲", "居家長褲", "居家短褲"],
    accessories: ["後背包", "背包", "電腦包", "旅行袋", "棒球帽"],
  },
  休閒漫步: {
    accessories: ["領帶", "手拿包", "電腦包"],
  },
  居家: {
    outerwear: ["西裝外套", "立領外套", "背心"],
    accessories: ["手提包", "手拿包", "電腦包", "旅行袋", "郵差包", "後背包", "背包", "領帶", "皮帶", "披肩", "太陽眼鏡", "棒球帽"],
  },
};

/** Gender rule only — the one constraint that is never relaxed. */
function violatesGender(i: Item, ctx: ClothCtx): boolean {
  const g = itemGender(i);
  if (ctx.gender === "male") return g === "female";
  if (ctx.gender === "female") return MASCULINE_TYPES.has(garmentType(i));
  return false;
}

/** Whether a garment is ruled out for this context (gender, weather, venue). */
function violates(i: Item, ctx: ClothCtx): boolean {
  if (violatesGender(i, ctx)) return true;
  const type = garmentType(i);
  if ((VENUE_EXCLUDES[ctx.destination]?.[i.category] ?? []).includes(type)) return true;
  const p = profileFor(i);
  const seasons = i.seasons;
  switch (ctx.weather) {
    case "cold":
      if (p.coldRisk >= 1.5) return true;
      if (seasons.length && !seasons.some((s) => s === "autumn" || s === "winter")) return true;
      if (type === "太陽眼鏡") return true;
      break;
    case "sunny":
      if (seasons.length && !seasons.some((s) => s === "spring" || s === "summer")) return true;
      if (i.category === "outerwear" && p.warmth >= 3) return true;
      break;
    case "rainy":
      if (type === "太陽眼鏡") return true;
      break;
  }
  return false;
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
 * How well a garment fits the chosen context. The exact-tag contract weights
 * (destination +5, weather/season +4, mood +3) come first; type-derived style,
 * weather practicality and gender fit add bounded refinements. A piece that
 * matches nothing scores 0 and is excluded by the match floor below.
 */
export function scoreItem(i: Item, ctx: ClothCtx): number {
  const ts = seasonsForWeather(ctx.weather);
  let s = 0;
  if (i.tags.includes(ctx.destination)) s += DIRECT_DESTINATION_WEIGHT; // 場合（最重）
  else s += relatedTagScore(i.tags, ctx.destination, DESTINATION_TAG_AFFINITY);

  if (i.seasons.some((x) => ts.includes(x))) s += DIRECT_WEATHER_WEIGHT; // 天氣/季節

  if (i.tags.includes(ctx.mood)) s += DIRECT_MOOD_WEIGHT; // 心情
  else s += relatedTagScore(i.tags, ctx.mood, MOOD_TAG_AFFINITY);

  s += clampStyle(destinationStyleScore(i, ctx.destination));
  s += clampStyle(moodStyleScore(i, ctx.mood));
  s += clampStyle(weatherPracticalityScore(i, ctx.weather));
  s += genderStyleScore(i, ctx.gender);

  return Math.max(0, Math.round(s * 10) / 10);
}

type Scored = { i: Item; s: number };

const COLOR_PREFIX_RE =
  /^(白色|黑色|灰色|碳灰|麻灰|米色|米白色|奶油色|卡其色|裸色|膚色|銀色|金色|金屬色|銅色|多色|紅色|紅格紋|鏽紅|蜜桃色|棕褐|古銅|咖啡色|橘色|焦糖色|黃色|芥末黃|綠色|萊姆綠|螢光綠|墨綠|海綠|藍綠|土耳其藍|淡藍色|鋼藍|藍色|藏青|薰衣草紫|紫色|淺紫|粉色|玫瑰粉|洋紅|酒紅|勃根地紅)/;

function itemVariantKey(i: Item | null | undefined): string {
  return i ? `${i.name}|${i.colors.join("/")}` : "";
}

function itemTypeKey(i: Item | null | undefined): string {
  return i ? i.name.replace(COLOR_PREFIX_RE, "") : "";
}

/** Gumbel(0, 1) sample — adding T·gumbel to scores and sorting = sampling ∝ exp(s/T). */
function gumbel(random: () => number): number {
  return -Math.log(-Math.log(Math.max(1e-12, random())));
}

interface Ranker {
  ctx: ClothCtx;
  /** Memoized scoreItem (+ personal taste bonus) for this context. */
  score: (i: Item) => number;
  recent: ReadonlySet<string>;
}

/** 0..TASTE_BONUS_CAP — half from the garment's best-liked colour, half from its type. */
function tasteBonus(i: Item, taste: StyleTaste): number {
  const color = Math.max(0, ...i.colors.map((c) => taste.colors[c] ?? 0));
  const type = taste.types[garmentType(i)] ?? 0;
  return TASTE_BONUS_CAP * (0.5 * color + 0.5 * type);
}

function makeRanker(ctx: ClothCtx, recent: ReadonlySet<string>, taste?: StyleTaste | null): Ranker {
  const cache = new Map<Item, number>();
  return {
    ctx,
    recent,
    score: (i) => {
      let s = cache.get(i);
      if (s === undefined) {
        s = scoreItem(i, ctx);
        // Only garments that already match the context get the bonus, so taste
        // can't lift a non-match over the match floor.
        if (taste && s > 0) s += tasteBonus(i, taste);
        cache.set(i, s);
      }
      return s;
    },
  };
}

/**
 * Candidates in a category, best first: match-floored (score > 0) and passing
 * the hard constraints; relaxed to the gender rule only, then to the whole
 * category, so a slot is only empty when the closet has no such garment.
 */
function rankCategory(closet: Item[], cat: Category, r: Ranker): Scored[] {
  const inCat = closet.filter((i) => i.category === cat);
  const scored = (items: Item[]) =>
    items
      .map((i) => ({ i, s: Math.max(0.1, r.score(i) - (r.recent.has(i.id) ? RECENT_WEAR_PENALTY : 0)), raw: r.score(i) }))
      .sort((a, b) => b.s - a.s);
  const strict = scored(inCat.filter((i) => !violates(i, r.ctx))).filter((x) => x.raw > 0);
  if (strict.length) return strict;
  const genderOk = scored(inCat.filter((i) => !violatesGender(i, r.ctx)));
  if (genderOk.length) return genderOk;
  return scored(inCat);
}

/**
 * Draw up to `limit` distinct garments from the ranked list: Gumbel-perturbed
 * among the top `breadth`, so each generate explores different pieces while
 * still strongly favouring the best fits. Caps near-identical types.
 */
function samplePool(ranked: Scored[], limit: number, random: () => number, maxPerType = 2, breadth = limit * 4): Item[] {
  const perturbed = ranked
    .slice(0, breadth)
    .map((x) => ({ i: x.i, k: x.s + POOL_TEMPERATURE * gumbel(random) }))
    .sort((a, b) => b.k - a.k);
  const seen = new Set<string>();
  const typeCounts = new Map<string, number>();
  const items: Item[] = [];
  for (const x of perturbed) {
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
 * toward the best fit while keeping enough variety for swaps to feel alive.
 */
function weightedPick<T>(pool: { i: T; s: number }[], k = 5, random: () => number = Math.random): T | null {
  if (!pool.length) return null;
  const top = pool.slice(0, k);
  const w = top.map((x) => Math.max(0.01, x.s) ** 2);
  const total = w.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let n = 0; n < top.length; n++) {
    r -= w[n];
    if (r <= 0) return top[n].i;
  }
  return top[0].i;
}

function outfitItems(outfit: Outfit): Item[] {
  return [outfit.top, outfit.bottom, outfit.outerwear, outfit.accessory].filter(Boolean) as Item[];
}

function sumProfiles(items: Item[]): StyleProfile {
  const sum = { ...ZERO_PROFILE };
  for (const item of items) add(sum, profileFor(item));
  return sum;
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

/**
 * Fit of the garments to the context. Core slots (top/bottom, and outerwear
 * when the weather calls for it) count in full; optional slots only add what
 * they score above the core average, so an accessory or a cloudy-day layer is
 * included when it genuinely improves the look rather than by default.
 */
function outfitFitScore(outfit: Outfit, r: Ranker, outerRequired: boolean): number {
  const fit = (i: Item) => r.score(i) - (r.recent.has(i.id) ? RECENT_WEAR_PENALTY : 0);
  const core = [outfit.top, outfit.bottom, outerRequired ? outfit.outerwear : null].filter(Boolean) as Item[];
  const coreSum = core.reduce((sum, i) => sum + fit(i), 0);
  const bar = core.length ? (coreSum / core.length) * 0.55 : 0;
  let s = coreSum;
  if (outfit.accessory) s += fit(outfit.accessory) - bar;
  if (outfit.outerwear && !outerRequired) s += fit(outfit.outerwear) - bar;
  return s;
}

function outfitCompatibilityScore(outfit: Outfit, ctx: ClothCtx): number {
  const items = outfitItems(outfit);
  const total = sumProfiles(items);
  const top = profileFor(outfit.top);
  const bottom = profileFor(outfit.bottom);
  const outer = profileFor(outfit.outerwear);
  const accessory = profileFor(outfit.accessory);
  const topType = garmentType(outfit.top);
  const accType = garmentType(outfit.accessory);
  let s = 0;

  if (outfit.top && outfit.bottom) {
    const gap = styleGap(top, bottom);
    s -= Math.min(9, gap * 0.8);
    if (top.formal >= 1.5 && bottom.formal >= 1.5) s += 4;
    if (top.casual >= 1 && bottom.casual >= 1) s += 3;
    if (top.elegant >= 1 && bottom.elegant >= 1.2) s += 3;
    if (top.sporty >= 1 && bottom.sporty >= 1.5) s += 3;
    if (top.cozy >= 1.5 && bottom.cozy >= 1.5) s += 3;
    if (top.formal >= 1.5 && bottom.sporty >= 1.5) s -= 5;
    if (top.sporty >= 1.5 && bottom.formal >= 1.5) s -= 4;
    if (top.elegant >= 1.5 && bottom.sporty >= 1.5) s -= 5;
    // A long kurta / tunic already covers the hips — pair it with slim bottoms, not shorts.
    if ((topType === "印度長衫" || topType === "長版上衣") && /短褲|裙/.test(garmentType(outfit.bottom))) s -= 6;
  }

  if (outfit.outerwear) {
    const core = sumProfiles([outfit.top, outfit.bottom].filter(Boolean) as Item[]);
    s -= Math.min(5, styleGap(core, outer) * 0.35);
    if (outer.formal >= 1 && core.formal >= 2) s += 2.5;
    if (outer.casual >= 1 && core.casual >= 2) s += 2;
    // A hoodie / sweatshirt under a blazer reads as a mistake.
    if (garmentType(outfit.outerwear) === "西裝外套" && top.sporty >= 1) s -= 6;
  }

  if (outfit.accessory) {
    if (accType === "領帶" && topType !== "襯衫") s -= 25; // a tie needs a collar
    s -= Math.min(4, styleGap(sumProfiles([outfit.top, outfit.bottom].filter(Boolean) as Item[]), accessory) * 0.2);
  }

  switch (ctx.destination) {
    case "工作":
      s += total.formal * 1.2 + total.utility * 0.35 - total.sporty * 0.6 - total.cozy * 0.35;
      if (total.formal < 2) s -= 7;
      break;
    case "約會":
      s += total.elegant * 1.1 + total.statement * 0.45 + accessory.elegant * 0.5 - total.utility * 0.35;
      if (outfit.accessory && accessory.elegant + accessory.statement < 1) s -= 8;
      if (total.elegant < 2) s -= 5;
      break;
    case "休閒漫步":
      s += total.casual * 0.9 + total.sporty * 0.35 + total.utility * 0.2 - total.formal * 0.2;
      break;
    case "社交聚會":
      s += total.statement * 1.1 + total.elegant * 0.75 + accessory.statement * 0.5 - total.cozy * 0.55;
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

  // One outfit, one cut: mixing a women's top with men's trousers looks off
  // even in a 不分性別 context.
  const genders = new Set(items.map(itemGender).filter((g) => g !== "unisex"));
  if (genders.size > 1) s -= 10;
  if (ctx.gender === "male" && items.some((i) => itemGender(i) === "female")) s -= 30;

  return Math.round(s * 10) / 10;
}

function totalOutfitScore(outfit: Outfit, r: Ranker, outerRequired: boolean): number {
  const harmony = outfit.harmony ?? evaluateHarmony(outfit);
  const harmonyPenalty = harmony.verdict === "clash" ? -60 : harmony.verdict === "caution" ? -12 : 0;
  return (
    outfitFitScore(outfit, r, outerRequired) * 10 +
    outfitCompatibilityScore(outfit, r.ctx) * 4 +
    harmony.score * 1.2 +
    harmonyPenalty
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAKEUP & PERFUME
   ═══════════════════════════════════════════════════════════════════════════ */

interface LookCtx {
  weather: Weather;
  mood: string;
  destination: string;
  gender: Gender;
}

function lookGenderOk(g: Gender[], gender: Gender): boolean {
  return gender === "unisex" ? true : g.includes(gender);
}

/** Shared scoring for makeup looks and perfumes (both carry gender/weather/tags). */
function lookScore(look: { gender: Gender[]; weather: Weather[]; tags: string[] }, ctx: LookCtx): number {
  let s = 0;
  if (look.gender.includes(ctx.gender)) s += 4;
  else if (look.gender.includes("unisex")) s += 1.5;
  if (look.weather.includes(ctx.weather)) s += 4;
  if (look.tags.includes(ctx.mood)) s += 3;
  else s += relatedTagScore(look.tags, ctx.mood, MOOD_TAG_AFFINITY) * 0.5;
  if (look.tags.includes(ctx.destination)) s += 2.5;
  else s += relatedTagScore(look.tags, ctx.destination, DESTINATION_TAG_AFFINITY) * 0.4;
  return s;
}

/**
 * Makeup for a male context must be grooming (male, not tagged female): the
 * result card titles it 「推薦理容保養」 from the look's own gender, and
 * all-gender looks are photographed as makeup.
 */
function makeupGenderOk(g: Gender[], gender: Gender): boolean {
  return gender === "male" ? g.includes("male") && !g.includes("female") : lookGenderOk(g, gender);
}

function rankLooks<T extends { id: string; gender: Gender[]; weather: Weather[]; tags: string[] }>(
  book: T[],
  ctx: LookCtx,
  genderOk: (g: Gender[], gender: Gender) => boolean = lookGenderOk,
): { i: T; s: number }[] {
  // Gender-filtered first; if the lookbook has nothing for this gender (e.g. an
  // admin deleted them all), fall back to the whole book rather than crash.
  const valid = book.filter((m) => genderOk(m.gender, ctx.gender));
  return (valid.length ? valid : book).map((i) => ({ i, s: lookScore(i, ctx) })).sort((a, b) => b.s - a.s);
}

/**
 * Pick one look per outfit: near-best candidates (within `margin` of the top
 * score) are sampled, preferring looks not already used by an earlier outfit.
 */
function pickLooks<T extends { id: string }>(ranked: { i: T; s: number }[], count: number, random: () => number, margin = 2.5): T[] {
  if (!ranked.length) return [];
  const best = ranked[0].s;
  const near = ranked.filter((x) => x.s >= best - margin);
  const used = new Set<string>();
  const out: T[] = [];
  for (let n = 0; n < count; n++) {
    const fresh = near.filter((x) => !used.has(x.i.id));
    const pick = weightedPick(fresh.length ? fresh : near, 6, random) ?? ranked[0].i;
    used.add(pick.id);
    out.push(pick);
  }
  return out;
}

/** Best-matching makeup look for a context (gender-filtered, highest score). */
export function bestMakeup(weather: Weather, mood: string, destination: string, gender: Gender): Makeup {
  return rankLooks(MAKEUP_LOOKBOOK, { weather, mood, destination, gender }, makeupGenderOk)[0].i;
}

/** Best-matching perfume for a context (highest score). */
export function bestPerfume(weather: Weather, mood: string, destination: string, gender: Gender): Perfume {
  return rankLooks(PERFUME_LOOKBOOK, { weather, mood, destination, gender })[0].i;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Human-readable reasons for an outfit. Pure + idempotent, so it can be called
 * again after a swap or when loading an old favorite that lacks reasons.
 */
export function buildReasons(outfit: Outfit, taste?: StyleTaste | null): Reason[] {
  const { weather, mood, destination, gender } = outfit.context;
  const ctx: ClothCtx = { weather, mood, destination, gender };
  const reasons: Reason[] = [];
  const garments = outfitItems(outfit);

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

  // Personal taste
  if (taste) {
    const liked = [...new Set(garments.flatMap((i) => tasteMatches(i, taste)))].slice(0, 3);
    if (liked.length) reasons.push({ kind: "personal", text: `延續你常收藏、常穿的${liked.join("、")}。` });
  }

  return reasons;
}

export interface GenerateOptions {
  /** Garment ids worn recently (e.g. last 7 days) — down-weighted, not excluded. */
  recentlyWornIds?: ReadonlySet<string>;
  /** Injectable RNG (tests / evaluation); defaults to Math.random. */
  random?: () => number;
  /** Learnt personal taste (personalize.ts) — a bounded bonus; null/absent = off. */
  taste?: StyleTaste | null;
}

/**
 * Generate several *distinct* outfits for the same context (A/B comparison).
 * Builds candidate combos from stochastic, constraint-filtered pools per
 * category, ranks each full outfit by fit + compatibility + colour harmony
 * (with Gumbel noise so regenerations differ), then greedily selects combos
 * that share at most one piece. Returns fewer than `count` when the wardrobe
 * is too small to form distinct outfits.
 */
export function generateOOTDSet(
  closet: Item[],
  weather: Weather,
  mood: string,
  destination: string,
  gender: Gender = "unisex",
  count = 3,
  options: GenerateOptions = {},
): OOTDSet {
  const random = options.random ?? Math.random;
  const context = { weather, mood, destination, gender };
  const ctx: ClothCtx = { weather, mood, destination, gender };
  const r = makeRanker(ctx, options.recentlyWornIds ?? new Set(), options.taste);

  const wantOuter = weather === "cold" || weather === "rainy";
  const rankedTops = rankCategory(closet, "tops", r);
  const rankedBottoms = rankCategory(closet, "bottoms", r);
  // Optional slots keep the strict filter: no accessory beats a wrong one.
  const accs = closet.filter((i) => i.category === "accessories" && !violates(i, ctx) && r.score(i) > 0);
  const rankedAccs = accs.map((i) => ({ i, s: r.score(i) })).sort((a, b) => b.s - a.s);
  const rankedOuters = wantOuter
    ? rankCategory(closet, "outerwear", r)
    : closet
        .filter((i) => i.category === "outerwear" && !violates(i, ctx) && r.score(i) > 0)
        .map((i) => ({ i, s: r.score(i) }))
        .sort((a, b) => b.s - a.s);

  // Pool sizes bound the combo space (top × bottom × accessory × outer).
  const topPool = samplePool(rankedTops, 10, random);
  const botPool = samplePool(rankedBottoms, 10, random);
  const accPool = samplePool(rankedAccs, 6, random);
  const outerPool = samplePool(rankedOuters, 5, random);
  const accessoryOptions: (Item | null)[] = [null, ...accPool];
  const outerOptions: (Item | null)[] = wantOuter
    ? outerPool.length
      ? outerPool
      : [null]
    : weather === "cloudy"
      ? [null, ...outerPool.slice(0, 3)]
      : [null];

  const makeupRanked = rankLooks(MAKEUP_LOOKBOOK, context, makeupGenderOk);
  const perfumeRanked = rankLooks(PERFUME_LOOKBOOK, context);
  const placeholderMakeup = makeupRanked[0].i;
  const placeholderPerfume = perfumeRanked[0].i;

  // Candidates are built WITHOUT reasons (harmony is needed for scoring;
  // reasons are attached only to the few chosen outfits below).
  const assemble = (top: Item | null, bottom: Item | null, accessory: Item | null, outerwear: Item | null): Outfit => {
    const o: Outfit = { top, bottom, outerwear, accessory, makeup: placeholderMakeup, perfume: placeholderPerfume, context };
    o.harmony = evaluateHarmony(o);
    return o;
  };

  const combos: { outfit: Outfit; score: number }[] = [];
  const ti = topPool.length || 1;
  const bi = botPool.length || 1;
  for (let a = 0; a < ti; a++) {
    for (let b = 0; b < bi; b++) {
      for (const accessory of accessoryOptions) {
        for (const outerwear of outerOptions) {
          const o = assemble(topPool[a] ?? null, botPool[b] ?? null, accessory, outerwear);
          combos.push({ outfit: o, score: totalOutfitScore(o, r, wantOuter) + OUTFIT_TEMPERATURE * gumbel(random) });
        }
      }
    }
  }
  combos.sort((x, y) => y.score - x.score);

  // Greedily pick diverse outfits: no shared top/bottom (by variant or by type
  // pair), and at most one shared piece overall.
  const keysOf = (o: Outfit) => [o.top, o.bottom, o.outerwear, o.accessory].map(itemVariantKey);
  const overlap = (a: Outfit, b: Outfit) => {
    const ak = keysOf(a);
    const bk = keysOf(b);
    return ak.filter((k, n) => k && k === bk[n]).length;
  };
  const sameCore = (a: Outfit, b: Outfit) =>
    Boolean(itemVariantKey(a.top) && itemVariantKey(a.top) === itemVariantKey(b.top)) ||
    Boolean(itemVariantKey(a.bottom) && itemVariantKey(a.bottom) === itemVariantKey(b.bottom));
  const sameCoreType = (a: Outfit, b: Outfit) =>
    Boolean(
      itemTypeKey(a.top) &&
        itemTypeKey(a.top) === itemTypeKey(b.top) &&
        itemTypeKey(a.bottom) &&
        itemTypeKey(a.bottom) === itemTypeKey(b.bottom),
    );
  const chosen: Outfit[] = [];
  for (const { outfit: c } of combos) {
    if (chosen.length >= count) break;
    if (!chosen.some((o) => sameCore(o, c) || sameCoreType(o, c) || overlap(o, c) >= 2)) chosen.push(c);
  }
  // Relax to the previous rule (distinct top+bottom pair), then top up.
  for (const { outfit: c } of combos) {
    if (chosen.length >= count) break;
    if (!chosen.includes(c) && !chosen.some((o) => overlap(o, c) >= 3)) chosen.push(c);
  }
  for (const { outfit: c } of combos) {
    if (chosen.length >= count) break;
    if (!chosen.includes(c)) chosen.push(c);
  }

  const result = chosen.length ? chosen : [assemble(topPool[0] ?? null, botPool[0] ?? null, null, wantOuter ? (outerPool[0] ?? null) : null)];
  const makeups = pickLooks(makeupRanked, result.length, random);
  const perfumes = pickLooks(perfumeRanked, result.length, random);
  const outfits = result.map((o, n) => {
    const withLooks: Outfit = { ...o, makeup: makeups[n] ?? placeholderMakeup, perfume: perfumes[n] ?? placeholderPerfume };
    withLooks.reasons = buildReasons(withLooks, options.taste);
    return withLooks;
  });
  return { outfits, context };
}

/**
 * Pick a replacement garment for a slot, excluding the current one (powers the
 * item "swap" button). Same constraints and scoring as the engine, weighted by
 * fit and — when the current outfit is known — by how well it works with the
 * rest of the look. Returns null when nothing suitable is left, so the UI can
 * say so instead of swapping in something that breaks the rules.
 */
export function swapClosetItem(
  cat: Category,
  currentId: string,
  closet: Item[],
  ctx: ClothCtx,
  currentOutfit?: Outfit,
  taste?: StyleTaste | null,
): Item | null {
  const r = makeRanker(ctx, new Set(), taste);
  const current = closet.find((i) => i.id === currentId);
  const currentKey = itemVariantKey(current);
  const ranked = rankCategory(closet, cat, r).filter(
    (x) => x.i.id !== currentId && (!currentKey || itemVariantKey(x.i) !== currentKey),
  );
  if (!ranked.length) return null;
  if (currentOutfit) {
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
      .slice(0, 60)
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
  return weightedPick(ranked);
}

/** Pick a makeup look excluding the current one (powers the "swap" button). */
export function swapMakeupLook(current: Makeup, ctx: LookCtx): Makeup {
  const available = rankLooks(MAKEUP_LOOKBOOK, ctx, makeupGenderOk).filter((x) => x.i.id !== current.id);
  return weightedPick(available, 4) ?? current;
}

/** Pick a perfume excluding the current one (powers the "swap" button). */
export function swapPerfumePick(current: Perfume, ctx: LookCtx): Perfume {
  const available = rankLooks(PERFUME_LOOKBOOK, ctx).filter((x) => x.i.id !== current.id);
  return weightedPick(available, 4) ?? current;
}
