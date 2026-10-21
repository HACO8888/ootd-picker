// Server-side LLM client (server-only). Talks to an OpenAI-compatible AI
// gateway's `/chat/completions` (same setup as the TPSJ11-AI project):
// AI_API_BASE_URL (includes /v1, no endpoint suffix) / AI_API_KEY / AI_TEXT_MODEL.
// Unset → every AI route answers 503 `ai_not_configured` and the UI degrades.
import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

// Read lazily (per call, not at import) so `next build` needs no secrets and
// runtime-injected env (Docker / Zeabur variables) is always picked up.
// `||` not `??`: an empty `AI_TEXT_MODEL=` line in .env must still fall back.
const base = () => process.env.AI_API_BASE_URL?.replace(/\/+$/, "") || "";
const key = () => process.env.AI_API_KEY || "";
const model = () => process.env.AI_TEXT_MODEL || "gemini-flash-latest";
const TIMEOUT_MS = 30_000;

export function isAiConfigured(): boolean {
  return Boolean(base() && key());
}

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface ChatMessage {
  role: "system" | "user";
  content: string | Part[];
}

/** Pull the first JSON object out of a reply (models often wrap it in ``` fences). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("回應中沒有 JSON");
  return JSON.parse(text.slice(start, end + 1));
}

/** Ask the model for a JSON object and validate it with `schema`. */
export async function chatJson<T>(messages: ChatMessage[], schema: ZodType<T>): Promise<T> {
  if (!isAiConfigured()) throw new Error("ai_not_configured");
  // No `response_format`: not every gateway accepts it. The prompts ask for a
  // bare JSON object and extractJson() tolerates fences / stray prose.
  const res = await fetch(`${base()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: model(), messages, temperature: 0.4 }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((e: unknown) => {
    // undici hides the real reason (DNS, TLS, reset, timeout) in `cause`.
    const cause = e instanceof Error && e.cause instanceof Error ? `: ${e.cause.message}` : "";
    throw new Error(`AI 連線失敗${cause}`);
  });
  if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  return schema.parse(extractJson(content));
}

/* ─── rate limiting ─────────────────────────────────────────────────────────
   AI calls cost money and the routes are public (guests can use them), so each
   client IP gets a small sliding-window budget per route. In-memory: per server
   instance, which is enough to stop casual abuse on a single deployment. */
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** null when allowed; otherwise a ready 429 response. */
export function rateLimit(req: Request, route: string, max: number): NextResponse | null {
  const key = `${route}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    return NextResponse.json({ error: "rate_limited", message: "AI 使用次數過多，請稍後再試。" }, { status: 429 });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return null;
}

export const notConfigured = () =>
  NextResponse.json({ error: "ai_not_configured", message: "AI 功能尚未啟用。" }, { status: 503 });

export const aiFailed = () =>
  NextResponse.json({ error: "ai_failed", message: "AI 暫時無法回應，請稍後再試。" }, { status: 502 });
