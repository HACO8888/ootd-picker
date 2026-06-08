"use client";

import Image from "next/image";
import type { Makeup } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

export function MakeupCard({ makeup, onSwap }: { makeup: Makeup; onSwap: () => void }) {
  const isMaleOnly = makeup.gender.includes("male") && !makeup.gender.includes("female");
  const title = isMaleOnly ? "推薦理容保養" : "推薦精緻妝容";

  return (
    <div className="lg:col-span-5 bg-surface-container/50 rounded-lg p-8 border border-outline-variant/20 shadow-sm flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="auto_awesome" className="text-secondary" /> {title}
        </h3>
      </div>

      <div className="space-y-6 flex-1 flex flex-col">
        <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-surface-container shadow-sm border border-outline-variant/10 relative">
          <Image src={makeup.makeupImageUrl} alt={makeup.name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
        </div>

        <div className="bg-white/80 backdrop-blur p-5 rounded-xl border border-outline-variant/20 space-y-4 relative group">
          <button
            onClick={onSwap}
            className="absolute top-4 right-4 p-2 rounded-full border border-outline-variant/30 hover:bg-primary-container/20 hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100"
            title="換一個妝容"
            aria-label="更換妝容"
          >
            <Icon name="sync" className="text-[20px] text-on-surface-variant group-hover:rotate-180 transition-transform duration-300" />
          </button>
          <span className="text-xs font-semibold tracking-wider bg-secondary/15 text-secondary px-3 py-1 rounded-full inline-block">
            主題風格
          </span>
          <h4 className="font-headline-md text-headline-md text-[22px] text-on-surface leading-none mt-1">{makeup.name}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pr-8">
            <strong className="text-on-surface">妝容特點:</strong> {makeup.focus}
          </p>
        </div>

        <div className="space-y-4">
          <Detail icon="eye_care" label="眼妝設計" text={makeup.eye} />
          <Detail icon="lips" label="唇彩推薦" text={makeup.lip} />
          <Detail icon="face" label="頰彩 & 打亮" text={makeup.blush} />
        </div>

        <div className="border-t border-outline-variant/20 pt-6 mt-auto">
          <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">搭配彩妝色系盤</h5>
          <div className="flex gap-2">
            {makeup.colors.map((col) => (
              <div
                key={col}
                className="w-8 h-8 rounded-full border border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <Icon name={icon} className="text-secondary mt-0.5" />
      <div className="space-y-1">
        <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</h5>
        <p className="font-body-md text-body-md text-on-surface leading-snug">{text}</p>
      </div>
    </div>
  );
}
