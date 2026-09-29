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
import { CircadianFocusDropdown } from './CircadianFocusDropdown';
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
  isGuest?: boolean;
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
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id="examCountdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007AFF" />
            <stop offset="50%" stopColor="#60B3FF" />
            <stop offset="100%" stopColor="#34C759" />
          </linearGradient>
        </defs>
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E5EA"
          strokeWidth={strokeWidth}
        />
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
          className="font-black text-2xl sm:text-3xl text-[#1D1D1F] tracking-tight tabular-nums leading-none"
        />
        <span className="text-[11px] font-medium text-[#6E6E73] mt-1 leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] font-semibold text-[#30D158] mt-0.5 leading-none">
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
      bar: 'bg-gradient-to-r from-[#007AFF] via-[#60B3FF] to-[#10B981]',
      track: 'bg-[#32ADE6]/8',
      badge: 'text-[#32ADE6] bg-[#32ADE6]/10 border-[#32ADE6]/15',
      dot: 'bg-[#32ADE6]',
      statusText: rawStatusText || 'Strong',
    };
  }
  if (isModerate) {
    return {
      bar: 'bg-[#FF9F0A]',
      track: 'bg-[#FF9F0A]/8',
      badge: 'text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/15',
      dot: 'bg-[#FF9F0A]',
      statusText: rawStatusText || 'Moderate',
    };
  }
  return {
    bar: 'bg-[#FF3B30]',
    track: 'bg-[#FF3B30]/8',
    badge: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/15',
    dot: 'bg-[#FF3B30]',
    statusText: rawStatusText || 'Needs focus',
  };
}

