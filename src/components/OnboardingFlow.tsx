import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  Gauge,
  Clock,
  Layers,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import OneShotLogo from './OneShotLogo';
import { useAuth } from '../context/AuthContext';
import {
  OnboardingPreparationStage,
  StudyPreferenceKey,
} from '../types';
import {
  getDaysRemaining,
  formatExamDate,
  isValidTargetScore,
  isValidBaselineScore,
  isValidDailyStudyHours,
  isUsableExamDate,
  getExamMonth,
  getExamYear,
  getExamDay,
  buildFullExamDate,
  isValidExamMonthYear,
  isValidExamMonthDayYear,
  daysInMonth,
  MONTH_NAMES,
  TARGET_SCORE_OPTIONS,
  DAILY_STUDY_HOURS_OPTIONS,
  PREPARATION_STAGE_OPTIONS,
  STUDY_PREFERENCES_OPTIONS,
  PREPARATION_STAGE_LABELS,
  STUDY_PREFERENCE_LABELS,
} from '../utils/onboarding';

type StepId =
  | 'welcome'
  | 'examDate'
  | 'targetScore'
  | 'preparationStage'
  | 'dailyStudyHours'
  | 'studyPreferences'
  | 'baseline'
  | 'building'
  | 'ready';

const STEP_ORDER: StepId[] = [
  'welcome',
  'examDate',
  'targetScore',
  'preparationStage',
  'dailyStudyHours',
  'studyPreferences',
  'baseline',
  'building',
  'ready',
];

/** Numbered progress indicator counts only the 6 "answer" steps. */
const ANSWER_STEPS: StepId[] = [
  'examDate',
  'targetScore',
  'preparationStage',
  'dailyStudyHours',
  'studyPreferences',
  'baseline',
];

const STEP_TITLES: Record<StepId, string> = {
  welcome: 'Welcome',
  examDate: 'Exam Countdown',
  targetScore: 'Target Score',
  preparationStage: 'Prep Stage',
  dailyStudyHours: 'Daily Pace',
  studyPreferences: 'Learning Format',
  baseline: 'Baseline GT',
  building: 'Synthesizing',
  ready: 'Blueprint Ready',
};

function buildYearWindow(currentYear: number, startYear: number): number[] {
  return Array.from({ length: 7 }, (_, i) => startYear + i);
}

