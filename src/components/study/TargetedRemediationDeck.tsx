import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Check,
  Grid,
  Layers,
  ArrowRight,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { PracticeSessionQuestion, PracticeOption } from '../../types';

interface RemediationCardData {
  questionIndex: number; // 0-based
  sequenceNumber: number; // 1-10
  wasCorrect: boolean;
  userSelectedKey?: string;
  userSelectedText?: string;
  correctKey: string;
  correctText: string;
  conceptTitle: string;
  scenario: string;
  questionText: string;
  whyUserWasWrong: string;
  whyCorrectIsRight: string;
  coreRule: string;
  trapAvoided: string;
  pearl: string;
  options: PracticeOption[];
  explanation: string;
}

interface TargetedRemediationDeckProps {
  questions: PracticeSessionQuestion[];
  userAnswers: Record<
    number,
    {
      selectedAnswer?: string;
      isCorrect: boolean;
      timeSpentSeconds?: number;
    }
  >;
  subjectName: string;
  topicName: string;
  onRetestMissed?: (missedIndices: number[]) => void;
  onStartAnotherDrill?: () => void;
  onClose?: () => void;
}

export const TargetedRemediationDeck: React.FC<TargetedRemediationDeckProps> = ({
  questions,
  userAnswers,
  subjectName,
  topicName,
  onRetestMissed,
  onStartAnotherDrill,
  onClose,
}) => {
  // Build remediation cards from questions & user attempts
  const allCards: RemediationCardData[] = useMemo(() => {
    return questions.map((q, idx) => {
      const uAns = userAnswers[idx];
      const wasCorrect = Boolean(uAns?.isCorrect);
      const userSelectedKey = uAns?.selectedAnswer;
      const userSelectedOpt = q.options.find((o) => o.key === userSelectedKey);
      const correctOpt = q.options.find((o) => o.key === q.correctAnswer);

      // Extract / generate whyUserWasWrong
      let whyUserWasWrong = '';
      if (!wasCorrect && userSelectedOpt) {
        if (userSelectedOpt.rationale && userSelectedOpt.rationale.trim().length > 5) {
          whyUserWasWrong = userSelectedOpt.rationale.trim();
        } else {
          // Check if explanation mentions user option
          const optLower = userSelectedOpt.text.toLowerCase().replace(/^[a-d]\)\s*/, '');
          const sentences = (q.explanation || '').split(/(?<=[.!?])\s+/);
          const foundSent = sentences.find((s) => s.toLowerCase().includes(optLower));
          if (foundSent) {
            whyUserWasWrong = foundSent.trim();
          } else {
            whyUserWasWrong = `Does not fit the clinical findings in this vignette. A high-frequency distractor in FMGE examinations.`;
          }
        }
      }

      // Extract whyCorrectIsRight
      let whyCorrectIsRight = '';
      if (correctOpt?.rationale && correctOpt.rationale.trim().length > 5) {
        whyCorrectIsRight = correctOpt.rationale.trim();
      } else if (q.explanation) {
        const sentences = q.explanation.split(/(?<=[.!?])\s+/);
        whyCorrectIsRight = sentences.slice(0, 2).join(' ').trim();
      } else {
        whyCorrectIsRight = `Gold-standard diagnostic criterion and definitive guideline-directed management.`;
      }

      // Extract core rule
      const coreRule =
        q.remediationCard?.rule ||
        q.highYieldPearl ||
        q.explanation ||
        `Definitive hallmark diagnostic rule for ${topicName}.`;

      // Extract trap avoided
      const trapAvoided =
        q.remediationCard?.trapAvoided ||
        (userSelectedOpt && correctOpt
          ? `Confusing ${userSelectedOpt.text.replace(/^[A-D]\)\s*/, '')} with ${correctOpt.text.replace(/^[A-D]\)\s*/, '')} under timed exam conditions.`
          : `Overlooking subtle pathognomonic diagnostic features in the clinical vignette.`);

      // Extract pearl
      const pearl =
        q.highYieldPearl ||
        q.remediationCard?.pearl ||
        `High-Yield FMGE Recall: ${correctOpt?.text || topicName}`;

      const conceptTitle =
        q.remediationCard?.concept ||
        q.subtopic ||
        `${topicName} Clinical Concept`;

      return {
        questionIndex: idx,
        sequenceNumber: idx + 1,
        wasCorrect,
        userSelectedKey,
        userSelectedText: userSelectedOpt?.text,
        correctKey: q.correctAnswer,
        correctText: correctOpt?.text || '',
        conceptTitle,
        scenario: q.scenario,
        questionText: q.question,
        whyUserWasWrong,
        whyCorrectIsRight,
        coreRule,
        trapAvoided,
        pearl,
        options: q.options,
        explanation: q.explanation,
      };
    });
  }, [questions, userAnswers, topicName]);

  const missedIndices = useMemo(() => {
    return allCards.filter((c) => !c.wasCorrect).map((c) => c.questionIndex);
  }, [allCards]);

  // Card filter: "missed" vs "all"
  const [filterMode, setFilterMode] = useState<'missed' | 'all'>(
    missedIndices.length > 0 ? 'missed' : 'all'
  );

  const activeCards = useMemo(() => {
    if (filterMode === 'missed' && missedIndices.length > 0) {
      return allCards.filter((c) => !c.wasCorrect);
    }
    return allCards;
  }, [allCards, filterMode, missedIndices]);

  // View mode: 'flip' vs 'grid'
  const [viewMode, setViewMode] = useState<'flip' | 'grid'>('flip');

  // Flip mode state
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIndices, setMasteredIndices] = useState<Set<number>>(new Set());

  // Reset index when activeCards change
  useEffect(() => {
    setCurrentIdx(0);
    setIsFlipped(false);
  }, [filterMode]);

  const currentCard = activeCards[currentIdx] || activeCards[0];

  const handleNext = () => {
    if (currentIdx < activeCards.length - 1) {
      setIsFlipped(false);
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const toggleMastered = (cardIndex: number) => {
    setMasteredIndices((prev) => {
      const next = new Set(prev);
      if (next.has(cardIndex)) {
        next.delete(cardIndex);
      } else {
        next.add(cardIndex);
      }
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== 'flip') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'm' && currentCard) {
        e.preventDefault();
        toggleMastered(currentCard.questionIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentIdx, activeCards.length, currentCard]);

  if (!currentCard) return null;

  return (
    <div className="space-y-5">
      {/* HEADER & CONTROLS */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl border border-indigo-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Adaptive Remediation Deck
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {subjectName} · {topicName}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Targeted Post-Drill Study & Mastery Deck
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Curated directly from your performance. Master the exact diagnostic rules, clinical pitfalls, and distinguishing hallmarks you encountered.
            </p>
          </div>

          {/* Controls: Filter & View Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            {missedIndices.length > 0 && (
              <div className="flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFilterMode('missed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'missed'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Weak Concepts ({missedIndices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All 10 Cards
                </button>
              </div>
            )}

            <div className="flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('flip')}
                title="Interactive 3D Flip Mode"
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'flip'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="High-Density Grid Overview"
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid Overview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Progress:</span>
            <span className="text-white font-bold">
              {masteredIndices.size} / {activeCards.length} Mastered
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Shortcuts:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">Space</span> to Flip
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">← / →</span> Next
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">M</span> Master
          </div>
        </div>
      </div>

      {/* VIEW MODE: 3D CARD FLIP */}
      {viewMode === 'flip' ? (
        <div className="space-y-4">
          <div className="relative min-h-[380px] sm:min-h-[420px] w-full [perspective:1200px]">
            <motion.div
              className="w-full h-full relative cursor-pointer select-none [transform-style:preserve-3d] transition-transform duration-500"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* ================= FRONT OF CARD ================= */}
              <div
                className={`w-full min-h-[380px] sm:min-h-[420px] p-6 sm:p-7 rounded-3xl border bg-white shadow-lg flex flex-col justify-between [backface-visibility:hidden] ${
                  !currentCard.wasCorrect
                    ? 'border-rose-200/90 shadow-[0_4px_25px_rgba(244,63,94,0.08)]'
                    : 'border-emerald-200/90 shadow-[0_4px_25px_rgba(16,185,129,0.08)]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                        Card {currentIdx + 1} of {activeCards.length}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border ${
                          !currentCard.wasCorrect
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {!currentCard.wasCorrect ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Missed in Drill (Q{currentCard.sequenceNumber})</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Correct in Drill (Q{currentCard.sequenceNumber})</span>
                          </>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMastered(currentCard.questionIndex);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        masteredIndices.has(currentCard.questionIndex)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {masteredIndices.has(currentCard.questionIndex)
                          ? 'Mastered'
                          : 'Mark Mastered'}
                      </span>
                    </button>
                  </div>

                  {/* Concept Title */}
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      Core Target Concept
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-0.5">
                      {currentCard.conceptTitle}
                    </h4>
                  </div>

                  {/* Clinical Vignette Snippet */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Vignette Presentation
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                      {currentCard.scenario}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 pt-1">
                      {currentCard.questionText}
                    </p>
                  </div>

                  {/* If user missed it: show what user chose vs why it was incorrect */}
                  {!currentCard.wasCorrect && currentCard.userSelectedText && (
                    <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Your Choice was Option {currentCard.userSelectedKey}: {currentCard.userSelectedText}</span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-rose-950 leading-relaxed font-medium">
                        <span className="font-bold text-rose-800">Why your choice was incorrect: </span>
                        {currentCard.whyUserWasWrong}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tap / Space to reveal Definitive Rule & Pearl
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Front (Vignette & Dilemma)</span>
                </div>
              </div>

              {/* ================= BACK OF CARD ================= */}
              <div
                className="w-full min-h-[380px] sm:min-h-[420px] p-6 sm:p-7 rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-white via-indigo-50/20 to-white shadow-xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] absolute inset-0"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Card {currentIdx + 1} of {activeCards.length}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Correct: Option {currentCard.correctKey} ({currentCard.correctText})</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMastered(currentCard.questionIndex);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        masteredIndices.has(currentCard.questionIndex)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {masteredIndices.has(currentCard.questionIndex)
                          ? 'Mastered'
                          : 'Mark Mastered'}
                      </span>
                    </button>
                  </div>

                  {/* 1. Core Mastery Rule Banner */}
                  <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Definitive Clinical Rule to Master</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                      {currentCard.coreRule}
                    </p>
                  </div>

                  {/* 2. Exam Trap to Avoid */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Common FMGE Exam Trap & Dilemma</span>
                    </div>
                    <p className="text-xs sm:text-[13px] leading-relaxed font-medium">
                      {currentCard.trapAvoided}
                    </p>
                  </div>

                  {/* 3. High-Yield Takeaway Pearl */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>High-Yield Memory Pearl</span>
                    </div>
                    <p className="text-xs sm:text-[13px] font-bold text-emerald-900 leading-relaxed">
                      {currentCard.pearl}
                    </p>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tap / Space to return to Vignette
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold">Back (Rule & Mastery)</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* FLIP CONTROLS BAR */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none text-slate-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer border border-indigo-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIdx === activeCards.length - 1}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none text-slate-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* VIEW MODE: HIGH-DENSITY GRID OVERVIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCards.map((card, idx) => {
            const isMastered = masteredIndices.has(card.questionIndex);
            return (
              <div
                key={card.questionIndex}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  !card.wasCorrect
                    ? 'bg-rose-50/30 border-rose-200 shadow-2xs'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        Q{card.sequenceNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                          !card.wasCorrect
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {card.wasCorrect ? 'Correct in Drill' : 'Missed in Drill'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMastered(card.questionIndex)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isMastered
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-700'
                      }`}
                      title={isMastered ? 'Mastered' : 'Mark as Mastered'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h5 className="font-bold text-sm text-slate-900 leading-snug">
                    {card.conceptTitle}
                  </h5>

                  {/* Answers summary */}
                  <div className="text-xs space-y-1">
                    {!card.wasCorrect && card.userSelectedText && (
                      <p className="text-rose-800 font-medium">
                        <span className="font-bold">Your Choice: </span>
                        Option {card.userSelectedKey} ({card.userSelectedText})
                      </p>
                    )}
                    <p className="text-emerald-800 font-medium">
                      <span className="font-bold">Correct Rule: </span>
                      Option {card.correctKey} ({card.correctText})
                    </p>
                  </div>

                  {/* Core Rule */}
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs leading-relaxed">
                    <span className="font-bold text-indigo-900 block font-mono text-[10px] uppercase">
                      Definitive Rule:
                    </span>
                    {card.coreRule}
                  </div>

                  {/* Pearl */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-950 text-[11px] leading-relaxed">
                    <span className="font-bold text-amber-900 block font-mono text-[9px] uppercase">
                      Exam Pearl:
                    </span>
                    {card.pearl}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold text-white">
            {missedIndices.length > 0
              ? `${missedIndices.length} concepts flagged for remediation.`
              : 'Flawless 10/10 performance!'}
          </p>
          <p className="text-xs text-slate-400">
            {missedIndices.length > 0
              ? 'Test these weak concepts now to solidify recall before exam day.'
              : 'All 10 questions mastered. Proceed to next topic or start another drill.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {missedIndices.length > 0 && onRetestMissed && (
            <button
              type="button"
              onClick={() => onRetestMissed(missedIndices)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-Test {missedIndices.length} Missed Question{missedIndices.length > 1 ? 's' : ''}</span>
            </button>
          )}

          {onStartAnotherDrill && (
            <button
              type="button"
              onClick={onStartAnotherDrill}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Another Drill</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
