"use client";

import { useEffect, useReducer, useRef } from "react";
import { useCloset } from "@/hooks/useCloset";
import { useFavorites } from "@/hooks/useFavorites";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { buildCloset, TRANSLATE } from "@/lib/data";
import { generateOOTD, seasonsForWeather, swapMakeupLook, swapPerfumePick } from "@/lib/recommend";
import { detectTodayWeather } from "@/lib/weather";
import type { Gender, Weather, Item } from "@/lib/types";
import { wizardReducer, initialWizard, type Step } from "@/components/picker/wizard";
import { WizardStepsView } from "@/components/picker/WizardStepsView";
import { ResultsView } from "@/components/picker/ResultsView";

type SlotKey = "top" | "bottom" | "outerwear" | "accessory";

export default function PickerPage() {
  const { closet } = useCloset();
  const { addFav } = useFavorites();
  const { showToast, pendingFavorite, consumePendingFavorite } = useChrome();

  const [state, dispatch] = useReducer(wizardReducer, initialWizard);
  const { step, gender, weather, mood, destination, rec, saved, loadingText, appliedFavId, detecting } = state;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const activeCloset = () => (closet.length ? closet : buildCloset());

  // Apply a favorite handed off from the global drawer (derive state from props
  // while rendering — avoids effect-driven cascading renders).
  if (pendingFavorite && pendingFavorite.id !== appliedFavId) {
    dispatch({ type: "applyFavorite", fav: pendingFavorite });
  }

  useEffect(() => {
    if (pendingFavorite && pendingFavorite.id === appliedFavId) {
      consumePendingFavorite();
      showToast("已將收藏組合載入預覽！");
    }
  }, [pendingFavorite, appliedFavId, consumePendingFavorite, showToast]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const selectGender = (g: Gender) => dispatch({ type: "selectGender", value: g });
  const selectWeather = (w: Weather) => dispatch({ type: "selectWeather", value: w });
  const selectMood = (m: string) => dispatch({ type: "selectMood", value: m });

  const detectWeather = async () => {
    if (detecting) return;
    dispatch({ type: "setDetecting", value: true });
    const result = await detectTodayWeather().then(
      (d) => ({ ok: true as const, d }),
      (err: unknown) => ({ ok: false as const, err }),
    );
    dispatch({ type: "setDetecting", value: false });
    if (result.ok) {
      showToast(`已偵測到目前天氣：${result.d.label}`);
      selectWeather(result.d.weather);
    } else {
      showToast(result.err instanceof Error ? result.err.message : "無法偵測天氣，請手動選擇");
    }
  };

  const selectDestination = (d: string) => {
    dispatch({ type: "startDestination", value: d });
    timers.current.push(
      setTimeout(
        () => dispatch({ type: "setLoadingText", value: { primary: "正在為您調配適合的妝容色彩...", secondary: "根據您的心情挑選今日香水..." } }),
        1200,
      ),
    );
    timers.current.push(
      setTimeout(() => {
        const outfit = generateOOTD(activeCloset(), weather as Weather, mood, d, gender as Gender);
        dispatch({ type: "setResult", rec: outfit });
      }, 2500),
    );
  };

  const regenerate = () => {
    dispatch({ type: "setResult", rec: generateOOTD(activeCloset(), weather as Weather, mood, destination, gender as Gender) });
    showToast("已重新生成穿搭組合！");
  };

  const swapItem = (slot: SlotKey) => {
    if (!rec) return;
    const slotToCat: Record<SlotKey, Item["category"]> = { top: "tops", bottom: "bottoms", outerwear: "outerwear", accessory: "accessories" };
    const dbCategory = slotToCat[slot];
    const targetSeasons = weather ? seasonsForWeather(weather as Weather) : [];
    const currentId = rec[slot]?.id ?? "";
    const pool = activeCloset().filter((i) => i.category === dbCategory && i.seasons.some((s) => targetSeasons.includes(s)));
    let available = pool.filter((i) => i.id !== currentId);
    if (available.length === 0) {
      available = activeCloset().filter((i) => i.category === dbCategory && i.id !== currentId);
    }
    if (available.length === 0) {
      showToast("衣櫥中沒有其他單品可以更換了！");
      return;
    }
    const next = available[Math.floor(Math.random() * available.length)];
    dispatch({ type: "setRec", rec: { ...rec, [slot]: next } });
    showToast(`已更換${TRANSLATE.category[dbCategory]}！`);
  };

  const swapMakeup = () => {
    if (!rec) return;
    dispatch({ type: "setRec", rec: { ...rec, makeup: swapMakeupLook(rec.makeup, rec.context) } });
    showToast("已為您更換推薦妝容！");
  };

  const swapPerfume = () => {
    if (!rec) return;
    dispatch({ type: "setRec", rec: { ...rec, perfume: swapPerfumePick(rec.perfume, rec.context) } });
    showToast("已為您更換香水！");
  };

  const saveCombination = () => {
    if (!rec || saved) return;
    addFav(rec);
    dispatch({ type: "markSaved" });
    showToast("已成功收藏至您的風格記錄中！");
  };

  return (
    <main className="max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12">
      {step === "results" && rec ? (
        <div className="relative min-h-[500px] max-w-4xl mx-auto">
          <ResultsView
            rec={rec}
            saved={saved}
            onRegenerate={regenerate}
            onSwapItem={swapItem}
            onSwapMakeup={swapMakeup}
            onSwapPerfume={swapPerfume}
            onSave={saveCombination}
            onReset={() => dispatch({ type: "reset" })}
          />
        </div>
      ) : (
        <WizardStepsView
          step={step}
          gender={gender}
          detecting={detecting}
          loadingText={loadingText}
          onSelectGender={selectGender}
          onSelectWeather={selectWeather}
          onSelectMood={selectMood}
          onSelectDestination={selectDestination}
          onDetectWeather={detectWeather}
          onBack={(s: Step) => dispatch({ type: "setStep", value: s })}
        />
      )}
    </main>
  );
}
