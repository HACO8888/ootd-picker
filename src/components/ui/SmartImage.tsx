import Image from "next/image";

/**
 * Renders a next/image for static paths, but falls back to a plain <img> for
 * user-uploaded data: URLs (which next/image cannot optimize).
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
  const isData = src.startsWith("data:") || src.startsWith("blob:");
  if (isData) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes ?? "200px"} className={className} />;
}
