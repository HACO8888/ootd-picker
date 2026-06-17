"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { setAuthState } from "@/lib/sync";

// 把 session 狀態橋接到同步引擎：登入→觸發 mergeOnLogin，登出→停止同步。
function SyncBridge() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "loading") return;
    setAuthState(session?.user?.id ?? null);
  }, [status, session?.user?.id]);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SyncBridge />
      {children}
    </SessionProvider>
  );
}
