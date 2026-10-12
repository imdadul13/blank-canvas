import React, { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, BookOpenCheck, Check, ChevronLeft, ChevronRight, FileText, FlaskConical, HeartPulse, Microscope, Pill, Search, Stethoscope } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { RAPID_REVISION_PART3_PAGES } from '../data/rapidRevisionPart3Pages';
import { apiFetch } from '../utils/api';

type SourceId = 'day1' | 'part3';
type SourcePage = { page: number; label: string; subject: string; note?: string };

const SOURCES: Record<SourceId, { title: string; endpoint: string; pages: number; description: string }> = {
  day1: { title: 'Final Aid · Day 1', endpoint: '/api/user/revision-sources/day-1', pages: 146, description: 'Foundational and para-clinical rapid revision' },
  part3: { title: 'Dr. Paras Jamwal · Part 3', endpoint: '/api/user/revision-sources/part-3', pages: 140, description: 'Clinical and short-subject rapid revision' },
};

// The publisher page itself is the source of truth. These ranges follow the
// Day-1 contents page; the PDF page number remains the link target.
function day1Subject(page: number) {
  if (page <= 4) return 'Front matter';
  if (page <= 24) return 'Anatomy';
  if (page <= 48) return 'Physiology';
  if (page <= 79) return 'Pathology';
  if (page <= 93) return 'Pharmacology';
  if (page <= 103) return 'Biochemistry';
  if (page <= 139) return 'Microbiology';
  if (page <= 140) return 'Blank / verify';
  if (page <= 145) return 'Additional review pages';
  return 'Blank / verify';
}

const PAGE_SIZE = 24;
const SUBJECT_ACCENTS: Record<string, { icon: React.ReactNode; color: string; wash: string }> = {
  'Front matter': { icon: <BookOpen className="h-5 w-5" />, color: 'text-blue-700 dark:text-blue-300', wash: 'bg-blue-100 dark:bg-blue-400/15' },
  Anatomy: { icon: <Stethoscope className="h-5 w-5" />, color: 'text-rose-700 dark:text-rose-300', wash: 'bg-rose-100 dark:bg-rose-400/15' },
  Physiology: { icon: <HeartPulse className="h-5 w-5" />, color: 'text-cyan-700 dark:text-cyan-300', wash: 'bg-cyan-100 dark:bg-cyan-400/15' },
  Pathology: { icon: <Microscope className="h-5 w-5" />, color: 'text-violet-700 dark:text-violet-300', wash: 'bg-violet-100 dark:bg-violet-400/15' },
  Pharmacology: { icon: <Pill className="h-5 w-5" />, color: 'text-orange-700 dark:text-orange-300', wash: 'bg-orange-100 dark:bg-orange-400/15' },
  Biochemistry: { icon: <FlaskConical className="h-5 w-5" />, color: 'text-emerald-700 dark:text-emerald-300', wash: 'bg-emerald-100 dark:bg-emerald-400/15' },
  Microbiology: { icon: <Microscope className="h-5 w-5" />, color: 'text-fuchsia-700 dark:text-fuchsia-300', wash: 'bg-fuchsia-100 dark:bg-fuchsia-400/15' },
  'Additional review pages': { icon: <BookOpenCheck className="h-5 w-5" />, color: 'text-indigo-700 dark:text-indigo-300', wash: 'bg-indigo-100 dark:bg-indigo-400/15' },
  'Blank / verify': { icon: <FileText className="h-5 w-5" />, color: 'text-slate-600 dark:text-slate-300', wash: 'bg-slate-100 dark:bg-white/10' },
  'Part 3': { icon: <Stethoscope className="h-5 w-5" />, color: 'text-teal-700 dark:text-teal-300', wash: 'bg-teal-100 dark:bg-teal-400/15' },
};

const SOURCE_ART: Record<SourceId, { icon: React.ReactNode; gradient: string; glow: string }> = {
  day1: { icon: <BookOpenCheck className="h-6 w-6" />, gradient: 'from-blue-600 via-indigo-600 to-violet-600', glow: 'bg-sky-400/30' },
  part3: { icon: <Stethoscope className="h-6 w-6" />, gradient: 'from-emerald-500 via-teal-600 to-cyan-600', glow: 'bg-emerald-300/30' },
};

interface RapidRevisionLibraryProps {
  progress: Record<string, boolean>;
  onToggle: (key: string) => void;
  onPractice: (subjectId: string) => void;
}

