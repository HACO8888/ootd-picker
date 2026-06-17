import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listMakeup, upsertMakeup, deleteMakeup } from "@/lib/server/catalog-repo";
import type { Makeup } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listMakeup());
}

export async function PUT(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const item = (await req.json()) as Makeup;
  if (!item?.id || !item.name) {
    return NextResponse.json({ error: "缺少 id 或 name" }, { status: 400 });
  }
  await upsertMakeup(item);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteMakeup(id);
  return NextResponse.json({ ok: true });
}
