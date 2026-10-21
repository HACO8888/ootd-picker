// Client IP for rate limiting, behind Cloudflare → Traefik → Next.
//
// Traefik (Dokploy default, no forwardedHeaders.trustedIPs) strips any incoming
// X-Forwarded-For and writes the address of whoever connected to it, so the
// entry it adds (TRUSTED_PROXY_HOPS from the right, default 1) is the direct
// peer: normally a Cloudflare edge, or the caller itself if it bypassed
// Cloudflare and hit the origin directly.
//
// Only when that peer is a Cloudflare edge do we trust CF-Connecting-IP (set by
// Cloudflare to the real visitor). A direct-to-origin caller could forge that
// header, so it is ignored for any other peer.
// Ranges: https://api.cloudflare.com/client/v4/ips (checked 2026-10-21).
// Not "server-only" so it can be exercised from a plain node/tsx script.

const CLOUDFLARE_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CLOUDFLARE_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

/** Parse an IPv4 or IPv6 address into [bits, value]; null when malformed. */
function parseIp(raw: string): [32 | 128, bigint] | null {
  let ip = raw.trim();
  if (ip.startsWith("::ffff:") && ip.includes(".")) ip = ip.slice(7); // IPv4-mapped
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length !== 4) return null;
    let v = BigInt(0);
    for (const p of parts) {
      const n = Number(p);
      if (!/^\d{1,3}$/.test(p) || n > 255) return null;
      v = (v << BigInt(8)) | BigInt(n);
    }
    return [32, v];
  }
  if (!/^[0-9a-f:]+$/i.test(ip) || ip.split("::").length > 2) return null;
  const [head, tail] = ip.includes("::") ? ip.split("::") : [ip, undefined];
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = tail === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill("0"), ...t];
  if (groups.length !== 8 || groups.some((g) => g.length === 0 || g.length > 4)) return null;
  let v = BigInt(0);
  for (const g of groups) v = (v << BigInt(16)) | BigInt(parseInt(g, 16));
  return [128, v];
}

const RANGES = [...CLOUDFLARE_V4, ...CLOUDFLARE_V6].map((cidr) => {
  const [addr, len] = cidr.split("/");
  const [bits, base] = parseIp(addr)!;
  const shift = BigInt(bits - Number(len));
  return { bits, shift, prefix: base >> shift };
});

export function isCloudflareIp(ip: string): boolean {
  const parsed = parseIp(ip);
  if (!parsed) return false;
  const [bits, v] = parsed;
  return RANGES.some((r) => r.bits === bits && v >> r.shift === r.prefix);
}

const trustedHops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);

/** Best-effort visitor IP (max 64 chars) for keying the rate limiter. */
export function clientIp(req: Request): string {
  const chain = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const peer = chain[chain.length - trustedHops] ?? chain[0] ?? req.headers.get("x-real-ip") ?? "local";
  const visitor = req.headers.get("cf-connecting-ip")?.trim();
  const ip = visitor && isCloudflareIp(peer) && parseIp(visitor) ? visitor : peer;
  return ip.slice(0, 64);
}
