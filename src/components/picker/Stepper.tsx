"use client";

const STEPS = [
  { n: 1, label: "性別" },
  { n: 2, label: "今日天氣" },
  { n: 3, label: "目前心情" },
  { n: 4, label: "出門目的" },
];

/** `current` is the active step number (1-4). `progress` is the bar width %. */
export function Stepper({ current, progress }: { current: number; progress: number }) {
  const active = STEPS.find((s) => s.n === current);
  return (
    <div className="max-w-content mx-auto mb-12 md:mb-16">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-headline-md text-headline-md text-on-surface">
          <span className="text-primary">{String(current).padStart(2, "0")}</span>
          <span className="text-on-surface-variant"> / 04</span>
        </span>
        <span className="kicker text-on-surface-variant">{active?.label}</span>
      </div>
      <div className="relative h-px w-full bg-outline-variant">
        <div
          className="absolute left-0 top-0 h-px bg-primary transition-all duration-500"
          style={{ width: `${Math.max(progress, 4)}%` }}
        />
      </div>
    </div>
  );
}
