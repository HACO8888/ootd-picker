"use client";

const STEPS = [
  { n: 1, label: "性別" },
  { n: 2, label: "今日天氣" },
  { n: 3, label: "目前心情" },
  { n: 4, label: "出門目的" },
];

/** `current` is the active step number (1-4). `progress` is the bar width %. */
export function Stepper({ current, progress }: { current: number; progress: number }) {
  return (
    <div className="max-w-2xl mx-auto mb-16 flex items-center justify-between relative px-4">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-outline-variant/30 w-full z-0" />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0"
        style={{ width: `${progress}%` }}
      />
      {STEPS.map((s) => {
        const active = s.n <= current;
        return (
          <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={
                active
                  ? "w-10 h-10 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center border-2 border-primary shadow transition-all duration-300"
                  : "w-10 h-10 rounded-full bg-surface border-2 border-outline-variant text-on-surface-variant font-bold flex items-center justify-center shadow transition-all duration-300"
              }
            >
              {s.n}
            </div>
            <span
              className={`font-label-sm text-label-sm whitespace-nowrap ${active ? "text-primary" : "text-on-surface-variant"}`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
