import React, { useState, useMemo, useEffect, useRef } from 'react';
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, flashcardDeck.cards.length]);

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Top Header with Subject Selector ── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-5 sm:p-7 shadow-sm backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers className="h-3.5 w-3.5" />
              <span>High-Yield Active Recall Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Flashcard Mastery Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Rapid memory anchors, clinical pearls, and high-yield traps designed for swift recall in the final stretch.
            </p>
          </div>

          {/* Quick 10-MCQ CTA on current topic */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                onLaunchPracticeMcq(currentSubject.id, currentTopic?.id, currentTopic?.name)
              }
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Zap className="h-4 w-4" />
              <span>10-MCQ Drill on this Topic</span>
            </button>

            {/* View Mode Switcher */}
            <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('flip')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'flip'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Card Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('overview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>All Cards ({flashcardDeck.cards.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subjects Horizontal Pill Scroller */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Discipline ({FMGE_SUBJECTS.length} Subjects)
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {FMGE_SUBJECTS.map((sub) => {
              const active = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm scale-102'
                      : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                  }`}
                >
                  <SubjectAppleIcon subjectId={sub.id} size="sm" />
                  <span>{sub.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {sub.weightage}M
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic Selector & Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Topic:</span>
            <div className="relative">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-2 pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                {currentSubject.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isHighYield ? '★ (High-Yield)' : ''}
                  </option>
                ))}
              </select>
              <ChevronRight className="h-3 w-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Mastery Progress Indicator */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Mastered</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {totalMasteredCount}/{flashcardDeck.cards.length} ({masteryPct}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryPct}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD MODE (Interactive 3D Flip Card) ── */}
      {viewMode === 'flip' ? (
        flashcardDeck.cards.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3">
            <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Flashcards Available for this Topic
            </h4>
            <p className="text-xs text-slate-500">
              Please select another topic or launch an adaptive 10-MCQ session.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Card Counter & Mastery Pill */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-500">
              <span className="font-mono font-bold">
                Card {currentCardIndex + 1} of {flashcardDeck.cards.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">
                  Keyboard: [Space] Flip · [← / →] Navigate
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeCard?.difficulty === 'high-yield'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : activeCard?.difficulty === 'trap'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {activeCard?.difficulty || 'core'}
                </span>
              </div>
            </div>

            {/* 3D Perspective Flip Card Container */}
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={() => setIsFlipped((prev) => !prev)}
              className="relative min-h-[300px] sm:min-h-[340px] rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col justify-between cursor-pointer select-none transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] group"
            >
              {/* Card Front / Back Content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
                    {isFlipped ? 'Answer & High-Yield Diagnostic Rationale' : 'Clinical Prompt (Click to Reveal Answer)'}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCurrentCardMastered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        <span>Mastered</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex items-center gap-1">
                      <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
                      <span className="hidden sm:inline">Flip</span>
                    </span>
                  </div>
                </div>

                {/* Main Text */}
                <div className="py-2">
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                    {isFlipped ? activeCard?.back : activeCard?.front}
                  </p>
                </div>

                {/* Clinical Pearl Box (Visible on Back) */}
                {isFlipped && activeCard?.clinicalPearl && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1"
                  >
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span>Clinical Pearl & Mnemonic</span>
                    </div>
                    <p className="font-medium leading-relaxed">{activeCard.clinicalPearl}</p>
                  </motion.div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {currentSubject.name} · {currentTopic?.name}
                </span>
                <span className="text-[11px]">Click or press Space to flip</span>
              </div>
            </motion.div>

            {/* Navigation & Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentCardIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {activeCard && (
                  <button
                    type="button"
                    onClick={() => toggleMastered(activeCard.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isCurrentCardMastered
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isCurrentCardMastered ? 'Mastered' : 'Mark Mastered'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    if (currentCardIndex < flashcardDeck.cards.length - 1) {
                      setCurrentCardIndex((prev) => prev + 1);
                    } else {
                      // At end of deck, suggest 10-MCQ session
                      onLaunchPracticeMcq(currentSubject.id, currentTopic?.id, currentTopic?.name);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <span>
                    {currentCardIndex < flashcardDeck.cards.length - 1 ? 'Next Card' : 'Test with 10 MCQs'}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ── OVERVIEW MODE (All Cards Detail Grid) ── */
        <div className="space-y-4">
          {/* Filter and Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search flashcards in this topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                {(['all', 'high-yield', 'core', 'trap'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setFilterDifficulty(diff)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterDifficulty === diff
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {diff === 'all' ? 'All Types' : diff}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                {(['all', 'unmastered', 'mastered'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterStatus === st
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'All' : st === 'unmastered' ? 'Needs Review' : 'Mastered'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCards.map((card, idx) => {
              const isCardMastered = masteredCardIds.has(card.id);
              return (
                <div
                  key={card.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        Concept {idx + 1} · {card.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            card.difficulty === 'high-yield'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : card.difficulty === 'trap'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {card.difficulty}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {card.front}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {card.back}
                    </div>

                    {card.clinicalPearl && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{card.clinicalPearl}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleMastered(card.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCardMastered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isCardMastered ? 'Mastered' : 'Mark Mastered'}</span>
                    </button>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {card.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
