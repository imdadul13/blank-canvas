import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

export type HeaderGlassIconVariant =
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'slate'
  | 'cyan';

interface HeaderGlassIconProps {
  icon: LucideIcon;
  variant?: HeaderGlassIconVariant;
  badgeDotColor?: string;
  className?: string;
  isNight?: boolean;
}

const VARIANT_CONFIG: Record<
  HeaderGlassIconVariant,
  {
    bg: string;
    halo: string;
    shadow: string;
    border: string;
    pipColor: string;
  }
> = {
  teal: {
    bg: 'bg-gradient-to-tr from-[#005B54] via-[#006B63] to-teal-400 text-white',
    halo: 'bg-teal-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(0,107,99,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-teal-400/30',
    pipColor: 'bg-amber-400',
  },
  blue: {
    bg: 'bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white',
    halo: 'bg-blue-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(37,99,235,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-blue-400/30',
    pipColor: 'bg-cyan-300',
  },
  indigo: {
    bg: 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white',
    halo: 'bg-indigo-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(79,70,229,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-indigo-400/30',
    pipColor: 'bg-amber-400',
  },
  purple: {
    bg: 'bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 text-white',
    halo: 'bg-purple-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(147,51,234,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-purple-400/30',
    pipColor: 'bg-amber-400',
  },
  amber: {
    bg: 'bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 text-white',
    halo: 'bg-amber-500/30',
    shadow: 'shadow-[0_8px_20px_rgba(217,119,6,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-amber-300/40',
    pipColor: 'bg-emerald-400',
  },
  emerald: {
    bg: 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white',
    halo: 'bg-emerald-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(5,150,105,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-emerald-400/30',
    pipColor: 'bg-amber-400',
  },
  rose: {
    bg: 'bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-600 text-white',
    halo: 'bg-rose-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(225,29,72,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-rose-400/30',
    pipColor: 'bg-amber-400',
  },
  slate: {
    bg: 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 text-white',
    halo: 'bg-slate-500/20',
    shadow: 'shadow-[0_8px_20px_rgba(15,23,42,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.3)]',
    border: 'border-slate-500/30',
    pipColor: 'bg-emerald-400',
  },
  cyan: {
    bg: 'bg-gradient-to-tr from-cyan-600 via-teal-600 to-cyan-500 text-white',
    halo: 'bg-cyan-500/25',
    shadow: 'shadow-[0_8px_20px_rgba(8,145,178,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.4)]',
    border: 'border-cyan-400/30',
    pipColor: 'bg-amber-400',
  },
};

export const HeaderGlassIcon: React.FC<HeaderGlassIconProps> = ({
  icon: Icon,
  variant = 'teal',
  badgeDotColor,
  className = '',
  isNight = false,
}) => {
  const current = VARIANT_CONFIG[variant] || VARIANT_CONFIG.teal;
  const pip = badgeDotColor || (isNight ? 'bg-cyan-400' : current.pipColor);

  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -1 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative shrink-0 select-none ${className}`}
    >
      {/* Outer Ambient Glow Halo */}
      <div
        className={`absolute -inset-1.5 rounded-3xl blur-md opacity-50 transition-all ${
          isNight ? 'bg-cyan-500/35' : current.halo
        }`}
      />

      {/* Apple Squircle Solid Gradient Container */}
      <div
        className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border transition-all ${
          isNight
            ? 'bg-gradient-to-tr from-slate-900 via-sky-950 to-slate-900 text-cyan-300 border-sky-400/40 shadow-[0_0_24px_rgba(56,189,248,0.35),inset_0_1px_1.5px_rgba(56,189,248,0.4)]'
            : `${current.bg} ${current.border} ${current.shadow}`
        }`}
      >
        <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2] drop-shadow-xs" />

        {/* Ambient Top-Right Golden Notification Dot */}
        <div
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${pip} ring-2 ${
            isNight ? 'ring-slate-900' : 'ring-white'
          } shadow-xs`}
        >
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pip} opacity-75`} />
        </div>
      </div>
    </motion.div>
  );
};
