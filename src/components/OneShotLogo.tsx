import React, { useState } from 'react';
import { motion } from 'motion/react';

/* ─────────────────────────────────────────────────────────────
   ONE SHOT FMGE — Apple HIG Luxury Brand Identity
   Medical Emblem: Layered open book, Asclepius staff & serpent,
   celestial halo arc with 4-point radiant star, teal-to-emerald & gold palette.
   Apple-grade typography, optical kerning, refined lockups.
   ───────────────────────────────────────────────────────────── */

export type OneShotLogoVariant = 'icon' | 'app-icon' | 'compact' | 'horizontal' | 'full';

export interface OneShotLogoProps {
  variant?: OneShotLogoVariant;
  inverse?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  taglineText?: string;
}

/* Apple-Grade SVG Emblem */
function FallbackSvgEmblem({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`block shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <defs>
        <linearGradient id="appleLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="60%" stopColor="#0062D2" />
          <stop offset="100%" stopColor="#004FB8" />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#FF9500" />
        </linearGradient>
        <linearGradient id="glossShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Squircle base */}
      <rect width="48" height="48" rx="13" fill="url(#appleLogoBg)" />
      {/* Top inner gloss reflection */}
      <rect x="1" y="1" width="46" height="22" rx="12" fill="url(#glossShine)" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="12.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Halo Arc */}
      <path
        d="M12 28 C12 16 36 16 36 28"
        stroke="url(#goldGradient)"
        strokeWidth="1.8"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
      />

      {/* Book base */}
      <path
        d="M14 34 C18 31 24 32 24 36 C24 32 30 31 34 34 L34 23 C30 20 24 21 24 25 C24 21 18 20 14 23 Z"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Asclepius staff & serpent */}
      <line x1="24" y1="13" x2="24" y2="34" stroke="url(#goldGradient)" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M21 17 Q27 19 24 23 Q21 27 27 29"
        stroke="#5AC8FA"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Radiant 4-point star */}
      <polygon
        points="24,9 25.5,13 29,14 25.5,15 24,19 22.5,15 19,14 22.5,13"
        fill="url(#goldGradient)"
      />
    </svg>
  );
}

export default function OneShotLogo({
  variant = 'horizontal',
  inverse = false,
  className = '',
  size = 'md',
  showTagline = true,
  taglineText = 'A Brighter Doctor Tomorrow',
}: OneShotLogoProps) {
  const [imgError, setImgError] = useState(false);

  // 1. App-Icon variant (Squircle emblem tile)
  if (variant === 'app-icon') {
    const iconDim =
      size === 'xs'
        ? 'h-6 w-6 rounded-[8px]'
        : size === 'sm'
        ? 'h-8 w-8 rounded-[10px]'
        : size === 'lg'
        ? 'h-14 w-14 rounded-[16px]'
        : size === 'xl'
        ? 'h-20 w-20 rounded-[22px]'
        : 'h-10 w-10 rounded-[12px]';

    return (
      <div className={`relative shrink-0 select-none overflow-hidden shadow-[0_4px_14px_rgba(0,122,255,0.18)] ring-1 ring-black/5 ${iconDim} ${className}`}>
        {!imgError ? (
          <img
            src="/images/brand/one_shot_app_icon.png"
            alt="ONE SHOT FMGE Icon"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <FallbackSvgEmblem className="h-full w-full" />
        )}
      </div>
    );
  }

  // 2. Icon / Emblem-only variant
  if (variant === 'icon') {
    const iconDim =
      size === 'xs'
        ? 'h-6 w-6 rounded-[8px]'
        : size === 'sm'
        ? 'h-8 w-8 rounded-[10px]'
        : size === 'lg'
        ? 'h-12 w-12 rounded-[15px]'
        : size === 'xl'
        ? 'h-16 w-16 rounded-[20px]'
        : 'h-10 w-10 rounded-[13px]';

    return (
      <div className={`relative shrink-0 select-none flex items-center justify-center shadow-[0_3px_12px_rgba(0,122,255,0.15)] ring-1 ring-black/5 overflow-hidden ${iconDim} ${className}`}>
        {!imgError ? (
          <img
            src="/images/brand/one_shot_emblem.png"
            alt="ONE SHOT FMGE Emblem"
            className={`block object-cover ${iconDim}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <FallbackSvgEmblem className={iconDim} />
        )}
      </div>
    );
  }

  // 3. Compact variant: Emblem + text lockup (mobile header / compact navigation)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 select-none shrink-0 ${className}`}>
        <div className="relative h-8 w-8 shrink-0 flex items-center justify-center overflow-hidden rounded-[10px] shadow-[0_2px_8px_rgba(0,122,255,0.15)] ring-1 ring-black/5">
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT Emblem"
              className="h-8 w-8 object-cover rounded-[10px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-8 w-8" />
          )}
        </div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-[-0.035em] text-[15px] ${inverse ? 'text-white' : 'text-[#1D1D1F]'}`}>
            ONE SHOT
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-[9.5px] font-black tracking-wider uppercase shadow-2xs border border-white/20">
            FMGE
          </span>
        </div>
      </div>
    );
  }

  // 4. Horizontal variant: Desktop sidebar & wide navigation bars (Matches screenshot media_1790581076666.png)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 select-none shrink-0 min-w-0 ${className}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative h-9 w-9 shrink-0 flex items-center justify-center overflow-hidden rounded-[12px] shadow-[0_3px_10px_rgba(0,122,255,0.18)] ring-1 ring-black/5 cursor-pointer"
        >
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT Emblem"
              className="h-9 w-9 object-cover rounded-[12px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-9 w-9" />
          )}
        </motion.div>
        <div className="flex flex-col justify-center leading-none min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`font-black text-[15.5px] tracking-[-0.035em] whitespace-nowrap ${inverse ? 'text-white' : 'text-[#1D1D1F]'}`}>
              ONE SHOT
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-[9.5px] font-black tracking-wider uppercase shadow-2xs border border-white/20 shrink-0">
              FMGE
            </span>
          </div>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-[#34C759] shrink-0 animate-pulse" />
              <span className={`text-[11px] font-medium tracking-tight truncate ${inverse ? 'text-blue-200/80' : 'text-[#6E6E73]'}`}>
                {taglineText}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Full variant: Stacked emblem + title + subtitle + tagline (Auth hero, onboarding, landing)
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      <div className="flex flex-col items-center gap-3.5">
        <motion.div
          whileHover={{ scale: 1.06, rotate: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className="relative h-18 w-18 shrink-0 flex items-center justify-center overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,122,255,0.2)] ring-1 ring-black/5 cursor-pointer"
        >
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT Emblem"
              className="h-18 w-18 object-cover rounded-[22px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-18 w-18" />
          )}
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl sm:text-3xl tracking-[-0.035em] text-[#1D1D1F]">
              ONE SHOT
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-xs font-black tracking-wider uppercase shadow-xs border border-white/20">
              FMGE
            </span>
          </div>
          <span className="text-[12px] text-[#6E6E73] font-semibold tracking-wide uppercase">
            {taglineText}
          </span>
        </div>
      </div>
    </div>
  );
}