export const OnboardingFlow: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { profile, isGuest, signOutUser, completeOnboarding, saveOnboardingProgress, setShowOnboarding } = useAuth();
  const reduceMotion = useReducedMotion();

  const handleExitToWelcome = async () => {
    if (isGuest) {
      await signOutUser();
    } else {
      setShowOnboarding(false);
    }
  };

  const handleSkipToWorkspace = async () => {
    try {
      await completeOnboarding('2026-10-15', 185, 6, {
        source: 'Marrow',
        studyPreferences: ['mcqs', 'rapid_revision'],
      });
      onComplete?.();
    } catch (e) {
      console.warn('Skip onboarding notice:', e);
      onComplete?.();
    }
  };

  const [step, setStep] = useState<StepId>('welcome');

  const [examDate, setExamDate] = useState<string>(profile?.examDate || '');
  const [targetScore, setTargetScore] = useState<number | ''>(profile?.targetScore || '');
  const [preparationStage, setPreparationStage] = useState<OnboardingPreparationStage | null>(
    profile?.preparationStage || null
  );
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(
    profile?.dailyHoursTarget || 6
  );
  const [studyPreferences, setStudyPreferences] = useState<StudyPreferenceKey[]>(
    profile?.studyPreferences || []
  );
  const [hasBaseline, setHasBaseline] = useState<boolean>(
    profile?.baselineScore !== undefined && profile?.baselineScore !== null
  );
  const [baselineScore, setBaselineScore] = useState<number | ''>(
    profile?.baselineScore ?? ''
  );
  const [baselineQuestions, setBaselineQuestions] = useState<number | ''>(
    profile?.baselineQuestions ?? 50
  );
  const [coachingSource, setCoachingSource] = useState<string>(
    profile?.preferences?.coachingSource || 'Marrow'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Synthesis steps progression animation for the "building" screen
  const [buildingStepIdx, setBuildingStepIdx] = useState(0);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const initialMonth = useMemo(() => getExamMonth(profile?.examDate), [profile]);
  const initialYear = useMemo(() => getExamYear(profile?.examDate) ?? currentYear, [profile, currentYear]);
  const initialDay = useMemo(() => getExamDay(profile?.examDate), [profile]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number | null>(initialYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay);
  const [yearStart, setYearStart] = useState<number>(() => initialYear - 3);

  const stepIndex = STEP_ORDER.indexOf(step);
  const answerIndex = ANSWER_STEPS.indexOf(step);
  const answerProgress = answerIndex === -1 ? null : answerIndex;
  const totalSteps = ANSWER_STEPS.length;

  const daysRemaining = useMemo(() => getDaysRemaining(examDate), [examDate]);

  const togglePreference = (key: StudyPreferenceKey) => {
    setStudyPreferences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectMonth = (month: number) => {
    const year = selectedYear ?? currentYear;
    const day = selectedDay === null ? 1 : Math.min(selectedDay, daysInMonth(month, year));
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDay(day);
    setExamDate(buildFullExamDate(day, month, year));
  };

  const selectYear = (year: number) => {
    const month = selectedMonth ?? 0;
    const day = selectedDay === null ? 1 : Math.min(selectedDay, daysInMonth(month, year));
    setSelectedYear(year);
    setSelectedDay(day);
    setExamDate(buildFullExamDate(day, month, year));
  };

  const selectDay = (day: number) => {
    const month = selectedMonth ?? 0;
    const year = selectedYear ?? currentYear;
    const clamped = Math.min(day, daysInMonth(month, year));
    setSelectedDay(clamped);
    setExamDate(buildFullExamDate(clamped, month, year));
  };

  const selectedDaysInCurrentMonth =
    selectedMonth !== null && selectedYear !== null ? daysInMonth(selectedMonth, selectedYear) : 0;

  const canContinueExamDate =
    selectedMonth !== null &&
    selectedYear !== null &&
    selectedDay !== null &&
    isValidExamMonthDayYear(selectedMonth, selectedDay, selectedYear, now) &&
    isUsableExamDate(examDate);
  const canContinueTargetScore = isValidTargetScore(targetScore === '' ? undefined : targetScore);
  const canContinueHours = isValidDailyStudyHours(dailyStudyHours);

  const goBack = () => {
    setStep(STEP_ORDER[Math.max(0, stepIndex - 1)]);
  };

  const goNext = async () => {
    if (step === 'welcome') {
      setStep('examDate');
      return;
    }
    if (step === 'examDate') {
      if (!canContinueExamDate) return;
      try {
        await saveOnboardingProgress({ examDate, dailyHoursTarget: dailyStudyHours });
      } catch {}
      setStep('targetScore');
      return;
    }
    if (step === 'targetScore') {
      try {
        await saveOnboardingProgress({ targetScore: Number(targetScore) });
      } catch {}
      setStep('preparationStage');
      return;
    }
    if (step === 'preparationStage') {
      if (preparationStage) {
        try {
          await saveOnboardingProgress({ preparationStage });
        } catch {}
      }
      setStep('dailyStudyHours');
      return;
    }
    if (step === 'dailyStudyHours') {
      if (!canContinueHours) return;
      try {
        await saveOnboardingProgress({ dailyHoursTarget: dailyStudyHours });
      } catch {}
      setStep('studyPreferences');
      return;
    }
    if (step === 'studyPreferences') {
      try {
        await saveOnboardingProgress({ studyPreferences });
      } catch {}
      setStep('baseline');
      return;
    }
    if (step === 'baseline') {
      setIsSaving(true);
      setSaveError(null);
      setStep('building');
      try {
        const finalScore = targetScore !== '' && isValidTargetScore(targetScore) ? Number(targetScore) : 185;
        const validBaseline =
          hasBaseline && baselineScore !== '' && isValidBaselineScore(baselineScore) ? Number(baselineScore) : undefined;
        const validQuestions =
          hasBaseline && typeof baselineQuestions === 'number' && baselineQuestions > 0
            ? baselineQuestions
            : undefined;

        await completeOnboarding(examDate, finalScore, dailyStudyHours, {
          preparationStage: preparationStage || undefined,
          studyPreferences,
          baselineScore: validBaseline,
          baselineQuestions: validQuestions,
          source: coachingSource,
        });

        // Trigger synthesis animation progression
        setTimeout(() => setBuildingStepIdx(1), 700);
        setTimeout(() => setBuildingStepIdx(2), 1400);
        setTimeout(() => {
          setIsSaving(false);
          setStep('ready');
        }, 2200);
      } catch (err) {
        console.error('Failed to save onboarding:', err);
        setSaveError("Couldn't save your plan. Please try again.");
        setStep('baseline');
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    if (step === 'ready') {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
      });
    }
  }, [step]);

  const finish = async () => {
    onComplete?.();
  };

  const years = useMemo(() => buildYearWindow(currentYear, yearStart), [yearStart, currentYear]);
  const targetScoreBuffer = Math.max(0, (Number(targetScore) || 200) - 150);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F5F7] text-slate-900 selection:bg-[#007AFF]/20 selection:text-[#007AFF] font-sans overflow-hidden">
      {/* ── Dynamic Ambient Mesh Gradients ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.35, 0.55, 0.35],
                  x: [0, 25, 0],
                  y: [0, -20, 0],
                }
          }
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-36 -right-36 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-[#5AC8FA]/25 via-[#007AFF]/18 to-transparent blur-3xl"
        />

        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1.1, 0.95, 1.1],
                  opacity: [0.25, 0.45, 0.25],
                  x: [0, -20, 0],
                  y: [0, 25, 0],
                }
          }
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-40 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-[#5856D6]/20 via-[#007AFF]/15 to-transparent blur-3xl"
        />
      </div>

      {/* ── Fixed Apple Top Bar ── */}
      <header className="relative shrink-0 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <OneShotLogo variant="compact" size="sm" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/80 backdrop-blur-md text-[#1D1D1F] border border-black/[0.06] shadow-2xs">
            <span className="size-1.5 rounded-full bg-[#007AFF] animate-pulse" />
            Clinical Blueprint Calibration
          </span>
        </div>

        {/* Actions: Exit / Return to Sign In + Step telemetry badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 26 }}
            onClick={handleExitToWelcome}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#1D1D1F] text-xs font-semibold shadow-2xs border border-black/[0.06] transition-all cursor-pointer backdrop-blur-md"
            title="Return to Welcome / Sign In"
          >
            <ArrowLeft className="size-3.5 text-[#007AFF]" />
            <span>{isGuest ? 'Back to Sign In' : 'Exit Setup'}</span>
          </motion.button>

          {answerProgress !== null && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.06] shadow-2xs">
              <span className="text-[11px] font-mono font-bold text-[#007AFF] tabular-nums">
                {String(answerProgress + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
              </span>
              <span className="h-3 w-px bg-black/[0.08]" />
              <span className="text-[11px] font-medium text-[#6E6E73] truncate max-w-[110px] sm:max-w-none">
                {STEP_TITLES[step]}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Apple Capsule Progress Bar ── */}
      <div className="relative shrink-0 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-3 z-10">
        <div className="h-1.5 w-full rounded-full bg-black/[0.05] overflow-hidden p-0.5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#007AFF] via-[#5AC8FA] to-[#5856D6] rounded-full shadow-xs"
            initial={false}
            animate={{
              width: answerProgress === null ? '0%' : `${((answerProgress + 1) / totalSteps) * 100}%`,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* ── Fluid Animated Step Viewport ── */}
      <main className="relative min-h-0 flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8 z-10">
        <div className="w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* ══════════════════════════════════════════════════════════
                  STEP 1: WELCOME HERO (Apple HIG Keynote Presentation)
                 ══════════════════════════════════════════════════════════ */}
              {step === 'welcome' && (
                <div className="pt-2 sm:pt-4 pb-6 text-center space-y-8">
                  {/* Floating Brand Emblem with Concentric Breathing Halo Rings */}
                  <div className="relative mx-auto size-24 sm:size-28 flex items-center justify-center">
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              scale: [1, 1.25, 1],
                              opacity: [0.25, 0.45, 0.25],
                            }
                      }
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-[#007AFF] via-[#5856D6] to-[#5AC8FA] blur-xl"
                    />

                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              scale: [1.1, 1.35, 1.1],
                              opacity: [0.15, 0.3, 0.15],
                            }
                      }
                      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="absolute -inset-2 rounded-[32px] border border-[#007AFF]/25 bg-[#007AFF]/5"
                    />

                    {/* Vector Squircle Container */}
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              y: [0, -4, 0],
                            }
                      }
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative w-full h-full rounded-[26px] bg-white p-1 shadow-[0_16px_40px_rgba(0,122,255,0.22)] border border-black/[0.06] flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src="/images/brand/one_shot_emblem.png"
                        alt="ONE SHOT FMGE Master Emblem"
                        className="size-full object-cover rounded-[22px] drop-shadow-sm"
                      />
                    </motion.div>
                  </div>

                  {/* Editorial Typography Lockup */}
                  <div className="space-y-3.5 max-w-xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 text-[11px] font-bold font-mono tracking-wider uppercase shadow-2xs">
                      <ShieldCheck className="size-3.5" />
                      <span>Doctor Preparation System · NBE 2026</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.035em] text-[#1D1D1F] leading-[1.12]">
                      Architect your path to{' '}
                      <span className="bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE] bg-clip-text text-transparent">
                        clearing the FMGE.
                      </span>
                    </h1>
                    <p className="text-sm sm:text-[15.5px] text-[#6E6E73] leading-relaxed max-w-lg mx-auto font-medium">
                      Configure your exam countdown, target safety buffer, and daily clinical rhythm in under two minutes.
                    </p>
                  </div>

                  {/* 3 Apple Keynote Bento Feature Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-2">
                    {/* Card 1: Score Buffer */}
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.03)] space-y-3 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="size-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shadow-2xs">
                          <Target className="size-4.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">
                          Buffer Engine
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1D1D1F]">Target Score Buffer</p>
                        <p className="text-[12px] text-[#6E6E73] leading-relaxed font-medium">
                          Calibrate high-yield weighting well past the 150 pass mark for exam-day certainty.
                        </p>
                      </div>
                      {/* Visual Micro-Gauge */}
                      <div className="pt-2 border-t border-black/[0.04] space-y-1.5">
                        <div className="flex items-center justify-between text-[10.5px] font-mono font-bold text-[#8E8E93]">
                          <span>150 Pass</span>
                          <span className="text-[#007AFF]">185+ Target (+35)</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/[0.04] rounded-full overflow-hidden">
                          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#007AFF] to-[#5AC8FA]" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Card 2: 19 Subjects Pace */}
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.03)] space-y-3 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="size-9 rounded-xl bg-[#5856D6]/10 text-[#5856D6] flex items-center justify-center shadow-2xs">
                          <Layers className="size-4.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5856D6] bg-[#5856D6]/10 px-2 py-0.5 rounded-full">
                          19 Subjects
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1D1D1F]">Smart Pace Planner</p>
                        <p className="text-[12px] text-[#6E6E73] leading-relaxed font-medium">
                          Daily adaptive study missions synchronized with your exact countdown to eliminate burnout.
                        </p>
                      </div>
                      {/* Visual Phase Chips */}
                      <div className="pt-2 border-t border-black/[0.04] flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#5856D6]/8 text-[#5856D6] text-[10px] font-mono font-semibold">
                          Pre (5)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#5856D6]/8 text-[#5856D6] text-[10px] font-mono font-semibold">
                          Para (6)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#5856D6]/8 text-[#5856D6] text-[10px] font-mono font-semibold">
                          Clin (8)
                        </span>
                      </div>
                    </motion.div>

                    {/* Card 3: Error Vault */}
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.03)] space-y-3 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="size-9 rounded-xl bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center shadow-2xs">
                          <RotateCcw className="size-4.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#AF52DE] bg-[#AF52DE]/10 px-2 py-0.5 rounded-full">
                          Spaced Recall
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1D1D1F]">Clinical Error Vault</p>
                        <p className="text-[12px] text-[#6E6E73] leading-relaxed font-medium">
                          Systematic diagnostic capture of every missed MCQ into permanent clinical recall anchors.
                        </p>
                      </div>
                      {/* Visual Spaced Repetition Tag */}
                      <div className="pt-2 border-t border-black/[0.04] flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#AF52DE]/10 text-[#AF52DE] text-[10px] font-mono font-bold">
                          SM-2 Spaced Recall · AI Clinical Explanations
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Start Blueprint Setup Button & Back Actions */}
                  <div className="pt-4 flex flex-col items-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={reduceMotion ? undefined : { scale: 1.03, y: -1 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                      onClick={() => setStep('examDate')}
                      className="group inline-flex items-center gap-2.5 rounded-full bg-[#007AFF] hover:bg-[#0066D6] px-9 py-4 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(0,122,255,0.35)] transition-all duration-200 cursor-pointer"
                    >
                      <span>Begin Blueprint Setup</span>
                      <ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </motion.button>

                    {isGuest && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleSkipToWorkspace}
                          className="text-xs text-[#8E8E93] hover:text-[#007AFF] font-medium underline underline-offset-4 cursor-pointer transition-colors"
                        >
                          Skip calibration &amp; start practicing right away →
                        </button>
                      </div>
                    )}

                    {/* Trust Telemetry Badge */}
                    <div className="pt-4 inline-flex items-center gap-2 text-[11px] text-[#8E8E93] font-medium">
                      <span>NBE FMGE 2026 Grounded</span>
                      <span>·</span>
                      <span>100% Client-Side Privacy</span>
                      <span>·</span>
                      <span>Offline First</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 2: EXAM DATE SELECTOR
                 ══════════════════════════════════════════════════════════ */}
              {step === 'examDate' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#007AFF]">
                      <CalendarDays className="size-4 stroke-[2.2]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Exam Calibration
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      When is your target FMGE?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      We'll construct your daily milestone pacing and subject revision blocks around your exact countdown.
                    </p>
                  </div>

                  {/* Countdown Preview Tile — Apple Ambient Card */}
                  <div className="rounded-3xl border border-[rgba(60,60,67,0.08)] bg-white/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xs relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8E8E93]">
                          Selected Exam Date
                        </p>
                        <p className="text-2xl font-bold text-[#1D1D1F] mt-0.5">
                          {examDate ? formatExamDate(examDate) : 'Select a date below'}
                        </p>
                      </div>
                      <div className="text-right">
                        {daysRemaining !== null && daysRemaining >= 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="text-3xl font-black font-mono text-[#007AFF]">
                              {daysRemaining}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider">
                              Days Left
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F2F2F7] text-[#8E8E93] text-[11px] font-semibold">
                            Pending Date
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Month Selection Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-bold text-[#1D1D1F]">Month</p>
                      <span className="text-[11px] text-[#8E8E93]">Select month first</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {MONTH_NAMES.map((name, m) => {
                        const disabled = !selectedYear || !isValidExamMonthYear(m, selectedYear, now);
                        const active = selectedMonth === m;
                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectMonth(m)}
                            aria-pressed={active}
                            className={`h-11 rounded-2xl border text-xs sm:text-[13px] font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              active
                                ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-xs'
                                : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                            }`}
                          >
                            {name.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Selection Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-bold text-[#1D1D1F]">Day</p>
                      {selectedMonth !== null && selectedYear !== null && (
                        <span className="text-[11px] font-mono text-[#8E8E93]">
                          {MONTH_NAMES[selectedMonth]} {selectedYear}
                        </span>
                      )}
                    </div>

                    {selectedMonth === null || selectedYear === null ? (
                      <div className="p-4 rounded-2xl border border-dashed border-black/[0.08] bg-white/50 text-center text-xs text-[#8E8E93]">
                        Please choose a month and year above to select the exam day.
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                        {Array.from({ length: selectedDaysInCurrentMonth }, (_, i) => i + 1).map((d) => {
                          const disabled = !isValidExamMonthDayYear(selectedMonth!, d, selectedYear!, now);
                          const active = selectedDay === d;
                          return (
                            <button
                              key={d}
                              type="button"
                              disabled={disabled}
                              onClick={() => selectDay(d)}
                              aria-pressed={active}
                              className={`h-9 sm:h-10 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                                active
                                  ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-xs font-bold'
                                  : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Year Stepper */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-bold text-[#1D1D1F]">Year</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setYearStart((y) => y - 7)}
                          aria-label="Earlier years"
                          className="flex size-7 items-center justify-center rounded-lg border border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7] cursor-pointer"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setYearStart((y) => y + 7)}
                          aria-label="Later years"
                          className="flex size-7 items-center justify-center rounded-lg border border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7] cursor-pointer"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {years.map((y) => {
                        const active = selectedYear === y;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => selectYear(y)}
                            aria-pressed={active}
                            className={`h-10 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                              active
                                ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-xs'
                                : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 3: TARGET SCORE
                 ══════════════════════════════════════════════════════════ */}
              {step === 'targetScore' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#007AFF]">
                      <Target className="size-4 stroke-[2.2]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Score Safety Margin
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      What score are you aiming for?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      The FMGE pass mark is 150/300. Aiming for a safety buffer above 150 guarantees exam-day confidence.
                    </p>
                  </div>

                  {/* Safety Buffer Visualizer */}
                  <div className="rounded-3xl border border-[rgba(60,60,67,0.08)] bg-white/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1D1D1F]">Target Benchmark</span>
                      <span className="text-xs font-mono font-black text-[#007AFF]">
                        {targetScore ? `${targetScore} / 300` : 'Choose score'}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-[#F2F2F7] overflow-hidden relative">
                      {/* 150 Pass Mark Line indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                        style={{ left: '50%' }}
                        title="Pass Mark: 150"
                      />
                      <div
                        className="h-full bg-gradient-to-r from-[#007AFF] via-[#5AC8FA] to-[#5856D6] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((Number(targetScore) || 150) / 300) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-0.5 font-medium">
                      <span className="text-rose-600 font-bold">150 Pass Mark</span>
                      <span className="font-semibold text-[#007AFF]">
                        {targetScoreBuffer > 0 ? `+${targetScoreBuffer} safety buffer` : 'Borderline target'}
                      </span>
                      <span>300 Max</span>
                    </div>
                  </div>

                  {/* Preset Targets */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#1D1D1F] px-1">Recommended Target Presets</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {TARGET_SCORE_OPTIONS.map((score) => {
                        const active = targetScore === score;
                        return (
                          <motion.button
                            key={score}
                            type="button"
                            whileHover={{ y: -2 }}
                            onClick={() => setTargetScore(score)}
                            aria-pressed={active}
                            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                              active
                                ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] ring-2 ring-[#007AFF]/30 shadow-xs'
                                : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                            }`}
                          >
                            <span className="text-2xl font-black font-mono block">{score}+</span>
                            <span className="text-[11px] font-semibold text-[#8E8E93] mt-0.5 block">
                              +{score - 150} pts buffer
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Target Score Input */}
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-xs font-bold text-[#1D1D1F] px-1">
                        Or enter custom target score (150 – 300)
                      </span>
                      <input
                        type="number"
                        min={150}
                        max={300}
                        value={targetScore === '' ? '' : targetScore}
                        onChange={(e) =>
                          setTargetScore(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="mt-1.5 w-full h-11 rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white px-4 text-sm font-semibold text-[#1D1D1F] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 placeholder:text-[#8E8E93]"
                        placeholder="e.g. 215"
                      />
                    </label>
                    {targetScore !== '' && !isValidTargetScore(targetScore) && (
                      <p className="text-xs font-semibold text-rose-600 px-1">
                        Target score must be between 150 and 300.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 4: PREPARATION STAGE
                 ══════════════════════════════════════════════════════════ */}
              {step === 'preparationStage' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#007AFF]">
                      <Gauge className="size-4 stroke-[2.2]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Preparation Phase
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      Where are you right now?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      Your current status determines how much time the system allocates to primary reading vs. active recall and QBank drilling.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {PREPARATION_STAGE_OPTIONS.map((option, idx) => {
                      const active = preparationStage === option.id;
                      const squircleColor =
                        idx === 0
                          ? 'bg-[#007AFF]'
                          : idx === 1
                          ? 'bg-[#5856D6]'
                          : idx === 2
                          ? 'bg-[#32ADE6]'
                          : 'bg-[#FF9500]';
                      const Icon =
                        idx === 0
                          ? BookOpen
                          : idx === 1
                          ? RotateCcw
                          : idx === 2
                          ? Award
                          : Activity;

                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          whileHover={reduceMotion ? undefined : { scale: 1.012, y: -2 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                          onClick={() => setPreparationStage(option.id)}
                          aria-pressed={active}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            active
                              ? 'border-[#007AFF] bg-[#007AFF]/5 ring-2 ring-[#007AFF]/30 shadow-xs'
                              : 'border-[rgba(60,60,67,0.08)] bg-white hover:bg-[#F2F2F7]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`size-10 rounded-xl ${squircleColor} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                              <Icon className="size-5 stroke-[2.2]" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                                {option.label}
                                {active && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF] text-white">
                                    Selected
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-[#6E6E73] leading-relaxed line-clamp-1">{option.description}</p>
                            </div>
                          </div>

                          <div
                            className={`size-6 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                              active
                                ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-xs'
                                : 'border-[#C7C7CC] bg-[#F2F2F7]'
                            }`}
                          >
                            {active && <Check className="size-3.5 stroke-[2.5]" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 5: DAILY STUDY HOURS
                 ══════════════════════════════════════════════════════════ */}
              {step === 'dailyStudyHours' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#007AFF]">
                      <Clock className="size-4 stroke-[2.2]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Daily Commitment
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      How much time can you commit daily?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      We'll size your daily task modules so you finish on time without burnout.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DAILY_STUDY_HOURS_OPTIONS.map((hours) => {
                      const active = dailyStudyHours === hours;
                      const subtitle =
                        hours <= 4
                          ? 'Consistent Pace'
                          : hours === 6
                          ? 'Recommended'
                          : hours === 8
                          ? 'Intense Focus'
                          : 'Full-time Sprint';
                      return (
                        <motion.button
                          key={hours}
                          type="button"
                          whileHover={{ y: -2 }}
                          onClick={() => setDailyStudyHours(hours)}
                          aria-pressed={active}
                          className={`p-4 rounded-3xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] ring-2 ring-[#007AFF]/30 shadow-xs'
                              : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                          }`}
                        >
                          <span className="text-3xl font-black font-mono block">
                            {hours}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] block mt-0.5">
                            hrs / day
                          </span>
                          <span
                            className={`text-[10.5px] font-bold mt-2 inline-block px-2.5 py-0.5 rounded-full ${
                              active
                                ? 'bg-[#007AFF] text-white'
                                : 'bg-[#F2F2F7] text-[#6E6E73]'
                            }`}
                          >
                            {subtitle}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-3xl bg-[#007AFF]/5 border border-[#007AFF]/20 text-xs text-[#007AFF] flex items-start gap-2.5">
                    <Award className="size-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">
                      <strong className="font-bold">FMGE Success Benchmark:</strong> Candidates allocating 6 to 8 focused hours daily with high-yield revision loops achieve a &gt;85% pass probability.
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 6: STUDY PREFERENCES
                 ══════════════════════════════════════════════════════════ */}
              {step === 'studyPreferences' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#007AFF]">
                      <Layers className="size-4 stroke-[2.2]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Learning Formats
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      How do you learn best?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      Select your preferred clinical study tools (choose all that match your routine).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STUDY_PREFERENCES_OPTIONS.map((pref) => {
                      const active = studyPreferences.includes(pref.id);
                      return (
                        <motion.button
                          key={pref.id}
                          type="button"
                          whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                          onClick={() => togglePreference(pref.id)}
                          aria-pressed={active}
                          className={`p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            active
                              ? 'border-[#007AFF] bg-[#007AFF]/5 ring-2 ring-[#007AFF]/25 shadow-xs text-[#007AFF]'
                              : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                          }`}
                        >
                          <span className="text-sm font-bold">{pref.label}</span>
                          <span
                            className={`size-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                              active ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-2xs' : 'border-[#C7C7CC]'
                            }`}
                          >
                            {active && <Check className="size-3.5 stroke-[2.5]" />}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 7: BASELINE GRAND TEST
                 ══════════════════════════════════════════════════════════ */}
              {step === 'baseline' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#007AFF]">
                      <TrendingUp className="size-4 stroke-[2.2]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                        Diagnostic Assessment
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      Have you taken a recent Grand Test?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      Optional — an approximate baseline score immediately calibrates your initial subject difficulty weights.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHasBaseline(true)}
                      aria-pressed={hasBaseline}
                      className={`h-12 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                        hasBaseline
                          ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-xs'
                          : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                      }`}
                    >
                      Yes, I have
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasBaseline(false);
                        setBaselineScore('');
                      }}
                      aria-pressed={!hasBaseline}
                      className={`h-12 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                        !hasBaseline
                          ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-xs'
                          : 'border-[rgba(60,60,67,0.08)] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]'
                      }`}
                    >
                      Not yet
                    </button>
                  </div>

                  {hasBaseline && (
                    <div className="space-y-4 rounded-3xl border border-[rgba(60,60,67,0.08)] bg-white/90 backdrop-blur-xl p-5 shadow-2xs">
                      <label className="block">
                        <span className="text-xs font-bold text-[#1D1D1F]">
                          Approximate Grand Test Score (/300)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={baselineScore === '' ? '' : baselineScore}
                          onChange={(e) =>
                            setBaselineScore(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="mt-1.5 w-full h-11 rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white px-4 text-sm font-semibold text-[#1D1D1F] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 placeholder:text-[#8E8E93]"
                          placeholder="e.g. 165"
                        />
                        {baselineScore !== '' && !isValidBaselineScore(baselineScore) && (
                          <p className="text-xs font-semibold text-rose-600 mt-1">
                            Score must be between 0 and 300.
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-[#1D1D1F]">
                          Questions Attempted
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={baselineQuestions === '' ? '' : baselineQuestions}
                          onChange={(e) =>
                            setBaselineQuestions(
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="mt-1.5 w-full h-11 rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white px-4 text-sm font-semibold text-[#1D1D1F] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 placeholder:text-[#8E8E93]"
                          placeholder="e.g. 200"
                        />
                      </label>
                    </div>
                  )}

                  {/* Primary coaching source selection */}
                  <label className="block">
                    <span className="text-xs font-bold text-[#1D1D1F] px-1">
                      Primary Coaching Platform (Optional)
                    </span>
                    <select
                      value={coachingSource}
                      onChange={(e) => setCoachingSource(e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white px-3 text-sm font-semibold text-[#1D1D1F] focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 cursor-pointer"
                    >
                      <option value="Marrow">Marrow</option>
                      <option value="Marrow / Prepladder">Marrow / Prepladder</option>
                      <option value="Prepladder">Prepladder</option>
                      <option value="Cerebellum">Cerebellum</option>
                      <option value="DAMS">DAMS</option>
                      <option value="Bhatia">Bhatia</option>
                      <option value="Self Study / Standard Textbooks">Self Study / Standard Textbooks</option>
                    </select>
                  </label>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 8: BUILDING / SYNTHESIZING ROADMAP
                 ══════════════════════════════════════════════════════════ */}
              {step === 'building' && (
                <div className="py-12 sm:py-16 text-center space-y-6">
                  {/* Concentric Pulsing Apple Spinner */}
                  <div className="relative mx-auto size-24 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0.45, 0.15] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-[#5AC8FA] blur-lg"
                    />
                    <div className="absolute -inset-2 rounded-full border-2 border-[#007AFF]/30 animate-spin [animation-duration:6s]" />
                    <div className="relative size-18 rounded-2xl bg-white border border-[#007AFF]/30 p-2 shadow-xl shadow-blue-950/20 flex items-center justify-center overflow-hidden">
                      <img
                        src="/images/brand/one_shot_emblem.png"
                        alt="ONE SHOT FMGE Emblem"
                        className="size-full object-contain rounded-xl animate-pulse"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-sm mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      Synthesizing Your Clinical Blueprint
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                      Analyzing 19 clinical subjects, your target safety margin, and countdown pacing...
                    </p>
                  </div>

                  {/* Sequential verification checks */}
                  <div className="max-w-xs mx-auto text-left space-y-2.5 pt-2">
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2.5 text-xs text-[#6E6E73]"
                    >
                      <CheckCircle2
                        className={`size-4 transition-colors ${
                          buildingStepIdx >= 0 ? 'text-[#007AFF]' : 'text-[#C7C7CC]'
                        }`}
                      />
                      <span className={buildingStepIdx >= 0 ? 'font-bold text-[#1D1D1F]' : ''}>
                        Calibrating 19 subject weights
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2.5 text-xs text-[#6E6E73]"
                    >
                      <CheckCircle2
                        className={`size-4 transition-colors ${
                          buildingStepIdx >= 1 ? 'text-[#007AFF]' : 'text-[#C7C7CC]'
                        }`}
                      />
                      <span className={buildingStepIdx >= 1 ? 'font-bold text-[#1D1D1F]' : ''}>
                        Structuring Error Vault remediation
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2.5 text-xs text-[#6E6E73]"
                    >
                      <CheckCircle2
                        className={`size-4 transition-colors ${
                          buildingStepIdx >= 2 ? 'text-[#007AFF]' : 'text-[#C7C7CC]'
                        }`}
                      />
                      <span className={buildingStepIdx >= 2 ? 'font-bold text-[#1D1D1F]' : ''}>
                        Personalizing daily study missions
                      </span>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 9: BLUEPRINT CERTIFICATE READY
                 ══════════════════════════════════════════════════════════ */}
              {step === 'ready' && (
                <div className="space-y-6 pt-2 pb-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/25 text-xs font-bold">
                      <Check className="size-3.5 stroke-[2.5]" />
                      Blueprint Calibrated &amp; Verified
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                      Your FMGE Blueprint is Ready, Doctor.
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6E73] max-w-md mx-auto font-medium">
                      Here is your personalized roadmap summary. Every study sprint, mock GT, and revision block is configured to hit your target.
                    </p>
                  </div>

                  {/* Clinical Specimen Certificate Card */}
                  <div className="rounded-3xl border border-[rgba(60,60,67,0.08)] bg-white/95 backdrop-blur-xl p-6 shadow-sm space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-36 bg-gradient-to-bl from-[#5AC8FA]/15 via-[#5856D6]/10 to-transparent rounded-bl-full pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-black/[0.05] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-white border border-[#007AFF]/25 shadow-xs overflow-hidden p-1 shrink-0 flex items-center justify-center">
                          <svg viewBox="0 0 48 48" className="size-full shrink-0" fill="none" aria-hidden="true">
                            <rect width="48" height="48" rx="13" fill="url(#onbEmblemBg)" />
                            <rect x="1" y="1" width="46" height="22" rx="12" fill="url(#onbGloss)" />
                            <path d="M12 28 C12 16 36 16 36 28" stroke="url(#onbGoldGrad)" strokeWidth="1.8" strokeDasharray="2.5 2.5" strokeLinecap="round" />
                            <path d="M14 34 C18 31 24 32 24 36 C24 32 30 31 34 34 L34 23 C30 20 24 21 24 25 C24 21 18 20 14 23 Z" fill="#FFFFFF" opacity="0.95" />
                            <line x1="24" y1="13" x2="24" y2="34" stroke="url(#onbGoldGrad)" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M21 17 Q27 19 24 23 Q21 27 27 29" stroke="#5AC8FA" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                            <polygon points="24,9 25.5,13 29,14 25.5,15 24,19 22.5,15 19,14 22.5,13" fill="url(#onbGoldGrad)" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1D1D1F]">FMGE Strategy Blueprint</p>
                          <p className="text-[11px] text-[#8E8E93]">ONE SHOT FMGE Clinical Intelligence</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/25">
                        <ShieldCheck className="size-3.5 stroke-[2.4]" />
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                        <p className="text-[10px] font-mono uppercase font-bold text-[#8E8E93]">Exam Date</p>
                        <p className="font-bold text-sm text-[#1D1D1F] mt-1 truncate">
                          {examDate ? formatExamDate(examDate) : 'Flexible'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                        <p className="text-[10px] font-mono uppercase font-bold text-[#8E8E93]">Countdown</p>
                        <p className="font-bold font-mono text-sm text-[#007AFF] mt-1">
                          {daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining} days` : 'Flexible'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                        <p className="text-[10px] font-mono uppercase font-bold text-[#8E8E93]">Target Score</p>
                        <p className="font-bold font-mono text-sm text-[#007AFF] mt-1">
                          {targetScore}+ <span className="text-[10px] text-[#8E8E93] font-normal">/300</span>
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                        <p className="text-[10px] font-mono uppercase font-bold text-[#8E8E93]">Daily Pacing</p>
                        <p className="font-bold text-sm text-[#1D1D1F] mt-1">
                          {dailyStudyHours}h / day
                        </p>
                      </div>
                    </div>

                    {preparationStage && (
                      <div className="p-3.5 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/15 flex items-center justify-between text-xs">
                        <span className="text-[#6E6E73] font-medium">Starting Phase</span>
                        <span className="font-bold text-[#007AFF]">
                          {PREPARATION_STAGE_LABELS[preparationStage]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Launch Workspace CTA */}
                  <div className="pt-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={finish}
                      className="group w-full rounded-full bg-[#007AFF] hover:bg-[#0066D6] py-4 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,122,255,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Launch My FMGE Workspace</span>
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Fixed Bottom Navigation Action Bar ── */}
      {step !== 'welcome' && step !== 'building' && step !== 'ready' && (
        <footer className="shrink-0 w-full bg-white/80 backdrop-blur-xl border-t border-[rgba(60,60,67,0.08)] px-5 sm:px-8 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3.5 z-20">
          <div className="w-full max-w-2xl mx-auto">
            {saveError && (
              <p className="mb-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3">
                {saveError}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { x: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  onClick={goBack}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer disabled:opacity-40 rounded-full px-3 py-1.5"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                  onClick={handleExitToWelcome}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F] transition-colors cursor-pointer rounded-full px-3.5 py-1.5 border border-black/[0.06] bg-white shadow-2xs"
                >
                  <ArrowLeft className="size-3.5 text-[#007AFF]" />
                  <span>{isGuest ? 'Back to Sign In' : 'Exit'}</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                onClick={goNext}
                disabled={
                  isSaving ||
                  (step === 'examDate' && !canContinueExamDate) ||
                  (step === 'targetScore' && !canContinueTargetScore)
                }
                className="group inline-flex items-center gap-2 rounded-full bg-[#007AFF] hover:bg-[#0066D6] px-8 py-3 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,122,255,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Synthesizing...
                  </>
                ) : step === 'baseline' ? (
                  <>
                    Build My Blueprint
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </footer>
      )}

      {step === 'ready' && (
        <footer className="shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]" />
      )}
    </div>
  );
};
