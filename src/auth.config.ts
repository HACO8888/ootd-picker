// Edge-safe Auth.js 設定 — 不含 adapter / db（postgres 無法在 Edge runtime 執行）。
// proxy.ts 用這份解碼既有 JWT 取得 role；完整登入流程在 auth.ts。
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { Role, AccountStatus } from "@/lib/auth.types";

// HTTPS 下 session cookie 用 __Host- 前綴（強制 Path=/、Secure、不得帶 Domain）。
// Auth.js 預設的 __Secure- 允許同站的 *.haco.tw 子網域以 Domain=haco.tw 植入同名
// cookie（cookie tossing），把受害者的 session 換成攻擊者的。
// 以 AUTH_URL 的協定判斷；CI / 本機 dev 走 http 時維持無前綴（瀏覽器不收 http 的 Secure cookie）。
const secureCookies = process.env.AUTH_URL
  ? process.env.AUTH_URL.startsWith("https://")
  : process.env.NODE_ENV === "production";

export default {
  providers: [Google],
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: secureCookies ? "__Host-authjs.session-token" : "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: secureCookies },
    },
  },
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
