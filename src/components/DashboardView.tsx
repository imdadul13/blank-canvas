import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Play,
  ArrowRight,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
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
  TrendingUp
} from 'lucide-react';
import { AppState, DailyTask, PracticeSessionContext } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import {
  getNextBestStudyAction,
  getDaysRemainingToExam,
} from '../utils/adaptivePriorityEngine';
import {
  getPersonalizedDailyPlan,
  getLearningContext,
  PersonalizedPlan,
  PersonalizedPlanTask,
  LearningContext,
} from '../utils/personalizationEngine';
import { MedicalHeroVisual } from './MedicalHeroVisual';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import { NotificationCenterModal } from './NotificationCenterModal';

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
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onToggleMissionCompletion?: (missionId: string) => void;
  activeBg?: { id: string; url: string; label: string; period: string };
  onShuffleBg?: () => void;
  onOpenProfile?: () => void;
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

/** Constrained entrance helpers: fade + subtle upward movement, respecting reduced motion. */
const SECTION_ENTER = (delay: number, reduced: boolean) =>
  reduced ? {} : { delay, y: 8, opacity: 0 };
const SECTION_SHOW = { y: 0, opacity: 1 };
const SECTION_TRANSITION = (reduced: boolean) =>
  reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const SPRING = (reduced: boolean) =>
  reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 34 };

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onNavigateTab,
  onOpenAiCoach,
  onLaunchPracticeSession,
  onToggleTopicState,
  activeBg = { id: 'morning', url: '/images/study-bg/study-art-morning.jpg', label: 'Morning Desk', period: 'Morning' },
  onShuffleBg,
  onOpenProfile,
}) => {
  const { user, profile } = useAuth();
  const [selectedFilterSubjectId, setSelectedFilterSubjectId] = useState<string>('all');
  const [activeMasteryTopic, setActiveMasteryTopic] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  // Notification center modal state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Respect prefers-reduced-motion for the SwiftUI-style entrance/transition motion.
  const reducedMotion = useReducedMotion();

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [hour]);

  const daysRemaining = useMemo(() => getDaysRemainingToExam(state), [state]);

  // Adaptive recommendation (WHAT should I study next, grounded in real priority data)
  const adaptiveRecommendation = useMemo(() => {
    return getNextBestStudyAction(state);
  }, [state]);

  // Personalized planning context derived from the onboarding profile + state.
  // Single source of truth shared with the AI Coach.
  const learningContext: LearningContext = useMemo(
    () => getLearningContext(profile, state),
    [profile, state]
  );

  const dailyPlan: PersonalizedPlan = useMemo(
    () => getPersonalizedDailyPlan(profile, state),
    [profile, state]
  );

  // Task in the plan that's a "do now" action (learning/mcq).
  const nextActionTask = useMemo(() => {
    const actionable = dailyPlan.tasks.find(
      (t) => t.activity === 'learn' || t.activity === 'mcqs'
    );
    return actionable || dailyPlan.tasks[0];
  }, [dailyPlan]);

  // Today's remaining plan tasks (the primary focus is surfaced separately in Today's Focus).
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

  // Subject progress with FMGE relevance — lightweight, information-dense.
  const subjectList = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      const allTopics = [...sub.topics, ...(state.subjectProgress?.[sub.id]?.customTopics || [])];
      const doneNotes = allTopics.filter(
        (t) => state.topicsState?.[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      const percentage = Math.round((doneNotes / Math.max(1, allTopics.length)) * 100);

      let statusText = 'On Track';
      let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      if (percentage < 30) {
        statusText = 'Needs Focus';
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200/60';
      } else if (percentage >= 50) {
        statusText = 'Strong';
        statusColor = 'text-sky-700 bg-sky-50 border-sky-200/60';
      }
      return {
        ...sub,
        percentage,
        statusText,
        statusColor,
      };
    });
  }, [state.subjectProgress, state.topicsState]);

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

  // Exam date & target come from the authenticated profile (via appState.settings).
  const savedExamDate = profile?.examDate || state.settings?.examDate;
  const savedTargetScore = profile?.targetScore || state.settings?.targetScore;

  // Today's Focus facts — all from real adaptive/planning data, never hardcoded.
  const focusMinutes = adaptiveRecommendation.allocatedMinutes || nextActionTask?.durationMinutes || 20;
  const focusMarks = adaptiveRecommendation.weightage || activeFocusSubject.weightage;
  const hasRevisionDue = dailyPlan.revisionDueCount > 0;
  const errorsToReview = dailyPlan.errorRemediationCount > 0;

  const startFocusSession = () =>
    setActiveMasteryTopic({
      subjectId: activeFocusSubject.id,
      topicId: activeFocusTopic.id,
      topicName: activeFocusTopic.name,
    });

  return (
    <div className="relative min-h-screen font-['Plus_Jakarta_Sans'] text-slate-900 pb-4 lg:pb-12">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 lg:pt-8 space-y-4 sm:space-y-6 lg:space-y-8">

        {/* ═══ 1. GREETING + EXAM CONTEXT ═══ */}
        <motion.div
          initial={SECTION_ENTER(0, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        >
          <div className="order-2 sm:order-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-4 w-4 text-sky-600" />
                <AnimatedNumber value={daysRemaining} className="font-bold text-slate-800 tabular-nums" />
                <span>days to FMGE</span>
              </span>
              <span className="text-slate-300">·</span>
              <span>Target {savedTargetScore ? `${savedTargetScore}+` : 'Set target'}</span>
              <span className="text-slate-300">·</span>
              <span>19 subjects</span>
            </p>
            <h1 className="font-['Outfit'] text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 mt-1.5">
              {greeting}, {userName}
            </h1>
          </div>

          <div className="order-1 sm:order-2 flex items-center gap-2.5 justify-between sm:justify-end w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              {/* Study-atmosphere shuffle (cycles background theme — the 80/40/None opacity control lives in Settings and is untouched) */}
              {onShuffleBg && (
                <button
                  type="button"
                  onClick={onShuffleBg}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono font-semibold text-slate-500 bg-white/80 hover:bg-white border border-slate-200/80 shadow-sm transition-colors cursor-pointer"
                  title="Cycle study atmosphere"
                  aria-label="Cycle study atmosphere"
                >
                  <Sparkles className="h-3 w-3 text-sky-500" />
                  <span>{activeBg.label} ⇄</span>
                </button>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search topics..."
                  aria-label="Search topics"
                  className="flex-1 sm:w-48 pl-9 pr-8 h-10 rounded-full bg-white border border-slate-200 focus:border-slate-400 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => setIsNotificationCenterOpen(true)}
                className="relative hidden lg:flex items-center justify-center h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
                title="View Study Notifications"
                aria-label="View Study Notifications"
              >
                <Bell className="h-4.5 w-4.5 stroke-[1.8]" />
                <span className="absolute top-2 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              </button>

              {/* Avatar */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden lg:flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 text-white font-['Outfit'] font-bold text-xs shadow-sm shrink-0 hover:bg-slate-800 transition-all cursor-pointer ring-2 ring-slate-900/10"
                title="View Doctor Profile & Exam Blueprint"
                aria-label="Open profile"
              >
                {initials}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live Search Modal (kept functional) */}
        <AnimatePresence>
          {isSearchOpen && searchResults.length > 0 && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SECTION_TRANSITION(reducedMotion)}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-2 z-30"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Results</span>
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
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">{subject.name}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">{topic.name}</span>
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
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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

        {/* ═══ 2. SUBJECT FILTER — sliding active indicator, full scrollable access ═══ */}
        <motion.div
          initial={SECTION_ENTER(0.03, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="-mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none select-none snap-x">
            {[{ id: 'all', name: 'All Subjects', meta: '19' }, ...FMGE_SUBJECTS.map((s) => ({ id: s.id, name: s.name, meta: undefined as string | undefined }))].map((f) => {
              const active = selectedFilterSubjectId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilterSubjectId(f.id)}
                  aria-pressed={active}
                  className={`relative snap-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                    active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-filter-active"
                      transition={SPRING(reducedMotion)}
                      className="absolute inset-0 rounded-full bg-slate-900 shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{f.name}</span>
                  {f.meta && <span className={`relative z-10 ${active ? 'text-white/70' : 'text-slate-400'}`}>({f.meta})</span>}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ 3. TODAY'S FOCUS — the single strongest actionable element ═══ */}
        <motion.section
          initial={SECTION_ENTER(0.06, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
        >
          <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left: focus content */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:max-w-[58%] space-y-4">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/60 font-mono">
                    ★ Today&apos;s Focus
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    {activeFocusSubject.name}
                  </span>
                </div>

                <div>
                  <h2 className="font-['Outfit'] text-2xl sm:text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight">
                    {activeFocusTopic.name}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xl mt-1.5">
                    {adaptiveRecommendation.actionDescription || activeFocusTopic.reason}
                  </p>
                </div>

                {/* WHY / HOW LONG / WHAT ACTION — real facts */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/70">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    <AnimatedNumber value={focusMarks} /> marks
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/70">
                    <Timer className="h-3.5 w-3.5 text-slate-400" />
                    <AnimatedNumber value={focusMinutes} /> min
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/70">
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" /> Clinical MCQ
                  </span>
                  {activeFocusTopic.isHighYield && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white border border-slate-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> High-yield
                    </span>
                  )}
                  {hasRevisionDue && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      <RotateCcw className="h-3.5 w-3.5" /> Revision due
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-3 pt-1.5">
                  <motion.button
                    type="button"
                    onClick={startFocusSession}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" /> Start Session
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => onSelectSubject(activeFocusSubject.id)}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Subject Roadmap <ArrowRight className="h-4 w-4 text-slate-400" />
                  </motion.button>
                </div>
              </div>

              {/* Right: medical visual — fills right side of hero, edge-to-edge */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative lg:w-[42%] h-40 sm:h-48 lg:h-auto min-h-[160px] px-4 lg:px-0 pb-4 lg:pb-0"
              >
                <MedicalHeroVisual
                  subjectId={activeFocusSubject.id}
                  subjectName={activeFocusSubject.name}
                  subjectColor={activeFocusSubject.color}
                  className="w-full h-full lg:absolute lg:inset-0"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ═══ 4. TODAY'S PLAN ═══ */}
        <motion.section
          initial={SECTION_ENTER(0.09, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="space-y-3"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Today&apos;s Plan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {learningContext.phaseTitle}
                {learningContext.baselinePending
                  ? ' — initial plan from your onboarding. Complete a diagnostic to make this more precise.'
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200/80 text-slate-600">
                <Calendar className="h-3 w-3 text-slate-400" /> {learningContext.gtFrequencyLabel}
              </span>
            </div>
          </div>

          {learningContext.baselinePending && (
            <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 px-4 py-3 text-xs text-sky-900 flex items-start gap-2">
              <Activity className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                Initial plan based on your onboarding. Complete a diagnostic
                ({savedTargetScore ? `target ${savedTargetScore}+` : 'set a target'}) to make recommendations more precise.
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            <AnimatePresence initial={false}>
              {todayPlanTasks.length === 0 && dailyPlan.tasks.length === 0 && (
                <motion.div
                  key="empty-plan"
                  initial={SECTION_ENTER(0, reducedMotion)}
                  animate={SECTION_SHOW}
                  exit={{ opacity: 0 }}
                  transition={SECTION_TRANSITION(reducedMotion)}
                  className="p-5 text-sm text-slate-500"
                >
                  Add study data to generate your personalized plan.
                </motion.div>
              )}
              {todayPlanTasks.map((task, index) => (
                <PlanTaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  reducedMotion={reducedMotion}
                  onLaunch={onLaunchPracticeSession}
                  onAskCoach={onOpenAiCoach}
                />
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('daily')}
            className="w-full text-center text-xs font-semibold text-sky-700 hover:text-sky-900 py-1.5 transition-colors cursor-pointer"
          >
            Open full plan
          </button>
        </motion.section>

        {/* ═══ 5. YOUR PROGRESS ═══ */}
        <motion.section
          initial={SECTION_ENTER(0.12, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Your Progress</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('syllabus')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
            >
              View curriculum →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {subjectList.slice(0, 8).map((sub) => {
              const active = selectedFilterSubjectId === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className={`group flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 cursor-pointer transition-all hover:border-slate-300 ${
                    active ? 'border-slate-900 ring-1 ring-slate-900/10' : 'border-slate-200/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-slate-900 truncate group-hover:text-sky-700 transition-colors">{sub.name}</span>
                      <span className="text-xs font-mono font-semibold text-slate-500 tabular-nums shrink-0">{sub.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-slate-800 rounded-full"
                          initial={reducedMotion ? false : { width: 0 }}
                          animate={{ width: `${sub.percentage}%` }}
                          transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{sub.weightage}m</span>
                    </div>
                  </div>
                  <span className={`hidden sm:inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sub.statusColor}`}>
                    {sub.statusText}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ═══ 6. CONTEXTUAL ACTIONS — only when real state exists ═══ */}
        <motion.section
          initial={SECTION_ENTER(0.15, reducedMotion)}
          animate={SECTION_SHOW}
          transition={SECTION_TRANSITION(reducedMotion)}
          className="space-y-3"
        >
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Up Next
          </h3>

          {!hasRevisionDue && !errorsToReview ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm text-slate-500 flex items-center gap-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              You&apos;re all caught up — review when new revision or errors appear.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hasRevisionDue && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('revision')}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                >
                  <span className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <RotateCcw className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {dailyPlan.revisionDueCount} revision{dailyPlan.revisionDueCount > 1 ? 's' : ''} due
                    </span>
                    <span className="block text-xs text-slate-500">Spaced recall is ready</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}
              {errorsToReview && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('errors')}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                >
                  <span className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                      {dailyPlan.errorRemediationCount} error{dailyPlan.errorRemediationCount > 1 ? 's' : ''} to review
                    </span>
                    <span className="block text-xs text-slate-500">Remediate missed questions</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}
            </div>
          )}
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

interface PlanTaskRowProps {
  task: PersonalizedPlanTask;
  index: number;
  reducedMotion: boolean;
  onLaunch?: (subjectId: string, topicId: string, topicName: string, subtopic?: string) => void;
  onAskCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
}

const PLAN_ACTIVITY_ICON: Record<string, string> = {
  learn: 'Active learning',
  recall: 'Recall',
  mcqs: 'MCQ drill',
  errors: 'Error remediation',
  revision: 'Revision',
};

const PlanTaskRow: React.FC<PlanTaskRowProps> = ({ task, index, reducedMotion, onLaunch, onAskCoach }) => {
  const launchPractice = () =>
    onLaunch?.(task.subjectId, task.topicId, task.topicName);
  const openCoach = () =>
    onAskCoach?.(task.activity === 'errors' ? 'concept' : 'strategy', task.subjectId, task.topicName);

  return (
    <motion.div
      layout={!reducedMotion}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SECTION_TRANSITION(reducedMotion)}
      className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50/80 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="h-9 w-9 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"
            style={{ borderColor: `${task.subjectColor}22`, backgroundColor: `${task.subjectColor}0d`, color: task.subjectColor }}
          >
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: task.subjectColor }}>
                {task.subjectName.toUpperCase()}
              </span>
              <span className="text-[11px] font-medium text-sky-600">
                {PLAN_ACTIVITY_ICON[task.activity] || task.activityLabel}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 truncate">{task.topicName}</h4>
            <p className="text-xs text-slate-500 truncate">{task.reason}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline text-xs font-semibold text-slate-500 tabular-nums">{task.durationMinutes} min</span>
        <button
          type="button"
          onClick={launchPractice}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-opacity cursor-pointer"
          style={{ backgroundColor: task.subjectColor }}
        >
          <Play className="h-3.5 w-3.5 fill-white" /> Start
        </button>
        {task.activity === 'errors' && (
          <button
            type="button"
            onClick={openCoach}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Coach
          </button>
        )}
      </div>
    </motion.div>
  );
};
