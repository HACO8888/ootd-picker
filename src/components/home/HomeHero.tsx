"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";

/** Full-bleed magazine cover with cover lines set directly over the image. */
export function HomeHero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (bgRef.current) {
          bgRef.current.style.transform = `translateY(${y * 0.3}px) scale(${1 + y * 0.0002})`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative min-h-[88vh] flex items-end overflow-hidden border-b border-outline">
      <div ref={bgRef} className="absolute inset-0 z-0 scale-105 will-change-transform">
        <Image
          src="/images/home/hero.jpg"
          alt="穿著鼠尾草綠西裝外套的時尚編輯感造型"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_25%]"
        />
        {/* Bottom-up scrim so cover lines stay readable over any photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-16 md:pb-24">
        <span className="kicker text-white/80">THE DAILY EDIT</span>
        <h1 className="font-headline-xl text-headline-xl text-white mt-5 max-w-4xl">
          今天的風格與妝容，<br className="hidden md:block" />由今天決定。
        </h1>
        <p className="font-body-lg text-body-lg text-white/85 mt-6 max-w-xl">
          根據您的心情、天氣及目的地，提供個人化的每日穿搭、妝容與香氛策展建議。
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-8">
          <Link
            href="/picker"
            className="group inline-flex items-center gap-3 kicker text-white border-b border-white pb-2 hover:gap-5 transition-all"
          >
            START THE EDIT
            <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/closet"
            className="kicker text-white/80 border-b border-transparent hover:border-white/60 pb-2 transition-all"
          >
            瀏覽衣櫥
          </Link>
        </div>
      </div>
    </section>
  );
}
