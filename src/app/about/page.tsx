import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "OOTD Picker 融合膠囊衣櫥概念與美妝配色推薦，讓您自信、精緻地迎接每一天。",
};

const PRINCIPLES = [
  {
    icon: "dry_cleaning",
    wrap: "bg-primary/10 text-primary",
    title: "膠囊衣櫥永續美學",
    body: "我們深信「少即是多」。透過整理您所擁有的高質感單品，配合季節與活動進行多樣化搭配，可以避免衝動購物，降低資源浪費，實踐綠色時尚。",
  },
  {
    icon: "palette",
    wrap: "bg-secondary/15 text-secondary",
    title: "妝造合一風格呈現",
    body: "美學不應被衣物與妝容所割裂。藉由分析您的衣服主色調，匹配冷暖色系相容的眼妝、唇彩與打亮盤，實現天衣無縫的整體造型協調性。",
  },
  {
    icon: "device_thermostat",
    wrap: "bg-primary-fixed-dim/20 text-[#3d4c25]",
    title: "隨氣候應變的實用穿著",
    body: "造型不只為了好看，更需要面對真實生活。引擎會根據外在溫度及雨水狀態，自適應地為您決定是否增添防寒防潮的外套，兼顧美觀與機能。",
  },
  {
    icon: "sentiment_satisfied",
    wrap: "bg-secondary-fixed/40 text-on-secondary-container",
    title: "用色彩釋放每日心情",
    body: "服裝與彩妝是您無聲的心情語言。無論是成熟穩重的商務通勤、甜蜜浪漫的午後約會，還是元氣活力的一天，都能在此找到最呼應的風格。",
  },
];

export default function AboutPage() {
  return (
    <>
      <main className="max-w-[800px] mx-auto px-container-padding-mobile md:px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-secondary font-label-md text-label-md uppercase tracking-[0.2em]">Our Philosophy</span>
          <h2 className="font-headline-xl text-headline-xl text-primary">穿搭與美妝的和諧共鳴</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
            OOTD Picker 旨在簡化每個人早晨的繁複準備流程，透過融合「膠囊衣櫥」概念與「美妝配色推薦」，讓您自信、精緻地迎接每一天。
          </p>
        </div>

        <div className="aspect-[16/9] w-full rounded-xl overflow-hidden shadow-[0px_15px_40px_rgba(135,152,106,0.1)] relative">
          <Image
            src="/images/home/about-banner.jpg"
            alt="時尚編輯感衣櫥"
            fill
            sizes="(max-width: 800px) 100vw, 800px"
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="space-y-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${p.wrap}`}>
                <Icon name={p.icon} />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{p.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface-container rounded-lg p-8 md:p-12 text-center space-y-6">
          <h3 className="font-headline-lg text-headline-lg text-primary">讓美學融入您的晨間日常</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto leading-relaxed">
            現在，只需前往嚮導，即可從您的專屬膠囊衣櫥與妝容庫中，隨機生成今天的完美搭配。
          </p>
          <Link
            href="/picker"
            className="inline-block bg-primary text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            立即體驗風格嚮導
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
