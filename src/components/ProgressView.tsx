import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Award,
  Compass,
  BookOpen,
  Search,
  HelpCircle,
  Activity,
  FileText,
  Brain,
  Layers,
  Eye,
  Calendar,
  Target,
} from 'lucide-react';
import { AppState, DailyTask, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import {
  calculateOverallPerformance,
  calculateSubjectPerformanceMetrics,
  calculateImagePerformanceSummary,
} from '../utils/performanceEngine';
import { calculateStudyReadiness } from '../utils/readinessEngine';
import { getTopPriorityTopics } from '../utils/adaptivePriorityEngine';
import { ReadinessBreakdownModal } from './ReadinessBreakdownModal';
import { SubjectDiagnosticDetailModal } from './SubjectDiagnosticDetailModal';
import { TopicMasteryDetailModal } from './TopicMasteryDetailModal';
import { AccuracyTrendDetailModal } from './AccuracyTrendDetailModal';
import { GrandTestDiagnosticModal } from './GrandTestDiagnosticModal';
import { ErrorVaultDiagnosticModal } from './ErrorVaultDiagnosticModal';
import { ErrorsView } from './ErrorsView';
import { FmgePredictorView } from './FmgePredictorView';

interface ProgressViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onAddTask?: (task: DailyTask) => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onUpdateSubjectRevisionDate?: (subjectId: string, date: string) => void;
  onNavigateTab?: (tab: string) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
    source?: any
  ) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed?: (id: string) => void;
  onDeleteErrorItem?: (id: string) => void;
  onUpdateAppState?: (updater: (prev: AppState) => AppState) => void;
  subTab?: 'overview' | 'errors' | 'predictor';
  onSubTabChange?: (tab: 'overview' | 'errors' | 'predictor') => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onAddTask,
  onOpenAiCoach,
  onUpdateSubjectRevisionDate,
  onNavigateTab,
  onLaunchPracticeSession,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onUpdateAppState,
  subTab,
  onSubTabChange,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'errors' | 'predictor'>(
    subTab || 'overview'
  );

  React.useEffect(() => {
    if (subTab) {
      setCurrentSubTab(subTab);
    }
  }, [subTab]);

  const handleSubTabChange = (tab: 'overview' | 'errors' | 'predictor') => {
    setCurrentSubTab(tab);
    onSubTabChange?.(tab);
  };
  // Filter and Search States
  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'clinical' | 'preclinical' | 'paraclinical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReadinessBreakdown, setShowReadinessBreakdown] = useState(false);

  // 3C Drill-down Modal States
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [selectedDiagnosticSubjectId, setSelectedDiagnosticSubjectId] = useState<string | null>(null);
  const [isTopicMasteryModalOpen, setIsTopicMasteryModalOpen] = useState(false);
  const [isAccuracyTrendModalOpen, setIsAccuracyTrendModalOpen] = useState(false);
  const [isGrandTestModalOpen, setIsGrandTestModalOpen] = useState(false);
  const [isErrorVaultModalOpen, setIsErrorVaultModalOpen] = useState(false);

  // 1. CALCULATE REAL READINESS (0-100 & 8 Pillars)
  const readiness = useMemo(() => calculateStudyReadiness(state), [state]);

  // 2. CALCULATE OVERALL PERFORMANCE (Accuracy, Speed, Errors, Topic States)
  const overallPerf = useMemo(() => calculateOverallPerformance(state), [state]);
  const hasPerformanceHistory = overallPerf.totalAttempts > 0 || (state.errorNotebook?.length || 0) > 0;

  // 3. RETRIEVE TOP ADAPTIVE WEAK / REVISION-DUE TOPICS
  const topPriorityTopics = useMemo(() => getTopPriorityTopics(state, 4), [state]);

  // 4. IMAGE-BASED MCQ ANALYTICS
  const imageSummary = useMemo(() => calculateImagePerformanceSummary(state), [state]);

  // 5. SUBJECT PERFORMANCE AGGREGATES ACROSS ALL 19 SUBJECTS
  const subjectList = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      let disciplineType: 'clinical' | 'preclinical' | 'paraclinical' = 'clinical';
      if (sub.phase === 'pre-clinical') {
        disciplineType = 'preclinical';
      } else if (sub.phase === 'para-clinical') {
        disciplineType = 'paraclinical';
      }

      const metrics = overallPerf.subjectMetrics?.[sub.id] || calculateSubjectPerformanceMetrics(sub.id, state);
      return {
        ...sub,
        disciplineType,
        metrics,
      };
    });
  }, [overallPerf.subjectMetrics, state]);

  // Filtered Subject List
  const filteredSubjects = useMemo(() => {
    return subjectList.filter((s) => {
      if (selectedDiscipline !== 'all' && s.disciplineType !== selectedDiscipline) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [subjectList, selectedDiscipline, searchQuery]);

  // Discipline Counts for Filter Pills
  const counts = useMemo(() => {
    const clinical = subjectList.filter((s) => s.disciplineType === 'clinical').length;
    const paraclinical = subjectList.filter((s) => s.disciplineType === 'paraclinical').length;
    const preclinical = subjectList.filter((s) => s.disciplineType === 'preclinical').length;
    return { all: subjectList.length, clinical, paraclinical, preclinical };
  }, [subjectList]);

  // 6. REAL ACCURACY TREND SAMPLES (Chronological Attempts)
  const accuracyTrendPoints = useMemo(() => {
    const attempts = state.mcqAttempts || [];
    if (attempts.length < 2) return [];

    // Sort attempts by timestamp ascending
    const sorted = [...attempts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group into chronological chunks of 5-10 attempts to represent meaningful sessions
    const chunkSize = Math.max(3, Math.floor(sorted.length / 6));
    const points: { label: string; accuracy: number; count: number }[] = [];

    for (let i = 0; i < sorted.length; i += chunkSize) {
      const chunk = sorted.slice(i, i + chunkSize);
      const correct = chunk.filter((a) => a.isCorrect).length;
      const acc = Math.round((correct / chunk.length) * 100);
      const dateStr = new Date(chunk[chunk.length - 1].timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      points.push({
        label: dateStr,
        accuracy: acc,
        count: chunk.length,
      });
    }

    return points.slice(-6); // Keep last 6 session points
  }, [state.mcqAttempts]);

  // 7. REAL GRAND TESTS DATA
  const grandTests = useMemo(() => {
    const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
    return [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.grandTests]);

  const latestGT = grandTests.length > 0 ? grandTests[grandTests.length - 1] : null;

  // Formatted Current / Live Date for Header
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Readiness Verdict Stage Label
  const readinessStage = useMemo(() => {
    const s = readiness.score;
    if (s >= 75) return { label: 'Exam Ready', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (s >= 50) return { label: 'Developing', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Needs Focus', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }, [readiness.score]);

  // Dynamic Accuracy Delta
  const accuracyDelta = overallPerf.recentAccuracy - overallPerf.overallAccuracy;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-5 sm:space-y-6 text-[#121E1B] font-sans antialiased">
      {/* ================= 1. PERFORMANCE HEADER CARD & SECONDARY SWITCHER ================= */}
      <header className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#F4F2FB] p-4 sm:px-6 sm:py-3.5 shadow-xs">
        {/* Dynamic Animated Ambient Data Analytics Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">

          {/* Soft glowing corner radial gradient orbs with breathing motion */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.55, 0.35],
              x: [0, 15, 0],
            }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/35 via-indigo-200/25 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.08, 1, 1.08],
              opacity: [0.22, 0.38, 0.22],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-200/30 via-teal-100/20 to-transparent blur-3xl"
          />
          <div className="absolute -top-12 left-1/3 h-52 w-96 rounded-full bg-gradient-to-r from-violet-200/20 via-indigo-100/15 to-transparent blur-3xl" />

          {/* High-Tech Diagnostic Data Dot Matrix Backdrop */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.035] text-violet-950 pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="performance-dot-matrix" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1.1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#performance-dot-matrix)" />
          </svg>

          {/* Premium Lighthouse of Insight & Navigational Celestial Compass Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[520px] overflow-hidden opacity-45 sm:opacity-60 md:opacity-[0.72] select-none pointer-events-none block">
            <svg viewBox="0 0 520 145" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <linearGradient id="progress-cliff-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#312E81" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#1E1B4B" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="progress-tower-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#EDE9FE" />
                  <stop offset="80%" stopColor="#C4B5FD" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
                <linearGradient id="progress-beam-grad" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#FDE047" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#FACC15" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#818CF8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="progress-lantern-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#FEF08A" />
                  <stop offset="80%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Twinkling Diagnostic Constellation Stars in Indigo Sky */}
              <g fill="#E0E7FF">
                <motion.circle cx="180" cy="28" r="1.4" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 2.8, repeat: Infinity }} />
                <motion.circle cx="230" cy="18" r="1.2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 3.4, repeat: Infinity, delay: 0.7 }} />
                <motion.circle cx="270" cy="35" r="1.6" animate={{ opacity: [0.2, 0.85, 0.2] }} transition={{ duration: 2.4, repeat: Infinity, delay: 1.2 }} />
                <motion.circle cx="315" cy="22" r="1.3" animate={{ opacity: [0.4, 0.95, 0.4] }} transition={{ duration: 3.1, repeat: Infinity, delay: 0.4 }} />
                <motion.circle cx="490" cy="26" r="1.2" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2.7, repeat: Infinity, delay: 1.5 }} />
                {/* Constellation Guide Trajectory Lines */}
                <line x1="180" y1="28" x2="230" y2="18" stroke="#818CF8" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
                <line x1="230" y1="18" x2="270" y2="35" stroke="#818CF8" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
                <line x1="270" y1="35" x2="315" y2="22" stroke="#818CF8" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
              </g>

              {/* ═══ 1. NAVIGATIONAL SEXTANT / STAR COMPASS OVERLAY ═══ */}
              <g transform="translate(260, 48) scale(0.65)" opacity="0.65">
                {/* Graduated Index Arc */}
                <path d="M -35 30 A 50 50 0 0 1 35 30" stroke="#818CF8" strokeWidth="1.6" fill="none" strokeDasharray="3 2" />
                {/* Radial Index Arms */}
                <line x1="0" y1="-10" x2="-35" y2="30" stroke="#818CF8" strokeWidth="1.2" />
                <line x1="0" y1="-10" x2="35" y2="30" stroke="#818CF8" strokeWidth="1.2" />
                <line x1="0" y1="-10" x2="0" y2="32" stroke="#C4B5FD" strokeWidth="1.4" />
                {/* Index Mirror Pivot */}
                <circle cx="0" cy="-10" r="3.5" fill="#4338CA" stroke="#C4B5FD" strokeWidth="1" />
              </g>

              {/* ═══ 2. COASTAL BLUFF & OCEAN SURF ═══ */}
              {/* Rolling Wave Surf */}
              <path
                d="M 120 145 C 180 135, 260 138, 340 130 C 400 124, 460 132, 520 128 L 520 145 Z"
                fill="#1E1B4B"
                opacity="0.8"
              />
              <path
                d="M 120 142 Q 220 134 320 138 Q 420 130 520 134"
                stroke="#A5B4FC"
                strokeWidth="1.4"
                strokeDasharray="8 6"
                opacity="0.5"
              />

              {/* Rocky Coastal Cliff Silhouette */}
              <path
                d="M 320 145 L 365 110 L 410 88 L 465 72 L 520 80 L 520 145 Z"
                fill="url(#progress-cliff-grad)"
              />

              {/* ═══ 3. ARCHITECTURAL LIGHTHOUSE OF INSIGHT ═══ */}
              <g transform="translate(460, 24)">
                {/* Classical Tapered Stone Tower */}
                <polygon points="-11,54 11,54 8,14 -8,14" fill="url(#progress-tower-grad)" stroke="#4338CA" strokeWidth="0.8" />
                {/* Tower Horizontal Indigo Stripe Accent */}
                <polygon points="-10,38 10,38 9,28 -9,28" fill="#4338CA" />

                {/* Gallery Observation Deck & Railing */}
                <rect x="-14" y="12" width="28" height="3" rx="1" fill="#1E1B4B" stroke="#818CF8" strokeWidth="0.8" />
                <line x1="-13" y1="9" x2="13" y2="9" stroke="#818CF8" strokeWidth="1" />
                <line x1="-10" y1="9" x2="-10" y2="12" stroke="#818CF8" strokeWidth="0.8" />
                <line x1="0" y1="9" x2="0" y2="12" stroke="#818CF8" strokeWidth="0.8" />
                <line x1="10" y1="9" x2="10" y2="12" stroke="#818CF8" strokeWidth="0.8" />

                {/* Lantern Room Glass Enclosure */}
                <rect x="-8" y="0" width="16" height="12" fill="#FEF08A" fillOpacity="0.4" stroke="#1E1B4B" strokeWidth="0.8" />
                <line x1="-4" y1="0" x2="-4" y2="12" stroke="#1E1B4B" strokeWidth="0.8" />
                <line x1="4" y1="0" x2="4" y2="12" stroke="#1E1B4B" strokeWidth="0.8" />

                {/* Domed Roof Cupola & Lightning Rod */}
                <path d="M -8 0 A 8 8 0 0 1 8 0 Z" fill="#4338CA" stroke="#818CF8" strokeWidth="0.8" />
                <line x1="0" y1="-8" x2="0" y2="-1" stroke="#FDE047" strokeWidth="1.2" />
                <circle cx="0" cy="-8" r="1.5" fill="#FDE047" />

                {/* ═══ 4. RADIANT SWEEPING LIGHTHOUSE BEACON BEAM ═══ */}
                <motion.g
                  animate={{ rotate: [-26, 18, -26] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: '0px 6px' }}
                >
                  <polygon
                    points="0,6 -260,-45 -260,65"
                    fill="url(#progress-beam-grad)"
                    opacity="0.85"
                  />
                  {/* Secondary Back Light Cone */}
                  <polygon
                    points="0,6 70,-8 70,20"
                    fill="url(#progress-beam-grad)"
                    opacity="0.4"
                  />
                </motion.g>

                {/* Pulsing Central Lantern Core */}
                <circle cx="0" cy="6" r="4.5" fill="url(#progress-lantern-core)" />
                <motion.circle
                  cx="0"
                  cy="6"
                  r="8"
                  stroke="#FEF08A"
                  strokeWidth="1.4"
                  fill="none"
                  animate={{ scale: [1, 2.2], opacity: [0.9, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-10 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-50/90 border border-indigo-100/90 text-indigo-600 shadow-2xs shrink-0">
                  <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-indigo-600 stroke-[2]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 font-mono block">
                    Performance &amp; Diagnostics
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold font-['Newsreader'] tracking-tight bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 bg-clip-text text-transparent leading-snug">
                    Know exactly where you stand.
                  </h1>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#4A5553] leading-normal font-sans line-clamp-1 sm:line-clamp-none pl-0 sm:pl-[52px]">
                Diagnose preparation depth, clinical solving accuracy, and high-yield retention.
              </p>
            </div>

            {/* Date Badge */}
            <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1 rounded-full bg-gradient-to-r from-white/95 via-violet-50/40 to-white/95 border border-violet-100/90 text-[11px] font-mono text-stone-600 shadow-2xs backdrop-blur-md shrink-0">
              <Calendar className="w-3 h-3 text-[#4338CA]" />
              <span>Updated: {formattedToday}</span>
            </div>
          </div>

          {/* Secondary Switcher: [ Overview ] [ Error Vault ] [ Score Predictor ] */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-teal-100/70 flex-wrap">
            <div className="inline-flex p-0.5 bg-white/90 border border-teal-100/90 rounded-xl shadow-2xs backdrop-blur-md">
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSubTabChange('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentSubTab === 'overview'
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-[#006B63] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#006B63] hover:bg-teal-50/70'
                }`}
              >
                <BarChart3 className={`w-3.5 h-3.5 ${currentSubTab === 'overview' ? 'text-teal-200' : 'text-[#00685f]'}`} />
                <span>Overview</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSubTabChange('errors')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentSubTab === 'errors'
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-[#006B63] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#006B63] hover:bg-teal-50/70'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Error Vault</span>
                {(state.errorNotebook?.length || 0) > 0 && (
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    currentSubTab === 'errors' ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {state.errorNotebook?.length}
                  </span>
                )}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSubTabChange('predictor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentSubTab === 'predictor'
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-[#006B63] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#006B63] hover:bg-teal-50/70'
                }`}
              >
                <TrendingUp className={`w-3.5 h-3.5 ${currentSubTab === 'predictor' ? 'text-amber-300' : 'text-amber-600'}`} />
                <span>Score Predictor</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {currentSubTab === 'overview' && (
        <>
          {/* ================= 2. EXAM READINESS HERO ================= */}
      <section className="bg-white rounded-3xl border border-[#DCE4E1] shadow-xs p-6 sm:p-8 transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Readiness Dial & High-Yield Verdict */}
          <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-5 lg:border-r lg:border-[#EAEFEA] lg:pr-8">
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                FMGE READINESS
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${readinessStage.color}`}>
                {readinessStage.label}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full py-2">
              {/* Circular Gauge */}
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#F1EBE3" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#00685f"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(100, Math.max(0, readiness.score)) / 100)}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold font-mono text-[#121E1B] leading-none">
                    {readiness.score}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono mt-1">/ 100</span>
                </div>
              </div>

              {/* Clinical Verdict Text */}
              <div className="space-y-2 text-center sm:text-left">
                <p className="text-sm text-[#4A5553] leading-relaxed">
                  {readiness.summaryText}
                </p>
                <button
                  type="button"
                  onClick={() => setIsReadinessModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00685f] hover:text-[#005049] transition-colors cursor-pointer py-1"
                >
                  <span>View Full Readiness Breakdown</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 8-Pillar Readiness Progress Bars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                8-Pillar Readiness
              </span>
              <button
                type="button"
                onClick={() => setIsReadinessModalOpen(true)}
                className="text-xs text-[#00685f] hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Drill-Down</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
              {readiness.components.map((comp) => {
                const scoreVal = comp.status === 'no_data' ? 0 : comp.score;
                return (
                  <div key={comp.id} className="space-y-1.5" title={comp.details}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-700 font-medium truncate max-w-[150px]">{comp.name}</span>
                      <span className="font-mono font-bold text-[#121E1B] ml-2">
                        {comp.status === 'no_data' ? '—' : scoreVal}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-[#00685f] rounded-full transition-all duration-600"
                        style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expandable Explanation Drawer */}
        {showReadinessBreakdown && (
          <div className="mt-6 pt-6 border-t border-[#EAEFEA] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {readiness.components.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/60 text-xs space-y-1">
                <span className="font-bold text-stone-800 block">{c.name}</span>
                <span className="text-stone-500 text-[11px] block">{c.label}</span>
                <p className="text-stone-600 text-[11px] leading-snug">{c.details}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= 3. WHERE YOU STAND (Metric Cards) ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#121E1B]">Where You Stand</h2>
          <span className="text-xs text-stone-400 font-mono">Live MCQ Diagnostics</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Overall Accuracy */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                Overall Accuracy
              </span>
              <Target className="w-4 h-4 text-[#00685f]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#121E1B]">
                {overallPerf.overallAccuracy}%
              </span>
              {overallPerf.totalAttempts > 0 && (
                <span
                  className={`inline-flex items-center text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                    accuracyDelta >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {accuracyDelta >= 0 ? `+${accuracyDelta}%` : `${accuracyDelta}%`}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-mono">
              {overallPerf.totalAttempts > 0
                ? `Last 15 attempts: ${overallPerf.recentAccuracy}%`
                : 'Complete drills to establish baseline'}
            </p>
          </div>

          {/* 2. Questions Attempted */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                Questions Attempted
              </span>
              <Activity className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-[#121E1B]">
                {overallPerf.totalAttempts.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono truncate">
              QBank, Grand Tests, Practice
            </p>
          </div>

          {/* 3. Average Response Pace */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                Avg. Response Time
              </span>
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-[#121E1B]">
                {overallPerf.avgResponseTimeSeconds > 0 ? `${overallPerf.avgResponseTimeSeconds}s` : '—'}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">
              {overallPerf.avgResponseTimeSeconds > 0
                ? overallPerf.avgResponseTimeSeconds <= 60
                  ? 'Optimal FMGE exam pace (≤60s)'
                  : 'Slightly slow (target ≤60s)'
                : 'Target 60s per question'}
            </p>
          </div>

          {/* 4. Repeated Errors */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                Repeated Errors
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#121E1B]">
                {overallPerf.totalRepeatedErrors}
              </span>
              {overallPerf.totalRepeatedErrors > 0 && (
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                  Revision due
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-mono">
              {overallPerf.totalRepeatedErrors > 0
                ? 'Concepts missed ≥2 times'
                : 'Zero repeated errors logged'}
            </p>
          </div>
        </div>
      </section>

      {/* ================= 4. WHAT NEEDS ATTENTION & QUICK ACTIONS ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (65%): Adaptive Priority Weak Topics */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DCE4E1] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-[#121E1B]">
                {hasPerformanceHistory ? 'What Needs Attention' : 'Recommended Starter Topics'}
              </h2>
              <p className="text-xs text-stone-500">
                {hasPerformanceHistory
                  ? 'Prioritized from your actual attempt errors and spaced revision intervals'
                  : 'Suggested high-yield starting points to establish your baseline preparation'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (topPriorityTopics.length > 0) {
                  onSelectSubject(topPriorityTopics[0].subjectId);
                }
              }}
              className="text-xs font-bold text-[#00685f] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {topPriorityTopics.map((topic) => {
              // Only classify as confirmed weakness/high priority if real performance data actually supports that classification
              const hasAttempts = topic.attemptCount > 0;
              const hasErrors = topic.errorCount > 0 || topic.repeatedErrorCount > 0;
              const hasRepeatedMistake = hasAttempts && topic.repeatedErrorCount >= 1;
              const isConfirmedWeakness = hasAttempts && (topic.status === 'critical' || topic.accuracy < 50);
              const isHighPriority = hasAttempts && (topic.status === 'high_priority' || topic.accuracy < 60);
              const isRevision = hasAttempts && topic.revisionDue;
              const isStarter = !hasAttempts && !hasErrors;

              // Action label from engine
              const actionType = topic.recommendedAction?.type;
              let actionHint = topic.recommendedAction?.actionLabel || 'Study';
              if (actionType === 'review_errors') {
                actionHint = 'Review Mistakes';
              } else if (actionType === 'practice_mcqs') {
                actionHint = 'Clinical Drill';
              } else if (actionType === 'rapid_review') {
                actionHint = 'Rapid Recall';
              } else if (actionType === 'complete_revision') {
                actionHint = 'Spaced Revision';
              }

              return (
                <div
                  key={`${topic.subjectId}-${topic.topicId}`}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        hasRepeatedMistake || isConfirmedWeakness
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                          : isHighPriority
                          ? 'bg-orange-50 text-orange-700 border border-orange-200/70'
                          : isRevision
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                          : 'bg-teal-50 text-[#00685f] border border-teal-200/70'
                      }`}
                    >
                      {hasRepeatedMistake ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : isConfirmedWeakness ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : isHighPriority ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isRevision ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : isStarter ? (
                        <Compass className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#00685f] transition-colors truncate">
                          {topic.topicName}
                        </h3>
                        {hasRepeatedMistake && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            REPEATED ERROR (≥2x)
                          </span>
                        )}
                        {isConfirmedWeakness && !hasRepeatedMistake && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                            CRITICAL WEAKNESS
                          </span>
                        )}
                        {isHighPriority && !isConfirmedWeakness && !hasRepeatedMistake && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-orange-800">
                            NEEDS WORK
                          </span>
                        )}
                        {isRevision && !isConfirmedWeakness && !hasRepeatedMistake && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                            REVISION DUE
                          </span>
                        )}
                        {isStarter && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-[#00685f] border border-teal-200/60">
                            RECOMMENDED STARTER
                          </span>
                        )}
                        {topic.isHighYield && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                            HIGH-YIELD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        <span className="font-medium text-stone-700">{topic.subjectName}</span>
                        {' · '}
                        {isStarter
                          ? `High-yield curriculum anchor (~${topic.subjectWeightage}M weightage)`
                          : topic.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:shrink-0 self-stretch sm:self-center pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-50">
                    {!isStarter && (
                      <span className="text-[10px] font-mono text-stone-400 hidden sm:inline-block">
                        {actionHint}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedDiagnosticSubjectId(topic.subjectId)}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-full text-xs font-bold border border-stone-200 hover:border-[#00685f] hover:bg-stone-50 text-[#00685f] transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Diagnose & Study</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (35%): Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-[#121E1B]">Quick Actions</h2>
            <p className="text-xs text-stone-500">Targeted remediation and diagnostic workflows</p>
          </div>

          <div className="space-y-3">
            {/* Action 1: Review Error Vault */}
            {(() => {
              const errorCount = state.errorNotebook?.length || 0;
              const isPrimary = errorCount > 0;

              return (
                <div
                  onClick={() => setIsErrorVaultModalOpen(true)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center gap-3.5 ${
                    isPrimary
                      ? 'bg-white border-2 border-rose-200/80 shadow-xs hover:border-rose-400'
                      : 'bg-white border border-[#DCE4E1] shadow-2xs hover:border-[#00685f]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPrimary
                        ? 'bg-rose-100 text-rose-800 border border-rose-300/80'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-stone-900">Review Error Vault</h3>
                      {isPrimary && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">
                      {errorCount > 0
                        ? `${errorCount} logged mistake${errorCount > 1 ? 's' : ''} to triage`
                        : 'Zero errors logged • Clean record'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              );
            })()}

            {/* Action 2: Continue Practice */}
            {(() => {
              const errorCount = state.errorNotebook?.length || 0;
              const isPrimary = errorCount === 0;

              return (
                <div
                  onClick={() => {
                    if (topPriorityTopics.length > 0) {
                      onLaunchPracticeSession?.(
                        topPriorityTopics[0].subjectId,
                        topPriorityTopics[0].topicId,
                        topPriorityTopics[0].topicName,
                        undefined,
                        'dashboard_weak_topic'
                      );
                    } else if (FMGE_SUBJECTS.length > 0) {
                      onLaunchPracticeSession?.(
                        FMGE_SUBJECTS[0].id,
                        FMGE_SUBJECTS[0].topics[0]?.id || 't-1',
                        FMGE_SUBJECTS[0].topics[0]?.name || 'Clinical Drill',
                        undefined,
                        'dashboard_weak_topic'
                      );
                    }
                  }}
                  className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center gap-3.5 ${
                    isPrimary
                      ? 'bg-white border-2 border-teal-200/80 shadow-xs hover:border-[#00685f]'
                      : 'bg-white border border-[#DCE4E1] shadow-2xs hover:border-[#00685f]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPrimary
                        ? 'bg-teal-100 text-[#00685f] border border-teal-300/80'
                        : 'bg-teal-50 text-[#00685f] border border-teal-200/60'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-stone-900">Continue Practice</h3>
                      {isPrimary && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-50 text-[#00685f] border border-teal-200">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">
                      Launch a 10-MCQ clinical drill
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              );
            })()}

            {/* Action 3: Plan My Revision */}
            <div
              onClick={() => {
                onNavigateTab?.('revision');
              }}
              className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs hover:border-[#00685f] transition-all cursor-pointer flex items-center gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-stone-900">Plan My Revision</h3>
                <p className="text-[11px] text-stone-500 truncate">
                  Targeted spaced recall roadmap
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. SUBJECT PERFORMANCE MATRIX ================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#121E1B]">Subject Performance</h2>
            <p className="text-xs text-stone-500">
              Diagnostic performance breakdown across all 19 NBE medical disciplines
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-white border border-stone-200 focus:outline-none focus:border-[#00685f] text-stone-800 placeholder-stone-400 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Discipline Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'all', label: `All Subjects (${counts.all})` },
            { id: 'clinical', label: `Clinical (${counts.clinical})` },
            { id: 'paraclinical', label: `Para-Clinical (${counts.paraclinical})` },
            { id: 'preclinical', label: `Pre-Clinical (${counts.preclinical})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDiscipline(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDiscipline === tab.id
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subject Table / Card Ledger */}
        <div className="bg-white rounded-3xl border border-[#DCE4E1] shadow-xs divide-y divide-stone-100 overflow-hidden">
          {/* Table Header on Desktop */}
          <div className="hidden sm:grid sm:grid-cols-12 px-6 py-3 bg-stone-50/70 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
            <div className="sm:col-span-4">Subject</div>
            <div className="sm:col-span-2 text-center">Accuracy</div>
            <div className="sm:col-span-2 text-center">Recent Trend</div>
            <div className="sm:col-span-2 text-center">Status</div>
            <div className="sm:col-span-2 text-right">Action</div>
          </div>

          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((sub) => {
              const hasAttempts = sub.metrics.totalAttempts > 0;
              const acc = sub.metrics.accuracy;
              const recent = sub.metrics.recentAccuracy;

              // Status Badge
              let statusLabel = 'Unattempted';
              let statusStyle = 'bg-stone-100 text-stone-600';
              if (hasAttempts) {
                if (acc >= 75) {
                  statusLabel = 'Strong';
                  statusStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
                } else if (acc >= 60) {
                  statusLabel = 'Developing';
                  statusStyle = 'bg-amber-50 text-amber-700 border border-amber-200/60';
                } else {
                  statusLabel = 'Needs Attention';
                  statusStyle = 'bg-rose-50 text-rose-700 border border-rose-200/60';
                }
              }

              // Trend indicator
              const trendDelta = recent - acc;

              return (
                <div
                  key={sub.id}
                  className="p-4 sm:px-6 sm:py-4 hover:bg-stone-50/70 transition-colors flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-3 sm:gap-0"
                >
                  {/* Subject Info: Subject → FMGE Weight */}
                  <div className="sm:col-span-4 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00685f] font-mono">
                        {sub.weightage} MARKS
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-[10px] font-mono text-stone-400 uppercase">
                        {sub.disciplineType}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 truncate">{sub.name}</h3>
                    <p className="text-xs text-stone-400 font-mono">
                      {sub.metrics.totalAttempts > 0
                        ? `${sub.metrics.totalAttempts} questions solved`
                        : `${sub.topics.length} topics unattempted`}
                    </p>
                  </div>

                  {/* Accuracy */}
                  <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                    <span className="text-xs font-mono text-stone-400 sm:hidden">Accuracy:</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        hasAttempts
                          ? acc >= 75
                            ? 'text-emerald-700'
                            : acc >= 50
                            ? 'text-stone-900'
                            : 'text-rose-700'
                          : 'text-stone-400'
                      }`}
                    >
                      {hasAttempts ? `${acc}%` : '—'}
                    </span>
                  </div>

                  {/* Recent Trend */}
                  <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                    <span className="text-xs font-mono text-stone-400 sm:hidden">Recent Trend:</span>
                    {hasAttempts ? (
                      <div className="flex items-center gap-1 font-mono text-sm font-bold">
                        <span className="text-stone-800">{recent}%</span>
                        {trendDelta > 0 ? (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ↑+{trendDelta}%
                          </span>
                        ) : trendDelta < 0 ? (
                          <span className="text-[10px] text-rose-600 font-bold">
                            ↓{trendDelta}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-normal">
                            =
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-sm text-stone-400">—</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                    <span className="text-xs font-mono text-stone-400 sm:hidden">Mastery Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Open Roadmap Action Button */}
                  <div className="sm:col-span-2 flex items-center justify-end pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedDiagnosticSubjectId(sub.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 transition-all cursor-pointer"
                    >
                      <span>Open Roadmap</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-2 px-4">
              <Search className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-xs font-bold text-stone-700">No matching subjects found</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                No disciplines match "{searchQuery}". Clear your search query or reset discipline filters to view all 19 subjects.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= 6. TRENDS & GRAND TEST PERFORMANCE ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Accuracy Trend */}
        <div className="bg-white rounded-3xl border border-[#DCE4E1] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#121E1B]">Accuracy Trend</h2>
              <p className="text-xs text-stone-500">Historical performance across practice sessions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-stone-100 text-stone-600 border border-stone-200/60 hidden sm:inline-block">
                FMGE Min Pass: 50%
              </span>
              <button
                type="button"
                onClick={() => setIsAccuracyTrendModalOpen(true)}
                className="text-xs font-bold text-[#00685f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Trend Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {accuracyTrendPoints.length >= 2 ? (
            <div className="space-y-4 pt-2">
              {/* Reference indicator banner */}
              {(() => {
                const first = accuracyTrendPoints[0].accuracy;
                const last = accuracyTrendPoints[accuracyTrendPoints.length - 1].accuracy;
                const delta = last - first;

                return (
                  <div
                    onClick={() => setIsAccuracyTrendModalOpen(true)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-200/70 hover:border-[#00685f]/60 transition-colors text-xs font-mono cursor-pointer"
                  >
                    <span className="text-stone-600">Trajectory Diagnosis:</span>
                    {delta > 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        Improving (+{delta}% across recent drills)
                      </span>
                    ) : delta < 0 ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        Declining ({delta}% across recent drills)
                      </span>
                    ) : (
                      <span className="text-stone-700 font-bold">
                        Stable accuracy across logged drills
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Visual Trend Chart with 50% Benchmark Line */}
              <div
                onClick={() => setIsAccuracyTrendModalOpen(true)}
                className="relative h-48 w-full px-2 pt-6 pb-2 border-b border-stone-200/80 cursor-pointer group"
                title="Click to view deep accuracy trend breakdown"
              >
                {/* 50% Min Pass Line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-stone-300 pointer-events-none flex items-center justify-end pr-2"
                  style={{ bottom: 'calc(50% + 24px)' }}
                >
                  <span className="text-[9px] font-mono text-stone-400 bg-white px-1 -translate-y-1/2">
                    50% Pass Benchmark
                  </span>
                </div>

                <div className="h-full w-full flex items-end justify-between gap-3 relative z-10">
                  {accuracyTrendPoints.map((pt, idx) => {
                    const barHeight = Math.max(12, Math.min(100, pt.accuracy));
                    const isPass = pt.accuracy >= 50;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isPass ? 'text-stone-900' : 'text-rose-600'
                          }`}
                        >
                          {pt.accuracy}%
                        </span>
                        <div className="w-full max-w-[42px] h-32 bg-stone-100 rounded-t-lg relative flex items-end overflow-hidden group-hover:opacity-90">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              isPass ? 'bg-[#00685f]' : 'bg-rose-500'
                            }`}
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>
                        <div className="text-center w-full truncate">
                          <span className="text-[10px] font-mono text-stone-600 block truncate">
                            {pt.label}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400 block">
                            {pt.count} Qs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <span>Chronological accuracy curve</span>
                <span className="text-[#00685f] font-bold hover:underline cursor-pointer" onClick={() => setIsAccuracyTrendModalOpen(true)}>
                  Explore historical points →
                </span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2.5 px-4 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
              <TrendingUp className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-xs font-bold text-stone-700">Trajectory Calibrating</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Complete at least 2 clinical MCQ drill sessions to unlock your historical accuracy curve and passing trendline.
              </p>
            </div>
          )}
        </div>

        {/* Right: Grand Test Performance */}
        <div className="bg-white rounded-3xl border border-[#DCE4E1] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#121E1B]">Grand Test Performance</h2>
              <p className="text-xs text-stone-500">Full-length 300-Q NBE mock exam records</p>
            </div>
            <div className="flex items-center gap-2">
              {grandTests.length > 0 && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-50 text-[#00685f] border border-teal-200/60">
                  {grandTests.length} Logged
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsGrandTestModalOpen(true)}
                className="text-xs font-bold text-[#00685f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>GT Diagnostics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {grandTests.length > 0 ? (
            <div className="space-y-4">
              {/* Latest GT Highlight Card */}
              {latestGT && (
                <div
                  onClick={() => setIsGrandTestModalOpen(true)}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-[#00685f]/70 transition-all cursor-pointer flex items-center justify-between group"
                  title="Click to view full Grand Test audit"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#00685f]">
                        LATEST GRAND TEST ({latestGT.platform})
                      </span>
                      <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-[#00685f] transition-colors" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold font-mono text-stone-900">
                        {latestGT.score} / 300
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-500">
                        ({Math.round((latestGT.score / (latestGT.totalMarks || 300)) * 100)}%)
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 font-mono block">
                      {new Date(latestGT.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-mono text-stone-500 block">Percentile</span>
                    <span className="text-xl font-bold font-mono text-[#00685f]">
                      {latestGT.percentile ? `${latestGT.percentile}th` : 'Calculated'}
                    </span>
                    <span
                      className={`text-[10px] font-bold font-mono block ${
                        latestGT.score >= 150 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {latestGT.score >= 150
                        ? `+${latestGT.score - 150} above pass mark`
                        : `${150 - latestGT.score} marks to pass`}
                    </span>
                  </div>
                </div>
              )}

              {/* GT Progression Bar List */}
              <div className="space-y-2">
                {grandTests.slice(-4).map((gt, idx) => {
                  const pct = Math.round((gt.score / (gt.totalMarks || 300)) * 100);
                  const isPass = gt.score >= 150;

                  return (
                    <div
                      key={gt.id || idx}
                      onClick={() => setIsGrandTestModalOpen(true)}
                      className="space-y-1 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-medium text-stone-700 group-hover:text-[#00685f] transition-colors">
                          {gt.title || `GT ${idx + 1}`}
                        </span>
                        <span className="font-bold text-stone-900">
                          {gt.score} / 300 ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPass ? 'bg-[#00685f]' : 'bg-amber-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2.5 px-4 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
              <Award className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-xs font-bold text-stone-700">No Grand Tests Logged</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Log full 300-Q mock exam scores in the Grand Tests view to unlock percentile tracking and passing threshold benchmarks.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= 7. DEEPER DIAGNOSTICS ================= */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-[#121E1B]">Deeper Diagnostics</h2>
          <p className="text-xs text-stone-500">Core clinical competencies evaluated against NBE exam patterns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Image-Based MCQ Diagnostic */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Image-Based MCQs
                </span>
                <Eye className="w-4 h-4 text-[#00685f]" />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                    {imageSummary.totalImageAttempts > 0 ? `${imageSummary.overallImageAccuracy}%` : '—'}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {imageSummary.totalImageAttempts > 0
                      ? `(${imageSummary.totalImageAttempts} attempted)`
                      : '(0 attempted • Calibrating)'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {imageSummary.weakestCategory
                    ? `Weakest visual category: ${imageSummary.weakestCategory.toUpperCase()}`
                    : imageSummary.totalImageAttempts > 0
                    ? 'Balanced performance across Radiology, Histology, and Clinical Photos'
                    : 'Visual pattern calibration pending. Drill radiology and gross pathology slides to establish baseline.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400 font-mono">
              Impact: ~35–45 visual questions on FMGE exam paper.
            </div>
          </div>

          {/* Card 2: Curriculum Mastery Distribution */}
          <div
            onClick={() => setIsTopicMasteryModalOpen(true)}
            className="p-5 rounded-2xl bg-white border border-[#DCE4E1] hover:border-[#00685f]/70 transition-all shadow-xs flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Topic Mastery Status
                </span>
                <Layers className="w-4 h-4 text-[#00685f]" />
              </div>

              <div className="space-y-2">
                {/* Segmented Bar */}
                <div className="w-full h-2.5 rounded-full bg-stone-100 flex overflow-hidden">
                  <div
                    title={`Mastered: ${overallPerf.totalMasteredTopics}`}
                    className="bg-[#00685f] h-full"
                    style={{ width: `${(overallPerf.totalMasteredTopics / Math.max(1, overallPerf.totalTopics)) * 100}%` }}
                  />
                  <div
                    title={`Proficient: ${overallPerf.totalProficientTopics}`}
                    className="bg-emerald-600 h-full"
                    style={{ width: `${(overallPerf.totalProficientTopics / Math.max(1, overallPerf.totalTopics)) * 100}%` }}
                  />
                  <div
                    title={`Developing: ${overallPerf.totalDevelopingTopics}`}
                    className="bg-amber-500 h-full"
                    style={{ width: `${(overallPerf.totalDevelopingTopics / Math.max(1, overallPerf.totalTopics)) * 100}%` }}
                  />
                  <div
                    title={`Struggling: ${overallPerf.totalStrugglingTopics}`}
                    className="bg-rose-500 h-full"
                    style={{ width: `${(overallPerf.totalStrugglingTopics / Math.max(1, overallPerf.totalTopics)) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00685f] inline-block" />
                    Mastered: {overallPerf.totalMasteredTopics}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    Proficient: {overallPerf.totalProficientTopics}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Developing: {overallPerf.totalDevelopingTopics}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    Struggling: {overallPerf.totalStrugglingTopics}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>Impact: Full syllabus breadth</span>
              <span className="text-[#00685f] font-bold group-hover:underline flex items-center gap-1">
                Deep Drill-Down <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 3: Error Notebook Burden */}
          <div
            onClick={() => setIsErrorVaultModalOpen(true)}
            className="p-5 rounded-2xl bg-white border border-[#DCE4E1] hover:border-rose-300 transition-all shadow-xs flex flex-col justify-between space-y-4 cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                  Error Notebook Burden
                </span>
                <Brain className="w-4 h-4 text-purple-700" />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                    {state.errorNotebook?.length || 0}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">logged cards</span>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  {(() => {
                    const total = state.errorNotebook?.length || 0;
                    const reviewed = state.errorNotebook?.filter((e) => e.isReviewed).length || 0;
                    if (total === 0) {
                      return 'Zero error cards logged. Capture mistakes from GTs and drills to build your 20th notebook.';
                    }
                    const pct = Math.round((reviewed / total) * 100);
                    return `${reviewed} of ${total} (${pct}%) mistake concepts remediated and retained.`;
                  })()}
                </p>
                {overallPerf.totalRepeatedErrors > 0 && (
                  <p className="text-[11px] font-mono text-rose-700 font-bold">
                    ⚠️ {overallPerf.totalRepeatedErrors} repeat error{overallPerf.totalRepeatedErrors > 1 ? 's' : ''} require immediate triage
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>Impact: Eliminating repeat errors</span>
              <span className="text-rose-600 font-bold group-hover:underline flex items-center gap-1">
                Error Vault Audit <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  )}

  {currentSubTab === 'errors' && (
    <ErrorsView
      state={state}
      onAddErrorItem={onAddErrorItem || (() => {})}
      onToggleErrorReviewed={onToggleErrorReviewed || (() => {})}
      onDeleteErrorItem={onDeleteErrorItem || (() => {})}
      onUpdateAppState={onUpdateAppState || (() => {})}
      onLaunchPracticeSession={onLaunchPracticeSession}
      onOpenAiCoach={onOpenAiCoach}
      onSelectSubject={onSelectSubject}
      onToggleTopicState={onToggleTopicState}
      onBackToPerformance={() => handleSubTabChange('overview')}
    />
  )}

  {currentSubTab === 'predictor' && (
    <FmgePredictorView
      state={state}
      onSelectSubject={onSelectSubject}
      onOpenAiCoach={onOpenAiCoach}
      onToggleTopicState={onToggleTopicState}
      onAddTask={onAddTask || (() => {})}
      onBackToPerformance={() => handleSubTabChange('overview')}
      onLaunchPracticeSession={onLaunchPracticeSession}
    />
  )}

      {/* ================= PERFORMANCE 3C: DEEP DIAGNOSTIC DRILL-DOWNS ================= */}
      <ReadinessBreakdownModal
        isOpen={isReadinessModalOpen}
        onClose={() => setIsReadinessModalOpen(false)}
        readiness={readiness}
        onNavigateTab={onNavigateTab}
        onLaunchPracticeSession={(subjectId, topicId, topicName) => {
          setIsReadinessModalOpen(false);
          onLaunchPracticeSession?.(subjectId, topicId, topicName, undefined, 'dashboard_weak_topic');
        }}
        topPrioritySubjectId={topPriorityTopics[0]?.subjectId || 'medicine'}
        topPriorityTopicId={topPriorityTopics[0]?.topicId || 'med-1'}
        topPriorityTopicName={topPriorityTopics[0]?.topicName || 'Cardiology - Ischemic Heart Disease & ECG'}
      />

      <SubjectDiagnosticDetailModal
        isOpen={!!selectedDiagnosticSubjectId}
        onClose={() => setSelectedDiagnosticSubjectId(null)}
        subjectId={selectedDiagnosticSubjectId}
        state={state}
        onOpenStudyWorkspace={(id) => {
          setSelectedDiagnosticSubjectId(null);
          onSelectSubject(id);
        }}
        onLaunchPracticeSession={onLaunchPracticeSession}
        onNavigateTab={onNavigateTab}
      />

      <TopicMasteryDetailModal
        isOpen={isTopicMasteryModalOpen}
        onClose={() => setIsTopicMasteryModalOpen(false)}
        state={state}
        onOpenSubjectDiagnostic={(id) => {
          setIsTopicMasteryModalOpen(false);
          setSelectedDiagnosticSubjectId(id);
        }}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />

      <AccuracyTrendDetailModal
        isOpen={isAccuracyTrendModalOpen}
        onClose={() => setIsAccuracyTrendModalOpen(false)}
        state={state}
        overallAccuracy={overallPerf.overallAccuracy}
        recentAccuracy={overallPerf.recentAccuracy}
        onLaunchPracticeSession={() => {
          setIsAccuracyTrendModalOpen(false);
          if (topPriorityTopics.length > 0) {
            onLaunchPracticeSession?.(
              topPriorityTopics[0].subjectId,
              topPriorityTopics[0].topicId,
              topPriorityTopics[0].topicName,
              undefined,
              'dashboard_weak_topic'
            );
          } else if (FMGE_SUBJECTS.length > 0) {
            onLaunchPracticeSession?.(
              FMGE_SUBJECTS[0].id,
              FMGE_SUBJECTS[0].topics[0]?.id || 't-1',
              FMGE_SUBJECTS[0].topics[0]?.name || 'Clinical Drill',
              undefined,
              'dashboard_weak_topic'
            );
          }
        }}
      />

      <GrandTestDiagnosticModal
        isOpen={isGrandTestModalOpen}
        onClose={() => setIsGrandTestModalOpen(false)}
        grandTests={grandTests}
        onNavigateTab={onNavigateTab}
      />

      <ErrorVaultDiagnosticModal
        isOpen={isErrorVaultModalOpen}
        onClose={() => setIsErrorVaultModalOpen(false)}
        state={state}
        onNavigateTab={onNavigateTab}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />
    </div>
  );
};

