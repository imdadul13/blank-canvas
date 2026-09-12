import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CircadianTheme } from '../hooks/useCircadianTheme';

interface CircadianHeaderAtmosphereProps {
  circadian: CircadianTheme;
  className?: string;
  showOrbs?: boolean;
  showTopShimmer?: boolean;
}

// Procedurally deterministic stars for celestial consistency
const NIGHT_STARS = [
  // Upper sky stars
  { x: 35, y: 18, r: 1.0, delay: 0.1, dur: 2.8, glow: '#e0f2fe' },
  { x: 85, y: 32, r: 1.4, delay: 1.2, dur: 3.4, glow: '#ffffff' },
  { x: 140, y: 15, r: 2.2, delay: 0.5, dur: 4.1, glow: '#bae6fd', isFlare: true },
  { x: 195, y: 40, r: 1.1, delay: 1.8, dur: 2.6, glow: '#e0f2fe' },
  { x: 250, y: 22, r: 1.6, delay: 2.3, dur: 3.8, glow: '#ffffff' },
  { x: 310, y: 35, r: 1.2, delay: 0.9, dur: 2.9, glow: '#7dd3fc' },
  { x: 375, y: 18, r: 2.4, delay: 1.4, dur: 4.2, glow: '#ffffff', isFlare: true },
  { x: 430, y: 44, r: 1.0, delay: 2.7, dur: 3.1, glow: '#e0f2fe' },
  { x: 490, y: 26, r: 1.8, delay: 0.3, dur: 3.6, glow: '#bae6fd' },
  { x: 550, y: 15, r: 1.3, delay: 1.9, dur: 2.8, glow: '#ffffff' },
  { x: 610, y: 38, r: 1.1, delay: 2.4, dur: 3.3, glow: '#e0f2fe' },
  // Mid & lower sky stars
  { x: 50, y: 65, r: 1.5, delay: 0.8, dur: 3.5, glow: '#ffffff' },
  { x: 115, y: 82, r: 1.0, delay: 2.1, dur: 2.7, glow: '#7dd3fc' },
  { x: 175, y: 70, r: 1.7, delay: 1.1, dur: 3.9, glow: '#bae6fd' },
  { x: 230, y: 95, r: 1.2, delay: 0.4, dur: 3.0, glow: '#ffffff' },
  { x: 290, y: 75, r: 2.3, delay: 2.5, dur: 4.4, glow: '#e0f2fe', isFlare: true },
  { x: 350, y: 90, r: 1.1, delay: 1.6, dur: 2.9, glow: '#ffffff' },
  { x: 410, y: 72, r: 1.6, delay: 0.7, dur: 3.7, glow: '#bae6fd' },
  { x: 470, y: 98, r: 1.0, delay: 2.0, dur: 2.5, glow: '#7dd3fc' },
  { x: 530, y: 80, r: 1.9, delay: 1.3, dur: 4.0, glow: '#ffffff' },
  { x: 590, y: 92, r: 1.2, delay: 2.8, dur: 3.2, glow: '#e0f2fe' },
  // Near-horizon subtle twinkles
  { x: 75, y: 120, r: 1.0, delay: 1.5, dur: 2.9, glow: '#bae6fd' },
  { x: 155, y: 135, r: 1.3, delay: 0.6, dur: 3.6, glow: '#ffffff' },
  { x: 265, y: 125, r: 1.1, delay: 2.2, dur: 3.1, glow: '#e0f2fe' },
  { x: 385, y: 140, r: 1.5, delay: 1.0, dur: 3.8, glow: '#7dd3fc' },
  { x: 495, y: 130, r: 1.0, delay: 2.6, dur: 2.7, glow: '#ffffff' },
  { x: 575, y: 145, r: 1.2, delay: 0.2, dur: 3.4, glow: '#bae6fd' },
];

// Constellation star connections (Asclepius / Ursa Minor arc)
const CONSTELLATION_POINTS = [
  { x: 140, y: 15 },
  { x: 195, y: 40 },
  { x: 250, y: 22 },
  { x: 290, y: 75 },
  { x: 375, y: 18 },
  { x: 410, y: 72 },
];

