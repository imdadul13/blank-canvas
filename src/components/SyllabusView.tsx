import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, BookOpen, SlidersHorizontal, X } from 'lucide-react';
import { AppState, SubjectPhase, ConfidenceLevel } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

interface SyllabusViewProps {
  state: AppState;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  state,
  onSelectSubject,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<'all' | SubjectPhase>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Total topics count & completed
  const overallStats = useMemo(() => {
    let totalTopics = 0;
    let completedNotes = 0;
    FMGE_SUBJECTS.forEach((sub) => {
      const subProgress = state.subjectProgress[sub.id];
      const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
      totalTopics += allTopics.length;
      completedNotes += allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
    });
    const percentage = Math.round((completedNotes / Math.max(1, totalTopics)) * 100);
    return { totalTopics, completedNotes, percentage };
  }, [state]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return FMGE_SUBJECTS.filter((sub) => {
      if (phaseFilter !== 'all' && sub.phase !== phaseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubName =
          sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
        const subProgress = state.subjectProgress[sub.id];
        const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
        const matchesTopic = allTopics.some((t) => t.name.toLowerCase().includes(q));
        if (!matchesSubName && !matchesTopic) return false;
      }
      return true;
    });
  }, [phaseFilter, searchQuery, state.subjectProgress]);

  return (
    <div className="page-container space-y-8 font-sans text-slate-900">
      {/* ================= EDITORIAL HEADER ================= */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            NBE OFFICIAL BLUEPRINT
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-medium">
            300 MARKS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-display tracking-tight text-slate-900">
          Your Custom Syllabus
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
          High-yield active recall workspace · {overallStats.percentage}% curriculum completed
        </p>
      </header>

      {/* ================= FILTERS & SEARCH ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-slate-200/80 py-4">
        {/* Phase Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {[
            { id: 'all', label: 'All Subjects (19)' },
            { id: 'pre-clinical', label: 'Pre-Clinical (51M)' },
            { id: 'para-clinical', label: 'Para-Clinical (69M)' },
            { id: 'clinical', label: 'Clinical (180M)' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPhaseFilter(p.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold font-display transition-all cursor-pointer whitespace-nowrap border ${
                phaseFilter === p.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= SUBJECT LIST ROWS ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono px-1">
          <span>Subjects & Curriculum Weightage</span>
          <span>{filteredSubjects.length} Disciplines</span>
        </div>

        <div className="divide-y divide-slate-100 editorial-surface overflow-hidden">
          {filteredSubjects.map((sub) => {
            const subProgress = state.subjectProgress[sub.id];
            const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
            const notesDoneCount = allTopics.filter(
              (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
            ).length;
            const pct = Math.round((notesDoneCount / Math.max(1, allTopics.length)) * 100);

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color || '#0284c7' }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold font-display text-slate-900 group-hover:text-sky-900 transition-colors truncate">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-lg">
                      {sub.highYieldTips || sub.description}
                    </p>
                  </div>
                </div>

                {/* Progress rail & Marks weightage */}
                <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                  <div className="w-28 sm:w-36 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>{notesDoneCount}/{allTopics.length}</span>
                      <span className="font-semibold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-slate-900"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-semibold">
                    {sub.weightage} Marks
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
