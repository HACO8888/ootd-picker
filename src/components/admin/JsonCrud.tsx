"use client";

import { useEffect, useState, useCallback } from "react";
import { useChrome } from "@/components/chrome/ChromeProvider";

interface Entity {
  id: string;
  name?: string;
  [k: string]: unknown;
}

// 通用 JSON CRUD 管理器：列出項目、以 JSON 編輯/儲存(PUT)、刪除(DELETE)、新增。
// 用於妝容/香水這類「整包 JSON 物件」的後台維護。
export function JsonCrud({
  title,
  endpoint,
  template,
}: {
  title: string;
  endpoint: string;
  template: Record<string, unknown>;
}) {
  const { showToast } = useChrome();
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(endpoint);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await fetch(endpoint);
      if (active && res.ok) setItems(await res.json());
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [endpoint]);

  function startEdit(item: Entity) {
    setEditing(item.id);
    setDraft(JSON.stringify(item, null, 2));
    setError("");
  }

  function startNew() {
    setEditing("__new__");
    setDraft(JSON.stringify(template, null, 2));
    setError("");
  }

  async function save() {
    let parsed: Entity;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError("JSON 格式錯誤");
      return;
    }
    if (!parsed.id) {
      setError("缺少 id");
      return;
    }
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "儲存失敗");
      return;
    }
    const wasNew = editing === "__new__";
    setEditing(null);
    await load();
    showToast(wasNew ? "已新增" : "已儲存");
  }

  async function remove(id: string) {
    if (!confirm(`刪除 ${id}？`)) return;
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "刪除失敗");
      return;
    }
    await load();
    showToast("已刪除");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
        <button type="button" onClick={startNew} className="kicker text-primary hover:opacity-70">
          + 新增
        </button>
      </div>

      {editing && (
        <div className="border border-outline p-4 mb-6">
          <p className="kicker text-on-surface-variant mb-2">
            {editing === "__new__" ? "新增項目" : `編輯 ${editing}`}
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="w-full h-72 font-mono text-[12px] border border-outline-variant p-3 bg-background text-on-surface"
          />
          {error && <p className="text-primary text-body-sm mt-2">{error}</p>}
          <div className="flex gap-3 mt-3">
            <button type="button" onClick={save} className="bg-primary text-on-primary px-5 py-2 kicker">
              儲存
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="kicker text-on-surface-variant hover:text-on-surface"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <ul className="divide-y divide-outline-variant">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <div className="space-y-2">
                <div className="h-3.5 w-32 bg-outline-variant/60 animate-pulse" />
                <div className="h-2.5 w-12 bg-outline-variant/40 animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-outline-variant/40 animate-pulse" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="text-on-surface truncate">{it.name ?? it.id}</p>
                <p className="text-on-surface-variant text-[12px]">{it.id}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button type="button" onClick={() => startEdit(it)} className="kicker text-on-surface hover:text-primary">
                  編輯
                </button>
                <button type="button" onClick={() => remove(it.id)} className="kicker text-primary hover:opacity-70">
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
