import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import {
  getGlobalCatalog,
  upsertExtra,
  deleteExtra,
  setOverride,
  removeOverride,
} from "@/lib/server/catalog-repo";
import { parseBody } from "@/lib/server/parse";
import { catalogItemSchema, catalogOverrideSchema, idBodySchema } from "@/lib/schemas";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getGlobalCatalog());
}

// 新增/更新全域服裝（extra）。
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<Item>(req, catalogItemSchema);
  if (!parsed.ok) return parsed.res;
  await upsertExtra(parsed.data);
  return NextResponse.json({ ok: true });
}

// 設定/移除既有 catalog 項的覆蓋。
export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<{ catalogId: string; patch: Partial<Item> | null }>(
    req,
    catalogOverrideSchema,
  );
  if (!parsed.ok) return parsed.res;
  const { catalogId, patch } = parsed.data;
  if (patch == null) await removeOverride(catalogId);
  else await setOverride(catalogId, patch);
  return NextResponse.json({ ok: true });
}

// 刪除全域服裝（extra）。
export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<{ id: string }>(req, idBodySchema);
  if (!parsed.ok) return parsed.res;
  await deleteExtra(parsed.data.id);
  return NextResponse.json({ ok: true });
}
