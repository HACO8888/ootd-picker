import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/server/session";
import { loadCloset, saveCloset } from "@/lib/server/sync-repo";
import { parseBody } from "@/lib/server/parse";
import { closetDeltasSchema } from "@/lib/schemas";
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
  const parsed = await parseBody<ClosetDeltas>(req, closetDeltasSchema);
  if (!parsed.ok) return parsed.res;
  await saveCloset(user.id, {
    userItems: parsed.data.userItems,
    hidden: parsed.data.hidden,
    overrides: parsed.data.overrides ?? {},
  });
  return NextResponse.json({ ok: true });
}
