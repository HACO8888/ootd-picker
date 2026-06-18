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

/** Practical upper bound on a shareable URL across clients. */
const MAX_SHARE_URL = 1800;

export function ShareSheet({ outfit, onClose, onToast }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [manualLink, setManualLink] = useState<string | null>(null);

  // Safe to derive during render: this branch only renders client-side, after
  // the user opens the sheet (outfit is null during SSR/first paint).
  const supportsShare = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  useEffect(() => {
    if (!outfit) return;
    let active = true;
    let objUrl: string | null = null;
    renderOutfitCard(outfit)
      .then((b) => {
        if (!active) return;
        setLoading(false);
        if (!b) {
          setFailed(true);
          onToast("產生分享卡片失敗");
          return;
        }
        setBlob(b);
        objUrl = URL.createObjectURL(b);
        setUrl(objUrl);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setFailed(true);
        onToast("產生分享卡片失敗");
      });
    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [outfit, onToast, retryKey]);

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
    if (link.length > MAX_SHARE_URL) {
      onToast("分享連結過長，請改用下載圖片分享");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        onToast("已複製分享連結！");
        return;
      }
      throw new Error("clipboard unavailable");
    } catch {
      // 非安全脈絡 / 舊瀏覽器無 clipboard：顯示可手動選取複製的網址。
      setManualLink(link);
      onToast("無法自動複製，請手動複製下方網址");
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
          {loading ? (
            <span className="kicker text-on-surface-variant">產生卡片中…</span>
          ) : failed || !url ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <Icon name="broken_image" className="text-4xl text-outline" />
              <span className="kicker text-on-surface-variant">卡片產生失敗</span>
              <button
                type="button"
                onClick={() => {
                  setUrl(null);
                  setBlob(null);
                  setLoading(true);
                  setFailed(false);
                  setRetryKey((k) => k + 1);
                }}
                className="inline-flex items-center gap-2 border border-on-surface text-on-surface px-5 py-2.5 kicker hover:bg-on-surface hover:text-background transition-colors"
              >
                <Icon name="refresh" className="text-[16px]" /> 重試
              </button>
            </div>
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

        {manualLink && (
          <input
            readOnly
            value={manualLink}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="分享連結（請手動複製）"
            className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 text-[12px] text-on-surface font-mono outline-none focus:border-on-surface"
          />
        )}
      </div>
    </div>
  );
}
