import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Award,
  Flag,
  Check,
  ShieldCheck,
  BarChart2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { GrandTest, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { fetchPracticeSessionQuestions } from '../utils/practiceSessionEngine';
import { getLocalDateKey } from '../utils/date';

interface NbeMockExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogGrandTest?: (gt: GrandTest) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'review' | 'answered-review';

interface MockQuestion {
  id: string;
  index: number;
  subjectId: string;
  subjectName: string;
  topicName: string;
  question: string;
  options: { optionId: string; key: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  userSelectedOption: string | null;
  status: QuestionStatus;
}

export const NbeMockExamModal: React.FC<NbeMockExamModalProps> = ({
  isOpen,
  onClose,
  onLogGrandTest,
  onAddErrorItem,
}) => {
  // Test Lifecycle: 'intro' | 'testing' | 'review'
  const [phase, setPhase] = useState<'intro' | 'testing' | 'review'>('intro');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(50 * 60); // 50 minutes
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [addedErrorIds, setAddedErrorIds] = useState<Set<string>>(new Set());
  const [loggedToGT, setLoggedToGT] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Generate 50 balanced questions from high-yield subjects on open
  useEffect(() => {
    if (isOpen) {
      setPhase('intro');
      setCurrentIndex(0);
      setSecondsLeft(50 * 60);
      setShowSubmitConfirm(false);
      setAddedErrorIds(new Set());
      setLoggedToGT(false);

      // Select top high-yield topics
      const mockList: MockQuestion[] = [];
      const prioritySubjects = ['medicine', 'surgery', 'obg', 'psm', 'pathology', 'pharmacology', 'pediatrics', 'anatomy'];
      let qIdx = 0;

      for (const subId of prioritySubjects) {
        const sub = FMGE_SUBJECTS.find((s) => s.id === subId);
        if (!sub) continue;
        for (const topic of sub.topics.slice(0, 7)) {
          if (mockList.length >= 50) break;
          const questionsGenerated = fetchPracticeSessionQuestions({
            sessionId: `mock_${sub.id}_${topic.id}`,
            source: 'daily_mission',
            subjectId: sub.id,
            subjectName: sub.name,
            topicId: topic.id,
            topicName: topic.name,
            targetQuestionCount: 5,
          });
          const picked = questionsGenerated[0];
          if (picked) {
            mockList.push({
              id: `nbe_q_${qIdx + 1}`,
              index: qIdx,
              subjectId: sub.id,
              subjectName: sub.name,
              topicName: topic.name,
              question: picked.question,
              options: picked.options,
              correctAnswer: picked.correctAnswer,
              explanation: picked.explanation,
              userSelectedOption: null,
              status: qIdx === 0 ? 'not-answered' : 'not-visited',
            });
            qIdx++;
          }
        }
      }
      setQuestions(mockList);
    }
  }, [isOpen]);

  // Timer Tick during testing
  useEffect(() => {
    if (phase === 'testing') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStartExam = () => {
    setPhase('testing');
    setCurrentIndex(0);
  };

  const handleAutoSubmit = () => {
    setPhase('review');
    setShowSubmitConfirm(false);
  };

  const handleSelectOption = (key: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== currentIndex) return q;
        const newStatus: QuestionStatus =
          q.status === 'review' || q.status === 'answered-review' ? 'answered-review' : 'answered';
        return {
          ...q,
          userSelectedOption: key,
          status: newStatus,
        };
      })
    );
  };

  const handleClearResponse = () => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== currentIndex) return q;
        const newStatus: QuestionStatus =
          q.status === 'answered-review' ? 'review' : 'not-answered';
        return {
          ...q,
          userSelectedOption: null,
          status: newStatus,
        };
      })
    );
  };

  const handleToggleMarkReview = () => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== currentIndex) return q;
        const hasAnswer = q.userSelectedOption !== null;
        let nextStatus: QuestionStatus = 'review';
        if (q.status === 'review' || q.status === 'answered-review') {
          nextStatus = hasAnswer ? 'answered' : 'not-answered';
        } else {
          nextStatus = hasAnswer ? 'answered-review' : 'review';
        }
        return {
          ...q,
          status: nextStatus,
        };
      })
    );
  };

  const handleNavigateQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === idx && q.status === 'not-visited') {
          return { ...q, status: 'not-answered' };
        }
        return q;
      })
    );
    setCurrentIndex(idx);
  };

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      handleNavigateQuestion(currentIndex + 1);
    }
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    setPhase('review');
  };

  // Performance telemetry calculations
  const totalAnswered = useMemo(
    () => questions.filter((q) => q.userSelectedOption !== null).length,
    [questions]
  );
  const totalMarkedReview = useMemo(
    () => questions.filter((q) => q.status === 'review' || q.status === 'answered-review').length,
    [questions]
  );
  const totalCorrect = useMemo(
    () => questions.filter((q) => q.userSelectedOption === q.correctAnswer).length,
    [questions]
  );
  const totalIncorrect = useMemo(
    () => questions.filter((q) => q.userSelectedOption !== null && q.userSelectedOption !== q.correctAnswer).length,
    [questions]
  );
  const totalUnattempted = questions.length - totalAnswered;

  // Scaled Score (50 MCQs scaled to 300 marks)
  const scaledScore = Math.round((totalCorrect / Math.max(1, questions.length)) * 300);
  const isPassing = scaledScore >= 150;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const timeSpentSeconds = 50 * 60 - secondsLeft;
  const avgSecondsPerQuestion = totalAnswered > 0 ? Math.round(timeSpentSeconds / totalAnswered) : 0;

  // Log as Grand Test
  const handleLogToGrandTests = () => {
    if (!onLogGrandTest || loggedToGT) return;
    const gt: GrandTest = {
      id: `gt_nbe_mock_${Date.now()}`,
      title: `NBE 50-MCQ Mini-Mock (#${new Date().toLocaleDateString()})`,
      platform: 'Marrow',
      date: getLocalDateKey(),
      score: scaledScore,
      totalMarks: 300,
      correctCount: totalCorrect * 6,
      incorrectCount: totalIncorrect * 6,
      skippedCount: totalUnattempted * 6,
      percentile: Math.min(99, Math.round(accuracy * 0.95)),
      weakSubjectIds: [],
      strongSubjectIds: [],
      keyMistakesNotes: `NBE 50-MCQ Exam Simulation completed with ${accuracy}% accuracy (${totalCorrect}/50 correct).`,
    };
    onLogGrandTest(gt);
    setLoggedToGT(true);
  };

  // Add individual question to Error Notebook
  const handleAddQuestionToErrors = (q: MockQuestion) => {
    if (!onAddErrorItem || addedErrorIds.has(q.id)) return;
    const item: ErrorNotebookItem = {
      id: `err_${Date.now()}_${q.id}`,
      subjectId: q.subjectId,
      topic: q.topicName,
      questionGist: q.question,
      myMistake: `Selected Option (${q.userSelectedOption || 'Skipped'}) during Timed NBE Mini-Mock`,
      correctConcept: `${q.explanation}`,
      dateAdded: getLocalDateKey(),
      isReviewed: false,
    };
    onAddErrorItem(item);
    setAddedErrorIds((prev) => new Set(prev).add(q.id));
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex] || questions[0];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 backdrop-blur-md text-slate-100 font-['Plus_Jakarta_Sans'] select-none">
      {/* ═══ Top CBT Examination Bar ═══ */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-400/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold font-['Outfit'] text-white">
              NBE Computer-Based Test Simulation (50 MCQs)
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              National Board of Examinations Protocol • 1 Mark Each • No Negative Marking
            </p>
          </div>
        </div>

        {/* Timer & Actions */}
        <div className="flex items-center gap-3">
          {phase === 'testing' && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs ${
                secondsLeft <= 300
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 animate-pulse'
                  : 'bg-slate-800 text-teal-300 border-slate-700'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          )}

          {phase === 'testing' && (
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="px-3.5 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              Submit Exam
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Exit Simulator"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ═══ Phase 1: Intro / Instructions ═══ */}
      {phase === 'intro' && (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-400/20 mb-1">
                <Award className="h-7 w-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-['Outfit']">
                50-MCQ Rapid Exam Simulation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test your speed, stamina, and clinical acumen under true NBE exam constraints.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="text-slate-400 font-mono text-[10px]">TOTAL QUESTIONS</div>
                <div className="text-base font-bold text-white">50 MCQs</div>
                <div className="text-[10px] text-slate-400">Balanced high-yield mix</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="text-slate-400 font-mono text-[10px]">TIME ALLOTTED</div>
                <div className="text-base font-bold text-teal-400 font-mono">50 Minutes</div>
                <div className="text-[10px] text-slate-400">60s / question benchmark</div>
              </div>
            </div>

            {/* Color Palette Legend */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                Official NBE Question Palette Legend
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-rose-500 shrink-0" />
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-violet-500 shrink-0" />
                  <span>Marked Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0" />
                  <span>Ans + Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-600 shrink-0" />
                  <span>Not Visited</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartExam}
              className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>I am Ready • Begin Examination</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* ═══ Phase 2: Live Testing Environment ═══ */}
      {phase === 'testing' && currentQ && (
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Active Question Area */}
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto border-r border-slate-800">
            <div className="space-y-4 max-w-3xl">
              {/* Question Meta Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-mono font-bold text-xs">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentQ.subjectName} • {currentQ.topicName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMarkReview}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    currentQ.status === 'review' || currentQ.status === 'answered-review'
                      ? 'bg-violet-500/30 text-violet-200 border-violet-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>
                    {currentQ.status === 'review' || currentQ.status === 'answered-review'
                      ? 'Marked for Review'
                      : 'Mark for Review'}
                  </span>
                </button>
              </div>

              {/* Question Stem */}
              <div className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = currentQ.userSelectedOption === opt.key;
                  return (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left text-xs sm:text-sm transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-teal-500/20 text-teal-100 border-teal-400 shadow-md shadow-teal-500/10'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl font-bold font-mono text-xs border ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 border-teal-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="leading-relaxed pt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClearResponse}
                disabled={currentQ.userSelectedOption === null}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Clear Response
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: 1-50 Question Palette */}
          <aside className="w-full md:w-80 bg-slate-900/60 p-4 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                <span>QUESTION PALETTE</span>
                <span>{totalAnswered}/50 ANSWERED</span>
              </div>

              {/* Grid 1 to 50 */}
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  let bgStyle = 'bg-slate-700 text-slate-300';
                  if (q.status === 'answered') bgStyle = 'bg-emerald-500 text-slate-950 font-bold';
                  if (q.status === 'not-answered') bgStyle = 'bg-rose-500 text-white font-bold';
                  if (q.status === 'review') bgStyle = 'bg-violet-500 text-white font-bold';
                  if (q.status === 'answered-review') bgStyle = 'bg-amber-500 text-slate-950 font-bold';

                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleNavigateQuestion(idx)}
                      className={`h-8 rounded-lg font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${bgStyle} ${
                        isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-105' : ''
                      }`}
                      title={`Question ${idx + 1} (${q.status})`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="pt-4 border-t border-slate-800 space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="text-emerald-400 font-bold">{totalAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked Review:</span>
                <span className="text-violet-400 font-bold">{totalMarkedReview}</span>
              </div>
              <div className="flex justify-between">
                <span>Not Visited:</span>
                <span className="text-slate-400 font-bold">{totalUnattempted}</span>
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* ═══ Submission Confirmation Modal ═══ */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Submit Examination?</h4>
                <p className="text-xs text-slate-400">Review your final response counts below.</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Total Questions Answered:</span>
                <span>{totalAnswered} / 50</span>
              </div>
              <div className="flex justify-between text-violet-300">
                <span>Marked for Review:</span>
                <span>{totalMarkedReview}</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Unanswered / Skipped:</span>
                <span>{totalUnattempted}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Phase 3: Comprehensive Diagnostic Review ═══ */}
      {phase === 'review' && (
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Score Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 border border-teal-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                  EXAMINATION RESULTS &amp; PASS GAP
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-0.5">
                  {totalCorrect} / 50 Correct ({accuracy}%)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Projected FMGE Grand Test Score:{' '}
                  <span className="font-mono font-bold text-white text-sm">{scaledScore} / 300</span>
                </p>
              </div>

              {/* Pass/Fail Benchmark */}
              <div
                className={`px-4 py-2 rounded-2xl border text-center font-bold text-xs ${
                  isPassing
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300'
                }`}
              >
                <div className="text-base">{isPassing ? 'PASSED CUTOFF' : 'NEEDS REVISION'}</div>
                <div className="text-[10px] font-mono font-normal">
                  {isPassing ? `+${scaledScore - 150} above 150 cutoff` : `${150 - scaledScore} marks to 150`}
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">CORRECT</div>
                <div className="text-emerald-400 font-bold text-base">{totalCorrect}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">INCORRECT</div>
                <div className="text-rose-400 font-bold text-base">{totalIncorrect}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">AVG SPEED</div>
                <div className="text-sky-300 font-bold text-base">{avgSecondsPerQuestion}s / Q</div>
              </div>
            </div>

            {/* One-Click Log to GT */}
            {onLogGrandTest && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleLogToGrandTests}
                  disabled={loggedToGT}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {loggedToGT ? '✓ Logged to Grand Tests' : 'Save to Grand Test Ledger'}
                </button>
              </div>
            )}
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              QUESTION-BY-QUESTION CLINICAL AUDIT ({questions.length})
            </h4>

            {questions.map((q, idx) => {
              const isCorrect = q.userSelectedOption === q.correctAnswer;
              const isSkipped = q.userSelectedOption === null;
              const isAdded = addedErrorIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all ${
                    isCorrect
                      ? 'bg-slate-900/60 border-slate-800'
                      : isSkipped
                      ? 'bg-amber-950/20 border-amber-900/40'
                      : 'bg-rose-950/20 border-rose-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-300">
                      Q{idx + 1}. {q.subjectName} • {q.topicName}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isSkipped
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                      </span>

                      {!isCorrect && onAddErrorItem && (
                        <button
                          type="button"
                          onClick={() => handleAddQuestionToErrors(q)}
                          disabled={isAdded}
                          className="px-2 py-0.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                        >
                          {isAdded ? '✓ Added' : '+ Add to Errors'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-200 font-semibold leading-relaxed">{q.question}</p>

                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="text-slate-400">
                      Your answer: <span className="font-bold text-white">{q.userSelectedOption || 'None (Skipped)'}</span>
                    </div>
                    <div className="text-teal-300">
                      Correct answer: <span className="font-bold">{q.correctAnswer}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 leading-relaxed mt-1">
                      💡 <strong>Clinical Takeaway:</strong> {q.explanation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>,
    document.body
  );
};
