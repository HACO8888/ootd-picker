"use client";

import Image from "next/image";
import { TRANSLATE } from "@/lib/data";
import type { Perfume } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Editorial";

export function PerfumeCard({ perfume, onSwap }: { perfume: Perfume; onSwap: () => void }) {
  return (
    <div className="border border-outline-variant bg-surface-bright">
      <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div>
          <Kicker className="text-primary">THE SCENT</Kicker>
          <h3 className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">推薦今日香水</h3>
        </div>
        <button
          type="button"
          onClick={onSwap}
          className="p-2.5 border border-outline-variant hover:border-on-surface transition-colors group"
          title="換一瓶香水"
          aria-label="更換香水"
        >
          <Icon name="sync" className="text-[18px] text-on-surface group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-[4/3] md:aspect-auto md:min-h-[320px] overflow-hidden bg-surface-container relative border-b md:border-b-0 md:border-r border-outline-variant">
          <Image src={perfume.perfumeImageUrl} alt={perfume.name} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-5">
          <div>
            <span className="kicker text-on-surface-variant">{perfume.intensity}</span>
            <h4 className="font-headline-lg text-headline-lg text-[28px] text-on-surface mt-2">{perfume.name}</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">{perfume.style}</p>
          </div>

          <div className="border-t border-outline-variant pt-5 space-y-4">
            <Note label="前調 TOP" text={perfume.topNote} />
            <Note label="中調 HEART" text={perfume.heartNote} />
            <Note label="後調 BASE" text={perfume.baseNote} />
          </div>

          <div className="border-t border-outline-variant pt-5 mt-auto grid grid-cols-[auto_1fr] gap-4 items-baseline">
            <Kicker className="text-on-surface-variant whitespace-nowrap">適合對象</Kicker>
            <p className="font-body-md text-body-md text-on-surface">
              {perfume.gender.map((g) => TRANSLATE.gender[g]).join("・")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 items-baseline">
      <h5 className="kicker text-on-surface-variant whitespace-nowrap">{label}</h5>
      <p className="font-body-md text-body-md text-[14px] text-on-surface">{text}</p>
    </div>
  );
}
