import Image from "next/image";
import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { Footer } from "@/components/nav/Footer";
import { Icon } from "@/components/ui/Icon";

const STEPS = [
  {
    icon: "favorite",
    title: "1. 設定您的心情與目的",
    body: "您今天感覺如何？活力十足、放鬆，還是準備好前往約會、工作或派對？",
  },
  {
    icon: "partly_cloudy_day",
    title: "2. 確認天氣狀態",
    body: "我們與在地預報同步，確保您的造型既防風保暖又實用時尚。",
  },
  {
    icon: "auto_awesome",
    title: "3. 獲得穿搭與妝容推薦",
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

      {/* Bento Grid Intro */}
      <section className="py-section-gap px-container-padding-mobile md:px-container-padding-desktop max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          <div className="md:col-span-7 bg-surface-container rounded-lg p-8 md:p-12 flex flex-col justify-center gap-6">
            <span className="text-primary font-label-md text-label-md uppercase tracking-[0.2em]">體驗流程</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">每天早晨，為您打造自信姿態。</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md leading-relaxed">
              我們相信早晨的例行公事應該是喜悅的來源，而非壓力。OOTD &amp; Makeup Picker 使用智慧對應，將您的現有衣櫥與精緻妝容完美結合。
            </p>
          </div>
          <div className="md:col-span-5 relative group overflow-hidden rounded-lg aspect-square">
            <Image
              src="/images/home/closet.jpg"
              alt="高質感極簡衣櫥細節"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface-container-low py-section-gap relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl" />
        <div className="max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop text-center">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-16">運作方式</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map((s) => (
              <div key={s.title} className="group flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white shadow-[0px_10px_30px_rgba(135,152,106,0.08)] flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-2">
                  <Icon name={s.icon} className="text-primary text-3xl" />
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{s.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant px-4">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-20">
            <Link
              href="/picker"
              className="inline-flex bg-primary-container text-on-primary-container px-12 py-5 rounded-full font-label-md text-label-md uppercase tracking-[0.1em] hover:shadow-xl transition-all duration-300 items-center gap-3 mx-auto"
            >
              立即開始 <Icon name="arrow_forward" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Outfit Cards */}
      <section className="py-section-gap max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl text-left">
            <span className="text-secondary font-label-md text-label-md uppercase tracking-[0.2em] block mb-4">今日靈感</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">精選風格推薦</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {FEATURED.map((o) => (
            <div
              key={o.title}
              className="bg-white rounded-lg overflow-hidden shadow-[0px_10px_30px_rgba(135,152,106,0.08)] group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <Image
                  src={o.src}
                  alt={o.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {o.tags.map((t) => (
                    <span key={t} className="px-4 py-1.5 rounded-full border border-primary text-primary font-label-sm text-label-sm">
                      {t}
                    </span>
                  ))}
                </div>
                <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{o.title}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">{o.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
