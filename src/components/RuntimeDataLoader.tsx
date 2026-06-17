"use client";

import { useEffect } from "react";
import { setMakeupLookbook, setPerfumeLookbook } from "@/lib/data";
import { setCatalogOverlay } from "@/lib/catalog";
import { refreshAllStores } from "@/lib/store";
import type { Makeup, Perfume, Item } from "@/lib/types";

// 啟動時載入管理員後台維護的妝容/香水與全域 catalog 調整，套用到執行期資料。
// 對所有訪客生效；失敗時靜默退回 data.ts 內建內容。
export function RuntimeDataLoader() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [looksRes, catRes] = await Promise.all([
          fetch("/api/looks"),
          fetch("/api/catalog/global"),
        ]);
        if (cancelled) return;
        if (looksRes.ok) {
          const { makeup, perfume } = (await looksRes.json()) as {
            makeup: Makeup[];
            perfume: Perfume[];
          };
          setMakeupLookbook(makeup);
          setPerfumeLookbook(perfume);
        }
        if (catRes.ok) {
          const overlay = (await catRes.json()) as {
            overrides: Record<string, Partial<Item>>;
            hidden: string[];
            extras: Item[];
          };
          const hasChange =
            Object.keys(overlay.overrides).length > 0 ||
            overlay.extras.length > 0 ||
            overlay.hidden.length > 0;
          if (hasChange) {
            setCatalogOverlay(overlay);
            refreshAllStores();
          }
        }
      } catch {
        // 靜默：維持 data.ts 內建內容。
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
