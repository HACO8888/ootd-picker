import type { CSSProperties } from "react";

/** Thin wrapper over Material Symbols Outlined (loaded via <link> in layout). */
export function Icon({
  name,
  className = "",
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={style} aria-hidden="true">
      {name}
    </span>
  );
}
