"use client";

import { useRef, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { TRANSLATE } from "@/lib/data";
import { parseFavoritesJSON } from "@/lib/storage";
import type { Favorite } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (fav: Favorite) => void;
  onToast: (msg: string) => void;
}

export function FavoritesDrawer({ open, onClose, onApply, onToast }: Props) {
  const { favorites, deleteFav, renameFav, replaceAll } = useFavorites();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("確定要刪除此收藏組合嗎？")) {
      deleteFav(id);
      onToast("已刪除收藏！");
    }
  };

  const startRename = (fav: Favorite) => {
    setEditingId(fav.id);
    setDraftName(fav.name ?? "");
  };

  const commitRename = (id: string) => {
    renameFav(id, draftName);
    setEditingId(null);
    onToast("已更新收藏名稱！");
  };

  const exportFavorites = () => {
    if (favorites.length === 0) {
      onToast("目前沒有可匯出的收藏");
      return;
    }
    const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ootd-favorites.json";
    a.click();
    URL.revokeObjectURL(url);
    onToast("已匯出收藏 JSON！");
  };

  const importFavorites = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseFavoritesJSON(reader.result as string);
        const seen = new Set(favorites.map((f) => f.id));
        const merged = [...imported.filter((f) => !seen.has(f.id)), ...favorites];
        replaceAll(merged);
        onToast(`已匯入 ${imported.length} 筆收藏！`);
      } catch (err) {
        onToast(err instanceof Error ? `匯入失敗：${err.message}` : "匯入失敗");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[450px] max-w-full bg-surface shadow-2xl p-8 flex flex-col gap-6 animate-slide-left overflow-y-auto">
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
          <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <Icon name="favorite" /> 我的風格收藏
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={exportFavorites} className="text-on-surface-variant hover:text-primary p-1" title="匯出 JSON" aria-label="匯出收藏">
              <Icon name="download" className="text-[20px]" />
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-on-surface-variant hover:text-primary p-1" title="匯入 JSON" aria-label="匯入收藏">
              <Icon name="upload" className="text-[20px]" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importFavorites(file);
                e.target.value = "";
              }}
            />
            <button type="button" className="text-on-surface-variant hover:text-primary p-1" onClick={onClose} aria-label="關閉收藏">
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {favorites.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant space-y-4">
              <Icon name="favorite_border" className="text-5xl text-outline-variant" />
              <p className="text-sm font-medium">目前還沒有收藏任何風格組合</p>
              <p className="text-xs opacity-60">快點選嚮導來生成你的穿搭與妝容吧！</p>
            </div>
          ) : (
            favorites.map((fav) => {
              const garments = [
                fav.outfit.top?.name,
                fav.outfit.bottom?.name,
                fav.outfit.outerwear?.name,
              ].filter(Boolean);
              const genderLabel = fav.outfit.context.gender
                ? TRANSLATE.gender[fav.outfit.context.gender] || ""
                : "";
              return (
                <div
                  key={fav.id}
                  className="p-5 rounded-xl border border-outline-variant/30 bg-white/50 space-y-4 relative group"
                >
                  <button type="button"
                    onClick={(e) => handleDelete(e, fav.id)}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title="刪除收藏"
                    aria-label="刪除收藏"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>

                  {/* Name (editable) */}
                  {editingId === fav.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        aria-label="收藏名稱"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(fav.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        placeholder="為這組造型命名…"
                        className="flex-1 bg-surface-container border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                      <button type="button" onClick={() => commitRename(fav.id)} className="text-primary" aria-label="儲存名稱">
                        <Icon name="check" className="text-[20px]" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startRename(fav)} className="flex items-center gap-1.5 text-left group/name" title="點擊命名">
                      <span className="font-headline-md text-headline-md text-[17px] text-on-surface">
                        {fav.name || "未命名造型"}
                      </span>
                      <Icon name="edit" className="text-[14px] text-on-surface-variant opacity-0 group-hover/name:opacity-100 transition-opacity" />
                    </button>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-mono">{fav.date}</span>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">
                      {TRANSLATE.weather[fav.outfit.context.weather]} | {fav.outfit.context.destination}
                    </span>
                    {genderLabel && <span className="text-xs text-secondary">{genderLabel}</span>}
                  </div>
                  <div className="space-y-1 border-l-2 border-primary/30 pl-3">
                    <p className="text-sm font-bold text-on-surface leading-tight">{garments.join(" + ")}</p>
                    <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                      <Icon name="auto_awesome" className="text-xs text-secondary" />
                      妝容：{fav.outfit.makeup.name}
                    </p>
                    {fav.outfit.perfume && (
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Icon name="self_care" className="text-xs text-[#7d562d]" />
                        香水：{fav.outfit.perfume.name}
                      </p>
                    )}
                  </div>
                  <button type="button"
                    onClick={() => onApply(fav)}
                    className="w-full bg-primary-container/20 text-on-primary-container py-2 rounded font-label-md text-label-md text-xs hover:bg-primary-container/40 transition-colors"
                  >
                    載入至畫布預覽
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
