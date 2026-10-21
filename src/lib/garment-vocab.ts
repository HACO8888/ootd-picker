// Garment-type vocabulary shared by the recommendation engine (which derives a
// style profile from the type word in an item's name) and the AI auto-tagger
// (which must name uploads with a word the engine recognises). Pure + tiny, so
// API routes can import it without pulling in the engine or lookbook data.
import type { Category } from "./types";

export const GARMENT_TYPES = {
  tops: ["T恤", "襯衫", "罩衫", "上衣", "長版上衣", "印度長衫", "針織毛衣", "毛衣", "開衫", "大學T", "帽T", "連帽"],
  outerwear: ["外套", "西裝外套", "風雨衣", "風衣", "立領外套", "背心", "罩衫外套"],
  bottoms: ["牛仔褲", "長褲", "寬褲", "闊腿", "運動長褲", "居家長褲", "居家短褲", "短褲", "七分褲", "內搭褲", "彈性窄管褲", "裙"],
  accessories: [
    "後背包", "背包", "手提包", "手拿包", "電腦包", "旅行袋", "郵差包", "手錶", "太陽眼鏡", "皮帶", "圍巾", "毛線圍巾", "披肩", "棒球帽", "領帶",
  ],
} as const satisfies Record<Category, readonly string[]>;

export type GarmentType = (typeof GARMENT_TYPES)[Category][number];

/** Longest key wins, so 西裝外套 beats 外套 and 運動長褲 beats 長褲. */
const TYPE_KEYS: GarmentType[] = (Object.values(GARMENT_TYPES).flat() as GarmentType[]).sort((a, b) => b.length - a.length);

/** The garment type word found in a name ("" when unknown). */
export function garmentTypeOf(name: string): GarmentType | "" {
  return TYPE_KEYS.find((k) => name.includes(k)) ?? "";
}
