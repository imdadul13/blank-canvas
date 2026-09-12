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
} from 'lucide-react';
import type { QuizQuestionItem } from '../AiCoachView';
import { MedicalImageAsset } from '../../types';

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
}

export const MentorClinicalChallengeCard: React.FC<MentorClinicalChallengeCardProps> = ({
  quiz,
  msgId,
  onAnswer,
  onOpenImageModal,
  onFollowUpClick,
  questionNumber,
  totalQuestions,
}) => {
  const [stagedKey, setStagedKey] = useState<string | null>(null);

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
    <div className="w-full my-4 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs space-y-5 text-slate-800 break-words font-sans">
      {/* 1. Header: Classification Badge & Question Status */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#006B63] uppercase font-['Outfit']">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{counterText}</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold font-['Outfit'] uppercase tracking-wider">
            {quiz.subject}
          </span>
          <span className="text-xs font-semibold text-slate-700 font-['Outfit']">
            {quiz.topic}
          </span>
        </div>

        {isRevealed && (
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full font-['Outfit'] flex items-center gap-1.5 ${
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
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group shadow-sm">
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
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Click to Zoom</span>
            </button>
          </div>
          {quiz.imageAsset?.sourceName && (
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-300 bg-slate-900/85 px-2.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{quiz.imageAsset.sourceName}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Clinical Vignette Stem & Core Question */}
      <div className="space-y-2.5">
        {quiz.stem && (
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700 font-normal">
            {quiz.stem}
          </p>
        )}
        <p className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug font-['Outfit']">
          {quiz.question}
        </p>
      </div>

      {/* 4. Answer Options (A, B, C, D) with Radio Selectors */}
      <div className="grid grid-cols-1 gap-2.5">
        {quiz.options.map((opt) => {
          const isStaged = stagedKey === opt.key;
          const isSelected = userAnswer === opt.key;
          const isCorrectOption = opt.key === correctKey;

          let btnClasses = 'border-slate-200/90 bg-white hover:border-[#006B63]/40 hover:bg-slate-50/70 text-slate-800 shadow-2xs';
          let letterClasses = 'bg-slate-100 text-slate-700 border border-slate-200/80';
          let radioClasses = 'border-slate-300 bg-white';

          if (isRevealed) {
            if (isCorrectOption) {
              btnClasses = 'border-emerald-500/80 bg-emerald-50/70 text-emerald-950 font-semibold ring-2 ring-emerald-500/20 shadow-2xs';
              letterClasses = 'bg-emerald-600 text-white border-transparent';
              radioClasses = 'border-emerald-600 bg-emerald-600';
            } else if (isSelected && !isCorrectOption) {
              btnClasses = 'border-rose-400/80 bg-rose-50/70 text-rose-950 font-semibold ring-2 ring-rose-400/20';
              letterClasses = 'bg-rose-600 text-white border-transparent';
              radioClasses = 'border-rose-600 bg-rose-600';
            } else {
              btnClasses = 'border-slate-200/70 bg-slate-50/40 text-slate-400 opacity-65 cursor-default';
              letterClasses = 'bg-slate-100 text-slate-400 border-slate-200/60';
              radioClasses = 'border-slate-200 bg-slate-100';
            }
          } else if (isStaged) {
            btnClasses = 'border-[#006B63] bg-teal-50/50 text-slate-900 font-semibold ring-2 ring-[#006B63]/25 shadow-xs';
            letterClasses = 'bg-[#006B63] text-white border-transparent';
            radioClasses = 'border-[#006B63] bg-white';
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={isRevealed}
              onClick={() => handleSelectOption(opt.key)}
              className={`w-full min-h-[50px] p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all duration-150 flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${btnClasses}`}
            >
              {/* Radio Indicator */}
              <span
                className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${radioClasses}`}
              >
                {isRevealed && isCorrectOption ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : isRevealed && isSelected && !isCorrectOption ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : isStaged ? (
                  <span className="h-2 w-2 rounded-full bg-[#006B63]" />
                ) : null}
              </span>

              {/* Letter Key Pill */}
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-['Outfit'] transition-colors ${letterClasses}`}
              >
                {opt.key}
              </span>

              <span className="leading-relaxed pt-0.5 flex-1">{opt.text}</span>

              {/* Status and selection indicators on the right */}
              {isRevealed && isCorrectOption && (
                <span className="ml-auto shrink-0 self-center flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full font-['Outfit'] border border-emerald-300/60">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Correct</span>
                </span>
              )}
              {isRevealed && isSelected && !isCorrectOption && (
                <span className="ml-auto shrink-0 self-center flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100/90 px-2.5 py-0.5 rounded-full font-['Outfit'] border border-rose-300/60">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Your Answer</span>
                </span>
              )}
              {!isRevealed && isStaged && (
                <span className="ml-auto shrink-0 self-center text-[#006B63]">
                  <CheckCircle2 className="w-4 h-4 fill-[#006B63] text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Submit Action Button (Before submission) */}
      {!isRevealed && (
        <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-slate-100/90">
          <span className="text-xs text-slate-500 font-medium">
            {stagedKey
              ? `Option ${stagedKey} selected. Confirm your diagnosis.`
              : 'Select an option above to submit your clinical diagnosis.'}
          </span>
          <button
            type="button"
            disabled={!stagedKey}
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-xl font-['Outfit'] font-bold text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 ${
              stagedKey
                ? 'bg-[#006B63] hover:bg-[#00554e] text-white shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed'
            }`}
          >
            <span>Submit Answer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6. Post-Answer Revealed Structured Remediation */}
      {isRevealed && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in-50">
          {/* Gentle Answer Status Banner */}
          {isUserCorrect ? (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-950 space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-[#006B63] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="font-['Outfit'] font-bold text-teal-950 text-sm sm:text-base">
                  Correct clinical judgment
                </span>
              </div>
              <p className="text-xs sm:text-sm text-teal-900/90 pl-8">
                Option {correctKey} {correctOpt ? `(${correctOpt.text})` : ''} is the standard of care in this presentation.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="font-['Outfit'] font-bold text-slate-900 text-sm sm:text-base">
                  Clinical revision needed
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 pl-8">
                You selected Option {userAnswer}. The correct answer is{' '}
                <strong className="text-slate-900">
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
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 font-['Outfit']">
                  Why you missed it
                </span>
                <span className="text-xs font-semibold text-rose-900 font-['Outfit']">
                  Distractor Trap Analysis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                {quiz.trap ||
                  (userAnswer && (quiz.distractorBreakdown?.[userAnswer] || quiz.distractorExplanations?.[userAnswer])) ||
                  `Option ${userAnswer} is a common FMGE trap choice that focuses on single features while missing key diagnostic criteria for Option ${correctKey}.`}
              </p>
            </div>
          )}

          {/* Section 2: WHY OPTION [X] IS CORRECT */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="h-6 w-6 rounded-full bg-teal-50 text-[#006B63] flex items-center justify-center shrink-0">
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-['Outfit'] font-bold text-slate-900 text-sm sm:text-base">
                Clinical Rationale · Why Option {correctKey} is correct
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              {quiz.explanation}
            </p>
          </div>

          {/* Visual Finding Breakdown for Image Questions (if present) */}
          {(quiz.whatToLookFor || quiz.imageAsset?.whatToLookFor) && (
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-950 text-xs sm:text-sm leading-relaxed space-y-2.5">
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sky-900 font-['Outfit']">
                  <Eye className="w-4 h-4 text-sky-700" />
                  <span>What to look at in this image:</span>
                </p>
                <p className="font-medium pl-5 text-slate-700 text-xs leading-relaxed">
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
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 shadow-2xs">
              <div className="pb-1.5 border-b border-slate-200/60">
                <h4 className="font-['Outfit'] font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
                  Why other options are wrong
                </h4>
              </div>
              <div className="space-y-2 pt-1">
                {distractorEntries.map(([key, exp]) => (
                  <div key={key} className="border-l-2 border-slate-200 pl-3 py-0.5 space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs font-['Outfit']">
                      Option {key}:
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {String(exp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: FMGE PEARL */}
          {(quiz.fmgeTakeaway || quiz.trap) && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-amber-950 text-xs sm:text-sm space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-2.5 h-2.5" />
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 font-['Outfit']">
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
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-purple-950 text-xs sm:text-sm space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                  <Brain className="w-2.5 h-2.5" />
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300/80 font-['Outfit']">
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
              <span className="text-[11px] font-medium text-slate-400 mr-0.5">Next step:</span>
              <button
                type="button"
                onClick={() => onFollowUpClick('Why is this answer correct?')}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Explain clinical reasoning</span>
                <span className="text-slate-400 text-xs">→</span>
              </button>
              <button
                type="button"
                onClick={() => onFollowUpClick('Explain why other options are wrong')}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Analyze all distractors</span>
                <span className="text-slate-400 text-xs">→</span>
              </button>
              <button
                type="button"
                onClick={() => onFollowUpClick(`Give me another MCQ on ${quiz.topic}`)}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Another MCQ on this topic</span>
                <span className="text-slate-400 text-xs">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
