"use client";

import { Icon } from "@/components/ui/Icon";

interface Props {
  onClick: () => void;
  title: string;
  subtitle?: string;
  /** Material symbol name. */
  icon?: string;
  iconClass?: string;
  /** Emoji alternative to a material icon. */
  emoji?: string;
  active?: boolean;
  compact?: boolean;
}

export function ChoiceCard({ onClick, title, subtitle, icon, iconClass = "", emoji, active, compact }: Props) {
  return (
    <button type="button"
      onClick={onClick}
      className={`${compact ? "p-6 gap-3" : "p-8 gap-4"} rounded-xl border bg-white shadow-[0px_10px_35px_rgba(135,152,106,0.04)] hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col items-center group ${
        active ? "gender-card-active border-2" : "border-outline-variant/30"
      }`}
    >
      {emoji ? (
        <span className="text-5xl">{emoji}</span>
      ) : (
        icon && <Icon name={icon} className={`text-4xl group-hover:scale-110 transition-transform ${iconClass}`} />
      )}
      <span className="font-headline-md text-headline-md text-[18px] text-center">{title}</span>
      {subtitle && <span className="text-xs text-on-surface-variant text-center">{subtitle}</span>}
    </button>
  );
}
