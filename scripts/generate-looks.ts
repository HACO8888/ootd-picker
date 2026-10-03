/**
 * Generate one editorial image per makeup look / perfume via an
 * OpenAI-compatible chat endpoint that returns images (Gemini image models).
 *
 *   pnpm gen:looks                    # only looks whose image file is missing
 *   pnpm gen:looks --force            # regenerate every look
 *   pnpm gen:looks --only m3,p4       # specific ids (always regenerated)
 *
 * Env: IMAGE_API_BASE (default $ANTHROPIC_BASE_URL), IMAGE_API_KEY (default
 * $ANTHROPIC_AUTH_TOKEN), IMAGE_MODEL (default gemini-3.1-flash-image).
 * Output: public/looks/<file>.jpg at 600×750 (4:5), overwriting in place so the
 * URLs already stored in the DB keep working.
 */
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MAKEUP_LOOKBOOK, PERFUME_LOOKBOOK } from "../src/lib/data";
import type { Makeup, Perfume } from "../src/lib/types";

const BASE = process.env.IMAGE_API_BASE ?? process.env.ANTHROPIC_BASE_URL;
const KEY = process.env.IMAGE_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN;
const MODEL = process.env.IMAGE_MODEL ?? "gemini-3.1-flash-image";
const FORCE = process.argv.includes("--force");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? new Set(process.argv[onlyIdx + 1].split(",")) : null;
const CONCURRENCY = 3;

const STYLE =
  "Editorial fashion-magazine photograph, portrait orientation 4:5, soft natural window light, " +
  "quiet off-white seamless backdrop, refined and minimal, high-end beauty campaign, film grain. " +
  "Absolutely no text, letters, logos, watermarks or brand names anywhere in the image.";

function makeupPrompt(m: Makeup): string {
  const male = m.gender.includes("male") && !m.gender.includes("female");
  const neutral = m.gender.includes("unisex") && m.gender.includes("male") && m.gender.includes("female");
  const subject = male
    ? "a young East Asian man with clean, well-groomed natural skin (men's grooming, no visible makeup look)"
    : neutral
      ? "an androgynous young East Asian model with short hair"
      : "a young East Asian woman";
  return [
    `Close-up beauty portrait of ${subject}, head and shoulders, looking calmly at the camera.`,
    `Look concept: ${m.name}. Base: ${m.focus}. Eyes/brows: ${m.eye}. Lips: ${m.lip}. Cheeks: ${m.blush}. Highlight: ${m.highlight}.`,
    `Colour story drawn from ${m.colors.join(", ")}; simple neutral top, minimal jewellery.`,
    STYLE,
  ].join(" ");
}

function perfumePrompt(p: Perfume): string {
  return [
    "Still-life product photograph of a single elegant unbranded glass perfume bottle with a plain label-free surface,",
    "standing on a stone or linen surface, styled with a few real ingredients that evoke its notes.",
    `Scent concept: ${p.name}. Top notes: ${p.topNote}. Heart: ${p.heartNote}. Base: ${p.baseNote}. Mood: ${p.style}.`,
    "Colour of the juice and props should reflect the notes.",
    STYLE,
  ].join(" ");
}

async function exists(f: string) {
  try {
    await access(f);
    return true;
  } catch {
    return false;
  }
}

async function generate(prompt: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${BASE}/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(240_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      const json = (await res.json()) as {
        choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
      };
      const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!url?.startsWith("data:")) throw new Error("回應沒有圖片");
      return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    } catch (e) {
      console.error(`  重試 ${attempt + 1}：${e instanceof Error ? e.message : e}`);
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw new Error("生成失敗");
}

async function main() {
  if (!BASE || !KEY) throw new Error("缺少 IMAGE_API_BASE / IMAGE_API_KEY");
  const jobs = [
    ...MAKEUP_LOOKBOOK.map((m) => ({ id: m.id, url: m.makeupImageUrl, prompt: makeupPrompt(m) })),
    ...PERFUME_LOOKBOOK.map((p) => ({ id: p.id, url: p.perfumeImageUrl, prompt: perfumePrompt(p) })),
  ];
  const todo = [];
  for (const j of jobs) {
    const file = path.resolve("public", j.url.replace(/^\//, ""));
    if (ONLY ? ONLY.has(j.id) : FORCE || !(await exists(file))) todo.push({ ...j, file });
  }
  console.log(`要生成 ${todo.length} 張（模型 ${MODEL}）`);
  let ok = 0;
  let fail = 0;
  async function worker() {
    while (todo.length) {
      const j = todo.shift()!;
      try {
        const raw = await generate(j.prompt);
        const out = await sharp(raw)
          .resize(600, 750, { fit: "cover", position: "attention" })
          .jpeg({ quality: 82, mozjpeg: true, progressive: true })
          .toBuffer();
        await writeFile(j.file, out);
        ok++;
        console.log(`  ✓ ${j.id} → ${path.basename(j.file)}`);
      } catch (e) {
        fail++;
        console.error(`  ✗ ${j.id}：${e instanceof Error ? e.message : e}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`完成：成功 ${ok}，失敗 ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
