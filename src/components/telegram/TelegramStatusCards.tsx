import React from "react";
import { Send, Cpu, Database, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

interface TelegramStatusCardsProps {
  isConnected: boolean;
  userProfile: { id: string; firstName: string; username?: string; phone: string } | null;
  workerHealth: { status: string; lastHeartbeat: string; activeSourcesCount: number; lastSync?: string };
  dbHealth: { status: string; totalMessages: number; totalQuestions: number; totalPearls: number };
  onOpenConnectModal: () => void;
  onOpenManageModal?: () => void;
  onManualSync?: () => void;
  isManualSyncing?: boolean;
}

export const TelegramStatusCards: React.FC<TelegramStatusCardsProps> = ({
  isConnected,
  userProfile,
  workerHealth,
  dbHealth,
  onOpenConnectModal,
  onOpenManageModal,
  onManualSync,
  isManualSyncing,
}) => {
  // Helper to format relative time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "just now";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.max(1, Math.round(diffMs / 60000));
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return "today";
  };

  const isWorkerRunning = workerHealth.status.toUpperCase() === "ONLINE" || workerHealth.status.toUpperCase() === "RUNNING";
  const isDbHealthy = dbHealth.status.toUpperCase() === "CONNECTED" || dbHealth.status.toUpperCase() === "HEALTHY";

  return (
    <>
      {/* DESKTOP STATUS CARDS: 3 COMPACT CARDS */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3.5">
        {/* Card 1: Telegram Account */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Telegram Account
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isConnected ? "bg-emerald-500" : "bg-stone-300"
                  }`}
                />
                <span
                  className={`text-xs font-bold leading-tight truncate ${
                    isConnected ? "text-emerald-700" : "text-stone-600"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {isConnected
                  ? userProfile?.firstName
                    ? `${userProfile.firstName} • Live`
                    : "Live ingestion active"
                  : "Tap to connect account"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={isConnected ? onOpenManageModal || onOpenConnectModal : onOpenConnectModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all ${
              isConnected
                ? "bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200"
                : "bg-[#00685f] hover:bg-[#005049] text-white shadow-xs"
            }`}
          >
            {isConnected ? "Manage" : "Connect"}
          </button>
        </div>

        {/* Card 2: Ingestion Worker */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00685f] flex items-center justify-center shrink-0 border border-teal-100/70">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Ingestion Worker
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isWorkerRunning ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold leading-tight ${
                    isWorkerRunning ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isWorkerRunning ? "Running" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {isWorkerRunning
                  ? `Active • ${workerHealth.activeSourcesCount} sources`
                  : "Worker standing by"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Last updated: {getRelativeTime(workerHealth.lastHeartbeat)}
              </div>
            </div>
          </div>

          {onManualSync && isConnected && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isManualSyncing}
              className="px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-slate-700 border border-stone-200 text-xs font-medium cursor-pointer shrink-0 disabled:opacity-50"
              title="Trigger immediate sync check"
            >
              {isManualSyncing ? "Syncing..." : "Sync"}
            </button>
          )}
        </div>

        {/* Card 3: Database (PostgreSQL) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/70">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Database (PostgreSQL)
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isDbHealthy ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <span
                  className={`text-xs font-bold leading-tight ${
                    isDbHealthy ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {isDbHealthy ? "Healthy" : "Error"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {isDbHealthy ? "All systems operational" : "Check database connection"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Last synced: {getRelativeTime(workerHealth.lastHeartbeat)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE TOUCH-FRIENDLY STATUS STACK */}
      <div className="sm:hidden space-y-2.5">
        {/* Mobile Card 1: Telegram Account */}
        <div
          onClick={isConnected ? onOpenManageModal || onOpenConnectModal : onOpenConnectModal}
          className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs flex items-center justify-between gap-3 active:bg-stone-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Telegram Account
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isConnected ? "bg-emerald-500" : "bg-stone-300"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    isConnected ? "text-emerald-700" : "text-stone-500"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isConnected ? "Live ingestion active" : "Tap to connect"}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Mobile Card 2: Ingestion Worker */}
        <div
          onClick={onManualSync}
          className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs flex items-center justify-between gap-3 active:bg-stone-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00685f] flex items-center justify-center shrink-0 border border-teal-100/70">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Ingestion Worker
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isWorkerRunning ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    isWorkerRunning ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isWorkerRunning ? "Running" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isWorkerRunning ? "Processing new content" : "Offline"}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Mobile Card 3: Database (PostgreSQL) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/70">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Database (PostgreSQL)
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isDbHealthy ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    isDbHealthy ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {isDbHealthy ? "Healthy" : "Error"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                All systems operational
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>
    </>
  );
};
