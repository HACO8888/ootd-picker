// 擴充 Auth.js 型別，讓 session 帶 role / status / id。
//
// 註：JWT 介面宣告在 @auth/core（next-auth 的間接依賴），pnpm 嚴格 node_modules
// 下無法從本專案解析該模組來合併 augmentation，因此 JWT 不在此擴充——改在
// callback 內以共用的 Role/AccountStatus 型別明確轉型（見 auth.types.ts）。
import type { DefaultSession } from "next-auth";
import type { Role, AccountStatus } from "@/lib/auth.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: AccountStatus;
    } & DefaultSession["user"];
  }

  // adapter user 會帶這兩個欄位（schema 的 users 表）
  interface User {
    role?: Role;
    status?: AccountStatus;
  }
}
