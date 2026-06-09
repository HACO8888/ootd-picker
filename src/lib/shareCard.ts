// Renders an outfit into a magazine-style share card on an off-screen canvas.
// Zero dependencies: all imagery is same-origin (so the canvas never taints),
// the template is hand-drawn for full editorial control, and fonts are the same
// next/font families the page already uses (read from CSS variables).
import { TRANSLATE } from "./data";
import type { Outfit } from "./types";

const W = 1080;
const H = 1350;
const PAD = 80;

const COLORS = {
  bg: "#faf9f6",
  ink: "#1f1d1b",
  muted: "#7a766f",
  line: "#d8d4cc",
  tile: "#efece6",
  accent: "#9a4d3f",
};

/** Strip the trailing emoji from a TRANSLATE label ("晴天 ☀️" → "晴天"). */
function clean(label: string): string {
  return label.split(" ")[0];
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // broken blob/data → placeholder
    img.src = src;
  });
}

/** Draw an image cropped to cover the target rect (object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > r) {
    sw = img.height * r;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / r;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Render the outfit to a PNG Blob. Resolves to null if the canvas is unsupported. */
export async function renderOutfitCard(outfit: Outfit): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Resolve the page's actual font families from the next/font CSS variables.
  const root = getComputedStyle(document.documentElement);
  const serif = root.getPropertyValue("--font-playfair").trim() || "Georgia, serif";
  const sans = root.getPropertyValue("--font-dm-sans").trim() || "system-ui, sans-serif";
  try {
    await document.fonts.ready;
  } catch {
    /* fonts API unavailable — fall back to whatever is loaded */
  }

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // Masthead
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 22px ${sans}`;
  ctx.fillText("ISSUE Nº06 — 2026", W / 2, PAD + 8);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `600 72px ${serif}`;
  ctx.fillText("OOTD PICKER", W / 2, PAD + 78);

  // Context line
  const tags = [
    clean(TRANSLATE.gender[outfit.context.gender] ?? ""),
    clean(TRANSLATE.weather[outfit.context.weather] ?? ""),
    clean(TRANSLATE.mood[outfit.context.mood] ?? outfit.context.mood),
    clean(TRANSLATE.destination[outfit.context.destination] ?? outfit.context.destination),
  ].filter(Boolean);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `600 24px ${sans}`;
  ctx.fillText(tags.join("   ·   "), W / 2, PAD + 130);

  // Divider
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + 168);
  ctx.lineTo(W - PAD, PAD + 168);
  ctx.stroke();

  // Garment grid (2 columns) — only filled slots
  const slots = [
    { item: outfit.top, label: "上衣" },
    { item: outfit.bottom, label: "下著" },
    { item: outfit.outerwear, label: "外套" },
    { item: outfit.accessory, label: "配件" },
  ].filter((s) => s.item);

  const gridTop = PAD + 210;
  const gap = 36;
  const colW = (W - PAD * 2 - gap) / 2;
  const imgH = 300;
  const cellH = imgH + 64;

  const images = await Promise.all(slots.map((s) => loadImage(s.item!.imageUrl)));

  slots.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * (colW + gap);
    const y = gridTop + row * (cellH + gap);

    // Tile background + border
    ctx.fillStyle = COLORS.tile;
    ctx.fillRect(x, y, colW, imgH);
    const img = images[i];
    if (img) drawCover(ctx, img, x, y, colW, imgH);
    ctx.strokeStyle = COLORS.line;
    ctx.strokeRect(x, y, colW, imgH);

    // Caption
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 18px ${sans}`;
    ctx.fillText(s.label, x, y + imgH + 30);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `400 24px ${sans}`;
    const name = s.item!.name;
    const maxName = name.length > 16 ? name.slice(0, 15) + "…" : name;
    ctx.fillText(maxName, x, y + imgH + 56);
  });

  // Footer block — makeup, perfume, harmony
  const rows = Math.ceil(slots.length / 2);
  let fy = gridTop + rows * (cellH + gap) + 10;

  ctx.strokeStyle = COLORS.line;
  ctx.beginPath();
  ctx.moveTo(PAD, fy);
  ctx.lineTo(W - PAD, fy);
  ctx.stroke();
  fy += 48;

  ctx.textAlign = "left";
  // Makeup with swatches
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 18px ${sans}`;
  ctx.fillText("妝容", PAD, fy - 24);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `400 28px ${serif}`;
  ctx.fillText(outfit.makeup.name, PAD, fy + 6);
  (outfit.makeup.colors ?? []).slice(0, 3).forEach((hex, i) => {
    ctx.fillStyle = hex;
    ctx.fillRect(W - PAD - 36 - i * 44, fy - 26, 36, 36);
    ctx.strokeStyle = COLORS.line;
    ctx.strokeRect(W - PAD - 36 - i * 44, fy - 26, 36, 36);
  });
  fy += 64;

  // Perfume
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 18px ${sans}`;
  ctx.fillText("香水", PAD, fy - 24);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `400 28px ${serif}`;
  ctx.fillText(`${outfit.perfume.name} · ${outfit.perfume.style}`.slice(0, 26), PAD, fy + 6);
  fy += 64;

  // Harmony badge
  if (outfit.harmony) {
    ctx.fillStyle = COLORS.accent;
    ctx.font = `600 22px ${sans}`;
    ctx.fillText(`配色${outfit.harmony.label} · ${outfit.harmony.score}`, PAD, fy);
  }

  // Footer tagline
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 18px ${sans}`;
  ctx.fillText("由 OOTD PICKER 生成 · 每日穿搭 · 妝容 · 香氛", W / 2, H - 48);

  return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
