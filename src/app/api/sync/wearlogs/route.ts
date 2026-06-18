import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/server/session";
import { loadWearLogs, saveWearLogs } from "@/lib/server/sync-repo";
import { parseBody } from "@/lib/server/parse";
import { wearLogsArraySchema } from "@/lib/schemas";
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
  const parsed = await parseBody<WearLog[]>(req, wearLogsArraySchema);
  if (!parsed.ok) return parsed.res;
  await saveWearLogs(user.id, parsed.data);
  return NextResponse.json({ ok: true });
}
