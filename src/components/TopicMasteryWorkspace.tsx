import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  BookOpen,
  Brain,
  CheckCircle2,
  Stethoscope,
  Activity,
  AlertCircle,
  Layers,
  Table,
  RefreshCw,
  Eye,
  Award,
  ShieldAlert,
  HelpCircle,
  Clock,
  Target,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  AppState,
  PracticeSessionContext,
  FlashcardDeck,
  SlideDeck,
  VisualSlideItem,
  TopicClinicalCasesDeck,
  TopicHighYieldPearl,
  EducationalVideo,
} from '../types';
import { generateFlashcardDeck } from '../utils/flashcardEngine';
import { generateSlideDeck } from '../utils/slideEngine';
import { generateTopicClinicalCasesDeck } from '../utils/clinicalCaseEngine';
import { generateTopicPearls } from '../utils/pearlEngine';
import { fetchTopicVideoRecommendations, getCuratedVideosForTopic } from '../utils/videoRecommendationEngine';
import { getVerifiedVisualAssetForTopic } from '../utils/visualQuestionEngine';
import { calculateTopicPerformanceMetrics } from '../utils/performanceEngine';
import { getMedicalTopicKnowledge } from '../utils/topicKnowledgeBase';
import { getVerifiedTopicQuestions } from '../utils/practiceSessionEngine';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';

interface TopicMasteryWorkspaceProps {
  subjectId: string;
  topicId: string;
  topicName: string;
  autoDeepen?: boolean;
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
  { id: 'learn', label: 'Rapid Revision', num: '01', desc: 'Core Synthesis & Master Grid' },
  { id: 'recall', label: 'Recall', num: '02', desc: 'Active Flashcards' },
  { id: 'apply', label: 'Apply', num: '03', desc: 'Clinical Cases & IBQ' },
  { id: 'test', label: 'Test', num: '04', desc: '10-MCQ Diagnostic Drill' },
  { id: 'review', label: 'Review', num: '05', desc: 'Mistakes & Traps' },
  { id: 'master', label: 'Master', num: '06', desc: 'Pearls & Retention' },
];

/**
 * Safe fallback component for steps where verified topic content is unavailable.
 */
