import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listPendingModeration, moderateItem } from "@/lib/server/admin-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listPendingModeration());
}

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, reason } = (await req.json()) as {
    id?: string;
    action?: "approved" | "rejected";
    reason?: string;
  };
  if (!id || (action !== "approved" && action !== "rejected")) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  await moderateItem(id, action, reason);
  return NextResponse.json({ ok: true });
}
