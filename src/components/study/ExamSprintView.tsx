import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Award,
  BookOpen,
  Filter,
  Play,
  RotateCcw,
  Activity,
  Flame,
  Lightbulb,
  Search,
  X,
  Check,
  TrendingUp,
  FileText,
  Eye,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import {
  SPRINT_TIERS,
  SPRINT_DAYS,
  daysUntilFmge,
  sprintDateForIndex,
  sprintDayIndex,
  checklistsForPlan,
  buildAdaptiveSprintDays,
  localDateKey,
  FMGE_EXAM_DATE,
  type SprintDay,
} from '../../utils/sprintEngine';
import {
  getDailyStudyBlueprint,
  SPRINT_STUDY_BLUEPRINTS,
  type BlueprintTopic,
  type DailyStudyBlueprint,
} from '../../data/sprintStudyBlueprints';
import { VISUAL_CONCEPT_REGISTRY, type VisualConceptAsset } from '../../utils/visualQuestionEngine';
import { calculateTopicPerformanceMetrics } from '../../utils/performanceEngine';
import type { AppState, McqAttempt, GrandTest } from '../../types';
import { SubjectAppleIcon } from '../SubjectAppleIcon';

interface ExamSprintViewProps {
  state: AppState;
  onLaunchPracticeMcq: (subjectId: string, topicId?: string, topicName?: string) => void;
  onOpenFlashcards: (subjectId: string, topicId?: string) => void;
  onSelectSubject: (subjectId: string) => void;
  onUpdateSprint?: (sprint: NonNullable<AppState['fmgeSprint']>) => void;
  onOpenDailyPlanner?: () => void;
  onOpenRevisionMatrix?: () => void;
  onNavigateTab?: (tab: any) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
}

// — Circular SVG Gauge
const Gauge: React.FC<{
  pct: number;
  size?: number;
  sw?: number;
  color?: string;
  track?: string;
}> = ({ pct, size = 52, sw = 4.5, color = '#10B981', track = '#E5E7EB' }) => {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-black text-slate-900 tracking-tight leading-none">
        {pct}%
      </span>
    </div>
  );
};

