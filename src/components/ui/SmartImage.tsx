import Image from "next/image";

const CATEGORY_ICON: Record<string, string> = {
  tops: "checkroom",
  bottoms: "bottom_panel_open",
  outerwear: "layers",
  accessories: "shopping_bag",
};

/** Relative luminance of a #rrggbb colour (0 dark – 1 light). */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A colour-accurate generated thumbnail for catalog items (no photo needed). */
function Swatch({ spec }: { spec: string }) {
  // spec = "swatch:<hex>:<category>"
  const [, hex = "#888888", category = "tops"] = spec.split(":");
  const angle = hashStr(spec) % 360;
  const light = luminance(hex) > 0.6;
  const fg = light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.8)";
  const icon = CATEGORY_ICON[category] ?? "checkroom";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(${angle}deg, ${hex}, ${hex}cc 60%, ${hex}99)` }}
      aria-hidden="true"
    >
      <span className="material-symbols-outlined" style={{ color: fg, fontSize: "2.75rem", lineHeight: 1 }}>
        {icon}
      </span>
    </div>
  );
}

/**
 * Renders the right thumbnail for an item:
 * - `swatch:…` → a generated colour swatch (catalog items)
 * - data:/blob: → a plain <img> (user uploads, which next/image can't optimise)
 * - otherwise → an optimised next/image
 */
export function SmartImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (src.startsWith("swatch:")) {
    return <Swatch spec={src} />;
  }
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes ?? "200px"} className={className} />;
}
