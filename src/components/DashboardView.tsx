import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Play,
  ArrowRight,
  ArrowLeft,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
  Activity,
  Layers,
  X,
  GraduationCap,
  MessageSquare,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Cloud,
  FileText,
  Target,
  Timer,
  TrendingUp,
  Flame,
  Compass,
  BarChart3,
  ChevronDown,
  Quote,
  Sun,
  Sunset,
  Moon,
  Award,
  ExternalLink,
  MoreVertical,
  Stethoscope,
  ShieldCheck,
  Heart,
  HeartPulse,
  Scissors,
  Baby,
  Microscope,
  Bone,
  Dna,
  Ear,
  Brain,
  Scan,
  Atom,
  Syringe,
  Scale,
  Lightbulb,
  Share2,
  Eye,
  Pill,
  ShieldAlert,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { AppState, DailyTask, DailyStudyLog, PracticeSessionContext, GrandTest, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import {
  getNextBestStudyAction,
  getDaysRemainingToExam,
} from '../utils/adaptivePriorityEngine';
import { getNextFmgeSessionDate } from '../utils/date';
import { calculateStudyStreak } from '../utils/dailyMissionEngine';
import { calculateProtectedStudyStreak } from '../utils/streakProtectionEngine';
import { isSpacedErrorDue } from '../utils/spacedRepetitionEngine';
import {
  getPersonalizedDailyPlan,
  getLearningContext,
  LearningContext,
  PersonalizedPlan,
} from '../utils/personalizationEngine';
import { useCircadianTheme } from '../hooks/useCircadianTheme';
import { MedicalHeroVisual, MedicalSubjectCardVisual, getSubjectTelemetry } from './MedicalHeroVisual';
import { DoctorMountainArt } from './DoctorMountainArt';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import { NotificationCenterModal } from './NotificationCenterModal';
import { hasUnreadNotifications } from '../utils/notificationEngine';
import { DailyPlannerView } from './DailyPlannerView';
import { useDoctorCreed } from '../hooks/useDoctorCreed';
import { AnimatedMountainInsignia } from './AnimatedMountainInsignia';
import { ShareMilestoneModal } from './ShareMilestoneModal';
import { PassingGapAnalyzer } from './PassingGapAnalyzer';
import { IbqRapidRecallModal } from './IbqRapidRecallModal';
import { ExamEveCheatSheetModal, HIGH_YIELD_TRIADS } from './ExamEveCheatSheetModal';
import { NbeMockExamModal } from './NbeMockExamModal';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { AmbientSoundWidget } from './AmbientSoundWidget';
import { getDuePearls } from '../utils/spacedRepetitionEngine';

interface DashboardViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (task: DailyTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateDailyLog?: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onToggleMissionCompletion?: (missionId: string) => void;
  onLogGrandTest?: (gt: GrandTest) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
  activeBg?: { id: string; url: string; label: string; period: string };
  onShuffleBg?: () => void;
  onOpenProfile?: () => void;
  onOpenZenFocus?: () => void;
  onOpenAudioRecall?: () => void;
  subTab?: 'overview' | 'planner';
  onSubTabChange?: (tab: 'overview' | 'planner') => void;
}

/** Polite, SwiftUI-style number interpolation. No-op under reduced motion. */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(reduced ? value : 0);
  const displayed = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.6, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, reduced, mv]);

  return <motion.span className={className}>{displayed}</motion.span>;
}

