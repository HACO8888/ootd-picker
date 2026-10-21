// Request-body parsing + zod validation for route handlers (server-only).
// Reads the raw body with a size cap (Next 16 route handlers impose none),
// JSON-parses it, then validates shape with a zod schema. On success returns
// the ORIGINAL parsed object (cast to T) so no field is dropped on round-trip;
// the schema is purely an accept/reject gate.
import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { MAX_BODY_BYTES } from "@/lib/schemas";

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; res: NextResponse };

// Caller declares the domain type it expects; the schema is the runtime gate.
// (Our domain types are slightly looser/stricter than the zod-inferred shapes,
// so decoupling the two avoids fighting structural-assignability of nested
// partials while still validating every request at runtime.)
export async function parseBody<T = unknown>(
  req: Request,
  schema: ZodType,
): Promise<ParseResult<T>> {
  // CSRF：只收 application/json。text/plain 等「簡單請求」不需 CORS preflight，
  // 同站的 *.haco.tw 子網域可帶著 SameSite=Lax 的 session cookie 直接送出；
  // 要求 JSON 後跨來源請求都得先 preflight，而本站不回 CORS header，因此會被擋下。
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Content-Type 必須為 application/json" }, { status: 415 }),
    };
  }
  // 縱深防禦：瀏覽器有送 Fetch Metadata 時，只接受同源或使用者直接發起的請求。
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return {
      ok: false,
      res: NextResponse.json({ error: "不允許跨來源請求" }, { status: 403 }),
    };
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "讀取請求內容失敗" }, { status: 400 }),
    };
  }
  if (text.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      res: NextResponse.json({ error: "請求內容過大" }, { status: 413 }),
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "JSON 格式錯誤" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      res: NextResponse.json({ error: "欄位驗證失敗" }, { status: 400 }),
    };
  }
  // 通過驗證後回傳原始物件（保留所有欄位，避免 zod 預設剝除未知鍵造成資料遺失）。
  return { ok: true, data: json as T };
}
