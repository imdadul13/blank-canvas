import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Target,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Calendar,
  Layers,
} from 'lucide-react';
import { AppState, TopicItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { calculateSubjectPerformanceMetrics } from '../utils/performanceEngine';

interface SubjectDiagnosticDetailModalProps {
  subjectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
    source?: any
  ) => void;
  onOpenStudyWorkspace?: (subjectId: string) => void;
  onNavigateTab?: (tab: string) => void;
  onUpdateSubjectRevisionDate?: (subjectId: string, date: string) => void;
}

export const SubjectDiagnosticDetailModal: React.FC<SubjectDiagnosticDetailModalProps> = ({
  subjectId,
  isOpen,
  onClose,
  state,
  onLaunchPracticeSession,
  onOpenStudyWorkspace,
  onNavigateTab,
  onUpdateSubjectRevisionDate,
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'weaknesses' | 'strengths'>('overview');

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const subject = useMemo(() => {
    if (!subjectId) return null;
    return FMGE_SUBJECTS.find((s) => s.id === subjectId) || null;
  }, [subjectId]);

  // Real Subject Performance Metrics
  const metrics = useMemo(() => {
    if (!subjectId) return null;
    return calculateSubjectPerformanceMetrics(subjectId, state);
  }, [subjectId, state]);

  // Analyze Weakest and Strongest Topics from Real Metrics
  const topicAnalysis = useMemo(() => {
    if (!subject || !metrics) {
      return {
        weakest: [],
        strongest: [],
        unattemptedHighYield: [],
        repeatedErrors: [],
        highYieldTotal: 0,
        highYieldMastered: 0,
      };
    }

    const customTopics = state.subjectProgress?.[subject.id]?.customTopics || [];
    const allTopics: TopicItem[] = [...subject.topics, ...customTopics];

    const weakest: { topic: TopicItem; metrics: any }[] = [];
    const strongest: { topic: TopicItem; metrics: any }[] = [];
    const unattemptedHighYield: TopicItem[] = [];
    const repeatedErrors: { topic: TopicItem; metrics: any }[] = [];

    let highYieldTotal = 0;
    let highYieldMastered = 0;

    allTopics.forEach((t) => {
      if (t.isHighYield) highYieldTotal++;

      const tMetric = metrics.topicMetrics[t.id];
      if (!tMetric || tMetric.totalAttempts === 0) {
        if (t.isHighYield) {
          unattemptedHighYield.push(t);
        }
        return;
      }

      if (t.isHighYield && tMetric.accuracy >= 75) {
        highYieldMastered++;
      }

      if (tMetric.repeatedErrorsCount >= 1) {
        repeatedErrors.push({ topic: t, metrics: tMetric });
      }

      if (tMetric.accuracy < 60 || tMetric.repeatedErrorsCount >= 1) {
        weakest.push({ topic: t, metrics: tMetric });
      } else if (tMetric.accuracy >= 70 && tMetric.totalAttempts >= 3) {
        strongest.push({ topic: t, metrics: tMetric });
      }
    });

    // Sort weakest by severity (repeated errors first, then lowest accuracy)
    weakest.sort((a, b) => {
      if (b.metrics.repeatedErrorsCount !== a.metrics.repeatedErrorsCount) {
        return b.metrics.repeatedErrorsCount - a.metrics.repeatedErrorsCount;
      }
      return a.metrics.accuracy - b.metrics.accuracy;
    });

    // Sort strongest by accuracy descending
    strongest.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);

    return {
      weakest,
      strongest,
      unattemptedHighYield,
      repeatedErrors,
      highYieldTotal,
      highYieldMastered,
    };
  }, [subject, metrics, state]);

  if (!isOpen || !subject || !metrics) return null;

  const hasAttempts = metrics.totalAttempts > 0;
  const trendDelta = metrics.recentAccuracy - metrics.accuracy;

  // Mastery status styling
  let masteryBadge = {
    label: 'Unattempted',
    style: 'bg-stone-100 text-stone-600 border-stone-200',
  };
  if (hasAttempts) {
    if (metrics.accuracy >= 75) {
      masteryBadge = {
        label: 'Strong',
        style: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      };
    } else if (metrics.accuracy >= 60) {
      masteryBadge = {
        label: 'Developing',
        style: 'bg-amber-50 text-amber-700 border-amber-200/60',
      };
    } else {
      masteryBadge = {
        label: 'Needs Attention',
        style: 'bg-rose-50 text-rose-700 border-rose-200/60',
      };
    }
  }

  // Clinical Diagnostic Summary Synthesis
  const diagnosticPrescription = (() => {
    if (!hasAttempts) {
      return `Zero practice attempts recorded in ${subject.name}. As a ${subject.weightage}-mark discipline on the NBE blueprint, establish your baseline by solving high-yield topics like "${subject.topics[0]?.name || 'core topics'}".`;
    }
    if (topicAnalysis.repeatedErrors.length > 0) {
      return `Critical repeat error cluster identified across ${topicAnalysis.repeatedErrors.length} topic${topicAnalysis.repeatedErrors.length > 1 ? 's' : ''} (${topicAnalysis.repeatedErrors[0].topic.name}). Resolve these specific mistake patterns before taking your next mock exam.`;
    }
    if (metrics.accuracy < 50) {
      return `Current accuracy (${metrics.accuracy}%) sits below the 50% FMGE pass threshold. Immediate reinforcement needed on foundational principles and high-yield questions.`;
    }
    if (metrics.accuracy < 70) {
      return `Solid foundational grasp (${metrics.accuracy}%), but recent trend shows room for refinement. Drill clinical vignettes to push past 70%.`;
    }
    return `Excellent command (${metrics.accuracy}%) exceeding NBE standards. Maintain retention through spaced revision intervals.`;
  })();

  const topWeakTopic =
    topicAnalysis.weakest.length > 0
      ? topicAnalysis.weakest[0].topic
      : topicAnalysis.unattemptedHighYield.length > 0
      ? topicAnalysis.unattemptedHighYield[0]
      : subject.topics[0];

  const handleStartDrill = (topicId: string, topicName: string) => {
    onClose();
    onLaunchPracticeSession?.(
      subject.id,
      topicId,
      topicName,
      undefined,
      'recommended_video_practice'
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-[#DCE4E1] shadow-xl overflow-hidden my-auto text-[#121E1B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 sm:px-8 border-b border-[#EAEFEA] bg-[#FAF9F5]">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#00685f]">
                SUBJECT DIAGNOSTIC ROADMAP
              </span>
              <span className="w-1 h-1 rounded-full bg-[#00685f]/40" />
              <span className="text-xs font-mono text-stone-500 uppercase">
                {subject.phase}
              </span>
              <span className="w-1 h-1 rounded-full bg-stone-300" />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-[#00685f] border border-teal-200/60">
                {subject.weightage} MARKS WEIGHTAGE
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold font-['Newsreader'] tracking-tight text-[#121E1B] truncate">
                {subject.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${masteryBadge.style}`}>
                {masteryBadge.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Diagnostic performance breakdown and targeted clinical prescription for FMGE preparation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Overall Accuracy */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Overall Accuracy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {hasAttempts ? `${metrics.accuracy}%` : '—'}
                </span>
                {hasAttempts && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      trendDelta >= 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {trendDelta >= 0 ? `+${trendDelta}%` : `${trendDelta}%`}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                {hasAttempts ? `Recent: ${metrics.recentAccuracy}%` : 'Calibrating'}
              </span>
            </div>

            {/* 2. Questions Solved */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Questions Solved
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {metrics.totalAttempts}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                {subject.topics.length} topics total
              </span>
            </div>

            {/* 3. Repeated Errors */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Repeated Errors
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {metrics.repeatedErrorsCount}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                {metrics.repeatedErrorsCount > 0 ? 'Concepts missed ≥2x' : 'Zero repeated errors'}
              </span>
            </div>

            {/* 4. High-Yield Mastery */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                High-Yield Focus
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {topicAnalysis.highYieldMastered}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  / {topicAnalysis.highYieldTotal}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                Topics $\ge 75\%$ accuracy
              </span>
            </div>
          </div>

          {/* Clinical Diagnostic Prescription Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00685f]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685f]">
                CLINICAL DIAGNOSIS & ACTION PLAN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {diagnosticPrescription}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {topWeakTopic && (
                <button
                  type="button"
                  onClick={() => handleStartDrill(topWeakTopic.id, topWeakTopic.name)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#00685f] hover:bg-[#005049] text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Start 10-MCQ Drill ({topWeakTopic.name.split(' - ')[0] || topWeakTopic.name})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudyWorkspace?.(subject.id);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-stone-200 hover:border-[#00685f] text-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#00685f]" />
                <span>Open Study Notes</span>
              </button>
            </div>
          </div>

          {/* Sub-view Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            {[
              {
                id: 'overview',
                label: `Weakness Diagnosis (${topicAnalysis.weakest.length + topicAnalysis.unattemptedHighYield.length})`,
              },
              {
                id: 'strengths',
                label: `Mastered & Strong Areas (${topicAnalysis.strongest.length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeView === tab.id
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Weakness Diagnosis */}
          {activeView === 'overview' && (
            <div className="space-y-4">
              {topicAnalysis.weakest.length > 0 || topicAnalysis.unattemptedHighYield.length > 0 ? (
                <div className="space-y-2.5">
                  {/* Repeated Error Topics */}
                  {topicAnalysis.repeatedErrors.map(({ topic, metrics: tm }) => (
                    <div
                      key={topic.id}
                      className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            REPEATED ERROR ({tm.repeatedErrorsCount}x)
                          </span>
                          {topic.isHighYield && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-600">
                              HIGH-YIELD
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {topic.name}
                          </h4>
                        </div>
                        <p className="text-xs text-stone-500 font-mono">
                          Accuracy: {tm.accuracy}% · {tm.totalAttempts} attempted · {tm.avgResponseTimeSeconds}s pace
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartDrill(topic.id, topic.name)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                      >
                        <span>Fix Repeat Error</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Other Weak Topics (accuracy < 60%) */}
                  {topicAnalysis.weakest
                    .filter((w) => w.metrics.repeatedErrorsCount === 0)
                    .map(({ topic, metrics: tm }) => (
                      <div
                        key={topic.id}
                        className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                              LOW ACCURACY ({tm.accuracy}%)
                            </span>
                            {topic.isHighYield && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-600">
                                HIGH-YIELD
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-stone-900 truncate">
                              {topic.name}
                            </h4>
                          </div>
                          <p className="text-xs text-stone-500 font-mono">
                            {tm.totalAttempts} attempted · {tm.correctAnswers} correct · {tm.avgResponseTimeSeconds}s response pace
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartDrill(topic.id, topic.name)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-stone-200 hover:border-[#00685f] hover:bg-stone-50 text-[#00685f] transition-all cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <span>Drill 10 MCQs</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                  {/* High-Yield Unattempted Topics */}
                  {topicAnalysis.unattemptedHighYield.map((topic) => (
                    <div
                      key={topic.id}
                      className="p-3.5 rounded-2xl bg-teal-50/40 border border-teal-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-[#00685f]">
                            HIGH-YIELD GAP
                          </span>
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {topic.name}
                          </h4>
                        </div>
                        <p className="text-xs text-stone-500 font-mono">
                          Unattempted · High probability of appearance on exam day
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartDrill(topic.id, topic.name)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#00685f] text-[#00685f] hover:bg-[#00685f] hover:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <span>Establish Baseline</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-bold text-stone-800">No Critical Weaknesses Detected</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    All attempted topics in {subject.name} currently maintain passing accuracy with zero repeated error clusters.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Strong Areas */}
          {activeView === 'strengths' && (
            <div className="space-y-2.5">
              {topicAnalysis.strongest.length > 0 ? (
                topicAnalysis.strongest.map(({ topic, metrics: tm }) => (
                  <div
                    key={topic.id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {tm.accuracy}% ACCURACY
                        </span>
                        {topic.isHighYield && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-600">
                            HIGH-YIELD
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-stone-900 truncate">
                          {topic.name}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-400 font-mono">
                        {tm.totalAttempts} questions solved · Solidified retention
                      </p>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 font-mono shrink-0">
                      Retained
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-4">
                  <Sparkles className="w-8 h-8 text-stone-300 mx-auto" />
                  <h4 className="text-xs font-bold text-stone-700">Solidifying Command</h4>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    Solve $\ge 5$ questions per topic with $\ge 70\%$ accuracy to establish confirmed mastery in {subject.name}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-[#EAEFEA] bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {metrics.repeatedErrorsCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.('errors');
                }}
                className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>View {metrics.repeatedErrorsCount} Errors in Vault</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
            >
              Close Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
