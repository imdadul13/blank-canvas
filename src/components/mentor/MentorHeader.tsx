import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Target, History, Plus, Stethoscope } from 'lucide-react';

interface MentorHeaderProps {
  daysRemaining?: number | null;
  sessionsCount: number;
  activeSessionTitle?: string;
  onOpenHistory: () => void;
  onNewSession: () => void;
}

export const MentorHeader: React.FC<MentorHeaderProps> = ({
  daysRemaining,
  sessionsCount,
  onOpenHistory,
  onNewSession,
}) => {
  const reducedMotion = useReducedMotion();
  const displayDays = daysRemaining !== undefined && daysRemaining !== null ? daysRemaining : 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#EEFBF7] p-4 sm:px-6 sm:py-3.5 shadow-xs"
    >
      {/* Dynamic Animated Ambient Faculty Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Soft glowing corner radial gradient orbs with breathing motion */}
        <motion.div
          animate={
            reducedMotion
              ? {}
              : {
                  scale: [1, 1.18, 1],
                  opacity: [0.35, 0.55, 0.35],
                  x: [0, 16, 0],
                }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/35 via-emerald-200/25 to-transparent blur-3xl"
        />
        <motion.div
          animate={
            reducedMotion
              ? {}
              : {
                  scale: [1.1, 1, 1.1],
                  opacity: [0.22, 0.42, 0.22],
                  y: [0, -10, 0],
                }
          }
          transition={{
            duration: 9.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-200/30 via-teal-100/20 to-transparent blur-3xl"
        />
        <div className="absolute -top-12 left-1/3 h-52 w-96 rounded-full bg-gradient-to-r from-teal-200/20 via-emerald-100/15 to-transparent blur-3xl" />

        {/* Subtle Precision Clinical Calibration Dot & Cross Pattern */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.035] text-teal-950 pointer-events-none select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="mentor-calibration-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 15 11 L 15 19 M 11 15 L 19 15" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="15" cy="15" r="0.8" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mentor-calibration-grid)" />
        </svg>

        {/* Bespoke Clinical Faculty Diagnostic & Stethoscope Vector Artwork */}
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[480px] overflow-hidden opacity-40 sm:opacity-55 md:opacity-[0.68] select-none pointer-events-none block">
          <svg viewBox="0 0 480 140" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
            <defs>
              <linearGradient id="mentor-chart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#E6FFFA" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#B2F5EA" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="mentor-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="40%" stopColor="#94A3B8" />
                <stop offset="70%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="mentor-steth-tube-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="50%" stopColor="#00685F" />
                <stop offset="100%" stopColor="#044E48" />
              </linearGradient>
              <radialGradient id="mentor-halo-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#0D9488" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#004D40" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ambient Wisdom Halo */}
            <motion.circle
              cx="375"
              cy="70"
              r="62"
              fill="url(#mentor-halo-glow)"
              animate={reducedMotion ? {} : { scale: [1, 1.16, 1], opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* ═══ 1. CLINICAL CONSULTATION DOSSIER / VIGNETTE CHART ═══ */}
            <g transform="translate(345, 42) rotate(-5)">
              <rect x="-65" y="-10" width="130" height="92" rx="7" fill="#0F766E" opacity="0.3" />
              <rect x="-60" y="-6" width="120" height="85" rx="5" fill="url(#mentor-chart-grad)" stroke="#99F6E4" strokeWidth="0.8" />
              <rect x="-24" y="-12" width="48" height="12" rx="3" fill="url(#mentor-metal-grad)" />
              <circle cx="0" cy="-6" r="2.5" fill="#334155" />

              {/* Consultation text mock lines */}
              <g stroke="#0F766E" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round">
                <line x1="-50" y1="12" x2="10" y2="12" />
                <line x1="-50" y1="18" x2="35" y2="18" />
                <line x1="-50" y1="24" x2="45" y2="24" />
                <line x1="-50" y1="30" x2="-5" y2="30" />
              </g>

              {/* Real-time ECG Trace on Sheet */}
              <path
                d="M -50 52 L -32 52 L -28 44 L -24 62 L -20 38 L -16 58 L -12 52 L 2 52 L 6 46 L 10 56 L 14 52 L 48 52"
                stroke="#00685F"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.85"
              />
            </g>

            {/* ═══ 2. CLINICAL STETHOSCOPE ═══ */}
            <g transform="translate(370, 75)">
              <path
                d="M -85 -35 C -75 -65, -35 -70, -10 -60"
                stroke="url(#mentor-metal-grad)"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M -60 -30 C -52 -55, -20 -62, 5 -55"
                stroke="url(#mentor-metal-grad)"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Flexible Tubing */}
              <path
                d="M -5 -58 C 15 -52, 22 -35, 12 -15 C 2 5, -15 25, 0 45 C 12 60, 45 45, 65 20"
                stroke="url(#mentor-steth-tube-grad)"
                strokeWidth="4.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Stethoscope Chestpiece */}
              <g transform="translate(65, 20)">
                <rect x="-8" y="-3" width="8" height="6" rx="1.5" fill="url(#mentor-metal-grad)" />
                <circle r="16" fill="url(#mentor-metal-grad)" stroke="#0F766E" strokeWidth="1" />
                <circle r="12.5" fill="#004D40" />
                <circle r="10.5" fill="url(#mentor-metal-grad)" opacity="0.4" />
                <circle r="4" fill="#0D9488" />
                <circle r="1.5" fill="#FFFFFF" />

                {/* Pulse wave concentric rings */}
                {!reducedMotion && (
                  <>
                    <motion.circle
                      r="16"
                      stroke="#2DD4BF"
                      strokeWidth="1.5"
                      fill="none"
                      animate={{ scale: [1, 1.8], opacity: [0.85, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.circle
                      r="16"
                      stroke="#14B8A6"
                      strokeWidth="1.2"
                      fill="none"
                      animate={{ scale: [1, 2.3], opacity: [0.65, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                    />
                  </>
                )}
              </g>
            </g>

            {/* ═══ 3. HOLOGRAPHIC DIAGNOSTIC PULSE WAVE ═══ */}
            <motion.path
              d="M 160 115 L 205 115 L 213 100 L 221 130 L 229 92 L 237 125 L 243 115 L 285 115"
              stroke="#0D9488"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.8"
              animate={reducedMotion ? {} : { opacity: [0.4, 0.95, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Conduction Runner Dot */}
            {!reducedMotion && (
              <motion.circle
                r="3"
                fill="#00685F"
                animate={{
                  cx: [160, 205, 213, 221, 229, 237, 243, 285],
                  cy: [115, 115, 100, 130, 92, 125, 115, 115],
                  opacity: [0, 0.8, 1, 1, 1, 1, 0.8, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Floating Clinical Particle Blips */}
            <motion.circle cx="310" cy="45" r="2" fill="#2DD4BF" animate={reducedMotion ? {} : { opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
            <motion.circle cx="440" cy="55" r="1.5" fill="#14B8A6" animate={reducedMotion ? {} : { opacity: [0.1, 0.7, 0.1] }} transition={{ duration: 3.8, repeat: Infinity, delay: 0.8 }} />
            <motion.circle cx="280" cy="85" r="1.8" fill="#0D9488" animate={reducedMotion ? {} : { opacity: [0.2, 0.75, 0.2] }} transition={{ duration: 2.7, repeat: Infinity, delay: 1.4 }} />
          </svg>
        </div>
      </div>

      {/* Content Layout Matching Editorial Design System */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-xl">
            {/* Clean Unboxed Eyebrow */}
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#00685f] font-mono block">
              Clinical AI Faculty Mentor
            </span>

            {/* Heading with Minimal Insignia */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-50/90 border border-teal-100/90 text-[#00685F] shadow-2xs shrink-0">
                <Stethoscope className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#00685F] stroke-[2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-[26px] font-semibold font-['Newsreader'] tracking-tight bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-900 bg-clip-text text-transparent leading-snug">
                  Faculty Mentor
                </h1>
                <p className="text-xs sm:text-sm text-[#3d4947] leading-normal line-clamp-1 sm:line-clamp-none">
                  High-yield clinical explanations, complete exam vignettes, differential reasoning, and targeted remediation.
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Controls: Target Days Badge, History Drawer Trigger, New Chat Action */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap pt-1 md:pt-0 shrink-0">
            {/* Days to FMGE Target Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs backdrop-blur-sm shrink-0">
              <div className="h-7 w-7 rounded-xl bg-teal-500/10 text-[#00685F] flex items-center justify-center shrink-0">
                <Target className="h-3.5 w-3.5" />
              </div>
              <div className="leading-tight text-left">
                <span className="text-xs sm:text-sm font-extrabold text-stone-900 font-['Outfit'] tabular-nums">
                  {displayDays}d
                </span>
                <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium ml-1">to FMGE</span>
              </div>
            </div>

            {/* Saved History Trigger Button */}
            <motion.button
              type="button"
              whileHover={reducedMotion ? undefined : { scale: 1.02, y: -1 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-stone-200/80 bg-white/90 hover:bg-[#FAF5F2] hover:border-[#B57B66]/40 text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#B57B66] shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-sm group shrink-0"
              title="Open saved consultations history"
            >
              <History className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-stone-500 group-hover:text-[#B57B66] group-hover:rotate-[-20deg] transition-transform" />
              <span className="whitespace-nowrap">History</span>
              <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-[10px] sm:text-[11px] font-mono font-bold text-[#00685F] border border-teal-200/60">
                {sessionsCount}
              </span>
            </motion.button>

            {/* New Chat Action Button */}
            <motion.button
              type="button"
              whileHover={reducedMotion ? undefined : { scale: 1.02, y: -1 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              onClick={onNewSession}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#00685F] hover:bg-[#00554E] hover:shadow-md active:scale-97 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer group shrink-0"
              title="Start a new consultation session"
            >
              <Plus className="h-3.5 sm:h-4 w-3.5 sm:w-4 group-hover:rotate-90 transition-transform duration-200" />
              <span className="whitespace-nowrap">New Chat</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