export const NocturnalCelestialCanvas: React.FC = () => {
  const reducedMotion = useReducedMotion();

  // Constellation path generator
  const constellationPath = useMemo(() => {
    return CONSTELLATION_POINTS.reduce(
      (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
      ''
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* ═══ 1. COSMIC DEEP SPACE NEBULA CLOUDS ═══ */}
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                scale: [1, 1.14, 1],
                opacity: [0.35, 0.55, 0.35],
                x: [0, 20, 0],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-500/25 via-sky-600/18 to-transparent blur-3xl"
      />
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                scale: [1.1, 1, 1.1],
                opacity: [0.25, 0.45, 0.25],
                y: [0, -15, 0],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-600/25 via-blue-500/18 to-transparent blur-3xl"
      />
      <div className="absolute top-0 left-10 h-60 w-96 rounded-full bg-gradient-to-r from-teal-500/15 via-sky-500/10 to-transparent blur-3xl" />

      {/* ═══ 2. SVG STARRY SKY & CONSTELLATION CANVAS ═══ */}
      <svg
        viewBox="0 0 760 160"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* Moon radial glow halo */}
          <radialGradient id="night-moon-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#0284C7" stopOpacity="0.2" />
            <stop offset="75%" stopColor="#0369A1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#082F49" stopOpacity="0" />
          </radialGradient>

          {/* Moon surface silver luminance */}
          <linearGradient id="night-moon-surface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F1F5F9" />
            <stop offset="75%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* 4-point Diamond Starburst Gradient */}
          <radialGradient id="night-star-burst" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor="#BAE6FD" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Delicate Constellation Hairlines */}
        <motion.path
          d={constellationPath}
          stroke="#7DD3FC"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          fill="none"
          animate={reducedMotion ? {} : { opacity: [0.18, 0.45, 0.18] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ═══ 3. PROCEDURAL TWINKLING STARS ═══ */}
        {NIGHT_STARS.map((s, idx) => (
          <g key={idx}>
            {/* Core Star Dot */}
            <motion.circle
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.glow}
              animate={
                reducedMotion
                  ? { opacity: 0.6 }
                  : {
                      opacity: [0.2, 0.95, 0.2],
                      scale: [0.85, 1.35, 0.85],
                    }
              }
              transition={{
                duration: s.dur,
                repeat: Infinity,
                delay: s.delay,
                ease: 'easeInOut',
              }}
            />

            {/* Radiant 4-Point Star Flare for Alpha Beacons */}
            {s.isFlare && (
              <motion.g
                transform={`translate(${s.x}, ${s.y})`}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        rotate: [0, 90, 0],
                        scale: [0.85, 1.25, 0.85],
                        opacity: [0.35, 0.9, 0.35],
                      }
                }
                transition={{
                  duration: s.dur * 1.5,
                  repeat: Infinity,
                  delay: s.delay,
                  ease: 'easeInOut',
                }}
              >
                {/* Horizontal Flare Ray */}
                <line x1="-7" y1="0" x2="7" y2="0" stroke="#E0F2FE" strokeWidth="0.8" opacity="0.85" />
                {/* Vertical Flare Ray */}
                <line x1="0" y1="-7" x2="0" y2="7" stroke="#E0F2FE" strokeWidth="0.8" opacity="0.85" />
                {/* Center diamond halo */}
                <circle cx="0" cy="0" r="2.8" fill="url(#night-star-burst)" />
              </motion.g>
            )}
          </g>
        ))}

        {/* ═══ 4. LUMINOUS CELESTIAL CRESCENT MOON ═══ */}
        <g transform="translate(680, 52)">
          {/* Breathing Outer Corona Aura Halo */}
          <motion.circle
            cx="0"
            cy="0"
            r="46"
            fill="url(#night-moon-halo)"
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 1.22, 1],
                    opacity: [0.65, 0.95, 0.65],
                  }
            }
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Expanding Moonbeam Pulse Ripple Wave */}
          <motion.circle
            cx="0"
            cy="0"
            r="16"
            stroke="#7DD3FC"
            strokeWidth="1.2"
            fill="none"
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 2.6],
                    opacity: [0.75, 0],
                  }
            }
            transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Precision Astronomical Waxing Crescent Moon */}
          <motion.path
            d="M 6 -18 A 19 19 0 1 0 16 11 A 15 15 0 1 1 6 -18 Z"
            fill="url(#night-moon-surface)"
            filter="drop-shadow(0 0 10px rgba(186, 230, 253, 0.85))"
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 1.04, 1],
                  }
            }
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Delicate Moon Craters Texture */}
          <circle cx="-3" cy="-3" r="2.2" fill="#64748B" opacity="0.35" />
          <circle cx="-7" cy="5" r="1.6" fill="#64748B" opacity="0.3" />
          <circle cx="2" cy="8" r="1.3" fill="#64748B" opacity="0.25" />

          {/* Ambient Moonlight Spill Flare */}
          <circle cx="-1" cy="-1" r="5" fill="#FFFFFF" opacity="0.45" filter="blur(1px)" />
        </g>
      </svg>

      {/* ═══ 5. ANIMATED SHOOTING STARS (METEORS) ═══ */}
      {!reducedMotion && (
        <>
          {/* Primary High-Speed Shooting Star */}
          <motion.div
            initial={{ x: -100, y: -20, opacity: 0 }}
            animate={{
              x: [-80, 520],
              y: [-20, 140],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 6.8,
              ease: 'easeOut',
            }}
            className="absolute top-3 left-[15%] w-36 h-[1.8px] bg-gradient-to-r from-transparent via-cyan-200 to-white rotate-[18deg] shadow-[0_0_12px_#38bdf8] pointer-events-none"
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          </motion.div>

          {/* Secondary Distant Swift Shooting Star */}
          <motion.div
            initial={{ x: -60, y: -10, opacity: 0 }}
            animate={{
              x: [-40, 360],
              y: [-10, 110],
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={{
              duration: 0.95,
              repeat: Infinity,
              repeatDelay: 11.4,
              delay: 3.5,
              ease: 'easeOut',
            }}
            className="absolute top-7 left-[45%] w-24 h-[1.2px] bg-gradient-to-r from-transparent via-sky-300 to-white rotate-[22deg] shadow-[0_0_8px_#7dd3fc] pointer-events-none"
          />
        </>
      )}
    </div>
  );
};

