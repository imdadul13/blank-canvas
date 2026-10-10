import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  RotateCw,
  Search,
  CheckCircle2,
  CalendarPlus,
  BookOpen,
  ChevronRight,
  Activity,
  Target,
  Stethoscope,
  BarChart3,
  BarChart2,
  ShieldCheck,
  Calendar,
  PieChart,
  FileText,
  User,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import {
  AppState,
  PredictedTopicItem,
  PredictionMode,
  PredictionLevel,
  DailyTask,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import {
  calculateTopicPredictions,
  calculatePredictionDashboardMetrics,
  getTodaysPredictedRevisions,
} from '../utils/predictionEngine';
import { PredictionExplanationModal } from './PredictionExplanationModal';

interface FmgePredictorViewProps {
  state: AppState;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'r1Done' | 'r2Done' | 'r3Done') => void;
  onAddTask: (task: DailyTask) => void;
  onSelectSubject: (subjectId: string) => void;
  onOpenAiCoach: (tab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy', subjectId?: string, topicName?: string) => void;
  onBackToPerformance?: () => void;
  onLaunchPracticeSession?: (subjectId?: string, topicId?: string, topicName?: string, subtopic?: string, source?: any) => void;
}

interface SubjectScoreItem {
  id: string;
  name: string;
  shortName: string;
  weightage: number;
  predictedScore: number;
  completionRate: number;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  color: string;
}

interface GroupContribution {
  id: string;
  name: string;
  percentage: number;
  estimatedMarks: number;
  color: string;
}

export const FmgePredictorView: React.FC<FmgePredictorViewProps> = ({
  state,
  onToggleTopicState,
  onAddTask,
  onSelectSubject,
  onOpenAiCoach,
  onBackToPerformance,
  onLaunchPracticeSession,
}) => {
  // 1. Prediction Mode ('combined' | 'exam' | 'personal')
  const [mode, setMode] = useState<PredictionMode>('combined');

  // 2. Filters & Search State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'top' | 'high' | 'risk'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllRisks, setShowAllRisks] = useState<boolean>(false);
  const [subjectSortBy, setSubjectSortBy] = useState<'score' | 'weightage' | 'name' | 'risk'>('score');

  // 3. Modal & Toast State
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<PredictedTopicItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 4. Run calculation engine for all topics
  const predictions = useMemo(() => {
    return calculateTopicPredictions(state, mode);
  }, [state, mode]);

  // 5. Dashboard summary metrics
  const metrics = useMemo(() => {
    return calculatePredictionDashboardMetrics(predictions, state);
  }, [predictions, state]);

  const topicsStarted = predictions.filter((topic) => topic.prepStatus.completionRate > 0).length;
  const mcqAttemptsLogged = state.mcqAttempts?.length ?? 0;
  const grandTestsLogged = state.grandTests?.length ?? 0;
  const hasPersonalInputs = topicsStarted > 0 || mcqAttemptsLogged > 0 || grandTestsLogged > 0 || (state.errorNotebook?.length ?? 0) > 0;

  // 6. Today's strategic revision suggestions
  const todaysRevisions = useMemo(() => {
    return getTodaysPredictedRevisions(predictions, 5);
  }, [predictions]);

  // 7. Subject-wise predictions and estimated score breakdown
  const { subjectScores, totalPredictedScore, scoreGroups } = useMemo(() => {
    // Map topics to subjects
    const topicsBySub = new Map<string, PredictedTopicItem[]>();
    predictions.forEach((t) => {
      if (!topicsBySub.has(t.subjectId)) {
        topicsBySub.set(t.subjectId, []);
      }
      topicsBySub.get(t.subjectId)!.push(t);
    });

    const scoresList: SubjectScoreItem[] = FMGE_SUBJECTS.map((sub) => {
      const subTopics = topicsBySub.get(sub.id) || [];
      const totalTopics = subTopics.length || 1;

      const completionSum = subTopics.reduce((acc, t) => acc + t.prepStatus.completionRate, 0);
      const avgCompletion = Math.round(completionSum / totalTopics);

      const scoreSum = subTopics.reduce((acc, t) => acc + t.score, 0);
      const avgTopicScore = Math.round(scoreSum / totalTopics);

      // Mode-sensitive scaling
      let modeFactor = 0.58;
      if (mode === 'exam') {
        // Boost high weightage subjects
        modeFactor = sub.weightage >= 30 ? 0.65 : 0.54;
      } else if (mode === 'personal') {
        // High personal risk topics lower the score slightly
        const highRiskCount = subTopics.filter((t) => t.personalRiskScore >= 60).length;
        modeFactor = Math.max(0.42, 0.60 - (highRiskCount / totalTopics) * 0.2);
      }

      // Predicted marks out of subject weightage
      const performanceFactor = (avgCompletion * 0.45 + avgTopicScore * 0.55) / 100;
      const predictedMarks = Math.max(
        Math.round(sub.weightage * 0.35),
        Math.min(
          sub.weightage,
          Math.round(sub.weightage * (0.32 + performanceFactor * modeFactor))
        )
      );

      const riskLevel: 'HIGH' | 'MODERATE' | 'LOW' =
        predictedMarks < sub.weightage * 0.5 ? 'HIGH' : predictedMarks < sub.weightage * 0.7 ? 'MODERATE' : 'LOW';

      // Friendly display name
      const shortName = sub.code || sub.name.split(' ')[0] || sub.name;

      return {
        id: sub.id,
        name: sub.name,
        shortName,
        weightage: sub.weightage,
        predictedScore: predictedMarks,
        completionRate: avgCompletion,
        riskLevel,
        color: sub.color,
      };
    });

    // Total Predicted Score out of 300
    const rawSum = scoresList.reduce((acc, s) => acc + s.predictedScore, 0);
    // Baseline realistic calibrated score (FMGE 300 max, 150 pass)
    const calibratedScore = Math.min(275, Math.max(90, rawSum));

    // Subject Group contributions for Score Breakdown
    const groupMap: Record<string, { name: string; marks: number; color: string }> = {
      medicine: { name: 'Medicine & Allied', marks: 0, color: '#0071E3' },
      surgery: { name: 'Surgery & Allied', marks: 0, color: '#007AFF' },
      obgyn: { name: 'OBGYN', marks: 0, color: '#8b5cf6' },
      pediatrics: { name: 'Pediatrics', marks: 0, color: '#f97316' },
      path_micro: { name: 'Pathology & Microbiology', marks: 0, color: '#f43f5e' },
      pharmacology: { name: 'Pharmacology', marks: 0, color: '#eab308' },
      others: { name: 'Others', marks: 0, color: '#94a3b8' },
    };

    scoresList.forEach((s) => {
      if (['medicine', 'dermatology', 'psychiatry', 'radiology'].includes(s.id)) {
        groupMap.medicine.marks += s.predictedScore;
      } else if (['surgery', 'orthopedics', 'anesthesia', 'radiotherapy'].includes(s.id)) {
        groupMap.surgery.marks += s.predictedScore;
      } else if (s.id === 'obg') {
        groupMap.obgyn.marks += s.predictedScore;
      } else if (s.id === 'pediatrics') {
        groupMap.pediatrics.marks += s.predictedScore;
      } else if (['pathology', 'microbiology'].includes(s.id)) {
        groupMap.path_micro.marks += s.predictedScore;
      } else if (s.id === 'pharmacology') {
        groupMap.pharmacology.marks += s.predictedScore;
      } else {
        groupMap.others.marks += s.predictedScore;
      }
    });

    const groups: GroupContribution[] = Object.entries(groupMap).map(([id, grp]) => {
      const pct = calibratedScore > 0 ? Math.round((grp.marks / calibratedScore) * 100) : 0;
      return {
        id,
        name: grp.name,
        percentage: pct,
        estimatedMarks: grp.marks,
        color: grp.color,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return {
      subjectScores: scoresList,
      totalPredictedScore: calibratedScore,
      scoreGroups: groups,
    };
  }, [predictions, mode]);

  // 8. Ranked High-Risk Topics for "Biggest Risks"
  const highRiskTopics = useMemo(() => {
    // Prioritize high-yield topics with personal risk or revision gap
    const candidateList = [...predictions]
      .filter((p) => p.isHighYield && (p.personalRiskScore >= 45 || p.score >= 80))
      .sort((a, b) => b.personalRiskScore - a.personalRiskScore || b.score - a.score);

    // Fallback if empty
    if (candidateList.length === 0) {
      return predictions.slice(0, 10);
    }
    return candidateList;
  }, [predictions]);

  // Displayed risks (5 or all)
  const displayedRisks = showAllRisks ? highRiskTopics.slice(0, 12) : highRiskTopics.slice(0, 5);

  // 9. Sorted Subject Predictions for the bottom visual chart
  const sortedSubjectScores = useMemo(() => {
    const list = [...subjectScores];
    if (subjectSortBy === 'score') {
      return list.sort((a, b) => b.predictedScore - a.predictedScore);
    }
    if (subjectSortBy === 'weightage') {
      return list.sort((a, b) => b.weightage - a.weightage);
    }
    if (subjectSortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (subjectSortBy === 'risk') {
      const riskOrder = { HIGH: 0, MODERATE: 1, LOW: 2 };
      return list.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }
    return list;
  }, [subjectScores, subjectSortBy]);

  // 10. Filtered topics ledger
  const filteredPredictions = useMemo(() => {
    return predictions.filter((item) => {
      // Subject filter
      if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) {
        return false;
      }
      // Tier filter
      if (selectedTier === 'top' && item.score < 90) return false;
      if (selectedTier === 'high' && (item.score < 80 || item.score >= 90)) return false;
      if (selectedTier === 'risk' && item.personalRiskScore < 50) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.topicName.toLowerCase().includes(q);
        const matchSub = item.subjectName.toLowerCase().includes(q) || item.subjectCode.toLowerCase().includes(q);
        const matchWhy = item.whyReasons.some((r) => r.toLowerCase().includes(q));
        if (!matchName && !matchSub && !matchWhy) return false;
      }
      return true;
    });
  }, [predictions, selectedSubjectId, selectedTier, searchQuery]);

  // Handlers
  const handleOpenModal = (topic: PredictedTopicItem) => {
    setSelectedTopicForModal(topic);
    setIsModalOpen(true);
  };

  const handleAddAllTodaysToPlanner = () => {
    todaysRevisions.forEach((topic) => {
      const newTask: DailyTask = {
        id: `task-predict-${topic.topicId}-${Date.now()}`,
        title: `[Predicted HY] ${topic.topicName}`,
        subjectId: topic.subjectId,
        topicName: topic.topicName,
        type: 'revision',
        durationMinutes: 45,
        completed: false,
        priority: 'high',
      };
      onAddTask(newTask);
    });
    showToast(`Added ${todaysRevisions.length} priority topics to Today's Planner!`);
  };

  const handleAddSingleToPlanner = (topic: PredictedTopicItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTask: DailyTask = {
      id: `task-predict-${topic.topicId}-${Date.now()}`,
      title: `[Predicted HY] ${topic.topicName}`,
      subjectId: topic.subjectId,
      topicName: topic.topicName,
      type: 'revision',
      durationMinutes: 45,
      completed: false,
      priority: 'high',
    };
    onAddTask(newTask);
    showToast(`Planned revision for "${topic.topicName}"`);
  };

  // Score status indicator
  const scoreStatus = useMemo(() => {
    if (!hasPersonalInputs) {
      return {
        label: 'Blueprint baseline · not personalized',
        color: '#5856D6',
        bg: 'rgba(88,86,214,0.10)',
        border: 'rgba(88,86,214,0.22)',
        icon: BookOpen,
      };
    }
    if (totalPredictedScore >= 180) {
      return {
        label: 'Planning estimate above 180',
        color: '#30D158',
        bg: 'rgba(48,209,88,0.12)',
        border: 'rgba(48,209,88,0.3)',
        icon: TrendingUp,
      };
    }
    if (totalPredictedScore >= 150) {
      return {
        label: 'Planning estimate above cutoff',
        color: '#30D158',
        bg: 'rgba(48,209,88,0.10)',
        border: 'rgba(48,209,88,0.25)',
        icon: CheckCircle2,
      };
    }
    return {
        label: 'Planning estimate below cutoff',
      color: '#FF9500',
      bg: 'rgba(255,149,0,0.12)',
      border: 'rgba(255,149,0,0.3)',
      icon: AlertTriangle,
    };
  }, [totalPredictedScore, hasPersonalInputs]);

  // Gauge color by score
  const gaugeColor = !hasPersonalInputs ? '#C7C7CC' : totalPredictedScore >= 150 ? '#30D158' : totalPredictedScore >= 120 ? '#FF9500' : '#FF3B30';

  const StatusIcon = scoreStatus.icon;

  // Format today's date
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Gauge circumference
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - (hasPersonalInputs ? Math.min(1, Math.max(0, totalPredictedScore / 300)) : 0));

  return (
    <div
      className="font-['Plus_Jakarta_Sans'] space-y-5 max-w-7xl mx-auto px-3 sm:px-5 py-4 pb-24 sm:pb-20 lg:pb-16"
    >
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl"
            style={{ background: '#1D1D1F', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#30D158' }} />
            <span className="text-[13px] font-semibold text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Breadcrumb ── */}
      <div className="flex items-center gap-1.5">
        {onBackToPerformance ? (
          <button
            type="button"
            onClick={onBackToPerformance}
            className="text-[12px] font-semibold transition-colors cursor-pointer"
            style={{ color: '#8E8E93' }}
          >
            Performance
          </button>
        ) : (
          <span className="text-[12px] font-semibold" style={{ color: '#8E8E93' }}>
            Performance
          </span>
        )}
        <ChevronRight className="w-3 h-3" style={{ color: '#8E8E93' }} />
        <span className="text-[12px] font-bold" style={{ color: '#007AFF' }}>
          Score Predictor
        </span>
      </div>

      {/* ── 2. Gradient Header Card ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #001824 0%, #00324A 40%, #005A78 70%, #2B9FC4 100%)',
        }}
      >
        {/* Decorative glow blobs */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2B9FC4 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #007AFF 0%, transparent 70%)' }}
        />

        <div className="relative z-10 space-y-5">
          {/* Eyebrow + title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span
                  className="text-[11px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  FMGE Blueprint Planner
                </span>
              </div>
              {/* Bold title */}
              <h1 className="text-[26px] sm:text-[32px] font-bold text-white leading-tight">
                Blueprint Planning Estimate
              </h1>
              <p className="text-[13px] leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
                A study-priority estimate from NBE subject weights, high-yield topics, and your recorded preparation. It is not a calibrated exam-score forecast.
              </p>
            </div>
            {/* Date badge */}
            <div
              className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {formattedToday}
              </span>
            </div>
          </div>

          {/* Mode tabs inside header */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'combined' as PredictionMode, label: 'Combined', icon: BarChart3 },
              { id: 'exam' as PredictionMode, label: 'Exam Focus', icon: Target },
              { id: 'personal' as PredictionMode, label: 'Personal Focus', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-all cursor-pointer"
                  style={
                    active
                      ? { background: '#007AFF', color: '#fff', border: '1.5px solid #007AFF' }
                      : {
                          background: 'rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.75)',
                          border: '1.5px solid rgba(255,255,255,0.18)',
                        }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Score Hero Card ── */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-6 sm:p-8"
        style={{ borderColor: 'rgba(60,60,67,0.1)' }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Circular SVG Gauge */}
          <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={gaugeRadius} fill="none" stroke="#F2F2F7" strokeWidth="10" />
              <circle
                cx="64"
                cy="64"
                r={gaugeRadius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeOffset}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-[42px] font-bold leading-none font-['Plus_Jakarta_Sans']"
                style={{ color: '#1D1D1F' }}
              >
                {hasPersonalInputs ? totalPredictedScore : '—'}
              </span>
              <span className="text-[13px] font-semibold mt-0.5" style={{ color: '#8E8E93' }}>
                {hasPersonalInputs ? '/ 300' : 'No baseline'}
              </span>
            </div>
          </div>

          {/* Verdict + details */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            {/* Verdict badge */}
            <div className="flex justify-center sm:justify-start">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold border"
                style={{ color: scoreStatus.color, background: scoreStatus.bg, borderColor: scoreStatus.border }}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {scoreStatus.label}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: '#8E8E93' }}>
              {hasPersonalInputs
                ? 'Use this as a planning signal. Your logged preparation changes topic priorities; actual mock scores are the best measure of exam readiness.'
                : 'This is a blueprint-only baseline. Log practice, revisions, or a mock exam to personalize topic priorities.'}
            </p>

            {/* Observed inputs, instead of uncalibrated confidence claims */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-3 flex flex-col gap-1 border"
                style={{ background: 'rgba(0,122,255,0.06)', borderColor: 'rgba(0,122,255,0.15)' }}
              >
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 shrink-0" style={{ color: '#007AFF' }} />
                  <span className="text-[11px] font-bold" style={{ color: '#8E8E93' }}>Topics started</span>
                </div>
                <span className="text-[20px] font-bold leading-none" style={{ color: '#1D1D1F' }}>
                  {topicsStarted}
                </span>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>of {predictions.length} topics</span>
              </div>

              <div
                className="rounded-2xl p-3 flex flex-col gap-1 border"
                style={{ background: 'rgba(88,86,214,0.06)', borderColor: 'rgba(88,86,214,0.15)' }}
              >
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: '#5856D6' }} />
                  <span className="text-[11px] font-bold" style={{ color: '#8E8E93' }}>MCQ attempts</span>
                </div>
                <span className="text-[16px] font-bold leading-none whitespace-nowrap" style={{ color: '#1D1D1F' }}>
                  {mcqAttemptsLogged}
                </span>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>practice questions</span>
              </div>

              <div
                className="rounded-2xl p-3 flex flex-col gap-1 border"
                style={{ background: 'rgba(48,209,88,0.06)', borderColor: 'rgba(48,209,88,0.2)' }}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: '#30D158' }} />
                  <span className="text-[11px] font-bold" style={{ color: '#8E8E93' }}>Mocks logged</span>
                </div>
                <span className="text-[20px] font-bold leading-none" style={{ color: '#30D158' }}>
                  {grandTestsLogged}
                </span>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>full exam records</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject group breakdown bars */}
        <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(60,60,67,0.1)' }}>
          <h3 className="text-[15px] font-bold mb-4" style={{ color: '#1D1D1F' }}>
            Blueprint estimate by subject group
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoreGroups.map((grp) => (
              <div key={grp.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold" style={{ color: '#1D1D1F' }}>
                    {grp.name}
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: '#8E8E93' }}>
                    {grp.percentage}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#F2F2F7' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(3, grp.percentage))}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ backgroundColor: grp.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Two-Column Grid: Exam Priorities + Strategic Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Exam priorities */}
        <div
          className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col gap-4"
          style={{ borderColor: 'rgba(60,60,67,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: 'rgba(255,59,48,0.1)' }}
              >
                <AlertTriangle className="w-4.5 h-4.5" style={{ color: '#FF3B30' }} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#1D1D1F' }}>
                  Exam Priorities
                </h2>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  High-yield topics and revision gaps to review
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAllRisks(!showAllRisks)}
              className="flex items-center gap-1 text-[12px] font-bold cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: '#007AFF' }}
            >
              {showAllRisks ? 'Show Less' : 'View All'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Risk rows */}
          {displayedRisks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: '#F2F2F7' }}
              >
                <ShieldCheck className="w-7 h-7" style={{ color: '#30D158' }} />
              </div>
              <p className="text-[13px] font-semibold text-center" style={{ color: '#8E8E93' }}>
                No priority topics match these filters.
                <br />Try another subject or tier.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayedRisks.map((item, idx) => {
                const isVeryHigh = item.level === 'VERY_HIGH';
                return (
                  <motion.button
                    type="button"
                    key={item.topicId}
                    aria-label={`Open exam priority analysis for ${item.topicName}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenModal(item)}
                    className="relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-[#F2F2F7] group overflow-hidden"
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                      style={{ background: isVeryHigh ? '#FF3B30' : '#FF9500' }}
                    />
                    {/* Rank */}
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ml-2"
                      style={{ background: '#F2F2F7', color: '#8E8E93' }}
                    >
                      {idx + 1}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate" style={{ color: '#1D1D1F' }}>
                        {item.topicName}
                      </p>
                      <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                        {item.subjectName}
                      </p>
                    </div>
                    {/* Badge */}
                    <span
                      className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold"
                      style={
                        isVeryHigh
                          ? { background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }
                          : { background: 'rgba(255,149,0,0.1)', color: '#FF9500' }
                      }
                    >
                      {isVeryHigh ? 'Very High' : 'High'}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#8E8E93' }} />
                  </motion.button>
                );
              })}
            </div>
          )}

          <p className="text-[12px] pt-1" style={{ color: '#8E8E93', borderTop: '1px solid rgba(60,60,67,0.08)' }}>
            Select a topic to view its rationale and study strategy.
          </p>
        </div>

        {/* Strategic Actions */}
        <div
          className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col gap-4"
          style={{ borderColor: 'rgba(60,60,67,0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'rgba(255,149,0,0.1)' }}
            >
              <Activity className="w-4.5 h-4.5" style={{ color: '#FF9500' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: '#1D1D1F' }}>
                Strategic Actions
              </h2>
              <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                Suggested next steps for your preparation
              </p>
            </div>
          </div>

          {/* Action cards */}
          <div className="space-y-3 flex-1">
            {/* Action 1: Revise High-Risk Topics */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={handleAddAllTodaysToPlanner}
              className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer border transition-all group"
              style={{ background: 'rgba(48,209,88,0.05)', borderColor: 'rgba(48,209,88,0.2)' }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: '#30D158' }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold" style={{ color: '#1D1D1F' }}>
                  Revise High-Risk Topics
                </h3>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  Focus on {highRiskTopics.length} priority high-yield topics
                </p>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#8E8E93' }} />
            </motion.div>

            {/* Action 2: Take a Grand Test */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onLaunchPracticeSession) {
                  onLaunchPracticeSession('all', undefined, 'FMGE Full Grand Test Mock', undefined, 'predictor_grand_test');
                }
              }}
              className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer border transition-all group"
              style={{ background: 'rgba(0,122,255,0.05)', borderColor: 'rgba(0,122,255,0.2)' }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: '#007AFF' }}
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold" style={{ color: '#1D1D1F' }}>
                  Take a Grand Test
                </h3>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  Benchmark full 300 marks under exam conditions
                </p>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#8E8E93' }} />
            </motion.div>

            {/* Action 3: Review Error Vault */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const errTab = document.querySelector('[data-tab="errors"]') as HTMLElement;
                if (errTab) errTab.click();
              }}
              className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer border transition-all group"
              style={{ background: 'rgba(88,86,214,0.05)', borderColor: 'rgba(88,86,214,0.2)' }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: '#5856D6' }}
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold" style={{ color: '#1D1D1F' }}>
                  Review Error Vault
                </h3>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  Clear active mistakes to safeguard marks
                </p>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#8E8E93' }} />
            </motion.div>
          </div>

          <p className="text-[12px] pt-1" style={{ color: '#8E8E93', borderTop: '1px solid rgba(60,60,67,0.08)' }}>
            Recommendations adapt automatically to your latest activity.
          </p>
        </div>
      </div>

      {/* ── 5. Subject Prediction Chart ── */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-5 sm:p-6"
        style={{ borderColor: 'rgba(60,60,67,0.1)' }}
      >
        {/* Header + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: '#1D1D1F' }}>
              Subject Planning Estimates
            </h2>
            <p className="text-[12px]" style={{ color: '#8E8E93' }}>
              Blueprint-based marks estimate for each subject; use mock scores to judge readiness.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 shrink-0" style={{ color: '#8E8E93' }} />
            <select
              value={subjectSortBy}
              onChange={(e) => setSubjectSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl text-[12px] font-bold focus:outline-none cursor-pointer border"
              style={{
                background: '#F2F2F7',
                borderColor: 'rgba(60,60,67,0.12)',
                color: '#1D1D1F',
              }}
            >
              <option value="score">By Score</option>
              <option value="weightage">By Weightage</option>
              <option value="name">By Name</option>
              <option value="risk">By Risk</option>
            </select>
          </div>
        </div>

        {/* Horizontal bars */}
        <div className="space-y-2.5">
          {sortedSubjectScores.map((sub) => {
            const pct = Math.max(6, Math.round((sub.predictedScore / sub.weightage) * 100));
            const barColor =
              sub.riskLevel === 'LOW' ? '#30D158' : sub.riskLevel === 'MODERATE' ? '#FF9500' : '#FF3B30';
            return (
              <motion.div
                key={sub.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedSubjectId(sub.id === selectedSubjectId ? 'all' : sub.id)}
                className="flex items-center gap-3 group cursor-pointer rounded-xl px-2 py-1.5 transition-all hover:bg-[#F2F2F7]"
              >
                {/* Name */}
                <span
                  className="text-[12px] font-bold w-24 shrink-0 truncate"
                  style={{ color: '#1D1D1F' }}
                >
                  {sub.shortName}
                </span>
                {/* Bar */}
                <div
                  className="flex-1 h-6 rounded-full overflow-hidden"
                  style={{ background: '#F2F2F7' }}
                >
                  <motion.div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ backgroundColor: barColor }}
                  >
                    <span className="text-[10px] font-bold text-white leading-none">
                      {pct > 20 ? `${sub.predictedScore}` : ''}
                    </span>
                  </motion.div>
                </div>
                {/* Score */}
                <span
                  className="text-[12px] font-bold w-12 text-right shrink-0"
                  style={{ color: '#1D1D1F' }}
                >
                  {sub.predictedScore}
                  <span className="font-normal" style={{ color: '#8E8E93' }}>
                    /{sub.weightage}
                  </span>
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Active filter badge */}
        {selectedSubjectId !== 'all' && (
          <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(60,60,67,0.08)' }}>
            <span className="text-[12px]" style={{ color: '#8E8E93' }}>Filtered:</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
              style={{ background: '#007AFF', color: '#fff' }}
            >
              {FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId)?.name}
              <button
                type="button"
                onClick={() => setSelectedSubjectId('all')}
                className="leading-none hover:opacity-70 cursor-pointer"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* ── 6. Topic Ledger ── */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-5 sm:p-6 space-y-4"
        style={{ borderColor: 'rgba(60,60,67,0.1)' }}
      >
        {/* Section header */}
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: '#1D1D1F' }}>
            High-Yield Topic Ledger
          </h2>
          <p className="text-[12px]" style={{ color: '#8E8E93' }}>
            Search, filter and explore all predicted exam topics
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8E8E93' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, subjects or keywords…"
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] font-semibold focus:outline-none border transition-all"
              style={{
                background: '#F2F2F7',
                borderColor: 'transparent',
                color: '#1D1D1F',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#007AFF';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = '#F2F2F7';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            />
          </div>

          {/* Filter pills row */}
          <div className="flex flex-wrap gap-2">
            {/* Subject */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-9 px-3 rounded-full text-[12px] font-bold focus:outline-none cursor-pointer border"
              style={{
                background: selectedSubjectId !== 'all' ? '#007AFF' : '#F2F2F7',
                color: selectedSubjectId !== 'all' ? '#fff' : '#1D1D1F',
                borderColor: 'transparent',
              }}
            >
              <option value="all">All Subjects</option>
              {FMGE_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Tier pills */}
            {[
              { id: 'all', label: 'All Ranked' },
              { id: 'top', label: 'Top Tier 90+' },
              { id: 'high', label: 'High Yield 80–89' },
              { id: 'risk', label: 'Review Priority' },
            ].map((tier) => {
              const active = selectedTier === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id as any)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-bold cursor-pointer transition-all border"
                  style={
                    active
                      ? { background: '#1D1D1F', color: '#fff', borderColor: '#1D1D1F' }
                      : { background: '#F2F2F7', color: '#1D1D1F', borderColor: 'transparent' }
                  }
                >
                  {tier.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic rows */}
        <div className="space-y-2">
          {filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: '#F2F2F7' }}
              >
                <FileText className="w-8 h-8" style={{ color: '#8E8E93' }} />
              </div>
              <p className="text-[14px] font-semibold text-center" style={{ color: '#8E8E93' }}>
                No topics match your search.
                <br />
                <span className="text-[12px] font-normal">Try adjusting your filters.</span>
              </p>
            </div>
          ) : (
            filteredPredictions.slice(0, 30).map((topic) => (
              <motion.div
                key={topic.topicId}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleOpenModal(topic)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer border transition-all group"
                style={{ background: '#F2F2F7', borderColor: 'transparent' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#fff';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(60,60,67,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F2F2F7';
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }}
              >
                {/* Left */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {/* Rank badge */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}
                  >
                    #{topic.rank}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[14px] font-bold truncate" style={{ color: '#1D1D1F' }}>
                        {topic.topicName}
                      </h4>
                      <span
                        className="text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0"
                        style={{ background: 'rgba(60,60,67,0.08)', color: '#8E8E93' }}
                      >
                        {topic.subjectName}
                      </span>
                    </div>
                    {/* Why reasons */}
                    <div className="flex flex-wrap gap-1.5">
                      {topic.whyReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[11px] rounded-md px-2 py-0.5 border"
                          style={{
                            background: '#fff',
                            color: '#8E8E93',
                            borderColor: 'rgba(60,60,67,0.1)',
                          }}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {/* Score chip */}
                  <div className="text-right hidden sm:block">
                    <span className="text-[13px] font-bold" style={{ color: '#1D1D1F' }}>
                      {topic.score}
                      <span style={{ color: '#8E8E93' }}>/100</span>
                    </span>
                    <p className="text-[11px]" style={{ color: '#8E8E93' }}>
                      {topic.level === 'VERY_HIGH' ? 'Tier 1' : 'Tier 2'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <button
                    type="button"
                    onClick={(e) => handleAddSingleToPlanner(topic, e)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer"
                    style={{ background: '#F2F2F7', borderColor: 'rgba(60,60,67,0.1)', color: '#8E8E93' }}
                    title="Add to Daily Planner"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAiCoach('concept', topic.subjectId, topic.topicName);
                    }}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold cursor-pointer transition-all"
                    style={{ background: '#007AFF', color: '#fff' }}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Mentor
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {filteredPredictions.length > 30 && (
          <p className="text-[12px] text-center pt-2" style={{ color: '#8E8E93' }}>
            Showing 30 of {filteredPredictions.length} topics. Use filters to narrow down.
          </p>
        )}
      </div>

      {/* ── Deep Dive Explanation Modal ── */}
      <PredictionExplanationModal
        topic={selectedTopicForModal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTopicForModal(null);
        }}
        onToggleTopicState={onToggleTopicState}
        onAddTask={onAddTask}
        onOpenAiCoach={onOpenAiCoach}
      />
    </div>
  );
};
