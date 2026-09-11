import React from "react";
import { Database, HelpCircle, Image, Video, Layers } from "lucide-react";

interface TelegramOverviewCardProps {
  totalItems: number;
  questionCount: number;
  imageCount: number;
  videoCount: number;
  pearlCount: number;
  channelCount?: number;
}

export const TelegramOverviewCard: React.FC<TelegramOverviewCardProps> = ({
  totalItems,
  questionCount,
  imageCount,
  videoCount,
  pearlCount,
  channelCount,
}) => {
  // Mobile short compact format (e.g. 12.8K or exact)
  const formatCompact = (n: number) => {
    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return n.toString();
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5">
        {/* Left: Branding & Explanation */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/90 shadow-2xs shrink-0">
            <Database className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight bg-gradient-to-r from-slate-900 to-sky-900 bg-clip-text text-transparent font-['Outfit']">
                CLOUD INGESTION REPOSITORY
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono tracking-widest uppercase bg-sky-50 text-sky-700 border border-sky-200/80">
                LIVE METRICS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
              High-yield content from trusted Telegram channels, organized for your FMGE preparation.
            </p>
          </div>
        </div>

        {/* Right: Metrics Strip (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center flex-wrap gap-4 sm:gap-5 lg:gap-7 divide-x divide-stone-100 shrink-0">
          <div className="text-left pl-0">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {totalItems.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Total Items
            </div>
          </div>

          <div className="text-left pl-4 sm:pl-5 lg:pl-7">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {questionCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Questions
            </div>
          </div>

          <div className="text-left pl-4 sm:pl-5 lg:pl-7">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {imageCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Images
            </div>
          </div>

          <div className="text-left pl-4 sm:pl-5 lg:pl-7">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {videoCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Videos
            </div>
          </div>

          <div className="text-left pl-4 sm:pl-5 lg:pl-7">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {pearlCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Exam Pearls
            </div>
          </div>
        </div>

        {/* Mobile Metrics Grid */}
        <div className="sm:hidden grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-2.5 text-center">
            <div className="font-mono text-base font-bold text-slate-900">
              {formatCompact(totalItems)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Items</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-2.5 text-center">
            <div className="font-mono text-base font-bold text-slate-900">
              {formatCompact(questionCount)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Questions</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-2.5 text-center">
            <div className="font-mono text-base font-bold text-slate-900">
              {formatCompact(imageCount)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Images</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-2.5 text-center">
            <div className="font-mono text-base font-bold text-slate-900">
              {formatCompact(videoCount)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Videos</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-2.5 text-center col-span-2">
            <div className="font-mono text-base font-bold text-slate-900">
              {formatCompact(pearlCount)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Exam Pearls</div>
          </div>
        </div>
      </div>
    </div>
  );
};
