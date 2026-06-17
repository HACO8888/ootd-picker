import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { getStats } from "@/lib/server/admin-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getStats());
}
