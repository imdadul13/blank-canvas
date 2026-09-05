import React from "react";
import { Search, Bookmark, Sparkles, Layers, ArrowUpRight } from "lucide-react";

interface TelegramQuickActionsProps {
  onSearchFocus: () => void;
  onGoToSaved: () => void;
  onGoToCrossChecks: () => void;
  onGoToSources: () => void;
}

export const TelegramQuickActions: React.FC<TelegramQuickActionsProps> = ({
  onSearchFocus,
  onGoToSaved,
  onGoToCrossChecks,
  onGoToSources,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
          Quick Actions
        </h3>
        <p className="text-xs text-slate-500">
          Get the most out of your knowledge bank.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Action 1: Search */}
        <button
          type="button"
          onClick={onSearchFocus}
          className="rounded-2xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00685f] border border-teal-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Search All Content
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Query clinical stems & tags
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
        </button>

        {/* Action 2: View Saved Items */}
        <button
          type="button"
          onClick={onGoToSaved}
          className="rounded-2xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                View Saved Items
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Access High-Yield Vault
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
        </button>

        {/* Action 3: AI Cross-Check */}
        <button
          type="button"
          onClick={onGoToCrossChecks}
          className="rounded-2xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                AI Cross-Check
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Audit disputed answer keys
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
        </button>

        {/* Action 4: Manage Sources */}
        <button
          type="button"
          onClick={onGoToSources}
          className="rounded-2xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Manage Sources
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Monitored channels & groups
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
        </button>
      </div>
    </div>
  );
};
