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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes ?? "200px"} className={className} />;
}
