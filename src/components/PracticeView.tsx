import React, { useState } from 'react';
import { Play, HelpCircle } from 'lucide-react';
import { AppState, ErrorNotebookItem, DailyTask } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

interface PracticeViewProps {
  state: AppState;
  onLaunchPracticeSession: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onOpenAiCoach: (initialTab?: 'vignette' | 'concept' | 'diagnosis') => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onAddTask?: (task: DailyTask) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  state,
  onLaunchPracticeSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('medicine');

  const selectedSubject = FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || FMGE_SUBJECTS[0];

  return (
    <div className="page-container space-y-8 font-['Inter'] text-[#121e1b]">
      {/* ================= EDITORIAL HEADER ================= */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#66716F]">
            HIGH-YIELD PRACTICE INSTRUMENTS
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#006B63] text-white text-[10px] font-mono font-medium">
            10-MCQ ADAPTIVE DRILLS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-['Newsreader'] tracking-tight text-[#121e1b]">
          Clinical Vignettes &amp; Practice Drills
        </h1>
        <p className="text-sm sm:text-base text-[#3d4947] max-w-2xl leading-relaxed">
          10-MCQ clinical vignette drills with instant distractor breakdowns, active recall testing, and concept remediation.
        </p>
      </header>

      {/* ================= SUBJECT FILTER PILLS ================= */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {FMGE_SUBJECTS.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                    : 'bg-white hover:bg-[#F7F9F8] text-[#3d4947] hover:text-[#121e1b] border-[#DCE4E1]'
                }`}
              >
                <span>{sub.name}</span>
                <span className="ml-1 text-[10px] font-mono opacity-75">({sub.weightage}M)</span>
              </button>
            );
          })}
        </div>

        {/* Topics Card Container */}
        <div className="clinical-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F7F8] text-xs font-semibold uppercase tracking-wider text-[#66716F] font-mono">
            <span>{selectedSubject.name} High-Yield Modules</span>
            <span>10-MCQ Clinical Drill</span>
          </div>

          <div className="divide-y divide-[#F5F7F8]">
            {selectedSubject.topics.map((topic) => (
              <div
                key={topic.id}
                className="py-4 px-2 flex items-center justify-between gap-4 hover:bg-[#F7F9F8] rounded-lg transition-all group"
              >
                <div className="min-w-0 pr-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-['Newsreader'] text-[#121e1b] group-hover:text-[#006B63] transition-colors">
                      {topic.name}
                    </span>
                    {topic.isHighYield && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F7F8] text-[#006B63] text-[9px] font-mono font-semibold uppercase">
                        HIGH YIELD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#66716F]">
                    Standard FMGE clinical vignette distribution · 10 questions with distractor analysis
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onLaunchPracticeSession(selectedSubject.id, topic.id, topic.name)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#006B63] hover:bg-[#005049] text-white text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-xs hover:shadow-sm"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Start 10-MCQs</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
