import type { Item } from "@/lib/types";
import type { Gap } from "@/lib/insights";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";

const SEVERITY: Record<Gap["severity"], { label: string; cls: string }> = {
  high: { label: "建議優先", cls: "text-error border-error" },
  medium: { label: "可以補強", cls: "text-primary border-primary" },
  low: { label: "選擇偏少", cls: "text-on-surface-variant border-outline-variant" },
};

export function GapCard({
  gap,
  suggestions,
  relaxed,
}: {
  gap: Gap;
  suggestions: Item[];
  relaxed: boolean;
}) {
  const sev = SEVERITY[gap.severity];
  return (
    <div className="border border-outline-variant bg-surface-bright p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-headline-md text-headline-md text-[17px] text-on-surface">{gap.title}</h4>
          <p className="font-body-md text-body-md text-[13px] text-on-surface-variant mt-1">{gap.message}</p>
        </div>
        <span className={`kicker shrink-0 border px-2 py-1 ${sev.cls}`}>{sev.label}</span>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          <p className="kicker text-on-surface-variant flex items-center gap-1.5">
            <Icon name="storefront" className="text-[14px]" />
            從目錄補齊{relaxed && "（相關單品有限，已放寬條件）"}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {suggestions.map((item) => (
              <div key={item.id} className="w-20 shrink-0">
                <div className="w-20 h-24 overflow-hidden bg-surface-container relative border border-outline-variant">
                  <SmartImage src={item.imageUrl} alt={item.name} sizes="80px" className="object-cover" />
                </div>
                <p className="font-body-md text-body-md text-[11px] text-on-surface-variant mt-1 line-clamp-2 leading-tight">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="kicker text-on-surface-variant">目錄中暫無相關單品可推薦</p>
      )}
    </div>
  );
}