export const RapidRevisionLibrary: React.FC<RapidRevisionLibraryProps> = ({ progress, onToggle, onPractice }) => {
  const [sourceId, setSourceId] = useState<SourceId>('day1');
  const [query, setQuery] = useState('');
  const [pageGroup, setPageGroup] = useState(0);
  const [openError, setOpenError] = useState('');
  const reduceMotion = useReducedMotion();
  const source = SOURCES[sourceId];
  const pages = useMemo<SourcePage[]>(() => Array.from({ length: source.pages }, (_, index) => {
    const page = index + 1;
    const subject = sourceId === 'day1' ? day1Subject(page) : 'Part 3';
    const label = sourceId === 'day1' ? `${subject} · PDF page ${page}` : (RAPID_REVISION_PART3_PAGES[page] || 'Topic index under review');
    return { page, subject, label };
  }), [source.pages, sourceId]);
  const filteredPages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return pages.filter((item) => !normalized || item.label.toLowerCase().includes(normalized));
  }, [pages, query]);
  const pageCount = Math.max(1, Math.ceil(filteredPages.length / PAGE_SIZE));
  const visible = filteredPages.slice(pageGroup * PAGE_SIZE, (pageGroup + 1) * PAGE_SIZE);
  const reviewed = pages.filter(({ page }) => progress[`rapid:${sourceId}:${page}`]).length;
  const totalReviewed = Object.keys(progress).filter((key) => key.startsWith('rapid:') && progress[key]).length;
  const sourceArt = SOURCE_ART[sourceId];

  const changeSource = (next: SourceId) => { setSourceId(next); setPageGroup(0); setQuery(''); };
  const changeQuery = (value: string) => { setQuery(value); setPageGroup(0); };
  const openSourcePage = async (page: number) => {
    setOpenError('');
    const preview = window.open('about:blank', '_blank');
    try {
      const response = await apiFetch(source.endpoint);
      if (!response.ok) throw new Error(response.status === 401 ? 'Sign in to open this licensed source.' : 'The source PDF could not be loaded. Please try again.');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (preview) preview.location.href = `${objectUrl}#page=${page}`;
      else {
        const link = document.createElement('a'); link.href = `${objectUrl}#page=${page}`; link.target = '_blank'; link.rel = 'noopener'; link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch (error) {
      preview?.close();
      setOpenError(error instanceof Error ? error.message : 'The source PDF could not be loaded. Please try again.');
    }
  };

  return <section className="space-y-6 pb-8" aria-label="Rapid revision source library">
    <div className="relative isolate overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(35,48,85,0.10)] dark:border-white/10 dark:bg-[#151923]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.12),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(0,122,255,0.10),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.22),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(0,122,255,0.18),transparent_40%)]" />
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center lg:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-300/15 dark:bg-blue-300/10 dark:text-blue-200"><BookOpen className="h-3.5 w-3.5" /> Your source library</div>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-[-0.045em] text-[#1D1D1F] dark:text-white sm:text-[2.6rem] sm:leading-[1.08]">Every page, ready for a focused review.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">Pick up where you left off. Open the exact page, mark it done, and watch your revision progress take shape.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">{totalReviewed} pages reviewed</span>
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">Two source books</span>
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">Progress saved to your study record</span>
          </div>
        </div>
        <div className="relative mx-auto flex h-44 w-full max-w-[260px] items-center justify-center lg:h-52">
          <motion.div aria-hidden="true" className={`absolute h-36 w-36 rounded-full blur-3xl ${sourceArt.glow}`} animate={reduceMotion ? undefined : { scale: [0.92, 1.08, 0.92], opacity: [0.55, 0.85, 0.55] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute h-40 w-40 rounded-full border border-blue-200/60 dark:border-white/10" />
          <motion.div aria-hidden="true" className="absolute h-48 w-48 rounded-full border border-dashed border-violet-200/80 dark:border-violet-300/20" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
          <div className={`relative flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br ${sourceArt.gradient} text-white shadow-[0_18px_42px_rgba(47,86,190,0.32)] ring-8 ring-white/70 dark:ring-slate-900/50`}>{sourceArt.icon}</div>
          <span className="absolute right-4 top-8 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-md dark:border-white/10 dark:bg-slate-800 dark:text-white">{source.pages} pages</span>
          <span className="absolute bottom-5 left-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-md dark:border-white/10 dark:bg-slate-800 dark:text-emerald-300">{reviewed} reviewed</span>
        </div>
      </div>
      <div className="grid gap-3 border-t border-slate-200/70 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5 dark:border-white/10 dark:bg-black/10" role="tablist" aria-label="Choose a revision source">
        {(Object.keys(SOURCES) as SourceId[]).map((id) => {
          const selected = sourceId === id;
          const meta = SOURCES[id];
          const art = SOURCE_ART[id];
          const count = Array.from({ length: meta.pages }, (_, index) => progress[`rapid:${id}:${index + 1}`]).filter(Boolean).length;
          return <motion.button key={id} type="button" role="tab" aria-selected={selected} onClick={() => changeSource(id)} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.99 }} className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition ${selected ? 'border-blue-300 bg-white shadow-[0_8px_24px_rgba(0,122,255,0.12)] dark:border-blue-300/30 dark:bg-slate-800' : 'border-slate-200/80 bg-white/60 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20'}`}>
            <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${art.gradient} ${selected ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`} />
            <span className="flex items-start gap-3 pl-1">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${art.gradient} text-white shadow-md`}>{art.icon}</span>
              <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900 dark:text-white">{meta.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{meta.description}</span><span className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-300"><span>{count} / {meta.pages} pages reviewed</span>{selected && <span className="text-blue-700 dark:text-blue-300">Selected</span>}</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><motion.span className={`block h-full rounded-full bg-gradient-to-r ${art.gradient}`} initial={false} animate={{ width: `${count / meta.pages * 100}%` }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }} /></span></span>
            </span>
          </motion.button>;
        })}
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 text-slate-400 sm:col-span-2 dark:border-white/10 dark:bg-slate-900/80">
          <Search className="h-4 w-4 shrink-0" /><input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search subjects or page notes" className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
        </label>
      </div>
    </div>

    <div className="flex flex-wrap items-end justify-between gap-3 px-1">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{source.title} · {source.pages} PDF pages</p><h3 className="mt-1 text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{source.description}</h3></div>
      <button type="button" onClick={() => openSourcePage(visible[0]?.page || 1)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Open book <ArrowUpRight className="h-4 w-4" /></button>
    </div>

    {openError && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/5 dark:text-amber-100">{openError}</p>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(({ page, label, subject }, index) => {
        const key = `rapid:${sourceId}:${page}`;
        const done = !!progress[key];
        const accent = SUBJECT_ACCENTS[subject] || SUBJECT_ACCENTS['Part 3'];
        return <motion.article key={`${sourceId}-${page}`} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ delay: reduceMotion ? 0 : index * 0.018, duration: 0.24 }} className={`group relative overflow-hidden rounded-[22px] border p-4 shadow-[0_5px_20px_rgba(15,23,42,0.045)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)] ${done ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-400/20 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30' : 'border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80'}`}>
          <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${done ? 'from-emerald-400 via-teal-400 to-cyan-400' : sourceId === 'day1' ? 'from-blue-500 via-violet-400 to-fuchsia-400' : 'from-emerald-400 via-cyan-400 to-blue-400'} opacity-70`} />
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${done ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20' : `${accent.wash} ${accent.color}`}`}>{done ? <Check className="h-5 w-5" /> : accent.icon}</div>
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{String(page).padStart(2, '0')} <span className="font-medium opacity-70">/ {source.pages}</span></span>
          </div>
          <h4 className="mt-4 text-base font-bold tracking-tight text-[#20242B] dark:text-white">{subject === 'Part 3' ? label.split(' · ')[0] : subject}</h4>
          <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">{sourceId === 'day1' ? label : `${label} · PDF page ${page}`}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => openSourcePage(page)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Open page <ArrowUpRight className="h-4 w-4" /></button>
            <button type="button" aria-pressed={done} onClick={() => onToggle(key)} className={`min-h-10 rounded-xl border px-2 text-sm font-semibold transition ${done ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-transparent dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>{done ? 'Reviewed' : 'Mark reviewed'}</button>
          </div>
        </motion.article>;
      })}
    </div>

    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-slate-900/80">
      <button type="button" disabled={pageGroup === 0} onClick={() => setPageGroup((value) => Math.max(0, value - 1))} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-slate-600 disabled:opacity-40 dark:text-slate-300"><ChevronLeft className="h-4 w-4" />Previous pages</button>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{filteredPages.length ? pageGroup * PAGE_SIZE + 1 : 0}–{Math.min((pageGroup + 1) * PAGE_SIZE, filteredPages.length)} of {filteredPages.length}</span>
      <button type="button" disabled={pageGroup >= pageCount - 1} onClick={() => setPageGroup((value) => Math.min(pageCount - 1, value + 1))} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-slate-600 disabled:opacity-40 dark:text-slate-300">Next pages<ChevronRight className="h-4 w-4" /></button>
    </div>

    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-300/5 dark:text-amber-100">
      {sourceId === 'day1' && <p className="mb-2"><strong>Page numbering:</strong> subject ranges follow the printed contents page. PDF page numbers differ because the file includes front matter and extra review pages.</p>}
      <strong>Study safely:</strong> the PDF remains the original source. Page labels are an index, not medical endorsement; handwritten annotations stay in the source and are not treated as verified facts. Treatment, vaccine, diagnostic and legal recommendations should be checked against current authoritative guidance before being taught as clinical advice.
    </div>
    <div className="flex justify-end"><button type="button" onClick={() => onPractice('medicine')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Go to question practice <ArrowUpRight className="h-4 w-4" /></button></div>
  </section>;
};
