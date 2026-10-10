import React from "react";
import { Send, Cpu, Database, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

interface TelegramStatusCardsProps {
  isConnected: boolean;
  userProfile: { id: string; firstName: string; username?: string; phone: string } | null;
  workerHealth: { status: string; lastHeartbeat: string; activeSourcesCount: number; lastSync?: string };
  dbHealth: { status: string; totalMessages: number; totalQuestions: number; totalPearls: number };
  isStatusLoading: boolean;
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
  isStatusLoading,
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
  const isWorkerChecking = isStatusLoading || workerHealth.status.toUpperCase() === "CHECKING";
  const isDbChecking = isStatusLoading || dbHealth.status.toUpperCase() === "CHECKING";

  return (
    <>
      {/* DESKTOP STATUS CARDS: 3 COMPACT BALANCED CARDS */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3.5 lg:gap-4">
        {/* Card 1: Telegram Account */}
        <div className="h-full rounded-2xl sm:rounded-3xl border border-sky-200/80 bg-gradient-to-tr from-sky-500/[0.04] via-white to-blue-500/[0.02] p-4 sm:p-4.5 shadow-2xs flex items-center justify-between gap-3 hover:border-sky-300 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-xs shadow-sky-500/25 flex items-center justify-center shrink-0">
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
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isConnected ? "Cloud MTProto active" : "Standalone mode"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={isConnected ? onOpenManageModal || onOpenConnectModal : onOpenConnectModal}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-all self-center ${
              isConnected
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                : "bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-xs"
            }`}
          >
            {isConnected ? "Manage" : "Connect"}
          </button>
        </div>

        {/* Card 2: Ingestion Worker */}
        <div className="h-full rounded-2xl sm:rounded-3xl border border-blue-500/20 bg-gradient-to-tr from-blue-500/[0.04] via-white to-sky-500/[0.02] p-4 sm:p-4.5 shadow-2xs flex items-center justify-between gap-3 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#0284C7] text-white shadow-xs shadow-blue-500/25 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Ingestion Worker
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isWorkerRunning ? "bg-emerald-500" : isWorkerChecking ? "bg-slate-300" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold leading-tight ${
                    isWorkerRunning ? "text-emerald-700" : isWorkerChecking ? "text-slate-500" : "text-amber-700"
                  }`}
                >
                  {isWorkerRunning ? "Running" : isWorkerChecking ? "Checking…" : workerHealth.status.toUpperCase() === "UNAVAILABLE" ? "Unavailable" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {isWorkerRunning
                  ? `Active • ${workerHealth.activeSourcesCount} sources`
                  : isWorkerChecking ? "Checking service health" : "Worker status unavailable"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Last updated: {getRelativeTime(workerHealth.lastHeartbeat)}
              </div>
            </div>
          </div>

          <div className="self-center shrink-0">
            {onManualSync && isConnected ? (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isManualSyncing}
                className="px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-slate-700 border border-stone-200 text-xs font-medium cursor-pointer disabled:opacity-50"
                title="Trigger immediate sync check"
              >
                {isManualSyncing ? "Syncing..." : "Sync"}
              </button>
            ) : (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold font-mono ${
                isWorkerRunning ? "bg-blue-50 text-[#007AFF] border border-blue-200/80" : "bg-amber-50 text-amber-700 border border-amber-200/80"
              }`}>
              {isWorkerRunning ? "AUTO" : isWorkerChecking ? "CHECKING" : "IDLE"}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Database (PostgreSQL) */}
        <div className="h-full rounded-2xl sm:rounded-3xl border border-indigo-200/80 bg-gradient-to-tr from-indigo-500/[0.04] via-white to-purple-500/[0.02] p-4 sm:p-4.5 shadow-2xs flex items-center justify-between gap-3 hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs shadow-indigo-500/25 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Database (PostgreSQL)
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isDbHealthy ? "bg-emerald-500" : isDbChecking ? "bg-slate-300" : "bg-rose-500"
                  }`}
                />
                <span
                  className={`text-xs font-bold leading-tight ${
                    isDbHealthy ? "text-emerald-700" : isDbChecking ? "text-slate-500" : "text-rose-700"
                  }`}
                >
                  {isDbHealthy ? "Healthy" : isDbChecking ? "Checking…" : "Unavailable"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {isDbHealthy ? "All systems operational" : isDbChecking ? "Checking database health" : "Status unavailable"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {workerHealth.lastSync ? `Last synced: ${getRelativeTime(workerHealth.lastSync)}` : "Awaiting first sync"}
              </div>
            </div>
          </div>

          <div className="self-center shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold font-mono ${
              isDbHealthy ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : isDbChecking ? "bg-slate-50 text-slate-600 border border-slate-200/80" : "bg-rose-50 text-rose-700 border border-rose-200/80"
            }`}>
              {isDbHealthy ? "ONLINE" : isDbChecking ? "CHECKING" : "CHECK"}
            </span>
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/[0.08] text-[#007AFF] flex items-center justify-center shrink-0 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Ingestion Worker
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isWorkerRunning ? "bg-emerald-500" : isWorkerChecking ? "bg-slate-300" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    isWorkerRunning ? "text-emerald-700" : isWorkerChecking ? "text-slate-500" : "text-amber-700"
                  }`}
                >
                  {isWorkerRunning ? "Running" : isWorkerChecking ? "Checking…" : workerHealth.status.toUpperCase() === "UNAVAILABLE" ? "Unavailable" : "Offline"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isWorkerRunning ? "Processing new content" : isWorkerChecking ? "Checking service health" : "Worker status unavailable"}
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
                    isDbHealthy ? "bg-emerald-500" : isDbChecking ? "bg-slate-300" : "bg-rose-500"
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    isDbHealthy ? "text-emerald-700" : isDbChecking ? "text-slate-500" : "text-rose-700"
                  }`}
                >
                  {isDbHealthy ? "Healthy" : isDbChecking ? "Checking…" : "Unavailable"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isDbHealthy ? "All systems operational" : isDbChecking ? "Checking database health" : "Status unavailable"}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>
    </>
  );
};
