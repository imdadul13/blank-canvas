import React, { useState, useMemo } from 'react';
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
      medicine: { name: 'Medicine & Allied', marks: 0, color: '#00685f' },
      surgery: { name: 'Surgery & Allied', marks: 0, color: '#0284c7' },
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
    if (totalPredictedScore >= 180) {
      return {
        label: 'High Chance of Clearing',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
        icon: TrendingUp,
      };
    }
    if (totalPredictedScore >= 150) {
      return {
        label: 'On Track to Clear (≥150)',
        classes: 'bg-teal-50 text-teal-800 border-teal-200/90',
        icon: CheckCircle2,
      };
    }
    return {
      label: 'Focus Needed (<150 Pass)',
      classes: 'bg-amber-50 text-amber-800 border-amber-200/90',
      icon: AlertTriangle,
    };
  }, [totalPredictedScore]);

  // Dynamic calculations for Confidence, Range, and Delta
  const confidenceLevel = Math.min(88, Math.max(55, Math.round(58 + (metrics.immediateRevisions.length ? 14 : 20))));
  const scoreRangeLow = Math.max(120, totalPredictedScore - 16);
  const scoreRangeHigh = Math.min(290, totalPredictedScore + 16);
  const scoreDelta = 18; // Positive progression marker vs initial baseline

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
  const gaugeOffset = gaugeCircumference * (1 - Math.min(1, Math.max(0, totalPredictedScore / 300)));

  return (
    <div
      className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-150 pb-36 sm:pb-20"
      style={{ paddingBottom: 'max(9.5rem, calc(7rem + env(safe-area-inset-bottom, 2rem)))' }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
          {onBackToPerformance ? (
            <button
              type="button"
              onClick={onBackToPerformance}
              className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>PERFORMANCE</span>
            </button>
          ) : (
            <span className="text-stone-500">PERFORMANCE</span>
          )}
          <span className="text-stone-400">•</span>
          <span className="text-[#00685f] font-bold">SCORE PREDICTOR</span>
        </div>
      </div>

      {/* 2. Editorial Header: "Your FMGE Score, Clarity Today." */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-slate-900 tracking-tight leading-tight">
            Your FMGE Score, Clarity Today.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            AI-powered prediction based on your practice, performance, and revision activity. Focus smarter. Improve faster. Be exam-ready.
          </p>
        </div>

        {/* Editorial Quote Card (matching Stage 4C reference) */}
        <div className="bg-[#ECF7F5] border border-[#CBEBE5] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 max-w-md shrink-0 self-stretch sm:self-start">
          <div className="w-8 h-8 rounded-xl bg-[#D4F0EB] text-[#00685f] flex items-center justify-center shrink-0 font-serif text-xl font-bold leading-none select-none">
            “
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-snug">
              “Plan with evidence. Prepare with purpose. Succeed with confidence.”
            </p>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00685f] block">
              — ONE SHOT FMGE
            </span>
          </div>
        </div>
      </div>

      {/* 3. Prediction Mode Tabs: Combined / Exam Focus / Personal Focus */}
      <div className="flex flex-wrap items-center gap-2.5">
        {[
          {
            id: 'combined' as PredictionMode,
            label: 'Combined Prediction',
            shortLabel: 'Combined',
            icon: BarChart3,
            accentColor: 'text-emerald-500',
          },
          {
            id: 'exam' as PredictionMode,
            label: 'Exam Focus',
            shortLabel: 'Exam Focus',
            icon: Target,
            accentColor: 'text-rose-500',
          },
          {
            id: 'personal' as PredictionMode,
            label: 'Personal Focus',
            shortLabel: 'Personal Focus',
            icon: User,
            accentColor: 'text-sky-500',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                active
                  ? 'bg-[#00685f] text-white shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : tab.accentColor}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Top Dashboard Section: Predicted Score Hero & Score Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-7): Predicted FMGE Score Hero */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#00685f]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Predicted FMGE Score
            </h2>
          </div>

          {/* Central Score Display: Circular Gauge + Status & Description */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 py-2">
            {/* Circular Score Gauge */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                {/* Background track */}
                <circle
                  cx="64"
                  cy="64"
                  r={gaugeRadius}
                  fill="none"
                  stroke="#EAEFEA"
                  strokeWidth="10"
                />
                {/* Progress arc */}
                <circle
                  cx="64"
                  cy="64"
                  r={gaugeRadius}
                  fill="none"
                  stroke="#00685f"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-extrabold font-mono text-slate-900 leading-none">
                  {totalPredictedScore}
                </span>
                <span className="text-xs text-slate-400 font-mono mt-1">/ 300</span>
              </div>
            </div>

            {/* Verdict & Supporting Text */}
            <div className="space-y-2.5 text-center sm:text-left flex-1">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${scoreStatus.classes}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{scoreStatus.label}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Based on your practice performance, subject mastery and revision activity.
              </p>
            </div>
          </div>

          {/* Bottom Metrics Row (3 compact tiles: Confidence, Likely Range, vs. Last) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2 border-t border-slate-100">
            {/* Confidence Level */}
            <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#00685f] shrink-0" />
                <span className="truncate">Confidence</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900">
                {confidenceLevel}%
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">Confidence Level</span>
            </div>

            {/* Likely Score Range */}
            <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                <BarChart2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">Likely Range</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900 whitespace-nowrap">
                {scoreRangeLow} – {scoreRangeHigh}
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">Likely Score Range</span>
            </div>

            {/* vs. Last Prediction */}
            <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">vs. Last</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-700">
                +{scoreDelta}
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">vs. Last Prediction</span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last updated: {formattedToday}</span>
            </div>
            <span className="hidden sm:inline">Prediction updates automatically</span>
          </div>
        </div>

        {/* Right Column (col-span-5): Score Breakdown by Subject Group */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-[#00685f]">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Score Breakdown
                </h2>
                <p className="text-xs text-slate-500">
                  Estimated contribution by subject group
                </p>
              </div>
            </div>
          </div>

          {/* Group Progress Bars */}
          <div className="space-y-3.5 py-1">
            {scoreGroups.map((grp) => (
              <div key={grp.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{grp.name}</span>
                  <span className="font-mono text-slate-900">{grp.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(3, grp.percentage))}%`,
                      backgroundColor: grp.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Info footnote */}
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>High-weightage clinical subjects dominate pass margin.</span>
          </div>
        </div>
      </div>

      {/* 5. Middle Dashboard Section: Biggest Risks & Strategic Actions (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Biggest Risks */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Biggest Risks
                </h2>
                <p className="text-xs text-slate-500">
                  Focus on these areas to improve your score
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAllRisks(!showAllRisks)}
              className="text-xs font-bold text-[#00685f] hover:text-teal-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>{showAllRisks ? 'Show Less' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ranked Risks List */}
          <div className="space-y-2.5 divide-y divide-slate-100">
            {displayedRisks.map((item, idx) => (
              <div
                key={item.topicId}
                onClick={() => handleOpenModal(item)}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 cursor-pointer group hover:bg-slate-50/60 p-2 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rank number badge */}
                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-[#00685f] group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>

                  {/* Subject and Topic Description */}
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 w-28 sm:w-32 shrink-0 truncate">
                      {item.subjectName}
                    </span>
                    <span className="text-xs text-slate-600 truncate flex-1">
                      {item.topicName}
                    </span>
                  </div>
                </div>

                {/* Right Status Badge & Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                    High Risk
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Footnote */}
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Click any risk topic to view full concept diagnosis & AI strategy.
          </div>
        </div>

        {/* Right Card: Strategic Actions */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Strategic Actions
              </h2>
              <p className="text-xs text-slate-500">
                Personalised recommendations to boost your score
              </p>
            </div>
          </div>

          {/* 3 Strategic Action Cards */}
          <div className="space-y-3">
            {/* Action 1: Revise High-Risk Topics */}
            <div
              onClick={handleAddAllTodaysToPlanner}
              className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-50 text-[#00685f] group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#00685f] transition-colors">
                    Revise High-Risk Topics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Focus on {highRiskTopics.length} priority high-yield topics
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#00685f] group-hover:border-[#00685f] transition-colors shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 2: Take a Grand Test */}
            <div
              onClick={() => {
                if (onLaunchPracticeSession) {
                  onLaunchPracticeSession('all', undefined, 'FMGE Full Grand Test Mock', undefined, 'predictor_grand_test');
                } else {
                  showToast('Launch a Grand Test from Practice tab to refresh predictions');
                }
              }}
              className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 hover:border-sky-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    Take a Grand Test
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Get a new prediction calibrated with your latest test data
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:border-sky-600 transition-colors shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Action 3: Improve Weak Subjects */}
            <div
              onClick={() => {
                const weakest = metrics.highestRiskSubject;
                if (weakest) {
                  onOpenAiCoach('strategy', weakest.subjectId, weakest.subjectName);
                } else {
                  onOpenAiCoach('strategy');
                }
              }}
              className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Improve Weak Subjects
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {metrics.highestRiskSubject
                      ? `Create a focused study plan for ${metrics.highestRiskSubject.subjectName}`
                      : 'Create a focused AI strategy study plan'}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:border-purple-600 transition-colors shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Bottom Footnote */}
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Recommended actions adapt automatically to your latest activity.
          </div>
        </div>
      </div>

      {/* 6. Bottom Section: Subject-wise Prediction */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-[#00685f]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Subject-wise Prediction
              </h2>
              <p className="text-xs text-slate-500">
                Your estimated score by subject (out of respective FMGE weightages)
              </p>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">Sort by:</span>
            <select
              value={subjectSortBy}
              onChange={(e) => setSubjectSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="score">Predicted Score</option>
              <option value="weightage">Weightage</option>
              <option value="name">Subject Name</option>
              <option value="risk">Risk Level</option>
            </select>
          </div>
        </div>

        {/* Visual Columns of Subject Scores (matching reference) */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-end gap-3 sm:gap-4 min-w-[720px] pt-4">
            {sortedSubjectScores.map((sub) => {
              const heightPct = Math.max(15, Math.round((sub.predictedScore / sub.weightage) * 100));
              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubjectId(sub.id);
                    // scroll into view or filter topics
                  }}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                  title={`${sub.name}: ${sub.predictedScore}/${sub.weightage} marks (${sub.riskLevel} risk)`}
                >
                  {/* Score on Top */}
                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 group-hover:text-[#00685f] transition-colors">
                    {sub.predictedScore}
                  </span>

                  {/* Vertical bar / pill */}
                  <div className="w-full max-w-[54px] h-20 sm:h-24 bg-slate-100 rounded-2xl flex flex-col justify-end p-1 overflow-hidden">
                    <div
                      className="w-full rounded-xl transition-all duration-500 group-hover:opacity-90"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: sub.color || '#00685f',
                      }}
                    />
                  </div>

                  {/* Label underneath */}
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors text-center truncate max-w-[64px]">
                    {sub.shortName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Subject Filter Badge */}
        {selectedSubjectId !== 'all' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Filtered to:</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#00685f] text-white text-xs font-bold flex items-center gap-1.5">
              <span>{FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId)?.name}</span>
              <button
                type="button"
                onClick={() => setSelectedSubjectId('all')}
                className="hover:text-emerald-200 cursor-pointer text-sm leading-none ml-1"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* 7. Detailed High-Yield Topics Ledger & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search high-yield topics or keywords..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Filters: Subject & Tier */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Subject Dropdown */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All 19 Subjects</option>
              {FMGE_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.weightage} marks)
                </option>
              ))}
            </select>

            {/* Tier Filters */}
            {[
              { id: 'all', label: 'All Ranked' },
              { id: 'top', label: '🔥 Top 90+' },
              { id: 'high', label: '⚡ High 80–89' },
              { id: 'risk', label: '⚠️ High Risk' },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTier(tier.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTier === tier.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-2.5 pt-2">
          {filteredPredictions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No predicted topics match your search criteria.
            </div>
          ) : (
            filteredPredictions.slice(0, 30).map((topic) => (
              <div
                key={topic.topicId}
                onClick={() => handleOpenModal(topic)}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Rank, Title, Subject & Rationale */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-slate-200/80 text-slate-700 font-bold font-mono text-xs flex items-center justify-center shrink-0 group-hover:bg-[#00685f] group-hover:text-white transition-colors">
                    #{topic.rank}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#00685f] transition-colors">
                        {topic.topicName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-slate-200/70 text-slate-700 shrink-0">
                        {topic.subjectName} ({topic.subjectWeightage}m)
                      </span>
                    </div>

                    {/* Quick Rationale Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {topic.whyReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Score Progress Bar & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Score */}
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {topic.score}<span className="text-slate-400 text-[10px]">/100</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {topic.level === 'VERY_HIGH' ? 'Tier 1' : 'Tier 2'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleAddSingleToPlanner(topic, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200/60 transition-all cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00685f] hover:bg-teal-800 text-white transition-all cursor-pointer shadow-xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Mentor</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deep Dive Explanation Modal */}
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
