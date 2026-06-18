"use client";

import { useRef, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useWearLog } from "@/hooks/useWearLog";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { TRANSLATE } from "@/lib/data";
import { parseFavoritesJSON } from "@/lib/storage";
import { todayISO } from "@/lib/wearlog";
import type { Favorite } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (fav: Favorite) => void;
  onShare: (fav: Favorite) => void;
  onToast: (msg: string) => void;
}

export function FavoritesDrawer({ open, onClose, onApply, onShare, onToast }: Props) {
  const { favorites, deleteFav, renameFav, replaceAll } = useFavorites();
  const { logWear } = useWearLog();
  const { confirm: confirmDialog } = useChrome();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(todayISO());
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, open, onClose);

  if (!open) return null;

  const startLogWear = (fav: Favorite) => {
    setLoggingId(fav.id);
    setLogDate(todayISO());
  };

  const commitLogWear = (fav: Favorite) => {
    logWear(fav.outfit, logDate, { favoriteId: fav.id });
    setLoggingId(null);
    onToast("已記錄至穿搭日誌！");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "刪除收藏",
      message: "確定要刪除此收藏組合嗎？",
      confirmLabel: "刪除",
      danger: true,
    });
    if (ok) {
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
      <div className="absolute inset-0 bg-on-surface/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-drawer-title"
        className="absolute right-0 top-0 h-full w-[450px] max-w-full bg-surface-bright border-l border-outline shadow-2xl p-8 flex flex-col gap-6 animate-slide-left overflow-y-auto"
      >
        <div className="flex justify-between items-end border-b border-outline pb-4">
          <div>
            <Kicker className="text-primary">MY EDIT</Kicker>
            <h2 id="favorites-drawer-title" className="font-headline-md text-headline-md text-on-surface mt-1">我的風格收藏</h2>
          </div>
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
              <p className="font-headline-md text-headline-md text-[18px] text-on-surface">尚無收藏的風格組合</p>
              <p className="font-body-md text-body-md text-[14px]">快點選嚮導來生成你的穿搭與妝容吧！</p>
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
                  className="p-5 border border-outline-variant bg-surface-bright space-y-4 relative group hover:border-on-surface transition-colors"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); onShare(fav); }}
                      className="text-on-surface-variant hover:text-primary"
                      title="分享"
                      aria-label="分享收藏"
                    >
                      <Icon name="ios_share" className="text-[18px]" />
                    </button>
                    <button type="button"
                      onClick={(e) => handleDelete(e, fav.id)}
                      className="text-on-surface-variant hover:text-error"
                      title="刪除收藏"
                      aria-label="刪除收藏"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>

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
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-none px-3 py-1.5 text-sm focus:ring-0 focus:border-on-surface outline-none"
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
                    <span className="kicker text-on-surface-variant">{fav.date}</span>
                    <span className="kicker text-primary">
                      {TRANSLATE.weather[fav.outfit.context.weather]} · {fav.outfit.context.destination}
                    </span>
                    {genderLabel && <span className="kicker text-on-surface-variant">{genderLabel}</span>}
                  </div>
                  <div className="space-y-1.5 border-l-2 border-primary pl-3">
                    <p className="font-body-md text-body-md text-[14px] font-semibold text-on-surface leading-snug">{garments.join(" + ")}</p>
                    <p className="font-body-md text-body-md text-[13px] text-on-surface-variant flex items-center gap-1.5">
                      <Icon name="auto_awesome" className="text-[14px] text-on-surface" />
                      妝容：{fav.outfit.makeup.name}
                    </p>
                    {fav.outfit.perfume && (
                      <p className="font-body-md text-body-md text-[13px] text-on-surface-variant flex items-center gap-1.5">
                        <Icon name="self_care" className="text-[14px] text-on-surface" />
                        香水：{fav.outfit.perfume.name}
                      </p>
                    )}
                  </div>
                  {loggingId === fav.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        aria-label="穿著日期"
                        value={logDate}
                        max={todayISO()}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-none px-3 py-1.5 text-sm focus:ring-0 focus:border-on-surface outline-none"
                      />
                      <button type="button" onClick={() => commitLogWear(fav)} className="text-primary" aria-label="確認記錄">
                        <Icon name="check" className="text-[20px]" />
                      </button>
                      <button type="button" onClick={() => setLoggingId(null)} className="text-on-surface-variant" aria-label="取消">
                        <Icon name="close" className="text-[20px]" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button"
                        onClick={() => onApply(fav)}
                        className="border border-on-surface text-on-surface py-2.5 kicker hover:bg-on-surface hover:text-background transition-colors"
                      >
                        載入預覽
                      </button>
                      <button type="button"
                        onClick={() => startLogWear(fav)}
                        className="border border-outline-variant text-on-surface-variant py-2.5 kicker hover:border-on-surface hover:text-on-surface transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        <Icon name="event_available" className="text-[16px]" /> 標記為穿過
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
