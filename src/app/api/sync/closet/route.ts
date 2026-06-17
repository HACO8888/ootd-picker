import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/server/session";
import { loadCloset, saveCloset } from "@/lib/server/sync-repo";
import type { ClosetDeltas } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await loadCloset(user.id));
}

export async function PUT(req: Request) {
  const user = await getActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as ClosetDeltas;
  if (!body || !Array.isArray(body.userItems) || !Array.isArray(body.hidden)) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  await saveCloset(user.id, {
    userItems: body.userItems,
    hidden: body.hidden,
    overrides: body.overrides ?? {},
  });
  return NextResponse.json({ ok: true });
}
