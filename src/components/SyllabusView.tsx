import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  BookOpen,
  Clock,
  Target,
  X,
  ArrowRight,
  Bone,
  Heart,
  FlaskConical,
  Microscope,
  Pill,
  ShieldCheck,
  Scale,
  Users,
  Eye,
  Headphones,
  Stethoscope,
  Scissors,
  Baby,
  Smile,
  Activity,
  Brain,
  ScanLine,
  Syringe,
  CheckCircle2,
  Compass,
  RotateCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, SubjectPhase, ConfidenceLevel } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { SubjectAppleIcon, getSubjectVisualTheme } from './SubjectAppleIcon';
import { DoctorMountainArt } from './DoctorMountainArt';
import { RevisionMatrixView } from './RevisionMatrixView';
import { AppStats, calculateAppStats } from '../utils/storage';
import { useCircadianTheme } from '../hooks/useCircadianTheme';
import { CircadianHeaderAtmosphere, CircadianPill } from './CircadianHeaderAtmosphere';
import { HeaderTabInsignia } from './HeaderTabInsignia';

interface SyllabusViewProps {
  state: AppState;
  stats?: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
  onUpdateSubjectRevisionDate?: (subjectId: string, date: string) => void;
  subTab?: 'curriculum' | 'revision';
  onSubTabChange?: (tab: 'curriculum' | 'revision') => void;
  onNavigateTab?: (tab: any) => void;
}

