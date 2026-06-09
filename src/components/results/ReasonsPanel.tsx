import type { Reason } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

const ICON: Record<Reason["kind"], string> = {
  weather: "wb_sunny",
  season: "eco",
  outerwear: "checkroom",
  destination: "place",
  mood: "mood",
  color: "palette",
};

/** "Why this look" — a short, grouped list of recommendation reasons. */
export function ReasonsPanel({ reasons }: { reasons: Reason[] }) {
  if (!reasons.length) return null;
  return (
    <div className="border border-outline-variant bg-surface-container-low px-6 py-5">
      <p className="kicker text-primary mb-3">為什麼推這套</p>
      <ul className="space-y-2">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5 font-body-md text-body-md text-[14px] text-on-surface-variant">
            <Icon name={ICON[r.kind]} className="text-[16px] text-on-surface mt-0.5 shrink-0" />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
