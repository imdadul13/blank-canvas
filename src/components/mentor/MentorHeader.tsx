import React from 'react';
import { motion } from 'motion/react';
import {
  History,
  Plus,
  Stethoscope,
  MessageSquare,
  HelpCircle,
  Brain,
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
  isAiConfigured?: boolean;
  activeMode?: MentorTabMode;
  onModeChange?: (mode: MentorTabMode) => void;
}

/**
 * Editorial Apple HIG Faculty Mentor Header.
 *
 * Streamlined, clean, and balanced — matching the structure of the
 * Performance & Error Vault banners. Deep rich dark Pine/Teal gradient,
 * squircle icon tile, crisp white typography, frosted glass pills, and tactile actions.
 */
export const MentorHeader: React.FC<MentorHeaderProps> = ({
  sessionsCount,
  onOpenHistory,
  onNewSession,
  activeMode = 'consultation',
  onModeChange,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="relative overflow-hidden rounded-3xl border border-black/[0.08]"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 35%, #BFDBFE 70%, #3B82F6 100%)',
        boxShadow: '0 4px 24px rgba(0,122,255,0.08), 0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Decorative ambient highlights */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-2/3"
        style={{ background: 'radial-gradient(ellipse at 85% 30%, rgba(0,122,255,0.18) 0%, transparent 65%)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/40 to-transparent" />

      <div className="relative z-10 px-5 sm:px-7 py-5 sm:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Eyebrow, Title, Subtitle, and Pill Tabs */}
        <div className="space-y-3 min-w-0 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/80 shadow-2xs border border-[#007AFF]/20 flex items-center justify-center shrink-0">
              <Stethoscope className="h-3.5 w-3.5 text-[#007AFF]" />
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#007AFF]">
              Clinical Reasoning · Differential Guidance
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F] leading-tight">
              Clinical Faculty Mentor
            </h1>
            <p className="text-[12.5px] sm:text-[13px] text-[#334155] leading-relaxed max-w-md font-medium">
              Differential diagnosis, exam vignettes, and clinical reasoning grounded in NBE patterns.
            </p>
          </div>

          {/* Apple Segmented Mode Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-white/85 backdrop-blur-md rounded-full border border-black/[0.08] shadow-2xs">
            {([
              { id: 'consultation' as const, label: 'Consultation', icon: MessageSquare },
              { id: 'quiz' as const, label: '5Q Clinical Quiz', icon: HelpCircle },
              { id: 'viva' as const, label: 'Differential Viva', icon: Brain },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange?.(id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                  activeMode === id
                    ? 'bg-white text-[#007AFF] shadow-xs'
                    : 'text-[#475569] hover:text-[#1D1D1F]'
                }`}
              >
                <Icon className={`size-3 shrink-0 ${activeMode === id ? 'text-[#007AFF]' : ''}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions + 100% GROUNDED Circular Dial & 3 Bullets */}
        <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-3.5 shrink-0">
          {/* Top Actions Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="Consultation history"
              className="group inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-full bg-white/90 hover:bg-white text-[#1D1D1F] border border-black/[0.08] text-[12px] font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs backdrop-blur-md"
            >
              <History className="size-3 text-[#007AFF] stroke-[2.4] transition-transform group-hover:rotate-[-20deg]" />
              <span>{sessionsCount} {sessionsCount === 1 ? 'Consultation' : 'Consultations'}</span>
            </button>

            <button
              type="button"
              onClick={onNewSession}
              aria-label="New Chat"
              className="group inline-flex items-center gap-1.5 h-8.5 px-4 rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white text-[12px] font-bold shadow-[0_4px_14px_rgba(0,122,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Plus className="size-3 stroke-[2.8] transition-transform group-hover:rotate-90 duration-200" />
              <span>New Chat</span>
            </button>
          </div>

          {/* 100% GROUNDED Circular Gauge + 3 Colored Bullets */}
          <div className="flex items-center gap-4 bg-white/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-black/[0.08] shadow-2xs">
            {/* Circular Gauge */}
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-blue-50/80 to-white border-2 border-[#007AFF]/30 flex flex-col items-center justify-center shrink-0 shadow-2xs">
              <span className="text-[13px] font-black font-mono text-[#007AFF] leading-none">
                100%
              </span>
              <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-[#007AFF] mt-0.5">
                GROUNDED
              </span>
            </div>

            <div className="h-9 w-px bg-black/[0.08] shrink-0" />

            {/* 3 Bullets with Colored Dots */}
            <div className="space-y-1 text-[11.5px] font-semibold text-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#10B981] shrink-0" />
                <span>NBE Clinical Vignettes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#3B82F6] shrink-0" />
                <span>Gold Standard DOCs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#F59E0B] shrink-0" />
                <span>Differential Checkpoints</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
