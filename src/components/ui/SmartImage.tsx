import Image from "next/image";

/**
 * Renders the right thumbnail for an item:
 * - data:/blob: → a plain <img> (user uploads, which next/image can't optimise)
 * - otherwise → an optimised next/image (catalog items use real product photos)
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
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    // next/image can't optimise data:/blob: URLs, so emit a plain <img>. Mirror
    // the next/image `fill` branch below (absolute inset-0 + full size) so the
    // image cover-fills its `relative` wrapper instead of rendering at its
    // intrinsic size and overflowing.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full ${className ?? ""}`}
      />
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes ?? "200px"} className={className} />;
}
