import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Activity, ArrowRight, BookOpenCheck, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Image as ImageIcon, LoaderCircle, MessageSquareText, RefreshCw, RotateCcw, Target, X } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { buildDueReviewQueue, type ReviewQueueItem } from '../utils/qbankReviewQueue';
import type { AppState, GrandTest, McqAttempt } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

type Exam = 'FMGE' | 'NEET-PG' | 'INI-CET';
type BankQuestion = { id: string; exam: Exam; year: number | null; subjectId: string; subjectName: string; topicName: string; stem: string; options: Array<{key: string; text: string}>; imageUrl: string | null; imageUrls: string[]; source: string; sourcePage: number; isImageBased: boolean };
type Facets = { exams: Exam[]; subjects: Array<{id: string; name: string; count: number}>; years: number[]; count: number; imageCount: number };
type Review = { correct: boolean; correctAnswer: string; explanation: string; sourceExplanationAvailable?: boolean; source: string; sourcePage: number };
type TutorReview = { learnerChoiceInsight: string; decisionRule: string; retrievalQuestion: string; retrievalAnswer: string; optionAnalysis: Array<{key: string; verdict: string; reason: string}>; examTrap: string; memoryAid: string; clinicalPearl: string; aiGenerated: boolean };
type SprintErrorType = NonNullable<AppState['fmgeSprint']>['errorTypes'] extends Record<string, infer T> | undefined ? T : never;

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not reach the question bank.');
  return data;
}

