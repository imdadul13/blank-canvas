import React from 'react';
import { motion } from 'motion/react';
import { Target, History, Plus, Activity, Award, ShieldCheck, Zap, Stethoscope } from 'lucide-react';

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
  activeSessionTitle,
  onOpenHistory,
  onNewSession,
}) => {
  const displayDays = daysRemaining !== undefined && daysRemaining !== null ? daysRemaining : 0;

  return (
    <header className="relative overflow-hidden rounded-3xl border border-teal-200/60 bg-gradient-to-br from-[#F2FBF8] via-[#FAFDFB] via-45% to-[#EDF8F5] p-4 sm:p-6 shadow-xs">
      {/* Dynamic Animated Ambient Medical Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Subtle luminous top border shimmer track */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/25 to-transparent" />
          <motion.div
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            className="w-48 sm:w-72 h-full bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_14px_#2dd4bf]"
          />
        </div>

        {/* Subtle bottom border gradient luster */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />

        {/* Soft glowing corner radial gradient orbs (strictly tucked away from text) */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/35 via-emerald-200/25 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.08, 1, 1.08],
            opacity: [0.22, 0.38, 0.22],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-200/30 via-teal-100/20 to-transparent blur-3xl"
        />

        {/* Central ambient highlight wash */}
        <div className="absolute -top-12 left-1/4 h-52 w-96 rounded-full bg-gradient-to-r from-teal-200/20 via-emerald-100/15 to-transparent blur-3xl" />

        {/* Subtle Clinical Telemetry Grid Lines (Scientific diagnostic institute backdrop) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.035] text-teal-950 pointer-events-none select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="clinical-telemetry-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="0.75" fill="currentColor" opacity="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#clinical-telemetry-grid)" />
        </svg>

        {/* Animated Physiological Cardiac Waveform (Continuous Clinical Sinus Rhythm with gradient stroke) */}
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[500px] overflow-hidden opacity-[0.22] select-none pointer-events-none hidden sm:block">
          <svg
            viewBox="0 0 500 120"
            className="w-full h-full"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ecg-gradient-track" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#006B63" stopOpacity="0.08" />
                <stop offset="35%" stopColor="#006B63" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#0D9488" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            {/* ECG Sinus Rhythm Path with P-Q-R-S-T morphology */}
            <motion.path
              d="M 0 65 L 60 65 Q 70 65 75 58 Q 80 52 85 65 L 100 65 L 105 70 L 112 25 L 120 95 L 127 65 L 138 65 Q 150 48 165 65 L 250 65 Q 260 65 265 58 Q 270 52 275 65 L 290 65 L 295 70 L 302 25 L 310 95 L 317 65 L 328 65 Q 340 48 355 65 L 440 65 Q 450 65 455 58 Q 460 52 465 65 L 500 65"
              stroke="url(#ecg-gradient-track)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 4"
              animate={{ strokeDashoffset: [0, -100] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            />
            {/* Subtle traveling cardiac pulse nodal glow */}
            <motion.circle
              cx="112"
              cy="25"
              r="3.5"
              fill="#006B63"
              animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0.95, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="302"
              cy="25"
              r="3.5"
              fill="#0D9488"
              animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0.95, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
            />
          </svg>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 space-y-3 sm:space-y-4">
        {/* Top Eyebrow Row */}
        <div className="flex items-center justify-between gap-3">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border border-teal-500/25 text-[#006B63] text-[10px] sm:text-[11px] font-bold font-mono tracking-wider backdrop-blur-md shadow-2xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006B63]" />
            </span>
            <span className="uppercase tracking-[0.16em]">AI Clinical Faculty</span>
            <span className="text-teal-400">·</span>
            <span className="hidden xs:inline text-teal-800 font-semibold tracking-normal font-sans">FMGE Cognitive Engine</span>
          </motion.div>

          {/* Top-Right Signature Badge (Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-white/90 via-teal-50/40 to-white/90 border border-teal-100/90 shadow-2xs backdrop-blur-md"
          >
            <Activity className="h-3.5 w-3.5 text-[#006B63] animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 font-['Outfit']">
              Always With You
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500 font-sans">
              24/7 Clinical Mentorship
            </span>
          </motion.div>
        </div>

        {/* Hero Section: Title & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3">
              {/* Animated Faculty Stethoscope Insignia */}
              <div className="relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-[#006B63] via-[#005750] to-[#00423c] text-white shadow-md shadow-teal-900/15 shrink-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-[2px] rounded-2xl bg-gradient-to-tr from-teal-400/40 via-emerald-300/10 to-teal-500/50 blur-[2px] -z-10"
                />
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-teal-50" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold font-['Outfit'] tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-[#006B63] bg-clip-text text-transparent leading-tight"
                  >
                    Faculty Mentor
                  </motion.h1>

                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200/80 text-[11px] font-bold text-[#006B63] font-['Outfit'] shadow-2xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>19 Subjects</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-sans line-clamp-2 sm:line-clamp-none pt-0.5">
              High-yield clinical explanations, complete exam vignettes, differential reasoning, and targeted weak-area remediation.
            </p>

            {/* Quick capability tags */}
            <div className="hidden md:flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span>NBE Traps</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Activity className="h-3 w-3 text-teal-600" />
                <span>Differential Diagnosis</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Award className="h-3 w-3 text-indigo-500" />
                <span>Adaptive Quizzing</span>
              </span>
            </div>
          </div>

          {/* Controls Column */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 shrink-0 pt-1 lg:pt-0 w-full sm:w-auto">
            {/* Days to Exam Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-br from-white/95 via-teal-50/30 to-white/90 border border-teal-100/90 shadow-2xs backdrop-blur-md shrink-0"
            >
              <div className="relative flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-teal-50 via-emerald-50/70 to-teal-100/50 border border-teal-200/60 text-[#006B63] shrink-0">
                <Target className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="animate-ping absolute h-full w-full rounded-xl bg-teal-400 opacity-20" />
              </div>
              <div className="leading-tight text-left">
                <p className="text-[11px] sm:text-sm font-extrabold text-slate-900 font-['Outfit'] whitespace-nowrap">
                  {displayDays}d <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">to FMGE</span>
                </p>
                <p className="text-[10px] text-teal-700 font-medium font-sans hidden sm:block">Stay on track</p>
              </div>
            </motion.div>

            {/* Saved History Trigger Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-teal-100/90 bg-gradient-to-br from-white/95 via-slate-50/60 to-white/95 hover:from-teal-50/70 hover:via-white hover:to-emerald-50/40 text-[11px] sm:text-sm font-bold text-slate-700 hover:text-[#006B63] shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-md group shrink-0"
              title="Open saved consultations history"
            >
              <History className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#006B63] transition-transform duration-200 group-hover:rotate-[-20deg]" />
              <span className="font-['Outfit'] whitespace-nowrap">Saved History</span>
              <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 text-[#006B63] font-bold font-mono text-[10px] sm:text-[11px]">
                ({sessionsCount})
              </span>
            </motion.button>

            {/* New Chat Action Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNewSession}
              className="relative overflow-hidden flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#006B63] hover:from-slate-950 hover:to-[#005049] text-white text-[11px] sm:text-sm font-bold font-['Outfit'] shadow-xs hover:shadow-md transition-all cursor-pointer group shrink-0"
              title="Start a new consultation session and jump to asking bar"
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ['-140%', '260%'] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
              />
              <Plus className="relative z-10 h-3 sm:h-4 w-3 sm:w-4 transition-transform duration-300 group-hover:rotate-90 text-teal-300" />
              <span className="relative z-10 font-['Outfit'] whitespace-nowrap">
                <span className="hidden sm:inline">New Chat</span>
                <span className="sm:hidden">New</span>
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};
