"use client";

import type { Gender, Weather } from "@/lib/types";
import type { Step } from "@/components/picker/wizard";
import { Stepper } from "@/components/picker/Stepper";
import { ChoiceCard } from "@/components/picker/ChoiceCard";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

const GENDERS: { value: Gender; icon: string; iconClass: string; title: string; subtitle: string }[] = [
  { value: "female", icon: "woman", iconClass: "text-rose-400", title: "女生", subtitle: "花香、甜香、優雅香調" },
  { value: "male", icon: "man", iconClass: "text-sky-500", title: "男生", subtitle: "木質、海洋、清新香調" },
  { value: "unisex", icon: "diversity_3", iconClass: "text-on-surface", title: "不分性別", subtitle: "中性、多元、無界香調" },
];

const WEATHERS: { value: Weather; icon: string; iconClass: string; title: string; subtitle: string }[] = [
  { value: "sunny", icon: "sunny", iconClass: "text-amber-500", title: "溫暖晴天", subtitle: "舒適涼爽、艷陽高照" },
  { value: "cloudy", icon: "partly_cloudy_day", iconClass: "text-slate-400", title: "微陰多雲", subtitle: "涼風吹拂、光線柔和" },
  { value: "rainy", icon: "rainy", iconClass: "text-blue-400", title: "潮濕雨天", subtitle: "細雨綿綿、攜帶雨具" },
  { value: "cold", icon: "ac_unit", iconClass: "text-cyan-400", title: "寒冷低溫", subtitle: "需要防寒防風衣著" },
];

const MOODS: { value: string; icon: string; iconClass: string; title: string; subtitle: string }[] = [
  { value: "活力", icon: "electric_bolt", iconClass: "text-orange-400", title: "活力充沛", subtitle: "準備好挑戰的一天" },
  { value: "放鬆", icon: "coffee", iconClass: "text-amber-600", title: "愜意放鬆", subtitle: "想要慵懶、舒服的感覺" },
  { value: "專業", icon: "work", iconClass: "text-on-surface", title: "成熟專注", subtitle: "追求知性、俐落質感" },
  { value: "優雅", icon: "auto_awesome", iconClass: "text-rose-400", title: "精緻優雅", subtitle: "注重細節的浪漫氛圍" },
  { value: "舒適", icon: "bedroom_baby", iconClass: "text-indigo-300", title: "溫暖舒適", subtitle: "蜷縮、慵懶、家常感" },
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
  onCancelLoading: () => void;
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
  onCancelLoading,
  onBack,
}: Props) {
  const progress = step === 1 ? 8 : step === 2 ? 33 : step === 3 ? 66 : 100;

  if (step === "loading") {
    return (
      <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-8 py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-[9999px] border-2 border-outline-variant border-t-primary animate-spin" />
        <div className="text-center space-y-3 max-w-md">
          <p className="font-headline-md text-headline-md text-on-surface loading-pulse">{loadingText.primary}</p>
          <p className="font-body-md text-body-md text-on-surface-variant">{loadingText.secondary}</p>
        </div>
        <button
          type="button"
          onClick={onCancelLoading}
          className="inline-flex items-center gap-2 kicker text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="arrow_back" className="text-[16px]" /> 取消並返回
        </button>
      </div>
    );
  }

  return (
    <>
      {typeof step === "number" && <Stepper current={step} progress={progress} />}

      <div className="step-slide animate-fade-in grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16 items-start">
        {step === 1 && (
          <>
            <StepHeading
              no="01"
              title="您的性別是？"
              hint="這將幫助我們推薦最適合您的香水與穿搭風格。"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {GENDERS.map((g) => (
                <ChoiceCard key={g.value} onClick={() => onSelectGender(g.value)} icon={g.icon} iconClass={g.iconClass} title={g.title} subtitle={g.subtitle} active={gender === g.value} />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading no="02" title="今天出門，外面的天氣如何？" onBack={() => onBack(1)}>
              <button
                type="button"
                onClick={onDetectWeather}
                disabled={detecting}
                className="mt-2 inline-flex items-center gap-2 border border-on-surface text-on-surface px-5 py-2.5 kicker hover:bg-on-surface hover:text-background transition-colors disabled:opacity-60"
              >
                <Icon name={detecting ? "progress_activity" : "my_location"} className={`text-[18px] ${detecting ? "animate-spin" : ""}`} />
                {detecting ? "偵測中…" : "偵測目前天氣"}
              </button>
            </StepHeading>
            <div className="grid grid-cols-2 gap-4">
              {WEATHERS.map((w) => (
                <ChoiceCard key={w.value} onClick={() => onSelectWeather(w.value)} icon={w.icon} iconClass={w.iconClass} title={w.title} subtitle={w.subtitle} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <StepHeading no="03" title="您現在的心情是什麼氛圍？" hint="心情決定今日的妝容與香氛走向。" onBack={() => onBack(2)} />
            <div className="grid grid-cols-2 gap-4">
              {MOODS.map((m) => (
                <ChoiceCard key={m.value} onClick={() => onSelectMood(m.value)} icon={m.icon} iconClass={m.iconClass} title={m.title} subtitle={m.subtitle} />
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <StepHeading no="04" title="您今天出門的目的地是？" hint="最後一步——告訴我們今天的去處。" onBack={() => onBack(3)} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {DESTINATIONS.map((d) => (
                <ChoiceCard key={d.value} onClick={() => onSelectDestination(d.value)} icon={d.icon} iconClass={d.iconClass} title={d.title} compact />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StepHeading({
  no,
  title,
  hint,
  onBack,
  children,
}: {
  no: string;
  title: string;
  hint?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="lg:sticky lg:top-32 flex flex-col gap-5">
      <Kicker className="text-primary">STEP {no} / 04</Kicker>
      <h2 className="font-headline-xl text-headline-xl text-[44px] md:text-[56px] text-on-surface">{title}</h2>
      {hint && <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">{hint}</p>}
      {children}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 inline-flex items-center gap-2 kicker text-on-surface-variant hover:text-on-surface transition-colors self-start"
        >
          <Icon name="arrow_back" className="text-[16px]" /> 返回上一步
        </button>
      )}
    </div>
  );
}
