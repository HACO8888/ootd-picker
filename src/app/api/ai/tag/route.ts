// 公開：上傳衣物照片 → 視覺模型辨識類別／品類／顏色／季節／風格標籤。
// 輸出一律限制在推薦引擎認得的詞彙內（GARMENT_TYPES / COLOR_NAMES / STYLE_TAGS），
// 讓 AI 建檔的單品能完整參與評分、色彩和諧與硬性規則；結果只回填表單，由使用者確認後才存。
import { NextResponse } from "next/server";
import { z } from "zod";
import { aiFailed, chatJson, isAiConfigured, notConfigured, rateLimit } from "@/lib/server/ai";
import { parseBody } from "@/lib/server/parse";
import { aiTagRequestSchema, categorySchema, seasonSchema } from "@/lib/schemas";
import { GARMENT_TYPES, garmentTypeOf } from "@/lib/garment-vocab";
import { COLOR_NAMES } from "@/lib/color-harmony";
import { STYLE_TAGS } from "@/lib/tags";
import type { AutoTagResult } from "@/lib/ai-client";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  category: categorySchema,
  type: z.string().max(20),
  name: z.string().max(40),
  colors: z.array(z.string()).max(6),
  seasons: z.array(z.string()).max(4),
  tags: z.array(z.string()).max(7),
});

const PROMPT = [
  "你是服飾電商的商品建檔助理。請辨識照片中「主要的一件」衣物或配件，只回傳一個 JSON 物件，不要任何說明文字。",
  "所有文字一律使用繁體中文（台灣用語）。欄位：",
  '- category："tops"（上衣）| "bottoms"（下著）| "outerwear"（外套）| "accessories"（配件）。',
  `- type：從下列品類擇一（必須與 category 對應）：${Object.entries(GARMENT_TYPES)
    .map(([c, ts]) => `${c}=${ts.join("/")}`)
    .join("；")}。`,
  "- name：「主色＋細節＋品類」的短名稱，6～14 字，必須包含 type 那個詞，例如「黑色短袖T恤」「卡其色西裝外套」。",
  `- colors：1～2 個主色，只能從這些選：${COLOR_NAMES.join("、")}。`,
  '- seasons：適合穿的季節，從 "spring"、"summer"、"autumn"、"winter" 中選 1～4 個。',
  `- tags：適合的風格／場合，從這些選 1～3 個：${STYLE_TAGS.join("、")}。`,
].join("\n");

export async function POST(req: Request) {
  if (!isAiConfigured()) return notConfigured();
  const limited = rateLimit(req, "tag", 20);
  if (limited) return limited;
  const parsed = await parseBody<{ image: string }>(req, aiTagRequestSchema);
  if (!parsed.ok) return parsed.res;

  try {
    const r = await chatJson(
      [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: parsed.data.image } },
          ],
        },
      ],
      replySchema,
    );
    // Clamp every field to the engine's vocabulary; fix up the name so the
    // engine can always find the garment type in it.
    const allowedTypes: readonly string[] = GARMENT_TYPES[r.category];
    const type = allowedTypes.includes(r.type) ? r.type : garmentTypeOf(r.name);
    const colors = r.colors.filter((c) => COLOR_NAMES.includes(c)).slice(0, 2);
    let name = r.name.trim();
    if (type && !name.includes(type)) name = `${colors[0] ?? ""}${type}`;
    if (!name) name = `${colors[0] ?? ""}${type || "單品"}`;
    const seasons = r.seasons.filter((s): s is AutoTagResult["seasons"][number] => seasonSchema.safeParse(s).success);
    const tags = r.tags.filter((t) => (STYLE_TAGS as readonly string[]).includes(t)).slice(0, 3);
    const result: AutoTagResult = { name, category: r.category, seasons: [...new Set(seasons)], colors, tags };
    return NextResponse.json(result);
  } catch (e) {
    console.error("[ai/tag]", e instanceof Error ? e.message : e);
    return aiFailed();
  }
}
