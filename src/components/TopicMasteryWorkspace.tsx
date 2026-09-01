import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  ZoomIn,
  Sparkles,
  BookOpen,
  Brain,
  CheckCircle2,
  Stethoscope,
  Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppState,
  PracticeSessionContext,
  FlashcardDeck,
  SlideDeck,
  TopicClinicalCasesDeck,
  TopicHighYieldPearl,
  EducationalVideo,
} from '../types';
import { generateFlashcardDeck } from '../utils/flashcardEngine';
import { generateSlideDeck } from '../utils/slideEngine';
import { generateTopicClinicalCasesDeck } from '../utils/clinicalCaseEngine';
import { generateTopicPearls } from '../utils/pearlEngine';
import { fetchTopicVideoRecommendations, getCuratedVideosForTopic } from '../utils/videoRecommendationEngine';
import { getNormalizedTopicIntelligence } from '../utils/topicIntelligence';
import { getVerifiedVisualAssetForTopic } from '../utils/visualQuestionEngine';
import { calculateTopicPerformanceMetrics } from '../utils/performanceEngine';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';

interface TopicMasteryWorkspaceProps {
  subjectId: string;
  topicId: string;
  topicName: string;
  state: AppState;
  onClose: () => void;
  onLaunchPracticeMcq: (context: PracticeSessionContext) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
}

type StepType = 'learn' | 'recall' | 'apply' | 'test' | 'review' | 'master';

const STEPS: { id: StepType; label: string; num: string; desc: string }[] = [
  { id: 'learn', label: 'Learn', num: '01', desc: 'Core Concepts & Video' },
  { id: 'recall', label: 'Recall', num: '02', desc: 'Active Flashcards' },
  { id: 'apply', label: 'Apply', num: '03', desc: 'Clinical Cases & IBQ' },
  { id: 'test', label: 'Test', num: '04', desc: '10-MCQ Diagnostic Drill' },
  { id: 'review', label: 'Review', num: '05', desc: 'Mistakes & Traps' },
  { id: 'master', label: 'Master', num: '06', desc: 'Pearls & Retention' },
];

