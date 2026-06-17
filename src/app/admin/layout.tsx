// 管理員後台 layout。proxy.ts 已在邊緣擋一層，此處 server 端再驗證一次（縱深防禦）。
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  return (
    <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-8 grid md:grid-cols-[180px_1fr] gap-8">
      <aside className="md:border-r md:border-outline-variant md:pr-6 md:sticky md:top-28 md:self-start">
        <p className="kicker text-on-surface-variant mb-4">ADMIN</p>
        <AdminNav />
        <p className="hidden md:block text-body-sm text-on-surface-variant mt-6 pt-4 border-t border-outline-variant truncate">
          {session.user.email}
        </p>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
