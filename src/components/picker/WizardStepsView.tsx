"use client";

import type { Gender, Weather } from "@/lib/types";
import type { Step } from "@/components/picker/wizard";
import { Stepper } from "@/components/picker/Stepper";
import { ChoiceCard } from "@/components/picker/ChoiceCard";
import { Icon } from "@/components/ui/Icon";

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

interface Props {
  step: Step;
  gender: Gender | "";
  detecting: boolean;
  loadingText: { primary: string; secondary: string };
  onSelectGender: (g: Gender) => void;
  onSelectWeather: (w: Weather) => void;
  onSelectMood: (m: string) => void;
  onSelectDestination: (d: string) => void;
  onDetectWeather: () => void;
  onBack: (step: Step) => void;
}

export function WizardStepsView({
  step,
  gender,
  detecting,
  loadingText,
  onSelectGender,
  onSelectWeather,
  onSelectMood,
  onSelectDestination,
  onDetectWeather,
  onBack,
}: Props) {
  const progress = step === 1 ? 0 : step === 2 ? 33 : step === 3 ? 66 : 100;

  return (
    <>
      {step !== "loading" && <Stepper current={typeof step === "number" ? step : 4} progress={progress} />}

      <div className="relative min-h-[500px] max-w-4xl mx-auto">
        {step === 1 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 1 / 4" title="您的性別是？" hint="這將幫助我們推薦最適合您的香水與穿搭風格" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 max-w-2xl mx-auto w-full">
              {GENDERS.map((g) => (
                <ChoiceCard key={g.value} onClick={() => onSelectGender(g.value)} emoji={g.emoji} title={g.title} subtitle={g.subtitle} active={gender === g.value} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 2 / 4" title="今天出門，外面的天氣如何？" />
            <div className="flex justify-center -mt-2">
              <button
                type="button"
                onClick={onDetectWeather}
                disabled={detecting}
                className="flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-full font-label-md text-label-md hover:bg-primary/5 transition-all disabled:opacity-60"
              >
                <Icon name={detecting ? "progress_activity" : "my_location"} className={`text-[18px] ${detecting ? "animate-spin" : ""}`} />
                {detecting ? "偵測中…" : "偵測目前天氣"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-2">
              {WEATHERS.map((w) => (
                <ChoiceCard key={w.value} onClick={() => onSelectWeather(w.value)} icon={w.icon} iconClass={w.iconClass} title={w.title} subtitle={w.subtitle} />
              ))}
            </div>
            <BackButton onClick={() => onBack(1)} />
          </div>
        )}

        {step === 3 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 3 / 4" title="您現在的心情是什麼氛圍？" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
              {MOODS.map((m) => (
                <ChoiceCard key={m.value} onClick={() => onSelectMood(m.value)} icon={m.icon} iconClass={m.iconClass} title={m.title} subtitle={m.subtitle} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 max-w-xs mx-auto w-full mt-2">
              <ChoiceCard onClick={() => onSelectMood("舒適")} icon="bedroom_baby" iconClass="text-indigo-300" title="溫暖舒適" subtitle="蜷縮、慵懶、家常感" compact />
            </div>
            <BackButton onClick={() => onBack(2)} />
          </div>
        )}

        {step === 4 && (
          <div className="step-slide w-full flex flex-col gap-8">
            <StepHeading step="Step 4 / 4" title="您今天出門的目的地/活動是？" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              {DESTINATIONS.map((d) => (
                <ChoiceCard key={d.value} onClick={() => onSelectDestination(d.value)} icon={d.icon} iconClass={d.iconClass} title={d.title} compact />
              ))}
            </div>
            <BackButton onClick={() => onBack(3)} />
          </div>
        )}

        {step === "loading" && (
          <div className="w-full flex flex-col items-center justify-center gap-6 py-20">
            <div className="w-20 h-20 rounded-full border-4 border-outline-variant border-t-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-headline-md text-headline-md text-primary loading-pulse">{loadingText.primary}</p>
              <p className="text-sm text-on-surface-variant">{loadingText.secondary}</p>
            </div>
          </div>
        )}
      </div>
    </>
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
    <button type="button" onClick={onClick} className="mt-8 mx-auto flex items-center gap-2 text-primary font-medium hover:underline text-sm">
      <Icon name="arrow_back" className="text-sm" /> 返回上一步
    </button>
  );
}
