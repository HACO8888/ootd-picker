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

export function ItemCard({
  item,
  onDelete,
  onEdit,
}: {
  item: Item;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
}) {
  const brand = item.brand || "自訂";
  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container mb-3 border border-outline-variant">
        <SmartImage src={item.imageUrl} alt={item.name} sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className={`absolute top-2 left-2 ${brandColor(brand)} kicker px-2 py-1 bg-background/90 border border-outline-variant`}>
          {brand}
        </div>
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="bg-background/90 p-2 border border-outline-variant hover:bg-on-surface hover:text-background transition-colors"
            title="編輯單品"
            aria-label={`編輯 ${item.name}`}
          >
            <Icon name="edit" className="text-[16px]" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="bg-background/90 p-2 border border-outline-variant hover:bg-error hover:text-white transition-colors"
            title="刪除單品"
            aria-label={`刪除 ${item.name}`}
          >
            <Icon name="delete" className="text-[16px]" />
          </button>
        </div>
      </div>
      <h4 className="font-headline-md text-headline-md text-[16px] leading-snug truncate">{item.name}</h4>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {item.seasons.map((s) => (
          <span key={s} className="kicker text-on-surface-variant border border-outline-variant px-1.5 py-0.5">
            {SEASON_LABEL[s]}
          </span>
        ))}
        <span className="kicker text-on-surface-variant border border-outline-variant px-1.5 py-0.5">
          {TRANSLATE.category[item.category]}
        </span>
      </div>
    </div>
  );
}
