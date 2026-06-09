import { COLOR_HEX } from "@/lib/data";

const FALLBACK = "#cbcbc6";

/** Colour distribution as swatches; collapses the long tail into "其他". */
export function ColorSwatchRow({
  rows,
  max = 8,
}: {
  rows: { color: string; count: number }[];
  max?: number;
}) {
  const top = rows.slice(0, max);
  const restCount = rows.slice(max).reduce((n, r) => n + r.count, 0);

  return (
    <div className="flex flex-wrap gap-3">
      {top.map((r) => (
        <div key={r.color} className="flex items-center gap-2">
          <span
            className="w-5 h-5 border border-outline-variant shrink-0"
            style={{ backgroundColor: COLOR_HEX[r.color] ?? FALLBACK }}
            aria-hidden="true"
          />
          <span className="font-body-md text-body-md text-[13px] text-on-surface">
            {r.color} <span className="text-on-surface-variant tabular-nums">×{r.count}</span>
          </span>
        </div>
      ))}
      {restCount > 0 && (
        <span className="font-body-md text-body-md text-[13px] text-on-surface-variant self-center">
          其他 {rows.length - max} 色 ×{restCount}
        </span>
      )}
    </div>
  );
}
