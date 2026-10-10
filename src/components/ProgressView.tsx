import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Award,
  Compass,
  BookOpen,
  Search,
  Activity,
  Brain,
  Layers,
  Eye,
  Calendar,
  Target,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { AppState, DailyTask, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import {
  calculateOverallPerformance,
  calculateSubjectPerformanceMetrics,
  calculateImagePerformanceSummary,
} from '../utils/performanceEngine';
import { calculateStudyReadiness } from '../utils/readinessEngine';
import { getTopPriorityTopics } from '../utils/adaptivePriorityEngine';
import { ReadinessBreakdownModal } from './ReadinessBreakdownModal';
import { SubjectDiagnosticDetailModal } from './SubjectDiagnosticDetailModal';
import { TopicMasteryDetailModal } from './TopicMasteryDetailModal';
import { AccuracyTrendDetailModal } from './AccuracyTrendDetailModal';
import { GrandTestDiagnosticModal } from './GrandTestDiagnosticModal';
import { ErrorVaultDiagnosticModal } from './ErrorVaultDiagnosticModal';
import { ErrorsView } from './ErrorsView';
import { FmgePredictorView } from './FmgePredictorView';

interface ProgressViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onAddTask?: (task: DailyTask) => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onUpdateSubjectRevisionDate?: (subjectId: string, date: string) => void;
  onNavigateTab?: (tab: string) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
    source?: any
  ) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed?: (id: string) => void;
  onDeleteErrorItem?: (id: string) => void;
  onUpdateAppState?: (updater: (prev: AppState) => AppState) => void;
  subTab?: 'overview' | 'errors' | 'predictor';
  onSubTabChange?: (tab: 'overview' | 'errors' | 'predictor') => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onAddTask,
  onOpenAiCoach,
  onUpdateSubjectRevisionDate,
  onNavigateTab,
  onLaunchPracticeSession,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onUpdateAppState,
  subTab,
  onSubTabChange,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'errors' | 'predictor'>(
    subTab || 'overview'
  );
  React.useEffect(() => { if (subTab) setCurrentSubTab(subTab); }, [subTab]);

  const handleSubTabChange = (tab: 'overview' | 'errors' | 'predictor') => {
    setCurrentSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'clinical' | 'preclinical' | 'paraclinical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [selectedDiagnosticSubjectId, setSelectedDiagnosticSubjectId] = useState<string | null>(null);
  const [isTopicMasteryModalOpen, setIsTopicMasteryModalOpen] = useState(false);
  const [isAccuracyTrendModalOpen, setIsAccuracyTrendModalOpen] = useState(false);
  const [isGrandTestModalOpen, setIsGrandTestModalOpen] = useState(false);
  const [isErrorVaultModalOpen, setIsErrorVaultModalOpen] = useState(false);

  const readiness = useMemo(() => calculateStudyReadiness(state), [state]);
  const overallPerf = useMemo(() => calculateOverallPerformance(state), [state]);
  const hasPerformanceHistory = overallPerf.totalAttempts > 0 || (state.errorNotebook?.length || 0) > 0;
  const topPriorityTopics = useMemo(() => getTopPriorityTopics(state, 4), [state]);
  const imageSummary = useMemo(() => calculateImagePerformanceSummary(state), [state]);

  const subjectList = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      let disciplineType: 'clinical' | 'preclinical' | 'paraclinical' = 'clinical';
      if (sub.phase === 'pre-clinical') disciplineType = 'preclinical';
      else if (sub.phase === 'para-clinical') disciplineType = 'paraclinical';
      const metrics = overallPerf.subjectMetrics?.[sub.id] || calculateSubjectPerformanceMetrics(sub.id, state);
      return { ...sub, disciplineType, metrics };
    });
  }, [overallPerf.subjectMetrics, state]);

  const filteredSubjects = useMemo(() => {
    return subjectList.filter((s) => {
      if (selectedDiscipline !== 'all' && s.disciplineType !== selectedDiscipline) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [subjectList, selectedDiscipline, searchQuery]);

  const counts = useMemo(() => ({
    all: subjectList.length,
    clinical: subjectList.filter((s) => s.disciplineType === 'clinical').length,
    paraclinical: subjectList.filter((s) => s.disciplineType === 'paraclinical').length,
    preclinical: subjectList.filter((s) => s.disciplineType === 'preclinical').length,
  }), [subjectList]);

  const accuracyTrendPoints = useMemo(() => {
    const attempts = state.mcqAttempts || [];
    if (attempts.length < 2) return [];
    const sorted = [...attempts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const chunkSize = Math.max(3, Math.floor(sorted.length / 6));
    const points: { label: string; accuracy: number; count: number }[] = [];
    for (let i = 0; i < sorted.length; i += chunkSize) {
      const chunk = sorted.slice(i, i + chunkSize);
      const correct = chunk.filter((a) => a.isCorrect).length;
      const acc = Math.round((correct / chunk.length) * 100);
      const dateStr = new Date(chunk[chunk.length - 1].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({ label: dateStr, accuracy: acc, count: chunk.length });
    }
    return points.slice(-6);
  }, [state.mcqAttempts]);

  const grandTests = useMemo(() => {
    const gts = Array.isArray(state.grandTests) ? state.grandTests : [];
    return [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.grandTests]);
  const latestGT = grandTests.length > 0 ? grandTests[grandTests.length - 1] : null;

  const formattedToday = useMemo(() => new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), []);

  const readinessStage = useMemo(() => {
    if (readiness.score === null || readiness.score === undefined) {
      return { label: 'Baseline needed', color: '#8E8E93' };
    }
    const s = readiness.score;
    if (s >= 75) return { label: 'Exam Ready', color: '#30D158' };
    if (s >= 50) return { label: 'Developing', color: '#FF9500' };
    return { label: 'Needs Focus', color: '#FF3B30' };
  }, [readiness.score]);

  const accuracyDelta = overallPerf.recentAccuracy - overallPerf.overallAccuracy;

  // Pillar icon map
  const pillarIcons: Record<string, React.ElementType> = {
    accuracy: Target,
    time: Clock,
    concept: Brain,
    practice: Activity,
    notes: BookOpen,
    revision: RotateCcw,
    coverage: CheckCircle2,
    streak: Flame,
  };

  return (
    <div data-accent="performance" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-20 lg:pb-16 space-y-5 font-['Plus_Jakarta_Sans'] text-[#1D1D1F]">

      {/* ── HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className={`relative rounded-3xl overflow-hidden ${currentSubTab === 'overview' ? 'premium-page-hero' : 'bg-transparent'}`}
        style={{
          background: currentSubTab === 'overview' ? 'linear-gradient(135deg, #EAF8FF 0%, #C2EAFE 40%, #80D4F8 70%, #5AC8FA 100%)' : 'transparent',
          boxShadow: currentSubTab === 'overview' ? '0 8px 40px rgba(90,200,250,0.18), 0 2px 8px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        {currentSubTab === 'overview' && <>
        {/* Decorative right glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(90,200,250,0.35) 0%, transparent 70%)' }} />
        {/* Top inner shine */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

        </>}

        <div className={`relative z-10 px-1 ${currentSubTab === 'overview' ? 'sm:px-7 py-5 space-y-4' : 'py-1'}`}>
          {currentSubTab === 'overview' && <>
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl border flex items-center justify-center"
                  style={{ background: 'rgba(90,200,250,0.15)', borderColor: 'rgba(0,90,130,0.2)' }}>
                  <BarChart3 className="h-3.5 w-3.5" style={{ color: '#0A5A7A' }} />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0A5A7A' }}>
                  Analyze · Identify · Improve
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[28px] font-black tracking-tight leading-tight text-[#1D1D1F]">
                Performance &amp; Diagnostics
              </h1>
              <p className="text-[12px] max-w-lg leading-relaxed" style={{ color: '#3A3A3C' }}>
                Diagnose preparation depth, clinical accuracy, and high-yield retention across all 19 FMGE subjects.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold"
                style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(0,90,130,0.15)', color: '#3A3A3C' }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#0A5A7A' }} />
                {formattedToday}
              </span>
            </div>
          </div>
          </>}

          {/* Sub-tab switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl w-fit backdrop-blur-md border border-white/80 shadow-sm"
            style={{ background: currentSubTab === 'overview' ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.82)' }}>
            {([
              { id: 'overview' as const, label: 'Overview', icon: BarChart3, badge: undefined as number | undefined },
              { id: 'errors' as const, label: 'Error Vault', icon: AlertTriangle, badge: state.errorNotebook?.length },
              { id: 'predictor' as const, label: 'Score Predictor', icon: TrendingUp, badge: undefined as number | undefined },
            ]).map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSubTabChange(id)}
                aria-pressed={currentSubTab === id}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                  currentSubTab === id ? 'text-[#1D1D1F]' : 'text-[#3A3A3C]/70 hover:text-[#1D1D1F]'
                }`}
              >
                {currentSubTab === id && (
                  <motion.div
                    layoutId="perf-tab-pill"
                    className="absolute inset-0 rounded-xl bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${currentSubTab === id ? 'text-[#5AC8FA]' : ''}`} />
                  {label}
                  {badge != null && badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono ${
                      currentSubTab === id ? 'bg-[#FF3B30]/15 text-[#FF3B30]' : 'bg-[#FF3B30]/20 text-[#FF3B30]'
                    }`}>{badge}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {currentSubTab === 'overview' && (
        <>
          {/* ── READINESS COMMAND ── */}
          <section className="premium-readiness-card relative rounded-3xl overflow-hidden">
            {/* Radial glow */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 80% 40%, ${readinessStage.color}18 0%, transparent 65%)` }} />

            <div className={`relative z-10 ${readiness.score == null ? 'p-4 sm:p-6' : 'p-6 sm:p-8'}`}>
              <div className={`${readiness.score == null ? 'flex flex-row items-center gap-4' : 'flex flex-col lg:flex-row lg:items-center gap-8'}`}>
                {/* Gauge */}
                  <div className={`flex flex-col items-center shrink-0 ${readiness.score == null ? 'gap-2' : 'gap-4'}`}>
                    <div className="relative">
                    <svg width="160" height="160" viewBox="0 0 160 160" className={`-rotate-90 ${readiness.score == null ? 'h-28 w-28' : ''}`}>
                      <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(60,60,67,0.08)" strokeWidth="13" />
                      <circle cx="80" cy="80" r="66" fill="none"
                        stroke={readinessStage.color} strokeWidth="13" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 66}
                        strokeDashoffset={2 * Math.PI * 66 * (1 - (readiness.score ?? 0) / 100)}
                        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)', filter: readiness.score == null ? 'none' : `drop-shadow(0 0 8px ${readinessStage.color}35)` }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`${readiness.score == null ? 'text-[36px]' : 'text-[54px]'} font-black font-mono text-[#1D1D1F] leading-none`}>{readiness.score ?? '—'}</span>
                      <span className="text-[12px] text-[#8E8E93] font-mono font-bold tracking-wider">{readiness.score == null ? 'START HERE' : '/ 100'}</span>
                    </div>
                  </div>
                  <div className={`flex flex-col items-center ${readiness.score == null ? 'gap-1.5' : 'gap-2.5'}`}>
                    <span className={`px-4 py-1.5 rounded-full text-[13px] font-bold ${readiness.score == null ? 'text-[#6E6E73]' : 'text-white'}`}
                      style={{ background: readiness.score == null ? '#F2F2F7' : readinessStage.color, boxShadow: readiness.score == null ? 'none' : `0 2px 8px ${readinessStage.color}30` }}>
                      {readinessStage.label}
                    </span>
                    <button type="button" onClick={() => setIsReadinessModalOpen(true)}
                      className="text-[11px] font-bold text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer transition-colors flex items-center gap-1">
                      Full Breakdown <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Right: summary + 8-pillar grid */}
                <div className={`flex-1 min-w-0 ${readiness.score == null ? 'space-y-3' : 'space-y-5'}`}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8E8E93]">FMGE Readiness · {formattedToday}</p>
                    <p className="text-[14px] text-[#6E6E73] leading-relaxed max-w-lg">{readiness.summaryText}</p>
                  </div>
                  <details open={readiness.score != null} className="group/readiness">
                    <summary className="mb-2 inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-[rgba(60,60,67,0.1)] bg-white/75 px-3 text-[11px] font-semibold text-[#6E6E73] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40">
                      Readiness areas <span className="font-mono text-[#8E8E93]">{readiness.components.length}</span>
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/readiness:rotate-180" />
                    </summary>
                    <div className={`grid grid-cols-2 sm:grid-cols-4 ${readiness.score == null ? 'gap-1.5' : 'gap-2'}`}>
                    {readiness.components.map((comp) => {
                      const scoreVal = comp.status === 'no_data' ? 0 : comp.score;
                      const isGood = comp.status === 'good';
                      const isMod = comp.status === 'moderate' || comp.status === 'neutral';
                      const dotColor = comp.status === 'no_data' ? '#AEAEB2' : isGood ? '#30D158' : isMod ? '#FF9500' : '#FF3B30';
                      return (
                        <div key={comp.id} className={`${readiness.score == null ? 'p-2 rounded-xl space-y-0.5' : 'p-3 rounded-2xl space-y-2.5'}`}
                          style={{ background: 'var(--color-surface-sunken)', border: '1px solid var(--color-hairline-soft)' }}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-[#6E6E73] truncate">{comp.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor, boxShadow: readiness.score == null ? 'none' : `0 0 6px ${dotColor}` }} />
                          </div>
                          {readiness.score == null ? (
                            <span className="text-[10px] font-medium text-[#8E8E93]">Not tracked yet</span>
                          ) : (
                            <>
                              <div className="text-[22px] font-black font-mono text-[#1D1D1F] leading-none">{comp.status === 'no_data' ? '—' : scoreVal}</div>
                              <div className="h-[3px] rounded-full" style={{ background: 'var(--color-surface-muted)' }}>
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${scoreVal}%`, background: dotColor }} />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </section>

          {/* ── PERFORMANCE SNAPSHOT ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-black text-[#1D1D1F]">Performance Snapshot</h2>
              <span className="text-[10px] font-mono font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-lg border border-[#007AFF]/20 uppercase tracking-wide">Updated from your activity</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Hero accuracy tile — full color */}
              <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="col-span-2 lg:col-span-1 p-5 rounded-2xl relative overflow-hidden cursor-default"
                style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0148C4 100%)', boxShadow: '0 8px 28px rgba(0,122,255,0.30)' }}>
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Overall Accuracy</span>
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[38px] font-black font-mono text-white leading-none">
                      {overallPerf.totalAttempts > 0 ? `${overallPerf.overallAccuracy}%` : '—'}
                    </span>
                    {overallPerf.totalAttempts > 0 && (
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-white/15 text-white">
                        {accuracyDelta >= 0 ? `+${accuracyDelta}%` : `${accuracyDelta}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/55">
                    {overallPerf.totalAttempts > 0 ? `Recent 15: ${overallPerf.recentAccuracy}%` : 'Complete drills to see baseline'}
                  </p>
                </div>
              </motion.div>

              {[
                { label: 'Questions', value: overallPerf.totalAttempts.toLocaleString(), sub: 'QBank · Grand Tests · Practice', icon: Activity, color: '#30D158' },
                { label: 'Avg. Time', value: overallPerf.avgResponseTimeSeconds > 0 ? `${overallPerf.avgResponseTimeSeconds}s` : '—', sub: overallPerf.avgResponseTimeSeconds > 0 ? (overallPerf.avgResponseTimeSeconds <= 60 ? 'Optimal pace ≤60s' : 'Target ≤60s / Q') : 'Target 60s per question', icon: Clock, color: '#FF9500' },
                { label: 'Repeat Errors', value: String(overallPerf.totalRepeatedErrors), sub: overallPerf.totalRepeatedErrors > 0 ? 'Missed ≥2 times' : 'Zero repeated errors', icon: AlertTriangle, color: overallPerf.totalRepeatedErrors > 0 ? '#FF3B30' : '#8E8E93' },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <motion.div key={label} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-5 rounded-2xl border bg-white space-y-3 cursor-default"
                  style={{ borderColor: 'rgba(60,60,67,0.1)', borderTop: `3px solid ${color}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">{label}</span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                  </div>
                  <div className="text-[32px] font-black font-mono leading-none" style={{ color }}>{value}</div>
                  <p className="text-[11px] text-[#8E8E93]">{sub}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── FOCUS AREAS + QUICK ACTIONS ── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Focus topics */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-[#1D1D1F]">{hasPerformanceHistory ? 'Focus Areas' : 'Start Here'}</h2>
                  <p className="text-[11.5px] text-[#8E8E93] mt-0.5">
                    {hasPerformanceHistory ? 'Ranked by error rate and revision urgency' : 'High-yield anchor topics to build your baseline'}
                  </p>
                </div>
                {topPriorityTopics.length > 0 && (
                  <button type="button" onClick={() => onSelectSubject(topPriorityTopics[0].subjectId)}
                    className="text-[12px] font-bold text-[#007AFF] cursor-pointer flex items-center gap-0.5 shrink-0">
                    All Subjects <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {topPriorityTopics.map((topic, idx) => {
                  const hasAttempts = topic.attemptCount > 0;
                  const hasErrors = topic.errorCount > 0 || topic.repeatedErrorCount > 0;
                  const hasRepeatedMistake = hasAttempts && topic.repeatedErrorCount >= 1;
                  const isConfirmedWeakness = hasAttempts && (topic.status === 'critical' || topic.accuracy < 50);
                  const isHighPriority = hasAttempts && (topic.status === 'high_priority' || topic.accuracy < 60);
                  const isRevision = hasAttempts && topic.revisionDue;
                  const isStarter = !hasAttempts && !hasErrors;
                  const actionType = topic.recommendedAction?.type;
                  let actionHint = topic.recommendedAction?.actionLabel || 'Study';
                  if (actionType === 'review_errors') actionHint = 'Review Mistakes';
                  else if (actionType === 'practice_mcqs') actionHint = 'Clinical Drill';
                  else if (actionType === 'rapid_review') actionHint = 'Rapid Recall';
                  else if (actionType === 'complete_revision') actionHint = 'Spaced Revision';
                  const urgencyColor = hasRepeatedMistake || isConfirmedWeakness ? '#FF3B30' : isHighPriority || isRevision ? '#FF9500' : '#007AFF';
                  const badge = hasRepeatedMistake ? { label: 'Repeated Error', color: '#FF3B30' }
                    : isConfirmedWeakness ? { label: 'Critical', color: '#FF3B30' }
                    : isHighPriority ? { label: 'Needs Work', color: '#FF9500' }
                    : isRevision ? { label: 'Due', color: '#FF9500' }
                    : isStarter ? { label: 'Start Here', color: '#007AFF' }
                    : null;
                  return (
                    <div key={`${topic.subjectId}-${topic.topicId}`}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border hover:shadow-sm transition-all"
                      style={{ borderColor: 'rgba(60,60,67,0.1)', borderLeft: `3px solid ${urgencyColor}` }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-black font-mono text-white"
                        style={{ background: urgencyColor }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-[#1D1D1F] truncate">{topic.topicName}</span>
                          {badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ color: badge.color, background: `${badge.color}12`, border: `1px solid ${badge.color}25` }}>
                              {badge.label}
                            </span>
                          )}
                          {topic.isHighYield && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">HY</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8E8E93] truncate">
                          {topic.subjectName} · {isStarter ? `${topic.subjectWeightage}M weightage` : actionHint}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {hasAttempts && (
                          <span className="text-[15px] font-black font-mono" style={{ color: topic.accuracy >= 75 ? '#30D158' : topic.accuracy >= 50 ? '#FF9500' : '#FF3B30' }}>
                            {topic.accuracy}%
                          </span>
                        )}
                        <button type="button" aria-label={`Open ${topic.subjectName} diagnostics for ${topic.topicName}`} onClick={() => setSelectedDiagnosticSubjectId(topic.subjectId)}
                          className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#1D1D1F] hover:text-white text-[#6E6E73] flex items-center justify-center transition-all cursor-pointer">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-5 space-y-3">
              <div>
                <h2 className="text-[15px] font-bold text-[#1D1D1F]">Quick Actions</h2>
                <p className="text-[11.5px] text-[#8E8E93] mt-0.5">Targeted remediation workflows</p>
              </div>
              <div className="bg-white rounded-3xl border border-[rgba(60,60,67,0.1)] shadow-sm divide-y divide-[rgba(60,60,67,0.06)] overflow-hidden">
                {[
                  { icon: AlertTriangle, label: 'Error Vault', sub: (() => { const n = state.errorNotebook?.length || 0; return n > 0 ? `${n} mistakes to triage` : 'No pending errors'; })(), color: '#FF3B30', badge: (state.errorNotebook?.length || 0) > 0 ? state.errorNotebook!.length : null, onClick: () => setIsErrorVaultModalOpen(true) },
                  { icon: Target, label: 'Practice Drill', sub: 'Launch a 10-MCQ clinical session', color: '#007AFF', badge: null, onClick: () => { if (topPriorityTopics.length > 0) onLaunchPracticeSession?.(topPriorityTopics[0].subjectId, topPriorityTopics[0].topicId, topPriorityTopics[0].topicName, undefined, 'dashboard_weak_topic'); else if (FMGE_SUBJECTS.length > 0) onLaunchPracticeSession?.(FMGE_SUBJECTS[0].id, FMGE_SUBJECTS[0].topics[0]?.id || 't-1', FMGE_SUBJECTS[0].topics[0]?.name || 'Clinical Drill', undefined, 'dashboard_weak_topic'); } },
                  { icon: RotateCcw, label: 'Revision Planner', sub: 'Build spaced recall schedule', color: '#FF9500', badge: null, onClick: () => onNavigateTab?.('revision') },
                  { icon: ShieldCheck, label: 'Topic Mastery', sub: 'Filter topics by mastery tier', color: '#30D158', badge: null, onClick: () => setIsTopicMasteryModalOpen(true) },
                ].map(({ icon: Icon, label, sub, color, badge, onClick }) => (
                  <button key={label} type="button" onClick={onClick}
                    className="w-full px-4 py-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-[#F9F9F9] transition-colors text-left group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                      style={{ background: `${color}12` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{label}</span>
                        {badge != null && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono text-white"
                            style={{ background: color }}>{badge}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">{sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#C7C7CC] group-hover:text-[#8E8E93] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── SUBJECT BREAKDOWN ── */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold text-[#1D1D1F]">Subject Breakdown</h2>
                <p className="text-[11.5px] text-[#8E8E93]">All 19 NBE disciplines · Filter a subject, then open its diagnosis</p>
              </div>
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subjects..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-full text-[12px] bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] focus:bg-white focus:outline-none text-[#1D1D1F] placeholder:text-[#C7C7CC] transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: 'all', label: `All (${counts.all})` },
                { id: 'clinical', label: `Clinical (${counts.clinical})` },
                { id: 'paraclinical', label: `Para-Clinical (${counts.paraclinical})` },
                { id: 'preclinical', label: `Pre-Clinical (${counts.preclinical})` },
              ].map((tab) => (
                <button key={tab.id} type="button" aria-pressed={selectedDiscipline === tab.id} onClick={() => setSelectedDiscipline(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer shrink-0 transition-all ${
                    selectedDiscipline === tab.id ? 'bg-[#1D1D1F] text-white shadow-sm' : 'bg-white text-[#6E6E73] border border-[rgba(60,60,67,0.12)] hover:bg-[#F2F2F7]'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-3xl border border-[rgba(60,60,67,0.1)] shadow-sm overflow-hidden divide-y divide-[rgba(60,60,67,0.05)]">
              <div className="hidden sm:grid sm:grid-cols-12 px-5 py-3 bg-[#F9F9F9] text-[10px] font-mono font-black uppercase tracking-widest text-[#8E8E93]">
                <div className="sm:col-span-5">Subject</div>
                <div className="sm:col-span-3 text-center">Accuracy</div>
                <div className="sm:col-span-2 text-center">Status</div>
                <div className="sm:col-span-2 text-right">Action</div>
              </div>
              {filteredSubjects.length > 0 ? filteredSubjects.map((sub) => {
                const hasAttempts = sub.metrics.totalAttempts > 0;
                const acc = sub.metrics.accuracy;
                const recent = sub.metrics.recentAccuracy;
                const trendDelta = recent - acc;
                let statusLabel = 'Unattempted'; let statusColor = '#8E8E93';
                if (hasAttempts) {
                  if (acc >= 75) { statusLabel = 'Strong'; statusColor = '#30D158'; }
                  else if (acc >= 60) { statusLabel = 'Developing'; statusColor = '#FF9500'; }
                  else { statusLabel = 'Weak'; statusColor = '#FF3B30'; }
                }
                return (
                  <div key={sub.id}
                    className="hover:bg-[#F9F9F9] transition-colors flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2 sm:gap-0 px-5 py-3.5"
                    style={{ borderLeft: `3px solid ${statusColor}` }}>
                    <div className="sm:col-span-5 space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#1D1D1F] truncate">{sub.name}</span>
                        <span className="text-[10px] font-mono text-[#8E8E93] shrink-0">{sub.weightage}M</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] font-mono">
                        {hasAttempts ? `${sub.metrics.totalAttempts} Qs attempted` : `${sub.topics.length} topics`}
                      </p>
                    </div>
                    <div className="sm:col-span-3 flex sm:flex-col sm:items-center justify-between sm:justify-center gap-1">
                      <span className="font-mono text-[15px] font-black"
                        style={{ color: hasAttempts ? (acc >= 75 ? '#30D158' : acc >= 50 ? '#FF9500' : '#FF3B30') : '#C7C7CC' }}>
                        {hasAttempts ? `${acc}%` : '—'}
                      </span>
                      {hasAttempts && (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold"
                          style={{ color: trendDelta > 0 ? '#30D158' : trendDelta < 0 ? '#FF3B30' : '#8E8E93' }}>
                          {trendDelta > 0 ? <TrendingUp className="w-3 h-3" /> : trendDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {trendDelta > 0 ? `+${trendDelta}%` : trendDelta < 0 ? `${trendDelta}%` : 'Stable'}
                        </span>
                      )}
                    </div>
                    <div className="sm:col-span-2 flex sm:justify-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}25` }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="sm:col-span-2 flex sm:justify-end">
                      <button type="button" onClick={() => setSelectedDiagnosticSubjectId(sub.id)}
                        className="inline-flex min-h-11 items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11.5px] font-bold bg-[#F2F2F7] hover:bg-[#1D1D1F] hover:text-white text-[#1D1D1F] transition-all cursor-pointer">
                        Diagnose <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center space-y-3 px-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5 text-[#8E8E93]" />
                  </div>
                  <p className="text-[13px] font-bold text-[#1D1D1F]">No matching subjects</p>
                  <button type="button" onClick={() => { setSearchQuery(''); setSelectedDiscipline('all'); }}
                    className="text-[12px] font-bold text-[#007AFF] cursor-pointer">Clear Filters</button>
                </div>
              )}
            </div>
          </section>

          {/* ── TRENDS + GRAND TEST ── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Accuracy Trend */}
            <div className="bg-white rounded-3xl border border-[rgba(60,60,67,0.1)] shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[#1D1D1F]">Accuracy Trend</h2>
                  <p className="text-[11.5px] text-[#8E8E93]">Performance across practice sessions</p>
                </div>
                <button type="button" onClick={() => setIsAccuracyTrendModalOpen(true)}
                  className="text-[12px] font-bold text-[#007AFF] cursor-pointer flex items-center gap-0.5">
                  Detail <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {accuracyTrendPoints.length >= 2 ? (
                <div className="space-y-3">
                  {(() => {
                    const first = accuracyTrendPoints[0].accuracy;
                    const last = accuracyTrendPoints[accuracyTrendPoints.length - 1].accuracy;
                    const delta = last - first;
                    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                    const color = delta > 0 ? '#30D158' : delta < 0 ? '#FF3B30' : '#8E8E93';
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: `${color}0A`, border: `1px solid ${color}20` }}>
                        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                        <span className="text-[12px] font-bold flex-1" style={{ color }}>
                          {delta > 0 ? `Improving +${delta}%` : delta < 0 ? `Declining ${delta}%` : 'Stable trajectory'}
                        </span>
                        <button type="button" onClick={() => setIsAccuracyTrendModalOpen(true)} className="text-[11px] font-bold text-[#007AFF] cursor-pointer shrink-0">
                          Full Report
                        </button>
                      </div>
                    );
                  })()}
                  <div
                    className="relative h-44 w-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]"
                    role="button"
                    tabIndex={0}
                    aria-label="Open detailed accuracy trend report"
                    onClick={() => setIsAccuracyTrendModalOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setIsAccuracyTrendModalOpen(true);
                      }
                    }}
                  >
                    {[75, 50, 25].map((pct) => (
                      <div key={pct} className="absolute left-0 right-6 flex items-center"
                        style={{ bottom: `calc(${pct * 0.72}% + 14px)` }}>
                        <div className="border-t border-dashed border-[rgba(60,60,67,0.08)] flex-1" />
                        <span className="text-[9px] font-mono text-[#C7C7CC] pl-1.5">{pct}%</span>
                      </div>
                    ))}
                    <div className="h-full flex items-end gap-2 pt-4 pb-2 pr-2">
                      {accuracyTrendPoints.map((pt, idx) => {
                        const barH = Math.max(8, Math.min(100, pt.accuracy));
                        const clr = pt.accuracy >= 50 ? '#007AFF' : '#FF3B30';
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <span className="text-[10px] font-mono font-bold" style={{ color: clr }}>{pt.accuracy}%</span>
                            <div className="w-full h-28 flex items-end overflow-hidden rounded-t-xl bg-[#F5F5F7]">
                              <div className="w-full rounded-t-xl transition-all duration-700"
                                style={{ height: `${barH}%`, background: `linear-gradient(to top, ${clr}, ${clr}77)` }} />
                            </div>
                            <span className="text-[9px] font-mono text-[#8E8E93] truncate w-full text-center">{pt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-center rounded-2xl border-2 border-dashed border-[rgba(0,122,255,0.18)] bg-[#F0F7FF]">
                  <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#1D1D1F]">Calibrating Trajectory</h3>
                    <p className="text-[11.5px] text-[#8E8E93] max-w-xs mt-0.5">Solve your first 10 MCQs to unlock your accuracy curve.</p>
                  </div>
                  <button type="button" onClick={() => onLaunchPracticeSession?.('medicine', 'med-cardio', 'Cardiology', undefined, 'trend_empty_state')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#007AFF] text-white text-[12px] font-bold cursor-pointer shadow-sm">
                    Start Drill <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Grand Test */}
            <div className="bg-white rounded-3xl border border-[rgba(60,60,67,0.1)] shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[#1D1D1F]">Grand Test Score</h2>
                  <p className="text-[11.5px] text-[#8E8E93]">Full-length 300-Q NBE mock records</p>
                </div>
                <div className="flex items-center gap-2">
                  {grandTests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">{grandTests.length} logged</span>
                  )}
                  <button type="button" onClick={() => setIsGrandTestModalOpen(true)}
                    className="text-[12px] font-bold text-[#007AFF] cursor-pointer flex items-center gap-0.5">
                    Diagnostics <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {grandTests.length > 0 ? (
                <div className="space-y-3">
                  {latestGT && (
                    <div onClick={() => setIsGrandTestModalOpen(true)}
                      className="relative rounded-2xl overflow-hidden p-5 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0A2463 100%)', boxShadow: '0 8px 24px rgba(0,122,255,0.25)' }}>
                      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-white/50 uppercase">{latestGT.platform}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${latestGT.score >= 150 ? 'bg-[#30D158] text-white' : 'bg-[#FF3B30] text-white'}`}>
                              {latestGT.score >= 150 ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[38px] font-black font-mono text-white leading-none">{latestGT.score}</span>
                            <span className="text-[14px] font-mono text-white/40">/ 300</span>
                          </div>
                          <span className="text-[11px] text-white/40 font-mono">
                            {new Date(latestGT.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-mono text-white/40">vs pass mark</p>
                          <p className="text-[26px] font-black font-mono text-white">
                            {latestGT.score >= 150 ? `+${latestGT.score - 150}` : `−${150 - latestGT.score}`}
                          </p>
                          <p className="text-[11px] font-mono font-bold" style={{ color: latestGT.score >= 150 ? '#30D158' : '#FF8080' }}>
                            {latestGT.score >= 150 ? 'above pass' : 'below pass'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {grandTests.slice(-4).map((gt, idx) => {
                      const pct = Math.round((gt.score / (gt.totalMarks || 300)) * 100);
                      const isPass = gt.score >= 150;
                      return (
                        <div key={gt.id || idx} onClick={() => setIsGrandTestModalOpen(true)} className="cursor-pointer group space-y-1">
                          <div className="flex items-center justify-between text-[12px] font-mono">
                            <span className="font-semibold text-[#3A3A3C] group-hover:text-[#007AFF] transition-colors">{gt.title || `GT ${idx + 1}`}</span>
                            <span className="font-bold" style={{ color: isPass ? '#30D158' : '#FF3B30' }}>{gt.score}/300</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#F2F2F7] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: isPass ? '#007AFF' : '#FF9500' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-center rounded-2xl border-2 border-dashed border-[rgba(48,209,88,0.2)] bg-[#F0FFF4]">
                  <div className="w-10 h-10 rounded-2xl bg-[#30D158]/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#30D158]" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#1D1D1F]">No Grand Tests Logged</h3>
                    <p className="text-[11.5px] text-[#8E8E93] max-w-xs mt-0.5">Log Marrow, PrepLadder, or Cerebellum GT scores to track pass-mark safety.</p>
                  </div>
                  <button type="button" onClick={() => setIsGrandTestModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] text-white text-[12px] font-bold cursor-pointer shadow-sm">
                    Log First Score <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── CLINICAL DIAGNOSTICS ── */}
          <section className="space-y-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#1D1D1F]">Clinical Diagnostics</h2>
              <p className="text-[11.5px] text-[#8E8E93]">Core NBE competency breakdown</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Image MCQs */}
              <div className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm flex flex-col gap-4"
                style={{ borderTop: '3px solid #5AC8FA' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#8E8E93]">Image-Based MCQs</span>
                  <Eye className="w-4 h-4 text-[#5AC8FA]" />
                </div>
                <div>
                  <div className="text-[28px] font-black font-mono text-[#1D1D1F]">
                    {imageSummary.totalImageAttempts > 0 ? `${imageSummary.overallImageAccuracy}%` : '—'}
                  </div>
                  <p className="text-[11.5px] text-[#8E8E93] mt-1 leading-snug">
                    {imageSummary.weakestCategory ? `Weakest: ${imageSummary.weakestCategory}` : imageSummary.totalImageAttempts > 0 ? 'Balanced across categories' : 'Drill radiology and pathology slides'}
                  </p>
                </div>
                <div className="flex gap-1.5 mt-auto pt-2 border-t border-[rgba(60,60,67,0.06)]">
                  {[['Radiology','#5AC8FA'],['Histology','#5856D6'],['Clinical','#30D158']].map(([lbl,clr]) => (
                    <div key={lbl} className="flex-1 py-1.5 rounded-xl text-center text-[9.5px] font-bold font-mono"
                      style={{ background: `${clr}12`, color: clr, border: `1px solid ${clr}25` }}>{lbl}</div>
                  ))}
                </div>
              </div>

              {/* Topic Mastery */}
              <div onClick={() => setIsTopicMasteryModalOpen(true)}
                className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] hover:shadow-md shadow-sm flex flex-col gap-4 cursor-pointer group transition-all"
                style={{ borderTop: '3px solid #007AFF' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#8E8E93]">Topic Mastery</span>
                  <Layers className="w-4 h-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-3">
                  <div className="w-full h-3 rounded-full bg-[#F2F2F7] flex overflow-hidden">
                    {[
                      { count: overallPerf.totalMasteredTopics, color: '#007AFF' },
                      { count: overallPerf.totalProficientTopics, color: '#30D158' },
                      { count: overallPerf.totalDevelopingTopics, color: '#FF9500' },
                      { count: overallPerf.totalStrugglingTopics, color: '#FF3B30' },
                    ].map(({ count, color }) => (
                      <div key={color} className="h-full transition-all duration-700"
                        style={{ width: `${(count / Math.max(1, overallPerf.totalTopics)) * 100}%`, background: color }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Mastered', count: overallPerf.totalMasteredTopics, color: '#007AFF' },
                      { label: 'Proficient', count: overallPerf.totalProficientTopics, color: '#30D158' },
                      { label: 'Developing', count: overallPerf.totalDevelopingTopics, color: '#FF9500' },
                      { label: 'Struggling', count: overallPerf.totalStrugglingTopics, color: '#FF3B30' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-[#8E8E93]">{label}:</span>
                        <span className="font-bold font-mono text-[#1D1D1F]">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] border-t border-[rgba(60,60,67,0.06)] pt-2.5 mt-auto">
                  <span className="text-[#C7C7CC]">Full syllabus breadth</span>
                  <span className="text-[#007AFF] font-bold flex items-center gap-0.5">Drill-Down <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>

              {/* Error Notebook */}
              <div onClick={() => setIsErrorVaultModalOpen(true)}
                className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] hover:shadow-md shadow-sm flex flex-col gap-4 cursor-pointer group transition-all"
                style={{ borderTop: '3px solid #FF3B30' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#8E8E93]">Error Notebook</span>
                  <Brain className="w-4 h-4 text-[#5856D6] group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[28px] font-black font-mono text-[#1D1D1F]">{state.errorNotebook?.length || 0}</div>
                    <p className="text-[11.5px] text-[#8E8E93] mt-0.5 leading-snug">
                      {(() => {
                        const total = state.errorNotebook?.length || 0;
                        const reviewed = state.errorNotebook?.filter((e) => e.isReviewed).length || 0;
                        if (total === 0) return 'No errors logged yet';
                        return `${reviewed} / ${total} remediated`;
                      })()}
                    </p>
                    {overallPerf.totalRepeatedErrors > 0 && (
                      <p className="text-[11px] font-bold text-[#FF3B30] flex items-center gap-1 mt-1.5">
                        <Flame className="w-3 h-3" /> {overallPerf.totalRepeatedErrors} repeat{overallPerf.totalRepeatedErrors > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const total = state.errorNotebook?.length || 0;
                    const reviewed = state.errorNotebook?.filter((e) => e.isReviewed).length || 0;
                    const pct = total > 0 ? reviewed / total : 0;
                    const r = 18; const circ = 2 * Math.PI * r;
                    const ringColor = pct >= 0.7 ? '#30D158' : pct >= 0.4 ? '#FF9500' : '#FF3B30';
                    return (
                      <div className="relative shrink-0">
                        <svg width="50" height="50" viewBox="0 0 50 50" className="-rotate-90">
                          <circle cx="25" cy="25" r={r} fill="none" stroke="#F2F2F7" strokeWidth="5" />
                          <circle cx="25" cy="25" r={r} fill="none" stroke={ringColor}
                            strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono text-[#1D1D1F]">
                          {total > 0 ? `${Math.round(pct * 100)}%` : '—'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between text-[11px] border-t border-[rgba(60,60,67,0.06)] pt-2.5 mt-auto">
                  <span className="text-[#C7C7CC]">Triage missed concepts</span>
                  <span className="text-[#FF3B30] font-bold flex items-center gap-0.5">Error Vault <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {currentSubTab === 'errors' && (
        <ErrorsView
          state={state}
          onAddErrorItem={onAddErrorItem || (() => {})}
          onToggleErrorReviewed={onToggleErrorReviewed || (() => {})}
          onDeleteErrorItem={onDeleteErrorItem || (() => {})}
          onUpdateAppState={onUpdateAppState || (() => {})}
          onLaunchPracticeSession={onLaunchPracticeSession}
          onOpenAiCoach={onOpenAiCoach}
          onSelectSubject={onSelectSubject}
          onToggleTopicState={onToggleTopicState}
          onBackToPerformance={() => handleSubTabChange('overview')}
        />
      )}

      {currentSubTab === 'predictor' && (
        <FmgePredictorView
          state={state}
          onSelectSubject={onSelectSubject}
          onOpenAiCoach={onOpenAiCoach}
          onToggleTopicState={onToggleTopicState}
          onAddTask={onAddTask || (() => {})}
          onBackToPerformance={() => handleSubTabChange('overview')}
          onLaunchPracticeSession={onLaunchPracticeSession as any}
        />
      )}

      {/* ── DEEP LAYER MODALS ── */}
      <ReadinessBreakdownModal
        isOpen={isReadinessModalOpen}
        onClose={() => setIsReadinessModalOpen(false)}
        readiness={readiness}
        onNavigateTab={onNavigateTab}
        onLaunchPracticeSession={(subjectId, topicId, topicName) => {
          setIsReadinessModalOpen(false);
          onLaunchPracticeSession?.(subjectId, topicId, topicName, undefined, 'dashboard_weak_topic');
        }}
        topPrioritySubjectId={topPriorityTopics[0]?.subjectId || 'medicine'}
        topPriorityTopicId={topPriorityTopics[0]?.topicId || 'med-1'}
        topPriorityTopicName={topPriorityTopics[0]?.topicName || 'Cardiology - Ischemic Heart Disease & ECG'}
      />

      <SubjectDiagnosticDetailModal
        isOpen={!!selectedDiagnosticSubjectId}
        onClose={() => setSelectedDiagnosticSubjectId(null)}
        subjectId={selectedDiagnosticSubjectId}
        state={state}
        onOpenStudyWorkspace={(id) => { setSelectedDiagnosticSubjectId(null); onSelectSubject(id); }}
        onLaunchPracticeSession={onLaunchPracticeSession}
        onNavigateTab={onNavigateTab}
      />

      <TopicMasteryDetailModal
        isOpen={isTopicMasteryModalOpen}
        onClose={() => setIsTopicMasteryModalOpen(false)}
        state={state}
        onOpenSubjectDiagnostic={(id) => { setIsTopicMasteryModalOpen(false); setSelectedDiagnosticSubjectId(id); }}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />

      <AccuracyTrendDetailModal
        isOpen={isAccuracyTrendModalOpen}
        onClose={() => setIsAccuracyTrendModalOpen(false)}
        state={state}
        overallAccuracy={overallPerf.overallAccuracy}
        recentAccuracy={overallPerf.recentAccuracy}
        onLaunchPracticeSession={() => {
          setIsAccuracyTrendModalOpen(false);
          if (topPriorityTopics.length > 0) {
            onLaunchPracticeSession?.(topPriorityTopics[0].subjectId, topPriorityTopics[0].topicId, topPriorityTopics[0].topicName, undefined, 'dashboard_weak_topic');
          } else if (FMGE_SUBJECTS.length > 0) {
            onLaunchPracticeSession?.(FMGE_SUBJECTS[0].id, FMGE_SUBJECTS[0].topics[0]?.id || 't-1', FMGE_SUBJECTS[0].topics[0]?.name || 'Clinical Drill', undefined, 'dashboard_weak_topic');
          }
        }}
      />

      <GrandTestDiagnosticModal
        isOpen={isGrandTestModalOpen}
        onClose={() => setIsGrandTestModalOpen(false)}
        grandTests={grandTests}
        onNavigateTab={onNavigateTab}
      />

      <ErrorVaultDiagnosticModal
        isOpen={isErrorVaultModalOpen}
        onClose={() => setIsErrorVaultModalOpen(false)}
        state={state}
        onNavigateTab={onNavigateTab}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />
    </div>
  );
};
