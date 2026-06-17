import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { getUserData } from "@/lib/server/admin-repo";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const data = await getUserData(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
