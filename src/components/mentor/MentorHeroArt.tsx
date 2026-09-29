import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * The Mentor's bespoke artwork: a consultation dossier carrying a live ECG
 * trace, with a stethoscope laid across it.
 *
 * Re-keyed from the Home blue it originally borrowed (#0071E3 / #0056CC /
 * #60B3FF) to the Mentor teal ramp. Borrowed blue was the main reason the
 * header read as a copy of another tab's hero rather than its own thing.
 *
 * Every gradient id is suffixed `-mentor` because several of these SVGs can
 * be alive at once and a duplicate `id` makes the first document's
 * definitions win.
 */
export const MentorHeroArt: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 right-0 hidden w-[26rem] select-none overflow-hidden sm:block ${className}`}
    >
      <svg viewBox="0 0 480 140" className="h-full w-full" fill="none" preserveAspectRatio="xMaxYMid meet">
        <defs>
          <linearGradient id="chart-mentor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
            <stop offset="60%" stopColor="#E4F7F5" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#B2F5EA" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="metal-mentor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="40%" stopColor="#94A3B8" />
            <stop offset="70%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="tube-mentor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#007AFF" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <radialGradient id="halo-mentor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient wisdom halo */}
        <motion.circle
          cx="375"
          cy="70"
          r="62"
          fill="url(#halo-mentor)"
          animate={reduced ? {} : { scale: [1, 1.16, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {/* 1 — consultation dossier */}
        <g transform="translate(345, 42) rotate(-5)">
          <rect x="-65" y="-10" width="130" height="92" rx="7" fill="#1D4ED8" opacity="0.15" />
          <rect x="-60" y="-6" width="120" height="85" rx="5" fill="url(#chart-mentor)" stroke="#93C5FD" strokeWidth="0.8" />
          <rect x="-24" y="-12" width="48" height="12" rx="3" fill="url(#metal-mentor)" />
          <circle cx="0" cy="-6" r="2.5" fill="#334155" />
          <g stroke="#1D4ED8" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round">
            <line x1="-50" y1="12" x2="10" y2="12" />
            <line x1="-50" y1="18" x2="35" y2="18" />
            <line x1="-50" y1="24" x2="45" y2="24" />
            <line x1="-50" y1="30" x2="-5" y2="30" />
          </g>
          <path
            d="M -50 52 L -32 52 L -28 44 L -24 62 L -20 38 L -16 58 L -12 52 L 2 52 L 6 46 L 10 56 L 14 52 L 48 52"
            stroke="#007AFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />
        </g>

        {/* 2 — stethoscope */}
        <g transform="translate(370, 75)">
          <path d="M -85 -35 C -75 -65, -35 -70, -10 -60" stroke="url(#metal-mentor)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M -60 -30 C -52 -55, -20 -62, 5 -55" stroke="url(#metal-mentor)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M -5 -58 C 15 -52, 22 -35, 12 -15 C 2 5, -15 25, 0 45 C 12 60, 45 45, 65 20" stroke="url(#tube-mentor)" strokeWidth="4.2" strokeLinecap="round" fill="none" />

          <g transform="translate(65, 20)">
            <rect x="-8" y="-3" width="8" height="6" rx="1.5" fill="url(#metal-mentor)" />
            <circle cx="0" cy="0" r="16" fill="url(#metal-mentor)" stroke="#007AFF" strokeWidth="1" />
            <circle cx="0" cy="0" r="12.5" fill="#1E3A8A" />
            <circle cx="0" cy="0" r="10.5" fill="url(#metal-mentor)" opacity="0.4" />
            <circle cx="0" cy="0" r="4" fill="#60A5FA" />
            <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />

            {/* Pulse rings grow from the chestpiece, not the viewBox centre. */}
            {!reduced && (
              <>
                <motion.circle
                  cx="0"
                  cy="0"
                  r="16"
                  stroke="#007AFF"
                  strokeWidth="1.5"
                  fill="none"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  animate={{ scale: [1, 1.8], opacity: [0.85, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="0"
                  cy="0"
                  r="16"
                  stroke="#60A5FA"
                  strokeWidth="1.2"
                  fill="none"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  animate={{ scale: [1, 2.3], opacity: [0.65, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                />
              </>
            )}
          </g>
        </g>

        {/* 3 — diagnostic pulse wave */}
        <motion.path
          d="M 160 115 L 205 115 L 213 100 L 221 130 L 229 92 L 237 125 L 243 115 L 285 115"
          stroke="#007AFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
          animate={reduced ? {} : { opacity: [0.4, 0.95, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/*
          Conduction runner dot.

          Rides a <g transform> rather than animating cx/cy directly: Motion's
          SVG-attribute path called setAttribute('cx', undefined) on the first
          frame, discarding the value it had just read.
        */}
        {!reduced && (
          <motion.g
            animate={{
              x: [0, 45, 53, 61, 69, 77, 83, 125],
              y: [0, 0, -15, 15, -23, 10, 0, 0],
              opacity: [0, 0.8, 1, 1, 1, 1, 0.8, 0],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="160" cy="115" r="3" fill="#007AFF" />
          </motion.g>
        )}

        {/* Clinical particle blips */}
        <motion.circle cx="310" cy="45" r="2" fill="#007AFF" animate={reduced ? {} : { opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.circle cx="440" cy="55" r="1.5" fill="#60A5FA" animate={reduced ? {} : { opacity: [0.1, 0.7, 0.1] }} transition={{ duration: 3.8, repeat: Infinity, delay: 0.8 }} />
        <motion.circle cx="280" cy="85" r="1.8" fill="#60A5FA" animate={reduced ? {} : { opacity: [0.2, 0.75, 0.2] }} transition={{ duration: 2.7, repeat: Infinity, delay: 1.4 }} />
      </svg>
    </div>
  );
};
