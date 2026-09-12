import React from "react";
import { Sparkles, Award, FileText, Image as ImageIcon, Video as VideoIcon, Lightbulb, Bell, CheckCircle } from "lucide-react";
import { KnowledgeBankCounts } from "../../types";

interface TelegramOverviewCardProps {
  counts?: KnowledgeBankCounts;
  totalItems?: number;
  channelCount?: number;
}

export const TelegramOverviewCard: React.FC<TelegramOverviewCardProps> = ({
  counts,
  channelCount = 0,
}) => {
  const total = counts?.totalCurated ?? 0;
  const pearls = counts?.examPearls ?? 0;
  const questions = counts?.questions ?? 0;
  const images = counts?.imageSpotters ?? 0;
  const videos = counts?.videos ?? 0;
  const tips = counts?.clinicalTips ?? 0;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-teal-100/90 bg-gradient-to-br from-white via-white to-teal-50/30 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        {/* Left: ONE SHOT CURATED Branding */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center border border-[#00685f]/20 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#00685f]">
                ONE SHOT CURATED
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                {total > 0 ? "Noise Filtered" : "Ready to Sync"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit'] mt-0.5">
              {total > 0 ? (
                <span>
                  <strong className="text-[#00685f]">{total}</strong> worth reviewing
                </span>
              ) : (
                <span className="text-slate-600 font-medium text-sm sm:text-base">Nothing new worth reviewing yet.</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {total > 0
                ? `High-yield FMGE pearls and clinical recall questions curated from ${channelCount || "verified"} subscribed sources.`
                : "Sync your subscribed channels to ingest and filter incoming clinical materials."}
            </p>
          </div>
        </div>

        {/* Right: Real Educational Metrics Strip (Desktop / Tablet) */}
        {total > 0 ? (
          <div className="hidden sm:flex items-center flex-wrap gap-3 sm:gap-4 lg:gap-6 divide-x divide-stone-100 shrink-0">
            {pearls > 0 && (
              <div className="text-left pl-0">
                <div className="flex items-center gap-1.5 font-mono text-lg lg:text-xl font-bold text-rose-700 tracking-tight">
                  <Award className="w-4 h-4 text-rose-600" />
                  <span>{pearls}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500">Exam Pearls</div>
              </div>
            )}

            {questions > 0 && (
              <div className={`text-left ${pearls > 0 ? "pl-3 sm:pl-4 lg:pl-6" : "pl-0"}`}>
                <div className="flex items-center gap-1.5 font-mono text-lg lg:text-xl font-bold text-[#00685f] tracking-tight">
                  <FileText className="w-4 h-4 text-[#00685f]" />
                  <span>{questions}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500">Clinical Questions</div>
              </div>
            )}

            {images > 0 && (
              <div className="text-left pl-3 sm:pl-4 lg:pl-6">
                <div className="flex items-center gap-1.5 font-mono text-lg lg:text-xl font-bold text-teal-700 tracking-tight">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>{images}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500">Image Spotters</div>
              </div>
            )}

            {videos > 0 && (
              <div className="text-left pl-3 sm:pl-4 lg:pl-6">
                <div className="flex items-center gap-1.5 font-mono text-lg lg:text-xl font-bold text-purple-700 tracking-tight">
                  <VideoIcon className="w-4 h-4 text-purple-600" />
                  <span>{videos}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500">Clinical Videos</div>
              </div>
            )}

            {tips > 0 && (
              <div className="text-left pl-3 sm:pl-4 lg:pl-6">
                <div className="flex items-center gap-1.5 font-mono text-lg lg:text-xl font-bold text-amber-700 tracking-tight">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>{tips}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500">Rapid Tips</div>
              </div>
            )}
          </div>
        ) : null}

        {/* Mobile Metrics Strip */}
        {total > 0 && (
          <div className="sm:hidden grid grid-cols-3 gap-2 pt-2 border-t border-teal-100/80">
            {pearls > 0 && (
              <div className="bg-rose-50/60 rounded-xl p-2 text-center border border-rose-100">
                <div className="font-mono text-sm font-bold text-rose-800">{pearls}</div>
                <div className="text-[10px] text-rose-600 font-medium">Pearls</div>
              </div>
            )}
            {questions > 0 && (
              <div className="bg-teal-50/60 rounded-xl p-2 text-center border border-teal-100">
                <div className="font-mono text-sm font-bold text-teal-800">{questions}</div>
                <div className="text-[10px] text-teal-600 font-medium">Questions</div>
              </div>
            )}
            {images > 0 && (
              <div className="bg-sky-50/60 rounded-xl p-2 text-center border border-sky-100">
                <div className="font-mono text-sm font-bold text-sky-800">{images}</div>
                <div className="text-[10px] text-sky-600 font-medium">Spotters</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
