"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/", label: "首頁" },
  { href: "/closet", label: "我的衣櫥" },
  { href: "/journal", label: "穿搭日誌" },
  { href: "/insights", label: "衣櫥洞察" },
  { href: "/about", label: "關於" },
];

export function TopNav() {
  const pathname = usePathname();
  const { openFavorites } = useChrome();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm border-b border-outline">
      {/* Issue strip — editorial masthead top line */}
      <div className="hidden lg:flex justify-between items-center max-w-content mx-auto px-container-padding-desktop pt-3">
        <span className="kicker text-on-surface-variant">ISSUE Nº06 — 2026</span>
        <span className="kicker text-on-surface-variant">每日穿搭 · 妝容 · 香氛</span>
      </div>

      <nav className="grid grid-cols-[1fr_auto_1fr] items-center max-w-content mx-auto px-container-padding-mobile lg:px-container-padding-desktop py-4 lg:py-6">
        {/* Left: desktop nav links */}
        <div className="hidden lg:flex gap-6 xl:gap-7 items-center justify-start">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                isActive(l.href)
                  ? "kicker whitespace-nowrap text-on-surface border-b border-primary pb-1"
                  : "kicker whitespace-nowrap text-on-surface-variant hover:text-on-surface transition-colors"
              }
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile / tablet menu button (left cell) */}
        <button
          type="button"
          className="lg:hidden text-on-surface justify-self-start"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label="開啟選單"
          aria-expanded={drawerOpen}
        >
          <Icon name={drawerOpen ? "close" : "menu"} />
        </button>

        {/* Center: masthead logo */}
        <Link
          href="/"
          className="font-headline-md text-headline-md lg:text-headline-lg text-primary tracking-tight text-center px-2 sm:px-4 whitespace-nowrap"
        >
          OOTD PICKER
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 justify-end">
          <button
            type="button"
            onClick={openFavorites}
            aria-label="我的收藏"
            className="text-on-surface hover:text-primary transition-colors"
          >
            <Icon name="favorite" className="text-[22px]" />
          </button>
          <UserMenu />
          <Link
            href="/picker"
            className="hidden lg:inline-flex bg-primary text-on-primary px-6 py-2.5 kicker hover:bg-surface-tint transition-colors"
          >
            START
          </Link>
        </div>
      </nav>

      {/* Mobile / tablet full-screen overlay menu */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] bg-background flex flex-col h-[100dvh] animate-fade-in">
          <div className="flex justify-between items-center px-container-padding-mobile py-5 border-b border-outline">
            <span className="font-headline-md text-headline-md text-primary tracking-tight">OOTD PICKER</span>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="關閉選單" className="text-on-surface">
              <Icon name="close" />
            </button>
          </div>
          <div className="flex-1 flex flex-col px-container-padding-mobile py-8 gap-2 overflow-y-auto">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setDrawerOpen(false)}
                className={
                  isActive(l.href)
                    ? "font-headline-lg text-headline-lg text-primary py-3 border-b border-outline-variant"
                    : "font-headline-lg text-headline-lg text-on-surface py-3 border-b border-outline-variant"
                }
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                openFavorites();
                setDrawerOpen(false);
              }}
              className="font-headline-lg text-headline-lg text-on-surface py-3 border-b border-outline-variant text-left flex items-center gap-3"
            >
              <Icon name="favorite" /> 我的收藏
            </button>

            {/* 帳號 */}
            {session?.user ? (
              <>
                {session.user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setDrawerOpen(false)}
                    className="font-headline-lg text-headline-lg text-on-surface py-3 border-b border-outline-variant flex items-center gap-3"
                  >
                    <Icon name="admin_panel_settings" /> 管理員後台
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    signOut();
                  }}
                  className="font-headline-lg text-headline-lg text-on-surface-variant py-3 border-b border-outline-variant text-left flex items-center gap-3"
                >
                  <Icon name="logout" /> 登出
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  signIn("google");
                }}
                className="font-headline-lg text-headline-lg text-on-surface py-3 border-b border-outline-variant text-left flex items-center gap-3"
              >
                <Icon name="login" /> 登入
              </button>
            )}

            <Link
              href="/picker"
              onClick={() => setDrawerOpen(false)}
              className="mt-6 bg-primary text-on-primary text-center py-4 kicker"
            >
              START THE EDIT
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
