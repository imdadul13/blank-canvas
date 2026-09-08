import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Zap,
  Target,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Quote,
  Sprout,
  Play,
  FileText,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  SlidersHorizontal,
  X,
  Layers,
  RotateCcw,
  Check,
} from 'lucide-react';
import { AppState, FMGESubject } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';

interface RevisionMatrixViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateSubjectRevisionDate: (subjectId: string, date: string) => void;
  onBackToCurriculum?: () => void;
  onNavigateTab?: (tab: any) => void;
}

// Circular progress gauge matching the reference design
const CircularProgressGauge: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trackColor?: string;
}> = ({
  percentage,
  size = 52,
  strokeWidth = 4.5,
  strokeColor = '#006B63',
  trackColor = '#E2E8F0',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-xs font-bold text-slate-900 tracking-tight">
        {clampedPct}%
      </span>
    </div>
  );
};

export const RevisionMatrixView: React.FC<RevisionMatrixViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onUpdateSubjectRevisionDate,
  onBackToCurriculum,
  onNavigateTab,
}) => {
  const [sortBy, setSortBy] = useState<'priority' | 'progress-asc' | 'progress-desc' | 'alpha'>(
    'priority'
  );
  const [showAllSubjects, setShowAllSubjects] = useState<boolean>(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Calculate real subject-level metrics
  const subjectsWithMetrics = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      const subProgress = state.subjectProgress[sub.id];
      const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
      const totalTopics = Math.max(1, allTopics.length);

      const notesDone = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      const r1Done = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.r1Done ?? t.r1Done
      ).length;
      const r2Done = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.r2Done ?? t.r2Done
      ).length;
      const r3Done = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.r3Done ?? t.r3Done
      ).length;

      const progressPct = Math.round((notesDone / totalTopics) * 100);
      const r1Pct = Math.round((r1Done / totalTopics) * 100);
      const r2Pct = Math.round((r2Done / totalTopics) * 100);
      const r3Pct = Math.round((r3Done / totalTopics) * 100);

      return {
        subject: sub,
        allTopics,
        totalTopics: allTopics.length,
        notesDone,
        r1Done,
        r2Done,
        r3Done,
        progressPct,
        r1Pct,
        r2Pct,
        r3Pct,
        revisionTargetDate: subProgress?.targetRevisionDate,
      };
    });
  }, [state.subjectProgress, state.topicsState]);

  // Sorted list of subjects
  const sortedSubjects = useMemo(() => {
    const list = [...subjectsWithMetrics];

    if (sortBy === 'priority') {
      // FMGE default weightage (high to low)
      list.sort((a, b) => b.subject.weightage - a.subject.weightage);
    } else if (sortBy === 'progress-asc') {
      list.sort((a, b) => a.progressPct - b.progressPct);
    } else if (sortBy === 'progress-desc') {
      list.sort((a, b) => b.progressPct - a.progressPct);
    } else if (sortBy === 'alpha') {
      list.sort((a, b) => a.subject.name.localeCompare(b.subject.name));
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return list.filter(
        (item) =>
          item.subject.name.toLowerCase().includes(q) ||
          item.subject.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [subjectsWithMetrics, sortBy, searchFilter]);

  // Visible subjects: top 9 by default on desktop/mobile unless expanded
  const displayedSubjects = showAllSubjects ? sortedSubjects : sortedSubjects.slice(0, 9);

  // Quick Action: Continue Revision (pick first incomplete topic)
  const handleContinueRevision = () => {
    for (const item of subjectsWithMetrics) {
      const pendingTopic = item.allTopics.find(
        (t) =>
          !(state.topicsState[`${item.subject.id}-${t.id}`]?.notesDone ?? t.notesDone) ||
          !(state.topicsState[`${item.subject.id}-${t.id}`]?.r1Done ?? t.r1Done)
      );
      if (pendingTopic) {
        onSelectSubject(item.subject.id);
        return;
      }
    }
    // Default to first subject
    if (FMGE_SUBJECTS.length > 0) {
      onSelectSubject(FMGE_SUBJECTS[0].id);
    }
  };

  // Quick Action: Focus on Weak Topics
  const handleFocusWeakTopics = () => {
    setSortBy('progress-asc');
    setShowAllSubjects(true);
    // If we have lowest progress subject, expand it
    const sorted = [...subjectsWithMetrics].sort((a, b) => a.progressPct - b.progressPct);
    if (sorted.length > 0) {
      setExpandedSubjectId(sorted[0].subject.id);
    }
  };

  return (
    <div
      className="space-y-6 sm:space-y-8 font-['Plus_Jakarta_Sans'] text-slate-900 pb-36 sm:pb-16"
      style={{
        paddingBottom: 'max(9.5rem, calc(7rem + env(safe-area-inset-bottom, 2rem)))',
      }}
    >
      {/* ================= 1. BREADCRUMB ================= */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-mono text-slate-500"
      >
        <button
          type="button"
          onClick={onBackToCurriculum}
          className="flex items-center gap-1.5 text-slate-600 hover:text-[#006B63] transition-colors cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5 text-[#006B63]" />
          <span>Study</span>
        </button>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-900">Revision Matrix</span>
      </nav>

      {/* ================= 2. HERO TITLE & QUOTE CARD ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Title & 3-Phase Description */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#006B63]/10 border border-[#006B63]/20 flex items-center justify-center text-[#006B63] shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#006B63]">
              REVISION MATRIX
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-slate-900">
            Learn. Revise. Retain. Succeed.
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
            A structured 3-phase revision system to help you master all 19 subjects and stay exam-ready.
          </p>
        </div>

        {/* Right: Editorial Quote Banner (Desktop) */}
        <div className="lg:col-span-4 hidden lg:flex flex-col justify-between p-5 rounded-2xl bg-[#006B63]/5 border border-[#006B63]/15 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0 mt-0.5">
              <Quote className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-slate-700 italic leading-relaxed">
              “Revision is not a one-time event, it’s a strategy for success.”
            </p>
          </div>
          <div className="text-[11px] font-mono font-bold tracking-wider text-[#006B63] uppercase self-end mt-4">
            — ONE SHOT FMGE
          </div>
        </div>
      </div>

      {/* ================= 3. THE 3 REVISION PHASE CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: R1 Foundation */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/60 text-[#006B63] flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-display font-bold text-slate-900 text-base leading-tight truncate">
                R1 Foundation
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Build strong concepts
              </p>
              <div className="font-mono text-xs font-semibold text-slate-600 pt-0.5">
                {stats.completedR1Topics} <span className="font-normal text-slate-400">/ {stats.totalTopics} topics</span>
              </div>
            </div>
          </div>
          <CircularProgressGauge
            percentage={stats.r1Percentage}
            size={52}
            strokeColor="#006B63"
          />
        </div>

        {/* Card 2: R2 Rapid Review */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-display font-bold text-slate-900 text-base leading-tight truncate">
                R2 Rapid Review
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Active recall &amp; practice
              </p>
              <div className="font-mono text-xs font-semibold text-slate-600 pt-0.5">
                {stats.completedR2Topics} <span className="font-normal text-slate-400">/ {stats.totalTopics} topics</span>
              </div>
            </div>
          </div>
          <CircularProgressGauge
            percentage={stats.r2Percentage}
            size={52}
            strokeColor="#D97706"
          />
        </div>

        {/* Card 3: R3 Final Sprint */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-display font-bold text-slate-900 text-base leading-tight truncate">
                R3 Final Sprint
              </h3>
              <p className="text-xs text-slate-500 truncate">
                High-yield revision
              </p>
              <div className="font-mono text-xs font-semibold text-slate-600 pt-0.5">
                {stats.completedR3Topics} <span className="font-normal text-slate-400">/ {stats.totalTopics} topics</span>
              </div>
            </div>
          </div>
          <CircularProgressGauge
            percentage={stats.r3Percentage}
            size={52}
            strokeColor="#E11D48"
          />
        </div>
      </div>

      {/* ================= 4. MAIN TWO-COLUMN SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: SUBJECT PROGRESS ================= */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 text-[#006B63] flex items-center justify-center shrink-0">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Subject Progress
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  19 subjects • {stats.totalTopics} topics
                </p>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort subjects by"
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006B63]/20 cursor-pointer"
              >
                <option value="priority">Sort by: Exam priority</option>
                <option value="progress-desc">Sort by: Progress (High → Low)</option>
                <option value="progress-asc">Sort by: Progress (Low → High)</option>
                <option value="alpha">Sort by: Alphabetical</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Subject Rows List */}
          <div className="divide-y divide-slate-100">
            {displayedSubjects.map((item, idx) => {
              const isExpanded = expandedSubjectId === item.subject.id;

              return (
                <div key={item.subject.id} className="py-2.5 transition-colors">
                  {/* Row Summary */}
                  <div
                    onClick={() =>
                      setExpandedSubjectId(isExpanded ? null : item.subject.id)
                    }
                    className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Left: Index & Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-display font-medium text-sm text-slate-900 group-hover:text-[#006B63] transition-colors truncate">
                        {item.subject.name}
                      </span>
                    </div>

                    {/* Right: Topic Count, Progress Bar & Percentage */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <span className="font-mono text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
                        {item.notesDone} / {item.totalTopics}
                      </span>

                      {/* Mini Progress Bar */}
                      <div className="w-16 sm:w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#006B63] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.progressPct > 0 ? 5 : 0, item.progressPct)}%`,
                          }}
                        />
                      </div>

                      <span className="font-mono text-xs font-semibold text-slate-800 w-9 text-right shrink-0">
                        {item.progressPct}%
                      </span>

                      <button
                        type="button"
                        aria-label={`Toggle topics for ${item.subject.name}`}
                        className="p-1 rounded-md text-slate-400 group-hover:text-slate-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Expanded Topic Breakdown with R1, R2, R3 interactive toggles */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-3 pb-2 px-3 sm:px-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {item.subject.name} Topics
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700">
                            {item.subject.weightage} Marks
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubject(item.subject.id);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006B63] hover:underline cursor-pointer"
                        >
                          <span>Open in Study</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Topics List with R1, R2, R3 toggles */}
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {item.allTopics.map((topic) => {
                          const tState =
                            state.topicsState[`${item.subject.id}-${topic.id}`] || {};
                          const isR1 = tState.r1Done ?? topic.r1Done;
                          const isR2 = tState.r2Done ?? topic.r2Done;
                          const isR3 = tState.r3Done ?? topic.r3Done;

                          return (
                            <div
                              key={topic.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/60 text-xs"
                            >
                              <div className="min-w-0 flex-1 truncate text-slate-800 font-medium">
                                {topic.name}
                              </div>

                              {/* R1, R2, R3 Checkbox Pills */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  title="Toggle R1 Foundation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTopicState(item.subject.id, topic.id, 'r1Done');
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                                    isR1
                                      ? 'bg-teal-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  R1
                                </button>
                                <button
                                  type="button"
                                  title="Toggle R2 Rapid Review"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTopicState(item.subject.id, topic.id, 'r2Done');
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                                    isR2
                                      ? 'bg-amber-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  R2
                                </button>
                                <button
                                  type="button"
                                  title="Toggle R3 Final Sprint"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTopicState(item.subject.id, topic.id, 'r3Done');
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                                    isR3
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  R3
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Target Revision Date row */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {item.revisionTargetDate
                              ? `Scheduled: ${item.revisionTargetDate}`
                              : 'No target date set'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCalendarModalOpen(true);
                          }}
                          className="text-[#006B63] hover:underline font-medium"
                        >
                          Set date
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Card Footer: View All 19 Subjects Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAllSubjects(!showAllSubjects)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showAllSubjects ? 'Show Top 9 Subjects' : 'View All 19 Subjects'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: YOUR REVISION JOURNEY & QUICK ACTIONS ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Card: Your Revision Journey */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 text-[#006B63] flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-slate-900 text-base leading-tight">
                    Your Revision Journey
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track your progress across all 3 phases
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('progress')}
                  className="text-xs font-semibold text-[#006B63] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>View Analytics</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* 3 Stat Tiles */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Tile 1: Total Topics */}
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#006B63] flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div className="font-display font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                  {stats.totalTopics}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Total Topics
                </div>
              </div>

              {/* Tile 2: Completed */}
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="font-display font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                  {stats.completedNotesTopics || stats.completedR1Topics}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Completed
                </div>
              </div>

              {/* Tile 3: Overall Progress */}
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
                <div className="font-display font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                  {stats.notesPercentage || stats.r1Percentage}%
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Overall Progress
                </div>
              </div>
            </div>

            {/* Motivational Banner with subtle mountain curve */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/30 border border-emerald-100/70 p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/80 border border-emerald-200/60 text-[#006B63] flex items-center justify-center shrink-0 shadow-2xs">
                <Sprout className="h-4.5 w-4.5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-700 italic leading-relaxed z-10">
                “Small, consistent revisions today build a confident doctor tomorrow.”
              </p>

              {/* Decorative background mountain SVG */}
              <svg
                className="absolute right-0 bottom-0 opacity-15 pointer-events-none text-[#006B63]"
                width="140"
                height="60"
                viewBox="0 0 140 60"
                fill="none"
              >
                <path
                  d="M0 60L40 25L75 45L110 10L140 60H0Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          {/* Bottom Card: Quick Actions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-base leading-tight">
                  Quick Actions
                </h2>
                <p className="text-xs text-slate-500">
                  Jump to what you need
                </p>
              </div>
            </div>

            {/* 2x2 Grid of Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Action 1: Continue Revision */}
              <button
                type="button"
                onClick={handleContinueRevision}
                className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 flex items-center gap-3 text-left transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#006B63] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-[#006B63] transition-colors leading-tight">
                    Continue Revision
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Pick up where you left off
                  </div>
                </div>
              </button>

              {/* Action 2: Weak Topics */}
              <button
                type="button"
                onClick={handleFocusWeakTopics}
                className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 flex items-center gap-3 text-left transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Target className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-rose-700 transition-colors leading-tight">
                    Weak Topics
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Focus on low scores
                  </div>
                </div>
              </button>

              {/* Action 3: Custom Revision */}
              <button
                type="button"
                onClick={onBackToCurriculum}
                className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 flex items-center gap-3 text-left transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
                    Custom Revision
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Create your own plan
                  </div>
                </div>
              </button>

              {/* Action 4: Revision Calendar */}
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 flex items-center gap-3 text-left transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    Revision Calendar
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Plan your revision
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 5. FOOTER SUBTLE QUOTE ================= */}
      <div className="text-center pt-4">
        <p className="font-serif italic text-xs text-slate-400">
          “Consistent revision today builds the doctor you’ll be tomorrow.”
        </p>
      </div>

      {/* ================= 6. REVISION CALENDAR MODAL ================= */}
      {isCalendarModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 text-[#006B63] flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">
                    Revision Calendar &amp; Target Dates
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schedule multi-cycle target dates across high-yield disciplines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Subjects List with Date Inputs */}
            <div className="p-5 max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {subjectsWithMetrics.map((item) => (
                <div
                  key={item.subject.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {item.subject.name}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.subject.weightage}M
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Progress: {item.progressPct}% • {item.totalTopics} topics
                    </div>
                  </div>

                  {/* Date Input */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="date"
                      value={item.revisionTargetDate || ''}
                      onChange={(e) =>
                        onUpdateSubjectRevisionDate(item.subject.id, e.target.value)
                      }
                      aria-label={`Target revision date for ${item.subject.name}`}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006B63] font-mono text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#00554E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
