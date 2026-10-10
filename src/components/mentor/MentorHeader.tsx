import React from 'react';
import { motion } from 'motion/react';
import {
  History,
  Plus,
  KeyRound,
  Check,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Brain,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export type MentorTabMode = 'consultation' | 'quiz' | 'viva';

export interface MentorHeaderProps {
  daysRemaining?: number | null;
  sessionsCount: number;
  activeSessionTitle?: string;
  onOpenHistory: () => void;
  onNewSession: () => void;
  isGoldenHourMode?: boolean;
  onToggleGoldenHour?: () => void;
  onOpenKeyConfig?: () => void;
  isAiConfigured?: boolean | null;
  isAiStatusUnavailable?: boolean;
  onCheckAiStatus?: () => void;
  activeMode?: MentorTabMode;
  onModeChange?: (mode: MentorTabMode) => void;
  onBackToOverview?: () => void;
}

/**
 * Editorial Apple HIG Faculty Mentor Header.
 *
 * Distinct Signature Palette: Luminous Medical Sky & Azure
 * - Apple luminous azure daylight gradient with soft blue ambient glow
 * - Compact height with zero unnecessary clutter
 * - Compact, truthful AI engine status with a primary action
 */
export const MentorHeader: React.FC<MentorHeaderProps> = ({
  daysRemaining,
  sessionsCount,
  onOpenHistory,
  onNewSession,
  onOpenKeyConfig,
  isAiConfigured = null,
  isAiStatusUnavailable = false,
  onCheckAiStatus,
  activeMode = 'consultation',
  onModeChange,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mentor-hero premium-page-hero relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.16),0_2px_8px_rgba(0,0,0,0.06)]"
      style={{
        background: 'linear-gradient(135deg, #E0F7FA 0%, #BAE6FD 35%, #7DD3FC 68%, #93C5FD 100%)',
      }}
    >
      {/* Decorative right glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/2"
        style={{
          background: 'radial-gradient(ellipse at 80% 50%, rgba(56,189,248,0.32) 0%, rgba(14,165,233,0.16) 50%, transparent 70%)',
        }}
      />
      {/* Top inner shine */}
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[2rem] sm:rounded-t-[2.5rem]" />

      <div className="mentor-hero-inner relative z-10 p-5 sm:p-6 lg:p-7 space-y-4">
        {/* Top Metadata Row */}
        <div className="mentor-hero-meta flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="inline-flex max-w-full items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 backdrop-blur-md border border-[rgba(60,60,67,0.08)] text-xs font-semibold text-[var(--accent-ink)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
            <span className="uppercase tracking-wider text-[10.5px] font-bold">Clinical Reasoning</span>
            <span className="text-[#C7C7CC]">·</span>
            <span className="text-[#3C3C43] font-normal hidden sm:inline">Differential Guidance</span>
          </div>

          <div className="flex w-full min-w-0 items-center justify-between gap-1.5 sm:w-auto sm:justify-end sm:gap-2">
            {daysRemaining !== undefined && daysRemaining !== null && (
              <div className="hidden xs:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-md border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
                <span>{daysRemaining}d to exam</span>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="Consultation history"
              className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[var(--accent-ink)] stroke-[2.2] transition-transform group-hover:rotate-[-20deg]" />
              <span>{sessionsCount} {sessionsCount === 1 ? 'Case' : 'Cases'}</span>
            </button>

            <div className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-white/80 backdrop-blur-md border border-[color-mix(in_srgb,var(--accent)_24%,white)] text-[var(--accent-ink)] shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
              <span>NBE Grounded</span>
            </div>
          </div>
        </div>

        {/* Main Row: Title & Subtitle + Mode Switcher + Right Gauge Widget */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 min-w-0 max-w-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-[-0.03em] leading-tight text-[#1D1D1F]">
              Clinical Faculty <span className="text-[var(--accent-ink)]">&amp; AI Mentor</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-[#334155] font-medium leading-snug">
              Differential diagnosis, exam vignettes, and clinical reasoning grounded in NBE patterns.
            </p>

            {/* Apple Segmented Mode Switcher */}
            <div
              role="group"
              aria-label="Mentor mode"
              className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/80 bg-white/65 p-1 shadow-sm backdrop-blur-md sm:inline-flex sm:w-auto sm:overflow-visible"
              style={{ scrollbarWidth: 'none' }}
            >
              {([
                { id: 'consultation' as const, label: 'Consultation', compactLabel: 'Consult', icon: MessageSquare },
                { id: 'quiz' as const, label: '5Q Clinical Quiz', compactLabel: '5Q Quiz', icon: HelpCircle },
                { id: 'viva' as const, label: 'Differential Viva', compactLabel: 'Viva', icon: Brain },
              ]).map(({ id, label, compactLabel, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onModeChange?.(id)}
                  aria-label={label}
                  aria-pressed={activeMode === id}
                  className={`relative flex min-w-0 flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-[10px] font-bold transition-all cursor-pointer sm:flex-none sm:px-3 sm:py-1 sm:text-xs ${
                    activeMode === id
                      ? 'bg-white text-[var(--accent-ink)] shadow-xs'
                      : 'text-[#3A3A3C]/70 hover:text-[#1D1D1F]'
                  }`}
                >
                  <Icon className={`w-3 h-3 shrink-0 ${activeMode === id ? 'text-[var(--accent-ink)]' : ''}`} />
                  <span className="sm:hidden">{compactLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI engine state */}
          <div className="mentor-ai-status bg-white/70 backdrop-blur-md border border-white/85 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 sm:gap-4 shrink-0">
            <div className="mentor-ai-status-icon grid size-11 shrink-0 place-items-center rounded-2xl border border-[var(--color-hairline-soft)] bg-white/80">
              {isAiConfigured === null ? (
                <span className="text-[10px] font-semibold text-[#8E8E93]">…</span>
              ) : isAiConfigured ? (
                <Check className="size-5 text-[#147A38]" aria-hidden="true" />
              ) : (
                <KeyRound className="size-5 text-[#96500A]" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="text-xs font-bold text-[#1D1D1F] truncate" aria-live="polite">
                {isAiStatusUnavailable ? 'AI status unavailable' : isAiConfigured === null ? 'Checking AI setup' : isAiConfigured ? 'AI is ready' : 'AI setup needed'}
              </div>
              <button
                type="button"
                onClick={isAiStatusUnavailable ? onCheckAiStatus : isAiConfigured ? onNewSession : onOpenKeyConfig}
                disabled={isAiStatusUnavailable ? !onCheckAiStatus : isAiConfigured === null || (!isAiConfigured && !onOpenKeyConfig)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-ink)] hover:brightness-110 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isAiStatusUnavailable ? <RefreshCw className="w-3.5 h-3.5" /> : isAiConfigured ? <Plus className="w-3.5 h-3.5 stroke-[2.8]" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>{isAiStatusUnavailable ? 'Retry' : isAiConfigured ? 'New Chat' : isAiConfigured === null ? 'Checking…' : 'Configure AI'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
