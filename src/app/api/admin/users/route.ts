import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/session";
import { listUsers, updateUser, deleteUser } from "@/lib/server/admin-repo";
import { parseBody } from "@/lib/server/parse";
import { userPatchSchema, idBodySchema } from "@/lib/schemas";
import type { Role, AccountStatus } from "@/lib/auth.types";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listUsers());
}

export async function PATCH(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = await parseBody<{ id: string; role?: Role; status?: AccountStatus }>(
    req,
    userPatchSchema,
  );
  if (!parsed.ok) return parsed.res;
  const { id, role, status } = parsed.data;
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
  const parsed = await parseBody<{ id: string }>(req, idBodySchema);
  if (!parsed.ok) return parsed.res;
  if (parsed.data.id === admin.id) {
    return NextResponse.json({ error: "不可刪除自己" }, { status: 400 });
  }
  await deleteUser(parsed.data.id);
  return NextResponse.json({ ok: true });
}
