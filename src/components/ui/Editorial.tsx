import type { ReactNode } from "react";

/**
 * Editorial primitives — the shared vocabulary of the magazine layout.
 * Kicker (eyebrow), IndexNumber (oversized serif numeral), SectionRule
 * (hairline), and EditorialHeading (kicker + serif headline + optional lead).
 */

/** Uppercase, wide-tracked eyebrow label. */
export function Kicker({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "div";
}) {
  return <Tag className={`kicker text-on-surface-variant ${className}`}>{children}</Tag>;
}

/** Oversized serif numeral used as an editorial index marker (01 / 02 …). */
export function IndexNumber({
  value,
  className = "",
}: {
  value: number | string;
  className?: string;
}) {
  const label = typeof value === "number" ? String(value).padStart(2, "0") : value;
  return (
    <span
      aria-hidden="true"
      className={`font-headline-xl text-headline-xl leading-none text-on-surface ${className}`}
    >
      {label}
    </span>
  );
}

/** 1px hairline rule — the structural backbone of the layout. */
export function SectionRule({ className = "" }: { className?: string }) {
  return <hr className={`editorial-rule ${className}`} />;
}

/** Kicker + serif headline + optional lead paragraph, for page/section heads. */
export function EditorialHeading({
  kicker,
  title,
  lead,
  align = "left",
  className = "",
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <div className={`flex flex-col gap-4 ${alignClass} ${className}`}>
      {kicker && <Kicker className="text-primary">{kicker}</Kicker>}
      <h2 className="font-headline-lg text-headline-lg text-on-surface">{title}</h2>
      {lead && (
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[680px]">{lead}</p>
      )}
    </div>
  );
}
