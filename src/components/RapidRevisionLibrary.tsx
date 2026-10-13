import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  HeartPulse,
  Microscope,
  Pill,
  Search,
  Stethoscope,
  TrendingDown,
  X,
  Layers,
  Award,
  Clock,
  Eye,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RAPID_REVISION_DECK_TEXT } from '../data/rapidRevisionDeckText';
import { RAPID_REVISION_PART3_PAGES } from '../data/rapidRevisionPart3Pages';
import { RAPID_REVISION_VISUALS } from '../data/rapidRevisionVisuals';
import type { McqAttempt } from '../types';

type SourceId = 'day1' | 'part3';
type SourceFilter = SourceId | 'all';
type SubjectId =
  | 'anatomy'
  | 'physiology'
  | 'pathology'
  | 'pharmacology'
  | 'biochemistry'
  | 'microbiology'
  | 'radiology'
  | 'dermatology'
  | 'pediatrics'
  | 'gynecology'
  | 'obstetrics';

type DeckSubject = {
  id: SubjectId;
  title: string;
  range: [number, number];
  accentColor: string;
  gradient: string;
  glowColor: string;
  wash: string;
  icon: React.ReactNode;
  highYieldTopics: string[];
};

type Slide = {
  page: number;
  title: string;
  summary: string;
  lines: string[];
  visuals: string[];
};

