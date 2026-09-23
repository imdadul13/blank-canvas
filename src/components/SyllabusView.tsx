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
  Layers,
  BarChart3,
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
import { CircadianFocusDropdown } from './CircadianFocusDropdown';
import { HeaderGlassIcon } from './HeaderGlassIcon';

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
      {/* ================= 1. STUDY EDITORIAL HEADER CARD (Apple Glass Bento) ================= */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative rounded-[28px] sm:rounded-[32px] border p-4 sm:p-5 lg:p-5.5 shadow-sm transition-colors duration-700 ${
          circadian.isNight
            ? 'bg-slate-900/95 border-sky-800/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 shadow-sm'
        }`}
      >
        {/* Background Atmosphere & Mountain Art (isolated with overflow-hidden so popover never clips) */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[32px] pointer-events-none select-none" aria-hidden="true">
          <CircadianHeaderAtmosphere circadian={circadian} />

          {/* Scenic mountain & sunrise backdrop on far right */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-72 sm:w-96 select-none opacity-25 sm:opacity-35 dark:opacity-20 [mask-image:linear-gradient(to_left,black_50%,transparent_100%)]">
            <svg viewBox="0 0 380 160" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <radialGradient id="syl-sun-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="syl-mount-front" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#006B63" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#004D40" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id="syl-mount-back" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <circle cx="280" cy="85" r="45" fill="url(#syl-sun-glow)" />
              <path d="M 80 160 Q 180 80 290 120 T 380 160 Z" fill="url(#syl-mount-back)" />
              <path d="M 160 160 Q 250 95 380 130 L 380 160 Z" fill="url(#syl-mount-front)" />
            </svg>
          </div>
        </div>

        {/* Top Utility Strip: Eyebrow + Live Circadian Focus Dropdown */}
        <div className="relative z-20 flex items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-slate-800/70">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10.5px] font-mono font-bold tracking-[0.2em] uppercase text-teal-700 dark:text-teal-300">
              STUDY PLAN • CURRICULUM
            </span>
            <span className={circadian.isNight ? 'text-sky-800' : 'text-stone-300'}>•</span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase hidden sm:inline">
              DISCIPLINE TODAY · DOCTOR TOMORROW
            </span>
          </div>
          <CircadianFocusDropdown circadian={circadian} />
        </div>

        {/* Main 2-Section Balanced Bento Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3.5 items-center">
          {/* ═══ LEFT SECTION: BRAND LOCKUP, TITLE, BADGES, SUBTITLE & TABS (Cols 1-7) ═══ */}
          <div className="lg:col-span-7 space-y-3 min-w-0">
            <div className="flex items-start gap-3.5">
              <HeaderGlassIcon icon={BookOpen} variant="teal" isNight={circadian.isNight} />

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight font-display leading-tight">
                    <span className={circadian.isNight ? 'text-white' : 'text-slate-900'}>Your Study </span>
                    <span className="text-[#00685F] dark:text-teal-400">Plan</span>
                  </h1>

                  {/* Dual Badges with High-Contrast Crisp Borders */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-teal-500/10 dark:bg-teal-950/70 text-[#00685F] dark:text-teal-300 border border-teal-300/80 dark:border-teal-700 shadow-2xs">
                      <Layers className="w-3 h-3 text-[#00685F] dark:text-teal-300" />
                      <span>19 Subjects</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-amber-500/10 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 shadow-2xs">
                      <BarChart3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>FMGE Blueprint</span>
                    </span>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${circadian.isNight ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                  Master the 19 subjects systematically. Clinical depth, step by step.
                </p>
              </div>
            </div>

            {/* Apple SwiftUI Segmented Subtab Switcher */}
            <div className="inline-flex p-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSubTabChange('curriculum')}
                className={`relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  currentSubTab === 'curriculum'
                    ? 'text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {currentSubTab === 'curriculum' && (
                  <motion.span
                    layoutId="syllabus-active-subtab"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#00685F] shadow-xs"
                  />
                )}
                <BookOpen className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Curriculum</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubTabChange('revision')}
                className={`relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  currentSubTab === 'revision'
                    ? 'text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {currentSubTab === 'revision' && (
                  <motion.span
                    layoutId="syllabus-active-subtab"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#00685F] shadow-xs"
                  />
                )}
                <RotateCw className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Revision Matrix</span>
              </button>
            </div>
          </div>

          {/* ═══ RIGHT SECTION: INTEGRATED APPLE BENTO TELEMETRY CARD (Cols 8-12) ═══ */}
          <div className="lg:col-span-5">
            <div className={`p-4 rounded-2xl border backdrop-blur-2xl transition-all ${
              circadian.isNight
                ? 'bg-slate-900/90 border-slate-800/80 shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-slate-100'
                : 'bg-white/95 border-slate-200/90 shadow-[0_8px_28px_rgba(0,107,99,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] text-slate-900'
            }`}>
              <div className="flex items-center justify-between gap-4">
                {/* Circular Mastery Gauge */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="currentColor"
                        strokeWidth="7"
                        className={`fill-none ${circadian.isNight ? 'text-slate-800' : 'text-slate-100'}`}
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#10B981"
                        strokeWidth="7"
                        strokeLinecap="round"
                        className="fill-none"
                        initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - overallStats.percentage / 100) }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{ strokeDasharray: 2 * Math.PI * 38 }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className={`text-lg sm:text-xl font-extrabold font-mono tracking-tight leading-none ${
                        circadian.isNight ? 'text-white' : 'text-slate-900'
                      }`}>
                        {overallStats.percentage}%
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                        Completed
                      </span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono font-bold mt-1 ${circadian.isNight ? 'text-slate-300' : 'text-slate-700'}`}>
                    {overallStats.completedSubjectsCount}/{overallStats.totalSubjects} subjects
                  </span>
                </div>

                {/* 3-Row Compact Telemetry Stack */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                    circadian.isNight
                      ? 'bg-slate-800/70 border-slate-700/60'
                      : 'bg-teal-500/[0.06] border-teal-200/70'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="w-3.5 h-3.5 text-[#00685F] dark:text-teal-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">Total Subjects</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white shrink-0 ml-2">
                      {overallStats.totalSubjects}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                    circadian.isNight
                      ? 'bg-slate-800/70 border-slate-700/60'
                      : 'bg-emerald-500/[0.06] border-emerald-200/70'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">Mastered</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0 ml-2">
                      {overallStats.completedSubjectsCount}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                    circadian.isNight
                      ? 'bg-slate-800/70 border-slate-700/60'
                      : 'bg-sky-500/[0.06] border-sky-200/70'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">Target Score</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white shrink-0 ml-2">
                      {state.settings?.targetScore || 200}+
                    </span>
                  </div>
                </div>
              </div>

              {/* Micro-Quote Footer inside Bento Card */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <p className="italic text-slate-600 dark:text-slate-300 font-medium truncate">
                  &ldquo;Small steps make big doctors.&rdquo;
                </p>
                <span className="font-mono font-bold text-teal-700 dark:text-teal-400 tracking-wider shrink-0 ml-2">
                  FMGE 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {currentSubTab === 'curriculum' ? (
        <>

      {/* ================= 4 METRIC CARDS ROW (Apple Bento Style) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Circular Gauge Progress — Sapphire Ultramarine */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-4 group"
        >
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 76 76">
              <circle
                cx="38"
                cy="38"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="38"
                cy="38"
                r={radius}
                className="text-blue-600 dark:text-blue-400"
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
            <span className="absolute font-display font-black text-sm text-slate-950 dark:text-white font-mono">
              {overallStats.percentage}%
            </span>
          </div>

          <div className="min-w-0 space-y-0.5">
            <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider font-mono">
              Curriculum Completed
            </h4>
            <div className="text-base sm:text-lg font-black font-display text-slate-950 dark:text-white">
              {overallStats.completedNotes} / {overallStats.totalTopics}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
              {overallStats.completedSubjectsCount} / 19 subjects covered
            </p>
          </div>
        </motion.div>

        {/* Metric 2: Total Subjects — Iris Violet */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-violet-500/25">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-black font-display text-slate-950 dark:text-white leading-tight">
              19
            </div>
            <h4 className="text-xs font-bold text-violet-950 dark:text-violet-200 font-display">
              Total Subjects
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
              FMGE core blueprint
            </p>
          </div>
        </motion.div>

        {/* Metric 3: Estimated Study Hours — Radiant Amber */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-amber-500/25">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-black font-display text-slate-950 dark:text-white leading-tight">
              ~ 480h
            </div>
            <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 font-display">
              Estimated Study Hours
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
              Personalized pacing
            </p>
          </div>
        </motion.div>

        {/* Metric 4: Target Score — Mint Emerald */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/25">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-2xl font-black font-display text-slate-950 dark:text-white leading-tight">
              {state.settings?.targetScore || 200}+
            </div>
            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 font-display">
              Target Score
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
              Qualify with confidence
            </p>
          </div>
        </motion.div>
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
                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs font-bold'
                    : 'bg-white/90 backdrop-blur-md hover:bg-white text-stone-600 hover:text-stone-900 border-slate-200/80 shadow-2xs'
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
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search subjects, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/15 focus:outline-none transition-all shadow-xs"
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
              className="appearance-none rounded-full border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/15 focus:outline-none cursor-pointer transition-all shadow-xs"
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
          <div className="p-8 sm:p-12 text-center bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,107,99,0.04)] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00685F] border border-teal-100/80 flex items-center justify-center mx-auto shadow-2xs">
              <Compass className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-stone-900 font-display">
                No subjects or topics match "{searchQuery}"
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                Try searching by subject name (e.g. "Anatomy", "Medicine") or specific clinical keywords.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPhaseFilter('all');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#005750] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
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
              const appleTheme = getSubjectVisualTheme(sub.id);
              const IconComponent = visual.icon;

              // Preview of high-yield topics
              const topicPreview = allTopics
                .slice(0, 4)
                .map((t) => t.name)
                .join(', ') + (allTopics.length > 4 ? '...' : '');

              return (
                <motion.div
                  key={sub.id}
                  whileHover={{ y: -3, scale: 1.006 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  onClick={() => onSelectSubject(sub.id)}
                  className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white via-white to-slate-50/60 backdrop-blur-xl border border-slate-200/80 hover:${appleTheme.border} shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
                >
                  {/* Subject Theme Aura Light Leak on Hover */}
                  <div
                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                    style={{ backgroundColor: visual.color }}
                  />

                  {/* Left: Icon & Subject Metadata */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [-2, 2, 0] }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="shrink-0"
                    >
                      <SubjectAppleIcon subjectId={sub.id} size="lg" className="shrink-0" />
                    </motion.div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-extrabold font-display text-slate-900 group-hover:text-slate-950 transition-colors truncate">
                          {sub.name}
                        </h3>
                        {/* Marks Pill */}
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs"
                          style={{
                            backgroundColor: `${visual.color}12`,
                            color: visual.color,
                            borderColor: `${visual.color}35`,
                          }}
                        >
                          {sub.weightage} Marks
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                        {topicPreview || sub.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Progress, Marks, Next Topic & Open CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0 justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 relative z-10">
                    {/* Progress rail */}
                    <div className="w-full sm:w-36 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>{notesDoneCount} / {allTopics.length} covered</span>
                        <span className="font-extrabold text-slate-900">{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pct > 0 ? 8 : 0, pct)}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full transition-all"
                          style={{ backgroundColor: visual.color }}
                        />
                      </div>
                    </div>

                    {/* Priority / High-Yield Pill */}
                    <div className="hidden sm:block shrink-0">
                      {visual.badgeType === 'high' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/90 text-rose-700 border border-rose-200/80 text-xs font-semibold whitespace-nowrap shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          High-Yield
                        </span>
                      )}
                      {visual.badgeType === 'important' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/90 text-sky-700 border border-sky-200/80 text-xs font-semibold whitespace-nowrap shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          Important
                        </span>
                      )}
                      {visual.badgeType === 'core' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-semibold whitespace-nowrap shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Core
                        </span>
                      )}
                    </div>

                    {/* Next Topic Pointer */}
                    {nextTopic && (
                      <div className="hidden xl:flex items-center gap-2 max-w-[170px] min-w-0 text-left shrink-0">
                        <div
                          className="p-1.5 rounded-xl shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: `${visual.color}15`,
                            color: visual.color,
                          }}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-none">
                            Next topic
                          </div>
                          <div className="text-xs font-semibold text-slate-800 truncate font-display">
                            {nextTopic.name}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Open Button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSubject(sub.id);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-slate-950 hover:bg-[#006B63] text-white text-xs font-semibold font-display shadow-xs transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-[36px]"
                    >
                      <span>Study</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  </div>
                </motion.div>
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

