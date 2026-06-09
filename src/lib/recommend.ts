// Recommendation engine + image fallback — ported from legacy app.js. The
// per-item scoring is intentionally unchanged so single recommendations stay
// identical; generateOOTD now additionally attaches optional reasons + harmony
// (purely additive), and generateOOTDSet builds several distinct outfits.
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
   GARMENT SCORING (shared by generateOOTD, generateOOTDSet and item swaps)
   ═══════════════════════════════════════════════════════════════════════════ */

/** The garment-relevant slice of the wizard context. */
export interface ClothCtx {
  weather: Weather;
  mood: string;
  destination: string;
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
  if (i.tags.includes(ctx.destination)) s += 5; // 場合（最重）
  if (i.seasons.some((x) => ts.includes(x))) s += 4; // 天氣/季節（軟加權）
  if (i.tags.includes(ctx.mood)) s += 3; // 心情
  return s;
}

type Scored = { i: Item; s: number };

/** Candidates in a category, gated by the match floor (score > 0), best first. */
function rankCategory(closet: Item[], cat: Category, ctx: ClothCtx): Scored[] {
  return closet
    .filter((i) => i.category === cat)
    .map((i) => ({ i, s: scoreItem(i, ctx) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
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

/** Sample up to `n` distinct garments from a ranked pool, weighted by score². */
function sampleDistinct(pool: Scored[], n: number): Item[] {
  const remaining = [...pool];
  const chosen: Item[] = [];
  while (chosen.length < n && remaining.length) {
    const picked = weightedPick(remaining);
    if (!picked) break;
    chosen.push(picked);
    const idx = remaining.findIndex((x) => x.i.id === picked.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return chosen;
}

/**
 * Pick a garment for a *required* slot (tops/bottoms): prefer the match-floored,
 * weighted pool; if the wardrobe has nothing matching at all, fall back to the
 * best-scoring piece in the category (even score 0) so the outfit isn't broken.
 */
function pickRequired(closet: Item[], cat: Category, ctx: ClothCtx): Item | null {
  const ranked = rankCategory(closet, cat, ctx);
  if (ranked.length) return weightedPick(ranked);
  const any = closet
    .filter((i) => i.category === cat)
    .map((i) => ({ i, s: scoreItem(i, ctx) }))
    .sort((a, b) => b.s - a.s);
  return any.length ? any[0].i : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

/** Best-matching makeup look for a context (gender-filtered, highest score). */
export function bestMakeup(weather: Weather, mood: string, destination: string, gender: Gender): Makeup {
  const mScore = (m: Makeup) => {
    let s = 0;
    if (m.weather.includes(weather)) s += 4;
    m.tags.forEach((t) => {
      if (t === mood) s += 3;
      if (t === destination) s += 2;
    });
    return s;
  };
  const valid = MAKEUP_LOOKBOOK.filter(
    (m) => !m.gender || m.gender.includes(gender) || m.gender.includes("unisex") || gender === "unisex",
  );
  return valid.reduce((best, m) => (mScore(m) > mScore(best) ? m : best));
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

export function generateOOTD(
  closet: Item[],
  weather: Weather,
  mood: string,
  destination: string,
  gender: Gender = "unisex",
): Outfit {
  const ctx: ClothCtx = { weather, mood, destination };

  // Required slots fall back gracefully; optional slots stay empty when nothing
  // clears the match floor (寧可少推也不亂推).
  const top = pickRequired(closet, "tops", ctx);
  const bottom = pickRequired(closet, "bottoms", ctx);
  const accessory = weightedPick(rankCategory(closet, "accessories", ctx));
  let outerwear: Item | null = null;
  if (weather === "cold" || weather === "rainy" || (weather === "cloudy" && Math.random() > 0.4))
    outerwear = weightedPick(rankCategory(closet, "outerwear", ctx));

  const makeup = bestMakeup(weather, mood, destination, gender);
  const perfume = bestPerfume(weather, mood, destination, gender);

  const outfit: Outfit = { top, bottom, outerwear, accessory, makeup, perfume, context: { weather, mood, destination, gender } };
  outfit.harmony = evaluateHarmony(outfit);
  outfit.reasons = buildReasons(outfit);
  return outfit;
}

/**
 * Human-readable reasons for an outfit. Pure + idempotent, so it can be called
 * again after a swap or when loading an old favorite that lacks reasons.
 */
export function buildReasons(outfit: Outfit): Reason[] {
  const { weather, mood, destination } = outfit.context;
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
  if (garments.some((i) => i.tags.includes(destination)))
    reasons.push({ kind: "destination", text: `符合你選的「${destination}」場合。` });
  if (garments.some((i) => i.tags.includes(mood)))
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
  const ctx: ClothCtx = { weather, mood, destination };

  const rankedTops = rankCategory(closet, "tops", ctx);
  const rankedBottoms = rankCategory(closet, "bottoms", ctx);
  const accs = rankCategory(closet, "accessories", ctx); // optional — may be empty
  const outers = rankCategory(closet, "outerwear", ctx); // optional — may be empty
  const makeup = bestMakeup(weather, mood, destination, gender);
  const perfume = bestPerfume(weather, mood, destination, gender);

  // Required slots: weighted-sampled seed pool; if nothing clears the match
  // floor, fall back to the single best-effort piece so the outfit isn't broken.
  const bestEffort = (cat: Category): Item[] => {
    const any = closet
      .filter((i) => i.category === cat)
      .map((i) => ({ i, s: scoreItem(i, ctx) }))
      .sort((a, b) => b.s - a.s);
    return any.length ? [any[0].i] : [];
  };
  const topPool = rankedTops.length ? sampleDistinct(rankedTops, 3) : bestEffort("tops");
  const botPool = rankedBottoms.length ? sampleDistinct(rankedBottoms, 3) : bestEffort("bottoms");
  const wantOuter = weather === "cold" || weather === "rainy";

  const assemble = (top: Item | null, bottom: Item | null, accessory: Item | null, outerwear: Item | null): Outfit => {
    const o: Outfit = { top, bottom, outerwear, accessory, makeup, perfume, context };
    o.harmony = evaluateHarmony(o);
    o.reasons = buildReasons(o);
    return o;
  };

  // Build candidate combos from the seed pools (optional slots stay null when
  // their pool is empty — 寧可少推也不亂推).
  const combos: Outfit[] = [];
  const ti = topPool.length || 1;
  const bi = botPool.length || 1;
  for (let i = 0; i < ti; i++) {
    for (let j = 0; j < bi; j++) {
      const accessory = accs.length ? accs[(i + j) % accs.length].i : null;
      const outerwear =
        outers.length && (wantOuter || (weather === "cloudy" && (i + j) % 2 === 0))
          ? outers[i % outers.length].i
          : null;
      combos.push(assemble(topPool[i] ?? null, botPool[j] ?? null, accessory, outerwear));
    }
  }

  // Rank by selection-fit (weighted ×3) first, colour-harmony second, so the
  // top candidate both matches what the user chose *and* looks coherent.
  const fit = (o: Outfit) =>
    ([o.top, o.bottom, o.outerwear, o.accessory].filter(Boolean) as Item[]).reduce(
      (sum, it) => sum + scoreItem(it, ctx),
      0,
    );
  const total = (o: Outfit) => fit(o) * 3 + (o.harmony?.score ?? 0);

  // Greedily pick diverse outfits (avoid near-duplicates).
  const idsOf = (o: Outfit) => [o.top?.id, o.bottom?.id, o.outerwear?.id, o.accessory?.id];
  const overlap = (a: Outfit, b: Outfit) => {
    const ai = idsOf(a);
    const bi2 = idsOf(b);
    return ai.filter((id, k) => id && id === bi2[k]).length;
  };
  const sorted = [...combos].sort((a, b) => total(b) - total(a));
  const chosen: Outfit[] = [];
  for (const c of sorted) {
    if (chosen.length >= count) break;
    if (!chosen.some((o) => overlap(o, c) >= 3)) chosen.push(c);
  }
  // Top up with remaining combos if diversity left us short.
  for (const c of sorted) {
    if (chosen.length >= count) break;
    if (!chosen.includes(c)) chosen.push(c);
  }

  const fallback = assemble(
    topPool[0] ?? null,
    botPool[0] ?? null,
    accs[0]?.i ?? null,
    wantOuter ? (outers[0]?.i ?? null) : null,
  );
  return { outfits: chosen.length ? chosen : [fallback], context };
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
): Item | null {
  const ranked = rankCategory(closet, cat, ctx).filter((x) => x.i.id !== currentId);
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
  const mScore = (m: Makeup) => {
    let s = 0;
    if (m.weather.includes(ctx.weather)) s += 4;
    m.tags.forEach((t) => {
      if (t === ctx.mood) s += 3;
      if (t === ctx.destination) s += 2;
    });
    return s;
  };
  const valid = MAKEUP_LOOKBOOK.filter(
    (m) => !m.gender || m.gender.includes(ctx.gender) || m.gender.includes("unisex") || ctx.gender === "unisex",
  );
  const available = valid.filter((m) => m.id !== current.id).sort((a, b) => mScore(b) - mScore(a));
  if (!available.length) return current;
  const pool = available.slice(0, Math.max(3, available.length));
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
  const available = PERFUME_LOOKBOOK.filter((p) => p.id !== current.id).sort((a, b) => pScore(b) - pScore(a));
  if (!available.length) return current;
  const pool = available.slice(0, Math.max(3, available.length));
  return pool[Math.floor(Math.random() * pool.length)];
}
