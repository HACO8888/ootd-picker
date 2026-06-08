// Recommendation engine + image fallback — ported verbatim from legacy app.js.
// The scoring logic is intentionally unchanged so recommendations stay identical.
import { IMG, MAKEUP_LOOKBOOK, PERFUME_LOOKBOOK } from "./data";
import type {
  Item,
  Makeup,
  Perfume,
  Outfit,
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
   RECOMMENDATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */
export function generateOOTD(
  closet: Item[],
  weather: Weather,
  mood: string,
  destination: string,
  gender: Gender = "unisex",
): Outfit {
  const ts = seasonsForWeather(weather);
  const seasonal = closet.filter((i) => i.seasons.some((s) => ts.includes(s)));
  const score = (i: Item) => {
    let s = 0;
    if (i.tags.includes(destination)) s += 5;
    if (i.tags.includes(mood)) s += 3;
    return s;
  };
  const byCat = (cat: Category) => {
    let items = seasonal.filter((i) => i.category === cat);
    if (!items.length) items = closet.filter((i) => i.category === cat);
    return items.sort((a, b) => score(b) - score(a));
  };
  const pick = (list: Item[]): Item | null => {
    if (!list.length) return null;
    const pool = list.slice(0, Math.min(3, list.length));
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const top = pick(byCat("tops"));
  const bottom = pick(byCat("bottoms"));
  const accessory = pick(byCat("accessories"));
  let outerwear: Item | null = null;
  if (weather === "cold" || weather === "rainy" || (weather === "cloudy" && Math.random() > 0.4))
    outerwear = pick(byCat("outerwear"));

  const mScore = (m: Makeup) => {
    let s = 0;
    if (m.weather.includes(weather)) s += 4;
    m.tags.forEach((t) => {
      if (t === mood) s += 3;
      if (t === destination) s += 2;
    });
    return s;
  };
  const validMakeup = MAKEUP_LOOKBOOK.filter(
    (m) => !m.gender || m.gender.includes(gender) || m.gender.includes("unisex") || gender === "unisex",
  );
  const makeup = [...validMakeup].sort((a, b) => mScore(b) - mScore(a))[0];

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
  const perfume = [...PERFUME_LOOKBOOK].sort((a, b) => pScore(b) - pScore(a))[0];

  return { top, bottom, outerwear, accessory, makeup, perfume, context: { weather, mood, destination, gender } };
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