/** Subject Accent Colors for Progress Bars & Badges */
const SUBJECT_ACCENT_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  anatomy:      { bar: 'bg-[#FF3B30]', badge: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/15', text: 'text-[#FF3B30]' },
  physiology:   { bar: 'bg-[#5AC8FA]', badge: 'text-[#32ADE6] bg-[#32ADE6]/10 border-[#32ADE6]/15', text: 'text-[#32ADE6]' },
  biochemistry: { bar: 'bg-[#BF5AF2]', badge: 'text-[#BF5AF2] bg-[#BF5AF2]/10 border-[#BF5AF2]/15', text: 'text-[#BF5AF2]' },
  pathology:    { bar: 'bg-[#FF9500]', badge: 'text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/15', text: 'text-[#FF9500]' },
  pharmacology: { bar: 'bg-[#BF5AF2]', badge: 'text-[#BF5AF2] bg-[#BF5AF2]/10 border-[#BF5AF2]/15', text: 'text-[#BF5AF2]' },
  microbiology: { bar: 'bg-[#32ADE6]', badge: 'text-[#32ADE6] bg-[#32ADE6]/10 border-[#32ADE6]/15', text: 'text-[#32ADE6]' },
  fmt:          { bar: 'bg-[#8E8E93]', badge: 'text-[#6E6E73] bg-[#E5E5EA] border-[rgba(60,60,67,0.12)]', text: 'text-[#6E6E73]' },
  psm:          { bar: 'bg-[#30D158]', badge: 'text-[#30D158] bg-[#30D158]/10 border-[#30D158]/15', text: 'text-[#30D158]' },
  medicine:     { bar: 'bg-[#FF3B30]', badge: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/15', text: 'text-[#FF3B30]' },
  surgery:      { bar: 'bg-[#FF453A]', badge: 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/15', text: 'text-[#FF453A]' },
  obg:          { bar: 'bg-[#FF2D55]', badge: 'text-[#FF2D55] bg-[#FF2D55]/10 border-[#FF2D55]/15', text: 'text-[#FF2D55]' },
  pediatrics:   { bar: 'bg-[#FF9F0A]', badge: 'text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/15', text: 'text-[#FF9F0A]' },
  ophthalmology:{ bar: 'bg-[#5E5CE6]', badge: 'text-[#5E5CE6] bg-[#5E5CE6]/10 border-[#5E5CE6]/15', text: 'text-[#5E5CE6]' },
  ent:          { bar: 'bg-[#30D158]', badge: 'text-[#30D158] bg-[#30D158]/10 border-[#30D158]/15', text: 'text-[#30D158]' },
  dermatology:  { bar: 'bg-[#FF9500]', badge: 'text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/15', text: 'text-[#FF9500]' },
  psychiatry:   { bar: 'bg-[#BF5AF2]', badge: 'text-[#BF5AF2] bg-[#BF5AF2]/10 border-[#BF5AF2]/15', text: 'text-[#BF5AF2]' },
  radiology:    { bar: 'bg-[#007AFF]', badge: 'text-[#007AFF] bg-[#007AFF]/10 border-[#007AFF]/15', text: 'text-[#007AFF]' },
  orthopedics:  { bar: 'bg-[#8E8E93]', badge: 'text-[#6E6E73] bg-[#E5E5EA] border-[rgba(60,60,67,0.12)]', text: 'text-[#6E6E73]' },
  anesthesia:   { bar: 'bg-[#5AC8FA]', badge: 'text-[#32ADE6] bg-[#32ADE6]/10 border-[#32ADE6]/15', text: 'text-[#32ADE6]' },
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
    bg: 'from-[#FF3B30]/[0.07] via-[#FF6B6B]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FF3B30]/25',
    glow: 'rgba(255,59,48,0.22)',
    badge: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/15',
    insigniaBg: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/15',
    insigniaText: 'text-[#FF3B30]',
    progressBar: 'from-[#FF6B6B] to-[#FF3B30]',
    arrowBg: 'group-hover:bg-[#FF3B30] group-hover:text-white',
    arrowText: 'text-[#FF3B30]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,59,48,0.20) 0%, rgba(255,107,107,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF1F0] via-[#FBFCFC] to-[#FFE5E5]',
    ecgStrokeStart: '#FF3B30',
    ecgStrokeMid: '#FF6B6B',
    ecgGlow: 'rgba(255,59,48,0.85)',
    ecgDotColor: '#FFB3B0',
    haloStart: '#FF6B6B',
    haloMid: '#FF3B30',
    haloEnd: '#C0392B',
    orbitStroke: '#FF3B30',
    primaryBtnBg: 'bg-[#FF3B30]',
    primaryBtnHover: 'hover:bg-[#D32F2F]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(255,59,48,0.28)]',
  },
  psychiatry: {
    bg: 'from-[#BF5AF2]/[0.07] via-[#DA8FFF]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#BF5AF2]/25',
    glow: 'rgba(191,90,242,0.22)',
    badge: 'bg-[#BF5AF2]/10 text-[#BF5AF2] border-[#BF5AF2]/15',
    insigniaBg: 'bg-[#BF5AF2]/10 text-[#BF5AF2] border-[#BF5AF2]/15',
    insigniaText: 'text-[#BF5AF2]',
    progressBar: 'from-[#DA8FFF] to-[#BF5AF2]',
    arrowBg: 'group-hover:bg-[#BF5AF2] group-hover:text-white',
    arrowText: 'text-[#BF5AF2]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(191,90,242,0.22) 0%, rgba(218,143,255,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#F9F0FF] via-[#FBFCFC] to-[#F3E8FF]',
    ecgStrokeStart: '#BF5AF2',
    ecgStrokeMid: '#DA8FFF',
    ecgGlow: 'rgba(218,143,255,0.85)',
    ecgDotColor: '#E9D5FF',
    haloStart: '#DA8FFF',
    haloMid: '#BF5AF2',
    haloEnd: '#7B2FA0',
    orbitStroke: '#BF5AF2',
    primaryBtnBg: 'bg-[#BF5AF2]',
    primaryBtnHover: 'hover:bg-[#A040D0]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(191,90,242,0.28)]',
  },
  physiology: {
    bg: 'from-[#5AC8FA]/[0.07] via-[#32ADE6]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#32ADE6]/25',
    glow: 'rgba(90,200,250,0.22)',
    badge: 'bg-[#32ADE6]/10 text-[#32ADE6] border-[#32ADE6]/15',
    insigniaBg: 'bg-[#32ADE6]/10 text-[#32ADE6] border-[#32ADE6]/15',
    insigniaText: 'text-[#32ADE6]',
    progressBar: 'from-[#5AC8FA] to-[#32ADE6]',
    arrowBg: 'group-hover:bg-[#32ADE6] group-hover:text-white',
    arrowText: 'text-[#32ADE6]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(90,200,250,0.22) 0%, rgba(50,173,230,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EBF9FF] via-[#FBFCFC] to-[#D6F0FF]',
    ecgStrokeStart: '#32ADE6',
    ecgStrokeMid: '#5AC8FA',
    ecgGlow: 'rgba(90,200,250,0.85)',
    ecgDotColor: '#B3E5FC',
    haloStart: '#5AC8FA',
    haloMid: '#32ADE6',
    haloEnd: '#0078CC',
    orbitStroke: '#32ADE6',
    primaryBtnBg: 'bg-[#007AFF]',
    primaryBtnHover: 'hover:bg-[#0056CC]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(50,173,230,0.28)]',
  },
  surgery: {
    bg: 'from-[#FF453A]/[0.07] via-[#FF6961]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FF453A]/25',
    glow: 'rgba(255,69,58,0.22)',
    badge: 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/15',
    insigniaBg: 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/15',
    insigniaText: 'text-[#FF453A]',
    progressBar: 'from-[#FF6961] to-[#FF453A]',
    arrowBg: 'group-hover:bg-[#FF453A] group-hover:text-white',
    arrowText: 'text-[#FF453A]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,69,58,0.20) 0%, rgba(255,105,97,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF0EF] via-[#FBFCFC] to-[#FFE2E0]',
    ecgStrokeStart: '#FF453A',
    ecgStrokeMid: '#FF6961',
    ecgGlow: 'rgba(255,69,58,0.85)',
    ecgDotColor: '#FFB3AE',
    haloStart: '#FF6961',
    haloMid: '#FF453A',
    haloEnd: '#CC2200',
    orbitStroke: '#FF453A',
    primaryBtnBg: 'bg-[#FF453A]',
    primaryBtnHover: 'hover:bg-[#D03020]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(255,69,58,0.28)]',
  },
  pathology: {
    bg: 'from-[#FF9500]/[0.07] via-[#FFB340]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FF9500]/25',
    glow: 'rgba(255,149,0,0.22)',
    badge: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/15',
    insigniaBg: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/15',
    insigniaText: 'text-[#FF9500]',
    progressBar: 'from-[#FFB340] to-[#FF9500]',
    arrowBg: 'group-hover:bg-[#FF9500] group-hover:text-white',
    arrowText: 'text-[#FF9500]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,149,0,0.20) 0%, rgba(255,179,64,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF8EC] via-[#FBFCFC] to-[#FFF0D6]',
    ecgStrokeStart: '#FF9500',
    ecgStrokeMid: '#FFB340',
    ecgGlow: 'rgba(255,149,0,0.85)',
    ecgDotColor: '#FFD9A0',
    haloStart: '#FFB340',
    haloMid: '#FF9500',
    haloEnd: '#CC7700',
    orbitStroke: '#FF9500',
    primaryBtnBg: 'bg-[#FF9500]',
    primaryBtnHover: 'hover:bg-[#D07800]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(255,149,0,0.28)]',
  },
  biochemistry: {
    bg: 'from-[#FFD60A]/[0.07] via-[#FFE04D]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FFD60A]/35',
    glow: 'rgba(255,214,10,0.22)',
    badge: 'bg-[#FFD60A]/12 text-[#CC9900] border-[#FFD60A]/30',
    insigniaBg: 'bg-[#FFD60A]/12 text-[#CC9900] border-[#FFD60A]/25',
    insigniaText: 'text-[#CC9900]',
    progressBar: 'from-[#FFE04D] to-[#FFD60A]',
    arrowBg: 'group-hover:bg-[#FFD60A] group-hover:text-[#1D1D1F]',
    arrowText: 'text-[#CC9900]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,214,10,0.22) 0%, rgba(255,224,77,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFFCE0] via-[#FBFCFC] to-[#FFF9C0]',
    ecgStrokeStart: '#CC9900',
    ecgStrokeMid: '#FFD60A',
    ecgGlow: 'rgba(255,214,10,0.85)',
    ecgDotColor: '#FFF0A0',
    haloStart: '#FFE04D',
    haloMid: '#FFD60A',
    haloEnd: '#AA8000',
    orbitStroke: '#CC9900',
    primaryBtnBg: 'bg-[#AA8000]',
    primaryBtnHover: 'hover:bg-[#886600]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(204,153,0,0.28)]',
  },
  anatomy: {
    bg: 'from-[#30D158]/[0.07] via-[#4CD964]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#30D158]/25',
    glow: 'rgba(48,209,88,0.22)',
    badge: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/15',
    insigniaBg: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/15',
    insigniaText: 'text-[#30D158]',
    progressBar: 'from-[#4CD964] to-[#30D158]',
    arrowBg: 'group-hover:bg-[#30D158] group-hover:text-white',
    arrowText: 'text-[#30D158]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(48,209,88,0.20) 0%, rgba(76,217,100,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EDFFF2] via-[#FBFCFC] to-[#D6FFE3]',
    ecgStrokeStart: '#30D158',
    ecgStrokeMid: '#4CD964',
    ecgGlow: 'rgba(48,209,88,0.85)',
    ecgDotColor: '#A8F0BA',
    haloStart: '#4CD964',
    haloMid: '#30D158',
    haloEnd: '#1A8A35',
    orbitStroke: '#30D158',
    primaryBtnBg: 'bg-[#30D158]',
    primaryBtnHover: 'hover:bg-[#25A845]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(48,209,88,0.28)]',
  },
  pharmacology: {
    bg: 'from-[#BF5AF2]/[0.07] via-[#DA8FFF]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#BF5AF2]/25',
    glow: 'rgba(191,90,242,0.22)',
    badge: 'bg-[#BF5AF2]/10 text-[#BF5AF2] border-[#BF5AF2]/15',
    insigniaBg: 'bg-[#BF5AF2]/10 text-[#BF5AF2] border-[#BF5AF2]/15',
    insigniaText: 'text-[#BF5AF2]',
    progressBar: 'from-[#DA8FFF] to-[#BF5AF2]',
    arrowBg: 'group-hover:bg-[#BF5AF2] group-hover:text-white',
    arrowText: 'text-[#BF5AF2]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(191,90,242,0.22) 0%, rgba(218,143,255,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#F9F0FF] via-[#FBFCFC] to-[#F0DEFF]',
    ecgStrokeStart: '#BF5AF2',
    ecgStrokeMid: '#DA8FFF',
    ecgGlow: 'rgba(191,90,242,0.85)',
    ecgDotColor: '#E5BBFF',
    haloStart: '#DA8FFF',
    haloMid: '#BF5AF2',
    haloEnd: '#7B2FA0',
    orbitStroke: '#BF5AF2',
    primaryBtnBg: 'bg-[#BF5AF2]',
    primaryBtnHover: 'hover:bg-[#A040D0]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(191,90,242,0.28)]',
  },
  microbiology: {
    bg: 'from-[#32ADE6]/[0.07] via-[#5AC8FA]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#32ADE6]/25',
    glow: 'rgba(50,173,230,0.22)',
    badge: 'bg-[#32ADE6]/10 text-[#32ADE6] border-[#32ADE6]/15',
    insigniaBg: 'bg-[#32ADE6]/10 text-[#32ADE6] border-[#32ADE6]/15',
    insigniaText: 'text-[#32ADE6]',
    progressBar: 'from-[#5AC8FA] to-[#32ADE6]',
    arrowBg: 'group-hover:bg-[#32ADE6] group-hover:text-white',
    arrowText: 'text-[#32ADE6]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(50,173,230,0.22) 0%, rgba(90,200,250,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EBF9FF] via-[#FBFCFC] to-[#D0F0FF]',
    ecgStrokeStart: '#32ADE6',
    ecgStrokeMid: '#5AC8FA',
    ecgGlow: 'rgba(90,200,250,0.85)',
    ecgDotColor: '#B0E5FF',
    haloStart: '#5AC8FA',
    haloMid: '#32ADE6',
    haloEnd: '#0078CC',
    orbitStroke: '#32ADE6',
    primaryBtnBg: 'bg-[#32ADE6]',
    primaryBtnHover: 'hover:bg-[#0078CC]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(50,173,230,0.28)]',
  },
  fmt: {
    bg: 'from-[#8E8E93]/[0.07] via-[#AEAEB2]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.12)] hover:border-[rgba(60,60,67,0.22)]',
    glow: 'rgba(142,142,147,0.18)',
    badge: 'bg-[#E5E5EA] text-[#6E6E73] border-[rgba(60,60,67,0.12)]',
    insigniaBg: 'bg-[#E5E5EA] text-[#6E6E73] border-[rgba(60,60,67,0.12)]',
    insigniaText: 'text-[#6E6E73]',
    progressBar: 'from-[#AEAEB2] to-[#8E8E93]',
    arrowBg: 'group-hover:bg-[#1D1D1F] group-hover:text-white',
    arrowText: 'text-[#6E6E73]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(142,142,147,0.18) 0%, rgba(174,174,178,0.09) 44%, transparent 72%)',
    cardGradient: 'from-[#F5F5F7] via-[#FBFCFC] to-[#EBEBF0]',
    ecgStrokeStart: '#8E8E93',
    ecgStrokeMid: '#AEAEB2',
    ecgGlow: 'rgba(174,174,178,0.85)',
    ecgDotColor: '#C7C7CC',
    haloStart: '#AEAEB2',
    haloMid: '#8E8E93',
    haloEnd: '#48484A',
    orbitStroke: '#8E8E93',
    primaryBtnBg: 'bg-[#48484A]',
    primaryBtnHover: 'hover:bg-[#1D1D1F]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(72,72,74,0.25)]',
  },
  psm: {
    bg: 'from-[#30D158]/[0.07] via-[#4CD964]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#30D158]/25',
    glow: 'rgba(48,209,88,0.22)',
    badge: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/15',
    insigniaBg: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/15',
    insigniaText: 'text-[#30D158]',
    progressBar: 'from-[#4CD964] to-[#30D158]',
    arrowBg: 'group-hover:bg-[#30D158] group-hover:text-white',
    arrowText: 'text-[#30D158]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(48,209,88,0.20) 0%, rgba(76,217,100,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EDFFF2] via-[#FBFCFC] to-[#D0FFE0]',
    ecgStrokeStart: '#30D158',
    ecgStrokeMid: '#4CD964',
    ecgGlow: 'rgba(48,209,88,0.85)',
    ecgDotColor: '#A8F0BA',
    haloStart: '#4CD964',
    haloMid: '#30D158',
    haloEnd: '#1A8A35',
    orbitStroke: '#30D158',
    primaryBtnBg: 'bg-[#30D158]',
    primaryBtnHover: 'hover:bg-[#25A845]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(48,209,88,0.28)]',
  },
  ophthalmology: {
    bg: 'from-[#5E5CE6]/[0.07] via-[#7D7AFF]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#5E5CE6]/25',
    glow: 'rgba(94,92,230,0.22)',
    badge: 'bg-[#5E5CE6]/10 text-[#5E5CE6] border-[#5E5CE6]/15',
    insigniaBg: 'bg-[#5E5CE6]/10 text-[#5E5CE6] border-[#5E5CE6]/15',
    insigniaText: 'text-[#5E5CE6]',
    progressBar: 'from-[#7D7AFF] to-[#5E5CE6]',
    arrowBg: 'group-hover:bg-[#5E5CE6] group-hover:text-white',
    arrowText: 'text-[#5E5CE6]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(94,92,230,0.22) 0%, rgba(125,122,255,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EFEFF9] via-[#FBFCFC] to-[#E2E2F8]',
    ecgStrokeStart: '#5E5CE6',
    ecgStrokeMid: '#7D7AFF',
    ecgGlow: 'rgba(125,122,255,0.85)',
    ecgDotColor: '#C0BFFF',
    haloStart: '#7D7AFF',
    haloMid: '#5E5CE6',
    haloEnd: '#3634A3',
    orbitStroke: '#5E5CE6',
    primaryBtnBg: 'bg-[#5E5CE6]',
    primaryBtnHover: 'hover:bg-[#4240C0]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(94,92,230,0.28)]',
  },
  ent: {
    bg: 'from-[#30D158]/[0.07] via-[#4CD964]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#30D158]/25',
    glow: 'rgba(48,209,88,0.22)',
    badge: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/15',
    insigniaBg: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/15',
    insigniaText: 'text-[#30D158]',
    progressBar: 'from-[#4CD964] to-[#30D158]',
    arrowBg: 'group-hover:bg-[#30D158] group-hover:text-white',
    arrowText: 'text-[#30D158]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(48,209,88,0.20) 0%, rgba(76,217,100,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EDFFF2] via-[#FBFCFC] to-[#D6FFE3]',
    ecgStrokeStart: '#30D158',
    ecgStrokeMid: '#4CD964',
    ecgGlow: 'rgba(48,209,88,0.85)',
    ecgDotColor: '#A8F0BA',
    haloStart: '#4CD964',
    haloMid: '#30D158',
    haloEnd: '#1A8A35',
    orbitStroke: '#30D158',
    primaryBtnBg: 'bg-[#30D158]',
    primaryBtnHover: 'hover:bg-[#25A845]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(48,209,88,0.28)]',
  },
  obg: {
    bg: 'from-[#FF2D55]/[0.07] via-[#FF6B8A]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FF2D55]/25',
    glow: 'rgba(255,45,85,0.22)',
    badge: 'bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/15',
    insigniaBg: 'bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/15',
    insigniaText: 'text-[#FF2D55]',
    progressBar: 'from-[#FF6B8A] to-[#FF2D55]',
    arrowBg: 'group-hover:bg-[#FF2D55] group-hover:text-white',
    arrowText: 'text-[#FF2D55]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,45,85,0.20) 0%, rgba(255,107,138,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF0F3] via-[#FBFCFC] to-[#FFE0E7]',
    ecgStrokeStart: '#FF2D55',
    ecgStrokeMid: '#FF6B8A',
    ecgGlow: 'rgba(255,45,85,0.85)',
    ecgDotColor: '#FFB0BF',
    haloStart: '#FF6B8A',
    haloMid: '#FF2D55',
    haloEnd: '#CC0033',
    orbitStroke: '#FF2D55',
    primaryBtnBg: 'bg-[#FF2D55]',
    primaryBtnHover: 'hover:bg-[#CC0033]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(255,45,85,0.28)]',
  },
  pediatrics: {
    bg: 'from-[#FF9F0A]/[0.07] via-[#FFB340]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FF9F0A]/25',
    glow: 'rgba(255,159,10,0.22)',
    badge: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/15',
    insigniaBg: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/15',
    insigniaText: 'text-[#FF9F0A]',
    progressBar: 'from-[#FFB340] to-[#FF9F0A]',
    arrowBg: 'group-hover:bg-[#FF9F0A] group-hover:text-white',
    arrowText: 'text-[#FF9F0A]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,159,10,0.22) 0%, rgba(255,179,64,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF8EC] via-[#FBFCFC] to-[#FFF0D0]',
    ecgStrokeStart: '#FF9F0A',
    ecgStrokeMid: '#FFB340',
    ecgGlow: 'rgba(255,179,64,0.85)',
    ecgDotColor: '#FFD9A0',
    haloStart: '#FFB340',
    haloMid: '#FF9F0A',
    haloEnd: '#CC7700',
    orbitStroke: '#FF9F0A',
    primaryBtnBg: 'bg-[#FF9F0A]',
    primaryBtnHover: 'hover:bg-[#D07800]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(255,159,10,0.28)]',
  },
  orthopedics: {
    bg: 'from-[#8E8E93]/[0.07] via-[#AEAEB2]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[rgba(60,60,67,0.22)]',
    glow: 'rgba(142,142,147,0.18)',
    badge: 'bg-[#E5E5EA] text-[#6E6E73] border-[rgba(60,60,67,0.12)]',
    insigniaBg: 'bg-[#E5E5EA] text-[#6E6E73] border-[rgba(60,60,67,0.12)]',
    insigniaText: 'text-[#6E6E73]',
    progressBar: 'from-[#AEAEB2] to-[#8E8E93]',
    arrowBg: 'group-hover:bg-[#1D1D1F] group-hover:text-white',
    arrowText: 'text-[#6E6E73]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(174,174,178,0.18) 0%, rgba(142,142,147,0.09) 44%, transparent 72%)',
    cardGradient: 'from-[#F5F5F7] via-[#FBFCFC] to-[#EBEBF0]',
    ecgStrokeStart: '#8E8E93',
    ecgStrokeMid: '#AEAEB2',
    ecgGlow: 'rgba(174,174,178,0.80)',
    ecgDotColor: '#C7C7CC',
    haloStart: '#AEAEB2',
    haloMid: '#8E8E93',
    haloEnd: '#48484A',
    orbitStroke: '#8E8E93',
    primaryBtnBg: 'bg-[#48484A]',
    primaryBtnHover: 'hover:bg-[#1D1D1F]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(72,72,74,0.25)]',
  },
  dermatology: {
    bg: 'from-[#FF9500]/[0.07] via-[#FFB37C]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#FF9500]/25',
    glow: 'rgba(255,149,0,0.22)',
    badge: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/15',
    insigniaBg: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/15',
    insigniaText: 'text-[#FF9500]',
    progressBar: 'from-[#FFB37C] to-[#FF9500]',
    arrowBg: 'group-hover:bg-[#FF9500] group-hover:text-white',
    arrowText: 'text-[#FF9500]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(255,149,0,0.20) 0%, rgba(255,179,124,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#FFF5E8] via-[#FBFCFC] to-[#FFECD0]',
    ecgStrokeStart: '#FF9500',
    ecgStrokeMid: '#FFB37C',
    ecgGlow: 'rgba(255,149,0,0.85)',
    ecgDotColor: '#FFD5A8',
    haloStart: '#FFB37C',
    haloMid: '#FF9500',
    haloEnd: '#CC7700',
    orbitStroke: '#FF9500',
    primaryBtnBg: 'bg-[#FF9500]',
    primaryBtnHover: 'hover:bg-[#D07800]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(255,149,0,0.28)]',
  },
  radiology: {
    bg: 'from-[#007AFF]/[0.07] via-[#409CFF]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#007AFF]/25',
    glow: 'rgba(0,122,255,0.22)',
    badge: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/15',
    insigniaBg: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/15',
    insigniaText: 'text-[#007AFF]',
    progressBar: 'from-[#409CFF] to-[#007AFF]',
    arrowBg: 'group-hover:bg-[#007AFF] group-hover:text-white',
    arrowText: 'text-[#007AFF]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(0,122,255,0.22) 0%, rgba(64,156,255,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EBF4FF] via-[#FBFCFC] to-[#D6EAFF]',
    ecgStrokeStart: '#007AFF',
    ecgStrokeMid: '#409CFF',
    ecgGlow: 'rgba(0,122,255,0.85)',
    ecgDotColor: '#A0CCFF',
    haloStart: '#409CFF',
    haloMid: '#007AFF',
    haloEnd: '#0050CC',
    orbitStroke: '#007AFF',
    primaryBtnBg: 'bg-[#007AFF]',
    primaryBtnHover: 'hover:bg-[#0056CC]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(0,122,255,0.28)]',
  },
  anesthesia: {
    bg: 'from-[#5AC8FA]/[0.07] via-[#70D7FF]/[0.03] to-white/90',
    border: 'border-[rgba(60,60,67,0.10)] hover:border-[#5AC8FA]/25',
    glow: 'rgba(90,200,250,0.22)',
    badge: 'bg-[#5AC8FA]/10 text-[#32ADE6] border-[#5AC8FA]/20',
    insigniaBg: 'bg-[#5AC8FA]/10 text-[#32ADE6] border-[#5AC8FA]/20',
    insigniaText: 'text-[#32ADE6]',
    progressBar: 'from-[#70D7FF] to-[#5AC8FA]',
    arrowBg: 'group-hover:bg-[#5AC8FA] group-hover:text-[#1D1D1F]',
    arrowText: 'text-[#32ADE6]',
    heroGradient: 'radial-gradient(circle at 50% 50%, rgba(90,200,250,0.22) 0%, rgba(112,215,255,0.10) 44%, transparent 72%)',
    cardGradient: 'from-[#EBF9FF] via-[#FBFCFC] to-[#D0F4FF]',
    ecgStrokeStart: '#32ADE6',
    ecgStrokeMid: '#5AC8FA',
    ecgGlow: 'rgba(90,200,250,0.85)',
    ecgDotColor: '#B0E8FF',
    haloStart: '#70D7FF',
    haloMid: '#5AC8FA',
    haloEnd: '#0078CC',
    orbitStroke: '#32ADE6',
    primaryBtnBg: 'bg-[#32ADE6]',
    primaryBtnHover: 'hover:bg-[#0078CC]',
    primaryBtnShadow: 'shadow-[0_4px_14px_rgba(90,200,250,0.28)]',
  },
};

const DEFAULT_CARD_THEME: SubjectCardTheme = {
  bg: 'from-[#007AFF]/[0.07] via-[#409CFF]/[0.03] to-white/90',
  border: 'border-[rgba(60,60,67,0.10)] hover:border-[#007AFF]/25',
  glow: 'rgba(0,122,255,0.18)',
  badge: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/15',
  insigniaBg: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/15',
  insigniaText: 'text-[#007AFF]',
  progressBar: 'from-[#409CFF] to-[#007AFF]',
  arrowBg: 'group-hover:bg-[#007AFF] group-hover:text-white',
  arrowText: 'text-[#6E6E73]',
  heroGradient: 'radial-gradient(circle at 50% 50%, rgba(0,122,255,0.20) 0%, transparent 70%)',
  cardGradient: 'from-[#EBF4FF] via-[#FBFCFC] to-[#D6EAFF]',
  ecgStrokeStart: '#007AFF',
  ecgStrokeMid: '#409CFF',
  ecgGlow: 'rgba(0,122,255,0.85)',
  ecgDotColor: '#A0CCFF',
  haloStart: '#409CFF',
  haloMid: '#007AFF',
  haloEnd: '#0050CC',
  orbitStroke: '#007AFF',
  primaryBtnBg: 'bg-[#007AFF]',
  primaryBtnHover: 'hover:bg-[#0056CC]',
  primaryBtnShadow: 'shadow-[0_4px_14px_rgba(0,122,255,0.25)]',
};

const SECTION_ENTER = (_delay: number, reduced: boolean | null) =>
  reduced ? {} : { y: 20, opacity: 0, scale: 0.985 };
const SECTION_SHOW = { y: 0, opacity: 1, scale: 1 };
const SECTION_TRANSITION = (reduced: boolean | null, delay: number = 0) =>
  reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 280, damping: 24, delay };
const SPRING = (reduced: boolean | null) =>
  reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 30 };

// Subject-specific animated SVG backgrounds for the Today's Focus hero visual
const SubjectFocusAnimation: React.FC<{
  subjectId: string;
  theme: SubjectCardTheme;
  reducedMotion: boolean;
}> = ({ subjectId, theme, reducedMotion: rm }) => {
  const c = theme.ecgStrokeStart;
  const c2 = theme.ecgStrokeMid;
  const loop = (dur: number, delay = 0) => ({
    duration: dur, repeat: rm ? 0 : Infinity, ease: 'linear' as const, delay,
  });

  // ── MEDICINE: cardiac ECG sinus rhythm ──
  if (subjectId === 'medicine') {
    const inflow = "M 0 110 L 32 110 L 36 105 L 40 105 L 44 110 L 56 110 L 60 116 L 68 44 L 76 164 L 82 110 L 88 101 L 93 101 L 98 110 L 108 110 L 112 116 L 120 84 L 128 136 L 132 110 L 160 110";
    const outflow = "M 160 110 L 190 110 L 194 106 L 198 106 L 202 110 L 214 110 L 218 116 L 226 44 L 234 166 L 240 110 L 246 98 L 252 98 L 256 110 L 266 110 L 270 115 L 276 80 L 282 138 L 286 110 L 320 110";
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible" shapeRendering="geometricPrecision">
        <path d={inflow} stroke={c} strokeWidth="2" opacity="0.28" strokeLinecap="round" />
        <path d={outflow} stroke={c} strokeWidth="2" opacity="0.28" strokeLinecap="round" />
        {!rm && <>
          <motion.path d={inflow} stroke={c} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray="28 320" initial={{ strokeDashoffset: 320 }} animate={{ strokeDashoffset: -320 }}
            transition={loop(2.2)} />
          <motion.path d={outflow} stroke={c} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray="28 320" initial={{ strokeDashoffset: 320 }} animate={{ strokeDashoffset: -320 }}
            transition={loop(2.2, 1.1)} />
        </>}
      </svg>
    );
  }

  // ── ANATOMY: neural branching network ──
  if (subjectId === 'anatomy') {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const L = 70;
    const endpoints = angles.map(a => ({
      x: 160 + L * Math.cos((a * Math.PI) / 180),
      y: 110 + L * Math.sin((a * Math.PI) / 180),
    }));
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        {endpoints.map((ep, i) => {
          const branchA = ((i * 45 + 30) * Math.PI) / 180;
          const branchB = ((i * 45 - 30) * Math.PI) / 180;
          return (
            <React.Fragment key={i}>
              <line x1="160" y1="110" x2={ep.x} y2={ep.y} stroke={c} strokeWidth="1.6" opacity="0.35" />
              <line x1={ep.x} y1={ep.y} x2={ep.x + 22 * Math.cos(branchA)} y2={ep.y + 22 * Math.sin(branchA)} stroke={c} strokeWidth="1" opacity="0.18" />
              <line x1={ep.x} y1={ep.y} x2={ep.x + 22 * Math.cos(branchB)} y2={ep.y + 22 * Math.sin(branchB)} stroke={c} strokeWidth="1" opacity="0.18" />
              {!rm
                ? <motion.circle cx={ep.x} cy={ep.y} r="4" fill={c}
                    animate={{ opacity: [0.3, 1, 0.3], r: [3, 5.5, 3] }}
                    transition={{ duration: 1.6, delay: i * 0.2, repeat: Infinity }} />
                : <circle cx={ep.x} cy={ep.y} r="4" fill={c} opacity="0.5" />}
            </React.Fragment>
          );
        })}
        <circle cx="160" cy="110" r="7" fill={c} opacity="0.9" />
        {!rm && <motion.circle cx="160" cy="110" r="12" stroke={c} strokeWidth="1.5" fill="none"
          animate={{ r: [10, 20, 10], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }} />}
      </svg>
    );
  }

  // ── PHYSIOLOGY: smooth breathing sine wave ──
  if (subjectId === 'physiology') {
    const wave = "M 0 110 C 20 110 30 52 40 52 C 50 52 60 168 70 168 C 80 168 90 52 100 52 C 110 52 120 168 130 168 C 140 168 150 52 160 52 C 170 52 180 168 190 168 C 200 168 210 52 220 52 C 230 52 240 168 250 168 C 260 168 270 52 280 52 C 290 52 305 110 320 110";
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <path d={wave} stroke={c} strokeWidth="2" opacity="0.22" />
        {!rm && <motion.path d={wave} stroke={c} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray="45 460" initial={{ strokeDashoffset: 460 }} animate={{ strokeDashoffset: -460 }}
          transition={loop(3.2)} />}
      </svg>
    );
  }

  // ── BIOCHEMISTRY: rotating hexagon molecule ──
  if (subjectId === 'biochemistry') {
    const hexPts = Array.from({ length: 6 }, (_, i) => ({
      x: 160 + 52 * Math.cos(((i * 60 - 30) * Math.PI) / 180),
      y: 110 + 52 * Math.sin(((i * 60 - 30) * Math.PI) / 180),
    }));
    const hexPath = hexPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <motion.g style={{ originX: '160px', originY: '110px' }}
          animate={rm ? {} : { rotate: 360 }}
          transition={{ duration: 9, ease: 'linear', repeat: Infinity }}>
          <path d={hexPath} stroke={c} strokeWidth="2" opacity="0.45" />
          {hexPts.map((p, i) => (
            <React.Fragment key={i}>
              <line x1="160" y1="110" x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke={c} strokeWidth="0.9" opacity="0.18" />
              <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="5" fill={c} opacity="0.7" />
            </React.Fragment>
          ))}
        </motion.g>
        <circle cx="160" cy="110" r="9" fill={c} opacity="0.9" />
        {!rm && <motion.circle r="5" fill={c2}
          animate={{ cx: [212, 160, 108, 160, 212], cy: [110, 63, 110, 157, 110] }}
          transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }} />}
      </svg>
    );
  }

  // ── PHARMACOLOGY: drug molecule orbiting receptor ──
  if (subjectId === 'pharmacology') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <circle cx="160" cy="110" r="24" stroke={c} strokeWidth="2.5" fill="none" opacity="0.35" />
        <circle cx="160" cy="110" r="13" fill={c} opacity="0.65" />
        {[0, 60, 120, 180, 240, 300].map(a => {
          const rad = (a * Math.PI) / 180;
          return <line key={a}
            x1={(160 + 24 * Math.cos(rad)).toFixed(1)} y1={(110 + 24 * Math.sin(rad)).toFixed(1)}
            x2={(160 + 38 * Math.cos(rad)).toFixed(1)} y2={(110 + 38 * Math.sin(rad)).toFixed(1)}
            stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />;
        })}
        <ellipse cx="160" cy="110" rx="78" ry="42" stroke={c} strokeWidth="1.2" fill="none" opacity="0.18" strokeDasharray="5 7" />
        {!rm && <motion.g style={{ originX: '160px', originY: '110px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, ease: 'linear', repeat: Infinity }}>
          <ellipse cx="238" cy="110" rx="9" ry="5.5" fill={c2} opacity="0.9" />
          <rect x="229" y="108" width="18" height="4" rx="2" fill={c} opacity="0.35" />
        </motion.g>}
      </svg>
    );
  }

  // ── MICROBIOLOGY: petri dish with expanding rings + bacteria ──
  if (subjectId === 'microbiology') {
    const bDots: [number, number][] = [[128, 88], [188, 85], [142, 140], [192, 136], [160, 72], [160, 148], [118, 118], [202, 112]];
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <ellipse cx="160" cy="114" rx="92" ry="76" stroke={c} strokeWidth="2.5" fill="none" opacity="0.18" />
        {[22, 44, 66].map((r, i) => (
          !rm
            ? <motion.circle key={i} cx="160" cy="110" stroke={c} strokeWidth="1.8" fill="none"
                animate={{ r: [r, r + 16, r], opacity: [0.65, 0, 0.65] }}
                transition={{ duration: 2.2, delay: i * 0.65, repeat: Infinity }} />
            : <circle key={i} cx="160" cy="110" r={r} stroke={c} strokeWidth="1.5" fill="none" opacity="0.3" />
        ))}
        {bDots.map(([bx, by], i) => (
          !rm
            ? <motion.circle key={i} cx={bx} cy={by} r="5" fill={c} opacity="0.55"
                animate={{ cy: [by, by - 7, by], opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 1.8, delay: i * 0.28, repeat: Infinity }} />
            : <circle key={i} cx={bx} cy={by} r="4.5" fill={c} opacity="0.38" />
        ))}
        <circle cx="160" cy="110" r="5" fill={c} />
      </svg>
    );
  }

  // ── PATHOLOGY: microscope crosshair + pulsing rings ──
  if (subjectId === 'pathology') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <line x1="25" y1="110" x2="295" y2="110" stroke={c} strokeWidth="1" opacity="0.18" />
        <line x1="160" y1="12" x2="160" y2="208" stroke={c} strokeWidth="1" opacity="0.18" />
        {[28, 52, 78].map((r, i) => (
          !rm
            ? <motion.circle key={i} cx="160" cy="110" r={r} stroke={c} strokeWidth={i === 0 ? 2.2 : 1.4} fill="none"
                animate={{ r: [r, r + 8, r], opacity: [0.55, 0.12, 0.55] }}
                transition={{ duration: 2.8, delay: i * 0.55, repeat: Infinity }} />
            : <circle key={i} cx="160" cy="110" r={r} stroke={c} strokeWidth="1.5" fill="none" opacity="0.3" />
        ))}
        {([[160, 58], [212, 110], [160, 162], [108, 110]] as [number, number][]).map(([nx, ny], i) => (
          <circle key={i} cx={nx} cy={ny} r="5.5" fill={c} opacity="0.55" />
        ))}
        <circle cx="160" cy="110" r="5" fill={c} />
        {!rm && <motion.circle cx="160" cy="110" r="5" stroke={c} strokeWidth="1.5" fill="none"
          animate={{ r: [7, 18, 7], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }} />}
      </svg>
    );
  }

  // ── PSYCHIATRY: EEG brainwave (irregular) ──
  if (subjectId === 'psychiatry') {
    const eeg = "M 0 110 L 18 110 L 22 100 L 26 120 L 30 110 L 42 110 L 46 86 L 52 134 L 56 110 L 66 112 L 70 107 L 74 115 L 78 110 L 88 110 L 94 70 L 100 150 L 106 110 L 116 108 L 120 118 L 124 104 L 128 110 L 142 110 L 146 92 L 152 128 L 158 110 L 172 110 L 178 100 L 182 120 L 186 110 L 198 110 L 202 78 L 208 142 L 212 110 L 222 107 L 226 117 L 232 110 L 243 110 L 247 94 L 253 126 L 258 110 L 275 110 L 280 103 L 285 117 L 290 110 L 320 110";
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <path d={eeg} stroke={c} strokeWidth="1.8" opacity="0.25" strokeLinecap="round" />
        {!rm && <motion.path d={eeg} stroke={c} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray="55 560" initial={{ strokeDashoffset: 560 }} animate={{ strokeDashoffset: -560 }}
          transition={loop(3.8)} />}
      </svg>
    );
  }

  // ── RADIOLOGY: CT scan rotating sweep ──
  if (subjectId === 'radiology') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        {[28, 52, 72, 90].map((r, i) => (
          <circle key={i} cx="160" cy="110" r={r} stroke={c} strokeWidth="1.2" fill="none"
            opacity={[0.5, 0.38, 0.25, 0.14][i]} strokeDasharray={i % 2 === 1 ? '4 5' : undefined} />
        ))}
        {!rm
          ? <motion.g style={{ originX: '160px', originY: '110px' }}
              animate={{ rotate: 360 }} transition={{ duration: 3, ease: 'linear', repeat: Infinity }}>
              <line x1="160" y1="110" x2="160" y2="20" stroke={c} strokeWidth="2.8" opacity="0.75" />
              <path d="M 160 110 L 160 20 A 90 90 0 0 1 204 43 Z" fill={c} opacity="0.07" />
            </motion.g>
          : <line x1="160" y1="110" x2="160" y2="20" stroke={c} strokeWidth="2.5" opacity="0.6" />}
        <circle cx="160" cy="110" r="6" fill={c} />
        {([[160, 20], [250, 110], [160, 200], [70, 110]] as [number, number][]).map(([mx, my], i) => (
          <circle key={i} cx={mx} cy={my} r="3.5" fill={c} opacity="0.45" />
        ))}
      </svg>
    );
  }

  // ── SURGERY: precision crosshair + scanning beam ──
  if (subjectId === 'surgery') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        {([[32, 28], [288, 28], [288, 192], [32, 192]] as [number, number][]).map(([cx, cy], i) => (
          <React.Fragment key={i}>
            <line x1={cx} y1={cy} x2={cx + (i === 0 || i === 3 ? 18 : -18)} y2={cy} stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.48" />
            <line x1={cx} y1={cy} x2={cx} y2={cy + (i < 2 ? 18 : -18)} stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.48" />
          </React.Fragment>
        ))}
        <line x1="52" y1="110" x2="138" y2="110" stroke={c} strokeWidth="1.5" opacity="0.38" />
        <line x1="182" y1="110" x2="268" y2="110" stroke={c} strokeWidth="1.5" opacity="0.38" />
        <line x1="160" y1="32" x2="160" y2="90" stroke={c} strokeWidth="1.5" opacity="0.38" />
        <line x1="160" y1="130" x2="160" y2="188" stroke={c} strokeWidth="1.5" opacity="0.38" />
        <circle cx="160" cy="110" r="22" stroke={c} strokeWidth="2.2" fill="none" opacity="0.48" />
        <circle cx="160" cy="110" r="7" fill={c} opacity="0.8" />
        {!rm && <motion.line x1="52" y1="35" x2="268" y2="35" stroke={c} strokeWidth="2" opacity="0.5"
          animate={{ y1: [35, 185, 35], y2: [35, 185, 35] }}
          transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }} />}
      </svg>
    );
  }

  // ── OPHTHALMOLOGY: iris rings + breathing pupil ──
  if (subjectId === 'ophthalmology') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        {[82, 66, 50, 36].map((r, i) => (
          <circle key={i} cx="160" cy="110" r={r} stroke={c} strokeWidth={[1, 1.4, 1.8, 2.2][i]} fill="none"
            opacity={[0.14, 0.24, 0.38, 0.52][i]} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return <line key={i}
            x1={(160 + 36 * Math.cos(a)).toFixed(1)} y1={(110 + 36 * Math.sin(a)).toFixed(1)}
            x2={(160 + 80 * Math.cos(a)).toFixed(1)} y2={(110 + 80 * Math.sin(a)).toFixed(1)}
            stroke={c} strokeWidth="0.8" opacity="0.18" />;
        })}
        {!rm
          ? <motion.circle cx="160" cy="110" fill="#0A0A0A"
              animate={{ r: [14, 22, 14] }}
              transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }} />
          : <circle cx="160" cy="110" r="17" fill="#0A0A0A" />}
        <circle cx="152" cy="103" r="4.5" fill="white" opacity="0.8" />
        <circle cx="169" cy="119" r="2.2" fill="white" opacity="0.38" />
      </svg>
    );
  }

  // ── ENT: speaker + expanding sound arcs ──
  if (subjectId === 'ent') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <rect x="52" y="94" width="20" height="32" rx="3" fill={c} opacity="0.45" />
        <polygon points="72,94 94,72 94,148 72,126" fill={c} opacity="0.35" />
        {[58, 90, 122, 154].map((r, i) => {
          const x = 94 + r * 0.08;
          return !rm
            ? <motion.path key={i} d={`M ${x},${110 - r * 0.62} A ${r} ${r} 0 0 1 ${x},${110 + r * 0.62}`}
                stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"
                animate={{ opacity: [0.65 - i * 0.1, 0.08, 0.65 - i * 0.1] }}
                transition={{ duration: 1.9, delay: i * 0.27, repeat: Infinity }} />
            : <path key={i} d={`M ${x},${110 - r * 0.62} A ${r} ${r} 0 0 1 ${x},${110 + r * 0.62}`}
                stroke={c} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity={0.58 - i * 0.12} />;
        })}
      </svg>
    );
  }

  // ── OBG: elliptical fetal orbit ──
  if (subjectId === 'obg') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <ellipse cx="160" cy="114" rx="88" ry="72" stroke={c} strokeWidth="2.8" fill="none" opacity="0.28" />
        <circle cx="160" cy="110" r="26" stroke={c} strokeWidth="2" fill="none" opacity="0.38" />
        <circle cx="160" cy="110" r="15" fill={c} opacity="0.52" />
        {!rm && <motion.circle r="8" fill={c2}
          animate={{ cx: [248, 160, 72, 160, 248], cy: [114, 42, 114, 186, 114] }}
          transition={{ duration: 4.5, ease: 'linear', repeat: Infinity }} />}
        <path d="M 58 196 L 76 196 L 80 184 L 86 208 L 92 184 L 96 196 L 262 196"
          stroke={c} strokeWidth="1.8" opacity="0.35" />
      </svg>
    );
  }

  // ── PEDIATRICS: growth curve + traveling dot ──
  if (subjectId === 'pediatrics') {
    const curve = "M 22 192 C 50 188 75 178 95 162 C 115 146 128 128 145 110 C 162 92 172 76 192 62 C 212 48 238 38 305 32";
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <line x1="22" y1="192" x2="310" y2="192" stroke={c} strokeWidth="1.5" opacity="0.25" />
        <line x1="22" y1="12" x2="22" y2="192" stroke={c} strokeWidth="1.5" opacity="0.25" />
        <path d="M 22 200 C 80 196 145 172 305 58" stroke={c} strokeWidth="0.8" opacity="0.10" />
        <path d={curve} stroke={c} strokeWidth="2.2" opacity="0.28" fill="none" />
        {([[22, 192], [95, 162], [145, 110], [192, 62], [305, 32]] as [number, number][]).map(([mx, my], i) => (
          <circle key={i} cx={mx} cy={my} r="4.5" fill={c} opacity="0.42" />
        ))}
        {!rm && <motion.circle r="7" fill={c}
          animate={{ cx: [22, 95, 145, 192, 305, 22], cy: [192, 162, 110, 62, 32, 192] }}
          transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }} />}
      </svg>
    );
  }

  // ── ORTHOPEDICS: joint geometry with ROM arc ──
  if (subjectId === 'orthopedics') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <path d="M 132 18 C 130 50 134 82 160 108" stroke={c} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.28" />
        <path d="M 160 112 C 145 130 138 155 135 202" stroke={c} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.28" />
        <circle cx="160" cy="112" r="20" stroke={c} strokeWidth="2.2" fill="white" opacity="0.75" />
        <circle cx="160" cy="112" r="10" fill={c} opacity="0.42" />
        <line x1="160" y1="112" x2="160" y2="65" stroke={c} strokeWidth="1.2" opacity="0.28" strokeDasharray="4 5" />
        <line x1="160" y1="112" x2="205" y2="112" stroke={c} strokeWidth="1.2" opacity="0.28" strokeDasharray="4 5" />
        {!rm
          ? <motion.path d="M 160 78 A 34 34 0 0 1 194 112" stroke={c2} strokeWidth="3" fill="none" strokeLinecap="round"
              animate={{ rotate: [-22, 22, -22] }}
              style={{ originX: '160px', originY: '112px' }}
              transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }} />
          : <path d="M 160 78 A 34 34 0 0 1 194 112" stroke={c2} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />}
      </svg>
    );
  }

  // ── DERMATOLOGY: fingerprint arcs ──
  if (subjectId === 'dermatology') {
    const arcs = [14, 26, 38, 50, 62, 74, 86, 98, 110];
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        {arcs.map((r, i) => (
          <ellipse key={i} cx={162 + i * 1.5} cy="110" rx={r} ry={r * 0.62}
            stroke={c} strokeWidth="1.5" fill="none" opacity={0.55 - i * 0.04} />
        ))}
        {!rm && <motion.ellipse cx="172" cy="110" rx="38" ry="24" stroke={c2} strokeWidth="2.5" fill="none"
          animate={{ opacity: [0.75, 0.15, 0.75] }}
          transition={{ duration: 2.8, repeat: Infinity }} />}
        <circle cx="162" cy="110" r="3.5" fill={c} />
      </svg>
    );
  }

  // ── FMT: balance scale oscillating ──
  if (subjectId === 'fmt') {
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <line x1="160" y1="55" x2="160" y2="192" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
        <circle cx="160" cy="55" r="9" fill={c} opacity="0.6" />
        <line x1="118" y1="192" x2="202" y2="192" stroke={c} strokeWidth="4.5" strokeLinecap="round" opacity="0.38" />
        {!rm
          ? <motion.g style={{ originX: '160px', originY: '78px' }}
              animate={{ rotate: [-14, 14, -14] }}
              transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}>
              <line x1="68" y1="78" x2="252" y2="78" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <line x1="88" y1="78" x2="88" y2="132" stroke={c} strokeWidth="1.8" opacity="0.38" />
              <ellipse cx="88" cy="142" rx="26" ry="9" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.14" opacity="0.58" />
              <line x1="232" y1="78" x2="232" y2="132" stroke={c} strokeWidth="1.8" opacity="0.38" />
              <ellipse cx="232" cy="142" rx="26" ry="9" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.14" opacity="0.58" />
            </motion.g>
          : <>
              <line x1="68" y1="78" x2="252" y2="78" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <line x1="88" y1="78" x2="88" y2="132" stroke={c} strokeWidth="1.8" opacity="0.38" />
              <ellipse cx="88" cy="142" rx="26" ry="9" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.14" opacity="0.58" />
              <line x1="232" y1="78" x2="232" y2="132" stroke={c} strokeWidth="1.8" opacity="0.38" />
              <ellipse cx="232" cy="142" rx="26" ry="9" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.14" opacity="0.58" />
            </>}
      </svg>
    );
  }

  // ── PSM: rising bar chart ──
  if (subjectId === 'psm') {
    const bars: [number, number][] = [[58, 55], [106, 88], [154, 120], [202, 98], [250, 145]];
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <line x1="32" y1="182" x2="290" y2="182" stroke={c} strokeWidth="1.5" opacity="0.25" />
        <line x1="32" y1="18" x2="32" y2="182" stroke={c} strokeWidth="1.5" opacity="0.25" />
        {bars.map(([bx, bh], i) => (
          !rm
            ? <motion.rect key={i} x={bx - 18} y={182} width="36" rx="4" fill={i === 4 ? c2 : c} opacity="0.65"
                animate={{ y: [182, 182 - bh, 182], height: [0, bh, 0] }}
                transition={{ duration: 2.8, delay: i * 0.28, repeat: Infinity, ease: 'easeOut' }} />
            : <rect key={i} x={bx - 18} y={182 - bh} width="36" height={bh} rx="4" fill={i === 4 ? c2 : c} opacity="0.48" />
        ))}
      </svg>
    );
  }

  // ── ANESTHESIA: square ventilator waveform ──
  if (subjectId === 'anesthesia') {
    const vent = "M 0 150 L 28 150 L 28 68 L 92 68 L 92 150 L 128 150 L 128 68 L 192 68 L 192 150 L 228 150 L 228 68 L 292 68 L 292 150 L 320 150";
    return (
      <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
        <line x1="0" y1="150" x2="320" y2="150" stroke={c} strokeWidth="0.8" opacity="0.12" strokeDasharray="4 9" />
        <path d={vent} stroke={c} strokeWidth="2" opacity="0.22" strokeLinecap="round" strokeLinejoin="round" />
        {!rm && <motion.path d={vent} stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="88 580" initial={{ strokeDashoffset: 580 }} animate={{ strokeDashoffset: -580 }}
          transition={loop(4.2)} />}
      </svg>
    );
  }

  // ── DEFAULT / fallback: smooth sine wave ──
  const defPath = "M 0 110 C 40 52 80 168 120 110 C 160 52 200 168 240 110 C 280 52 305 110 320 110";
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full fill-none overflow-visible">
      <path d={defPath} stroke={c} strokeWidth="2" opacity="0.25" />
      {!rm && <motion.path d={defPath} stroke={c} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray="42 420" initial={{ strokeDashoffset: 420 }} animate={{ strokeDashoffset: -420 }}
        transition={loop(3)} />}
    </svg>
  );
};

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
  isGuest = false,
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
      subtitleColor: circadian.isNight ? 'text-[#5AC8FA]/80' : circadian.subtitleColor,
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
    const primary = focusTheme.ecgStrokeStart || '#60B3FF';
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
      let statusClass = 'text-[#007AFF] bg-[#e6f0ee] border-[#cfe2df]';
      if (percentage < 30) {
        statusText = 'Needs focus';
        statusClass = 'text-[#92400e] bg-[#fef3c7] border-[#fde68a]';
      } else if (percentage >= 60) {
        statusText = 'On track';
        statusClass = 'text-[#007AFF] bg-[#e6f0ee] border-[#cfe2df]';
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
    <div className="relative min-h-screen text-[#1D1D1F] pb-12">

      {/* ── Search bar: always clean light, sticky at top ── */}
      <motion.div
        initial={false}
        animate={{
          y: isHeaderVisible || isAtTop ? 0 : -80,
          opacity: isHeaderVisible || isAtTop ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`sticky z-30 py-2 sm:py-2.5 bg-[#F2F2F7]/95 backdrop-blur-3xl relative ${
          isGuest ? 'top-[46px]' : 'top-0'
        }`}
      >
        <div className="px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">

          {/* ── Search bar ── */}
          <div className="relative flex-1 w-full lg:max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search subjects, topics, questions…"
              aria-label="Search topics"
              className="w-full pl-10 pr-16 h-11 rounded-2xl text-sm focus:outline-none bg-white hover:bg-white focus:bg-white text-[#1D1D1F] placeholder:text-[#8E8E93] border border-[rgba(60,60,67,0.10)] focus:border-[#007AFF]/40 focus:ring-2 focus:ring-[#007AFF]/12 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#C7C7CC] flex items-center justify-center text-white hover:bg-[#8E8E93] cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium bg-[rgba(60,60,67,0.06)] border border-[rgba(60,60,67,0.10)] text-[#8E8E93] pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1.5 shrink-0">
            <AmbientSoundWidget onOpenZenFocus={onOpenZenFocus} isDark={false} />
            <button
              type="button"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-all bg-white hover:bg-[#F2F2F7] text-[#3A3A3C] border border-[rgba(60,60,67,0.10)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4 stroke-[1.7]" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3B30]" />
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden sm:flex items-center gap-2 h-10 pl-1 pr-3 rounded-full bg-white hover:bg-[#F2F2F7] border border-[rgba(60,60,67,0.10)] shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer group transition-all"
              title="Doctor Profile"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-[0_2px_8px_rgba(0,122,255,0.40)]">
                {initials}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#8E8E93] group-hover:text-[#007AFF] transition-colors" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Live Search Autocomplete Popup — absolute so it floats over content */}
      <AnimatePresence>
        {isSearchOpen && searchResults.length > 0 && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={SECTION_TRANSITION(reducedMotion)}
            className="absolute left-0 right-0 z-[35] px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto"
            style={{ top: 'calc(100% + 4px)' }}
          >
          <div className="bg-white/98 backdrop-blur-3xl rounded-3xl border border-[rgba(60,60,67,0.10)] shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] p-4 space-y-2"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(60,60,67,0.06)]">
              <span className="text-xs font-semibold text-[#6E6E73]">
                Matching Blueprint Topics
              </span>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs text-[#8E8E93] hover:text-[#1D1D1F] cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {searchResults.map(({ subject, topic }) => (
                <div
                  key={`${subject.id}-${topic.id}`}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F2F2F7] border border-[rgba(60,60,67,0.06)] transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[11px] font-semibold text-[#007AFF] block">{subject.name}</span>
                    <span className="text-xs font-semibold text-[#1D1D1F] truncate block">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsSearchOpen(false); setActiveMasteryTopic({ subjectId: subject.id, topicId: topic.id, topicName: topic.name }); }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[#007AFF] text-white rounded-lg hover:bg-[#0056CC] transition-colors cursor-pointer"
                    >
                      Study
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsSearchOpen(false); onLaunchPracticeSession?.(subject.id, topic.id, topic.name); }}
                      className="px-2 py-1 text-[11px] font-semibold text-[#6E6E73] border border-[rgba(60,60,67,0.12)] rounded-lg hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                    >
                      10 MCQs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero card: contained rounded card with light blue gradient ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        <div
          className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(0,100,220,0.14),0_2px_8px_rgba(0,0,0,0.06)]"
          style={{ background: 'linear-gradient(135deg, #EEF5FF 0%, #DDEEFF 35%, #C8E0FF 65%, #A8CCFF 100%)' }}
        >
          {/* Vertical accent text — far right, desktop only */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-0.5 pointer-events-none select-none z-20">
            {['FOCUSED', 'PRACTICE', 'DEEPER', 'UNDERSTANDING'].map((word) => (
              <span key={word} className="text-[7px] font-bold text-[#007AFF]/25 tracking-[0.18em] uppercase">{word}</span>
            ))}
          </div>

          {/* Card content */}
          <div className="relative z-10 p-5 sm:p-6 lg:p-8">

            {/* Top bar: greeting + Circadian Focus */}
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#007AFF]">
                  <GreetingIcon className="h-3.5 w-3.5 stroke-[2.4]" />
                  <span>{greeting},</span>
                </div>
                <span className="text-[#C7C7CC]">·</span>
                <span className="text-[12px] font-semibold hidden sm:inline text-[#8E8E93]">OneShot FMGE</span>
              </div>
              <CircadianFocusDropdown circadian={circadian} align="right" isDark={false} />
            </div>

            {/* Main content: name + illustration */}
            <div className="flex flex-col md:flex-row md:items-center gap-5 lg:gap-8">

              {/* Left: name + subtitle + creed */}
              <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                <h1 className="text-[44px] sm:text-[56px] lg:text-[68px] font-black tracking-[-0.045em] leading-[0.88] text-[#1D1D1F] line-clamp-2 break-words">
                  {userName.startsWith('Dr.') ? (
                    <>
                      <span className="text-[#007AFF]">Dr. </span>
                      <span>{userName.replace(/^Dr\.\s*/, '')}</span>
                    </>
                  ) : (
                    <span>{userName}</span>
                  )}
                </h1>
                <p className="text-[15px] sm:text-[16px] leading-snug font-medium text-[#3C3C43] max-w-sm">
                  Consistent study today builds the doctor you&apos;ll be tomorrow.
                </p>

                {/* Creed card — white glass */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  onClick={shuffleCreed}
                  title="Click to shuffle motivation"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') shuffleCreed(); }}
                  className="inline-flex items-start gap-3 rounded-2xl px-4 py-3 cursor-pointer select-none group bg-white/75 hover:bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 max-w-[320px]"
                >
                  <div className="h-9 w-12 shrink-0 relative flex items-center justify-center mt-0.5">
                    <AnimatedMountainInsignia
                      phase={doctorCreed.phase === 'all' ? timeOfDay : (doctorCreed.phase || timeOfDay)}
                      creedId={doctorCreed.id}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#1D1D1F] leading-snug line-clamp-2">
                      &ldquo;{doctorCreed.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-[#8E8E93] tracking-wide truncate">
                        {doctorCreed.tagline}
                      </span>
                      <RotateCcw
                        className={`h-3 w-3 text-[#C7C7CC] group-hover:text-[#007AFF] transition-all duration-300 shrink-0 ${
                          isCreedShuffling ? 'rotate-180' : 'group-hover:-rotate-90'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right: circadian-reactive anime character */}
              {(() => {
                const phase = circadian.timeOfDay;
                const isAuto = circadian.themeSetting === 'auto';
                const phaseConfig = {
                  morning:   { color: '#FF9500', colorRgb: '255,149,0',  chipLabel: 'Dawn Session',  chipSub: 'Peak alertness window' },
                  afternoon: { color: '#007AFF', colorRgb: '0,122,255',  chipLabel: 'Zenith Focus',  chipSub: 'Deep work zone' },
                  evening:   { color: '#FF6B35', colorRgb: '255,107,53', chipLabel: 'Dusk Review',   chipSub: 'Consolidate today' },
                  night:     { color: '#BF5AF2', colorRgb: '191,90,242', chipLabel: 'Night Mode',    chipSub: 'Memory encoding' },
                } as const;
                const cfg = phaseConfig[phase] ?? phaseConfig.afternoon;
                const c = cfg.color;
                const cr = cfg.colorRgb;
                const rm = reducedMotion ?? false;

                /* shared character parts */

                return (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phase}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                      className="relative w-full md:w-[240px] lg:w-[280px] h-[210px] sm:h-[240px] shrink-0 flex items-end justify-center select-none pointer-events-none lg:mr-4"
                    >
                      {/* ── PHASE FOCUS ORB ── */}
                      <svg viewBox="0 0 300 240" className="w-full h-full" fill="none" overflow="visible" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          {/* Skin gradient */}
                          <radialGradient id={`skin-${phase}`} cx="45%" cy="38%" r="60%">
                            <stop offset="0%" stopColor="#FFE4C8"/>
                            <stop offset="100%" stopColor="#FFCBA4"/>
                          </radialGradient>
                          {/* Hair gradient */}
                          <radialGradient id={`hair-${phase}`} cx="50%" cy="30%" r="65%">
                            <stop offset="0%" stopColor={c}/>
                            <stop offset="100%" stopColor={`rgba(${cr},0.75)`}/>
                          </radialGradient>
                          {/* Iris gradient */}
                          <radialGradient id={`iris-${phase}`} cx="35%" cy="30%" r="65%">
                            <stop offset="0%" stopColor={c}/>
                            <stop offset="100%" stopColor={`rgba(${cr},0.6)`}/>
                          </radialGradient>
                          {/* Clothing gradient */}
                          <linearGradient id={`cloth-${phase}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={`rgba(${cr},0.30)`}/>
                            <stop offset="100%" stopColor={`rgba(${cr},0.15)`}/>
                          </linearGradient>
                        </defs>

                        {/* ─── shared defs ─── */}
                        <defs>
                          <radialGradient id={`orb-core-${phase}`} cx="38%" cy="32%" r="65%">
                            <stop offset="0%"   stopColor={phase==='morning'?'#FFE878':phase==='afternoon'?'#80D8FF':phase==='evening'?'#FFCB80':'#DDA0FF'}/>
                            <stop offset="45%"  stopColor={c} stopOpacity="0.92"/>
                            <stop offset="100%" stopColor={phase==='morning'?'#A84400':phase==='afternoon'?'#001F66':phase==='evening'?'#7A2200':'#3A0060'} stopOpacity="0.95"/>
                          </radialGradient>
                          <radialGradient id={`orb-glow-${phase}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%"  stopColor={c} stopOpacity="0.35"/>
                            <stop offset="100%" stopColor={c} stopOpacity="0"/>
                          </radialGradient>
                          <radialGradient id={`orb-rim-${phase}`} cx="72%" cy="68%" r="45%">
                            <stop offset="0%"  stopColor={phase==='morning'?'#FF6B00':phase==='afternoon'?'#0033AA':phase==='evening'?'#CC3300':'#6600CC'} stopOpacity="0.55"/>
                            <stop offset="100%" stopColor="transparent"/>
                          </radialGradient>
                          <filter id={`blur-glow-${phase}`} x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="14"/>
                          </filter>
                          <filter id={`blur-sm-${phase}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3"/>
                          </filter>
                          <filter id={`blur-xs-${phase}`} x="-10%" y="-10%" width="120%" height="120%">
                            <feGaussianBlur stdDeviation="1.5"/>
                          </filter>
                        </defs>

                        {/* ─── MORNING: golden dawn ─── */}
                        {phase === 'morning' && (<g>
                          {/* Deep amber background atmosphere */}
                          <ellipse cx="185" cy="118" rx="130" ry="105" fill={`rgba(${cr},0.07)`}/>
                          {/* Soft outer halo */}
                          <circle cx="185" cy="112" r="105" fill={`url(#orb-glow-${phase})`} filter={`url(#blur-glow-${phase})`}/>

                          {/* Sun rays — 12 tapering golden beams */}
                          {Array.from({length:18},(_,i)=>{
                            const ang=(i*20)*Math.PI/180;
                            const len=52+( i%3===0?20:i%3===1?10:0);
                            const w=i%3===0?2.8:i%3===1?1.8:1.2;
                            return <line key={i}
                              x1={185+Math.cos(ang)*79} y1={112+Math.sin(ang)*79}
                              x2={185+Math.cos(ang)*(79+len)} y2={112+Math.sin(ang)*(79+len)}
                              stroke={c} strokeWidth={w} strokeLinecap="round" opacity={i%3===0?0.55:0.30}
                              style={rm?{}:{animation:`pulse ${2.2+(i%4)*0.4}s ease-in-out infinite ${i*0.08}s`}}/>;
                          })}

                          {/* Orbit ring 1 — tilted ellipse */}
                          <ellipse cx="185" cy="112" rx="95" ry="34" stroke={`rgba(${cr},0.05)`} strokeWidth="1"
                            strokeDasharray="8 6" transform="rotate(-28,185,112)"
                            style={rm?{}:{animation:'orbRotate1 12s linear infinite'}}/>
                          {/* Orbit ring 2 */}
                          <ellipse cx="185" cy="112" rx="88" ry="28" stroke={`rgba(${cr},0.04)`} strokeWidth="0.8"
                            strokeDasharray="5 8" transform="rotate(42,185,112)"
                            style={rm?{}:{animation:'orbRotate2 18s linear infinite'}}/>

                          {/* Travelling dot on orbit 1 */}
                          {!rm && <circle r="4.5" fill={c} opacity="0.80" filter={`url(#blur-xs-${phase})`}>
                            <animateMotion dur="12s" repeatCount="indefinite">
                              <mpath href="#orb-path-m"/>
                            </animateMotion>
                          </circle>}
                          <path id="orb-path-m" d="M280,112 A95,34 0 1,1 279.99,112" transform="rotate(-28,185,112)" fill="none"/>

                          {/* Main orb — 3D shaded sphere */}
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-rim-${phase})`}/>
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-core-${phase})`}/>
                          {/* Specular highlight */}
                          <ellipse cx="162" cy="89" rx="22" ry="16" fill="white" opacity="0.28"/>
                          <ellipse cx="158" cy="85" rx="10" ry="7" fill="white" opacity="0.22"/>
                          {/* Secondary rim glow */}

                          {/* Inner symbol: medical cross + circle */}
                          <circle cx="185" cy="112" r="28" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"/>
                          <rect x="181" y="96" width="8" height="32" rx="4" fill="rgba(255,255,255,0.28)"/>
                          <rect x="169" y="108" width="32" height="8" rx="4" fill="rgba(255,255,255,0.28)"/>
                          {/* Pulse ring inside */}
                          {!rm && <circle cx="185" cy="112" r="20" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" fill="none">
                            <animate attributeName="r" values="20;32;20" dur="2.4s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.30;0;0.30" dur="2.4s" repeatCount="indefinite"/>
                          </circle>}

                          {/* Floating pill badges */}
                          <g style={rm?{}:{animation:'heroFloat 3.5s ease-in-out infinite 0.3s'}}>
                            <rect x="36" y="70" width="94" height="22" rx="11" fill="rgba(255,255,255,0.82)" stroke={`rgba(${cr},0.25)`} strokeWidth="1"/>
                            <circle cx="50" cy="81" r="6" fill={c} opacity="0.80"/>
                            <text x="62" y="85" fontSize="10" fontWeight="700" fill="#1D1D1F">Dawn Focus</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 4s ease-in-out infinite 1.2s'}}>
                            <rect x="24" y="130" width="102" height="22" rx="11" fill="rgba(255,255,255,0.78)" stroke={`rgba(${cr},0.22)`} strokeWidth="1"/>
                            <text x="32" y="145" fontSize="10" fontWeight="600" fill={c}>Peak Alertness</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 3.8s ease-in-out infinite 2s'}}>
                            <rect x="40" y="168" width="72" height="20" rx="10" fill="rgba(255,255,255,0.75)" stroke={`rgba(${cr},0.20)`} strokeWidth="1"/>
                            <text x="50" y="182" fontSize="10" fontWeight="600" fill="#3A3A3C">05:00–12:00</text>
                          </g>

                          {/* Particle sparks */}
                          {[[100,52],[250,82],[68,155],[262,158],[130,200],[228,196]].map(([px,py],i)=>(
                            <circle key={i} cx={px} cy={py} r={i%2===0?3:2} fill={c} opacity={0.50-i*0.05}
                              style={rm?{}:{animation:`pulse ${1.8+i*0.4}s ease-in-out infinite ${i*0.3}s`}}/>
                          ))}

                          {/* ECG strip at base */}
                          <path d="M14 226 L48 226 L56 212 L64 238 L72 196 L82 226 L100 226 L108 218 L113 231 L119 226 L275 226"
                            stroke={`rgba(${cr},0.42)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={rm?{}:{strokeDasharray:460,strokeDashoffset:460,animation:'ecgDraw 2.2s ease-out 0.5s forwards'}}/>
                          {!rm && <circle cx="82" cy="226" r="3" fill={c}><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/><animate attributeName="r" values="3;5;3" dur="1.4s" repeatCount="indefinite"/></circle>}
                        </g>)}

                        {/* ─── AFTERNOON: electric blue peak-focus sphere ─── */}
                        {phase === 'afternoon' && (<g>
                          {/* Electric field atmosphere */}
                          <ellipse cx="185" cy="118" rx="130" ry="105" fill={`rgba(${cr},0.06)`}/>
                          <circle cx="185" cy="112" r="112" fill={`url(#orb-glow-${phase})`} filter={`url(#blur-glow-${phase})`}/>

                          {/* Grid lines — focus / matrix vibe */}
                          {[75,100,125,150,175,200,225,250,275].map(x=>(
                            <line key={x} x1={x} y1="12" x2={x} y2="232" stroke={`rgba(${cr},0.06)`} strokeWidth="1"/>
                          ))}
                          {[35,65,95,125,155,185,215].map(y=>(
                            <line key={y} x1="14" y1={y} x2="285" y2={y} stroke={`rgba(${cr},0.06)`} strokeWidth="1"/>
                          ))}

                          {/* Arc rings — sharp energy rings */}
                          {[102,88,74].map((r2,i)=>(
                            <circle key={i} cx="185" cy="112" r={r2} stroke={`rgba(${cr},${0.05-i*0.01})`} strokeWidth={1-i*0.2}
                              strokeDasharray={i===0?"260 60":i===1?"200 55":"140 50"}
                              style={rm?{}:{animation:`orbRotate${i%2===0?'1':'2'} ${8+i*4}s linear infinite`}}/>
                          ))}

                          {/* Travelling energy nodes */}
                          {!rm && [0,1].map(i=>(
                            <g key={i}>
                              <circle r="5" fill={c} filter={`url(#blur-xs-${phase})`}>
                                <animateMotion dur={`${9+i*5}s`} repeatCount="indefinite" begin={`${i*4}s`}>
                                  <mpath href={`#af-path-${i}`}/>
                                </animateMotion>
                              </circle>
                              <path id={`af-path-${i}`} d={i===0?"M287,112 A102,102 0 1,1 286.99,112":"M273,112 A88,88 0 1,0 272.99,112"} fill="none"/>
                            </g>
                          ))}

                          {/* Orb */}
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-rim-${phase})`}/>
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-core-${phase})`}/>
                          <ellipse cx="162" cy="89" rx="22" ry="16" fill="white" opacity="0.24"/>
                          <ellipse cx="158" cy="84" rx="9" ry="6" fill="white" opacity="0.20"/>

                          {/* Brain silhouette inside orb */}
                          <g opacity="0.22" transform="translate(165,92) scale(0.82)">
                            <path d="M25 35 Q10 30 8 18 Q6 5 18 4 Q22 3 26 7 Q30 3 36 5 Q44 3 46 12 Q50 10 52 16 Q56 22 50 28 Q54 34 50 40 Q46 46 40 44 Q36 50 28 48 Q20 50 16 44 Q10 42 10 36 Z" fill="white"/>
                          </g>
                          {/* Focus spark lines inside orb */}
                          {[[185,88],[185,136],[162,112],[208,112]].map(([x,y],i)=>(
                            <line key={i} x1={185} y1={112} x2={x} y2={y} stroke="rgba(255,255,255,0.22)" strokeWidth="1"
                              style={rm?{}:{animation:`pulse ${2+i*0.5}s ease-in-out infinite ${i*0.4}s`}}/>
                          ))}
                          {!rm && <circle cx="185" cy="112" r="22" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" fill="none">
                            <animate attributeName="r" values="22;36;22" dur="2s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.28;0;0.28" dur="2s" repeatCount="indefinite"/>
                          </circle>}

                          {/* Floating pill badges */}
                          <g style={rm?{}:{animation:'heroFloat 3.5s ease-in-out infinite'}}>
                            <rect x="34" y="62" width="100" height="22" rx="11" fill="rgba(255,255,255,0.85)" stroke={`rgba(${cr},0.25)`} strokeWidth="1"/>
                            <circle cx="48" cy="73" r="6" fill={c} opacity="0.85"/>
                            <text x="60" y="77" fontSize="10" fontWeight="700" fill="#1D1D1F">Zenith Focus</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 4.2s ease-in-out infinite 1.5s'}}>
                            <rect x="22" y="128" width="100" height="22" rx="11" fill="rgba(255,255,255,0.80)" stroke={`rgba(${cr},0.22)`} strokeWidth="1"/>
                            <text x="30" y="143" fontSize="10" fontWeight="600" fill={c}>Deep Work Zone</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 3.6s ease-in-out infinite 0.8s'}}>
                            <rect x="38" y="170" width="72" height="20" rx="10" fill="rgba(255,255,255,0.75)" stroke={`rgba(${cr},0.20)`} strokeWidth="1"/>
                            <text x="46" y="184" fontSize="10" fontWeight="600" fill="#3A3A3C">12:00–17:00</text>
                          </g>

                          {/* Corner sparks */}
                          {[[60,40],[280,55],[38,195],[265,205],[155,22]].map(([px,py],i)=>(
                            <g key={i} style={rm?{}:{animation:`pulse ${1.5+i*0.35}s ease-in-out infinite ${i*0.25}s`}}>
                              <circle cx={px} cy={py} r={3-i*0.3} fill={c} opacity={0.55-i*0.06}/>
                              <circle cx={px} cy={py} r={6-i*0.5} fill={c} opacity={0.12} filter={`url(#blur-xs-${phase})`}/>
                            </g>
                          ))}

                          {/* ECG */}
                          <path d="M14 226 L48 226 L56 212 L64 238 L72 196 L82 226 L100 226 L108 218 L113 231 L119 226 L275 226"
                            stroke={`rgba(${cr},0.42)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={rm?{}:{strokeDasharray:460,strokeDashoffset:460,animation:'ecgDraw 2.2s ease-out 0.5s forwards'}}/>
                          {!rm && <circle cx="82" cy="226" r="3" fill={c}><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/><animate attributeName="r" values="3;5;3" dur="1.2s" repeatCount="indefinite"/></circle>}
                        </g>)}

                        {/* ─── EVENING: warm ember glow sphere ─── */}
                        {phase === 'evening' && (<g>
                          {/* Warm haze */}
                          <ellipse cx="185" cy="130" rx="140" ry="100" fill={`rgba(${cr},0.07)`}/>
                          <circle cx="185" cy="112" r="100" fill={`url(#orb-glow-${phase})`} filter={`url(#blur-glow-${phase})`}/>

                          {/* Concentric fade rings — settling energy */}
                          {[110,95,80].map((r2,i)=>(
                            <circle key={i} cx="185" cy="112" r={r2} stroke={`rgba(${cr},${0.18-i*0.04})`} strokeWidth={3-i*0.5} fill="none"
                              style={rm?{}:{animation:`pulse ${3.5+i*1.2}s ease-in-out infinite ${i*0.6}s`}}/>
                          ))}

                          {/* Curved sweep arcs — like a setting sun horizon */}
                          <path d="M80 155 Q185 210 290 155" stroke={`rgba(${cr},0.18)`} strokeWidth="2" fill="none" strokeLinecap="round"/>
                          <path d="M95 170 Q185 225 275 170" stroke={`rgba(${cr},0.12)`} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M110 185 Q185 235 260 185" stroke={`rgba(${cr},0.08)`} strokeWidth="1" fill="none" strokeLinecap="round"/>

                          {/* Orbit arc — single gentle sweep */}
                          <ellipse cx="185" cy="112" rx="96" ry="32" stroke={`rgba(${cr},0.05)`} strokeWidth="0.8"
                            strokeDasharray="220 100" transform="rotate(15,185,112)"
                            style={rm?{}:{animation:'orbRotate2 20s linear infinite'}}/>

                          {/* Floating ember particles */}
                          {[[88,185],[114,198],[155,208],[210,202],[244,190],[268,178]].map(([px,py],i)=>(
                            <circle key={i} cx={px} cy={py} r={2.5+i*0.3} fill={c} opacity={0.35+i*0.05}
                              style={rm?{}:{animation:`noteFloat ${3+i*0.6}s ease-in-out infinite ${i*0.4}s`}}/>
                          ))}

                          {/* Orb */}
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-rim-${phase})`}/>
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-core-${phase})`}/>
                          <ellipse cx="162" cy="89" rx="22" ry="16" fill="white" opacity="0.26"/>
                          <ellipse cx="158" cy="85" rx="9" ry="6" fill="white" opacity="0.20"/>

                          {/* Open book silhouette inside */}
                          <g opacity="0.22" transform="translate(160,95) scale(1.0)">
                            <path d="M25 30 Q27 18 38 18 L54 20 L54 44 L28 44 Z" fill="white"/>
                            <path d="M54 20 L68 18 Q80 18 82 30 L82 44 L54 44 Z" fill="white" opacity="0.70"/>
                            <line x1="54" y1="20" x2="54" y2="44" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5"/>
                          </g>
                          {!rm && <circle cx="185" cy="112" r="24" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none">
                            <animate attributeName="r" values="24;38;24" dur="3s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" repeatCount="indefinite"/>
                          </circle>}

                          {/* Badges */}
                          <g style={rm?{}:{animation:'heroFloat 4s ease-in-out infinite'}}>
                            <rect x="34" y="65" width="96" height="22" rx="11" fill="rgba(255,255,255,0.84)" stroke={`rgba(${cr},0.25)`} strokeWidth="1"/>
                            <circle cx="48" cy="76" r="6" fill={c} opacity="0.80"/>
                            <text x="60" y="80" fontSize="10" fontWeight="700" fill="#1D1D1F">Dusk Review</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 3.8s ease-in-out infinite 1s'}}>
                            <rect x="22" y="130" width="116" height="22" rx="11" fill="rgba(255,255,255,0.80)" stroke={`rgba(${cr},0.22)`} strokeWidth="1"/>
                            <text x="30" y="145" fontSize="10" fontWeight="600" fill={c}>Consolidate Today</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 3.4s ease-in-out infinite 2s'}}>
                            <rect x="40" y="170" width="72" height="20" rx="10" fill="rgba(255,255,255,0.75)" stroke={`rgba(${cr},0.20)`} strokeWidth="1"/>
                            <text x="46" y="184" fontSize="10" fontWeight="600" fill="#3A3A3C">17:00–21:00</text>
                          </g>

                          {/* ECG */}
                          <path d="M14 226 L48 226 L56 212 L64 238 L72 196 L82 226 L100 226 L108 218 L113 231 L119 226 L275 226"
                            stroke={`rgba(${cr},0.42)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={rm?{}:{strokeDasharray:460,strokeDashoffset:460,animation:'ecgDraw 2.4s ease-out 0.5s forwards'}}/>
                          {!rm && <circle cx="82" cy="226" r="3" fill={c}><animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite"/><animate attributeName="r" values="3;5;3" dur="1.6s" repeatCount="indefinite"/></circle>}
                        </g>)}

                        {/* ─── NIGHT: deep-space aurora memory sphere ─── */}
                        {phase === 'night' && (<g>
                          {/* Space atmosphere */}
                          <ellipse cx="185" cy="112" rx="145" ry="115" fill={`rgba(${cr},0.06)`}/>
                          <circle cx="185" cy="112" r="115" fill={`url(#orb-glow-${phase})`} filter={`url(#blur-glow-${phase})`}/>

                          {/* Stars */}
                          {[[30,22,2.5],[58,15,1.8],[100,10,3],[148,18,2],[195,12,2.8],[240,20,1.6],[272,38,2.2],[285,75,1.8],[275,140,2],[262,175,1.5],[38,155,2.2],[22,100,1.8],[50,68,1.5]].map(([sx,sy,sr],i)=>(
                            <circle key={i} cx={sx} cy={sy} r={sr} fill={c} opacity={0.65}
                              style={rm?{}:{animation:`pulse ${1.6+i*0.28}s ease-in-out infinite ${i*0.22}s`}}/>
                          ))}

                          {/* Aurora bands — flowing curved streaks */}
                          <path d="M14 82 Q80 55 150 72 Q210 88 280 62" stroke={`rgba(${cr},0.22)`} strokeWidth="3.5" fill="none" strokeLinecap="round"
                            style={rm?{}:{animation:'aurora1 8s ease-in-out infinite'}}/>
                          <path d="M14 98 Q90 70 165 88 Q228 104 280 78" stroke={`rgba(${cr},0.14)`} strokeWidth="2.5" fill="none" strokeLinecap="round"
                            style={rm?{}:{animation:'aurora1 10s ease-in-out infinite 1.5s'}}/>
                          <path d="M14 68 Q70 48 140 58 Q200 68 280 48" stroke="rgba(200,100,255,0.12)" strokeWidth="2" fill="none" strokeLinecap="round"
                            style={rm?{}:{animation:'aurora2 12s ease-in-out infinite 3s'}}/>

                          {/* Orbit rings */}
                          <ellipse cx="185" cy="112" rx="100" ry="36" stroke={`rgba(${cr},0.05)`} strokeWidth="0.8"
                            strokeDasharray="6 8" transform="rotate(-22,185,112)"
                            style={rm?{}:{animation:'orbRotate2 24s linear infinite'}}/>
                          <ellipse cx="185" cy="112" rx="90" ry="28" stroke={`rgba(${cr},0.03)`} strokeWidth="0.6"
                            strokeDasharray="4 10" transform="rotate(50,185,112)"
                            style={rm?{}:{animation:'orbRotate1 32s linear infinite'}}/>

                          {/* Slow-traveling moon particle */}
                          {!rm && <circle r="5.5" fill={c} opacity="0.75" filter={`url(#blur-xs-${phase})`}>
                            <animateMotion dur="24s" repeatCount="indefinite">
                              <mpath href="#night-orb-path"/>
                            </animateMotion>
                          </circle>}
                          <path id="night-orb-path" d="M285,112 A100,36 0 1,1 284.99,112" transform="rotate(-22,185,112)" fill="none"/>

                          {/* Orb */}
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-rim-${phase})`}/>
                          <circle cx="185" cy="112" r="76" fill={`url(#orb-core-${phase})`}/>
                          <ellipse cx="162" cy="89" rx="22" ry="16" fill="white" opacity="0.22"/>
                          <ellipse cx="158" cy="84" rx="9" ry="6" fill="white" opacity="0.18"/>

                          {/* Moon crescent inside orb */}
                          <circle cx="185" cy="112" r="28" fill={`rgba(${cr},0.22)`}/>
                          <circle cx="196" cy="107" r="22" fill={`url(#orb-core-${phase})`} opacity="0.85"/>
                          {/* Small stars inside orb */}
                          {[[175,100],[196,122],[188,96],[172,118]].map(([sx,sy],i)=>(
                            <circle key={i} cx={sx} cy={sy} r={i===0?2.5:1.8} fill="white" opacity={0.55+i*0.08}
                              style={rm?{}:{animation:`pulse ${1.8+i*0.5}s ease-in-out infinite ${i*0.35}s`}}/>
                          ))}
                          {!rm && <circle cx="185" cy="112" r="26" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" fill="none">
                            <animate attributeName="r" values="26;40;26" dur="3.5s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.22;0;0.22" dur="3.5s" repeatCount="indefinite"/>
                          </circle>}

                          {/* Badges */}
                          <g style={rm?{}:{animation:'heroFloat 4.5s ease-in-out infinite'}}>
                            <rect x="34" y="65" width="96" height="22" rx="11" fill="rgba(255,255,255,0.80)" stroke={`rgba(${cr},0.25)`} strokeWidth="1"/>
                            <circle cx="48" cy="76" r="6" fill={c} opacity="0.80"/>
                            <text x="60" y="80" fontSize="10" fontWeight="700" fill="#1D1D1F">Deep Study</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 5s ease-in-out infinite 1.8s'}}>
                            <rect x="22" y="130" width="108" height="22" rx="11" fill="rgba(255,255,255,0.76)" stroke={`rgba(${cr},0.22)`} strokeWidth="1"/>
                            <text x="30" y="145" fontSize="10" fontWeight="600" fill={c}>Memory Encoding</text>
                          </g>
                          <g style={rm?{}:{animation:'heroFloat 4.2s ease-in-out infinite 0.6s'}}>
                            <rect x="40" y="170" width="72" height="20" rx="10" fill="rgba(255,255,255,0.72)" stroke={`rgba(${cr},0.18)`} strokeWidth="1"/>
                            <text x="46" y="184" fontSize="10" fontWeight="600" fill="#3A3A3C">21:00–05:00</text>
                          </g>

                          {/* ECG */}
                          <path d="M14 226 L48 226 L56 212 L64 238 L72 196 L82 226 L100 226 L108 218 L113 231 L119 226 L275 226"
                            stroke={`rgba(${cr},0.38)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={rm?{}:{strokeDasharray:460,strokeDashoffset:460,animation:'ecgDraw 2.6s ease-out 0.5s forwards'}}/>
                          {!rm && <circle cx="82" cy="226" r="3" fill={c}><animate attributeName="opacity" values="1;0.15;1" dur="2s" repeatCount="indefinite"/><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle>}
                        </g>)}

                      </svg>

                    </motion.div>
                  </AnimatePresence>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat tiles: clean spacing below hero card ── */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            {/* Widget 1: Days to FMGE */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -5, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => handleSubTabChange('planner')}
              className="group flex flex-col rounded-3xl p-4 sm:p-5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(255,149,0,0.20)] min-h-[120px] sm:min-h-[140px] cursor-pointer transition-all duration-200 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8EC] via-white to-white pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <div className="h-9 w-9 rounded-2xl bg-[#FF9500] text-white flex items-center justify-center shrink-0 group-hover:scale-[1.08] transition-transform duration-200 shadow-[0_2px_10px_rgba(255,149,0,0.40)]">
                  <Calendar className="h-[18px] w-[18px] stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#FF9500] bg-[#FF9500]/10 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <div className="relative mt-auto pt-3">
                <div className="text-[44px] sm:text-[52px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#1D1D1F]">
                  <AnimatedNumber value={daysRemaining} />
                </div>
                <span className="block text-[13px] sm:text-[14px] font-medium text-[#6E6E73] mt-1.5">days to FMGE</span>
              </div>
            </motion.div>

            {/* Widget 2: Target Score */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -5, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => setIsPassingGapModalOpen(true)}
              className="group flex flex-col rounded-3xl p-4 sm:p-5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,122,255,0.20)] min-h-[120px] sm:min-h-[140px] cursor-pointer transition-all duration-200 relative overflow-hidden"
              title="Click to view 150/300 Passing Score Gap Analysis"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#EBF4FF] via-white to-white pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <div className="h-9 w-9 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 group-hover:scale-[1.08] transition-transform duration-200 shadow-[0_2px_10px_rgba(0,122,255,0.40)]">
                  <Target className="h-[18px] w-[18px] stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">Pass 150</span>
              </div>
              <div className="relative mt-auto pt-3">
                <div className="text-[44px] sm:text-[52px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#1D1D1F]">
                  {savedTargetScore ?? 200}+
                </div>
                <span className="block text-[13px] sm:text-[14px] font-medium text-[#6E6E73] mt-1.5">Target Score</span>
              </div>
            </motion.div>

            {/* Widget 3: Subjects */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -5, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => onNavigateTab('syllabus')}
              className="group flex flex-col rounded-3xl p-4 sm:p-5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(175,82,222,0.20)] min-h-[120px] sm:min-h-[140px] cursor-pointer transition-all duration-200 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#F5EEFF] via-white to-white pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <div className="h-9 w-9 rounded-2xl bg-[#AF52DE] text-white flex items-center justify-center shrink-0 group-hover:scale-[1.08] transition-transform duration-200 shadow-[0_2px_10px_rgba(175,82,222,0.40)]">
                  <BookOpen className="h-[18px] w-[18px] stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#AF52DE] bg-[#AF52DE]/10 px-2 py-0.5 rounded-full">NBE Core</span>
              </div>
              <div className="relative mt-auto pt-3">
                <div className="text-[44px] sm:text-[52px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#1D1D1F]">
                  19
                </div>
                <span className="block text-[13px] sm:text-[14px] font-medium text-[#6E6E73] mt-1.5">Subjects</span>
              </div>
            </motion.div>

            {/* Widget 4: Study Streak */}
            <motion.div
              whileHover={reducedMotion ? undefined : { y: -5, scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => onNavigateTab('progress')}
              className="group flex flex-col rounded-3xl p-4 sm:p-5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(48,209,88,0.20)] min-h-[120px] sm:min-h-[140px] cursor-pointer transition-all duration-200 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#EDFFF3] via-white to-white pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <div className="h-9 w-9 rounded-2xl bg-[#30D158] text-white flex items-center justify-center shrink-0 group-hover:scale-[1.08] transition-transform duration-200 shadow-[0_2px_10px_rgba(48,209,88,0.40)]">
                  <Activity className="h-[18px] w-[18px] stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="relative mt-auto pt-3">
                <div className="text-[44px] sm:text-[52px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#1D1D1F]">
                  {currentStreak || 1}<span className="text-[26px] sm:text-[30px] font-bold text-[#6E6E73]">d</span>
                </div>
                <span className="block text-[13px] sm:text-[14px] font-medium text-[#6E6E73] mt-1.5">Study Streak</span>
              </div>
            </motion.div>
      </div>
      </div>

      {/* ── Rest of dashboard sections ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 mt-4 sm:mt-6">

        {/* ═══ 2. SUBJECT FILTER PILLS BAR ═══ */}
        <motion.div
          initial={SECTION_ENTER(0.04, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="relative flex items-center"
        >
          <div
            ref={filterScrollRef}
            className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-none select-none snap-x w-full pr-2 sm:pr-10 [mask-image:linear-gradient(to_right,black_92%,transparent_100%)] bg-[#E5E5EA] rounded-full p-0.5"
          >
            {[{ id: 'all', name: 'All Subjects (19)' }, ...FMGE_SUBJECTS.map((s) => ({ id: s.id, name: s.name }))].map((f) => {
              const active = selectedFilterSubjectId === f.id;
              return (
                <motion.button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilterSubjectId(f.id)}
                  whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                  aria-pressed={active}
                  className={`relative snap-start inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer min-h-[36px] ${
                    active
                      ? 'text-[#1D1D1F] font-semibold'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-subject-filter-pill"
                      transition={SPRING(reducedMotion)}
                      className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.10)] border border-[rgba(0,0,0,0.06)]"
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
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-[rgba(0,0,0,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#6E6E73] hover:text-[#007AFF] items-center justify-center cursor-pointer transition-colors"
            title="Scroll subjects right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* ═══ 3. HIGH-YIELD ACTION DOCK (5 VIBRANT APPLE BENTO LAUNCHPAD PILLS) ═══ */}
        <motion.div
          initial={SECTION_ENTER(0.09, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="grid grid-cols-5 gap-1.5 sm:gap-3 lg:gap-4"
        >
          {/* App 1: IBQ Visual Sprint */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -6, scale: 1.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={() => setIsIbqModalOpen(true)}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-[#EBF9FF] via-white to-white shadow-[0_2px_8px_rgba(50,173,230,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_36px_rgba(50,173,230,0.22)] cursor-pointer group transition-all duration-200"
          >
            <div className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-[16px] sm:rounded-[22px] lg:rounded-[26px] bg-[#32ADE6] text-white flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-200 shadow-[0_4px_14px_rgba(50,173,230,0.35)]">
              <Stethoscope className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 stroke-[1.8]" />
            </div>
            <div className="text-center space-y-0.5 w-full hidden sm:block">
              <span className="block text-[12px] sm:text-[13px] font-semibold text-[#1D1D1F] leading-tight truncate">IBQ Sprint</span>
              <span className="block text-[10px] sm:text-[11px] text-[#6E6E73] font-medium truncate">ECG &amp; X-Ray</span>
            </div>
          </motion.div>

          {/* App 2: Repeat Vault */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -6, scale: 1.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={() => setIsExamEveCheatSheetOpen(true)}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-[#FFF8EC] via-white to-white shadow-[0_2px_8px_rgba(255,149,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_36px_rgba(255,149,0,0.22)] cursor-pointer group transition-all duration-200"
          >
            <div className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-[16px] sm:rounded-[22px] lg:rounded-[26px] bg-[#FF9500] text-white flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-200 shadow-[0_4px_14px_rgba(255,149,0,0.35)]">
              <Pill className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 stroke-[1.8]" />
            </div>
            <div className="text-center space-y-0.5 w-full hidden sm:block">
              <span className="block text-[12px] sm:text-[13px] font-semibold text-[#1D1D1F] leading-tight truncate">Repeat Vault</span>
              <span className="block text-[10px] sm:text-[11px] text-[#6E6E73] font-medium truncate">PYQs &amp; Triads</span>
            </div>
          </motion.div>

          {/* App 3: Audio Recall */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -6, scale: 1.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={() => onOpenAudioRecall?.()}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-[#F9EEFF] via-white to-white shadow-[0_2px_8px_rgba(191,90,242,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_36px_rgba(191,90,242,0.22)] cursor-pointer group transition-all duration-200"
          >
            <div className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-[16px] sm:rounded-[22px] lg:rounded-[26px] bg-[#BF5AF2] text-white flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-200 shadow-[0_4px_14px_rgba(191,90,242,0.35)]">
              <Headphones className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 stroke-[1.8]" />
            </div>
            <div className="text-center space-y-0.5 w-full hidden sm:block">
              <span className="block text-[12px] sm:text-[13px] font-semibold text-[#1D1D1F] leading-tight truncate">Audio Recall</span>
              <span className="block text-[10px] sm:text-[11px] text-[#6E6E73] font-medium truncate">Commute Mode</span>
            </div>
          </motion.div>

          {/* App 4: Retest Errors */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -6, scale: 1.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={handleLaunchErrorDrill}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-[#FFF0EF] via-white to-white shadow-[0_2px_8px_rgba(255,59,48,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_36px_rgba(255,59,48,0.22)] cursor-pointer group transition-all duration-200"
          >
            <div className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-[16px] sm:rounded-[22px] lg:rounded-[26px] bg-[#FF3B30] text-white flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-200 shadow-[0_4px_14px_rgba(255,59,48,0.35)]">
              <RotateCcw className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 stroke-[1.8]" />
            </div>
            <div className="text-center space-y-0.5 w-full hidden sm:block">
              <span className="block text-[12px] sm:text-[13px] font-semibold text-[#1D1D1F] leading-tight truncate">Retest Errors</span>
              <span className="block text-[10px] sm:text-[11px] text-[#6E6E73] font-medium truncate">
                {unreviewedErrorsCount > 0 ? `${unreviewedErrorsCount} pending` : 'Vault clear'}
              </span>
            </div>
          </motion.div>

          {/* App 5: NBE Simulator */}
          <motion.div
            whileHover={reducedMotion ? undefined : { y: -6, scale: 1.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={() => setIsNbeMockOpen(true)}
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-[#EDFFF3] via-white to-white shadow-[0_2px_8px_rgba(48,209,88,0.12),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_36px_rgba(48,209,88,0.22)] cursor-pointer group transition-all duration-200"
          >
            <div className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-[16px] sm:rounded-[22px] lg:rounded-[26px] bg-[#30D158] text-white flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-200 shadow-[0_4px_14px_rgba(48,209,88,0.35)]">
              <Award className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 stroke-[1.8]" />
            </div>
            <div className="text-center space-y-0.5 w-full hidden sm:block">
              <span className="block text-[12px] sm:text-[13px] font-semibold text-[#1D1D1F] leading-tight truncate">NBE Simulator</span>
              <span className="block text-[10px] sm:text-[11px] text-[#6E6E73] font-medium truncate">300 Questions</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ 4. TWO-COLUMN DESKTOP LAYOUT (LEFT & RIGHT) ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-7 items-start">

          {/* ══════════════ LEFT COLUMN (xl:col-span-7) ══════════════ */}
          <div className="xl:col-span-7 space-y-4">

            {/* ── TODAY'S FOCUS HERO CARD (MATCHING REFERENCE DESIGN - SIDE COLUMN) ── */}
            <motion.section
              key={`hero-focus-card-${activeFocusSubject.id}`}
              initial={SECTION_ENTER(0.08, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white shadow-[0_4px_28px_rgba(0,0,0,0.09),0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 relative"
            style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${focusTheme.ecgStrokeStart} 5%, white) 0%, white 55%)` }}
            >
              {/* ══ TOP COMPARTMENT ══ */}
              <div className="p-4 sm:p-5 lg:p-6 relative z-10">

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-5">
                  
                  {/* Left Column: Eyebrow pills, two-tone title, subtopics, meta chips, and CTA buttons */}
                  <div className="flex-1 space-y-2.5 sm:space-y-3 min-w-0">
                    
                    {/* Eyebrow Pills: [TODAY'S FOCUS] and Dynamic Subject Pill */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F2F7] text-[#1D1D1F] border border-[rgba(60,60,67,0.10)]">
                        <Target className="w-3 h-3" style={{ color: focusTheme.ecgStrokeStart }} />
                        <span>Today&apos;s Focus</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border shadow-2xs backdrop-blur-md ${focusTheme.badge}`}>
                        {activeFocusSubject.name}
                      </span>
                    </div>

                    {/* Topic Title with Two-Tone Bold Hierarchy & Subtopics */}
                    <div>
                      <h2 className="text-[22px] sm:text-[24px] lg:text-[26px] font-bold tracking-[-0.02em] leading-[1.2] text-[#1D1D1F] break-normal flex flex-wrap items-baseline gap-x-1.5">
                        <span className="whitespace-normal">{topicTitlePrimary}</span>
                        <span className="whitespace-normal" style={{ color: focusTheme.ecgStrokeStart }}>{topicTitleHighlight || activeFocusTopic.name}</span>
                      </h2>

                      {/* Sub-bullet highlights: STEMI • Arrhythmias • Heart Blocks • WPW */}
                      {topicSubtitleItems.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs font-medium text-[#6E6E73] tracking-wide mt-1">
                          {topicSubtitleItems.map((item, idx) => (
                            <React.Fragment key={item}>
                              <span>{item}</span>
                              {idx < topicSubtitleItems.length - 1 && (
                                <span className="text-[#C7C7CC] font-bold">•</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 4 Clean Rounded Meta Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F2F7] text-[#3C3C43] border border-[rgba(60,60,67,0.08)]">
                        <BookOpen className="h-3 w-3 text-[#8E8E93]" />
                        <span>{focusMarks} marks</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F2F7] text-[#3C3C43] border border-[rgba(60,60,67,0.08)]">
                        <Clock className="h-3 w-3 text-[#8E8E93]" />
                        <span>{focusMinutes} min</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F2F7] text-[#3C3C43] border border-[rgba(60,60,67,0.08)]">
                        <Layers className="h-3 w-3 text-[#8E8E93]" />
                        <span>Clinical MCQ</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FF3B30]/8 text-[#FF3B30] border border-[#FF3B30]/18 shadow-2xs">
                        <Flame className="h-3 w-3 fill-[#FF3B30] text-[#FF3B30]" />
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
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all cursor-pointer min-h-[40px] ${focusTheme.primaryBtnBg} ${focusTheme.primaryBtnHover} ${focusTheme.primaryBtnShadow}`}
                      >
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                        <span>Start Session</span>
                        <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => onSelectSubject(activeFocusSubject.id)}
                        className="group inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                        title="View full topic breakdown in Syllabus"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md border border-[rgba(60,60,67,0.10)] flex items-center justify-center text-[#6E6E73] group-hover:border-[rgba(60,60,67,0.20)] group-hover:text-[#1D1D1F] group-hover:bg-white transition-all shadow-2xs">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left leading-tight">
                          <span className="block text-[11px] font-semibold text-[#1D1D1F] group-hover:text-[#1D1D1F]">
                            View Topic
                          </span>
                          <span className="block text-[9.5px] text-[#8E8E93]">
                            Overview
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                    {/* Right Column: 3D Anatomical Organ Stage with Bio-Pulse Coupled ECG & Telemetry */}
                  <div className="relative w-full lg:w-[310px] xl:w-[340px] h-[220px] lg:h-[250px] shrink-0 flex items-center justify-center rounded-2xl overflow-hidden"
                    style={{
                      background: `radial-gradient(ellipse at 60% 40%, ${focusTheme.haloStart}22 0%, ${focusTheme.haloMid}10 55%, transparent 80%), #F2F2F7`,
                    }}
                  >
                    {/* Integrated Bioluminescent Halo directly wrapping behind the organ */}
                    <div
                      className="absolute w-[190px] h-[190px] pointer-events-none select-none rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${focusTheme.haloStart}55 0%, ${focusTheme.haloMid}28 50%, transparent 75%)`,
                        filter: 'blur(28px)',
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

                    {/* Subject-specific animated background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                      <SubjectFocusAnimation
                        subjectId={activeFocusSubject.id}
                        theme={focusTheme}
                        reducedMotion={reducedMotion ?? false}
                      />
                    </div>

                    {/* Medical Subject Visual */}
                    <motion.div
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
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="absolute -bottom-1 sm:bottom-0 right-1 sm:right-2 z-30 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-[rgba(60,60,67,0.12)] shadow-sm select-none"
                    >
                      <div className="w-4 h-4 shrink-0 rounded-full" style={{ backgroundColor: focusTheme.ecgStrokeStart }} />
                      <div className="leading-tight">
                        <div className="text-xs sm:text-[13px] font-bold text-[#1D1D1F] tracking-tight">
                          {currentTelemetry.label.split('·')[0].trim()}
                        </div>
                        <div className="text-[10px] text-[#6E6E73] font-medium">
                          {currentTelemetry.label.includes('·') ? currentTelemetry.label.split('·')[1].trim() : currentTelemetry.status}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* ══ BOTTOM COMPARTMENT: STATUS & INTEGRATED 3-STEP SPRINT PROTOCOL ══ */}
              <div className="border-t border-[rgba(60,60,67,0.08)] bg-[#F2F2F7]/50 p-4 sm:p-5 space-y-3">
                {/* Status Bar & Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(60,60,67,0.08)]">
                  {/* Circular Completion Gauge & Status Description */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-full border-[2.5px] border-[rgba(60,60,67,0.10)] flex items-center justify-center shrink-0 bg-white/95 backdrop-blur-md shadow-2xs">
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
                      <span className="text-[9.5px] font-semibold text-[#1D1D1F]">
                        {topicProgressPercent}%
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#1D1D1F]">
                          {topicStatusLabel}
                        </span>
                        <span className="text-[10px] text-[#8E8E93] font-medium">•</span>
                        <span className="text-[10px] text-[#6E6E73] font-medium">
                          NBE Blueprint Core
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6E6E73] truncate">
                        {topicSubtext}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Launch Review Shortcut */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('revision')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white/80 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" style={{ color: focusTheme.ecgStrokeStart }} />
                      <span>Review Deck</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('practice')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#007AFF] text-white hover:bg-[#0056CC] shadow-[0_2px_8px_rgba(0,122,255,0.22)] transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158]" />
                      <span>MCQs (25)</span>
                    </button>
                  </div>
                </div>

                {/* Integrated 3 Daily Calibrated Milestones */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F2F2F7] text-[#1D1D1F] border border-[rgba(60,60,67,0.12)] shadow-2xs">
                        <Flame className="h-3.5 w-3.5 text-[#FF9500] fill-[#FF9500]" />
                        <span>{sprintPhase.headline}</span>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6E6E73]">
                      <span>3 Daily Actions</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 lg:gap-3">
                    {/* Target 1: Subject High-Yield Anchor */}
                    <motion.div
                      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.012 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_0_0_3px_rgba(0,122,255,0.12)] transition-all group relative overflow-hidden"
                    >

                      <div>
                        {/* Header Row: Specialty Insignia & Weightage Pill */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.08]">
                              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#007AFF] whitespace-nowrap shrink-0">
                              {sprintPhase.anchorLabel}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/15 shrink-0">
                            ~{focusMarks}M
                          </span>
                        </div>

                        {/* Title & Clinical Subtitle */}
                        <div className="mt-2.5">
                          <h4 className="text-[13px] sm:text-[14px] font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                            Study Notes &amp; Patterns
                          </h4>
                          <p className="text-[11px] text-[#6E6E73] font-medium line-clamp-1 mt-0.5">
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
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-[#007AFF] text-white hover:bg-[#0056CC] text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(0,122,255,0.25)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn relative overflow-hidden"
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
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-all group relative overflow-hidden"
                    >

                      <div>
                        {/* Header Row: Specialty Insignia & Speed Tag */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#FF9500] text-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.08]">
                              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#FF9500] whitespace-nowrap shrink-0">
                              {sprintPhase.drillLabel}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/15 shrink-0">
                            60s / Q
                          </span>
                        </div>

                        {/* Title & Clinical Subtitle */}
                        <div className="mt-2.5">
                          <h4 className="text-[13px] sm:text-[14px] font-bold text-[#1D1D1F] group-hover:text-[#FF9500] transition-colors leading-snug">
                            10 Timed Vignettes
                          </h4>
                          <p className="text-[11px] text-[#6E6E73] font-medium line-clamp-1 mt-0.5">
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
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-[#FF9500] hover:bg-[#E68600] text-white text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(255,149,0,0.25)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn relative overflow-hidden"
                      >
                        <span>Start 10 MCQs</span>
                        <Play className="h-3 w-3 fill-white text-white group-hover/btn:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none" />
                      </button>
                    </motion.div>

                    {/* Target 3: Error Shield & Re-test */}
                    <motion.div
                      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.012 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-all group relative overflow-hidden"
                    >

                      <div>
                        {/* Header Row: Specialty Insignia & Due Count */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#FF3B30] text-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.08]">
                              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#FF3B30] whitespace-nowrap shrink-0">
                              {sprintPhase.shieldLabel}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                              unreviewedErrorsCount > 0
                                ? 'bg-[#FF3B30]/12 text-[#FF3B30] border border-[#FF3B30]/20'
                                : 'bg-[#F2F2F7] text-[#6E6E73] border border-[rgba(60,60,67,0.10)]'
                            }`}
                          >
                            {unreviewedErrorsCount} Due
                          </span>
                        </div>

                        {/* Title & Clinical Subtitle */}
                        <div className="mt-2.5">
                          <h4 className="text-[13px] sm:text-[14px] font-bold text-[#1D1D1F] group-hover:text-[#FF3B30] transition-colors leading-snug">
                            {unreviewedErrorsCount > 0 ? `${unreviewedErrorsCount} Blunders Pending` : 'Vault Mastered'}
                          </h4>
                          <p className="text-[11px] text-[#6E6E73] font-medium line-clamp-1 mt-0.5">
                            {unreviewedErrorsCount > 0 ? 'Retest to prevent lost marks' : 'Zero unreviewed blunders'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={handleLaunchErrorDrill}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-[#FF3B30] text-white hover:bg-[#CC2F26] text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(255,59,48,0.25)] cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn relative overflow-hidden"
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
              className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#007AFF] flex items-center justify-center shadow-[0_2px_8px_rgba(0,122,255,0.30)]">
                    <Calendar className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight leading-none">Today&apos;s Plan</h3>
                    <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">
                      {dailyPlan.tasks.length} task{dailyPlan.tasks.length !== 1 ? 's' : ''} · adaptive priority
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('planner')}
                  className="text-[13px] font-semibold text-[#007AFF] hover:text-[#0056CC] transition-colors cursor-pointer"
                >
                  Full Plan →
                </button>
              </div>

              {/* Separator */}
              <div className="h-px bg-[rgba(60,60,67,0.08)] mx-5" />

              {/* Task list */}
              <div className="px-4 py-3 space-y-2">
                {(todayPlanTasks.length > 0 ? todayPlanTasks : dailyPlan.tasks.slice(1, 4)).map((task, index) => {
                  const priorityColors = [
                    { bg: 'bg-[#FF3B30]/10', icon: 'text-[#FF3B30]', bar: 'bg-[#FF3B30]', label: 'text-[#FF3B30]' },
                    { bg: 'bg-[#FF9500]/10', icon: 'text-[#FF9500]', bar: 'bg-[#FF9500]', label: 'text-[#FF9500]' },
                    { bg: 'bg-[#007AFF]/10', icon: 'text-[#007AFF]', bar: 'bg-[#007AFF]', label: 'text-[#007AFF]' },
                  ];
                  const pc = priorityColors[index] ?? priorityColors[2];
                  return (
                    <motion.div
                      key={task.id}
                      whileHover={reducedMotion ? undefined : { y: -1, scale: 1.005 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F2F2F7] hover:bg-[#EAEAF0] transition-colors group cursor-pointer relative overflow-hidden"
                    >
                      {/* Priority bar */}
                      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${pc.bar}`} />

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ml-1 ${pc.bg}`}>
                        <BookOpen className={`h-4.5 w-4.5 ${pc.icon}`} style={{ width: 18, height: 18 }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${pc.label}`}>
                            {task.subjectName}
                          </span>
                          <span className="text-[10px] font-semibold text-[#8E8E93] bg-white rounded-md px-1.5 py-0.5">
                            {task.durationMinutes} min
                          </span>
                        </div>
                        <h4 className="text-[14px] font-bold text-[#1D1D1F] line-clamp-1 leading-snug">
                          {task.topicName}
                        </h4>
                        <p className="text-[11px] text-[#6E6E73] line-clamp-1">{task.reason}</p>
                      </div>

                      {/* Start CTA */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task.activity === 'learn' || task.activity === 'mcqs') {
                            onLaunchPracticeSession?.(task.subjectId, task.topicId, task.topicName);
                          } else {
                            onNavigateTab(task.activity === 'revision' ? 'revision' : 'practice');
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center shadow-[0_2px_8px_rgba(0,122,255,0.28)] shrink-0 cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" style={{ width: 14, height: 14 }} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer CTA */}
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('planner')}
                  className="w-full h-11 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[13px] font-bold text-[#007AFF] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="h-4 w-4" />
                  Open Daily Planner
                </button>
              </div>
            </motion.section>
          </div>

          {/* ══════════════ RIGHT COLUMN (xl:col-span-5) ══════════════ */}
          <div className="xl:col-span-5 space-y-4">

            {/* ── YOUR EXAM JOURNEY ── */}
            <motion.section
              initial={SECTION_ENTER(0.1, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] relative overflow-hidden"
            >
              {/* Blue top accent stripe */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#007AFF] via-[#5AC8FA] to-[#30D158]" />

              {/* Card Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-[0_2px_8px_rgba(0,122,255,0.30)]">
                    <Target className="text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight leading-none">Exam Journey</h3>
                    <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">Score trajectory &amp; readiness</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('progress')}
                  className="text-[13px] font-semibold text-[#007AFF] hover:text-[#0056CC] cursor-pointer transition-colors"
                >
                  Details →
                </button>
              </div>

              {/* Hero score row */}
              <div className="flex items-center gap-4 px-5 pb-4">
                {/* Circular gauge */}
                <div className="shrink-0">
                  <CircularCountdown
                    value={projectedScore}
                    label="EST. SCORE"
                    sublabel="150 Pass"
                    progressRatio={Math.min(1, Math.max(0.2, (projectedScore - 100) / 150))}
                    reducedMotion={reducedMotion}
                  />
                </div>

                {/* Metrics */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="rounded-2xl bg-[#F2F2F7] p-3 space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#8E8E93]">Gap to Target</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[26px] font-black text-[#1D1D1F] tracking-tight tabular-nums leading-none">
                        {Math.max(0, (savedTargetScore || 200) - projectedScore)}
                      </span>
                      <span className="text-[12px] font-semibold text-[#6E6E73]">pts to {savedTargetScore || 200}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#FFF8EE] border border-[rgba(255,149,0,0.15)] p-3 space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#FF9500]">Exam Countdown</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[26px] font-black text-[#FF9500] tracking-tight tabular-nums leading-none">
                        {daysRemaining}
                      </span>
                      <span className="text-[12px] font-semibold text-[#6E6E73]">days left</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-[rgba(60,60,67,0.08)] mx-5" />

              {/* Stat tiles row */}
              <div className="grid grid-cols-2 gap-3 px-5 py-4">
                {/* Pass Cutoff */}
                <button
                  type="button"
                  onClick={() => setIsPassingGapModalOpen(true)}
                  className="rounded-2xl bg-[#EDFDF5] border border-[rgba(48,209,88,0.18)] p-3.5 text-left group hover:bg-[#D8FAE8] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-[#30D158] flex items-center justify-center">
                      <ShieldCheck className="text-white" style={{ width: 13, height: 13 }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#30D158]">Pass Cutoff</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[22px] font-black text-[#1D1D1F] tracking-tight tabular-nums leading-none">150</span>
                    <span className="text-[11px] font-semibold text-[#8E8E93] ml-0.5">/ 300</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#007AFF] mt-1 block group-hover:underline">Analyze gap →</span>
                </button>

                {/* Target Score */}
                <div className="rounded-2xl bg-[#EBF4FF] border border-[rgba(0,122,255,0.15)] p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-[#007AFF] flex items-center justify-center">
                      <Target className="text-white" style={{ width: 13, height: 13 }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#007AFF]">Your Target</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[22px] font-black text-[#1D1D1F] tracking-tight tabular-nums leading-none">
                      {savedTargetScore || 200}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8E8E93] ml-0.5">/ 300</span>
                  </div>
                  <span className="text-[10px] font-medium text-[#8E8E93] mt-1 block">Personal goal</span>
                </div>
              </div>

              {/* Syllabus Coverage bar */}
              <div className="px-5 pb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#1D1D1F]">Syllabus Coverage</span>
                  <span className="text-[12px] font-black text-[#007AFF] tabular-nums">
                    {stats?.notesPercentage ? `${stats.notesPercentage}%` : '16%'}
                  </span>
                </div>
                <div className="w-full h-3 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#5AC8FA] via-[#409CFF] to-[#007AFF]"
                    initial={reducedMotion ? false : { width: 0 }}
                    whileInView={{ width: `${Math.max(stats?.notesPercentage || 16, 5)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="text-[11px] text-[#8E8E93] font-medium">
                  {(() => {
                    const pct = stats?.notesPercentage || 16;
                    if (pct >= 80) return 'Excellent coverage — review weak spots now.';
                    if (pct >= 50) return 'Good momentum — keep up the daily notes habit.';
                    if (pct >= 25) return 'Building a strong foundation — stay consistent.';
                    return 'Early days — consistent daily study adds up fast.';
                  })()}
                </p>
              </div>
            </motion.section>

            {/* ── YOUR STUDY STREAK ── */}
            <motion.section
              initial={SECTION_ENTER(0.14, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Amber top stripe */}
              <div className="h-[3px] bg-gradient-to-r from-[#FF9500] via-[#FFB340] to-[#FF6B00]" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF6B00] flex items-center justify-center shadow-[0_2px_8px_rgba(255,149,0,0.35)]">
                    <Flame className="text-white fill-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight leading-none">Study Streak</h3>
                    <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">Daily consistency</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[28px] font-black text-[#FF9500] tracking-tight leading-none tabular-nums">
                    {currentStreak || 1}
                  </div>
                  <div className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">day streak</div>
                </div>
              </div>

              {/* 7-day ring row */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {weekDays.map(({ dayName, dateNum, isCompleted, isToday }) => (
                    <div key={dayName} className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[#8E8E93]">
                        {dayName}
                      </span>
                      <motion.div
                        whileHover={reducedMotion ? {} : { scale: 1.12, y: -1 }}
                        whileTap={reducedMotion ? {} : { scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold cursor-pointer select-none transition-all ${
                          isToday
                            ? 'bg-[#FF9500] text-white shadow-[0_3px_10px_rgba(255,149,0,0.40)]'
                            : isCompleted
                            ? 'bg-[#FF9500]/15 text-[#FF9500]'
                            : 'bg-[#F2F2F7] text-[#C7C7CC]'
                        }`}
                      >
                        {isToday && !reducedMotion && (
                          <motion.span
                            className="absolute inset-0 rounded-full border-2 border-[#FF9500]/40"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                        {isCompleted && !isToday ? (
                          <CheckCircle2 className="w-4 h-4 text-[#FF9500]" />
                        ) : (
                          dateNum
                        )}
                      </motion.div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#8E8E93] font-medium mt-3 text-center">
                  Consistency compounds into confidence.
                </p>
              </div>
            </motion.section>

            {/* ── YOUR PROGRESS ── */}
            <motion.section
              initial={SECTION_ENTER(0.18, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Green top stripe */}
              <div className="h-[3px] bg-gradient-to-r from-[#30D158] via-[#4CD964] to-[#30D158]" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#30D158] to-[#25A040] flex items-center justify-center shadow-[0_2px_8px_rgba(48,209,88,0.30)]">
                    <BarChart3 className="text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight leading-none">Your Progress</h3>
                    <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">Curriculum completion</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="text-[13px] font-semibold text-[#007AFF] hover:text-[#0056CC] cursor-pointer transition-colors"
                >
                  All →
                </button>
              </div>

              {/* Separator */}
              <div className="h-px bg-[rgba(60,60,67,0.08)] mx-5" />

              {/* Subject rows */}
              <div className="px-4 py-3 space-y-1">
                {subjectList.slice(0, 5).map((sub, idx) => {
                  const accent = SUBJECT_ACCENT_COLORS[sub.id];
                  const barColor = accent?.bar ?? 'bg-[#007AFF]';
                  const pct = Math.max(sub.percentage, 2);
                  const statusColor = sub.percentage >= 50 ? '#30D158' : sub.percentage >= 20 ? '#FF9500' : '#FF3B30';

                  return (
                    <motion.div
                      key={sub.id}
                      whileHover={reducedMotion ? {} : { x: 2 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      onClick={() => onSelectSubject(sub.id)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#F2F2F7] transition-colors cursor-pointer group"
                    >
                      {/* Color dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${barColor}`} />

                      {/* Name */}
                      <span className="text-[13px] font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors truncate flex-1 min-w-0">
                        {sub.name}
                      </span>

                      {/* Bar */}
                      <div className="w-20 h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden shrink-0">
                        <motion.div
                          className={`h-full rounded-full ${barColor}`}
                          initial={reducedMotion ? false : { width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>

                      {/* Percentage */}
                      <span className="text-[12px] font-black tabular-nums w-8 text-right shrink-0" style={{ color: statusColor }}>
                        <AnimatedNumber value={sub.percentage} />%
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer CTA */}
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="w-full h-10 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[13px] font-bold text-[#30D158] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="h-4 w-4" />
                  View all 19 subjects
                </button>
              </div>
            </motion.section>

            {/* ── DAILY RECALL / UP NEXT ── */}
            <motion.section
              initial={SECTION_ENTER(0.16, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Amber top stripe */}
              <div className="h-[3px] bg-gradient-to-r from-[#FF9500] via-[#FFD60A] to-[#FF9500]" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#CC7700] flex items-center justify-center shadow-[0_2px_8px_rgba(255,149,0,0.30)]">
                    <Lightbulb className="text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight leading-none">
                      {hasRevisionDue || errorsToReview ? 'Up Next' : 'Daily Recall'}
                    </h3>
                    <p className="text-[12px] text-[#8E8E93] font-medium mt-0.5">Reinforce what matters</p>
                  </div>
                </div>
                {!(hasRevisionDue || errorsToReview) && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setIsPearlRevealed(false); setDailyPearlIndex((p) => p + 1); }}
                      className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center text-[#6E6E73] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExamEveCheatSheetOpen(true)}
                      className="h-8 px-3 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[12px] font-bold cursor-pointer hover:bg-[#007AFF]/15 transition-colors"
                    >
                      Vault
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-[rgba(60,60,67,0.08)] mx-5" />

              {hasRevisionDue || errorsToReview ? (
                <div className="p-4 space-y-2.5">
                  {/* Revision card */}
                  <motion.div
                    whileHover={reducedMotion ? undefined : { y: -1, scale: 1.01 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    onClick={() => onNavigateTab('revision')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#EDFDF5] border border-[rgba(48,209,88,0.18)] cursor-pointer group hover:bg-[#D8FAE8] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#30D158] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(48,209,88,0.30)]">
                      <CheckCircle2 className="text-white" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[14px] font-bold text-[#1D1D1F]">Revision Due</span>
                      <span className="block text-[12px] font-semibold text-[#30D158] mt-0.5">
                        {dailyPlan.revisionDueCount} items ready to review
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#30D158] shrink-0" />
                  </motion.div>

                  {/* Error Remediation card */}
                  <motion.div
                    whileHover={reducedMotion ? undefined : { y: -1, scale: 1.01 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    onClick={() => onNavigateTab('errors')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFF8EE] border border-[rgba(255,149,0,0.18)] cursor-pointer group hover:bg-[#FFEFD6] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#FF9500] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,149,0,0.30)]">
                      <RotateCcw className="text-white" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[14px] font-bold text-[#1D1D1F]">Error Remediation</span>
                      <span className="block text-[12px] font-semibold text-[#FF9500] mt-0.5">
                        {dailyPlan.errorRemediationCount} mistakes to address
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#FF9500] shrink-0" />
                  </motion.div>
                </div>
              ) : (
                /* High-Yield Pearl */
                <div className="px-5 pt-4 pb-5 space-y-4">
                  {/* Pearl meta */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF9500]">High-Yield Recall Pearl</span>
                    <h4 className="text-[16px] font-black text-[#1D1D1F] leading-snug tracking-tight">
                      {todayPearl?.name || "Beck's Triad"}
                    </h4>
                  </div>

                  {/* Component pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {(todayPearl?.components || '').split('+').map((part, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#F2F2F7] text-[#1D1D1F]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] shrink-0" />
                        {part.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Reveal */}
                  {isPearlRevealed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EDFDF5] border border-[rgba(48,209,88,0.20)]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#30D158] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="text-white" style={{ width: 16, height: 16 }} />
                      </div>
                      <span className="text-[14px] font-bold text-[#1D1D1F] tracking-tight">{todayPearl?.diagnosis}</span>
                    </motion.div>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsPearlRevealed(true)}
                      className="w-full h-11 rounded-2xl bg-[#FF9500] hover:bg-[#E08600] text-white text-[14px] font-bold flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(255,149,0,0.30)] cursor-pointer transition-colors"
                    >
                      <Eye style={{ width: 16, height: 16 }} />
                      Reveal Diagnosis
                    </motion.button>
                  )}

                  {/* NBE badge */}
                  <div className="flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">
                      <Sparkles className="w-3 h-3" />
                      Guaranteed NBE Repeat
                    </span>
                  </div>
                </div>
              )}
            </motion.section>
          </div>
        </div>

        {/* ── EXPLORE OTHER HIGH-YIELD SUBJECTS ── */}
        <motion.section
          initial={SECTION_ENTER(0.2, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#F2F2F7] border border-[rgba(60,60,67,0.10)] flex items-center justify-center text-[#007AFF] shrink-0">
                <Flame className="h-5 w-5 fill-[#007AFF] text-[#007AFF]" />
              </div>
              <div>
                <h3 className="text-[17px] sm:text-[19px] font-bold text-[#1D1D1F] leading-tight tracking-tight">
                  Explore Subjects
                </h3>
                <p className="text-xs sm:text-[13px] text-[#6E6E73] font-medium">
                  19 high-yield subjects, weighted by NBE exam pattern
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('syllabus')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:text-[#0056CC] hover:underline cursor-pointer self-start sm:self-auto min-h-[36px]"
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
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  onClick={() => {
                    setSelectedFilterSubjectId(sub.id);
                    onSelectSubject(sub.id);
                  }}
                  className={`group relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer border bg-white overflow-hidden transition-all duration-200 ${
                    isCurrent
                      ? 'border-[#007AFF] shadow-[0_0_0_3px_rgba(0,122,255,0.12)]'
                      : 'border-[rgba(60,60,67,0.10)] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[rgba(60,60,67,0.20)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]'
                  }`}
                >

                  {/* Top Row: Specialty Insignia & NBE Weightage Pill */}
                  <div className="flex items-center justify-between gap-1 mb-1 z-20">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-2xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                        theme.insigniaBg || 'bg-[#E5E5EA] text-[#1D1D1F] border-[rgba(60,60,67,0.12)]'
                      }`}
                    >
                      <InsigniaIcon className="w-4 h-4 transition-transform duration-300 group-hover:scale-105" />
                    </div>

                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium border bg-[#F2F2F7] text-[#6E6E73] border-[rgba(60,60,67,0.10)]">
                      <span>{sub.weightage}m</span>
                    </span>
                  </div>

                  {/* Medical Subject Artwork */}
                  <div className={`relative w-full h-24 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-1 sm:p-2 group-hover:scale-[1.03] transition-transform duration-300 ease-out bg-gradient-to-br ${theme.bg || 'from-[#F2F2F7] to-white/80'}`}>
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                      <MedicalSubjectCardVisual subjectId={sub.id} />
                    </div>
                  </div>

                  {/* Content & Typography */}
                  <div className="mt-1.5 sm:mt-2 pt-0.5 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-[13px] sm:text-sm font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors truncate"
                          title={sub.name}
                        >
                          {sub.name}
                        </h4>
                        <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-[#6E6E73] font-medium pt-0.5">
                          <span className="inline-flex items-center gap-1 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shrink-0" />
                            <span>{hyCount} High-yield</span>
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-[#007AFF] font-semibold flex items-center gap-0.5 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 text-[10px] shrink-0">
                            <span>Blueprint</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Micro Progress Bar */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="relative flex-1 h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(sub.percentage, 4)}%` }}
                        />
                        {/* Interactive Shimmer Beam */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      </div>
                      <span className="text-[11px] font-medium text-[#6E6E73] tabular-nums shrink-0">
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
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-[#1D1D1F]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#F2F2F7]/95 backdrop-blur-xl rounded-3xl border border-[rgba(60,60,67,0.10)] shadow-2xl p-4 sm:p-6 scrollbar-thin"
            >
              <button
                type="button"
                onClick={() => setIsPassingGapModalOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] flex items-center justify-center shadow-xs cursor-pointer z-10 transition-colors border border-[rgba(60,60,67,0.10)]"
                title="Close analyzer"
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" />
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
