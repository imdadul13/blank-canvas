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
  Sparkles,
  Flame,
  Compass,
  BarChart3,
  ChevronDown,
  Zap,
  Sun,
  Sunset,
  Moon,
  Award,
  ExternalLink,
  MoreVertical,
  HelpCircle,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { AppState, DailyTask, DailyStudyLog, PracticeSessionContext } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import {
  getNextBestStudyAction,
  getDaysRemainingToExam,
} from '../utils/adaptivePriorityEngine';
import { calculateStudyStreak } from '../utils/dailyMissionEngine';
import {
  getPersonalizedDailyPlan,
  getLearningContext,
  PersonalizedPlan,
  PersonalizedPlanTask,
  LearningContext,
} from '../utils/personalizationEngine';
import { MedicalHeroVisual, MedicalSubjectCardVisual, getSubjectTelemetry } from './MedicalHeroVisual';
import { DoctorMountainArt } from './DoctorMountainArt';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import { NotificationCenterModal } from './NotificationCenterModal';
import { hasUnreadNotifications } from '../utils/notificationEngine';
import { DailyPlannerView } from './DailyPlannerView';

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
  activeBg?: { id: string; url: string; label: string; period: string };
  onShuffleBg?: () => void;
  onOpenProfile?: () => void;
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
  days,
  totalDays = 90,
  reducedMotion,
}: {
  days: number;
  totalDays?: number;
  reducedMotion: boolean | null;
}) {
  const size = 124;
  const strokeWidth = 9.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Progress based on total preparation cycle
  const progressRatio = Math.min(1, Math.max(0.12, (totalDays - days) / totalDays));
  const targetOffset = circumference * (1 - progressRatio);

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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <AnimatedNumber
          value={days}
          className="font-black text-3xl sm:text-4xl text-slate-900 tracking-tight font-['Outfit'] tabular-nums leading-none"
        />
        <span className="text-[9.5px] font-bold text-[#638E88] mt-1 leading-tight tracking-wider uppercase font-mono">
          DAYS LEFT
        </span>
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

export interface SubjectCardTheme {
  bg: string;
  border: string;
  glow: string;
  badge: string;
  arrowBg: string;
  arrowText: string;
}

/** Subject Card Gradient Themes & Backdrops matching Reference Mockup */
const SUBJECT_CARD_THEMES: Record<string, SubjectCardTheme> = {
  medicine: {
    bg: 'from-cyan-100/70 via-teal-50/40 to-white/95',
    border: 'border-cyan-200/80 hover:border-cyan-400/90',
    glow: 'rgba(6, 182, 212, 0.22)',
    badge: 'bg-cyan-500/10 text-cyan-800 border-cyan-200/70',
    arrowBg: 'group-hover:bg-[#006B63] group-hover:text-white',
    arrowText: 'text-cyan-700',
  },
  psychiatry: {
    bg: 'from-purple-100/70 via-indigo-50/40 to-white/95',
    border: 'border-purple-200/80 hover:border-purple-400/90',
    glow: 'rgba(168, 85, 247, 0.20)',
    badge: 'bg-purple-500/10 text-purple-800 border-purple-200/70',
    arrowBg: 'group-hover:bg-purple-600 group-hover:text-white',
    arrowText: 'text-purple-700',
  },
  physiology: {
    bg: 'from-sky-100/70 via-cyan-50/40 to-white/95',
    border: 'border-sky-200/80 hover:border-sky-400/90',
    glow: 'rgba(14, 165, 233, 0.20)',
    badge: 'bg-sky-500/10 text-sky-800 border-sky-200/70',
    arrowBg: 'group-hover:bg-sky-600 group-hover:text-white',
    arrowText: 'text-sky-700',
  },
  surgery: {
    bg: 'from-rose-100/70 via-orange-50/40 to-white/95',
    border: 'border-rose-200/80 hover:border-rose-400/90',
    glow: 'rgba(244, 63, 94, 0.20)',
    badge: 'bg-rose-500/10 text-rose-800 border-rose-200/70',
    arrowBg: 'group-hover:bg-rose-600 group-hover:text-white',
    arrowText: 'text-rose-700',
  },
  pathology: {
    bg: 'from-blue-100/70 via-indigo-50/40 to-white/95',
    border: 'border-blue-200/80 hover:border-blue-400/90',
    glow: 'rgba(59, 130, 246, 0.20)',
    badge: 'bg-blue-500/10 text-blue-800 border-blue-200/70',
    arrowBg: 'group-hover:bg-blue-600 group-hover:text-white',
    arrowText: 'text-blue-700',
  },
  biochemistry: {
    bg: 'from-amber-100/70 via-orange-50/30 to-white/95',
    border: 'border-amber-200/80 hover:border-amber-400/90',
    glow: 'rgba(245, 158, 11, 0.20)',
    badge: 'bg-amber-500/10 text-amber-800 border-amber-200/70',
    arrowBg: 'group-hover:bg-amber-600 group-hover:text-white',
    arrowText: 'text-amber-700',
  },
  anatomy: {
    bg: 'from-teal-100/70 via-emerald-50/40 to-white/95',
    border: 'border-teal-200/80 hover:border-teal-400/90',
    glow: 'rgba(20, 184, 166, 0.20)',
    badge: 'bg-teal-500/10 text-teal-800 border-teal-200/70',
    arrowBg: 'group-hover:bg-teal-600 group-hover:text-white',
    arrowText: 'text-teal-700',
  },
  pharmacology: {
    bg: 'from-emerald-100/70 via-teal-50/40 to-white/95',
    border: 'border-emerald-200/80 hover:border-emerald-400/90',
    glow: 'rgba(16, 185, 129, 0.20)',
    badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/70',
    arrowBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    arrowText: 'text-emerald-700',
  },
  microbiology: {
    bg: 'from-teal-100/70 via-cyan-50/40 to-white/95',
    border: 'border-teal-200/80 hover:border-teal-400/90',
    glow: 'rgba(13, 148, 136, 0.20)',
    badge: 'bg-teal-500/10 text-teal-800 border-teal-200/70',
    arrowBg: 'group-hover:bg-teal-600 group-hover:text-white',
    arrowText: 'text-teal-700',
  },
  fmt: {
    bg: 'from-slate-200/70 via-slate-100/50 to-white/95',
    border: 'border-slate-300/80 hover:border-slate-400',
    glow: 'rgba(100, 116, 139, 0.18)',
    badge: 'bg-slate-500/10 text-slate-800 border-slate-300/70',
    arrowBg: 'group-hover:bg-slate-700 group-hover:text-white',
    arrowText: 'text-slate-700',
  },
  psm: {
    bg: 'from-cyan-100/70 via-teal-50/40 to-white/95',
    border: 'border-cyan-200/80 hover:border-cyan-400/90',
    glow: 'rgba(6, 182, 212, 0.20)',
    badge: 'bg-cyan-500/10 text-cyan-800 border-cyan-200/70',
    arrowBg: 'group-hover:bg-cyan-600 group-hover:text-white',
    arrowText: 'text-cyan-700',
  },
  ophthalmology: {
    bg: 'from-indigo-100/70 via-sky-50/40 to-white/95',
    border: 'border-indigo-200/80 hover:border-indigo-400/90',
    glow: 'rgba(99, 102, 241, 0.20)',
    badge: 'bg-indigo-500/10 text-indigo-800 border-indigo-200/70',
    arrowBg: 'group-hover:bg-indigo-600 group-hover:text-white',
    arrowText: 'text-indigo-700',
  },
  ent: {
    bg: 'from-purple-100/70 via-fuchsia-50/30 to-white/95',
    border: 'border-purple-200/80 hover:border-purple-400/90',
    glow: 'rgba(168, 85, 247, 0.20)',
    badge: 'bg-purple-500/10 text-purple-800 border-purple-200/70',
    arrowBg: 'group-hover:bg-purple-600 group-hover:text-white',
    arrowText: 'text-purple-700',
  },
  obg: {
    bg: 'from-pink-100/70 via-rose-50/40 to-white/95',
    border: 'border-pink-200/80 hover:border-pink-400/90',
    glow: 'rgba(236, 72, 153, 0.20)',
    badge: 'bg-pink-500/10 text-pink-800 border-pink-200/70',
    arrowBg: 'group-hover:bg-pink-600 group-hover:text-white',
    arrowText: 'text-pink-700',
  },
  pediatrics: {
    bg: 'from-cyan-100/70 via-emerald-50/30 to-white/95',
    border: 'border-cyan-200/80 hover:border-cyan-400/90',
    glow: 'rgba(6, 182, 212, 0.20)',
    badge: 'bg-cyan-500/10 text-cyan-800 border-cyan-200/70',
    arrowBg: 'group-hover:bg-cyan-600 group-hover:text-white',
    arrowText: 'text-cyan-700',
  },
  orthopedics: {
    bg: 'from-violet-100/60 via-slate-50/40 to-white/95',
    border: 'border-violet-200/80 hover:border-violet-400/90',
    glow: 'rgba(139, 92, 246, 0.18)',
    badge: 'bg-violet-500/10 text-violet-800 border-violet-200/70',
    arrowBg: 'group-hover:bg-violet-600 group-hover:text-white',
    arrowText: 'text-violet-700',
  },
  dermatology: {
    bg: 'from-rose-100/70 via-amber-50/30 to-white/95',
    border: 'border-rose-200/80 hover:border-rose-400/90',
    glow: 'rgba(244, 63, 94, 0.20)',
    badge: 'bg-rose-500/10 text-rose-800 border-rose-200/70',
    arrowBg: 'group-hover:bg-rose-600 group-hover:text-white',
    arrowText: 'text-rose-700',
  },
  radiology: {
    bg: 'from-slate-200/70 via-cyan-50/30 to-white/95',
    border: 'border-slate-300/80 hover:border-cyan-400/90',
    glow: 'rgba(15, 23, 42, 0.18)',
    badge: 'bg-slate-500/10 text-slate-800 border-slate-300/70',
    arrowBg: 'group-hover:bg-slate-700 group-hover:text-white',
    arrowText: 'text-slate-700',
  },
  anesthesia: {
    bg: 'from-teal-100/70 via-slate-50/40 to-white/95',
    border: 'border-teal-200/80 hover:border-teal-400/90',
    glow: 'rgba(13, 148, 136, 0.20)',
    badge: 'bg-teal-500/10 text-teal-800 border-teal-200/70',
    arrowBg: 'group-hover:bg-teal-600 group-hover:text-white',
    arrowText: 'text-teal-700',
  },
};

const DEFAULT_CARD_THEME: SubjectCardTheme = {
  bg: 'from-teal-50/80 via-slate-50/40 to-white/95',
  border: 'border-slate-200/80 hover:border-teal-300',
  glow: 'rgba(13, 148, 136, 0.16)',
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  arrowBg: 'group-hover:bg-[#006B63] group-hover:text-white',
  arrowText: 'text-slate-600',
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
  activeBg,
  onShuffleBg,
  onOpenProfile,
  subTab,
  onSubTabChange,
}) => {
  const { user, profile } = useAuth();
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'planner'>(
    subTab || 'overview'
  );

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

  // Notification center modal state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

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

  // Respect prefers-reduced-motion
  const reducedMotion = useReducedMotion();

  const hour = new Date().getHours();
  const themeSetting = state.settings?.bgTheme;
  const { greeting, greetingIcon: GreetingIcon, timeOfDay } = useMemo(() => {
    let resolvedTime: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    if ((themeSetting as string) === 'morning') resolvedTime = 'morning';
    else if ((themeSetting as string) === 'afternoon') resolvedTime = 'afternoon';
    else if (themeSetting === 'sunset') resolvedTime = 'evening';
    else if (themeSetting === 'night') resolvedTime = 'night';
    else {
      // auto / circadian based on real-time hour
      if (hour >= 5 && hour < 12) resolvedTime = 'morning';
      else if (hour >= 12 && hour < 17) resolvedTime = 'afternoon';
      else if (hour >= 17 && hour < 21) resolvedTime = 'evening';
      else resolvedTime = 'night';
    }

    switch (resolvedTime) {
      case 'morning':
        return { greeting: 'Good morning,', greetingIcon: Sun, timeOfDay: 'morning' as const };
      case 'afternoon':
        return { greeting: 'Good afternoon,', greetingIcon: Sun, timeOfDay: 'afternoon' as const };
      case 'evening':
        return { greeting: 'Good evening,', greetingIcon: Sunset, timeOfDay: 'evening' as const };
      case 'night':
      default:
        return { greeting: 'Good evening,', greetingIcon: Moon, timeOfDay: 'night' as const };
    }
  }, [hour, themeSetting]);

  // Dynamic header theme styling that adapts with time of day and user theme setting
  const heroTheme = useMemo(() => {
    switch (timeOfDay) {
      case 'morning':
        return {
          bannerBg: 'bg-gradient-to-br from-[#EEF9F6] via-[#F6FCFA] to-[#E5F5F0] border-[#BEE4DC]',
          auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(45,212,191,0.22),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(253,230,138,0.20),transparent_70%)]',
          topLight: 'from-transparent via-amber-300/40 to-transparent',
          nameColor: 'text-[#0B2A26]',
          subtitleColor: 'text-[#4E7670]',
          greetingIconColor: 'text-amber-500',
        };
      case 'afternoon':
        return {
          bannerBg: 'bg-gradient-to-br from-[#EAF7F4] via-[#F3FAF8] to-[#E0F2EC] border-[#B6E1D7]',
          auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(14,165,233,0.18),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(45,212,191,0.20),transparent_70%)]',
          topLight: 'from-transparent via-teal-400/40 to-transparent',
          nameColor: 'text-[#0B2A26]',
          subtitleColor: 'text-[#44726A]',
          greetingIconColor: 'text-teal-500',
        };
      case 'evening':
        return {
          bannerBg: 'bg-gradient-to-br from-[#FFF8EE] via-[#FAF9F6] to-[#E5F3EE] border-[#E8D7C2]',
          auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(249,115,22,0.18),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(244,63,94,0.15),transparent_70%)]',
          topLight: 'from-transparent via-orange-400/40 to-transparent',
          nameColor: 'text-[#2D1B11]',
          subtitleColor: 'text-[#7C5E4E]',
          greetingIconColor: 'text-orange-500',
        };
      case 'night':
      default:
        return {
          bannerBg: 'bg-gradient-to-br from-[#0C2420] via-[#10302B] to-[#071916] border-[#18443D]',
          auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(56,189,248,0.18),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(45,212,191,0.16),transparent_70%)]',
          topLight: 'from-transparent via-cyan-400/30 to-transparent',
          nameColor: 'text-[#E8F8F5]',
          subtitleColor: 'text-[#87BDB5]',
          greetingIconColor: 'text-cyan-400',
        };
    }
  }, [timeOfDay]);

  const daysRemaining = useMemo(() => getDaysRemainingToExam(state), [state]);

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
    return list;
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

  // Real consecutive study streak from study logs
  const currentStreak = useMemo(
    () => calculateStudyStreak(state.studyLogs),
    [state.studyLogs]
  );

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
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation header allowing quick return to dashboard */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <button
            type="button"
            onClick={() => handleSubTabChange('overview')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-stone-200/80 text-stone-700 hover:text-stone-900 hover:bg-stone-50 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00685f]" />
            <span>Return to Home Dashboard</span>
          </button>
        </div>

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
      </div>
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

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">

        {/* ═══ 1. TOP BAR (Search, Notifications, Profile) ═══ */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
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
              className="w-full pl-9 sm:pl-10 pr-8 sm:pr-14 h-10 sm:h-11 rounded-full bg-white border border-[#D5EAE3] text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 transition-all"
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
              <span className="hidden sm:inline-flex absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-[#F0F5F3] text-[10px] font-mono text-slate-400 font-medium">
                ⌘ K
              </span>
            )}
          </div>

          {/* Right Action Icons: Top Quote + Notification Bell + Avatar (Desktop only) */}
          <div className="hidden lg:flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Top Creed Quote */}
            <div className="flex flex-col items-end pr-1 text-right select-none">
              <span className="italic text-[11.5px] font-medium text-slate-500 tracking-tight leading-snug">
                Discipline today leads to<br />freedom tomorrow. —
              </span>
              <span className="h-[2px] w-6 bg-[#006B63] rounded-full mt-0.5 ml-auto" />
            </div>

            <button
              type="button"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white border border-[#D5EAE3] shadow-xs text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
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
              className="flex items-center gap-1.5 sm:gap-2 h-10 pl-1 pr-1 sm:pr-3 rounded-full bg-white border border-[#D5EAE3] shadow-xs hover:bg-slate-50 transition-colors cursor-pointer group"
              title="Doctor Profile & Blueprint"
            >
              <div className="h-8 w-8 rounded-full bg-[#2A2322] text-white flex items-center justify-center font-['Outfit'] font-bold text-xs shrink-0 ring-2 ring-slate-900/10">
                {initials}
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Live Search Autocomplete Popup */}
        <AnimatePresence>
          {isSearchOpen && searchResults.length > 0 && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 space-y-2 z-30"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
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
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors"
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
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#006B63] text-white rounded-lg hover:bg-[#005049] transition-colors cursor-pointer"
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
          className={`rounded-3xl border shadow-[0_4px_20px_rgba(0,107,99,0.04)] p-4 sm:p-5 lg:p-6 relative overflow-hidden transition-colors duration-700 ${heroTheme.bannerBg}`}
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
            <div className="space-y-1.5 max-w-xl">
              {/* Doctor Circadian Pill */}
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${timeOfDay === 'night' ? 'text-teal-200/80' : 'text-slate-500'}`}>
                  <GreetingIcon className={`h-3.5 w-3.5 stroke-[2.2] ${heroTheme.greetingIconColor}`} />
                  <span>{greeting}</span>
                </div>
              </div>

              {/* Doctor Name */}
              <div className="pt-0.5">
                <h1 className={`text-3xl sm:text-4xl lg:text-[38px] font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] leading-tight ${heroTheme.nameColor}`}>
                  {userName}
                </h1>
                <p className={`text-xs sm:text-sm leading-relaxed italic mt-1 ${heroTheme.subtitleColor}`}>
                  &ldquo;Consistent study today builds the doctor you&apos;ll be tomorrow.&rdquo;
                </p>
              </div>
            </div>

            {/* Right side: Doctor's Mountain Creed Floating Badge */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="hidden md:flex items-center gap-3.5 bg-white/90 backdrop-blur-md border border-white/90 rounded-2xl px-4 py-2.5 shadow-xs cursor-pointer"
            >
              <div className="h-8 w-11 shrink-0 relative">
                <svg viewBox="0 0 44 24" fill="none" className="w-full h-full drop-shadow-2xs">
                  <path d="M2 24L18 6L26 14L38 24H2Z" fill="#006B63" fillOpacity="0.25" />
                  <path d="M14 24L28 9L36 19L42 24H14Z" fill="#0284C7" fillOpacity="0.2" />
                  <path d="M18 6L21 3V7L18 6Z" fill="#F43F5E" />
                </svg>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-xs font-bold italic text-[#0D3833]">
                  &ldquo;Discipline today leads to freedom tomorrow.&rdquo;
                </p>
                <p className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#5B948C]">
                  DOCTOR&apos;S CREED · FMGE READY
                </p>
              </div>
            </motion.div>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 mt-4 border-t border-[#D0EBE5] relative z-10">
            {/* Card 1: Days remaining */}
            <div className="flex items-center gap-3 rounded-2xl p-3 bg-white border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all min-w-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-[#E3F5F1] text-[#006B63]">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-base sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 truncate">
                  <AnimatedNumber value={daysRemaining} />
                </span>
                <span className="block text-[11px] font-medium text-[#608882] truncate">
                  days to FMGE
                </span>
              </div>
            </div>

            {/* Card 2: Target Score */}
            <div className="flex items-center gap-3 rounded-2xl p-3 bg-white border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all min-w-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-[#E3F5F1] text-[#006B63]">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-base sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 truncate">
                  {savedTargetScore ? `${savedTargetScore}+` : '200+'}
                </span>
                <span className="block text-[11px] font-medium text-[#608882] truncate">
                  Target Score
                </span>
              </div>
            </div>

            {/* Card 3: Subjects count */}
            <div className="flex items-center gap-3 rounded-2xl p-3 bg-white border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all min-w-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-[#E5F1FA] text-[#0A6EB4]">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-base sm:text-lg font-black font-['Outfit'] tabular-nums leading-tight text-slate-900 truncate">
                  19
                </span>
                <span className="block text-[11px] font-medium text-[#608882] truncate">
                  Subjects
                </span>
              </div>
            </div>

            {/* Card 4: Progress / Streak */}
            <div className="flex items-center gap-3 rounded-2xl p-3 bg-white border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all min-w-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-[#FEF1E6] text-[#E07018]">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm sm:text-base font-extrabold font-['Outfit'] leading-tight text-slate-900 truncate">
                  Keep going
                </span>
                <span className="block text-[11px] font-medium text-[#608882] truncate" title="Small steps. Big progress.">
                  Small steps. Big progress.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ 3. SUBJECT FILTER PILLS BAR ═══ */}
        <motion.div
          initial={SECTION_ENTER(0.04, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="relative flex items-center"
        >
          <div
            ref={filterScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none select-none snap-x w-full pr-2 sm:pr-10"
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
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
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
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/95 border border-slate-200 shadow-sm text-slate-500 hover:text-slate-800 items-center justify-center cursor-pointer transition-colors"
            title="Scroll subjects right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* ═══ 4. TWO-COLUMN DESKTOP LAYOUT (LEFT & RIGHT) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ══════════════ LEFT COLUMN (lg:col-span-7) ══════════════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* ── TODAY'S FOCUS CARD ── */}
            <motion.section
              initial={SECTION_ENTER(0.08, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-[28px] border border-[#BEE4DC] bg-gradient-to-br from-[#EAF8F5] via-white to-[#E1F3EF] shadow-[0_8px_30px_rgba(0,107,99,0.04)] p-6 sm:p-7 relative overflow-hidden transition-all duration-300"
            >
              {/* Dynamic Subject-Themed Ambient Background Glow Orbs */}
              <div
                className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none filter blur-3xl opacity-50 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, ${focusTheme.glow} 0%, transparent 70%)`,
                }}
              />
              <div
                className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none filter blur-3xl opacity-30 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, ${focusTheme.glow} 0%, transparent 70%)`,
                }}
              />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                {/* Left side: Focus Text & Actions */}
                <div className="flex-1 space-y-3.5 min-w-0 max-w-md">
                  {/* Category Header Badges */}
                  <div className="space-y-2">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#E0F5F1] text-[#007F75] border border-[#BDE8DF] font-mono shadow-2xs">
                        ✦ TODAY&apos;S FOCUS
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider font-mono bg-[#DCF2F9] text-[#0284A5] shadow-2xs">
                        {activeFocusSubject.name.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Topic Title */}
                  <div className="pt-1">
                    <h2 className="font-['Outfit'] text-2xl sm:text-[26px] font-black tracking-tight text-[#0B2A26] leading-tight break-words">
                      {activeFocusTopic.name}
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#527670] leading-relaxed mt-2 max-w-sm">
                      {adaptiveRecommendation.actionDescription || activeFocusTopic.reason}
                    </p>
                  </div>

                  {/* 4 Meta Badges in 2 Rows */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/90 text-[#3E655F] border border-[#D5EAE3] shadow-2xs">
                        <Calendar className="h-3.5 w-3.5 text-[#3E655F]/70" />
                        <AnimatedNumber value={focusMarks} /> marks
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/90 text-[#3E655F] border border-[#D5EAE3] shadow-2xs">
                        <Clock className="h-3.5 w-3.5 text-[#3E655F]/70" />
                        <AnimatedNumber value={focusMinutes} /> min
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/90 text-[#3E655F] border border-[#D5EAE3] shadow-2xs">
                        <BookOpen className="h-3.5 w-3.5 text-[#3E655F]/70" /> Clinical MCQ
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#FFF0F0] text-[#D32F2F] border border-[#FED7D7] shadow-2xs">
                        <Flame className="h-3.5 w-3.5 fill-[#D32F2F] text-[#D32F2F]" /> High-yield
                      </span>
                    </div>
                  </div>

                  {/* Action Button: Start Session (Desktop & Mobile) */}
                  <div className="pt-3">
                    <motion.button
                      type="button"
                      onClick={startFocusSession}
                      whileHover={{ scale: 1.03, y: -1, boxShadow: '0 10px 24px -4px rgba(0, 107, 99, 0.45)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-full text-sm font-bold bg-[#006B63] hover:bg-[#00554E] text-white shadow-md transition-colors cursor-pointer min-h-[46px]"
                    >
                      <Play className="h-4 w-4 fill-white text-white" />
                      <span>Start Session</span>
                    </motion.button>
                  </div>
                </div>

                {/* Right side: Integrated 3D Anatomical Visual Stage (Matching Reference Mockup) */}
                <div className="relative w-full md:w-[350px] lg:w-[390px] h-[290px] sm:h-[320px] md:h-[340px] shrink-0 flex items-center justify-center pt-2 md:pt-0">
                  {/* Floating Telemetry Pill Top — exactly ONE pill, cleanly positioned above the organ */}
                  <motion.div
                    key={`${activeFocusSubject.id}-${currentTelemetry.label}`}
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute top-2 left-4 sm:left-8 z-30 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#E0F2EC] shadow-[0_4px_14px_rgba(0,107,99,0.06)] pointer-events-none"
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: currentTelemetry.dotColor }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: currentTelemetry.dotColor }}
                      />
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-800 tracking-tight">
                      {currentTelemetry.label}
                    </span>
                  </motion.div>

                  {/* Ambient Telemetry Compass, Cyan ECG Line & Vascular Tree Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    {/* Soft cyan/mint atmospheric glow behind the 3D organ */}
                    <div className="absolute w-72 h-72 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.22)_0%,transparent_70%)] filter blur-2xl pointer-events-none" />

                    <svg viewBox="0 0 380 320" className="w-full h-full stroke-[#006B63] fill-none overflow-visible">
                      {/* Faint Concentric Compass/Radar Rings */}
                      <circle cx="210" cy="165" r="140" strokeDasharray="4 6" strokeWidth="1" strokeOpacity="0.16" />
                      <circle cx="210" cy="165" r="115" strokeWidth="0.8" strokeOpacity="0.12" />
                      <circle cx="210" cy="165" r="85" strokeDasharray="2 4" strokeWidth="0.75" strokeOpacity="0.10" />

                      {/* Horizontal Cyan ECG Waveform Line traversing behind the organ */}
                      <path
                        d="M 10 165 L 120 165 L 132 142 L 140 188 L 148 135 L 158 178 L 168 165 L 370 165"
                        stroke="#0D9488"
                        strokeWidth="1.5"
                        strokeOpacity="0.32"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Clinical ECG Wave Markers */}
                      <text x="126" y="136" className="text-[9px] font-mono font-bold fill-[#006B63] opacity-40">R</text>
                      <text x="144" y="200" className="text-[8.5px] font-mono font-bold fill-[#006B63] opacity-40">QRS</text>
                      <text x="174" y="156" className="text-[9px] font-mono font-bold fill-[#006B63] opacity-40">T</text>

                      {/* Upper-right delicate vascular/bronchial tree branch network */}
                      <g strokeOpacity="0.22" strokeWidth="1.1" strokeLinecap="round">
                        <path d="M 290 85 C 310 65, 335 50, 365 38" />
                        <path d="M 320 60 C 335 45, 350 36, 370 28" />
                        <path d="M 305 75 C 322 86, 345 94, 368 90" />
                        <path d="M 335 84 C 348 95, 362 102, 375 100" />
                        <circle cx="365" cy="38" r="1.5" fill="#006B63" fillOpacity="0.35" />
                        <circle cx="370" cy="28" r="1.5" fill="#006B63" fillOpacity="0.35" />
                        <circle cx="368" cy="90" r="1.5" fill="#006B63" fillOpacity="0.35" />
                        <circle cx="375" cy="100" r="1.5" fill="#006B63" fillOpacity="0.35" />
                      </g>

                      {/* Upper right vertical editorial text: CLINICAL REASONING BETTER OUTCOMES */}
                      <text x="368" y="70" className="text-[8px] font-mono font-extrabold tracking-[0.2em] fill-[#006B63] opacity-45 select-none" textAnchor="end">
                        CLINICAL
                      </text>
                      <text x="368" y="83" className="text-[8px] font-mono font-extrabold tracking-[0.2em] fill-[#006B63] opacity-45 select-none" textAnchor="end">
                        REASONING
                      </text>
                      <text x="368" y="100" className="text-[8px] font-mono font-extrabold tracking-[0.2em] fill-[#006B63] opacity-45 select-none" textAnchor="end">
                        BETTER
                      </text>
                      <text x="368" y="113" className="text-[8px] font-mono font-extrabold tracking-[0.2em] fill-[#006B63] opacity-45 select-none" textAnchor="end">
                        OUTCOMES
                      </text>

                      {/* Faint molecular constellation in top-right */}
                      <g opacity="0.45">
                        <circle cx="340" cy="210" r="2" fill="#006B63" fillOpacity="0.3" />
                        <circle cx="355" cy="195" r="1.8" fill="#006B63" fillOpacity="0.3" />
                        <circle cx="365" cy="225" r="2.2" fill="#006B63" fillOpacity="0.3" />
                        <line x1="340" y1="210" x2="355" y2="195" strokeWidth="0.8" strokeOpacity="0.2" />
                        <line x1="340" y1="210" x2="365" y2="225" strokeWidth="0.8" strokeOpacity="0.2" />
                      </g>
                    </svg>
                  </div>

                  {/* 3D Anatomical Visual — Large, unconstrained, free-breathing */}
                  <div className="relative w-full h-full flex items-center justify-center z-10">
                    <MedicalHeroVisual
                      subjectId={activeFocusSubject.id}
                      subjectName={activeFocusSubject.name}
                      subjectColor={activeFocusSubject.color}
                      topicId={activeFocusTopic.id}
                      topicName={activeFocusTopic.name}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Floating Bottom Capsule Pill: [🟢 GENERAL MEDICINE  ~/\~  Live] */}
                  <motion.div
                    key={`bottom-pill-${activeFocusSubject.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="absolute bottom-1 z-20 inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#D0ECE4] shadow-[0_4px_14px_rgba(0,107,99,0.06)]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-800 truncate">
                        {activeFocusSubject.name}
                      </span>
                    </div>

                    {/* Animated SVG live pulse line */}
                    <div className="w-14 h-4 flex items-center shrink-0">
                      <svg viewBox="0 0 60 18" className="w-full h-full stroke-[#006B63] fill-none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M0 9 L18 9 L22 3 L26 15 L30 5 L34 11 L38 9 L60 9" />
                      </svg>
                    </div>

                    <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
                      Live
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* ── TODAY'S PLAN ── */}
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#006B63] bg-teal-50/80 hover:bg-teal-100/70 border border-teal-200/60 transition-colors cursor-pointer min-h-[32px]"
                  >
                    <span>Planner</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Task Cards List */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-slate-100 overflow-hidden">
                {dailyPlan.tasks.slice(0, 3).map((task, index) => (
                  <div
                    key={task.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Status Check / Play Icon */}
                      <div
                        className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          index === 0
                            ? 'bg-rose-50/90 border border-rose-100 text-rose-500'
                            : 'bg-slate-50 border border-slate-100 text-slate-400'
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
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-teal-50 text-[#006B63] border border-teal-100">
                            MCQ drill
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug break-words">
                          {task.topicName}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-md">
                          {task.reason}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Duration + Start Button + Menu */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-center sm:self-auto">
                      <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-400 tabular-nums">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{task.durationMinutes} min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onLaunchPracticeSession?.(task.subjectId, task.topicId, task.topicName)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#006B63] hover:bg-[#005049] shadow-xs active:scale-95 transition-all cursor-pointer min-h-[32px]"
                      >
                        <Play className="h-3 w-3 fill-white" /> Start
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAiCoach('concept', task.subjectId, task.topicName)}
                        className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSubTabChange('planner')}
                className="w-full text-center text-xs font-semibold text-[#006B63] hover:underline py-1 transition-colors cursor-pointer"
              >
                Open full plan →
              </button>
            </motion.section>

            {/* ── UP NEXT (Revision & Error Remediation) ── */}
            <motion.section
              initial={SECTION_ENTER(0.16, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[#006B63]">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Up Next</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Card 1: Revision (Mint/Green Visual Identity) */}
                <div
                  onClick={() => onNavigateTab('revision')}
                  className="rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/30 border border-emerald-100/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-emerald-300 hover:shadow-xs active:scale-[0.99] transition-all duration-200 cursor-pointer group min-h-[64px]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Revision
                      </span>
                      <span className="block text-[11px] sm:text-xs font-semibold text-emerald-800 mt-0.5">
                        {hasRevisionDue ? `${dailyPlan.revisionDueCount} items due` : "You're all caught up!"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                        Review when new revision items appear.
                      </span>
                    </div>
                  </div>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>

                {/* Card 2: Error Remediation (Amber/Orange Visual Identity) */}
                <div
                  onClick={() => onNavigateTab('errors')}
                  className="rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/30 border border-amber-100/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-amber-300 hover:shadow-xs active:scale-[0.99] transition-all duration-200 cursor-pointer group min-h-[64px]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        Error Remediation
                      </span>
                      <span className="block text-[11px] sm:text-xs font-semibold text-amber-800 mt-0.5">
                        {errorsToReview ? `${dailyPlan.errorRemediationCount} errors to review` : "You're all caught up!"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                        Review when new errors appear.
                      </span>
                    </div>
                  </div>
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ══════════════ RIGHT COLUMN (lg:col-span-5) ══════════════ */}
          <div className="lg:col-span-5 space-y-5">

            {/* ── YOUR EXAM JOURNEY (Teal/Mint Identity) ── */}
            <motion.section
              initial={SECTION_ENTER(0.1, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-[28px] bg-white border border-[#D5EAE3] shadow-[0_4px_20px_rgba(0,107,99,0.03)] p-5 sm:p-6 space-y-4 relative overflow-hidden"
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
                <button
                  type="button"
                  onClick={() => onNavigateTab('progress')}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer flex items-center"
                >
                  View details →
                </button>
              </div>

              {/* Circular Gauge + Stats Block */}
              <div className="flex items-center justify-between gap-3 sm:gap-4 pt-1 relative z-10">
                {/* Circular Gauge */}
                <CircularCountdown
                  days={daysRemaining}
                  totalDays={90}
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

                  {/* Subjects */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs text-slate-500 font-medium">Subjects</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-['Outfit']">19</span>
                  </div>

                  {/* Preparation Elapsed */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Preparation Elapsed</span>
                      <span className="font-bold text-slate-800 tabular-nums">~ 16%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E5F3F0] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#00897B] rounded-full"
                        initial={reducedMotion ? false : { width: 0 }}
                        whileInView={{ width: '16%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Box */}
              <div className="rounded-2xl bg-[#EFF8F6] border border-[#DEF0EB] p-2.5 px-3 flex items-center gap-2.5 mt-2 relative z-10">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-medium text-[#245C54] italic leading-tight">
                  &ldquo;A little progress each day adds up to big results.&rdquo;
                </p>
              </div>
            </motion.section>

            {/* ── YOUR STUDY STREAK ── */}
            <motion.section
              initial={SECTION_ENTER(0.14, reducedMotion)}
              animate={SECTION_SHOW}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="rounded-[28px] bg-white border border-[#D5EAE3] shadow-[0_4px_20px_rgba(0,107,99,0.03)] p-5 sm:p-6 space-y-4 relative overflow-hidden"
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
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#E07018]">
                    <Flame className="h-4 w-4 fill-[#E07018]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0E322D]">Your Study Streak</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('planner')}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer flex items-center"
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
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        isToday
                          ? 'bg-[#00897B] text-white ring-2 ring-[#E07018] ring-offset-2 font-black shadow-xs'
                          : isCompleted
                          ? 'bg-[#00897B] text-white font-bold shadow-2xs'
                          : 'text-slate-600 font-medium'
                      }`}
                    >
                      {dateNum}
                    </div>
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
              className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md p-5 sm:p-6 space-y-4 transition-all duration-200"
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
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer min-h-[32px] flex items-center"
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
                    <div
                      key={sub.id}
                      onClick={() => onSelectSubject(sub.id)}
                      className="group p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
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
                            {studyTimeApprox} • {sub.weightage}m
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${visual.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
                            {visual.statusText}
                          </span>
                        </div>
                      </div>

                      {/* Smooth Animated Progress Bar */}
                      <div className={`w-full h-2 sm:h-2.5 ${visual.track || 'bg-slate-100'} rounded-full overflow-hidden`}>
                        <motion.div
                          className={`h-full rounded-full ${visual.bar}`}
                          initial={reducedMotion ? false : { width: 0 }}
                          whileInView={{ width: `${Math.max(sub.percentage, 4)}%` }}
                          viewport={{ once: true }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : { duration: 0.75, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View all subjects action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateTab('syllabus')}
                  className="w-full text-center text-xs font-semibold text-[#006B63] hover:underline py-1 transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                >
                  View all subjects →
                </button>
              </div>
            </motion.section>

            {/* ── MOTIVATIONAL QUOTE CARD ── */}
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-teal-50/60 to-emerald-50 border border-teal-100/70 p-5 relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <span className="text-3xl font-serif text-[#006B63]/40 leading-none block select-none">
                  &ldquo;
                </span>
                <p className="text-sm font-extrabold text-slate-900 leading-tight">
                  Better preparation.
                </p>
                <p className="text-sm font-extrabold text-[#006B63] leading-tight">
                  A brighter tomorrow.
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block pt-1">
                  ONE SHOT FMGE
                </span>
              </div>
              {/* Subtle mountain graphic on bottom right */}
              <div className="absolute right-2 bottom-0 pointer-events-none opacity-30">
                <svg width="100" height="55" viewBox="0 0 100 55" fill="none">
                  <path d="M10 55L45 15L60 30L90 55H10Z" fill="#0d9488" />
                  <path d="M40 55L70 20L95 50L100 55H40Z" fill="#0284c7" />
                </svg>
              </div>
            </div>

          </div>
        </div>

        {/* ── EXPLORE OTHER HIGH-YIELD SUBJECTS ── */}
        <motion.section
          initial={SECTION_ENTER(0.2, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="space-y-4 pt-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-[#006B63] shrink-0">
                <Flame className="h-4.5 w-4.5 fill-[#006B63] text-[#006B63]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] leading-tight">
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B63] hover:underline cursor-pointer self-start sm:self-auto min-h-[36px]"
            >
              View all 19 subjects <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Grid of Subject Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-3.5">
            {subjectList.map((sub) => {
              const isCurrent = sub.id === activeFocusSubject.id;
              const hyCount = sub.topics.filter((t) => t.isHighYield).length;
              const theme = SUBJECT_CARD_THEMES[sub.id] || DEFAULT_CARD_THEME;

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedFilterSubjectId(sub.id);
                    onSelectSubject(sub.id);
                  }}
                  className={`group relative rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer border bg-gradient-to-b ${theme.bg} ${
                    isCurrent
                      ? 'border-[#006B63] shadow-md ring-2 ring-[#006B63]/25'
                      : `${theme.border} shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5`
                  } active:scale-[0.98]`}
                >
                  {/* Weightage Badge top right */}
                  <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border shadow-2xs backdrop-blur-xs ${theme.badge}`}>
                      {sub.weightage}m
                    </span>
                  </div>

                  {/* 3D Medical Artwork Stage */}
                  <div className="relative w-full h-18 sm:h-20 md:h-20 lg:h-20 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-1 sm:p-1.5 group-hover:scale-105 transition-transform duration-300 ease-out">
                    <div
                      className="absolute inset-0 filter blur-sm pointer-events-none rounded-full"
                      style={{
                        background: `radial-gradient(circle at 50% 55%, ${theme.glow} 0%, transparent 72%)`,
                      }}
                    />
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                      <MedicalSubjectCardVisual subjectId={sub.id} />
                    </div>
                  </div>

                  {/* Content & Metadata */}
                  <div className="mt-1.5 sm:mt-2 pt-0.5 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-[11px] sm:text-xs md:text-[13px] font-bold text-slate-900 group-hover:text-[#006B63] transition-colors truncate"
                          title={sub.name}
                        >
                          {sub.name}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                          {hyCount} High-yield
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 ${
                          isCurrent
                            ? 'bg-[#006B63] text-white shadow-xs'
                            : `bg-white/80 ${theme.arrowText} border border-slate-200/70 shadow-2xs ${theme.arrowBg}`
                        }`}
                      >
                        <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </div>
                    </div>

                    {/* Micro Progress Bar */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex-1 h-1 sm:h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#006B63] to-[#10B981] rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(sub.percentage, 4)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] sm:text-[10px] font-semibold text-slate-600 tabular-nums shrink-0">
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
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
    </div>
  );
};