/** Circular progress & countdown gauge for Exam Journey (Apple Fitness/Health-style) */
function CircularCountdown({
  value,
  label = 'DAYS LEFT',
  sublabel,
  progressRatio,
  reducedMotion,
  days,
  totalDays = 90,
}: {
  value?: number;
  label?: string;
  sublabel?: string;
  progressRatio?: number;
  reducedMotion: boolean | null;
  days?: number;
  totalDays?: number;
}) {
  const displayVal = value !== undefined ? value : (days !== undefined ? days : 0);
  const size = 124;
  const strokeWidth = 9.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Progress based on total preparation cycle or custom ratio
  const ratio = progressRatio !== undefined
    ? Math.min(1, Math.max(0.08, progressRatio))
    : Math.min(1, Math.max(0.12, ((totalDays || 90) - (days || 0)) / (totalDays || 90)));
  const targetOffset = circumference * (1 - ratio);

  return (
    <div className="relative flex items-center justify-center shrink-0 w-28 h-28 sm:w-32 sm:h-32">
      {/* Soft inner ambient glow */}
      <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(13,148,136,0.08)_0%,transparent_70%)] pointer-events-none" />
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id="examCountdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#006B63" />
            <stop offset="50%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* Soft Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {/* Tiny Circular Graduation / Precision Marks around ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const r1 = radius + strokeWidth / 2 + 3;
          const r2 = radius + strokeWidth / 2 + (i % 6 === 0 ? 6.5 : 4.5);
          const x1 = center + r1 * Math.cos(rad);
          const y1 = center + r1 * Math.sin(rad);
          const x2 = center + r2 * Math.cos(rad);
          const y2 = center + r2 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#006B63"
              strokeWidth={i % 6 === 0 ? 1.2 : 0.8}
              strokeOpacity={i % 6 === 0 ? 0.3 : 0.14}
            />
          );
        })}
        {/* Animated Gradient Progress Ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#examCountdownGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-2">
        <AnimatedNumber
          value={displayVal}
          className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight font-['Outfit'] tabular-nums leading-none"
        />
        <span className="text-[9px] font-bold text-[#638E88] mt-1 leading-tight tracking-wider uppercase font-mono">
          {label}
        </span>
        {sublabel && (
          <span className="text-[8.5px] font-bold text-emerald-600 mt-0.5 leading-none font-mono">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/** Contextual Progress Styling according to mastery level */
function getContextualProgressStyle(percentage: number, rawStatusText?: string) {
  const statusLower = (rawStatusText || '').toLowerCase();
  const isStrong = percentage >= 50 || statusLower.includes('strong') || statusLower.includes('master');
  const isModerate = !isStrong && (percentage >= 20 || statusLower.includes('track') || statusLower.includes('moderate'));

  if (isStrong) {
    return {
      bar: 'bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#10B981]',
      track: 'bg-teal-50/80',
      badge: 'text-teal-800 bg-teal-50/90 border-teal-200/80',
      dot: 'bg-teal-500',
      statusText: rawStatusText || 'Strong',
    };
  }
  if (isModerate) {
    return {
      bar: 'bg-gradient-to-r from-sky-500 to-indigo-500',
      track: 'bg-sky-50/80',
      badge: 'text-sky-800 bg-sky-50/90 border-sky-200/80',
      dot: 'bg-sky-500',
      statusText: rawStatusText || 'Moderate',
    };
  }
  return {
    bar: 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500',
    track: 'bg-rose-50/80',
    badge: 'text-rose-800 bg-rose-50/90 border-rose-200/80',
    dot: 'bg-rose-500',
    statusText: rawStatusText || 'Needs focus',
  };
}

/** Subject Accent Colors for Progress Bars & Badges */
const SUBJECT_ACCENT_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  anatomy: { bar: 'bg-[#f43f5e]', badge: 'text-rose-700 bg-rose-50 border-rose-100', text: 'text-rose-600' },
  physiology: { bar: 'bg-[#0ea5e9]', badge: 'text-sky-700 bg-sky-50 border-sky-100', text: 'text-sky-600' },
  biochemistry: { bar: 'bg-[#8b5cf6]', badge: 'text-purple-700 bg-purple-50 border-purple-100', text: 'text-purple-600' },
  pathology: { bar: 'bg-[#0d9488]', badge: 'text-teal-700 bg-teal-50 border-teal-100', text: 'text-teal-600' },
  pharmacology: { bar: 'bg-[#f59e0b]', badge: 'text-amber-700 bg-amber-50 border-amber-100', text: 'text-amber-600' },
  microbiology: { bar: 'bg-[#06b6d4]', badge: 'text-cyan-700 bg-cyan-50 border-cyan-100', text: 'text-cyan-600' },
  fmt: { bar: 'bg-[#e11d48]', badge: 'text-rose-700 bg-rose-50 border-rose-100', text: 'text-rose-600' },
  psm: { bar: 'bg-[#10b981]', badge: 'text-emerald-700 bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
  medicine: { bar: 'bg-[#2563eb]', badge: 'text-blue-700 bg-blue-50 border-blue-100', text: 'text-blue-600' },
  surgery: { bar: 'bg-[#dc2626]', badge: 'text-red-700 bg-red-50 border-red-100', text: 'text-red-600' },
  obg: { bar: 'bg-[#ec4899]', badge: 'text-pink-700 bg-pink-50 border-pink-100', text: 'text-pink-600' },
  pediatrics: { bar: 'bg-[#14b8a6]', badge: 'text-teal-700 bg-teal-50 border-teal-100', text: 'text-teal-600' },
  ophthalmology: { bar: 'bg-[#6366f1]', badge: 'text-indigo-700 bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
  ent: { bar: 'bg-[#84cc16]', badge: 'text-lime-700 bg-lime-50 border-lime-100', text: 'text-lime-600' },
  dermatology: { bar: 'bg-[#f97316]', badge: 'text-orange-700 bg-orange-50 border-orange-100', text: 'text-orange-600' },
  psychiatry: { bar: 'bg-[#a855f7]', badge: 'text-purple-700 bg-purple-50 border-purple-100', text: 'text-purple-600' },
  radiology: { bar: 'bg-[#0284c7]', badge: 'text-sky-700 bg-sky-50 border-sky-100', text: 'text-sky-600' },
  orthopedics: { bar: 'bg-[#b45309]', badge: 'text-amber-800 bg-amber-50 border-amber-100', text: 'text-amber-700' },
  anesthesia: { bar: 'bg-[#475569]', badge: 'text-slate-700 bg-slate-100 border-slate-200', text: 'text-slate-600' },
};

/** Helper to get specialty insignia Lucide icon for each of the 19 subjects */
export const getSubjectInsignia = (subjectId: string): React.ComponentType<{ className?: string }> => {
  switch (subjectId) {
    case 'medicine':
      return HeartPulse;
    case 'surgery':
      return Scissors;
    case 'obg':
      return Baby;
    case 'psm':
      return ShieldCheck;
    case 'pharmacology':
      return Pill;
    case 'pathology':
      return Microscope;
    case 'anatomy':
      return Bone;
    case 'biochemistry':
      return Dna;
    case 'physiology':
      return Activity;
    case 'ophthalmology':
      return Eye;
    case 'ent':
      return Ear;
    case 'pediatrics':
      return Baby;
    case 'orthopedics':
      return Bone;
    case 'dermatology':
      return Layers;
    case 'psychiatry':
      return Brain;
    case 'radiology':
      return Scan;
    case 'microbiology':
      return Atom;
    case 'anesthesia':
      return Syringe;
    case 'fmt':
      return Scale;
    default:
      return Stethoscope;
  }
};

export interface SubjectCardTheme {
  bg: string;
  border: string;
  glow: string;
  badge: string;
  arrowBg: string;
  arrowText: string;
  insigniaBg?: string;
  insigniaText?: string;
  progressBar?: string;
  heroGradient?: string;
  cardGradient?: string;
  // Subject-specific ECG & hero halo accents
  ecgStrokeStart: string;
  ecgStrokeMid: string;
  ecgGlow: string;
  ecgDotColor: string;
  haloStart: string;
  haloMid: string;
  haloEnd: string;
  orbitStroke: string;
  primaryBtnBg: string;
  primaryBtnHover: string;
  primaryBtnShadow: string;
}

/** Subject Card Gradient Themes & Backdrops matching Reference Mockup */
const SUBJECT_CARD_THEMES: Record<string, SubjectCardTheme> = {
  medicine: {
    bg: 'from-teal-500/[0.08] via-cyan-500/[0.04] to-white/95',
    border: 'border-cyan-200/70 hover:border-cyan-400/90',
    glow: 'rgba(6, 182, 212, 0.22)',
    badge: 'bg-cyan-500/10 text-cyan-800 border-cyan-200/70',
    insigniaBg: 'bg-teal-500/10 text-teal-700 border-teal-200/70',
    insigniaText: 'text-teal-700',
    progressBar: 'from-teal-600 to-cyan-500',
    arrowBg: 'group-hover:bg-[#006B63] group-hover:text-white',
    arrowText: 'text-cyan-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.20) 0%, rgba(6, 182, 212, 0.14) 42%, transparent 72%)',
    cardGradient: 'from-[#F4FAF8] via-[#FBFCFC] to-[#EFF8F5]',
    ecgStrokeStart: '#006B63',
    ecgStrokeMid: '#0284C7',
    ecgGlow: 'rgba(2, 132, 199, 0.85)',
    ecgDotColor: '#00D8B4',
    haloStart: '#2DD4BF',
    haloMid: '#38BDF8',
    haloEnd: '#0EA5E9',
    orbitStroke: '#006B63',
    primaryBtnBg: 'bg-[#006B63]',
    primaryBtnHover: 'hover:bg-[#00554E]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(0,107,99,0.25)]',
  },
  psychiatry: {
    bg: 'from-purple-500/[0.08] via-indigo-500/[0.04] to-white/95',
    border: 'border-purple-200/70 hover:border-purple-400/90',
    glow: 'rgba(168, 85, 247, 0.20)',
    badge: 'bg-purple-500/10 text-purple-800 border-purple-200/70',
    insigniaBg: 'bg-purple-500/10 text-purple-700 border-purple-200/70',
    insigniaText: 'text-purple-700',
    progressBar: 'from-purple-600 to-indigo-500',
    arrowBg: 'group-hover:bg-purple-600 group-hover:text-white',
    arrowText: 'text-purple-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.22) 0%, rgba(14, 165, 233, 0.13) 44%, transparent 72%)',
    cardGradient: 'from-[#FAF5FF] via-[#FBFCFC] to-[#F3E8FF]',
    ecgStrokeStart: '#9333EA',
    ecgStrokeMid: '#C084FC',
    ecgGlow: 'rgba(192, 132, 252, 0.85)',
    ecgDotColor: '#E9D5FF',
    haloStart: '#C084FC',
    haloMid: '#A855F7',
    haloEnd: '#7E22CE',
    orbitStroke: '#9333EA',
    primaryBtnBg: 'bg-[#7E22CE]',
    primaryBtnHover: 'hover:bg-[#6B21A8]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(126,34,206,0.25)]',
  },
  physiology: {
    bg: 'from-sky-500/[0.08] via-blue-500/[0.04] to-white/95',
    border: 'border-sky-200/70 hover:border-sky-400/90',
    glow: 'rgba(14, 165, 233, 0.20)',
    badge: 'bg-sky-500/10 text-sky-800 border-sky-200/70',
    insigniaBg: 'bg-sky-500/10 text-sky-700 border-sky-200/70',
    insigniaText: 'text-sky-700',
    progressBar: 'from-sky-600 to-cyan-500',
    arrowBg: 'group-hover:bg-sky-600 group-hover:text-white',
    arrowText: 'text-sky-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.22) 0%, rgba(13, 148, 136, 0.15) 44%, transparent 72%)',
    cardGradient: 'from-[#F0F9FF] via-[#FBFCFC] to-[#E0F2FE]',
    ecgStrokeStart: '#0284C7',
    ecgStrokeMid: '#38BDF8',
    ecgGlow: 'rgba(56, 189, 248, 0.85)',
    ecgDotColor: '#BAE6FD',
    haloStart: '#38BDF8',
    haloMid: '#0284C7',
    haloEnd: '#0369A1',
    orbitStroke: '#0284C7',
    primaryBtnBg: 'bg-[#0284C7]',
    primaryBtnHover: 'hover:bg-[#0369A1]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(2,132,199,0.25)]',
  },
  surgery: {
    bg: 'from-rose-500/[0.08] via-orange-500/[0.04] to-white/95',
    border: 'border-rose-200/70 hover:border-rose-400/90',
    glow: 'rgba(244, 63, 94, 0.20)',
    badge: 'bg-rose-500/10 text-rose-800 border-rose-200/70',
    insigniaBg: 'bg-rose-500/10 text-rose-700 border-rose-200/70',
    insigniaText: 'text-rose-700',
    progressBar: 'from-rose-600 to-red-500',
    arrowBg: 'group-hover:bg-rose-600 group-hover:text-white',
    arrowText: 'text-rose-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.20) 0%, rgba(245, 158, 11, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF1F2] via-[#FBFCFC] to-[#FFE4E6]',
    ecgStrokeStart: '#E11D48',
    ecgStrokeMid: '#FB7185',
    ecgGlow: 'rgba(251, 113, 133, 0.85)',
    ecgDotColor: '#FECDD3',
    haloStart: '#FB7185',
    haloMid: '#F43F5E',
    haloEnd: '#BE123C',
    orbitStroke: '#E11D48',
    primaryBtnBg: 'bg-[#BE123C]',
    primaryBtnHover: 'hover:bg-[#9F1239]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(190,18,60,0.25)]',
  },
  pathology: {
    bg: 'from-blue-500/[0.08] via-indigo-500/[0.04] to-white/95',
    border: 'border-blue-200/70 hover:border-blue-400/90',
    glow: 'rgba(59, 130, 246, 0.20)',
    badge: 'bg-blue-500/10 text-blue-800 border-blue-200/70',
    insigniaBg: 'bg-blue-500/10 text-blue-700 border-blue-200/70',
    insigniaText: 'text-blue-700',
    progressBar: 'from-blue-600 to-indigo-500',
    arrowBg: 'group-hover:bg-blue-600 group-hover:text-white',
    arrowText: 'text-blue-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.20) 0%, rgba(99, 102, 241, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#EFF6FF] via-[#FBFCFC] to-[#DBEAFE]',
    ecgStrokeStart: '#2563EB',
    ecgStrokeMid: '#60A5FA',
    ecgGlow: 'rgba(96, 165, 250, 0.85)',
    ecgDotColor: '#BFDBFE',
    haloStart: '#60A5FA',
    haloMid: '#3B82F6',
    haloEnd: '#1D4ED8',
    orbitStroke: '#2563EB',
    primaryBtnBg: 'bg-[#1D4ED8]',
    primaryBtnHover: 'hover:bg-[#1E40AF]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(29,78,216,0.25)]',
  },
  biochemistry: {
    bg: 'from-amber-500/[0.08] via-yellow-500/[0.04] to-white/95',
    border: 'border-amber-200/70 hover:border-amber-400/90',
    glow: 'rgba(245, 158, 11, 0.20)',
    badge: 'bg-amber-500/10 text-amber-800 border-amber-200/70',
    insigniaBg: 'bg-amber-500/10 text-amber-700 border-amber-200/70',
    insigniaText: 'text-amber-700',
    progressBar: 'from-amber-600 to-yellow-500',
    arrowBg: 'group-hover:bg-amber-600 group-hover:text-white',
    arrowText: 'text-amber-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.22) 0%, rgba(251, 191, 36, 0.13) 44%, transparent 72%)',
    cardGradient: 'from-[#FFFBEB] via-[#FBFCFC] to-[#FEF3C7]',
    ecgStrokeStart: '#D97706',
    ecgStrokeMid: '#FBBF24',
    ecgGlow: 'rgba(251, 191, 36, 0.85)',
    ecgDotColor: '#FDE68A',
    haloStart: '#FBBF24',
    haloMid: '#F59E0B',
    haloEnd: '#B45309',
    orbitStroke: '#D97706',
    primaryBtnBg: 'bg-[#B45309]',
    primaryBtnHover: 'hover:bg-[#92400E]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(180,83,9,0.25)]',
  },
  anatomy: {
    bg: 'from-emerald-500/[0.08] via-teal-500/[0.04] to-white/95',
    border: 'border-emerald-200/70 hover:border-emerald-400/90',
    glow: 'rgba(20, 184, 166, 0.20)',
    badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/70',
    insigniaBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/70',
    insigniaText: 'text-emerald-700',
    progressBar: 'from-emerald-600 to-teal-500',
    arrowBg: 'group-hover:bg-teal-600 group-hover:text-white',
    arrowText: 'text-teal-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.20) 0%, rgba(0, 107, 99, 0.15) 44%, transparent 72%)',
    cardGradient: 'from-[#F0FDF4] via-[#FBFCFC] to-[#DCFCE7]',
    ecgStrokeStart: '#059669',
    ecgStrokeMid: '#34D399',
    ecgGlow: 'rgba(52, 211, 153, 0.85)',
    ecgDotColor: '#A7F3D0',
    haloStart: '#34D399',
    haloMid: '#10B981',
    haloEnd: '#047857',
    orbitStroke: '#059669',
    primaryBtnBg: 'bg-[#047857]',
    primaryBtnHover: 'hover:bg-[#065F46]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(4,120,87,0.25)]',
  },
  pharmacology: {
    bg: 'from-violet-500/[0.08] via-purple-500/[0.04] to-white/95',
    border: 'border-violet-200/70 hover:border-violet-400/90',
    glow: 'rgba(16, 185, 129, 0.20)',
    badge: 'bg-violet-500/10 text-violet-800 border-violet-200/70',
    insigniaBg: 'bg-violet-500/10 text-violet-700 border-violet-200/70',
    insigniaText: 'text-violet-700',
    progressBar: 'from-violet-600 to-purple-500',
    arrowBg: 'group-hover:bg-violet-600 group-hover:text-white',
    arrowText: 'text-violet-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.20) 0%, rgba(20, 184, 166, 0.15) 44%, transparent 72%)',
    cardGradient: 'from-[#ECFDF5] via-[#FBFCFC] to-[#D1FAE5]',
    ecgStrokeStart: '#7C3AED',
    ecgStrokeMid: '#A78BFA',
    ecgGlow: 'rgba(167, 139, 250, 0.85)',
    ecgDotColor: '#DDD6FE',
    haloStart: '#A78BFA',
    haloMid: '#7C3AED',
    haloEnd: '#5B21B6',
    orbitStroke: '#7C3AED',
    primaryBtnBg: 'bg-[#5B21B6]',
    primaryBtnHover: 'hover:bg-[#4C1D95]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(91,33,182,0.25)]',
  },
  microbiology: {
    bg: 'from-cyan-500/[0.08] via-teal-500/[0.04] to-white/95',
    border: 'border-cyan-200/70 hover:border-cyan-400/90',
    glow: 'rgba(13, 148, 136, 0.20)',
    badge: 'bg-cyan-500/10 text-cyan-800 border-cyan-200/70',
    insigniaBg: 'bg-cyan-500/10 text-cyan-700 border-cyan-200/70',
    insigniaText: 'text-cyan-700',
    progressBar: 'from-cyan-600 to-teal-500',
    arrowBg: 'group-hover:bg-cyan-600 group-hover:text-white',
    arrowText: 'text-cyan-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.22) 0%, rgba(16, 185, 129, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#ECFEFF] via-[#FBFCFC] to-[#CFFAFE]',
    ecgStrokeStart: '#0891B2',
    ecgStrokeMid: '#22D3EE',
    ecgGlow: 'rgba(34, 211, 238, 0.85)',
    ecgDotColor: '#A5F3FC',
    haloStart: '#22D3EE',
    haloMid: '#06B6D4',
    haloEnd: '#0E7490',
    orbitStroke: '#0891B2',
    primaryBtnBg: 'bg-[#0E7490]',
    primaryBtnHover: 'hover:bg-[#155E75]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(14,116,144,0.25)]',
  },
  fmt: {
    bg: 'from-slate-500/[0.08] via-zinc-500/[0.04] to-white/95',
    border: 'border-slate-300/70 hover:border-slate-400',
    glow: 'rgba(100, 116, 139, 0.18)',
    badge: 'bg-slate-500/10 text-slate-800 border-slate-300/70',
    insigniaBg: 'bg-slate-500/10 text-slate-700 border-slate-300/70',
    insigniaText: 'text-slate-700',
    progressBar: 'from-slate-600 to-slate-500',
    arrowBg: 'group-hover:bg-slate-700 group-hover:text-white',
    arrowText: 'text-slate-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(100, 116, 139, 0.20) 0%, rgba(148, 163, 184, 0.13) 44%, transparent 72%)',
    cardGradient: 'from-[#F8FAFC] via-[#FBFCFC] to-[#F1F5F9]',
    ecgStrokeStart: '#475569',
    ecgStrokeMid: '#94A3B8',
    ecgGlow: 'rgba(148, 163, 184, 0.85)',
    ecgDotColor: '#CBD5E1',
    haloStart: '#94A3B8',
    haloMid: '#64748B',
    haloEnd: '#334155',
    orbitStroke: '#475569',
    primaryBtnBg: 'bg-[#334155]',
    primaryBtnHover: 'hover:bg-[#1E293B]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(51,65,85,0.25)]',
  },
  psm: {
    bg: 'from-teal-500/[0.08] via-emerald-500/[0.04] to-white/95',
    border: 'border-teal-200/70 hover:border-teal-400/90',
    glow: 'rgba(6, 182, 212, 0.20)',
    badge: 'bg-teal-500/10 text-teal-800 border-teal-200/70',
    insigniaBg: 'bg-teal-500/10 text-teal-700 border-teal-200/70',
    insigniaText: 'text-teal-700',
    progressBar: 'from-[#006B63] to-emerald-500',
    arrowBg: 'group-hover:bg-teal-600 group-hover:text-white',
    arrowText: 'text-teal-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(0, 107, 99, 0.22) 0%, rgba(6, 182, 212, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#F0FDFA] via-[#FBFCFC] to-[#CCFBF1]',
    ecgStrokeStart: '#007F73',
    ecgStrokeMid: '#2DD4BF',
    ecgGlow: 'rgba(45, 212, 191, 0.85)',
    ecgDotColor: '#99F6E4',
    haloStart: '#2DD4BF',
    haloMid: '#0D9488',
    haloEnd: '#006B63',
    orbitStroke: '#007F73',
    primaryBtnBg: 'bg-[#006B63]',
    primaryBtnHover: 'hover:bg-[#00554E]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(0,107,99,0.25)]',
  },
  ophthalmology: {
    bg: 'from-indigo-500/[0.08] via-blue-500/[0.04] to-white/95',
    border: 'border-indigo-200/70 hover:border-indigo-400/90',
    glow: 'rgba(99, 102, 241, 0.20)',
    badge: 'bg-indigo-500/10 text-indigo-800 border-indigo-200/70',
    insigniaBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/70',
    insigniaText: 'text-indigo-700',
    progressBar: 'from-indigo-600 to-blue-500',
    arrowBg: 'group-hover:bg-indigo-600 group-hover:text-white',
    arrowText: 'text-indigo-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.22) 0%, rgba(99, 102, 241, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#EEF2FF] via-[#FBFCFC] to-[#E0E7FF]',
    ecgStrokeStart: '#4F46E5',
    ecgStrokeMid: '#818CF8',
    ecgGlow: 'rgba(129, 140, 248, 0.85)',
    ecgDotColor: '#C7D2FE',
    haloStart: '#818CF8',
    haloMid: '#6366F1',
    haloEnd: '#4338CA',
    orbitStroke: '#4F46E5',
    primaryBtnBg: 'bg-[#4338CA]',
    primaryBtnHover: 'hover:bg-[#3730A3]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(67,56,202,0.25)]',
  },
  ent: {
    bg: 'from-fuchsia-500/[0.08] via-pink-500/[0.04] to-white/95',
    border: 'border-fuchsia-200/70 hover:border-fuchsia-400/90',
    glow: 'rgba(168, 85, 247, 0.20)',
    badge: 'bg-fuchsia-500/10 text-fuchsia-800 border-fuchsia-200/70',
    insigniaBg: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200/70',
    insigniaText: 'text-fuchsia-700',
    progressBar: 'from-fuchsia-600 to-pink-500',
    arrowBg: 'group-hover:bg-fuchsia-600 group-hover:text-white',
    arrowText: 'text-fuchsia-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.20) 0%, rgba(236, 72, 153, 0.13) 44%, transparent 72%)',
    cardGradient: 'from-[#FDF4FF] via-[#FBFCFC] to-[#FAE8FF]',
    ecgStrokeStart: '#C026D3',
    ecgStrokeMid: '#E879F9',
    ecgGlow: 'rgba(232, 121, 249, 0.85)',
    ecgDotColor: '#F5D0FE',
    haloStart: '#E879F9',
    haloMid: '#D946EF',
    haloEnd: '#A21CAF',
    orbitStroke: '#C026D3',
    primaryBtnBg: 'bg-[#A21CAF]',
    primaryBtnHover: 'hover:bg-[#86198F]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(162,28,175,0.25)]',
  },
  obg: {
    bg: 'from-pink-500/[0.08] via-rose-500/[0.04] to-white/95',
    border: 'border-pink-200/70 hover:border-pink-400/90',
    glow: 'rgba(236, 72, 153, 0.20)',
    badge: 'bg-pink-500/10 text-pink-800 border-pink-200/70',
    insigniaBg: 'bg-pink-500/10 text-pink-700 border-pink-200/70',
    insigniaText: 'text-pink-700',
    progressBar: 'from-pink-600 to-rose-500',
    arrowBg: 'group-hover:bg-pink-600 group-hover:text-white',
    arrowText: 'text-pink-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.20) 0%, rgba(251, 113, 133, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#FDF2F8] via-[#FBFCFC] to-[#FCE7F3]',
    ecgStrokeStart: '#DB2777',
    ecgStrokeMid: '#F472B6',
    ecgGlow: 'rgba(244, 114, 182, 0.85)',
    ecgDotColor: '#FBCFE8',
    haloStart: '#F472B6',
    haloMid: '#EC4899',
    haloEnd: '#BE185D',
    orbitStroke: '#DB2777',
    primaryBtnBg: 'bg-[#BE185D]',
    primaryBtnHover: 'hover:bg-[#9D174D]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(190,24,93,0.25)]',
  },
  pediatrics: {
    bg: 'from-amber-500/[0.08] via-orange-500/[0.04] to-white/95',
    border: 'border-amber-200/70 hover:border-amber-400/90',
    glow: 'rgba(245, 158, 11, 0.20)',
    badge: 'bg-amber-500/10 text-amber-800 border-amber-200/70',
    insigniaBg: 'bg-amber-500/10 text-amber-700 border-amber-200/70',
    insigniaText: 'text-amber-700',
    progressBar: 'from-amber-600 to-orange-500',
    arrowBg: 'group-hover:bg-amber-600 group-hover:text-white',
    arrowText: 'text-amber-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.22) 0%, rgba(6, 182, 212, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#F0FDFA] via-[#FBFCFC] to-[#E0F2FE]',
    ecgStrokeStart: '#D97706',
    ecgStrokeMid: '#FBBF24',
    ecgGlow: 'rgba(251, 191, 36, 0.85)',
    ecgDotColor: '#FDE68A',
    haloStart: '#FBBF24',
    haloMid: '#F59E0B',
    haloEnd: '#B45309',
    orbitStroke: '#D97706',
    primaryBtnBg: 'bg-[#B45309]',
    primaryBtnHover: 'hover:bg-[#92400E]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(180,83,9,0.25)]',
  },
  orthopedics: {
    bg: 'from-violet-500/[0.08] via-purple-500/[0.04] to-white/95',
    border: 'border-violet-200/70 hover:border-violet-400/90',
    glow: 'rgba(139, 92, 246, 0.18)',
    badge: 'bg-violet-500/10 text-violet-800 border-violet-200/70',
    insigniaBg: 'bg-violet-500/10 text-violet-700 border-violet-200/70',
    insigniaText: 'text-violet-700',
    progressBar: 'from-violet-600 to-purple-500',
    arrowBg: 'group-hover:bg-violet-600 group-hover:text-white',
    arrowText: 'text-violet-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.20) 0%, rgba(16, 185, 129, 0.13) 44%, transparent 72%)',
    cardGradient: 'from-[#F5F3FF] via-[#FBFCFC] to-[#EDE9FE]',
    ecgStrokeStart: '#7C3AED',
    ecgStrokeMid: '#A78BFA',
    ecgGlow: 'rgba(167, 139, 250, 0.85)',
    ecgDotColor: '#DDD6FE',
    haloStart: '#A78BFA',
    haloMid: '#8B5CF6',
    haloEnd: '#6D28D9',
    orbitStroke: '#7C3AED',
    primaryBtnBg: 'bg-[#6D28D9]',
    primaryBtnHover: 'hover:bg-[#5B21B6]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(109,40,217,0.25)]',
  },
  dermatology: {
    bg: 'from-orange-500/[0.08] via-rose-500/[0.04] to-white/95',
    border: 'border-orange-200/70 hover:border-orange-400/90',
    glow: 'rgba(244, 63, 94, 0.20)',
    badge: 'bg-orange-500/10 text-orange-800 border-orange-200/70',
    insigniaBg: 'bg-orange-500/10 text-orange-700 border-orange-200/70',
    insigniaText: 'text-orange-700',
    progressBar: 'from-orange-600 to-rose-500',
    arrowBg: 'group-hover:bg-orange-600 group-hover:text-white',
    arrowText: 'text-orange-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.20) 0%, rgba(245, 158, 11, 0.13) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF7ED] via-[#FBFCFC] to-[#FFEDD5]',
    ecgStrokeStart: '#EA580C',
    ecgStrokeMid: '#FB923C',
    ecgGlow: 'rgba(251, 146, 60, 0.85)',
    ecgDotColor: '#FED7AA',
    haloStart: '#FB923C',
    haloMid: '#F97316',
    haloEnd: '#C2410C',
    orbitStroke: '#EA580C',
    primaryBtnBg: 'bg-[#C2410C]',
    primaryBtnHover: 'hover:bg-[#9A3412]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(194,65,12,0.25)]',
  },
  radiology: {
    bg: 'from-cyan-600/[0.08] via-slate-500/[0.04] to-white/95',
    border: 'border-cyan-200/70 hover:border-cyan-400/90',
    glow: 'rgba(15, 23, 42, 0.18)',
    badge: 'bg-cyan-600/10 text-cyan-800 border-cyan-200/70',
    insigniaBg: 'bg-cyan-600/10 text-cyan-800 border-cyan-200/70',
    insigniaText: 'text-cyan-800',
    progressBar: 'from-cyan-600 to-slate-600',
    arrowBg: 'group-hover:bg-slate-700 group-hover:text-white',
    arrowText: 'text-slate-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(2, 132, 199, 0.22) 0%, rgba(71, 85, 105, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#F0F9FF] via-[#FBFCFC] to-[#E2E8F0]',
    ecgStrokeStart: '#0369A1',
    ecgStrokeMid: '#38BDF8',
    ecgGlow: 'rgba(56, 189, 248, 0.85)',
    ecgDotColor: '#BAE6FD',
    haloStart: '#38BDF8',
    haloMid: '#0284C7',
    haloEnd: '#0F172A',
    orbitStroke: '#0369A1',
    primaryBtnBg: 'bg-[#0369A1]',
    primaryBtnHover: 'hover:bg-[#075985]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(3,105,161,0.25)]',
  },
  anesthesia: {
    bg: 'from-teal-600/[0.08] via-slate-500/[0.04] to-white/95',
    border: 'border-teal-200/70 hover:border-teal-400/90',
    glow: 'rgba(13, 148, 136, 0.20)',
    badge: 'bg-teal-600/10 text-teal-800 border-teal-200/70',
    insigniaBg: 'bg-teal-600/10 text-teal-800 border-teal-200/70',
    insigniaText: 'text-teal-800',
    progressBar: 'from-teal-700 to-teal-500',
    arrowBg: 'group-hover:bg-teal-600 group-hover:text-white',
    arrowText: 'text-teal-700',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(13, 148, 136, 0.22) 0%, rgba(56, 189, 248, 0.14) 44%, transparent 72%)',
    cardGradient: 'from-[#F0FDFA] via-[#FBFCFC] to-[#F1F5F9]',
    ecgStrokeStart: '#0F766E',
    ecgStrokeMid: '#2DD4BF',
    ecgGlow: 'rgba(45, 212, 191, 0.85)',
    ecgDotColor: '#99F6E4',
    haloStart: '#2DD4BF',
    haloMid: '#0D9488',
    haloEnd: '#115E59',
    orbitStroke: '#0F766E',
    primaryBtnBg: 'bg-[#0F766E]',
    primaryBtnHover: 'hover:bg-[#115E59]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(15,118,110,0.25)]',
  },
};

const DEFAULT_CARD_THEME: SubjectCardTheme = {
  bg: 'from-teal-500/[0.08] via-slate-500/[0.04] to-white/95',
  border: 'border-slate-200/80 hover:border-teal-300',
  glow: 'rgba(13, 148, 136, 0.16)',
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  insigniaBg: 'bg-teal-500/10 text-teal-700 border-teal-200/70',
  insigniaText: 'text-teal-700',
  progressBar: 'from-[#006B63] to-teal-500',
  arrowBg: 'group-hover:bg-[#006B63] group-hover:text-white',
  arrowText: 'text-slate-600',
  heroGradient: 'radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.22) 0%, transparent 70%)',
  cardGradient: 'from-[#F4FAF8] via-[#FBFCFC] to-[#EFF8F5]',
  ecgStrokeStart: '#0D9488',
  ecgStrokeMid: '#00F0FF',
  ecgGlow: 'rgba(0, 240, 255, 0.85)',
  ecgDotColor: '#00FFFF',
  haloStart: '#2DD4BF',
  haloMid: '#38BDF8',
  haloEnd: '#0EA5E9',
  orbitStroke: '#0D9488',
  primaryBtnBg: 'bg-[#006B63]',
  primaryBtnHover: 'hover:bg-[#00554E]',
  primaryBtnShadow: 'shadow-[0_4px_14px_rgba(0,107,99,0.25)]',
};

const SECTION_ENTER = (delay: number, reduced: boolean | null) =>
  reduced ? {} : { delay, y: 10, opacity: 0 };
const SECTION_SHOW = { y: 0, opacity: 1 };
const SECTION_TRANSITION = (reduced: boolean | null) =>
  reduced ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };
