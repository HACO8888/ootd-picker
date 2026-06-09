// Horizontal proportion bars — pure CSS, no chart dependency.
export function StatBar({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-14 shrink-0 font-body-md text-body-md text-[13px] text-on-surface-variant truncate">
            {r.label}
          </span>
          <div className="flex-1 h-2 bg-surface-container relative">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-500"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
          <span className="w-7 text-right font-body-md text-body-md text-[13px] text-on-surface tabular-nums">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}
