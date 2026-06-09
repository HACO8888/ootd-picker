import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";
import { Kicker, SectionRule } from "@/components/ui/Editorial";

export const metadata: Metadata = {
  title: "找不到頁面 — 404",
  description: "您尋找的頁面已下架或從未存在。回到首頁，重新策劃今日的穿搭與妝容。",
  robots: { index: false, follow: false },
};

const DESTINATIONS = [
  {
    no: "01",
    href: "/picker",
    title: "THE PICKER",
    sub: "穿搭嚮導",
    body: "回答四個問題，換得一套今日專屬的穿搭、妝容與香氛提案。",
  },
  {
    no: "02",
    href: "/closet",
    title: "THE WARDROBE",
    sub: "我的衣櫥",
    body: "策展逾三千件單品，依類別、季節、色系與場合自由篩選。",
  },
  {
    no: "03",
    href: "/about",
    title: "THE PHILOSOPHY",
    sub: "品牌理念",
    body: "妝造合一，讓風格隨心情與氣候自在應變。",
  },
];

export default function NotFound() {
  return (
    <>
      <section className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-section-gap">
        <div className="flex items-baseline justify-between mb-12">
          <Kicker className="text-primary">頁面遺失</Kicker>
          <Kicker className="text-on-surface-variant">ERROR 404</Kicker>
        </div>
        <SectionRule />

        {/* Oversized editorial 404 numeral + lead */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center py-16 md:py-24">
          <div className="md:col-span-6">
            <span
              aria-hidden="true"
              className="font-headline-xl text-headline-xl text-primary leading-none block"
            >
              404
            </span>
          </div>
          <div className="md:col-span-6 flex flex-col gap-6">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              這一頁，似乎不在本期刊物中。
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[520px]">
              您尋找的版面或許已下架、改名，或從未存在。別擔心——讓我們帶您回到精彩的內容。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="group inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-4 kicker hover:bg-surface-tint transition-colors"
              >
                返回首頁
                <Icon
                  name="arrow_forward"
                  className="text-[18px] transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/picker"
                className="group inline-flex items-center gap-3 border border-outline text-on-surface px-10 py-4 kicker hover:border-primary hover:text-primary transition-colors"
              >
                開始搭配
                <Icon
                  name="arrow_outward"
                  className="text-[18px] transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Suggested destinations — editorial index */}
        <div className="flex items-baseline justify-between mt-8 mb-4">
          <Kicker className="text-primary">不如逛逛這些</Kicker>
          <Kicker className="text-on-surface-variant hidden md:block">EXPLORE</Kicker>
        </div>
        <SectionRule />
        {DESTINATIONS.map((d) => (
          <Link key={d.no} href={d.href} className="group block">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-baseline py-10 border-b border-outline-variant">
              <div className="md:col-span-2 font-headline-lg text-headline-lg text-on-surface-variant group-hover:text-primary transition-colors">
                {d.no}
              </div>
              <div className="md:col-span-4">
                <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                  {d.title}
                </h3>
                <Kicker className="text-on-surface-variant mt-2 block">{d.sub}</Kicker>
              </div>
              <p className="md:col-span-5 font-body-md text-body-md text-on-surface-variant">{d.body}</p>
              <div className="md:col-span-1 flex md:justify-end">
                <Icon
                  name="arrow_outward"
                  className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
              </div>
            </div>
          </Link>
        ))}
      </section>

      <Footer />
    </>
  );
}