export const QuestionBankView: React.FC<{
  onRecordAttempt: (attempt: NewMcqAttemptInput) => unknown;
  sprint?: AppState['fmgeSprint'];
  attempts?: McqAttempt[];
  grandTests?: GrandTest[];
  onUpdateSprint: (sprint: NonNullable<AppState['fmgeSprint']>) => void;
  onOpenGrandTests: () => void;
}> = ({ onRecordAttempt, sprint, attempts = [], grandTests = [], onUpdateSprint, onOpenGrandTests }) => {
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
  const startSession = async (override?: { exam: Exam; subjectId: string; year?: string; imageMode: 'all'|'image'|'standard'; count: number; questionIds?: string[]; label?: string }) => {
    setLoading(true); setError('');
    try {
      const { label, ...filters } = override || { exam, subjectId, year: year || null, imageMode, count };
      const data = await responseJson(await apiFetch('/api/question-bank/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filters) }));
      setSessionLabel(label || 'Practice set');
      setQuestions(data.questions); setSessionId(data.sessionId);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const reviewQueue = useMemo(() => buildDueReviewQueue(attempts), [attempts]);
  const dueReviewQueue = reviewQueue.filter((item) => item.dueAt <= reviewClock);

  return <div data-accent="practice" className="qbank-root mx-auto w-full max-w-7xl px-3 pb-28 pt-5 font-sans text-[var(--text-primary,#1D1D1F)] sm:px-6 sm:pb-20 lg:px-8">
    <motion.section initial={reducedMotion ? false : {opacity:0,y:10,scale:0.992}} animate={{opacity:1,y:0,scale:1}} transition={reducedMotion ? {duration:0} : {duration:0.48,ease:[0.16,1,0.3,1]}} className="qbank-banner relative overflow-hidden rounded-[26px] border border-black/[0.06] bg-[linear-gradient(125deg,#EAF3FF_0%,#F8FAFD_52%,#F1EFFB_100%)] p-5 shadow-[0_16px_42px_rgba(35,65,110,0.09)] sm:rounded-[30px] sm:p-7">
      <div className="qbank-banner-glow pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-blue-400/[0.12] blur-3xl" />
      <div className="qbank-banner-orbit pointer-events-none absolute -right-10 bottom-[-8rem] h-72 w-72 rounded-full border border-blue-400/10 sm:right-[12%] sm:bottom-[-12rem] sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#416B9B] shadow-sm"><BookOpenCheck className="h-3.5 w-3.5"/> Question library <span className="h-1 w-1 rounded-full bg-blue-500"/> FMGE · NEET-PG · INI-CET</p>
          <h1 className="text-[clamp(2.15rem,5vw,3.45rem)] font-semibold leading-[1.02] tracking-[-0.06em] text-[#151A22]">Practice with purpose.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#68717E] sm:text-[15px]">Build a focused set from real exam questions. Learn the reasoning, spot the traps, and carry each insight forward.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-[290px] sm:gap-3">
          <Stat label="Questions" value={facets ? facets.count.toLocaleString() : loading ? '…' : '—'} icon={<BookOpenCheck/>} tone="blue" reduceMotion={reducedMotion} />
          <Stat label="Image cases" value={facets ? facets.imageCount.toLocaleString() : loading ? '…' : '—'} icon={<ImageIcon/>} tone="violet" reduceMotion={reducedMotion} />
        </div>
      </div>
    </motion.section>

    <motion.section initial={reducedMotion ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} transition={reducedMotion ? {duration:0} : {duration:0.42,delay:0.05,ease:[0.16,1,0.3,1]}} className="qbank-builder qbank-panel mt-4 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.045)] sm:mt-5 sm:rounded-[28px]">
      <div className="qbank-builder-heading border-b border-black/[0.055] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7B8795]">Your next set</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#202630] sm:text-2xl">Build your question set</h2><p className="mt-1 text-sm text-[#747D89]">A few choices shape a session around what you need today.</p></div>
          <div className="qbank-exam-switch inline-flex w-full rounded-xl bg-[#F2F4F7] p-1 sm:w-auto" role="group" aria-label="Choose exam">{(['FMGE','NEET-PG','INI-CET'] as Exam[]).map((value)=>{const activeTone=value==='FMGE'?'qbank-exam-blue':value==='NEET-PG'?'qbank-exam-violet':'qbank-exam-teal';return <motion.button key={value} type="button" aria-pressed={exam===value} onClick={()=>{setExam(value);setYear('');}} whileTap={reducedMotion?undefined:{scale:0.97}} transition={{type:'spring',stiffness:500,damping:32}} className={`qbank-exam-option ${activeTone} min-h-10 flex-1 rounded-lg px-3 text-xs font-semibold transition sm:flex-none sm:px-4 ${exam===value?'bg-white shadow-sm':'text-[#747D89] hover:text-[#303A48]'}`}><span className="flex items-center justify-center gap-1.5">{value}{exam===value&&<Check className="h-3.5 w-3.5"/>}</span></motion.button>})}</div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-5 p-4 sm:p-6">
          <div className="qbank-step-labels grid grid-cols-3 gap-2" aria-hidden="true"><span><i>01</i> Exam</span><span><i>02</i> Focus</span><span><i>03</i> Session</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Subject"><select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">All subjects</option>{facets?.subjects.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.count.toLocaleString()}</option>)}</select></SelectField>
            <SelectField label="Exam year"><select value={year} onChange={(e) => setYear(e.target.value)}><option value="">Any year</option>{facets?.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></SelectField>
          </div>
          <fieldset><legend className="mb-2 text-xs font-semibold text-[#69717D]">Question style</legend><div className="grid grid-cols-3 gap-2">{([{value:'all',label:'All',icon:BookOpenCheck,tone:'blue'},{value:'image',label:'Images',icon:ImageIcon,tone:'violet'},{value:'standard',label:'Text',icon:MessageSquareText,tone:'green'}] as const).map(({value,label,icon:Icon,tone})=><motion.button key={value} type="button" aria-pressed={imageMode===value} onClick={()=>setImageMode(value)} whileTap={reducedMotion?undefined:{scale:0.97}} transition={{type:'spring',stiffness:500,damping:32}} className={`qbank-style-option qbank-tone-${tone} inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition sm:gap-2 sm:text-sm ${imageMode===value?'is-selected shadow-[inset_0_0_0_1px_rgba(23,105,224,0.05)]':'border-[#E5E8ED] bg-white text-[#66707D] hover:bg-[#F8FAFC]'}`}><Icon className="h-4 w-4"/>{label}</motion.button>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-xs font-semibold text-[#69717D]">Number of questions</legend><div className="grid grid-cols-4 gap-2">{[5,10,20,50].map((value)=><motion.button key={value} type="button" aria-pressed={count===value} onClick={()=>setCount(value)} whileTap={reducedMotion?undefined:{scale:0.95}} transition={{type:'spring',stiffness:500,damping:32}} className={`qbank-count-option min-h-11 rounded-xl border text-sm font-semibold transition ${count===value?'is-selected':'border-[#E5E8ED] bg-white text-[#66707D] hover:bg-[#F8FAFC]'}`}>{value}</motion.button>)}</div></fieldset>
        </div>
        <aside className="qbank-session-summary flex flex-col justify-between border-t border-black/[0.055] bg-[#F8FAFC] p-4 sm:p-5 lg:border-l lg:border-t-0">
          <div><motion.div whileHover={reducedMotion?undefined:{y:-2,rotate:-2}} transition={{type:'spring',stiffness:300,damping:22}} className="qbank-summary-icon flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_18px_rgba(67,104,220,0.25)]"><Activity className="h-5 w-5"/></motion.div><h3 className="mt-3 text-base font-semibold tracking-tight text-[#26303C]">Ready when you are</h3><p className="mt-1 text-sm leading-5 text-[#747D89]">{selectedSubject ? `${selectedSubject.name} · ${exam}` : `${exam} · all subjects`}{year ? ` · ${year}` : ''}</p><p className="mt-3 text-xs leading-5 text-[#89919B]">Answers stay hidden until you submit. Your result is added to performance tracking, with an optional Gemini review.</p></div>
          <div className="mt-5"><motion.button type="button" onClick={() => startSession()} disabled={loading || !facets?.count} whileHover={reducedMotion?undefined:{y:-1}} whileTap={reducedMotion?undefined:{scale:0.985}} transition={{type:'spring',stiffness:450,damping:30}} className="qbank-primary-action inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-4 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(23,105,224,0.20)] transition hover:bg-[#0F5FCC] disabled:cursor-not-allowed disabled:opacity-55">{loading ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Preparing set…</> : <>Start practice<ArrowRight className="h-4 w-4"/></>}</motion.button>{error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">{error}</p>}</div>
        </aside>
      </div>
      <div className="qbank-feature-strip grid grid-cols-1 divide-y divide-black/[0.055] border-t border-black/[0.055] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <FeatureNote icon={<ImageIcon/>} title="Figures in context" body="Image questions stay with their source material." tone="violet"/>
        <FeatureNote icon={<BookOpenCheck/>} title="Clear explanations" body="Readable rationale with the answer and source." tone="blue"/>
        <FeatureNote icon={<Activity/>} title="Progress recorded" body="Attempts feed your subject performance." tone="green"/>
      </div>
    </motion.section>

    <DailyReviewQueue items={reviewQueue} dueItems={dueReviewQueue} now={reviewClock} loading={loading} onStart={() => startSession({ exam: 'FMGE', subjectId: '', year: '', imageMode: 'all', count: Math.min(20, dueReviewQueue.length), questionIds: dueReviewQueue.slice(0, 20).map((item) => item.questionId), label: 'Daily review' })}/>
    <FmgeSprint sprint={sprint} attempts={attempts} grandTests={grandTests} onUpdate={onUpdateSprint} onPractice={(subjectId, count = 20) => startSession({ exam: 'FMGE', subjectId, year: '', imageMode: 'all', count, label: 'Focused practice' })} onOpenGrandTests={onOpenGrandTests} loading={loading} />
    <QuestionSession key={sessionId} questions={questions} sessionId={sessionId} sessionLabel={sessionLabel} onClose={() => setQuestions([])} onRecordAttempt={onRecordAttempt}/>
  </div>;
};

type SprintDay = { title: string; subjects: string[]; focus: string; questions: number; fullMock?: boolean; restDay?: boolean; checkpoint?: boolean };

const SPRINT_DAYS: SprintDay[] = [
  { title: 'Baseline · mixed diagnostic', subjects: [], focus: 'Start with a timed 50-question mixed set. Review every wrong, guessed and slow answer; this is a diagnostic, not a prediction of your final score.', questions: 50 },
  { title: 'Medicine · foundations & emergencies', subjects: ['medicine'], focus: 'Approach, common presentations, ECG, shock, fluids and emergency first steps.', questions: 60 },
  { title: 'Medicine · systems & image cases', subjects: ['medicine'], focus: 'Cardiology, respiratory, neurology, renal and endocrine patterns; review ECGs and radiology.', questions: 60 },
  { title: 'Surgery · core decisions', subjects: ['surgery'], focus: 'Trauma, acute abdomen, fluids, wound healing, breast and thyroid; practise the next best step.', questions: 60 },
  { title: 'Obstetrics & gynaecology', subjects: ['obg'], focus: 'Antenatal care, labour, obstetric emergencies, contraception, malignancy and key thresholds.', questions: 60 },
  { title: 'Pediatrics', subjects: ['pediatrics'], focus: 'Growth, development, vaccines, neonatology, nutrition and common pediatric emergencies.', questions: 50 },
  { title: 'PSM · prevention & programs', subjects: ['psm'], focus: 'Screening, epidemiology, biostatistics, national programs and prevention levels.', questions: 50 },
  { title: 'Pathology', subjects: ['pathology'], focus: 'General pathology, hematology, neoplasia and image-based morphology.', questions: 50 },
  { title: 'Pharmacology', subjects: ['pharmacology'], focus: 'Mechanisms, adverse effects, antidotes, interactions and drug of choice.', questions: 50 },
  { title: 'Microbiology', subjects: ['microbiology'], focus: 'Organism-to-disease links, lab diagnosis, vaccines and antimicrobial choices.', questions: 50 },
  { title: 'Anatomy & physiology', subjects: ['anatomy', 'physiology'], focus: 'Neuroanatomy, nerves, embryology, reflexes and high-yield physiology graphs.', questions: 50 },
  { title: 'Biochemistry & forensic medicine', subjects: ['biochemistry', 'fmt'], focus: 'Metabolic diseases, vitamins, molecular methods, toxicology and legal essentials.', questions: 50 },
  { title: 'ENT & ophthalmology', subjects: ['ent', 'ophthalmology'], focus: 'Visual and clinical spotters, red flags, common nerve lesions and first-line management.', questions: 50 },
  { title: 'Short subjects & radiotherapy', subjects: ['dermatology', 'psychiatry', 'orthopedics', 'radiology', 'anesthesia'], focus: 'Recognize classic images, emergency actions, common drugs and frequently confused pairs; include core radiotherapy principles because it carries a separate 5-mark blueprint allocation.', questions: 60 },
  { title: 'Checkpoint · mixed timed set', subjects: [], focus: 'Take a timed 100-question mixed set. Compare accuracy and pacing with your baseline, then use the next study blocks for the weakest areas.', questions: 100, checkpoint: true },
  { title: 'Repair your highest-impact gaps', subjects: [], focus: 'Use recent question accuracy, uncertain answers and mock weaknesses to choose two priority subjects. Revisit missed concepts before new content.', questions: 70 },
  { title: 'Checkpoint · full mock', subjects: [], focus: 'Complete a 300-question mock as two 150-question blocks, each timed for 150 minutes, with a break between them. Review wrong, guessed and skipped answers, then record weak subjects in Grand Tests.', questions: 300, fullMock: true, checkpoint: true },
  { title: 'Repair the final gaps', subjects: [], focus: 'Target the three weakest subjects from your mock; finish image questions and revisit your error list.', questions: 80 },
  { title: 'Final checkpoint · mixed recall', subjects: [], focus: 'Do a 100-question mixed set, or a full mock only if you are rested and have not completed one recently. Review recurring errors; avoid exhausting yourself before the exam.', questions: 100, checkpoint: true },
  { title: 'Exam eve · light recall & rest', subjects: [], focus: 'Review only your own concise error list, essential images and formulas. Prepare exam logistics, stop early, eat normally and protect sleep. No full mock or new chapters.', questions: 20, restDay: true },
];

// NBEMS June 2026 bulletin, section 12.2. These are blueprint marks, not
// promised question counts in each sitting. The bank currently lacks a
// separate Radiotherapy subject tag, so those 5 marks remain an allied-topic gap.
const FMGE_BLUEPRINT_MARKS: Record<string, number> = {
  anatomy: 17, physiology: 17, biochemistry: 17, pathology: 13, microbiology: 13, pharmacology: 13, fmt: 10,
  medicine: 33, psychiatry: 5, dermatology: 5, radiotherapy: 5,
  surgery: 32, anesthesia: 5, orthopedics: 5, radiology: 5,
  pediatrics: 15, ophthalmology: 15, ent: 15, obg: 30, psm: 30,
};

function localDateKey(date = new Date()) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
const FMGE_EXAM_DATE = '2026-10-31';
function daysUntilFmge(examDate = FMGE_EXAM_DATE) {
  const today = new Date(`${localDateKey()}T12:00:00`);
  const exam = new Date(`${examDate}T12:00:00`);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86_400_000));
}
function sprintDateForIndex(dayIndex: number, examDate = FMGE_EXAM_DATE) {
  const date = new Date(`${examDate}T12:00:00`);
  date.setDate(date.getDate() - (SPRINT_DAYS.length - dayIndex));
  return localDateKey(date);
}
function sprintDayIndex(_startedOn: string, examDate = FMGE_EXAM_DATE) {
  // The sprint is anchored to the known exam date so refreshes and late starts
  // cannot drift beyond the final review day or index past the schedule.
  return Math.min(SPRINT_DAYS.length - 1, Math.max(0, 20 - daysUntilFmge(examDate)));
}

function checklistsForPlan(plan: SprintDay, hours: number, questionTarget: number) {
  return [
    `Focused revision (${(hours * (plan.restDay ? 0.35 : 0.4)).toFixed(1)} h): ${plan.focus}`,
    `Active recall (${(hours * 0.2).toFixed(1)} h): retrieve key facts without notes, then correct only what you missed.`,
    plan.fullMock
      ? 'Timed mock: complete two 150-question blocks in 150 minutes each, with an exam-style break; answer every question because FMGE has no negative marking.'
      : `Question practice (${(hours * (plan.restDay ? 0.1 : 0.3)).toFixed(1)} h): aim for about ${questionTarget} questions, then review the reasoning.`,
    plan.restDay ? 'Exam readiness: prepare documents and route, set a reasonable bedtime, and avoid late-night cramming.' : `Error review (${(hours * 0.1).toFixed(1)} h): explain each miss or guess, write the corrected rule, and revisit due cards tomorrow.`,
  ];
}

function buildAdaptiveSprintDays(attempts: McqAttempt[], grandTests: GrandTest[], errorTypes: Record<string, SprintErrorType> = {}): SprintDay[] {
  const recentCutoff = Date.now() - 30 * 86_400_000;
  const recentAttempts = attempts.filter((attempt) => attempt.timestamp && Date.parse(attempt.timestamp) >= recentCutoff && !['NEET-PG', 'INI-CET'].includes(attempt.exam || ''));
  const latestTests = [...grandTests].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const weakFromMocks = new Set(latestTests.flatMap((test) => test.weakSubjectIds || []));
  const strongFromMocks = new Set(latestTests.flatMap((test) => test.strongSubjectIds || []));
  const bySubject = new Map<string, McqAttempt[]>();
  [...recentAttempts]
    .filter((attempt) => attempt.subjectId && attempt.timestamp)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .forEach((attempt) => {
      const list = bySubject.get(attempt.subjectId) || [];
      list.push(attempt);
      bySubject.set(attempt.subjectId, list);
    });

  const ranked = FMGE_SUBJECTS.map((subject) => {
    const sample = (bySubject.get(subject.id) || []).slice(-40);
    const accuracy = sample.length ? sample.filter((attempt) => attempt.isCorrect).length / sample.length : null;
    // A correct answer marked as a guess or low confidence still needs spaced review.
    const secureCorrect = sample.filter((attempt) => attempt.isCorrect && !['guess', 'low'].includes(attempt.confidence || '')).length;
    const reviewWeightedAccuracy = sample.length ? (secureCorrect + sample.filter((attempt) => attempt.isCorrect && ['guess', 'low'].includes(attempt.confidence || '')).length * 0.35) / sample.length : null;
    const evidence = Math.min(1, sample.length / 15);
    const adjustedWeakness = reviewWeightedAccuracy === null ? 0.5 : 0.5 + (0.5 - reviewWeightedAccuracy) * evidence;
    const taggedErrors = sample.filter((attempt) => errorTypes[attempt.questionId]);
    const knowledgeErrors = taggedErrors.filter((attempt) => errorTypes[attempt.questionId] === 'knowledge').length;
    const confusionErrors = taggedErrors.filter((attempt) => errorTypes[attempt.questionId] === 'confusion').length;
    const guessErrors = taggedErrors.filter((attempt) => errorTypes[attempt.questionId] === 'guess').length;
    const misreadErrors = taggedErrors.filter((attempt) => errorTypes[attempt.questionId] === 'misread').length;
    const confidentMisses = sample.filter((attempt) => !attempt.isCorrect && ['high', 'certain'].includes(attempt.confidence || '')).length;
    const topicErrors = new Map<string, number>();
    for (const attempt of sample) {
      const topic = (attempt.subtopic || (attempt.subtopicId && attempt.subtopicId !== subject.id ? attempt.subtopicId : '')).trim();
      if (topic && (!attempt.isCorrect || ['guess', 'low'].includes(attempt.confidence || ''))) topicErrors.set(topic, (topicErrors.get(topic) || 0) + 1);
    }
    const weakTopics = [...topicErrors].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([topic]) => topic);
    // FMGE_SUBJECTS carries the app's approximate blueprint weights. Keep the
    // copy explicit that these are priorities, not guaranteed question counts.
    const blueprintWeight = FMGE_BLUEPRINT_MARKS[subject.id] ?? subject.weightage;
    const score = (blueprintWeight / 35) * 0.62 + adjustedWeakness * 0.38
      + Math.min(0.2, knowledgeErrors * 0.035 + confusionErrors * 0.025 + misreadErrors * 0.02 + guessErrors * 0.02 + confidentMisses * 0.025)
      + (weakFromMocks.has(subject.id) ? 0.28 : 0)
      - (strongFromMocks.has(subject.id) ? 0.12 : 0);
    return { id: subject.id, name: subject.name, blueprintWeight, score, accuracy, count: sample.length, uncertain: sample.filter((attempt) => attempt.confidence === 'guess' || attempt.confidence === 'low' || attempt.confidence === 'medium').length, knowledgeErrors, confusionErrors, confidentMisses, weakTopics };
  }).sort((a, b) => b.score - a.score);

  const hasEvidence = recentAttempts.length > 0 || grandTests.length > 0;
  const makeAdaptiveDay = (index: number, selected: typeof ranked, label: string) => {
    const names = selected.map((subject) => subject.name);
    const details = selected.map((subject) => {
      if (subject.count >= 5 && subject.accuracy !== null) return `${subject.name} (${subject.blueprintWeight} blueprint marks; ${Math.round(subject.accuracy * 100)}% raw accuracy${subject.uncertain ? `; ${subject.uncertain} guessed or unsure` : ''}${subject.knowledgeErrors ? `; ${subject.knowledgeErrors} tagged knowledge gaps` : ''}${subject.confusionErrors ? `; ${subject.confusionErrors} tagged option confusions` : ''}${subject.confidentMisses ? `; ${subject.confidentMisses} confident errors` : ''}${subject.weakTopics.length ? `; revisit ${subject.weakTopics.join(', ')}` : ''} across ${subject.count} recent attempts)`;
      if (weakFromMocks.has(subject.id)) return `${subject.name} (flagged weak in a recent mock)`;
      return `${subject.name} (high blueprint weight; gather more answers to calibrate)`;
    });
    return {
      ...SPRINT_DAYS[index],
      title: names.length ? `${label} · ${names.join(' & ')}` : SPRINT_DAYS[index].title,
      subjects: names.length ? selected.map((subject) => subject.id) : SPRINT_DAYS[index].subjects,
      focus: hasEvidence
        ? `Prioritize ${details.join('; ')}. Review missed and guessed questions, then retrieve the key rules without notes.`
        : `Start with high-weight areas: ${names.join(', ')}. Take the baseline set so later revision can target your actual gaps.`,
    };
  };

  const days = [...SPRINT_DAYS];
  for (const index of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17]) {
    const selected = index < 13
      ? ranked.filter((subject) => SPRINT_DAYS[index].subjects.includes(subject.id)).sort((a, b) => b.score - a.score).slice(0, 2)
      : ranked.slice(0, index === 18 ? 3 : 2);
    if (selected.length) days[index] = makeAdaptiveDay(index, selected, hasEvidence ? 'Personalized focus' : 'High-yield focus');
  }
  // Keep diagnostic/checkpoint/mock and exam-eve days intact; those are the structure of the countdown.
  return days;
}

function FmgeSprint({ sprint, attempts, grandTests, onUpdate, onPractice, onOpenGrandTests, loading }: { sprint?: AppState['fmgeSprint']; attempts: McqAttempt[]; grandTests: GrandTest[]; onUpdate: (value: NonNullable<AppState['fmgeSprint']>) => void; onPractice: (subjectId: string, count?: number) => void; onOpenGrandTests: () => void; loading: boolean }) {
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
  const practiceTaskComplete = plan.fullMock
    ? grandTests.some((test) => test.date.startsWith(activePlanDate))
    : todayQuestionAttempts.length >= questionTarget;
  const activeTaskStates = todayTasks.map((_, task) => task === 2 ? practiceTaskComplete : !!sprint?.completedTasks[`${activeDay}-${task}`]);
  const nextTaskIndex = activeTaskStates.findIndex((done) => !done);
  const todayComplete = nextTaskIndex === -1;
  const isDayComplete = (dayIndex: number) => {
    const dayPlan = sprintDays[dayIndex];
    const dayDate = sprintDateForIndex(dayIndex);
    const dayTarget = dayPlan.fullMock ? 300 : dayIndex === 0 ? 50 : Math.max(20, Math.round(dayPlan.questions * hours / 6));
    const questionsDone = attempts.filter((attempt) => attempt.source === 'qbank' && !['NEET-PG', 'INI-CET'].includes(attempt.exam || '') && attempt.timestamp && localDateKey(new Date(attempt.timestamp)) === dayDate && (!dayPlan.subjects.length || dayPlan.subjects.includes(attempt.subjectId))).length >= dayTarget;
    const mockLogged = grandTests.some((test) => test.date.startsWith(dayDate));
    const practiceDone = dayPlan.fullMock ? mockLogged : questionsDone || (dayPlan.checkpoint && mockLogged);
    return [0, 1, 3].every((task) => !!sprint?.completedTasks[`${dayIndex}-${task}`]) && practiceDone;
  };
  const totalDone = sprintDays.reduce((sum, _, dayIndex) => sum + [0, 1, 3].filter((task) => !!sprint?.completedTasks[`${dayIndex}-${task}`]).length + (isDayComplete(dayIndex) ? 1 : 0), 0);
  const totalTasks = SPRINT_DAYS.length * 4;
  const start = () => { onUpdate({ startedOn: localDateKey(), dailyHours: hours, completedTasks: {}, ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}) }); setSelectedDay(0); };
  const toggleTask = (taskIndex: number) => {
    if (!sprint) return;
    const key = `${activeDay}-${taskIndex}`;
    onUpdate({ ...sprint, completedTasks: { ...sprint.completedTasks, [key]: !sprint.completedTasks[key] } });
  };
  const setErrorType = (questionId: string, errorType: SprintErrorType) => {
    if (!sprint) return;
    onUpdate({ ...sprint, errorTypes: { ...(sprint.errorTypes || {}), [questionId]: errorType } });
  };
  const reset = () => { if (confirmReset) { onUpdate({ startedOn: localDateKey(), dailyHours: hours, completedTasks: {}, ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}) }); setSelectedDay(0); setConfirmReset(false); } else setConfirmReset(true); };
  const checklists = todayTasks;

  return <section className="qbank-sprint qbank-panel mt-5 overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_12px_38px_rgba(15,23,42,0.05)] sm:rounded-[30px]">
    <div className="qbank-sprint-head flex flex-col gap-4 bg-[linear-gradient(115deg,#F1F6FF,#FFFFFF_56%,#F8F5FF)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><CalendarDays className="h-5 w-5"/></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold tracking-tight">20-day FMGE sprint</h2><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">Focused plan</span></div><p className="mt-1 text-sm leading-5 text-[#68717E]">A structured last-mile plan: revise, retrieve, practise, then repair mistakes.</p></div></div>
      <div className="flex items-center gap-2 sm:shrink-0">
        {sprint && <div className="mr-1 min-w-20 text-right"><p className="text-lg font-semibold">{Math.round(totalDone / totalTasks * 100)}%</p><p className="text-[10px] text-[#7A818C]">checklist</p></div>}
        <button type="button" onClick={() => setExpanded((v) => !v)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE3ED] bg-white px-4 text-sm font-semibold text-[#2D3745] transition hover:border-blue-300 hover:text-blue-700">{expanded ? 'Close plan' : sprint ? 'Open plan' : 'View plan'}<ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}/></button>
      </div>
    </div>
    {expanded && <div className="border-t border-black/[0.06] p-4 sm:p-6">
      <BlueprintReference />
      {!sprint ? <div className="mx-auto max-w-3xl py-3"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Target className="h-6 w-6"/></div><h3 className="mt-3 text-xl font-semibold tracking-tight">Build a plan around your actual gaps</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6F7782]">The plan uses your recent question attempts and latest mock to move revision time toward weak, high-weight subjects. If you have no history yet, take a short baseline first.</p></div><div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[#E7EAF0] bg-[#FBFCFE] p-4 text-left"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7B8795]">Starting point</p>{latestGrandTest ? <p className="mt-2 text-sm font-semibold text-[#303A48]">Latest mock: {latestGrandTest.score}/300 <span className={latestGrandTest.score >= 150 ? 'text-emerald-700' : 'text-amber-700'}>· {latestGrandTest.score >= 150 ? 'above pass mark' : `${150 - latestGrandTest.score} below pass mark`}</span></p> : <p className="mt-2 text-sm font-semibold text-[#303A48]">{qbankAccuracy === null ? 'No baseline recorded yet' : `${qbankAccuracy}% across ${recentQbankAttempts.length} recent questions`}</p>}<p className="mt-1 text-xs leading-5 text-[#7A8491]">Question accuracy guides subject focus; it is not a predicted exam score.</p>{!latestGrandTest && <button type="button" disabled={loading} onClick={() => onPractice('', 50)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"><BookOpenCheck className="h-4 w-4"/>Take 50-question baseline</button>}</div><div className="rounded-2xl border border-[#E7EAF0] bg-[#FBFCFE] p-4 text-left"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7B8795]">Score target</p><p className="mt-2 text-sm font-semibold text-[#303A48]">150/300 to pass · 165 working target</p><p className="mt-1 text-xs leading-5 text-[#7A8491]">The extra 15 marks are a study buffer, not a guarantee. Choose a daily load you can sustain.</p><label className="mt-3 block"><span className="mb-1.5 block text-xs font-semibold text-[#69717D]">Focused study time per day</span><select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-11 w-full rounded-xl border border-[#E1E6ED] bg-white px-3 text-sm font-medium"><option value={3}>3 hours · compact</option><option value={5}>5 hours · steady</option><option value={6}>6 hours · balanced</option><option value={9}>9 hours · intensive</option><option value={12}>12 hours · full-time</option></select></label></div></div><div className="mt-4 flex justify-center"><button type="button" onClick={start} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0F5FCC]">Start my 20-day plan<ChevronRight className="h-4 w-4"/></button></div></div> : <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-[#737B86]">{daysUntilFmge() === 0 ? 'Exam day · final review plan' : `Day ${currentDay + 1} of 20 · ${daysUntilFmge()} days until FMGE`} · {sprint.dailyHours} focused study hours/day · started {sprint.startedOn}</p><p className="mt-1 text-xs font-semibold text-blue-700">Working toward 165/300 · pass mark 150</p><p className="mt-1 text-[11px] text-[#7A8491]">Priorities use recent subject accuracy, guessed answers and your latest mock weaknesses. Blueprint marks follow the published distribution; priorities also use recent accuracy, confidence, tagged errors and mock weaknesses.</p></div><button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#7A818C] hover:bg-[#F3F5F7] hover:text-[#3F4650]"><RotateCcw className="h-3.5 w-3.5"/>{confirmReset ? 'Tap again to restart' : 'Restart plan'}</button></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Sprint day selector">{sprintDays.map((day, i) => { const done = isDayComplete(i); return <button key={i} type="button" onClick={() => setSelectedDay(i)} aria-current={activeDay === i ? 'step' : undefined} className={`flex h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition ${activeDay === i ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#E5E8ED] bg-white text-[#69717D] hover:border-blue-300'}`}>{done ? <Check className="h-3.5 w-3.5"/> : <span>{i + 1}</span>}</button>; })}</div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-[#E7EAF0] bg-[#FBFCFE] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">Day {activeDay + 1}</p><h3 className="mt-1 text-lg font-semibold tracking-tight">{plan.title}</h3><BlueprintPills subjectIds={plan.subjects}/></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#69717D] ring-1 ring-[#E6EAF0]">{questionTarget} Q target</span></div><p className="mt-2 text-sm leading-6 text-[#69717D]">{plan.focus}</p><div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">{todayComplete ? 'Today’s plan complete' : 'Your next step'}</p><p className="mt-1 text-sm font-semibold text-[#344054]">{todayComplete ? 'Keep the review light and protect your sleep.' : checklists[nextTaskIndex]}</p></div><span className="shrink-0 text-xs font-semibold text-blue-700">{activeTaskStates.filter(Boolean).length}/4</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{width:`${activeTaskStates.filter(Boolean).length/4*100}%`}}/></div></div><div className="mt-3 space-y-2">{checklists.map((item, task) => { const done = activeTaskStates[task]; return <button key={task} type="button" onClick={() => task === 2 ? undefined : toggleTask(task)} aria-pressed={done} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${done ? 'border-emerald-200 bg-emerald-50/70' : task === nextTaskIndex ? 'border-blue-200 bg-white shadow-sm' : 'border-[#E9ECF1] bg-white hover:border-blue-200'} ${task === 2 ? 'cursor-default' : ''}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-[#C9D0DA] bg-white'}`}>{done && <Check className="h-3.5 w-3.5"/>}</span><span className={`text-xs leading-5 ${done ? 'text-emerald-900' : 'text-[#535C68]'}`}>{task === 2 && !plan.fullMock ? `${item} · ${todayQuestionAttempts.length}/${questionTarget} today` : item}</span></button>; })}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row">{plan.fullMock ? <button type="button" onClick={onOpenGrandTests} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-4 text-sm font-semibold text-white transition hover:bg-[#0F5FCC] sm:w-auto"><Target className="h-4 w-4"/>Open full mock tracker<ChevronRight className="h-4 w-4"/></button> : <button type="button" onClick={() => onPractice(plan.subjects[0] || '', Math.min(50, plan.questions))} disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-4 text-sm font-semibold text-white transition hover:bg-[#0F5FCC] disabled:opacity-60 sm:w-auto"><BookOpenCheck className="h-4 w-4"/>{activeDay === 0 ? 'Start 50-question baseline' : `Start ${Math.min(50, plan.questions)}-question set`}<ChevronRight className="h-4 w-4"/></button>}{(activeDay === 16 || activeDay === 18) && <button type="button" onClick={onOpenGrandTests} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE3ED] bg-white px-4 text-sm font-semibold text-[#394353] hover:border-blue-300 hover:text-blue-700"><Target className="h-4 w-4"/>Log full mock score</button>}</div></div>
          <aside className="rounded-2xl border border-[#E7EAF0] bg-white p-4"><h4 className="text-sm font-semibold">Readiness check</h4>{latestGrandTest?<><p className="mt-2 text-2xl font-semibold tracking-tight text-[#263244]">{latestGrandTest.score}<span className="text-sm font-medium text-[#8993A0]"> / 300</span></p><p className={`text-xs font-semibold ${latestGrandTest.score>=165?'text-emerald-700':latestGrandTest.score>=150?'text-amber-700':'text-rose-700'}`}>{latestGrandTest.score>=165?'Above your 165 working target':latestGrandTest.score>=150?'At pass mark; build a safety buffer':`${150-latestGrandTest.score} marks below pass mark`}</p><p className="mt-1 text-[10px] text-[#858C96]">Latest logged mock · exam score is the clearest readiness signal.</p><MockScoreTrend grandTests={grandTests}/></>:<p className="mt-2 text-xs leading-5 text-[#68717E]">No full mock score logged yet. Your question practice will identify subject gaps, but it cannot predict a 300-mark exam result.</p>}{qbankAccuracy!==null&&<div className="mt-3 flex items-center justify-between border-t border-[#EEF0F3] pt-3 text-[11px]"><span className="text-[#737B86]">Recent question accuracy</span><b className="text-[#344054]">{qbankAccuracy}%</b></div>}{recentQbankAttempts.length>0&&<div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-[#EEF0F3] pt-3"><SignalMetric label="Secure correct" value={secureCorrectCount}/><SignalMetric label="Right but unsure" value={unsureCorrectCount}/><SignalMetric label="Confident miss" value={confidentMissCount}/></div>}{recentReviewGaps>0&&<p className="mt-2 text-[11px] leading-5 text-amber-800">{recentReviewGaps} recent misses or unsure answers are feeding your revision priorities.</p>}<SprintErrorReview attempts={recentQbankAttempts} errorTypes={sprint.errorTypes || {}} onSetErrorType={setErrorType}/><h4 className="mt-4 border-t border-[#EEF0F3] pt-3 text-sm font-semibold">How to use the day</h4><ol className="mt-3 space-y-3 text-xs leading-5 text-[#68717E]"><li><b className="text-[#303741]">1. Recall first.</b> Try to retrieve before rereading.</li><li><b className="text-[#303741]">2. Practise timed.</b> Review wrong and guessed answers.</li><li><b className="text-[#303741]">3. Keep a tiny error list.</b> Revisit it tomorrow.</li><li><b className="text-[#303741">4. Protect sleep.</b> Exhaustion makes recall worse.</li></ol><div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">If you fall behind, continue with the next day and carry only your highest-impact weak areas forward. Do not try to “repay” missed hours with an all-nighter.</div><p className="mt-3 text-[10px] leading-4 text-[#858C96]">This plan supports revision; it cannot predict or guarantee an exam result.</p></aside>
        </div>
      </>}
    </div>}
  </section>;
}

function DailyReviewQueue({ items, dueItems, now, loading, onStart }: { items: ReviewQueueItem[]; dueItems: ReviewQueueItem[]; now: number; loading: boolean; onStart: () => void }) {
  const upcoming = items.filter((item) => item.dueAt > now);
  return <section className="qbank-panel mt-5 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:rounded-[28px]">
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Clock3 className="h-5 w-5"/></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold tracking-tight text-[#202630]">Daily review</h2><span className="rounded-full bg-[#F3F4F8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#68717E]">Spaced recall</span></div><p className="mt-1 max-w-2xl text-xs leading-5 text-[#737B86]">Missed or unsure answers return tomorrow. Once recalled confidently, they come back after 3, 7, then 14 days.</p></div></div>
      <div className="flex shrink-0 items-center gap-2"><span className="rounded-xl bg-violet-50 px-3 py-2 text-center"><b className="block text-lg leading-5 text-violet-800">{dueItems.length}</b><span className="text-[10px] font-medium text-violet-700">due now</span></span><span className="rounded-xl bg-[#F5F7FA] px-3 py-2 text-center"><b className="block text-lg leading-5 text-[#344054]">{upcoming.length}</b><span className="text-[10px] font-medium text-[#68717E]">scheduled</span></span></div>
    </div>
    {items.length > 0 && <div className="border-t border-black/[0.055] px-4 py-3 sm:px-5"><div className="flex flex-wrap gap-2">{items.slice(0, 5).map((item) => { const due = item.dueAt <= now; return <span key={item.questionId} className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${due ? 'bg-amber-50 text-amber-900' : 'bg-[#F4F6F9] text-[#68717E]'}`}><span className="max-w-[180px] truncate">{item.subjectName}</span><span className="opacity-70">·</span>{due ? 'Due' : new Date(item.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>; })}{items.length > 5 && <span className="self-center text-[11px] text-[#858C96]">+{items.length - 5} more</span>}</div></div>}
    <div className="flex flex-col gap-3 border-t border-black/[0.055] bg-[#FBFCFE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-xs leading-5 text-[#68717E]">{items.length === 0 ? 'No review cards yet. Practice a set and mark your confidence to build this queue.' : dueItems.length === 0 ? `You’re clear for today. ${upcoming.length} question${upcoming.length === 1 ? ' is' : 's are'} scheduled for a later review.` : `${dueItems.length} question${dueItems.length === 1 ? '' : 's'} ready for retrieval practice.`}</p><button type="button" disabled={loading || dueItems.length === 0} onClick={onStart} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5B4BC4] px-4 text-xs font-semibold text-white transition hover:bg-[#4F40B2] disabled:cursor-not-allowed disabled:opacity-45"><RotateCcw className="h-3.5 w-3.5"/>Start due review<ChevronRight className="h-3.5 w-3.5"/></button></div>
  </section>;
}

const FMGE_BLUEPRINT_GROUPS = [
  { title: 'Pre-clinical & para-clinical · 100 marks', rows: [['Anatomy', 17], ['Physiology', 17], ['Biochemistry', 17], ['Pathology', 13], ['Microbiology', 13], ['Pharmacology', 13], ['Forensic Medicine', 10]] as Array<[string, number]> },
  { title: 'Clinical · 200 marks', rows: [['Medicine', 33], ['Psychiatry', 5], ['Dermatology & STD', 5], ['Radiotherapy', 5], ['General Surgery', 32], ['Anesthesiology', 5], ['Orthopedics', 5], ['Radiodiagnosis', 5], ['Pediatrics', 15], ['Ophthalmology', 15], ['Otorhinolaryngology', 15], ['Obstetrics & Gynecology', 30], ['Community Medicine', 30]] as Array<[string, number]> },
];

function BlueprintReference() {
  return <details className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 sm:p-4"><summary className="cursor-pointer list-none text-sm font-semibold text-[#263244]"><span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-blue-700"/> Official FMGE subject blueprint <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700">300 marks</span></span><span className="mt-1 block text-xs font-normal text-[#69717D]">See the official subject-wise marks and how the sprint uses them.</span></summary><div className="mt-4 grid gap-4 md:grid-cols-2">{FMGE_BLUEPRINT_GROUPS.map((group) => <section key={group.title} className="rounded-xl border border-white bg-white/80 p-3"><h3 className="text-xs font-bold text-[#344054]">{group.title}</h3><ul className="mt-2 space-y-1.5">{group.rows.map(([name, marks]) => <li key={name} className="flex items-center justify-between gap-3 text-xs text-[#586273]"><span>{name}</span><b className="shrink-0 font-semibold text-[#263244]">{marks} marks</b></li>)}</ul></section>)}</div><div className="mt-3 rounded-xl bg-white/75 p-3 text-xs leading-5 text-[#586273]"><b className="text-[#344054]">Exam pattern:</b> 300 single-best-answer MCQs in two parts of 150 questions and 150 minutes each, with a scheduled break. Each correct answer is worth 1 mark, there is no negative marking, and 150/300 is the qualifying score. The blueprint is the published distribution, not a promise that each individual paper follows an exact subject count. Answer every question in the real exam.<p className="mt-2">The plan weights revision by this blueprint, then adjusts toward your recent answers, confidence, tagged errors and mock weak subjects. Question-bank counts are not used to infer NBE frequency because this imported archive is uneven and contains duplicate questions.</p><p className="mt-2">Radiotherapy is a separate 5-mark blueprint entry but is not currently a separate filter in this question bank. These figures come from the latest official FMGE bulletin available to this implementation (June 2026); check the October 2026 bulletin for any updated instructions.</p><a className="mt-2 inline-flex font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-900" href="https://nbe.edu.in/IB/FMGE%20JUNE%202026%20information%20bulletin.pdf#page=98" target="_blank" rel="noreferrer">NBEMS June 2026 Information Bulletin · scheme and syllabus</a></div></details>;
}

function BlueprintPills({ subjectIds }: { subjectIds: string[] }) {
  const subjects = subjectIds.map((id) => FMGE_SUBJECTS.find((subject) => subject.id === id)).filter(Boolean);
  if (!subjects.length) return null;
  return <div className="mt-2 flex flex-wrap gap-1.5">{subjects.map((subject) => <span key={subject!.id} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{subject!.name} · {FMGE_BLUEPRINT_MARKS[subject!.id] ?? subject!.weightage} blueprint marks</span>)}</div>;
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
    return <details className="mt-4 border-t border-[#EEF0F3] pt-3"><summary className="cursor-pointer text-xs font-semibold text-[#303741]">Tag why you missed it <span className="font-normal text-[#7A8491]">· improves upcoming focus</span></summary><div className="mt-3 space-y-2">{rows.map((attempt) => { const subject = FMGE_SUBJECTS.find((item) => item.id === attempt.subjectId)?.name || attempt.subjectId; const tag = errorTypes[attempt.questionId]; return <div key={attempt.questionId} className="rounded-xl bg-[#F8FAFC] p-2.5"><div className="mb-2 flex items-center justify-between gap-2 text-[10px]"><span className="truncate font-semibold text-[#485363]">{subject}{attempt.subtopic ? ` · ${attempt.subtopic}` : ''}</span><span className="shrink-0 text-[#858C96]">{new Date(attempt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div><div className="grid grid-cols-2 gap-1.5">{labels.map(({ id, label }) => <button key={id} type="button" aria-pressed={tag === id} onClick={() => onSetErrorType(attempt.questionId, id)} className={`min-h-8 rounded-lg px-2 text-[10px] font-medium transition ${tag === id ? 'bg-blue-600 text-white' : 'bg-white text-[#66707D] ring-1 ring-[#E5E8ED] hover:ring-blue-300'}`}>{label}</button>)}</div></div>; })}</div></details>;
}

function SignalMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-[#F8FAFC] px-2 py-2 text-center"><b className="block text-sm font-semibold text-[#344054]">{value}</b><span className="mt-0.5 block text-[9px] leading-3 text-[#737B86]">{label}</span></div>;
}

function MockScoreTrend({ grandTests }: { grandTests: GrandTest[] }) {
  const recent = [...grandTests].sort((a, b) => a.date.localeCompare(b.date)).slice(-6);
  if (!recent.length) return null;
  return <div className="mt-3 rounded-xl border border-[#EEF0F3] bg-[#FBFCFE] p-3"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#737B86]">Mock score trend</p><p className="text-[10px] text-[#8993A0]">out of 300</p></div><div className="relative mt-3 flex h-24 items-end justify-around gap-2" role="img" aria-label={`Recent mock scores: ${recent.map((test) => `${test.score} out of 300`).join(', ')}`}><div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-400/70" style={{bottom:'50%'}}/><div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-blue-400/70" style={{bottom:'55%'}}/>{recent.map((test) => <div key={test.id} className="relative z-[1] flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[9px] font-semibold text-[#455064]">{test.score}</span><div className={`w-full max-w-6 rounded-t-md transition-all ${test.score>=165?'bg-emerald-500':test.score>=150?'bg-amber-400':'bg-blue-500'}`} style={{height:`${Math.max(5,Math.min(100,test.score/300*100))}%`}}/><span className="text-[9px] text-[#8993A0]">{new Date(`${test.date}T12:00:00`).toLocaleDateString(undefined,{month:'numeric',day:'numeric'})}</span></div>)}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#77818E]"><span><i className="mr-1 inline-block w-3 border-t border-dashed border-amber-500 align-middle"/>150 pass mark</span><span><i className="mr-1 inline-block w-3 border-t border-dashed border-blue-500 align-middle"/>165 working target</span></div></div>;
}

function Stat({label,value,icon,tone,reduceMotion}:{label:string;value:string;icon:React.ReactNode;tone:'blue'|'violet';reduceMotion:boolean}) { return <motion.div whileHover={reduceMotion?undefined:{y:-2}} transition={{type:'spring',stiffness:350,damping:24}} className={`qbank-stat qbank-stat-${tone} min-w-0 rounded-xl border border-white/80 bg-white/75 px-3.5 py-3 shadow-sm sm:min-w-[128px] sm:rounded-2xl sm:px-4`}><p className="flex items-center gap-1.5 text-[11px] font-medium text-[#838B97]"><span className="qbank-stat-icon flex h-5 w-5 items-center justify-center rounded-md [&>svg]:h-3 [&>svg]:w-3">{icon}</span>{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-[#252A32]">{value}</p></motion.div>; }
function SelectField({label,children}:{label:string;children:React.ReactNode}) { return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#69717D]">{label}</span><span className="relative block"><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A818C]"><ChevronDown className="h-4 w-4"/></span>{React.cloneElement(children as React.ReactElement<any>,{className:'h-12 w-full appearance-none rounded-xl border border-[#E4E8EE] bg-[#FAFBFC] px-3 pr-9 text-sm font-medium text-[#242A33] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10'})}</span></label>; }
function FeatureNote({icon,title,body,tone}:{icon:React.ReactNode;title:string;body:string;tone:'blue'|'violet'|'green'}) { return <div className={`qbank-feature qbank-feature-${tone} flex items-center gap-3 px-4 py-3.5 sm:px-5`}><div className="qbank-feature-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4">{icon}</div><div className="min-w-0"><h3 className="text-xs font-semibold text-[#303A48]">{title}</h3><p className="mt-0.5 text-[11px] leading-4 text-[#7B8490]">{body}</p></div></div>; }

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
  return <section className="qbank-explanation overflow-hidden rounded-2xl border border-[#E3EAF4] bg-white shadow-[0_8px_26px_rgba(30,64,110,0.05)]">
    <div className="flex items-start gap-3 border-b border-[#ECF0F5] px-4 py-4 sm:px-5"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpenCheck className="h-4 w-4"/></div><div><p className="text-sm font-semibold text-[#212936]">Why this is the answer</p><p className="mt-0.5 text-xs leading-5 text-[#657181]">{correctAnswer}</p></div></div>
    {review.sourceExplanationAvailable === false ? <p className="px-4 py-4 text-sm leading-6 text-[#5F6B7A] sm:px-5">The source did not include a rationale. Ask Gemini for a focused explanation based on the question and answer key.</p> : <div className="space-y-4 px-4 py-4 sm:px-5">
      {parsed.paragraphs.length > 0 ? parsed.paragraphs.map((paragraph, index) => <p key={index} className="max-w-[72ch] text-sm leading-7 text-[#3F4957]">{paragraph}</p>) : <p className="text-sm leading-7 text-[#3F4957]">Review the key clues and option comparison below.</p>}
      {parsed.keyPoints.length > 0 && <div className="rounded-xl bg-[#F5F8FC] p-3.5 sm:p-4"><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#617187]">Key clues to remember</h4><ul className="space-y-2">{parsed.keyPoints.map((point, i) => <li key={i} className="flex gap-2.5 text-sm leading-6 text-[#465365]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"/>{point}</li>)}</ul></div>}
      {parsed.optionReasons.length > 0 && <details className="group rounded-xl border border-[#E8EDF3] bg-[#FBFCFE] px-3.5 py-3"><summary className="cursor-pointer list-none text-sm font-semibold text-[#465365] marker:hidden">Why the other choices don’t fit<span className="float-right text-[#8692A2] transition-transform group-open:rotate-180">⌄</span></summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{parsed.optionReasons.map((option) => <div key={option.key} className="rounded-lg bg-white p-3 text-xs leading-5 text-[#556171]"><b className="mr-1 text-[#303A48]">{option.key}.</b>{option.reason}</div>)}</div></details>}
    </div>}
    <div className="border-t border-[#ECF0F5] px-4 py-2.5 text-[11px] font-medium text-[#8993A0] sm:px-5">Source: {review.source}, page {review.sourcePage}</div>
  </section>;
}

function GeminiReviewPanel({ correct, tutor, loading, error, onRequest }: { correct: boolean; tutor: TutorReview | null; loading: boolean; error: string; onRequest: () => void }) {
  const [showRetrievalAnswer, setShowRetrievalAnswer] = useState(false);
  useEffect(() => setShowRetrievalAnswer(false), [tutor]);
  return <section className="qbank-gemini overflow-hidden rounded-2xl border border-violet-200/80 bg-[linear-gradient(145deg,#F8F6FF,#FFFFFF_68%,#F3F8FF)]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100/80 px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><MessageSquareText className="h-4 w-4"/></div><div><h3 className="text-sm font-semibold text-[#30254A]">Personalized mistake review</h3><p className="text-[11px] text-[#756C86]">A new way to reason through the question—not a repeat of the source rationale</p></div></div><span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">Study review</span></div>
    <div aria-live="polite" className="p-4 sm:p-5">
      {tutor ? <div className="space-y-4">
        <section><h4 className="text-[11px] font-bold uppercase tracking-wide text-violet-800">{correct ? 'What your reasoning got right' : 'Why your choice was tempting'}</h4><p className="mt-1.5 max-w-[72ch] text-sm leading-7 text-[#464052]">{tutor.learnerChoiceInsight}</p></section>
        <section className="rounded-xl border border-violet-100 bg-white/80 p-3.5 sm:p-4"><h4 className="text-[10px] font-bold uppercase tracking-wide text-violet-800">Decision rule for next time</h4><p className="mt-1.5 text-sm font-medium leading-6 text-[#38334A]">{tutor.decisionRule}</p></section>
        <section className="rounded-xl border border-[#DCEAFE] bg-[#F5F9FF] p-3.5 sm:p-4"><h4 className="text-[10px] font-bold uppercase tracking-wide text-[#38699E]">Quick recall · answer before revealing</h4><p className="mt-1.5 text-sm leading-6 text-[#344054]">{tutor.retrievalQuestion}</p><button type="button" aria-expanded={showRetrievalAnswer} onClick={() => setShowRetrievalAnswer((visible) => !visible)} className="mt-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100/70">{showRetrievalAnswer ? 'Hide answer' : 'Reveal answer'}</button>{showRetrievalAnswer && <p className="mt-1 border-t border-blue-100 pt-2 text-sm leading-6 text-[#344054]">{tutor.retrievalAnswer}</p>}</section>
        <details className="group rounded-xl border border-violet-100 bg-white/65 px-3.5 py-3"><summary className="cursor-pointer list-none text-xs font-semibold text-[#574A70] marker:hidden">Compare all four options<span className="float-right text-[#8692A2] transition-transform group-open:rotate-180">⌄</span></summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...tutor.optionAnalysis].sort((a,b)=>a.key.localeCompare(b.key)).map((option)=><div key={option.key} className={`rounded-xl border p-3 ${option.verdict === 'correct' ? 'border-emerald-200 bg-emerald-50/70' : 'border-violet-100/70 bg-white/80'}`}><p className="text-xs font-semibold text-[#344054]">{option.key} · {option.verdict === 'correct' ? 'Best answer' : 'Why it misses'}</p><p className="mt-1 text-xs leading-5 text-[#555365]">{option.reason}</p></div>)}</div></details>
        <section className="grid gap-2 sm:grid-cols-3">{[['Exam trap',tutor.examTrap],['Memory hook',tutor.memoryAid],['Clinical pearl',tutor.clinicalPearl]].map(([title,body])=><div key={title} className="rounded-xl border border-white/70 bg-white/75 p-3"><h4 className="text-[10px] font-bold uppercase tracking-wide text-violet-800">{title}</h4><p className="mt-1 text-xs leading-5 text-[#4D4A56]">{body}</p></div>)}</section><p className="text-[10px] leading-4 text-[#85808E]">Gemini-generated teaching synthesis. Check clinical decisions against current trusted references.</p></div> : <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-[#655D73]">{loading ? 'Gemini is building a review around your choice and confidence…' : error || (correct ? 'Want a fresh decision rule and recall check?' : 'Preparing your personalized missed-question review…')}</p><button type="button" onClick={onRequest} disabled={loading} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60">{loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : <MessageSquareText className="h-3.5 w-3.5"/>}{error ? 'Try Gemini again' : 'Build study review'}</button></div>}
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

  const requestTutorReview=async()=>{
    if (tutorLoading || tutor) return;
    setTutorLoading(true); setTutorError('');
    try {
      const data = await responseJson(await apiFetch('/api/question-bank/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q.id,sessionId})}));
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
      if(!data.correct) await requestTutorReview();
    } catch(err:any) { setTutorError(err.message||'Could not submit this answer.'); }
    finally { setLoading(false); }
  };

  const next=()=>{if(index+1>=questions.length){setFinished(true);return;}setIndex((v)=>v+1);setChoice('');setConfidence('low');setReview(null);setTutor(null);setTutorError('');setSelectedSubtopic('');startedAt.current=Date.now();};
  const close=()=>{document.body.style.overflow='';onClose();};
  const correctCount=Object.values(answered).filter(a=>a.correct).length;
  const reviewGapCount=Object.values(answered).filter(a=>!a.correct||a.confidence!=='high').length;
  const answerText=q.options.find((option)=>option.key===review?.correctAnswer)?.text || '';

  return createPortal(<AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="qbank-session fixed inset-0 z-[9500] overflow-y-auto bg-[#F4F6F9] text-[#1D1D1F]">
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col">
      <header className="qbank-session-header sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.07] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#89919C]">{sessionLabel} · {q.exam} · {q.year || 'Year not listed'} · {q.subjectName}</p><p className="mt-0.5 text-sm font-semibold">Question {index+1} <span className="font-normal text-[#838B97]">of {questions.length}</span></p></div><button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F3F5] text-[#525A65] transition hover:bg-[#E8EBEF]" aria-label="Close practice"><X className="h-4 w-4"/></button></header>
      <div className="h-1 bg-[#E5E9EF]"><div className="h-full bg-[#1769E0] transition-all duration-500" style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
      {finished?<main className="m-auto w-full max-w-lg p-5 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600"><BookOpenCheck className="h-7 w-7"/></div><h2 className="mt-5 text-2xl font-semibold tracking-tight">{sessionLabel} complete</h2><p className="mt-2 text-sm text-[#737B86]">{correctCount} correct out of {Object.keys(answered).length} answered.</p>{reviewGapCount>0&&<div className="mx-auto mt-4 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left"><p className="text-sm font-semibold text-amber-950">{reviewGapCount} question{reviewGapCount===1?'':'s'} to revisit</p><p className="mt-1 text-xs leading-5 text-amber-900">Missed, guessed, and unsure answers are saved as review gaps, even when correct. Start with these in your next revision block.</p></div>}<button onClick={close} className="mt-6 h-12 rounded-2xl bg-[#1769E0] px-6 text-sm font-semibold text-white">Done</button></main>:<main className="w-full flex-1 px-3 py-5 sm:px-6 sm:py-8">
        <article className="qbank-question-card rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_14px_42px_rgba(30,50,80,0.07)] sm:rounded-[28px] sm:p-6"><div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{q.subjectName}</span><span className="qbank-year-pill inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold">{q.year ? `${q.exam} ${q.year}` : 'Year not listed in source'}</span>{q.isImageBased&&<span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700"><ImageIcon className="h-3 w-3"/> Image question</span>}</div><h1 className="whitespace-pre-wrap text-[17px] font-semibold leading-[1.6] tracking-[-0.015em] text-[#202833] sm:text-lg">{q.stem}</h1>
          {figures.map((figure,index)=><button key={`${q.id}-figure-${index}`} type="button" onClick={()=>setImageOpen(index)} className="qbank-figure mt-5 block max-h-[min(52vh,500px)] w-full overflow-hidden rounded-2xl border border-[#E6EAF0] bg-[#F7F8FA] text-left"><img src={figure} alt={`Question figure${figures.length>1?` ${index+1}`:''}`} className="mx-auto max-h-[min(52vh,500px)] max-w-full object-contain" loading="lazy"/><span className="block border-t border-black/[0.06] px-3 py-2.5 text-center text-xs font-medium text-[#707985]">{figures.length>1?`Figure ${index+1} of ${figures.length} · `:''}Tap to view larger</span></button>)}
          <div className="mt-5 space-y-2">{q.options.map((option)=><button key={option.key} disabled={Boolean(review)||loading} onClick={()=>setChoice(option.key)} className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition duration-200 sm:px-4 ${review&&option.key===review.correctAnswer?'border-emerald-300 bg-emerald-50/80':review&&option.key===choice?'border-rose-300 bg-rose-50/80':choice===option.key?'border-blue-300 bg-blue-50/80':'border-[#E7EAF0] bg-[#FCFCFD] hover:border-blue-200 hover:bg-blue-50/40'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${review&&option.key===review.correctAnswer?'bg-emerald-600 text-white':review&&option.key===choice?'bg-rose-600 text-white':choice===option.key?'bg-blue-600 text-white':'bg-[#EEF1F5] text-[#596270]'}`}>{option.key}</span><span className="pt-0.5 text-sm leading-6 text-[#343A44]">{option.text}</span>{review&&option.key===review.correctAnswer&&<span className="ml-auto pt-1 text-xs font-semibold text-emerald-700">Correct</span>}</button>)}</div>
          {!review?<><fieldset className="mt-4"><legend className="mb-2 text-xs font-semibold text-[#69717D]">How sure are you? This helps choose what to revisit.</legend><div className="grid grid-cols-3 gap-2">{([{value:'guess',label:'Guessed'},{value:'low',label:'Unsure'},{value:'high',label:'Confident'}] as const).map((item)=><button key={item.value} type="button" aria-pressed={confidence===item.value} onClick={()=>setConfidence(item.value)} className={`min-h-10 rounded-xl border px-2 text-xs font-semibold transition ${confidence===item.value?'border-blue-300 bg-blue-50 text-blue-800':'border-[#E7EAF0] bg-white text-[#68717E] hover:border-blue-200'}`}>{item.label}</button>)}</div></fieldset>{availableTopics.length>0&&<details className="mt-3 rounded-xl border border-[#E7EAF0] bg-[#FBFCFE] px-3 py-2.5"><summary className="cursor-pointer text-xs font-semibold text-[#596270]">Tag the tested topic <span className="font-normal text-[#8A929D]">· optional, learner-selected</span></summary><p className="mt-2 text-[11px] leading-4 text-[#7A8491]">Choose only if you recognize the main concept. This is not automatically inferred from the question.</p><select value={selectedSubtopic} onChange={(event)=>setSelectedSubtopic(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#E1E6ED] bg-white px-3 text-xs text-[#344054]"><option value="">Leave untagged</option>{availableTopics.map((topic)=><option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></details>}<button type="button" disabled={!choice||loading} onClick={submit} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1769E0] text-sm font-semibold text-white shadow-[0_5px_14px_rgba(23,105,224,0.18)] transition hover:bg-[#0F5FCC] disabled:opacity-45 sm:w-auto sm:px-7">{loading?<><LoaderCircle className="h-4 w-4 animate-spin"/>Checking answer…</>:'Check answer'}{!loading&&<ChevronRight className="h-4 w-4"/>}</button>{tutorError&&<p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">{tutorError}</p>}</>:<div className="qbank-review mt-6 space-y-4" ref={(node)=>node&&node.scrollIntoView({behavior:'smooth',block:'nearest'})}>
            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${review.correct?'border-emerald-200 bg-emerald-50/80':'border-rose-200 bg-rose-50/80'}`}><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${review.correct?'bg-emerald-600 text-white':'bg-rose-600 text-white'}`}>{review.correct?<Check className="h-4 w-4"/>:<CircleHelp className="h-4 w-4"/>}</div><div><p className={`text-sm font-semibold ${review.correct?'text-emerald-950':'text-rose-950'}`}>{review.correct?'That’s correct.':`Not quite — the correct answer is ${review.correctAnswer}.`}</p>{answerText&&<p className="mt-1 text-xs leading-5 text-[#5F6B78]">{answerText}</p>}</div></div>
            <SourceExplanation review={review} correctAnswer={answerText} />
            {tutor||tutorLoading||tutorError?<GeminiReviewPanel correct={review.correct} tutor={tutor} loading={tutorLoading} error={tutorError} onRequest={requestTutorReview}/>:<button type="button" onClick={requestTutorReview} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100"><MessageSquareText className="h-3.5 w-3.5"/>Ask Gemini to compare all options</button>}
            <button type="button" onClick={next} disabled={loading||tutorLoading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1769E0] text-sm font-semibold text-white shadow-[0_5px_14px_rgba(23,105,224,0.18)] transition hover:bg-[#0F5FCC] disabled:opacity-55 sm:w-auto sm:px-7">{index+1===questions.length?'Finish set':'Next question'}<ChevronRight className="h-4 w-4"/></button>
          </div>}
        </article><p className="mt-3 text-center text-[11px] text-[#959BA4]">{q.exam}{q.year?` · ${q.year}`:' · year not listed'} · {q.source} · page {q.sourcePage}</p>
      </main>}
    </div>
    {imageOpen!==null&&figures[imageOpen]&&<div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/90 p-3" onClick={()=>setImageOpen(null)}><button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Close image"><X className="h-5 w-5"/></button>{figures.length>1&&<><button type="button" onClick={(e)=>{e.stopPropagation();setImageOpen((imageOpen+figures.length-1)%figures.length);}} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Previous figure"><ChevronLeft className="h-5 w-5"/></button><span className="absolute bottom-5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">Figure {imageOpen+1} of {figures.length}</span><button type="button" onClick={(e)=>{e.stopPropagation();setImageOpen((imageOpen+1)%figures.length);}} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Next figure"><ChevronRight className="h-5 w-5"/></button></>}<img src={figures[imageOpen]} alt={`Enlarged question figure${figures.length>1?` ${imageOpen+1}`:''}`} onClick={(e)=>e.stopPropagation()} className="max-h-[92dvh] max-w-[96vw] object-contain"/></div>}
  </motion.div></AnimatePresence>, document.body);
}