export const ExamSprintView: React.FC<ExamSprintViewProps> = ({
  state,
  onLaunchPracticeMcq,
  onOpenFlashcards,
  onSelectSubject,
  onUpdateSprint,
  onOpenDailyPlanner,
  onOpenRevisionMatrix,
  onNavigateTab,
  onToggleTopicState,
}) => {
  const sprint = state.fmgeSprint;
  const attempts = state.mcqAttempts || [];
  const grandTests = state.grandTests || [];

  const [activeTier, setActiveTier] = useState<number | 'all'>('all');
  const [dailyHours, setDailyHours] = useState<number>(sprint?.dailyHours || 6);
  const [activeVisualAsset, setActiveVisualAsset] = useState<VisualConceptAsset | null>(null);
  const [showAnnotatedImage, setShowAnnotatedImage] = useState(false);
  const [showChecklistTasks, setShowChecklistTasks] = useState(false);

  const configuredExamDate = state.settings?.examDate || FMGE_EXAM_DATE;
  const daysLeft = daysUntilFmge(configuredExamDate);
  const isExamDay = daysLeft === 0;

  // Compute current sprint day index (0 to 19)
  const currentDay = sprint
    ? sprintDayIndex(sprint.startedOn, configuredExamDate)
    : Math.min(19, Math.max(0, 20 - daysLeft));
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  const adaptiveDays = useMemo(
    () => buildAdaptiveSprintDays(attempts, grandTests, sprint?.errorTypes || {}),
    [attempts, grandTests, sprint?.errorTypes]
  );

  const activePlan: SprintDay = adaptiveDays[selectedDay] || adaptiveDays[0];
  const blueprint: DailyStudyBlueprint = useMemo(
    () => getDailyStudyBlueprint(selectedDay),
    [selectedDay]
  );

  // Helper to get friendly subject name
  const getSubjectName = (subId: string) => {
    return FMGE_SUBJECTS.find((s) => s.id === subId)?.name || subId.toUpperCase();
  };

  // Helper to check if a blueprint topic is marked as completed
  const isTopicCompleted = (topic: BlueprintTopic): boolean => {
    const key = `${topic.subjectId}-${topic.id}`;
    const topicState = state.topicsState[key];
    if (topicState && typeof topicState.notesDone === 'boolean') {
      return topicState.notesDone;
    }
    return !!(
      sprint?.completedTasks?.[`topic-${topic.id}`] ||
      sprint?.completedTasks?.[`${selectedDay}-topic-${topic.id}`]
    );
  };

  // Helper for topic revision status
  const getTopicRevisionState = (topic: BlueprintTopic) => {
    const key = `${topic.subjectId}-${topic.id}`;
    const topicState = state.topicsState[key];
    return {
      r1: !!topicState?.r1Done,
      r2: !!topicState?.r2Done,
      r3: !!topicState?.r3Done,
    };
  };

  // Handle toggling topic completion in both topicsState and sprint.completedTasks
  const handleToggleSprintTopic = (topic: BlueprintTopic) => {
    const currentlyDone = isTopicCompleted(topic);
    const nextDone = !currentlyDone;

    if (onToggleTopicState) {
      onToggleTopicState(topic.subjectId, topic.id, 'notesDone');
    }

    if (onUpdateSprint) {
      const updatedTasks = {
        ...(sprint?.completedTasks || {}),
        [`topic-${topic.id}`]: nextDone,
        [`${selectedDay}-topic-${topic.id}`]: nextDone,
      };
      onUpdateSprint({
        startedOn: sprint?.startedOn || localDateKey(),
        dailyHours,
        completedTasks: updatedTasks,
        ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}),
        ...(sprint?.taskQuestionIds ? { taskQuestionIds: sprint.taskQuestionIds } : {}),
      });
    }
  };

  // Handle toggling revision round
  const handleToggleRevisionRound = (
    topic: BlueprintTopic,
    field: 'r1Done' | 'r2Done' | 'r3Done'
  ) => {
    if (onToggleTopicState) {
      onToggleTopicState(topic.subjectId, topic.id, field);
    }
  };

  // Performance metrics & error vault items for a topic
  const getTopicPerformance = (topic: BlueprintTopic) => {
    return calculateTopicPerformanceMetrics(topic.subjectId, topic.id, attempts);
  };

  const getTopicUnreviewedErrorsCount = (topic: BlueprintTopic) => {
    return (state.errorNotebook || []).filter(
      (err) =>
        !err.isReviewed &&
        (err.topicId === topic.id || (err.subjectId === topic.subjectId && err.topic === topic.name))
    ).length;
  };

  // Unreviewed errors for today's subjects
  const unreviewedSubjectErrors = useMemo(() => {
    const subjects = blueprint.subjects;
    return (state.errorNotebook || []).filter(
      (err) => !err.isReviewed && subjects.includes(err.subjectId)
    );
  }, [state.errorNotebook, blueprint.subjects]);

  // Today's attempts & accuracy metrics
  const todayDateKey = localDateKey();
  const todayAttempts = useMemo(() => {
    return (attempts || []).filter((a) => a.timestamp && a.timestamp.startsWith(todayDateKey));
  }, [attempts, todayDateKey]);

  const todayCorrect = todayAttempts.filter((a) => a.isCorrect).length;
  const todayAccuracy =
    todayAttempts.length > 0 ? Math.round((todayCorrect / todayAttempts.length) * 100) : 0;

  // Blueprint topics completion metrics
  const mustStudyCompletedCount = blueprint.mustStudyTopics.filter(isTopicCompleted).length;
  const ifTimeRemainsCompletedCount = blueprint.ifTimeRemainsTopics.filter(isTopicCompleted).length;
  const totalBlueprintTopicsCount = blueprint.mustStudyTopics.length;
  const blueprintCompletionPct =
    totalBlueprintTopicsCount > 0
      ? Math.round((mustStudyCompletedCount / totalBlueprintTopicsCount) * 100)
      : 100;

  // Tier metrics computation
  const tierMetrics = useMemo(() => {
    return SPRINT_TIERS.map((tier) => {
      let totalTopics = 0;
      let completedTopics = 0;

      tier.subjectIds.forEach((subId) => {
        const sub = FMGE_SUBJECTS.find((s) => s.id === subId);
        if (!sub) return;
        const subProgress = state.subjectProgress[subId];
        const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
        totalTopics += allTopics.length;
        completedTopics += allTopics.filter(
          (t) => state.topicsState[`${subId}-${t.id}`]?.notesDone ?? t.notesDone
        ).length;
      });

      const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      return {
        ...tier,
        totalTopics,
        completedTopics,
        pct,
      };
    });
  }, [state.subjectProgress, state.topicsState]);

  // Overall sprint progress
  const overallSprintPct = Math.round(((20 - Math.min(20, Math.max(0, daysLeft))) / 20) * 100);

  const handleToggleTask = (taskIndex: number) => {
    if (!onUpdateSprint) return;
    const key = `${selectedDay}-${taskIndex}`;
    const updatedTasks = {
      ...(sprint?.completedTasks || {}),
      [key]: !sprint?.completedTasks?.[key],
    };
    onUpdateSprint({
      startedOn: sprint?.startedOn || localDateKey(),
      dailyHours,
      completedTasks: updatedTasks,
      ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}),
      ...(sprint?.taskQuestionIds ? { taskQuestionIds: sprint.taskQuestionIds } : {}),
    });
  };

  const tasksForToday = useMemo(() => {
    const questionTarget = activePlan.fullMock
      ? 300
      : selectedDay === 0
      ? 50
      : Math.max(20, Math.round((activePlan.questions * dailyHours) / 6));
    return checklistsForPlan(activePlan, dailyHours, questionTarget);
  }, [activePlan, dailyHours, selectedDay]);

  const activeDayTasksCompletedCount = tasksForToday.filter(
    (_, idx) => !!sprint?.completedTasks?.[`${selectedDay}-${idx}`]
  ).length;

  // 5-Metric Transparent Readiness Summary across all 19 FMGE subjects
  const readinessMetrics = useMemo(() => {
    let totalTopics = 0;
    let reviewedTopics = 0;
    const allTopicsList: { subjectId: string; topicId: string; topicName: string }[] = [];

    FMGE_SUBJECTS.forEach((sub) => {
      const subProg = state.subjectProgress[sub.id];
      const topics = [...sub.topics, ...(subProg?.customTopics || [])];
      topics.forEach((t) => {
        totalTopics += 1;
        const key = `${sub.id}-${t.id}`;
        const isDone = state.topicsState[key]?.notesDone ?? t.notesDone ?? false;
        if (isDone) reviewedTopics += 1;
        allTopicsList.push({ subjectId: sub.id, topicId: t.id, topicName: t.name });
      });
    });

    const totalQuestions = (attempts || []).length;
    const correctCount = (attempts || []).filter((a) => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const unresolvedErrors = (state.errorNotebook || []).filter((e) => !e.isReviewed);

    // Strict demonstrated mastery:
    // Topic is only counted as mastered if:
    // 1. At least 5 attempts in that topic
    // 2. Topic accuracy >= 80%
    // 3. Zero unresolved errors in Error Vault for this topic
    let demonstratedMasteryCount = 0;
    allTopicsList.forEach((t) => {
      const tAttempts = (attempts || []).filter(
        (a) => a.topicId === t.topicId || (a.subjectId === t.subjectId && a.topicName === t.topicName)
      );
      if (tAttempts.length >= 5) {
        const tCorrect = tAttempts.filter((a) => a.isCorrect).length;
        const tAcc = (tCorrect / tAttempts.length) * 100;
        const hasUnresolved = unresolvedErrors.some(
          (e) => e.topicId === t.topicId || (e.subjectId === t.subjectId && e.topic === t.topicName)
        );
        if (tAcc >= 80 && !hasUnresolved) {
          demonstratedMasteryCount += 1;
        }
      }
    });

    return {
      totalTopics,
      reviewedTopics,
      reviewedPct: totalTopics > 0 ? Math.round((reviewedTopics / totalTopics) * 100) : 0,
      totalQuestions,
      accuracy,
      unresolvedErrorsCount: unresolvedErrors.length,
      unresolvedErrors,
      demonstratedMasteryCount,
    };
  }, [state.subjectProgress, state.topicsState, state.errorNotebook, attempts]);

  return (
    <div className="space-y-5 sm:space-y-7 pb-24 sm:pb-20 lg:pb-16 font-['Plus_Jakarta_Sans'] text-[#1D1D1F]">
      {/* ═══ 1. ATMOSPHERIC HERO BANNER (REVISION MATRIX SIGNATURE DESIGN) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem]"
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 35%, #047857 70%, #059669 100%)',
          boxShadow: '0 8px 40px rgba(5,150,105,0.28), 0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(52,211,153,0.35) 0%, transparent 65%)' }}
        />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Decorative orbit circles */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 sm:w-52 sm:h-52 rounded-full border border-white/[0.08] pointer-events-none" />
        <div className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <Flame className="h-4 w-4 text-emerald-300" />
                </div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {isExamDay ? `EXAM DAY · ${configuredExamDate}` : 'EMERGENCY SPRINT BLUEPRINT'}
                </span>
              </div>

              <h1 className="text-[36px] sm:text-[48px] font-black tracking-[-0.04em] leading-[0.88] text-white">
                {isExamDay ? (
                  <>
                    Today is the Day, Doctor.<br />
                    <span style={{ color: '#6EE7B7' }}>150+ to Victory.</span>
                  </>
                ) : (
                  <>
                    Speed. Focus.<br />
                    <span style={{ color: '#6EE7B7' }}>150+ Mark Margin.</span>
                  </>
                )}
              </h1>

              <p className="text-[13px] sm:text-[14px] text-white/70 leading-snug max-w-lg">
                {isExamDay
                  ? '300 Questions across two 150-minute papers. Zero negative marking: never leave any question blank. Pacing: 1 minute per question. Stay calm and trust your preparation.'
                  : 'Rule of 160: 6 heavyweight subjects deliver 165+ marks with zero negative marking. Replace textbook fatigue with daily focused recall and MCQ blitzes.'}
              </p>

              {/* Countdown progress bar */}
              <div className="max-w-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                  <span>{isExamDay ? 'Exam Day Status' : 'Sprint Timeline'}</span>
                  <span style={{ color: '#6EE7B7' }}>
                    {isExamDay ? 'Active Today · Qualify (150+)' : `${daysLeft} Days Left (${overallSprintPct}%)`}
                  </span>
                </div>
                <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${isExamDay ? 100 : overallSprintPct}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #6EE7B7 0%, #10B981 100%)',
                      boxShadow: '0 0 10px rgba(110,231,183,0.6)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Quick Action Pill & Shortcuts */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => onLaunchPracticeMcq(blueprint.subjects[0] || activePlan.subjects[0] || 'obg')}
                className="px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm shadow-lg hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>{isExamDay ? 'Volatile Drill' : "Launch Today's Drill"}</span>
              </button>
              {onOpenDailyPlanner && (
                <button
                  type="button"
                  onClick={onOpenDailyPlanner}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 border border-white/20 text-white font-semibold text-xs hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
                  title="Open Daily Planner with Pomodoro and study checklist"
                >
                  <Clock className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Daily Planner</span>
                </button>
              )}
              {onOpenRevisionMatrix && (
                <button
                  type="button"
                  onClick={onOpenRevisionMatrix}
                  className="px-4 py-2.5 rounded-2xl bg-white/15 border border-white/20 text-white font-semibold text-xs hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
                  title="Open Revision Matrix for R1/R2/R3 scheduling"
                >
                  <Layers className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Revision Matrix</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. 3 BENTO METRIC CARDS WITH CIRCULAR GAUGES (WEIGHTAGE TIERS) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            tier: 1,
            title: 'Tier 1: Heavyweights',
            subtitle: '~165 Marks · 6 Subjects',
            pct: tierMetrics[0]?.pct || 0,
            done: tierMetrics[0]?.completedTopics || 0,
            total: tierMetrics[0]?.totalTopics || 0,
            color: '#10B981',
            track: '#D1FAE5',
            gradient: 'from-emerald-500 to-teal-600',
            border: 'border-emerald-200/70',
            description: 'Medicine, Surgery, OBG, PSM, Pathology, Pharma. Where clearing the exam is won.',
          },
          {
            tier: 2,
            title: 'Tier 2: High-Yield Clinical',
            subtitle: '~75 Marks · 6 Subjects',
            pct: tierMetrics[1]?.pct || 0,
            done: tierMetrics[1]?.completedTopics || 0,
            total: tierMetrics[1]?.totalTopics || 0,
            color: '#0891B2',
            track: '#CFFAFE',
            gradient: 'from-cyan-500 to-blue-600',
            border: 'border-cyan-200/70',
            description: 'Pediatrics, ENT, Ophthalmology, Ortho, Micro, FMT. High scoring yield per study hour.',
          },
          {
            tier: 3,
            title: 'Tier 3: Pre-Clinical & Shorts',
            subtitle: '~60 Marks · 7 Subjects',
            pct: tierMetrics[2]?.pct || 0,
            done: tierMetrics[2]?.completedTopics || 0,
            total: tierMetrics[2]?.totalTopics || 0,
            color: '#8B5CF6',
            track: '#EDE9FE',
            gradient: 'from-purple-500 to-indigo-600',
            border: 'border-purple-200/70',
            description: 'Anatomy, Physio, Biochem, Derm, Psych, Radio, Anesthesia. Buzzword pattern recall.',
          },
        ].map((item, idx) => (
          <motion.div
            key={item.tier}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border ${item.border} bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all group`}
          >
            <div className="relative flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                    style={{ boxShadow: `0 3px 10px ${item.color}35` }}
                  >
                    <span className="font-mono font-black text-[13px]">T{item.tier}</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1D1D1F] text-[14px] leading-tight">{item.title}</div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
                <Gauge pct={item.pct} size={52} sw={4.5} color={item.color} track={item.track} />
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(item.pct > 0 ? 5 : 0, item.pct)}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-mono text-slate-500">{item.done} / {item.total} topics</span>
                  <span className="font-semibold" style={{ color: item.color }}>{item.pct}% done</span>
                </div>
              </div>

              <p className="text-[11px] text-[#8E8E93] leading-snug border-t border-slate-100 pt-2.5">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ 2.5 TRANSPARENT READINESS SUMMARY (5 CRITICAL LEARNING METRICS) ═══ */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#1D1D1F] text-[15px] leading-tight flex items-center gap-2">
                <span>Transparent Exam Readiness Verification</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Oct 31, 2026 Target
                </span>
              </h2>
              <p className="text-[11px] text-[#8E8E93]">
                Honest progress tracking separating raw syllabus completion from verified MCQ accuracy and Error Vault status.
              </p>
            </div>
          </div>
          {onOpenRevisionMatrix && (
            <button
              type="button"
              onClick={onOpenRevisionMatrix}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>View Revision Matrix</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Material Reviewed */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              Material Reviewed
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {readinessMetrics.reviewedTopics}
              </span>
              <span className="text-xs font-mono text-slate-400">/ {readinessMetrics.totalTopics}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${readinessMetrics.reviewedPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block pt-0.5 font-mono">
              {readinessMetrics.reviewedPct}% topics reviewed
            </span>
          </div>

          {/* 2. Questions Attempted */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              Questions Solved
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {readinessMetrics.totalQuestions}
              </span>
              <span className="text-xs font-mono text-slate-400">MCQs</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-tight pt-1">
              Active volume across verified drills and mocks
            </p>
          </div>

          {/* 3. Overall Accuracy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              Overall Accuracy
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                readinessMetrics.totalQuestions === 0
                  ? 'text-slate-400'
                  : readinessMetrics.accuracy >= 70
                  ? 'text-emerald-700'
                  : readinessMetrics.accuracy >= 55
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}>
                {readinessMetrics.totalQuestions > 0 ? `${readinessMetrics.accuracy}%` : '—'}
              </span>
              <span className="text-xs font-mono text-slate-400">target ≥65%</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-tight pt-1">
              {readinessMetrics.totalQuestions === 0
                ? 'No MCQs logged yet'
                : readinessMetrics.accuracy >= 70
                ? 'On track for safe 150+ margin'
                : 'Need more active recall retesting'}
            </p>
          </div>

          {/* 4. Unresolved Errors */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              Unresolved Errors
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                readinessMetrics.unresolvedErrorsCount === 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {readinessMetrics.unresolvedErrorsCount}
              </span>
              <span className="text-xs font-mono text-slate-400">in Error Vault</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-tight pt-1">
              {readinessMetrics.unresolvedErrorsCount === 0
                ? 'Zero pending weak items'
                : 'Prioritized for rapid retest'}
            </p>
          </div>

          {/* 5. Demonstrated Mastery */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1 col-span-2 lg:col-span-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-semibold block">
              Demonstrated Mastery
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                {readinessMetrics.totalQuestions < 10 ? '—' : readinessMetrics.demonstratedMasteryCount}
              </span>
              <span className="text-xs font-mono text-emerald-700">
                {readinessMetrics.totalQuestions < 10 ? 'insufficient data' : 'topics verified'}
              </span>
            </div>
            <p className="text-[10px] text-emerald-900 leading-tight pt-1">
              {readinessMetrics.totalQuestions < 10
                ? 'Solve ≥10 questions to establish performance'
                : 'Strict rule: ≥5 MCQs, ≥80% accuracy, 0 unresolved errors'}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 3. MAIN SPRINT MATRIX (8 COLS) + SIDEBAR (4 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 8 Cols */}
        <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden space-y-5 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">
                  {isExamDay ? 'NBE FMGE Exam Day Protocol' : 'Daily Study Blueprint · 20-Day Sprint'}
                </h2>
                <p className="text-[11px] text-[#8E8E93] font-mono">
                  {isExamDay
                    ? `${configuredExamDate} · D-Day`
                    : `${sprintDateForIndex(selectedDay, configuredExamDate)} · Day ${selectedDay + 1} of 20 ${
                        selectedDay === currentDay ? '(Today)' : ''
                      }`}
                </p>
              </div>
            </div>

            {/* Hours selector (hidden on exam day) */}
            {!isExamDay && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs">
                <span className="font-semibold text-slate-500 pl-1.5">Study Target:</span>
                {[4, 6, 8, 10].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDailyHours(h)}
                    className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                      dailyHours === h
                        ? 'bg-white text-[#1D1D1F] shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            )}
          </div>

          {isExamDay ? (
            /* Dedicated Exam Day Protocol View */
            <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-5">
              <div className="flex items-center gap-3 border-b border-emerald-200/80 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Official Exam Day Protocol · 300 Questions
                  </h3>
                  <p className="text-xs text-slate-600">
                    Two 150-minute blocks · Passing threshold: 150 / 300 (50%) · Zero negative marking
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-800">
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 1: Never Leave Blanks</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    FMGE has strictly ZERO negative marking. Even on complete guesses, selecting an answer gives you a 25% chance of securing a pass-defining mark.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 2: Pacing Discipline (60s / Q)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    150 questions in 150 minutes per paper. Mark lengthy clinical vignettes for review and keep moving. Finish your first sweep in 120 minutes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 3: Read Lead-In First</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    For lengthy clinical stems, read the last sentence (the actual question) and the 4 options before reading the vignette. This instantly filters what data to spot.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 4: Trust First Instinct</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Only change an answer if you find an objective misread in your initial attempt. Overthinking during second-guessing degrades clinical accuracy.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-200/80">
                <span className="text-xs font-semibold text-emerald-900">
                  You are prepared. You only need 150 marks out of 300 to qualify as a doctor in India.
                </span>
                {onOpenRevisionMatrix && (
                  <button
                    type="button"
                    onClick={onOpenRevisionMatrix}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    Quick Matrix Recall
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 20-Day Stepper Horizontal Scroller */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Day Timeline (20 Days to FMGE)
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  {adaptiveDays.map((dayPlan, idx) => {
                    const isToday = idx === currentDay;
                    const isSelected = idx === selectedDay;
                    const dayDateStr = sprintDateForIndex(idx, configuredExamDate);
                    const dayBlueprint = getDailyStudyBlueprint(idx);
                    const mustStudyCount = dayBlueprint.mustStudyTopics.length;
                    const doneCount = dayBlueprint.mustStudyTopics.filter(isTopicCompleted).length;
                    const isDone = mustStudyCount > 0 && doneCount === mustStudyCount;

                    const dayDate = new Date(`${dayDateStr}T12:00:00`);
                    const monthShort = dayDate.toLocaleDateString('en-US', { month: 'short' });
                    const dayNum = dayDate.getDate();

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDay(idx)}
                        className={`shrink-0 flex flex-col items-center justify-center min-w-[74px] py-2 px-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                            : isToday
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-400/40'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">
                          {idx === 19 ? 'Eve' : isToday ? 'Today' : `Day ${idx + 1}`}
                        </span>
                        <span className="text-xs font-black">
                          {monthShort} {dayNum}
                        </span>
                        {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-300 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ 1. TODAY'S MISSION CARD ═══ */}
              <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/80 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        Day {selectedDay + 1} of 20
                      </span>
                      <span className="text-xs text-slate-600 font-mono font-semibold">
                        {sprintDateForIndex(selectedDay, configuredExamDate)}
                      </span>
                      {selectedDay === currentDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          Current Date
                        </span>
                      )}
                      {blueprint.isFullMock && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          300Q Full Mock
                        </span>
                      )}
                      {blueprint.isRestDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Rest & Calibration
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {blueprint.title}
                    </h3>

                    {/* Subject Insignias */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {blueprint.subjects.map((subId) => (
                        <div
                          key={subId}
                          onClick={() => onSelectSubject(subId)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-[11px] font-bold shadow-2xs hover:border-emerald-400 transition-colors cursor-pointer"
                        >
                          <SubjectAppleIcon subjectId={subId} size="sm" />
                          <span>{getSubjectName(subId)}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium pt-1">
                      {blueprint.missionStatement}
                    </p>
                  </div>

                  {/* Right: Mission Progress Gauge */}
                  <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs shrink-0 gap-2">
                    <Gauge pct={blueprintCompletionPct} size={58} sw={5} color="#059669" track="#E2E8F0" />
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-slate-900">
                        {mustStudyCompletedCount} / {totalBlueprintTopicsCount} Done
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Must-Study Core</div>
                    </div>
                  </div>
                </div>

                {/* Workload Targets & Quick Launch */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/70 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Target Time
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {dailyHours} Hours
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      MCQ Goal
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {blueprint.targetQuestions} Questions
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Today Solved
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {todayAttempts.length} MCQs ({todayAccuracy}%)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Errors in Subject
                    </span>
                    <span className="text-sm font-black text-amber-600 font-mono">
                      {unreviewedSubjectErrors.length} Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* ═══ 2. MUST-STUDY TOPICS CHECKLIST ═══ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        Must-Study Topics (High-Yield Priority Core)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Prioritized essential concepts required to guarantee passing accuracy
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {mustStudyCompletedCount} / {blueprint.mustStudyTopics.length} Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {blueprint.mustStudyTopics.map((topic) => {
                    const isDone = isTopicCompleted(topic);
                    const perf = getTopicPerformance(topic);
                    const topicErrors = getTopicUnreviewedErrorsCount(topic);
                    const rev = getTopicRevisionState(topic);
                    const visualAsset = topic.visualConceptKey
                      ? VISUAL_CONCEPT_REGISTRY[topic.visualConceptKey]
                      : null;

                    return (
                      <div
                        key={topic.id}
                        className={`rounded-2xl border p-4 transition-all space-y-3.5 ${
                          isDone
                            ? 'bg-emerald-50/40 border-emerald-200/90 text-slate-600'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Topic Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSprintTopic(topic)}
                              className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-emerald-500'
                              }`}
                              title={isDone ? 'Mark as pending' : 'Mark topic as studied'}
                            >
                              {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </button>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <SubjectAppleIcon subjectId={topic.subjectId} size="sm" />
                                  <span>{getSubjectName(topic.subjectId)}</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ~{topic.estimatedMinutes} min
                                </span>

                                {/* Adaptive Performance Badge */}
                                {perf.totalAttempts > 0 ? (
                                  <span
                                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                                      perf.accuracy >= 70
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {perf.accuracy}% Acc ({perf.totalAttempts} Qs)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    Unattempted
                                  </span>
                                )}

                                {topicErrors > 0 && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    <span>{topicErrors} in Error Vault</span>
                                  </span>
                                )}
                              </div>

                              <h5
                                className={`text-sm sm:text-[15px] font-bold leading-tight ${
                                  isDone ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                              >
                                {topic.name}
                              </h5>
                            </div>
                          </div>

                          {/* Quick 1-Click Topic Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => onLaunchPracticeMcq(topic.subjectId, topic.id, topic.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Launch 10-MCQ drill for this topic"
                            >
                              <Zap className="h-3 w-3" />
                              <span>Practice 10 Qs</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenFlashcards(topic.subjectId, topic.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Study flashcards for this topic"
                            >
                              <Layers className="h-3 w-3 text-indigo-600" />
                              <span>Cards</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectSubject(topic.subjectId)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                              title="Open Subject Syllabus"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Core Clinical Concepts */}
                        <div className="space-y-1 pl-8">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Key Clinical High-Yield Concepts:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {topic.coreConcepts.map((concept, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                <span>{concept}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Clinical Traps / Pearls (if any) */}
                        {topic.clinicalTraps && topic.clinicalTraps.length > 0 && (
                          <div className="ml-8 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px]">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span>Clinical Trap & Exam Pearl</span>
                            </div>
                            {topic.clinicalTraps.map((trap, tIdx) => (
                              <p key={tIdx} className="leading-snug">
                                {trap}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Learning Material Tags & Revision Rounds Bar */}
                        <div className="ml-8 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          {/* Learning Material Availability */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Materials:
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Layers className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Flashcards Available</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Zap className="h-2.5 w-2.5 text-emerald-600" />
                              <span>10-MCQ Drill Available</span>
                            </span>
                            {visualAsset ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveVisualAsset(visualAsset);
                                  setShowAnnotatedImage(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                <Eye className="h-2.5 w-2.5 text-indigo-600" />
                                <span>Verified Image Asset Available</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                <HelpCircle className="h-2.5 w-2.5 text-slate-400" />
                                <span>Material unavailable (Visual Asset) · Text guidance provided</span>
                              </span>
                            )}
                          </div>

                          {/* Spaced Revision R1/R2/R3 Matrix Toggles */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Revision:</span>
                            {(['r1Done', 'r2Done', 'r3Done'] as const).map((rKey, idx) => {
                              const isRevDone =
                                rKey === 'r1Done' ? rev.r1 : rKey === 'r2Done' ? rev.r2 : rev.r3;
                              return (
                                <button
                                  key={rKey}
                                  type="button"
                                  onClick={() => handleToggleRevisionRound(topic, rKey)}
                                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                                    isRevDone
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                                  }`}
                                  title={`Toggle Revision Round ${idx + 1}`}
                                >
                                  R{idx + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ 3. ADDITIONAL HIGH-YIELD TOPICS (IF TIME REMAINS) ═══ */}
              {blueprint.ifTimeRemainsTopics.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          Additional High-Yield Topics (If Time Remains)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Secondary high-frequency topics to consolidate score after finishing the core checklist
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                      {ifTimeRemainsCompletedCount} / {blueprint.ifTimeRemainsTopics.length} Completed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {blueprint.ifTimeRemainsTopics.map((topic) => {
                      const isDone = isTopicCompleted(topic);
                      const perf = getTopicPerformance(topic);
                      const rev = getTopicRevisionState(topic);
                      const visualAsset = topic.visualConceptKey
                        ? VISUAL_CONCEPT_REGISTRY[topic.visualConceptKey]
                        : null;

                      return (
                        <div
                          key={topic.id}
                          className={`rounded-2xl border p-3.5 transition-all space-y-3 ${
                            isDone
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSprintTopic(topic)}
                                className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white hover:border-emerald-500'
                                }`}
                              >
                                {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                              </button>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    <SubjectAppleIcon subjectId={topic.subjectId} size="sm" />
                                    <span>{getSubjectName(topic.subjectId)}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ~{topic.estimatedMinutes} min
                                  </span>
                                  {perf.totalAttempts > 0 && (
                                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {perf.accuracy}% Acc
                                    </span>
                                  )}
                                </div>
                                <h5
                                  className={`text-sm font-bold leading-tight ${
                                    isDone ? 'line-through text-slate-400' : 'text-slate-800'
                                  }`}
                                >
                                  {topic.name}
                                </h5>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => onLaunchPracticeMcq(topic.subjectId, topic.id, topic.name)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <Zap className="h-3 w-3" />
                                <span>10 Qs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenFlashcards(topic.subjectId, topic.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <Layers className="h-3 w-3 text-indigo-600" />
                                <span>Cards</span>
                              </button>
                            </div>
                          </div>

                          {/* Core Concepts */}
                          <div className="space-y-1 pl-7.5">
                            <ul className="space-y-1 text-xs text-slate-600">
                              {topic.coreConcepts.map((concept, cIdx) => (
                                <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                                  <span>{concept}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Material status & R1-R3 */}
                          <div className="pl-7.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {visualAsset ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVisualAsset(visualAsset);
                                    setShowAnnotatedImage(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-2.5 w-2.5 text-indigo-600" />
                                  <span>Visual Asset Available</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  Material unavailable (Visual) · Text guidance provided
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {(['r1Done', 'r2Done', 'r3Done'] as const).map((rKey, idx) => {
                                const isRevDone =
                                  rKey === 'r1Done' ? rev.r1 : rKey === 'r2Done' ? rev.r2 : rev.r3;
                                return (
                                  <button
                                    key={rKey}
                                    type="button"
                                    onClick={() => handleToggleRevisionRound(topic, rKey)}
                                    className={`px-1.5 py-0.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer ${
                                      isRevDone
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    R{idx + 1}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ 4. CLINICAL PROTOCOL SECTIONS (RECALL, PRACTICE, ERRORS, REVISION) ═══ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* 5. Active Recall Guidance */}
                <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-indigo-950">
                        Active Recall Protocol
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenFlashcards(blueprint.subjects[0] || 'obg')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Layers className="h-3 w-3" />
                      <span>Launch Cards</span>
                    </button>
                  </div>
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    {blueprint.activeRecallGuidance}
                  </p>
                </div>

                {/* 6. Question Practice Guidance */}
                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <Target className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                        Question Practice ({blueprint.targetQuestions} Target)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchPracticeMcq(
                          blueprint.subjects[0] || 'obg',
                          blueprint.mustStudyTopics[0]?.id,
                          blueprint.mustStudyTopics[0]?.name
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Start Drill</span>
                    </button>
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    {blueprint.questionPracticeGuidance}
                  </p>
                </div>

                {/* 7. Error Remediation & Vault */}
                <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-rose-950">
                        Error Vault Remediation
                      </h4>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('errors')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Open Vault</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-rose-900/80 leading-relaxed">
                    {blueprint.errorRemediationGuidance}
                  </p>
                  <div className="text-[11px] font-bold text-rose-800">
                    {unreviewedSubjectErrors.length > 0
                      ? `${unreviewedSubjectErrors.length} unreviewed mistakes or lucky guesses waiting for review in ${blueprint.subjects.join(', ').toUpperCase()}`
                      : 'Zero pending errors for today\'s subjects. Review your lucky guesses after your practice drill.'}
                  </div>
                </div>

                {/* 8. Spaced Revision Guidance */}
                <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                        <Layers className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">
                        Spaced Revision Guidance
                      </h4>
                    </div>
                    {onOpenRevisionMatrix && (
                      <button
                        type="button"
                        onClick={onOpenRevisionMatrix}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Layers className="h-3 w-3" />
                        <span>Matrix</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    {blueprint.revisionGuidance}
                  </p>
                </div>
              </div>

              {/* Collapsible Daily Discipline 4-Phase Checklist */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChecklistTasks(!showChecklistTasks)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 py-1 cursor-pointer hover:text-slate-900"
                >
                  <span className="uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Daily Discipline Protocol Tasks ({activeDayTasksCompletedCount} / {tasksForToday.length})</span>
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[11px] font-bold text-emerald-600">
                      {Math.round((activeDayTasksCompletedCount / tasksForToday.length) * 100)}%
                    </span>
                    {showChecklistTasks ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {showChecklistTasks && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2.5">
                    {tasksForToday.map((taskText, tIdx) => {
                      const isTaskDone = !!sprint?.completedTasks?.[`${selectedDay}-${tIdx}`];
                      return (
                        <div
                          key={tIdx}
                          onClick={() => handleToggleTask(tIdx)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isTaskDone
                              ? 'bg-emerald-50 border-emerald-200 text-slate-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isTaskDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isTaskDone && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <p className={`text-xs leading-relaxed ${isTaskDone ? 'line-through opacity-70' : 'font-medium'}`}>
                            {taskText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ═══ 9. END-OF-DAY PROGRESS & REFLECTION SUMMARY ═══ */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>End-of-Day Completion & Verification</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {mustStudyCompletedCount === blueprint.mustStudyTopics.length && mustStudyCompletedCount > 0
                      ? '✓ Mission Complete'
                      : 'In Progress'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">Topics Completed</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {mustStudyCompletedCount} / {blueprint.mustStudyTopics.length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">MCQs Solved Today</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {todayAttempts.length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">Today Accuracy</div>
                    <div className="text-base font-black text-emerald-600 mt-0.5">
                      {todayAccuracy}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">Unreviewed Errors</div>
                    <div className="text-base font-black text-rose-600 mt-0.5">
                      {unreviewedSubjectErrors.length}
                    </div>
                  </div>
                </div>

                <p className="text-[11.5px] text-slate-600 leading-snug">
                  {mustStudyCompletedCount === blueprint.mustStudyTopics.length && mustStudyCompletedCount > 0
                    ? `Outstanding work! You have cleared all must-study topics for Day ${selectedDay + 1}. Ensure your flashcard review and error queue are cleared before rest.`
                    : `${blueprint.mustStudyTopics.length - mustStudyCompletedCount} must-study topics remaining for today's mission. Check off each topic as you complete recall and practice.`}
                </p>
              </div>
            </>
          )}

          {/* Weightage Tiers Matrix with Subjects */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span>Subject Weightage Tiers</span>
              </span>

              {/* Tier Filter Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                {(['all', 1, 2, 3] as const).map((tierVal) => (
                  <button
                    key={tierVal}
                    type="button"
                    onClick={() => setActiveTier(tierVal)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                      activeTier === tierVal
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tierVal === 'all' ? 'All' : `T${tierVal}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPRINT_TIERS.filter((t) => activeTier === 'all' || t.tier === activeTier).flatMap((tier) =>
                tier.subjectIds.map((subId) => {
                  const subject = FMGE_SUBJECTS.find((s) => s.id === subId);
                  if (!subject) return null;
                  const mustKnow = tier.mustKnowTopics[subId] || [];

                  return (
                    <div
                      key={subId}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <SubjectAppleIcon subjectId={subId} size="sm" />
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                                {subject.name}
                              </h5>
                              <span className="text-[10px] font-bold text-emerald-600">
                                ~{subject.weightage} Marks (Tier {tier.tier})
                              </span>
                            </div>
                          </div>
                        </div>

                        {mustKnow.length > 0 && (
                          <div className="space-y-1">
                            {mustKnow.slice(0, 2).map((t, idx) => (
                              <p key={idx} className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                                <span>{t}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onLaunchPracticeMcq(subId)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Zap className="h-3 w-3" />
                          <span>10 MCQs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenFlashcards(subId)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Layers className="h-3 w-3 text-indigo-600" />
                          <span>Cards</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSubject(subId)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                          title="View Subject Syllabus"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4 Cols (Sidebar with Quick Actions & Stats) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-tight">Sprint Actions</h3>
                <p className="text-[11px] text-[#8E8E93]">High-impact shortcuts</p>
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              {[
                {
                  label: "Start Today's 10-MCQ Blitz",
                  sub: `Day ${selectedDay + 1}: ${blueprint.title}`,
                  icon: Play,
                  iconBg: '#10B981',
                  onClick: () => onLaunchPracticeMcq(blueprint.subjects[0] || 'obg'),
                },
                {
                  label: 'Tier 1 Heavyweights Blitz',
                  sub: 'Medicine, Surgery, OBG, PSM (165M)',
                  icon: Award,
                  iconBg: '#0891B2',
                  onClick: () => onLaunchPracticeMcq('medicine'),
                },
                {
                  label: 'Study High-Yield Flashcards',
                  sub: 'Rapid buzzwords & diagnostic traps',
                  icon: Layers,
                  iconBg: '#6366F1',
                  onClick: () => onOpenFlashcards(blueprint.subjects[0] || 'obg'),
                },
                {
                  label: 'Review Grand Tests',
                  sub: 'Full-length 300Q benchmarks',
                  icon: ShieldCheck,
                  iconBg: '#F59E0B',
                  onClick: () => onSelectSubject('medicine'),
                },
              ].map(({ label, sub, icon: Icon, iconBg, onClick }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={onClick}
                  className="w-full p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-200 flex items-center gap-3 text-left cursor-pointer transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-105"
                    style={{ background: iconBg, boxShadow: `0 2px 8px ${iconBg}40` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-[#1D1D1F] group-hover:text-emerald-600 transition-colors leading-tight">
                      {label}
                    </div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5 truncate">{sub}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#C7C7CC] group-hover:text-emerald-600 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Compact Revision & Error Queue */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-tight">Revision & Error Queue</h3>
                  <p className="text-[11px] text-[#8E8E93]">Urgent items for remediation</p>
                </div>
              </div>
              {readinessMetrics.unresolvedErrorsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  {readinessMetrics.unresolvedErrorsCount} Due
                </span>
              )}
            </div>

            <div className="p-3.5 space-y-2">
              {readinessMetrics.unresolvedErrors.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center space-y-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-emerald-950">Clean Slate</p>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    All logged mistakes and lucky guesses have been resolved.
                  </p>
                </div>
              ) : (
                <>
                  {readinessMetrics.unresolvedErrors.slice(0, 3).map((err) => (
                    <div
                      key={err.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-500 truncate">
                          {err.subjectId.toUpperCase()} · {err.topic || 'General'}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          {err.title || 'Concept Gap'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-snug">
                        {err.questionGist || err.myMistake || 'Mistake logged in question practice.'}
                      </p>
                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onLaunchPracticeMcq(err.subjectId, err.topicId, err.topic)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Play className="h-2.5 w-2.5" /> Retest
                        </button>
                      </div>
                    </div>
                  ))}

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('errors')}
                      className="w-full py-2 rounded-xl text-center text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Open Error Vault ({readinessMetrics.unresolvedErrorsCount} total mistakes) →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Tile */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-[#1D1D1F] text-[14px]">Sprint Benchmarks</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Days Left', value: daysLeft, icon: Clock, color: '#10B981' },
                { label: 'Topics Done', value: `${mustStudyCompletedCount}/${totalBlueprintTopicsCount}`, icon: CheckCircle2, color: '#0891B2' },
                { label: 'Core Target', value: '165M', icon: Award, color: '#F59E0B' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                  <div className="font-black text-[16px] text-[#1D1D1F] leading-none tracking-tight">{value}</div>
                  <div className="text-[10px] text-[#8E8E93] font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Motivational Maxim Banner */}
            <div
              className="relative overflow-hidden rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              <Flame className="h-4 w-4 text-emerald-600 mb-2" />
              <p className="text-[11.5px] font-medium text-emerald-900 leading-snug italic">
                "When you are 20 days away from FMGE, active MCQ volume and spaced testing trump passive reading every time."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ VERIFIED DIAGNOSTIC VISUAL ASSET PREVIEW MODAL ═══ */}
      <AnimatePresence>
        {activeVisualAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      Verified Clinical Visual Finding
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {activeVisualAsset.conceptKey}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVisualAsset(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Visual Target & Key Finding */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Diagnostic Finding:
                  </span>
                  <div className="font-bold text-sm text-indigo-950">
                    {activeVisualAsset.keyVisualFinding}
                  </div>
                  <div className="text-xs text-indigo-800">
                    Target: {activeVisualAsset.visualTarget} · {activeVisualAsset.imageType}
                  </div>
                </div>

                {/* Clean vs Annotated Toggle */}
                <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setShowAnnotatedImage(false)}
                    className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      !showAnnotatedImage
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Clean (Exam Mode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnnotatedImage(true)}
                    className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      showAnnotatedImage
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Annotated (Review Mode)
                  </button>
                </div>

                {/* Image Display */}
                <div className="relative rounded-2xl bg-slate-900 flex items-center justify-center p-4 min-h-[220px] overflow-hidden">
                  <img
                    src={
                      showAnnotatedImage
                        ? activeVisualAsset.annotatedImageUrl
                        : activeVisualAsset.cleanImageUrl
                    }
                    alt={activeVisualAsset.keyVisualFinding}
                    className="max-h-[260px] w-auto object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback text if the file is an SVG placeholder
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* What to look for */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    What to Look For:
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {activeVisualAsset.whatToLookFor}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVisualAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                {activeVisualAsset.subjects[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      const sub = activeVisualAsset.subjects[0];
                      setActiveVisualAsset(null);
                      onLaunchPracticeMcq(sub);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Practice MCQs</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
