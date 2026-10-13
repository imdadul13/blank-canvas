import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
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

  const [activeTier, setActiveTier] = useState<number | 'all'>(1);
  const [dailyHours, setDailyHours] = useState<number>(sprint?.dailyHours || 6);

  // Compute current sprint day index (0 to 19)
  const currentDay = sprint ? sprintDayIndex(sprint.startedOn) : Math.max(0, 20 - daysUntilFmge());
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  const adaptiveDays = useMemo(
    () => buildAdaptiveSprintDays(attempts, grandTests, sprint?.errorTypes || {}),
    [attempts, grandTests, sprint?.errorTypes]
  );

  const activePlan: SprintDay = adaptiveDays[selectedDay] || adaptiveDays[0];
  const daysLeft = daysUntilFmge();

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
    <div className="space-y-8 animate-fadeIn">
      {/* ── Top Countdown & Strategic Blueprint Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[rgba(60,60,67,0.1)] bg-gradient-to-br from-white/90 via-[#F8FAF9] to-emerald-50/40 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-emerald-950/20"
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Flame className="h-3.5 w-3.5 text-emerald-500" />
              <span>20-Day FMGE High-Yield Sprint</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Pass Margin Blueprint:{' '}
              <span className="text-emerald-600 dark:text-emerald-400">150+ / 300 Marks</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              When you are 20 days away from FMGE, reading textbooks creates cognitive overload.
              Focus on <strong>The Rule of 160</strong>: 6 heavyweight subjects deliver over 165 marks.
              Mastering them with active 10-MCQ blitzes and high-yield flashcards guarantees clearing the exam.
            </p>
          </div>

          <div className="flex flex-row lg:flex-col items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="flex-1 lg:w-44 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Days to Exam
              </span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {daysLeft}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Countdown Active</span>
            </div>

            <div className="flex-1 lg:w-44 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pass Threshold
              </span>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">150</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">No Negative Marking</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Interactive 20-Day Countdown Schedule & Daily Task Engine ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span>Day-by-Day Tactical Sprint</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any day to access its focused clinical subjects, target questions, and active recall tasks.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300 pl-2">Daily Study:</span>
            {[4, 6, 8, 10].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setDailyHours(h)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  dailyHours === h
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* 20-Day Pills Horizontal Scroller */}
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
                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-105'
                    : isToday
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-300 font-bold'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  {idx === 19 ? 'Eve' : `Day ${20 - idx}`}
                </span>
                <span className="text-base font-black">
                  {idx === 19 ? 'Exam' : `${20 - idx}d`}
                </span>
                {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-1" />}
              </button>
            );
          })}
        </div>

        {/* Selected Day Action Box */}
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-5 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Day {20 - selectedDay} of 20
                </span>
                <span className="text-xs text-slate-400">
                  {sprintDateForIndex(selectedDay)}
                </span>
                {activePlan.fullMock && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Full Mock Day
                  </span>
                )}
                {activePlan.restDay && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Light Rest & Logistics
                  </span>
                )}
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {activePlan.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">{activePlan.focus}</p>
            </div>

            {/* Quick 10-MCQ Launch Action for Today's Subjects */}
            <div className="flex items-center gap-2 flex-wrap">
              {activePlan.subjects.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => onLaunchPracticeMcq(activePlan.subjects[0])}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Launch 10-MCQ Drill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenFlashcards(activePlan.subjects[0])}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
                  >
                    <Layers className="h-4 w-4" />
                    <span>Topic Flashcards</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Day Checklist Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">
                Daily Completion Checklist ({activeDayTasksCompletedCount} / {tasksForToday.length})
              </span>
              <span>{Math.round((activeDayTasksCompletedCount / tasksForToday.length) * 100)}%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasksForToday.map((taskText, tIdx) => {
                const isTaskDone = !!sprint?.completedTasks?.[`${selectedDay}-${tIdx}`];
                return (
                  <div
                    key={tIdx}
                    onClick={() => handleToggleTask(tIdx)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isTaskDone
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-600 dark:text-slate-400'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-white/5 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isTaskDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isTaskDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <p className={`text-xs leading-relaxed ${isTaskDone ? 'line-through opacity-75' : 'font-medium'}`}>
                      {taskText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── High-Yield Subject Weightage Tier List ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" />
              <span>Weightage Tiers: Where Marks Live</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct access to 10-MCQ high-yield drills and flashcards categorized by examination weightage.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
            {(['all', 1, 2, 3] as const).map((tierVal) => (
              <button
                key={tierVal}
                type="button"
                onClick={() => setActiveTier(tierVal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTier === tierVal
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tierVal === 'all' ? 'All Tiers' : `Tier ${tierVal}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers List */}
        <div className="space-y-6">
          {SPRINT_TIERS.filter((t) => activeTier === 'all' || t.tier === activeTier).map((tier) => (
            <div
              key={tier.tier}
              className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 p-5 sm:p-7 space-y-5 backdrop-blur-md"
            >
              {/* Tier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black text-white"
                      style={{ backgroundColor: tier.badgeColor }}
                    >
                      Tier {tier.tier}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {tier.name}
                    </h4>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ({tier.markRange})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                    {tier.description}
                  </p>
                </div>
              </div>

              {/* Subjects Cards in this Tier */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tier.subjectIds.map((subId) => {
                  const subject = FMGE_SUBJECTS.find((s) => s.id === subId);
                  if (!subject) return null;
                  const mustKnow = tier.mustKnowTopics[subId] || [];

                  return (
                    <motion.div
                      key={subId}
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/90 p-4 shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <SubjectAppleIcon subjectId={subId} size="sm" />
                            <div>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {subject.name}
                              </h5>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ~{subject.weightage} Marks
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Must Know Pills */}
                        {mustKnow.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              High-Yield Anchors:
                            </span>
                            <div className="space-y-1">
                              {mustKnow.slice(0, 3).map((topicTitle, i) => (
                                <p
                                  key={i}
                                  className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5"
                                >
                                  <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                                  <span>{topicTitle}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onLaunchPracticeMcq(subId)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Zap className="h-3 w-3" />
                          <span>10 MCQs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenFlashcards(subId)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <Layers className="h-3 w-3" />
                          <span>Flashcards</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSubject(subId)}
                          className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
                          title="View Full Syllabus"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
