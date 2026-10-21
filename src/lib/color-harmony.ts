// Pure colour-harmony evaluation — maps Chinese colour names to hue angles and
// classifies an outfit's palette. No React, no I/O, so it's easy to test.
import type { Outfit, HarmonyResult, HarmonyVerdict } from "./types";

// Neutrals pair with anything and never count as a clash. Navy and denim blue
// are wardrobe neutrals in practice (a red top with blue jeans is a classic).
const NEUTRALS = new Set([
  "藏青", "丹寧藍",
  "白色", "黑色", "灰色", "碳灰", "麻灰", "米色", "米白色", "奶油色",
  "卡其色", "裸色", "銀色", "金色", "銅色", "多色", "膚色", "金屬色",
]);

// Chromatic colour name → representative hue angle (0–360 on the HSL wheel).
// Covers the catalog's 37 colours plus the curated defaults.
const HUE: Record<string, number> = {
  紅色: 0, 紅格紋: 0, 鏽紅: 12, 蜜桃色: 20, 棕褐: 28, 古銅: 30, 咖啡色: 25,
  橘色: 30, 焦糖色: 30, 黃色: 50, 芥末黃: 50,
  萊姆綠: 90, 螢光綠: 100, 綠色: 120, 墨綠: 140, 海綠: 160, 藍綠: 175, 土耳其藍: 185,
  淡藍色: 210, 鋼藍: 205, 藍色: 215, 藏青: 225,
  薰衣草紫: 265, 紫色: 275, 淺紫: 280,
  粉色: 340, 玫瑰粉: 345, 洋紅: 330, 酒紅: 350, 勃根地紅: 345,
};
// 顏色名稱來自使用者資料：去掉原型，讓 `name in HUE` 不會命中 "constructor" 等繼承屬性。
Object.setPrototypeOf(HUE, null);

const DENIM_BLUES = new Set(["藍色", "淡藍色", "藏青", "鋼藍"]);

export function isNeutral(name: string): boolean {
  return NEUTRALS.has(name);
}

/** Every colour name the harmony model understands (the AI tagger must pick from these). */
export const COLOR_NAMES: readonly string[] = [...new Set([...NEUTRALS, ...Object.keys(HUE)])].filter((c) => c !== "丹寧藍");

export function colorToHue(name: string): number | null {
  return name in HUE ? HUE[name] : null;
}

/** Smallest angle between two hues (0–180). */
function hueDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const VERDICT_RANK: Record<HarmonyVerdict, number> = { harmonious: 0, caution: 1, clash: 2 };
const LABEL: Record<HarmonyVerdict, string> = { harmonious: "協調", caution: "需注意", clash: "撞色" };

/**
 * Evaluate the colour harmony of an outfit's garments. Neutrals are forgiving;
 * fewer than two chromatic colours is always harmonious (no clash possible).
 */
export function evaluateHarmony(outfit: Outfit): HarmonyResult {
  const garments = [outfit.top, outfit.bottom, outfit.outerwear, outfit.accessory].filter(Boolean);

  // Collect distinct colour names across all garments; blue denim counts as
  // the neutral 丹寧藍 rather than a chromatic blue.
  const names: string[] = [];
  for (const g of garments) {
    const denim = /牛仔|丹寧/.test(g!.name);
    for (const raw of g!.colors) {
      const c = denim && DENIM_BLUES.has(raw) ? "丹寧藍" : raw;
      if (!names.includes(c)) names.push(c);
    }
  }

  const chromatic = names.filter((n) => !isNeutral(n) && colorToHue(n) !== null);
  const hasNeutral = names.some(isNeutral);

  if (chromatic.length < 2) {
    const note =
      chromatic.length === 0
        ? "全中性色調，俐落耐看。"
        : `以中性色為主、${chromatic[0]}點綴，安全耐看。`;
    return { verdict: "harmonious", score: 96, label: LABEL.harmonious, notes: [note] };
  }

  let worst: HarmonyVerdict = "harmonious";
  let clashes = 0;
  let cautions = 0;
  const notes: string[] = [];

  for (let i = 0; i < chromatic.length; i++) {
    for (let j = i + 1; j < chromatic.length; j++) {
      const a = chromatic[i];
      const b = chromatic[j];
      const d = hueDelta(colorToHue(a)!, colorToHue(b)!);
      let verdict: HarmonyVerdict;
      let note: string;
      if (d <= 60) {
        verdict = "harmonious";
        note = `${a}與${b}屬同色系，沉穩協調。`;
      } else if (d >= 150) {
        verdict = "caution";
        cautions++;
        note = `${a}與${b}形成互補對比，搶眼但需拿捏比例。`;
      } else {
        verdict = "clash";
        clashes++;
        note = `${a}與${b}色相落差大，建議用中性色平衡。`;
      }
      if (VERDICT_RANK[verdict] > VERDICT_RANK[worst]) worst = verdict;
      if (verdict !== "harmonious" || notes.length === 0) notes.push(note);
    }
  }

  if (hasNeutral && worst === "clash") {
    // A neutral anchor softens an otherwise clashing palette.
    notes.push("好在有中性色作為緩衝，整體仍可駕馭。");
  }

  const score = Math.max(20, 100 - clashes * 25 - cautions * 10);
  return { verdict: worst, score, label: LABEL[worst], notes: notes.slice(0, 3) };
}
