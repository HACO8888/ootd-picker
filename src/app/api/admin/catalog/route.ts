import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import {
  getGlobalCatalog,
  upsertExtra,
  deleteExtra,
  setOverride,
  removeOverride,
} from "@/lib/server/catalog-repo";
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
  const item = (await req.json()) as Item;
  if (!item?.id || !item.name || !item.category) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }
  await upsertExtra(item);
  return NextResponse.json({ ok: true });
}

// 設定/移除既有 catalog 項的覆蓋。
export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { catalogId, patch } = (await req.json()) as {
    catalogId?: string;
    patch?: Partial<Item> | null;
  };
  if (!catalogId) return NextResponse.json({ error: "Missing catalogId" }, { status: 400 });
  if (patch == null) await removeOverride(catalogId);
  else await setOverride(catalogId, patch);
  return NextResponse.json({ ok: true });
}

// 刪除全域服裝（extra）。
export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteExtra(id);
  return NextResponse.json({ ok: true });
}
