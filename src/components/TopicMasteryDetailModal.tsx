import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { AppState, TopicItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { calculateTopicPerformanceMetrics } from '../utils/performanceEngine';

interface TopicMasteryDetailModalProps {
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
  onOpenSubjectDiagnostic: (subjectId: string) => void;
}

type MasteryTier = 'all' | 'struggling' | 'developing' | 'proficient' | 'mastered' | 'unattempted';

export const TopicMasteryDetailModal: React.FC<TopicMasteryDetailModalProps> = ({
  isOpen,
  onClose,
  state,
  onLaunchPracticeSession,
  onOpenSubjectDiagnostic,
}) => {
  const [selectedTier, setSelectedTier] = useState<MasteryTier>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute all topics across all 19 subjects with real metrics
  const allTopicRows = useMemo(() => {
    const rows: {
      subjectId: string;
      subjectName: string;
      subjectWeightage: number;
      topic: TopicItem;
      metrics: any;
    }[] = [];

    const attempts = state.mcqAttempts || [];

    FMGE_SUBJECTS.forEach((subject) => {
      const customTopics = state.subjectProgress?.[subject.id]?.customTopics || [];
      const topics = [...subject.topics, ...customTopics];

      topics.forEach((topic) => {
        const tm = calculateTopicPerformanceMetrics(subject.id, topic.id, attempts, topic);
        rows.push({
          subjectId: subject.id,
          subjectName: subject.name,
          subjectWeightage: subject.weightage,
          topic,
          metrics: tm,
        });
      });
    });

    return rows;
  }, [state]);

  // Counts by tier
  const tierCounts = useMemo(() => {
    let mastered = 0;
    let proficient = 0;
    let developing = 0;
    let struggling = 0;
    let unattempted = 0;

    allTopicRows.forEach(({ metrics }) => {
      switch (metrics.masteryStatus) {
        case 'mastered':
          mastered++;
          break;
        case 'proficient':
          proficient++;
          break;
        case 'developing':
          developing++;
          break;
        case 'struggling':
          struggling++;
          break;
        case 'unattempted':
        default:
          unattempted++;
          break;
      }
    });

    return {
      all: allTopicRows.length,
      mastered,
      proficient,
      developing,
      struggling,
      unattempted,
    };
  }, [allTopicRows]);

  // Filtered list
  const filteredRows = useMemo(() => {
    let list = allTopicRows;

    if (selectedTier !== 'all') {
      list = list.filter((r) => r.metrics.masteryStatus === selectedTier);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.topic.name.toLowerCase().includes(query) ||
          r.subjectName.toLowerCase().includes(query)
      );
    }

    // Sort order: struggling first (most repeated errors), then developing, then proficient, then unattempted, then mastered
    return list.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        struggling: 0,
        developing: 1,
        proficient: 2,
        unattempted: 3,
        mastered: 4,
      };
      const pDiff =
        (priorityOrder[a.metrics.masteryStatus] ?? 9) -
        (priorityOrder[b.metrics.masteryStatus] ?? 9);
      if (pDiff !== 0) return pDiff;

      // Secondary sort: repeated errors descending
      if (b.metrics.repeatedErrorsCount !== a.metrics.repeatedErrorsCount) {
        return b.metrics.repeatedErrorsCount - a.metrics.repeatedErrorsCount;
      }
      return a.metrics.accuracy - b.metrics.accuracy;
    });
  }, [allTopicRows, selectedTier, searchQuery]);

  if (!isOpen) return null;

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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#00685f]">
                CURRICULUM DISTRIBUTION
              </span>
              <span className="w-1 h-1 rounded-full bg-[#00685f]/40" />
              <span className="text-xs text-stone-400 font-mono">19 SUBJECTS · {allTopicRows.length} TOPICS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Newsreader'] tracking-tight bg-gradient-to-r from-stone-900 via-stone-800 to-[#00685f] bg-clip-text text-transparent">
              Topic Mastery Diagnostic
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Drill down into your topic mastery distribution across the entire FMGE syllabus.
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
          {/* Distribution Bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-stone-700 uppercase tracking-wider">Mastery Tier Breakdown</span>
              <span className="text-stone-500">{allTopicRows.length} Topics Total</span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(tierCounts.mastered / allTopicRows.length) * 100}%` }}
                title={`Mastered: ${tierCounts.mastered}`}
              />
              <div
                className="bg-teal-600 h-full transition-all"
                style={{ width: `${(tierCounts.proficient / allTopicRows.length) * 100}%` }}
                title={`Proficient: ${tierCounts.proficient}`}
              />
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${(tierCounts.developing / allTopicRows.length) * 100}%` }}
                title={`Developing: ${tierCounts.developing}`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${(tierCounts.struggling / allTopicRows.length) * 100}%` }}
                title={`Struggling: ${tierCounts.struggling}`}
              />
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Mastered: <strong>{tierCounts.mastered}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                Proficient: <strong>{tierCounts.proficient}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Developing: <strong>{tierCounts.developing}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Struggling: <strong>{tierCounts.struggling}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-stone-500">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                Unattempted: <strong>{tierCounts.unattempted}</strong>
              </span>
            </div>
          </div>

          {/* Search & Tier Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            {/* Tier Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: 'all', label: `All (${tierCounts.all})` },
                  { id: 'struggling', label: `Struggling (${tierCounts.struggling})` },
                  { id: 'developing', label: `Developing (${tierCounts.developing})` },
                  { id: 'proficient', label: `Proficient (${tierCounts.proficient})` },
                  { id: 'mastered', label: `Mastered (${tierCounts.mastered})` },
                  { id: 'unattempted', label: `Unattempted (${tierCounts.unattempted})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTier(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedTier === tab.id
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search topics or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-full border border-stone-200 text-xs bg-white focus:outline-none focus:border-[#00685f] transition-colors"
              />
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-2.5">
            {filteredRows.length > 0 ? (
              filteredRows.slice(0, 50).map(({ subjectId, subjectName, subjectWeightage, topic, metrics: tm }) => {
                const isAttempted = tm.totalAttempts > 0;
                let badgeStyle = 'bg-stone-100 text-stone-600 border-stone-200';
                if (tm.masteryStatus === 'mastered') {
                  badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                } else if (tm.masteryStatus === 'proficient') {
                  badgeStyle = 'bg-teal-50 text-[#00685f] border-teal-200/60';
                } else if (tm.masteryStatus === 'developing') {
                  badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/60';
                } else if (tm.masteryStatus === 'struggling') {
                  badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/60';
                }

                return (
                  <div
                    key={`${subjectId}-${topic.id}`}
                    className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] hover:border-[#00685f]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeStyle}`}>
                          {tm.masteryStatus.toUpperCase()}
                        </span>
                        {topic.isHighYield && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/50">
                            HIGH-YIELD
                          </span>
                        )}
                        <span className="text-xs text-stone-400 font-mono">
                          {subjectName} ({subjectWeightage}M)
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {topic.name}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
                        <span>Accuracy: <strong>{isAttempted ? `${tm.accuracy}%` : '—'}</strong></span>
                        <span>•</span>
                        <span>Solved: <strong>{tm.totalAttempts}</strong></span>
                        {tm.repeatedErrorsCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600 font-bold">
                              {tm.repeatedErrorsCount} repeat error{tm.repeatedErrorsCount > 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSubjectDiagnostic(subjectId);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        Roadmap
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLaunchPracticeSession?.(
                            subjectId,
                            topic.id,
                            topic.name,
                            undefined,
                            'recommended_video_practice'
                          );
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#00685f] hover:bg-[#005049] text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Solve 10 MCQs</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <p className="text-sm">No topics match your current filter.</p>
              </div>
            )}
            {filteredRows.length > 50 && (
              <p className="text-center text-xs font-mono text-stone-400 pt-2">
                Showing first 50 of {filteredRows.length} topics. Use search to narrow results.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-[#EAEFEA] bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400">
            Mastery status automatically recalculates as you practice questions.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
