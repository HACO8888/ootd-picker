"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

/** Hero with a subtle scroll-driven parallax on the background image. */
export function HomeHero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (bgRef.current) {
          bgRef.current.style.transform = `translateY(${y * 0.4}px) scale(${1 + y * 0.0002})`;
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
    <section className="relative min-h-[80vh] md:min-h-[921px] flex items-center pt-24 overflow-hidden">
      <div ref={bgRef} className="absolute inset-0 z-0 scale-105 will-change-transform">
        <Image
          src="/images/home/hero.jpg"
          alt="穿著鼠尾草綠西裝外套的時尚編輯感造型"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] brightness-95"
        />
      </div>
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop flex flex-col items-start gap-6">
        <div className="glass-card p-8 rounded-lg max-w-2xl border border-white/20">
          <h1 className="font-headline-xl text-headline-xl text-on-surface max-w-xl">
            今天的風格與妝容，由今天決定。
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-lg">
            根據您的心情、天氣及目的地，提供個人化的每日穿搭與妝容策展建議。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/picker"
              className="bg-primary text-on-primary px-10 py-5 rounded-full font-label-md text-label-md uppercase tracking-widest hover:bg-surface-tint shadow-lg transition-all duration-300 text-center"
            >
              開始挑選
            </Link>
            <Link
              href="/closet"
              className="border border-primary text-primary px-10 py-5 rounded-full font-label-md text-label-md uppercase tracking-widest hover:bg-primary/5 transition-all duration-300 text-center"
            >
              查看衣櫥
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
