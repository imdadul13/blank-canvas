import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Zap,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  Check,
  ZoomIn,
  Eye,
  BarChart2,
  Sprout,
  Stethoscope,
  XCircle,
  ListFilter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PracticeSessionContext,
  PracticeSessionQuestion,
  PracticeSessionSummary,
  MedicalImageAsset,
} from '../types';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { fetchPracticeSessionQuestions } from '../utils/practiceSessionEngine';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';

/**
 * Safely extracts distractor rationale/explanation if already available on question data.
 * Adheres strictly to the rule: If not available, returns null (do not invent content).
 */
function getDistractorReason(question: PracticeSessionQuestion, optKey: string): string | null {
  const qAny = question as any;
  if (!qAny) return null;

  // 1. Array format: distractorBreakdown
  if (Array.isArray(qAny.distractorBreakdown)) {
    const item = qAny.distractorBreakdown.find(
      (d: any) => d && (d.key === optKey || d.optionKey === optKey)
    );
    if (item?.explanation && typeof item.explanation === 'string') return item.explanation.trim();
    if (item?.reason && typeof item.reason === 'string') return item.reason.trim();
  }

  // 2. Object format: distractorBreakdown or distractorExplanations
  const breakdownObj = qAny.distractorBreakdown || qAny.distractorExplanations;
  if (breakdownObj && typeof breakdownObj === 'object' && !Array.isArray(breakdownObj)) {
    const val = breakdownObj[optKey];
    if (val && typeof val === 'string') return val.trim();
  }

  // 3. Array format: whyOtherOptionsAreWrong
  if (Array.isArray(qAny.whyOtherOptionsAreWrong)) {
    const item = qAny.whyOtherOptionsAreWrong.find(
      (d: any) => d && (d.key === optKey || d.optionKey === optKey)
    );
    if (item?.reason && typeof item.reason === 'string') return item.reason.trim();
    if (item?.rationale && typeof item.rationale === 'string') return item.rationale.trim();
    if (item?.explanation && typeof item.explanation === 'string') return item.explanation.trim();
  }

  return null;
}

interface PracticeMcqSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: PracticeSessionContext | null;
  onRecordAttempt?: (input: NewMcqAttemptInput) => void;
}

