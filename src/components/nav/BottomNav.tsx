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
    <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[min(400px,90%)] flex justify-around items-center bg-surface/95 backdrop-blur-lg py-3 px-6 rounded-full border border-outline-variant/10 shadow-[0px_10px_30px_rgba(135,152,106,0.15)] z-50">
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
                ? "flex flex-col items-center justify-center bg-primary text-on-primary rounded-full w-12 h-12 scale-90 transition-all"
                : "flex flex-col items-center justify-center text-on-surface-variant w-12 h-12 hover:scale-110 transition-transform"
            }
          >
            <Icon name={item.icon} />
            {!active && <span className="font-label-sm text-label-sm mt-0.5">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
