"use client";

import type { Makeup } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";
import { Kicker } from "@/components/ui/Editorial";

export function MakeupCard({ makeup, onSwap }: { makeup: Makeup; onSwap: () => void }) {
  const isMaleOnly = makeup.gender.includes("male") && !makeup.gender.includes("female");
  const title = isMaleOnly ? "THE GROOMING" : "THE FACE";
  const subtitle = isMaleOnly ? "推薦理容保養" : "推薦精緻妝容";

  return (
    <div className="lg:col-span-5 border border-outline-variant bg-surface-bright flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div>
          <Kicker className="text-primary">{title}</Kicker>
          <h3 className="font-headline-md text-headline-md text-[18px] text-on-surface mt-1">{subtitle}</h3>
        </div>
        <button
          type="button"
          onClick={onSwap}
          className="p-2.5 border border-outline-variant hover:border-on-surface transition-colors group"
          title="換一個妝容"
          aria-label="更換妝容"
        >
          <Icon name="sync" className="text-[18px] text-on-surface group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="aspect-[4/3] w-full overflow-hidden bg-surface-container relative">
        {makeup.makeupImageUrl ? (
          <SmartImage src={makeup.makeupImageUrl} alt={makeup.name} sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
        ) : null}
      </div>

      <div className="p-6 flex flex-col gap-5 flex-1">
        <div>
          <h4 className="font-headline-md text-headline-md text-[22px] text-on-surface">{makeup.name}</h4>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{makeup.focus}</p>
        </div>

        <div className="space-y-4 border-t border-outline-variant pt-5">
          <Detail label="眼妝設計" text={makeup.eye} />
          <Detail label="唇彩推薦" text={makeup.lip} />
          <Detail
            label="頰彩 & 打亮"
            text={[makeup.blush, makeup.highlight].filter(Boolean).join("・")}
          />
        </div>

        <div className="border-t border-outline-variant pt-5 mt-auto">
          <Kicker className="text-on-surface-variant mb-3 block">彩妝色系盤</Kicker>
          <div className="flex gap-2">
            {makeup.colors.map((col) => (
              <div
                key={col}
                className="w-8 h-8 rounded-[9999px] border border-outline-variant flex-shrink-0"
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 items-baseline">
      <h5 className="kicker text-on-surface-variant whitespace-nowrap">{label}</h5>
      <p className="font-body-md text-body-md text-[14px] text-on-surface leading-snug">{text}</p>
    </div>
  );
}