export const PracticeMcqSessionModal: React.FC<PracticeMcqSessionModalProps> = ({
  isOpen,
  onClose,
  context,
  onRecordAttempt,
}) => {
  const [questions, setQuestions] = useState<PracticeSessionQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModalImage, setActiveModalImage] = useState<{
    isOpen: boolean;
    imageUrl: string;
    annotatedImageUrl?: string;
    imageAsset?: MedicalImageAsset;
    title?: string;
    whatToLookFor?: string;
  }>({
    isOpen: false,
    imageUrl: '',
  });

  // User answers map: index -> { selectedAnswer, isCorrect, timeTakenSeconds }
  const [userAnswers, setUserAnswers] = useState<
    Record<number, { selectedAnswer: string; isCorrect: boolean; timeTakenSeconds: number }>
  >({});
  const [sessionSummary, setSessionSummary] = useState<PracticeSessionSummary | null>(null);
  const [isReviewingMistakes, setIsReviewingMistakes] = useState<boolean>(false);
  const [reviewMistakeIdx, setReviewMistakeIdx] = useState<number>(0);

  const questionStartTimeRef = useRef<number>(Date.now());
  const postAnswerRef = useRef<HTMLDivElement>(null);
  const [activeElapsedSeconds, setActiveElapsedSeconds] = useState<number>(0);

  // Smoothly scroll to explanation on submit
  useEffect(() => {
    if (isAnswerSubmitted && postAnswerRef.current) {
      postAnswerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isAnswerSubmitted]);

  // Live timer for the current question
  useEffect(() => {
    if (!isOpen || isLoading || sessionSummary || isAnswerSubmitted) {
      return;
    }
    setActiveElapsedSeconds(0);
    const timer = setInterval(() => {
      setActiveElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isLoading, sessionSummary, currentIdx, isAnswerSubmitted]);

  const formatSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Load questions whenever modal opens with fresh context
  useEffect(() => {
    if (!isOpen || !context) {
      setQuestions([]);
      setCurrentIdx(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setUserAnswers({});
      setSessionSummary(null);
      setIsReviewingMistakes(false);
      setActiveElapsedSeconds(0);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setSessionSummary(null);
    setIsReviewingMistakes(false);
    setActiveElapsedSeconds(0);

    fetchPracticeSessionQuestions(context)
      .then((loadedQuestions) => {
        if (!isCancelled) {
          if (loadedQuestions.length === 0) {
            setErrorMessage('Could not load practice questions for this topic. Please try again.');
          } else {
            setQuestions(loadedQuestions);
            setCurrentIdx(0);
            questionStartTimeRef.current = Date.now();
            setActiveElapsedSeconds(0);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load practice session:', err);
          setErrorMessage('Error loading questions. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, context?.sessionId]);

  if (!isOpen || !context) return null;

  const currentQ: PracticeSessionQuestion | undefined = questions[currentIdx];
  const targetCount = questions.length || context.targetQuestionCount || 10;
  const progressPct = Math.round(((currentIdx + 1) / targetCount) * 100);

  // Derived stats from real user answers
  const answersList = Object.values(userAnswers);
  const answeredCount = answersList.length;
  const liveCorrectCount = answersList.filter((a) => a.isCorrect).length;
  const liveAccuracy = answeredCount > 0 ? Math.round((liveCorrectCount / answeredCount) * 100) : null;
  const totalRecordedTime = answersList.reduce((acc, a) => acc + a.timeTakenSeconds, 0);
  const liveAvgTime = answeredCount > 0 ? Math.round(totalRecordedTime / answeredCount) : null;

  const handleSelectOption = (key: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(key);
  };

  const handleSubmitAnswer = () => {
    if (!currentQ || !selectedOption || isAnswerSubmitted) return;

    const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isCorrect = selectedOption === currentQ.correctAnswer;

    // 1. Record in local component session map
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        selectedAnswer: selectedOption,
        isCorrect,
        timeTakenSeconds: timeTaken,
      },
    }));

    // 2. Commit attempt to master performance engine
    onRecordAttempt?.({
      questionId: currentQ.id,
      subjectId: context.subjectId,
      topicId: context.topicId,
      topicName: context.topicName,
      subtopic: currentQ.subtopic || context.subtopic,
      isCorrect,
      selectedAnswer: selectedOption,
      correctAnswer: currentQ.correctAnswer,
      timeTakenSeconds: timeTaken,
      difficulty: 'high-yield',
      confidence: 'high',
      source: 'recommended_video_practice',
      sessionId: context.sessionId,
      isImageBased: Boolean(currentQ.imageUrl),
      imageCategory: currentQ.imageAsset?.imageCategory || currentQ.mediaType,
      imageUrl: currentQ.imageUrl,
      imageAssetId: currentQ.imageAsset?.assetId,
    });

    setIsAnswerSubmitted(true);
  };

  const handleSkipQuestion = () => {
    if (!currentQ || isAnswerSubmitted) return;
    const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        selectedAnswer: 'SKIPPED',
        isCorrect: false,
        timeTakenSeconds: timeTaken,
      },
    }));

    onRecordAttempt?.({
      questionId: currentQ.id,
      subjectId: context.subjectId,
      topicId: context.topicId,
      topicName: context.topicName,
      isCorrect: false,
      selectedAnswer: 'SKIPPED',
      correctAnswer: currentQ.correctAnswer,
      timeTakenSeconds: timeTaken,
      difficulty: 'high-yield',
      source: 'recommended_video_practice',
      sessionId: context.sessionId,
    });

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      questionStartTimeRef.current = Date.now();
    } else {
      // Session Complete -> Compute Summary
      const answersList = Object.values(userAnswers);
      const totalAnswered = answersList.length;
      const correctCount = answersList.filter((a) => a.isCorrect).length;
      const incorrectCount = totalAnswered - correctCount;
      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const totalTime = answersList.reduce((acc, a) => acc + a.timeTakenSeconds, 0);
      const avgTime = totalAnswered > 0 ? Math.round(totalTime / totalAnswered) : 0;

      const userAnswersFormatted: Record<string, { selectedAnswer: string; selectedOptionId?: string; isCorrect: boolean; timeTakenSeconds: number }> = {};
      Object.entries(userAnswers).forEach(([idx, ans]) => {
        userAnswersFormatted[idx] = ans;
      });

      setSessionSummary({
        sessionId: context.sessionId,
        subjectId: context.subjectId,
        subjectName: context.subjectName,
        topicId: context.topicId,
        topicName: context.topicName,
        totalQuestions: questions.length,
        correctCount,
        incorrectCount,
        accuracy,
        totalTimeSeconds: totalTime,
        averageTimeSeconds: avgTime,
        questions,
        userAnswers: userAnswersFormatted,
        weakConceptsDetected: [],
      });
    }
  };

  const handlePracticeAgain = () => {
    setIsLoading(true);
    setSessionSummary(null);
    setIsReviewingMistakes(false);
    setUserAnswers({});
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);

    const freshContext: PracticeSessionContext = {
      ...context,
      sessionId: `session-${Date.now()}`,
    };

    fetchPracticeSessionQuestions(freshContext).then((loaded) => {
      setQuestions(loaded);
      setIsLoading(false);
      questionStartTimeRef.current = Date.now();
    });
  };

  const missedQuestionIndices = sessionSummary
    ? questions
        .map((_, i) => i)
        .filter((i) => !sessionSummary.userAnswers[i]?.isCorrect)
    : [];

  // Group questions by subtopic/topic for clean, non-gamified topic performance breakdown
  const topicBreakdown = sessionSummary
    ? (() => {
        const map: Record<string, { total: number; correct: number }> = {};
        sessionSummary.questions.forEach((q, idx) => {
          const label = q.subtopic || q.topicName || sessionSummary.topicName;
          if (!map[label]) map[label] = { total: 0, correct: 0 };
          map[label].total += 1;
          if (sessionSummary.userAnswers[idx]?.isCorrect) {
            map[label].correct += 1;
          }
        });
        return Object.entries(map).map(([name, stats]) => ({
          name,
          total: stats.total,
          correct: stats.correct,
          accuracy: Math.round((stats.correct / stats.total) * 100),
        }));
      })()
    : [];

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md overflow-y-auto font-['Inter'] text-[#121E1B]">
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-[#FBFDFB] sm:rounded-3xl max-w-5xl w-full h-full sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border-0 sm:border border-[#DCE4E1]"
      >
        {/* MODAL HEADER */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[#F0F3F2] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Circular Counter Badge 1/10 */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 shadow-xs ${
                sessionSummary ? 'bg-[#006B63] text-white' : 'bg-[#1A2E2B] text-white'
              }`}
            >
              {sessionSummary ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
              ) : (
                `${currentIdx + 1}/${targetCount}`
              )}
            </div>

            {/* Subject & Topic Context */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] font-medium text-[#66716F]">
                <span className="font-mono font-bold uppercase tracking-wider text-[#121E1B] bg-[#F1F5F4] px-2 py-0.5 rounded text-[10px] sm:text-[11px] border border-[#E2E8E6] shrink-0">
                  {context.subjectName}
                </span>
                <span className="text-[#A4B1AE] hidden xs:inline">/</span>
                <span className="truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[280px] md:max-w-md text-[#66716F]">
                  {context.topicName}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold font-['Newsreader'] text-[#121E1B] truncate mt-0.5">
                {sessionSummary
                  ? 'Session Performance Summary'
                  : `Question ${currentIdx + 1} of ${targetCount}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5F7F8] hover:bg-[#EAEFEA] text-[#66716F] hover:text-[#121E1B] flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-[#DCE4E1]"
            title="Close practice session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        {!sessionSummary && !isLoading && (
          <div className="w-full bg-[#E8EDEB] h-1 overflow-hidden shrink-0">
            <div
              className="bg-[#006B63] h-full transition-all duration-300 rounded-r-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* MOBILE COMPACT STATS STRIP (Screens <lg) */}
        {!sessionSummary && !isLoading && currentQ && (
          <div className="flex lg:hidden items-center justify-between px-3.5 sm:px-4 py-2 bg-[#F5F7F8] border-b border-[#F0F3F2] text-[11px] sm:text-xs font-mono text-[#66716F] shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#006B63]" />
              <span className="font-bold text-[#121E1B]">{formatSeconds(activeElapsedSeconds)}</span>
            </div>
            <span className="font-medium text-[#121E1B]">
              Q {currentIdx + 1} of {targetCount}
            </span>
            <span>
              {liveAccuracy !== null ? `${liveAccuracy}% accuracy` : `${progressPct}% completed`}
            </span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-[#006B63] border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-sm font-bold text-[#121E1B]">
                  Preparing 10 Targeted High-Yield MCQs...
                </p>
                <p className="text-xs text-[#66716F] mt-1">
                  Topic: {context.subjectName} → {context.topicName}
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="py-12 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm text-[#121E1B] font-semibold">{errorMessage}</p>
              <button
                type="button"
                onClick={handlePracticeAgain}
                className="px-4 py-2 rounded-xl bg-[#006B63] text-white text-xs font-bold hover:bg-[#005049] transition-colors cursor-pointer"
              >
                Retry Loading
              </button>
            </div>
          ) : sessionSummary ? (
            /* ================= SESSION COMPLETION VIEW (STAGE 3D REDESIGN) ================= */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-5 sm:space-y-6"
            >
              {/* 1. COMPLETION HEADER */}
              <div className="p-5 sm:p-7 bg-white rounded-2xl sm:rounded-3xl border border-[#DCE4E1] shadow-2xs space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20 inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SESSION COMPLETE
                  </span>
                  <span className="font-mono text-[11px] text-[#8C9895]">
                    {sessionSummary.totalQuestions} Questions Evaluated
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-['Newsreader'] text-[#121E1B] tracking-tight leading-snug">
                  {sessionSummary.accuracy >= 80
                    ? 'Outstanding Clinical Mastery'
                    : sessionSummary.accuracy >= 60
                    ? 'Solid Clinical Performance'
                    : 'Clinical Review Recommended'}
                </h2>

                <p className="text-xs sm:text-sm text-[#66716F] leading-relaxed max-w-2xl">
                  10-question targeted clinical reinforcement drill completed for{' '}
                  <span className="font-semibold text-[#121E1B]">{context.subjectName}</span> ·{' '}
                  <span className="font-medium text-[#121E1B]">{context.topicName}</span>.
                </p>
              </div>

              {/* 2. PRIMARY ACCURACY & PERFORMANCE HERO CARD */}
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#DCE4E1] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#4A5553] block">
                      OVERALL DRILL ACCURACY
                    </span>
                    <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
                      <span className="font-['Newsreader'] text-4xl sm:text-5xl font-bold text-[#006B63] leading-none">
                        {sessionSummary.accuracy}%
                      </span>
                      <span className="text-xs sm:text-sm text-[#66716F]">
                        <strong className="text-[#121E1B] font-semibold">{sessionSummary.correctCount}</strong> of{' '}
                        <strong className="text-[#121E1B] font-semibold">{sessionSummary.totalQuestions}</strong> questions answered correctly
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
                        sessionSummary.accuracy >= 70
                          ? 'bg-[#E8F5F1] text-[#006B63] border-[#006B63]/25'
                          : 'bg-[#FFFBEB] text-[#92400E] border-amber-200'
                      }`}
                    >
                      {sessionSummary.accuracy >= 80
                        ? 'Proficient'
                        : sessionSummary.accuracy >= 60
                        ? 'Developing'
                        : 'Needs Revision'}
                    </span>
                  </div>
                </div>

                {/* 10-Question Segmented Question Strip */}
                <div className="pt-3 border-t border-[#F0F3F2]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#66716F] mb-2">
                    <span>Question Breakdown</span>
                    <span>
                      {sessionSummary.correctCount} Correct · {sessionSummary.incorrectCount} Missed / Skipped
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 sm:gap-1.5 h-2.5 sm:h-3">
                    {sessionSummary.questions.map((_, idx) => {
                      const isAnsCorrect = sessionSummary.userAnswers[idx]?.isCorrect;
                      return (
                        <div
                          key={idx}
                          className={`h-full rounded-xs sm:rounded-sm transition-all ${
                            isAnsCorrect ? 'bg-[#006B63]' : 'bg-rose-500'
                          }`}
                          title={`Question ${idx + 1}: ${isAnsCorrect ? 'Correct' : 'Incorrect / Skipped'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. SUPPORTING METRICS TILES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Questions Completed */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#66716F]">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#4A5553]">
                      Questions Completed
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#006B63]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-['Newsreader'] text-[#121E1B]">
                    {sessionSummary.totalQuestions} Questions
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#66716F]">
                    {sessionSummary.correctCount} correct · {sessionSummary.incorrectCount} missed
                  </p>
                </div>

                {/* Pace / Response Time */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#66716F]">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#4A5553]">
                      Average Response Pace
                    </span>
                    <Clock className="w-4 h-4 text-[#006B63]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-['Newsreader'] text-[#121E1B]">
                    {sessionSummary.averageTimeSeconds}s <span className="text-xs font-normal text-[#66716F]">/ question</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#66716F]">
                    Total elapsed time: {formatSeconds(sessionSummary.totalTimeSeconds)}
                  </p>
                </div>

                {/* FMGE Benchmark Status */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#66716F]">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#4A5553]">
                      FMGE Target
                    </span>
                    <Award className="w-4 h-4 text-[#006B63]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-['Newsreader'] text-[#121E1B]">
                    {sessionSummary.accuracy >= 70 ? 'Target Met' : 'Review Suggested'}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#66716F]">
                    {sessionSummary.accuracy >= 70 ? '≥70% clinical pass standard' : 'Target threshold: 70% accuracy'}
                  </p>
                </div>
              </div>

              {/* 4. PERFORMANCE BY TOPIC & CONCEPT */}
              {topicBreakdown.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#DCE4E1] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#006B63]" />
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#4A5553]">
                        Performance by Topic & Subtopic
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8C9895]">
                      {topicBreakdown.length} Area{topicBreakdown.length > 1 ? 's' : ''} Evaluated
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topicBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#EAEFEA] bg-[#FBFDFB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#121E1B] truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#66716F] mt-1">
                            <span>{item.correct} of {item.total} correct</span>
                            <span>·</span>
                            <span className="font-mono font-medium text-[#121E1B]">{item.accuracy}% accuracy</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-[#E8EDEB] h-1.5 rounded-full overflow-hidden mt-2 max-w-md">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.accuracy >= 70 ? 'bg-[#006B63]' : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.accuracy}%` }}
                            />
                          </div>
                        </div>

                        <div className="shrink-0 sm:self-center">
                          <span
                            className={`font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                              item.accuracy >= 70
                                ? 'bg-[#E8F5F1] text-[#006B63] border-[#006B63]/20'
                                : 'bg-[#FFF5F5] text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.accuracy >= 70 ? 'Proficient' : 'Needs Review'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. REVIEW MISSED QUESTIONS SECTION */}
              {isReviewingMistakes && missedQuestionIndices.length > 0 ? (
                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FFFDFD] border border-[#F5C2C7] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0D5D8] pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-300/40">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#4F131A] block">
                          Reviewing Mistake {reviewMistakeIdx + 1} of {missedQuestionIndices.length}
                        </span>
                        <span className="text-[11px] text-[#8C9895] font-mono">
                          Question #{missedQuestionIndices[reviewMistakeIdx] + 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setReviewMistakeIdx((prev) =>
                              prev > 0 ? prev - 1 : missedQuestionIndices.length - 1
                            )
                          }
                          className="p-1.5 rounded-lg bg-white hover:bg-[#F1F5F4] text-[#121E1B] border border-[#DCE4E1] transition-colors cursor-pointer"
                          title="Previous mistake"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReviewMistakeIdx((prev) =>
                              prev + 1 < missedQuestionIndices.length ? prev + 1 : 0
                            )
                          }
                          className="p-1.5 rounded-lg bg-white hover:bg-[#F1F5F4] text-[#121E1B] border border-[#DCE4E1] transition-colors cursor-pointer"
                          title="Next mistake"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsReviewingMistakes(false)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F1F5F4] text-[#4A5553] text-xs font-semibold border border-[#DCE4E1] transition-colors cursor-pointer"
                      >
                        Close Review
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const mIdx = missedQuestionIndices[reviewMistakeIdx];
                    const q = questions[mIdx];
                    const uAns = sessionSummary.userAnswers[mIdx];
                    if (!q) return null;

                    return (
                      <div className="space-y-3.5 text-xs sm:text-sm">
                        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#EAEFEA] space-y-1.5">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#66716F]">
                            Clinical Vignette
                          </span>
                          <p className="text-xs sm:text-[13.5px] text-[#1E2B27] leading-relaxed">
                            {q.scenario}
                          </p>
                        </div>

                        <h4 className="font-['Newsreader'] font-bold text-sm sm:text-base text-[#121E1B] leading-snug">
                          {q.question}
                        </h4>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const isCorrectOpt = opt.key === q.correctAnswer;
                            const isUserWrong = opt.key === uAns?.selectedAnswer && !isCorrectOpt;

                            let optStyle = 'bg-white border-[#E2E8E6] text-[#4A5553]';
                            let badgeStyle = 'bg-[#F1F5F4] text-[#66716F] border-[#DCE4E1]';

                            if (isCorrectOpt) {
                              optStyle = 'bg-[#F0FDF8] border-[#A7F3D0] text-[#0E3E36] font-semibold';
                              badgeStyle = 'bg-[#006B63] text-white border-[#006B63]';
                            } else if (isUserWrong) {
                              optStyle = 'bg-[#FFF5F5] border-[#FECDD3] text-rose-950 font-semibold';
                              badgeStyle = 'bg-rose-600 text-white border-rose-600';
                            }

                            return (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${optStyle}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${badgeStyle}`}>
                                    {opt.key}
                                  </span>
                                  <span className="leading-snug">{opt.text}</span>
                                </div>
                                {isCorrectOpt ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#006B63] shrink-0" />
                                ) : isUserWrong ? (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                                    Your Choice · Incorrect
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div className="p-4 bg-white rounded-xl border border-[#DCE4E1] text-xs sm:text-[13px] text-[#1E2B27] space-y-2 leading-relaxed">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#344E47]">
                            <Stethoscope className="w-3.5 h-3.5 text-[#006B63]" />
                            <span>Explanation & Rationale</span>
                          </div>
                          <p>{q.explanation}</p>

                          {q.highYieldPearl && (
                            <div className="mt-2.5 pt-2.5 border-t border-[#F0F3F2] flex items-start gap-2 text-amber-900 bg-[#FFFDF5] p-2.5 rounded-lg border border-[#F6E0B5]">
                              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-mono text-[10px] uppercase tracking-wider text-[#78350F] block">
                                  FMGE Takeaway
                                </strong>
                                <span className="text-xs text-[#78350F] font-medium">{q.highYieldPearl}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              {/* 6. ACTION BAR */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#DCE4E1] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                {missedQuestionIndices.length > 0 && !isReviewingMistakes ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewMistakeIdx(0);
                      setIsReviewingMistakes(true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#FFF5F5] hover:bg-[#FFEBEB] text-rose-800 border border-rose-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer order-2 sm:order-1 min-h-[44px]"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Review {missedQuestionIndices.length} Missed Question{missedQuestionIndices.length > 1 ? 's' : ''}</span>
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-white hover:bg-[#F1F5F4] text-[#121E1B] border border-[#DCE4E1] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center cursor-pointer min-h-[44px]"
                  >
                    Return to Practice
                  </button>

                  <button
                    type="button"
                    onClick={handlePracticeAgain}
                    className="flex-1 sm:flex-initial px-6 sm:px-7 py-3 rounded-xl bg-[#006B63] hover:bg-[#005049] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px] font-display"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Start Another Drill</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : currentQ ? (
            /* ================= ACTIVE 10-QUESTION FLOW ================= */
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left/Main: Question & Options Area (~70% width) */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* Dedicated Clinical Vignette Card */}
                <div className="p-4 sm:p-6 lg:p-7 bg-white rounded-2xl sm:rounded-3xl border border-[#DCE4E1] shadow-2xs space-y-4">
                  {/* Vignette Metadata Badge Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#F1F5F4] text-[#4A5553] border border-[#E2E8E6]">
                        CLINICAL VIGNETTE
                      </span>
                      {(currentQ.difficulty === 'high-yield' || Boolean(currentQ.highYieldPearl)) && (
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                          High Yield
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-[#8C9895]">
                      10 Questions Target
                    </span>
                  </div>

                  {/* Clinical Scenario */}
                  <div className="text-sm sm:text-[15px] lg:text-base text-[#1E2B27] leading-relaxed font-normal">
                    {currentQ.scenario}
                  </div>

                  {/* Attached Image / IBQ / ECG / X-Ray */}
                  {currentQ.imageUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-[#DCE4E1] bg-[#0A1210] group max-h-80 shadow-xs">
                      <img
                        src={currentQ.imageUrl}
                        alt={currentQ.question}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-auto max-h-80 object-contain mx-auto cursor-zoom-in bg-[#0A1210]"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('/assets/medical-images/')) {
                            target.src = '/assets/medical-images/ecg-inferior-stemi.svg';
                          }
                        }}
                        onClick={() =>
                          setActiveModalImage({
                            isOpen: true,
                            imageUrl: currentQ.imageUrl!,
                            imageAsset: currentQ.imageAsset,
                            title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                            whatToLookFor: currentQ.whatToLookFor,
                          })
                        }
                      />
                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModalImage({
                              isOpen: true,
                              imageUrl: currentQ.imageUrl!,
                              imageAsset: currentQ.imageAsset,
                              title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                              whatToLookFor: currentQ.whatToLookFor,
                            })
                          }
                          className="px-3 py-1.5 bg-[#121E1B]/85 hover:bg-[#121E1B] backdrop-blur-md rounded-xl text-[11px] font-mono font-medium text-white flex items-center gap-1.5 shadow-sm cursor-pointer border border-white/10 transition-colors"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-[#5EEAD4]" />
                          <span>Tap to Zoom</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attached Video Clip */}
                  {currentQ.videoUrl && (
                    <div className="rounded-2xl overflow-hidden border border-[#DCE4E1] bg-black">
                      <video
                        controls
                        src={currentQ.videoUrl}
                        className="w-full max-h-80 object-contain bg-black"
                      >
                        Your browser does not support HTML5 video.
                      </video>
                    </div>
                  )}

                  {/* Question Inquiry Stem — Strongest Visual Element */}
                  <div className="pt-3 border-t border-[#F0F3F2]">
                    <h4 className="text-base sm:text-lg lg:text-xl font-bold font-['Newsreader'] text-[#121E1B] leading-snug tracking-tight">
                      {currentQ.question}
                    </h4>
                  </div>
                </div>

                {/* Answer Options & Post-Answer Experience */}
                {!isAnswerSubmitted ? (
                  /* Active Question Options (Stage 3B — preserved exactly) */
                  <div className="space-y-2.5 sm:space-y-3">
                    {currentQ.options.map((opt) => {
                      const isSelected = selectedOption === opt.key;

                      let cardStyle =
                        'bg-white border-[#DCE4E1] hover:border-[#006B63]/40 hover:bg-[#F9FBFA] text-[#1E2B27] shadow-2xs';
                      let badgeStyle =
                        'bg-[#F1F5F4] text-[#4A5553] border border-[#DCE4E1]';

                      if (isSelected) {
                        cardStyle =
                          'bg-[#F7FCFA] border-[#006B63] text-[#004D47] font-semibold ring-1 ring-[#006B63] shadow-xs';
                        badgeStyle = 'bg-[#006B63] text-white border border-[#006B63] shadow-2xs';
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleSelectOption(opt.key)}
                          className={`w-full min-h-[52px] sm:min-h-[56px] p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                        >
                          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
                            <span
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                            >
                              {opt.key}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-[#006B63] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Post-Answer State (Stage 3C — Redesigned Answer & Explanation Experience) */
                  <motion.div
                    ref={postAnswerRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    {/* 1. Result Banner & Clinical Explanation Card */}
                    {selectedOption === currentQ.correctAnswer ? (
                      /* Calm Positive Treatment for Correct Answer */
                      <div className="p-5 sm:p-6 bg-[#F4FAF7] rounded-2xl sm:rounded-3xl border border-[#B7DFD2] shadow-2xs space-y-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5F1] text-[#006B63] flex items-center justify-center shrink-0 border border-[#006B63]/20 mt-0.5">
                              <CheckCircle2 className="w-5 h-5 text-[#006B63]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold font-['Newsreader'] text-[#0E3E36] leading-snug">
                                  Correct Answer: Option {currentQ.correctAnswer}
                                </h3>
                                <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20">
                                  Well Done
                                </span>
                              </div>
                              <p className="text-xs text-[#006B63] mt-0.5 font-medium">
                                You selected Option {selectedOption}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Clinical Explanation Section */}
                        <div className="pt-3 border-t border-[#D5E6E0] space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#344E47]">
                            <Stethoscope className="w-3.5 h-3.5 text-[#006B63]" />
                            <span>Clinical Rationale & Pathophysiology</span>
                          </div>
                          <div className="text-xs sm:text-[13.5px] text-[#1E2B27] leading-relaxed sm:leading-relaxed font-normal space-y-2">
                            {currentQ.explanation.split('\n\n').map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                          </div>
                        </div>

                        {/* What to look for in image (if image insights present) */}
                        {(currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor) && (
                          <div className="p-3.5 sm:p-4 bg-white/90 rounded-2xl border border-[#DCE4E1] text-xs text-[#1E2B27] space-y-2.5 shadow-2xs">
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-[#E8F5F1] text-[#006B63] flex items-center justify-center shrink-0 border border-[#006B63]/20 mt-0.5">
                                <Eye className="w-3.5 h-3.5 text-[#006B63]" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#006B63] block">
                                  Key Visual Finding / Image Inspection
                                </span>
                                <p className="mt-1 leading-relaxed text-[#2D3748]">
                                  {currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor}
                                </p>
                              </div>
                            </div>

                            {currentQ.imageUrl && (
                              <div className="pt-2 border-t border-[#F0F3F2] flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveModalImage({
                                      isOpen: true,
                                      imageUrl: currentQ.imageUrl!,
                                      annotatedImageUrl:
                                        currentQ.annotatedImageUrl || currentQ.imageAsset?.annotatedImageUrl,
                                      imageAsset: currentQ.imageAsset,
                                      title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                                      whatToLookFor: currentQ.whatToLookFor,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-[#F1F5F4] hover:bg-[#E2E8E6] border border-[#DCE4E1] text-[#121E1B] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#006B63]" />
                                  <span>Open Annotated Visual Inspection</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Clear, Restrained Semantic Treatment for Incorrect Answer */
                      <div className="p-5 sm:p-6 bg-[#FDF6F6] rounded-2xl sm:rounded-3xl border border-[#F5C2C7] shadow-2xs space-y-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-300/40 mt-0.5">
                              <AlertCircle className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold font-['Newsreader'] text-[#4F131A] leading-snug">
                                  Incorrect · Correct Answer is Option {currentQ.correctAnswer}
                                </h3>
                                <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  Review Rationale
                                </span>
                              </div>
                              <p className="text-xs text-rose-700 mt-0.5 font-medium">
                                Your choice: Option {selectedOption ?? 'Skipped'} · Correct: Option {currentQ.correctAnswer}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Clinical Explanation Section */}
                        <div className="pt-3 border-t border-[#F0D5D8] space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#5A3034]">
                            <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                            <span>Clinical Rationale & Pathophysiology</span>
                          </div>
                          <div className="text-xs sm:text-[13.5px] text-[#1E2B27] leading-relaxed sm:leading-relaxed font-normal space-y-2">
                            {currentQ.explanation.split('\n\n').map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                          </div>
                        </div>

                        {/* What to look for in image (if image insights present) */}
                        {(currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor) && (
                          <div className="p-3.5 sm:p-4 bg-white/90 rounded-2xl border border-[#DCE4E1] text-xs text-[#1E2B27] space-y-2.5 shadow-2xs">
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-[#E8F5F1] text-[#006B63] flex items-center justify-center shrink-0 border border-[#006B63]/20 mt-0.5">
                                <Eye className="w-3.5 h-3.5 text-[#006B63]" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#006B63] block">
                                  Key Visual Finding / Image Inspection
                                </span>
                                <p className="mt-1 leading-relaxed text-[#2D3748]">
                                  {currentQ.whatToLookFor || currentQ.imageAsset?.whatToLookFor}
                                </p>
                              </div>
                            </div>

                            {currentQ.imageUrl && (
                              <div className="pt-2 border-t border-[#F0F3F2] flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveModalImage({
                                      isOpen: true,
                                      imageUrl: currentQ.imageUrl!,
                                      annotatedImageUrl:
                                        currentQ.annotatedImageUrl || currentQ.imageAsset?.annotatedImageUrl,
                                      imageAsset: currentQ.imageAsset,
                                      title: `${currentQ.subjectName} · ${currentQ.topicName}`,
                                      whatToLookFor: currentQ.whatToLookFor,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-[#F1F5F4] hover:bg-[#E2E8E6] border border-[#DCE4E1] text-[#121E1B] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#006B63]" />
                                  <span>Open Annotated Visual Inspection</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. FMGE Key Takeaway Card */}
                    {currentQ.highYieldPearl && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF5] border border-[#F6E0B5] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#FEF3C7] text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/40">
                              <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                            </div>
                            <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#78350F]">
                              FMGE Key Takeaway
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-amber-200 shrink-0 hidden xs:inline">
                            Remember for Exam
                          </span>
                        </div>
                        <div className="pl-8 text-xs sm:text-[13px] text-[#78350F] leading-relaxed font-medium">
                          {currentQ.highYieldPearl}
                        </div>
                      </div>
                    )}

                    {/* 3. Option Analysis Section */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#4A5553] flex items-center gap-1.5">
                          <ListFilter className="w-3.5 h-3.5 text-[#006B63]" />
                          <span>Option Analysis</span>
                        </span>
                        <span className="text-[11px] font-mono text-[#8C9895]">
                          {currentQ.options.length} Options Evaluated
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {currentQ.options.map((opt) => {
                          const isSelected = selectedOption === opt.key;
                          const isCorrect = opt.key === currentQ.correctAnswer;
                          const distractorReason = getDistractorReason(currentQ, opt.key);

                          let cardClass = '';
                          let badgeClass = '';
                          let textClass = '';

                          if (isCorrect) {
                            cardClass = 'bg-[#F0FDF8] border-[#A7F3D0] shadow-2xs';
                            badgeClass = 'bg-[#006B63] text-white border border-[#006B63] shadow-2xs';
                            textClass = 'text-[#121E1B] font-semibold';
                          } else if (isSelected) {
                            cardClass = 'bg-[#FFF5F5] border-[#FECDD3] shadow-2xs';
                            badgeClass = 'bg-rose-600 text-white border border-rose-600 shadow-2xs';
                            textClass = 'text-[#121E1B] font-semibold';
                          } else {
                            cardClass = 'bg-white border-[#E2E8E6] text-[#4A5553] opacity-80';
                            badgeClass = 'bg-[#F1F5F4] text-[#66716F] border border-[#DCE4E1]';
                            textClass = 'text-[#3D4947]';
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${cardClass}`}
                            >
                              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 pr-1 flex-1">
                                <span
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5 ${badgeClass}`}
                                >
                                  {opt.key}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className={`leading-snug ${textClass}`}>{opt.text}</p>

                                  {/* Sub-label or distractor explanation if available */}
                                  {distractorReason ? (
                                    <p
                                      className={`text-[11px] sm:text-xs mt-1 leading-relaxed ${
                                        isCorrect
                                          ? 'text-[#006B63] font-medium'
                                          : isSelected
                                          ? 'text-rose-700 font-medium'
                                          : 'text-[#66716F]'
                                      }`}
                                    >
                                      <span className="font-semibold">
                                        {isCorrect
                                          ? 'Correct'
                                          : isSelected
                                          ? 'Incorrect · Your Choice'
                                          : 'Incorrect'}
                                      </span>
                                      {' — '}
                                      <span>{distractorReason}</span>
                                    </p>
                                  ) : (
                                    <div className="mt-1 flex items-center gap-1.5">
                                      {isCorrect && (
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20">
                                          Correct Answer
                                        </span>
                                      )}
                                      {isSelected && !isCorrect && (
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                          Your Selection · Incorrect
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0 mt-1">
                                {isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#006B63]" />
                                ) : isSelected ? (
                                  <AlertCircle className="w-5 h-5 text-rose-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-[#A4B1AE]" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F0F3F2] sticky sm:static bottom-0 bg-[#FBFDFB]/95 backdrop-blur-md py-3 px-3.5 sm:px-0 sm:py-0 sm:bg-transparent z-10">
                  {!isAnswerSubmitted ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSkipQuestion}
                        className="text-xs sm:text-sm font-semibold text-[#66716F] hover:text-[#121E1B] px-3.5 py-2.5 rounded-xl hover:bg-[#F1F5F4] transition-colors cursor-pointer"
                      >
                        Skip Question
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption}
                        className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#1A2E2B] hover:bg-[#122421] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-display"
                      >
                        <span>Submit Answer</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="hidden sm:flex items-center gap-2 text-xs text-[#66716F]">
                        <span className="font-mono font-bold text-[#121E1B]">
                          Question {currentIdx + 1} of {targetCount}
                        </span>
                        <span>·</span>
                        <span>
                          {selectedOption === currentQ.correctAnswer ? (
                            <span className="text-emerald-700 font-medium">Answered Correctly</span>
                          ) : (
                            <span className="text-rose-600 font-medium">Review Explanation Below</span>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#006B63] hover:bg-[#005049] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer font-display ml-auto"
                      >
                        <span>
                          {currentIdx + 1 < targetCount
                            ? `Next Question (${currentIdx + 2}/${targetCount})`
                            : 'View Session Summary'}
                        </span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Progress Companion (Desktop Only) */}
              <aside className="w-72 lg:w-80 shrink-0 hidden lg:flex flex-col gap-4 border-l border-[#F0F3F2] pl-6">
                {/* 10-Question Step Map */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#121E1B] font-bold">
                      Clinical Drill Progress
                    </span>
                    <span className="text-[#66716F] text-[11px] font-mono">
                      {answeredCount} of {targetCount} completed
                    </span>
                  </div>

                  <div className="w-full bg-[#E8EDEB] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006B63] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(answeredCount / targetCount) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {Array.from({ length: targetCount }).map((_, idx) => {
                      const isCurrent = idx === currentIdx;
                      const ans = userAnswers[idx];
                      const isAnswered = Boolean(ans);
                      const isCorrect = ans?.isCorrect;

                      let stepClass = 'bg-[#F1F5F4] text-[#8C9895] border-[#E2E8E6]';
                      if (isCurrent) {
                        if (isAnswerSubmitted && ans) {
                          stepClass = ans.isCorrect
                            ? 'bg-[#006B63] text-white border-[#006B63] ring-2 ring-[#006B63]/40 font-bold shadow-xs'
                            : 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300 font-bold shadow-xs';
                        } else {
                          stepClass =
                            'bg-[#1A2E2B] text-white border-[#1A2E2B] ring-2 ring-[#006B63] font-bold shadow-xs';
                        }
                      } else if (isAnswered) {
                        if (isCorrect) {
                          stepClass =
                            'bg-[#006B63] text-white border-[#006B63] font-bold';
                        } else {
                          stepClass = 'bg-rose-600 text-white border-rose-600 font-bold';
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className={`h-8 rounded-full border text-xs font-mono flex items-center justify-center transition-all ${stepClass}`}
                        >
                          <span>{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Topic Context */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-2">
                  <span className="font-mono text-[#66716F] uppercase tracking-wider text-[10px] font-bold block">
                    CURRENT TOPIC
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F5F1] text-[#006B63] flex items-center justify-center shrink-0 border border-[#006B63]/15">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-[13px] font-bold text-[#121E1B] leading-snug line-clamp-2">
                        {context.topicName}
                      </h4>
                      <p className="text-[11px] text-[#66716F] mt-0.5">
                        {context.subjectName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timing Metrics & Accuracy */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#66716F] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#006B63]" />
                        <span>Time Elapsed</span>
                      </span>
                      <span className="font-mono font-bold text-[#121E1B]">
                        {formatSeconds(totalRecordedTime + activeElapsedSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#66716F]">Average Time / Q</span>
                      <span className="font-mono font-bold text-[#121E1B]">
                        {liveAvgTime !== null ? `${liveAvgTime}s` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F0F3F2]">
                      <span className="text-[#66716F] flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-[#006B63]" />
                        <span>Accuracy (Current)</span>
                      </span>
                      <span className="font-mono font-bold text-[#006B63]">
                        {liveAccuracy !== null ? `${liveAccuracy}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Helpful Strategy Note */}
                <div className="p-3.5 rounded-2xl bg-[#F0FDF8] border border-[#D5E4DE] text-[11px] text-[#3D4947] leading-relaxed flex items-start gap-2.5">
                  <Sprout className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="italic font-medium text-[#121E1B]">
                      "Every question you solve builds a better doctor."
                    </p>
                    <p className="text-[10px] font-semibold text-[#006B63]">
                      Keep going. You're improving.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </motion.div>
      </div>

      {/* Image Zoom Lightbox */}
      <MedicalImageViewerModal
        isOpen={activeModalImage.isOpen}
        onClose={() => setActiveModalImage(prev => ({ ...prev, isOpen: false }))}
        imageUrl={activeModalImage.imageUrl}
        annotatedImageUrl={activeModalImage.annotatedImageUrl}
        imageAsset={activeModalImage.imageAsset}
        title={activeModalImage.title}
        whatToLookFor={activeModalImage.whatToLookFor}
      />
    </div>,
    document.body
  );
};
