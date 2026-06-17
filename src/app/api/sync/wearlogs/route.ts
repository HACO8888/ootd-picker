import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/server/session";
import { loadWearLogs, saveWearLogs } from "@/lib/server/sync-repo";
import type { WearLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await loadWearLogs(user.id));
}

export async function PUT(req: Request) {
  const user = await getActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as WearLog[];
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  await saveWearLogs(user.id, body);
  return NextResponse.json({ ok: true });
}
