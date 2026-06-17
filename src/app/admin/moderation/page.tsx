"use client";

import { useEffect, useState, useCallback } from "react";

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
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/moderation");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: "approved" | "rejected") {
    let reason: string | undefined;
    if (action === "rejected") {
      reason = prompt("拒絕原因（選填）") ?? undefined;
    }
    setBusy(id);
    await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action, reason }),
    });
    setRows((rs) => rs.filter((r) => r.id !== id));
    setBusy(null);
  }

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">內容稽核</h1>
      <p className="text-on-surface-variant text-body-sm mb-6">使用者上傳、待審的衣物。</p>

      {loading ? (
        <p className="text-on-surface-variant">載入中…</p>
      ) : rows.length === 0 ? (
        <p className="text-on-surface-variant">目前沒有待審項目。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="border border-outline-variant p-3 flex gap-3">
              <div className="w-20 h-24 shrink-0 bg-outline-variant/30 overflow-hidden">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
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
