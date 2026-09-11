import React from 'react';
import { motion } from 'motion/react';
import { Stethoscope, ShieldCheck, HeartPulse } from 'lucide-react';

interface AppSplashScreenProps {
  statusMessage?: string;
  subMessage?: string;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  statusMessage = 'Restoring your study plan...',
  subMessage = 'Calibrating high-yield clinical recall engine',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#F4FAF8] via-[#FAF9F6] to-[#EBF6F3] overflow-hidden select-none font-['Plus_Jakarta_Sans'] text-slate-900"
      style={{
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
      }}
    >
      {/* ── 1. Atmospheric Ambient Aura Orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Soft emerald/teal aura */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.35, 0.55, 0.35],
            x: [0, 15, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-teal-300/35 via-emerald-200/25 to-transparent blur-3xl"
        />

        {/* Warm amber sunrise aura */}
        <motion.div
          animate={{
            scale: [1.1, 0.95, 1.1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -12, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-200/30 via-teal-200/20 to-transparent blur-3xl"
        />

        {/* Faint subtle medical ECG wave in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
          <svg viewBox="0 0 600 120" className="w-full max-w-lg stroke-[#006B63] fill-none stroke-[2]">
            <path d="M 0 60 L 180 60 L 195 40 L 210 85 L 225 15 L 240 100 L 255 50 L 270 65 L 285 60 L 600 60" />
          </svg>
        </div>
      </div>

      {/* ── 2. Center Animated Brand Stack ── */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        {/* Animated Brand Emblem with Concentric Rings */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Concentric Breathing Halo Ring 1 */}
          <motion.div
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-[32px] bg-[#006B63]/15 blur-sm pointer-events-none"
          />

          {/* Concentric Breathing Halo Ring 2 */}
          <motion.div
            animate={{
              scale: [1.15, 1.5, 1.15],
              opacity: [0.25, 0.05, 0.25],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="absolute -inset-8 rounded-[40px] bg-teal-400/10 blur-md pointer-events-none"
          />

          {/* Official Clean Logo Squircle Container */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden bg-white shadow-[0_12px_36px_rgba(0,107,99,0.16)] border border-[#006B63]/20 flex items-center justify-center p-0.5"
          >
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT FMGE Logo"
              className="h-full w-full object-cover rounded-[22px]"
            />

            {/* Subtle gloss highlight on top half */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-[22px]" />
          </motion.div>
        </div>

        {/* Brand Name Lockup */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-['Outfit'] font-black text-2xl sm:text-3xl tracking-tight text-slate-900">
            <span>ONE SHOT</span>
            <span className="text-[#006B63] bg-clip-text text-transparent bg-gradient-to-r from-[#006B63] to-[#044E48]">
              FMGE
            </span>
          </div>

          <p className="text-[11.5px] sm:text-xs font-semibold tracking-tight text-[#B57B66] font-['Plus_Jakarta_Sans']">
            A Brighter Doctor Tomorrow
          </p>
        </div>

        {/* ── 3. High-Precision Animated Progress Tracker ── */}
        <div className="w-full max-w-[220px] sm:max-w-[240px] mt-7 space-y-2.5">
          {/* Precision Shimmer Track */}
          <div className="relative h-2 w-full rounded-full bg-slate-200/80 p-0.5 overflow-hidden shadow-inner border border-stone-200/80">
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#006B63] via-teal-400 via-55% to-[#006B63] shadow-[0_0_12px_rgba(45,212,191,0.6)]"
            />
          </div>

          {/* Dynamic Status Text */}
          <div className="space-y-0.5 text-center">
            <p className="text-xs font-semibold text-slate-700 font-['Plus_Jakarta_Sans'] flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#006B63] animate-pulse" />
              <span>{statusMessage}</span>
            </p>
            {subMessage && (
              <p className="text-[10px] text-slate-400 font-medium">
                {subMessage}
              </p>
            )}
          </div>
        </div>

        {/* ── 4. Subtle Clinical Safety Badge at Bottom ── */}
        <div className="mt-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-teal-500/15 shadow-2xs text-[10.5px] font-medium text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-[#006B63]" />
          <span>NBE FMGE 2026 Ready</span>
        </div>
      </motion.div>
    </div>
  );
};
