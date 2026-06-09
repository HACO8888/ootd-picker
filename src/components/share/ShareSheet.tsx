"use client";

import { useEffect, useState } from "react";
import { renderOutfitCard } from "@/lib/shareCard";
import { encodeShareParams } from "@/lib/shareLink";
import type { Outfit } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

interface Props {
  outfit: Outfit | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function ShareSheet({ outfit, onClose, onToast }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);

  // Safe to derive during render: this branch only renders client-side, after
  // the user opens the sheet (outfit is null during SSR/first paint).
  const supportsShare = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  useEffect(() => {
    if (!outfit) return;
    let active = true;
    let objUrl: string | null = null;
    renderOutfitCard(outfit).then((b) => {
      if (!active) return;
      setLoading(false);
      if (!b) {
        onToast("產生分享卡片失敗");
        return;
      }
      setBlob(b);
      objUrl = URL.createObjectURL(b);
      setUrl(objUrl);
    });
    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [outfit, onToast]);

  if (!outfit) return null;

  const download = () => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "ootd-card.png";
    a.click();
    URL.revokeObjectURL(u);
    onToast("已下載分享卡片！");
  };

  const copyLink = async () => {
    const link = `${location.origin}/share?${encodeShareParams(outfit)}`;
    try {
      await navigator.clipboard.writeText(link);
      onToast("已複製分享連結！");
    } catch {
      onToast("複製失敗，請手動複製網址");
    }
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], "ootd-card.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "我的今日穿搭", text: "用 OOTD PICKER 生成的今日風格企劃" });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      onToast("此裝置不支援直接分享，請改用下載");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/60" onClick={onClose} />
      <div className="relative bg-surface-bright border border-outline shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6 flex flex-col gap-5 animate-fade-in">
        <div className="flex justify-between items-end border-b border-outline pb-3">
          <div>
            <Kicker className="text-primary">SHARE</Kicker>
            <h2 className="font-headline-md text-headline-md text-on-surface mt-1">分享你的穿搭</h2>
          </div>
          <button type="button" className="text-on-surface-variant hover:text-primary p-1" onClick={onClose} aria-label="關閉">
            <Icon name="close" />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-surface-container border border-outline-variant aspect-[1080/1350] flex items-center justify-center overflow-hidden">
          {loading || !url ? (
            <span className="kicker text-on-surface-variant">產生卡片中…</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="穿搭分享卡片預覽" className="w-full h-full object-contain" />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={download}
            disabled={!blob}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-on-surface text-on-surface px-5 py-3 kicker hover:bg-on-surface hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="download" className="text-[18px]" /> 下載圖片
          </button>
          {supportsShare && (
            <button
              type="button"
              onClick={share}
              disabled={!blob}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 kicker hover:bg-surface-tint transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="ios_share" className="text-[18px]" /> 分享
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 kicker text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="link" className="text-[16px]" /> 複製分享連結
        </button>
      </div>
    </div>
  );
}
