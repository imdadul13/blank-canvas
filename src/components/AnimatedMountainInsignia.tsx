import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CircadianPhase } from '../utils/doctorCreeds';

interface AnimatedMountainInsigniaProps {
  phase?: CircadianPhase | 'all';
  creedId?: string;
  isShuffling?: boolean;
  className?: string;
}

export const AnimatedMountainInsignia: React.FC<AnimatedMountainInsigniaProps> = ({
  phase = 'morning',
  creedId = '',
  isShuffling = false,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  // Pick variation seed from creedId if present to give quote-specific variations
  const seed = creedId ? creedId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) : 0;
  const isAltSilhouette = seed % 2 === 1;

  return (
    <motion.div
      key={`${phase}-${creedId}`}
      initial={reducedMotion ? false : { opacity: 0.6, scale: 0.92 }}
      animate={reducedMotion ? false : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 52 30"
        fill="none"
        className="w-full h-full overflow-visible drop-shadow-xs select-none"
      >
        <defs>
          {/* Dawn Gradients */}
          <linearGradient id="dawnRearPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="dawnFrontPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006B63" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="dawnSunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Afternoon Zenith Gradients */}
          <linearGradient id="noonRearPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#006B63" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="noonFrontPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006B63" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.6" />
          </linearGradient>

          {/* Evening Golden Hour Gradients */}
          <linearGradient id="eveRearPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#E11D48" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="eveFrontPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B45309" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#BE123C" stopOpacity="0.55" />
          </linearGradient>

          {/* Night Vigil Gradients */}
          <linearGradient id="nightRearPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="nightFrontPeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0E7490" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Phase Specific Mountain & Celestial Elements */}
        {phase === 'morning' && (
          <g>
            {/* Rising Sunrise Orb with Animated Radiance */}
            <motion.circle
              cx="11"
              cy="9"
              r="4.5"
              fill="url(#dawnSunGlow)"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.15, 1],
                      opacity: [0.85, 1, 0.85],
                    }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Sunrise Corona Pulse Ring */}
            {!reducedMotion && (
              <motion.circle
                cx="11"
                cy="9"
                r="6.5"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="0.8"
                strokeOpacity="0.5"
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.6, 0.1, 0.6],
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Rear Mountain Ridge */}
            <path
              d={isAltSilhouette ? 'M14 30L30 11L42 22L50 30H14Z' : 'M16 30L32 10L44 21L50 30H16Z'}
              fill="url(#dawnRearPeak)"
            />

            {/* Primary Front Alpine Ridge */}
            <path
              d={isAltSilhouette ? 'M2 30L20 7L29 17L44 30H2Z' : 'M2 30L21 8L31 18L44 30H2Z'}
              fill="url(#dawnFrontPeak)"
            />

            {/* Left Ridge Sunlight Facet */}
            <path
              d={isAltSilhouette ? 'M2 30L20 7L23 30H2Z' : 'M2 30L21 8L24 30H2Z'}
              fill="#FDE68A"
              fillOpacity="0.25"
            />

            {/* Summit Flagpole */}
            <line
              x1={isAltSilhouette ? '20' : '21'}
              y1={isAltSilhouette ? '7' : '8'}
              x2={isAltSilhouette ? '20' : '21'}
              y2={isAltSilhouette ? '2' : '3'}
              stroke="#E2E8F0"
              strokeWidth="0.9"
            />

            {/* Fluttering Summit Dawn Pennant */}
            <motion.path
              d={
                isAltSilhouette
                  ? 'M20 3L25.5 5L20 7Z'
                  : 'M21 4L26.5 6L21 8Z'
              }
              fill="#F43F5E"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scaleX: [1, 0.85, 1.05, 1],
                      skewY: [0, 4, -3, 0],
                    }
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {phase === 'afternoon' && (
          <g>
            {/* Midday High Solar Flare / Starburst */}
            <motion.g
              transform="translate(36, 6)"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      rotate: [0, 360],
                    }
              }
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx="0" cy="0" r="3.2" fill="#38BDF8" fillOpacity="0.8" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
              {/* Star Rays */}
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#38BDF8" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#38BDF8" strokeWidth="0.8" strokeLinecap="round" />
            </motion.g>

            {/* Rear Majestic Peaks */}
            <path
              d="M10 30L26 9L37 19L48 30H10Z"
              fill="url(#noonRearPeak)"
            />

            {/* Primary Sharp Ridge */}
            <path
              d="M3 30L20 6L30 16L45 30H3Z"
              fill="url(#noonFrontPeak)"
            />

            {/* Chiseled Sunlight Facet */}
            <path
              d="M20 6L30 16L45 30L28 30Z"
              fill="#0EA5E9"
              fillOpacity="0.28"
            />

            {/* Summit Flagpole */}
            <line x1="20" y1="6" x2="20" y2="1.5" stroke="#FFFFFF" strokeWidth="0.9" />

            {/* High-Altitude Fluttering Swallowtail Pennant */}
            <motion.path
              d="M20 2L26 3.8L24 5L26 6.2L20 8Z"
              fill="#10B981"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scaleX: [1, 1.1, 0.9, 1],
                      skewY: [0, -5, 4, 0],
                    }
              }
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {phase === 'evening' && (
          <g>
            {/* Sunset Orb Dipping behind the Western Col */}
            <motion.circle
              cx="33"
              cy="10"
              r="4.2"
              fill="#FB923C"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.08, 1],
                      opacity: [0.8, 1, 0.8],
                    }
              }
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {!reducedMotion && (
              <circle cx="33" cy="10" r="6" fill="#F43F5E" fillOpacity="0.2" />
            )}

            {/* Deep Warm Evening Rear Ridge */}
            <path
              d="M12 30L27 10L39 20L49 30H12Z"
              fill="url(#eveRearPeak)"
            />

            {/* Front Silhouette Ridge */}
            <path
              d="M2 30L19 7L28 17L44 30H2Z"
              fill="url(#eveFrontPeak)"
            />

            {/* Golden Rim Accent along the Ridge */}
            <path
              d="M2 30L19 7L22 11"
              stroke="#FDBA74"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            />

            {/* Summit Flagpole */}
            <line x1="19" y1="7" x2="19" y2="2" stroke="#FED7AA" strokeWidth="0.9" />

            {/* Twilight Crimson Fluttering Pennant */}
            <motion.path
              d="M19 2.5L25 4.5L19 6.5Z"
              fill="#F43F5E"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scaleX: [1, 0.9, 1.08, 1],
                      skewY: [0, 3, -4, 0],
                    }
              }
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {phase === 'night' && (
          <g>
            {/* Nocturnal Glowing Crescent Moon */}
            <g transform="translate(34, 4)">
              <motion.path
                d="M5 0C2.24 0 0 2.24 0 5C0 7.76 2.24 10 5 10C3.34 10 2 8.66 2 7C2 5.34 3.34 4 5 4C5 2.66 4.34 1.34 5 0Z"
                fill="#E0F2FE"
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        scale: [1, 1.06, 1],
                        filter: [
                          'drop-shadow(0 0 2px rgba(56,189,248,0.6))',
                          'drop-shadow(0 0 4px rgba(56,189,248,0.9))',
                          'drop-shadow(0 0 2px rgba(56,189,248,0.6))',
                        ],
                      }
                }
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </g>

            {/* Twinkling Celestial Night Stars */}
            <motion.circle
              cx="9"
              cy="5"
              r="0.9"
              fill="#BAE6FD"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.4, 0.8],
                    }
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="24"
              cy="3"
              r="0.75"
              fill="#FFFFFF"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      opacity: [0.8, 0.2, 0.8],
                      scale: [1.2, 0.7, 1.2],
                    }
              }
              transition={{ duration: 3.1, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
            />

            {/* Rear Night Col */}
            <path
              d="M12 30L28 10L39 20L49 30H12Z"
              fill="url(#nightRearPeak)"
            />

            {/* Primary Obsidian Mountain Ridge */}
            <path
              d="M2 30L19 7L29 17L44 30H2Z"
              fill="url(#nightFrontPeak)"
            />

            {/* Crystalline Starlight Ridge Highlight */}
            <path
              d="M2 30L19 7L29 17L44 30"
              stroke="#38BDF8"
              strokeWidth="0.8"
              strokeOpacity="0.45"
              strokeLinecap="round"
              fill="none"
            />

            {/* Summit Flagpole */}
            <line x1="19" y1="7" x2="19" y2="2" stroke="#38BDF8" strokeWidth="0.9" strokeOpacity="0.8" />

            {/* Luminescent Cyan Starlight Pennant */}
            <motion.path
              d="M19 2.5L25 4.5L19 6.5Z"
              fill="#38BDF8"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scaleX: [1, 0.88, 1.05, 1],
                      skewY: [0, 4, -3, 0],
                    }
              }
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Summit Pulsing Beacon Light */}
            <motion.circle
              cx="19"
              cy="2"
              r="1.2"
              fill="#38BDF8"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.8, 1],
                      opacity: [1, 0.4, 1],
                    }
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {/* Fallback / All phase universal archetype */}
        {phase === 'all' && (
          <g>
            <circle cx="36" cy="7" r="3.5" fill="#34D399" fillOpacity="0.6" />
            <path d="M10 30L26 9L37 19L48 30H10Z" fill="url(#noonRearPeak)" />
            <path d="M3 30L20 6L30 16L45 30H3Z" fill="url(#noonFrontPeak)" />
            <line x1="20" y1="6" x2="20" y2="1.5" stroke="#FFFFFF" strokeWidth="0.9" />
            <motion.path
              d="M20 2L26 4L20 6Z"
              fill="#F43F5E"
              animate={reducedMotion ? undefined : { scaleX: [1, 0.9, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </g>
        )}
      </svg>
    </motion.div>
  );
};
