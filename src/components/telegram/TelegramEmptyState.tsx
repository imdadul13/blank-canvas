import React from "react";
import { Send, Activity, BookOpen, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

interface TelegramEmptyStateProps {
  onConnect: () => void;
}

export const TelegramEmptyState: React.FC<TelegramEmptyStateProps> = ({ onConnect }) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm text-center max-w-3xl mx-auto space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto shadow-inner">
        <Send className="w-8 h-8 -translate-x-0.5 translate-y-0.5" />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Connect Telegram to Ingest High-Yield Clinical Content
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Stream official recall MCQs, image-based clinical questions, and exam bulletins directly from your monitored Telegram study groups into your ONE SHOT FMGE workspace.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Send className="w-4 h-4" />
          Connect Telegram Account
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Value Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-left">
        <div className="p-3.5 rounded-2xl bg-blue-500/[0.04] border border-blue-500/15 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <BookOpen className="w-4 h-4 text-[#007AFF]" />
            19 FMGE Subjects
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Content is automatically parsed and routed to its correct medical discipline with exam weightage.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-500/[0.04] border border-purple-500/15 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Activity className="w-4 h-4 text-[#5856D6] animate-pulse" />
            Gemini AI Cross-Check
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Clinical rationales are audited against Harrison’s and Robbins to detect disputed keys and exam traps.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            High-Yield Vault
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Star questions, radiology media, and pearls into your personal revision notebook with custom notes.
          </p>
        </div>
      </div>
    </div>
  );
};