export const TopicMasteryWorkspace: React.FC<TopicMasteryWorkspaceProps> = ({
  subjectId,
  topicId,
  topicName,
  state,
  onClose,
  onLaunchPracticeMcq,
  onToggleTopicState,
  onOpenAiCoach,
}) => {
  const topicStateKey = `${subjectId}-${topicId}`;
  const currentTopicState = state.topicsState?.[topicStateKey] || {};
  const topicMetrics = useMemo(
    () => calculateTopicPerformanceMetrics(subjectId, topicId, state.mcqAttempts || []),
    [subjectId, topicId, state.mcqAttempts]
  );

  const initialStep: StepType = useMemo(() => {
    if (topicMetrics.totalAttempts >= 10 && topicMetrics.accuracy >= 80 && currentTopicState.r1Done) {
      return 'master';
    }
    if (topicMetrics.totalAttempts > 0 && (topicMetrics.accuracy < 60 || topicMetrics.repeatedErrorsCount > 0)) {
      return 'review';
    }
    if (currentTopicState.notesDone && topicMetrics.totalAttempts === 0) {
      return 'test';
    }
    return 'learn';
  }, [topicMetrics, currentTopicState]);

  const [activeStep, setActiveStep] = useState<StepType>(initialStep);

  // Step 1: Learn
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [slideDeck] = useState<SlideDeck>(() => generateSlideDeck(subjectId, topicId, topicName));
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Step 2: Recall
  const [flashcardDeck] = useState<FlashcardDeck>(() => generateFlashcardDeck(subjectId, topicId, topicName));
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(new Set());

  // Step 3: Apply
  const [casesDeck] = useState<TopicClinicalCasesDeck>(() => generateTopicClinicalCasesDeck(subjectId, topicId, topicName));
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedCaseOption, setSelectedCaseOption] = useState<string | null>(null);
  const [isCaseSubmitted, setIsCaseSubmitted] = useState(false);
  const verifiedVisualAsset = useMemo(() => getVerifiedVisualAssetForTopic(subjectId, topicName), [subjectId, topicName]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Step 6: Pearls & Mnemonics
  const pearls: TopicHighYieldPearl[] = useMemo(
    () => generateTopicPearls(subjectId, topicId, topicName),
    [subjectId, topicId, topicName]
  );
  const topicIntel = useMemo(() => getNormalizedTopicIntelligence(subjectId, topicId, topicName), [subjectId, topicId, topicName]);

  useEffect(() => {
    let isMounted = true;
    fetchTopicVideoRecommendations(
      {
        subjectId,
        topicId,
        topicName,
        subjectName: subjectId,
        subjectCode: subjectId.slice(0, 3).toUpperCase(),
        subjectColor: '#0f172a',
        isHighYield: true,
        weightage: 15,
        accuracy: topicMetrics.accuracy,
        recentAccuracy: topicMetrics.recentAccuracy,
        totalAttempts: topicMetrics.totalAttempts,
        repeatedErrorsCount: topicMetrics.repeatedErrorsCount,
        isRevisionDue: false,
        recommendationScore: 80,
        priorityLabel: 'HIGH',
        reasons: ['Core syllabus topic'],
        primaryReason: 'High-Yield study target',
        searchQueries: [`${subjectId} ${topicName} USMLE FMGE lecture`],
      },
      []
    )
      .then((recVideos) => {
        if (!isMounted) return;
        if (recVideos.length > 0) {
          setVideos(recVideos);
        } else {
          setVideos(getCuratedVideosForTopic(subjectId, topicId));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setVideos(getCuratedVideosForTopic(subjectId, topicId));
      });
    return () => {
      isMounted = false;
    };
  }, [subjectId, topicId, topicName, topicMetrics]);

  const handleSelectCase = (idx: number) => {
    setCurrentCaseIndex(idx);
    setSelectedCaseOption(null);
    setIsCaseSubmitted(false);
  };

  const handleMarkMastered = () => {
    onToggleTopicState(subjectId, topicId, 'notesDone');
    onToggleTopicState(subjectId, topicId, 'qBankDone');
    onToggleTopicState(subjectId, topicId, 'r1Done');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans text-slate-900">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* ================= EDITORIAL TEXTBOOK HEADER ================= */}
        <header className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                {subjectId.toUpperCase()} · NBE BLUEPRINT
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-medium">
                HIGH YIELD
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-display tracking-tight text-slate-900">
              {topicName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              6-step structured mastery journey: Core synthesis, active recall, clinical vignette reasoning, and exam trap analysis.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* ================= 6-STEP ROADMAP RAIL ================= */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 sm:px-8 py-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[560px] gap-2">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === step.id;
              const isPast = STEPS.findIndex((s) => s.id === activeStep) > idx;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-display transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isPast
                      ? 'text-slate-800 bg-slate-200/80 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{step.num}</span>
                  <span>{step.label}</span>
                  {isPast && <Check className="h-3 w-3 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= STEP CONTENT CANVAS ================= */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          {/* ================= STEP 1: LEARN ================= */}
          {activeStep === 'learn' && (
            <div className="space-y-8">
              {/* 1. Video Explanation */}
              {videos.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Curated Medical Lecture
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold font-display text-slate-900">
                        {videos[0].title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {videos[0].channelName} · {videos[0].duration}
                      </p>
                    </div>

                    <a
                      href={videos[0].youtubeUrl || `https://www.youtube.com/watch?v=${videos[0].id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer shrink-0 w-fit"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Watch Lecture</span>
                      <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                    </a>
                  </div>
                </div>
              )}

              {/* 2. Slides & Notes */}
              {slideDeck.slides.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                      Textbook Notes & Synthesis ({currentSlideIndex + 1} of {slideDeck.slides.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={currentSlideIndex === slideDeck.slides.length - 1}
                        onClick={() => setCurrentSlideIndex((prev) => Math.min(slideDeck.slides.length - 1, prev + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Content Card */}
                  <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-xl font-semibold font-display text-slate-900">
                      {slideDeck.slides[currentSlideIndex]?.title}
                    </h3>
                    {slideDeck.slides[currentSlideIndex]?.subtitle && (
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {slideDeck.slides[currentSlideIndex].subtitle}
                      </p>
                    )}

                    {slideDeck.slides[currentSlideIndex]?.bullets && (
                      <ul className="space-y-2 pt-2 text-sm text-slate-700">
                        {slideDeck.slides[currentSlideIndex].bullets.map((bp, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-900 mt-2 shrink-0" />
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {slideDeck.slides[currentSlideIndex]?.examTrapWarning && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800 space-y-1">
                        <span className="font-semibold text-rose-700 font-display">⚠️ High-Yield Trap:</span>
                        <p>{slideDeck.slides[currentSlideIndex].examTrapWarning}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step Navigation Action */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStep('recall')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
                >
                  <span>Next: Active Recall (Flashcards)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: RECALL ================= */}
          {activeStep === 'recall' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Active Recall Flashcards ({currentCardIndex + 1} of {flashcardDeck.cards.length})
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {knownCardIds.size} Mastered
                </span>
              </div>

              {/* Flashcard Component */}
              <div
                onClick={() => setIsCardFlipped((prev) => !prev)}
                className="p-8 rounded-3xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all duration-200 min-h-[220px] flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                    {isCardFlipped ? 'Answer & Explanation' : 'Question Prompt (Click to flip)'}
                  </span>
                  <p className="text-lg font-semibold font-display text-slate-900 leading-snug">
                    {isCardFlipped
                      ? flashcardDeck.cards[currentCardIndex]?.back
                      : flashcardDeck.cards[currentCardIndex]?.front}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-200/60">
                  <span>Click card to reveal</span>
                  <RotateCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                </div>
              </div>

              {/* Flashcard Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCardFlipped(false);
                    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentCardIndex === 0}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold font-display disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
                >
                  Previous Card
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const card = flashcardDeck.cards[currentCardIndex];
                      if (card) {
                        setKnownCardIds((prev) => new Set([...prev, card.id]));
                      }
                      setIsCardFlipped(false);
                      if (currentCardIndex < flashcardDeck.cards.length - 1) {
                        setCurrentCardIndex((prev) => prev + 1);
                      } else {
                        setActiveStep('apply');
                      }
                    }}
                    className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
                  >
                    I Know This ✓
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: APPLY ================= */}
          {activeStep === 'apply' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Clinical Vignette Reasoning
                </span>
                <span className="font-mono text-xs text-slate-500">
                  Case {currentCaseIndex + 1} of {casesDeck.cases.length}
                </span>
              </div>

              {/* Visual Asset if Available */}
              {verifiedVisualAsset && (
                <div className="p-4 rounded-2xl bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={verifiedVisualAsset.imageUrl}
                      alt={topicName}
                      className="h-16 w-24 object-cover rounded-lg border border-slate-700 cursor-pointer"
                      onClick={() => setZoomImage(verifiedVisualAsset.imageUrl)}
                    />
                    <div>
                      <span className="text-[10px] font-mono text-sky-400 uppercase">Image-Based Investigation</span>
                      <h4 className="text-sm font-semibold font-display text-white">{verifiedVisualAsset.title}</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoomImage(verifiedVisualAsset.imageUrl)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold font-display text-slate-200 inline-flex items-center gap-1.5"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span>Fullscreen</span>
                  </button>
                </div>
              )}

              {/* Case Stem */}
              {casesDeck.cases[currentCaseIndex] && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono font-semibold uppercase text-sky-700">
                      {casesDeck.cases[currentCaseIndex].patientDemographics}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {casesDeck.cases[currentCaseIndex].presentation}
                    </p>
                    {casesDeck.cases[currentCaseIndex].physicalExamOrLabs && (
                      <p className="text-sm text-slate-600 font-medium">
                        {casesDeck.cases[currentCaseIndex].physicalExamOrLabs}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-sm font-semibold font-display text-slate-900">
                      {casesDeck.cases[currentCaseIndex].diagnosticQuestion}
                    </p>

                    <div className="space-y-2 pt-2">
                      {casesDeck.cases[currentCaseIndex].options.map((opt) => {
                        const optKey = opt.key || opt.optionId;
                        const isSelected = selectedCaseOption === optKey;
                        const isCorrect = optKey === casesDeck.cases[currentCaseIndex].correctAnswer || opt.isCorrect;

                        let style = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/70';
                        if (isCaseSubmitted) {
                          if (isCorrect) {
                            style = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                          } else if (isSelected) {
                            style = 'bg-rose-50 border-rose-300 text-rose-900';
                          }
                        } else if (isSelected) {
                          style = 'bg-slate-900 border-slate-900 text-white';
                        }

                        return (
                          <button
                            key={optKey}
                            type="button"
                            onClick={() => !isCaseSubmitted && setSelectedCaseOption(optKey)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${style}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold">{optKey}.</span>
                              <span>{opt.text}</span>
                            </div>
                            {isCaseSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submission and Explanation */}
                  <div className="pt-2">
                    {!isCaseSubmitted ? (
                      <button
                        type="button"
                        disabled={!selectedCaseOption}
                        onClick={() => setIsCaseSubmitted(true)}
                        className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Submit Diagnosis
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 space-y-2">
                        <span className="font-semibold text-slate-900 font-display">Clinical Rationale:</span>
                        <p>{casesDeck.cases[currentCaseIndex].clinicalExplanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSelectCase(Math.max(0, currentCaseIndex - 1))}
                  disabled={currentCaseIndex === 0}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold font-display disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
                >
                  Previous Case
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep('test')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
                >
                  <span>Next: 10-MCQ Diagnostic Drill</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: TEST ================= */}
          {activeStep === 'test' && (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold font-display text-slate-900">
                    10-MCQ Adaptive Examination Drill
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Authentic FMGE/NBE clinical stems covering {topicName} with distractor rationale and Error Vault logging.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchPracticeMcq({
                        sessionId: `drill-${Date.now()}`,
                        source: 'dashboard_weak_topic',
                        subjectId,
                        subjectName: subjectId,
                        topicId,
                        topicName,
                        targetQuestionCount: 10,
                      });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold font-display transition-all shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Launch 10-MCQ Test Session</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStep('review')}
                  className="inline-flex items-center gap-2 text-xs font-semibold font-display text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span>Skip to Mistake Review & Traps</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: REVIEW ================= */}
          {activeStep === 'review' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-2xl font-semibold font-display text-slate-900">
                    {topicMetrics.accuracy}%
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">Topic Accuracy</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-2xl font-semibold font-display text-slate-900">
                    {topicMetrics.totalAttempts}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">MCQs Solved</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-2xl font-semibold font-display text-slate-900">
                    {topicMetrics.masteryStatus.toUpperCase()}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">Mastery Grade</p>
                </div>
              </div>

              {/* What Needs Review */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Diagnostics & High-Yield Traps
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                  {topicMetrics.repeatedErrorsCount > 0 ? (
                    <p className="text-rose-700 font-semibold">
                      ⚠️ {topicMetrics.repeatedErrorsCount} repeated mistake(s) registered in Error Vault for this topic.
                    </p>
                  ) : (
                    <p className="text-slate-600">
                      Solid grasp of core clinical criteria. Review volatile memory anchors below before marking as mastered.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {onOpenAiCoach && (
                  <button
                    type="button"
                    onClick={() => onOpenAiCoach('concept', subjectId, topicName)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Ask AI Study Coach →
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveStep('master')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
                >
                  <span>Next: Master Topic & Pearls</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 6: MASTER ================= */}
          {activeStep === 'master' && (
            <div className="space-y-6">
              {/* FMGE Pearls */}
              {pearls.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    High-Yield Pearls & Mnemonics
                  </span>
                  <div className="divide-y divide-slate-100">
                    {pearls.map((p, i) => (
                      <div key={i} className="py-3 text-xs text-slate-800 space-y-1">
                        <strong className="font-semibold text-slate-900 font-display text-sm block">
                          {p.statement}
                        </strong>
                        {p.discriminatorTip && <p className="text-slate-500">💡 {p.discriminatorTip}</p>}
                        {p.examTrapWarning && <p className="text-rose-600 font-medium">⚠️ Exam Trap: {p.examTrapWarning}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic Status Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <span className="font-semibold text-slate-900 font-display">Completed Learning Pathway:</span>
                <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Learn
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Recall
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Apply
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Test
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Review
                  </span>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onLaunchPracticeMcq({
                      sessionId: `drill-${Date.now()}`,
                      source: 'dashboard_weak_topic',
                      subjectId,
                      subjectName: subjectId,
                      topicId,
                      topicName,
                      targetQuestionCount: 10,
                    });
                  }}
                  className="px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold font-display transition-colors cursor-pointer"
                >
                  Retest Topic
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleMarkMastered();
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer shadow-sm"
                >
                  Mark Mastered ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <MedicalImageViewerModal
          isOpen={true}
          onClose={() => setZoomImage(null)}
          imageUrl={zoomImage}
          title={topicName}
          whatToLookFor="Verified diagnostic visual finding for this clinical concept."
        />
      )}
    </div>
  );
};
