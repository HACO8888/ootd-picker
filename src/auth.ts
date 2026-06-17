// Auth.js (NextAuth v5) 完整設定 — Google 登入 + JWT session + Drizzle adapter。
// 與 edge-safe 的 auth.config.ts 拆分：此檔含 adapter/db，僅在 Node runtime 載入
// （route handler、server component、API）。
//
// 管理員 bootstrap：登入時若 email ∈ ADMIN_EMAILS，將 DB role 升為 admin，
// 並把 role/status 寫進 JWT。
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db/client";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // 初次登入：user 為 adapter 的 DB 使用者。
      if (user?.id) {
        token.id = user.id;
        let role = user.role ?? "user";
        const status = user.status ?? "active";

        // admin bootstrap：白名單 email 自動升級。
        const email = user.email?.toLowerCase();
        if (email && adminEmails.includes(email) && role !== "admin") {
          await db
            .update(users)
            .set({ role: "admin", updatedAt: new Date() })
            .where(eq(users.id, user.id));
          role = "admin";
        }

        token.role = role;
        token.status = status;
      }
      return token;
    },
  },
});
