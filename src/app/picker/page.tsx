"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCloset } from "@/hooks/useCloset";
import { useFavorites } from "@/hooks/useFavorites";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { buildCloset, TRANSLATE } from "@/lib/data";
import {
  generateOOTD,
  seasonsForWeather,
  swapMakeupLook,
  swapPerfumePick,
} from "@/lib/recommend";
import { detectTodayWeather } from "@/lib/weather";
import type { Gender, Outfit, Weather, Item } from "@/lib/types";
import { Stepper } from "@/components/picker/Stepper";
import { ChoiceCard } from "@/components/picker/ChoiceCard";
import { OutfitStack } from "@/components/results/OutfitStack";
import { MakeupCard } from "@/components/results/MakeupCard";
import { PerfumeCard } from "@/components/results/PerfumeCard";
import { Icon } from "@/components/ui/Icon";

type Step = 1 | 2 | 3 | 4 | "loading" | "results";
type SlotKey = "top" | "bottom" | "outerwear" | "accessory";

const GENDERS: { value: Gender; emoji: string; title: string; subtitle: string }[] = [
  { value: "female", emoji: "👩", title: "女生", subtitle: "花香、甜香、優雅香調" },
  { value: "male", emoji: "👨", title: "男生", subtitle: "木質、海洋、清新香調" },
  { value: "unisex", emoji: "🌈", title: "不分性別", subtitle: "中性、多元、無界香調" },
];

const WEATHERS: { value: Weather; icon: string; iconClass: string; title: string; subtitle: string }[] = [
  { value: "sunny", icon: "sunny", iconClass: "text-amber-500", title: "溫暖晴天", subtitle: "舒適涼爽、艷陽高照" },
  { value: "cloudy", icon: "partly_cloudy_day", iconClass: "text-slate-400", title: "微陰多雲", subtitle: "涼風吹拂、光線柔和" },
  { value: "rainy", icon: "rainy", iconClass: "text-blue-400", title: "潮濕雨天", subtitle: "細雨綿綿、攜帶雨具" },
  { value: "cold", icon: "ac_unit", iconClass: "text-cyan-300", title: "寒冷低溫", subtitle: "需要防寒防風衣著" },
];

const MOODS: { value: string; icon: string; iconClass: string; title: string; subtitle: string }[] = [
  { value: "活力", icon: "electric_bolt", iconClass: "text-orange-400", title: "活力充沛", subtitle: "準備好挑戰的一天" },
  { value: "放鬆", icon: "coffee", iconClass: "text-amber-600", title: "愜意放鬆", subtitle: "想要慵懶、舒服的感覺" },
  { value: "專業", icon: "work", iconClass: "text-[#54643b]", title: "成熟專注", subtitle: "追求知性、俐落質感" },
  { value: "優雅", icon: "auto_awesome", iconClass: "text-rose-400", title: "精緻優雅", subtitle: "注重細節的浪漫氛圍" },
];

const DESTINATIONS: { value: string; icon: string; iconClass: string; title: string }[] = [
  { value: "工作", icon: "laptop_mac", iconClass: "text-slate-600", title: "工作通勤" },
  { value: "約會", icon: "favorite", iconClass: "text-rose-500", title: "約會聚餐" },
  { value: "休閒漫步", icon: "directions_walk", iconClass: "text-green-600", title: "休閒漫步" },
  { value: "社交聚會", icon: "celebration", iconClass: "text-amber-500", title: "派對聚會" },
  { value: "居家", icon: "home", iconClass: "text-indigo-400", title: "居家放鬆" },
];

