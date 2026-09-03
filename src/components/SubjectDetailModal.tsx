import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Play,
  ArrowRight,
  BookOpen,
  Plus,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { FMGESubject, TopicItem, ConfidenceLevel, SubjectProgress, AppState, PracticeSessionContext } from '../types';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';

interface SubjectDetailModalProps {
  subject: FMGESubject | null;
  isOpen: boolean;
  onClose: () => void;
  progress: SubjectProgress | undefined;
  topicsState: Record<string, Partial<TopicItem>>;
  state: AppState;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
  onAddCustomTopic: (subjectId: string, topicName: string, isHighYield: boolean) => void;
  onUpdateSubjectDetails: (subjectId: string, updates: Partial<SubjectProgress>) => void;
  onLaunchPracticeMcq?: (context: PracticeSessionContext) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  isOpen,
  onClose,
  progress,
  topicsState,
  state,
  onToggleTopicState,
  onAddCustomTopic,
  onLaunchPracticeMcq,
  onOpenAiCoach,
}) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [isHighYieldTopic, setIsHighYieldTopic] = useState(false);

  // Active Topic for 6-Step Mastery Workspace
  const [activeTopicForMastery, setActiveTopicForMastery] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  if (!isOpen || !subject) return null;

  const allTopics = [...subject.topics, ...(progress?.customTopics || [])];
  const notesCount = allTopics.filter(
    (t) => topicsState[`${subject.id}-${t.id}`]?.notesDone ?? t.notesDone
  ).length;
  const completionPct = Math.round((notesCount / Math.max(1, allTopics.length)) * 100);

  // Recommended next uncompleted topic
  const recommendedTopic =
    allTopics.find((t) => !(topicsState[`${subject.id}-${t.id}`]?.notesDone ?? t.notesDone)) || allTopics[0];

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onAddCustomTopic(subject.id, newTopicName.trim(), isHighYieldTopic);
    setNewTopicName('');
    setIsHighYieldTopic(false);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs overflow-y-auto font-sans text-slate-900">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="bg-white rounded-3xl max-w-4xl w-full my-auto max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
          {/* ================= EDITORIAL WORKSPACE HEADER ================= */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-slate-50 to-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {subject.name.toUpperCase()} · {subject.weightage} MARKS · NBE BLUEPRINT
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-medium">
                  {completionPct}% COMPLETE
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-display tracking-tight text-slate-900">
                {subject.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                {subject.highYieldTips || subject.description}
              </p>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ================= CONTENT SCROLL ================= */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 min-h-0 space-y-8 divide-y divide-slate-100">
            {/* 1. RECOMMENDED NEXT TOPIC HERO */}
            {recommendedTopic && (
              <div className="space-y-3 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Recommended Study Target
                </span>
                <div className="editorial-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold uppercase text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        NEXT UP
                      </span>
                      {recommendedTopic.isHighYield && (
                        <span className="text-[10px] font-mono font-semibold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          HIGH YIELD
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold font-display text-slate-900">
                      {recommendedTopic.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Core NBE exam question source · High-yield rapid revision master deck
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTopicForMastery({
                        subjectId: subject.id,
                        topicId: recommendedTopic.id,
                        topicName: recommendedTopic.name,
                      })
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400 fill-current" />
                    <span>⚡ Rapid Revision Hub</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. TOPIC WORKSPACE LIST */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-100">
                <span>All Syllabus Modules ({allTopics.length})</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-slate-100">
                {allTopics.map((topic) => {
                  const stateKey = `${subject.id}-${topic.id}`;
                  const tState = topicsState[stateKey] || {};
                  const isNotes = tState.notesDone ?? topic.notesDone;
                  const isQBank = tState.qBankDone ?? topic.qBankDone;
                  const isR1 = tState.r1Done ?? topic.r1Done;
                  const isR2 = tState.r2Done ?? topic.r2Done;
                  const isR3 = tState.r3Done ?? topic.r3Done;

                  return (
                    <div
                      key={topic.id}
                      className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 rounded-2xl transition-colors"
                    >
                      <div
                        className="min-w-0 pr-2 space-y-1.5 cursor-pointer group flex-1"
                        onClick={() =>
                          setActiveTopicForMastery({
                            subjectId: subject.id,
                            topicId: topic.id,
                            topicName: topic.name,
                          })
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-display text-slate-900 group-hover:text-sky-700 transition-colors">
                            {topic.name}
                          </span>
                          {topic.isHighYield && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[9px] font-mono font-semibold uppercase">
                              HIGH YIELD
                            </span>
                          )}
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-3 text-xs text-slate-500" onClick={(e) => e.stopPropagation()}>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isNotes}
                              onChange={() => onToggleTopicState(subject.id, topic.id, 'notesDone')}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 h-3.5 w-3.5"
                            />
                            <span className={isNotes ? 'text-slate-900 font-semibold' : ''}>Notes</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isQBank}
                              onChange={() => onToggleTopicState(subject.id, topic.id, 'qBankDone')}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 h-3.5 w-3.5"
                            />
                            <span className={isQBank ? 'text-slate-900 font-semibold' : ''}>QBank</span>
                          </label>

                          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                            {(['r1Done', 'r2Done', 'r3Done'] as const).map((rKey, idx) => {
                              const isDone = rKey === 'r1Done' ? isR1 : rKey === 'r2Done' ? isR2 : isR3;
                              return (
                                <button
                                  key={rKey}
                                  type="button"
                                  onClick={() => onToggleTopicState(subject.id, topic.id, rKey)}
                                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  R{idx + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTopicForMastery({
                              subjectId: subject.id,
                              topicId: topic.id,
                              topicName: topic.name,
                            })
                          }
                          className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Zap className="h-3 w-3 text-amber-400 fill-current" />
                          <span>Rapid Revision</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onLaunchPracticeMcq) {
                              onLaunchPracticeMcq({
                                sessionId: `session-${Date.now()}`,
                                subjectId: subject.id,
                                subjectName: subject.name,
                                topicId: topic.id,
                                topicName: topic.name,
                                source: 'dashboard_weak_topic',
                                targetQuestionCount: 10,
                              });
                            }
                          }}
                          className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-all cursor-pointer"
                        >
                          10-MCQs
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. ADD CUSTOM TOPIC */}
            <div className="pt-6">
              <form onSubmit={handleAddTopic} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom topic to syllabus..."
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Topic</span>
                </button>
              </form>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Embedded 6-Step Topic Mastery Workspace Modal */}
      {activeTopicForMastery && (
        <TopicMasteryWorkspace
          subjectId={activeTopicForMastery.subjectId}
          topicId={activeTopicForMastery.topicId}
          topicName={activeTopicForMastery.topicName}
          state={state}
          onClose={() => setActiveTopicForMastery(null)}
          onLaunchPracticeMcq={(ctx) => {
            if (onLaunchPracticeMcq) {
              onLaunchPracticeMcq(ctx);
            }
          }}
          onToggleTopicState={onToggleTopicState}
          onOpenAiCoach={onOpenAiCoach}
        />
      )}
    </>,
    document.body
  );
};
