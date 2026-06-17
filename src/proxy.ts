// Next.js 16 middleware（v16 將 middleware.ts 改名為 proxy.ts）。
// 守護 /admin 與 /api/admin：僅 role==='admin' 放行。
// 用 edge-safe 的 auth.config（解碼 JWT，不碰 db）。
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminArea) return NextResponse.next();

  const role = req.auth?.user?.role;
  if (role === "admin") return NextResponse.next();

  // API → 403 JSON；頁面 → 導回首頁。
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/", req.nextUrl));
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
