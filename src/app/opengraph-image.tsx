import { OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = "OOTD PICKER — 風格與妝容嚮導";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage();
}
