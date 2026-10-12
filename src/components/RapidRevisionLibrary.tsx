import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, BookOpenCheck, Check, ChevronLeft, ChevronRight, FileText, FlaskConical, HeartPulse, Microscope, Pill, Search, Stethoscope, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RAPID_REVISION_DECK_TEXT } from '../data/rapidRevisionDeckText';
import { RAPID_REVISION_PART3_PAGES } from '../data/rapidRevisionPart3Pages';

type SourceId = 'day1' | 'part3';
type SubjectId = 'anatomy' | 'physiology' | 'pathology' | 'pharmacology' | 'biochemistry' | 'microbiology' | 'radiology' | 'dermatology' | 'pediatrics' | 'gynecology' | 'obstetrics';
type DeckSubject = { id: SubjectId; title: string; range: [number, number]; color: string; wash: string; icon: React.ReactNode };
type Slide = { page: number; title: string; summary: string; lines: string[] };

const SOURCE_INFO: Record<SourceId, { title: string; description: string; gradient: string; pages: number }> = {
  day1: { title: 'Foundation review', description: 'Anatomy, physiology and para-clinical subjects', gradient: 'from-blue-600 via-indigo-600 to-violet-600', pages: 146 },
  part3: { title: 'Clinical review', description: 'Radiology, short and clinical subjects', gradient: 'from-emerald-500 via-teal-600 to-cyan-600', pages: 140 },
};

const SUBJECTS: Record<SourceId, DeckSubject[]> = {
  day1: [
    { id: 'anatomy', title: 'Anatomy', range: [5, 24], color: 'text-rose-700 dark:text-rose-300', wash: 'bg-rose-100 dark:bg-rose-400/15', icon: <Stethoscope className="h-5 w-5" /> },
    { id: 'physiology', title: 'Physiology', range: [25, 48], color: 'text-cyan-700 dark:text-cyan-300', wash: 'bg-cyan-100 dark:bg-cyan-400/15', icon: <HeartPulse className="h-5 w-5" /> },
    { id: 'pathology', title: 'Pathology', range: [49, 79], color: 'text-violet-700 dark:text-violet-300', wash: 'bg-violet-100 dark:bg-violet-400/15', icon: <Microscope className="h-5 w-5" /> },
    { id: 'pharmacology', title: 'Pharmacology', range: [80, 93], color: 'text-orange-700 dark:text-orange-300', wash: 'bg-orange-100 dark:bg-orange-400/15', icon: <Pill className="h-5 w-5" /> },
    { id: 'biochemistry', title: 'Biochemistry', range: [94, 103], color: 'text-emerald-700 dark:text-emerald-300', wash: 'bg-emerald-100 dark:bg-emerald-400/15', icon: <FlaskConical className="h-5 w-5" /> },
    { id: 'microbiology', title: 'Microbiology', range: [104, 145], color: 'text-fuchsia-700 dark:text-fuchsia-300', wash: 'bg-fuchsia-100 dark:bg-fuchsia-400/15', icon: <Microscope className="h-5 w-5" /> },
  ],
  part3: [
    { id: 'radiology', title: 'Radiology', range: [2, 29], color: 'text-sky-700 dark:text-sky-300', wash: 'bg-sky-100 dark:bg-sky-400/15', icon: <FileText className="h-5 w-5" /> },
    { id: 'dermatology', title: 'Dermatology', range: [30, 62], color: 'text-fuchsia-700 dark:text-fuchsia-300', wash: 'bg-fuchsia-100 dark:bg-fuchsia-400/15', icon: <Microscope className="h-5 w-5" /> },
    { id: 'pediatrics', title: 'Pediatrics', range: [63, 78], color: 'text-amber-700 dark:text-amber-300', wash: 'bg-amber-100 dark:bg-amber-400/15', icon: <HeartPulse className="h-5 w-5" /> },
    { id: 'gynecology', title: 'Gynecology', range: [79, 99], color: 'text-rose-700 dark:text-rose-300', wash: 'bg-rose-100 dark:bg-rose-400/15', icon: <HeartPulse className="h-5 w-5" /> },
    { id: 'obstetrics', title: 'Obstetrics', range: [100, 139], color: 'text-violet-700 dark:text-violet-300', wash: 'bg-violet-100 dark:bg-violet-400/15', icon: <BookOpenCheck className="h-5 w-5" /> },
  ],
};

