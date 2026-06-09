"use client";

import { useMemo, useRef, useState } from "react";
import { useWearLog } from "@/hooks/useWearLog";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { parseWearLogsJSON } from "@/lib/storage";
import { logsForMonth } from "@/lib/wearlog";
import type { WearLog } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";
import { CalendarGrid } from "@/components/journal/CalendarGrid";
import { DayDetailDrawer } from "@/components/journal/DayDetailDrawer";

export default function JournalPage() {
  const { wearLogs, deleteLog, updateNote, replaceAll } = useWearLog();
  const { applyFavorite, openShare, showToast } = useChrome();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const logsByDate = useMemo(
    () => logsForMonth(wearLogs, view.year, view.month),
    [wearLogs, view.year, view.month],
  );
  const selectedLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : [];
  const monthCount = Object.values(logsByDate).reduce((n, l) => n + l.length, 0);

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const goToday = () => setView({ year: now.getFullYear(), month: now.getMonth() });

  const applyLog = (log: WearLog) => {
    applyFavorite({ id: log.id, date: log.date, outfit: log.outfit });
  };

  const exportLogs = () => {
    if (wearLogs.length === 0) {
      showToast("目前沒有可匯出的穿搭紀錄");
      return;
    }
    const blob = new Blob([JSON.stringify(wearLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ootd-journal.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("已匯出穿搭日誌 JSON！");
  };

  const importLogs = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseWearLogsJSON(reader.result as string);
        const seen = new Set(wearLogs.map((l) => l.id));
        const merged = [...imported.filter((l) => !seen.has(l.id)), ...wearLogs];
        replaceAll(merged);
        showToast(`已匯入 ${imported.length} 筆穿搭紀錄！`);
      } catch (err) {
        showToast(err instanceof Error ? `匯入失敗：${err.message}` : "匯入失敗");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-content mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12 md:py-16">
      {/* Editorial masthead */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-outline pb-8 mb-10">
        <div className="space-y-4">
          <Kicker className="text-primary">THE STYLE DIARY</Kicker>
          <h1 className="font-headline-xl text-headline-xl text-[44px] md:text-[56px] text-on-surface">我的穿搭日誌</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[560px]">
            記錄每天實際穿了什麼，回顧你的風格軌跡，避免短期內重複穿搭。
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={exportLogs} className="text-on-surface-variant hover:text-primary p-2" title="匯出 JSON" aria-label="匯出日誌">
            <Icon name="download" className="text-[20px]" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-on-surface-variant hover:text-primary p-2" title="匯入 JSON" aria-label="匯入日誌">
            <Icon name="upload" className="text-[20px]" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importLogs(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-headline-md text-headline-md text-[24px] text-on-surface">
            {view.year} 年 {view.month + 1} 月
          </h2>
          <span className="kicker text-on-surface-variant">{monthCount} 筆紀錄</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shiftMonth(-1)} className="p-2 border border-outline-variant hover:border-on-surface transition-colors" aria-label="上個月">
            <Icon name="chevron_left" className="text-[18px]" />
          </button>
          <button type="button" onClick={goToday} className="px-4 py-2 border border-outline-variant kicker hover:border-on-surface transition-colors">
            本月
          </button>
          <button type="button" onClick={() => shiftMonth(1)} className="p-2 border border-outline-variant hover:border-on-surface transition-colors" aria-label="下個月">
            <Icon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
      </div>

      <CalendarGrid
        year={view.year}
        month={view.month}
        logsByDate={logsByDate}
        onSelectDay={setSelectedDate}
      />

      <DayDetailDrawer
        dateISO={selectedDate}
        logs={selectedLogs}
        onClose={() => setSelectedDate(null)}
        onDelete={(id) => {
          deleteLog(id);
          showToast("已刪除穿搭紀錄！");
        }}
        onUpdateNote={(id, note) => {
          updateNote(id, note);
          showToast("已更新註記！");
        }}
        onApply={applyLog}
        onShare={(log) => openShare(log.outfit)}
      />
    </div>
  );
}
