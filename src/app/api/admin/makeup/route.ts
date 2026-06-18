import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listMakeup, upsertMakeup, deleteMakeup } from "@/lib/server/catalog-repo";
import { parseBody } from "@/lib/server/parse";
import { makeupSchema, idBodySchema } from "@/lib/schemas";
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
  const parsed = await parseBody<Makeup>(req, makeupSchema);
  if (!parsed.ok) return parsed.res;
  await upsertMakeup(parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<{ id: string }>(req, idBodySchema);
  if (!parsed.ok) return parsed.res;
  await deleteMakeup(parsed.data.id);
  return NextResponse.json({ ok: true });
}
