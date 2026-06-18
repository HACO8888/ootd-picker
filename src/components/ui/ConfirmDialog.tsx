"use client";

import { useRef, useState } from "react";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

export interface ConfirmRequest {
  /** Unique per invocation — used as React key so input state resets. */
  id: number;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Show a text input and return its value on confirm. */
  withInput?: boolean;
  inputPlaceholder?: string;
}

export interface ConfirmResult {
  ok: boolean;
  value?: string;
}

/** Editorial-styled replacement for native confirm()/prompt(). */
export function ConfirmDialog({
  request,
  onResolve,
}: {
  request: ConfirmRequest;
  onResolve: (result: ConfirmResult) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  useDialogA11y(panelRef, true, () => onResolve({ ok: false }));

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/60" onClick={() => onResolve({ ok: false })} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-sm bg-surface-bright border border-outline shadow-2xl p-6 flex flex-col gap-4 animate-scale-up"
      >
        <div>
          <Kicker className={request.danger ? "text-primary" : "text-on-surface-variant"}>
            {request.danger ? "CONFIRM" : "NOTICE"}
          </Kicker>
          {request.title && (
            <h2 id="confirm-dialog-title" className="font-headline-md text-headline-md text-on-surface mt-1">
              {request.title}
            </h2>
          )}
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">
          {request.message}
        </p>

        {request.withInput && (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={request.inputPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") onResolve({ ok: true, value });
            }}
            className="w-full bg-surface-container-low border border-outline-variant px-4 py-2.5 outline-none focus:border-on-surface transition-colors font-body-md text-on-surface"
          />
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => onResolve({ ok: false })}
            className="px-5 py-2.5 kicker text-on-surface-variant border border-outline-variant hover:border-on-surface hover:text-on-surface transition-colors"
          >
            {request.cancelLabel ?? "取消"}
          </button>
          <button
            type="button"
            onClick={() => onResolve({ ok: true, value })}
            className={
              request.danger
                ? "inline-flex items-center gap-2 px-5 py-2.5 kicker bg-primary text-on-primary hover:bg-surface-tint transition-colors"
                : "inline-flex items-center gap-2 px-5 py-2.5 kicker bg-on-surface text-background hover:opacity-90 transition-opacity"
            }
          >
            {request.danger && <Icon name="warning" className="text-[16px]" />}
            {request.confirmLabel ?? "確認"}
          </button>
        </div>
      </div>
    </div>
  );
}
