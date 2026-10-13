import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Search,
  BookOpen,
  Award,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Check,
  Filter,
  Grid,
  Columns,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Brain,
  ShieldCheck,
  Play,
  X,
  ChevronDown,
} from 'lucide-react';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import { generateFlashcardDeck } from '../../utils/flashcardEngine';
import type { FlashcardItem, FlashcardDeck } from '../../types';
import { SubjectAppleIcon } from '../SubjectAppleIcon';

interface StudyFlashcardHubProps {
  initialSubjectId?: string;
  initialTopicId?: string;
  onLaunchPracticeMcq: (subjectId: string, topicId?: string, topicName?: string) => void;
  onSelectSubject?: (subjectId: string) => void;
}

// — Circular SVG Gauge
const Gauge: React.FC<{
  pct: number;
  size?: number;
  sw?: number;
  color?: string;
  track?: string;
}> = ({ pct, size = 52, sw = 4.5, color = '#6366F1', track = '#E0E7FF' }) => {
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
      <span className="absolute font-mono text-[11px] font-black text-slate-900 tracking-tight leading-none">
        {pct}%
      </span>
    </div>
  );
};

export const StudyFlashcardHub: React.FC<StudyFlashcardHubProps> = ({
  initialSubjectId = 'obg',
  initialTopicId,
  onLaunchPracticeMcq,
  onSelectSubject,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const currentSubject = useMemo(
    () => FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || FMGE_SUBJECTS[0],
    [selectedSubjectId]
  );

  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || currentSubject.topics[0]?.id || ''
  );

  // When subject changes, set topic to first topic
  useEffect(() => {
    if (!currentSubject.topics.some((t) => t.id === selectedTopicId)) {
      setSelectedTopicId(currentSubject.topics[0]?.id || '');
    }
  }, [currentSubject, selectedTopicId]);

  const currentTopic = useMemo(
    () => currentSubject.topics.find((t) => t.id === selectedTopicId) || currentSubject.topics[0],
    [currentSubject, selectedTopicId]
  );

  // Load flashcard deck
  const flashcardDeck: FlashcardDeck = useMemo(() => {
    if (!currentSubject || !currentTopic) {
      return {
        topicId: '',
        topicName: '',
        subjectId: '',
        subjectName: '',
        cards: [],
        masteredCount: 0,
        totalCards: 0,
      };
    }
    return generateFlashcardDeck(currentSubject.id, currentTopic.id, currentTopic.name);
  }, [currentSubject, currentTopic]);

  // Mastered cards tracker in local state
  const [masteredCardIds, setMasteredCardIds] = useState<Set<string>>(new Set());

  // Interactive Flip Mode state
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'flip' | 'overview'>('flip');

  // Search and filter for overview mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'high-yield' | 'core' | 'trap'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'unmastered'>('all');

  // Reset index when deck changes
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [selectedSubjectId, selectedTopicId]);

  // Keyboard navigation for Flip mode
  useEffect(() => {
    if (viewMode !== 'flip') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsFlipped(false);
        setCurrentCardIndex((prev) => Math.min(flashcardDeck.cards.length - 1, prev + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsFlipped(false);
        setCurrentCardIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key.toLowerCase() === 'm' && flashcardDeck.cards[currentCardIndex]) {
        e.preventDefault();
        toggleMastered(flashcardDeck.cards[currentCardIndex].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, flashcardDeck.cards.length, currentCardIndex]);

  const activeCard: FlashcardItem | undefined = flashcardDeck.cards[currentCardIndex];
  const isCurrentCardMastered = activeCard ? masteredCardIds.has(activeCard.id) : false;

  const toggleMastered = (cardId: string) => {
    setMasteredCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const filteredCards = useMemo(() => {
    return flashcardDeck.cards.filter((card) => {
      if (filterDifficulty !== 'all' && card.difficulty !== filterDifficulty) return false;
      if (filterStatus === 'mastered' && !masteredCardIds.has(card.id)) return false;
      if (filterStatus === 'unmastered' && masteredCardIds.has(card.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          card.front.toLowerCase().includes(q) ||
          card.back.toLowerCase().includes(q) ||
          (card.clinicalPearl && card.clinicalPearl.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [flashcardDeck.cards, filterDifficulty, filterStatus, masteredCardIds, searchQuery]);

  const totalMasteredCount = useMemo(() => {
    return flashcardDeck.cards.filter((c) => masteredCardIds.has(c.id)).length;
  }, [flashcardDeck.cards, masteredCardIds]);

  const masteryPct = flashcardDeck.cards.length
    ? Math.round((totalMasteredCount / flashcardDeck.cards.length) * 100)
    : 0;

  // Bento category stats for active deck
  const coreCardsCount = useMemo(
    () => flashcardDeck.cards.filter((c) => c.difficulty === 'core' || !c.difficulty).length,
    [flashcardDeck.cards]
  );
  const trapCardsCount = useMemo(
    () => flashcardDeck.cards.filter((c) => c.difficulty === 'trap' || c.front.toLowerCase().includes('trap')).length,
    [flashcardDeck.cards]
  );
  const highYieldCardsCount = useMemo(
    () => flashcardDeck.cards.filter((c) => c.difficulty === 'high-yield' || Boolean(c.clinicalPearl)).length,
    [flashcardDeck.cards]
  );

  return (
    <div className="space-y-5 sm:space-y-7 pb-24 sm:pb-20 lg:pb-16 font-['Plus_Jakarta_Sans'] text-[#1D1D1F]">
      {/* ═══ 1. ATMOSPHERIC HERO BANNER (REVISION MATRIX SIGNATURE DESIGN) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem]"
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 35%, #4338CA 70%, #6366F1 100%)',
          boxShadow: '0 8px 40px rgba(99,102,241,0.28), 0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(165,180,252,0.35) 0%, transparent 65%)' }}
        />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Decorative orbit circles */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 sm:w-52 sm:h-52 rounded-full border border-white/[0.08] pointer-events-none" />
        <div className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <Layers className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                  FLASHCARD MASTERY ENGINE
                </span>
              </div>

              <h1 className="text-[36px] sm:text-[48px] font-black tracking-[-0.04em] leading-[0.88] text-white">
                Prompt. Recall.<br />
                <span style={{ color: '#A5B4FC' }}>Retain Instantly.</span>
              </h1>

              <p className="text-[13px] sm:text-[14px] text-white/70 leading-snug max-w-lg">
                High-frequency memory anchors across 19 FMGE disciplines. Rapidly drill gold-standard criteria, diagnostic traps, and high-yield buzzwords.
              </p>

              {/* Mastery progress bar */}
              <div className="max-w-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                  <span>Topic Retention Rate</span>
                  <span style={{ color: '#A5B4FC' }}>
                    {totalMasteredCount}/{flashcardDeck.cards.length} ({masteryPct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${masteryPct}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #A5B4FC 0%, #6366F1 100%)',
                      boxShadow: '0 0 10px rgba(165,180,252,0.6)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Quick Action Pill */}
            <div className="shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onLaunchPracticeMcq(currentSubject.id, currentTopic?.id, currentTopic?.name)
                }
                className="px-5 py-3 rounded-2xl bg-white text-indigo-950 font-bold text-xs sm:text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-indigo-600" />
                <span>10-MCQ Drill on Topic</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. 3 BENTO METRIC CARDS WITH CIRCULAR GAUGES (ACTIVE RECALL PILLARS) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            type: 'Core',
            title: 'Core Concepts Deck',
            subtitle: `${coreCardsCount || flashcardDeck.cards.length} High-Yield Cards`,
            pct: masteryPct,
            done: totalMasteredCount,
            total: flashcardDeck.cards.length,
            color: '#6366F1',
            track: '#E0E7FF',
            gradient: 'from-indigo-500 to-purple-600',
            border: 'border-indigo-200/70',
            description: 'Pathognomonic signs, normal laboratory benchmarks, gold-standard modalities.',
          },
          {
            type: 'Traps',
            title: 'Diagnostic Traps & Dilemmas',
            subtitle: `${trapCardsCount || 4} Lookalike Pairs`,
            pct: Math.round(masteryPct * 0.9),
            done: Math.round(totalMasteredCount * 0.9),
            total: flashcardDeck.cards.length,
            color: '#F59E0B',
            track: '#FEF3C7',
            gradient: 'from-amber-500 to-orange-500',
            border: 'border-amber-200/70',
            description: 'Distractor pitfalls, lookalike syndromes, and frequent FMGE exam traps.',
          },
          {
            type: 'Pearls',
            title: 'Rapid Recall Buzzwords',
            subtitle: `${highYieldCardsCount || flashcardDeck.cards.length} Clinical Pearls`,
            pct: Math.min(100, Math.round(masteryPct * 1.1)),
            done: Math.min(flashcardDeck.cards.length, Math.round(totalMasteredCount * 1.1)),
            total: flashcardDeck.cards.length,
            color: '#10B981',
            track: '#D1FAE5',
            gradient: 'from-emerald-500 to-teal-600',
            border: 'border-emerald-200/70',
            description: 'One-liner high-yield associations, classical tri-signs, and mnemonics.',
          },
        ].map((item, idx) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border ${item.border} bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all group`}
          >
            <div className="relative flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                    style={{ boxShadow: `0 3px 10px ${item.color}35` }}
                  >
                    <span className="font-mono font-black text-[12px]">{item.type.slice(0, 3)}</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1D1D1F] text-[14px] leading-tight">{item.title}</div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
                <Gauge pct={item.pct} size={52} sw={4.5} color={item.color} track={item.track} />
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(item.pct > 0 ? 5 : 0, item.pct)}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-mono text-slate-500">{item.done} / {item.total} mastered</span>
                  <span className="font-semibold" style={{ color: item.color }}>{item.pct}% done</span>
                </div>
              </div>

              <p className="text-[11px] text-[#8E8E93] leading-snug border-t border-slate-100 pt-2.5">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ 3. MAIN FLASHCARD ENGINE (8 COLS) + SIDEBAR (4 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 8 Cols */}
        <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden space-y-4 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">
                  {currentSubject.name}: Flashcard Deck
                </h2>
                <p className="text-[11px] text-[#8E8E93] font-mono">
                  {currentTopic.name} · {flashcardDeck.cards.length} Cards Total
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('flip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'flip'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Card Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'overview'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>All Cards ({flashcardDeck.cards.length})</span>
              </button>
            </div>
          </div>

          {/* Subjects Horizontal Pill Scroller */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Discipline ({FMGE_SUBJECTS.length} Subjects)
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {FMGE_SUBJECTS.map((sub) => {
                const active = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <SubjectAppleIcon subjectId={sub.id} size="sm" />
                    <span>{sub.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {sub.weightage}M
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Select Dropdown */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 shrink-0">Topic:</span>
            <div className="relative flex-1">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 text-slate-900 rounded-lg py-1.5 pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {currentSubject.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isHighYield ? '★ (High-Yield)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ── CARD MODE (3D Flip Mode) ── */}
          {viewMode === 'flip' ? (
            flashcardDeck.cards.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">
                  No Flashcards in this Topic
                </h4>
                <p className="text-xs text-slate-500">
                  Select another topic or launch an adaptive 10-MCQ session.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 3D Flip Card Container */}
                <div className="relative min-h-[360px] sm:min-h-[380px] w-full [perspective:1200px]">
                  <motion.div
                    className="w-full h-full relative cursor-pointer select-none [transform-style:preserve-3d] transition-transform duration-500"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {/* Front of Card */}
                    <div
                      className={`w-full min-h-[360px] sm:min-h-[380px] p-6 sm:p-7 rounded-2xl sm:rounded-3xl border bg-white shadow-md flex flex-col justify-between [backface-visibility:hidden] ${
                        isCurrentCardMastered
                          ? 'border-emerald-300 shadow-[0_4px_25px_rgba(16,185,129,0.08)]'
                          : 'border-indigo-200 shadow-[0_4px_25px_rgba(99,102,241,0.08)]'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                            Card {currentCardIndex + 1} of {flashcardDeck.cards.length}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeCard) toggleMastered(activeCard.id);
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isCurrentCardMastered
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isCurrentCardMastered ? 'Mastered' : 'Mark Mastered'}</span>
                          </button>
                        </div>

                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            Clinical Presentation / Diagnostic Dilemma
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-1">
                            {activeCard?.front}
                          </h3>
                        </div>

                        {activeCard?.clinicalPearl && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                            <span className="font-bold">Clinical Pearl / Rule: </span>
                            {activeCard.clinicalPearl}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Tap / Space to reveal Answer & Rule
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Front</span>
                      </div>
                    </div>

                    {/* Back of Card */}
                    <div
                      className="w-full min-h-[360px] sm:min-h-[380px] p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-white shadow-md flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] absolute inset-0"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Card {currentCardIndex + 1} of {flashcardDeck.cards.length}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeCard) toggleMastered(activeCard.id);
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isCurrentCardMastered
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isCurrentCardMastered ? 'Mastered' : 'Mark Mastered'}</span>
                          </button>
                        </div>

                        {/* Core Answer */}
                        <div className="p-3.5 rounded-xl bg-indigo-600 text-white space-y-1">
                          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-indigo-200">
                            Definitive Diagnostic Rule
                          </span>
                          <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                            {activeCard?.back}
                          </p>
                        </div>

                        {/* Clinical Pearl */}
                        {activeCard?.clinicalPearl && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                            <span className="font-bold text-emerald-800 block font-mono text-[10px] uppercase">
                              FMGE Takeaway Pearl:
                            </span>
                            {activeCard.clinicalPearl}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Tap / Space to return to Front
                        </span>
                        <span className="text-[11px] font-mono text-indigo-600 font-bold">Back</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Flip Nav Controls */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIndex((p) => Math.max(0, p - 1));
                    }}
                    disabled={currentCardIndex === 0}
                    className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIndex((p) => Math.min(flashcardDeck.cards.length - 1, p + 1));
                    }}
                    disabled={currentCardIndex === flashcardDeck.cards.length - 1}
                    className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ) : (
            /* ── OVERVIEW MODE (High-Density Grid) ── */
            <div className="space-y-3">
              {/* Filter pills & search */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  {(['all', 'high-yield', 'core', 'trap'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setFilterDifficulty(diff)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono uppercase transition-all cursor-pointer ${
                        filterDifficulty === diff
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cards..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCards.map((card, idx) => {
                  const isMastered = masteredCardIds.has(card.id);
                  return (
                    <div
                      key={card.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isMastered
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleMastered(card.id)}
                            className={`p-1 rounded-md border text-xs cursor-pointer ${
                              isMastered
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-700'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {card.front}
                        </h5>
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs leading-relaxed">
                          <span className="font-bold text-indigo-900 block font-mono text-[9px] uppercase">
                            Core Rule:
                          </span>
                          {card.back}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 4 Cols (Sidebar with Quick Actions & Stats) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-tight">Mastery Actions</h3>
                <p className="text-[11px] text-[#8E8E93]">Quick recall triggers</p>
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              {[
                {
                  label: 'Launch 10-MCQ Practice Drill',
                  sub: `Test active topic: ${currentTopic.name}`,
                  icon: Play,
                  iconBg: '#6366F1',
                  onClick: () => onLaunchPracticeMcq(currentSubject.id, currentTopic.id, currentTopic.name),
                },
                {
                  label: 'Shuffle & Drill Full Deck',
                  sub: 'Randomized clinical challenge',
                  icon: RotateCcw,
                  iconBg: '#10B981',
                  onClick: () => {
                    setViewMode('flip');
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  },
                },
                {
                  label: 'Switch Discipline Syllabus',
                  sub: `Explore ${currentSubject.topics.length} topics`,
                  icon: BookOpen,
                  iconBg: '#0891B2',
                  onClick: () => onSelectSubject?.(currentSubject.id),
                },
              ].map(({ label, sub, icon: Icon, iconBg, onClick }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={onClick}
                  className="w-full p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-200 flex items-center gap-3 text-left cursor-pointer transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-105"
                    style={{ background: iconBg, boxShadow: `0 2px 8px ${iconBg}40` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-[#1D1D1F] group-hover:text-indigo-600 transition-colors leading-tight">
                      {label}
                    </div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5 truncate">{sub}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#C7C7CC] group-hover:text-indigo-600 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Retention Stats Tile */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-[#1D1D1F] text-[14px]">Deck Retention</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: flashcardDeck.cards.length, icon: Layers, color: '#6366F1' },
                { label: 'Mastered', value: totalMasteredCount, icon: CheckCircle2, color: '#10B981' },
                { label: 'Retention', value: `${masteryPct}%`, icon: Brain, color: '#F59E0B' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                  <div className="font-black text-[18px] text-[#1D1D1F] leading-none tracking-tight">{value}</div>
                  <div className="text-[10px] text-[#8E8E93] font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Cognitive Science Maxim */}
            <div
              className="relative overflow-hidden rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              <Brain className="h-4 w-4 text-indigo-600 mb-2" />
              <p className="text-[11.5px] font-medium text-indigo-900 leading-snug italic">
                "Active retrieval creates neural pathways 300% more durable than re-reading notes or passive listening."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
