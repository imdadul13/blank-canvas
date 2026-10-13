import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Activity, ArrowRight, Baby, Bone, BookOpenCheck, Bot, Brain, Bug, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Dna, Ear, Eye, Fingerprint, Flower2, HeartPulse, Image as ImageIcon, Layers, LoaderCircle, MessageSquareText, Microscope, Pill, RotateCcw, Scale, ScanLine, Scissors, Stethoscope, Syringe, Target, Users, X, Zap } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { buildDueReviewQueue, type ReviewQueueItem } from '../utils/qbankReviewQueue';
import type { AppState, GrandTest, McqAttempt } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import {
  type SprintDay,
  type SprintErrorType,
  SPRINT_DAYS,
  FMGE_BLUEPRINT_MARKS,
  localDateKey,
  FMGE_EXAM_DATE,
  daysUntilFmge,
  sprintDateForIndex,
  sprintDayIndex,
  checklistsForPlan,
  buildAdaptiveSprintDays,
} from '../utils/sprintEngine';

type Exam = 'FMGE' | 'NEET-PG' | 'INI-CET';
type BankQuestion = { id: string; exam: Exam; year: number | null; subjectId: string; subjectName: string; topicName: string; stem: string; options: Array<{key: string; text: string}>; imageUrl: string | null; imageUrls: string[]; source: string; sourcePage: number; isImageBased: boolean };
type Facets = { exams: Exam[]; subjects: Array<{id: string; name: string; count: number}>; years: number[]; count: number; imageCount: number };
type Review = { correct: boolean; correctAnswer: string; explanation: string; sourceExplanationAvailable?: boolean; source: string; sourcePage: number; answerReceipt: string };
type TutorReview = { learnerChoiceInsight: string; decisionRule: string; retrievalQuestion: string; retrievalAnswer: string; optionAnalysis: Array<{key: string; verdict: string; reason: string}>; examTrap: string; memoryAid: string; clinicalPearl: string; aiGenerated: boolean };

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not reach the question bank.');
  return data;
}

type SubjectTone = { from: string; to: string; ink: string; soft: string; icon: React.ComponentType<{ className?: string }> };
// Assorted Apple-system hues per subject: gradient pair, readable ink and a soft tint.
const SUBJECT_TONES: Record<string, SubjectTone> = {
  anatomy: { from: '#FF9F0A', to: '#FF6A3D', ink: '#B4530A', soft: 'rgba(255,159,10,.12)', icon: Bone },
  physiology: { from: '#32ADE6', to: '#0A84FF', ink: '#0B6BB5', soft: 'rgba(50,173,230,.12)', icon: Activity },
  biochemistry: { from: '#FFC400', to: '#FF9F0A', ink: '#9A6A00', soft: 'rgba(255,196,0,.15)', icon: Dna },
  pathology: { from: '#FF6482', to: '#E8336B', ink: '#B4234F', soft: 'rgba(255,100,130,.12)', icon: Microscope },
  microbiology: { from: '#30D158', to: '#00A88F', ink: '#137A45', soft: 'rgba(48,209,88,.12)', icon: Bug },
  pharmacology: { from: '#BF5AF2', to: '#8E44E8', ink: '#7B32B8', soft: 'rgba(191,90,242,.12)', icon: Pill },
  fmt: { from: '#8E8E93', to: '#5A5F6B', ink: '#4A4F5A', soft: 'rgba(142,142,147,.14)', icon: Scale },
  medicine: { from: '#FF453A', to: '#FF2D55', ink: '#C0262D', soft: 'rgba(255,69,58,.11)', icon: HeartPulse },
  psychiatry: { from: '#AF52DE', to: '#5E5CE6', ink: '#6B3FB0', soft: 'rgba(175,82,222,.12)', icon: Brain },
  dermatology: { from: '#FFB26B', to: '#FF7A59', ink: '#B35A2E', soft: 'rgba(255,178,107,.16)', icon: Fingerprint },
  surgery: { from: '#FF6B4A', to: '#E5383B', ink: '#B4302A', soft: 'rgba(255,107,74,.12)', icon: Scissors },
  anesthesia: { from: '#64D2FF', to: '#32ADE6', ink: '#0D7FA8', soft: 'rgba(100,210,255,.14)', icon: Syringe },
  orthopedics: { from: '#A2845E', to: '#7D6447', ink: '#6B5236', soft: 'rgba(162,132,94,.14)', icon: Bone },
  radiology: { from: '#5E5CE6', to: '#0A84FF', ink: '#3F3DC2', soft: 'rgba(94,92,230,.12)', icon: ScanLine },
  pediatrics: { from: '#FFCC00', to: '#FF9500', ink: '#A36200', soft: 'rgba(255,204,0,.15)', icon: Baby },
  ophthalmology: { from: '#0A84FF', to: '#30B0C7', ink: '#0A63C2', soft: 'rgba(10,132,255,.11)', icon: Eye },
  ent: { from: '#66D4CF', to: '#30B0C7', ink: '#0E7C80', soft: 'rgba(102,212,207,.15)', icon: Ear },
  obg: { from: '#FF2D92', to: '#BF5AF2', ink: '#B01F74', soft: 'rgba(255,45,146,.11)', icon: Flower2 },
  psm: { from: '#34C759', to: '#30B0C7', ink: '#1B7F44', soft: 'rgba(52,199,89,.12)', icon: Users },
};
const DEFAULT_TONE: SubjectTone = { from: '#0A84FF', to: '#5E5CE6', ink: '#1769E0', soft: 'rgba(10,132,255,.11)', icon: Stethoscope };
const toneFor = (id: string) => SUBJECT_TONES[id] || DEFAULT_TONE;
// SwiftUI-like springs: SPRING for snappy selections, SOFT_SPRING for entrances.
const SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };
const SOFT_SPRING = { type: 'spring' as const, stiffness: 260, damping: 26 };

