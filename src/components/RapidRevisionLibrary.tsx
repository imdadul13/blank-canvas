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
  Maximize2,
  Zap,
  Target,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

// — Circular SVG Gauge
const Gauge: React.FC<{
  pct: number;
  size?: number;
  sw?: number;
  color?: string;
  track?: string;
}> = ({ pct, size = 52, sw = 4.5, color = '#F97316', track = '#FFEDD5' }) => {
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
      <span className="absolute font-mono text-[11px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
        {pct}%
      </span>
    </div>
  );
};
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

  // Category reviewed counts
  const day1Reviewed = useMemo(() => {
    return Object.keys(progress).filter((key) => key.startsWith('rapid:day1:') && progress[key]).length;
  }, [progress]);

  const part3Reviewed = useMemo(() => {
    return Object.keys(progress).filter((key) => key.startsWith('rapid:part3:') && progress[key]).length;
  }, [progress]);

  const totalVisualSlides = useMemo(() => {
    let count = 0;
    (Object.keys(RAPID_REVISION_VISUALS) as SourceId[]).forEach((src) => {
      count += Object.keys(RAPID_REVISION_VISUALS[src] || {}).length;
    });
    return count;
  }, []);

  const visualReviewed = useMemo(() => {
    let count = 0;
    (Object.keys(RAPID_REVISION_VISUALS) as SourceId[]).forEach((src) => {
      Object.keys(RAPID_REVISION_VISUALS[src] || {}).forEach((pg) => {
        if (progress[`rapid:${src}:${pg}`]) count++;
      });
    });
    return count;
  }, [progress]);

  const day1Pct = Math.min(100, Math.round((day1Reviewed / 146) * 100));
  const part3Pct = Math.min(100, Math.round((part3Reviewed / 140) * 100));
  const visualPct = totalVisualSlides ? Math.min(100, Math.round((visualReviewed / totalVisualSlides) * 100)) : 0;

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
      {/* ═══ 1. ATMOSPHERIC SUNSET FLAME HERO BANNER ═══ */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] text-white shadow-[0_8px_40px_rgba(234,88,12,0.28),0_2px_8px_rgba(0,0,0,0.12)]"
        style={{
          background: 'linear-gradient(135deg, #451A03 0%, #78350F 35%, #9A3412 70%, #EA580C 100%)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(249,115,22,0.38) 0%, transparent 65%)' }}
        />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Decorative orbital rings */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 sm:w-56 sm:h-56 rounded-full border border-white/[0.08] pointer-events-none" />
        <div className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 rounded-full border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            {/* Left Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <Flame className="h-4 w-4" />
                </div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                  RAPID REVISION DECK
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 font-mono text-[10px] font-medium border border-white/10">
                  11 DECKS · 286 SLIDES
                </span>
              </div>

              <h1 className="text-[34px] sm:text-[46px] font-black tracking-[-0.04em] leading-[0.92] text-white">
                Scan.<br />
                <span style={{ color: '#FDBA74' }}>Blitz. High-Yield Recall.</span>
              </h1>

              <p className="text-[13px] sm:text-[14px] text-white/70 leading-snug max-w-xl">
                Distilled board-tested medical slides, pathognomonic visual tables, and rapid-recall clinical cards across Foundation and Clinical review libraries.
              </p>

              {/* Overall Progress Bar Track */}
              <div className="max-w-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                  <span>Reviewed Coverage</span>
                  <span style={{ color: '#FDBA74' }}>{overallProgressPct}% ({totalReviewed}/{totalPossibleSlides})</span>
                </div>
                <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgressPct}%` }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #FDBA74 0%, #EA580C 100%)',
                      boxShadow: '0 0 10px rgba(253,186,116,0.6)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Badge Cluster */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md min-w-[220px] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                  <span className="uppercase font-mono text-[10px] tracking-wider">Review Pace</span>
                  <span className="font-bold text-white text-sm">{totalReviewed} Done</span>
                </div>
                <div className="text-xs text-white/70">
                  {totalPossibleSlides - totalReviewed} high-yield slides remaining across Day 1 & Part 3.
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs">
                <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                <span>Auto-saved to your personal study ledger on every slide mark.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. 3 BENTO GAUGE CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            id: 'day1',
            title: 'Foundation Review',
            subtitle: 'Day 1 Pre- & Para-Clinical',
            slidesCount: 146,
            reviewedCount: day1Reviewed,
            pct: day1Pct,
            color: '#3B82F6',
            track: '#DBEAFE',
            gradient: 'from-blue-500 via-indigo-600 to-purple-600',
            border: 'border-blue-200/70 dark:border-blue-500/20',
            description: 'Anatomy, Physiology, Pathology, Pharmacology, Biochemistry, Microbiology (146 slides)',
          },
          {
            id: 'part3',
            title: 'Clinical Review',
            subtitle: 'Part 3 Clinicals & Shorts',
            slidesCount: 140,
            reviewedCount: part3Reviewed,
            pct: part3Pct,
            color: '#10B981',
            track: '#D1FAE5',
            gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
            border: 'border-emerald-200/70 dark:border-emerald-500/20',
            description: 'Radiology, Dermatology, Pediatrics, Gynecology, Obstetrics (140 slides)',
          },
          {
            id: 'visuals',
            title: 'Visual IBQ Hallmarks',
            subtitle: 'High-Yield Figures & Imaging',
            slidesCount: totalVisualSlides,
            reviewedCount: visualReviewed,
            pct: visualPct,
            color: '#F59E0B',
            track: '#FEF3C7',
            gradient: 'from-amber-500 via-orange-500 to-rose-600',
            border: 'border-amber-200/70 dark:border-amber-500/20',
            description: 'Radiographs, CT scans, histopathology stains, and clinical dermatological hallmarks',
          },
        ].map((card, idx) => (
          <motion.div
            key={card.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border ${card.border} bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all group`}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `${card.color}08` }}
            />

            <div className="relative flex flex-col gap-3.5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${card.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                    style={{ boxShadow: `0 3px 10px ${card.color}35` }}
                  >
                    <BookOpenCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-[14px] leading-tight">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {card.subtitle}
                    </div>
                  </div>
                </div>
                <Gauge pct={card.pct} size={52} sw={4.5} color={card.color} track={card.track} />
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(card.pct > 0 ? 5 : 0, card.pct)}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${card.color} 0%, ${card.color}CC 100%)` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {card.reviewedCount} / {card.slidesCount} slides
                  </span>
                  <span className="font-semibold" style={{ color: card.color }}>
                    {card.pct}% reviewed
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug border-t border-slate-100 dark:border-white/10 pt-2.5">
                {card.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ 3. MAIN SPLIT: 8-COL DECKS LIST + 4-COL SIDEBAR ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Panel — 8 columns */}
        <div className="lg:col-span-8 space-y-5">
          {/* Diagnostic intelligence section if gaps exist */}
          {recommendations.length > 0 && (
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-200/80 dark:border-orange-400/20 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/50 dark:from-orange-950/25 dark:via-slate-900 dark:to-amber-950/20 p-5 sm:p-6 shadow-[0_6px_20px_rgba(249,115,22,0.06)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-orange-100 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25">
                    <TrendingDown className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      DIAGNOSTIC ADAPTIVE INTELLIGENCE
                    </span>
                    <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                      Targeted Revision From Recent MCQ Gaps
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Prioritized slides matched to your latest incorrect or low-confidence questions.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-100/90 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 text-xs font-semibold font-mono self-start sm:self-center">
                  {recommendations.length} PRIORITY DECKS
                </span>
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((item) => (
                  <div
                    key={`${item.source}-${item.subject.id}`}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 p-4 shadow-2xs backdrop-blur-md"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.subject.wash}`}>
                          {item.subject.icon}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {SOURCE_INFO[item.source].title}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold font-display text-slate-900 dark:text-white">{item.subject.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.attempts} Qs ·{' '}
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">{item.wrong} missed</span>
                        </p>
                      </div>

                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 min-h-[30px]">
                        {item.topicMatched
                          ? `Target slide page ${item.slides[item.targetIndex]?.page} matches missed topics.`
                          : `Resume from next unreviewed slide.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openRecommendation(item)}
                      className={`mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gradient-to-r ${SOURCE_INFO[item.source].gradient} text-white text-xs font-semibold font-display shadow-xs transition hover:brightness-105 cursor-pointer`}
                    >
                      <span>Study {item.subject.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Subject Decks Card Container */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Card Header & Filter Toolbar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">
                    Rapid Revision Decks
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {subjects.length} active subject decks · Board-tested slides
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 self-start sm:self-auto overflow-x-auto scrollbar-none">
                {(
                  [
                    { id: 'all', label: 'All', count: 11 },
                    { id: 'day1', label: 'Day 1 Core', count: 6 },
                    { id: 'part3', label: 'Part 3 Clinical', count: 5 },
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
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? 'text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="rapid-filter-pill"
                          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                      <span
                        className={`relative z-10 px-1 py-0.2 rounded-full text-[9px] font-mono ${
                          isSelected
                            ? 'bg-orange-100 dark:bg-orange-400/20 text-orange-700 dark:text-orange-300'
                            : 'bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subject decks or key clinical topics..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-black/30 border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
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

            {/* Subject Decks Grid */}
            <div className="p-5 sm:p-6 grid gap-4 sm:grid-cols-2">
              {subjects.map(({ sourceId: deckSourceId, subject, slides, complete }, index) => {
                const isCompleted = complete === slides.length && slides.length > 0;
                const completionPct = slides.length ? Math.round((complete / slides.length) * 100) : 0;

                return (
                  <motion.article
                    key={`${deckSourceId}-${subject.id}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    transition={{
                      delay: reduceMotion ? 0 : index * 0.02,
                      duration: 0.25,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
                  >
                    {/* Top Accent Stripe */}
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${subject.gradient}`} />

                    <div className="space-y-3.5 relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${subject.wash} shadow-xs`}>
                            {subject.icon}
                          </span>
                          <div>
                            <h4 className="text-[15px] font-bold font-display text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {subject.title}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {SOURCE_INFO[deckSourceId].title}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 shrink-0">
                          {slides.length} slides
                        </span>
                      </div>

                      {/* High-Yield Topics Badges */}
                      <div className="flex flex-wrap gap-1">
                        {subject.highYieldTopics.slice(0, 3).map((topic, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md text-[9.5px] font-medium bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 truncate max-w-[150px]"
                            title={topic}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span>{complete} / {slides.length} reviewed</span>
                          <span className={isCompleted ? 'text-emerald-600 font-bold' : ''}>{completionPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
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

                    {/* Dual Action Buttons: Open Deck + Practice 10 MCQs */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!slides.length}
                        onClick={() => openDeck(deckSourceId, subject, slides)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer shadow-xs ${
                          isCompleted
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white'
                            : `bg-gradient-to-r ${subject.gradient} text-white hover:brightness-105`
                        } disabled:opacity-50`}
                      >
                        <span>{isCompleted ? 'Review Deck' : 'Open Deck'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onPractice(subject.id)}
                        title={`Launch 10-MCQ drill on ${subject.title}`}
                        className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-500/20 text-xs font-semibold font-display flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>10 MCQs</span>
                      </motion.button>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {!subjects.length && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No subject decks matched "{query}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSourceFilter('all');
                  }}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                >
                  Reset filters & search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar — 4 columns */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Actions Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/20 flex items-center justify-center text-[#EA580C]">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[14px] leading-tight">
                  Rapid Actions
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Jump right into high-yield review</p>
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              {[
                {
                  label: totalReviewed > 0 ? 'Continue Rapid Review' : 'Start Rapid Review',
                  sub: totalReviewed > 0 ? `Resume next unreviewed slide` : `Begin Day 1 Anatomy deck`,
                  icon: Play,
                  iconBg: '#EA580C',
                  iconFill: true,
                  onClick: () => {
                    // Open first subject with unreviewed slides
                    const firstIncomplete = subjects.find((s) => s.complete < s.slides.length) || subjects[0];
                    if (firstIncomplete) {
                      openDeck(firstIncomplete.sourceId, firstIncomplete.subject, firstIncomplete.slides);
                    }
                  },
                },
                {
                  label: 'Launch 10-MCQ Drill',
                  sub: 'Practice board questions right now',
                  icon: Target,
                  iconBg: '#3B82F6',
                  iconFill: false,
                  onClick: () => onPractice(subjects[0]?.subject.id || 'anatomy'),
                },
                {
                  label: 'Day 1 Pre-Clinical Core',
                  sub: 'Filter 6 Foundation Decks (146 slides)',
                  icon: BookOpen,
                  iconBg: '#10B981',
                  iconFill: false,
                  onClick: () => {
                    setSourceFilter('day1');
                    setQuery('');
                  },
                },
                {
                  label: 'Part 3 Clinical Review',
                  sub: 'Filter 5 Clinical Decks (140 slides)',
                  icon: Stethoscope,
                  iconBg: '#8B5CF6',
                  iconFill: false,
                  onClick: () => {
                    setSourceFilter('part3');
                    setQuery('');
                  },
                },
              ].map(({ label, sub, icon: Icon, iconBg, iconFill, onClick }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={onClick}
                  className="w-full p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/10 flex items-center gap-3 text-left cursor-pointer transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-105"
                    style={{ background: iconBg, boxShadow: `0 2px 8px ${iconBg}40` }}
                  >
                    <Icon className={`h-4 w-4 ${iconFill ? 'fill-white' : ''}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight">
                      {label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Stats Tile */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Award className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Rapid Review Stats</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Slides', value: totalPossibleSlides, icon: BookOpen, color: '#EA580C' },
                { label: 'Reviewed', value: totalReviewed, icon: CheckCircle2, color: '#10B981' },
                { label: 'Coverage', value: `${overallProgressPct}%`, icon: Clock, color: '#3B82F6' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 p-3 text-center"
                >
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                  <div className="font-black text-[18px] text-slate-900 dark:text-white leading-none tracking-tight">
                    {value}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Rapid Blitz Maxim Banner */}
            <div
              className="relative overflow-hidden rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border: '1px solid rgba(234,88,12,0.25)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-orange-900">
                    The Blitz Rule
                  </h4>
                  <p className="text-[12px] text-orange-950/90 leading-snug">
                    "Review 20 high-yield slides before breakfast. Blitz 10 MCQs right after. Pattern recognition beats memorization every time."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
