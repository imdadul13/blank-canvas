import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BookOpenCheck, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Image as ImageIcon, LoaderCircle, RefreshCw, RotateCcw, Sparkles, Target, X } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import type { AppState } from '../types';

type Exam = 'FMGE' | 'NEET-PG' | 'INI-CET';
type BankQuestion = { id: string; exam: Exam; year: number | null; subjectId: string; subjectName: string; topicName: string; stem: string; options: Array<{key: string; text: string}>; imageUrl: string | null; imageUrls: string[]; source: string; sourcePage: number; isImageBased: boolean };
type Facets = { exams: Exam[]; subjects: Array<{id: string; name: string; count: number}>; years: number[]; count: number; imageCount: number };
type Review = { correct: boolean; correctAnswer: string; explanation: string; sourceExplanationAvailable?: boolean; source: string; sourcePage: number };
type TutorReview = { whyIncorrect: string; optionAnalysis: Array<{key: string; verdict: string; reason: string}>; examTrap: string; memoryAid: string; clinicalPearl: string; aiGenerated: boolean };

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not reach the question bank.');
  return data;
}

export const QuestionBankView: React.FC<{
  onRecordAttempt: (attempt: NewMcqAttemptInput) => unknown;
  sprint?: AppState['fmgeSprint'];
  onUpdateSprint: (sprint: NonNullable<AppState['fmgeSprint']>) => void;
  onOpenGrandTests: () => void;
}> = ({ onRecordAttempt, sprint, onUpdateSprint, onOpenGrandTests }) => {
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

  const selectedSubject = useMemo(() => facets?.subjects.find((item) => item.id === subjectId), [facets, subjectId]);
  const startSession = async (override?: { exam: Exam; subjectId: string; year?: string; imageMode: 'all'|'image'|'standard'; count: number }) => {
    setLoading(true); setError('');
    try {
      const data = await responseJson(await apiFetch('/api/question-bank/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(override || { exam, subjectId, year: year || null, imageMode, count }) }));
      setQuestions(data.questions); setSessionId(data.sessionId);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <div data-accent="practice" className="qbank-root mx-auto w-full max-w-7xl px-3 pb-28 pt-5 font-sans text-[var(--text-primary,#1D1D1F)] sm:px-6 sm:pb-20 lg:px-8">
    <motion.div initial={reducedMotion ? false : {opacity:0,y:8}} animate={{opacity:1,y:0}} className="qbank-banner relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-[linear-gradient(130deg,#F4F8FF_0%,#FFFFFF_60%,#F6F4FF_100%)] p-5 shadow-[0_18px_55px_rgba(26,53,99,0.08)] sm:rounded-[34px] sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-16 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/75 px-3 py-1.5 text-xs font-semibold text-blue-700"><BookOpenCheck className="h-3.5 w-3.5"/> Question bank</div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[#15171B] sm:text-4xl">Practice with purpose.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#68717E] sm:text-base">Subject-wise questions from your licensed exam collections, with image cases and step-by-step review.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <Stat label="Questions" value={facets ? facets.count.toLocaleString() : '—'} />
          <Stat label="Image cases" value={facets ? facets.imageCount.toLocaleString() : '—'} />
        </div>
      </div>
    </motion.div>

    <FmgeSprint sprint={sprint} onUpdate={onUpdateSprint} onPractice={(subjectId) => startSession({ exam: 'FMGE', subjectId, year: '', imageMode: 'all', count: 20 })} onOpenGrandTests={onOpenGrandTests} loading={loading} />

    <section className="qbank-panel mt-5 rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:mt-6 sm:rounded-[28px] sm:p-6">
      <div className="flex flex-col gap-1"><h2 className="text-lg font-semibold tracking-tight">Build a practice set</h2><p className="text-sm text-[#7A818C]">Choose an exam, then focus on one subject or mix the full paper.</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField label="Exam"><select value={exam} onChange={(e) => { setExam(e.target.value as Exam); setYear(''); }}><option>FMGE</option><option>NEET-PG</option><option>INI-CET</option></select></SelectField>
        <SelectField label="Subject"><select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">All subjects</option>{facets?.subjects.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.count.toLocaleString()}</option>)}</select></SelectField>
        <SelectField label="Year"><select value={year} onChange={(e) => setYear(e.target.value)}><option value="">Any year</option>{facets?.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></SelectField>
        <SelectField label="Question type"><select value={imageMode} onChange={(e) => setImageMode(e.target.value as any)}><option value="all">All questions</option><option value="image">Image questions</option><option value="standard">Text questions</option></select></SelectField>
        <SelectField label="Set length"><select value={count} onChange={(e) => setCount(Number(e.target.value))}><option value={5}>5 questions</option><option value={10}>10 questions</option><option value={20}>20 questions</option><option value={50}>50 questions</option></select></SelectField>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs leading-5 text-[#7A818C]"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#8A94A3]"/><span>Answers stay hidden until you commit. Missed questions get an AI tutor review with option analysis, exam traps and memory aids.</span></div>
        <button type="button" onClick={() => startSession()} disabled={loading || !facets?.count} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1769E0] px-5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(23,105,224,0.23)] transition hover:bg-[#0F5FCC] disabled:cursor-not-allowed disabled:opacity-55">{loading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <BookOpenCheck className="h-4 w-4"/>} Start practice <ChevronRight className="h-4 w-4"/></button>
      </div>
      {selectedSubject && <p className="mt-3 text-xs font-medium text-[#7A818C]">{selectedSubject.count.toLocaleString()} {exam} questions for {selectedSubject.name}.</p>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </section>

    <div className="mt-5 grid gap-3 md:grid-cols-3">
      <InfoCard icon={<ImageIcon/>} title="Image-based learning" body="Radiology, anatomy, pathology and clinical-photo questions stay paired with their source figures."/>
      <InfoCard icon={<Sparkles/>} title="Learn from every miss" body="The answer key is preserved from the source; Gemini explains the distractors and common exam traps."/>
      <InfoCard icon={<Clock3/>} title="Progress that counts" body="Attempts feed the same subject-level performance and error tracking as the rest of OneShot."/>
    </div>
    <QuestionSession key={sessionId} questions={questions} sessionId={sessionId} onClose={() => setQuestions([])} onRecordAttempt={onRecordAttempt}/>
  </div>;
};

const SPRINT_DAYS = [
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
  { title: 'Short subjects', subjects: ['dermatology', 'psychiatry', 'orthopedics', 'radiology', 'anesthesia'], focus: 'Recognize classic images, emergency actions, common drugs and frequently confused pairs.', questions: 60 },
  { title: 'Mixed test · diagnose your gaps', subjects: [], focus: 'Timed mixed set, then review every miss. Use this result to choose the next revision blocks.', questions: 100 },
  { title: 'Medicine & surgery · weak areas', subjects: ['medicine', 'surgery'], focus: 'Return to your lowest-scoring systems and redo missed questions without notes first.', questions: 70 },
  { title: 'OBG, pediatrics & PSM · weak areas', subjects: ['obg', 'pediatrics', 'psm'], focus: 'Revise algorithms, thresholds, vaccine schedules and preventive-care concepts you missed.', questions: 70 },
  { title: 'Preclinical & paraclinical recall', subjects: ['anatomy', 'physiology', 'biochemistry', 'pathology', 'pharmacology', 'microbiology'], focus: 'Use active recall: pathways, mechanisms, organisms, images, antidotes and close differentials.', questions: 80 },
  { title: 'Full-length mock & careful review', subjects: [], focus: 'Simulate exam conditions. Review the reasoning behind wrong and guessed answers; do not just check the score.', questions: 150 },
  { title: 'Repair the final gaps', subjects: [], focus: 'Target the three weakest subjects from your mock; finish image questions and revisit your error list.', questions: 80 },
  { title: 'Rapid recall & rest', subjects: [], focus: 'Review concise notes, formulas, images and personal mistakes. Stop heavy study early and protect sleep.', questions: 30 },
];

function localDateKey(date = new Date()) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
function sprintDayIndex(startedOn: string) { const start = new Date(`${startedOn}T12:00:00`); const today = new Date(`${localDateKey()}T12:00:00`); return Math.min(19, Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000))); }

function FmgeSprint({ sprint, onUpdate, onPractice, onOpenGrandTests, loading }: { sprint?: AppState['fmgeSprint']; onUpdate: (value: NonNullable<AppState['fmgeSprint']>) => void; onPractice: (subjectId: string) => void; onOpenGrandTests: () => void; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hours, setHours] = useState(sprint?.dailyHours || 6);
  const [confirmReset, setConfirmReset] = useState(false);
  const currentDay = sprint ? sprintDayIndex(sprint.startedOn) : 0;
  const activeDay = selectedDay ?? currentDay;
  const plan = SPRINT_DAYS[activeDay];
  const totalDone = Object.values(sprint?.completedTasks || {}).filter(Boolean).length;
  const totalTasks = SPRINT_DAYS.length * 4;
  const start = () => { onUpdate({ startedOn: localDateKey(), dailyHours: hours, completedTasks: {} }); setSelectedDay(0); };
  const toggleTask = (taskIndex: number) => {
    if (!sprint) return;
    const key = `${activeDay}-${taskIndex}`;
    onUpdate({ ...sprint, completedTasks: { ...sprint.completedTasks, [key]: !sprint.completedTasks[key] } });
  };
  const reset = () => { if (confirmReset) { onUpdate({ startedOn: localDateKey(), dailyHours: hours, completedTasks: {} }); setSelectedDay(0); setConfirmReset(false); } else setConfirmReset(true); };
  const checklists = [
    `Focused revision (${Math.max(1, Math.round(hours * 0.45))} h): ${plan.focus}`,
    `Active recall (${Math.max(1, Math.round(hours * 0.2))} h): close the notes and retrieve key facts from memory.`,
    `Question practice: aim for ${plan.questions} questions; today's button starts a focused set of 20.`,
    'Error review: explain each miss, write the corrected rule, and revisit it tomorrow.',
  ];

  return <section className="qbank-sprint qbank-panel mt-5 overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_12px_38px_rgba(15,23,42,0.05)] sm:rounded-[30px]">
    <div className="qbank-sprint-head flex flex-col gap-4 bg-[linear-gradient(115deg,#F1F6FF,#FFFFFF_56%,#F8F5FF)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><CalendarDays className="h-5 w-5"/></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold tracking-tight">20-day FMGE sprint</h2><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">Focused plan</span></div><p className="mt-1 text-sm leading-5 text-[#68717E]">A structured last-mile plan: revise, retrieve, practise, then repair mistakes.</p></div></div>
      <div className="flex items-center gap-2 sm:shrink-0">
        {sprint && <div className="mr-1 min-w-20 text-right"><p className="text-lg font-semibold">{Math.round(totalDone / totalTasks * 100)}%</p><p className="text-[10px] text-[#7A818C]">checklist</p></div>}
        <button type="button" onClick={() => setExpanded((v) => !v)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE3ED] bg-white px-4 text-sm font-semibold text-[#2D3745] transition hover:border-blue-300 hover:text-blue-700">{expanded ? 'Close plan' : sprint ? 'Open plan' : 'View plan'}<ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}/></button>
      </div>
    </div>
    {expanded && <div className="border-t border-black/[0.06] p-4 sm:p-6">
      {!sprint ? <div className="mx-auto max-w-2xl py-3 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Target className="h-6 w-6"/></div><h3 className="mt-3 text-xl font-semibold tracking-tight">Start with the time you actually have</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6F7782]">This is a demanding revision framework, not a promise of passing. It combines high-yield review, daily question practice, image exposure and error repair. Adjust the hours to your real schedule.</p><label className="mx-auto mt-4 block max-w-xs text-left"><span className="mb-1.5 block text-xs font-semibold text-[#69717D]">Focused study time per day</span><select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-11 w-full rounded-xl border border-[#E1E6ED] bg-[#FAFBFC] px-3 text-sm font-medium"><option value={3}>3 hours · compact</option><option value={6}>6 hours · balanced</option><option value={9}>9 hours · intensive</option><option value={12}>12 hours · full-time</option></select></label><button type="button" onClick={start} className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0F5FCC]">Start my 20 days<ChevronRight className="h-4 w-4"/></button></div> : <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-[#737B86]">Day {currentDay + 1} of 20 · {sprint.dailyHours} focused study hours/day · started {sprint.startedOn}</p><button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#7A818C] hover:bg-[#F3F5F7] hover:text-[#3F4650]"><RotateCcw className="h-3.5 w-3.5"/>{confirmReset ? 'Tap again to restart' : 'Restart sprint'}</button></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Sprint day selector">{SPRINT_DAYS.map((day, i) => { const done = [0,1,2,3].every((task) => sprint.completedTasks[`${i}-${task}`]); return <button key={i} type="button" onClick={() => setSelectedDay(i)} aria-current={activeDay === i ? 'step' : undefined} className={`flex h-12 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition ${activeDay === i ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#E5E8ED] bg-white text-[#69717D] hover:border-blue-300'}`}>{done ? <Check className="h-3.5 w-3.5"/> : <span>{i + 1}</span>}</button>; })}</div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-[#E7EAF0] bg-[#FBFCFE] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">Day {activeDay + 1}</p><h3 className="mt-1 text-lg font-semibold tracking-tight">{plan.title}</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#69717D] ring-1 ring-[#E6EAF0]">{plan.questions} Q target</span></div><p className="mt-2 text-sm leading-6 text-[#69717D]">{plan.focus}</p><div className="mt-4 space-y-2">{checklists.map((item, task) => { const done = !!sprint.completedTasks[`${activeDay}-${task}`]; return <button key={task} type="button" onClick={() => toggleTask(task)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${done ? 'border-emerald-200 bg-emerald-50/70' : 'border-[#E9ECF1] bg-white hover:border-blue-200'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-[#C9D0DA] bg-white'}`}>{done && <Check className="h-3.5 w-3.5"/>}</span><span className={`text-xs leading-5 ${done ? 'text-emerald-900' : 'text-[#535C68]'}`}>{item}</span></button>; })}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => onPractice(plan.subjects.length === 1 ? plan.subjects[0] : '')} disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1769E0] px-4 text-sm font-semibold text-white transition hover:bg-[#0F5FCC] disabled:opacity-60 sm:w-auto"><BookOpenCheck className="h-4 w-4"/>Start 20-question set<ChevronRight className="h-4 w-4"/></button>{activeDay === 17 && <button type="button" onClick={onOpenGrandTests} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE3ED] bg-white px-4 text-sm font-semibold text-[#394353] hover:border-blue-300 hover:text-blue-700"><Target className="h-4 w-4"/>Open full mock tests</button>}</div></div>
          <aside className="rounded-2xl border border-[#E7EAF0] bg-white p-4"><h4 className="text-sm font-semibold">How to use the day</h4><ol className="mt-3 space-y-3 text-xs leading-5 text-[#68717E]"><li><b className="text-[#303741]">1. Recall first.</b> Try to retrieve before rereading.</li><li><b className="text-[#303741]">2. Practise timed.</b> Review wrong and guessed answers.</li><li><b className="text-[#303741]">3. Keep a tiny error list.</b> Revisit it tomorrow.</li><li><b className="text-[#303741">4. Protect sleep.</b> Exhaustion makes recall worse.</li></ol><div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">If you fall behind, continue with the next day and carry only your highest-impact weak areas forward. Do not try to “repay” missed hours with an all-nighter.</div><p className="mt-3 text-[10px] leading-4 text-[#858C96]">This plan supports revision; it cannot predict or guarantee an exam result.</p></aside>
        </div>
      </>}
    </div>}
  </section>;
}

function Stat({label,value}:{label:string;value:string}) { return <div className="qbank-stat min-w-28 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm"><p className="text-[11px] font-medium text-[#838B97]">{label}</p><p className="mt-0.5 text-xl font-semibold tracking-tight text-[#252A32]">{value}</p></div>; }
function SelectField({label,children}:{label:string;children:React.ReactNode}) { return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-[#69717D]">{label}</span><span className="relative block"><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A818C]"><ChevronDown className="h-4 w-4"/></span>{React.cloneElement(children as React.ReactElement<any>,{className:'h-12 w-full appearance-none rounded-xl border border-[#E4E8EE] bg-[#FAFBFC] px-3 pr-9 text-sm font-medium text-[#242A33] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10'})}</span></label>; }
function InfoCard({icon,title,body}:{icon:React.ReactNode;title:string;body:string}) { return <div className="qbank-panel rounded-[22px] border border-black/[0.055] bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.035)] sm:p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#777F8A]">{body}</p></div>; }

function QuestionSession({questions,sessionId,onClose,onRecordAttempt}:{questions:BankQuestion[];sessionId:string;onClose:()=>void;onRecordAttempt:(attempt:NewMcqAttemptInput)=>unknown}) {
  const [index,setIndex]=useState(0); const [choice,setChoice]=useState(''); const [review,setReview]=useState<Review|null>(null); const [tutor,setTutor]=useState<TutorReview|null>(null); const [loading,setLoading]=useState(false); const [tutorError,setTutorError]=useState(''); const [imageOpen,setImageOpen]=useState(false); const [answered,setAnswered]=useState<Record<string,{selected:string;correct:boolean;seconds:number}>>({}); const [finished,setFinished]=useState(false); const startedAt=React.useRef(Date.now());
  const q=questions[index];
  useEffect(()=>{if(questions.length){document.body.style.overflow='hidden';return()=>{document.body.style.overflow='';};}},[questions.length]);
  if(!q) return null;
  const submit=async()=>{if(!choice||loading||review)return;setLoading(true);setTutorError('');try{const data=await responseJson(await apiFetch('/api/question-bank/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q.id,selectedAnswer:choice,sessionId})}));const seconds=Math.max(1,Math.round((Date.now()-startedAt.current)/1000));const answer:Review={...data};setReview(answer);setAnswered((prev)=>({...prev,[q.id]:{selected:choice,correct:data.correct,seconds}}));onRecordAttempt({questionId:q.id,subjectId:q.subjectId,topicId:q.subjectId,topicName:q.subjectName,isCorrect:data.correct,selectedAnswer:choice,correctAnswer:data.correctAnswer,timeTakenSeconds:seconds,difficulty:'high-yield',confidence:'high',source:'qbank',sessionId,isImageBased:q.isImageBased,imageUrl:q.imageUrl||undefined});if(!data.correct){try{const t=await responseJson(await apiFetch('/api/question-bank/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q.id,sessionId})}));setTutor(t);}catch(err:any){setTutorError(err.message||'AI tutor review is unavailable.');}}}catch(err:any){setTutorError(err.message||'Could not submit this answer.');}finally{setLoading(false);}};
  const next=()=>{if(index+1>=questions.length){setFinished(true);return;}setIndex((v)=>v+1);setChoice('');setReview(null);setTutor(null);setTutorError('');startedAt.current=Date.now();};
  const close=()=>{document.body.style.overflow='';onClose();};
  const correctCount=Object.values(answered).filter(a=>a.correct).length;
  return <AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="qbank-session fixed inset-0 z-[9500] overflow-y-auto bg-[#F4F6F9] text-[#1D1D1F]">
    <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.07] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#89919C]">{q.exam}{q.year?` · ${q.year}`:''} · {q.subjectName}</p><p className="mt-0.5 text-sm font-semibold">Question {index+1} of {questions.length}</p></div><button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F3F5] text-[#525A65]" aria-label="Close practice"><X className="h-4 w-4"/></button></header>
      <div className="h-1 bg-[#E5E9EF]"><div className="h-full bg-[#1769E0] transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
      {finished?<main className="m-auto w-full max-w-lg p-5 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600"><BookOpenCheck className="h-7 w-7"/></div><h2 className="mt-5 text-2xl font-semibold tracking-tight">Practice complete</h2><p className="mt-2 text-sm text-[#737B86]">{correctCount} correct out of {Object.keys(answered).length} answered.</p><button onClick={close} className="mt-6 h-12 rounded-2xl bg-[#1769E0] px-6 text-sm font-semibold text-white">Done</button></main>:<main className="w-full flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <article className="qbank-question-card rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-7"><div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{q.subjectName}</span>{q.isImageBased&&<span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700"><ImageIcon className="h-3 w-3"/> Image question</span>}</div><h1 className="whitespace-pre-wrap text-[17px] font-semibold leading-[1.55] tracking-[-0.015em] sm:text-xl">{q.stem}</h1>
          {q.imageUrl&&<button type="button" onClick={()=>setImageOpen(true)} className="mt-5 block max-h-[min(52vh,520px)] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#F6F7F9] text-left"><img src={q.imageUrl} alt="Question figure" className="mx-auto max-h-[min(52vh,520px)] max-w-full object-contain" loading="lazy"/><span className="block border-t border-black/[0.06] px-3 py-2 text-center text-xs font-medium text-[#707985]">Tap to enlarge image</span></button>}
          <div className="mt-5 space-y-2.5">{q.options.map((o)=><button key={o.key} disabled={Boolean(review)||loading} onClick={()=>setChoice(o.key)} className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition sm:px-4 ${review&&o.key===review.correctAnswer?'border-emerald-300 bg-emerald-50/80':review&&o.key===choice?'border-rose-300 bg-rose-50/80':choice===o.key?'border-blue-300 bg-blue-50/80':'border-[#E7EAF0] bg-[#FCFCFD] hover:border-blue-200 hover:bg-blue-50/40'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${review&&o.key===review.correctAnswer?'bg-emerald-600 text-white':review&&o.key===choice?'bg-rose-600 text-white':choice===o.key?'bg-blue-600 text-white':'bg-[#EEF1F5] text-[#596270]'}`}>{o.key}</span><span className="pt-0.5 text-sm leading-6 text-[#343A44]">{o.text}</span>{review&&o.key===review.correctAnswer&&<span className="ml-auto text-xs font-semibold text-emerald-700">Correct</span>}</button>)}</div>
          {!review?<button type="button" disabled={!choice||loading} onClick={submit} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1769E0] text-sm font-semibold text-white transition hover:bg-[#0F5FCC] disabled:opacity-45 sm:w-auto sm:px-7">{loading?<LoaderCircle className="h-4 w-4 animate-spin"/>:'Check answer'}{!loading&&<ChevronRight className="h-4 w-4"/>}</button>:<div className="mt-6 space-y-4" ref={(node)=>node&&node.scrollIntoView({behavior:'smooth',block:'nearest'})}>
            <div className={`rounded-2xl p-4 ${review.correct?'bg-emerald-50 text-emerald-950':'bg-rose-50 text-rose-950'}`}><p className="text-sm font-semibold">{review.correct?'Correct — well done.':`Not quite. The correct answer is ${review.correctAnswer}.`}</p>{review.sourceExplanationAvailable===false?<p className="mt-2 text-sm leading-6">The source PDF did not include an explanation for this item. {review.correct?'Use a trusted reference to review the concept.':'The Gemini tutor review below is an AI-generated teaching explanation based on the question and answer key.'}</p>:<p className="mt-2 whitespace-pre-wrap text-sm leading-6">{review.explanation}</p>}<p className="mt-3 text-[11px] font-medium opacity-70">Source: {review.source}, page {review.sourcePage}</p></div>
            {!review.correct&&<div className="rounded-2xl border border-violet-200/80 bg-[linear-gradient(145deg,#FAF8FF,#FFFFFF)] p-4 sm:p-5"><div className="flex items-center gap-2 text-sm font-semibold text-violet-900"><Sparkles className="h-4 w-4"/> Gemini learning review</div>{tutor?<div className="mt-4 space-y-4"><section><h3 className="text-xs font-bold uppercase tracking-wide text-violet-800">Why your choice missed</h3><p className="mt-1.5 text-sm leading-6 text-[#44404F]">{tutor.whyIncorrect}</p></section><section><h3 className="text-xs font-bold uppercase tracking-wide text-violet-800">Each option</h3><div className="mt-2 space-y-2">{[...tutor.optionAnalysis].sort((a,b)=>a.key.localeCompare(b.key)).map((o)=><p key={o.key} className="text-sm leading-6 text-[#44404F]"><b>{o.key} · {o.verdict==='correct'?'Best answer':'Not the best answer'}:</b> {o.reason}</p>)}</div></section><section className="grid gap-3 sm:grid-cols-3">{[['Exam trap',tutor.examTrap],['Memory aid',tutor.memoryAid],['Clinical pearl',tutor.clinicalPearl]].map(([title,body])=><div key={title} className="rounded-xl bg-white/90 p-3"><h3 className="text-[11px] font-bold uppercase tracking-wide text-violet-800">{title}</h3><p className="mt-1.5 text-xs leading-5 text-[#4D4A56]">{body}</p></div>)}</section><p className="text-[10px] text-[#85808E]">AI-generated teaching synthesis · verify clinical details against trusted references.</p></div>:<div className="mt-3"><p className="text-sm leading-6 text-[#686273]">{tutorError||'Preparing the option-by-option review…'}</p>{tutorError&&<button onClick={async()=>{setTutorError('');setLoading(true);try{setTutor(await responseJson(await apiFetch('/api/question-bank/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q.id,sessionId})})));}catch(e:any){setTutorError(e.message);}finally{setLoading(false);}}} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700"><RefreshCw className="h-3.5 w-3.5"/>Try again</button>}</div>}</div>}
            <button type="button" onClick={next} disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1769E0] text-sm font-semibold text-white sm:w-auto sm:px-7">{index+1===questions.length?'Finish set':'Next question'}<ChevronRight className="h-4 w-4"/></button>
          </div>}
        </article><p className="mt-3 text-center text-[11px] text-[#959BA4]">{q.exam}{q.year?` · ${q.year}`:''} · {q.source} · page {q.sourcePage}</p>
      </main>}
    </div>
    {imageOpen&&q.imageUrl&&<div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/90 p-3" onClick={()=>setImageOpen(false)}><button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Close image"><X className="h-5 w-5"/></button><img src={q.imageUrl} alt="Enlarged question figure" onClick={(e)=>e.stopPropagation()} className="max-h-[92dvh] max-w-[96vw] object-contain"/></div>}
  </motion.div></AnimatePresence>;
}