const SPRING = (reduced: boolean | null) =>
  reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 34 };

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onNavigateTab,
  onOpenAiCoach,
  onLaunchPracticeSession,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateDailyLog,
  onToggleTopicState,
  onToggleMissionCompletion,
  onLogGrandTest,
  onAddErrorItem,
  activeBg,
  onShuffleBg,
  onOpenProfile,
  onOpenZenFocus,
  onOpenAudioRecall,
  subTab,
  onSubTabChange,
}) => {
  const { user, profile } = useAuth();
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'planner'>(
    subTab || 'overview'
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (subTab) {
      setCurrentSubTab(subTab);
    }
  }, [subTab]);

  const handleSubTabChange = (tab: 'overview' | 'planner') => {
    setCurrentSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [selectedFilterSubjectId, setSelectedFilterSubjectId] = useState<string>('all');
  const [activeMasteryTopic, setActiveMasteryTopic] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  // High-Yield Exam Modal states
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isIbqModalOpen, setIsIbqModalOpen] = useState(false);
  const [isPassingGapModalOpen, setIsPassingGapModalOpen] = useState(false);
  const [isExamEveCheatSheetOpen, setIsExamEveCheatSheetOpen] = useState(false);
  const [isNbeMockOpen, setIsNbeMockOpen] = useState(false);

  // Spaced Repetition Due Mistakes count and retest launcher
  const unreviewedErrorsCount = useMemo(() => {
    return (state.errorNotebook || []).filter((e) => isSpacedErrorDue(e)).length;
  }, [state.errorNotebook]);

  const handleLaunchErrorDrill = () => {
    const targetError = state.errorNotebook?.find((e) => !e.isReviewed) || state.errorNotebook?.[0];
    if (targetError && onLaunchPracticeSession) {
      onLaunchPracticeSession(targetError.subjectId, 'error-retest', targetError.topic || 'Error Remediation');
    } else {
      onNavigateTab('errors');
    }
  };

  // Spaced Repetition Due Today Count
  const duePearlsCount = useMemo(() => {
    const bookmarked = (state.customPearls || []).filter((p) => p.isBookmarked);
    return getDuePearls(bookmarked).length;
  }, [state.customPearls]);

  // Daily High-Yield Recall Pearl (Interactive Reveal)
  const [isPearlRevealed, setIsPearlRevealed] = useState(false);
  const [dailyPearlIndex, setDailyPearlIndex] = useState(0);
  const todayPearl = useMemo(
    () => HIGH_YIELD_TRIADS[dailyPearlIndex % HIGH_YIELD_TRIADS.length],
    [dailyPearlIndex]
  );

  // Projected Pass Trajectory & Score for Exam Journey
  const projectedScore = useMemo(() => {
    if (stats?.latestGTScore && stats.latestGTScore > 0) {
      return stats.latestGTScore;
    }
    const totalDoneNotes = Object.values(state.topicsState || {}).filter((t) => t?.notesDone).length;
    const testScoreBonus = Math.min(65, Math.round(totalDoneNotes * 1.8 + (stats?.overallReadinessScore || 20) * 0.4));
    return Math.min(260, 150 + testScoreBonus);
  }, [state.topicsState, stats]);

  // Unread badge reflects live visible notifications
  const hasUnread = useMemo(
    () => hasUnreadNotifications(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isNotificationCenterOpen]
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filter scroll ref for subject pills
  const filterScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic scroll-aware auto-hide state for navigation and headers
  const { isVisible: isHeaderVisible, scrollY, isAtTop } = useScrollDirection(12);

  // Respect prefers-reduced-motion
  const reducedMotion = useReducedMotion();

  const themeSetting = state.settings?.bgTheme;
  const circadian = useCircadianTheme(themeSetting);
  const { greeting, timeOfDay, Icon: GreetingIcon } = circadian;

  // Authentic FMGE Doctor's Creed tailored to circadian study phase
  const { creed: doctorCreed, shuffleCreed, isShuffling: isCreedShuffling } = useDoctorCreed(timeOfDay);

  // Dynamic header theme styling that adapts with time of day and user theme setting
  const heroTheme = useMemo(() => {
    return {
      bannerBg: circadian.bannerBg,
      auraGrad: circadian.auraGrad,
      topLight: circadian.topLight,
      nameColor: circadian.isNight ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]' : 'text-[#1D1D1F]',
      subtitleColor: circadian.isNight ? 'text-teal-100/90' : circadian.subtitleColor,
      greetingIconColor: circadian.iconColor,
    };
  }, [circadian]);

  const daysRemaining = useMemo(() => getDaysRemainingToExam(state), [state]);

  // Calibrated Target Exam Date (Respects User Profile / Settings)
  const targetExamDateFormatted = useMemo(() => {
    const raw = state.settings?.examDate;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    const fallback = new Date(getNextFmgeSessionDate());
    return fallback.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [state.settings?.examDate]);

  // Dynamic Exam Revision Phase Calibrated to Days Remaining
  const sprintPhase = useMemo(() => {
    if (daysRemaining <= 7) {
      return {
        badgeText: '7-DAY FINAL PEAK & TRIAGE',
        stageLabel: `Day ${Math.max(1, 7 - daysRemaining + 1)} of 7`,
        headline: 'Emergency Exam-Eve Lockdown',
        description: 'Focus strictly on guaranteed 1-liners, clinical triads, drug doses & visual IBQs. Avoid new heavy theory.',
        anchorLabel: 'HIGH-FREQUENCY',
        drillLabel: 'SPEED MCQ',
        shieldLabel: 'ERROR VAULT',
      };
    }
    if (daysRemaining <= 30) {
      return {
        badgeText: '30-DAY FINAL REVISION SPRINT',
        stageLabel: `Day ${Math.max(1, 30 - daysRemaining + 1)} of 30`,
        headline: "Today's Clinical Survival Target",
        description: 'Targeted high-yield blueprint concepts to systematically secure +2 to +4 marks every day.',
        anchorLabel: 'HIGH-YIELD',
        drillLabel: 'SPEED MCQ',
        shieldLabel: 'ERROR VAULT',
      };
    }
    if (daysRemaining <= 60) {
      return {
        badgeText: '60-DAY CONSOLIDATION SPRINT',
        stageLabel: `Day ${Math.max(1, 60 - daysRemaining + 1)} of 60`,
        headline: 'Systematic High-Yield Consolidation',
        description: 'Consolidating core clinical disciplines and converting weak topic gaps into reliable strengths.',
        anchorLabel: 'CORE STUDY',
        drillLabel: 'VIGNETTE MCQ',
        shieldLabel: 'ERROR VAULT',
      };
    }
    return {
      badgeText: 'FOUNDATIONAL CURRICULUM SPRINT',
      stageLabel: `T-${daysRemaining} Days to Exam`,
      headline: '19-Subject Blueprint Foundation',
      description: 'Systematic syllabus coverage and high-yield question pattern calibration.',
      anchorLabel: 'TOPIC STUDY',
      drillLabel: 'SPEED MCQ',
      shieldLabel: 'ERROR VAULT',
    };
  }, [daysRemaining]);

  // Adaptive recommendation
  const adaptiveRecommendation = useMemo(() => {
    return getNextBestStudyAction(state);
  }, [state]);

  // Personalized planning context derived from the onboarding profile + state
  const learningContext: LearningContext = useMemo(
    () => getLearningContext(profile, state),
    [profile, state]
  );

  const dailyPlan: PersonalizedPlan = useMemo(
    () => getPersonalizedDailyPlan(profile, state),
    [profile, state]
  );

  // Task in the plan that's a "do now" action
  const nextActionTask = useMemo(() => {
    const actionable = dailyPlan.tasks.find(
      (t) => t.activity === 'learn' || t.activity === 'mcqs'
    );
    return actionable || dailyPlan.tasks[0];
  }, [dailyPlan]);

  // Today's remaining plan tasks
  const todayPlanTasks = useMemo(() => {
    const primaryId = nextActionTask?.id;
    return dailyPlan.tasks.filter((t) => t.id !== primaryId).slice(0, 3);
  }, [dailyPlan, nextActionTask]);

  const recommendedSubject = useMemo(() => {
    return FMGE_SUBJECTS.find((s) => s.id === adaptiveRecommendation.subjectId) || FMGE_SUBJECTS[0];
  }, [adaptiveRecommendation.subjectId]);

  // Active displayed recommendation
  const activeFocusSubject = useMemo(() => {
    if (selectedFilterSubjectId === 'all') return recommendedSubject;
    return FMGE_SUBJECTS.find((s) => s.id === selectedFilterSubjectId) || recommendedSubject;
  }, [selectedFilterSubjectId, recommendedSubject]);

  const activeFocusTopic = useMemo(() => {
    if (selectedFilterSubjectId === 'all') {
      return {
        id: adaptiveRecommendation.topicId,
        name: adaptiveRecommendation.topicName,
        reason: adaptiveRecommendation.reason || 'High-yield NBE exam blueprint topic recommended for mastery.',
        isHighYield: true,
      };
    }
    const firstUnfinished =
      activeFocusSubject.topics.find((t) => !state.topicsState?.[`${activeFocusSubject.id}-${t.id}`]?.notesDone) ||
      activeFocusSubject.topics[0];
    return {
      id: firstUnfinished.id,
      name: firstUnfinished.name,
      reason: `Master core high-yield principles and clinical diagnosis in ${activeFocusSubject.name}.`,
      isHighYield: firstUnfinished.isHighYield,
    };
  }, [selectedFilterSubjectId, activeFocusSubject, adaptiveRecommendation, state.topicsState]);

  const hasRevisionDue = dailyPlan.revisionDueCount > 0;
  const errorsToReview = dailyPlan.errorRemediationCount > 0;

  // Subject-specific theme and gradient styling for Today's Focus card
  const focusTheme = useMemo(
    () => SUBJECT_CARD_THEMES[activeFocusSubject.id] || DEFAULT_CARD_THEME,
    [activeFocusSubject.id]
  );

  // Dynamic scattered multi-point ambient gradient tailored to the active subject (No rigid circle / bullseye)
  const cardGradientStyle = useMemo(() => {
    const primary = focusTheme.ecgStrokeStart || '#0D9488';
    const secondary = focusTheme.haloStart || '#2DD4BF';
    const bgColors = focusTheme.cardGradient?.match(/#[A-Fa-f0-9]{6}/g) || ['#F4FAF8', '#FBFCFC', '#EFF8F5'];
    const baseStart = bgColors[0] || '#FFFFFF';
    const baseMid = bgColors[1] || '#FAFCFC';
    const baseEnd = bgColors[2] || '#F4F8F7';

    return {
      background: `
        radial-gradient(ellipse 55% 50% at 85% 25%, ${secondary}2a 0%, transparent 70%),
        radial-gradient(ellipse 45% 45% at 20% 75%, ${primary}16 0%, transparent 65%),
        radial-gradient(ellipse 50% 60% at 65% 85%, ${secondary}1c 0%, transparent 75%),
        radial-gradient(ellipse 35% 35% at 10% 20%, ${primary}14 0%, transparent 60%),
        linear-gradient(135deg, ${baseStart} 0%, ${baseMid} 50%, ${baseEnd} 100%)
      `,
    };
  }, [focusTheme]);

  // Dynamic clinical telemetry metadata tailored to the active subject & topic
  const currentTelemetry = useMemo(
    () => getSubjectTelemetry(activeFocusSubject.id, activeFocusTopic.name),
    [activeFocusSubject.id, activeFocusTopic.name]
  );

  // Subject progress with FMGE relevance
  const subjectList = useMemo(() => {
    const list = FMGE_SUBJECTS.map((sub) => {
      const allTopics = [...sub.topics, ...(state.subjectProgress?.[sub.id]?.customTopics || [])];
      const doneNotes = allTopics.filter(
        (t) => state.topicsState?.[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      const percentage = Math.round((doneNotes / Math.max(1, allTopics.length)) * 100);

      let statusText = 'On track';
      let statusClass = 'text-[#006B63] bg-[#e6f0ee] border-[#cfe2df]';
      if (percentage < 30) {
        statusText = 'Needs focus';
        statusClass = 'text-[#92400e] bg-[#fef3c7] border-[#fde68a]';
      } else if (percentage >= 60) {
        statusText = 'On track';
        statusClass = 'text-[#006B63] bg-[#e6f0ee] border-[#cfe2df]';
      }
      return {
        ...sub,
        percentage,
        statusText,
        statusClass,
      };
    });

    if (selectedFilterSubjectId && selectedFilterSubjectId !== 'all') {
      return [...list].sort((a, b) =>
        a.id === selectedFilterSubjectId ? -1 : b.id === selectedFilterSubjectId ? 1 : 0
      );
    }
    return [...list].sort((a, b) => (b.weightage || 0) - (a.weightage || 0));
  }, [state.subjectProgress, state.topicsState, selectedFilterSubjectId]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: Array<{ subject: (typeof FMGE_SUBJECTS)[0]; topic: (typeof FMGE_SUBJECTS)[0]['topics'][0] }> = [];
    for (const sub of FMGE_SUBJECTS) {
      for (const top of sub.topics) {
        if (top.name.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q)) {
          results.push({ subject: sub, topic: top });
          if (results.length >= 8) break;
        }
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [searchQuery]);

  const userName = user?.displayName || profile?.displayName || state.settings.userName || 'Doctor';
  const initials = (userName || 'Doctor')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const savedTargetScore = profile?.targetScore || state.settings?.targetScore || 200;
  const focusMinutes = adaptiveRecommendation.allocatedMinutes || nextActionTask?.durationMinutes || 30;
  const focusMarks = adaptiveRecommendation.weightage || activeFocusSubject.weightage;

  // Protected study streak bridging hospital duties & rest days
  const currentStreak = useMemo(
    () => calculateProtectedStudyStreak(state.studyLogs, state.streakFreezeDates),
    [state.studyLogs, state.streakFreezeDates]
  );

  // Active topic completion calculations for the circular gauge & status
  const { topicProgressPercent, topicStatusLabel, topicSubtext, topicTitlePrimary, topicTitleHighlight, topicSubtitleItems } = useMemo(() => {
    const key = `${activeFocusSubject.id}-${activeFocusTopic.id}`;
    const topicState = state.topicsState?.[key];
    
    let checks = 0;
    if (topicState?.notesDone) checks += 1;
    if (topicState?.qBankDone) checks += 1;
    if (topicState?.r1Done) checks += 1;
    if (topicState?.r2Done) checks += 1;
    if (topicState?.r3Done) checks += 1;
    
    const pct = Math.round((checks / 5) * 100);
    
    let status = 'Not started';
    if (pct === 100) status = 'Completed';
    else if (pct > 0) status = 'In progress';

    // Parse topic title for clean two-tone bold styling: "Cardiology — " and "ECGs"
    let primary = 'Cardiology — ';
    let highlight = 'ECGs';
    let subtitleList: string[] = ['STEMI', 'Arrhythmias', 'Heart Blocks', 'WPW'];

    const fullName = activeFocusTopic.name;
    // Check if name has parenthetical list like "(STEMI, Arrhythmias, Heart Blocks, WPW)"
    const parenMatch = fullName.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const insideParen = parenMatch[1];
      const items = insideParen.split(',').map(s => s.trim()).filter(Boolean);
      if (items.length >= 2) {
        subtitleList = items;
      }
    }

    // Strip parenthetical text for clean title display
    const cleanTitle = fullName.replace(/\([^)]*\)/g, '').trim();

    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      primary = `${parts[0].trim()} — `;
      highlight = parts.slice(1).join(' - ').trim();
    } else if (cleanTitle.includes(': ')) {
      const parts = cleanTitle.split(': ');
      primary = `${parts[0].trim()} — `;
      highlight = parts.slice(1).join(': ').trim();
    } else if (cleanTitle.includes(' — ')) {
      const parts = cleanTitle.split(' — ');
      primary = `${parts[0].trim()} — `;
      highlight = parts.slice(1).join(' — ').trim();
    } else {
      const words = cleanTitle.split(' ');
      if (words.length >= 3) {
        primary = `${words.slice(0, 2).join(' ')} — `;
        highlight = words.slice(2).join(' ');
      } else {
        primary = cleanTitle;
        highlight = '';
      }
    }

    // High yield concepts / sub-bullet items fallback if not found in paren
    if (subtitleList.length === 0) {
      const rawReason = adaptiveRecommendation.actionDescription || activeFocusTopic.reason || '';
      const matches = rawReason.replace(/^(Master|Focus on|Study)\s+/i, '').split(/,|;|\band\b/).map(s => s.trim()).filter(Boolean);
      subtitleList = matches.length >= 2 ? matches.slice(0, 4) : ['High-yield Clinical Review', 'First-order Recall', 'Image Vignettes'];
    }

    const subtext = pct === 0
      ? `Let's build your confidence in ${highlight || primary.replace(/—\s*$/, '').trim()}.`
      : pct === 100
      ? `Mastery achieved. Ready for clinical application & grand mock tests.`
      : `Keep going! Solidify retention with exam-style QBank practice.`;

    return {
      topicProgressPercent: pct,
      topicStatusLabel: status,
      topicSubtext: subtext,
      topicTitlePrimary: primary,
      topicTitleHighlight: highlight,
      topicSubtitleItems: subtitleList,
    };
  }, [activeFocusSubject.id, activeFocusTopic.id, activeFocusTopic.name, activeFocusTopic.reason, adaptiveRecommendation.actionDescription, state.topicsState]);

  // Study streak 7-day calendar data
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = (currentDay === 0 ? -6 : 1) - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const streakCount = Math.max(1, currentStreak);

    return days.map((dayName, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dateNum = d.getDate();
      const todayIndex = currentDay === 0 ? 6 : currentDay - 1;
      const isToday = index === todayIndex;
      // Active if within the active streak count leading up to today
      const isCompleted = index <= todayIndex && (todayIndex - index) < streakCount;

      return {
        dayName,
        dateNum,
        isToday,
        isCompleted,
      };
    });
  }, [currentStreak]);

  const startFocusSession = () =>
    setActiveMasteryTopic({
      subjectId: activeFocusSubject.id,
      topicId: activeFocusTopic.id,
      topicName: activeFocusTopic.name,
    });

  const scrollPillsRight = () => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  if (currentSubTab === 'planner') {
    return (
      <DailyPlannerView
        state={state}
        onAddTask={onAddTask || (() => {})}
        onToggleTask={onToggleTask || (() => {})}
        onDeleteTask={onDeleteTask || (() => {})}
        onUpdateDailyLog={onUpdateDailyLog || (() => {})}
        onLaunchPracticeSession={onLaunchPracticeSession}
        onNavigateTab={onNavigateTab}
        onBackToOverview={() => handleSubTabChange('overview')}
      />
    );
  }

  return (
    <div className="relative min-h-screen font-['Plus_Jakarta_Sans'] text-slate-900 pb-16 lg:pb-12 pt-4 sm:pt-6 lg:pt-6 bg-[#F4FAF8]">
      {/* Subtle atmospheric medical wash and neural/molecular node connections */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,107,99,0.06)_0%,rgba(14,165,233,0.03)_50%,transparent_80%)]" />
      <div className="pointer-events-none fixed top-0 right-0 w-[550px] h-[400px] -z-10 opacity-[0.08] overflow-hidden" aria-hidden="true">
        <svg viewBox="0 0 550 400" fill="none" className="w-full h-full stroke-[#006B63]">
          {/* Molecular nodes */}
          <circle cx="440" cy="60" r="5" fill="#006B63" />
          <circle cx="360" cy="110" r="4" fill="#006B63" />
          <circle cx="470" cy="150" r="6" fill="#006B63" />
          <circle cx="300" cy="170" r="4" fill="#006B63" />
          <circle cx="380" cy="220" r="5" fill="#006B63" />
          <circle cx="480" cy="260" r="4" fill="#006B63" />
          <circle cx="260" cy="240" r="3" fill="#006B63" />
          <line x1="440" y1="60" x2="360" y2="110" strokeWidth="1.1" />
          <line x1="440" y1="60" x2="470" y2="150" strokeWidth="1.1" />
          <line x1="360" y1="110" x2="300" y2="170" strokeWidth="1.1" />
          <line x1="360" y1="110" x2="380" y2="220" strokeWidth="1.1" />
          <line x1="470" y1="150" x2="380" y2="220" strokeWidth="1.1" />
          <line x1="380" y1="220" x2="480" y2="260" strokeWidth="1.1" />
          <line x1="300" y1="170" x2="260" y2="240" strokeWidth="1.1" />
          {/* Subtle anatomical contour curve */}
          <path d="M 220 50 C 320 20, 480 80, 520 220 C 540 300, 460 380, 380 390" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
          {/* Tiny subtle ECG trace */}
          <path d="M 320 340 L 370 340 L 376 332 L 382 350 L 388 322 L 394 358 L 400 340 L 450 340" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">

        {/* ═══ 1. TOP BAR (Search, Notifications, Profile) with Dynamic Auto-Hide ═══ */}
        <motion.div
          initial={false}
          animate={{
            y: isHeaderVisible || isAtTop ? 0 : -80,
            opacity: isHeaderVisible || isAtTop ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={`sticky top-0 z-30 py-2 sm:py-2.5 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200 ${
            scrollY > 30
              ? 'bg-white/85 backdrop-blur-2xl border-b border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
              : 'bg-transparent'
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
            {/* Search topics input */}
            <div className="relative flex-1 w-full lg:max-w-xl">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search topics, subjects, questions..."
                aria-label="Search topics"
                className="w-full pl-9 sm:pl-10 pr-8 sm:pr-14 h-10 sm:h-11 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,107,99,0.03)] focus:bg-white/95 focus:outline-none focus:border-[#006B63]/40 focus:ring-2 focus:ring-[#006B63]/10 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="hidden sm:inline-flex absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/50 text-[10px] font-mono text-slate-400 font-medium">
                  ⌘ K
                </span>
              )}
            </div>

            {/* Right Action Controls: Focus Audio Engine + Notification Bell + Doctor Avatar */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Ambient Focus Audio Engine */}
              <AmbientSoundWidget onOpenZenFocus={onOpenZenFocus} />

              <button
                type="button"
                onClick={() => setIsNotificationCenterOpen(true)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white/80 backdrop-blur-xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,107,99,0.03)] text-slate-600 cursor-pointer hover:bg-white/95 hover:text-[#006B63] hover:border-teal-300 transition-all shrink-0"
                title="View Study Notifications"
                aria-label="View Study Notifications"
              >
                <Bell className="h-4.5 w-4.5 stroke-[1.8]" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden sm:flex items-center gap-1.5 sm:gap-2 h-10 pl-1 pr-1 sm:pr-3 rounded-full bg-white/80 backdrop-blur-xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,107,99,0.03)] hover:bg-white/95 hover:border-teal-300 transition-all cursor-pointer group"
                title="Doctor Profile & Blueprint"
              >
                <div className="h-8 w-8 rounded-full bg-[#2A2322] text-white flex items-center justify-center font-['Outfit'] font-bold text-xs shrink-0 ring-2 ring-slate-900/10">
                  {initials}
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400 group-hover:text-[#006B63] transition-colors" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live Search Autocomplete Popup */}
        <AnimatePresence>
          {isSearchOpen && searchResults.length > 0 && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_50px_rgba(0,107,99,0.12)] p-4 space-y-2 z-30"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Matching Blueprint Topics
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Close (ESC)
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {searchResults.map(({ subject, topic }) => (
                  <div
                    key={`${subject.id}-${topic.id}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/90 border border-slate-100/80 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-[#006B63] uppercase tracking-wider block">
                        {subject.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {topic.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveMasteryTopic({
                            subjectId: subject.id,
                            topicId: topic.id,
                            topicName: topic.name,
                          });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#006B63] text-white rounded-lg hover:bg-[#005750] transition-colors cursor-pointer"
                      >
                        Study
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          onLaunchPracticeSession?.(subject.id, topic.id, topic.name);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        10 MCQs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 2. TOP GREETING HERO BANNER ═══ */}
        <motion.div
          initial={SECTION_ENTER(0, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className={`rounded-3xl border shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_rgba(0,107,99,0.05)] backdrop-blur-xl p-3.5 sm:p-4.5 lg:p-5 relative overflow-hidden transition-colors duration-700 ${heroTheme.bannerBg}`}
        >
          {/* Subtle Ambient Radial Aura Mesh */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${heroTheme.auraGrad}`}
          />

          {/* Precision Architectural Top Light Line */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${heroTheme.topLight}`} />
            <motion.div
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
              className="w-52 sm:w-80 h-full bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_16px_#2dd4bf]"
            />
          </div>

          {/* Mountain Scenery with Birds & Celestial Sun/Moon Atmosphere */}
          <DoctorMountainArt
            variant="backdrop"
            forceTimeOfDay={timeOfDay}
            className="transition-opacity duration-700 opacity-40 sm:opacity-50 md:opacity-[0.62]"
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative z-10">
            {/* Left side: Doctor Circadian Greeting + Bold Name + Strategic Subtitle */}
            <div className="space-y-1 sm:space-y-1.5 max-w-xl">
              {/* Doctor Circadian Greeting */}
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${timeOfDay === 'night' ? 'text-teal-200/90' : 'text-slate-500'}`}>
                  <GreetingIcon className={`h-3.5 w-3.5 stroke-[2.2] ${heroTheme.greetingIconColor}`} />
                  <span>{greeting}</span>
                </div>
              </div>

              {/* Doctor Name */}
              <div className="pt-0.5">
                <h1 className={`text-2xl sm:text-4xl lg:text-[38px] font-extrabold tracking-[-0.03em] leading-tight ${heroTheme.nameColor}`}>
                  {userName}
                </h1>
                <p className={`hidden md:block text-xs sm:text-sm leading-relaxed italic mt-1 ${heroTheme.subtitleColor}`}>
                  &ldquo;Consistent study today builds the doctor you&apos;ll be tomorrow.&rdquo;
                </p>
                <div
                  className="md:hidden flex items-center gap-2.5 mt-1.5 cursor-pointer active:scale-98 transition-transform"
                  onClick={shuffleCreed}
                  title="Tap to shuffle motivation"
                >
                  <div className="h-6 w-9 shrink-0">
                    <AnimatedMountainInsignia
                      phase={doctorCreed.phase === 'all' ? timeOfDay : (doctorCreed.phase || timeOfDay)}
                      creedId={doctorCreed.id}
                      className="w-full h-full"
                    />
                  </div>
                  <p className={`text-xs leading-relaxed italic ${heroTheme.subtitleColor}`}>
                    &ldquo;{doctorCreed.quote}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Doctor's Mountain Creed Floating Badge with Dynamic Motivation */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              onClick={shuffleCreed}
              title="Click to shuffle motivation"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') shuffleCreed();
              }}
              className={`hidden md:flex items-center gap-3.5 rounded-2xl px-4 py-2.5 cursor-pointer select-none transition-all duration-300 group ${
                timeOfDay === 'night'
                  ? 'bg-sky-950/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-cyan-400/60'
                  : 'bg-white/80 backdrop-blur-xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_14px_rgba(0,107,99,0.04)] hover:bg-white/90 hover:border-[#006B63]/40 hover:shadow-md'
              }`}
            >
              <div className="h-8 w-12 shrink-0 relative flex items-center justify-center">
                <AnimatedMountainInsignia
                  phase={doctorCreed.phase === 'all' ? timeOfDay : (doctorCreed.phase || timeOfDay)}
                  creedId={doctorCreed.id}
                  className="w-full h-full"
                />
              </div>
              <div className="text-right space-y-0.5 min-w-[200px] max-w-[290px]">
                <p className={`text-xs font-bold italic transition-colors line-clamp-2 ${
                  timeOfDay === 'night'
                    ? 'text-cyan-100 group-hover:text-cyan-200'
                    : 'text-[#0D3833] group-hover:text-[#006B63]'
                }`}>
                  &ldquo;{doctorCreed.quote}&rdquo;
                </p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                    timeOfDay === 'night' ? 'text-cyan-400' : 'text-[#5B948C]'
                  }`}>
                    {doctorCreed.tagline}
                  </span>
                  <RotateCcw
                    className={`h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-all duration-500 ${
                      isCreedShuffling ? 'rotate-180' : 'group-hover:-rotate-90'
                    } ${
                      timeOfDay === 'night' ? 'text-cyan-300' : 'text-[#5B948C] group-hover:text-[#006B63]'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 4 Stat Cards Row with Staggered Motion and Micro-Interactions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-2.5 mt-2.5 sm:pt-3 sm:mt-3 border-t border-[#D0EBE5]/70 relative z-10">
            {/* Card 1: Days remaining */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -3, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => handleSubTabChange('planner')}
              className="group flex items-center gap-2 sm:gap-3 rounded-2xl p-2 sm:p-3 bg-white/75 backdrop-blur-md border border-white/85 hover:border-[#006B63]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,107,99,0.03)] hover:bg-white/90 hover:shadow-md transition-all min-w-0 cursor-pointer"
            >
              <div className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E3F5F1] text-[#006B63] group-hover:bg-[#CCF0E8] group-hover:text-[#005750] transition-all group-hover:scale-110 group-hover:rotate-[-4deg]">
                <Calendar className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006B63] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006B63]" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 group-hover:text-[#006B63] transition-colors shrink-0">
                    <AnimatedNumber value={daysRemaining} />
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-[#006B63] border border-teal-100/80 shrink-0">
                    Live
                  </span>
                </div>
                <span className="block text-[9.5px] sm:text-[11px] font-medium text-[#608882] group-hover:text-[#006B63] transition-colors leading-tight mt-0.5">
                  days to FMGE
                </span>
              </div>
            </motion.div>

            {/* Card 2: Target Score */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -3, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setIsPassingGapModalOpen(true)}
              className="group flex items-center gap-2 sm:gap-3 rounded-2xl p-2 sm:p-3 bg-white/75 backdrop-blur-md border border-white/85 hover:border-[#006B63]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,107,99,0.03)] hover:bg-white/90 hover:shadow-md transition-all min-w-0 cursor-pointer"
              title="Click to view 150/300 Passing Score Gap Analysis"
            >
              <div className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E3F5F1] text-[#006B63] group-hover:bg-[#CCF0E8] group-hover:text-[#005750] transition-all group-hover:scale-110">
                <Target className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 group-hover:text-[#006B63] transition-colors shrink-0">
                    {savedTargetScore ? `${savedTargetScore}+` : '200+'}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/80 shrink-0">
                    150 Pass
                  </span>
                </div>
                <span className="block text-[9.5px] sm:text-[11px] font-medium text-[#608882] group-hover:text-[#006B63] transition-colors leading-tight mt-0.5">
                  Target Score
                </span>
              </div>
            </motion.div>

            {/* Card 3: Subjects count */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -3, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => onNavigateTab('syllabus')}
              className="group flex items-center gap-2 sm:gap-3 rounded-2xl p-2 sm:p-3 bg-white/75 backdrop-blur-md border border-white/85 hover:border-[#006B63]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,107,99,0.03)] hover:bg-white/90 hover:shadow-md transition-all min-w-0 cursor-pointer"
            >
              <div className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E5F1FA] text-[#0A6EB4] group-hover:bg-[#D5EBF8] group-hover:text-[#08558D] transition-all group-hover:scale-110 group-hover:rotate-[4deg]">
                <BookOpen className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 group-hover:text-[#0A6EB4] transition-colors shrink-0">
                    19
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100/80 shrink-0">
                    NBE Core
                  </span>
                </div>
                <span className="block text-[9.5px] sm:text-[11px] font-medium text-[#608882] group-hover:text-[#006B63] transition-colors leading-tight mt-0.5">
                  Subjects
                </span>
              </div>
            </motion.div>

            {/* Card 4: Study Streak */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -3, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => onNavigateTab('progress')}
              className="group flex items-center gap-2 sm:gap-3 rounded-2xl p-2 sm:p-3 bg-white/75 backdrop-blur-md border border-white/85 hover:border-[#006B63]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,107,99,0.03)] hover:bg-white/90 hover:shadow-md transition-all min-w-0 cursor-pointer"
            >
              <div className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EFF8F6] text-[#006B63] group-hover:bg-[#CCF0E8] group-hover:text-[#005750] transition-all group-hover:scale-110">
                <Activity className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 group-hover:text-[#006B63] transition-colors shrink-0">
                    {currentStreak || 1}d
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
                <span className="block text-[9.5px] sm:text-[11px] font-medium text-[#608882] group-hover:text-[#006B63] transition-colors leading-tight mt-0.5">
                  Study Streak
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>


        {/* ═══ 2. SUBJECT FILTER PILLS BAR with Dynamic Auto-Hide ═══ */}
        <motion.div
          initial={false}
          animate={{
            y: isHeaderVisible || isAtTop || scrollY <= 260 ? 0 : -100,
            opacity: isHeaderVisible || isAtTop || scrollY <= 260 ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={`sticky top-[54px] sm:top-[58px] z-20 py-2 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200 ${
            scrollY > 260
              ? 'bg-white/85 backdrop-blur-2xl border-b border-slate-200/50 shadow-xs'
              : 'bg-transparent'
          } ${isHeaderVisible || isAtTop || scrollY <= 260 ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div className="relative flex items-center max-w-7xl mx-auto">
            <div
              ref={filterScrollRef}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none select-none snap-x w-full pr-2 sm:pr-10 [mask-image:linear-gradient(to_right,black_92%,transparent_100%)]"
            >
              {[{ id: 'all', name: 'All Subjects (19)' }, ...FMGE_SUBJECTS.map((s) => ({ id: s.id, name: s.name }))].map((f) => {
                const active = selectedFilterSubjectId === f.id;
                return (
                  <motion.button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilterSubjectId(f.id)}
                    whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                    aria-pressed={active}
                    className={`relative snap-start inline-flex items-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[34px] ${
                      active
                        ? 'text-white'
                        : 'text-slate-600 hover:text-[#006B63] bg-white/75 backdrop-blur-md border border-white/80 hover:border-teal-300 hover:bg-white/90 shadow-2xs'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="dashboard-subject-filter-pill"
                        transition={SPRING(reducedMotion)}
                        className="absolute inset-0 rounded-full bg-[#006B63] shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{f.name}</span>
                  </motion.button>
                );
              })}
            </div>
            {/* Scroll arrow on desktop */}
            <button
              type="button"
              onClick={scrollPillsRight}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 backdrop-blur-md border border-white/85 shadow-sm text-slate-500 hover:text-[#006B63] hover:border-teal-300 items-center justify-center cursor-pointer transition-colors"
              title="Scroll subjects right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* ═══ 3. HIGH-YIELD ACTION DOCK (5 FULL-WIDTH LAUNCHPAD PILLS) ═══ */}
        <motion.div
          initial={SECTION_ENTER(0.09, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3"
        >
          {/* Action 1: IBQ Visual Sprint */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsIbqModalOpen(true)}
            className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-white/95 to-slate-50/85 backdrop-blur-2xl border border-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:border-emerald-300 hover:shadow-[0_8px_20px_rgba(16,185,129,0.14)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100/80 border border-teal-200/60 text-[#006B63] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-108 group-hover:rotate-[-3deg] transition-all">
              <Stethoscope className="h-4 w-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-[13px] font-bold font-['Outfit'] text-slate-900 group-hover:text-[#006B63] transition-colors leading-tight">
                IBQ Sprint
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Visual &amp; ECG MCQs
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#006B63] group-hover:translate-x-0.5 transition-all shrink-0" />
          </motion.div>

          {/* Action 2: Repeat Vault (PYTs) */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsExamEveCheatSheetOpen(true)}
            className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-white/95 to-slate-50/85 backdrop-blur-2xl border border-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:border-violet-300 hover:shadow-[0_8px_20px_rgba(139,92,246,0.14)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-violet-50 to-purple-100/80 border border-violet-200/60 text-violet-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-108 group-hover:rotate-[-3deg] transition-all">
              <Pill className="h-4 w-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-[13px] font-bold font-['Outfit'] text-slate-900 group-hover:text-violet-700 transition-colors leading-tight">
                Repeat Vault
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                DOCs &amp; Triads
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </motion.div>

          {/* Action 3: Hands-Free Audio Recall Commute */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => onOpenAudioRecall?.()}
            className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-white/95 to-slate-50/85 backdrop-blur-2xl border border-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:border-teal-300 hover:shadow-[0_8px_20px_rgba(20,184,166,0.14)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100/80 border border-teal-200/60 text-[#006B63] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-108 group-hover:rotate-[-3deg] transition-all">
              <Headphones className="h-4 w-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-[13px] font-bold font-['Outfit'] text-slate-900 group-hover:text-[#006B63] transition-colors leading-tight">
                  Audio Recall
                </h4>
                <span className="px-1.5 py-0.2 rounded-full bg-teal-500/15 text-[8.5px] font-mono font-bold text-teal-800 border border-teal-300/40 shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Hospital Commute
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#006B63] group-hover:translate-x-0.5 transition-all shrink-0" />
          </motion.div>

          {/* Action 4: Retest Mistakes */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleLaunchErrorDrill}
            className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-white/95 to-slate-50/85 backdrop-blur-2xl border border-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:border-amber-300 hover:shadow-[0_8px_20px_rgba(245,158,11,0.14)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100/80 border border-amber-200/60 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-108 group-hover:rotate-[-3deg] transition-all">
              <RotateCcw className="h-4 w-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-[13px] font-bold font-['Outfit'] text-slate-900 group-hover:text-amber-700 transition-colors leading-tight">
                Retest Errors
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                {unreviewedErrorsCount > 0 ? `${unreviewedErrorsCount} due mistakes` : 'Vault mastered'}
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </motion.div>

          {/* Action 5: NBE Simulator */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.015 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsNbeMockOpen(true)}
            className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-white/95 to-slate-50/85 backdrop-blur-2xl border border-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_2px_rgba(255,255,255,1)] hover:border-sky-300 hover:shadow-[0_8px_20px_rgba(14,165,233,0.14)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-100/80 border border-sky-200/60 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-108 group-hover:rotate-[-3deg] transition-all">
              <Award className="h-4 w-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-[13px] font-bold font-['Outfit'] text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
                NBE Simulator
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Official TCS iON Mock
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </motion.div>
        </motion.div>

        {/* ═══ 4. TWO-COLUMN DESKTOP LAYOUT (LEFT & RIGHT) ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6 items-start">

          {/* ══════════════ LEFT COLUMN (xl:col-span-7) ══════════════ */}
          <div className="xl:col-span-7 space-y-5">

            {/* ── TODAY'S FOCUS HERO CARD (MATCHING REFERENCE DESIGN - SIDE COLUMN) ── */}
            <motion.section
              key={`hero-focus-card-${activeFocusSubject.id}`}
              initial={SECTION_ENTER(0.08, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              style={cardGradientStyle}
              className={`rounded-3xl border border-white/80 bg-gradient-to-br ${focusTheme.cardGradient || 'from-[#F4FAF8] via-[#FBFCFC] to-[#EFF8F5]'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_10px_36px_rgba(0,107,99,0.06)] backdrop-blur-xl overflow-hidden transition-all duration-500 relative`}
            >
              {/* ══ TOP COMPARTMENT ══ */}
              <div className="p-4 sm:p-5 lg:p-6 relative z-10">
                {/* Top Right Motivational Quote: Master concepts. Score higher. */}
                <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-right select-none pointer-events-none z-20 hidden sm:block">
                  <p className="text-[11px] font-medium text-slate-500 leading-snug">
                    Master<br />
                    concepts.<br />
                    <span className="text-slate-800 font-bold">Score higher.</span>
                  </p>
                  <div className="w-5 h-0.5 bg-slate-300 ml-auto mt-1 rounded-full" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 lg:gap-5">
                  
                  {/* Left Column: Eyebrow pills, two-tone title, subtopics, meta chips, and CTA buttons */}
                  <div className="flex-1 space-y-2.5 sm:space-y-3 min-w-0">
                    
                    {/* Eyebrow Pills: [🎯 TODAY'S FOCUS] and Dynamic Subject Pill */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold font-mono tracking-wider bg-white/80 backdrop-blur-md text-slate-700 border border-white/90 shadow-2xs">
                        <Target className="w-3 h-3" style={{ color: focusTheme.ecgStrokeStart }} />
                        <span>TODAY&apos;S FOCUS</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold font-mono tracking-wider uppercase border shadow-2xs backdrop-blur-md ${focusTheme.badge}`}>
                        {activeFocusSubject.name.toUpperCase()}
                      </span>
                    </div>

                    {/* Topic Title with Two-Tone Bold Hierarchy & Subtopics */}
                    <div>
                      <h2 className="font-['Outfit'] text-xl sm:text-2xl lg:text-[25px] font-extrabold tracking-tight leading-[1.15] text-slate-900 break-normal flex flex-wrap items-baseline gap-x-1.5">
                        <span className="whitespace-normal">{topicTitlePrimary}</span>
                        <span className="whitespace-normal" style={{ color: focusTheme.ecgStrokeStart }}>{topicTitleHighlight || activeFocusTopic.name}</span>
                      </h2>

                      {/* Sub-bullet highlights: STEMI • Arrhythmias • Heart Blocks • WPW */}
                      {topicSubtitleItems.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs font-medium text-slate-500 tracking-wide mt-1">
                          {topicSubtitleItems.map((item, idx) => (
                            <React.Fragment key={item}>
                              <span>{item}</span>
                              {idx < topicSubtitleItems.length - 1 && (
                                <span className="text-slate-300 font-bold">•</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 4 Clean Rounded Meta Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/80 backdrop-blur-md text-slate-700 border border-white/85 shadow-2xs">
                        <BookOpen className="h-3 w-3 text-slate-500" />
                        <span className="font-semibold">{focusMarks} marks</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/80 backdrop-blur-md text-slate-700 border border-white/85 shadow-2xs">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="font-semibold">{focusMinutes} min</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/80 backdrop-blur-md text-slate-700 border border-white/85 shadow-2xs">
                        <Layers className="h-3 w-3 text-slate-500" />
                        <span className="font-semibold">Clinical MCQ</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FFF2F2]/90 backdrop-blur-md text-[#E11D48] border border-rose-200/80 shadow-2xs">
                        <Flame className="h-3 w-3 fill-[#E11D48] text-[#E11D48]" />
                        <span>High-yield</span>
                      </div>
                    </div>

                    {/* Action Buttons: [Start Session →] and [View Topic Overview] */}
                    <div className="flex items-center gap-2.5 sm:gap-3 pt-1.5 flex-wrap">
                      <motion.button
                        type="button"
                        onClick={startFocusSession}
                        whileHover={{ scale: 1.025, y: -1, boxShadow: `0 8px 18px -2px ${focusTheme.glow}` }}
                        whileTap={{ scale: 0.975 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all cursor-pointer min-h-[40px] ${focusTheme.primaryBtnBg} ${focusTheme.primaryBtnHover} ${focusTheme.primaryBtnShadow}`}
                      >
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                        <span>Start Session</span>
                        <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => onSelectSubject(activeFocusSubject.id)}
                        className="group inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="View full topic breakdown in Syllabus"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-md border border-white/90 flex items-center justify-center text-slate-500 group-hover:border-slate-300 group-hover:text-slate-900 group-hover:bg-white transition-all shadow-2xs">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left leading-tight">
                          <span className="block text-[11px] font-semibold text-slate-700 group-hover:text-slate-900">
                            View Topic
                          </span>
                          <span className="block text-[9.5px] text-slate-400">
                            Overview
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                    {/* Right Column: 3D Anatomical Organ Stage with Bio-Pulse Coupled ECG & Telemetry */}
                  <div className="relative w-full sm:w-[280px] md:w-[300px] lg:w-[320px] h-[200px] sm:h-[220px] shrink-0 flex items-center justify-center">
                    
                    {/* Integrated Bioluminescent Halo directly wrapping behind the organ */}
                    <div
                      className="absolute w-[170px] h-[170px] pointer-events-none select-none rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${focusTheme.haloStart}44 0%, ${focusTheme.haloMid}22 50%, transparent 72%)`,
                        filter: 'blur(22px)',
                      }}
                    />

                    {/* Grounding Soft Ambient Occlusion Contact Shadow under the 3D organ (eliminates floating cutout look) */}
                    <div
                      className="absolute bottom-[18px] w-[130px] h-[20px] pointer-events-none select-none rounded-full"
                      style={{
                        background: `radial-gradient(ellipse at center, ${focusTheme.ecgStrokeStart}40 0%, ${focusTheme.haloMid}18 50%, transparent 75%)`,
                        filter: 'blur(7px)',
                      }}
                    />

                    {/* Ambient ECG Rhythm Waveform and Telemetry Markers - Ported from High-Quality Sidebar */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible" shapeRendering="geometricPrecision">
                        <defs>
                          <linearGradient id={`ecgGrad-${activeFocusSubject.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#006B63" stopOpacity="0.25" />
                            <stop offset="25%" stopColor={focusTheme.ecgStrokeStart || '#006B63'} stopOpacity="0.85" />
                            <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
                            <stop offset="75%" stopColor={focusTheme.ecgStrokeStart || '#006B63'} stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#006B63" stopOpacity="0.20" />
                          </linearGradient>
                        </defs>

                        {/* RAZOR-SHARP HIGH-DEFINITION FOREGROUND VECTOR STROKE (matching sidebar 2.2px strokeWidth + drop-shadow-xs) */}
                        {/* Inflow trace entering heart conduction system */}
                        <path
                          d="M 0 110 L 32 110 C 36 110, 38 104, 41 104 C 44 104, 46 110, 50 110 L 56 110 L 60 116 L 68 44 L 76 164 L 82 110 C 86 110, 89 101, 93 101 C 97 101, 99 110, 102 110 C 114 110, 120 116, 130 120"
                          stroke={`url(#ecgGrad-${activeFocusSubject.id})`}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-xs"
                          fill="none"
                        />
                        {/* Outflow trace emerging from organ */}
                        <path
                          d="M 190 102 C 198 106, 204 110, 214 110 L 218 110 L 222 116 L 230 42 L 238 166 L 244 110 C 248 110, 252 98, 256 98 C 260 98, 262 110, 266 110 L 270 110 L 273 115 L 277 78 L 281 138 L 284 110 L 320 110"
                          stroke={`url(#ecgGrad-${activeFocusSubject.id})`}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-xs"
                          fill="none"
                        />

                        {/* Animated Sweeping Pulse Beam over the ECG Path (Sidebar signature feature) */}
                        {!reducedMotion && (
                          <>
                            <motion.path
                              d="M 0 110 L 32 110 C 36 110, 38 104, 41 104 C 44 104, 46 110, 50 110 L 56 110 L 60 116 L 68 44 L 76 164 L 82 110 C 86 110, 89 101, 93 101 C 97 101, 99 110, 102 110 C 114 110, 120 116, 130 120"
                              stroke="#FDE68A"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              fill="none"
                              strokeDasharray="24 160"
                              animate={{ strokeDashoffset: [180, -180] }}
                              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
                            />
                            <motion.path
                              d="M 190 102 C 198 106, 204 110, 214 110 L 218 110 L 222 116 L 230 42 L 238 166 L 244 110 C 248 110, 252 98, 256 98 C 260 98, 262 110, 266 110 L 270 110 L 273 115 L 277 78 L 281 138 L 284 110 L 320 110"
                              stroke="#FDE68A"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              fill="none"
                              strokeDasharray="24 160"
                              animate={{ strokeDashoffset: [180, -180] }}
                              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.8, delay: 0.4 }}
                            />
                          </>
                        )}



                        {/* Luminous Glowing Dot Traveling Continuously from Start to End */}
                        {!reducedMotion && (
                          <motion.g
                            animate={{
                              x: [0, 32, 41, 50, 56, 60, 68, 76, 82, 93, 102, 130, 190, 214, 218, 222, 230, 238, 244, 256, 266, 270, 273, 277, 281, 284, 320],
                              y: [110, 110, 104, 110, 110, 116, 44, 164, 110, 101, 110, 120, 102, 110, 110, 116, 42, 166, 110, 98, 110, 110, 115, 78, 138, 110, 110],
                              opacity: [0, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.25, 0.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                            }}
                            transition={{
                              duration: 3.2,
                              times: [0, 0.0345, 0.0461, 0.0578, 0.0642, 0.072, 0.15, 0.2795, 0.338, 0.3533, 0.367, 0.399, 0.4665, 0.4937, 0.498, 0.5058, 0.5859, 0.7198, 0.7804, 0.7987, 0.8155, 0.8198, 0.8261, 0.8662, 0.9309, 0.9612, 1],
                              repeat: Infinity,
                              ease: 'linear',
                              repeatDelay: 0.5,
                            }}
                          >
                            {/* Outer ambient glow */}
                            <circle r="7" fill="#F59E0B" fillOpacity="0.35" />
                            {/* Inner bright flare */}
                            <circle r="3.5" fill="#FDE68A" />
                            {/* Center pure white core */}
                            <circle r="1.8" fill="#FFFFFF" />
                          </motion.g>
                        )}
                      </svg>
                    </div>

                    {/* 3D Anatomical Visual Centered Harmoniously on the Exact Origin (160, 110) */}
                    <motion.div
                      animate={
                        reducedMotion
                          ? undefined
                          : {
                              scale: [1, 1.025, 0.99, 1.015, 1],
                            }
                      }
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                      className="relative w-full h-full flex items-center justify-center z-10 select-none cursor-pointer"
                    >
                      <MedicalHeroVisual
                        subjectId={activeFocusSubject.id}
                        subjectName={activeFocusSubject.name}
                        subjectColor={activeFocusSubject.color}
                        topicId={activeFocusTopic.id}
                        topicName={activeFocusTopic.name}
                        className="w-full h-full max-h-[175px]"
                        hideInternalBackdrop={true}
                      />
                    </motion.div>

                    {/* Floating Heart Rate / Telemetry Widget at bottom right */}
                    <motion.div
                      key={`telemetry-card-${activeFocusSubject.id}`}
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={
                        reducedMotion
                          ? { opacity: 1, y: 0, scale: 1 }
                          : { opacity: 1, y: [0, -2, 0], scale: 1 }
                      }
                      transition={
                        reducedMotion
                          ? { duration: 0.35 }
                          : { y: { repeat: Infinity, duration: 3.8, ease: 'easeInOut' }, duration: 0.35 }
                      }
                      className="absolute -bottom-1 sm:bottom-0 right-1 sm:right-2 z-30 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,107,99,0.06)] select-none"
                    >
                      <Heart className="w-4 h-4 shrink-0" style={{ color: focusTheme.ecgStrokeStart, fill: focusTheme.ecgStrokeStart }} />
                      <div className="leading-tight">
                        <div className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight font-['Outfit']">
                          {currentTelemetry.label.split('·')[0].trim()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {currentTelemetry.label.split('·')[1]?.trim() || 'Sinus Rhythm'}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* ══ BOTTOM COMPARTMENT: STATUS & INTEGRATED 3-STEP SPRINT PROTOCOL ══ */}
              <div className="border-t border-white/80 bg-white/70 backdrop-blur-xl p-3.5 sm:p-5 space-y-3.5">
                {/* Status Bar & Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                  {/* Circular Completion Gauge & Status Description */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-full border-[2.5px] border-white/90 flex items-center justify-center shrink-0 bg-white/80 backdrop-blur-md shadow-2xs">
                      {topicProgressPercent > 0 && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            fill="none"
                            stroke={focusTheme.ecgStrokeStart}
                            strokeWidth="4"
                            strokeDasharray={119.38}
                            strokeDashoffset={119.38 - (119.38 * topicProgressPercent) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <span className="text-[9.5px] font-bold font-mono text-slate-800">
                        {topicProgressPercent}%
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {topicStatusLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">•</span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          NBE Blueprint Core
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[280px] sm:max-w-md">
                        {topicSubtext}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Launch Review Shortcut */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('revision')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" style={{ color: focusTheme.ecgStrokeStart }} />
                      <span>Review Deck</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('practice')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/85 backdrop-blur-md text-slate-800 border border-white/90 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>MCQs (25)</span>
                    </button>
                  </div>
                </div>

                {/* Integrated 3 Daily Calibrated Milestones */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-['Outfit'] bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 text-slate-800 border border-amber-500/25 shadow-2xs backdrop-blur-xs">
                        <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                        <span>{sprintPhase.headline}</span>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span>3 Daily Actions</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {/* Target 1: Subject High-Yield Anchor */}
                    <motion.div
                      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.012 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      className="flex flex-col justify-between p-3.5 rounded-2xl bg-gradient-to-b from-teal-500/[0.08] via-emerald-500/[0.03] to-white/95 backdrop-blur-xl border border-teal-200/70 hover:border-teal-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_4px_16px_rgba(0,107,99,0.04)] hover:shadow-[0_12px_28px_rgba(0,107,99,0.10)] transition-all group relative overflow-hidden"
                    >
                      {/* Top Specular Hairline */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

                      <div>
                        {/* Header Row: Specialty Insignia & Weightage Pill */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/10 border border-teal-200/60 text-[#006B63] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            </div>
                            <span className="text-[9.5px] font-bold font-mono tracking-wider text-[#006B63] uppercase whitespace-nowrap shrink-0">
                              {sprintPhase.anchorLabel}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-teal-500/10 text-[#006B63] border border-teal-200/70 shrink-0 shadow-2xs">
                            ~{focusMarks}M
                          </span>
                        </div>

                        {/* Title & Clinical Subtitle */}
                        <div className="mt-2.5">
                          <h4 className="text-[13px] sm:text-[14px] font-bold font-['Outfit'] text-slate-900 group-hover:text-[#006B63] transition-colors leading-snug">
                            Study Notes &amp; Patterns
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            Signs, criteria &amp; 1st-line drugs
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMasteryTopic({
                            subjectId: activeFocusSubject.id,
                            topicId: activeFocusTopic.id,
                            topicName: activeFocusTopic.name,
                          })
                        }
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 text-white hover:bg-[#006B63] text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn relative overflow-hidden"
                      >
                        <span>Study Concepts</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                      </button>
                    </motion.div>

                    {/* Target 2: Clinical MCQ Speed Drill */}
                    <motion.div
                      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.012 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      className="flex flex-col justify-between p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/[0.08] via-orange-500/[0.03] to-white/95 backdrop-blur-xl border border-amber-200/70 hover:border-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_4px_16px_rgba(245,158,11,0.05)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.12)] transition-all group relative overflow-hidden"
                    >
                      {/* Top Specular Hairline */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

                      <div>
                        {/* Header Row: Specialty Insignia & Speed Tag */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-200/60 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            </div>
                            <span className="text-[9.5px] font-bold font-mono tracking-wider text-amber-800 uppercase whitespace-nowrap shrink-0">
                              {sprintPhase.drillLabel}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-amber-500/10 text-amber-800 border border-amber-200/70 shrink-0 shadow-2xs">
                            60s / Q
                          </span>
                        </div>

                        {/* Title & Clinical Subtitle */}
                        <div className="mt-2.5">
                          <h4 className="text-[13px] sm:text-[14px] font-bold font-['Outfit'] text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                            10 Timed Vignettes
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            Reflex speed &amp; pattern locks
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onLaunchPracticeSession?.(
                            activeFocusSubject.id,
                            activeFocusTopic.id,
                            activeFocusTopic.name
                          )
                        }
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn relative overflow-hidden"
                      >
                        <span>Start 10 MCQs</span>
                        <Play className="h-3 w-3 fill-slate-950 group-hover/btn:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                      </button>
                    </motion.div>

                    {/* Target 3: Error Shield & Re-test */}
                    <motion.div
                      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.012 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      className="flex flex-col justify-between p-3.5 rounded-2xl bg-gradient-to-b from-rose-500/[0.07] via-red-500/[0.03] to-white/95 backdrop-blur-xl border border-rose-200/70 hover:border-rose-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_4px_16px_rgba(244,63,94,0.04)] hover:shadow-[0_12px_28px_rgba(244,63,94,0.10)] transition-all group relative overflow-hidden"
                    >
                      {/* Top Specular Hairline */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

                      <div>
                        {/* Header Row: Specialty Insignia & Due Count */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 border border-rose-200/60 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            </div>
                            <span className="text-[9.5px] font-bold font-mono tracking-wider text-rose-800 uppercase whitespace-nowrap shrink-0">
                              {sprintPhase.shieldLabel}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold shrink-0 shadow-2xs ${
                              unreviewedErrorsCount > 0
                                ? 'bg-rose-500/15 text-rose-800 border border-rose-300'
                                : 'bg-rose-500/10 text-rose-700 border border-rose-200/70'
                            }`}
                          >
                            {unreviewedErrorsCount} Due
                          </span>
                        </div>

                        {/* Title & Clinical Subtitle */}
                        <div className="mt-2.5">
                          <h4 className="text-[13px] sm:text-[14px] font-bold font-['Outfit'] text-slate-900 group-hover:text-rose-700 transition-colors leading-snug">
                            {unreviewedErrorsCount > 0 ? `${unreviewedErrorsCount} Blunders Pending` : 'Vault Mastered'}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {unreviewedErrorsCount > 0 ? 'Retest to prevent lost marks' : 'Zero unreviewed blunders'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={handleLaunchErrorDrill}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 text-white hover:bg-rose-600 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn relative overflow-hidden"
                      >
                        <span>{unreviewedErrorsCount > 0 ? 'Retest Mistakes' : 'Inspect Vault'}</span>
                        <RotateCcw className="h-3.5 w-3.5 group-hover/btn:rotate-[-45deg] transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={SECTION_ENTER(0.12, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="space-y-3"
            >
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63] shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">Today&apos;s Plan</h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {dailyPlan.tasks.length} targeted task{dailyPlan.tasks.length !== 1 ? 's' : ''} based on your study profile
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-start xs:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('planner')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#006B63] hover:text-[#005750] bg-teal-50/80 hover:bg-teal-100/70 border border-teal-200/60 hover:border-teal-300 transition-colors cursor-pointer min-h-[32px]"
                  >
                    <span>Planner</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Task Cards List with Inner Motion & Hover Animations */}
              <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_30px_rgba(0,107,99,0.04)] divide-y divide-slate-100/70 overflow-hidden">
                {(todayPlanTasks.length > 0 ? todayPlanTasks : dailyPlan.tasks.slice(1, 4)).map((task, index) => (
                  <motion.div
                    key={task.id}
                    whileHover={reducedMotion ? undefined : { y: -2, scale: 1.006 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-teal-50/40 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Status Check / Play Icon with Micro-Bounce on Hover */}
                      <div
                        className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-5deg] ${
                          index === 0
                            ? 'bg-rose-50/90 border border-rose-100 text-rose-500'
                            : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-[#006B63] group-hover:bg-teal-50'
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>

                      {/* Task Info with extra mobile breathing room and 2-line wrapping */}
                      <div className="space-y-0.5 min-w-0 flex-1 pr-1 sm:pr-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                              index === 0 ? 'text-rose-600' : 'text-slate-600'
                            }`}
                          >
                            {task.subjectName.toUpperCase()}
                          </span>
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-teal-50 text-[#006B63] border border-teal-100 group-hover:border-teal-300 transition-colors">
                            MCQ drill
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#006B63] transition-colors line-clamp-2 leading-snug break-words">
                          {task.topicName}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-md">
                          {task.reason}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Duration + Start Button + Menu */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-center sm:self-auto">
                      <div className="hidden xs:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="h-3 w-3" />
                        <span>{task.durationMinutes} min</span>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task.activity === 'learn' || task.activity === 'mcqs') {
                            onLaunchPracticeSession?.(task.subjectId, task.topicId, task.topicName);
                          } else {
                            onNavigateTab(task.activity === 'revision' ? 'revision' : 'practice');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#006B63] hover:bg-[#00524B] text-white shadow-2xs transition-colors cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Start</span>
                      </motion.button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask?.(task.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSubTabChange('planner')}
                className="w-full text-center text-xs font-semibold text-[#006B63] hover:text-[#005750] hover:underline py-1 transition-colors cursor-pointer"
              >
                Open full plan →
              </button>
            </motion.section>
          </div>

          {/* ══════════════ RIGHT COLUMN (xl:col-span-5) ══════════════ */}
          <div className="xl:col-span-5 space-y-4">

            {/* ── YOUR EXAM JOURNEY (Teal/Mint Identity) ── */}
            <motion.section
              initial={SECTION_ENTER(0.1, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white/75 backdrop-blur-xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_30px_rgba(0,107,99,0.04)] p-4 sm:p-5 space-y-3.5 relative overflow-hidden"
            >
              {/* Subtle Target / Radar Watermark Graphic in Background */}
              <div className="absolute -top-3 right-3 w-36 h-36 pointer-events-none select-none opacity-[0.07] overflow-hidden" aria-hidden="true">
                <svg viewBox="0 0 140 140" fill="none" className="w-full h-full stroke-[#006B63]">
                  <circle cx="70" cy="70" r="62" strokeWidth="1" />
                  <circle cx="70" cy="70" r="45" strokeWidth="1" />
                  <circle cx="70" cy="70" r="28" strokeWidth="1" />
                  <circle cx="70" cy="70" r="10" strokeWidth="1" />
                  <line x1="70" y1="4" x2="70" y2="136" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="4" y1="70" x2="136" y2="70" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#E3F5F1] flex items-center justify-center text-[#006B63]">
                    <Compass className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0E322D]">Your Exam Journey</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPassingGapModalOpen(true)}
                    className="text-[11px] font-bold text-[#006B63] hover:text-[#005750] bg-teal-50 hover:bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200/60 cursor-pointer flex items-center gap-1 transition-colors"
                    title="Open 150/300 Passing Score Gap Analyzer"
                  >
                    <span>150 Cutoff</span>
                    <span className="text-[9px]">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('progress')}
                    className="text-xs font-semibold text-slate-500 hover:text-[#006B63] hover:underline cursor-pointer flex items-center transition-colors"
                  >
                    Details →
                  </button>
                </div>
              </div>

              {/* Circular Gauge + Stats Block */}
              <div className="flex items-center justify-between gap-3 sm:gap-4 pt-1 relative z-10">
                {/* Circular Gauge */}
                <CircularCountdown
                  value={projectedScore}
                  label="EST. SCORE"
                  sublabel="150 Pass"
                  progressRatio={Math.min(1, Math.max(0.2, (projectedScore - 100) / 150))}
                  reducedMotion={reducedMotion}
                />

                {/* Right Stat Items */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Target score */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-[#006B63]" />
                      <span className="text-xs text-slate-500 font-medium">Target Score</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-['Outfit']">
                      {savedTargetScore ? `${savedTargetScore}+` : '200+'}
                    </span>
                  </div>

                  {/* Cutoff / Pass mark */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs text-slate-500 font-medium">NBE Pass Cutoff</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 font-['Outfit']">
                      150 / 300
                    </span>
                  </div>

                  {/* Days remaining */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs text-slate-500 font-medium">Exam Countdown</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-['Outfit']">
                      {daysRemaining} Days Left
                    </span>
                  </div>

                  {/* Syllabus Coverage */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Syllabus Coverage</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {stats?.notesPercentage ? `${stats.notesPercentage}%` : '~ 16%'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#E5F3F0] rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-full bg-[#00897B] rounded-full relative overflow-hidden"
                        initial={reducedMotion ? false : { width: 0 }}
                        whileInView={{ width: `${Math.max(stats?.notesPercentage || 16, 5)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {!reducedMotion && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Box */}
              <motion.div
                whileHover={reducedMotion ? {} : { y: -2, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="rounded-2xl bg-[#EFF8F6]/80 backdrop-blur-md border border-white/80 p-2.5 px-3 flex items-center gap-2.5 mt-2 relative z-10 hover:border-[#006B63]/30 transition-colors shadow-2xs cursor-default"
              >
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Quote className="h-3.5 w-3.5 text-emerald-700" />
                </div>
                <p className="text-xs font-medium text-[#245C54] italic leading-tight">
                  &ldquo;A little progress each day adds up to big results.&rdquo;
                </p>
              </motion.div>
            </motion.section>

            {/* ── YOUR STUDY STREAK ── */}
            <motion.section
              initial={SECTION_ENTER(0.14, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white/75 backdrop-blur-xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_30px_rgba(0,107,99,0.04)] p-4 sm:p-5 space-y-3.5 relative overflow-hidden"
            >
              {/* Faint ECG / Flowing rhythm wave near bottom edge */}
              <div className="absolute bottom-1 right-2 w-48 h-6 pointer-events-none select-none opacity-[0.08] overflow-hidden" aria-hidden="true">
                <svg viewBox="0 0 190 24" fill="none" className="w-full h-full stroke-[#006B63]">
                  <path
                    d="M0 12 L55 12 L61 6 L67 18 L73 2 L79 22 L85 12 L95 12 L101 8 L107 12 L190 12"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#E07018] relative">
                    <motion.div
                      animate={reducedMotion ? {} : { scale: [1, 1.15, 1], rotate: [-3, 3, -3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Flame className="h-4 w-4 fill-[#E07018]" />
                    </motion.div>
                  </div>
                  <h3 className="text-sm font-bold text-[#0E322D]">Your Study Streak</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('planner')}
                  className="text-xs font-semibold text-[#006B63] hover:text-[#005750] hover:underline cursor-pointer flex items-center"
                >
                  View calendar →
                </button>
              </div>

              {/* 7 Days Row */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center relative z-10">
                {weekDays.map(({ dayName, dateNum, isCompleted, isToday }) => (
                  <div key={dayName} className="flex flex-col items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#719690]">
                      {dayName}
                    </span>
                    <motion.div
                      whileHover={reducedMotion ? {} : { scale: 1.18, y: -2 }}
                      whileTap={reducedMotion ? {} : { scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer select-none transition-all ${
                        isToday
                          ? 'bg-[#00897B] text-white ring-2 ring-[#E07018] ring-offset-2 font-black shadow-xs'
                          : isCompleted
                          ? 'bg-[#00897B] text-white font-bold shadow-2xs hover:bg-[#00796B]'
                          : 'text-slate-600 font-medium hover:bg-[#E5F3F0]/60'
                      }`}
                    >
                      {isToday && !reducedMotion && (
                        <motion.span
                          className="absolute -inset-1 rounded-full border-2 border-[#E07018]/50 pointer-events-none"
                          animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      {dateNum}
                    </motion.div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 pt-1 text-xs text-[#608B85] relative z-10">
                <Calendar className="h-3.5 w-3.5 text-[#5C948B] shrink-0" />
                <span>Consistency compounds into confidence.</span>
              </div>
            </motion.section>

            {/* ── YOUR PROGRESS (Dynamic Subject Bars with Contextual Accents) ── */}
            <motion.section
              initial={SECTION_ENTER(0.18, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white/75 backdrop-blur-xl border border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_30px_rgba(0,107,99,0.04)] hover:shadow-md p-4 sm:p-5 space-y-3.5 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63]">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Your Progress</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="text-xs font-semibold text-[#006B63] hover:text-[#005750] hover:underline cursor-pointer min-h-[32px] flex items-center"
                >
                  View curriculum →
                </button>
              </div>

              {/* Subject Rows */}
              <div className="space-y-2.5 sm:space-y-3">
                {subjectList.slice(0, 5).map((sub, idx) => {
                  const visual = getContextualProgressStyle(sub.percentage, sub.statusText);
                  const studyTimeApprox = sub.weightage ? `~${Math.max(1, Math.round(sub.weightage * 1.5))}h` : '~2h';

                  return (
                    <motion.div
                      key={sub.id}
                      whileHover={reducedMotion ? {} : { x: 4, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      onClick={() => onSelectSubject(sub.id)}
                      className="group p-2 sm:p-2.5 rounded-2xl hover:bg-white/80 transition-colors cursor-pointer space-y-1.5 border border-transparent hover:border-slate-200/60"
                    >
                      <div className="flex items-center justify-between text-xs gap-1.5">
                        <span className="font-bold text-slate-900 group-hover:text-[#006B63] transition-colors truncate">
                          {sub.name}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <span className="font-mono font-extrabold text-slate-900 tabular-nums">
                            <AnimatedNumber value={sub.percentage} />%
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {studyTimeApprox} • {sub.weightage} Marks
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${visual.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${visual.dot} animate-pulse`} />
                            {visual.statusText}
                          </span>
                        </div>
                      </div>

                      {/* Smooth Animated Progress Bar */}
                      <div className={`w-full h-2 sm:h-2.5 ${visual.track || 'bg-slate-100'} rounded-full overflow-hidden relative`}>
                        <motion.div
                          className={`h-full rounded-full ${visual.bar} relative overflow-hidden`}
                          initial={reducedMotion ? false : { width: 0 }}
                          whileInView={{ width: `${Math.max(sub.percentage, 4)}%` }}
                          viewport={{ once: true }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { duration: 0.75, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }
                          }
                        >
                          {!reducedMotion && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent w-full"
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2, repeatDelay: 1.5 }}
                            />
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* View all subjects action */}
              <div className="pt-2 border-t border-slate-100/80">
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="w-full text-center text-xs font-semibold text-[#006B63] hover:text-[#005750] hover:underline py-1 transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                >
                  View all subjects →
                </button>
              </div>
            </motion.section>

            {/* ── DAILY HIGH-YIELD RECALL / UP NEXT (BALANCED IN RIGHT COLUMN) ── */}
            <motion.section
              initial={SECTION_ENTER(0.16, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border border-teal-200/60 flex items-center justify-center text-[#006B63] shadow-2xs">
                  <Compass className="h-4 w-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  {hasRevisionDue || errorsToReview ? 'Up Next' : 'Daily High-Yield Recall'}
                </h3>
              </div>

              {hasRevisionDue || errorsToReview ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Card 1: Revision */}
                  <motion.div
                    whileHover={reducedMotion ? undefined : { y: -3, scale: 1.015 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => onNavigateTab('revision')}
                    className="relative rounded-3xl bg-gradient-to-b from-emerald-500/[0.08] via-teal-500/[0.03] to-white/95 backdrop-blur-xl border border-emerald-200/70 hover:border-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_20px_rgba(16,185,129,0.04)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.12)] p-3 sm:p-3.5 flex items-center justify-between gap-2.5 transition-all duration-300 cursor-pointer group min-h-[64px] overflow-hidden"
                  >
                    {/* Top Specular Hairline */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300">
                        <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs sm:text-sm font-bold font-['Outfit'] text-slate-900 group-hover:text-emerald-700 transition-colors">
                          Revision
                        </span>
                        <span className="block text-[11px] sm:text-xs font-semibold text-emerald-800 mt-0.5">
                          {dailyPlan.revisionDueCount} items due
                        </span>
                      </div>
                    </div>
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                  </motion.div>

                  {/* Card 2: Error Remediation */}
                  <motion.div
                    whileHover={reducedMotion ? undefined : { y: -3, scale: 1.015 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => onNavigateTab('errors')}
                    className="relative rounded-3xl bg-gradient-to-b from-amber-500/[0.08] via-orange-500/[0.03] to-white/95 backdrop-blur-xl border border-amber-200/70 hover:border-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_20px_rgba(245,158,11,0.05)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.12)] p-3 sm:p-3.5 flex items-center justify-between gap-2.5 transition-all duration-300 cursor-pointer group min-h-[64px] overflow-hidden"
                  >
                    {/* Top Specular Hairline */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                        <RotateCcw className="h-4.5 w-4.5 sm:h-5 sm:w-5 group-hover:rotate-[-45deg] transition-transform duration-300 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs sm:text-sm font-bold font-['Outfit'] text-slate-900 group-hover:text-amber-800 transition-colors">
                          Error Remediation
                        </span>
                        <span className="block text-[11px] sm:text-xs font-semibold text-amber-800 mt-0.5">
                          {dailyPlan.errorRemediationCount} errors to review
                        </span>
                      </div>
                    </div>
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                  </motion.div>
                </div>
              ) : (
                /* Daily High-Yield Recall Pearl (Interactive Reveal) */
                <motion.div
                  whileHover={reducedMotion ? undefined : { y: -3, scale: 1.008 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                  className="rounded-3xl bg-gradient-to-br from-amber-500/[0.08] via-amber-100/[0.12] to-teal-500/[0.04] backdrop-blur-2xl border border-amber-200/70 hover:border-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_24px_rgba(245,158,11,0.06)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)] p-4 sm:p-5 relative overflow-hidden transition-all duration-300 group"
                >
                  {/* Top Specular Hairline */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent pointer-events-none" />

                  {/* Header Row: Lightbulb with Halo & Shuffle/Vault Actions */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-200/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-300/70 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <div className="absolute inset-0 bg-amber-400/20 rounded-2xl filter blur-xs animate-pulse" />
                        <Lightbulb className="h-4 w-4 relative z-10 stroke-[2.3]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-amber-800 uppercase block">
                          HIGH-YIELD RECALL PEARL
                        </span>
                        <h4 className="text-xs sm:text-[14px] font-bold font-['Outfit'] text-slate-900 leading-tight">
                          {todayPearl?.name || "Beck's Triad"}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPearlRevealed(false);
                          setDailyPearlIndex((p) => p + 1);
                        }}
                        className="h-7 w-7 rounded-xl bg-white/80 hover:bg-amber-100/80 text-amber-800 border border-amber-200/70 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 group/shuffle"
                        title="Next Recall Pearl"
                      >
                        <RotateCcw className="h-3.5 w-3.5 group-hover/shuffle:rotate-[-60deg] transition-transform duration-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExamEveCheatSheetOpen(true)}
                        className="text-[11px] font-bold text-[#006B63] hover:text-[#005750] bg-teal-500/10 hover:bg-teal-500/15 px-2.5 py-1 rounded-full border border-teal-200/80 shadow-2xs cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                      >
                        <span>Vault</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Body: High-Yield Components & Reveal */}
                  <div className="pt-3 space-y-3">
                    {/* Clinical Findings / Token Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(todayPearl?.components || '').split('+').map((part, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-semibold bg-white/85 border border-amber-200/70 text-slate-800 shadow-2xs backdrop-blur-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{part.trim()}</span>
                        </span>
                      ))}
                    </div>

                    {/* Bottom Action Row: Reveal / Revealed Diagnosis & NBE Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                      <div className="min-w-0">
                        {isPearlRevealed ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 2 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-300 text-emerald-900 text-xs sm:text-[13px] font-bold font-['Outfit'] shadow-2xs backdrop-blur-xs"
                          >
                            <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                            <span className="tracking-tight">{todayPearl?.diagnosis}</span>
                          </motion.div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsPearlRevealed(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#006B63] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 group/btn relative overflow-hidden"
                          >
                            <Eye className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
                            <span>Tap to Reveal Diagnosis</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                          </button>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-800 border border-amber-300/60 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>Guaranteed NBE Repeat</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.section>
          </div>
        </div>

        {/* ── EXPLORE OTHER HIGH-YIELD SUBJECTS ── */}
        <motion.section
          initial={SECTION_ENTER(0.2, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="space-y-3 pt-1"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-[#006B63] shrink-0">
                <Flame className="h-4.5 w-4.5 fill-[#006B63] text-[#006B63]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-950 via-slate-800 to-[#006B63] bg-clip-text text-transparent font-['Outfit'] leading-tight">
                  Explore Other High-Yield Subjects
                </h3>
                <p className="text-xs text-slate-500">
                  Curated 3D anatomical models and clinical blueprints weighted by NBE exam pattern
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('syllabus')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B63] hover:text-[#005750] hover:underline cursor-pointer self-start sm:self-auto min-h-[36px]"
            >
              View all 19 subjects <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Grid of Subject Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 lg:gap-3">
            {subjectList.map((sub, idx) => {
              const isCurrent = sub.id === activeFocusSubject.id;
              const hyCount = sub.topics.filter((t) => t.isHighYield).length;
              const theme = SUBJECT_CARD_THEMES[sub.id] || DEFAULT_CARD_THEME;
              const InsigniaIcon = getSubjectInsignia(sub.id);

              return (
                <motion.div
                  key={sub.id}
                  whileHover={reducedMotion ? {} : { y: -4, scale: 1.02 }}
                  whileTap={reducedMotion ? {} : { scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={() => {
                    setSelectedFilterSubjectId(sub.id);
                    onSelectSubject(sub.id);
                  }}
                  className={`group relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 flex flex-col justify-between cursor-pointer border bg-gradient-to-b ${theme.bg} backdrop-blur-xl overflow-hidden transition-all duration-300 ${
                    isCurrent
                      ? 'border-[#006B63] shadow-[0_8px_24px_rgba(0,107,99,0.18)] ring-2 ring-[#006B63]/25'
                      : `${theme.border} shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)]`
                  }`}
                >
                  {/* Top Specular Hairline Accent */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

                  {/* Top Row: Specialty Insignia & NBE Weightage Pill */}
                  <div className="flex items-center justify-between gap-1 mb-1 z-20">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center border shadow-2xs backdrop-blur-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                        theme.insigniaBg || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <InsigniaIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-105" />
                    </div>

                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border shadow-2xs backdrop-blur-xs ${theme.badge}`}
                    >
                      <span className="text-[8px] font-sans font-medium opacity-65">NBE</span>
                      <span>{sub.weightage}m</span>
                    </span>
                  </div>

                  {/* 3D Medical Artwork Stage */}
                  <div className="relative w-full h-18 sm:h-20 md:h-22 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-1 sm:p-1.5 group-hover:scale-105 transition-transform duration-300 ease-out">
                    <div
                      className="absolute inset-0 filter blur-sm pointer-events-none rounded-full transition-opacity duration-300 group-hover:opacity-100 opacity-70"
                      style={{
                        background: `radial-gradient(circle at 50% 55%, ${theme.glow} 0%, transparent 72%)`,
                      }}
                    />
                    <motion.div
                      className="relative w-full h-full flex items-center justify-center z-10"
                      animate={reducedMotion ? {} : { y: [-2, 2, -2] }}
                      transition={{ duration: 4 + (idx % 3), repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <MedicalSubjectCardVisual subjectId={sub.id} />
                    </motion.div>
                  </div>

                  {/* Content & Typography */}
                  <div className="mt-1.5 sm:mt-2 pt-0.5 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-[12px] sm:text-[13px] md:text-[14px] font-bold text-slate-900 group-hover:text-[#006B63] transition-colors truncate font-['Outfit']"
                          title={sub.name}
                        >
                          {sub.name}
                        </h4>
                        <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-500 font-medium pt-0.5">
                          <span className="inline-flex items-center gap-1 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                            <span>{hyCount} High-yield</span>
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-[#006B63] font-semibold flex items-center gap-0.5 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 text-[10px] shrink-0">
                            <span>Blueprint</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Micro Progress Bar */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="relative flex-1 h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${theme.progressBar || 'from-[#006B63] to-[#10B981]'} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(sub.percentage, 4)}%` }}
                        />
                        {/* Interactive Shimmer Beam */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      </div>
                      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-slate-600 tabular-nums shrink-0">
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* Topic Mastery Workspace Modal */}
      {activeMasteryTopic && (
        <TopicMasteryWorkspace
          subjectId={activeMasteryTopic.subjectId}
          topicId={activeMasteryTopic.topicId}
          topicName={activeMasteryTopic.topicName}
          state={state}
          onClose={() => setActiveMasteryTopic(null)}
          onOpenAiCoach={onOpenAiCoach}
          onLaunchPracticeMcq={(ctx) =>
            onLaunchPracticeSession?.(ctx.subjectId, ctx.topicId, ctx.topicName, ctx.subtopic)
          }
          onToggleTopicState={onToggleTopicState || (() => {})}
        />
      )}

      {/* Real-time Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        state={state}
        onNavigateTab={onNavigateTab}
        onSelectSubject={onSelectSubject}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />

      {/* Viral Share Milestone Modal */}
      <ShareMilestoneModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        state={state}
        stats={stats}
      />

      {/* 60s IBQ Rapid Recall Drill Modal */}
      <IbqRapidRecallModal
        isOpen={isIbqModalOpen}
        onClose={() => setIsIbqModalOpen(false)}
        onOpenAiCoach={onOpenAiCoach}
      />

      {/* High-Yield PYT Repeat Vault (12 DOCs, 8 Triads, 5 Formulas) */}
      <ExamEveCheatSheetModal
        isOpen={isExamEveCheatSheetOpen}
        onClose={() => setIsExamEveCheatSheetOpen(false)}
        state={state}
      />

      {/* Real NBE Timed Computer-Based Exam Simulation (50Q & 150Q) */}
      <NbeMockExamModal
        isOpen={isNbeMockOpen}
        onClose={() => setIsNbeMockOpen(false)}
        onLogGrandTest={onLogGrandTest}
        onAddErrorItem={onAddErrorItem}
      />

      {/* 150/300 Passing Score Gap Analyzer Modal */}
      <AnimatePresence>
        {isPassingGapModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-50/95 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl p-4 sm:p-6 scrollbar-thin"
            >
              <button
                type="button"
                onClick={() => setIsPassingGapModalOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer z-10 transition-colors border border-slate-200/70"
                title="Close analyzer"
                aria-label="Close"
              >
                <X className="h-4.5 w-4.5" />
              </button>
              <PassingGapAnalyzer
                state={state}
                stats={stats}
                onSelectSubject={(subjId) => {
                  setIsPassingGapModalOpen(false);
                  onSelectSubject(subjId);
                }}
                onOpenAiCoach={onOpenAiCoach}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
