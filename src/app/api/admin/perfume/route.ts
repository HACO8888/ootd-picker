import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listPerfume, upsertPerfume, deletePerfume } from "@/lib/server/catalog-repo";
import { parseBody } from "@/lib/server/parse";
import { perfumeSchema, idBodySchema } from "@/lib/schemas";
import type { Perfume } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listPerfume());
}

export async function PUT(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<Perfume>(req, perfumeSchema);
  if (!parsed.ok) return parsed.res;
  await upsertPerfume(parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<{ id: string }>(req, idBodySchema);
  if (!parsed.ok) return parsed.res;
  await deletePerfume(parsed.data.id);
  return NextResponse.json({ ok: true });
}
