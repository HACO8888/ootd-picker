import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function Footer() {
  return (
    <footer className="w-full py-16 px-container-padding-mobile md:px-container-padding-desktop flex flex-col items-center gap-6 bg-surface border-t border-outline-variant/10 mt-section-gap">
      <h2 className="font-headline-md text-headline-md text-primary">OOTD PICKER</h2>
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
        <Link className="text-on-surface-variant font-label-sm text-label-sm hover:text-secondary transition-colors uppercase tracking-widest" href="/">
          首頁
        </Link>
        <Link className="text-on-surface-variant font-label-sm text-label-sm hover:text-secondary transition-colors uppercase tracking-widest" href="/closet">
          我的衣櫥
        </Link>
        <Link className="text-on-surface-variant font-label-sm text-label-sm hover:text-secondary transition-colors uppercase tracking-widest" href="/about">
          關於
        </Link>
      </div>
      <p className="text-on-surface-variant font-body-md text-body-md text-center max-w-md opacity-60">
        © 2026 OOTD Picker. 為您的個人風格與妝容而策劃。
      </p>
      <div className="flex gap-4 mt-2">
        <span className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
          <Icon name="public" className="text-sm" />
        </span>
        <span className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
          <Icon name="mail" className="text-sm" />
        </span>
      </div>
    </footer>
  );
}
