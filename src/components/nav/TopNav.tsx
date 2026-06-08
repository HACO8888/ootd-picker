"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/", label: "首頁" },
  { href: "/closet", label: "我的衣櫥" },
  { href: "/about", label: "關於" },
];

export function TopNav() {
  const pathname = usePathname();
  const { openFavorites } = useChrome();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-[60] bg-surface/90 backdrop-blur-md border-b border-outline-variant/20">
      <nav className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop max-w-[1200px] mx-auto py-6">
        <Link href="/" className="font-headline-md text-headline-md tracking-tight text-primary">
          OOTD PICKER
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                isActive(l.href)
                  ? "text-primary font-bold border-b-2 border-primary pb-1"
                  : "text-on-surface-variant font-medium hover:text-primary transition-all duration-300"
              }
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={openFavorites}
            className="flex items-center gap-2 border border-primary text-primary px-5 py-2 rounded-full font-label-md text-label-md hover:bg-primary/5 transition-all"
          >
            <Icon name="favorite" className="text-[18px]" />
            我的收藏
          </button>
          <Link
            href="/picker"
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-all text-center"
          >
            開始搭配
          </Link>
        </div>

        <button
          className="md:hidden text-primary"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label="開啟選單"
          aria-expanded={drawerOpen}
        >
          <Icon name="menu" />
        </button>
      </nav>

      {drawerOpen && (
        <div className="md:hidden w-full bg-surface border-b border-outline-variant/20 px-8 py-6 flex flex-col gap-4 animate-fade-in">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setDrawerOpen(false)}
              className={
                isActive(l.href)
                  ? "text-primary font-bold text-label-md"
                  : "text-on-surface-variant font-medium text-label-md"
              }
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => {
              openFavorites();
              setDrawerOpen(false);
            }}
            className="text-primary font-bold text-label-md text-left flex items-center gap-2"
          >
            <Icon name="favorite" className="text-[18px]" />
            我的收藏
          </button>
          <Link
            href="/picker"
            onClick={() => setDrawerOpen(false)}
            className="bg-primary text-on-primary text-center py-3 rounded-full text-label-md mt-2"
          >
            開始搭配
          </Link>
        </div>
      )}
    </header>
  );
}
