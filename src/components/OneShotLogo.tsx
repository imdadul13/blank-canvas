import React, { useState } from 'react';

/* ─────────────────────────────────────────────────────────────
   ONE SHOT FMGE — Official Brand Identity
   Medical Emblem: Layered open book, caduceus staff & serpent,
   celestial halo arc with 4-point star, gold & teal palette.
   Variants:
     - 'icon': Medical emblem mark (clean transparent)
     - 'app-icon': Squircle emblem tile (Reference 2 favicon/app identity)
     - 'compact': Emblem + 'ONE SHOT FMGE' horizontal typography
     - 'horizontal': Full horizontal lockup (emblem + ONE SHOT FMGE)
     - 'full': High-yield stacked lockup with "A Brighter Doctor Tomorrow"
   ───────────────────────────────────────────────────────────── */

export type OneShotLogoVariant = 'icon' | 'app-icon' | 'compact' | 'horizontal' | 'full';

export interface OneShotLogoProps {
  variant?: OneShotLogoVariant;
  inverse?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
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
      {/* Subtle squircle inner border */}
      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="#2DD4BF" strokeOpacity="0.25" />
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
}: OneShotLogoProps) {
  const [imgError, setImgError] = useState(false);

  // 1. App-Icon variant (Squircle from Reference 2)
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
      <div className={`relative shrink-0 select-none overflow-hidden rounded-xl shadow-xs ${iconDim} ${className}`}>
        <img
          src="/images/brand/one_shot_app_icon.png"
          alt="ONE SHOT FMGE Icon"
          className="h-full w-full object-cover"
          loading="eager"
          onError={() => setImgError(true)}
        />
        {imgError && <FallbackSvgEmblem className="h-full w-full" />}
      </div>
    );
  }

  // 2. Icon / Emblem-only variant
  if (variant === 'icon') {
    const iconDim =
      size === 'xs'
        ? 'h-6 w-auto'
        : size === 'sm'
        ? 'h-8 w-auto'
        : size === 'lg'
        ? 'h-14 w-auto'
        : size === 'xl'
        ? 'h-20 w-auto'
        : 'h-10 w-auto';

    return (
      <div className={`relative shrink-0 select-none flex items-center justify-center ${className}`}>
        {!imgError ? (
          <img
            src="/images/brand/one_shot_emblem.png"
            alt="ONE SHOT FMGE Emblem"
            className={`block object-contain ${iconDim}`}
            loading="eager"
            onError={() => setImgError(true)}
          />
        ) : (
          <FallbackSvgEmblem className={iconDim} />
        )}
      </div>
    );
  }

  // 3. Compact variant: Emblem + text lockup (ideal for mobile top header / compact navigation)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 select-none shrink-0 ${className}`}>
        <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="Emblem"
              className="h-full w-auto object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-8 w-8" />
          )}
        </div>
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-tight text-sm font-['Outfit'] ${inverse ? 'text-white' : 'text-slate-900'}`}>
            ONE SHOT <span className="text-[#006B63]">FMGE</span>
          </span>
        </div>
      </div>
    );
  }

  // 4. Horizontal variant: Desktop sidebar & wide navigation bars
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 select-none shrink-0 ${className}`}>
        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
          {!imgError ? (
            <img
              src="/images/brand/one_shot_emblem.png"
              alt="ONE SHOT Emblem"
              className="h-full w-auto object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackSvgEmblem className="h-10 w-10" />
          )}
        </div>
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold font-['Outfit'] text-[16px] tracking-tight ${inverse ? 'text-white' : 'text-slate-900'}`}>
              ONE SHOT
            </span>
            <span className="font-extrabold font-['Outfit'] text-[14px] tracking-wider text-[#006B63]">
              FMGE
            </span>
          </div>
          {showTagline && (
            <span className={`text-[10.5px] font-semibold tracking-tight mt-0.5 font-['Plus_Jakarta_Sans'] ${inverse ? 'text-teal-200/80' : 'text-[#5B8881]'}`}>
              A Brighter Doctor Tomorrow
            </span>
          )}
        </div>
      </div>
    );
  }

  // 5. Full variant: Stacked emblem + title + subtitle + tagline (Auth hero, onboarding, landing)
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {!imgError ? (
        <img
          src="/images/brand/one_shot_logo_full.png"
          alt="ONE SHOT FMGE — A Brighter Doctor Tomorrow"
          className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain mx-auto"
          loading="eager"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <FallbackSvgEmblem className="h-16 w-16" />
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl font-['Outfit'] text-slate-900">
              ONE SHOT <span className="text-[#006B63]">FMGE</span>
            </span>
            <span className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">
              A Brighter Doctor Tomorrow
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