const SOURCE_INFO: Record<SourceId, { title: string; subtitle: string; description: string; gradient: string; pages: number; badgeColor: string }> = {
  day1: {
    title: 'Foundation Review',
    subtitle: 'Pre- & Para-Clinical Core',
    description: 'Anatomy, Physiology, Pathology, Pharmacology, Biochemistry, Microbiology',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    pages: 146,
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  },
  part3: {
    title: 'Clinical Review',
    subtitle: 'High-Yield Clinical & Short Subjects',
    description: 'Radiology, Dermatology, Pediatrics, Gynecology, Obstetrics',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    pages: 140,
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
};

const SUBJECTS: Record<SourceId, DeckSubject[]> = {
  day1: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      range: [5, 24],
      accentColor: '#FF2D55',
      gradient: 'from-rose-500 via-pink-500 to-rose-600',
      glowColor: 'rgba(244, 63, 94, 0.22)',
      wash: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: <Stethoscope className="h-5 w-5" />,
      highYieldTopics: ['Knee Joint Stabilizers', 'Brachial Plexus Injuries', 'Coronary Anatomy', 'Peritoneal Cavity'],
    },
    {
      id: 'physiology',
      title: 'Physiology',
      range: [25, 48],
      accentColor: '#007AFF',
      gradient: 'from-sky-500 via-blue-500 to-indigo-600',
      glowColor: 'rgba(14, 165, 233, 0.22)',
      wash: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      icon: <HeartPulse className="h-5 w-5" />,
      highYieldTopics: ['Action Potential Kinetics', 'Cardiac Pressure-Volume', 'Renal Clearance', 'Respiratory Volumes'],
    },
    {
      id: 'pathology',
      title: 'Pathology',
      range: [49, 79],
      accentColor: '#AF52DE',
      gradient: 'from-purple-500 via-violet-500 to-indigo-600',
      glowColor: 'rgba(168, 85, 247, 0.22)',
      wash: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: <Microscope className="h-5 w-5" />,
      highYieldTopics: ['Neoplasia Oncogenes', 'Cell Injury & Apoptosis', 'Amyloidosis Staining', 'Hematology & Anemias'],
    },
    {
      id: 'pharmacology',
      title: 'Pharmacology',
      range: [80, 93],
      accentColor: '#FF9500',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      glowColor: 'rgba(249, 115, 22, 0.22)',
      wash: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      icon: <Pill className="h-5 w-5" />,
      highYieldTopics: ['Autonomic Receptors', 'Antimicrobial Classes', 'Antiarrhythmics & DOC', 'Antidotes & Toxicology'],
    },
    {
      id: 'biochemistry',
      title: 'Biochemistry',
      range: [94, 103],
      accentColor: '#34C759',
      gradient: 'from-emerald-500 via-teal-500 to-green-600',
      glowColor: 'rgba(16, 185, 129, 0.22)',
      wash: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <FlaskConical className="h-5 w-5" />,
      highYieldTopics: ['Enzyme Kinetics (Km/Vmax)', 'Inborn Metabolic Errors', 'Glycolysis Regulation', 'Vitamin Disorders'],
    },
    {
      id: 'microbiology',
      title: 'Microbiology',
      range: [104, 145],
      accentColor: '#E040FB',
      gradient: 'from-fuchsia-500 via-pink-500 to-purple-600',
      glowColor: 'rgba(217, 70, 239, 0.22)',
      wash: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
      icon: <Microscope className="h-5 w-5" />,
      highYieldTopics: ['Bacterial Toxins & Grams', 'Parasitology & Helminths', 'Mycology Dimorphism', 'Viral Serology & HIV'],
    },
  ],
  part3: [
    {
      id: 'radiology',
      title: 'Radiology',
      range: [2, 29],
      accentColor: '#5856D6',
      gradient: 'from-indigo-500 via-blue-600 to-violet-600',
      glowColor: 'rgba(99, 102, 241, 0.22)',
      wash: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      icon: <FileText className="h-5 w-5" />,
      highYieldTopics: ['Chest X-Ray Classic Signs', 'Non-Contrast CT Head', 'Barium Swallow Studies', 'MRI Sequences (T1/T2)'],
    },
    {
      id: 'dermatology',
      title: 'Dermatology',
      range: [30, 62],
      accentColor: '#FF2D55',
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      glowColor: 'rgba(244, 63, 94, 0.22)',
      wash: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      icon: <Microscope className="h-5 w-5" />,
      highYieldTopics: ['Vesiculobullous Disorders', 'Psoriasis & Auspitz Sign', 'Leprosy Ridley-Jopling', 'Skin Cancers & Melanin'],
    },
    {
      id: 'pediatrics',
      title: 'Pediatrics',
      range: [63, 78],
      accentColor: '#FF9500',
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      glowColor: 'rgba(245, 158, 11, 0.22)',
      wash: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: <HeartPulse className="h-5 w-5" />,
      highYieldTopics: ['Milestones & Development', 'Congenital Cyanotic Heart', 'Malnutrition (PEM)', 'Cold Chain & Vaccines'],
    },
    {
      id: 'gynecology',
      title: 'Gynecology',
      range: [79, 99],
      accentColor: '#E040FB',
      gradient: 'from-rose-500 via-pink-600 to-purple-600',
      glowColor: 'rgba(236, 72, 153, 0.22)',
      wash: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: <HeartPulse className="h-5 w-5" />,
      highYieldTopics: ['Cervical Cancer Bethesda', 'PCOS Rotterdam Criteria', 'Endometriosis Staging', 'Infertility Diagnostic Alg'],
    },
    {
      id: 'obstetrics',
      title: 'Obstetrics',
      range: [100, 139],
      accentColor: '#7C4DFF',
      gradient: 'from-violet-500 via-purple-600 to-indigo-600',
      glowColor: 'rgba(139, 92, 246, 0.22)',
      wash: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      icon: <BookOpenCheck className="h-5 w-5" />,
      highYieldTopics: ['Preeclampsia Pritchard', 'Antepartum Hemorrhage', 'Partogram & Labor Stages', 'Postpartum Hemorrhage Protocol'],
    },
  ],
};

const DAY1_HEADER_RE = /^(dr\. paras jamwal|final aid|anatomy|physiology|pathology|pharmacology|biochemistry|biochemis(?:try|rty)|microbiology)$/i;
const PART3_HEADER_RE = /^(dr\. paras jamwal|final aid|aid|radiology|dermatology|pediatrics|gynaecology|gynecology|obstetrics)$/i;

