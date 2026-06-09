import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "OOTD Picker 融合膠囊衣櫥概念與美妝配色推薦，讓您自信、精緻地迎接每一天。",
};

const PRINCIPLES = [
  {
    no: "01",
    title: "膠囊衣櫥永續美學",
    body: "我們深信「少即是多」。透過整理您所擁有的高質感單品，配合季節與活動進行多樣化搭配，可以避免衝動購物，降低資源浪費，實踐綠色時尚。",
  },
  {
    no: "02",
    title: "妝造合一風格呈現",
    body: "美學不應被衣物與妝容所割裂。藉由分析您的衣服主色調，匹配冷暖色系相容的眼妝、唇彩與打亮盤，實現天衣無縫的整體造型協調性。",
  },
  {
    no: "03",
    title: "隨氣候應變的實用穿著",
    body: "造型不只為了好看，更需要面對真實生活。引擎會根據外在溫度及雨水狀態，自適應地為您決定是否增添防寒防潮的外套，兼顧美觀與機能。",
  },
  {
    no: "04",
    title: "用色彩釋放每日心情",
    body: "服裝與彩妝是您無聲的心情語言。無論是成熟穩重的商務通勤、甜蜜浪漫的午後約會，還是元氣活力的一天，都能在此找到最呼應的風格。",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Manifesto header */}
      <section className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop pt-16 md:pt-24 pb-12 text-center">
        <Kicker className="text-primary">OUR PHILOSOPHY</Kicker>
        <h1 className="font-headline-xl text-headline-xl text-on-surface mt-6 max-w-4xl mx-auto">
          穿搭與美妝的和諧共鳴
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-6 max-w-2xl mx-auto">
          OOTD Picker 旨在簡化每個人早晨的繁複準備流程，透過融合「膠囊衣櫥」概念與「美妝配色推薦」，讓您自信、精緻地迎接每一天。
        </p>
      </section>

      {/* Full-bleed image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden border-y border-outline">
        <Image
          src="/images/home/about-banner.jpg"
          alt="時尚編輯感衣櫥"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Principles — editorial article list */}
      <section className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-section-gap">
        <div className="flex items-baseline justify-between mb-4">
          <Kicker className="text-primary">核心理念</Kicker>
          <Kicker className="text-on-surface-variant hidden md:block">PRINCIPLES</Kicker>
        </div>
        <hr className="editorial-rule" />
        {PRINCIPLES.map((p) => (
          <div
            key={p.no}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline py-10 border-b border-outline-variant"
          >
            <span className="md:col-span-2 font-headline-lg text-headline-lg text-primary leading-none">{p.no}</span>
            <h3 className="md:col-span-4 font-headline-md text-headline-md text-on-surface">{p.title}</h3>
            <p className="md:col-span-6 font-body-md text-body-md text-on-surface-variant">{p.body}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-section-gap">
        <div className="border border-outline p-10 md:p-16 flex flex-col items-start gap-6">
          <Kicker className="text-primary">START THE EDIT</Kicker>
          <h3 className="font-headline-lg text-headline-lg text-on-surface max-w-xl">讓美學融入您的晨間日常</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            現在，只需前往嚮導，即可從您的專屬膠囊衣櫥與妝容庫中，隨機生成今天的完美搭配。
          </p>
          <Link
            href="/picker"
            className="group inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-4 kicker hover:bg-surface-tint transition-colors"
          >
            立即體驗風格嚮導
            <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
