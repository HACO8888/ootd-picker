"use client";

import { useEffect, useState, useCallback } from "react";
import { useChrome } from "@/components/chrome/ChromeProvider";

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  closetCount: number;
  favoriteCount: number;
  wearLogCount: number;
}

export default function AdminUsersPage() {
  const { showToast } = useChrome();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await fetch("/api/admin/users");
      if (active && res.ok) setRows(await res.json());
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function patch(id: string, body: Partial<Pick<UserRow, "role" | "status">>) {
    setBusy(id);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) setError((await res.json()).error ?? "操作失敗");
    else showToast("已更新");
    await load();
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("確定刪除此用戶？其衣櫥、收藏、日誌將一併移除，無法復原。")) return;
    setBusy(id);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) setError((await res.json()).error ?? "刪除失敗");
    else showToast("已刪除");
    await load();
    setBusy(null);
  }

  return (
    <div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6">用戶管理</h1>
      {error && <p className="text-primary mb-4 text-body-sm">{error}</p>}
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="border border-outline-variant p-4 space-y-3">
              <div className="h-4 w-40 bg-outline-variant/60 animate-pulse" />
              <div className="h-3 w-24 bg-outline-variant/40 animate-pulse" />
              <div className="h-3 w-full bg-outline-variant/30 animate-pulse mt-3" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="text-on-surface-variant">尚無用戶。</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((u) => (
            <li key={u.id} className="border border-outline-variant p-4">
              {/* 身分 + 角色/狀態徽章 */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-on-surface truncate">{u.name ?? "—"}</p>
                  <p className="text-on-surface-variant text-[12px] truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`kicker whitespace-nowrap ${u.role === "admin" ? "text-primary" : "text-on-surface-variant"}`}
                  >
                    {u.role === "admin" ? "管理員" : "用戶"}
                  </span>
                  <span className="text-outline-variant">·</span>
                  <span
                    className={`kicker whitespace-nowrap ${u.status === "suspended" ? "text-primary" : "text-on-surface-variant"}`}
                  >
                    {u.status === "suspended" ? "已停權" : "正常"}
                  </span>
                </div>
              </div>

              {/* 計數 */}
              <p className="text-on-surface-variant text-[12px] mt-2">
                衣 {u.closetCount} · 收 {u.favoriteCount} · 誌 {u.wearLogCount}
              </p>

              {/* 操作 */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  disabled={busy === u.id}
                  onClick={() => setViewing(u.id)}
                  className="kicker text-on-surface hover:text-primary disabled:opacity-40"
                >
                  查看
                </button>
                <button
                  type="button"
                  disabled={busy === u.id}
                  onClick={() => patch(u.id, { role: u.role === "admin" ? "user" : "admin" })}
                  className="kicker text-on-surface hover:text-primary disabled:opacity-40"
                >
                  {u.role === "admin" ? "取消管理員" : "設為管理員"}
                </button>
                <button
                  type="button"
                  disabled={busy === u.id}
                  onClick={() => patch(u.id, { status: u.status === "suspended" ? "active" : "suspended" })}
                  className="kicker text-on-surface hover:text-primary disabled:opacity-40"
                >
                  {u.status === "suspended" ? "復權" : "停權"}
                </button>
                <button
                  type="button"
                  disabled={busy === u.id}
                  onClick={() => remove(u.id)}
                  className="kicker text-primary hover:opacity-70 disabled:opacity-40 ml-auto"
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewing && <UserDataDrawer id={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

interface UserData {
  user: { name: string | null; email: string | null };
  closet: { userItems: unknown[]; hidden: string[] };
  favorites: unknown[];
  wearLogs: unknown[];
}

function UserDataDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<UserData | null>(null);
  useEffect(() => {
    void fetch(`/api/admin/users/${id}/data`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, [id]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button type="button" aria-label="關閉" className="flex-1 bg-on-surface/30" onClick={onClose} />
      <div className="w-full max-w-md bg-background h-full overflow-y-auto p-6 border-l border-outline">
        <button type="button" onClick={onClose} className="kicker text-on-surface-variant mb-4">
          關閉 ✕
        </button>
        {!data ? (
          <p className="text-on-surface-variant">載入中…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">{data.user.name ?? "—"}</p>
              <p className="text-on-surface-variant text-body-sm">{data.user.email}</p>
            </div>
            <ul className="text-body-sm text-on-surface space-y-1">
              <li>自訂衣物：{data.closet.userItems.length} 件</li>
              <li>隱藏 catalog：{data.closet.hidden.length} 項</li>
              <li>收藏組合：{data.favorites.length} 套</li>
              <li>穿搭日誌：{data.wearLogs.length} 筆</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
