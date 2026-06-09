"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const ITEMS = [
  { href: "/", icon: "home", label: "首頁" },
  { href: "/picker", icon: "auto_awesome", label: "搭配" },
  { href: "/closet", icon: "dresser", label: "衣櫥" },
  { href: "/about", icon: "info", label: "關於" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around items-stretch bg-background border-t border-outline">
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 text-primary border-t-2 border-primary -mt-px transition-colors"
                : "flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 text-on-surface-variant transition-colors"
            }
          >
            <Icon name={item.icon} className="text-[22px]" />
            <span className="kicker text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
