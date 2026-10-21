// Browser-side helpers for the AI assist routes (/api/ai/*). Types only from
// schemas.ts, so zod stays out of the client bundle.
import type { z } from "zod";
import type { aiStylistRequestSchema } from "./schemas";
import type { Category, Outfit, Season } from "./types";

/** /api/ai/tag — garment attributes read from a photo, in the engine's vocabulary. */
export interface AutoTagResult {
  name: string;
  category: Category;
  seasons: Season[];
  colors: string[];
  tags: string[];
}

/** /api/ai/stylist — a stylist's note on one outfit. */
export interface StylistNote {
  headline: string;
  summary: string;
  tips: string[];
}

export type StylistRequest = z.infer<typeof aiStylistRequestSchema>;

export class AiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new AiError("network", "連線失敗，請檢查網路後再試。");
  }
  const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw new AiError(json.error ?? "ai_failed", json.message ?? "AI 暫時無法回應，請稍後再試。");
  return json as T;
}

export const requestAutoTag = (image: string, signal?: AbortSignal) => post<AutoTagResult>("/api/ai/tag", { image }, signal);

export const requestStylist = (payload: StylistRequest, signal?: AbortSignal) =>
  post<StylistNote>("/api/ai/stylist", payload, signal);

const SLOTS = ["top", "bottom", "outerwear", "accessory"] as const;

/** The structured outfit summary the stylist route expects (no images, no ids). */
export function stylistPayload(outfit: Outfit): StylistRequest {
  return {
    context: outfit.context,
    garments: SLOTS.flatMap((slot) => {
      const i = outfit[slot];
      return i ? [{ slot, name: i.name, colors: i.colors }] : [];
    }),
    makeup: outfit.makeup.name,
    perfume: outfit.perfume.name,
    harmony: outfit.harmony?.label,
    reasons: (outfit.reasons ?? []).map((r) => r.text),
  };
}
