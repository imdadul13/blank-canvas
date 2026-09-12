import React from 'react';
import { motion } from 'motion/react';
import { CircadianTheme } from '../hooks/useCircadianTheme';

export type HeaderTabType =
  | 'syllabus'
  | 'practice'
  | 'progress'
  | 'grandtests'
  | 'daily'
  | 'pearls'
  | 'telegram'
  | 'mentor'
  | 'more';

interface HeaderTabInsigniaProps {
  tab: HeaderTabType;
  circadian: CircadianTheme;
  className?: string;
}

export const HeaderTabInsignia: React.FC<HeaderTabInsigniaProps> = ({
  tab,
  circadian,
  className = '',
}) => {
  const phase = circadian.timeOfDay; // 'morning' | 'afternoon' | 'evening' | 'night'
  const isNight = circadian.isNight;

  // Time-of-day dynamic vessel aesthetics
  const getPhaseStyles = () => {
    switch (phase) {
      case 'morning':
        return {
          vesselBg: 'bg-gradient-to-br from-amber-500/10 via-teal-500/10 to-emerald-500/15',
          borderColor: 'border-amber-300/60 dark:border-amber-400/40',
          shadowColor: 'shadow-[0_4px_16px_rgba(245,158,11,0.15)]',
          auraGlow: 'bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.35)_0%,transparent_70%)]',
          rimLight: 'from-amber-300/40 via-transparent to-transparent',
        };
      case 'afternoon':
        return {
          vesselBg: 'bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-teal-500/15',
          borderColor: 'border-sky-300/60 dark:border-sky-400/40',
          shadowColor: 'shadow-[0_4px_16px_rgba(14,165,233,0.15)]',
          auraGlow: 'bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.35)_0%,transparent_70%)]',
          rimLight: 'from-sky-300/40 via-transparent to-transparent',
        };
      case 'evening':
        return {
          vesselBg: 'bg-gradient-to-br from-orange-500/12 via-rose-500/10 to-amber-500/15',
          borderColor: 'border-orange-300/60 dark:border-orange-400/40',
          shadowColor: 'shadow-[0_4px_16px_rgba(249,115,22,0.18)]',
          auraGlow: 'bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.35)_0%,transparent_70%)]',
          rimLight: 'from-orange-300/40 via-transparent to-transparent',
        };
      case 'night':
      default:
        return {
          vesselBg: 'bg-gradient-to-br from-[#06111E] via-[#0B1E34] to-[#0A1A2E]',
          borderColor: 'border-sky-500/40',
          shadowColor: 'shadow-[0_4px_22px_rgba(56,189,248,0.28)]',
          auraGlow: 'bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.4)_0%,transparent_70%)]',
          rimLight: 'from-sky-400/50 via-transparent to-transparent',
        };
    }
  };

  const phaseStyle = getPhaseStyles();

  // Dynamic primary and secondary palette according to circadian phase
  const primaryColor = isNight
    ? '#38BDF8'
    : phase === 'morning'
      ? '#D97706'
      : phase === 'afternoon'
        ? '#0284C7'
        : '#EA580C'; // evening

  const accentColor = isNight
    ? '#2DD4BF'
    : phase === 'morning'
      ? '#059669'
      : phase === 'afternoon'
        ? '#0D9488'
        : '#F59E0B';

  // Render bespoke animated SVG matching each tab
  const renderInsigniaSvg = () => {
    switch (tab) {
      /* ═════════════════════════════════════════════════════════════════════
         1. SYLLABUS & STUDY PLAN: Medical Codex, Golden Ribbon & Turning Leaves
         ═════════════════════════════════════════════════════════════════════ */
      case 'syllabus':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="syl-spine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
              <linearGradient id="syl-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="syl-page" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isNight ? '#1E293B' : '#FFFFFF'} />
                <stop offset="100%" stopColor={isNight ? '#0F172A' : '#EFF9F6'} />
              </linearGradient>
            </defs>
            {/* Back cover */}
            <rect x="4" y="6" width="26" height="24" rx="3.5" fill="url(#syl-spine)" />
            {/* Page block */}
            <rect
              x="6.5"
              y="8"
              width="23.5"
              height="20"
              rx="2.5"
              fill="url(#syl-page)"
              stroke={primaryColor}
              strokeWidth="0.8"
            />
            {/* Spine accent bar */}
            <rect x="4" y="6" width="4" height="24" rx="2" fill={isNight ? '#0284C7' : '#004D40'} />
            {/* Gold bookmark ribbon with breathing motion */}
            <motion.path
              d="M 20 6 L 20 18 L 22.5 16 L 25 18 L 25 6 Z"
              fill="url(#syl-gold)"
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Medical Staff / Caduceus Cross on Page */}
            <motion.path
              d="M 13 12 L 13 22 M 9.5 16 L 16.5 16"
              stroke={primaryColor}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Animated Knowledge Spark Blip */}
            <motion.circle
              cx="26"
              cy="10"
              r="1.4"
              fill="#FDE047"
              animate={{ scale: [1, 1.7, 1], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         2. PRACTICE LAB & DRILLS: Acoustic Stethoscope with Live Sonar Pulse
         ═════════════════════════════════════════════════════════════════════ */
      case 'practice':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="prac-tubing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
              <radialGradient id="prac-bell-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.85" />
                <stop offset="100%" stopColor={accentColor} />
              </radialGradient>
            </defs>
            {/* Earpieces */}
            <circle cx="9" cy="7" r="1.8" fill={isNight ? '#94A3B8' : '#475569'} />
            <circle cx="23" cy="7" r="1.8" fill={isNight ? '#94A3B8' : '#475569'} />
            <path
              d="M 9 7 C 9 14, 16 16, 16 21 L 16 23"
              stroke="url(#prac-tubing)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 23 7 C 23 14, 16 16, 16 21"
              stroke="url(#prac-tubing)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Diaphragm outer ring */}
            <circle cx="16" cy="27" r="5.5" fill="url(#prac-bell-glow)" stroke={isNight ? '#7DD3FC' : '#99F6E4'} strokeWidth="1.2" />
            {/* Center metallic chestpiece core */}
            <circle cx="16" cy="27" r="2.5" fill="#FFFFFF" />
            {/* Expanding Acoustic Sonar Ripple */}
            <motion.circle
              cx="16"
              cy="27"
              r="5"
              stroke={primaryColor}
              strokeWidth="1.4"
              fill="none"
              animate={{ scale: [1, 2], opacity: [0.95, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
            {/* Micro ECG spark trace */}
            <motion.path
              d="M 24 18 L 26 18 L 27.5 14 L 29 22 L 30.5 18 L 33 18"
              stroke="#F43F5E"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         3. PERFORMANCE & DIAGNOSTICS: Diagnostic Radar Sextant & Biometric Trajectory
         ═════════════════════════════════════════════════════════════════════ */
      case 'progress':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="prog-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor={isNight ? '#6366F1' : '#4F46E5'} />
                <stop offset="50%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
            </defs>
            {/* Trajectory Axis Grid */}
            <path d="M 5 30 L 31 30 M 5 30 L 5 6" stroke={isNight ? '#334155' : '#CBD5E1'} strokeWidth="1.4" strokeLinecap="round" />
            {/* Trajectory Curve */}
            <motion.path
              d="M 6 27 C 12 25, 16 19, 21 17 C 25 15, 27 11, 31 8"
              stroke="url(#prog-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Milestone Node Beacons */}
            <circle cx="12" cy="24" r="2" fill={isNight ? '#818CF8' : '#6366F1'} />
            <circle cx="21" cy="17" r="2.2" fill={primaryColor} />
            <circle cx="31" cy="8" r="3" fill={accentColor} />
            {/* Glowing Peak Horizon Flare */}
            <motion.circle
              cx="31"
              cy="8"
              r="5.5"
              stroke={accentColor}
              strokeWidth="1.4"
              fill="none"
              animate={{ scale: [1, 1.9], opacity: [0.95, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         4. GRAND TESTS & MOCKS: Laureled NBE Medallion with Starburst Glint
         ═════════════════════════════════════════════════════════════════════ */
      case 'grandtests':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="gt-ribbon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={isNight ? '#4F46E5' : '#1E1B4B'} />
              </linearGradient>
              <linearGradient id="gt-gold-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Award Ribbon Loop */}
            <path d="M 13 20 L 9 32 L 18 27 L 27 32 L 23 20" fill="url(#gt-ribbon)" opacity="0.92" />
            {/* Medallion Base Outer Ring */}
            <circle cx="18" cy="14" r="10" fill="url(#gt-gold-ring)" />
            {/* Inner Core */}
            <circle cx="18" cy="14" r="7.5" fill={isNight ? '#0F172A' : '#FFFFFF'} stroke="#FDE68A" strokeWidth="0.8" />
            {/* Radiant Star in Center */}
            <motion.path
              d="M 18 8.5 L 19.8 12 L 23.8 12.6 L 20.9 15.4 L 21.6 19.4 L 18 17.5 L 14.4 19.4 L 15.1 15.4 L 12.2 12.6 L 16.2 12 Z"
              fill="url(#gt-gold-ring)"
              animate={{ rotate: [0, 4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Diamond Glint Spark */}
            <motion.path
              d="M 25 8 L 26.5 9.5 L 25 11 L 23.5 9.5 Z"
              fill="#FFFFFF"
              animate={{ scale: [0.6, 1.4, 0.6], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         5. DAILY PLANNER: Chronometer Astrolabe Dial & Streak Flame Ember
         ═════════════════════════════════════════════════════════════════════ */
      case 'daily':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="daily-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
              <linearGradient id="flame-grad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FEF08A" />
              </linearGradient>
            </defs>
            {/* Calendar / Chronometer Frame */}
            <rect x="5" y="7" width="23" height="23" rx="4.5" fill={isNight ? '#0F172A' : '#FFFFFF'} stroke="url(#daily-grad)" strokeWidth="1.8" />
            {/* Header Banner strip */}
            <path d="M 5 11 C 5 8.5 7 7 9.5 7 L 23.5 7 C 26 7 28 8.5 28 11 L 28 12.5 L 5 12.5 Z" fill="url(#daily-grad)" />
            {/* Binding Rings */}
            <rect x="10" y="4" width="2.2" height="5" rx="1.1" fill="#CBD5E1" />
            <rect x="21" y="4" width="2.2" height="5" rx="1.1" fill="#CBD5E1" />
            {/* Calendar Grid Dot Matrix */}
            <circle cx="10.5" cy="17" r="1.3" fill={isNight ? '#64748B' : '#94A3B8'} />
            <circle cx="16.5" cy="17" r="1.3" fill={isNight ? '#64748B' : '#94A3B8'} />
            <circle cx="22.5" cy="17" r="1.3" fill={isNight ? '#64748B' : '#94A3B8'} />
            <circle cx="10.5" cy="23" r="1.3" fill={isNight ? '#64748B' : '#94A3B8'} />
            {/* Target Checkmark */}
            <motion.path
              d="M 14.5 23 L 16.5 25 L 21 20"
              stroke={primaryColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Ember Streak Flame in corner */}
            <motion.path
              d="M 26 23 C 26 26.5, 29.5 27, 29.5 29 C 29.5 30.8, 27.5 32, 26 32 C 24 32, 22.5 30.8, 22.5 29 C 22.5 26.5, 25.5 24, 26 23 Z"
              fill="url(#flame-grad)"
              animate={{ scale: [1, 1.16, 1], y: [0, -1.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         6. KNOWLEDGE & PEARLS: Luminescent Sacred Cerebral Reliquary & Pearl
         ═════════════════════════════════════════════════════════════════════ */
      case 'pearls':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <radialGradient id="pearl-core" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#FEF08A" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#92400E" />
              </radialGradient>
              <radialGradient id="pearl-halo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.45" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Ambient Aura Halo */}
            <circle cx="18" cy="18" r="14" fill="url(#pearl-halo)" />
            {/* Neural Matrix Brain Shell Silhouette */}
            <path
              d="M 18 6 C 12 6, 8 11, 8 16.5 C 8 20.5, 10.5 24, 13.5 25.5 C 14 27, 16 29, 18 29 C 20 29, 22 27, 22.5 25.5 C 25.5 24, 28 20.5, 28 16.5 C 28 11, 24 6, 18 6 Z"
              stroke={primaryColor}
              strokeWidth="1.4"
              fill={isNight ? '#0F172A' : '#FFFBEB'}
              opacity="0.95"
            />
            {/* Sacred Pearl Core in Center */}
            <motion.circle
              cx="18"
              cy="18"
              r="6"
              fill="url(#pearl-core)"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Pearl Core Specular Highlight */}
            <circle cx="16.2" cy="16.2" r="1.8" fill="#FFFFFF" opacity="0.95" />
            {/* Synaptic Orbital Ring */}
            <motion.ellipse
              cx="18"
              cy="18"
              rx="8.5"
              ry="3.5"
              stroke={accentColor}
              strokeWidth="0.9"
              fill="none"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         7. TELEGRAM HUB: Aerodynamic Vector with Radar Waves & Signal Pulse
         ═════════════════════════════════════════════════════════════════════ */
      case 'telegram':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="tg-plane-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="60%" stopColor={isNight ? '#0284C7' : '#0369A1'} />
                <stop offset="100%" stopColor={isNight ? '#0369A1' : '#075985'} />
              </linearGradient>
            </defs>
            {/* Concentric Broadcast Radar Waves */}
            <motion.path
              d="M 6 13 A 16 16 0 0 1 20 4"
              stroke={primaryColor}
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.1, 0.75, 0.1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M 9 17 A 12 12 0 0 1 20 8"
              stroke={accentColor}
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0.2, 0.95, 0.2] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            {/* Telegram Aerofoil Paper Plane */}
            <motion.g
              animate={{ x: [0, 2, 0], y: [0, -2, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 7 18 L 29 7 L 22 29 L 17 21 L 11 24 L 12 18 Z"
                fill="url(#tg-plane-grad)"
              />
              <path
                d="M 17 21 L 29 7 L 12 18 Z"
                fill="#FFFFFF"
                opacity="0.32"
              />
              <path
                d="M 17 21 L 21 24 L 29 7 Z"
                fill="#000000"
                opacity="0.16"
              />
            </motion.g>
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         8. FACULTY MENTOR: Asclepius Caduceus Staff & Wisdom Iris
         ═════════════════════════════════════════════════════════════════════ */
      case 'mentor':
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="mentor-staff-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
            </defs>
            {/* Central Staff of Asclepius */}
            <line x1="18" y1="5" x2="18" y2="32" stroke="url(#mentor-staff-grad)" strokeWidth="2.2" strokeLinecap="round" />
            {/* Top Wisdom Pinecone / Globe */}
            <circle cx="18" cy="5" r="2.5" fill="#F59E0B" />
            {/* Sacred Entwined Serpent Body */}
            <motion.path
              d="M 12 10 C 15 9, 18 9, 19 11 C 20 13, 15 16, 17 19 C 18 22, 20 24, 18 27"
              stroke={primaryColor}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              animate={{ pathLength: [0.95, 1, 0.95] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Serpent Head Eye */}
            <circle cx="12.5" cy="10.2" r="1" fill="#FEF08A" />
            {/* Diagnostic Wisdom Halo Ring */}
            <motion.circle
              cx="18"
              cy="5"
              r="4.8"
              stroke={accentColor}
              strokeWidth="1"
              strokeDasharray="2 2"
              fill="none"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        );

      /* ═════════════════════════════════════════════════════════════════════
         9. CLINICAL UTILITIES / MORE: Faceted Quad Matrix with Shimmer Rotation
         ═════════════════════════════════════════════════════════════════════ */
      case 'more':
      default:
        return (
          <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8.5 sm:h-8.5" fill="none">
            <defs>
              <linearGradient id="more-tile-1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={isNight ? '#0284C7' : '#0369A1'} />
              </linearGradient>
              <linearGradient id="more-tile-2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={accentColor} />
                <stop offset="100%" stopColor={isNight ? '#0D9488' : '#004D40'} />
              </linearGradient>
              <linearGradient id="more-tile-3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isNight ? '#818CF8' : '#6366F1'} />
                <stop offset="100%" stopColor={isNight ? '#6366F1' : '#4338CA'} />
              </linearGradient>
              <linearGradient id="more-tile-4" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            {/* 4 Multi-spectral Precision Cubes */}
            <motion.rect
              x="6"
              y="6"
              width="10"
              height="10"
              rx="3"
              fill="url(#more-tile-1)"
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.rect
              x="20"
              y="6"
              width="10"
              height="10"
              rx="3"
              fill="url(#more-tile-2)"
              animate={{ scale: [1.07, 1, 1.07] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.rect
              x="6"
              y="20"
              width="10"
              height="10"
              rx="3"
              fill="url(#more-tile-3)"
              animate={{ scale: [1.07, 1, 1.07] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            <motion.rect
              x="20"
              y="20"
              width="10"
              height="10"
              rx="3"
              fill="url(#more-tile-4)"
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
          </svg>
        );
    }
  };

  // Tiny time-of-day celestial glyph indicator
  const renderCelestialPebble = () => {
    switch (phase) {
      case 'morning':
        return (
          <div
            title="Morning Sunrise Mode"
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border border-white shadow-xs flex items-center justify-center animate-pulse"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        );
      case 'afternoon':
        return (
          <div
            title="Afternoon Solar Mode"
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 border border-white shadow-xs flex items-center justify-center animate-pulse"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        );
      case 'evening':
        return (
          <div
            title="Sunset Golden Hour Mode"
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 border border-white shadow-xs flex items-center justify-center animate-pulse"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        );
      case 'night':
      default:
        return (
          <div
            title="Celestial Nocturnal Sky Mode"
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border border-sky-300/80 shadow-[0_0_8px_#38bdf8] flex items-center justify-center animate-pulse"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-100" />
          </div>
        );
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: 1 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border ${phaseStyle.borderColor} ${phaseStyle.vesselBg} ${phaseStyle.shadowColor} shrink-0 select-none cursor-default transition-all duration-500 ${className}`}
    >
      {/* Ambient glowing radial aura backdrop matching circadian phase */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl ${phaseStyle.auraGlow} transition-all duration-700`} />

      {/* Top rim specular highlight line */}
      <div className={`pointer-events-none absolute top-0 left-2 right-2 h-[1.5px] bg-gradient-to-r ${phaseStyle.rimLight} rounded-full`} />

      {/* Core animated SVG artwork */}
      <div className="relative z-10 flex items-center justify-center">
        {renderInsigniaSvg()}
      </div>

      {/* Dynamic time-of-day pebble indicator */}
      {renderCelestialPebble()}
    </motion.div>
  );
};
