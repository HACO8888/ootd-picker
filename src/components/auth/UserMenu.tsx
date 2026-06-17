"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";

// 頂部導覽右側的帳號入口：未登入顯示「登入」，已登入顯示頭像 + 下拉選單。
export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <span className="w-7 h-7 rounded-full bg-outline-variant animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="kicker text-on-surface hover:text-primary transition-colors flex items-center gap-1.5"
        aria-label="使用 Google 登入"
      >
        <Icon name="login" className="text-[20px]" />
        <span className="hidden md:inline">登入</span>
      </button>
    );
  }

  const { name, email, image, role } = session.user;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="帳號選單"
        aria-expanded={open}
        className="flex items-center"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name ?? "帳號"}
            className="w-7 h-7 rounded-full object-cover border border-outline-variant"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-primary text-on-primary grid place-items-center kicker">
            {(name ?? email ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* 點外側關閉 */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-[80] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-60 bg-background border border-outline shadow-lg animate-fade-in">
            <div className="px-4 py-3 border-b border-outline-variant">
              <p className="font-body-md text-on-surface truncate">{name ?? "OOTD 用戶"}</p>
              {email && (
                <p className="text-body-sm text-on-surface-variant truncate">{email}</p>
              )}
            </div>
            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-on-surface hover:bg-outline-variant/40 transition-colors border-b border-outline-variant"
              >
                <Icon name="admin_panel_settings" className="text-[20px]" />
                <span className="kicker">管理員後台</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-on-surface hover:bg-outline-variant/40 transition-colors text-left"
            >
              <Icon name="logout" className="text-[20px]" />
              <span className="kicker">登出</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