export const CircadianHeaderAtmosphere: React.FC<CircadianHeaderAtmosphereProps> = ({
  circadian,
  className = '',
  showOrbs = true,
  showTopShimmer = true,
}) => {
  const reducedMotion = useReducedMotion();

  // If Night mode is active: render the ultra-premium nocturnal celestial starry sky canvas
  if (circadian.isNight) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden select-none transition-opacity duration-700 ${className}`}
      >
        {/* Deep Cosmic Aura Mesh */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${circadian.auraGrad}`} />

        {/* Complete Nocturnal Sky with Moon, Constellations, Stars & Shooting Stars */}
        <NocturnalCelestialCanvas />

        {/* Precision 2px Luminous Top Border Shimmer Beam */}
        {showTopShimmer && (
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${circadian.topLight}`} />
            <motion.div
              animate={
                reducedMotion
                  ? {}
                  : {
                      x: ['-100%', '300%'],
                    }
              }
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 1.0,
              }}
              className={`w-60 sm:w-96 h-full bg-gradient-to-r from-transparent ${circadian.shimmerGlow} to-transparent`}
            />
          </div>
        )}
      </div>
    );
  }

  // Daytime (Morning / Afternoon / Evening) Ambient Atmosphere
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none transition-opacity duration-700 ${className}`}
    >
      {/* Subtle Ambient Radial Aura Mesh */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${circadian.auraGrad}`} />

      {/* Dynamic Animated Ambient Radial Gradient Orbs */}
      {showOrbs && (
        <>
          <motion.div
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 1.18, 1],
                    opacity: [0.35, 0.65, 0.35],
                    x: [0, 18, 0],
                  }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br ${circadian.orb1} blur-3xl`}
          />

          <motion.div
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1.1, 1, 1.1],
                    opacity: [0.25, 0.5, 0.25],
                    y: [0, -12, 0],
                  }
            }
            transition={{
              duration: 9.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr ${circadian.orb2} blur-3xl`}
          />

          <div
            className={`absolute -top-12 left-1/3 h-52 w-96 rounded-full bg-gradient-to-r ${circadian.orb3} blur-3xl`}
          />
        </>
      )}

      {/* Precision Architectural 2px Top Light Line Shimmer Track */}
      {showTopShimmer && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r ${circadian.topLight}`} />
          <motion.div
            animate={
              reducedMotion
                ? {}
                : {
                    x: ['-100%', '300%'],
                  }
            }
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1.2,
            }}
            className={`w-52 sm:w-80 h-full bg-gradient-to-r from-transparent ${circadian.shimmerGlow} to-transparent`}
          />
        </div>
      )}
    </div>
  );
};

export interface CircadianPillProps {
  circadian: CircadianTheme;
  className?: string;
  showQuote?: boolean;
  onCycle?: () => void;
}

export const CircadianPill: React.FC<CircadianPillProps> = ({
  circadian,
  className = '',
  showQuote = false,
  onCycle,
}) => {
  const Icon = circadian.Icon;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onCycle}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-bold font-mono tracking-wider uppercase backdrop-blur-md border ${circadian.badgeBorder} ${circadian.badgeBg} shadow-2xs ${circadian.badgeText} transition-all select-none ${
        onCycle ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'
      } ${
        circadian.isNight
          ? 'bg-slate-900/85 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
          : 'bg-white/90'
      } ${className}`}
      title={`${circadian.greeting} ${circadian.subLabel} — ${circadian.quote}${
        onCycle ? ' (Click to cycle time of day)' : ''
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            circadian.timeOfDay === 'morning'
              ? 'bg-amber-400'
              : circadian.timeOfDay === 'afternoon'
              ? 'bg-teal-400'
              : circadian.timeOfDay === 'evening'
              ? 'bg-orange-400'
              : 'bg-cyan-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            circadian.timeOfDay === 'morning'
              ? 'bg-amber-500'
              : circadian.timeOfDay === 'afternoon'
              ? 'bg-teal-500'
              : circadian.timeOfDay === 'evening'
              ? 'bg-orange-500'
              : 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]'
          }`}
        />
      </span>
      <Icon className={`w-3.5 h-3.5 ${circadian.iconColor} stroke-[2.2] shrink-0`} />
      <span className="truncate">{circadian.label}</span>
      {showQuote && (
        <span className="hidden xl:inline text-stone-400 font-normal normal-case font-sans pl-1">
          · {circadian.quote}
        </span>
      )}
    </motion.button>
  );
};
