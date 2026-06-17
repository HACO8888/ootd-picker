// 管理員後台 layout。proxy.ts 已在邊緣擋一層，此處 server 端再驗證一次（縱深防禦）。
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/users", label: "用戶管理" },
  { href: "/admin/catalog", label: "目錄管理" },
  { href: "/admin/makeup", label: "妝容" },
  { href: "/admin/perfume", label: "香水" },
  { href: "/admin/moderation", label: "內容稽核" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  return (
    <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <aside className="md:border-r md:border-outline-variant md:pr-6">
        <p className="kicker text-on-surface-variant mb-4">ADMIN</p>
        <nav className="flex md:flex-col gap-2 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="kicker text-on-surface hover:text-primary transition-colors whitespace-nowrap py-1.5"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="hidden md:block text-body-sm text-on-surface-variant mt-6 truncate">
          {session.user.email}
        </p>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
