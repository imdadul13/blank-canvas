import React from 'react';
import { motion } from 'motion/react';
import {
  History,
  Plus,
  KeyRound,
  Check,
  Stethoscope,
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
 * - Right circular gauge widget card with New Chat action
 */
export const MentorHeader: React.FC<MentorHeaderProps> = ({
  daysRemaining,
  sessionsCount,
  onOpenHistory,
  onNewSession,
  onOpenKeyConfig,
  isAiConfigured = null,
  activeMode = 'consultation',
  onModeChange,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="premium-page-hero relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.16),0_2px_8px_rgba(0,0,0,0.06)]"
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

      <div className="relative z-10 p-5 sm:p-6 lg:p-7 space-y-4">
        {/* Top Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 backdrop-blur-md border border-[rgba(60,60,67,0.08)] text-xs font-semibold text-[#007AFF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
            <span className="uppercase tracking-wider text-[10.5px] font-bold">Clinical Reasoning</span>
            <span className="text-[#C7C7CC]">·</span>
            <span className="text-[#3C3C43] font-normal hidden sm:inline">Differential Guidance</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {daysRemaining !== undefined && daysRemaining !== null && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-md border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>{daysRemaining}d to exam</span>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="Consultation history"
              className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#007AFF] stroke-[2.2] transition-transform group-hover:rotate-[-20deg]" />
              <span>{sessionsCount} {sessionsCount === 1 ? 'Case' : 'Cases'}</span>
            </button>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/80 backdrop-blur-md border border-sky-300 text-[#007AFF] shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>NBE Grounded</span>
            </div>
          </div>
        </div>

        {/* Main Row: Title & Subtitle + Mode Switcher + Right Gauge Widget */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 min-w-0 max-w-xl">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-[-0.03em] leading-tight text-[#1D1D1F]">
              Clinical Faculty <span className="text-[#007AFF]">&amp; AI Mentor</span>
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
                      ? 'bg-white text-[#007AFF] shadow-xs'
                      : 'text-[#3A3A3C]/70 hover:text-[#1D1D1F]'
                  }`}
                >
                  <Icon className={`w-3 h-3 shrink-0 ${activeMode === id ? 'text-[#007AFF]' : ''}`} />
                  <span className="sm:hidden">{compactLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Compact Circular Gauge Widget Card */}
          <div className="bg-white/70 backdrop-blur-md border border-white/85 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 sm:gap-4 shrink-0">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" stroke="#F2F2F7" strokeWidth="4.5" fill="none" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {isAiConfigured === null ? (
                  <span className="text-[10px] font-semibold text-[#8E8E93]">…</span>
                ) : isAiConfigured ? (
                  <Check className="size-5 text-[#147A38]" aria-hidden="true" />
                ) : (
                  <KeyRound className="size-5 text-[#96500A]" aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="text-xs font-bold text-[#1D1D1F] truncate" aria-live="polite">
                {isAiConfigured === null ? 'Checking AI setup' : isAiConfigured ? 'AI is ready' : 'AI setup needed'}
              </div>
              <button
                type="button"
                onClick={isAiConfigured ? onNewSession : onOpenKeyConfig}
                disabled={isAiConfigured === null || (!isAiConfigured && !onOpenKeyConfig)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isAiConfigured ? <Plus className="w-3.5 h-3.5 stroke-[2.8]" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>{isAiConfigured ? 'New Chat' : isAiConfigured === null ? 'Checking…' : 'Configure AI'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