const ContentUnavailableCard: React.FC<{
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}> = ({
  title = 'Content Unavailable for this Topic',
  message = 'To uphold strict medical exam integrity, unverified or cross-topic content has been withheld for this specific topic.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => (
  <div className="py-14 flex flex-col items-center gap-5 text-center rounded-3xl bg-[#F2F2F7] border border-[rgba(60,60,67,0.08)] my-4">
    <div className="mx-auto w-14 h-14 rounded-2xl bg-[#FFF3E0] border border-[#FF9500]/25 flex items-center justify-center shadow-sm">
      <AlertCircle className="h-7 w-7 text-[#FF9500]" strokeWidth={1.8} />
    </div>
    <div className="space-y-1.5 max-w-sm px-4">
      <h3 className="text-[15px] font-bold text-[#1D1D1F]">{title}</h3>
      <p className="text-[12px] text-[#8E8E93] leading-relaxed">{message}</p>
    </div>
    {(actionLabel || secondaryActionLabel) && (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(60,60,67,0.14)] text-[#3A3A3C] bg-white hover:bg-[#F2F2F7] text-xs font-semibold transition-colors cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

const renderFormattedSlideText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={i} className="font-semibold text-stone-900 font-display">
              {boldText}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const getSlideCategoryBadge = (category?: string) => {
  switch (category) {
    case 'overview':
      return {
        label: 'Clinical Core',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
        Icon: Stethoscope,
      };
    case 'anatomy_pathology':
      return {
        label: 'Anatomy & Pathology',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
        Icon: Activity,
      };
    case 'diagnostics':
      return {
        label: 'Diagnostics & IOC',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
        Icon: Eye,
      };
    case 'pharmacology_mgmt':
      return {
        label: 'DOC & Protocols',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        Icon: CheckCircle2,
      };
    case 'high_yield_traps':
      return {
        label: 'High-Yield Trap',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
        Icon: ShieldAlert,
      };
    case 'comparison_table':
      return {
        label: 'Comparative Table',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        Icon: Table,
      };
    default:
      return {
        label: 'High Yield',
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
        Icon: BookOpen,
      };
  }
};

export const TopicMasteryWorkspace: React.FC<TopicMasteryWorkspaceProps> = ({
  subjectId,
  topicId,
  topicName,
  autoDeepen = false,
  state,
  onClose,
  onLaunchPracticeMcq,
  onToggleTopicState,
  onOpenAiCoach,
}) => {
  const topicStateKey = `${subjectId}-${topicId}`;
  const activeTopicKeyRef = useRef<string>(`${subjectId}::${topicId}`);
  const currentTopicState = state.topicsState?.[topicStateKey] || {};
  const topicMetrics = useMemo(
    () => calculateTopicPerformanceMetrics(subjectId, topicId, state.mcqAttempts || []),
    [subjectId, topicId, state.mcqAttempts]
  );

  // Verified base topic knowledge
  const baseKnowledge = useMemo(
    () => getMedicalTopicKnowledge(subjectId, topicId, topicName),
    [subjectId, topicId, topicName]
  );

  // Gemini AI Live Deepening State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMasteryData, setAiMasteryData] = useState<any | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [activePackTab, setActivePackTab] = useState<'overview' | 'patho' | 'features' | 'diagnosis' | 'management'>('overview');

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

  // Step 1: Rapid Revision & Slides
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const baseSlideDeck = useMemo<SlideDeck>(() => generateSlideDeck(subjectId, topicId, topicName), [subjectId, topicId, topicName]);
  const slideDeck = useMemo<SlideDeck>(() => {
    if (aiMasteryData?.slides && Array.isArray(aiMasteryData.slides) && aiMasteryData.slides.length > 0) {
      return {
        topicId,
        topicName,
        subjectId,
        subjectName: subjectId,
        slides: aiMasteryData.slides.map((s: any, idx: number) => {
          const matchingBase = baseSlideDeck.slides[idx] || baseSlideDeck.slides[0];
          return {
            id: `ai-slide-${subjectId}-${topicId}-${idx + 1}`,
            slideNumber: idx + 1,
            title: s.title || matchingBase?.title || `${topicName} — Clinical Review ${idx + 1}`,
            subtitle: s.subtitle || matchingBase?.subtitle || 'Gemini AI Deepened High-Yield Slide',
            category: (s.category === 'management' ? 'pharmacology_mgmt' : s.category) || matchingBase?.category || (idx === 0 ? 'overview' : idx === 1 ? 'diagnostics' : 'pharmacology_mgmt'),
            bullets: Array.isArray(s.bullets) && s.bullets.length > 0 ? s.bullets : (matchingBase?.bullets || [s.text || 'Clinical key point']),
            keyTakeaways: Array.isArray(s.keyTakeaways) ? s.keyTakeaways : s.takeaway ? [s.takeaway] : matchingBase?.keyTakeaways,
            examTrapWarning: s.examTrapWarning || s.trap || matchingBase?.examTrapWarning,
            imageUrl: s.imageUrl || matchingBase?.imageUrl,
            imageCaption: s.imageCaption || matchingBase?.imageCaption,
            visualTarget: s.visualTarget || matchingBase?.visualTarget,
            whatToLookFor: s.whatToLookFor || matchingBase?.whatToLookFor,
            quickTable: matchingBase?.quickTable,
          };
        }),
      };
    }
    if (aiMasteryData && (aiMasteryData.highYieldSummary || aiMasteryData.coreConcepts)) {
      const deepenedSlides: VisualSlideItem[] = [
        {
          id: `ai-slide-${subjectId}-${topicId}-1`,
          slideNumber: 1,
          title: `${topicName} — Pathophysiology & Clinical Core`,
          subtitle: `${subjectId.toUpperCase()} • Gemini AI Deepened Synthesis`,
          category: 'overview',
          bullets: [
            aiMasteryData.highYieldSummary,
            ...(Array.isArray(aiMasteryData.coreConcepts) ? aiMasteryData.coreConcepts.slice(0, 3) : []),
          ].filter(Boolean),
          keyTakeaways: Array.isArray(aiMasteryData.keyTakeaways) ? aiMasteryData.keyTakeaways.slice(0, 2) : baseSlideDeck.slides[0]?.keyTakeaways,
          examTrapWarning: aiMasteryData.examTrap || baseSlideDeck.slides[0]?.examTrapWarning,
          imageUrl: baseSlideDeck.slides[0]?.imageUrl,
          imageCaption: baseSlideDeck.slides[0]?.imageCaption,
          visualTarget: baseSlideDeck.slides[0]?.visualTarget,
          whatToLookFor: baseSlideDeck.slides[0]?.whatToLookFor,
        },
        {
          id: `ai-slide-${subjectId}-${topicId}-2`,
          slideNumber: 2,
          title: 'Diagnostic Workup, Gold Standards & Triads',
          subtitle: 'Best Initial vs Confirmatory Investigations',
          category: 'diagnostics',
          bullets: [
            aiMasteryData.diagnosticTriads ? `Pathognomonic Triad/Finding: ${aiMasteryData.diagnosticTriads}` : null,
            aiMasteryData.goldStandardTest ? `Definitive Gold-Standard: ${aiMasteryData.goldStandardTest}` : null,
            aiMasteryData.classicPresentation ? `Classic Vignette Stem: ${aiMasteryData.classicPresentation}` : null,
            ...(Array.isArray(aiMasteryData.coreConcepts) ? aiMasteryData.coreConcepts.slice(3, 5) : []),
          ].filter(Boolean) as string[],
          keyTakeaways: aiMasteryData.goldStandardTest ? [`Definitive test: ${aiMasteryData.goldStandardTest}`] : baseSlideDeck.slides[1]?.keyTakeaways,
          examTrapWarning: aiMasteryData.examTrap || baseSlideDeck.slides[1]?.examTrapWarning,
          imageUrl: baseSlideDeck.slides[1]?.imageUrl,
          imageCaption: baseSlideDeck.slides[1]?.imageCaption,
          visualTarget: baseSlideDeck.slides[1]?.visualTarget,
          whatToLookFor: baseSlideDeck.slides[1]?.whatToLookFor,
        },
        {
          id: `ai-slide-${subjectId}-${topicId}-3`,
          slideNumber: 3,
          title: 'First-Line Protocols, Drug of Choice & Pitfalls',
          subtitle: 'Emergency Management & Board Traps',
          category: 'pharmacology_mgmt',
          bullets: [
            aiMasteryData.firstLineTreatment ? `First-Line Rx / DOC: ${aiMasteryData.firstLineTreatment}` : null,
            aiMasteryData.examTrap ? `NBE Board Pitfall / Distractor: ${aiMasteryData.examTrap}` : null,
            ...(Array.isArray(aiMasteryData.keyTakeaways) ? aiMasteryData.keyTakeaways : []),
          ].filter(Boolean) as string[],
          keyTakeaways: aiMasteryData.firstLineTreatment ? [`DOC: ${aiMasteryData.firstLineTreatment}`] : baseSlideDeck.slides[2]?.keyTakeaways,
          examTrapWarning: aiMasteryData.examTrap || baseSlideDeck.slides[2]?.examTrapWarning,
          imageUrl: baseSlideDeck.slides[2]?.imageUrl,
          imageCaption: baseSlideDeck.slides[2]?.imageCaption,
          visualTarget: baseSlideDeck.slides[2]?.visualTarget,
          whatToLookFor: baseSlideDeck.slides[2]?.whatToLookFor,
        },
      ];
      return {
        topicId,
        topicName,
        subjectId,
        subjectName: subjectId,
        slides: deepenedSlides,
      };
    }
    return baseSlideDeck;
  }, [aiMasteryData, baseSlideDeck, subjectId, topicId, topicName]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoomedSlideImage, setZoomedSlideImage] = useState<{ url: string; title?: string; whatToLookFor?: string } | null>(null);

  // Step 2: Recall (Flashcards)
  const baseFlashcardDeck = useMemo<FlashcardDeck>(() => generateFlashcardDeck(subjectId, topicId, topicName), [subjectId, topicId, topicName]);
  const flashcardDeck = useMemo<FlashcardDeck>(() => {
    if (aiMasteryData?.flashcards && Array.isArray(aiMasteryData.flashcards) && aiMasteryData.flashcards.length > 0) {
      return {
        topicId,
        topicName,
        subjectId,
        subjectName: subjectId,
        cards: aiMasteryData.flashcards.map((fc: any, idx: number) => ({
          id: `ai-fc-${subjectId}-${topicId}-${idx + 1}`,
          topicId,
          subjectId,
          front: fc.front || 'Question',
          back: fc.back || 'Answer',
          clinicalPearl: fc.clinicalPearl,
          category: 'Gemini AI Rapid Recall',
          difficulty: 'high-yield',
          mastered: false,
          reviewCount: 0,
        })),
        masteredCount: 0,
        totalCards: aiMasteryData.flashcards.length,
      };
    }
    return baseFlashcardDeck;
  }, [aiMasteryData, baseFlashcardDeck, subjectId, topicId, topicName]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [cardRatings, setCardRatings] = useState<Record<string, 'again' | 'difficult' | 'got_it'>>(() => {
    try {
      const saved = localStorage.getItem(`fmge_fc_ratings_${topicId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Prioritize weak flashcards: 'again' (urgent) -> 'difficult' -> unrated -> 'got_it'
  const prioritizedCards = useMemo(() => {
    if (!flashcardDeck.cards || flashcardDeck.cards.length === 0) return [];
    return [...flashcardDeck.cards].sort((a, b) => {
      const getPriority = (id: string) => {
        const rating = cardRatings[id];
        if (rating === 'again') return 1;
        if (rating === 'difficult') return 2;
        if (!rating) return 3;
        return 4;
      };
      return getPriority(a.id) - getPriority(b.id);
    });
  }, [flashcardDeck.cards, cardRatings]);

  const activeCard = prioritizedCards[currentCardIndex] || prioritizedCards[0];

  useEffect(() => {
    if (prioritizedCards.length > 0 && currentCardIndex >= prioritizedCards.length) {
      setCurrentCardIndex(Math.max(0, prioritizedCards.length - 1));
    }
  }, [prioritizedCards.length, currentCardIndex]);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`fmge_fc_known_${topicId}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });
  const [showAllFlashcardsGrid, setShowAllFlashcardsGrid] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`fmge_fc_known_${topicId}`, JSON.stringify(Array.from(knownCardIds)));
      localStorage.setItem(`fmge_fc_ratings_${topicId}`, JSON.stringify(cardRatings));
    } catch {}
  }, [topicId, knownCardIds, cardRatings]);

  // Verified questions available for this topic in the question bank
  const verifiedQuestionsAvailable = useMemo(() => {
    return getVerifiedTopicQuestions(subjectId, topicId, topicName, 20);
  }, [subjectId, topicId, topicName]);

  // Attempt metrics for this topic
  const topicAttempts = useMemo(() => {
    return (state.mcqAttempts || []).filter((a) => {
      if (a.subjectId !== subjectId) return false;
      if (a.topicId === topicId) return true;
      if (a.topicName && a.topicName.toLowerCase() === topicName.toLowerCase()) return true;
      return false;
    });
  }, [state.mcqAttempts, subjectId, topicId, topicName]);

  const incorrectAttemptsCount = useMemo(() => {
    return topicAttempts.filter((a) => !a.isCorrect).length;
  }, [topicAttempts]);

  const luckyGuessesCount = useMemo(() => {
    return topicAttempts.filter((a) => a.isCorrect && a.confidence === 'guess').length;
  }, [topicAttempts]);

  // Transparent topic mastery thresholds
  const isDataInsufficient = topicMetrics.totalAttempts < 5;
  const isMasteryEligible =
    topicMetrics.totalAttempts >= 5 &&
    topicMetrics.accuracy >= 80 &&
    topicMetrics.repeatedErrorsCount === 0;
  const needsRemediation = !isDataInsufficient && !isMasteryEligible;

  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const nextStep = currentStepIndex < STEPS.length - 1 ? STEPS[currentStepIndex + 1] : null;

  // Step 3: Apply (Clinical Cases)
  const baseCasesDeck = useMemo<TopicClinicalCasesDeck>(() => generateTopicClinicalCasesDeck(subjectId, topicId, topicName), [subjectId, topicId, topicName]);
  const casesDeck = useMemo<TopicClinicalCasesDeck>(() => {
    if (aiMasteryData?.clinicalCases && Array.isArray(aiMasteryData.clinicalCases) && aiMasteryData.clinicalCases.length > 0) {
      return {
        topicId,
        topicName,
        subjectId,
        subjectName: subjectId,
        cases: aiMasteryData.clinicalCases.map((c: any, idx: number) => ({
          id: `ai-case-${subjectId}-${topicId}-${idx + 1}`,
          caseNumber: idx + 1,
          title: c.title || `Clinical Vignette ${idx + 1}`,
          patientDemographics: c.patientDemographics || 'Patient presentation',
          presentation: c.presentation || '',
          physicalExamOrLabs: c.physicalExamOrLabs || '',
          diagnosticQuestion: c.diagnosticQuestion || 'What is the most likely diagnosis or next best step?',
          options: (c.options || []).map((o: any, oIdx: number) => ({
            key: o.key || ['A', 'B', 'C', 'D'][oIdx] || 'A',
            text: o.text || '',
            isCorrect: !!o.isCorrect,
          })),
          correctAnswer: (c.options || []).find((o: any) => o.isCorrect)?.key || 'A',
          clinicalExplanation: c.clinicalExplanation || 'Evidence-based clinical guideline reasoning.',
          examPearl: c.examPearl || '',
          focusArea: 'Gemini AI High-Yield Vignette',
        })),
      };
    }
    return baseCasesDeck;
  }, [aiMasteryData, baseCasesDeck, subjectId, topicId, topicName]);

  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedCaseOption, setSelectedCaseOption] = useState<string | null>(null);
  const [isCaseSubmitted, setIsCaseSubmitted] = useState(false);
  const verifiedVisualAsset = useMemo(() => getVerifiedVisualAssetForTopic(subjectId, topicName), [subjectId, topicName]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Step 6: Pearls & Mnemonics
  const basePearls: TopicHighYieldPearl[] = useMemo(
    () => generateTopicPearls(subjectId, topicId, topicName),
    [subjectId, topicId, topicName]
  );
  const pearls = useMemo<TopicHighYieldPearl[]>(() => {
    if (aiMasteryData?.pearls && Array.isArray(aiMasteryData.pearls) && aiMasteryData.pearls.length > 0) {
      return aiMasteryData.pearls.map((p: any, idx: number) => ({
        id: `ai-pearl-${subjectId}-${topicId}-${idx + 1}`,
        topicId,
        subjectId,
        statement: p.statement || p.pearl || '',
        category: 'Gemini AI Memory Hook',
        discriminatorTip: p.discriminatorTip,
        examTrapWarning: p.examTrapWarning || p.trap,
      }));
    }
    return basePearls;
  }, [aiMasteryData, basePearls, subjectId, topicId, topicName]);

  // Reset indices and interactive states on topic switch
  useEffect(() => {
    activeTopicKeyRef.current = `${subjectId}::${topicId}`;
    setCurrentSlideIndex(0);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setCurrentCaseIndex(0);
    setSelectedCaseOption(null);
    setIsCaseSubmitted(false);
    setAiMasteryData(null);
    setAiStatus(null);
    setShowAllFlashcardsGrid(false);
    try {
      const savedKnown = localStorage.getItem(`fmge_fc_known_${topicId}`);
      setKnownCardIds(savedKnown ? new Set(JSON.parse(savedKnown)) : new Set());
      const savedRatings = localStorage.getItem(`fmge_fc_ratings_${topicId}`);
      setCardRatings(savedRatings ? JSON.parse(savedRatings) : {});
    } catch {}
  }, [subjectId, topicId, topicName]);

  // Fetch AI Live Deepening Pack
  const fetchGeminiMastery = async () => {
    const requestTopicKey = `${subjectId}::${topicId}`;
    setIsAiLoading(true);
    setAiStatus('Connecting to Gemini AI for live medical deepening...');
    try {
      const res = await fetch('/api/study/topic-mastery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, topicId, topicName }),
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const result = await res.json();
      if (activeTopicKeyRef.current !== requestTopicKey) {
        return;
      }
      if (result.success && result.data) {
        setAiMasteryData(result.data);
        setCurrentSlideIndex(0);
        setAiStatus('Live Gemini AI study pack & deepened slides loaded!');
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } else {
        const detail = result.error ? `Notice: ${result.error}. ` : '';
        setAiStatus(`${detail}Loaded verified NBE blueprint knowledge base.`);
      }
    } catch (err: any) {
      if (activeTopicKeyRef.current !== requestTopicKey) {
        return;
      }
      setAiStatus(err?.message ? `Notice: ${err.message}. Serving verified base knowledge.` : 'Serving verified NBE blueprint knowledge base.');
    } finally {
      if (activeTopicKeyRef.current === requestTopicKey) {
        setIsAiLoading(false);
      }
    }
  };

  // Automatically trigger live AI deepening if opened via "Deepen High-Yield"
  useEffect(() => {
    if (autoDeepen && !aiMasteryData && !isAiLoading) {
      fetchGeminiMastery();
    }
  }, [autoDeepen, subjectId, topicId]);

  const stageRailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const rail = stageRailRef.current;
    const active = rail?.querySelector<HTMLButtonElement>(`[data-step="${activeStep}"]`);
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeStep]);

  useEffect(() => {
    let isMounted = true;
    fetchTopicVideoRecommendations(
      {
        subjectId,
        topicId,
        topicName,
        subjectName: subjectId,
        subjectCode: subjectId.slice(0, 3).toUpperCase(),
        subjectColor: 'var(--color-slate-900)',
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
    const alreadyMastered = currentTopicState.notesDone && currentTopicState.qBankDone && currentTopicState.r1Done;
    if (alreadyMastered) return;
    onToggleTopicState(subjectId, topicId, 'notesDone');
    onToggleTopicState(subjectId, topicId, 'qBankDone');
    onToggleTopicState(subjectId, topicId, 'r1Done');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
  };

  // High-Yield Active Data (AI enriched or Base verified)
  const activeSummary = aiMasteryData?.highYieldSummary || baseKnowledge.highYieldSummary;
  const activeCoreConcepts = aiMasteryData?.coreConcepts || baseKnowledge.coreConcepts;
  const activeGoldStandard = aiMasteryData?.goldStandardTest || baseKnowledge.goldStandardTest;
  const activeFirstLine = aiMasteryData?.firstLineTreatment || baseKnowledge.firstLineTreatment;
  const activeClassicPresentation = aiMasteryData?.classicPresentation || baseKnowledge.classicPresentation;
  const activeTriads = aiMasteryData?.diagnosticTriads;
  const activeExamTrap = aiMasteryData?.examTrap || baseKnowledge.examTrap;
  const activeRevisionTable = aiMasteryData?.rapidRevisionTable;
  const activeKeyTakeaways = aiMasteryData?.keyTakeaways || activeCoreConcepts?.slice(0, 4);

  return (
    <div className="topic-mastery-workspace overflow-y-auto font-sans text-slate-900" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9100, backgroundColor: '#1D1D1F' }}>
      <div className="flex items-center justify-center p-0 sm:p-4 md:p-6" style={{ minHeight: '100vh' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="bg-[#F8FAFA] backdrop-blur-2xl sm:rounded-3xl max-w-5xl w-full my-auto h-[100dvh] sm:h-auto sm:max-h-[94vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-0 sm:border border-slate-200/80 overflow-hidden"
        >
          {/* ================= EDITORIAL TEXTBOOK HEADER ================= */}
          <header className="p-4 sm:p-7 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white/80 backdrop-blur-md shrink-0">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {subjectId.toUpperCase()} · NBE BLUEPRINT
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-white text-[10px] font-mono font-medium flex items-center gap-1.5 shadow-sm" style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)' }}>
                  <Activity className="h-3 w-3 text-white/80 animate-pulse" />
                  RAPID REVISION HUB
                </span>
                {aiMasteryData && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                    HIGH-YIELD SYNTHESIS ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display tracking-tight text-stone-900 truncate">
                {topicName}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-2xl hidden sm:block">
                High-yield FMGE board core synthesis, active flashcard recall, clinical vignette reasoning, and rapid revision grids.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-start">
              {/* Compact Session Progress Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-stone-700 font-mono text-[11px] font-semibold border border-slate-200/60">
                <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
                <span>Step {currentStepIndex + 1}/6: {STEPS[currentStepIndex].label}</span>
              </div>

              {/* Clear Next Action Shortcut */}
              {nextStep && (
                <button
                  type="button"
                  onClick={() => setActiveStep(nextStep.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display shadow-2xs transition-all cursor-pointer min-h-[36px]"
                >
                  <span>Next: {nextStep.label}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}

              {/* Finish & Return to Sprint Checklist */}
              <button
                type="button"
                onClick={() => {
                  onToggleTopicState(subjectId, topicId, 'notesDone');
                  if (topicMetrics.totalAttempts >= 5) {
                    onToggleTopicState(subjectId, topicId, 'qBankDone');
                  }
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold font-display transition-colors cursor-pointer min-h-[36px]"
                title="Save study progress and return to Sprint plan"
              >
                Finish & Return
              </button>

              {/* Live Deepening Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={fetchGeminiMastery}
                disabled={isAiLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-stone-900 border border-slate-200/80 hover:border-indigo-300 text-xs font-semibold font-display transition-all cursor-pointer shadow-2xs disabled:opacity-60 min-h-[36px] group"
                title="Comprehensive Gemini-powered study pack"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
                    <span className="text-stone-700">Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Brain className="h-2.5 w-2.5" />
                    </div>
                    <span>{aiMasteryData ? 'Update High-Yield Pack' : 'Deepen High-Yield'}</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
          </header>

          {/* Status Notification Bar */}
          {aiStatus && (
            <div className="px-5 sm:px-6 py-2.5 bg-white/80 backdrop-blur-xs border-b border-slate-200/80 text-xs text-stone-700 font-medium flex items-center justify-between transition-all">
              <span className="flex items-center gap-2 min-w-0">
                {isAiLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
                ) : (
                  <Brain className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                )}
                <span className="font-mono text-xs truncate">{aiStatus}</span>
              </span>
              <button
                type="button"
                onClick={() => setAiStatus(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-mono uppercase cursor-pointer ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ================= 6-STEP ROADMAP RAIL ================= */}
          <div ref={stageRailRef} className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 py-2.5 overflow-x-auto scrollbar-none shrink-0">
            <div className="flex items-center justify-start min-w-max gap-1 p-1 bg-[#F2F2F7] rounded-2xl border border-[rgba(60,60,67,0.08)]">
              {STEPS.map((step, idx) => {
                const isActive = activeStep === step.id;
                const isPast = STEPS.findIndex((s) => s.id === activeStep) > idx;

                return (
                  <motion.button
                    key={step.id}
                    type="button"
                    data-step={step.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer min-h-[32px] whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-[#1D1D1F] font-bold shadow-sm border border-[rgba(60,60,67,0.1)]'
                        : isPast
                        ? 'text-[#3A3A3C] bg-white/50 hover:bg-white/80'
                        : 'text-[#8E8E93] hover:text-[#3A3A3C] hover:bg-white/50'
                    }`}
                  >
                    <span className="font-mono text-[9px] opacity-60 font-bold">{step.num}</span>
                    <span>{step.label}</span>
                    {isPast && <Check className="h-2.5 w-2.5 text-[#30D158]" strokeWidth={2.5} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ================= STEP CONTENT CANVAS ================= */}
          <div className="p-4 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-7">
            {/* ================= STEP 1: RAPID REVISION & HIGH YIELD CORE ================= */}
            {activeStep === 'learn' && (
              <div className="space-y-7">
                {/* 1. HIGH YIELD RAPID REVISION MASTER CARD */}
                <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-amber-500/[0.03] before:via-white/0 before:to-sky-500/[0.02] before:pointer-events-none">
                  <div className="relative z-10 flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/25">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-display text-stone-900">
                          Rapid Revision Clinical Blueprint
                        </h3>
                        <p className="text-xs text-stone-500">Board-tested discriminators, gold-standard tests, and DOC</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      FMGE High Yield
                    </span>
                  </div>

                  {/* Condensed High-Yield Opening Summary (Scannable Grid) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {/* 1. Hallmark Presentation & Cardinal Triads */}
                    <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-sky-950 flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                          Cardinal Presentation & Features
                        </span>
                        <p className="text-xs text-stone-700 font-normal leading-relaxed">
                          {activeTriads ? <strong className="font-semibold text-stone-900">{activeTriads} • </strong> : null}
                          {activeClassicPresentation}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-sky-800 bg-sky-100/60 px-2 py-0.5 rounded w-fit">
                        Differentiating Features
                      </span>
                    </div>

                    {/* 2. Investigation of Choice (IOC) / Gold Standard */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-indigo-950 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          Diagnostic Gold Standard (IOC)
                        </span>
                        <p className="text-xs text-stone-700 font-normal leading-relaxed">
                          {activeGoldStandard}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-indigo-800 bg-indigo-100/60 px-2 py-0.5 rounded w-fit">
                        Investigations
                      </span>
                    </div>

                    {/* 3. First-Line Management & DOC */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          Treatment Principles & DOC
                        </span>
                        <p className="text-xs text-stone-700 font-normal leading-relaxed">
                          {activeFirstLine}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded w-fit">
                        First-Line Therapy
                      </span>
                    </div>

                    {/* 4. Core Classification & Subtypes */}
                    <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/70 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-purple-950 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          Classification & Syndromes
                        </span>
                        <p className="text-xs text-stone-700 font-normal leading-relaxed">
                          {activeCoreConcepts && activeCoreConcepts[0] ? activeCoreConcepts[0] : activeSummary}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-purple-800 bg-purple-100/60 px-2 py-0.5 rounded w-fit">
                        Syndromes & Subtypes
                      </span>
                    </div>

                    {/* 5. Critical Safety Warnings & Contraindications */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-amber-950 flex items-center gap-1.5">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          Contraindications & Safety
                        </span>
                        <p className="text-xs text-stone-700 font-normal leading-relaxed">
                          {activeExamTrap.includes('contraindicated') || activeExamTrap.includes('teratogen')
                            ? activeExamTrap
                            : `Always screen for patient-specific contraindications, teratogenic drug toxicity, and drug-disease aggravations before initiating first-line therapy.`}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded w-fit">
                        Safety Warnings
                      </span>
                    </div>

                    {/* 6. FMGE Board Traps & Lookalikes */}
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold font-display text-rose-950 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          FMGE Board Traps & Mimics
                        </span>
                        <p className="text-xs text-rose-950 font-normal leading-relaxed">
                          {activeExamTrap}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-rose-900 bg-rose-100/80 px-2 py-0.5 rounded w-fit">
                        High-Yield Trap
                      </span>
                    </div>
                  </div>

                  {/* Core Takeaways (Compact Bullets) */}
                  {activeCoreConcepts && activeCoreConcepts.length > 1 && (
                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
                        Essential Board High-Yield Takeaways
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {activeCoreConcepts.slice(1, 5).map((concept: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93] mt-1.5 shrink-0" />
                            <span>{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. DEEPEN HIGH-YIELD TRIGGER */}
                {!aiMasteryData && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-indigo-50/90 text-indigo-700 border border-indigo-200/60 shadow-2xs shrink-0 mt-0.5">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                            GEMINI CLINICAL INTELLIGENCE
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            COMPREHENSIVE · DEEP STUDY
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold font-display text-stone-900">
                          Deepen High-Yield
                        </h3>
                        <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
                          Gemini synthesizes an exhaustive, exam-targeted study pack covering clinical reasoning, IOC gold-standard tests, first-line management, and FMGE board traps.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      onClick={fetchGeminiMastery}
                      disabled={isAiLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold font-display transition-all shadow-sm cursor-pointer shrink-0 disabled:opacity-60 min-h-[42px]" style={{ background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)', boxShadow: '0 3px 12px rgba(88,86,214,0.35)' }}
                    >
                      {isAiLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-indigo-300" />
                          <span>Synthesizing Study Pack...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 text-indigo-300" />
                          <span>Deepen High-Yield Pack</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {/* 3. GEMINI-GENERATED COMPREHENSIVE STUDY PACK (If loaded) */}
                {aiMasteryData && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-white border border-indigo-200/90 shadow-2xs space-y-5 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold font-mono uppercase tracking-wider">
                        <Brain className="h-3 w-3 text-indigo-600" />
                        Comprehensive Study Pack
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-stone-900">
                        {topicName}
                      </h3>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                        {[
                          { id: 'overview', label: 'Overview' },
                          { id: 'patho', label: 'Pathophysiology' },
                          { id: 'features', label: 'Clinical Features' },
                          { id: 'diagnosis', label: 'Diagnosis' },
                          { id: 'management', label: 'Management' },
                        ].map((tab) => (
                          <motion.button
                            key={tab.id}
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                            onClick={() => setActivePackTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display whitespace-nowrap transition-all cursor-pointer min-h-[32px] ${
                              activePackTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                            }`}
                          >
                            {tab.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Key Takeaways Box */}
                    {activeKeyTakeaways && activeKeyTakeaways.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold font-display text-indigo-950">
                          <Award className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Key Takeaways</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-indigo-950 font-medium">
                          {activeKeyTakeaways.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Detailed Section Content */}
                    <div className="space-y-4 pt-1">
                      <div className="space-y-1.5">
                        <h4 className="text-sm sm:text-base font-bold font-display text-stone-900">
                          {activePackTab === 'overview' && '1. Overview & Core Definition'}
                          {activePackTab === 'patho' && '2. Pathophysiology & Underlying Mechanism'}
                          {activePackTab === 'features' && '3. Clinical Presentation & Hallmark Signs'}
                          {activePackTab === 'diagnosis' && '4. Diagnostic Workup & Investigations'}
                          {activePackTab === 'management' && '5. Evidence-Based Management Protocol'}
                        </h4>
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                          {activePackTab === 'overview' && (aiMasteryData.highYieldSummary || activeSummary)}
                          {activePackTab === 'patho' && (aiMasteryData.coreConcepts?.[0] || activeSummary)}
                          {activePackTab === 'features' && `${activeClassicPresentation} ${activeTriads ? `Diagnostic Triad: ${activeTriads}.` : ''}`}
                          {activePackTab === 'diagnosis' && `Gold Standard / Investigation of Choice: ${activeGoldStandard}. Standard diagnostic confirmation is pivotal for FMGE board scoring.`}
                          {activePackTab === 'management' && `Drug of Choice / First-Line Protocol: ${activeFirstLine}. Adhere to NBE guideline discriminators.`}
                        </p>
                      </div>

                      {/* High-Yield for FMGE Callout Card */}
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                        <Award className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <strong className="font-semibold text-amber-950 block mb-0.5">High-Yield for FMGE:</strong>
                          <span>Focus on diagnostic discriminators, investigation of choice ({activeGoldStandard}), and first-line therapy ({activeFirstLine}). Beware of {activeExamTrap}.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. RAPID REVISION MASTER COMPARISON TABLE */}
                {activeRevisionTable && activeRevisionTable.headers && activeRevisionTable.rows && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-stone-700" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
                        Rapid Revision Comparison Grid
                      </span>
                    </div>
                    <div className="rounded-xl border border-stone-200 overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-700 font-semibold font-display border-b border-stone-200">
                          <tr>
                            {activeRevisionTable.headers.map((h: string, i: number) => (
                              <th key={i} className="px-4 py-3 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                          {activeRevisionTable.rows.map((row: string[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-stone-50/80 transition-colors">
                              {row.map((cell: string, cIdx: number) => (
                                <td key={cIdx} className="px-4 py-3 text-stone-800 font-medium">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Curated Medical Video */}
                {videos.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                      Curated Medical High-Yield Lecture
                    </span>
                    <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold font-display text-stone-900">
                          {videos[0].title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {videos[0].channelName} · {videos[0].duration}
                        </p>
                      </div>

                      <a
                        href={videos[0].youtubeUrl || `https://www.youtube.com/watch?v=${videos[0].id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display transition-colors cursor-pointer shrink-0 w-fit min-h-[36px] active:scale-[0.98]"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Watch Lecture</span>
                        <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
                      </a>
                    </div>
                  </div>
                )}

                {/* 6. Slides Deck */}
                {slideDeck.slides.length > 0 && (() => {
                  const currentSlide = slideDeck.slides[currentSlideIndex];
                  const categoryBadge = getSlideCategoryBadge(currentSlide?.category);
                  return (
                    <div className="space-y-4">
                      {/* Top Controls Bar */}
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                            {aiMasteryData ? 'Gemini AI Deepened Slides' : 'Textbook Notes & Synthesis'} ({currentSlideIndex + 1} of {slideDeck.slides.length})
                          </span>
                          {aiMasteryData ? (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-mono font-semibold flex items-center gap-1">
                              <Brain className="h-2.5 w-2.5 text-indigo-600" />
                              GEMINI AI DEEPENED
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={fetchGeminiMastery}
                              disabled={isAiLoading}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 text-[11px] font-semibold font-display transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {isAiLoading ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                                  <span>Deepening Slides...</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 text-indigo-600" />
                                  <span>Deepen Slides with Gemini</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="items-center gap-1 hidden sm:flex">
                            {slideDeck.slides.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentSlideIndex(idx)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                  idx === currentSlideIndex
                                    ? 'w-5 bg-[#007AFF]'
                                    : 'w-2 bg-stone-200 hover:bg-stone-300'
                                }`}
                                title={`Jump to slide ${idx + 1}`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              disabled={currentSlideIndex === 0}
                              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 hover:bg-stone-50 cursor-pointer"
                              title="Previous slide"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={currentSlideIndex === slideDeck.slides.length - 1}
                              onClick={() => setCurrentSlideIndex((prev) => Math.min(slideDeck.slides.length - 1, prev + 1))}
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 hover:bg-stone-50 cursor-pointer"
                              title="Next slide"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Slide Card */}
                      <div className="p-5 sm:p-7 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-5 relative overflow-hidden">
                        {isAiLoading && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-20 transition-all">
                            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                            <p className="text-sm font-semibold font-display text-indigo-700">
                              Deepening study slides with Gemini AI...
                            </p>
                            <p className="text-xs text-stone-500 font-mono">
                              Synthesizing clinical correlations, gold standard tests & board traps
                            </p>
                          </div>
                        )}

                        {/* Slide Header */}
                        <div className="space-y-1.5 border-b border-stone-100 pb-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryBadge.badgeClass}`}>
                              <categoryBadge.Icon className="h-3 w-3" />
                              <span>{categoryBadge.label}</span>
                            </span>
                            <span className="text-[11px] font-mono text-stone-400">
                              Slide {currentSlideIndex + 1} of {slideDeck.slides.length}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold font-display text-stone-900 tracking-tight">
                            {currentSlide?.title}
                          </h3>
                          {currentSlide?.subtitle && (
                            <p className="text-xs sm:text-sm text-stone-500 font-medium">
                              {currentSlide.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Slide Body */}
                        <div className={`grid gap-6 ${currentSlide?.imageUrl ? 'grid-cols-1 lg:grid-cols-12 items-start' : 'grid-cols-1'}`}>
                          {/* Content Column */}
                          <div className={`space-y-4 ${currentSlide?.imageUrl ? 'lg:col-span-7' : 'max-w-3xl'}`}>
                            {currentSlide?.bullets && currentSlide.bullets.length > 0 && (
                              <ul className="space-y-2.5 text-stone-800 text-[13px] sm:text-sm leading-relaxed">
                                {currentSlide.bullets.map((bp, i) => (
                                  <li key={i} className="flex items-start gap-2.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#007AFF] mt-2 shrink-0" />
                                    <div className="flex-1 font-normal text-stone-700">
                                      {renderFormattedSlideText(bp)}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Quick Table */}
                            {currentSlide?.quickTable && (
                              <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-2xs my-3">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-display font-semibold">
                                        {currentSlide.quickTable.headers.map((h, i) => (
                                          <th key={i} className="px-3.5 py-2.5">
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-stone-700">
                                      {currentSlide.quickTable.rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-stone-50/50 transition-colors">
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-3.5 py-2.5 font-medium">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Key Takeaways Card */}
                            {currentSlide?.keyTakeaways && currentSlide.keyTakeaways.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold font-display text-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>High-Yield Pearls:</span>
                                </div>
                                <ul className="space-y-1 text-xs text-emerald-900 font-medium pl-5 list-disc marker:text-emerald-500">
                                  {currentSlide.keyTakeaways.map((kt, i) => (
                                    <li key={i}>{kt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* High-Yield Trap Warning */}
                            {currentSlide?.examTrapWarning && (
                              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-950 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold font-display text-rose-800">
                                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                  <span>Board Pitfall / Trap:</span>
                                </div>
                                <p className="text-xs text-rose-900 leading-relaxed font-medium">
                                  {currentSlide.examTrapWarning}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Medical Visual Column */}
                          {currentSlide?.imageUrl && (
                            <div className="lg:col-span-5 space-y-2.5">
                              <div
                                className="group relative rounded-xl border border-stone-200/80 bg-stone-900/5 overflow-hidden shadow-2xs hover:border-[#007AFF]/50 transition-all cursor-pointer"
                                onClick={() => setZoomedSlideImage({
                                  url: currentSlide.imageUrl!,
                                  title: currentSlide.visualTarget || currentSlide.title,
                                  whatToLookFor: currentSlide.whatToLookFor || currentSlide.imageCaption || "Verified high-yield board visual finding",
                                })}
                              >
                                <div className="p-2 sm:p-3 flex items-center justify-center min-h-[200px] max-h-[290px]">
                                  <img
                                    src={currentSlide.imageUrl}
                                    alt={currentSlide.visualTarget || currentSlide.title}
                                    className="max-h-[270px] w-auto max-w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
                                    loading="lazy"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <div className="absolute top-2.5 right-2.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-900/75 backdrop-blur-xs text-white text-[11px] font-medium shadow-xs group-hover:bg-[#007AFF] transition-colors">
                                    <Maximize2 className="h-3 w-3" />
                                    <span>Zoom</span>
                                  </span>
                                </div>
                              </div>

                              {/* Visual Diagnostic Cues */}
                              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-left">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                                    <Eye className="h-3 w-3 text-stone-600" />
                                    <span>High-Yield Board Visual</span>
                                  </span>
                                  {currentSlide.visualTarget && (
                                    <span className="text-[11px] font-semibold text-stone-800 font-display truncate">
                                      {currentSlide.visualTarget}
                                    </span>
                                  )}
                                </div>
                                {currentSlide.whatToLookFor && (
                                  <p className="text-xs text-stone-700 leading-snug">
                                    <span className="font-semibold text-stone-900">What to look for: </span>
                                    {currentSlide.whatToLookFor}
                                  </p>
                                )}
                                {currentSlide.imageCaption && (
                                  <p className="text-[11px] text-stone-500 italic">
                                    {currentSlide.imageCaption}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Slide Navigation Footer inside card */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                          <button
                            type="button"
                            disabled={currentSlideIndex === 0}
                            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer font-medium"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Previous Slide</span>
                          </button>
                          <div className="flex items-center gap-1.5">
                            {slideDeck.slides.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setCurrentSlideIndex(i)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                  i === currentSlideIndex
                                    ? 'w-5 bg-[#007AFF]'
                                    : 'w-2 bg-stone-200 hover:bg-stone-300'
                                }`}
                                title={`Jump to slide ${i + 1}`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={currentSlideIndex === slideDeck.slides.length - 1}
                            onClick={() => setCurrentSlideIndex((prev) => Math.min(slideDeck.slides.length - 1, prev + 1))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer font-medium"
                          >
                            <span>Next Slide</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Step Navigation Action */}
                <div className="flex items-center justify-end pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep('recall')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                  >
                    <span>Next: Active Recall ({flashcardDeck.cards.length} Flashcards)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: RECALL (FLASHCARDS) ================= */}
            {activeStep === 'recall' && (
              <div className="space-y-6">
                {flashcardDeck.cards.length > 0 ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                          Active Recall Flashcards ({currentCardIndex + 1} of {flashcardDeck.cards.length})
                        </span>
                        <p className="text-[11px] text-stone-500">Attempt mental recall before revealing answers to cement long-term memory</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAllFlashcardsGrid((prev) => !prev)}
                          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer mr-2"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{showAllFlashcardsGrid ? 'Card by Card' : 'Show All Cards'}</span>
                        </button>
                        <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {knownCardIds.size} Mastered
                        </span>
                        {Object.values(cardRatings).filter((r) => r === 'difficult').length > 0 && (
                          <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {Object.values(cardRatings).filter((r) => r === 'difficult').length} Difficult
                          </span>
                        )}
                        {Object.values(cardRatings).filter((r) => r === 'again').length > 0 && (
                          <span className="font-mono text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {Object.values(cardRatings).filter((r) => r === 'again').length} Missed
                          </span>
                        )}
                      </div>
                    </div>

                    {!showAllFlashcardsGrid ? (
                      <>
                        {/* Flashcard Component */}
                        <div
                          className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm transition-all duration-200 min-h-[250px] flex flex-col justify-between relative overflow-hidden"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                {isCardFlipped ? 'Answer & Clinical Rationale' : 'Active Question Prompt · Test Yourself'}
                              </span>
                              {activeCard && cardRatings[activeCard.id] && (
                                <span className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded ${
                                  cardRatings[activeCard.id] === 'got_it'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : cardRatings[activeCard.id] === 'difficult'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {cardRatings[activeCard.id] === 'again'
                                    ? 'Priority: Needs Review'
                                    : `Rated: ${cardRatings[activeCard.id].toUpperCase()}`}
                                </span>
                              )}
                            </div>

                            {/* Front (Question) */}
                            <div>
                              <p className="text-base sm:text-lg font-bold font-display text-stone-900 leading-snug whitespace-pre-line break-words min-w-0">
                                {activeCard?.front}
                              </p>
                              {!isCardFlipped && (
                                <p className="text-xs text-stone-400 mt-2 font-normal italic">
                                  Attempt mental recall of the key mechanism, diagnosis, or drug before viewing the answer.
                                </p>
                              )}
                            </div>

                            {/* Back (Answer & Pearl) - ONLY Revealed after attempt */}
                            {isCardFlipped ? (
                              <div className="space-y-3 pt-3 border-t border-stone-100 animate-in fade-in duration-200">
                                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm text-stone-800 font-medium leading-relaxed whitespace-pre-line break-words">
                                  {activeCard?.back}
                                </div>
                                {activeCard?.clinicalPearl && (
                                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 font-medium">
                                    <strong className="font-semibold text-amber-950">Clinical Pearl:</strong> {activeCard.clinicalPearl}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pt-4">
                                <button
                                  type="button"
                                  onClick={() => setIsCardFlipped(true)}
                                  className="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold font-display flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-200/80 shadow-2xs"
                                >
                                  <Eye className="h-4 w-4 text-stone-600" />
                                  <span>Reveal Answer & Explanation</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-stone-400 pt-4 mt-2 border-t border-stone-100">
                            <span>Card {currentCardIndex + 1} of {prioritizedCards.length}</span>
                            <button
                              type="button"
                              onClick={() => setIsCardFlipped((prev) => !prev)}
                              className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>{isCardFlipped ? 'Hide Answer' : 'Flip'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Flashcard Rating Action Bar (Again, Difficult, Got It) */}
                        {isCardFlipped && (
                          <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold block text-center">
                              Rate Your Recall Performance:
                            </span>
                            <div className="grid grid-cols-3 gap-2.5">
                              {/* 1. AGAIN (Missed) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeCard) {
                                    setCardRatings((prev) => ({ ...prev, [activeCard.id]: 'again' }));
                                    setKnownCardIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(activeCard.id);
                                      return next;
                                    });
                                  }
                                  if (currentCardIndex < prioritizedCards.length - 1) {
                                    setIsCardFlipped(false);
                                    setCurrentCardIndex((prev) => prev + 1);
                                  }
                                }}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                              >
                                <span className="text-xs font-bold font-display flex items-center gap-1">
                                  <RotateCcw className="h-3 w-3" /> Again
                                </span>
                                <span className="text-[10px] text-rose-600 font-normal">Missed · Review Soon</span>
                              </button>

                              {/* 2. DIFFICULT (Struggled) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeCard) {
                                    setCardRatings((prev) => ({ ...prev, [activeCard.id]: 'difficult' }));
                                  }
                                  if (currentCardIndex < prioritizedCards.length - 1) {
                                    setIsCardFlipped(false);
                                    setCurrentCardIndex((prev) => prev + 1);
                                  }
                                }}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                              >
                                <span className="text-xs font-bold font-display flex items-center gap-1">
                                  <HelpCircle className="h-3 w-3" /> Difficult
                                </span>
                                <span className="text-[10px] text-amber-600 font-normal">Hard · Review Later</span>
                              </button>

                              {/* 3. GOT IT (Mastered) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeCard) {
                                    setCardRatings((prev) => ({ ...prev, [activeCard.id]: 'got_it' }));
                                    setKnownCardIds((prev) => new Set([...prev, activeCard.id]));
                                  }
                                  if (currentCardIndex < prioritizedCards.length - 1) {
                                    setIsCardFlipped(false);
                                    setCurrentCardIndex((prev) => prev + 1);
                                  } else {
                                    setActiveStep('apply');
                                  }
                                }}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                              >
                                <span className="text-xs font-bold font-display flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Got It
                                </span>
                                <span className="text-[10px] text-emerald-600 font-normal">Retained Securely</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Navigation Previous / Next */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCardFlipped(false);
                              setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                            }}
                            disabled={currentCardIndex === 0}
                            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold font-display text-stone-700 disabled:opacity-30 hover:bg-stone-50 cursor-pointer min-h-[40px] active:scale-[0.98]"
                          >
                            Previous Card
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsCardFlipped(false);
                              if (currentCardIndex < prioritizedCards.length - 1) {
                                setCurrentCardIndex((prev) => prev + 1);
                              } else {
                                setActiveStep('apply');
                              }
                            }}
                            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold font-display text-stone-700 hover:bg-stone-50 cursor-pointer min-h-[40px] active:scale-[0.98]"
                          >
                            {currentCardIndex < prioritizedCards.length - 1 ? 'Next Card' : 'Finish Cards'}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Show All Cards Grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {prioritizedCards.map((card, idx) => (
                          <div key={card.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-semibold uppercase text-stone-400">
                                Card {idx + 1}
                              </span>
                              {cardRatings[card.id] && (
                                <span className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded ${
                                  cardRatings[card.id] === 'got_it'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : cardRatings[card.id] === 'difficult'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {cardRatings[card.id].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold font-display text-stone-900">
                              {card.front}
                            </p>
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-800 font-medium whitespace-pre-line break-words">
                              {card.back}
                            </div>
                            {card.clinicalPearl && (
                              <p className="text-xs text-amber-800 font-normal">
                                {card.clinicalPearl}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setActiveStep('apply')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                      >
                        <span>Next: Clinical Vignettes</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <ContentUnavailableCard
                    title="Flashcards Unavailable"
                    message={`Verified flashcards matching "${topicName}" have been withheld to prevent cross-topic memorization errors.`}
                    actionLabel="Next: Clinical Reasoning (Cases)"
                    onAction={() => setActiveStep('apply')}
                    secondaryActionLabel={onOpenAiCoach ? "Ask AI Study Coach" : undefined}
                    onSecondaryAction={onOpenAiCoach ? () => onOpenAiCoach('concept', subjectId, topicName) : undefined}
                  />
                )}
              </div>
            )}

            {/* ================= STEP 3: APPLY (CLINICAL CASES) ================= */}
            {activeStep === 'apply' && (
              <div className="space-y-6">
                {casesDeck.cases.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                        Clinical Vignette Reasoning
                      </span>
                      <span className="font-mono text-xs text-stone-500">
                        Case {currentCaseIndex + 1} of {casesDeck.cases.length}
                      </span>
                    </div>

                    {/* Visual Asset if Available */}
                    {verifiedVisualAsset && (
                      <div className="p-4 rounded-xl bg-stone-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-stone-800">
                        <div className="flex items-center gap-3">
                          <img
                            src={verifiedVisualAsset.imageUrl}
                            alt={topicName}
                            className="h-16 w-24 object-cover rounded-lg border border-stone-700 cursor-pointer"
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
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold font-display text-stone-200 inline-flex items-center gap-1.5 min-h-[36px]"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                          <span>Fullscreen</span>
                        </button>
                      </div>
                    )}

                    {/* Case Stem */}
                    {casesDeck.cases[currentCaseIndex] && (
                      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-xs font-mono font-semibold uppercase text-sky-700">
                            {casesDeck.cases[currentCaseIndex].patientDemographics}
                          </span>
                          <p className="text-sm text-stone-700 leading-relaxed font-normal">
                            {casesDeck.cases[currentCaseIndex].presentation}
                          </p>
                          {casesDeck.cases[currentCaseIndex].physicalExamOrLabs && (
                            <p className="text-xs sm:text-sm text-stone-600 font-medium">
                              {casesDeck.cases[currentCaseIndex].physicalExamOrLabs}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-stone-100 space-y-2">
                          <p className="text-sm font-bold font-display text-stone-900">
                            {casesDeck.cases[currentCaseIndex].diagnosticQuestion}
                          </p>

                          <div className="space-y-2 pt-2">
                            {casesDeck.cases[currentCaseIndex].options.map((opt) => {
                              const optKey = opt.key || (opt as any).optionId;
                              const isSelected = selectedCaseOption === optKey;
                              const isCorrect = optKey === casesDeck.cases[currentCaseIndex].correctAnswer || opt.isCorrect;

                              let style = 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100/70';
                              if (isCaseSubmitted) {
                                if (isCorrect) {
                                  style = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                                } else if (isSelected) {
                                  style = 'bg-rose-50 border-rose-300 text-rose-900';
                                }
                              } else if (isSelected) {
                                style = 'bg-[#007AFF] border-[#007AFF] text-white';
                              }

                              return (
                                <button
                                  key={optKey}
                                  type="button"
                                  onClick={() => !isCaseSubmitted && setSelectedCaseOption(optKey)}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer min-h-[44px] active:scale-[0.99] ${style}`}
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
                              className="px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display transition-colors disabled:opacity-40 cursor-pointer min-h-[40px] active:scale-[0.98]"
                            >
                              Submit Diagnosis
                            </button>
                          ) : (
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-800 space-y-2">
                              <span className="font-semibold text-stone-900 font-display">Clinical Rationale:</span>
                              <p>{casesDeck.cases[currentCaseIndex].clinicalExplanation}</p>
                              {casesDeck.cases[currentCaseIndex].examPearl && (
                                <p className="text-amber-800 font-medium">
                                  Pearl: {casesDeck.cases[currentCaseIndex].examPearl}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleSelectCase(Math.max(0, currentCaseIndex - 1))}
                        disabled={currentCaseIndex === 0}
                        className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold font-display text-stone-700 disabled:opacity-30 hover:bg-stone-50 cursor-pointer min-h-[40px] active:scale-[0.98]"
                      >
                        Previous Case
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveStep('test')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                      >
                        <span>Next: 10-MCQ Diagnostic Drill</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <ContentUnavailableCard
                    title="Clinical Vignettes Unavailable"
                    message={`Verified clinical cases matching "${topicName}" have been withheld to maintain medical diagnostic accuracy.`}
                    actionLabel="Next: 10-MCQ Diagnostic Drill"
                    onAction={() => setActiveStep('test')}
                    secondaryActionLabel={onOpenAiCoach ? "Discuss Topic with AI Coach" : undefined}
                    onSecondaryAction={onOpenAiCoach ? () => onOpenAiCoach('vignette', subjectId, topicName) : undefined}
                  />
                )}
              </div>
            )}

            {/* ================= STEP 4: TEST ================= */}
            {activeStep === 'test' && (
              <div className="space-y-6">
                {/* Topic Question Practice Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-sky-50 text-sky-700 border border-sky-200/60">
                          Verified Bank Practice
                        </span>
                        <span className="text-[11px] font-medium text-stone-500 font-mono">
                          {subjectId.toUpperCase()} • {topicName}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-display text-stone-900">
                        Reliable Question Practice
                      </h3>
                      <p className="text-xs text-stone-600 max-w-xl">
                        NBE/FMGE clinical vignettes with distractor rationales, verified correct keys, and direct Error Vault logging.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono">
                      <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-stone-800">{verifiedQuestionsAvailable.length} Verified MCQs</div>
                        <div className="text-[10px] text-stone-500">Curated & Validated</div>
                      </div>
                    </div>
                  </div>

                  {/* Topic Performance Status */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <span className="text-lg sm:text-xl font-black font-mono text-stone-900">{topicMetrics.totalAttempts}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">MCQs Attempted</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <span className={`text-lg sm:text-xl font-black font-mono ${topicMetrics.accuracy >= 80 ? 'text-emerald-600' : topicMetrics.accuracy >= 60 ? 'text-amber-600' : 'text-stone-900'}`}>
                        {topicMetrics.totalAttempts > 0 ? `${topicMetrics.accuracy}%` : '—'}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Current Accuracy</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <span className={`text-lg sm:text-xl font-black font-mono ${incorrectAttemptsCount > 0 ? 'text-rose-600' : 'text-stone-600'}`}>
                        {incorrectAttemptsCount}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Mistakes Logged</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                      <span className="text-lg sm:text-xl font-black font-mono text-amber-600">
                        {luckyGuessesCount}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Lucky Guesses</p>
                    </div>
                  </div>

                  {/* Practice Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Primary: 10-Question Diagnostic Set */}
                    <div className="p-5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 hover:bg-sky-50/70 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-sky-100 text-sky-800">
                            Diagnostic Core
                          </span>
                          <span className="text-xs font-mono font-bold text-sky-700">10 Questions</span>
                        </div>
                        <h4 className="text-sm font-bold font-display text-stone-900">
                          10-MCQ Diagnostic Drill
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          Core diagnostic challenge. Tests classic presentations, investigations, drug choices, and board traps for {topicName}.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchPracticeMcq({
                            sessionId: `drill-${Date.now()}`,
                            source: 'dashboard_weak_topic',
                            subjectId,
                            subjectName: subjectId,
                            topicId,
                            topicName,
                            targetQuestionCount: Math.min(10, Math.max(1, verifiedQuestionsAvailable.length)),
                            initialQuestions: verifiedQuestionsAvailable.slice(0, 10),
                          });
                        }}
                        className="w-full py-3 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-bold font-display inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Launch 10-Question Diagnostic</span>
                      </button>
                    </div>

                    {/* Extended Timed Practice Set */}
                    <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-stone-200 text-stone-700">
                            Extended Drill
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-700">
                            {verifiedQuestionsAvailable.length} Questions
                          </span>
                        </div>
                        <h4 className="text-sm font-bold font-display text-stone-900">
                          Extended Timed Practice Set
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          Exhaustive topic coverage with visual IBQs and clinical vignettes from the verified question bank.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchPracticeMcq({
                            sessionId: `drill-ext-${Date.now()}`,
                            source: 'dashboard_weak_topic',
                            subjectId,
                            subjectName: subjectId,
                            topicId,
                            topicName,
                            targetQuestionCount: verifiedQuestionsAvailable.length,
                            initialQuestions: verifiedQuestionsAvailable,
                          });
                        }}
                        className="w-full py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold font-display inline-flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                      >
                        <Target className="h-4 w-4 text-stone-600" />
                        <span>Launch Extended Set ({verifiedQuestionsAvailable.length} MCQs)</span>
                      </button>
                    </div>
                  </div>

                  {/* Verification Guarantee & Distinctions */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-stone-800 font-semibold">Strict Verification Policy:</strong> All questions in this drill are sourced directly from verified clinical knowledge packs and standard exam questions with authentic explanations. No synthetic or hallucinated question counts.
                    </span>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setActiveStep('apply')}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold font-display text-stone-700 hover:bg-stone-50 cursor-pointer min-h-[40px] active:scale-[0.98]"
                  >
                    Back: Clinical Cases
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep('review')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
                  >
                    <span>Next: Review & Weak Traps</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 5: REVIEW ================= */}
            {activeStep === 'review' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-stone-900">{topicMetrics.totalAttempts}</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">MCQs Solved</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                    <span className={`text-xl sm:text-2xl font-black font-mono ${topicMetrics.accuracy >= 80 ? 'text-emerald-600' : topicMetrics.accuracy >= 60 ? 'text-amber-600' : 'text-stone-900'}`}>
                      {topicMetrics.totalAttempts > 0 ? `${topicMetrics.accuracy}%` : '—'}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Topic Accuracy</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                    <span className={`text-xl sm:text-2xl font-black font-mono ${incorrectAttemptsCount > 0 ? 'text-rose-600' : 'text-stone-600'}`}>
                      {incorrectAttemptsCount}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Incorrect Answers</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-amber-600">
                      {luckyGuessesCount}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Lucky Guesses</p>
                  </div>
                </div>

                {/* Diagnostics & Weakness Breakdown */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                        Error Vault & Remediation Diagnostics
                      </span>
                      <h4 className="text-sm font-bold font-display text-stone-900">
                        Mistake Analysis & Weak Anchors
                      </h4>
                    </div>
                    {topicMetrics.repeatedErrorsCount > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                        {topicMetrics.repeatedErrorsCount} Repeated Error{topicMetrics.repeatedErrorsCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Zero Repeat Errors
                      </span>
                    )}
                  </div>

                  {topicMetrics.repeatedErrorsCount > 0 ? (
                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-900 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Cognitive Trap Warning:</strong>
                          <p className="mt-0.5 leading-relaxed text-rose-800">
                            You have {topicMetrics.repeatedErrorsCount} persistent mistake pattern(s) logged in your Error Vault for {topicName}. Review the active recall deck to reinforce differentiating criteria before final testing.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveStep('recall')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          Review Flashcards (Step 2)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStep('test')}
                          className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-100/60 font-medium text-xs transition-colors cursor-pointer"
                        >
                          Retest Diagnostic Drill (Step 4)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 space-y-1.5">
                      <p className="text-stone-700 leading-relaxed">
                        No recurring cognitive traps identified for this topic. Verify high-yield memory pearls in Step 6 to lock down your revision score.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  {onOpenAiCoach ? (
                    <button
                      type="button"
                      onClick={() => onOpenAiCoach('concept', subjectId, topicName)}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer min-h-[40px] inline-flex items-center"
                    >
                      Ask AI Study Coach →
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveStep('master')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0056CC] text-white text-xs font-semibold font-display transition-colors cursor-pointer min-h-[42px] shadow-2xs active:scale-[0.98]"
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
                {pearls.length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                      High-Yield Pearls & Mnemonics
                    </span>
                    <div className="space-y-2.5">
                      {pearls.map((p, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] shadow-[0_1px_6px_rgba(0,0,0,0.04)] space-y-1.5">
                          <div className="flex items-start gap-2.5">
                            <div className="h-5 w-5 rounded-full bg-[#FFF3E0] border border-[#FF9500]/25 flex items-center justify-center shrink-0 mt-0.5">
                              <Award className="h-3 w-3 text-[#FF9500]" />
                            </div>
                            <strong className="font-bold text-[#1D1D1F] text-[13px] leading-snug">{p.statement}</strong>
                          </div>
                          {p.discriminatorTip && (
                            <p className="text-[12px] text-[#3A3A3C] pl-7 leading-snug">{p.discriminatorTip}</p>
                          )}
                          {p.examTrapWarning && (
                            <p className="text-[11px] text-[#FF3B30] font-semibold pl-7">
                              Exam Trap: {p.examTrapWarning}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ContentUnavailableCard
                    title="High-Yield Pearls Unavailable"
                    message={`Verified high-yield pearls matching "${topicName}" are currently being compiled. Unrelated pearls were withheld.`}
                    actionLabel={onOpenAiCoach ? "Ask AI Study Coach" : undefined}
                    onAction={onOpenAiCoach ? () => onOpenAiCoach('strategy', subjectId, topicName) : undefined}
                  />
                )}

                {/* Transparent Mastery Audit Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                        Performance-Based Mastery Audit
                      </span>
                      <h4 className="text-sm font-bold font-display text-stone-900">
                        Objective FMGE Mastery Thresholds
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-stone-500">
                      Standard: ≥5 MCQs · ≥80% Accuracy · 0 Repeat Errors
                    </span>
                  </div>

                  {/* 4-Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-lg font-black font-mono text-stone-900">
                        {topicMetrics.totalAttempts} / 5
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Min 5 Attempts</p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className={`text-lg font-black font-mono ${topicMetrics.accuracy >= 80 ? 'text-emerald-600' : topicMetrics.totalAttempts > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                        {topicMetrics.totalAttempts > 0 ? `${topicMetrics.accuracy}%` : '—'}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Target ≥80%</p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className={`text-lg font-black font-mono ${incorrectAttemptsCount > 0 ? 'text-rose-600' : 'text-stone-600'}`}>
                        {incorrectAttemptsCount}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Incorrect Logged</p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-lg font-black font-mono text-amber-600">
                        {luckyGuessesCount}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">Lucky Guesses</p>
                    </div>
                  </div>

                  {/* Dynamic Status Banner */}
                  {isDataInsufficient ? (
                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2 text-amber-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-amber-950">Not Enough Question Data:</strong>
                          <p className="mt-0.5 leading-relaxed text-amber-800">
                            Mastery cannot be awarded merely for viewing slides or pearls. You have completed {topicMetrics.totalAttempts} of the 5 required question attempts to reliably evaluate diagnostic accuracy.
                          </p>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLaunchPracticeMcq({
                              sessionId: `drill-${Date.now()}`,
                              source: 'dashboard_weak_topic',
                              subjectId,
                              subjectName: subjectId,
                              topicId,
                              topicName,
                              targetQuestionCount: 10,
                              initialQuestions: verifiedQuestionsAvailable.slice(0, 10),
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold font-display text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Take 10-Question Diagnostic Drill</span>
                        </button>
                      </div>
                    </div>
                  ) : needsRemediation ? (
                    <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-2 text-rose-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-rose-950">Remediation Recommended Before Mastery:</strong>
                          <p className="mt-0.5 leading-relaxed text-rose-800">
                            Your topic accuracy is {topicMetrics.accuracy}% (benchmark ≥80% required) with {topicMetrics.repeatedErrorsCount} repeated mistakes registered in the Error Vault. Review flashcards or retest before locking in mastery.
                          </p>
                        </div>
                      </div>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveStep('recall')}
                          className="px-3.5 py-2 rounded-xl border border-rose-300 bg-white text-rose-900 hover:bg-rose-100/60 font-semibold font-display text-xs transition-colors cursor-pointer"
                        >
                          Review Flashcards (Step 2)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLaunchPracticeMcq({
                              sessionId: `drill-retest-${Date.now()}`,
                              source: 'dashboard_weak_topic',
                              subjectId,
                              subjectName: subjectId,
                              topicId,
                              topicName,
                              targetQuestionCount: 10,
                              initialQuestions: verifiedQuestionsAvailable.slice(0, 10),
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold font-display text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Retest 10-MCQ Adaptive Drill</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5 text-emerald-900">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-emerald-950">Mastery Criteria Verified:</strong>
                          <p className="mt-0.5 leading-relaxed text-emerald-800">
                            Rigorous FMGE standards satisfied: {topicMetrics.totalAttempts} attempts, {topicMetrics.accuracy}% accuracy, and 0 repeated errors. You are ready to confirm mastery for this sprint topic.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTopicState(subjectId, topicId, 'notesDone');
                      if (topicMetrics.totalAttempts >= 5) {
                        onToggleTopicState(subjectId, topicId, 'qBankDone');
                      }
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold font-display transition-colors cursor-pointer min-h-[40px] active:scale-[0.98]"
                  >
                    Finish Session & Return to Sprint
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchPracticeMcq({
                          sessionId: `drill-${Date.now()}`,
                          source: 'dashboard_weak_topic',
                          subjectId,
                          subjectName: subjectId,
                          topicId,
                          topicName,
                          targetQuestionCount: 10,
                          initialQuestions: verifiedQuestionsAvailable.slice(0, 10),
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold font-display transition-colors cursor-pointer min-h-[40px] active:scale-[0.98]"
                    >
                      Retest Topic
                    </button>

                    {isMasteryEligible ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkMastered();
                          onClose();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold font-display shadow-2xs transition-colors cursor-pointer min-h-[40px] active:scale-[0.98]"
                      >
                        Confirm Topic Mastery
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-5 py-2.5 rounded-xl bg-stone-200 text-stone-400 text-xs font-semibold font-display cursor-not-allowed min-h-[40px]"
                        title={isDataInsufficient ? "Complete at least 5 MCQs to unlock topic mastery" : "Achieve ≥80% accuracy and 0 repeated errors to unlock topic mastery"}
                      >
                        Mastery Locked
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Image Zoom Modal */}
      {(zoomImage || zoomedSlideImage) && (
        <MedicalImageViewerModal
          isOpen={true}
          onClose={() => {
            setZoomImage(null);
            setZoomedSlideImage(null);
          }}
          imageUrl={zoomedSlideImage?.url || zoomImage || ''}
          title={zoomedSlideImage?.title || topicName}
          whatToLookFor={zoomedSlideImage?.whatToLookFor || "Verified diagnostic visual finding for this clinical concept."}
        />
      )}
    </div>
  );
};
