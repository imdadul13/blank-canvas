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
        badgeColor: 'bg-teal-50 text-[#006B63] border-teal-200',
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
      <div className="w-full rounded-3xl border border-teal-100 bg-white p-8 sm:p-12 shadow-2xs text-center space-y-4 animate-in fade-in-50">
        <div className="h-14 w-14 rounded-2xl bg-[#006B63]/10 border border-[#006B63]/20 text-[#006B63] flex items-center justify-center mx-auto animate-pulse">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-slate-900 tracking-tight">
            Consulting Faculty Mentor
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
            Assembling 5 structured clinical reasoning questions targeted to high-yield exam scenarios...
          </p>
        </div>
        <div className="flex justify-center items-center gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#006B63] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#006B63] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#006B63] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // COMPLETION STATE
  // ----------------------------------------------------
  if (isComplete) {
    return (
      <div className="w-full rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-2xs space-y-6 text-slate-800 font-sans animate-in fade-in-50">
        {/* Header Banner */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006B63]/10 border border-[#006B63]/20 text-[#006B63] shadow-2xs">
            <Trophy className="h-7 w-7" />
          </div>

          <div className="space-y-1 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-[#006B63] uppercase font-['Outfit']">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Session Completed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900 tracking-tight">
              Clinical Challenge Complete
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              5-question clinical reasoning session completed. All attempts have been recorded to your performance tracker.
            </p>
          </div>
        </div>

        {/* Score Card */}
        <div className="max-w-md mx-auto rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-6 divide-x divide-slate-200">
            <div className="px-3">
              <span className="text-3xl font-bold font-['Outfit'] text-slate-900">
                {score} / {totalQuestions}
              </span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-['Outfit'] mt-0.5">
                Questions Correct
              </p>
            </div>
            <div className="px-6">
              <span className="text-3xl font-bold font-['Outfit'] text-[#006B63]">
                {accuracyPercent}%
              </span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-['Outfit'] mt-0.5">
                Clinical Accuracy
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-['Outfit'] ${assessment.badgeColor}`}>
              <Activity className="w-3 h-3" />
              <span>{assessment.label}</span>
            </span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans px-2">
              {assessment.summary}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowReviewList((prev) => !prev)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-['Outfit'] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <span>{showReviewList ? 'Hide Question Review' : 'Review 5 Questions'}</span>
            {showReviewList ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            type="button"
            onClick={onRestartQuiz}
            className="px-5 py-2.5 rounded-xl bg-[#006B63] hover:bg-[#00524c] text-white text-xs font-bold font-['Outfit'] flex items-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Start Another Clinical Challenge</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] cursor-pointer transition-colors"
          >
            Return to Mentor
          </button>
        </div>

        {/* Question Review Section */}
        {showReviewList && (
          <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#006B63]" />
                <span>Session Question Review ({questions.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">Click card to expand rationale</span>
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
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedReviewIndex(isExpanded ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold font-['Outfit'] uppercase">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 font-['Outfit']">
                            {q.subject} · {q.topic}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2 leading-relaxed">
                          {q.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full font-['Outfit'] flex items-center gap-1 ${
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
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-5 sm:px-5 space-y-3 pt-2 border-t border-slate-200/60 bg-white text-xs sm:text-sm">
                        {/* Clinical Stem if available */}
                        {q.stem && (
                          <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200/70">
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
                                    : 'bg-slate-50/50 border-slate-200 text-slate-600 opacity-80'
                                }`}
                              >
                                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isOptCorrect ? 'bg-emerald-600 text-white' : isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {opt.key}
                                </span>
                                <span>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2">
                          <p className="font-bold text-slate-900 font-['Outfit']">Clinical Rationale:</p>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>

                        {/* Distractor Breakdown if available */}
                        {q.distractorExplanations && Object.keys(q.distractorExplanations).length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1 text-xs">
                            <p className="font-bold text-slate-800 font-['Outfit']">Distractor Discriminators:</p>
                            {Object.entries(q.distractorExplanations).map(([k, exp]) => (
                              <p key={k} className="text-slate-600 pl-2">
                                <strong>Option {k}:</strong> {exp}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Takeaway / Mnemonic / Trap */}
                        {q.trap && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium">
                            ⚠️ <strong>Exam Trap:</strong> {q.trap}
                          </div>
                        )}
                        {q.mnemonic && (
                          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-medium">
                            🧠 <strong>Memory Hook:</strong> {q.mnemonic}
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
    <div className="w-full rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs space-y-5 text-slate-800 font-sans animate-in fade-in-50">
      {/* 1. Header: Faculty Mentor Session Classification & Progress */}
      <div className="space-y-3 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#006B63] uppercase font-['Outfit']">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinical Challenge</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold font-['Outfit'] uppercase tracking-wider">
              {currentQ.subject}
            </span>
            <span className="text-xs font-semibold text-slate-700 font-['Outfit']">
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
                        ? 'w-4 h-2 bg-[#006B63]'
                        : isAnswered
                        ? 'w-2 h-2 bg-teal-500/80'
                        : 'w-2 h-2 bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>

            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-['Outfit'] border border-slate-200/60">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs font-bold text-slate-400 font-['Outfit']">
              Score: {score} / {Object.keys(userAnswers).length}
            </span>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#006B63] h-full transition-all duration-300 rounded-full"
            style={{
              width: `${Math.round(((currentIndex + (isCurrentAnswered ? 1 : 0)) / totalQuestions) * 100)}%`,
            }}
          />
        </div>

        {/* Session Framing Subtitle */}
        <p className="text-[11px] text-slate-400 font-medium">
          5-question clinical reasoning session with your Faculty Mentor
        </p>
      </div>

      {/* 2. Optional Medical Image Investigation Display */}
      {currentQ.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group shadow-sm">
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
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Click to Zoom</span>
            </button>
          </div>
          {currentQ.imageAsset?.sourceName && (
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-300 bg-slate-900/85 px-2.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{currentQ.imageAsset.sourceName}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Clinical Scenario Stem Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs space-y-2.5">
        {currentQ.stem && (
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
            {currentQ.stem}
          </p>
        )}
        <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug font-['Outfit']">
          {currentQ.question}
        </p>
      </div>

      {/* 4. Options A, B, C, D with Radio Selectors */}
      <div className="grid grid-cols-1 gap-2.5">
        {currentQ.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          const isStaged = stagedKey === opt.key;
          const isOptCorrect = opt.key === correctKey;

          let btnStyle = 'border-slate-200/90 bg-white hover:border-[#006B63]/40 hover:bg-slate-50/70 text-slate-800 shadow-2xs';
          let badgeStyle = 'bg-slate-100 text-slate-700 border border-slate-200/80';
          let radioClasses = 'border-slate-300 bg-white';

          if (isCurrentAnswered) {
            if (isOptCorrect) {
              btnStyle = 'border-emerald-500/80 bg-emerald-50/70 text-emerald-950 font-semibold ring-2 ring-emerald-500/20 shadow-xs';
              badgeStyle = 'bg-emerald-600 text-white border-transparent';
              radioClasses = 'border-emerald-600 bg-emerald-600';
            } else if (isSelected && !isOptCorrect) {
              btnStyle = 'border-rose-400/80 bg-rose-50/70 text-rose-950 font-semibold ring-1 ring-rose-400/20';
              badgeStyle = 'bg-rose-600 text-white border-transparent';
              radioClasses = 'border-rose-600 bg-rose-600';
            } else {
              btnStyle = 'border-slate-200/70 bg-slate-50/40 text-slate-400 opacity-65 cursor-not-allowed';
              badgeStyle = 'bg-slate-100 text-slate-400 border-slate-200/60';
              radioClasses = 'border-slate-200 bg-slate-100';
            }
          } else if (isStaged) {
            btnStyle = 'border-[#006B63] bg-teal-50/50 text-slate-950 font-semibold ring-2 ring-[#006B63]/25 shadow-xs';
            badgeStyle = 'bg-[#006B63] text-white border-transparent';
            radioClasses = 'border-[#006B63] bg-white';
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={isCurrentAnswered}
              onClick={() => handleSelectOption(opt.key)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all duration-150 flex items-start gap-3.5 cursor-pointer min-h-[50px] ${btnStyle}`}
            >
              {/* Radio Indicator */}
              <span
                className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${radioClasses}`}
              >
                {isCurrentAnswered && isOptCorrect ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : isCurrentAnswered && isSelected && !isOptCorrect ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : isStaged ? (
                  <span className="h-2 w-2 rounded-full bg-[#006B63]" />
                ) : null}
              </span>

              {/* Letter Key Pill */}
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-['Outfit'] transition-colors ${badgeStyle}`}
              >
                {opt.key}
              </span>

              <span className="leading-relaxed pt-0.5 flex-1">{opt.text}</span>

              {/* Status and selection indicators on the right */}
              {isCurrentAnswered && isOptCorrect && (
                <span className="ml-auto shrink-0 self-center flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full font-['Outfit'] border border-emerald-300/60">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Correct</span>
                </span>
              )}
              {isCurrentAnswered && isSelected && !isOptCorrect && (
                <span className="ml-auto shrink-0 self-center flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100/90 px-2.5 py-0.5 rounded-full font-['Outfit'] border border-rose-300/60">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Your Answer</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Pre-Answer Submission Action Bar */}
      {!isCurrentAnswered && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100/90">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            {stagedKey ? `Selected Option ${stagedKey}. Click Submit Answer to verify.` : 'Select an option above to answer.'}
          </p>

          <button
            type="button"
            disabled={!stagedKey}
            onClick={handleConfirmAnswer}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-['Outfit'] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-xs cursor-pointer ${
              stagedKey
                ? 'bg-[#006B63] hover:bg-[#00524c] text-white active:scale-98 shadow-sm hover:shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/70'
            }`}
          >
            <span>Submit Answer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6. Post-Answer Comprehensive Rationale & Faculty Coaching */}
      {isCurrentAnswered && (
        <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in-50">
          {/* Result Header Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
              isCurrentCorrect
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/90 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCurrentCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-bold font-['Outfit']">
                {isCurrentCorrect
                  ? 'Correct! Well reasoned.'
                  : `Incorrect Answer · Correct is Option ${correctKey}`}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 font-['Outfit']">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>

          {/* Rationale Body */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4 text-xs sm:text-sm">
            {/* Faculty Explanation */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#006B63] uppercase tracking-wider font-['Outfit']">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinical Reasoning Checkpoint</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-normal">
                {currentQ.explanation}
              </p>
            </div>

            {/* Visual Finding Breakdown if image is attached */}
            {(currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor) && (
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs leading-relaxed space-y-2">
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-sky-900 font-['Outfit']">
                    <Eye className="w-4 h-4 text-sky-600" />
                    Key Radiological / Diagnostic Finding:
                  </p>
                  <p className="font-medium pl-5 text-slate-700">
                    {currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor}
                  </p>
                </div>
              </div>
            )}

            {/* Distractor Breakdown: Why other options are wrong */}
            {distractorEntries.length > 0 && (
              <div className="pt-3 border-t border-slate-200/70 space-y-2">
                <p className="text-xs font-bold text-slate-900 font-['Outfit'] uppercase tracking-wide">
                  Why other options are less appropriate:
                </p>
                <div className="space-y-1.5">
                  {distractorEntries.map(([k, exp]) => (
                    <div key={k} className="text-xs text-slate-600 pl-2 leading-relaxed flex items-start gap-1.5">
                      <span className="font-bold text-slate-800 shrink-0 font-['Outfit']">Option {k}:</span>
                      <span>{String(exp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High-Yield FMGE Takeaway / Exam Trap */}
            {(currentQ.trap || currentQ.fmgeTakeaway) && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold font-['Outfit'] text-amber-900">Watch for this FMGE Trap: </strong>
                  <span>{currentQ.trap || currentQ.fmgeTakeaway}</span>
                </div>
              </div>
            )}

            {/* Memory Hook / Mnemonic */}
            {(currentQ.mnemonic || currentQ.memoryHook) && (
              <div className="mt-2 p-3 rounded-xl bg-purple-50/90 border border-purple-200/90 text-purple-950 text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <Brain className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold font-['Outfit'] text-purple-900">Reasoning Shortcut: </strong>
                  <span>{currentQ.mnemonic || currentQ.memoryHook}</span>
                </div>
              </div>
            )}
          </div>

          {/* Next Question Progression Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNextQuestion}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#006B63] hover:bg-[#00524c] text-white text-xs font-bold font-['Outfit'] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
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
