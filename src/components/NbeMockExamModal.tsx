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
  Monitor,
} from 'lucide-react';
import { GrandTest, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getVerifiedTopicQuestions } from '../utils/practiceSessionEngine';
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
  const [examMode, setExamMode] = useState<50 | 150>(50);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(50 * 60);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [addedErrorIds, setAddedErrorIds] = useState<Set<string>>(new Set());
  const [loggedToGT, setLoggedToGT] = useState<boolean>(false);
  const [isTcsIonSkin, setIsTcsIonSkin] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Dynamic generator for balanced questions from high-yield subjects
  const generateMockQuestions = (count: 50 | 150): MockQuestion[] => {
    const mockList: MockQuestion[] = [];
    const subjectsToUse = count === 150
      ? FMGE_SUBJECTS
      : ['medicine', 'surgery', 'obg', 'psm', 'pathology', 'pharmacology', 'pediatrics', 'anatomy']
          .map((id) => FMGE_SUBJECTS.find((s) => s.id === id))
          .filter(Boolean);

    let qIdx = 0;
    // Iterate through subjects and topics to reach the target count
    for (let pass = 0; pass < 3 && mockList.length < count; pass++) {
      for (const sub of subjectsToUse) {
        if (!sub) continue;
        for (const topic of sub.topics) {
          if (mockList.length >= count) break;
          const questionsGenerated = getVerifiedTopicQuestions(
            sub.id,
            topic.id,
            topic.name,
            5
          );
          const picked = questionsGenerated[pass % Math.max(1, questionsGenerated.length)];
          if (picked && !mockList.some((m) => m.question === picked.question)) {
            mockList.push({
              id: `nbe_q_${qIdx + 1}`,
              index: qIdx,
              subjectId: sub.id,
              subjectName: sub.name,
              topicName: topic.name,
              question: picked.question,
              options: picked.options.map((o) => ({
                optionId: o.optionId,
                key: o.key,
                text: o.text,
                isCorrect: !!o.isCorrect,
              })),
              correctAnswer: picked.correctAnswer,
              explanation: picked.explanation,
              userSelectedOption: null,
              status: qIdx === 0 ? 'not-answered' : 'not-visited',
            });
            qIdx++;
          }
        }
      }
    }
    return mockList;
  };

  // Generate questions on open
  useEffect(() => {
    if (isOpen) {
      setPhase('intro');
      setCurrentIndex(0);
      setSecondsLeft(examMode * 60);
      setShowSubmitConfirm(false);
      setAddedErrorIds(new Set());
      setLoggedToGT(false);
      setQuestions(generateMockQuestions(examMode));
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

  const handleMarkReviewAndNext = () => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = updated[currentIndex];
      if (q) {
        q.status = q.userSelectedOption !== null ? 'answered-review' : 'review';
      }
      return updated;
    });
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

  // Scaled Score (scaled to 300 marks)
  const scaledScore = Math.round((totalCorrect / Math.max(1, questions.length)) * 300);
  const isPassing = scaledScore >= 150;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const totalDurationSeconds = (questions.length || examMode) * 60;
  const timeSpentSeconds = Math.max(0, totalDurationSeconds - secondsLeft);
  const avgSecondsPerQuestion = totalAnswered > 0 ? Math.round(timeSpentSeconds / totalAnswered) : 0;

  // Log as Grand Test
  const handleLogToGrandTests = () => {
    if (!onLogGrandTest || loggedToGT) return;
    const multiplier = 300 / Math.max(1, questions.length);
    const gt: GrandTest = {
      id: `gt_nbe_mock_${Date.now()}`,
      title: `NBE ${questions.length}-MCQ ${questions.length >= 100 ? 'Full Paper' : 'Mini-Mock'} (#${new Date().toLocaleDateString()})`,
      platform: 'Marrow',
      date: getLocalDateKey(),
      score: scaledScore,
      totalMarks: 300,
      correctCount: Math.round(totalCorrect * multiplier),
      incorrectCount: Math.round(totalIncorrect * multiplier),
      skippedCount: Math.round(totalUnattempted * multiplier),
      percentile: Math.min(99, Math.round(accuracy * 0.95)),
      weakSubjectIds: [],
      strongSubjectIds: [],
      keyMistakesNotes: `NBE ${questions.length}-MCQ Exam Simulation completed with ${accuracy}% accuracy (${totalCorrect}/${questions.length} correct).`,
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
    <div
      className={`fixed inset-0 z-[120] flex flex-col font-['Plus_Jakarta_Sans'] select-none ${
        isTcsIonSkin ? 'bg-[#f4f7f9] text-slate-800' : 'bg-slate-950/95 backdrop-blur-md text-slate-100'
      }`}
    >
      {/* ═══ Top CBT Examination Bar ═══ */}
      <header
        className={`flex items-center justify-between px-4 sm:px-6 py-2.5 shrink-0 border-b transition-colors ${
          isTcsIonSkin
            ? 'bg-[#004e8c] border-[#003865] text-white shadow-sm'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-1.5 rounded-xl border ${
              isTcsIonSkin
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-teal-500/20 text-teal-400 border-teal-400/30'
            }`}
          >
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold font-['Outfit'] text-white">
              {isTcsIonSkin
                ? `TCS iON CBT Assessment Simulation (${questions.length} Questions)`
                : `NBE Computer-Based Test Simulation (${questions.length} MCQs)`}
            </h2>
            <p className={`text-[10px] font-mono ${isTcsIonSkin ? 'text-sky-100' : 'text-slate-400'}`}>
              National Board of Examinations Protocol • 1 Mark Each • No Negative Marking
            </p>
          </div>
        </div>

        {/* Timer & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Official TCS iON Skin Toggle */}
          <button
            type="button"
            onClick={() => setIsTcsIonSkin(!isTcsIonSkin)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isTcsIonSkin
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Authentic TCS iON Exam Simulation"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isTcsIonSkin ? 'Exit TCS iON Skin' : 'Official TCS iON Skin'}</span>
            <span className="sm:hidden">{isTcsIonSkin ? 'Dark' : 'iON'}</span>
          </button>

          {phase === 'testing' && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs ${
                isTcsIonSkin
                  ? 'bg-[#003865] text-amber-300 border-amber-400/40'
                  : secondsLeft <= 300
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 animate-pulse'
                  : 'bg-slate-800 text-teal-300 border-slate-700'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{isTcsIonSkin ? `Time Left: ${formatTimer(secondsLeft)}` : formatTimer(secondsLeft)}</span>
            </div>
          )}

          {phase === 'testing' && (
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className={`px-3.5 py-1 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                isTcsIonSkin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
              }`}
            >
              Submit Exam
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isTcsIonSkin
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
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
                {examMode}-MCQ NBE Exam Simulation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test your speed, stamina, and clinical acumen under true NBE exam constraints.
              </p>
            </div>

            {/* SwiftUI Segmented Mode Selector */}
            <div className="flex p-1 rounded-2xl bg-slate-800/90 border border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setExamMode(50);
                  setSecondsLeft(50 * 60);
                  setQuestions(generateMockQuestions(50));
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  examMode === 50
                    ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>50 MCQs • 50 Mins</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/30 font-semibold">Sprint</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamMode(150);
                  setSecondsLeft(150 * 60);
                  setQuestions(generateMockQuestions(150));
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  examMode === 150
                    ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>150 MCQs • 150 Mins</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/30 font-semibold">Paper 1/2 Stamina</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="text-slate-400 font-mono text-[10px]">TOTAL QUESTIONS</div>
                <div className="text-base font-bold text-white">{examMode} MCQs</div>
                <div className="text-[10px] text-slate-400">{examMode === 150 ? 'All 19 NBE Subjects' : 'High-Yield Core'}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="text-slate-400 font-mono text-[10px]">TIME ALLOTTED</div>
                <div className="text-base font-bold text-teal-400 font-mono">{examMode} Minutes</div>
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

      {/* ═══ Phase 2: Live Testing Environment (Dual Mode: Modern Dark vs Authentic TCS iON) ═══ */}
      {phase === 'testing' && currentQ && (
        isTcsIonSkin ? (
          /* ═══ Authentic TCS iON Exam Interface ═══ */
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#e5edf5] text-slate-800">
            {/* Left Question Area */}
            <div className="flex-1 flex flex-col justify-between bg-white border-r border-[#b0c4de] overflow-y-auto">
              <div>
                {/* TCS iON Section Bar */}
                <div className="flex items-center justify-between px-5 py-2.5 bg-[#dbe8f5] border-b border-[#b0c4de] text-xs font-bold text-[#004e8c]">
                  <span>SECTION: PAPER 1 - CLINICAL SCIENCES</span>
                  <div className="flex items-center gap-4 text-[11px] text-slate-600 font-mono">
                    <span>Marks for correct answer: <strong className="text-emerald-700">1</strong></span>
                    <span>Negative: <strong className="text-slate-700">0</strong></span>
                  </div>
                </div>

                <div className="p-5 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-sm font-bold text-[#004e8c] font-mono">
                      Question No. {currentIndex + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {currentQ.subjectName} &bull; {currentQ.topicName}
                    </span>
                  </div>

                  {/* Question Stem */}
                  <div className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                    {currentQ.question}
                  </div>

                  {/* Radio Choice Options */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = currentQ.userSelectedOption === opt.key;
                      return (
                        <label
                          key={opt.optionId}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`flex items-start gap-3.5 p-3.5 rounded-lg border transition-colors cursor-pointer text-xs sm:text-sm ${
                            isSelected
                              ? 'bg-[#eff6ff] border-[#0284c7] text-[#003b6a] font-semibold'
                              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQ.id}`}
                            checked={isSelected}
                            onChange={() => handleSelectOption(opt.key)}
                            className="mt-1 h-4 w-4 text-[#0284c7] border-slate-400 focus:ring-0 cursor-pointer"
                          />
                          <span className="leading-relaxed">
                            <strong className="mr-1.5 font-bold font-mono">{opt.key}.</strong>
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* TCS iON Bottom Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-[#f1f5f9] border-t border-[#cbd5e1]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkReviewAndNext}
                    className="px-4 py-2 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Mark for Review &amp; Next
                  </button>
                  <button
                    type="button"
                    onClick={handleClearResponse}
                    disabled={currentQ.userSelectedOption === null}
                    className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 text-slate-700 font-semibold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Clear Response
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 text-slate-700 font-semibold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="px-5 py-2 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Save &amp; Next
                  </button>
                </div>
              </div>
            </div>

            {/* Right: TCS iON Question Palette & Candidate Profile */}
            <aside className="w-full md:w-80 bg-[#e9f0f8] p-4 border-t md:border-t-0 border-[#b0c4de] flex flex-col justify-between shrink-0 overflow-y-auto space-y-4">
              {/* Candidate Info Box */}
              <div className="p-3 bg-white rounded-lg border border-[#b0c4de] shadow-xs flex items-center gap-3">
                <div className="h-14 w-12 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-500 font-mono font-bold text-center">
                  CANDIDATE PHOTO
                </div>
                <div className="text-[11px] leading-tight text-slate-700 space-y-0.5">
                  <div className="font-bold text-slate-900">Dr. FMGE Candidate</div>
                  <div className="text-slate-500 font-mono">Roll: 26090142</div>
                  <div className="text-slate-500 font-mono">System: TCS-LAB-42</div>
                </div>
              </div>

              {/* TCS iON 5-Status Legend */}
              <div className="p-3 bg-white rounded-lg border border-[#b0c4de] shadow-xs space-y-2 text-[11px]">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-6 bg-[#16a34a] text-white font-bold text-[9px] flex items-center justify-center rounded-sm">
                      {totalAnswered}
                    </span>
                    <span className="text-slate-700">Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-6 bg-[#dc2626] text-white font-bold text-[9px] flex items-center justify-center rounded-sm">
                      {questions.filter((q) => q.status === 'not-answered').length}
                    </span>
                    <span className="text-slate-700">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-6 bg-[#cbd5e1] text-slate-800 font-bold text-[9px] flex items-center justify-center rounded-sm">
                      {totalUnattempted}
                    </span>
                    <span className="text-slate-700">Not Visited</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-6 bg-[#7c3aed] text-white font-bold text-[9px] flex items-center justify-center rounded-sm">
                      {questions.filter((q) => q.status === 'review').length}
                    </span>
                    <span className="text-slate-700">Marked Review</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                  <span className="relative h-5 w-6 bg-[#7c3aed] text-white font-bold text-[9px] flex items-center justify-center rounded-sm">
                    {questions.filter((q) => q.status === 'answered-review').length}
                    <span className="absolute bottom-0 right-0 h-2 w-2 bg-[#16a34a] rounded-xs" />
                  </span>
                  <span className="text-[10px] text-slate-700 leading-tight">
                    Ans &amp; Marked for Review
                  </span>
                </div>
              </div>

              {/* Number Grid with TCS iON Shapes */}
              <div className="p-3 bg-white rounded-lg border border-[#b0c4de] shadow-xs space-y-2">
                <div className="font-bold font-mono text-[11px] text-[#004e8c] uppercase">
                  QUESTION PALETTE ({questions.length} MCQs)
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    let shapeClass = 'bg-[#cbd5e1] text-slate-800'; // not visited
                    if (q.status === 'answered') shapeClass = 'bg-[#16a34a] text-white font-bold';
                    if (q.status === 'not-answered') shapeClass = 'bg-[#dc2626] text-white font-bold';
                    if (q.status === 'review') shapeClass = 'bg-[#7c3aed] text-white font-bold rounded-full';
                    if (q.status === 'answered-review') shapeClass = 'bg-[#7c3aed] text-white font-bold rounded-full ring-2 ring-[#16a34a]';

                    const isCurrent = idx === currentIndex;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleNavigateQuestion(idx)}
                        className={`h-8 rounded-sm font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${shapeClass} ${
                          isCurrent ? 'ring-2 ring-[#004e8c] ring-offset-1 font-black scale-105' : ''
                        }`}
                        title={`Question ${idx + 1} (${q.status})`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Test Button */}
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-2.5 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                SUBMIT TEST
              </button>
            </aside>
          </main>
        ) : (
          /* ═══ Modern Dark Exam Screen ═══ */
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
                    onClick={handleMarkReviewAndNext}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600/40 hover:bg-violet-600 text-violet-100 font-bold text-xs border border-violet-400/40 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Mark Review &amp; Next</span>
                  </button>

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
                  <span>{totalAnswered}/{questions.length} ANSWERED</span>
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
        )
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
                <span>{totalAnswered} / {questions.length}</span>
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
                  {totalCorrect} / {questions.length} Correct ({accuracy}%)
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
