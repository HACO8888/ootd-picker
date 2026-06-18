"use client";

import { useEffect, useState } from "react";
import { useChrome } from "@/components/chrome/ChromeProvider";

interface Row {
  id: string;
  name: string;
  brand: string;
  category: string;
  tags: string[];
  imageUrl: string;
  ownerEmail: string | null;
  ownerName: string | null;
}

export default function ModerationPage() {
  const { showToast } = useChrome();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await fetch("/api/admin/moderation");
      if (active && res.ok) setRows(await res.json());
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function act(id: string, action: "approved" | "rejected") {
    let reason: string | undefined;
    if (action === "rejected") {
      reason = prompt("拒絕原因（選填）") ?? undefined;
    }
    setBusy(id);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      if (!res.ok) {
        // Only remove the row on a confirmed server-side change; otherwise the
        // moderation queue would silently desync (item stays pending in the DB).
        showToast("操作失敗，請重試");
        return;
      }
      setRows((rs) => rs.filter((r) => r.id !== id));
      showToast(action === "approved" ? "已通過" : "已拒絕");
    } catch {
      showToast("操作失敗，請檢查網路");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">內容稽核</h1>
      <p className="text-on-surface-variant text-body-sm mb-6">使用者上傳、待審的衣物。</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-outline-variant p-3 flex gap-3">
              <div className="w-20 h-24 shrink-0 bg-outline-variant/40 animate-pulse" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 w-24 bg-outline-variant/50 animate-pulse" />
                <div className="h-2.5 w-32 bg-outline-variant/30 animate-pulse" />
                <div className="h-2.5 w-20 bg-outline-variant/30 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-outline-variant py-16 text-center">
          <p className="text-on-surface-variant">目前沒有待審項目 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="border border-outline-variant p-3 flex gap-3">
              <div className="w-20 h-24 shrink-0 bg-outline-variant/30 overflow-hidden">
                {r.imageUrl?.startsWith("data:") ? (
                  // 僅內嵌渲染 data: 上傳圖。遠端 URL 不自動載入，避免未審內容
                  // 讓 admin 瀏覽器向第三方發出請求（IP/UA 外洩 / 追蹤 beacon）。
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : r.imageUrl ? (
                  <div className="w-full h-full flex items-center justify-center p-1 text-center">
                    <span className="text-[10px] leading-tight text-on-surface-variant break-all line-clamp-4">
                      外部圖片（未載入）：{r.imageUrl}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-on-surface truncate">{r.name}</p>
                <p className="text-on-surface-variant text-[12px] truncate">
                  {r.brand} · {r.category}
                </p>
                <p className="text-on-surface-variant text-[12px] truncate">
                  {r.tags.join("、")}
                </p>
                <p className="text-on-surface-variant text-[12px] truncate mt-1">
                  {r.ownerName ?? r.ownerEmail}
                </p>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "approved")}
                    className="kicker text-on-surface hover:text-primary disabled:opacity-40"
                  >
                    通過
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "rejected")}
                    className="kicker text-primary hover:opacity-70 disabled:opacity-40"
                  >
                    拒絕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
