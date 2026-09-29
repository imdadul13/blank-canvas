import React, { useState } from 'react';
import {
  Stethoscope,
  Check,
  X,
  CheckCircle2,
  ZoomIn,
  ShieldCheck,
  Eye,
  ArrowRight,
  Lightbulb,
  Brain,
  BookmarkPlus,
} from 'lucide-react';
import type { QuizQuestionItem } from '../AiCoachView';
import { McqOptionList } from './McqOptionList';
import { MedicalImageAsset, ErrorNotebookItem } from '../../types';

export interface MentorClinicalChallengeCardProps {
  quiz: QuizQuestionItem;
  msgId: string;
  onAnswer: (msgId: string, selectedKey: string) => void;
  onOpenImageModal?: (modalData: {
  isOpen: boolean;
  imageUrl: string;
  annotatedImageUrl?: string;
  imageAsset?: MedicalImageAsset;
  title: string;
  whatToLookFor?: string;
  }) => void;
  onFollowUpClick?: (text: string) => void;
  questionNumber?: number;
  totalQuestions?: number;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
}

export const MentorClinicalChallengeCard: React.FC<MentorClinicalChallengeCardProps> = ({
  quiz,
  msgId,
  onAnswer,
  onOpenImageModal,
  onFollowUpClick,
  questionNumber,
  totalQuestions,
  onAddErrorItem,
}) => {
  const [stagedKey, setStagedKey] = useState<string | null>(null);
  const [isLoggedToErrorVault, setIsLoggedToErrorVault] = useState(false);

  const correctKey = quiz.correctKey || (quiz as any).correctAnswer || 'A';
  const userAnswer = quiz.userAnswer;
  const isRevealed = Boolean(userAnswer);
  const isUserCorrect = userAnswer === correctKey;
  const correctOpt = quiz.options.find(o => o.key === correctKey);

  const handleSelectOption = (key: string) => {
  if (isRevealed) return;
  setStagedKey(key);
  };

  const handleSubmit = () => {
  if (isRevealed || !stagedKey) return;
  onAnswer(msgId, stagedKey);
  };

  // Collect distractor rationale entries if available
  const distractorEntries = Object.entries(
  quiz.distractorBreakdown || quiz.distractorExplanations || {}
  );

  const counterText = questionNumber && totalQuestions
  ? `QUESTION ${questionNumber} OF ${totalQuestions}`
  : 'Clinical Challenge';

  return (
  <div className="w-full my-4 rounded-3xl border border-[var(--color-hairline)] bg-white p-3.5 xs:p-5 sm:p-7 shadow-e1 space-y-5 text-[var(--color-ink)] break-words font-sans">
  {/* 1. Header: Classification Badge & Question Status */}
  <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b border-[var(--color-hairline-soft)]">
  <div className="flex items-center gap-2.5 flex-wrap">
  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-accent uppercase ">
  <Stethoscope className="w-3.5 h-3.5" />
  <span>{counterText}</span>
  </div>
  <span className="text-slate-300">·</span>
  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-ink)] text-white text-[11px] font-bold uppercase tracking-wider">
  {quiz.subject}
  </span>
  <span className="text-xs font-semibold text-[var(--color-ink-2)] ">
  {quiz.topic}
  </span>
  </div>

  {isRevealed && (
  <span
  className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
  isUserCorrect
  ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200'
  : 'bg-amber-50/90 text-amber-900 border border-amber-200'
  }`}
  >
  {isUserCorrect ? (
  <>
  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
  <span>Correct</span>
  </>
  ) : (
  <>
  <X className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
  <span>Option {correctKey} is correct</span>
  </>
  )}
  </span>
  )}
  </div>

  {/* 2. Medical Image / Investigation Attachment (if present) */}
  {quiz.imageUrl && (
  <div className="rounded-2xl overflow-hidden border border-[var(--color-hairline)] bg-slate-950 relative group shadow-sm">
  <img
  src={quiz.imageUrl}
  alt={quiz.topic}
  referrerPolicy="no-referrer"
  crossOrigin="anonymous"
  className="w-full max-h-[360px] object-contain cursor-zoom-in bg-slate-950"
  onError={(e) => {
  const target = e.currentTarget;
  if (!target.src.includes('/assets/medical-images/')) {
  target.src = '/assets/medical-images/ecg-complete-heart-block.svg';
  }
  }}
  onClick={() =>
  onOpenImageModal?.({
  isOpen: true,
  imageUrl: quiz.imageUrl!,
  imageAsset: quiz.imageAsset,
  title: `${quiz.subject} · ${quiz.topic}`,
  whatToLookFor: quiz.whatToLookFor,
  })
  }
  />
  <div className="absolute top-3 right-3 flex items-center gap-2">
  <button
  type="button"
  onClick={() =>
  onOpenImageModal?.({
  isOpen: true,
  imageUrl: quiz.imageUrl!,
  imageAsset: quiz.imageAsset,
  title: `${quiz.subject} · ${quiz.topic}`,
  whatToLookFor: quiz.whatToLookFor,
  })
  }
  className="px-3 py-1.5 rounded-xl bg-[var(--color-ink)]/80 backdrop-blur-sm hover:bg-[var(--color-ink)] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
  >
  <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
  <span>Click to Zoom</span>
  </button>
  </div>
  {quiz.imageAsset?.sourceName && (
  <div className="absolute bottom-2 left-3 text-[11px] text-slate-300 bg-[var(--color-ink)]/85 px-2.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
  <ShieldCheck className="w-3 h-3 text-emerald-400" />
  <span>{quiz.imageAsset.sourceName}</span>
  </div>
  )}
  </div>
  )}

  {/* 3. Clinical Vignette Stem & Core Question */}
  <div className="space-y-2.5">
  {quiz.stem && (
  <p className="text-sm sm:text-[15px] leading-relaxed text-[var(--color-ink-2)] font-normal">
  {quiz.stem}
  </p>
  )}
  <p className="text-sm sm:text-[15px] font-bold text-[var(--color-ink)] leading-snug ">
  {quiz.question}
  </p>
  </div>

  {/* 4. Answer Options — shared renderer, see McqOptionList */}
  {/* Option state: disabled={isRevealed} and isRevealed && isCorrectOption */}
  <McqOptionList
  options={quiz.options}
  stagedKey={stagedKey}
  userAnswer={userAnswer}
  correctKey={correctKey}
  revealed={isRevealed}
  onSelect={handleSelectOption}
  />

  {/* 5. Submit Action Button (Before submission) */}
  {!isRevealed && (
  <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-[var(--color-hairline-soft)]/90">
  <span className="text-xs text-[var(--color-ink-3)] font-medium">
  {stagedKey
  ? `Option ${stagedKey} selected. Confirm your diagnosis.`
  : 'Select an option above to submit your clinical diagnosis.'}
  </span>
  <button
  type="button"
  disabled={!stagedKey}
  onClick={handleSubmit}
  className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 ${
  stagedKey
  ? 'bg-accent hover:brightness-105 text-white shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]'
  : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-4)] border border-[var(--color-hairline)] cursor-not-allowed'
  }`}
  >
  <span>Submit Answer</span>
  <ArrowRight className="w-3.5 h-3.5" />
  </button>
  </div>
  )}

  {/* 6. Post-Answer Revealed Structured Remediation */}
  {isRevealed && (
  <div className="space-y-4 pt-4 border-t border-[var(--color-hairline-soft)] animate-in fade-in-50">
  {/* Gentle Answer Status Banner */}
  {isUserCorrect ? (
  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-950 space-y-1">
  <div className="flex items-center gap-2">
  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
  </div>
  <span className="font-bold text-teal-950 text-sm sm:text-base">
  Correct clinical judgment
  </span>
  </div>
  <p className="text-xs sm:text-sm text-teal-900/90 pl-8">
  Option {correctKey} {correctOpt ? `(${correctOpt.text})` : ''} is the standard of care in this presentation.
  </p>
  </div>
  ) : (
  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[var(--color-ink)] space-y-1">
  <div className="flex items-center gap-2">
  <div className="h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
  <X className="w-3.5 h-3.5 stroke-[2.5]" />
  </div>
  <span className="font-bold text-[var(--color-ink)] text-sm sm:text-base">
  Clinical revision needed
  </span>
  </div>
  <p className="text-xs sm:text-sm text-[var(--color-ink-2)] pl-8">
  You selected Option {userAnswer}. The correct answer is{' '}
  <strong className="text-[var(--color-ink)]">
  Option {correctKey} {correctOpt ? `(${correctOpt.text})` : ''}
  </strong>
  .
  </p>
  </div>
  )}

  {/* Section 1: WHY YOU MISSED IT (Only shown if incorrect) */}
  {!isUserCorrect && (
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
  {quiz.trap ||
  (userAnswer && (quiz.distractorBreakdown?.[userAnswer] || quiz.distractorExplanations?.[userAnswer])) ||
  `Option ${userAnswer} is a common FMGE trap choice that focuses on single features while missing key diagnostic criteria for Option ${correctKey}.`}
  </p>

  {/* One-Tap Save to Error Notebook */}
  {onAddErrorItem && (
  <div className="pt-1.5">
  <button
  type="button"
  onClick={() => {
  if (isLoggedToErrorVault) return;
  const userOpt = quiz.options.find((o) => o.key === userAnswer);
  onAddErrorItem({
  id: `err-challenge-${Date.now()}`,
  subjectId: quiz.subject || 'general',
  topic: quiz.topic || 'Clinical Challenge',
  questionGist: quiz.stem || quiz.question,
  myMistake: `Selected Option ${userAnswer}: ${userOpt?.text || ''}`,
  correctConcept: `Option ${correctKey}: ${correctOpt?.text || ''}. ${quiz.explanation}`,
  isReviewed: false,
  dateAdded: new Date().toISOString(),
  imageUrl: quiz.imageUrl,
  });
  setIsLoggedToErrorVault(true);
  }}
  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-e1 active:scale-95 cursor-pointer ${
  isLoggedToErrorVault
  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
  : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'
  }`}
  >
  {isLoggedToErrorVault ? (
  <>
  <Check className="w-3.5 h-3.5 text-emerald-600" />
  <span>Logged to Mistake Notebook</span>
  </>
  ) : (
  <>
  <BookmarkPlus className="w-3.5 h-3.5 text-rose-700" />
  <span>Log to Mistake Notebook</span>
  </>
  )}
  </button>
  </div>
  )}
  </div>
  )}

  {/* Section 2: WHY OPTION [X] IS CORRECT */}
  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[var(--color-hairline)] space-y-2.5 shadow-e1">
  <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-hairline-soft)]">
  <div className="h-6 w-6 rounded-full bg-teal-50 text-accent flex items-center justify-center shrink-0">
  <Stethoscope className="w-3.5 h-3.5" />
  </div>
  <h4 className="font-bold text-[var(--color-ink)] text-sm sm:text-base">
  Clinical Rationale · Why Option {correctKey} is correct
  </h4>
  </div>
  <p className="text-xs sm:text-sm text-[var(--color-ink-2)] leading-relaxed font-sans">
  {quiz.explanation}
  </p>
  </div>

  {/* Visual Finding Breakdown for Image Questions (if present) */}
  {(quiz.whatToLookFor || quiz.imageAsset?.whatToLookFor) && (
  <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-950 text-xs sm:text-sm leading-relaxed space-y-2.5">
  <div className="space-y-1">
  <p className="font-bold flex items-center gap-1.5 text-sky-900 ">
  <Eye className="w-4 h-4 text-sky-700" />
  <span>What to look at in this image:</span>
  </p>
  <p className="font-medium pl-5 text-[var(--color-ink-2)] text-xs leading-relaxed">
  {quiz.whatToLookFor || quiz.imageAsset?.whatToLookFor}
  </p>
  </div>

  {quiz.imageUrl && (
  <div className="pt-2 border-t border-sky-100 flex justify-end">
  <button
  type="button"
  onClick={() =>
  onOpenImageModal?.({
  isOpen: true,
  imageUrl: quiz.imageUrl!,
  annotatedImageUrl: quiz.annotatedImageUrl || quiz.imageAsset?.annotatedImageUrl,
  imageAsset: quiz.imageAsset,
  title: `${quiz.subject} · ${quiz.topic}`,
  whatToLookFor: quiz.whatToLookFor,
  })
  }
  className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
  >
  <Eye className="w-3.5 h-3.5 text-teal-700" />
  <span>Open Annotated Visual Inspection</span>
  </button>
  </div>
  )}
  </div>
  )}

  {/* Section 3: WHY THE OTHERS ARE WRONG */}
  {distractorEntries.length > 0 && (
  <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-sunken)]/80 border border-[var(--color-hairline)] space-y-2.5 shadow-e1">
  <div className="pb-1.5 border-b border-[var(--color-hairline)]">
  <h4 className="font-bold text-[var(--color-ink)] text-xs sm:text-sm uppercase tracking-wider">
  Why other options are wrong
  </h4>
  </div>
  <div className="space-y-2 pt-1">
  {distractorEntries.map(([key, exp]) => (
  <div key={key} className="border-l-2 border-[var(--color-hairline)] pl-3 py-0.5 space-y-0.5">
  <span className="font-bold text-[var(--color-ink)] text-xs ">
  Option {key}:
  </span>
  <p className="text-xs text-[var(--color-ink-2)] leading-relaxed">
  {String(exp)}
  </p>
  </div>
  ))}
  </div>
  </div>
  )}

  {/* Section 4: FMGE PEARL */}
  {(quiz.fmgeTakeaway || quiz.trap) && (
  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-amber-950 text-xs sm:text-sm space-y-1.5 shadow-e1">
  <div className="flex items-center gap-1.5">
  <div className="h-4 w-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
  <Lightbulb className="w-2.5 h-2.5" />
  </div>
  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 ">
  FMGE Key Takeaway · Pearl
  </span>
  </div>
  <p className="text-amber-950/90 leading-relaxed font-sans pl-0.5">
  {quiz.fmgeTakeaway || quiz.trap}
  </p>
  </div>
  )}

  {/* Memory Hook / Mnemonic (if present) */}
  {(quiz.memoryHook || quiz.mnemonic) && (
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
  {quiz.memoryHook || quiz.mnemonic}
  </p>
  </div>
  )}

  {/* Contextual Follow-up Suggestions */}
  {onFollowUpClick && (
  <div className="pt-2 flex flex-wrap items-center gap-2">
  <span className="text-[11px] font-medium text-[var(--color-ink-4)] mr-0.5">Next step:</span>
  <button
  type="button"
  onClick={() => onFollowUpClick('Why is this answer correct?')}
  className="px-3 py-1 bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-hairline)] rounded-full text-xs text-[var(--color-ink-2)] font-medium transition-all shadow-e1 hover:shadow-xs cursor-pointer flex items-center gap-1"
  >
  <span>Explain clinical reasoning</span>
  <span className="text-[var(--color-ink-4)] text-xs">→</span>
  </button>
  <button
  type="button"
  onClick={() => onFollowUpClick('Explain why other options are wrong')}
  className="px-3 py-1 bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-hairline)] rounded-full text-xs text-[var(--color-ink-2)] font-medium transition-all shadow-e1 hover:shadow-xs cursor-pointer flex items-center gap-1"
  >
  <span>Analyze all distractors</span>
  <span className="text-[var(--color-ink-4)] text-xs">→</span>
  </button>
  <button
  type="button"
  onClick={() => onFollowUpClick(`Give me another MCQ on ${quiz.topic}`)}
  className="px-3 py-1 bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-hairline)] rounded-full text-xs text-[var(--color-ink-2)] font-medium transition-all shadow-e1 hover:shadow-xs cursor-pointer flex items-center gap-1"
  >
  <span>Another MCQ on this topic</span>
  <span className="text-[var(--color-ink-4)] text-xs">→</span>
  </button>
  </div>
  )}
  </div>
  )}
  </div>
  );
};
