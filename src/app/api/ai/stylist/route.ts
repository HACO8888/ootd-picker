// 公開：AI 造型師解說。把推薦引擎已算好的結構化結果（單品、情境、色彩判定、推薦理由）
// 交給 LLM 改寫成自然語言的穿搭建議。不重跑引擎、不收圖片，只送名稱與顏色。
import { NextResponse } from "next/server";
import { z } from "zod";
import { aiFailed, chatJson, isAiConfigured, notConfigured, rateLimit } from "@/lib/server/ai";
import { parseBody } from "@/lib/server/parse";
import { aiStylistRequestSchema } from "@/lib/schemas";
import type { StylistNote, StylistRequest } from "@/lib/ai-client";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  headline: z.string().min(1).max(40),
  summary: z.string().min(1).max(400),
  tips: z.array(z.string().min(1).max(120)).min(1).max(4),
});

const SLOT_ZH = { top: "上衣", bottom: "下著", outerwear: "外套", accessory: "配件" } as const;
const WEATHER_ZH = { sunny: "晴天", cloudy: "多雲", rainy: "雨天", cold: "寒冷" } as const;
const GENDER_ZH = { female: "女生", male: "男生", unisex: "不分性別" } as const;

const SYSTEM = [
  "你是時尚雜誌的資深造型師，語氣專業、溫暖、精準，不浮誇。",
  "根據使用者今天的情境與系統挑好的整套穿搭，寫一段造型解說。只回傳一個 JSON 物件，不要其他文字：",
  '{"headline": "8～16 字的造型標題", "summary": "60～120 字，說明這套為什麼適合今天的天氣、心情與場合，點出色彩與單品搭配的重點", "tips": ["2～3 條具體可執行的穿法小技巧，每條 15～40 字"]}',
  "一律使用繁體中文（台灣用語）。只能談論提供的單品、妝容與香水，不要虛構品牌、價格或其他單品。",
].join("\n");

function describe(p: StylistRequest): string {
  const { context: c } = p;
  return [
    `情境：${GENDER_ZH[c.gender]}／${WEATHER_ZH[c.weather]}／心情「${c.mood}」／目的地「${c.destination}」`,
    ...p.garments.map((g) => `${SLOT_ZH[g.slot]}：${g.name}（${g.colors.join("、") || "未標顏色"}）`),
    `${c.gender === "male" ? "理容" : "妝容"}：${p.makeup}`,
    `香水：${p.perfume}`,
    p.harmony ? `色彩和諧判定：${p.harmony}` : "",
    p.reasons.length ? `系統推薦理由：${p.reasons.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  if (!isAiConfigured()) return notConfigured();
  const limited = rateLimit(req, "stylist", 30);
  if (limited) return limited;
  const parsed = await parseBody<StylistRequest>(req, aiStylistRequestSchema);
  if (!parsed.ok) return parsed.res;

  try {
    const note: StylistNote = await chatJson(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: describe(parsed.data) },
      ],
      replySchema,
    );
    return NextResponse.json(note);
  } catch (e) {
    console.error("[ai/stylist]", e instanceof Error ? e.message : e);
    return aiFailed();
  }
}