const DAY1_HEADER_RE = /^(dr\. paras jamwal|final aid|anatomy|physiology|pathology|pharmacology|biochemistry|biochemis(?:try|rty)|microbiology)$/i;
const PART3_HEADER_RE = /^(dr\. paras jamwal|final aid|aid|radiology|dermatology|pediatrics|gynaecology|gynecology|obstetrics)$/i;

function tidyLine(line: string) {
  return line.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/^[|¦\s]+|[|¦\s]+$/g, '').trim();
}

function getSlideText(source: SourceId, page: number) {
  const pageData = RAPID_REVISION_DECK_TEXT[source].find((entry) => entry.page === page);
  const rawLines = (pageData?.text || '').split(/\r?\n/).map(tidyLine).filter(Boolean);
  const headerRegex = source === 'day1' ? DAY1_HEADER_RE : PART3_HEADER_RE;
  const lines = rawLines.filter((line) => !headerRegex.test(line) && !/(?:dr\.?\s*paras|paras jamwal|final\s+aid)/i.test(line) && !/^[\W_\d]{1,5}$/.test(line) && line.length > 1);
  const summary = source === 'part3' ? (RAPID_REVISION_PART3_PAGES[page] || '') : '';
  const title = source === 'part3'
    ? (summary.replace(/^[^:]{2,40}:\s*/, '').split(/[.;]/)[0].trim() || lines[0] || 'Rapid review')
    : (lines[0]?.replace(/^[•●▪#\d.)\s-]+/, '').trim() || 'Rapid review');
  return { lines: lines.slice(source === 'day1' && lines[0] === title ? 1 : 0), title, summary };
}

function buildSlides(source: SourceId, subject: DeckSubject): Slide[] {
  const slides: Slide[] = [];
  for (let page = subject.range[0]; page <= subject.range[1]; page++) {
    const content = getSlideText(source, page);
    if (source === 'part3' && /blank|transition|cover/i.test(content.summary) && !content.lines.length) continue;
    if (source === 'day1' && !content.lines.length) continue;
    const summary = content.summary.replace(/\b(image|image continuation)\b/gi, 'visual review');
    const title = content.title.length > 96 ? `${content.title.slice(0, 93).trimEnd()}…` : content.title;
    slides.push({ page, title, summary, lines: content.lines });
  }
  return slides;
}

function splitRelationship(line: string) {
  const parts = line.split(/\s*(?:→|->|⇒)\s*/).filter(Boolean);
  if (parts.length > 1) return parts;
  const equals = line.split(/\s+=\s+/).filter(Boolean);
  return equals.length > 1 ? equals : null;
}

interface RapidRevisionLibraryProps {
  progress: Record<string, boolean>;
  onToggle: (key: string) => void;
  onPractice: (subjectId: string) => void;
}

export const RapidRevisionLibrary: React.FC<RapidRevisionLibraryProps> = ({ progress, onToggle, onPractice }) => {
  const [sourceId, setSourceId] = useState<SourceId>('day1');
  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState<{ subject: DeckSubject; slides: Slide[]; index: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const source = SOURCE_INFO[sourceId];
  const subjects = useMemo(() => SUBJECTS[sourceId].map((subject) => {
    const slides = buildSlides(sourceId, subject);
    const matches = !query.trim() || subject.title.toLowerCase().includes(query.trim().toLowerCase()) || slides.some((slide) => `${slide.title} ${slide.summary} ${slide.lines.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
    const complete = slides.filter((slide) => progress[`rapid:${sourceId}:${slide.page}`]).length;
    return { subject, slides, complete, matches };
  }).filter((item) => item.matches), [sourceId, query, progress]);
  const completed = Object.keys(progress).filter((key) => key.startsWith('rapid:') && progress[key]).length;
  const currentSlide = deck?.slides[deck.index];

  const openDeck = (subject: DeckSubject, slides: Slide[]) => {
    const firstNotReviewed = slides.findIndex((slide) => !progress[`rapid:${sourceId}:${slide.page}`]);
    setDeck({ subject, slides, index: firstNotReviewed >= 0 ? firstNotReviewed : 0 });
  };
  const moveSlide = (delta: number) => setDeck((current) => current ? { ...current, index: Math.max(0, Math.min(current.slides.length - 1, current.index + delta)) } : current);

  React.useEffect(() => {
    if (!deck) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDeck(null);
      if (event.key === 'ArrowLeft') moveSlide(-1);
      if (event.key === 'ArrowRight') moveSlide(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deck]);

  return <section className="space-y-6 pb-8" aria-label="Rapid revision slide decks">
    <div className="relative isolate overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(35,48,85,0.10)] dark:border-white/10 dark:bg-[#151923]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.12),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(0,122,255,0.10),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.22),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(0,122,255,0.18),transparent_40%)]" />
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center lg:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-300/15 dark:bg-blue-300/10 dark:text-blue-200"><BookOpen className="h-3.5 w-3.5" /> OneShot slide decks</div>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-[-0.045em] text-[#1D1D1F] dark:text-white sm:text-[2.6rem] sm:leading-[1.08]">One subject. One clean deck.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">Your notes are reflowed into app-native slides. Choose a subject once, then move through its topics with the slide controls.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">{completed} slides reviewed</span>
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">{subjects.length} subjects</span>
            <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">Progress saved to your study record</span>
          </div>
        </div>
        <div className="relative mx-auto flex h-44 w-full max-w-[260px] items-center justify-center lg:h-52">
          <motion.div aria-hidden="true" className="absolute h-36 w-36 rounded-full bg-blue-400/25 blur-3xl" animate={reduceMotion ? undefined : { scale: [0.92, 1.08, 0.92], opacity: [0.55, 0.85, 0.55] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute h-40 w-40 rounded-full border border-blue-200/60 dark:border-white/10" />
          <motion.div aria-hidden="true" className="absolute h-48 w-48 rounded-full border border-dashed border-violet-200/80 dark:border-violet-300/20" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
          <div className={`relative flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br ${source.gradient} text-white shadow-[0_18px_42px_rgba(47,86,190,0.32)] ring-8 ring-white/70 dark:ring-slate-900/50`}><BookOpenCheck className="h-7 w-7" /></div>
          <span className="absolute right-4 top-8 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-md dark:border-white/10 dark:bg-slate-800 dark:text-white">{subjects.reduce((sum, item) => sum + item.slides.length, 0)} slides</span>
          <span className="absolute bottom-5 left-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-md dark:border-white/10 dark:bg-slate-800 dark:text-emerald-300">{source.description}</span>
        </div>
      </div>
      <div className="grid gap-3 border-t border-slate-200/70 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5 dark:border-white/10 dark:bg-black/10" role="tablist" aria-label="Choose a revision deck">
        {(Object.keys(SOURCE_INFO) as SourceId[]).map((id) => {
          const selected = sourceId === id;
          const meta = SOURCE_INFO[id];
          const count = SUBJECTS[id].reduce((sum, item) => sum + buildSlides(id, item).length, 0);
          return <button key={id} type="button" role="tab" aria-selected={selected} onClick={() => { setSourceId(id); setQuery(''); }} className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${selected ? 'border-blue-300 bg-white shadow-[0_8px_24px_rgba(0,122,255,0.12)] dark:border-blue-300/30 dark:bg-slate-800' : 'border-slate-200/80 bg-white/60 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20'}`}>
            <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${meta.gradient}`} />
            <span className="block pl-1 font-bold text-slate-900 dark:text-white">{meta.title}</span><span className="mt-1 block pl-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{meta.description} · {count} app slides</span>
          </button>;
        })}
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 text-slate-400 sm:col-span-2 dark:border-white/10 dark:bg-slate-900/80"><Search className="h-4 w-4 shrink-0" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a subject or topic" className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" /></label>
      </div>
    </div>

    <div className="flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{source.title} · {source.pages} source pages converted</p><h3 className="mt-1 text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Choose a subject deck</h3></div><span className="text-sm text-slate-500 dark:text-slate-400">Subjects appear once; topics are inside each deck.</span></div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {subjects.map(({ subject, slides, complete }, index) => <motion.article key={subject.id} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ delay: reduceMotion ? 0 : index * 0.025, duration: 0.24 }} className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-[0_6px_22px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
        <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${source.gradient}`} />
        <div className="flex items-start justify-between gap-3"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${subject.wash} ${subject.color}`}>{subject.icon}</span><span className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{slides.length} slides</span></div>
        <h4 className="mt-4 text-lg font-bold tracking-tight text-[#20242B] dark:text-white">{subject.title}</h4>
        <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">{slides.slice(0, 2).map((slide) => slide.title).join(' · ') || source.description}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all" style={{ width: `${slides.length ? (complete / slides.length) * 100 : 0}%` }} /></div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>{complete} reviewed</span><span>{slides.length ? Math.round((complete / slides.length) * 100) : 0}%</span></div>
        <button type="button" disabled={!slides.length} onClick={() => openDeck(subject, slides)} className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${source.gradient} px-4 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-50`}>Open {subject.title} deck <ArrowUpRight className="h-4 w-4" /></button>
      </motion.article>)}
    </div>
    {!subjects.length && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">No subject or topic matches that search.</p>}

    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-300/5 dark:text-amber-100"><strong>Source note:</strong> slide layouts and selectable text are made by OneShot from the supplied revision material. Source page numbers are retained for checking. Scanned handwriting and figures are not independently fact-checked.</div>
    <div className="flex justify-end"><button type="button" onClick={() => onPractice('medicine')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Go to question practice <ArrowUpRight className="h-4 w-4" /></button></div>

    {deck && currentSlide && createPortal(<div className="fixed inset-0 z-[10000] flex flex-col bg-[#0b1020] text-white" role="dialog" aria-modal="true" aria-label={`${deck.subject.title} slide deck`}>
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#111827] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${source.gradient}`}><BookOpenCheck className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold sm:text-base">OneShot <span className="font-normal text-slate-400">/ Rapid Revision / {deck.subject.title}</span></p><p className="truncate text-xs text-slate-400">{SOURCE_INFO[sourceId].title} · Source page {currentSlide.page} · Slide {deck.index + 1} of {deck.slides.length}</p></div></div>
        <button type="button" onClick={() => setDeck(null)} aria-label="Close slide deck" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"><X className="h-5 w-5" /></button>
      </header>
      <div className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.12),transparent_55%),#0b1020] p-3 sm:p-7">
        <button type="button" disabled={deck.index === 0} onClick={() => moveSlide(-1)} aria-label="Previous slide" className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-white shadow-lg transition hover:bg-slate-700 disabled:opacity-30 sm:left-5 sm:h-12 sm:w-12"><ArrowLeft className="h-5 w-5" /></button>
        <div className="relative flex min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#f8faff] text-[#182238] shadow-[0_25px_80px_rgba(0,0,0,0.42)] sm:rounded-[30px]">
          <div className={`h-2 shrink-0 bg-gradient-to-r ${source.gradient}`} />
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-8 sm:py-5"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm"><span className={`h-2 w-2 rounded-full bg-gradient-to-r ${source.gradient}`} />{deck.subject.title}</span><span className="text-xs font-semibold tabular-nums text-slate-400">{String(deck.index + 1).padStart(2, '0')} / {String(deck.slides.length).padStart(2, '0')}</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${sourceId}-${currentSlide.page}`} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -18 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-9 sm:py-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{currentSlide.summary ? 'Rapid review' : 'Study notes'}</p>
              <h2 className="mt-2 max-w-4xl text-2xl font-bold leading-tight tracking-[-0.035em] text-[#172235] sm:text-4xl">{currentSlide.title}</h2>
              {currentSlide.summary && <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 sm:text-base">{currentSlide.summary}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {currentSlide.lines.map((line, index) => {
                  const relation = splitRelationship(line.replace(/^[•●▪#\-–—\s]+/, ''));
                  const clean = line.replace(/^[•●▪#\-–—\s]+/, '').trim();
                  const isHeading = !relation && clean.length <= 46 && !/[.!?]$/.test(clean) && !/^\d+[.)]/.test(clean);
                  if (!clean) return null;
                  if (isHeading) return <h3 key={`${index}-${clean}`} className="col-span-full mt-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{clean}</h3>;
                  return <div key={`${index}-${clean}`} className={`rounded-2xl border p-4 ${relation ? 'border-blue-100 bg-white shadow-[0_4px_16px_rgba(30,64,175,0.05)]' : 'border-slate-200/80 bg-white/90'}`}>
                    {relation ? <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-600">{relation[0]}</span><ArrowRight className="h-4 w-4 shrink-0 text-blue-500" /><span className="text-sm font-bold leading-6 text-[#1e3a8a]">{relation.slice(1).join(' · ')}</span></div> : <div className="flex items-start gap-3"><span className={`mt-2 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${source.gradient}`} /><p className="text-sm leading-6 text-slate-700">{clean}</p></div>}
                  </div>;
                })}
              </div>
              {!currentSlide.lines.length && <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 text-sm leading-6 text-slate-700">{currentSlide.summary || 'This page has no selectable text yet. Use the source page reference to locate it in your supplied notes.'}</div>}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-400"><span>Your {SOURCE_INFO[sourceId].title.toLowerCase()} notes</span><button type="button" aria-pressed={!!progress[`rapid:${sourceId}:${currentSlide.page}`]} onClick={() => onToggle(`rapid:${sourceId}:${currentSlide.page}`)} className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 font-semibold ${progress[`rapid:${sourceId}:${currentSlide.page}`] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>{progress[`rapid:${sourceId}:${currentSlide.page}`] ? <Check className="h-4 w-4" /> : null}{progress[`rapid:${sourceId}:${currentSlide.page}`] ? 'Reviewed' : 'Mark slide reviewed'}</button></div>
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" disabled={deck.index === deck.slides.length - 1} onClick={() => moveSlide(1)} aria-label="Next slide" className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-white shadow-lg transition hover:bg-slate-700 disabled:opacity-30 sm:right-5 sm:h-12 sm:w-12"><ArrowRight className="h-5 w-5" /></button>
      </div>
      <footer className="flex min-h-16 items-center justify-between gap-3 border-t border-white/10 bg-[#111827] px-4 sm:px-6"><div className="min-w-0 flex-1"><div className="mb-1 h-1 max-w-56 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${source.gradient} transition-all`} style={{ width: `${((deck.index + 1) / deck.slides.length) * 100}%` }} /></div><p className="truncate text-[11px] text-slate-400 sm:text-xs">Reference · {sourceId === 'day1' ? 'Day 1 notes' : 'Part 3 notes'} · page {currentSlide.page}</p></div><div className="flex shrink-0 items-center gap-2"><button type="button" disabled={deck.index === 0} onClick={() => moveSlide(-1)} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold disabled:opacity-35"><ChevronLeft className="h-4 w-4" />Previous</button><button type="button" disabled={deck.index === deck.slides.length - 1} onClick={() => moveSlide(1)} className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${source.gradient} px-3 py-2 text-sm font-semibold shadow-lg disabled:opacity-35`}>Next slide<ChevronRight className="h-4 w-4" /></button></div></footer>
    </div>, document.body)}
  </section>;
};
