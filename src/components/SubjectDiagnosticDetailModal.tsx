import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Target,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  Zap,
  TrendingUp,
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
    color: '#8E8E93',
    bg: '#F2F2F7',
    border: '#E5E5EA',
  };
  if (hasAttempts) {
    if (metrics.accuracy >= 75) {
      masteryBadge = {
        label: 'Strong',
        color: '#1A7A3C',
        bg: '#E8FAF0',
        border: '#A8E6C3',
      };
    } else if (metrics.accuracy >= 60) {
      masteryBadge = {
        label: 'Developing',
        color: '#A05C00',
        bg: '#FFF4E0',
        border: '#FFD699',
      };
    } else {
      masteryBadge = {
        label: 'Needs Attention',
        color: '#C0392B',
        bg: '#FFEEEC',
        border: '#FFBBB7',
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

  const tabs = [
    {
      id: 'overview',
      label: `Weakness Diagnosis`,
      count: topicAnalysis.weakest.length + topicAnalysis.unattemptedHighYield.length,
    },
    {
      id: 'strengths',
      label: `Strong Areas`,
      count: topicAnalysis.strongest.length,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9100,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
      }}
      className="flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header (shrink-0) ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-[#E5E5EA] bg-white">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#007AFF' }}
              >
                Subject Diagnostic
              </span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#C7C7CC' }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8E8E93]">
                {subject.phase}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ color: '#007AFF', backgroundColor: '#EAF3FF', borderColor: '#B3D4FF' }}
              >
                {subject.weightage} marks
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] truncate">
                {subject.name}
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                style={{
                  color: masteryBadge.color,
                  backgroundColor: masteryBadge.bg,
                  borderColor: masteryBadge.border,
                }}
              >
                {masteryBadge.label}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-4 shrink-0 p-2 rounded-full transition-colors cursor-pointer"
            style={{ backgroundColor: '#F2F2F7', color: '#8E8E93' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E5EA';
              (e.currentTarget as HTMLButtonElement).style.color = '#1D1D1F';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F2F2F7';
              (e.currentTarget as HTMLButtonElement).style.color = '#8E8E93';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ maxHeight: '72vh' }}
        >
          <div className="p-6 space-y-5">
            {/* ── 4 Metric Tiles: 2×2 grid ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Overall Accuracy */}
              <div
                className="p-4 rounded-2xl border-l-4 space-y-1.5"
                style={{
                  backgroundColor: '#EAF3FF',
                  borderLeftColor: '#007AFF',
                  borderTop: '1px solid #B3D4FF',
                  borderRight: '1px solid #B3D4FF',
                  borderBottom: '1px solid #B3D4FF',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#007AFF' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#007AFF' }}>
                    Overall Accuracy
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold" style={{ color: '#1D1D1F' }}>
                    {hasAttempts ? `${metrics.accuracy}%` : '—'}
                  </span>
                  {hasAttempts && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: trendDelta >= 0 ? '#E8FAF0' : '#FFEEEC',
                        color: trendDelta >= 0 ? '#1A7A3C' : '#C0392B',
                      }}
                    >
                      {trendDelta >= 0 ? `+${trendDelta}%` : `${trendDelta}%`}
                    </span>
                  )}
                </div>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>
                  {hasAttempts ? `Recent: ${metrics.recentAccuracy}%` : 'Calibrating…'}
                </span>
              </div>

              {/* 2. Questions Solved */}
              <div
                className="p-4 rounded-2xl border-l-4 space-y-1.5"
                style={{
                  backgroundColor: '#E8FAF0',
                  borderLeftColor: '#30D158',
                  borderTop: '1px solid #A8E6C3',
                  borderRight: '1px solid #A8E6C3',
                  borderBottom: '1px solid #A8E6C3',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#30D158' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#1A7A3C' }}>
                    Questions Solved
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold" style={{ color: '#1D1D1F' }}>
                    {metrics.totalAttempts}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>
                  {subject.topics.length} topics total
                </span>
              </div>

              {/* 3. Repeated Errors */}
              <div
                className="p-4 rounded-2xl border-l-4 space-y-1.5"
                style={{
                  backgroundColor: metrics.repeatedErrorsCount > 0 ? '#FFEEEC' : '#F2F2F7',
                  borderLeftColor: metrics.repeatedErrorsCount > 0 ? '#FF3B30' : '#C7C7CC',
                  borderTop: `1px solid ${metrics.repeatedErrorsCount > 0 ? '#FFBBB7' : '#E5E5EA'}`,
                  borderRight: `1px solid ${metrics.repeatedErrorsCount > 0 ? '#FFBBB7' : '#E5E5EA'}`,
                  borderBottom: `1px solid ${metrics.repeatedErrorsCount > 0 ? '#FFBBB7' : '#E5E5EA'}`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" style={{ color: metrics.repeatedErrorsCount > 0 ? '#FF3B30' : '#8E8E93' }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: metrics.repeatedErrorsCount > 0 ? '#C0392B' : '#8E8E93' }}
                  >
                    Repeated Errors
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold" style={{ color: '#1D1D1F' }}>
                    {metrics.repeatedErrorsCount}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>
                  {metrics.repeatedErrorsCount > 0 ? 'Concepts missed ≥2×' : 'Zero repeated errors'}
                </span>
              </div>

              {/* 4. High-Yield Mastery */}
              <div
                className="p-4 rounded-2xl border-l-4 space-y-1.5"
                style={{
                  backgroundColor: '#F3F0FF',
                  borderLeftColor: '#5856D6',
                  borderTop: '1px solid #C9C7F0',
                  borderRight: '1px solid #C9C7F0',
                  borderBottom: '1px solid #C9C7F0',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" style={{ color: '#5856D6' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5856D6' }}>
                    High-Yield Mastered
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold" style={{ color: '#1D1D1F' }}>
                    {topicAnalysis.highYieldMastered}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#8E8E93' }}>
                    /{topicAnalysis.highYieldTotal}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: '#8E8E93' }}>
                  Topics at ≥75% accuracy
                </span>
              </div>
            </div>

            {/* ── Clinical Prescription Banner ── */}
            <div
              className="p-5 rounded-2xl space-y-3"
              style={{
                background: 'linear-gradient(135deg, #FFF4E0 0%, #EAF3FF 100%)',
                border: '1px solid #FFD699',
              }}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" style={{ color: '#FF9500' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A05C00' }}>
                  Clinical Diagnosis & Action Plan
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#1D1D1F' }}>
                {diagnosticPrescription}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {topWeakTopic && (
                  <button
                    type="button"
                    onClick={() => handleStartDrill(topWeakTopic.id, topWeakTopic.name)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1.5 transition-opacity cursor-pointer hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: '#007AFF' }}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Start Drill — {topWeakTopic.name.split(' - ')[0]}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyWorkspace?.(subject.id);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: 'white',
                    color: '#1D1D1F',
                    border: '1.5px solid #E5E5EA',
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5" style={{ color: '#007AFF' }} />
                  <span>Open Study Notes</span>
                </button>
              </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div
              className="flex items-center gap-1.5 pb-1"
              style={{ borderBottom: '1.5px solid #E5E5EA' }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id as any)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  style={
                    activeView === tab.id
                      ? { backgroundColor: '#1D1D1F', color: 'white' }
                      : { backgroundColor: '#F2F2F7', color: '#8E8E93' }
                  }
                >
                  <span>{tab.label}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={
                      activeView === tab.id
                        ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }
                        : { backgroundColor: '#E5E5EA', color: '#8E8E93' }
                    }
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Tab: Weakness Diagnosis ── */}
            {activeView === 'overview' && (
              <div className="space-y-2.5">
                {topicAnalysis.weakest.length > 0 || topicAnalysis.unattemptedHighYield.length > 0 ? (
                  <>
                    {/* Repeated Error Topics */}
                    {topicAnalysis.repeatedErrors.map(({ topic, metrics: tm }) => (
                      <div
                        key={topic.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl"
                        style={{
                          backgroundColor: '#FFEEEC',
                          borderLeft: '4px solid #FF3B30',
                          border: '1px solid #FFBBB7',
                          borderLeftWidth: '4px',
                        }}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ backgroundColor: '#FF3B30', color: 'white' }}
                            >
                              Repeated Error ×{tm.repeatedErrorsCount}
                            </span>
                            {topic.isHighYield && (
                              <span
                                className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                                style={{ backgroundColor: '#F3F0FF', color: '#5856D6' }}
                              >
                                High-Yield
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">{topic.name}</h4>
                          <p className="text-[11px]" style={{ color: '#8E8E93' }}>
                            {tm.accuracy}% accuracy · {tm.totalAttempts} attempted · {tm.avgResponseTimeSeconds}s pace
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartDrill(topic.id, topic.name)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#FF3B30' }}
                          >
                            <span>Start Drill</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenStudyWorkspace?.(subject.id);
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:opacity-80"
                            style={{
                              backgroundColor: 'white',
                              color: '#1D1D1F',
                              border: '1px solid #E5E5EA',
                            }}
                          >
                            <BookOpen className="w-3 h-3" style={{ color: '#007AFF' }} />
                            <span>Open Study</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Other Weak Topics (accuracy < 60%, no repeated errors) */}
                    {topicAnalysis.weakest
                      .filter((w) => w.metrics.repeatedErrorsCount === 0)
                      .map(({ topic, metrics: tm }) => (
                        <div
                          key={topic.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl"
                          style={{
                            backgroundColor: '#FFF4E0',
                            border: '1px solid #FFD699',
                            borderLeftWidth: '4px',
                            borderLeftColor: '#FF9500',
                          }}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                style={{ backgroundColor: '#FF9500', color: 'white' }}
                              >
                                Low Accuracy {tm.accuracy}%
                              </span>
                              {topic.isHighYield && (
                                <span
                                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                                  style={{ backgroundColor: '#F3F0FF', color: '#5856D6' }}
                                >
                                  High-Yield
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">{topic.name}</h4>
                            <p className="text-[11px]" style={{ color: '#8E8E93' }}>
                              {tm.totalAttempts} attempted · {tm.correctAnswers} correct · {tm.avgResponseTimeSeconds}s pace
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartDrill(topic.id, topic.name)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-90"
                              style={{ backgroundColor: '#FF9500' }}
                            >
                              <span>Start Drill</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenStudyWorkspace?.(subject.id);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:opacity-80"
                              style={{
                                backgroundColor: 'white',
                                color: '#1D1D1F',
                                border: '1px solid #E5E5EA',
                              }}
                            >
                              <BookOpen className="w-3 h-3" style={{ color: '#007AFF' }} />
                              <span>Open Study</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {/* High-Yield Unattempted */}
                    {topicAnalysis.unattemptedHighYield.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl"
                        style={{
                          backgroundColor: '#EAF3FF',
                          border: '1px solid #B3D4FF',
                          borderLeftWidth: '4px',
                          borderLeftColor: '#007AFF',
                        }}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ backgroundColor: '#007AFF', color: 'white' }}
                            >
                              High-Yield Gap
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">{topic.name}</h4>
                          <p className="text-[11px]" style={{ color: '#8E8E93' }}>
                            Unattempted · High probability on exam day
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartDrill(topic.id, topic.name)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#007AFF' }}
                          >
                            <span>Start Drill</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenStudyWorkspace?.(subject.id);
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:opacity-80"
                            style={{
                              backgroundColor: 'white',
                              color: '#1D1D1F',
                              border: '1px solid #E5E5EA',
                            }}
                          >
                            <BookOpen className="w-3 h-3" style={{ color: '#007AFF' }} />
                            <span>Open Study</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  /* Empty state — no weaknesses */
                  <div
                    className="py-12 flex flex-col items-center text-center space-y-4 rounded-2xl"
                    style={{
                      backgroundColor: '#F2F2F7',
                      border: '1.5px dashed #C7C7CC',
                    }}
                  >
                    {/* Illustrated empty state */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#E8FAF0' }}
                    >
                      <CheckCircle2 className="w-8 h-8" style={{ color: '#30D158' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1D1D1F]">No Critical Weaknesses Detected</h4>
                      <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed" style={{ color: '#8E8E93' }}>
                        All attempted topics in {subject.name} maintain passing accuracy with zero repeated error clusters.
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: '#E8FAF0', color: '#1A7A3C' }}
                    >
                      Keep up the great work!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Strong Areas ── */}
            {activeView === 'strengths' && (
              <div className="space-y-2.5">
                {topicAnalysis.strongest.length > 0 ? (
                  topicAnalysis.strongest.map(({ topic, metrics: tm }) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between gap-3 p-4 rounded-2xl"
                      style={{
                        backgroundColor: '#E8FAF0',
                        border: '1px solid #A8E6C3',
                        borderLeftWidth: '4px',
                        borderLeftColor: '#30D158',
                      }}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ backgroundColor: '#30D158', color: 'white' }}
                          >
                            {tm.accuracy}% Accuracy
                          </span>
                          {topic.isHighYield && (
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ backgroundColor: '#F3F0FF', color: '#5856D6' }}
                            >
                              High-Yield
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">{topic.name}</h4>
                        <p className="text-[11px]" style={{ color: '#8E8E93' }}>
                          {tm.totalAttempts} questions solved · Solidified retention
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold shrink-0 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'white', color: '#1A7A3C', border: '1px solid #A8E6C3' }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Retained</span>
                      </span>
                    </div>
                  ))
                ) : (
                  /* Empty state — no strong areas */
                  <div
                    className="py-12 flex flex-col items-center text-center space-y-4 rounded-2xl"
                    style={{
                      backgroundColor: '#F2F2F7',
                      border: '1.5px dashed #C7C7CC',
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#F3F0FF' }}
                    >
                      <ShieldCheck className="w-8 h-8" style={{ color: '#5856D6' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1D1D1F]">Solidifying Command</h4>
                      <p className="text-xs mt-1 max-w-xs mx-auto leading-relaxed" style={{ color: '#8E8E93' }}>
                        Solve ≥5 questions per topic with ≥70% accuracy to establish confirmed mastery in {subject.name}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer (shrink-0) ── */}
        <div
          className="shrink-0 flex items-center justify-between gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #E5E5EA', backgroundColor: '#F2F2F7' }}
        >
          <div className="flex items-center gap-3">
            {metrics.repeatedErrorsCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.('errors');
                }}
                className="text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: '#FF3B30' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>View {metrics.repeatedErrorsCount} Error{metrics.repeatedErrorsCount !== 1 ? 's' : ''} in Vault</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold text-white cursor-pointer transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
