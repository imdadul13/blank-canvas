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
  type SprintDay,
} from '../../utils/sprintEngine';
import type { AppState, McqAttempt, GrandTest } from '../../types';
import { SubjectAppleIcon } from '../SubjectAppleIcon';

interface ExamSprintViewProps {
  state: AppState;
  onLaunchPracticeMcq: (subjectId: string, topicId?: string, topicName?: string) => void;
  onOpenFlashcards: (subjectId: string, topicId?: string) => void;
  onSelectSubject: (subjectId: string) => void;
  onUpdateSprint?: (sprint: NonNullable<AppState['fmgeSprint']>) => void;
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
}) => {
  const sprint = state.fmgeSprint;
  const attempts = state.mcqAttempts || [];
  const grandTests = state.grandTests || [];

  const [activeTier, setActiveTier] = useState<number | 'all'>('all');
  const [dailyHours, setDailyHours] = useState<number>(sprint?.dailyHours || 6);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute current sprint day index (0 to 19)
  const currentDay = sprint ? sprintDayIndex(sprint.startedOn) : Math.max(0, 20 - daysUntilFmge());
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  const adaptiveDays = useMemo(
    () => buildAdaptiveSprintDays(attempts, grandTests, sprint?.errorTypes || {}),
    [attempts, grandTests, sprint?.errorTypes]
  );

  const activePlan: SprintDay = adaptiveDays[selectedDay] || adaptiveDays[0];
  const daysLeft = daysUntilFmge();

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
                  20-DAY SPRINT BLUEPRINT
                </span>
              </div>

              <h1 className="text-[36px] sm:text-[48px] font-black tracking-[-0.04em] leading-[0.88] text-white">
                Speed. Focus.<br />
                <span style={{ color: '#6EE7B7' }}>150+ Mark Margin.</span>
              </h1>

              <p className="text-[13px] sm:text-[14px] text-white/70 leading-snug max-w-lg">
                Rule of 160: 6 heavyweight subjects deliver 165+ marks with zero negative marking. Replace textbook fatigue with daily 10-MCQ blitzes.
              </p>

              {/* Countdown progress bar */}
              <div className="max-w-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                  <span>Sprint Timeline</span>
                  <span style={{ color: '#6EE7B7' }}>{daysLeft} Days Left ({overallSprintPct}%)</span>
                </div>
                <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallSprintPct}%` }}
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

            {/* Right: Quick Action Pill */}
            <div className="shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onLaunchPracticeMcq(activePlan.subjects[0] || 'medicine')}
                className="px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm shadow-lg hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>Launch Today's Drill</span>
              </button>
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

      {/* ═══ 3. MAIN SPRINT MATRIX (8 COLS) + SIDEBAR (4 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 8 Cols */}
        <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden space-y-4 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">Tactical 20-Day Daily Sprint</h2>
                <p className="text-[11px] text-[#8E8E93] font-mono">Day {20 - selectedDay} of 20 · {sprintDateForIndex(selectedDay)}</p>
              </div>
            </div>

            {/* Hours selector */}
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
          </div>

          {/* 20-Day Stepper Horizontal Scroller */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Day Timeline (20 Days to FMGE)
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {adaptiveDays.map((dayPlan, idx) => {
                const isToday = idx === currentDay;
                const isSelected = idx === selectedDay;
                const isDone =
                  (sprint?.completedTasks?.[`${idx}-0`] &&
                    sprint?.completedTasks?.[`${idx}-1`] &&
                    sprint?.completedTasks?.[`${idx}-2`]) ||
                  false;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDay(idx)}
                    className={`shrink-0 flex flex-col items-center justify-center min-w-[72px] py-2 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                        : isToday
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                      {idx === 19 ? 'Eve' : `Day ${20 - idx}`}
                    </span>
                    <span className="text-sm font-black">
                      {idx === 19 ? 'Exam' : `${20 - idx}d`}
                    </span>
                    {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-300 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Detail Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Day {20 - selectedDay} of 20
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {sprintDateForIndex(selectedDay)}
                  </span>
                  {activePlan.fullMock && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Full 300Q Mock Day
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {activePlan.title}
                </h3>
                <p className="text-xs text-slate-600">{activePlan.focus}</p>
              </div>

              {/* 1-Click Action triggers */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {activePlan.subjects.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => onLaunchPracticeMcq(activePlan.subjects[0])}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>10-MCQ Drill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenFlashcards(activePlan.subjects[0])}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Flashcards</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="uppercase font-mono text-[10px] tracking-wider">
                  Checklist Tasks ({activeDayTasksCompletedCount} / {tasksForToday.length})
                </span>
                <span className="text-emerald-600 font-bold">
                  {Math.round((activeDayTasksCompletedCount / tasksForToday.length) * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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
            </div>
          </div>

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
                  sub: `Day ${20 - selectedDay}: ${activePlan.title}`,
                  icon: Play,
                  iconBg: '#10B981',
                  onClick: () => onLaunchPracticeMcq(activePlan.subjects[0] || 'medicine'),
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
                  onClick: () => onOpenFlashcards(activePlan.subjects[0] || 'medicine'),
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
                { label: 'Tasks Done', value: activeDayTasksCompletedCount, icon: CheckCircle2, color: '#0891B2' },
                { label: 'Core Target', value: '165M', icon: Award, color: '#F59E0B' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                  <div className="font-black text-[18px] text-[#1D1D1F] leading-none tracking-tight">{value}</div>
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
    </div>
  );
};
