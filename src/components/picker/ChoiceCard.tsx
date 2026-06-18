"use client";

import { Icon } from "@/components/ui/Icon";

interface Props {
  onClick: () => void;
  title: string;
  subtitle?: string;
  /** Material symbol name. */
  icon?: string;
  iconClass?: string;
  active?: boolean;
  compact?: boolean;
}

export function ChoiceCard({ onClick, title, subtitle, icon, iconClass = "", active, compact }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${compact ? "p-5 gap-2" : "p-7 gap-3"} border bg-surface-bright hover:border-on-surface transition-colors duration-300 flex flex-col items-start text-left group ${
        active ? "gender-card-active border-2" : "border-outline-variant"
      }`}
    >
      {icon && (
        <Icon name={icon} className={`text-4xl text-on-surface transition-transform group-hover:scale-110 ${iconClass}`} />
      )}
      <span className="font-headline-md text-headline-md text-[20px] text-on-surface mt-1">{title}</span>
      {subtitle && <span className="font-body-md text-body-md text-[14px] text-on-surface-variant">{subtitle}</span>}
    </button>
  );
}
