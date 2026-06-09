import Image from "next/image";
import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";
import { Kicker, SectionRule } from "@/components/ui/Editorial";

const CONTENTS = [
  {
    no: "01",
    href: "/picker",
    title: "THE PICKER",
    sub: "穿搭嚮導",
    body: "回答四個問題——性別、天氣、心情、目的地——換得一套今日專屬的穿搭、妝容與香氛提案。",
  },
  {
    no: "02",
    href: "/closet",
    title: "THE WARDROBE",
    sub: "我的衣櫥",
    body: "策展逾三千件單品，依類別、季節、色系與場合自由篩選，打造屬於你的膠囊衣櫥。",
  },
  {
    no: "03",
    href: "/about",
    title: "THE PHILOSOPHY",
    sub: "品牌理念",
    body: "我們相信早晨的儀式應是喜悅而非壓力。妝造合一，讓風格隨心情與氣候自在應變。",
  },
];

const STEPS = [
  {
    no: "01",
    title: "設定心情與目的",
    body: "您今天感覺如何？活力十足、放鬆，還是準備好前往約會、工作或派對？",
  },
  {
    no: "02",
    title: "確認天氣狀態",
    body: "我們與在地預報同步，確保您的造型既防風保暖又實用時尚。",
  },
  {
    no: "03",
    title: "獲得穿搭與妝容",
    body: "獲得為您的今日氛圍和目的地量身定製的專屬穿搭及美妝提案。",
  },
];

const FEATURED = [
  {
    src: "/images/home/outfit-1.jpg",
    tags: ["晴天", "元氣西柚妝"],
    title: "晨光煥發",
    body: "適合週末藝廊漫步的完美穿搭，搭配明亮元氣的柚橘色妝容。",
  },
  {
    src: "/images/home/outfit-2.jpg",
    tags: ["多雲", "都會知性妝"],
    title: "都市洗鍊",
    body: "適合辦公時間與晚餐約會的多樣化選擇，配搭半霧面知性眼唇妝。",
  },
  {
    src: "/images/home/outfit-3.jpg",
    tags: ["雨天", "清透白開水"],
    title: "大地舒適",
    body: "在家中辦公也能保持溫暖與時髦，搭配極簡無粉感清透裸妝。",
  },
];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* Contents — editorial table-of-contents index */}
      <section className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-section-gap">
        <div className="flex items-baseline justify-between mb-12">
          <Kicker className="text-primary">內容導覽</Kicker>
          <Kicker className="text-on-surface-variant">CONTENTS</Kicker>
        </div>
        <SectionRule />
        {CONTENTS.map((c) => (
          <Link key={c.no} href={c.href} className="group block">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-baseline py-10 border-b border-outline-variant">
              <div className="md:col-span-2 font-headline-lg text-headline-lg text-on-surface-variant group-hover:text-primary transition-colors">
                {c.no}
              </div>
              <div className="md:col-span-4">
                <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                  {c.title}
                </h3>
                <Kicker className="text-on-surface-variant mt-2 block">{c.sub}</Kicker>
              </div>
              <p className="md:col-span-5 font-body-md text-body-md text-on-surface-variant">{c.body}</p>
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

      {/* How It Works — oversized serif numerals */}
      <section className="bg-surface-container-low border-y border-outline">
        <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-section-gap">
          <div className="max-w-xl mb-16">
            <Kicker className="text-primary">運作方式</Kicker>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-4">三步，成就今日姿態。</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-variant border border-outline-variant">
            {STEPS.map((s) => (
              <div key={s.no} className="bg-surface-container-low p-8 md:p-10 flex flex-col gap-5">
                <span className="font-headline-xl text-headline-xl text-primary leading-none">{s.no}</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">{s.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/picker"
              className="group inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-4 kicker hover:bg-surface-tint transition-colors"
            >
              立即開始
              <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured — asymmetric editorial cards */}
      <section className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-section-gap">
        <div className="flex items-baseline justify-between mb-12">
          <div>
            <Kicker className="text-primary">今日靈感</Kicker>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-4">精選風格推薦</h2>
          </div>
          <Kicker className="text-on-surface-variant hidden md:block">EDITOR&apos;S PICKS</Kicker>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {FEATURED.map((o, i) => (
            <Link
              key={o.title}
              href="/picker"
              className={`group block ${i === 1 ? "md:mt-16" : ""}`}
            >
              <div className="aspect-[4/5] overflow-hidden relative border border-outline-variant">
                <Image
                  src={o.src}
                  alt={o.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <div className="pt-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="kicker text-on-surface-variant border border-outline-variant px-3 py-1"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h4 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                  {o.title}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">{o.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