function tidyLine(line: string) {
  return line
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[|¦\s]+|[|¦\s]+$/g, '')
    .trim();
}

function getSlideText(source: SourceId, page: number) {
  const pageData = RAPID_REVISION_DECK_TEXT[source].find((entry) => entry.page === page);
  const rawLines = (pageData?.text || '').split(/\r?\n/).map(tidyLine).filter(Boolean);
  const headerRegex = source === 'day1' ? DAY1_HEADER_RE : PART3_HEADER_RE;
  const lines = rawLines.filter(
    (line) =>
      !headerRegex.test(line) &&
      !/(?:dr\.?\s*paras|paras jamwal|final\s+aid)/i.test(line) &&
      !/^[\W_\d]{1,5}$/.test(line) &&
      line.length > 1
  );
  const summary = source === 'part3' ? RAPID_REVISION_PART3_PAGES[page] || '' : '';
  const title =
    source === 'part3'
      ? summary.replace(/^[^:]{2,40}:\s*/, '').split(/[.;]/)[0].trim() || lines[0] || 'Rapid review'
      : lines[0]?.replace(/^[•●▪#\d.)\s-]+/, '').trim() || 'Rapid review';
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
    slides.push({
      page,
      title,
      summary,
      lines: content.lines,
      visuals: RAPID_REVISION_VISUALS[source][String(page)] || [],
    });
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
  attempts?: McqAttempt[];
  focusSubjectId?: string;
}

const normalizeSubjectId = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
const RAPID_SUBJECT_IDS = new Set(Object.values(SUBJECTS).flatMap((items) => items.map((item) => item.id)));

const mapAttemptToRapidSubjects = (attempt: McqAttempt): SubjectId[] => {
  const id = normalizeSubjectId(attempt.subjectId || '');
  if (RAPID_SUBJECT_IDS.has(id as SubjectId)) return [id as SubjectId];
  if (id === 'obg' || id === 'obstetricsgynecology' || id === 'obstetricsandgynecology') {
    const topic = `${attempt.topicName || ''} ${attempt.subtopic || ''}`.toLowerCase();
    if (/pregnan|labor|labour|fetal|placenta|obstetric|delivery|puerper/.test(topic)) return ['obstetrics'];
    if (/menstr|ovari|uter|cervi|infertil|contracept|gynec|gynaec|vulv|breast/.test(topic)) return ['gynecology'];
    return [];
  }
  return [];
};

const topicTokens = (attempt: McqAttempt) => {
  const text = `${attempt.topicName || ''} ${attempt.subtopic || ''}`.toLowerCase();
  const tokens = text.match(/[a-z]{4,}/g) || [];
  const ignored = new Set([
    'general',
    'medicine',
    'anatomy',
    'physiology',
    'pathology',
    'pharmacology',
    'microbiology',
    'biochemistry',
    'dermatology',
    'pediatrics',
    'obstetrics',
    'gynecology',
    'question',
    'topic',
  ]);
  return [...new Set(tokens.filter((token) => !ignored.has(token)))];
};

export const RapidRevisionLibrary: React.FC<RapidRevisionLibraryProps> = ({
  progress,
  onToggle,
  onPractice,
  attempts = [],
  focusSubjectId,
}) => {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState<{ sourceId: SourceId; subject: DeckSubject; slides: Slide[]; index: number } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const totalPossibleSlides = 286;

  // Build decks list with match filtering
  const subjects = useMemo(() => {
    const sourceKeys: SourceId[] = sourceFilter === 'all' ? (Object.keys(SUBJECTS) as SourceId[]) : [sourceFilter];
    return sourceKeys.flatMap((deckSourceId) =>
      SUBJECTS[deckSourceId].map((subject) => {
        const slides = buildSlides(deckSourceId, subject);
        const q = query.trim().toLowerCase();
        const matches =
          !q ||
          subject.title.toLowerCase().includes(q) ||
          subject.highYieldTopics.some((t) => t.toLowerCase().includes(q)) ||
          slides.some((slide) => `${slide.title} ${slide.summary} ${slide.lines.join(' ')}`.toLowerCase().includes(q));
        const complete = slides.filter((slide) => progress[`rapid:${deckSourceId}:${slide.page}`]).length;
        return { sourceId: deckSourceId, subject, slides, complete, matches };
      })
    ).filter((item) => item.matches);
  }, [sourceFilter, query, progress]);

  // Total reviewed across all decks
  const totalReviewed = useMemo(() => {
    return Object.keys(progress).filter((key) => key.startsWith('rapid:') && progress[key]).length;
  }, [progress]);

  const overallProgressPct = Math.min(100, Math.round((totalReviewed / totalPossibleSlides) * 100));

  // Gaps recommendations from user MCQ attempts
  const recommendations = useMemo(() => {
    const latest = attempts
      .filter((attempt) => attempt.source === 'qbank' && (!attempt.exam || attempt.exam === 'FMGE'))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 120);

    const bySubject = new Map<SubjectId, McqAttempt[]>();
    latest.forEach((attempt) =>
      mapAttemptToRapidSubjects(attempt).forEach((id) => {
        const group = bySubject.get(id) || [];
        group.push(attempt);
        bySubject.set(id, group);
      })
    );

    const allDecks = (Object.keys(SOURCE_INFO) as SourceId[]).flatMap((source) =>
      SUBJECTS[source].map((subject) => ({ source, subject, slides: buildSlides(source, subject) }))
    );

    return [...bySubject.entries()]
      .map(([id, group]) => {
        const deckInfo = allDecks.find((item) => item.subject.id === id);
        if (!deckInfo) return null;
        const wrong = group.filter((attempt) => !attempt.isCorrect).length;
        const unsure = group.filter((attempt) => ['guess', 'low', 'medium'].includes(attempt.confidence || '')).length;
        const concern = group.filter((attempt) => !attempt.isCorrect || ['guess', 'low', 'medium'].includes(attempt.confidence || '')).length;
        const tokens = [...new Set(group.flatMap(topicTokens))];
        const slideMatches = deckInfo.slides
          .map((slide, index) => {
            const text = `${slide.title} ${slide.summary} ${slide.lines.join(' ')}`.toLowerCase();
            return { index, score: tokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0) };
          })
          .sort((a, b) => b.score - a.score);
        const topicMatch = (slideMatches[0]?.score || 0) >= 2 ? slideMatches[0].index : -1;
        const firstUnreviewed = deckInfo.slides.findIndex((slide) => !progress[`rapid:${deckInfo.source}:${slide.page}`]);
        const targetIndex = topicMatch >= 0 ? topicMatch : firstUnreviewed >= 0 ? firstUnreviewed : 0;
        return {
          ...deckInfo,
          attempts: group.length,
          wrong,
          unsure,
          concern,
          gapRate: concern / group.length,
          targetIndex,
          topicMatched: topicMatch >= 0,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item && item.concern > 0)
      .sort((a, b) => {
        const focusId = normalizeSubjectId(focusSubjectId || '');
        const focusA =
          focusId && (normalizeSubjectId(a.subject.id) === focusId || normalizeSubjectId(a.subject.title) === focusId) ? 1 : 0;
        const focusB =
          focusId && (normalizeSubjectId(b.subject.id) === focusId || normalizeSubjectId(b.subject.title) === focusId) ? 1 : 0;
        return focusB - focusA || b.gapRate - a.gapRate || b.concern - a.concern || b.attempts - a.attempts;
      })
      .slice(0, 3);
  }, [attempts, focusSubjectId, progress]);

  const fmgeQbankAttempts = attempts.filter((attempt) => attempt.source === 'qbank' && (!attempt.exam || attempt.exam === 'FMGE'));
  const hasUnmappedGaps = fmgeQbankAttempts.some(
    (attempt) =>
      (!attempt.isCorrect || ['guess', 'low', 'medium'].includes(attempt.confidence || '')) &&
      mapAttemptToRapidSubjects(attempt).length === 0
  );

  const currentSlide = deck?.slides[deck.index];

  const openDeck = (deckSourceId: SourceId, subject: DeckSubject, slides: Slide[]) => {
    const firstNotReviewed = slides.findIndex((slide) => !progress[`rapid:${deckSourceId}:${slide.page}`]);
    setDeck({
      sourceId: deckSourceId,
      subject,
      slides,
      index: firstNotReviewed >= 0 ? firstNotReviewed : 0,
    });
  };

  const openRecommendation = (recommendation: (typeof recommendations)[number]) => {
    setDeck({
      sourceId: recommendation.source,
      subject: recommendation.subject,
      slides: recommendation.slides,
      index: recommendation.targetIndex,
    });
  };

  const moveSlide = (delta: number) => {
    setDeck((current) =>
      current
        ? {
            ...current,
            index: Math.max(0, Math.min(current.slides.length - 1, current.index + delta)),
          }
        : current
    );
  };

  useEffect(() => {
    if (!deck) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDeck(null);
      if (event.key === 'ArrowLeft') moveSlide(-1);
      if (event.key === 'ArrowRight') moveSlide(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deck]);

  return (
    <section className="space-y-6 sm:space-y-8 pb-12 font-sans" aria-label="Rapid revision slide decks">
      {/* ================= 1. PREMIUM SWIFTUI HERO HEADER ================= */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#141824]/90 p-6 sm:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(0,122,255,0.12),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-2xl"
      >
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/20 via-blue-500/15 to-transparent blur-3xl dark:from-indigo-500/30 dark:via-purple-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl dark:from-teal-500/25 dark:via-emerald-500/15" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Column: Heading & Context */}
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200/60 dark:border-blue-400/25 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                <BookOpen className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                HIGH-YIELD REVISION SUITE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-medium">
                11 SUBJECT DECKS · 286 SLIDES
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-[-0.035em] leading-[1.08] text-slate-900 dark:text-white">
              Accelerated Rapid Revision
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
              Distilled board-tested medical slides, pathognomonic visual tables, and rapid-recall clinical cards across Foundation and Clinical review libraries.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 font-semibold text-slate-700 dark:text-slate-200">
                Foundation (Day 1): 146 Slides
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 font-semibold text-slate-700 dark:text-slate-200">
                Clinical (Part 3): 140 Slides
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-400/25 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Auto-saved to Study Ledger
              </span>
            </div>
          </div>

          {/* Right Column: Hero Interactive Stats Card */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-4">
            <div className="p-5 rounded-3xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 shadow-sm min-w-[240px] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="uppercase font-mono tracking-wider">Overall Progress</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{overallProgressPct}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="h-2.5 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgressPct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 pt-1">
                <span>{totalReviewed} reviewed</span>
                <span className="text-slate-400">{totalPossibleSlides - totalReviewed} remaining</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-400/20 text-indigo-950 dark:text-indigo-200 text-xs leading-5">
              <Flame className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Tap any subject deck below to begin instant slide-by-slide revision.</span>
            </div>
          </div>
        </div>

        {/* Segmented Library Filter & Search Toolbar */}
        <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Segmented Pill Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 self-start md:self-auto overflow-x-auto scrollbar-none max-w-full">
            {(
              [
                { id: 'all', label: 'All Decks', count: 11 },
                { id: 'day1', label: 'Foundation Review', count: 6 },
                { id: 'part3', label: 'Clinical Review', count: 5 },
              ] as const
            ).map((tab) => {
              const isSelected = sourceFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSourceFilter(tab.id);
                    setQuery('');
                  }}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="rapid-source-tab"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Capsule */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects or key topics..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ================= 2. SMART DIAGNOSTIC GAPS INTELLIGENCE ================= */}
      {recommendations.length > 0 ? (
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-[26px] border border-blue-200/80 dark:border-blue-400/20 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-blue-950/25 dark:via-[#131826] dark:to-indigo-950/20 p-5 sm:p-7 shadow-[0_12px_36px_-10px_rgba(37,99,235,0.08)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100 dark:border-white/10">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                <TrendingDown className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  DIAGNOSTIC ADAPTIVE INTELLIGENCE
                </span>
                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                  Targeted Revision From Recent Question Bank Gaps
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  High-yield decks selected automatically based on your latest missed or low-confidence questions.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-semibold font-mono self-start sm:self-center">
              {recommendations.length} PRIORITY DECKS
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((item) => (
              <motion.article
                key={`${item.source}-${item.subject.id}`}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="flex flex-col justify-between rounded-2xl border border-white/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-5 shadow-xs backdrop-blur-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.subject.wash}`}>
                      {item.subject.icon}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                      {SOURCE_INFO[item.source].title}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold font-display text-slate-900 dark:text-white">{item.subject.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.attempts} recent questions ·{' '}
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{item.wrong} missed</span> ·{' '}
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.unsure} uncertain</span>
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 min-h-[36px]">
                    {item.topicMatched
                      ? `Matches your recent incorrect topics. Suggested entry at source page ${item.slides[item.targetIndex]?.page}.`
                      : `Continue from your next unreviewed slide in ${item.subject.title}.`}
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openRecommendation(item)}
                  className={`mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r ${SOURCE_INFO[item.source].gradient} text-white text-xs font-semibold font-display shadow-xs transition hover:brightness-105 cursor-pointer`}
                >
                  <span>Study {item.subject.title} Deck</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </motion.button>
              </motion.article>
            ))}
          </div>
        </motion.section>
      ) : fmgeQbankAttempts.length ? (
        hasUnmappedGaps ? (
          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-400/20 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <strong>Question Bank Notice:</strong> Recent misses are in subjects outside the 11 Rapid Revision decks. Browse all standard subject decks below for systematic review.
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-400/20 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Strong Question Bank Performance:</strong> No urgent diagnostic revision gaps detected in your recent answers. Keep practicing to maintain high accuracy!
            </span>
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 p-4 text-xs text-slate-600 dark:text-slate-400">
          <strong>Smart Recommendations:</strong> As you practice Questions in the Question Bank, high-yield revision recommendations will automatically appear here based on your misses.
        </div>
      )}

      {/* ================= 3. SUBJECT DECKS GRID ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              BOARD-CERTIFIED LIBRARIES
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Choose a Subject Deck
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {subjects.length} DECKS ACTIVE
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(({ sourceId: deckSourceId, subject, slides, complete }, index) => {
            const isCompleted = complete === slides.length && slides.length > 0;
            const completionPct = slides.length ? Math.round((complete / slides.length) * 100) : 0;

            return (
              <motion.article
                key={`${deckSourceId}-${subject.id}`}
                initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{
                  delay: reduceMotion ? 0 : index * 0.03,
                  duration: 0.28,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#151924] p-5 sm:p-6 shadow-[0_6px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition-all"
              >
                {/* Decorative Top Accent Stripe */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${subject.gradient}`} />

                {/* Ambient Glow */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity"
                  style={{ background: subject.glowColor }}
                />

                <div className="space-y-4 relative z-10">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${subject.wash} shadow-xs`}>
                        {subject.icon}
                      </span>
                      <div>
                        <h4 className="text-lg font-bold font-display text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {subject.title}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {SOURCE_INFO[deckSourceId].title}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                      {slides.length} slides
                    </span>
                  </div>

                  {/* High-Yield Topics Preview Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {subject.highYieldTopics.slice(0, 3).map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/80 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 truncate max-w-[170px]"
                        title={topic}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{complete} of {slides.length} reviewed</span>
                      <span className={isCompleted ? 'text-emerald-600 font-bold' : ''}>{completionPct}%</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPct}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : `bg-gradient-to-r ${subject.gradient}`
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!slides.length}
                  onClick={() => openDeck(deckSourceId, subject, slides)}
                  className={`mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold font-display transition-all cursor-pointer shadow-xs ${
                    isCompleted
                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white'
                      : `bg-gradient-to-r ${subject.gradient} text-white hover:brightness-105`
                  } disabled:opacity-50`}
                >
                  <span>{isCompleted ? `Review ${subject.title} Deck` : `Open ${subject.title} Deck`}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </motion.button>
              </motion.article>
            );
          })}
        </div>

        {!subjects.length && (
          <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No subject decks matched "{query}".
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSourceFilter('all');
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset filters & search
            </button>
          </div>
        )}
      </div>

      {/* ================= 4. PRESENTATION MODAL / SLIDE VIEWER ================= */}
      {deck && currentSlide &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/90 backdrop-blur-2xl text-white select-none"
            role="dialog"
            aria-modal="true"
            aria-label={`${deck.subject.title} slide deck`}
          >
            {/* Top Modal Header */}
            <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-slate-900/90 px-4 sm:px-8 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${deck.subject.wash}`}>
                  {deck.subject.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base truncate text-white">
                      {deck.subject.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-slate-300">
                      {SOURCE_INFO[deck.sourceId].title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    Slide {deck.index + 1} of {deck.slides.length} · Source Page {currentSlide.page}
                  </p>
                </div>
              </div>

              {/* Actions Right */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-pressed={!!progress[`rapid:${deck.sourceId}:${currentSlide.page}`]}
                  onClick={() => onToggle(`rapid:${deck.sourceId}:${currentSlide.page}`)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
                    progress[`rapid:${deck.sourceId}:${currentSlide.page}`]
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                  }`}
                >
                  <Check
                    className={`h-3.5 w-3.5 ${
                      progress[`rapid:${deck.sourceId}:${currentSlide.page}`]
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>
                    {progress[`rapid:${deck.sourceId}:${currentSlide.page}`] ? 'Reviewed' : 'Mark Reviewed'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeck(null)}
                  aria-label="Close slide deck"
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Slide Body Canvas */}
            <div className="relative flex-1 min-h-0 flex items-stretch justify-center p-3 sm:p-6 lg:p-8 overflow-hidden">
              {/* Left Previous Slide Trigger Button */}
              <button
                type="button"
                disabled={deck.index === 0}
                onClick={() => moveSlide(-1)}
                aria-label="Previous slide"
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/15 shadow-xl transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Main Presentation Slide Card */}
              <div className="relative flex-1 min-h-0 max-w-5xl flex flex-col rounded-[26px] sm:rounded-[34px] border border-white/15 bg-white dark:bg-[#141A28] text-slate-900 dark:text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Top Accent Stripe */}
                <div className={`h-2 shrink-0 bg-gradient-to-r ${deck.subject.gradient}`} />

                {/* Sub-header Bar */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 px-5 sm:px-8 py-3.5 bg-slate-50/80 dark:bg-white/[0.02]">
                  <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${deck.subject.gradient}`} />
                    {deck.subject.title} · Rapid Recall
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {String(deck.index + 1).padStart(2, '0')} / {String(deck.slides.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Slide Animated Content Scroller */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${deck.sourceId}-${currentSlide.page}`}
                    initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-9 py-6 sm:py-8 space-y-6 scrollbar-thin"
                  >
                    {/* Slide Title */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {currentSlide.summary ? 'HIGH-YIELD CORE SUMMARY' : 'ESSENTIAL STUDY NOTES'}
                      </span>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-slate-900 dark:text-white leading-tight">
                        {currentSlide.title}
                      </h2>
                    </div>

                    {/* Summary Banner */}
                    {currentSlide.summary && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-400/20 text-xs sm:text-sm leading-relaxed text-blue-950 dark:text-blue-100">
                        {currentSlide.summary}
                      </div>
                    )}

                    {/* Visual Figures Gallery */}
                    {!!currentSlide.visuals.length && (
                      <section className="space-y-3" aria-label="Study visuals">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Study Visuals ({currentSlide.visuals.length})
                          </h3>
                          <span className="text-[11px] text-slate-400">Tap to inspect</span>
                        </div>

                        <div
                          className={`grid gap-3 ${
                            currentSlide.visuals.length === 1
                              ? 'grid-cols-1'
                              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                          }`}
                        >
                          {currentSlide.visuals.map((visual, vIdx) => (
                            <figure
                              key={visual}
                              onClick={() => setZoomImage(visual)}
                              className="group/img relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-2 shadow-xs cursor-zoom-in"
                            >
                              <img
                                src={visual}
                                alt={`${currentSlide.title} visual figure ${vIdx + 1}`}
                                loading="lazy"
                                className="w-full rounded-xl object-contain max-h-[280px] group-hover/img:scale-[1.02] transition-transform"
                              />
                              <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <Maximize2 className="h-3.5 w-3.5" />
                              </div>
                              <figcaption className="pt-2 px-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Figure {vIdx + 1} · Board Image Key
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Key Lines & Structured Concepts */}
                    {currentSlide.lines.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2 pt-2">
                        {currentSlide.lines.map((line, idx) => {
                          const relation = splitRelationship(line.replace(/^[•●▪#\-–—\s]+/, ''));
                          const clean = line.replace(/^[•●▪#\-–—\s]+/, '').trim();
                          const isHeading =
                            !relation && clean.length <= 46 && !/[.!?]$/.test(clean) && !/^\d+[.)]/.test(clean);

                          if (!clean) return null;

                          if (isHeading) {
                            return (
                              <h3
                                key={`${idx}-${clean}`}
                                className="col-span-full pt-2 pb-1 border-b border-slate-200 dark:border-white/10 text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400"
                              >
                                {clean}
                              </h3>
                            );
                          }

                          return (
                            <div
                              key={`${idx}-${clean}`}
                              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                                relation
                                  ? 'border-blue-200/70 dark:border-blue-400/20 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs'
                                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]'
                              }`}
                            >
                              {relation ? (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                    {relation[0]}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    <span className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200">
                                      {relation.slice(1).join(' · ')}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2.5">
                                  <span
                                    className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 bg-gradient-to-r ${deck.subject.gradient}`}
                                  />
                                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                                    {clean}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Next Slide Trigger Button */}
              <button
                type="button"
                disabled={deck.index === deck.slides.length - 1}
                onClick={() => moveSlide(1)}
                aria-label="Next slide"
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/15 shadow-xl transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Bottom Modal Dock Bar */}
            <footer className="flex min-h-16 items-center justify-between gap-4 border-t border-white/10 bg-slate-900/90 px-4 sm:px-8 shrink-0">
              {/* Progress Scrubber */}
              <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
                <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${deck.subject.gradient} transition-all`}
                    style={{ width: `${((deck.index + 1) / deck.slides.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {Math.round(((deck.index + 1) / deck.slides.length) * 100)}%
                </span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>[← / → Navigate]</span>
                <span>·</span>
                <span>[Esc Close]</span>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deck.index === 0}
                  onClick={() => moveSlide(-1)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={deck.index === deck.slides.length - 1}
                  onClick={() => moveSlide(1)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r ${deck.subject.gradient} text-white text-xs font-semibold shadow-sm hover:brightness-105 disabled:opacity-30 cursor-pointer`}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </footer>

            {/* Enlarge Image Modal */}
            {zoomImage && (
              <div
                className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
                onClick={() => setZoomImage(null)}
              >
                <img
                  src={zoomImage}
                  alt="Enlarged study visual"
                  className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
                />
              </div>
            )}
          </div>,
          document.body
        )}
    </section>
  );
};
