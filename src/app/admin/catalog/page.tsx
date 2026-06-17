"use client";

import { useEffect, useState, useCallback } from "react";
import type { Item } from "@/lib/types";

interface GlobalCatalog {
  overrides: Record<string, Partial<Item>>;
  extras: Item[];
  hidden: string[];
}

const EXTRA_TEMPLATE: Item = {
  id: "g_new",
  brand: "策展",
  name: "",
  category: "tops",
  seasons: ["spring"],
  colors: ["黑色"],
  tags: [],
  imageUrl: "",
};

export default function AdminCatalogPage() {
  const [data, setData] = useState<GlobalCatalog | null>(null);
  const [extraDraft, setExtraDraft] = useState("");
  const [extraOpen, setExtraOpen] = useState(false);
  const [ovrId, setOvrId] = useState("");
  const [ovrPatch, setOvrPatch] = useState('{ "name": "" }');
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/catalog");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveExtra() {
    setError("");
    let parsed: Item;
    try {
      parsed = JSON.parse(extraDraft);
    } catch {
      setError("服裝 JSON 格式錯誤");
      return;
    }
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "儲存失敗");
      return;
    }
    setExtraOpen(false);
    await load();
  }

  async function deleteExtra(id: string) {
    if (!confirm(`刪除全域服裝 ${id}？`)) return;
    await fetch("/api/admin/catalog", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function saveOverride() {
    setError("");
    if (!ovrId.trim()) {
      setError("請輸入 catalog id");
      return;
    }
    let patch: Partial<Item>;
    try {
      patch = JSON.parse(ovrPatch);
    } catch {
      setError("覆蓋 JSON 格式錯誤");
      return;
    }
    await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ catalogId: ovrId.trim(), patch }),
    });
    setOvrId("");
    await load();
  }

  async function removeOverride(catalogId: string) {
    await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ catalogId, patch: null }),
    });
    await load();
  }

  if (!data) return <p className="text-on-surface-variant">載入中…</p>;

  return (
    <div className="space-y-10">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">目錄管理</h1>
      {error && <p className="text-primary text-body-sm">{error}</p>}

      {/* 全域新增服裝 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="kicker text-on-surface-variant">全域服裝（extras）</h2>
          <button
            type="button"
            onClick={() => {
              setExtraOpen(true);
              setExtraDraft(JSON.stringify(EXTRA_TEMPLATE, null, 2));
            }}
            className="kicker text-primary hover:opacity-70"
          >
            + 新增服裝
          </button>
        </div>
        {extraOpen && (
          <div className="border border-outline p-4 mb-4">
            <textarea
              value={extraDraft}
              onChange={(e) => setExtraDraft(e.target.value)}
              spellCheck={false}
              className="w-full h-56 font-mono text-[12px] border border-outline-variant p-3 bg-background text-on-surface"
            />
            <div className="flex gap-3 mt-3">
              <button type="button" onClick={saveExtra} className="bg-primary text-on-primary px-5 py-2 kicker">
                儲存
              </button>
              <button type="button" onClick={() => setExtraOpen(false)} className="kicker text-on-surface-variant">
                取消
              </button>
            </div>
          </div>
        )}
        {data.extras.length === 0 ? (
          <p className="text-on-surface-variant text-body-sm">尚無全域服裝。</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {data.extras.map((it) => (
              <li key={it.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="text-on-surface truncate">{it.name}</p>
                  <p className="text-on-surface-variant text-[12px]">
                    {it.id} · {it.brand} · {it.category}
                  </p>
                </div>
                <button type="button" onClick={() => deleteExtra(it.id)} className="kicker text-primary hover:opacity-70">
                  刪除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 覆蓋既有 catalog 項 */}
      <section>
        <h2 className="kicker text-on-surface-variant mb-3">覆蓋既有項（overrides）</h2>
        <div className="border border-outline-variant p-4 mb-4 space-y-2">
          <input
            value={ovrId}
            onChange={(e) => setOvrId(e.target.value)}
            placeholder="catalog id（例如 fp_1234）"
            className="w-full border border-outline-variant px-3 py-2 text-body-sm bg-background"
          />
          <textarea
            value={ovrPatch}
            onChange={(e) => setOvrPatch(e.target.value)}
            spellCheck={false}
            className="w-full h-28 font-mono text-[12px] border border-outline-variant p-3 bg-background text-on-surface"
          />
          <button type="button" onClick={saveOverride} className="bg-primary text-on-primary px-5 py-2 kicker">
            套用覆蓋
          </button>
        </div>
        {Object.keys(data.overrides).length === 0 ? (
          <p className="text-on-surface-variant text-body-sm">尚無覆蓋。</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {Object.entries(data.overrides).map(([id, patch]) => (
              <li key={id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-on-surface text-body-sm">{id}</p>
                  <p className="text-on-surface-variant text-[12px] font-mono truncate">
                    {JSON.stringify(patch)}
                  </p>
                </div>
                <button type="button" onClick={() => removeOverride(id)} className="kicker text-primary hover:opacity-70 shrink-0">
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