// Subject Icon & Accent Palette Map aligned with clinical editorial aesthetics
function getSubjectVisual(subjectId: string, fallbackColor?: string) {
  const theme = getSubjectVisualTheme(subjectId);
  return {
    icon: theme.icon,
    color: theme.color || fallbackColor || '#006B63',
    bg: `${theme.bgGradient} ${theme.border} ${theme.text}`,
    badge: theme.badgeType === 'high' ? 'High-yield' : theme.badgeType === 'important' ? 'Important' : 'Core',
    badgeType: theme.badgeType,
  };
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onUpdateConfidence,
  onUpdateSubjectRevisionDate,
  subTab,
  onSubTabChange,
  onNavigateTab,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'curriculum' | 'revision'>(
    subTab || 'curriculum'
  );

  React.useEffect(() => {
    if (subTab) {
      setCurrentSubTab(subTab);
    }
  }, [subTab]);

  const handleSubTabChange = (tab: 'curriculum' | 'revision') => {
    setCurrentSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [phaseFilter, setPhaseFilter] = useState<'all' | SubjectPhase>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'weightage' | 'progress' | 'alpha'>('default');
  const circadian = useCircadianTheme(state.settings?.bgTheme);

  // Total topics count & completed statistics
  const overallStats = useMemo(() => {
    let totalTopics = 0;
    let completedNotes = 0;
    let completedSubjectsCount = 0;

    FMGE_SUBJECTS.forEach((sub) => {
      const subProgress = state.subjectProgress[sub.id];
      const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
      totalTopics += allTopics.length;
      const done = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      completedNotes += done;
      if (allTopics.length > 0 && done === allTopics.length) {
        completedSubjectsCount++;
      }
    });

    const percentage = Math.round((completedNotes / Math.max(1, totalTopics)) * 100);
    return {
      totalTopics,
      completedNotes,
      percentage,
      totalSubjects: FMGE_SUBJECTS.length,
      completedSubjectsCount,
    };
  }, [state]);

  // Filtered & Sorted Subjects
  const filteredSubjects = useMemo(() => {
    let list = FMGE_SUBJECTS.filter((sub) => {
      if (phaseFilter !== 'all' && sub.phase !== phaseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubName =
          sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
        const subProgress = state.subjectProgress[sub.id];
        const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
        const matchesTopic = allTopics.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesSubName && !matchesTopic) return false;
      }
      return true;
    });

    if (sortBy === 'weightage') {
      list = [...list].sort((a, b) => b.weightage - a.weightage);
    } else if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progress') {
      list = [...list].sort((a, b) => {
        const aTopics = [...a.topics, ...(state.subjectProgress[a.id]?.customTopics || [])];
        const bTopics = [...b.topics, ...(state.subjectProgress[b.id]?.customTopics || [])];
        const aDone = aTopics.filter((t) => state.topicsState[`${a.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
        const bDone = bTopics.filter((t) => state.topicsState[`${b.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
        const aPct = aDone / Math.max(1, aTopics.length);
        const bPct = bDone / Math.max(1, bTopics.length);
        return aPct - bPct;
      });
    }

    return list;
  }, [phaseFilter, searchQuery, sortBy, state.subjectProgress, state.topicsState]);

  // Circumference for SVG Progress Gauge
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallStats.percentage / 100) * circumference;

  return (
    <div
      className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6 font-sans text-stone-900 ${
        currentSubTab === 'revision' ? 'pb-28 sm:pb-20' : 'pb-20'
      }`}
    >
      {/* ================= 1. STUDY EDITORIAL HEADER CARD ================= */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-3xl border border-stone-200/80 p-4 sm:px-6 sm:py-3.5 shadow-xs transition-colors duration-700 ${circadian.bannerBg}`}
      >
        {/* Dynamic Animated Circadian Time-of-Day Atmosphere & 2px Shimmer Track */}
        <CircadianHeaderAtmosphere circadian={circadian} />

        {/* Botanical Tree of Knowledge & Architectural Study Blueprint Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">

          {/* Subtle Curriculum Blueprint Grid */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.04] text-teal-950 pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="study-blueprint-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="28" cy="28" r="0.75" fill="currentColor" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#study-blueprint-grid)" />
          </svg>

          {/* Premium Botanical Tree of Knowledge & Architectural Study Codex Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[480px] overflow-hidden opacity-40 sm:opacity-55 md:opacity-[0.65] select-none pointer-events-none block">
            <svg viewBox="0 0 480 140" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <linearGradient id="codex-desk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#004D40" stopOpacity="0" />
                  <stop offset="30%" stopColor="#004D40" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#00695C" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#004D40" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="codex-page-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8F5E9" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#C8E6C9" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#A5D6A7" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="codex-cover-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00695C" />
                  <stop offset="100%" stopColor="#004D40" />
                </linearGradient>
                <linearGradient id="botanical-branch-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#004D40" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#00796B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#26A69A" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="botanical-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#81C784" />
                  <stop offset="50%" stopColor="#4CAF50" />
                  <stop offset="100%" stopColor="#2E7D32" />
                </linearGradient>
                <radialGradient id="codex-halo-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#10B981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00685F" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient Wisdom Halo Aura */}
              <motion.circle
                cx="370"
                cy="68"
                r="65"
                fill="url(#codex-halo-glow)"
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Study Desk Base Silhouette */}
              <path
                d="M 230 135 Q 360 132 480 135 L 480 140 L 230 140 Z"
                fill="url(#codex-desk-grad)"
              />

              {/* ═══ 1. OPEN MEDICAL CODEX / LEATHER-BOUND FOLIO ═══ */}
              <g transform="translate(370, 95)">
                {/* Book Base / Leather Cover Trim */}
                <path
                  d="M -75 22 C -40 28, -10 24, 0 32 C 10 24, 40 28, 75 22 C 73 26, 40 32, 0 36 C -40 32, -73 26, -75 22 Z"
                  fill="url(#codex-cover-grad)"
                  opacity="0.85"
                />

                {/* Left Folio Page Stack */}
                <path
                  d="M -72 20 C -42 25, -12 21, 0 29 L 0 6 C -12 -1, -42 3, -72 -2 Z"
                  fill="url(#codex-page-grad)"
                  stroke="#81C784"
                  strokeWidth="0.8"
                />

                {/* Right Folio Page Stack */}
                <path
                  d="M 0 29 C 12 21, 42 25, 72 20 L 72 -2 C 42 3, 12 -1, 0 6 Z"
                  fill="url(#codex-page-grad)"
                  stroke="#81C784"
                  strokeWidth="0.8"
                />

                {/* Turning Upper Leaf (Gentle Page Sway Animation) */}
                <motion.path
                  d="M 0 6 C 14 -3, 44 0, 70 -5 L 70 17 C 44 22, 14 19, 0 27 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.7"
                  stroke="#A5D6A7"
                  strokeWidth="0.8"
                  animate={{ y: [0, -2.5, 0], rotate: [0, 1.2, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Text Line Mockups on Open Folio */}
                <g stroke="#004D40" strokeOpacity="0.25" strokeWidth="0.9" strokeLinecap="round">
                  <line x1="-60" y1="5" x2="-14" y2="7" />
                  <line x1="-60" y1="10" x2="-20" y2="12" />
                  <line x1="-60" y1="15" x2="-16" y2="17" />
                  <line x1="-60" y1="20" x2="-26" y2="22" />

                  <line x1="14" y1="7" x2="60" y2="5" />
                  <line x1="14" y1="12" x2="56" y2="10" />
                  <line x1="14" y1="17" x2="58" y2="15" />
                  <line x1="14" y1="22" x2="48" y2="20" />
                </g>

                {/* Book Spine Center Marker */}
                <line x1="0" y1="4" x2="0" y2="33" stroke="#004D40" strokeWidth="1.8" strokeLinecap="round" />

                {/* Flowing Silk Bookmark Ribbon */}
                <motion.path
                  d="M 0 29 Q 12 45 8 60 Q 6 56 4 58 Q 2 45 0 29"
                  fill="#00796B"
                  animate={{ rotate: [-2, 4, -2] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </g>

              {/* ═══ 2. BOTANICAL ROD OF ASCLEPIUS & TREE OF KNOWLEDGE ═══ */}
              <g transform="translate(370, 96)">
                {/* Main Botanical Trunk Rising from Codex Spine */}
                <path
                  d="M 0 5 Q -6 -25 0 -55 Q 5 -75 0 -92"
                  stroke="url(#botanical-branch-grad)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Primary Left Branch */}
                <path
                  d="M -2 -32 Q -25 -42 -42 -50"
                  stroke="url(#botanical-branch-grad)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Secondary Left Sub-branch */}
                <path
                  d="M -18 -38 Q -32 -55 -40 -68"
                  stroke="url(#botanical-branch-grad)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Primary Right Branch */}
                <path
                  d="M 1 -38 Q 24 -46 44 -56"
                  stroke="url(#botanical-branch-grad)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Secondary Right Sub-branch */}
                <path
                  d="M 16 -43 Q 32 -60 42 -72"
                  stroke="url(#botanical-branch-grad)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Botanical Laurel Leaves with Gentle Sway */}
                <motion.g
                  animate={{ rotate: [-1.5, 1.5, -1.5] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Left Leaves */}
                  <path d="M -42 -50 Q -52 -55 -55 -48 Q -48 -42 -42 -50 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M -28 -40 Q -36 -46 -39 -39 Q -32 -33 -28 -40 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M -40 -68 Q -50 -75 -52 -67 Q -44 -60 -40 -68 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M -25 -52 Q -32 -60 -36 -54 Q -29 -47 -25 -52 Z" fill="url(#botanical-leaf-grad)" />

                  {/* Right Leaves */}
                  <path d="M 44 -56 Q 54 -62 57 -55 Q 50 -48 44 -56 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M 30 -44 Q 38 -50 42 -43 Q 34 -37 30 -44 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M 42 -72 Q 52 -80 55 -72 Q 47 -65 42 -72 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M 26 -56 Q 34 -64 38 -57 Q 31 -50 26 -56 Z" fill="url(#botanical-leaf-grad)" />

                  {/* Crown Sprout Leaves at Top */}
                  <path d="M 0 -92 Q -6 -104 0 -107 Q 6 -104 0 -92 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M 0 -92 Q -12 -98 -10 -90 Q 0 -88 0 -92 Z" fill="url(#botanical-leaf-grad)" />
                  <path d="M 0 -92 Q 12 -98 10 -90 Q 0 -88 0 -92 Z" fill="url(#botanical-leaf-grad)" />
                </motion.g>

                {/* Luminous Knowledge Fruit / Blossom Nodes (Representing Subject Milestones) */}
                <g>
                  <circle cx="-42" cy="-50" r="2.5" fill="#34D399" />
                  <circle cx="44" cy="-56" r="2.5" fill="#34D399" />
                  <circle cx="-40" cy="-68" r="2.5" fill="#34D399" />
                  <circle cx="42" cy="-72" r="2.5" fill="#34D399" />
                  <circle cx="0" cy="-92" r="3.2" fill="#6EE7B7" />
                  <motion.circle
                    cx="0"
                    cy="-92"
                    r="6.5"
                    stroke="#34D399"
                    strokeWidth="1.2"
                    fill="none"
                    animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                </g>
              </g>

              {/* ═══ 3. FLOATING MEDICINAL LEAF / WISDOM PARTICLES ═══ */}
              <motion.path
                d="M 290 40 Q 296 35 300 40 Q 295 46 290 40 Z"
                fill="url(#botanical-leaf-grad)"
                opacity="0.75"
                animate={{
                  y: [0, 25, 0],
                  x: [0, -12, 0],
                  rotate: [0, 22, 0],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path
                d="M 435 30 Q 442 24 446 30 Q 440 37 435 30 Z"
                fill="url(#botanical-leaf-grad)"
                opacity="0.65"
                animate={{
                  y: [0, 30, 0],
                  x: [0, 10, 0],
                  rotate: [0, -25, 0],
                }}
                transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
              <motion.circle
                cx="320"
                cy="60"
                r="1.8"
                fill="#34D399"
                animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="420"
                cy="85"
                r="1.5"
                fill="#6EE7B7"
                animate={{ opacity: [0.1, 0.7, 0.1], y: [0, -8, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              />
            </svg>
          </div>
        </div>

        {/* Content Layout with Original Previous Texts */}
        <div className="relative z-10 space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 max-w-2xl">
              <HeaderTabInsignia tab="syllabus" circadian={circadian} />

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                  <h1 className={`text-lg sm:text-xl lg:text-[23px] font-extrabold uppercase tracking-tight font-['Outfit'] leading-snug bg-clip-text text-transparent shrink-0 ${
                    circadian.isNight
                      ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-200'
                      : 'bg-gradient-to-r from-[#003830] via-[#008779] via-35% to-[#10B981]'
                  }`}>
                    YOUR STUDY PLAN
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold font-mono tracking-[0.14em] uppercase shadow-2xs shrink-0 border ${circadian.badgeBg} ${circadian.badgeBorder} ${circadian.badgeText}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${circadian.isNight ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]' : 'bg-emerald-500 shadow-[0_0_6px_#10b981]'}`} />
                    Curriculum · 19 Subjects
                  </span>
                </div>

                <p className={`text-xs sm:text-sm leading-normal line-clamp-1 sm:line-clamp-none ${circadian.subtitleColor}`}>
                  Master the 19 subjects. Step by step.
                </p>
              </div>
            </div>

            {/* Right Side: Live Circadian Phase Pill with Cycle Action */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <CircadianPill circadian={circadian} onCycle={circadian.cycleTheme} />
            </div>
          </div>

          {/* Secondary Sub-Tab Switcher Dock */}
          <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t ${circadian.isNight ? 'border-sky-800/40' : 'border-stone-200/70'}`}>
            <div className={`inline-flex p-0.5 backdrop-blur-md rounded-xl shadow-2xs border ${circadian.isNight ? 'bg-slate-900/80 border-sky-800/60' : 'bg-white/85 border-stone-200/80'}`}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleSubTabChange('curriculum')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentSubTab === 'curriculum'
                    ? 'bg-[#006B63] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-teal-50/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleSubTabChange('revision')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentSubTab === 'revision'
                    ? 'bg-[#006B63] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-teal-50/50'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Revision Matrix</span>
              </motion.button>
            </div>

            <div className="text-xs font-mono text-stone-500 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>19 Subjects · {overallStats.percentage}% Completed</span>
            </div>
          </div>
        </div>
      </motion.header>

      {currentSubTab === 'curriculum' ? (
        <>

      {/* ================= 4 METRIC CARDS ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Circular Gauge Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 76 76">
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="text-stone-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="38"
                cy="38"
                r={radius}
                className="text-[#006B63]"
                strokeWidth="6"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute font-display font-bold text-sm text-stone-900">
              {overallStats.percentage}%
            </span>
          </div>

          <div className="min-w-0 space-y-0.5">
            <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
              Curriculum Completed
            </h4>
            <div className="text-base sm:text-lg font-bold font-display text-stone-900">
              {overallStats.completedNotes} / {overallStats.totalTopics}
            </div>
            <p className="text-[11px] text-stone-400 truncate">
              {overallStats.completedSubjectsCount} / 19 subjects mastered
            </p>
          </div>
        </div>

        {/* Metric 2: Total Subjects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-sky-50/80 text-sky-700 border border-sky-100 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-bold font-display text-stone-900">
              19
            </div>
            <h4 className="text-xs font-semibold text-stone-700 font-display">
              Total Subjects
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              FMGE syllabus
            </p>
          </div>
        </div>

        {/* Metric 3: Estimated Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50/80 text-amber-700 border border-amber-100 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-bold font-display text-stone-900">
              ~ 480
            </div>
            <h4 className="text-xs font-semibold text-stone-700 font-display">
              Estimated Study Hours
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              Personalized plan
            </p>
          </div>
        </div>

        {/* Metric 4: Target Score */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 text-emerald-700 border border-emerald-100 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-bold font-display text-stone-900">
              {state.settings?.targetScore || 200}+
            </div>
            <h4 className="text-xs font-semibold text-stone-700 font-display">
              Target Score
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              Qualify with confidence
            </p>
          </div>
        </div>
      </div>

      {/* ================= PHASE FILTERS & SEARCH & SORT ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        {/* Phase Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {[
            { id: 'all', label: 'All Subjects (19)', shortLabel: 'All (19)' },
            { id: 'pre-clinical', label: 'Pre-Clinical (5)', shortLabel: 'Pre (5)' },
            { id: 'para-clinical', label: 'Para-Clinical (5)', shortLabel: 'Para (5)' },
            { id: 'clinical', label: 'Clinical (9)', shortLabel: 'Clinical (9)' },
          ].map((p) => {
            const isActive = phaseFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhaseFilter(p.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold font-display transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                  isActive
                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                    : 'bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 border-stone-200/80'
                }`}
              >
                <span className="hidden sm:inline">{p.label}</span>
                <span className="sm:hidden">{p.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search subjects, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-stone-200/90 bg-white py-2 pl-9 pr-8 text-xs text-stone-900 placeholder-stone-400 focus:border-[#006B63] focus:ring-1 focus:ring-[#006B63] focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-full border border-stone-200/90 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-stone-700 focus:border-[#006B63] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="default">Sort: Default</option>
              <option value="weightage">Weightage (High → Low)</option>
              <option value="progress">Progress (Low → High)</option>
              <option value="alpha">Alphabetical</option>
            </select>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================= SUBJECT CARDS LIST ================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono px-1">
          <span>Subjects & Curriculum Weightage</span>
          <span>{filteredSubjects.length} Disciplines</span>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
            <Compass className="h-8 w-8 text-stone-400 mx-auto" />
            <div className="text-sm font-semibold text-stone-700 font-display">
              No subjects or topics match "{searchQuery}"
            </div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try searching by subject name (e.g. "Anatomy", "Medicine") or specific clinical keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPhaseFilter('all');
              }}
              className="px-4 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold font-display transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubjects.map((sub) => {
              const subProgress = state.subjectProgress[sub.id];
              const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
              const notesDoneCount = allTopics.filter(
                (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
              ).length;
              const pct = Math.round((notesDoneCount / Math.max(1, allTopics.length)) * 100);

              // First uncompleted topic for "Next topic" recommendation
              const nextTopic =
                allTopics.find((t) => !(state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone)) ||
                allTopics[0];

              const visual = getSubjectVisual(sub.id, sub.color);
              const IconComponent = visual.icon;

              // Preview of high-yield topics
              const topicPreview = allTopics
                .slice(0, 4)
                .map((t) => t.name)
                .join(', ') + (allTopics.length > 4 ? '...' : '');

              return (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Subject Metadata */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <SubjectAppleIcon subjectId={sub.id} size="lg" className="shrink-0" />

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold font-display text-stone-900 group-hover:text-[#006B63] transition-colors truncate">
                          {sub.name}
                        </h3>
                        {/* Mobile Marks Badge */}
                        <span className="lg:hidden px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono font-semibold">
                          {sub.weightage}M
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-1 max-w-xl">
                        {topicPreview || sub.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Progress, Marks, Next Topic & Open CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0 justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Progress rail */}
                    <div className="w-full sm:w-36 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
                        <span>{notesDoneCount} / {allTopics.length}</span>
                        <span className="font-semibold text-stone-900">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-[#006B63]"
                          style={{ width: `${Math.max(pct > 0 ? 6 : 0, pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Marks Badge (Desktop) */}
                    <div className="hidden lg:block shrink-0">
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-semibold border border-stone-200/60 whitespace-nowrap">
                        {sub.weightage} Marks
                      </span>
                    </div>

                    {/* Priority / High-Yield Pill */}
                    <div className="hidden sm:block shrink-0">
                      {visual.badgeType === 'high' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/80 text-rose-700 border border-rose-200/60 text-xs font-semibold whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          High-yield
                        </span>
                      )}
                      {visual.badgeType === 'important' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/80 text-sky-700 border border-sky-200/60 text-xs font-semibold whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          Important
                        </span>
                      )}
                      {visual.badgeType === 'core' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200/60 text-xs font-semibold whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                          Core
                        </span>
                      )}
                    </div>

                    {/* Next Topic Pointer */}
                    {nextTopic && (
                      <div className="hidden xl:flex items-center gap-2 max-w-[170px] min-w-0 text-left shrink-0">
                        <div className="p-1.5 rounded-lg bg-teal-50/80 text-[#006B63] shrink-0">
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider leading-none">
                            Next topic
                          </div>
                          <div className="text-xs font-semibold text-stone-800 truncate font-display">
                            {nextTopic.name}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSubject(sub.id);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#006B63] hover:bg-[#00554E] text-white text-xs font-semibold font-display shadow-xs transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-[36px]"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
    ) : (
      <RevisionMatrixView
        state={state}
        stats={stats || calculateAppStats(state)}
        onSelectSubject={onSelectSubject}
        onToggleTopicState={onToggleTopicState}
        onUpdateSubjectRevisionDate={onUpdateSubjectRevisionDate || (() => {})}
        onBackToCurriculum={() => handleSubTabChange('curriculum')}
        onNavigateTab={onNavigateTab}
      />
    )}
    </div>
  );
};