export default function PickerPage() {
  const { closet } = useCloset();
  const { addFav } = useFavorites();
  const { showToast, pendingFavorite, consumePendingFavorite } = useChrome();

  const [step, setStep] = useState<Step>(1);
  const [gender, setGender] = useState<Gender | "">("");
  const [weather, setWeather] = useState<Weather | "">("");
  const [mood, setMood] = useState("");
  const [destination, setDestination] = useState("");
  const [rec, setRec] = useState<Outfit | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadingText, setLoadingText] = useState({
    primary: "正在為您挑選今日穿搭組合...",
    secondary: "正在調配今日妝容與香氛...",
  });
  const [appliedFavId, setAppliedFavId] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const activeCloset = useCallback(() => (closet.length ? closet : buildCloset()), [closet]);

  // Apply a favorite handed off from the global drawer. Adjusting state while
  // rendering (the React-blessed "derive state from props" pattern) avoids the
  // cascading-render pitfalls of doing this inside an effect.
  if (pendingFavorite && pendingFavorite.id !== appliedFavId) {
    const o = pendingFavorite.outfit;
    setAppliedFavId(pendingFavorite.id);
    setGender(o.context.gender || "unisex");
    setWeather(o.context.weather);
    setMood(o.context.mood);
    setDestination(o.context.destination);
    setRec(o);
    setSaved(true);
    setStep("results");
  }

  // Once applied, clear the pending handoff and notify (external-system updates
  // only — safe inside an effect).
  useEffect(() => {
    if (pendingFavorite && pendingFavorite.id === appliedFavId) {
      consumePendingFavorite();
      showToast("已將收藏組合載入預覽！");
    }
  }, [pendingFavorite, appliedFavId, consumePendingFavorite, showToast]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const progress = step === 1 ? 0 : step === 2 ? 33 : step === 3 ? 66 : 100;

  const selectGender = (g: Gender) => {
    setGender(g);
    setStep(2);
  };
  const selectWeather = (w: Weather) => {
    setWeather(w);
    setStep(3);
  };

  const detectWeather = async () => {
    if (detecting) return;
    setDetecting(true);
    try {
      const d = await detectTodayWeather();
      showToast(`已偵測到目前天氣：${d.label}`);
      selectWeather(d.weather);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "無法偵測天氣，請手動選擇");
    } finally {
      setDetecting(false);
    }
  };
  const selectMood = (m: string) => {
    setMood(m);
    setStep(4);
  };
  const selectDestination = (d: string) => {
    setDestination(d);
    setStep("loading");
    timers.current.push(
      setTimeout(
        () =>
          setLoadingText({
            primary: "正在為您調配適合的妝容色彩...",
            secondary: "根據您的心情挑選今日香水...",
          }),
        1200,
      ),
    );
    timers.current.push(
      setTimeout(() => {
        const result = generateOOTD(activeCloset(), weather as Weather, mood, d, gender as Gender);
        setRec(result);
        setSaved(false);
        setStep("results");
      }, 2500),
    );
  };

  const resetWizard = () => {
    setGender("");
    setWeather("");
    setMood("");
    setDestination("");
    setRec(null);
    setSaved(false);
    setLoadingText({ primary: "正在為您挑選今日穿搭組合...", secondary: "正在調配今日妝容與香氛..." });
    setStep(1);
  };

  const regenerate = () => {
    setRec(generateOOTD(activeCloset(), weather as Weather, mood, destination, gender as Gender));
    setSaved(false);
    showToast("已重新生成穿搭組合！");
  };

  const swapItem = (slot: SlotKey) => {
    if (!rec) return;
    const slotToCat: Record<SlotKey, Item["category"]> = {
      top: "tops",
      bottom: "bottoms",
      outerwear: "outerwear",
      accessory: "accessories",
    };
    const dbCategory = slotToCat[slot];
    const targetSeasons = weather ? seasonsForWeather(weather as Weather) : [];
    const currentId = rec[slot]?.id ?? "";
    const pool = activeCloset().filter(
      (i) => i.category === dbCategory && i.seasons.some((s) => targetSeasons.includes(s)),
    );
    let available = pool.filter((i) => i.id !== currentId);
    if (available.length === 0) {
      available = activeCloset().filter((i) => i.category === dbCategory && i.id !== currentId);
    }
    if (available.length === 0) {
      showToast("衣櫥中沒有其他單品可以更換了！");
      return;
    }
    const next = available[Math.floor(Math.random() * available.length)];
    setRec({ ...rec, [slot]: next });
    showToast(`已更換${TRANSLATE.category[dbCategory]}！`);
  };

  const swapMakeup = () => {
    if (!rec) return;
    setRec({ ...rec, makeup: swapMakeupLook(rec.makeup, rec.context) });
    showToast("已為您更換推薦妝容！");
  };

  const swapPerfume = () => {
    if (!rec) return;
    setRec({ ...rec, perfume: swapPerfumePick(rec.perfume, rec.context) });
    showToast("已為您更換香水！");
  };

  const saveCombination = () => {
    if (!rec || saved) return;
    addFav(rec);
    setSaved(true);
    showToast("已成功收藏至您的風格記錄中！");
  };

  return (
    <main className="max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12">
      {step !== "results" && step !== "loading" && (
        <Stepper current={typeof step === "number" ? step : 4} progress={progress} />
      )}

      <div className="relative min-h-[500px] max-w-4xl mx-auto">
        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 1 / 4" title="您的性別是？" hint="這將幫助我們推薦最適合您的香水與穿搭風格" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 max-w-2xl mx-auto w-full">
              {GENDERS.map((g) => (
                <ChoiceCard
                  key={g.value}
                  onClick={() => selectGender(g.value)}
                  emoji={g.emoji}
                  title={g.title}
                  subtitle={g.subtitle}
                  active={gender === g.value}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Weather */}
        {step === 2 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 2 / 4" title="今天出門，外面的天氣如何？" />
            <div className="flex justify-center -mt-2">
              <button
                onClick={detectWeather}
                disabled={detecting}
                className="flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-full font-label-md text-label-md hover:bg-primary/5 transition-all disabled:opacity-60"
              >
                <Icon name={detecting ? "progress_activity" : "my_location"} className={`text-[18px] ${detecting ? "animate-spin" : ""}`} />
                {detecting ? "偵測中…" : "偵測目前天氣"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-2">
              {WEATHERS.map((w) => (
                <ChoiceCard key={w.value} onClick={() => selectWeather(w.value)} icon={w.icon} iconClass={w.iconClass} title={w.title} subtitle={w.subtitle} />
              ))}
            </div>
            <BackButton onClick={() => setStep(1)} />
          </div>
        )}

        {/* Step 3: Mood */}
        {step === 3 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 3 / 4" title="您現在的心情是什麼氛圍？" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
              {MOODS.map((m) => (
                <ChoiceCard key={m.value} onClick={() => selectMood(m.value)} icon={m.icon} iconClass={m.iconClass} title={m.title} subtitle={m.subtitle} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 max-w-xs mx-auto w-full mt-2">
              <ChoiceCard onClick={() => selectMood("舒適")} icon="bedroom_baby" iconClass="text-indigo-300" title="溫暖舒適" subtitle="蜷縮、慵懶、家常感" compact />
            </div>
            <BackButton onClick={() => setStep(2)} />
          </div>
        )}

        {/* Step 4: Destination */}
        {step === 4 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 4 / 4" title="您今天出門的目的地/活動是？" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {DESTINATIONS.map((d) => (
                <ChoiceCard key={d.value} onClick={() => selectDestination(d.value)} icon={d.icon} iconClass={d.iconClass} title={d.title} compact />
              ))}
            </div>
            <BackButton onClick={() => setStep(3)} />
          </div>
        )}

        {/* Loading */}
        {step === "loading" && (
          <div className="w-full flex flex-col items-center justify-center gap-6 py-20">
            <div className="w-20 h-20 rounded-full border-4 border-outline-variant border-t-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-headline-md text-headline-md text-primary loading-pulse">{loadingText.primary}</p>
              <p className="text-sm text-on-surface-variant">{loadingText.secondary}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {step === "results" && rec && (
          <div className="w-full flex flex-col gap-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/20 pb-6 gap-4">
              <div className="space-y-1">
                <h2 className="font-headline-lg text-headline-lg text-primary">您的今日風格企劃</h2>
                <p className="font-body-md text-body-md text-on-surface-variant flex flex-wrap gap-2 items-center">
                  {[
                    TRANSLATE.gender[rec.context.gender],
                    TRANSLATE.weather[rec.context.weather],
                    TRANSLATE.mood[rec.context.mood],
                    TRANSLATE.destination[rec.context.destination],
                  ].map((label) => (
                    <span key={label} className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm">
                      {label}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={regenerate}
                  className="flex items-center gap-2 bg-surface border border-outline-variant hover:bg-surface-container px-6 py-3 rounded-full font-label-md text-label-md transition-all"
                >
                  <Icon name="refresh" className="text-[20px]" /> 重新生成穿搭
                </button>
                <button
                  onClick={saveCombination}
                  disabled={saved}
                  className={
                    saved
                      ? "flex items-center gap-2 bg-outline-variant/40 text-on-surface-variant/60 cursor-not-allowed px-6 py-3 rounded-full font-label-md text-label-md shadow-none"
                      : "flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/95 px-6 py-3 rounded-full font-label-md text-label-md shadow-md transition-all"
                  }
                >
                  <Icon name={saved ? "task_alt" : "favorite"} className="text-[20px]" />
                  {saved ? "已收藏此風格" : "收藏此風格組合"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 bg-white rounded-lg p-8 border border-outline-variant/20 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <Icon name="checkroom" className="text-primary" /> 精選穿搭單品
                  </h3>
                </div>
                <OutfitStack outfit={rec} onSwap={swapItem} />
              </div>
              <MakeupCard makeup={rec.makeup} onSwap={swapMakeup} />
            </div>

            <PerfumeCard perfume={rec.perfume} onSwap={swapPerfume} />

            <div className="flex justify-center mt-6">
              <button
                onClick={resetWizard}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-medium hover:underline text-sm py-2"
              >
                <Icon name="settings_backup_restore" className="text-sm" /> 重新挑選條件
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StepHeading({ step, title, hint }: { step: string; title: string; hint?: string }) {
  return (
    <div className="text-center space-y-2">
      <span className="text-secondary font-label-md text-label-md uppercase tracking-[0.2em]">{step}</span>
      <h2 className="font-headline-lg text-headline-lg text-on-surface">{title}</h2>
      {hint && <p className="text-on-surface-variant text-sm">{hint}</p>}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-8 mx-auto flex items-center gap-2 text-primary font-medium hover:underline text-sm">
      <Icon name="arrow_back" className="text-sm" /> 返回上一步
    </button>
  );
}
