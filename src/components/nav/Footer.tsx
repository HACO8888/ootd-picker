import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/", label: "首頁" },
  { href: "/picker", label: "開始搭配" },
  { href: "/closet", label: "我的衣櫥" },
  { href: "/about", label: "關於" },
];

export function Footer() {
  return (
    <footer className="w-full mt-section-gap border-t border-outline">
      <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div className="flex flex-col gap-3">
            <span className="kicker text-on-surface-variant">ISSUE Nº06 — 2026</span>
            <h2 className="font-headline-lg text-headline-lg text-primary">OOTD PICKER</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              為您的個人風格、妝容與香氛而策劃的每日穿搭刊物。
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="kicker text-on-surface-variant hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <hr className="editorial-rule my-10" />

        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-6">
          <p className="kicker text-on-surface-variant">© 2026 OOTD PICKER. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-3">
            <span className="w-10 h-10 border border-outline flex items-center justify-center hover:bg-on-surface hover:text-background transition-colors cursor-pointer">
              <Icon name="public" className="text-[18px]" />
            </span>
            <span className="w-10 h-10 border border-outline flex items-center justify-center hover:bg-on-surface hover:text-background transition-colors cursor-pointer">
              <Icon name="mail" className="text-[18px]" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
