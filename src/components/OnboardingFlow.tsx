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
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Activity,
  Award,
  Zap,
  BookOpen,
  CheckCircle2,
  Stethoscope,
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
      try {
        await saveOnboardingProgress({ dailyHoursTarget: dailyStudyHours });
      } catch {}
      setStep('studyPreferences');
      return;
    }
    if (step === 'studyPreferences') {
      if (studyPreferences.length > 0) {
        try {
          await saveOnboardingProgress({ studyPreferences });
        } catch {}
      }
      setStep('baseline');
      return;
    }
    if (step === 'baseline') {
      await handleBuildPlan();
    }
  };

  const handleBuildPlan = async () => {
    setIsSaving(true);
    setSaveError(null);
    setBuildingStepIdx(0);
    setStep('building');

    try {
      // Smooth visual progression steps
      const progressTimer1 = setTimeout(() => setBuildingStepIdx(1), 350);
      const progressTimer2 = setTimeout(() => setBuildingStepIdx(2), 700);

      await completeOnboarding(examDate, Number(targetScore), dailyStudyHours, {
        source: coachingSource,
        preparationStage: preparationStage || undefined,
        studyPreferences,
        baselineScore: hasBaseline && baselineScore !== '' ? Number(baselineScore) : undefined,
        baselineQuestions: hasBaseline && baselineQuestions !== '' ? Number(baselineQuestions) : undefined,
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      // Brief, pleasant transition into the certified blueprint view
      await new Promise((r) => setTimeout(r, reduceMotion ? 100 : 1000));
      setStep('ready');
      onComplete?.();
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      setSaveError("Couldn't save your plan. Please try again.");
      setStep('baseline');
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (step === 'ready') {
      confetti({
        particleCount: 85,
        spread: 75,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#F4FAF8] via-[#FAF9F6] to-[#EBF6F3] text-slate-800 selection:bg-teal-500/20 selection:text-[#004D47] font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* ── Dynamic Ambient Circadian Auroras & ECG Telemetry ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Breathing Teal/Emerald Aurora */}
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0.55, 0.35],
                  x: [0, 20, 0],
                  y: [0, -15, 0],
                }
          }
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-teal-300/35 via-emerald-200/25 to-transparent blur-3xl"
        />

        {/* Breathing Warm Amber/Terracotta Aurora */}
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1.1, 0.95, 1.1],
                  opacity: [0.25, 0.45, 0.25],
                  x: [0, -15, 0],
                  y: [0, 20, 0],
                }
          }
          transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-36 -left-36 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-amber-200/30 via-teal-100/20 to-transparent blur-3xl"
        />

        {/* Faint subtle medical ECG wave in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
          <svg viewBox="0 0 800 140" className="w-full max-w-2xl stroke-[#006B63] fill-none stroke-[2]">
            <path d="M 0 70 L 240 70 L 260 45 L 280 100 L 300 20 L 320 120 L 340 60 L 360 80 L 380 70 L 800 70" />
          </svg>
        </div>
      </div>

      {/* ── Fixed Clinical Top Bar ── */}
      <header className="relative shrink-0 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <OneShotLogo variant="compact" size="sm" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#006B63]" />
            Clinical Blueprint
          </span>
        </div>

        {/* Actions: Exit / Return to Sign In + Step telemetry badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 26 }}
            onClick={handleExitToWelcome}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-stone-200/90 hover:border-teal-400 text-stone-700 hover:text-stone-950 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Return to Welcome / Sign In"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#006B63]" />
            <span>{isGuest ? 'Back to Sign In' : 'Exit Setup'}</span>
          </motion.button>

          {answerProgress !== null && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-200/90 shadow-2xs">
              <span className="text-[11px] font-mono font-bold text-[#006B63] tabular-nums">
                {String(answerProgress + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
              </span>
              <span className="h-3 w-px bg-stone-200" />
              <span className="text-[11px] font-medium text-stone-600 truncate max-w-[110px] sm:max-w-none">
                {STEP_TITLES[step]}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Precision Clinical Progress Bar ── */}
      <div className="relative shrink-0 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-3 z-10">
        <div className="h-1.5 w-full rounded-full bg-stone-200/70 overflow-hidden p-0.5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#006B63] to-[#00897B] rounded-full shadow-xs"
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
        <div className="w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* ══════════════════════════════════════════════════════════
                  STEP 1: WELCOME HERO
                 ══════════════════════════════════════════════════════════ */}
              {step === 'welcome' && (
                <div className="pt-4 sm:pt-8 pb-4 text-center space-y-8">
                  {/* Floating Brand Emblem with Concentric Breathing Halo Rings */}
                  <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    {/* Outer radiant ring */}
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              scale: [1, 1.25, 1],
                              opacity: [0.15, 0.35, 0.15],
                            }
                      }
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-[#006B63] via-[#00897B] to-amber-300 blur-xl"
                    />

                    {/* Concentric secondary halo ring */}
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              scale: [1.1, 1.35, 1.1],
                              opacity: [0.1, 0.25, 0.1],
                            }
                      }
                      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="absolute -inset-2 rounded-[32px] border border-[#006B63]/25 bg-teal-500/5"
                    />

                    {/* Floating emblem container */}
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              y: [0, -4, 0],
                            }
                      }
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative w-full h-full rounded-[26px] bg-white p-2.5 shadow-xl shadow-teal-950/15 border border-[#006B63]/20 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src="/images/brand/one_shot_emblem.png"
                        alt="ONE SHOT FMGE Master Emblem"
                        className="w-full h-full object-contain rounded-2xl drop-shadow-xs"
                      />
                    </motion.div>
                  </div>

                  <div className="space-y-3 max-w-lg mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-[#006B63] border border-teal-500/20 text-xs font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Doctor Preparation System
                    </div>
                    <h1 className="text-3xl sm:text-4xl sm:leading-tight font-extrabold tracking-[-0.035em] text-slate-900">
                      Architect your path to clearing the FMGE.
                    </h1>
                    <p className="text-sm sm:text-[15px] text-stone-600 leading-relaxed max-w-md mx-auto">
                      In under two minutes, we will configure your exam countdown, target score buffer, daily study capacity, and clinical focus areas.
                    </p>
                  </div>

                  {/* 3 Value Pillars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto pt-2">
                    <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5 transition-all duration-200 hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5">
                      <div className="h-7 w-7 rounded-lg bg-teal-50 text-[#006B63] flex items-center justify-center">
                        <Target className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">Score Buffer</p>
                      <p className="text-[11.5px] text-stone-500 leading-normal">
                        Calibrate chapter weighting well past the 150 pass mark.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5 transition-all duration-200 hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5">
                      <div className="h-7 w-7 rounded-lg bg-amber-50 text-[#B57B66] flex items-center justify-center">
                        <Activity className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">19 Subjects Pace</p>
                      <p className="text-[11.5px] text-stone-500 leading-normal">
                        Daily smart missions engineered around your target exam day.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5 transition-all duration-200 hover:border-teal-300 hover:shadow-xs hover:-translate-y-0.5">
                      <div className="h-7 w-7 rounded-lg bg-teal-50 text-[#006B63] flex items-center justify-center">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">Error Vault</p>
                      <p className="text-[11.5px] text-stone-500 leading-normal">
                        Systematic remediation of weak clinical competencies.
                      </p>
                    </div>
                  </div>

                  {/* Start Blueprint Setup Button & Back Actions */}
                  <div className="pt-3 flex flex-col items-center gap-3">
                    <motion.button
                      type="button"
                      whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                      onClick={() => setStep('examDate')}
                      className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#10B981] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-teal-950/20 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] focus-visible:ring-offset-2"
                    >
                      <span>Begin Blueprint Setup</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </motion.button>

                    <div className="flex items-center gap-3 pt-1">
                      <motion.button
                        type="button"
                        whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                        onClick={handleExitToWelcome}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-300/90 bg-white/90 hover:bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 shadow-2xs transition-all cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 text-[#006B63]" />
                        <span>{isGuest ? 'Back to Sign In & Welcome' : 'Return to Home'}</span>
                      </motion.button>

                      {isGuest && (
                        <button
                          type="button"
                          onClick={handleSkipToWorkspace}
                          className="text-xs text-stone-500 hover:text-[#006B63] font-medium underline underline-offset-4 cursor-pointer transition-colors"
                        >
                          Skip directly to Practice →
                        </button>
                      )}
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
                    <div className="flex items-center gap-2 text-[#006B63]">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Exam Calibration
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      When is your target FMGE?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      We'll construct your daily milestone pacing and subject revision blocks around your exact countdown.
                    </p>
                  </div>

                  {/* Countdown Preview Tile */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400">
                          Selected Exam Date
                        </p>
                        <p className="font-['Outfit'] text-2xl font-bold text-slate-900 mt-0.5">
                          {examDate ? formatExamDate(examDate) : 'Select a date below'}
                        </p>
                      </div>
                      <div className="text-right">
                        {daysRemaining !== null && daysRemaining >= 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-['Outfit'] text-2xl font-black text-[#006B63]">
                              {daysRemaining}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                              Days Left
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-stone-500 text-[11px] font-semibold">
                            Pending Date
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Month Selection Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Month</p>
                      <span className="text-[11px] text-stone-400">Select month first</span>
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
                            className={`h-11 rounded-xl border text-xs sm:text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                              active
                                ? 'border-[#006B63] bg-[#006B63] text-white shadow-sm'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Day</p>
                      {selectedMonth !== null && selectedYear !== null && (
                        <span className="text-[11px] text-stone-400">
                          {MONTH_NAMES[selectedMonth]} {selectedYear}
                        </span>
                      )}
                    </div>

                    {selectedMonth === null || selectedYear === null ? (
                      <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 text-center text-xs text-stone-400">
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
                              className={`h-9 sm:h-10 rounded-lg border text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                                active
                                  ? 'border-[#006B63] bg-[#006B63] text-white shadow-xs font-bold'
                                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Year Stepper & Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Year</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setYearStart((y) => y - 7)}
                          aria-label="Earlier years"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setYearStart((y) => y + 7)}
                          aria-label="Later years"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {years.map((year) => {
                        const disabled = year < currentYear;
                        const active = selectedYear === year;
                        return (
                          <button
                            key={year}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectYear(year)}
                            aria-pressed={active}
                            className={`h-11 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                              active
                                ? 'border-[#006B63] bg-[#006B63] text-white shadow-sm'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                            }`}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Undecided toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setExamDate('');
                        setSelectedMonth(null);
                        setSelectedYear(currentYear);
                        setSelectedDay(null);
                      }}
                      className={`text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] rounded px-1.5 py-0.5 ${
                        !examDate
                          ? 'text-[#006B63] underline underline-offset-4'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      I haven't finalized my exam date yet (General pace)
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  STEP 3: TARGET SCORE
                 ══════════════════════════════════════════════════════════ */}
              {step === 'targetScore' && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#006B63]">
                      <Target className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Score Safety Margin
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      What score are you aiming for?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      The FMGE pass mark is 150/300. Aiming for a safety buffer above 150 guarantees exam-day confidence.
                    </p>
                  </div>

                  {/* Safety Buffer Visualizer */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Target Benchmark</span>
                      <span className="text-xs font-mono font-bold text-[#006B63]">
                        {targetScore ? `${targetScore} / 300` : 'Choose score'}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden relative">
                      {/* 150 Pass Mark Line indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                        style={{ left: '50%' }}
                        title="Pass Mark: 150"
                      />
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-[#006B63] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((Number(targetScore) || 150) / 300) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                      <span className="text-rose-600 font-semibold">150 Pass Mark</span>
                      <span className="font-medium">
                        {targetScoreBuffer > 0 ? `+${targetScoreBuffer} safety buffer` : 'Borderline target'}
                      </span>
                      <span>300 Max</span>
                    </div>
                  </div>

                  {/* Preset Targets */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Recommended Target Presets</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {TARGET_SCORE_OPTIONS.map((score) => {
                        const active = targetScore === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setTargetScore(score)}
                            aria-pressed={active}
                            className={`p-4 rounded-xl border text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                              active
                                ? 'border-[#006B63] bg-teal-50/50 text-[#004D47] ring-1 ring-[#006B63] shadow-xs'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="font-['Outfit'] text-2xl font-black block">{score}+</span>
                            <span className="text-[11px] font-semibold text-stone-500 mt-0.5 block">
                              +{score - 150} pts buffer
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Target Score Input */}
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
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
                        className="mt-1.5 w-full h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-[#006B63] focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-stone-400"
                        placeholder="e.g. 215"
                      />
                    </label>
                    {targetScore !== '' && !isValidTargetScore(targetScore) && (
                      <p className="text-xs font-semibold text-rose-600">
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
                    <div className="flex items-center gap-2 text-[#006B63]">
                      <Gauge className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Preparation Phase
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      Where are you right now?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Your current status determines how much time the system allocates to primary reading vs. active recall and QBank drilling.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {PREPARATION_STAGE_OPTIONS.map((option) => {
                      const active = preparationStage === option.id;
                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          whileHover={reduceMotion ? undefined : { scale: 1.012, y: -2 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                          onClick={() => setPreparationStage(option.id)}
                          aria-pressed={active}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                            active
                              ? 'border-[#006B63] bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-white ring-2 ring-[#006B63]/30 shadow-md shadow-teal-950/5'
                              : 'border-stone-200 bg-white hover:bg-stone-50/80 hover:border-stone-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {option.label}
                              {active && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#006B63] text-white shadow-2xs">
                                  Selected
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-stone-500 leading-relaxed">{option.description}</p>
                          </div>
                          <div
                            className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                              active
                                ? 'bg-[#006B63] border-[#006B63] text-white shadow-xs'
                                : 'border-stone-300 bg-stone-50'
                            }`}
                          >
                            {active && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
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
                    <div className="flex items-center gap-2 text-[#006B63]">
                      <Clock className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Daily Commitment
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      How much time can you commit daily?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
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
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDailyStudyHours(hours)}
                          aria-pressed={active}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                            active
                              ? 'border-[#006B63] bg-teal-50/50 ring-1 ring-[#006B63] shadow-xs'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <span className="font-['Outfit'] text-3xl font-black text-slate-900 block">
                            {hours}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mt-0.5">
                            hrs / day
                          </span>
                          <span
                            className={`text-[10px] font-semibold mt-2 inline-block px-2 py-0.5 rounded-full ${
                              active
                                ? 'bg-[#006B63] text-white'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 text-xs text-[#004D47] flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-[#006B63] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>FMGE Success Benchmark:</strong> Candidates allocating 6 to 8 focused hours daily with high-yield revision loops achieve a &gt;85% pass probability.
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
                    <div className="flex items-center gap-2 text-[#006B63]">
                      <Layers className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Learning Formats
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      How do you learn best?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
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
                          className={`p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                            active
                              ? 'border-[#006B63] bg-gradient-to-r from-teal-50/90 to-emerald-50/40 text-slate-900 ring-2 ring-[#006B63]/25 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-800">{pref.label}</span>
                          <span
                            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              active ? 'bg-[#006B63] border-[#006B63] text-white shadow-2xs' : 'border-stone-300'
                            }`}
                          >
                            {active && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
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
                    <div className="flex items-center gap-2 text-[#006B63]">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Diagnostic Assessment
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      Have you taken a recent Grand Test?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Optional — an approximate baseline score immediately calibrates your initial subject difficulty weights.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHasBaseline(true)}
                      aria-pressed={hasBaseline}
                      className={`h-12 rounded-xl border text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                        hasBaseline
                          ? 'border-[#006B63] bg-[#006B63] text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
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
                      className={`h-12 rounded-xl border text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] ${
                        !hasBaseline
                          ? 'border-[#006B63] bg-[#006B63] text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Not yet
                    </button>
                  </div>

                  {hasBaseline && (
                    <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
                      <label className="block">
                        <span className="text-xs font-bold text-slate-700">
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
                          className="mt-1.5 w-full h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-[#006B63] focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-stone-400"
                          placeholder="e.g. 165"
                        />
                        {baselineScore !== '' && !isValidBaselineScore(baselineScore) && (
                          <p className="text-xs font-semibold text-rose-600 mt-1">
                            Score must be between 0 and 300.
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-slate-700">
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
                          className="mt-1.5 w-full h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:border-[#006B63] focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-stone-400"
                          placeholder="e.g. 200"
                        />
                      </label>
                    </div>
                  )}

                  {/* Primary coaching source selection */}
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">
                      Primary Coaching Platform (Optional)
                    </span>
                    <select
                      value={coachingSource}
                      onChange={(e) => setCoachingSource(e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-[#006B63] focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
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
                  {/* Concentric Pulsing Emblem */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0.45, 0.15] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-teal-400 blur-lg"
                    />
                    <div className="absolute -inset-2 rounded-full border border-teal-500/30 animate-spin [animation-duration:8s]" />
                    <div className="relative h-18 w-18 rounded-2xl bg-white border border-teal-600/30 p-2 shadow-xl shadow-teal-950/20 flex items-center justify-center overflow-hidden">
                      <img
                        src="/images/brand/one_shot_emblem.png"
                        alt="ONE SHOT FMGE Emblem"
                        className="h-full w-full object-contain rounded-xl animate-pulse"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-sm mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      Synthesizing Your Clinical Blueprint
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Analyzing 19 clinical subjects, your target safety margin, and countdown pacing...
                    </p>
                  </div>

                  {/* Sequential verification checks */}
                  <div className="max-w-xs mx-auto text-left space-y-2.5 pt-2">
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2.5 text-xs text-stone-600"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 transition-colors ${
                          buildingStepIdx >= 0 ? 'text-[#006B63]' : 'text-stone-300'
                        }`}
                      />
                      <span className={buildingStepIdx >= 0 ? 'font-semibold text-slate-900' : ''}>
                        Calibrating 19 subject weights
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2.5 text-xs text-stone-600"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 transition-colors ${
                          buildingStepIdx >= 1 ? 'text-[#006B63]' : 'text-stone-300'
                        }`}
                      />
                      <span className={buildingStepIdx >= 1 ? 'font-semibold text-slate-900' : ''}>
                        Structuring Error Vault remediation
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2.5 text-xs text-stone-600"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 transition-colors ${
                          buildingStepIdx >= 2 ? 'text-[#006B63]' : 'text-stone-300'
                        }`}
                      />
                      <span className={buildingStepIdx >= 2 ? 'font-semibold text-slate-900' : ''}>
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      Blueprint Calibrated &amp; Verified
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-slate-900">
                      Your FMGE Blueprint is Ready, Doctor.
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                      Here is your personalized roadmap summary. Every study sprint, mock GT, and revision block is configured to hit your target.
                    </p>
                  </div>

                  {/* Clinical Specimen Certificate Card */}
                  <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-100/40 via-amber-100/20 to-transparent rounded-bl-full pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border border-[#006B63]/20 shadow-xs overflow-hidden p-1 shrink-0 flex items-center justify-center">
                          <img
                            src="/images/brand/one_shot_emblem.png"
                            alt="ONE SHOT FMGE Emblem"
                            className="h-full w-full object-contain rounded-lg"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">FMGE Strategy Blueprint</p>
                          <p className="text-[11px] text-stone-500">ONE SHOT FMGE Clinical Intelligence</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-[#006B63] border border-teal-500/20">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                        <p className="text-[10px] font-mono uppercase text-stone-400">Exam Date</p>
                        <p className="font-bold text-sm text-slate-900 mt-1 truncate">
                          {examDate ? formatExamDate(examDate) : 'Flexible'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                        <p className="text-[10px] font-mono uppercase text-stone-400">Countdown</p>
                        <p className="font-['Outfit'] font-bold text-sm text-[#006B63] mt-1">
                          {daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining} days` : 'Flexible'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                        <p className="text-[10px] font-mono uppercase text-stone-400">Target Score</p>
                        <p className="font-['Outfit'] font-bold text-sm text-[#B57B66] mt-1">
                          {targetScore}+ <span className="text-[10px] text-stone-400 font-normal">/300</span>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                        <p className="text-[10px] font-mono uppercase text-stone-400">Daily Pacing</p>
                        <p className="font-bold text-sm text-slate-900 mt-1">
                          {dailyStudyHours}h / day
                        </p>
                      </div>
                    </div>

                    {preparationStage && (
                      <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between text-xs">
                        <span className="text-stone-600 font-medium">Starting Phase</span>
                        <span className="font-bold text-[#004D47]">
                          {PREPARATION_STAGE_LABELS[preparationStage]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Launch Workspace CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={finish}
                      className="group w-full rounded-full bg-[#006B63] hover:bg-[#00544E] active:scale-[0.98] py-4 text-sm font-semibold text-white shadow-md shadow-teal-950/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] focus-visible:ring-offset-2"
                    >
                      <span>Launch My FMGE Workspace</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Fixed Bottom Navigation Action Bar ── */}
      {step !== 'welcome' && step !== 'building' && step !== 'ready' && (
        <footer className="shrink-0 w-full bg-white/90 backdrop-blur-md border-t border-stone-200/80 px-5 sm:px-8 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3.5 z-20">
          <div className="w-full max-w-2xl mx-auto">
            {saveError && (
              <p className="mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3">
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
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] rounded-full px-3 py-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                  onClick={handleExitToWelcome}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer rounded-full px-3.5 py-1.5 border border-stone-200/80 bg-white/90 hover:bg-white shadow-2xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-[#006B63]" />
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
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#059669] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-950/15 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63] focus-visible:ring-offset-2"
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Synthesizing...
                  </>
                ) : step === 'baseline' ? (
                  <>
                    Build My Blueprint
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
