// Edge-safe Auth.js 設定 — 不含 adapter / db（postgres 無法在 Edge runtime 執行）。
// proxy.ts 用這份解碼既有 JWT 取得 role；完整登入流程在 auth.ts。
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { Role, AccountStatus } from "@/lib/auth.types";

export default {
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    // 非 admin 被 proxy 擋下時導回首頁（避免預設 /api/auth/signin 迴圈）。
    signIn: "/",
  },
  callbacks: {
    session({ session, token }) {
      // token 為 @auth/core JWT (Record<string, unknown>)，明確轉型。
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as AccountStatus;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
