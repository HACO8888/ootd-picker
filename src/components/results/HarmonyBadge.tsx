import type { HarmonyResult } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

const STYLE: Record<HarmonyResult["verdict"], { cls: string; icon: string }> = {
  harmonious: { cls: "text-primary border-primary", icon: "palette" },
  caution: { cls: "text-[#b8860b] border-[#b8860b]", icon: "contrast" },
  clash: { cls: "text-error border-error", icon: "warning" },
};

/** Compact colour-harmony verdict badge. */
export function HarmonyBadge({ harmony }: { harmony: HarmonyResult }) {
  const s = STYLE[harmony.verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 kicker ${s.cls}`}>
      <Icon name={s.icon} className="text-[14px]" />
      配色{harmony.label} · {harmony.score}
    </span>
  );
}
