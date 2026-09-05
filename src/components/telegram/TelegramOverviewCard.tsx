import React from "react";
import { Database, HelpCircle, Image, Video, Sparkles, Layers } from "lucide-react";

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
    <div className="rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Branding & Explanation */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ECF7F5] text-[#00685f] flex items-center justify-center border border-[#d2ebe6] shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              Your Cloud Knowledge Bank
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              High-yield content from trusted Telegram channels, organized for your FMGE preparation.
            </p>
          </div>
        </div>

        {/* Right: Metrics Strip (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center gap-6 lg:gap-8 divide-x divide-stone-100 shrink-0">
          <div className="text-left pl-0">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {totalItems.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Total Items
            </div>
          </div>

          <div className="text-left pl-6 lg:pl-8">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {questionCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Questions
            </div>
          </div>

          <div className="text-left pl-6 lg:pl-8">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {imageCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Images
            </div>
          </div>

          <div className="text-left pl-6 lg:pl-8">
            <div className="font-mono text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
              {videoCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Videos
            </div>
          </div>

          <div className="text-left pl-6 lg:pl-8">
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
