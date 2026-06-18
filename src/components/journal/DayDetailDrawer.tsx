"use client";

import { useRef, useState } from "react";
import { TRANSLATE } from "@/lib/data";
import type { Outfit, WearLog } from "@/lib/types";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useChrome } from "@/components/chrome/ChromeProvider";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";
import { SmartImage } from "@/components/ui/SmartImage";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** Format a local ISO date "YYYY-MM-DD" into "2026年6月9日（週一）". */
function formatHeading(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}年${m}月${d}日（週${weekday}）`;
}

function garmentLine(o: Outfit): string {
  return [o.top?.name, o.bottom?.name, o.outerwear?.name].filter(Boolean).join(" + ");
}

interface Props {
  dateISO: string | null;
  logs: WearLog[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onApply: (log: WearLog) => void;
  onShare: (log: WearLog) => void;
}

export function DayDetailDrawer({ dateISO, logs, onClose, onDelete, onUpdateNote, onApply, onShare }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const { confirm: confirmDialog } = useChrome();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, dateISO != null, onClose);

  if (!dateISO) return null;

  const startNote = (log: WearLog) => {
    setEditingId(log.id);
    setDraftNote(log.note ?? "");
  };

  const commitNote = (id: string) => {
    onUpdateNote(id, draftNote);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "刪除穿搭紀錄",
      message: "確定要刪除這筆穿搭紀錄嗎？",
      confirmLabel: "刪除",
      danger: true,
    });
    if (ok) onDelete(id);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-on-surface/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
        className="absolute right-0 top-0 h-full w-[450px] max-w-full bg-surface-bright border-l border-outline shadow-2xl p-8 flex flex-col gap-6 animate-slide-left overflow-y-auto"
      >
        <div className="flex justify-between items-end border-b border-outline pb-4">
          <div>
            <Kicker className="text-primary">STYLE DIARY</Kicker>
            <h2 id="day-detail-title" className="font-headline-md text-headline-md text-on-surface mt-1">{formatHeading(dateISO)}</h2>
          </div>
          <button type="button" className="text-on-surface-variant hover:text-primary p-1" onClick={onClose} aria-label="關閉">
            <Icon name="close" />
          </button>
        </div>

        <div className="flex-1 space-y-6">
          {logs.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant space-y-4">
              <Icon name="checkroom" className="text-5xl text-outline-variant" />
              <p className="font-headline-md text-headline-md text-[18px] text-on-surface">這天還沒有穿搭紀錄</p>
              <p className="font-body-md text-body-md text-[14px]">在搭配結果或收藏中點「標記為穿過」即可記錄。</p>
            </div>
          ) : (
            logs.map((log) => {
              const item = log.outfit.top ?? log.outfit.outerwear ?? log.outfit.bottom ?? log.outfit.accessory ?? null;
              return (
                <div key={log.id} className="p-5 border border-outline-variant bg-surface-bright space-y-4 relative group">
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => onShare(log)} className="text-on-surface-variant hover:text-primary" title="分享" aria-label="分享紀錄">
                      <Icon name="ios_share" className="text-[18px]" />
                    </button>
                    <button type="button" onClick={() => handleDelete(log.id)} className="text-on-surface-variant hover:text-error" title="刪除紀錄" aria-label="刪除紀錄">
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>

                  <div className="flex gap-4">
                    {item && (
                      <div className="w-16 h-20 overflow-hidden flex-shrink-0 bg-surface-container relative border border-outline-variant">
                        <SmartImage src={item.imageUrl} alt={item.name} sizes="64px" className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <span className="kicker text-primary">
                        {TRANSLATE.weather[log.outfit.context.weather]} · {log.outfit.context.destination}
                      </span>
                      <p className="font-body-md text-body-md text-[14px] font-semibold text-on-surface leading-snug">{garmentLine(log.outfit)}</p>
                      <p className="font-body-md text-body-md text-[13px] text-on-surface-variant flex items-center gap-1.5">
                        <Icon name="auto_awesome" className="text-[14px] text-on-surface" />
                        妝容：{log.outfit.makeup.name}
                      </p>
                      {log.outfit.perfume && (
                        <p className="font-body-md text-body-md text-[13px] text-on-surface-variant flex items-center gap-1.5">
                          <Icon name="self_care" className="text-[14px] text-on-surface" />
                          香水：{log.outfit.perfume.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Note (editable) */}
                  {editingId === log.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        aria-label="當日註記"
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitNote(log.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        placeholder="寫下今天的穿搭心得…"
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-none px-3 py-1.5 text-sm focus:ring-0 focus:border-on-surface outline-none"
                      />
                      <button type="button" onClick={() => commitNote(log.id)} className="text-primary" aria-label="儲存註記">
                        <Icon name="check" className="text-[20px]" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startNote(log)} className="flex items-center gap-1.5 text-left text-on-surface-variant hover:text-on-surface transition-colors" title="編輯註記">
                      <Icon name="edit_note" className="text-[16px]" />
                      <span className="font-body-md text-body-md text-[13px]">{log.note || "新增註記…"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onApply(log)}
                    className="w-full border border-on-surface text-on-surface py-2.5 kicker hover:bg-on-surface hover:text-background transition-colors"
                  >
                    載入至畫布預覽
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