export const QuestionBankView: React.FC<{
  onRecordAttempt: (attempt: NewMcqAttemptInput) => unknown;
  sprint?: AppState['fmgeSprint'];
  attempts?: McqAttempt[];
  grandTests?: GrandTest[];
  onUpdateSprint: (sprint: NonNullable<AppState['fmgeSprint']>) => void;
  onOpenGrandTests: () => void;
  onOpenSprintSubject: (subjectId: string) => void;
  initialSubjectFocus?: string;
}> = ({ onRecordAttempt, sprint, attempts = [], grandTests = [], onUpdateSprint, onOpenGrandTests, onOpenSprintSubject, initialSubjectFocus }) => {
  const reducedMotion = useReducedMotion();
  const [exam, setExam] = useState<Exam>('FMGE');
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState('');
  const [imageMode, setImageMode] = useState<'all'|'image'|'standard'>('all');
  const [count, setCount] = useState(10);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [sessionLabel, setSessionLabel] = useState('Practice set');
  const [reviewClock, setReviewClock] = useState(() => Date.now());

  useEffect(() => {
    if (initialSubjectFocus) {
      setExam('FMGE');
      setSubjectId(initialSubjectFocus);
      setYear('');
      setImageMode('all');
    }
  }, [initialSubjectFocus]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    apiFetch(`/api/question-bank/facets?exam=${encodeURIComponent(exam)}`)
      .then(responseJson)
      .then((data) => { if (active) { setFacets(data); if (subjectId && !data.subjects.some((item: any) => item.id === subjectId)) setSubjectId(''); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [exam]);

  useEffect(() => {
    const interval = window.setInterval(() => setReviewClock(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedSubject = useMemo(() => facets?.subjects.find((item) => item.id === subjectId), [facets, subjectId]);
  const startSession = async (override?: { exam: Exam; subjectId: string; year?: string; imageMode: 'all'|'image'|'standard'; count: number; questionIds?: string[]; excludeQuestionIds?: string[]; label?: string; taskKey?: string }) => {
    setLoading(true); setError('');
    try {
      const { label, taskKey, ...filters } = override || { exam, subjectId, year: year || null, imageMode, count };
      const data = await responseJson(await apiFetch('/api/question-bank/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filters) }));
      setSessionLabel(label || 'Practice set');
      if (taskKey && sprint) {
        const questionIds = data.questions.map((question: BankQuestion) => question.id);
        const previousIds = sprint.taskQuestionIds?.[taskKey] || [];
        const isResumingSameSet = previousIds.length === questionIds.length && previousIds.every((id, index) => id === questionIds[index]);
        const startedAt = isResumingSameSet ? sprint.taskQuestionStartedAt?.[taskKey] || new Date().toISOString() : new Date().toISOString();
        onUpdateSprint({
          ...sprint,
          taskQuestionIds: { ...(sprint.taskQuestionIds || {}), [taskKey]: questionIds },
          taskQuestionStartedAt: { ...(sprint.taskQuestionStartedAt || {}), [taskKey]: startedAt },
        });
      }
      setQuestions(data.questions); setSessionId(data.sessionId);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const reviewQueue = useMemo(() => buildDueReviewQueue(attempts), [attempts]);
  const dueReviewQueue = reviewQueue.filter((item) => item.dueAt <= reviewClock);

  const examTones: Record<Exam, { from: string; to: string }> = { 'FMGE': { from: '#0A84FF', to: '#5E5CE6' }, 'NEET-PG': { from: '#BF5AF2', to: '#FF2D92' }, 'INI-CET': { from: '#30B0C7', to: '#34C759' } };
  const summaryTone = selectedSubject ? toneFor(selectedSubject.id) : { ...DEFAULT_TONE, ...examTones[exam] };
  const SummaryIcon = selectedSubject ? summaryTone.icon : Layers;
  const rise = (delay = 0) => ({ initial: reducedMotion ? false as const : { opacity: 0, y: 16, scale: 0.985 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: reducedMotion ? { duration: 0 } : { ...SOFT_SPRING, delay } });
  const styleOptions = [{ value: 'all', label: 'All', icon: BookOpenCheck, from: '#0A84FF', to: '#5E5CE6' }, { value: 'image', label: 'Images', icon: ImageIcon, from: '#BF5AF2', to: '#FF2D92' }, { value: 'standard', label: 'Text', icon: MessageSquareText, from: '#30D158', to: '#00A88F' }] as const;

  return <div data-accent="practice" className="qbank-root qbx space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-150 pb-24 sm:pb-20 lg:pb-16 text-slate-900 dark:text-slate-100">
    {/* Apple HIG Deep Sapphire / Oceanic Blue Hero Header — Matching Revision Matrix & Grand Tests */}
    <motion.header
      {...rise(0)}
      className="premium-page-hero qbx-hero relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] text-white shadow-[0_8px_40px_rgba(0,112,204,0.28),0_2px_8px_rgba(0,0,0,0.12)]"
      style={{
        background: 'linear-gradient(135deg, #0A2540 0%, #1A3A5C 35%, #0E4F8C 70%, #0070CC 100%)',
      }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-2/3"
        style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(0,122,255,0.38) 0%, transparent 65%)',
        }}
      />
      {/* Top inner shine */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* Decorative orbital rings */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 sm:w-56 sm:h-56 rounded-full border border-white/[0.08] pointer-events-none" />
      <div className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 rounded-full border border-white/[0.06] pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-7 lg:p-8 space-y-4">
        {/* Top Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
            <span className="uppercase tracking-[0.14em] text-[10.5px] font-mono font-bold text-white/80">Question Library</span>
            <span className="text-white/30">·</span>
            <span className="text-white/80 font-normal hidden sm:inline">FMGE · NEET-PG · INI-CET</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xs">
              <BookOpenCheck className="w-3.5 h-3.5 text-[#60B3FF]" />
              <span>{facets ? facets.count.toLocaleString() : loading ? '…' : '—'} Questions</span>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 backdrop-blur-md border border-purple-400/30 text-purple-200 shadow-xs">
              <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
              <span>{facets ? facets.imageCount.toLocaleString() : loading ? '…' : '—'} Images</span>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-200 shadow-xs">
              <Clock3 className="w-3.5 h-3.5 text-amber-300" />
              <span>{dueReviewQueue.length} Due Recall</span>
            </div>
          </div>
        </div>

        {/* Main Row: Title & Subtitle + Right Stat Widgets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
          <div className="space-y-3 min-w-0 max-w-xl">
            <h1 className="text-[34px] sm:text-[46px] font-black tracking-[-0.04em] leading-[0.92] text-white">
              Practice.<br />
              <span style={{ color: '#60B3FF' }}>Test. Clinical Mastery.</span>
            </h1>
            <p className="text-[13px] sm:text-[14px] text-white/70 leading-snug max-w-lg">
              Authentic board question archive with step-by-step diagnostic reasoning, option breakdown analysis, and automated spaced repetition queues.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:min-w-[420px]">
            <Stat label="Total Questions" value={facets ? facets.count.toLocaleString() : loading ? '…' : '—'} icon={<BookOpenCheck/>} from="#0A84FF" to="#5E5CE6" delay={0.12} reduceMotion={reducedMotion}/>
            <Stat label="Image Cases" value={facets ? facets.imageCount.toLocaleString() : loading ? '…' : '—'} icon={<ImageIcon/>} from="#BF5AF2" to="#FF2D92" delay={0.18} reduceMotion={reducedMotion}/>
            <Stat label="Due Today" value={String(dueReviewQueue.length)} icon={<Clock3/>} from="#FF9F0A" to="#FF453A" delay={0.24} reduceMotion={reducedMotion}/>
          </div>
        </div>
      </div>
    </motion.header>

    {/* Session builder */}
    <motion.section {...rise(0.08)} className="qbank-builder qbank-panel qbx-panel overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#181B26] shadow-sm">
      <div className="qbx-panel-head flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex items-center gap-3">
          <GradientIcon from={examTones[exam].from} to={examTones[exam].to}><Layers/></GradientIcon>
          <div>
            <p className="qbx-kicker">Targeted Session</p>
            <h2 className="qbx-h2 mt-0.5">Build your question set</h2>
            <p className="qbx-muted mt-0.5 text-xs sm:text-sm">Shape a session around high-yield subjects and tested formats.</p>
          </div>
        </div>
        <div className="qbx-segment relative inline-flex w-full rounded-full p-1 sm:w-auto" role="group" aria-label="Choose exam">
          {(['FMGE', 'NEET-PG', 'INI-CET'] as Exam[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={exam === value}
              onClick={() => { setExam(value); setYear(''); }}
              className={`relative min-h-9 flex-1 rounded-full px-3.5 text-xs font-bold transition-all sm:flex-none ${exam === value ? 'text-white' : 'qbx-segment-idle'}`}
            >
              {exam === value && (
                <motion.span
                  layoutId="qbx-exam-pill"
                  transition={reducedMotion ? { duration: 0 } : SPRING}
                  className="absolute inset-0 rounded-full shadow-[0_4px_12px_rgba(0,122,255,0.28)]"
                  style={{ background: `linear-gradient(120deg, ${examTones[value].from}, ${examTones[value].to})` }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">{value}{exam === value && <Check className="h-3.5 w-3.5"/>}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0 space-y-6 p-5 sm:p-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="qbx-label"><i className="qbx-step">01</i>Subject focus</p>
              {subjectId && <button type="button" onClick={() => setSubjectId('')} className="qbx-link text-xs font-bold text-[#007AFF] hover:underline">Clear filter</button>}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              <SubjectChip id="" name="All subjects" count={facets?.count} active={!subjectId} onSelect={() => setSubjectId('')} reduceMotion={reducedMotion} index={0}/>
              {facets?.subjects.map((item, i) => (
                <SubjectChip key={item.id} id={item.id} name={item.name} count={item.count} active={subjectId === item.id} onSelect={() => setSubjectId(item.id)} reduceMotion={reducedMotion} index={i + 1}/>
              ))}
              {!facets && loading && Array.from({ length: 7 }).map((_, i) => <div key={i} className="qbx-skeleton h-[58px] rounded-2xl"/>)}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <SelectField label="Exam year" step="02">
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Any year</option>
                {facets?.years.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </SelectField>
            <fieldset>
              <legend className="qbx-label mb-2"><i className="qbx-step">03</i>Question style</legend>
              <div className="qbx-segment relative grid grid-cols-3 gap-1 rounded-full p-1">
                {styleOptions.map(({ value, label, icon: Icon, from, to }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={imageMode === value}
                    onClick={() => setImageMode(value)}
                    className={`relative inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold transition-colors ${imageMode === value ? 'text-white' : 'qbx-segment-idle'}`}
                  >
                    {imageMode === value && (
                      <motion.span
                        layoutId="qbx-style-pill"
                        transition={reducedMotion ? { duration: 0 } : SPRING}
                        className="absolute inset-0 rounded-full shadow-[0_4px_12px_rgba(94,92,230,0.25)]"
                        style={{ background: `linear-gradient(120deg, ${from}, ${to})` }}
                      />
                    )}
                    <Icon className="relative z-10 h-3.5 w-3.5"/>
                    <span className="relative z-10">{label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <fieldset>
            <legend className="qbx-label mb-2"><i className="qbx-step">04</i>Number of questions</legend>
            <div className="qbx-segment relative grid grid-cols-4 gap-1 rounded-full p-1">
              {[5, 10, 20, 50].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={count === value}
                  onClick={() => setCount(value)}
                  className={`relative min-h-9 rounded-full text-xs font-bold tabular-nums transition-colors ${count === value ? 'text-white' : 'qbx-segment-idle'}`}>
                  {count === value && (
                    <motion.span
                      layoutId="qbx-count-pill"
                      transition={reducedMotion ? { duration: 0 } : SPRING}
                      className="absolute inset-0 rounded-full shadow-[0_4px_12px_rgba(255,100,40,0.28)]"
                      style={{ background: 'linear-gradient(120deg, #FF9F0A, #FF453A)' }}
                    />
                  )}
                  <span className="relative z-10">{value}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <aside className="qbx-summary relative isolate flex flex-col justify-between overflow-hidden p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-white/10 bg-slate-900 text-white" style={{ background: `radial-gradient(120% 80% at 100% 0%, ${summaryTone.from}66, transparent 60%), radial-gradient(90% 70% at 0% 100%, ${summaryTone.to}55, transparent 62%), linear-gradient(160deg, #121829, #1C1936)` }}>
          <div aria-hidden="true" className="qbx-summary-dots pointer-events-none absolute inset-0 -z-10"/>
          <div>
            <motion.div key={selectedSubject?.id || `all-${exam}`} initial={reducedMotion ? false : { scale: 0.6, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={reducedMotion ? { duration: 0 } : SPRING} className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/25" style={{ background: `linear-gradient(140deg, ${summaryTone.from}, ${summaryTone.to})` }}><SummaryIcon className="h-5 w-5"/></motion.div>
            <p className="qbx-summary-kicker mt-4 text-[10px] font-bold uppercase tracking-[0.16em]">Ready when you are</p>
            <h3 className="qbx-summary-title mt-1 text-lg font-semibold tracking-tight">{selectedSubject ? selectedSubject.name : 'All subjects'}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">{[exam, year || 'Any year', imageMode === 'all' ? 'All styles' : imageMode === 'image' ? 'Image cases' : 'Text only', `${count} questions`].map((tag) => <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur">{tag}</span>)}</div>
            <p className="qbx-summary-body mt-4 text-xs leading-5">Answers stay hidden until you submit. Results feed performance tracking, with an optional Gemini review.</p>
          </div>
          <div className="mt-6">
            <motion.button type="button" onClick={() => startSession()} disabled={loading || !facets?.count} whileHover={reducedMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }} transition={SPRING} className="qbx-cta group relative inline-flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"><span aria-hidden="true" className="qbx-cta-shine"/>{loading ? <><LoaderCircle className="relative h-4 w-4 animate-spin"/><span className="relative">Preparing set…</span></> : <><Zap className="relative h-4 w-4 text-[#FF9F0A]"/><span className="relative">Start practice</span><ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5"/></>}</motion.button>
            {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/40 bg-rose-500/15 px-3 py-2 text-xs leading-5 text-rose-100">{error}</p>}
          </div>
        </aside>
      </div>
      <div className="qbx-feature-strip grid grid-cols-1 sm:grid-cols-3">
        <FeatureNote icon={<ImageIcon/>} title="Figures in context" body="Image questions stay with their source material." from="#BF5AF2" to="#FF2D92"/>
        <FeatureNote icon={<BookOpenCheck/>} title="Clear explanations" body="Readable rationale with the answer and source." from="#0A84FF" to="#5E5CE6"/>
        <FeatureNote icon={<Activity/>} title="Progress recorded" body="Attempts feed your subject performance." from="#30D158" to="#00A88F"/>
      </div>
    </motion.section>

    <DailyReviewQueue items={reviewQueue} dueItems={dueReviewQueue} now={reviewClock} loading={loading} onStart={() => startSession({ exam: 'FMGE', subjectId: '', year: '', imageMode: 'all', count: Math.min(20, dueReviewQueue.length), questionIds: dueReviewQueue.slice(0, 20).map((item) => item.questionId), label: 'Daily review' })}/>
    <FmgeSprint sprint={sprint} attempts={attempts} grandTests={grandTests} onUpdate={onUpdateSprint} onPractice={(subjectId, count = 20, label = 'Focused practice', questionIds, taskKey, excludeQuestionIds) => startSession({ exam: 'FMGE', subjectId, year: '', imageMode: 'all', count, questionIds, excludeQuestionIds, label, taskKey })} onOpenSubject={onOpenSprintSubject} onOpenGrandTests={onOpenGrandTests} loading={loading} />
    <QuestionSession key={sessionId} questions={questions} sessionId={sessionId} sessionLabel={sessionLabel} onClose={() => setQuestions([])} onRecordAttempt={onRecordAttempt}/>
  </div>;
};



function FmgeSprint({ sprint, attempts, grandTests, onUpdate, onPractice, onOpenSubject, onOpenGrandTests, loading }: { sprint?: AppState['fmgeSprint']; attempts: McqAttempt[]; grandTests: GrandTest[]; onUpdate: (value: NonNullable<AppState['fmgeSprint']>) => void; onPractice: (subjectId: string, count?: number, label?: string, questionIds?: string[], taskKey?: string, excludeQuestionIds?: string[]) => void; onOpenSubject: (subjectId: string) => void; onOpenGrandTests: () => void; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hours, setHours] = useState(sprint?.dailyHours || 6);
  const [confirmReset, setConfirmReset] = useState(false);
  const currentDay = sprint ? sprintDayIndex(sprint.startedOn) : 0;
  const activeDay = selectedDay ?? currentDay;
  const sprintDays = useMemo(() => buildAdaptiveSprintDays(attempts, grandTests, sprint?.errorTypes || {}), [attempts, grandTests, sprint?.errorTypes]);
  const plan = sprintDays[activeDay];
  const qbankAttempts = attempts.filter((attempt) => attempt.source === 'qbank' && !['NEET-PG', 'INI-CET'].includes(attempt.exam || ''));
  const recentQbankAttempts = qbankAttempts.slice(-100);
  const qbankAccuracy = recentQbankAttempts.length
    ? Math.round(recentQbankAttempts.filter((attempt) => attempt.isCorrect).length / recentQbankAttempts.length * 100)
    : null;
  const recentReviewGaps = recentQbankAttempts.filter((attempt) => !attempt.isCorrect || attempt.confidence === 'guess' || attempt.confidence === 'low').length;
  const secureCorrectCount = recentQbankAttempts.filter((attempt) => attempt.isCorrect && ['high', 'certain'].includes(attempt.confidence || '')).length;
  const unsureCorrectCount = recentQbankAttempts.filter((attempt) => attempt.isCorrect && ['guess', 'low', 'medium'].includes(attempt.confidence || '')).length;
  const confidentMissCount = recentQbankAttempts.filter((attempt) => !attempt.isCorrect && ['high', 'certain'].includes(attempt.confidence || '')).length;
  const latestGrandTest = [...grandTests].sort((a, b) => b.date.localeCompare(a.date))[0];
  const questionTarget = plan.fullMock ? 300 : activeDay === 0 ? 50 : Math.max(20, Math.round(plan.questions * hours / 6));
  const todayTasks = checklistsForPlan(plan, hours, questionTarget);
  const activePlanDate = sprintDateForIndex(activeDay);
  const todayQuestionAttempts = attempts.filter((attempt) => attempt.source === 'qbank' && !['NEET-PG', 'INI-CET'].includes(attempt.exam || '') && attempt.timestamp && localDateKey(new Date(attempt.timestamp)) === activePlanDate && (!plan.subjects.length || plan.subjects.includes(attempt.subjectId)));
  const todayQuestionIds = new Set(todayQuestionAttempts.map((attempt) => attempt.questionId).filter(Boolean));
  const latestByQuestion = new Map<string, McqAttempt>();
  attempts.filter((attempt) => attempt.source === 'qbank' && attempt.questionId && !['NEET-PG', 'INI-CET'].includes(attempt.exam || '') && (!plan.subjects.length || plan.subjects.includes(attempt.subjectId)))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .forEach((attempt) => latestByQuestion.set(attempt.questionId, attempt));
  const errorQuestionIds = [...latestByQuestion.values()]
    .filter((attempt) => !attempt.isCorrect || ['guess', 'low', 'medium'].includes(attempt.confidence || ''))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-20).map((attempt) => attempt.questionId).filter(Boolean);
  const taskSessionKey = (task: number, day = activeDay) => `${day}-${task}`;
  const taskQuestionIds = (task: number, day = activeDay) => sprint?.taskQuestionIds?.[taskSessionKey(task, day)] || [];
  const reviewedTaskComplete = (task: number) => {
    const ids = taskQuestionIds(task);
    const startedAt = sprint?.taskQuestionStartedAt?.[taskSessionKey(task)];
    return ids.length > 0 && !!startedAt && ids.every((id) => todayQuestionAttempts.some((attempt) => attempt.questionId === id && Date.parse(attempt.timestamp) >= Date.parse(startedAt)));
  };
  const practiceTaskComplete = plan.fullMock
    ? grandTests.some((test) => test.date.startsWith(activePlanDate))
    : new Set(todayQuestionAttempts.map((attempt) => attempt.questionId).filter(Boolean)).size >= questionTarget;
  const errorReviewComplete = errorQuestionIds.length === 0
    ? qbankAttempts.length > 0
    : reviewedTaskComplete(3);
  const activeTaskStates = todayTasks.map((_, task) => task === 0
    ? !!sprint?.completedTasks[`${activeDay}-${task}`]
    : task === 1 ? reviewedTaskComplete(1)
      : task === 2 ? practiceTaskComplete
        : errorReviewComplete);
  const remainingQuestionCount = Math.max(0, questionTarget - new Set(todayQuestionAttempts.map((attempt) => attempt.questionId).filter(Boolean)).size);
  const nextTaskIndex = activeTaskStates.findIndex((done) => !done);
  const todayComplete = nextTaskIndex === -1;
  const isTaskCompleteForDay = (dayIndex: number, task: number, dayAttempts: McqAttempt[]) => {
    if (task === 0) return !!sprint?.completedTasks[`${dayIndex}-0`];
    const ids = sprint?.taskQuestionIds?.[`${dayIndex}-${task}`] || [];
    const startedAt = sprint?.taskQuestionStartedAt?.[`${dayIndex}-${task}`];
    if (ids.length && startedAt && ids.every((id) => dayAttempts.some((attempt) => attempt.questionId === id && Date.parse(attempt.timestamp) >= Date.parse(startedAt)))) return true;
    if (task === 3 && dayAttempts.length && !dayAttempts.some((attempt) => !attempt.isCorrect || ['guess', 'low', 'medium'].includes(attempt.confidence || ''))) return true;
    return !!sprint?.completedTasks[`${dayIndex}-${task}`];
  };
  const isDayComplete = (dayIndex: number) => {
    const dayPlan = sprintDays[dayIndex];
    const dayDate = sprintDateForIndex(dayIndex);
    const dayTarget = dayPlan.fullMock ? 300 : dayIndex === 0 ? 50 : Math.max(20, Math.round(dayPlan.questions * hours / 6));
    const dayAttempts = attempts.filter((attempt) => attempt.source === 'qbank' && !['NEET-PG', 'INI-CET'].includes(attempt.exam || '') && attempt.timestamp && localDateKey(new Date(attempt.timestamp)) === dayDate && (!dayPlan.subjects.length || dayPlan.subjects.includes(attempt.subjectId)));
    const questionsDone = new Set(dayAttempts.map((attempt) => attempt.questionId).filter(Boolean)).size >= dayTarget;
    const mockLogged = grandTests.some((test) => test.date.startsWith(dayDate));
    const practiceDone = dayPlan.fullMock ? mockLogged : questionsDone || (dayPlan.checkpoint && mockLogged);
    return isTaskCompleteForDay(dayIndex, 0, dayAttempts) && isTaskCompleteForDay(dayIndex, 1, dayAttempts) && isTaskCompleteForDay(dayIndex, 3, dayAttempts) && practiceDone;
  };
  const totalDone = sprintDays.reduce((sum, _, dayIndex) => {
    const dayDate = sprintDateForIndex(dayIndex);
    const dayAttempts = attempts.filter((attempt) => attempt.source === 'qbank' && !['NEET-PG', 'INI-CET'].includes(attempt.exam || '') && attempt.timestamp && localDateKey(new Date(attempt.timestamp)) === dayDate && (!sprintDays[dayIndex].subjects.length || sprintDays[dayIndex].subjects.includes(attempt.subjectId)));
    return sum + [0, 1, 3].filter((task) => isTaskCompleteForDay(dayIndex, task, dayAttempts)).length + (isDayComplete(dayIndex) ? 1 : 0);
  }, 0);
  const totalTasks = SPRINT_DAYS.length * 4;
  const start = () => { onUpdate({ startedOn: localDateKey(), dailyHours: hours, completedTasks: {}, taskQuestionIds: {}, ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}) }); setSelectedDay(0); };
  const toggleTask = (taskIndex: number) => {
    if (!sprint) return;
    const key = `${activeDay}-${taskIndex}`;
    onUpdate({ ...sprint, completedTasks: { ...sprint.completedTasks, [key]: !sprint.completedTasks[key] } });
  };
  const setErrorType = (questionId: string, errorType: SprintErrorType) => {
    if (!sprint) return;
    onUpdate({ ...sprint, errorTypes: { ...(sprint.errorTypes || {}), [questionId]: errorType } });
  };
  const reset = () => { if (confirmReset) { onUpdate({ startedOn: localDateKey(), dailyHours: hours, completedTasks: {}, taskQuestionIds: {}, ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}) }); setSelectedDay(0); setConfirmReset(false); } else setConfirmReset(true); };
  const checklists = todayTasks;

  const sprintPct = Math.round(totalDone / totalTasks * 100);
  return <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT_SPRING, delay: 0.16 }} className="qbank-sprint qbank-panel qbx-panel mt-5 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#181B26] shadow-sm">
    <div className="qbank-sprint-head qbx-sprint-head relative isolate flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10"><span className="absolute -left-12 -top-20 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl"/><span className="absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-orange-300/25 blur-3xl"/></div>
      <div className="flex items-start gap-3"><GradientIcon from="#FF9F0A" to="#FF453A"><CalendarDays/></GradientIcon><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">20-day FMGE sprint</h2><span className="qbx-tag qbx-tag-orange">Focused plan</span></div><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">A structured last-mile plan: revise, retrieve, practise, then repair mistakes.</p></div></div>
      <div className="flex items-center gap-3 sm:shrink-0">
        {sprint && <ProgressRing value={sprintPct} display={`${sprintPct}%`} label="plan" from="#FF9F0A" to="#FF2D55" id="qbx-sprint-ring"/>}
        <motion.button type="button" onClick={() => setExpanded((v) => !v)} whileTap={{ scale: 0.97 }} transition={SPRING} aria-expanded={expanded} className="qbx-ghost-btn inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">{expanded ? 'Close plan' : sprint ? 'Open plan' : 'View plan'}<motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={SPRING} className="inline-flex"><ChevronDown className="h-4 w-4"/></motion.span></motion.button>
      </div>
    </div>
    {expanded && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={SOFT_SPRING} className="qbx-divider p-4 sm:p-6">
      <BlueprintReference />
      {!sprint ? <div className="mx-auto max-w-3xl py-3"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"><Target className="h-6 w-6"/></div><h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Build a plan around your actual gaps</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">The plan uses your recent question attempts and latest mock to move revision time toward weak, high-weight subjects. If you have no history yet, take a short baseline first.</p></div><div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#FBFCFE] dark:bg-[#151926] p-4 text-left"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Starting point</p>{latestGrandTest ? <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Latest mock: {latestGrandTest.score}/300 <span className={latestGrandTest.score >= 150 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>· {latestGrandTest.score >= 150 ? 'above pass mark' : `${150 - latestGrandTest.score} below pass mark`}</span></p> : <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{qbankAccuracy === null ? 'No baseline recorded yet' : `${qbankAccuracy}% across ${recentQbankAttempts.length} recent questions`}</p>}<p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Question accuracy guides subject focus; it is not a predicted exam score.</p>{!latestGrandTest && <button type="button" disabled={loading} onClick={() => onPractice('', 50)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 disabled:opacity-60"><BookOpenCheck className="h-4 w-4"/>Take 50-question baseline</button>}</div><div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#FBFCFE] dark:bg-[#151926] p-4 text-left"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Score target</p><p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">150/300 to pass · 165 working target</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">The extra 15 marks are a study buffer, not a guarantee. Choose a daily load you can sustain.</p><label className="mt-3 block"><span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Focused study time per day</span><select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E2332] px-3 text-sm font-medium text-slate-800 dark:text-slate-200"><option value={3}>3 hours · compact</option><option value={5}>5 hours · steady</option><option value={6}>6 hours · balanced</option><option value={9}>9 hours · intensive</option><option value={12}>12 hours · full-time</option></select></label></div></div><div className="mt-4 flex justify-center"><button type="button" onClick={start} className="qbx-btn qbx-btn-blue h-11 rounded-xl px-5 text-sm">Start my 20-day plan<ChevronRight className="h-4 w-4"/></button></div></div> : <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-slate-500 dark:text-slate-400">{daysUntilFmge() === 0 ? 'Exam day · final review plan' : `Day ${currentDay + 1} of 20 · ${daysUntilFmge()} days until FMGE`} · {sprint.dailyHours} focused study hours/day · started {sprint.startedOn}</p><p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-400">Working toward 165/300 · pass mark 150</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Priorities use recent subject accuracy, guessed answers and your latest mock weaknesses. Blueprint marks follow the published distribution; priorities also use recent accuracy, confidence, tagged errors and mock weaknesses.</p></div><button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-400"><RotateCcw className="h-3.5 w-3.5"/>{confirmReset ? 'Tap again to restart' : 'Restart plan'}</button></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Sprint day selector">{sprintDays.map((day, i) => { const done = isDayComplete(i); return <button key={i} type="button" onClick={() => setSelectedDay(i)} aria-current={activeDay === i ? 'step' : undefined} className={`flex h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition ${activeDay === i ? 'qbx-day-active border-transparent text-white' : done ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1D2232] text-slate-600 dark:text-slate-300 hover:border-blue-300'}`}>{done ? <Check className="h-3.5 w-3.5"/> : <span>{i + 1}</span>}</button>; })}</div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#FBFCFE] dark:bg-[#151926] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700 dark:text-blue-400">Day {activeDay + 1}</p><h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{plan.title}</h3><BlueprintPills subjectIds={plan.subjects}/></div><span className="rounded-full bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-white/10">{questionTarget} Q target</span></div><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.focus}</p><div className="mt-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/30 p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-400">{todayComplete ? 'Today’s plan complete' : 'Your next step'}</p><p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{todayComplete ? 'Keep the review light and protect your sleep.' : checklists[nextTaskIndex]}</p></div><span className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-400">{activeTaskStates.filter(Boolean).length}/4</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] via-[#5E5CE6] to-[#BF5AF2] transition-all" style={{width:`${activeTaskStates.filter(Boolean).length/4*100}%`}}/></div></div><div className="mt-3 space-y-2">{checklists.map((item, task) => {
            const done = activeTaskStates[task];
            const taskKey = taskSessionKey(task);
            const savedIds = taskQuestionIds(task);
            const recallCount = Math.min(10, Math.max(1, questionTarget));
            const taskAction = task === 0
              ? () => onOpenSubject(plan.subjects[0] || 'medicine')
              : task === 1
                ? () => onPractice(plan.subjects[0] || '', recallCount, 'Active recall', savedIds.length ? savedIds : undefined, taskKey)
                : task === 2
                  ? () => plan.fullMock ? onOpenGrandTests() : onPractice(plan.subjects[0] || '', Math.min(50, remainingQuestionCount), 'Question practice', undefined, undefined, [...todayQuestionIds])
                  : () => onPractice(plan.subjects[0] || '', savedIds.length ? savedIds.length : errorQuestionIds.length, 'Error review', savedIds.length ? savedIds : errorQuestionIds, taskKey);
            const actionLabel = task === 0 ? 'Open Rapid Revision'
              : task === 1 ? (done ? 'Recall complete' : savedIds.length ? 'Continue recall' : `Start ${recallCount}-question recall`)
                : task === 2 ? (plan.fullMock ? 'Open mock tracker' : remainingQuestionCount ? `Practice next ${Math.min(50, remainingQuestionCount)}` : 'Daily target complete')
                  : done ? 'Review complete' : errorQuestionIds.length ? `Review ${savedIds.length || errorQuestionIds.length} flagged questions` : 'No flagged errors';
            const disabled = loading || (task === 1 && done) || (task === 2 && !plan.fullMock && !remainingQuestionCount) || (task === 3 && (done || !errorQuestionIds.length));
            return <div key={task} className={`rounded-xl border p-3 transition ${done ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30' : task === nextTaskIndex ? 'border-blue-200 dark:border-blue-500/40 bg-white dark:bg-[#1A1F2E] shadow-sm' : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A1F2E]'}`}>
              <div className="flex items-start gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/10'}`}>{done && <Check className="h-3.5 w-3.5"/>}</span><div className="min-w-0 flex-1"><p className={`text-xs leading-5 ${done ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>{task === 2 && !plan.fullMock ? `${item} · ${new Set(todayQuestionAttempts.map((attempt) => attempt.questionId).filter(Boolean)).size}/${questionTarget} unique questions today` : item}</p><p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{task === 0 ? 'Open Rapid Revision. Recent Question Bank misses and unsure answers surface the matching study decks; mark this block complete after revising.' : task === 1 ? 'A short retrieval set. Your answers are saved and this block checks off when you finish that set.' : task === 2 ? 'Question practice is counted from unique questions answered today; the button only starts the remaining target.' : errorQuestionIds.length ? 'Reattempt your recent wrong or uncertain questions. This checks off after all selected errors are answered.' : 'No wrong or uncertain questions are waiting in this subject yet.'}</p></div></div>
              <div className="mt-2 flex justify-end gap-2">{task === 0 && <button type="button" onClick={() => toggleTask(0)} aria-pressed={done} className="min-h-8 rounded-lg border border-slate-200 dark:border-white/10 px-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10">{done ? 'Undo completion' : 'Mark revised'}</button>}<button type="button" disabled={disabled} onClick={taskAction} className="qbx-btn qbx-btn-blue min-h-8 rounded-lg px-3 text-[11px]">{actionLabel}</button></div>
            </div>;
          })}</div>{plan.fullMock && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onOpenGrandTests} className="qbx-btn qbx-btn-blue min-h-11 w-full rounded-xl px-4 text-sm sm:w-auto"><Target className="h-4 w-4"/>Open full mock tracker<ChevronRight className="h-4 w-4"/></button></div>}</div>
          <aside className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#151926] p-4"><h4 className="text-sm font-semibold text-slate-900 dark:text-white">Readiness check</h4>{latestGrandTest?<><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{latestGrandTest.score}<span className="text-sm font-medium text-slate-500 dark:text-slate-400"> / 300</span></p><p className={`text-xs font-semibold ${latestGrandTest.score>=165?'text-emerald-700 dark:text-emerald-400':latestGrandTest.score>=150?'text-amber-700 dark:text-amber-400':'text-rose-700 dark:text-rose-400'}`}>{latestGrandTest.score>=165?'Above your 165 working target':latestGrandTest.score>=150?'At pass mark; build a safety buffer':`${150-latestGrandTest.score} marks below pass mark`}</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Latest logged mock · exam score is the clearest readiness signal.</p><MockScoreTrend grandTests={grandTests}/></>:<p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">No full mock score logged yet. Your question practice will identify subject gaps, but it cannot predict a 300-mark exam result.</p>}{qbankAccuracy!==null&&<div className="mt-3 flex items-center justify-between border-t border-slate-200/70 dark:border-white/10 pt-3 text-[11px]"><span className="text-slate-500 dark:text-slate-400">Recent question accuracy</span><b className="text-slate-800 dark:text-slate-200">{qbankAccuracy}%</b></div>}{recentQbankAttempts.length>0&&<div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-200/70 dark:border-white/10 pt-3"><SignalMetric label="Secure correct" value={secureCorrectCount}/><SignalMetric label="Right but unsure" value={unsureCorrectCount}/><SignalMetric label="Confident miss" value={confidentMissCount}/></div>}{recentReviewGaps>0&&<p className="mt-2 text-[11px] leading-5 text-amber-800 dark:text-amber-400">{recentReviewGaps} recent misses or unsure answers are feeding your revision priorities.</p>}<SprintErrorReview attempts={recentQbankAttempts} errorTypes={sprint.errorTypes || {}} onSetErrorType={setErrorType}/><h4 className="mt-4 border-t border-slate-200/70 dark:border-white/10 pt-3 text-sm font-semibold text-slate-900 dark:text-white">How to use the day</h4><ol className="mt-3 space-y-3 text-xs leading-5 text-slate-600 dark:text-slate-300"><li><b className="text-slate-900 dark:text-white">1. Recall first.</b> Try to retrieve before rereading.</li><li><b className="text-slate-900 dark:text-white">2. Practise timed.</b> Review wrong and guessed answers.</li><li><b className="text-slate-900 dark:text-white">3. Keep a tiny error list.</b> Revisit it tomorrow.</li><li><b className="text-slate-900 dark:text-white">4. Protect sleep.</b> Exhaustion makes recall worse.</li></ol><div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-[11px] leading-5 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">If you fall behind, continue with the next day and carry only your highest-impact weak areas forward. Do not try to “repay” missed hours with an all-nighter.</div><p className="mt-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">This plan supports revision; it cannot predict or guarantee an exam result.</p></aside>
        </div>
      </>}
    </motion.div>}
  </motion.section>;
}

function DailyReviewQueue({ items, dueItems, now, loading, onStart }: { items: ReviewQueueItem[]; dueItems: ReviewQueueItem[]; now: number; loading: boolean; onStart: () => void }) {
  const upcoming = items.filter((item) => item.dueAt > now);
  const duePct = items.length ? Math.round(dueItems.length / items.length * 100) : 0;
  return <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT_SPRING, delay: 0.12 }} className="qbank-panel qbx-panel mt-5 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#181B26] shadow-sm">
    <div className="relative isolate flex flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <span aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 -z-10 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl"/>
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-20 -z-10 h-40 w-40 rounded-full bg-pink-400/15 blur-3xl"/>
      <div className="flex items-start gap-3"><GradientIcon from="#BF5AF2" to="#5E5CE6"><Clock3/></GradientIcon><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">Daily review</h2><span className="qbx-tag qbx-tag-violet">Spaced recall</span></div><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Missed or unsure answers return tomorrow. Once recalled confidently, they come back after 3, 7, then 14 days.</p></div></div>
      <div className="flex shrink-0 items-center gap-3"><ProgressRing value={duePct} display={String(dueItems.length)} label="due" from="#BF5AF2" to="#FF2D92" id="qbx-due-ring"/><div className="qbx-mini-stat"><b className="block text-lg leading-5 tabular-nums text-slate-900 dark:text-white">{upcoming.length}</b><span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">scheduled</span></div></div>
    </div>
    {items.length > 0 && <div className="qbx-divider px-4 py-3 sm:px-5"><div className="flex flex-wrap gap-2">{items.slice(0, 5).map((item, i) => { const due = item.dueAt <= now; const tone = toneFor(item.subjectId); return <motion.span key={item.questionId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SOFT_SPRING, delay: 0.18 + i * 0.04 }} className="qbx-queue-pill inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ ['--chip-from' as string]: tone.from, ['--chip-ink' as string]: tone.ink } as React.CSSProperties}><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: due ? '#FF9F0A' : tone.from }}/><span className="max-w-[180px] truncate">{item.subjectName}</span><span className="opacity-60">·</span>{due ? 'Due' : new Date(item.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</motion.span>; })}{items.length > 5 && <span className="self-center text-[11px] text-slate-500 dark:text-slate-400">+{items.length - 5} more</span>}</div></div>}
    <div className="qbx-divider qbx-panel-foot flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{items.length === 0 ? 'No review cards yet. Practice a set and mark your confidence to build this queue.' : dueItems.length === 0 ? `You’re clear for today. ${upcoming.length} question${upcoming.length === 1 ? ' is' : 's are'} scheduled for a later review.` : `${dueItems.length} question${dueItems.length === 1 ? '' : 's'} ready for retrieval practice.`}</p><motion.button type="button" disabled={loading || dueItems.length === 0} onClick={onStart} whileHover={loading || dueItems.length === 0 ? undefined : { y: -1 }} whileTap={loading || dueItems.length === 0 ? undefined : { scale: 0.97 }} transition={SPRING} className="qbx-btn qbx-btn-violet min-h-10 shrink-0 rounded-xl px-4 text-xs"><RotateCcw className="h-3.5 w-3.5"/>Start due review<ChevronRight className="h-3.5 w-3.5"/></motion.button></div>
  </motion.section>;
}

const FMGE_BLUEPRINT_GROUPS = [
  { title: 'Pre-clinical & para-clinical · 100 marks', rows: [['Anatomy', 17], ['Physiology', 17], ['Biochemistry', 17], ['Pathology', 13], ['Microbiology', 13], ['Pharmacology', 13], ['Forensic Medicine', 10]] as Array<[string, number]> },
  { title: 'Clinical · 200 marks', rows: [['Medicine', 33], ['Psychiatry', 5], ['Dermatology & STD', 5], ['Radiotherapy', 5], ['General Surgery', 32], ['Anesthesiology', 5], ['Orthopedics', 5], ['Radiodiagnosis', 5], ['Pediatrics', 15], ['Ophthalmology', 15], ['Otorhinolaryngology', 15], ['Obstetrics & Gynecology', 30], ['Community Medicine', 30]] as Array<[string, number]> },
];

function BlueprintReference() {
  return <details className="mb-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 sm:p-4"><summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-blue-700 dark:text-blue-400"/> Official FMGE subject blueprint <span className="rounded-full bg-white dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">300 marks</span></span><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">See the official subject-wise marks and how the sprint uses them.</span></summary><div className="mt-4 grid gap-4 md:grid-cols-2">{FMGE_BLUEPRINT_GROUPS.map((group) => <section key={group.title} className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1A1F2E] p-3"><h3 className="text-xs font-bold text-slate-900 dark:text-white">{group.title}</h3><ul className="mt-2 space-y-1.5">{group.rows.map(([name, marks]) => <li key={name} className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300"><span>{name}</span><b className="shrink-0 font-semibold text-slate-900 dark:text-white">{marks} marks</b></li>)}</ul></section>)}</div><div className="mt-3 rounded-xl bg-white/75 dark:bg-[#1A1F2E] p-3 text-xs leading-5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10"><b className="text-slate-900 dark:text-white">Exam pattern:</b> 300 single-best-answer MCQs in two parts of 150 questions and 150 minutes each, with a scheduled break. Each correct answer is worth 1 mark, there is no negative marking, and 150/300 is the qualifying score. The blueprint is the published distribution, not a promise that each individual paper follows an exact subject count. Answer every question in the real exam.<p className="mt-2">The plan weights revision by this blueprint, then adjusts toward your recent answers, confidence, tagged errors and mock weak subjects. Question-bank counts are not used to infer NBE frequency because this imported archive is uneven and contains duplicate questions.</p><p className="mt-2">Radiotherapy is a separate 5-mark blueprint entry but is not currently a separate filter in this question bank. These figures come from the latest official FMGE bulletin available to this implementation (June 2026); check the October 2026 bulletin for any updated instructions.</p><a className="mt-2 inline-flex font-semibold text-blue-700 dark:text-blue-400 underline decoration-blue-200 dark:decoration-blue-800 underline-offset-2 hover:text-blue-900 dark:hover:text-blue-300" href="https://nbe.edu.in/IB/FMGE%20JUNE%202026%20information%20bulletin.pdf#page=98" target="_blank" rel="noreferrer">NBEMS June 2026 Information Bulletin · scheme and syllabus</a></div></details>;
}

function BlueprintPills({ subjectIds }: { subjectIds: string[] }) {
  const subjects = subjectIds.map((id) => FMGE_SUBJECTS.find((subject) => subject.id === id)).filter(Boolean);
  if (!subjects.length) return null;
  return <div className="mt-2 flex flex-wrap gap-1.5">{subjects.map((subject) => <span key={subject!.id} className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20">{subject!.name} · {FMGE_BLUEPRINT_MARKS[subject!.id] ?? subject!.weightage} blueprint marks</span>)}</div>;
}

function SprintErrorReview({ attempts, errorTypes, onSetErrorType }: { attempts: McqAttempt[]; errorTypes: Record<string, SprintErrorType>; onSetErrorType: (questionId: string, errorType: SprintErrorType) => void }) {
  const cutoff = Date.now() - 30 * 86_400_000;
  const latestByQuestion = new Map<string, McqAttempt>();
  for (const attempt of [...attempts].filter((item) => item.source === 'qbank' && item.timestamp && Date.parse(item.timestamp) >= cutoff && (!item.isCorrect || ['guess', 'low'].includes(item.confidence || ''))).sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
    if (!latestByQuestion.has(attempt.questionId)) latestByQuestion.set(attempt.questionId, attempt);
  }
  const rows = [...latestByQuestion.values()].slice(0, 5);
  if (rows.length === 0) return null;
  const labels: Array<{ id: SprintErrorType; label: string }> = [
    { id: 'knowledge', label: 'Didn’t know' },
    { id: 'confusion', label: 'Confused options' },
    { id: 'misread', label: 'Misread' },
    { id: 'guess', label: 'Guessed' },
  ];
  return <details className="mt-4 border-t border-slate-200/70 dark:border-white/10 pt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">Tag why you missed it <span className="font-normal text-slate-500 dark:text-slate-400">· improves upcoming focus</span></summary><div className="mt-3 space-y-2">{rows.map((attempt) => { const subject = FMGE_SUBJECTS.find((item) => item.id === attempt.subjectId)?.name || attempt.subjectId; const tag = errorTypes[attempt.questionId]; return <div key={attempt.questionId} className="rounded-xl bg-[#F8FAFC] dark:bg-white/5 p-2.5 border border-slate-200/60 dark:border-white/10"><div className="mb-2 flex items-center justify-between gap-2 text-[10px]"><span className="truncate font-semibold text-slate-700 dark:text-slate-300">{subject}{attempt.subtopic ? ` · ${attempt.subtopic}` : ''}</span><span className="shrink-0 text-slate-500 dark:text-slate-400">{new Date(attempt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div><div className="grid grid-cols-2 gap-1.5">{labels.map(({ id, label }) => <button key={id} type="button" aria-pressed={tag === id} onClick={() => onSetErrorType(attempt.questionId, id)} className={`min-h-8 rounded-lg px-2 text-[10px] font-medium transition ${tag === id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-white/10 hover:ring-blue-300'}`}>{label}</button>)}</div></div>; })}</div></details>;
}

function SignalMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-[#F8FAFC] dark:bg-white/5 px-2 py-2 text-center border border-slate-200/60 dark:border-white/10"><b className="block text-sm font-semibold text-slate-900 dark:text-white">{value}</b><span className="mt-0.5 block text-[9px] leading-3 text-slate-500 dark:text-slate-400">{label}</span></div>;
}

function MockScoreTrend({ grandTests }: { grandTests: GrandTest[] }) {
  const recent = [...grandTests].sort((a, b) => a.date.localeCompare(b.date)).slice(-6);
  if (!recent.length) return null;
  return <div className="mt-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-[#FBFCFE] dark:bg-[#1A1F2E] p-3"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mock score trend</p><p className="text-[10px] text-slate-500 dark:text-slate-400">out of 300</p></div><div className="relative mt-3 flex h-24 items-end justify-around gap-2" role="img" aria-label={`Recent mock scores: ${recent.map((test) => `${test.score} out of 300`).join(', ')}`}><div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-400/70" style={{bottom:'50%'}}/><div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-blue-400/70" style={{bottom:'55%'}}/>{recent.map((test) => <div key={test.id} className="relative z-[1] flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300">{test.score}</span><div className={`w-full max-w-6 rounded-t-md transition-all ${test.score>=165?'bg-emerald-500':test.score>=150?'bg-amber-400':'bg-blue-500'}`} style={{height:`${Math.max(5,Math.min(100,test.score/300*100))}%`}}/><span className="text-[9px] text-slate-500 dark:text-slate-400">{new Date(`${test.date}T12:00:00`).toLocaleDateString(undefined,{month:'numeric',day:'numeric'})}</span></div>)}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-500 dark:text-slate-400"><span><i className="mr-1 inline-block w-3 border-t border-dashed border-amber-500 align-middle"/>150 pass mark</span><span><i className="mr-1 inline-block w-3 border-t border-dashed border-blue-500 align-middle"/>165 working target</span></div></div>;
}

function GradientIcon({ from, to, children, size = 'md' }: { from: string; to: string; children: React.ReactNode; size?: 'sm' | 'md' }) {
  return <span className={`relative flex shrink-0 items-center justify-center text-white shadow-[0_8px_18px_rgba(30,40,90,0.18)] ring-1 ring-white/30 ${size === 'sm' ? 'h-9 w-9 rounded-xl [&>svg]:h-4 [&>svg]:w-4' : 'h-11 w-11 rounded-2xl [&>svg]:h-5 [&>svg]:w-5'}`} style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}>{children}</span>;
}
function ProgressRing({ value, display, label, from, to, id, large = false }: { value: number; display: string; label: string; from: string; to: string; id: string; large?: boolean }) {
  const r = 20; const c = 2 * Math.PI * r; const pct = Math.max(0, Math.min(100, value));
  return <div className={`relative flex shrink-0 items-center justify-center ${large ? 'h-32 w-32' : 'h-14 w-14'}`}>
    <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true"><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={from}/><stop offset="100%" stopColor={to}/></linearGradient></defs><circle cx="24" cy="24" r={r} fill="none" className="qbx-ring-track" strokeWidth={large ? 4 : 5}/><motion.circle cx="24" cy="24" r={r} fill="none" stroke={`url(#${id})`} strokeWidth={large ? 4 : 5} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}/></svg>
    <span className="relative text-center leading-none"><b className={`qbx-ring-value block font-bold tabular-nums ${large ? 'text-3xl tracking-tight' : 'text-[15px]'}`}>{display}</b><span className={`qbx-ring-label mt-1 block font-semibold uppercase tracking-wide ${large ? 'text-[10px]' : 'text-[8.5px]'}`}>{label}</span></span>
  </div>;
}
function Stat({ label, value, icon, from, to, delay = 0, reduceMotion }: { label: string; value: string; icon: React.ReactNode; from: string; to: string; delay?: number; reduceMotion: boolean | null }) {
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={reduceMotion ? { duration: 0 } : { ...SOFT_SPRING, delay }} whileHover={reduceMotion ? undefined : { y: -3 }} className="qbank-stat qbx-stat relative min-w-0 overflow-hidden rounded-2xl px-3 py-3 sm:px-4 sm:py-3.5">
    <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-30 blur-xl" style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}/>
    <span className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-[0_6px_14px_rgba(0,0,0,0.12)] [&>svg]:h-4 [&>svg]:w-4" style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}>{icon}</span>
    <p className="relative mt-2.5 text-xl font-bold tabular-nums tracking-tight text-[#141A26] sm:text-2xl">{value}</p>
    <p className="relative mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7A8491] sm:text-[10.5px]">{label}</p>
  </motion.div>;
}
function SubjectChip({ id, name, count, active, onSelect, reduceMotion, index }: { id: string; name: string; count?: number; active: boolean; onSelect: () => void; reduceMotion: boolean | null; index: number }) {
  const tone = id ? toneFor(id) : DEFAULT_TONE;
  const Icon = id ? tone.icon : Layers;
  const vars = { ['--chip-from' as string]: tone.from, ['--chip-to' as string]: tone.to, ['--chip-soft' as string]: tone.soft, ['--chip-ink' as string]: tone.ink } as React.CSSProperties;
  return <motion.button type="button" aria-pressed={active} onClick={onSelect} initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={reduceMotion ? { duration: 0 } : { ...SOFT_SPRING, delay: Math.min(index, 18) * 0.022 }} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.96 }} style={vars} className={`qbx-chip group relative flex min-h-[58px] items-center gap-2.5 overflow-hidden rounded-2xl px-2.5 py-2 text-left ${active ? 'is-active' : ''}`}>
    {active && <motion.span layoutId="qbx-subject-glow" transition={reduceMotion ? { duration: 0 } : SPRING} aria-hidden="true" className="qbx-chip-active absolute inset-0 rounded-2xl"/>}
    <span className="qbx-chip-icon relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"><Icon className="h-4 w-4"/></span>
    <span className="relative z-10 min-w-0 flex-1"><span className="qbx-chip-name block truncate text-[12.5px] font-semibold leading-tight">{name}</span><span className="qbx-chip-count mt-0.5 block text-[10.5px] font-medium tabular-nums">{typeof count === 'number' ? `${count.toLocaleString()} Qs` : '—'}</span></span>
    {active && <Check className="relative z-10 h-3.5 w-3.5 shrink-0 text-white"/>}
  </motion.button>;
}
function SelectField({label,step,children}:{label:string;step?:string;children:React.ReactNode}) { return <label className="block min-w-0"><span className="qbx-label mb-2">{step&&<i className="qbx-step">{step}</i>}{label}</span><span className="relative block"><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A818C]"><ChevronDown className="h-4 w-4"/></span>{React.cloneElement(children as React.ReactElement<any>,{className:'qbx-select h-12 w-full appearance-none rounded-2xl px-3.5 pr-9 text-sm font-semibold outline-none transition'})}</span></label>; }
function FeatureNote({icon,title,body,from,to}:{icon:React.ReactNode;title:string;body:string;from:string;to:string}) { return <div className="qbx-feature flex items-center gap-3 px-4 py-4 sm:px-5"><GradientIcon from={from} to={to} size="sm">{icon}</GradientIcon><div className="min-w-0"><h3 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h3><p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{body}</p></div></div>; }

type ParsedExplanation = { paragraphs: string[]; keyPoints: string[]; optionReasons: Array<{ key: string; reason: string }> };

function splitExplanationParagraphs(text: string) {
  const protectedText = text.replace(/\b(?:e\.g|i\.e|vs|etc|Dr|Mr|Mrs)\./gi, (abbreviation) => abbreviation.replace('.', '\u0000'));
  const pieces = protectedText.split(/([.!?])\s+(?=[A-Z])/);
  const sentences: string[] = [];
  for (let i = 0; i < pieces.length; i += 2) sentences.push(`${pieces[i]}${pieces[i + 1] || ''}`.replace(/\u0000/g, '.').trim());
  const readableSentences = sentences.filter(Boolean);
  const paragraphs: string[] = [];
  for (let i = 0; i < readableSentences.length; i += 2) paragraphs.push(readableSentences.slice(i, i + 2).join(' '));
  return paragraphs;
}

function parseSourceExplanation(raw: string, correctAnswer: string): ParsedExplanation {
  let text = (raw || '').replace(/\s+/g, ' ').trim();
  if (correctAnswer) {
    const answerPrefix = correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`^${answerPrefix}(?:\\s*[:—–-]\\s*|\\s+)`, 'i'), '');
  }
  text = text.replace(/([.!?])(?=[A-Z])/g, '$1 ').replace(/([,:;])(?=\S)/g, '$1 ');
  const otherHeading = /why\s+(?:the\s+)?other\s+options\s+(?:are\s+)?(?:incorrect|wrong)\s*:/i;
  const keyHeading = /key\s+(?:(?:anatomical|clinical|important)\s+)?(?:features|clues|points)\s*:/i;
  const otherMatch = otherHeading.exec(text);
  const otherText = otherMatch ? text.slice(otherMatch.index + otherMatch[0].length) : '';
  if (otherMatch) text = text.slice(0, otherMatch.index).trim();
  const keyMatch = keyHeading.exec(text);
  let keyPoints: string[] = [];
  if (keyMatch) {
    const rawPoints = text.slice(keyMatch.index + keyMatch[0].length).trim().replace(/^\d+[.)]\s*/, '');
    keyPoints = rawPoints.split(/\s+\d+[.)]\s+/).map((point) => point.trim()).filter(Boolean);
    if (keyPoints.length < 2) keyPoints = splitExplanationParagraphs(rawPoints);
    text = text.slice(0, keyMatch.index).trim();
  }
  const optionMatches = [...otherText.matchAll(/\(([A-D])\)\s*/g)];
  const optionReasons = optionMatches.map((match, index) => ({
    key: match[1],
    reason: otherText.slice(match.index! + match[0].length, optionMatches[index + 1]?.index ?? otherText.length).trim().replace(/[.;\s]+$/, ''),
  })).filter((item) => item.reason);
  return { paragraphs: splitExplanationParagraphs(text), keyPoints, optionReasons };
}

function SourceExplanation({ review, correctAnswer }: { review: Review; correctAnswer: string }) {
  const parsed = parseSourceExplanation(review.explanation, correctAnswer);
  return <section className="qbank-explanation overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141A29] shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-200/70 dark:border-white/10 px-4 py-4 sm:px-5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"><BookOpenCheck className="h-4 w-4"/></div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Why this is the answer</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{correctAnswer}</p>
      </div>
    </div>
    {review.sourceExplanationAvailable === false ? (
      <p className="px-4 py-4 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:px-5">The source did not include a rationale. Ask Gemini for a focused explanation based on the question and answer key.</p>
    ) : (
      <div className="space-y-4 px-4 py-4 sm:px-5">
        {parsed.paragraphs.length > 0 ? (
          parsed.paragraphs.map((paragraph, index) => <p key={index} className="max-w-[72ch] text-sm leading-7 text-slate-700 dark:text-slate-200">{paragraph}</p>)
        ) : (
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">Review the key clues and option comparison below.</p>
        )}
        {parsed.keyPoints.length > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 sm:p-4 border border-slate-200/60 dark:border-white/10">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Key clues to remember</h4>
            <ul className="space-y-2">{parsed.keyPoints.map((point, i) => <li key={i} className="flex gap-2.5 text-sm leading-6 text-slate-700 dark:text-slate-200"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"/>{point}</li>)}</ul>
          </div>
        )}
        {parsed.optionReasons.length > 0 && (
          <details className="group rounded-xl border border-slate-200/70 dark:border-white/10 bg-[#FBFCFE] dark:bg-white/5 px-3.5 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 dark:text-slate-300 marker:hidden">Why the other choices don’t fit<span className="float-right text-slate-400 transition-transform group-open:rotate-180">⌄</span></summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{parsed.optionReasons.map((option) => <div key={option.key} className="rounded-lg bg-white dark:bg-white/10 p-3 text-xs leading-5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10"><b className="mr-1 text-slate-900 dark:text-white">{option.key}.</b>{option.reason}</div>)}</div>
          </details>
        )}
      </div>
    )}
    <div className="border-t border-slate-200/70 dark:border-white/10 px-4 py-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:px-5">Source: {review.source}, page {review.sourcePage}</div>
  </section>;
}

function GeminiReviewPanel({ correct, tutor, loading, error, onRequest }: { correct: boolean; tutor: TutorReview | null; loading: boolean; error: string; onRequest: () => void }) {
  const [showRetrievalAnswer, setShowRetrievalAnswer] = useState(false);
  useEffect(() => setShowRetrievalAnswer(false), [tutor]);
  return <section className="qbank-gemini overflow-hidden rounded-2xl border border-violet-200/80 dark:border-violet-500/30 bg-[linear-gradient(145deg,#F8F6FF,#FFFFFF_68%,#F3F8FF)] dark:bg-[linear-gradient(145deg,#1A1629,#131724_68%,#161A29)] shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100/80 dark:border-white/10 px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"><MessageSquareText className="h-4 w-4"/></div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Personalized mistake review</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">A new way to reason through the question—not a repeat of the source rationale</p>
        </div>
      </div>
      <span className="rounded-full bg-white/80 dark:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300 ring-1 ring-violet-100 dark:ring-white/10">Study review</span>
    </div>
    <div aria-live="polite" className="p-4 sm:p-5">
      {tutor ? <div className="space-y-4">
        <section><h4 className="text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">{correct ? 'What your reasoning got right' : 'Why your choice was tempting'}</h4><p className="mt-1.5 max-w-[72ch] text-sm leading-7 text-slate-700 dark:text-slate-200">{tutor.learnerChoiceInsight}</p></section>
        <section className="rounded-xl border border-violet-100 dark:border-white/10 bg-white/80 dark:bg-white/5 p-3.5 sm:p-4"><h4 className="text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">Decision rule for next time</h4><p className="mt-1.5 text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">{tutor.decisionRule}</p></section>
        <section className="rounded-xl border border-blue-100 dark:border-white/10 bg-[#F5F9FF] dark:bg-white/5 p-3.5 sm:p-4"><h4 className="text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">Quick recall · answer before revealing</h4><p className="mt-1.5 text-sm leading-6 text-slate-800 dark:text-slate-200">{tutor.retrievalQuestion}</p><button type="button" aria-expanded={showRetrievalAnswer} onClick={() => setShowRetrievalAnswer((visible) => !visible)} className="mt-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-white/10">{showRetrievalAnswer ? 'Hide answer' : 'Reveal answer'}</button>{showRetrievalAnswer && <p className="mt-1 border-t border-blue-100 dark:border-white/10 pt-2 text-sm leading-6 text-slate-800 dark:text-slate-200">{tutor.retrievalAnswer}</p>}</section>
        <details className="group rounded-xl border border-violet-100 dark:border-white/10 bg-white/65 dark:bg-white/5 px-3.5 py-3"><summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 marker:hidden">Compare all four options<span className="float-right text-slate-400 transition-transform group-open:rotate-180">⌄</span></summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...tutor.optionAnalysis].sort((a,b)=>a.key.localeCompare(b.key)).map((option)=><div key={option.key} className={`rounded-xl border p-3 ${option.verdict === 'correct' ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30' : 'border-violet-100/70 dark:border-white/10 bg-white/80 dark:bg-white/5'}`}><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{option.key} · {option.verdict === 'correct' ? 'Best answer' : 'Why it misses'}</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{option.reason}</p></div>)}</div></details>
        <section className="grid gap-2 sm:grid-cols-3">{[['Exam trap',tutor.examTrap],['Memory hook',tutor.memoryAid],['Clinical pearl',tutor.clinicalPearl]].map(([title,body])=><div key={title} className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/75 dark:bg-white/5 p-3"><h4 className="text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">{title}</h4><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{body}</p></div>)}</section><p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">Gemini-generated teaching synthesis. Check clinical decisions against current trusted references.</p></div> : <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">{loading ? 'Gemini is building a review around your choice and confidence…' : error || (correct ? 'Want a fresh decision rule and recall check?' : 'Preparing your personalized missed-question review…')}</p><button type="button" onClick={onRequest} disabled={loading} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60">{loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : <MessageSquareText className="h-3.5 w-3.5"/>}{error ? 'Try Gemini again' : 'Build study review'}</button></div>}
    </div>
  </section>;
}

function QuestionSession({questions,sessionId,sessionLabel,onClose,onRecordAttempt}:{questions:BankQuestion[];sessionId:string;sessionLabel:string;onClose:()=>void;onRecordAttempt:(attempt:NewMcqAttemptInput)=>unknown}) {
  const [index,setIndex]=useState(0);
  const [choice,setChoice]=useState('');
  const [confidence,setConfidence]=useState<'guess'|'low'|'high'>('low');
  const [selectedSubtopic,setSelectedSubtopic]=useState('');
  const [review,setReview]=useState<Review|null>(null);
  const [tutor,setTutor]=useState<TutorReview|null>(null);
  const [loading,setLoading]=useState(false);
  const [tutorLoading,setTutorLoading]=useState(false);
  const [tutorError,setTutorError]=useState('');
  const [imageOpen,setImageOpen]=useState<number | null>(null);
  const [answered,setAnswered]=useState<Record<string,{selected:string;correct:boolean;seconds:number;confidence:'guess'|'low'|'high'}>>({});
  const [finished,setFinished]=useState(false);
  const startedAt=React.useRef(Date.now());
  const q=questions[index];

  useEffect(()=>{if(questions.length){document.body.style.overflow='hidden';return()=>{document.body.style.overflow='';};}},[questions.length]);
  useEffect(()=>setImageOpen(null),[q?.id]);
  if(!q || typeof document === 'undefined') return null;
  const figures=q.imageUrls?.length ? q.imageUrls : q.imageUrl ? [q.imageUrl] : [];
  const availableTopics=q.exam==='FMGE' ? FMGE_SUBJECTS.find((subject)=>subject.id===q.subjectId)?.topics || [] : [];
  const selectedTopic=availableTopics.find((topic)=>topic.id===selectedSubtopic);

  const requestTutorReview=async(answerReceipt?:string)=>{
    if (tutorLoading || tutor) return;
    setTutorLoading(true); setTutorError('');
    try {
      const data = await responseJson(await apiFetch('/api/question-bank/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q.id,sessionId,answerReceipt})}));
      setTutor(data);
    } catch (err: any) { setTutorError(err.message || 'Gemini could not prepare the review.'); }
    finally { setTutorLoading(false); }
  };

  const submit=async()=>{
    if(!choice||loading||review)return;
    setLoading(true); setTutorError('');
    try {
      const seconds=Math.max(1,Math.round((Date.now()-startedAt.current)/1000));
      const data=await responseJson(await apiFetch('/api/question-bank/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q.id,selectedAnswer:choice,sessionId,confidence,timeTakenSeconds:seconds})}));
      const answer:Review={...data};
      setReview(answer);
      setAnswered((prev)=>({...prev,[q.id]:{selected:choice,correct:data.correct,seconds,confidence}}));
      onRecordAttempt({questionId:q.id,subjectId:q.subjectId,topicId:selectedTopic?.id||q.subjectId,topicName:selectedTopic?.name||q.subjectName,subtopicId:selectedTopic?.id,subtopic:selectedTopic?.name,isCorrect:data.correct,selectedAnswer:choice,correctAnswer:data.correctAnswer,timeTakenSeconds:seconds,difficulty:'high-yield',confidence,source:'qbank',sessionId,isImageBased:q.isImageBased,imageUrl:q.imageUrl||undefined,exam:q.exam});
      if(!data.correct) await requestTutorReview(answer.answerReceipt);
    } catch(err:any) { setTutorError(err.message||'Could not submit this answer.'); }
    finally { setLoading(false); }
  };

  const next=()=>{if(index+1>=questions.length){setFinished(true);return;}setIndex((v)=>v+1);setChoice('');setConfidence('low');setReview(null);setTutor(null);setTutorError('');setSelectedSubtopic('');startedAt.current=Date.now();};
  const close=()=>{document.body.style.overflow='';onClose();};
  const correctCount=Object.values(answered).filter(a=>a.correct).length;
  const reviewGapCount=Object.values(answered).filter(a=>!a.correct||a.confidence!=='high').length;
  const answerText=q.options.find((option)=>option.key===review?.correctAnswer)?.text || '';

  const answeredCount=Object.keys(answered).length;
  const accuracy=answeredCount?Math.round(correctCount/answeredCount*100):0;
  const subjectTone=toneFor(q.subjectId);
  const SubjectIcon=subjectTone.icon;
  const cardVars={['--chip-from' as string]:subjectTone.from,['--chip-to' as string]:subjectTone.to} as React.CSSProperties;

  return createPortal(<AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="qbank-session qbx-session fixed inset-0 z-[9500] overflow-y-auto text-slate-900 dark:text-slate-100">
    <div aria-hidden className="qbx-session-aurora pointer-events-none fixed inset-0 z-0"><span className="qbx-orb qbx-orb-a"/><span className="qbx-orb qbx-orb-b"/><span className="qbx-orb qbx-orb-c"/></div>
    <div className="relative z-[1] mx-auto flex min-h-[100dvh] max-w-3xl flex-col">
      <header className="qbank-session-header qbx-session-header sticky top-0 z-10 px-4 pb-3 pt-3 backdrop-blur-2xl sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <GradientIcon from={subjectTone.from} to={subjectTone.to} size="sm"><SubjectIcon/></GradientIcon>
            <div className="min-w-0"><p className="truncate text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{sessionLabel} · {q.exam} · {q.year || 'Year not listed'} · {q.subjectName}</p><p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">Question <span className="tabular-nums">{index+1}</span> <span className="font-normal text-slate-500 dark:text-slate-400">of {questions.length}</span></p></div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {answeredCount>0&&<motion.span key={answeredCount} initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={SPRING} className="qbx-score-pill hidden items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums sm:inline-flex"><Check className="h-3 w-3"/>{correctCount}/{answeredCount}</motion.span>}
            <motion.button type="button" whileTap={{scale:0.9}} onClick={close} className="qbx-close flex h-10 w-10 items-center justify-center rounded-full transition" aria-label="Close practice"><X className="h-4 w-4"/></motion.button>
          </div>
        </div>
        {questions.length<=60?<div className="mt-3 flex gap-1" aria-hidden="true">{questions.map((item,i)=>{const a=answered[item.id];return <span key={item.id} className="qbx-seg relative h-1.5 flex-1 overflow-hidden rounded-full">{(a||i===index)&&<motion.span initial={{scaleX:0}} animate={{scaleX:1}} transition={SOFT_SPRING} style={{originX:0}} className={`absolute inset-0 rounded-full ${a?(a.correct?'bg-gradient-to-r from-[#30D158] to-[#00A88F]':'bg-gradient-to-r from-[#FF453A] to-[#FF2D92]'):'bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6]'}`}/>}</span>;})}</div>:<div className="qbx-seg mt-3 h-1.5 overflow-hidden rounded-full" aria-hidden="true"><motion.div animate={{width:`${((index+1)/questions.length)*100}%`}} transition={SOFT_SPRING} className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] via-[#5E5CE6] to-[#BF5AF2]"/></div>}
      </header>
      {finished?<main className="m-auto w-full max-w-lg p-5 text-center">
        <motion.div initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}} transition={SPRING} className="flex justify-center"><ProgressRing value={accuracy} display={`${accuracy}%`} label="score" from="#30D158" to="#0A84FF" id="qbx-finish-ring" large/></motion.div>
        <motion.h2 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{...SOFT_SPRING,delay:0.08}} className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{sessionLabel} complete</motion.h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{correctCount} correct out of {answeredCount} answered.</p>
        {reviewGapCount>0&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{...SOFT_SPRING,delay:0.16}} className="qbx-gap-card mx-auto mt-5 max-w-sm rounded-2xl px-4 py-3 text-left"><p className="text-sm font-semibold text-amber-950 dark:text-amber-200">{reviewGapCount} question{reviewGapCount===1?'':'s'} to revisit</p><p className="mt-1 text-xs leading-5 text-amber-900 dark:text-amber-300">Missed, guessed, and unsure answers are saved as review gaps, even when correct. Start with these in your next revision block.</p></motion.div>}
        <motion.button type="button" whileHover={{y:-1}} whileTap={{scale:0.97}} transition={SPRING} onClick={close} className="qbx-btn qbx-btn-blue mt-6 h-12 rounded-2xl px-8 text-sm">Done<Check className="h-4 w-4"/></motion.button>
      </main>:<main className="w-full flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait" initial={false}>
        <motion.article key={q.id} initial={{opacity:0,x:28,scale:0.985}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:-28,scale:0.985}} transition={SOFT_SPRING} style={cardVars} className="qbank-question-card qbx-question-card relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7 border border-slate-200/80 dark:border-white/12">
          <span aria-hidden="true" className="qbx-card-accent pointer-events-none absolute inset-x-0 top-0 h-1"/>
          <div className="mb-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{color:subjectTone.ink,background:subjectTone.soft}}><SubjectIcon className="h-3 w-3"/>{q.subjectName}</span><span className="qbank-year-pill inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">{q.year ? `${q.exam} ${q.year}` : 'Year not listed in source'}</span>{q.isImageBased&&<span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/20"><ImageIcon className="h-3 w-3"/> Image question</span>}</div>
          <h1 className="whitespace-pre-wrap text-[17px] font-semibold leading-[1.6] tracking-[-0.015em] text-slate-900 dark:text-white sm:text-lg">{q.stem}</h1>
          {figures.map((figure,index)=><button key={`${q.id}-figure-${index}`} type="button" onClick={()=>setImageOpen(index)} className="qbank-figure group mt-5 block max-h-[min(52vh,500px)] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-left"><img src={figure} alt={`Question figure${figures.length>1?` ${index+1}`:''}`} className="mx-auto max-h-[min(52vh,500px)] max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy"/><span className="block border-t border-slate-200/60 dark:border-white/10 px-3 py-2.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">{figures.length>1?`Figure ${index+1} of ${figures.length} · `:''}Tap to view larger</span></button>)}
          <div className="mt-5 space-y-2.5">{q.options.map((option,oi)=>{const isCorrect=Boolean(review&&option.key===review.correctAnswer);const isWrong=Boolean(review&&option.key===choice&&!isCorrect);const isPicked=!review&&choice===option.key;return <motion.button key={option.key} type="button" disabled={Boolean(review)||loading} onClick={()=>setChoice(option.key)} initial={{opacity:0,y:10}} animate={{opacity:1,y:0,scale:isPicked?1.01:1}} transition={{...SOFT_SPRING,delay:review?0:0.05+oi*0.04}} whileTap={review?undefined:{scale:0.985}} aria-pressed={choice===option.key} className={`qbx-option relative flex w-full items-start gap-3 overflow-hidden rounded-2xl px-3.5 py-3.5 text-left sm:px-4 ${isCorrect?'is-correct':isWrong?'is-wrong':isPicked?'is-picked':''}`}>
            <span className="qbx-option-key relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold" aria-label={`Option ${option.key}`}>{isCorrect?<Check className="h-4 w-4"/>:isWrong?<X className="h-4 w-4"/>:option.key}</span>
            <span className="qbx-option-text relative z-10 pt-1 text-sm leading-6">{option.text}</span>
            {isCorrect&&<motion.span initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} transition={SPRING} className="relative z-10 ml-auto mt-1 shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Correct</motion.span>}
          </motion.button>;})}</div>
          {!review?<>
            <fieldset className="mt-5"><legend className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">How sure are you? This helps choose what to revisit.</legend><div className="qbx-segment relative grid grid-cols-3 gap-1 rounded-full p-1">{([{value:'guess',label:'Guessed',from:'#FF9F0A',to:'#FF453A'},{value:'low',label:'Unsure',from:'#5E5CE6',to:'#BF5AF2'},{value:'high',label:'Confident',from:'#30D158',to:'#00A88F'}] as const).map((item)=><button key={item.value} type="button" aria-pressed={confidence===item.value} onClick={()=>setConfidence(item.value)} className={`relative min-h-9 rounded-full px-2 text-xs font-semibold transition-colors ${confidence===item.value?'text-white':'qbx-segment-idle'}`}>{confidence===item.value&&<motion.span layoutId="qbx-confidence-pill" transition={SPRING} className="absolute inset-0 rounded-full shadow-[0_4px_12px_rgba(30,40,90,0.18)]" style={{background:`linear-gradient(120deg,${item.from},${item.to})`}}/>}<span className="relative z-10">{item.label}</span></button>)}</div></fieldset>
            {availableTopics.length>0&&<details className="mt-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-[#FBFCFE] dark:bg-white/5 px-3 py-2.5"><summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">Tag the tested topic <span className="font-normal text-slate-500 dark:text-slate-400">· optional, learner-selected</span></summary><p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Choose only if you recognize the main concept. This is not automatically inferred from the question.</p><select value={selectedSubtopic} onChange={(event)=>setSelectedSubtopic(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E2332] px-3 text-xs text-slate-800 dark:text-slate-200"><option value="">Leave untagged</option>{availableTopics.map((topic)=><option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></details>}
            <motion.button type="button" disabled={!choice||loading} onClick={submit} whileHover={!choice||loading?undefined:{y:-1}} whileTap={!choice||loading?undefined:{scale:0.97}} transition={SPRING} className="qbx-btn qbx-btn-blue mt-5 h-12 w-full rounded-2xl text-sm sm:w-auto sm:px-8">{loading?<><LoaderCircle className="h-4 w-4 animate-spin"/>Checking answer…</>:'Check answer'}{!loading&&<ChevronRight className="h-4 w-4"/>}</motion.button>
            {tutorError&&<p role="alert" className="mt-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-3 text-sm leading-5 text-rose-800 dark:text-rose-200">{tutorError}</p>}
          </>:<motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={SOFT_SPRING} className="qbank-review mt-6 space-y-4" ref={(node)=>node&&node.scrollIntoView({behavior:'smooth',block:'nearest'})}>
            <div className={`qbx-verdict relative flex items-start gap-3 overflow-hidden rounded-2xl p-4 ${review.correct?'is-correct':'is-wrong'}`}><motion.div initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}} transition={{type:'spring',stiffness:500,damping:18}} className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${review.correct?'bg-gradient-to-br from-[#30D158] to-[#00A88F] shadow-emerald-500/30':'bg-gradient-to-br from-[#FF453A] to-[#FF2D92] shadow-rose-500/30'}`}>{review.correct?<Check className="h-4 w-4"/>:<CircleHelp className="h-4 w-4"/>}</motion.div><div><p className={`text-sm font-semibold ${review.correct?'text-emerald-950 dark:text-emerald-200':'text-rose-950 dark:text-rose-200'}`}>{review.correct?'That’s correct.':`Not quite — the correct answer is ${review.correctAnswer}.`}</p>{answerText&&<p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{answerText}</p>}</div></div>
            <SourceExplanation review={review} correctAnswer={answerText} />
            {tutor||tutorLoading||tutorError?<GeminiReviewPanel correct={review.correct} tutor={tutor} loading={tutorLoading} error={tutorError} onRequest={()=>requestTutorReview(review.answerReceipt)}/>:<motion.button type="button" whileHover={{y:-1}} whileTap={{scale:0.97}} transition={SPRING} onClick={()=>requestTutorReview(review.answerReceipt)} className="qbx-gemini-ask inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold"><Bot className="h-3.5 w-3.5"/>Ask Gemini to compare all options</motion.button>}
            <motion.button type="button" onClick={next} disabled={loading||tutorLoading} whileHover={loading||tutorLoading?undefined:{y:-1}} whileTap={loading||tutorLoading?undefined:{scale:0.97}} transition={SPRING} className="qbx-btn qbx-btn-blue h-12 w-full rounded-2xl text-sm sm:w-auto sm:px-8">{index+1===questions.length?'Finish set':'Next question'}<ChevronRight className="h-4 w-4"/></motion.button>
          </motion.div>}
        </motion.article>
        </AnimatePresence>
        <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">{q.exam}{q.year?` · ${q.year}`:' · year not listed'} · {q.source} · page {q.sourcePage}</p>
      </main>}
    </div>
    {imageOpen!==null&&figures[imageOpen]&&<div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm" onClick={()=>setImageOpen(null)}><button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Close image"><X className="h-5 w-5"/></button>{figures.length>1&&<><button type="button" onClick={(e)=>{e.stopPropagation();setImageOpen((imageOpen+figures.length-1)%figures.length);}} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Previous figure"><ChevronLeft className="h-5 w-5"/></button><span className="absolute bottom-5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">Figure {imageOpen+1} of {figures.length}</span><button type="button" onClick={(e)=>{e.stopPropagation();setImageOpen((imageOpen+1)%figures.length);}} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Next figure"><ChevronRight className="h-5 w-5"/></button></>}<motion.img initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} transition={SOFT_SPRING} src={figures[imageOpen]} alt={`Enlarged question figure${figures.length>1?` ${imageOpen+1}`:''}`} onClick={(e)=>e.stopPropagation()} className="max-h-[92dvh] max-w-[96vw] object-contain"/></div>}
  </motion.div></AnimatePresence>, document.body);
}
