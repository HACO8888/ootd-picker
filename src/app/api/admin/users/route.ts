import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listUsers, updateUser, deleteUser } from "@/lib/server/admin-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listUsers());
}

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, role, status } = (await req.json()) as {
    id?: string;
    role?: "user" | "admin";
    status?: "active" | "suspended";
  };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // 不可停權或降級自己，避免把自己鎖在門外。
  if (id === admin.id && (status === "suspended" || role === "user")) {
    return NextResponse.json({ error: "不可變更自己的權限或狀態" }, { status: 400 });
  }
  await updateUser(id, { role, status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === admin.id) {
    return NextResponse.json({ error: "不可刪除自己" }, { status: 400 });
  }
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
