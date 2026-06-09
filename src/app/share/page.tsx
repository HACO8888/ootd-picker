"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { TRANSLATE } from "@/lib/data";
import { decodeShareParams } from "@/lib/shareLink";
import type { Outfit } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";
import { SmartImage } from "@/components/ui/SmartImage";
import { HarmonyBadge } from "@/components/results/HarmonyBadge";
import { ReasonsPanel } from "@/components/results/ReasonsPanel";

type SlotKey = "top" | "bottom" | "outerwear" | "accessory";
const SLOTS: SlotKey[] = ["top", "bottom", "outerwear", "accessory"];

function GarmentRow({ outfit }: { outfit: Outfit }) {
  return (
    <div className="border-t border-outline-variant">
      {SLOTS.map((slot) => {
        const item = outfit[slot];
        if (!item) return null;
        return (
          <div key={slot} className="flex items-center gap-5 py-4 border-b border-outline-variant">
            <div className="w-16 h-20 overflow-hidden flex-shrink-0 bg-surface-container relative border border-outline-variant">
              <SmartImage src={item.imageUrl} alt={item.name} sizes="64px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="kicker text-on-surface-variant">{TRANSLATE.category[item.category]}</span>
              <h4 className="font-headline-md text-headline-md text-[18px] leading-snug text-on-surface mt-1 truncate">{item.name}</h4>
              <span className="font-body-md text-body-md text-[13px] text-on-surface-variant">{item.colors.join(" / ")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShareContent() {
  const params = useSearchParams();
  const { addFav } = useFavorites();
  const { showToast } = useChrome();
  const [saved, setSaved] = useState(false);

  const decoded = useMemo(() => decodeShareParams(params), [params]);

  if (!decoded) {
    return (
      <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-24 text-center space-y-5">
        <Icon name="link_off" className="text-6xl text-outline-variant" />
        <h1 className="font-headline-xl text-headline-xl text-[36px] text-on-surface">這個分享連結無法開啟</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">連結可能不完整或已失效。</p>
        <Link href="/picker" className="inline-flex bg-primary text-on-primary px-6 py-3 kicker hover:bg-surface-tint transition-colors">
          開始我的穿搭
        </Link>
      </div>
    );
  }

  const { outfit, missing } = decoded;
  const save = () => {
    if (saved) return;
    addFav(outfit, "來自分享");
    setSaved(true);
    showToast("已收藏這套穿搭！");
  };

  return (
    <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12 md:py-16 flex flex-col gap-8">
      <div className="border-b border-outline pb-8 space-y-4">
        <Kicker className="text-primary">SHARED LOOK</Kicker>
        <h1 className="font-headline-xl text-headline-xl text-[40px] md:text-[52px] text-on-surface">一套分享給你的穿搭</h1>
        <div className="flex flex-wrap gap-2">
          {[TRANSLATE.gender[outfit.context.gender], TRANSLATE.weather[outfit.context.weather], TRANSLATE.mood[outfit.context.mood], TRANSLATE.destination[outfit.context.destination]]
            .filter(Boolean)
            .map((label) => (
              <span key={label} className="kicker text-on-surface-variant border border-outline-variant px-3 py-1">{label}</span>
            ))}
        </div>
      </div>

      {missing && (
        <div className="flex items-start gap-3 border border-outline-variant bg-surface-container-low px-5 py-4">
          <Icon name="info" className="text-[20px] text-primary flex-shrink-0 mt-0.5" />
          <p className="font-body-md text-body-md text-[14px] text-on-surface-variant">部分單品來自分享者的私人衣櫥，無法在此顯示。</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 border border-outline-variant bg-surface-bright">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between gap-3">
            <div>
              <Kicker className="text-primary">THE LOOK</Kicker>
              <h3 className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">穿搭單品</h3>
            </div>
            {outfit.harmony && <HarmonyBadge harmony={outfit.harmony} />}
          </div>
          <div className="px-6 pb-6 space-y-5">
            <GarmentRow outfit={outfit} />
            {outfit.reasons && outfit.reasons.length > 0 && <ReasonsPanel reasons={outfit.reasons} />}
          </div>
        </div>

        <div className="lg:col-span-5 border border-outline-variant bg-surface-bright p-6 space-y-4">
          <div>
            <Kicker className="text-primary">THE FACE</Kicker>
            <p className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">{outfit.makeup.name}</p>
            <div className="flex gap-1.5 mt-2">
              {outfit.makeup.colors.map((hex) => (
                <span key={hex} className="w-6 h-6 border border-outline-variant" style={{ backgroundColor: hex }} aria-hidden="true" />
              ))}
            </div>
          </div>
          <div className="border-t border-outline-variant pt-4">
            <Kicker className="text-primary">THE SCENT</Kicker>
            <p className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">{outfit.perfume.name}</p>
            <p className="font-body-md text-body-md text-[13px] text-on-surface-variant mt-1">{outfit.perfume.style}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saved}
          className={saved
            ? "inline-flex items-center gap-2 border border-outline-variant text-on-surface-variant px-6 py-3 kicker cursor-not-allowed"
            : "inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 kicker hover:bg-surface-tint transition-colors"}
        >
          <Icon name={saved ? "task_alt" : "favorite"} className="text-[18px]" /> {saved ? "已收藏" : "收藏這套"}
        </button>
        <Link href="/picker" className="inline-flex items-center gap-2 border border-on-surface text-on-surface px-6 py-3 kicker hover:bg-on-surface hover:text-background transition-colors">
          <Icon name="auto_awesome" className="text-[18px]" /> 生成我自己的
        </Link>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-24 text-center kicker text-on-surface-variant">載入中…</div>}>
      <ShareContent />
    </Suspense>
  );
}
