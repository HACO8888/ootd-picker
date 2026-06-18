import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listPendingModeration, moderateItem } from "@/lib/server/admin-repo";
import { parseBody } from "@/lib/server/parse";
import { moderationSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listPendingModeration());
}

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<{
    id: string;
    action: "approved" | "rejected";
    reason?: string;
  }>(req, moderationSchema);
  if (!parsed.ok) return parsed.res;
  const { id, action, reason } = parsed.data;
  await moderateItem(id, action, reason);
  return NextResponse.json({ ok: true });
}
