import React, { useState } from 'react';
import {
  Play,
  ArrowRight,
  HelpCircle,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { AppState, GrandTest, ErrorNotebookItem, DailyTask } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { GrandTestsView } from './GrandTestsView';
import { TelegramHubView } from './TelegramHubView';

interface PracticeViewProps {
  state: AppState;
  onLaunchPracticeSession: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onAddGrandTest: (gt: GrandTest) => void;
  onDeleteGrandTest: (id: string) => void;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed: (id: string) => void;
  onDeleteErrorItem: (id: string) => void;
  onOpenAiCoach: (initialTab?: 'vignette' | 'concept' | 'diagnosis') => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onAddTask?: (task: DailyTask) => void;
}

type PracticeSubTab = 'drills' | 'grandtests' | 'telegram';

export const PracticeView: React.FC<PracticeViewProps> = ({
  state,
  onLaunchPracticeSession,
  onAddGrandTest,
  onDeleteGrandTest,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onOpenAiCoach,
  onUpdateAppState,
  onAddTask,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<PracticeSubTab>('drills');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('medicine');

  const selectedSubject = FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || FMGE_SUBJECTS[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 font-sans text-slate-900">
      {/* ================= EDITORIAL HEADER ================= */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            HIGH-YIELD PRACTICE INSTRUMENTS
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-medium">
            EXAM READY
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-display tracking-tight text-slate-900">
          Questions &amp; Practice Drills
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
          10-MCQ clinical vignette drills with instant distractor breakdowns, 300-question full-length grand tests, and community questions.
        </p>
      </header>

      {/* ================= SUBTAB PILLS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 border-b border-slate-200/80 pb-4">
        {[
          { id: 'drills', label: '10-MCQ Clinical Drills', count: null },
          { id: 'grandtests', label: 'Grand Tests (300Q)', count: state.grandTests?.length || 0 },
          { id: 'telegram', label: 'Live Community Feed', count: null },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold font-display transition-all cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= VIEW 1: TOPIC 10-MCQ DRILLS ================= */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {FMGE_SUBJECTS.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-display shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="ml-1 text-[10px] font-mono opacity-70">({sub.weightage}M)</span>
                </button>
              );
            })}
          </div>

          {/* Topics Card Container */}
          <div className="editorial-surface p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              <span>{selectedSubject.name} High-Yield Modules</span>
              <span>10-MCQ Adaptive Drill</span>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedSubject.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="py-4 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/80 rounded-2xl transition-all group"
                >
                  <div className="min-w-0 pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-display text-slate-900 group-hover:text-sky-900 transition-colors">
                        {topic.name}
                      </span>
                      {topic.isHighYield && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[9px] font-mono font-semibold uppercase">
                          HIGH YIELD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Standard FMGE clinical vignette distribution · 10 questions with distractor analysis
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLaunchPracticeSession(selectedSubject.id, topic.id, topic.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-all cursor-pointer shrink-0 shadow-xs hover:shadow-md"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Start 10-MCQs</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: GRAND TESTS ================= */}
      {activeSubTab === 'grandtests' && (
        <GrandTestsView
          state={state}
          onAddGrandTest={onAddGrandTest}
          onDeleteGrandTest={onDeleteGrandTest}
          onAddErrorItem={onAddErrorItem}
          onToggleErrorReviewed={onToggleErrorReviewed}
          onDeleteErrorItem={onDeleteErrorItem}
          onOpenAiCoach={onOpenAiCoach}
          onUpdateAppState={onUpdateAppState}
        />
      )}

      {/* ================= VIEW 3: TELEGRAM HUB ================= */}
      {activeSubTab === 'telegram' && (
        <TelegramHubView
          onAddToErrorNotebook={onAddErrorItem}
          onUpdateAppState={onUpdateAppState}
        />
      )}
    </div>
  );
};
