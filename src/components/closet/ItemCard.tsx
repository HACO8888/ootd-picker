"use client";

import { TRANSLATE } from "@/lib/data";
import type { Item, Season } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";

const SEASON_LABEL: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

function brandColor(brand: string): string {
  if (brand === "UNIQLO") return "text-[#E60012]";
  if (brand === "NET") return "text-[#006AB7]";
  if (brand === "GU") return "text-[#E65000]";
  return "text-primary";
}

export function ItemCard({ item, onDelete }: { item: Item; onDelete: (id: string) => void }) {
  const brand = item.brand || "自訂";
  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-container mb-4 shadow-[0px_10px_30px_rgba(135,152,106,0.08)] transition-all duration-500 group-hover:shadow-[0px_15px_40px_rgba(135,152,106,0.15)] group-hover:-translate-y-1">
        <SmartImage src={item.imageUrl} alt={item.name} sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className={`absolute top-3 left-3 ${brandColor(brand)} text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/80 border border-white/40 shadow-sm`}>
          {brand}
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-3 right-3 bg-surface/90 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-error hover:text-white"
          title="刪除單品"
          aria-label={`刪除 ${item.name}`}
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>
      <h4 className="font-headline-md text-headline-md text-[17px] leading-snug">{item.name}</h4>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {item.seasons.map((s) => (
          <span key={s} className="text-label-sm font-label-sm text-on-tertiary-container bg-tertiary-container/30 px-2 py-0.5 rounded">
            {SEASON_LABEL[s]}季
          </span>
        ))}
        <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">
          {item.colors.join("/")}
        </span>
        <span className="text-label-sm font-label-sm text-secondary bg-secondary-fixed/30 px-2 py-0.5 rounded">
          {TRANSLATE.category[item.category]}
        </span>
      </div>
    </div>
  );
}
