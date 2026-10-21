"use client";

import { useEffect, useRef, useState } from "react";
import { AiError, requestStylist, stylistPayload, type StylistNote } from "@/lib/ai-client";
import type { Outfit } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type State = { status: "idle" } | { status: "loading" } | { status: "done"; note: StylistNote } | { status: "error"; message: string };

/**
 * "AI 造型師" — on demand, an LLM rewrites the engine's structured result into
 * a stylist's note. Mount with a `key` derived from the outfit so a swap or
 * regenerate resets it (no stale note for a different look).
 */
export function AiStylistPanel({ outfit }: { outfit: Outfit }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ status: "loading" });
    try {
      const note = await requestStylist(stylistPayload(outfit), ctrl.signal);
      if (!ctrl.signal.aborted) setState({ status: "done", note });
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setState({ status: "error", message: e instanceof AiError ? e.message : "AI 暫時無法回應，請稍後再試。" });
    }
  };

  return (
    <div className="border border-on-surface bg-surface-bright px-6 py-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="kicker text-primary inline-flex items-center gap-1.5">
          <Icon name="auto_awesome" className="text-[16px]" /> AI 造型師
        </p>
        {state.status !== "loading" && (
          <button
            type="button"
            onClick={ask}
            className="inline-flex items-center gap-1.5 kicker text-on-surface border border-on-surface px-3 py-1.5 hover:bg-on-surface hover:text-background transition-colors"
          >
            <Icon name={state.status === "idle" ? "chat" : "refresh"} className="text-[16px]" />
            {state.status === "idle" ? "請 AI 解說這套" : "重新解說"}
          </button>
        )}
      </div>

      {state.status === "idle" && (
        <p className="mt-3 font-body-md text-body-md text-[14px] text-on-surface-variant">
          讓 AI 造型師依今天的天氣、心情與場合，說明這套怎麼穿最好看。
        </p>
      )}
      {state.status === "loading" && (
        <p className="mt-3 font-body-md text-body-md text-[14px] text-on-surface-variant inline-flex items-center gap-2">
          <Icon name="progress_activity" className="text-[18px] animate-spin" /> 造型師正在構思解說…
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="mt-3 font-body-md text-body-md text-[14px] text-primary">
          {state.message}
        </p>
      )}
      {state.status === "done" && (
        <div className="mt-4 space-y-3">
          <h4 className="font-headline-md text-headline-md text-[20px] text-on-surface">{state.note.headline}</h4>
          <p className="font-body-md text-body-md text-[15px] text-on-surface leading-relaxed">{state.note.summary}</p>
          <ul className="space-y-2 border-t border-outline-variant pt-3">
            {state.note.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 font-body-md text-body-md text-[14px] text-on-surface-variant">
                <span className="kicker text-primary mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="font-body-md text-[12px] text-outline">由生成式 AI 撰寫，僅供參考。</p>
        </div>
      )}
    </div>
  );
}
