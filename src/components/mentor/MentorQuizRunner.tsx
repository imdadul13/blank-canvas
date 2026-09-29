import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Stethoscope,
  Check,
  X,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Lightbulb,
  Brain,
  AlertTriangle,
  Trophy,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ShieldCheck,
  Eye,
  Activity,
} from 'lucide-react';
import type { QuizQuestionItem, ActiveQuizSession } from '../AiCoachView';
import { MedicalImageAsset } from '../../types';
import { McqOptionList } from './McqOptionList';

export interface MentorQuizRunnerProps {
  quizSession: ActiveQuizSession;
  onAnswer: (selectedKey: string) => void;
  onNextQuestion: () => void;
  onRestartQuiz: () => void;
  onClose: () => void;
  isLoading?: boolean;
  onOpenImageModal?: (modalData: {
  isOpen: boolean;
  imageUrl: string;
  annotatedImageUrl?: string;
  imageAsset?: MedicalImageAsset;
  title: string;
  whatToLookFor?: string;
  }) => void;
}

export const MentorQuizRunner: React.FC<MentorQuizRunnerProps> = ({
  quizSession,
  onAnswer,
  onNextQuestion,
  onRestartQuiz,
  onClose,
  isLoading = false,
  onOpenImageModal,
}) => {
  const [stagedKey, setStagedKey] = useState<string | null>(null);
  const [showReviewList, setShowReviewList] = useState(false);
  const [expandedReviewIndex, setExpandedReviewIndex] = useState<number | null>(null);

  const { questions, currentIndex, score, isComplete, userAnswers } = quizSession;
  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const isCurrentAnswered = userAnswers[currentIndex] !== undefined;
  const selectedKey = userAnswers[currentIndex];
  const correctKey = currentQ ? (currentQ.correctKey || (currentQ as any).correctAnswer || 'A') : 'A';
  const isCurrentCorrect = selectedKey === correctKey;

  // Reset staged option when navigating to a new question
  useEffect(() => {
  setStagedKey(null);
  }, [currentIndex]);

  const handleSelectOption = (key: string) => {
  if (isCurrentAnswered) return;
  setStagedKey(key);
  };

  const handleConfirmAnswer = () => {
  if (isCurrentAnswered || !stagedKey) return;
  onAnswer(stagedKey);
  };

  // Score interpretation based strictly on existing count
  const accuracyPercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const getCoachingAssessment = (pct: number) => {
  if (pct >= 80) {
  return {
  label: 'Strong clinical reasoning',
  badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  summary: 'Excellent grasp of core pathophysiological discriminators and clinical decision points.',
  };
  }
  if (pct >= 60) {
  return {
  label: 'Good clinical foundation',
  badgeColor: 'bg-teal-50 text-accent border-teal-200',
  summary: 'Solid diagnostic approach with minor gaps in high-yield distractor traps. Review key pearls below.',
  };
  }
  return {
  label: 'Needs reinforcement',
  badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  summary: 'Targeted revision recommended for these specific subject discriminators before proceeding.',
  };
  };

  const assessment = getCoachingAssessment(accuracyPercent);

  // Loading state when generating or restarting quiz batch
  if (isLoading) {
  return (
  <div className="w-full rounded-3xl border border-accent/25 bg-white p-8 sm:p-12 shadow-e1 text-center space-y-4 animate-in fade-in-50">
  <div className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto animate-pulse">
  <GraduationCap className="h-7 w-7" />
  </div>
  <div className="space-y-1.5 max-w-md mx-auto">
  <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] tracking-tight">
  Consulting Faculty Mentor
  </h3>
  <p className="text-xs sm:text-sm text-[var(--color-ink-3)] leading-relaxed font-sans">
  Assembling 5 structured clinical reasoning questions targeted to high-yield exam scenarios...
  </p>
  </div>
  <div className="flex justify-center items-center gap-1.5 pt-2">
  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
  </div>
  );
  }

  // ----------------------------------------------------
  // COMPLETION STATE
  // ----------------------------------------------------
  if (isComplete) {
  return (
  <div className="w-full rounded-3xl border border-[var(--color-hairline)] bg-white p-5 sm:p-8 shadow-e1 space-y-6 text-[var(--color-ink)] font-sans animate-in fade-in-50">
  {/* Header Banner */}
  <div className="text-center space-y-3 pt-2">
  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 text-accent shadow-e1">
  <Trophy className="h-7 w-7" />
  </div>

  <div className="space-y-1 max-w-lg mx-auto">
  <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-accent uppercase ">
  <GraduationCap className="w-3.5 h-3.5" />
  <span>Session Completed</span>
  </div>
  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] tracking-tight">
  Clinical Challenge Complete
  </h2>
  <p className="text-xs sm:text-sm text-[var(--color-ink-3)] leading-relaxed">
  5-question clinical reasoning session completed. All attempts have been recorded to your performance tracker.
  </p>
  </div>
  </div>

  {/* Score Card */}
  <div className="max-w-md mx-auto rounded-2xl bg-[var(--color-surface-sunken)]/90 border border-[var(--color-hairline)] p-5 text-center space-y-3">
  <div className="flex items-center justify-center gap-6 divide-x divide-slate-200">
  <div className="px-3">
  <span className="text-3xl font-bold text-[var(--color-ink)]">
  {score} / {totalQuestions}
  </span>
  <p className="text-[11px] uppercase font-bold tracking-wider text-[var(--color-ink-4)] mt-0.5">
  Questions Correct
  </p>
  </div>
  <div className="px-6">
  <span className="text-3xl font-bold text-accent">
  {accuracyPercent}%
  </span>
  <p className="text-[11px] uppercase font-bold tracking-wider text-[var(--color-ink-4)] mt-0.5">
  Clinical Accuracy
  </p>
  </div>
  </div>

  <div className="pt-2 border-t border-[var(--color-hairline)]">
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${assessment.badgeColor}`}>
  <Activity className="w-3 h-3" />
  <span>{assessment.label}</span>
  </span>
  <p className="text-xs text-[var(--color-ink-2)] mt-2 leading-relaxed font-sans px-2">
  {assessment.summary}
  </p>
  </div>
  </div>

  {/* Action Controls */}
  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
  <button
  type="button"
  onClick={() => setShowReviewList((prev) => !prev)}
  className="px-4 py-2.5 rounded-xl border border-[var(--color-hairline-strong)] hover:border-[var(--color-hairline-strong)] bg-white hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-2)] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-e1"
  title="Review Mistakes and Question Rationales"
  >
  <span>{showReviewList ? 'Hide Question Review' : `Review Mistakes (${totalQuestions - score}) & Rationales (Review 5 Questions)`}</span>
  {showReviewList ? <ChevronUp className="w-4 h-4 text-[var(--color-ink-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-ink-3)]" />}
  </button>

  <button
  type="button"
  onClick={onRestartQuiz}
  className="px-5 py-2.5 rounded-xl bg-accent hover:brightness-105 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
  >
  <RotateCw className="w-3.5 h-3.5" />
  <span>Try Again (Start Another Clinical Challenge)</span>
  </button>

  <button
  type="button"
  onClick={onClose}
  className="px-4 py-2.5 rounded-xl bg-[var(--color-surface-sunken)] hover:bg-[var(--color-hairline)] text-[var(--color-ink-2)] text-xs font-bold cursor-pointer transition-colors"
  >
  New Topic
  </button>
  </div>

  {/* Question Review Section */}
  {showReviewList && (
  <div className="pt-4 border-t border-[var(--color-hairline)] space-y-4 animate-in fade-in-50">
  <div className="flex items-center justify-between">
  <h3 className="text-sm font-bold text-[var(--color-ink)] uppercase tracking-wider flex items-center gap-2">
  <Stethoscope className="w-4 h-4 text-accent" />
  <span>Session Question Review ({questions.length})</span>
  </h3>
  <span className="text-xs text-[var(--color-ink-4)] font-medium">Click card to expand rationale</span>
  </div>

  <div className="space-y-3">
  {questions.map((q, idx) => {
  const qAns = userAnswers[idx];
  const qCorrect = q.correctKey || (q as any).correctAnswer || 'A';
  const isQCorrect = qAns === qCorrect;
  const isExpanded = expandedReviewIndex === idx;

  return (
  <div
  key={q.id || idx}
  className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface-sunken)]/60 hover:bg-[var(--color-surface-sunken)] transition-colors overflow-hidden"
  >
  <button
  type="button"
  onClick={() => setExpandedReviewIndex(isExpanded ? null : idx)}
  className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left cursor-pointer"
  >
  <div className="space-y-1.5 flex-1 min-w-0">
  <div className="flex items-center gap-2 flex-wrap">
  <span className="px-2 py-0.5 rounded-md bg-[var(--color-ink)] text-white text-[11px] font-bold uppercase">
  Q{idx + 1}
  </span>
  <span className="text-xs font-semibold text-[var(--color-ink-2)] ">
  {q.subject} · {q.topic}
  </span>
  </div>
  <p className="text-xs sm:text-sm font-medium text-[var(--color-ink)] line-clamp-2 leading-relaxed">
  {q.question}
  </p>
  </div>

  <div className="flex items-center gap-3 shrink-0">
  <span
  className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
  isQCorrect
  ? 'bg-emerald-100 text-emerald-800'
  : 'bg-rose-100 text-rose-800'
  }`}
  >
  {isQCorrect ? (
  <>
  <Check className="w-3 h-3 text-emerald-700" />
  <span>Correct</span>
  </>
  ) : (
  <>
  <X className="w-3 h-3 text-rose-700" />
  <span>Option {qCorrect}</span>
  </>
  )}
  </span>
  {isExpanded ? (
  <ChevronUp className="w-4 h-4 text-[var(--color-ink-4)]" />
  ) : (
  <ChevronDown className="w-4 h-4 text-[var(--color-ink-4)]" />
  )}
  </div>
  </button>

  {isExpanded && (
  <div className="px-4 pb-5 sm:px-5 space-y-3 pt-2 border-t border-[var(--color-hairline)] bg-white text-xs sm:text-sm">
  {/* Clinical Stem if available */}
  {q.stem && (
  <p className="text-[var(--color-ink-2)] italic bg-[var(--color-surface-sunken)] p-3 rounded-xl border border-[var(--color-hairline)]/70">
  {q.stem}
  </p>
  )}

  {/* Options breakdown */}
  <div className="space-y-1.5 pt-1">
  {q.options.map((opt) => {
  const isSelected = qAns === opt.key;
  const isOptCorrect = opt.key === qCorrect;
  return (
  <div
  key={opt.key}
  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
  isOptCorrect
  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
  : isSelected && !isOptCorrect
  ? 'bg-rose-50 border-rose-300 text-rose-950 font-semibold'
  : 'bg-[var(--color-surface-sunken)]/50 border-[var(--color-hairline)] text-[var(--color-ink-2)] opacity-80'
  }`}
  >
  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
  isOptCorrect ? 'bg-emerald-600 text-white' : isSelected ? 'bg-rose-600 text-white' : 'bg-[var(--color-hairline)] text-[var(--color-ink-2)]'
  }`}>
  {opt.key}
  </span>
  <span>{opt.text}</span>
  </div>
  );
  })}
  </div>

  {/* Explanation */}
  <div className="p-3.5 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-hairline)] text-[var(--color-ink-2)] space-y-2">
  <p className="font-bold text-[var(--color-ink)] ">Clinical Rationale:</p>
  <p className="leading-relaxed">{q.explanation}</p>
  </div>

  {/* Distractor Breakdown if available */}
  {q.distractorExplanations && Object.keys(q.distractorExplanations).length > 0 && (
  <div className="p-3 rounded-xl bg-[var(--color-surface-sunken)]/80 border border-[var(--color-hairline)]/70 space-y-1 text-xs">
  <p className="font-bold text-[var(--color-ink)] ">Distractor Discriminators:</p>
  {Object.entries(q.distractorExplanations).map(([k, exp]) => (
  <p key={k} className="text-[var(--color-ink-2)] pl-2">
  <strong>Option {k}:</strong> {exp}
  </p>
  ))}
  </div>
  )}

  {/* Takeaway / Mnemonic / Trap */}
  {q.trap && (
  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium flex items-start gap-1.5">
  <span className="font-bold text-amber-800">Exam Trap:</span> {q.trap}
  </div>
  )}
  {q.mnemonic && (
  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-medium flex items-start gap-1.5">
  <span className="font-bold text-purple-800">Memory Hook:</span> {q.mnemonic}
  </div>
  )}
  </div>
  )}
  </div>
  );
  })}
  </div>
  </div>
  )}
  </div>
  );
  }

  // ----------------------------------------------------
  // ACTIVE QUESTION EXPERIENCE (Questions 1 to 5)
  // ----------------------------------------------------
  if (!currentQ) {
  return null;
  }

  const distractorEntries = Object.entries(
  currentQ.distractorExplanations || currentQ.distractorBreakdown || {}
  );

  return (
  <div className="w-full rounded-3xl border border-[var(--color-hairline)] bg-white p-5 sm:p-7 shadow-e1 space-y-5 text-[var(--color-ink)] font-sans animate-in fade-in-50">
  {/* 1. Header: Faculty Mentor Session Classification & Progress */}
  <div className="space-y-3 pb-4 border-b border-[var(--color-hairline-soft)]">
  <div className="flex items-center justify-between flex-wrap gap-2.5">
  <div className="flex items-center gap-2.5 flex-wrap">
  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-accent uppercase ">
  <Stethoscope className="w-3.5 h-3.5" />
  <span>Clinical Challenge</span>
  </div>
  <span className="text-slate-300">·</span>
  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-ink)] text-white text-[11px] font-bold uppercase tracking-wider">
  {currentQ.subject}
  </span>
  <span className="text-xs font-semibold text-[var(--color-ink-2)] ">
  {currentQ.topic}
  </span>
  </div>

  <div className="flex items-center gap-3">
  {/* Quiet Dot Progress Indicator */}
  <div className="hidden xs:flex items-center gap-1.5" title={`Question ${currentIndex + 1} of ${totalQuestions}`}>
  {questions.map((_, qIdx) => {
  const isAnswered = userAnswers[qIdx] !== undefined;
  const isCurrent = qIdx === currentIndex;
  return (
  <span
  key={qIdx}
  className={`rounded-full transition-all duration-200 ${
  isCurrent
  ? 'w-4 h-2 bg-accent'
  : isAnswered
  ? 'w-2 h-2 bg-teal-500/80'
  : 'w-2 h-2 bg-[var(--color-hairline)]'
  }`}
  />
  );
  })}
  </div>

  <span className="px-3 py-1 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-2)] text-xs font-bold border border-[var(--color-hairline)]">
  Question {currentIndex + 1} of {totalQuestions}
  </span>
  <span className="text-xs font-bold text-[var(--color-ink-4)] ">
  Score: {score} / {Object.keys(userAnswers).length}
  </span>
  </div>
  </div>

  {/* Progress Bar Track */}
  <div className="w-full bg-[var(--color-surface-sunken)] h-1.5 rounded-full overflow-hidden">
  <div
  className="bg-accent h-full transition-all duration-300 rounded-full"
  style={{
  width: `${Math.round(((currentIndex + (isCurrentAnswered ? 1 : 0)) / totalQuestions) * 100)}%`,
  }}
  />
  </div>

  {/* Session Framing Subtitle */}
  <p className="text-[11px] text-[var(--color-ink-4)] font-medium">
  5-question clinical reasoning session with your Faculty Mentor
  </p>
  </div>

  {/* 2. Optional Medical Image Investigation Display */}
  {currentQ.imageUrl && (
  <div className="rounded-2xl overflow-hidden border border-[var(--color-hairline)] bg-slate-950 relative group shadow-sm">
  <img
  src={currentQ.imageUrl}
  alt={currentQ.topic}
  referrerPolicy="no-referrer"
  crossOrigin="anonymous"
  className="w-full max-h-[320px] object-contain cursor-zoom-in bg-slate-950"
  onError={(e) => {
  const target = e.currentTarget;
  if (!target.src.includes('/assets/medical-images/')) {
  target.src = '/assets/medical-images/ecg-complete-heart-block.svg';
  }
  }}
  onClick={() =>
  onOpenImageModal?.({
  isOpen: true,
  imageUrl: currentQ.imageUrl!,
  imageAsset: currentQ.imageAsset,
  title: `${currentQ.subject} · ${currentQ.topic}`,
  whatToLookFor: currentQ.whatToLookFor,
  })
  }
  />
  <div className="absolute top-3 right-3 flex items-center gap-2">
  <button
  type="button"
  onClick={() =>
  onOpenImageModal?.({
  isOpen: true,
  imageUrl: currentQ.imageUrl!,
  imageAsset: currentQ.imageAsset,
  title: `${currentQ.subject} · ${currentQ.topic}`,
  whatToLookFor: currentQ.whatToLookFor,
  })
  }
  className="px-3 py-1.5 rounded-xl bg-[var(--color-ink)]/80 backdrop-blur-sm hover:bg-[var(--color-ink)] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
  >
  <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
  <span>Click to Zoom</span>
  </button>
  </div>
  {currentQ.imageAsset?.sourceName && (
  <div className="absolute bottom-2 left-3 text-[11px] text-slate-300 bg-[var(--color-ink)]/85 px-2.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
  <ShieldCheck className="w-3 h-3 text-emerald-400" />
  <span>{currentQ.imageAsset.sourceName}</span>
  </div>
  )}
  </div>
  )}

  {/* 3. Clinical Scenario Stem Card */}
  <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-sunken)]/80 border border-[var(--color-hairline)] shadow-e1 space-y-2.5">
  {currentQ.stem && (
  <p className="text-sm sm:text-base text-[var(--color-ink-2)] leading-relaxed font-normal">
  {currentQ.stem}
  </p>
  )}
  <p className="text-sm sm:text-base font-bold text-[var(--color-ink)] leading-snug ">
  {currentQ.question}
  </p>
  </div>

  {/* 4. Options — shared renderer, see McqOptionList */}
  <McqOptionList
  options={currentQ.options}
  stagedKey={stagedKey}
  userAnswer={selectedKey}
  correctKey={correctKey}
  revealed={isCurrentAnswered}
  onSelect={handleSelectOption}
  />

  {/* 5. Pre-Answer Submission Action Bar */}
  {!isCurrentAnswered && (
  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-hairline-soft)]/90">
  <p className="text-xs text-[var(--color-ink-3)] font-medium hidden sm:block">
  {stagedKey ? `Selected Option ${stagedKey}. Click Submit Answer to verify.` : 'Select an option above to answer.'}
  </p>

  <button
  type="button"
  disabled={!stagedKey}
  onClick={handleConfirmAnswer}
  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-xs cursor-pointer ${
  stagedKey
  ? 'bg-accent hover:brightness-105 text-white active:scale-98 shadow-sm hover:shadow-md'
  : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-4)] cursor-not-allowed border border-[var(--color-hairline)]/70'
  }`}
  >
  <span>Submit Answer</span>
  <ArrowRight className="w-3.5 h-3.5" />
  </button>
  </div>
  )}

  {/* 6. Post-Answer Comprehensive Rationale & Faculty Coaching */}
  {isCurrentAnswered && (
  <div className="space-y-4 pt-4 border-t border-[var(--color-hairline)] animate-in fade-in-50">
  {/* Gentle Result Header Banner */}
  <div
  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
  isCurrentCorrect
  ? 'bg-teal-50/70 border-teal-200/80 text-teal-950'
  : 'bg-amber-50/70 border-amber-200/80 text-[var(--color-ink)]'
  }`}
  >
  <div className="flex items-center gap-2.5">
  {isCurrentCorrect ? (
  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
  </div>
  ) : (
  <div className="h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
  <X className="w-3.5 h-3.5 stroke-[2.5]" />
  </div>
  )}
  <div>
  <span className="text-xs sm:text-sm font-bold block">
  {isCurrentCorrect
  ? 'Correct clinical judgment'
  : `Option ${correctKey} is correct`}
  </span>
  <span className="text-[11px] text-[var(--color-ink-3)] font-normal">
  {isCurrentCorrect
  ? `You correctly selected Option ${correctKey}.`
  : `You selected Option ${selectedKey}. Review discriminator below.`}
  </span>
  </div>
  </div>

  <span className="text-[11px] font-semibold text-[var(--color-ink-3)] bg-white/70 px-2.5 py-1 rounded-full border border-[var(--color-hairline)]">
  Question {currentIndex + 1} of {totalQuestions}
  </span>
  </div>

  {/* Structured Remediation Body */}
  <div className="space-y-3.5 text-xs sm:text-sm">
  {/* 1. WHY YOU MISSED IT (Only if incorrect) */}
  {!isCurrentCorrect && (
  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-2">
  <div className="flex items-center gap-2 pb-1.5 border-b border-rose-100">
  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 ">
  Why you missed it
  </span>
  <span className="text-xs font-semibold text-rose-900 ">
  Distractor Trap Analysis
  </span>
  </div>
  <p className="text-xs sm:text-sm text-[var(--color-ink-2)] leading-relaxed font-sans">
  {currentQ.trap ||
  (selectedKey && (currentQ.distractorBreakdown?.[selectedKey] || currentQ.distractorExplanations?.[selectedKey])) ||
  `Option ${selectedKey} is a common FMGE trap choice that mimics features of the presentation without meeting the definitive diagnosis criteria.`}
  </p>
  </div>
  )}

  {/* 2. WHY OPTION [correctKey] IS CORRECT */}
  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[var(--color-hairline)] space-y-2.5 shadow-e1">
  <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-hairline-soft)]">
  <div className="h-6 w-6 rounded-full bg-teal-50 text-accent flex items-center justify-center shrink-0">
  <Stethoscope className="w-3.5 h-3.5" />
  </div>
  <h4 className="font-bold text-[var(--color-ink)] text-sm sm:text-base">
  Clinical Reasoning Checkpoint · Why Option {correctKey} is correct
  </h4>
  </div>
  <p className="text-[var(--color-ink)] leading-relaxed font-normal">
  {currentQ.explanation}
  </p>
  </div>

  {/* Visual Finding Breakdown if image is attached */}
  {(currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor) && (
  <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-950 text-xs sm:text-sm leading-relaxed space-y-2.5">
  <div className="space-y-1">
  <p className="font-bold flex items-center gap-1.5 text-sky-900 ">
  <Eye className="w-4 h-4 text-sky-700" />
  Key Radiological / Diagnostic Finding:
  </p>
  <p className="font-medium pl-5 text-[var(--color-ink-2)]">
  {currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor}
  </p>
  </div>
  </div>
  )}

  {/* 3. WHY THE OTHERS ARE WRONG */}
  {distractorEntries.length > 0 && (
  <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-sunken)]/80 border border-[var(--color-hairline)] space-y-2.5 shadow-e1">
  <div className="pb-1.5 border-b border-[var(--color-hairline)]">
  <h4 className="font-bold text-[var(--color-ink)] text-xs sm:text-sm uppercase tracking-wider">
  Why other options are less appropriate:
  </h4>
  </div>
  <div className="space-y-1.5 pt-1">
  {distractorEntries.map(([k, exp]) => (
  <div key={k} className="text-xs text-[var(--color-ink-2)] pl-2 leading-relaxed flex items-start gap-1.5">
  <span className="font-bold text-[var(--color-ink)] shrink-0 ">Option {k}:</span>
  <span>{String(exp)}</span>
  </div>
  ))}
  </div>
  </div>
  )}

  {/* 4. FMGE PEARL */}
  {(currentQ.fmgeTakeaway || currentQ.trap) && (
  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-amber-950 text-xs sm:text-sm space-y-1.5 shadow-e1">
  <div className="flex items-center gap-1.5">
  <div className="h-4 w-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
  <Lightbulb className="w-2.5 h-2.5" />
  </div>
  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 ">
  Watch for this FMGE Trap: FMGE Pearl
  </span>
  </div>
  <p className="text-amber-950/90 leading-relaxed font-sans pl-0.5">
  {currentQ.fmgeTakeaway || currentQ.trap}
  </p>
  </div>
  )}

  {/* Memory Hook / Mnemonic */}
  {(currentQ.mnemonic || currentQ.memoryHook) && (
  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-purple-950 text-xs sm:text-sm space-y-1.5 shadow-e1">
  <div className="flex items-center gap-1.5">
  <div className="h-4 w-4 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
  <Brain className="w-2.5 h-2.5" />
  </div>
  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300/80 ">
  Memory Hook
  </span>
  </div>
  <p className="text-purple-950/90 leading-relaxed font-sans pl-0.5">
  {currentQ.mnemonic || currentQ.memoryHook}
  </p>
  </div>
  )}
  </div>

  {/* Next Question Progression Button */}
  <div className="pt-2 flex justify-end">
  <button
  type="button"
  onClick={onNextQuestion}
  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent hover:brightness-105 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
  >
  <span>
  {currentIndex + 1 === totalQuestions ? 'View Session Results' : 'Next Question'}
  </span>
  <ArrowRight className="w-4 h-4" />
  </button>
  </div>
  </div>
  )}
  </div>
  );
};
