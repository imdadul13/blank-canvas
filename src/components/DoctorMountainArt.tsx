import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export interface DoctorMountainArtProps {
  className?: string;
  quote?: string;
  showQuote?: boolean;
  variant?: 'banner' | 'card' | 'backdrop';
  forceTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export const DoctorMountainArt: React.FC<DoctorMountainArtProps> = ({
  className = '',
  quote = "“Discipline today builds the doctor you'll be tomorrow.”",
  showQuote = true,
  variant = 'card',
  forceTimeOfDay,
}) => {
  // Current hour & minute for accurate real-time celestial tracking
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Dynamic time of day calculation
  const timeOfDay = useMemo(() => {
    if (forceTimeOfDay) return forceTimeOfDay;
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }, [forceTimeOfDay, hour]);

  // Solar position (sunX, sunY) along the natural celestial mountain arc
  const solarProps = useMemo(() => {
    switch (timeOfDay) {
      case 'morning': {
        // Morning sunrise: rising from left-center mountain crest
        const progress = Math.min(1, Math.max(0, (hour - 5 + minute / 60) / 7));
        const sunX = 120 + progress * 70; // 120 -> 190
        const sunY = 85 - progress * 45;  // 85 -> 40 (rising)
        return {
          sunX,
          sunY,
          sunRadius: 14,
          coreColor: '#F59E0B',
          glowStart: '#FDE68A',
          glowEnd: '#BAE6FD',
          coronaColor: '#FBBF24',
          rayColor: '#F59E0B',
          pulseDuration: 3.8,
          label: 'Morning Sunrise',
          isNight: false,
        };
      }
      case 'afternoon': {
        // Midday / Afternoon: high in the clear sky
        const progress = Math.min(1, Math.max(0, (hour - 12 + minute / 60) / 5));
        const sunX = 195 + progress * 45; // 195 -> 240
        const sunY = 30 + progress * 22;  // 30 -> 52 (zenith to descent)
        return {
          sunX,
          sunY,
          sunRadius: 15,
          coreColor: '#F59E0B',
          glowStart: '#FEF08A',
          glowEnd: '#E0F2FE',
          coronaColor: '#FBBF24',
          rayColor: '#F59E0B',
          pulseDuration: 3.2,
          label: 'Afternoon Sun',
          isNight: false,
        };
      }
      case 'night': {
        // Late night / nocturnal study session: glowing crescent moon & gentle stars
        return {
          sunX: 250,
          sunY: 46,
          sunRadius: 13,
          coreColor: '#E2E8F0',
          glowStart: '#F8FAFC',
          glowEnd: '#38BDF8',
          coronaColor: '#94A3B8',
          rayColor: '#CBD5E1',
          pulseDuration: 4.6,
          label: 'Night Crescent Moon',
          isNight: true,
        };
      }
      case 'evening':
      default: {
        // Golden hour / Evening Sunset: descending low into the right mountain ridges
        // If hour is late night or 17-21, render the golden sunset descent
        const normalizedHour = hour >= 17 && hour < 21 ? hour : 18.5;
        const progress = Math.min(1, Math.max(0, (normalizedHour - 17 + minute / 60) / 4));
        const sunX = 245 + progress * 35; // 245 -> 280
        const sunY = 62 + progress * 36;  // 62 -> 98 (dipping low behind the peaks)
        return {
          sunX,
          sunY,
          sunRadius: 14,
          coreColor: '#D97706',
          glowStart: '#FEF3C7',
          glowEnd: '#CCFBF1',
          coronaColor: '#FDE68A',
          rayColor: '#D97706',
          pulseDuration: 4.2,
          label: 'Evening Sunset',
          isNight: false,
        };
      }
    }
  }, [timeOfDay, hour, minute]);

  const svgVisual = (
    <svg
      viewBox="0 0 340 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-cover object-right-bottom"
      preserveAspectRatio="xMaxYMax slice"
    >
      <defs>
        {/* Dynamic Sun Core Gradient */}
        <radialGradient id="sunCoreGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor={solarProps.glowStart} />
          <stop offset="100%" stopColor={solarProps.coreColor} />
        </radialGradient>

        {/* Dynamic Sun/Moon Corona Glow */}
        <radialGradient id="sunCoronaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={solarProps.glowStart} stopOpacity={solarProps.isNight ? '0.6' : '0.75'} />
          <stop offset="40%" stopColor={solarProps.coronaColor} stopOpacity={solarProps.isNight ? '0.25' : '0.4'} />
          <stop offset="75%" stopColor={solarProps.glowEnd} stopOpacity={solarProps.isNight ? '0.08' : '0.15'} />
          <stop offset="100%" stopColor={solarProps.glowEnd} stopOpacity="0" />
        </radialGradient>

        {/* Mountain 1 Far Gradient - Soft Misty Celestial Ridge */}
        <linearGradient id="mtnFarGrad" x1="160" y1="50" x2="160" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor={solarProps.isNight ? '#0369A1' : '#A7F3D0'} stopOpacity={solarProps.isNight ? '0.3' : '0.32'} />
          <stop offset="100%" stopColor={solarProps.isNight ? '#0F172A' : '#5EEAD4'} stopOpacity={solarProps.isNight ? '0.6' : '0.55'} />
        </linearGradient>

        {/* Mountain 2 Mid Gradient - Rich Atmospheric Medical Teal / Deep Marine */}
        <linearGradient id="mtnMidGrad" x1="200" y1="70" x2="200" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor={solarProps.isNight ? '#0284C7' : '#2DD4BF'} stopOpacity={solarProps.isNight ? '0.45' : '0.42'} />
          <stop offset="100%" stopColor={solarProps.isNight ? '#042F2E' : '#0F766E'} stopOpacity={solarProps.isNight ? '0.75' : '0.65'} />
        </linearGradient>

        {/* Mountain 3 Fore Gradient - Signature Deep Medical Teal Crest */}
        <linearGradient id="mtnForeGrad" x1="240" y1="90" x2="240" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor={solarProps.isNight ? '#0369A1' : '#14B8A6'} stopOpacity={solarProps.isNight ? '0.55' : '0.55'} />
          <stop offset="100%" stopColor={solarProps.isNight ? '#022C22' : '#004D47'} stopOpacity={solarProps.isNight ? '0.92' : '0.85'} />
        </linearGradient>
      </defs>

      {/* ════════════ 1. DYNAMIC CELESTIAL ANIMATION (SUN OR MOON) ════════════ */}
      {variant !== 'backdrop' && (
        solarProps.isNight ? (
          <g>
            {/* Subtle Twinkling Stars in Mountain Night Sky */}
            <motion.circle cx="70" cy="28" r="1.2" fill="#E2E8F0" animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.circle cx="130" cy="20" r="1.4" fill="#BAE6FD" animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.2, 0.7] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} />
            <motion.circle cx="175" cy="34" r="1.1" fill="#FFFFFF" animate={{ opacity: [0.15, 0.85, 0.15], scale: [0.9, 1.4, 0.9] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }} />
            <motion.circle cx="295" cy="24" r="1.3" fill="#E0F2FE" animate={{ opacity: [0.25, 0.9, 0.25], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
            <motion.circle cx="215" cy="16" r="1" fill="#FFFFFF" animate={{ opacity: [0.2, 0.75, 0.2] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }} />

            {/* Breathing Moon Corona Aura */}
            <motion.circle
              cx={solarProps.sunX}
              cy={solarProps.sunY}
              r="38"
              fill="url(#sunCoronaGlow)"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: solarProps.pulseDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Glowing Crescent Moon */}
            <motion.path
              d={`M ${solarProps.sunX - 3} ${solarProps.sunY - 11} A 12 12 0 1 0 ${solarProps.sunX + 9} ${solarProps.sunY + 7} A 9.5 9.5 0 1 1 ${solarProps.sunX - 3} ${solarProps.sunY - 11} Z`}
              fill="url(#sunCoreGrad)"
              filter="drop-shadow(0 0 8px rgba(226, 232, 240, 0.8))"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        ) : (
          <g>
            {/* Breathing Outer Corona Aura */}
            <motion.circle
              cx={solarProps.sunX}
              cy={solarProps.sunY}
              r="45"
              fill="url(#sunCoronaGlow)"
              animate={{
                scale: [1, 1.24, 1],
                opacity: [0.45, 0.75, 0.45],
              }}
              transition={{
                duration: solarProps.pulseDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Expanding Sunbeam Pulse Wave */}
            <motion.circle
              cx={solarProps.sunX}
              cy={solarProps.sunY}
              r="16"
              stroke={solarProps.rayColor}
              strokeWidth="1.4"
              fill="none"
              animate={{
                scale: [1, 2.9],
                opacity: [0.75, 0],
              }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            {/* Rotating Solar Ray Spokes */}
            <motion.g
              transform={`translate(${solarProps.sunX}, ${solarProps.sunY})`}
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            >
              <line x1="0" y1="-21" x2="0" y2="-27" stroke={solarProps.rayColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
              <line x1="0" y1="21" x2="0" y2="27" stroke={solarProps.rayColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
              <line x1="-21" y1="0" x2="-27" y2="0" stroke={solarProps.rayColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
              <line x1="21" y1="0" x2="27" y2="0" stroke={solarProps.rayColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
              <line x1="-15" y1="-15" x2="-19" y2="-19" stroke={solarProps.rayColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <line x1="15" y1="15" x2="19" y2="19" stroke={solarProps.rayColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <line x1="-15" y1="15" x2="-19" y2="19" stroke={solarProps.rayColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <line x1="15" y1="-15" x2="19" y2="-19" stroke={solarProps.rayColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            </motion.g>

            {/* Solid Sun Core with Gentle Pulsing */}
            <motion.circle
              cx={solarProps.sunX}
              cy={solarProps.sunY}
              r={solarProps.sunRadius}
              fill="url(#sunCoreGrad)"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        )
      )}

      {/* ════════════ 2. MOUNTAIN RIDGES ════════════ */}
      {/* Distant Mountain Ridge */}
      <path
        d="M60 180L140 75L185 118L245 52L320 120L340 180H60Z"
        fill="url(#mtnFarGrad)"
      />

      {/* Midground Mountain Ridge */}
      <path
        d="M110 180L180 88L225 128L275 72L340 135V180H110Z"
        fill="url(#mtnMidGrad)"
      />

      {/* Soft Mountain Valley Mist Drifting Horizontally */}
      <motion.path
        d="M 60 145 Q 140 135 220 142 Q 300 138 340 144"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.25"
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Foreground Mountain Peak */}
      <path
        d="M150 180L220 106L265 142L320 95L340 125V180H150Z"
        fill="url(#mtnForeGrad)"
      />

      {/* ════════════ 3. PINE TREES ON MOUNTAIN RIDGES ════════════ */}
      <g fill="#042F2E" opacity="0.45">
        {/* Pine Tree 1 */}
        <path d="M 232 108 L 235 98 L 238 108 L 236 108 L 239 116 L 236.5 116 L 240 124 L 231 124 L 234 116 L 231.5 116 L 234 108 Z" />
        <rect x="235" y="124" width="1.5" height="4" fill="#022C22" />

        {/* Pine Tree 2 (Taller) */}
        <path d="M 242 102 L 246 88 L 250 102 L 247.5 102 L 251.5 112 L 248.5 112 L 253 122 L 241 122 L 245 112 L 242.5 112 L 246 102 Z" />
        <rect x="246" y="122" width="1.8" height="5" fill="#022C22" />

        {/* Pine Tree 3 */}
        <path d="M 252 110 L 255 100 L 258 110 L 256 110 L 259 118 L 256.5 118 L 260 126 L 251 126 L 254 118 L 251.5 118 L 254 110 Z" />
        <rect x="255" y="126" width="1.5" height="4" fill="#022C22" />

        {/* Pine Tree 4 (Far) */}
        <path d="M 223 118 L 225.5 110 L 228 118 L 226.5 118 L 229 125 L 227 125 L 230 131 L 222 131 L 224.5 125 L 222.5 125 L 225 118 Z" opacity="0.6" />

        {/* Pine Tree 5 */}
        <path d="M 264 122 L 267 112 L 270 122 L 268 122 L 271 130 L 268.5 130 L 272 138 L 263 138 L 266 130 L 263.5 130 L 266 122 Z" />
        <rect x="267" y="138" width="1.6" height="4" fill="#022C22" />
      </g>

      {/* ════════════ 4. ANIMATED BIRDS SOARING OVER MOUNTAIN ════════════ */}
      {/* Bird 1: Lead Soarer */}
      <motion.g
        animate={{
          x: [-40, 360],
          y: [28, 18, 25, 14, 28],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.g
          animate={{
            scaleY: [1, 0.3, 1, 0.3, 1],
            rotate: [-4, 4, -3, 3, -4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path
            d="M 0 5 C 4 -2 8 -2 12 3 C 16 -2 20 -2 24 5 C 18 3.5 15 2 12 4.5 C 9 2 6 3.5 0 5 Z"
            fill="#1E293B"
            opacity="0.9"
          />
        </motion.g>
      </motion.g>

      {/* Bird 2: Companion Wingman */}
      <motion.g
        animate={{
          x: [-65, 340],
          y: [42, 34, 39, 30, 42],
        }}
        transition={{
          duration: 18.5,
          repeat: Infinity,
          ease: 'linear',
          delay: 2.5,
        }}
      >
        <motion.g
          transform="scale(0.8)"
          animate={{
            scaleY: [1, 0.32, 1, 0.32, 1],
            rotate: [-3, 5, -3, 2, -3],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
        >
          <path
            d="M 0 5 C 4 -2 8 -2 12 3 C 16 -2 20 -2 24 5 C 18 3.5 15 2 12 4.5 C 9 2 6 3.5 0 5 Z"
            fill="#0F172A"
            opacity="0.85"
          />
        </motion.g>
      </motion.g>

      {/* Bird 3: High-Altitude Thermal Glider */}
      <motion.g
        animate={{
          x: [-30, 370],
          y: [14, 8, 12, 6, 14],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'linear',
          delay: 6,
        }}
      >
        <motion.g
          transform="scale(0.65)"
          animate={{
            scaleY: [1, 0.4, 1, 0.4, 1],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path
            d="M 0 5 C 4 -2 8 -2 12 3 C 16 -2 20 -2 24 5 C 18 3.5 15 2 12 4.5 C 9 2 6 3.5 0 5 Z"
            fill="#334155"
            opacity="0.8"
          />
        </motion.g>
      </motion.g>

      {/* Bird 4: Distant Ridge Skimmer */}
      <motion.g
        animate={{
          x: [-50, 350],
          y: [56, 48, 52, 44, 56],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
          delay: 10.5,
        }}
      >
        <motion.g
          transform="scale(0.52)"
          animate={{
            scaleY: [1, 0.34, 1, 0.34, 1],
            rotate: [-2, 3, -2],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.4,
          }}
        >
          <path
            d="M 0 5 C 4 -2 8 -2 12 3 C 16 -2 20 -2 24 5 C 18 3.5 15 2 12 4.5 C 9 2 6 3.5 0 5 Z"
            fill="#1E293B"
            opacity="0.75"
          />
        </motion.g>
      </motion.g>
    </svg>
  );

  // Variant: Backdrop (embedded directly into parent headers like Dashboard greeting banner)
  if (variant === 'backdrop') {
    return (
      <div className={`absolute right-0 bottom-0 top-0 w-80 sm:w-[500px] lg:w-[560px] pointer-events-none select-none overflow-hidden ${className}`}>
        {svgVisual}
      </div>
    );
  }

  // Variant: Standalone Card / Banner
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F2FBF8] via-[#FAFDFB] via-45% to-[#EDF8F5] border border-teal-200/60 p-5 sm:p-6 flex flex-col justify-between shadow-xs ${className}`}
    >
      {/* Luminous system theme top border shimmer track */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/25 to-transparent" />
        <motion.div
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.0 }}
          className="w-48 sm:w-72 h-full bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_14px_#2dd4bf]"
        />
      </div>

      {/* Mountain & Sun Background Visual */}
      <div className="absolute right-0 bottom-0 top-0 w-72 sm:w-96 pointer-events-none opacity-90 select-none overflow-hidden">
        {svgVisual}
      </div>

      {/* Quote callout content on left */}
      {showQuote && (
        <div className="relative z-10 max-w-sm sm:max-w-md pr-16 sm:pr-24">
          <div className="inline-flex items-center gap-1.5 text-[#006B63] font-semibold text-xs mb-1 font-mono uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#006B63]" />
            Doctor's Creed
          </div>
          <p className="text-sm sm:text-base font-display font-medium text-slate-800 leading-snug">
            {quote}
          </p>
        </div>
      )}
    </div>
  );
};
