import React, { useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   ONE SHOT FMGE — Official Luxury Brand Identity
   Medical Emblem: Layered open book, caduceus staff & serpent,
   celestial halo arc with 4-point gold star, deep pine teal & gold palette.
   Apple-grade typography (SF Pro / System), crisp kerning, refined lockups.
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

/* Fallback SVG Emblem in case raster asset fails to load */
function FallbackSvgEmblem({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`block shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <rect width="48" height="48" rx="12" fill="#006B63" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="#2DD4BF" strokeOpacity="0.3" />
      {/* Halo Arc */}
      <path
        d="M12 28 C12 16 36 16 36 28"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="2 2"
      />
      {/* Book base */}
      <path
        d="M14 34 C18 31 24 32 24 36 C24 32 30 31 34 34 L34 22 C30 19 24 20 24 24 C24 20 18 19 14 22 Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Asclepius staff & serpent */}
      <line x1="24" y1="12" x2="24" y2="34" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M21 16 Q27 18 24 22 Q21 26 27 28"
        stroke="#006B63"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Radiant 4-point star */}
      <polygon points="24,9 25.5,13 29,14 25.5,15 24,19 22.5,15 19,14 22.5,13" fill="#FBBF24" />
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
        ? 'h-6 w-6'
        : size === 'sm'
        ? 'h-8 w-8'
        : size === 'lg'
        ? 'h-14 w-14'
        : size === 'xl'
        ? 'h-20 w-20'
        : 'h-10 w-10';

    return (
      <div className={`relative shrink-0 select-none overflow-hidden rounded-[14px] shadow-[0_3px_10px_rgba(0,107,99,0.18)] ring-1 ring-black/5 ${iconDim} ${className}`}>
        {!imgError ? (
          <img
            src="/images/brand/one_shot_app_icon.png"
            alt="ONE SHOT FMGE Icon"
            className="h-full w-full object-cover rounded-[14px]"
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
        ? 'h-6 w-6'
        : size === 'sm'
        ? 'h-8 w-8'
        : size === 'lg'
        ? 'h-12 w-12'
        : size === 'xl'
        ? 'h-16 w-16'
        : 'h-10 w-10';

    return (
      <div className={`relative shrink-0 select-none flex items-center justify-center rounded-[12px] shadow-[0_2px_8px_rgba(0,107,99,0.12)] ring-1 ring-black/5 overflow-hidden ${className}`}>
        {!imgError ? (
          <img
            src="/images/brand/one_shot_emblem.png"
            alt="ONE SHOT FMGE Emblem"
            className={`block object-cover rounded-[12px] ${iconDim}`}
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
        <div className="relative h-8 w-8 shrink-0 flex items-center justify-center overflow-hidden rounded-[10px] shadow-[0_2px_6px_rgba(0,107,99,0.15)] ring-1 ring-black/5">
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
          <span className={`font-extrabold tracking-[-0.03em] text-[15px] ${inverse ? 'text-white' : 'text-stone-900'}`}>
            ONE SHOT
          </span>
          <span className="px-1.5 py-0.5 rounded-[5px] bg-[#006B63] text-white text-[10px] font-black tracking-wider uppercase shadow-2xs">
            FMGE
          </span>
        </div>
      </div>
    );
  }

  // 4. Horizontal variant: Desktop sidebar & wide navigation bars
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 select-none shrink-0 ${className}`}>
        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center overflow-hidden rounded-[13px] shadow-[0_3px_10px_rgba(0,107,99,0.16)] ring-1 ring-black/5 transition-transform duration-200 hover:scale-105">
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT Emblem"
              className="h-10 w-10 object-cover rounded-[13px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-10 w-10" />
          )}
        </div>
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold text-[16px] tracking-[-0.035em] ${inverse ? 'text-white' : 'text-stone-900'}`}>
              ONE SHOT
            </span>
            <span className="px-1.5 py-0.5 rounded-[5px] bg-[#006B63] text-white text-[10px] font-black tracking-wider uppercase shadow-2xs">
              FMGE
            </span>
          </div>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className={`text-[11px] font-medium tracking-tight ${inverse ? 'text-teal-200/80' : 'text-stone-500'}`}>
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
        <div className="relative h-16 w-16 shrink-0 flex items-center justify-center overflow-hidden rounded-[18px] shadow-[0_6px_20px_rgba(0,107,99,0.2)] ring-1 ring-black/5">
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT Emblem"
              className="h-16 w-16 object-cover rounded-[18px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-16 w-16" />
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-[-0.035em] text-stone-900">
              ONE SHOT
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#006B63] text-white text-xs font-black tracking-wider uppercase shadow-xs">
              FMGE
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium tracking-wide uppercase">
            {taglineText}
          </span>
        </div>
      </div>
    </div>
  );
}
