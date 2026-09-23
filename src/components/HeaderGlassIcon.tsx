import React from 'react';
import { LucideIcon } from 'lucide-react';

interface HeaderGlassIconProps {
  icon: LucideIcon;
  badgeDotColor?: string; // default amber-400
  className?: string;
  isNight?: boolean;
}

export const HeaderGlassIcon: React.FC<HeaderGlassIconProps> = ({
  icon: Icon,
  badgeDotColor = 'bg-amber-400',
  className = '',
  isNight = false,
}) => {
  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Outer Glow Halo */}
      <div
        className={`absolute -inset-1 rounded-2xl blur-md opacity-40 transition-opacity ${
          isNight ? 'bg-cyan-500/30' : 'bg-teal-400/25'
        }`}
      />

      {/* Glass Squircle Container */}
      <div
        className={`relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-2xl backdrop-blur-xl border shadow-sm transition-all ${
          isNight
            ? 'bg-slate-900/85 border-sky-700/50 text-cyan-300'
            : 'bg-white/90 border-teal-100/90 text-[#006B63]'
        }`}
      >
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />

        {/* Ambient Top-Right Golden Notification Dot */}
        <div
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${badgeDotColor} ring-2 ${
            isNight ? 'ring-slate-900' : 'ring-white'
          } shadow-xs animate-pulse`}
        />
      </div>
    </div>
  );
};
