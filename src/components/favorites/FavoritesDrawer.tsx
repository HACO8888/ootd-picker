"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { TRANSLATE } from "@/lib/data";
import type { Favorite } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (fav: Favorite) => void;
  onToast: (msg: string) => void;
}

export function FavoritesDrawer({ open, onClose, onApply, onToast }: Props) {
  const { favorites, deleteFav } = useFavorites();

  if (!open) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("確定要刪除此收藏組合嗎？")) {
      deleteFav(id);
      onToast("已刪除收藏！");
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[450px] max-w-full bg-surface shadow-2xl p-8 flex flex-col gap-6 animate-slide-left overflow-y-auto">
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
          <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <Icon name="favorite" /> 我的風格收藏
          </h2>
          <button className="text-on-surface-variant hover:text-primary" onClick={onClose} aria-label="關閉收藏">
            <Icon name="close" />
          </button>
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
                  <button
                    onClick={(e) => handleDelete(e, fav.id)}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title="刪除收藏"
                    aria-label="刪除收藏"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-mono">
                      {fav.date}
                    </span>
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
                  <button
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
