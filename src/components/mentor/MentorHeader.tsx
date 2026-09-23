import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Target, History, Plus, Stethoscope, GraduationCap } from 'lucide-react';
import { useCircadianTheme } from '../../hooks/useCircadianTheme';
import { CircadianHeaderAtmosphere, CircadianPill } from '../CircadianHeaderAtmosphere';
import { HeaderTabInsignia } from '../HeaderTabInsignia';
import { CircadianFocusDropdown } from '../CircadianFocusDropdown';
import { HeaderGlassIcon } from '../HeaderGlassIcon';

interface MentorHeaderProps {
  daysRemaining?: number | null;
  sessionsCount: number;
  activeSessionTitle?: string;
  onOpenHistory: () => void;
  onNewSession: () => void;
  isGoldenHourMode?: boolean;
  onToggleGoldenHour?: () => void;
  onOpenKeyConfig?: () => void;
  isAiConfigured?: boolean;
}

export const MentorHeader: React.FC<MentorHeaderProps> = ({
  daysRemaining,
  sessionsCount,
  onOpenHistory,
  onNewSession,
  isGoldenHourMode = false,
  onToggleGoldenHour,
  onOpenKeyConfig,
  isAiConfigured = true,
}) => {
  const circadian = useCircadianTheme();
  const reducedMotion = useReducedMotion();

  // Refined non-alarming countdown driven by settings
  let countdownText = 'Target';
  let countdownSub = 'to FMGE';
  if (daysRemaining !== undefined && daysRemaining !== null) {
    if (daysRemaining < 0) {
      countdownText = 'Ready';
      countdownSub = 'Exam Phase';
    } else if (daysRemaining === 0) {
      countdownText = 'Today';
      countdownSub = 'Exam Day';
    } else if (daysRemaining === 1) {
      countdownText = 'Tomorrow';
      countdownSub = '1d to FMGE';
    } else {
      countdownText = `${daysRemaining}d`;
      countdownSub = 'to FMGE';
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-3xl border p-4 sm:px-6 sm:py-4 shadow-xs transition-colors duration-700 ${circadian.bannerBg} ${circadian.cardBorder}`}
    >
      {/* Background Atmosphere (isolated with overflow-hidden so dropdown never clips) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
        <CircadianHeaderAtmosphere circadian={circadian} />
        {/* Dynamic Animated Ambient Faculty Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
      </div>

      {/* Top Utility Bar: Eyebrow + Countdown + Circadian Focus Dropdown */}
      <div className="relative z-20 flex items-center justify-between gap-3 pb-2.5 border-b border-stone-200/60 dark:border-slate-800/70">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-[10.5px] font-mono font-bold tracking-[0.2em] uppercase text-teal-700 dark:text-teal-300">
            CLINICAL FACULTY MENTOR
          </span>
          <span className={circadian.isNight ? 'text-sky-800' : 'text-stone-300'}>•</span>

          {/* Days to FMGE Target Badge */}
          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs text-xs font-bold ${
              circadian.isNight
                ? 'bg-slate-900/90 border-slate-700/80 text-white'
                : 'bg-teal-500/10 border-teal-300/80 text-teal-900'
            }`}
          >
            <Target className="h-3.5 w-3.5 text-[#00685F] dark:text-teal-400" />
            <span className="font-extrabold font-mono text-[11px]">{countdownText}</span>
            <span className="text-[10px] text-teal-800/80 dark:text-teal-300 font-semibold">{countdownSub}</span>
          </motion.div>

          {/* Golden Hour High-Yield Pill */}
          {isGoldenHourMode && (
            <div
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-900 dark:text-amber-300 text-[10px] font-bold font-mono tracking-wider uppercase shrink-0"
              title="Golden Hour mode prioritizes high-yield clinical traps, rapid revision, and exam-pattern MCQs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>High-Yield Active</span>
            </div>
          )}
        </div>

        <CircadianFocusDropdown circadian={circadian} />
      </div>

      {/* Main Content Layout Matching faculty-mentor-banner.png */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3.5 sm:gap-4 max-w-3xl min-w-0">
          <HeaderGlassIcon
            icon={GraduationCap}
            variant="teal"
            isNight={circadian.isNight}
          />

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight font-display leading-tight">
                <span className={circadian.isNight ? 'text-teal-300' : 'text-[#005B54]'}>FACULTY </span>
                <span className={circadian.isNight ? 'text-white' : 'text-slate-950'}>MENTOR</span>
              </h1>
              <button
                type="button"
                onClick={onOpenKeyConfig}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border shadow-2xs shrink-0 cursor-pointer hover:opacity-90 transition-all ${
                  isAiConfigured === false
                    ? 'bg-amber-500/10 border-amber-400/40 text-amber-800 dark:text-amber-300'
                    : `${circadian.badgeBg} ${circadian.badgeBorder} ${circadian.badgeText}`
                }`}
                title="Click to view Gemini AI Engine status & settings"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAiConfigured === false ? 'bg-amber-500' : 'bg-teal-500 animate-pulse'}`} />
                {isAiConfigured === false ? 'AI Setup Needed' : 'Clinical AI Faculty'}
              </button>
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed ${circadian.isNight ? 'text-slate-200' : 'text-slate-700 font-semibold'}`}>
              High-yield clinical explanations, complete exam vignettes, differential reasoning, and targeted remediation.
            </p>
          </div>
        </div>

        {/* Right Action Controls: History & New Chat Buttons with Apple Tactile Spring */}
        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
          {/* Saved History Trigger Button */}
          <motion.button
            type="button"
            whileHover={reducedMotion ? undefined : { scale: 1.03, y: -1 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onOpenHistory}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold shadow-2xs transition-all cursor-pointer backdrop-blur-sm group shrink-0 ${
              circadian.isNight
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-200 hover:text-white'
                : 'bg-slate-100/90 hover:bg-slate-200/90 border-slate-200/90 text-slate-800'
            }`}
            title="Open saved consultations history"
          >
            <History className={`h-3.5 w-3.5 transition-transform group-hover:rotate-[-20deg] ${circadian.isNight ? 'text-slate-400 group-hover:text-cyan-300' : 'text-slate-600'}`} />
            <span className="whitespace-nowrap font-bold">History</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold border ${circadian.isNight ? 'bg-teal-950/70 text-teal-300 border-teal-800/80' : 'bg-teal-500/15 text-[#00685F] border-teal-300/70'}`}>
              {sessionsCount}
            </span>
          </motion.button>

          {/* New Chat Action Button */}
          <motion.button
            type="button"
            whileHover={reducedMotion ? undefined : { scale: 1.03, y: -1 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#005B54] hover:bg-[#004D47] text-white text-xs font-bold shadow-md shadow-teal-900/20 ring-1 ring-white/20 transition-all cursor-pointer group shrink-0"
            title="Start a new consultation session"
          >
            <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-200 stroke-[2.5]" />
            <span className="whitespace-nowrap">New Chat</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
