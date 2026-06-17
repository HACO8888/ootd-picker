"use client";

import { useEffect } from "react";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { registerToast } from "@/lib/sync";

// 把 ChromeProvider 的 showToast 注入同步引擎，讓登入合併完成時能提示使用者。
export function SyncToast() {
  const { showToast } = useChrome();
  useEffect(() => {
    registerToast(showToast);
  }, [showToast]);
  return null;
}
