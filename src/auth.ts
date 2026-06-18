// Auth.js (NextAuth v5) 完整設定 — Google 登入 + JWT session + Drizzle adapter。
// 與 edge-safe 的 auth.config.ts 拆分：此檔含 adapter/db，僅在 Node runtime 載入
// （route handler、server component、API）。
//
// 管理員 bootstrap：登入時若 email ∈ ADMIN_EMAILS，將 DB role 升為 admin，
// 並把 role/status 寫進 JWT。
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq, ne } from "drizzle-orm";
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
      // 初次登入：user 為 adapter 的 DB 使用者；記下 id 並做 admin bootstrap。
      if (user?.id) {
        token.id = user.id;
        const email = user.email?.toLowerCase();
        if (email && adminEmails.includes(email)) {
          // 包 try/catch：輔助寫入失敗不應阻斷登入（下次登入會重試）。
          try {
            await db
              .update(users)
              .set({ role: "admin", updatedAt: new Date() })
              .where(and(eq(users.id, user.id), ne(users.role, "admin")));
          } catch (err) {
            console.error("admin bootstrap failed:", err);
          }
        }
      }

      // 每次 callback 都從 DB 重讀 role/status 覆寫 token，使停權/降權「即時」生效
      // （JWT session 否則會把登入當下的值快取到 token 過期，最長 30 天）。
      // 注意：proxy.ts 用 edge config（無此 callback、不碰 db），故縱深防禦的權威點
      // 在 Node 端的 getActiveUser/getAdminUser（會觸發此 callback 重讀 DB）。
      if (token.id) {
        try {
          const [row] = await db
            .select({ role: users.role, status: users.status })
            .from(users)
            .where(eq(users.id, token.id as string));
          if (row) {
            token.role = row.role;
            token.status = row.status;
          }
        } catch (err) {
          // 短暫 DB 故障時保留既有 token claims（fail-safe，不阻斷請求）。
          console.error("jwt role/status refresh failed:", err);
        }
      }
      return token;
    },
  },
});
