"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/users", label: "用戶管理" },
  { href: "/admin/catalog", label: "目錄管理" },
  { href: "/admin/makeup", label: "妝容" },
  { href: "/admin/perfume", label: "香水" },
  { href: "/admin/moderation", label: "內容稽核" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex md:flex-col gap-x-4 gap-y-1 overflow-x-auto -mx-1 px-1 pb-1 md:pb-0">
      {NAV.map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "kicker whitespace-nowrap text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary md:pl-3 md:-ml-3 py-1.5 transition-colors"
                : "kicker whitespace-nowrap text-on-surface-variant hover:text-on-surface md:pl-3 md:-ml-3 py-1.5 transition-colors"
            }
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
