import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Timer,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Eye,
  EyeOff,
  Flame,
  Zap,
  HelpCircle,
  ZoomIn,
  MessageSquare,
  Award,
  Filter,
} from 'lucide-react';
import { VERIFIED_IBQ_BANK, RawIBQItem } from '../utils/visualQuestionEngine';

interface IbqRapidRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
}

export const IbqRapidRecallModal: React.FC<IbqRapidRecallModalProps> = ({
  isOpen,
  onClose,
  onOpenAiCoach,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [drillMode, setDrillMode] = useState<'flashcard' | 'timed_mcq'>('flashcard');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Filter items by subject
  const filteredQuestions = useMemo(() => {
    if (selectedSubject === 'all') return VERIFIED_IBQ_BANK;
    return VERIFIED_IBQ_BANK.filter(
      (q) => q.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
  }, [selectedSubject]);

  const currentItem: RawIBQItem | undefined = filteredQuestions[currentIndex] || filteredQuestions[0];

  const subjects = useMemo(() => {
    const set = new Set<string>();
    VERIFIED_IBQ_BANK.forEach((q) => set.add(q.subject));
    return ['all', ...Array.from(set)];
  }, []);

  // Timer countdown for Timed MCQ mode
  useEffect(() => {
    if (!isOpen || drillMode !== 'timed_mcq' || selectedOptionId !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setSelectedOptionId('TIMEOUT');
          setScore((s) => ({ ...s, incorrect: s.incorrect + 1 }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, drillMode, currentIndex, selectedOptionId]);

  const handleSelectOption = (optId: string) => {
    if (selectedOptionId !== null || !currentItem) return;
    setSelectedOptionId(optId);
    const isCorrect = optId === currentItem.correctOptionId;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (!isCorrect ? 1 : 0),
    }));
  };

  const handleNext = () => {
    setIsRevealed(false);
    setSelectedOptionId(null);
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsRevealed(false);
    setSelectedOptionId(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleResetSession = () => {
    setScore({ correct: 0, incorrect: 0 });
    setCurrentIndex(0);
    setIsRevealed(false);
    setSelectedOptionId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                    IBQ Rapid Recall Drill
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
                    40–50 Exam Marks
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans">
                  High-yield pathognomonic images & diagnostic signs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mode Toggle */}
              <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => {
                    setDrillMode('flashcard');
                    setIsRevealed(false);
                    setSelectedOptionId(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    drillMode === 'flashcard'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flashcard
                </button>
                <button
                  onClick={() => {
                    setDrillMode('timed_mcq');
                    setIsRevealed(false);
                    setSelectedOptionId(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    drillMode === 'timed_mcq'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Timer className="h-3 w-3 text-amber-500" />
                  <span>Timed 60s</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors cursor-pointer"
                title="Close drill"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Subject filter & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 border-b border-slate-100 bg-white text-xs">
            {/* Subject Selector */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubject(sub);
                    setCurrentIndex(0);
                    setIsRevealed(false);
                    setSelectedOptionId(null);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSubject === sub
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Counter & Score */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 shrink-0">
              {drillMode === 'timed_mcq' && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${
                    timeLeft <= 15
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  <Timer className="h-3.5 w-3.5" />
                  <span>{timeLeft}s</span>
                </div>
              )}
              <div>
                Item <span className="font-bold text-slate-900">{currentIndex + 1}</span> of{' '}
                {filteredQuestions.length}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {score.correct}
                </span>
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> {score.incorrect}
                </span>
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {currentItem ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Visual Column */}
                <div className="flex flex-col gap-2">
                  <div
                    className="relative group w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner cursor-zoom-in"
                    onClick={() => setIsImageZoomed(true)}
                  >
                    <img
                      src={currentItem.imageSrc}
                      alt={currentItem.topic}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-3.5 w-3.5 text-teal-300" />
                      <span>Tap to zoom</span>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs rounded-lg text-[11px] font-semibold text-teal-200">
                      {currentItem.subject}
                    </div>
                  </div>

                  {/* Vignette Stem */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed font-sans">
                    <span className="font-bold text-teal-950 font-['Outfit'] block mb-1">
                      Clinical Vignette:
                    </span>
                    {currentItem.vignette}
                  </div>
                </div>

                {/* Interaction Column */}
                <div className="flex flex-col gap-3">
                  {drillMode === 'flashcard' ? (
                    /* FLASHCARD MODE */
                    <div className="space-y-4">
                      <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/60 text-xs text-teal-900 space-y-1">
                        <p className="font-bold text-teal-950 flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-teal-700" />
                          <span>Active Recall Challenge</span>
                        </p>
                        <p>
                          Inspect the image finding carefully. Formulate your clinical diagnosis,
                          pathological buzzwords, and primary sign before revealing the answer.
                        </p>
                      </div>

                      {!isRevealed ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsRevealed(true)}
                          className="w-full py-4 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl font-bold font-['Outfit'] text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="h-4 w-4 text-amber-300" />
                          <span>Reveal Diagnosis & Buzzwords</span>
                        </motion.button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          {/* Correct Diagnosis Box */}
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                              Diagnostic Answer
                            </span>
                            <h3 className="text-base font-extrabold text-emerald-950 font-['Outfit'] mt-0.5">
                              {currentItem.options.find((o) => o.id === currentItem.correctOptionId)?.text ||
                                currentItem.topic}
                            </h3>
                          </div>

                          {/* Image Finding */}
                          {currentItem.explanation.imageFinding && (
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                              <span className="font-bold text-slate-900 block font-['Outfit']">
                                Key Visual Finding:
                              </span>
                              <p className="text-slate-700 leading-relaxed">
                                {currentItem.explanation.imageFinding}
                              </p>
                            </div>
                          )}

                          {/* High-Yield Buzzwords */}
                          {currentItem.explanation.highYieldBuzzwords && (
                            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs space-y-2">
                              <span className="font-bold text-amber-950 block font-['Outfit'] flex items-center gap-1.5">
                                <Flame className="h-3.5 w-3.5 text-amber-600" />
                                <span>High-Yield Buzzwords:</span>
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {currentItem.explanation.highYieldBuzzwords.map((bw, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-900 text-[11px]"
                                  >
                                    {bw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detailed Rationale */}
                          {currentItem.explanation.detailedRationale && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                              <span className="font-bold text-slate-800 block mb-1">
                                Clinical Rationale:
                              </span>
                              {currentItem.explanation.detailedRationale}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* TIMED MCQ MODE */
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-700 font-['Outfit'] mb-1">
                        Select the correct diagnosis:
                      </p>
                      {currentItem.options.map((option) => {
                        const isChosen = selectedOptionId === option.id;
                        const isCorrect = option.id === currentItem.correctOptionId;
                        const hasAnswered = selectedOptionId !== null;

                        let btnClass = 'bg-white border-slate-200 text-slate-800 hover:border-teal-400 hover:bg-teal-50/30';
                        if (hasAnswered) {
                          if (isCorrect) {
                            btnClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                          } else if (isChosen) {
                            btnClass = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                          } else {
                            btnClass = 'opacity-60 bg-slate-50 border-slate-200 text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={option.id}
                            disabled={hasAnswered}
                            onClick={() => handleSelectOption(option.id)}
                            className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm font-sans transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 font-bold text-slate-700 text-xs shrink-0">
                                {option.id}
                              </span>
                              <span>{option.text}</span>
                            </span>
                            {hasAnswered && isCorrect && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            )}
                            {hasAnswered && isChosen && !isCorrect && (
                              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* Explanation Reveal after option selected */}
                      {selectedOptionId && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 font-['Outfit']">
                            <Award className="h-4 w-4 text-teal-700" />
                            <span>Diagnostic Takeaway</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {currentItem.explanation.imageFinding || currentItem.explanation.detailedRationale}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Ask AI Faculty Button */}
                  {onOpenAiCoach && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAiCoach(
                          'diagnosis',
                          currentItem.subject.toLowerCase(),
                          currentItem.topic
                        );
                      }}
                      className="mt-2 py-2 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-teal-700" />
                      <span>Ask Faculty Mentor about this sign</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No image questions found for this filter.
              </div>
            )}
          </div>

          {/* Footer Navigation Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/70">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleResetSession}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Restart session"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold font-['Outfit'] shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{currentIndex < filteredQuestions.length - 1 ? 'Next Image' : 'Start Over'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Image Zoom Lightbox */}
        {isImageZoomed && currentItem && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsImageZoomed(false)}
          >
            <div className="relative max-w-4xl max-h-[85vh]">
              <img
                src={currentItem.imageSrc}
                alt={currentItem.topic}
                className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/75 backdrop-blur-md rounded-xl text-white text-xs font-sans text-center">
                <span className="font-bold text-teal-300 font-['Outfit'] mr-2">{currentItem.topic}:</span>
                {currentItem.explanation.imageFinding || currentItem.vignette}
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
