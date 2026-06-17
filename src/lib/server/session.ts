// Route handler 用的 session 守門 helper。
import "server-only";
import { auth } from "@/auth";
import type { Role, AccountStatus } from "@/lib/auth.types";

export interface AuthedUser {
  id: string;
  email: string | null;
  role: Role;
  status: AccountStatus;
}

/** 取得已登入且未停權的使用者；否則回 null。 */
export async function getActiveUser(): Promise<AuthedUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  if (u.status === "suspended") return null;
  return {
    id: u.id,
    email: u.email ?? null,
    role: u.role,
    status: u.status,
  };
}

/** 取得 admin；否則回 null。 */
export async function getAdminUser(): Promise<AuthedUser | null> {
  const u = await getActiveUser();
  return u && u.role === "admin" ? u : null;
}
