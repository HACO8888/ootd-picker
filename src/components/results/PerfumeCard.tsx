"use client";

import Image from "next/image";
import { TRANSLATE } from "@/lib/data";
import type { Perfume } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

export function PerfumeCard({ perfume, onSwap }: { perfume: Perfume; onSwap: () => void }) {
  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-rose-50/40 to-purple-50/60 rounded-lg p-8 border border-outline-variant/20 shadow-sm">
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4 mb-6">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="self_care" className="text-[#7d562d]" /> 推薦今日香水
        </h3>
        <span className="text-xs text-on-surface-variant bg-white/70 px-3 py-1 rounded-full border border-outline-variant/20">
          根據您的性別與心情精選
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-5">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-surface-container shadow-sm border border-outline-variant/10 relative">
            <Image src={perfume.perfumeImageUrl} alt={perfume.name} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
          </div>
          <div className="bg-white/80 backdrop-blur p-5 rounded-xl border border-outline-variant/20 space-y-2 relative group">
            <button
              onClick={onSwap}
              className="absolute top-4 right-4 p-2 rounded-full border border-outline-variant/30 hover:bg-primary-container/20 hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100 bg-white/50"
              title="換一瓶香水"
              aria-label="更換香水"
            >
              <Icon name="sync" className="text-[20px] text-[#7d562d] group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <span className="text-xs font-semibold tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full inline-block">
              {perfume.intensity}
            </span>
            <h4 className="font-headline-md text-headline-md text-[22px] text-on-surface leading-none mt-2 pr-8">{perfume.name}</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed pr-8">{perfume.style}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-center">
          <div className="bg-white/70 p-5 rounded-xl border border-outline-variant/15 space-y-4">
            <Note emoji="🌿" wrap="bg-amber-100" label="前調 Top Note" text={perfume.topNote} />
            <Note emoji="🌸" wrap="bg-rose-100" label="中調 Heart Note" text={perfume.heartNote} />
            <Note emoji="🌰" wrap="bg-stone-100" label="後調 Base Note" text={perfume.baseNote} />
          </div>
          <div className="bg-white/70 p-4 rounded-xl border border-outline-variant/15 text-center space-y-1">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">適合對象</p>
            <p className="text-sm text-on-surface font-medium">
              {perfume.gender.map((g) => TRANSLATE.gender[g]).join("・")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Note({ emoji, wrap, label, text }: { emoji: string; wrap: string; label: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${wrap}`}>
        <span className="text-sm">{emoji}</span>
      </div>
      <div>
        <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">{label}</h5>
        <p className="text-sm text-on-surface">{text}</p>
      </div>
    </div>
  );
}
