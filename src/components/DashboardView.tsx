import React, { useState, useMemo } from 'react';
import {
  Play,
  ArrowRight,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  BookOpen,
  Activity,
  Layers,
  X,
  GraduationCap,
  MessageSquare,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Cloud,
  FileText
} from 'lucide-react';
import { AppState, DailyTask, PracticeSessionContext } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { AppStats } from '../utils/storage';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import {
  getNextBestStudyAction,
  getDaysRemainingToExam,
} from '../utils/adaptivePriorityEngine';
import { MedicalWaveform } from './MedicalWaveform';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import { NotificationCenterModal } from './NotificationCenterModal';

interface DashboardViewProps {
  state: AppState;
  stats: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiCoach: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (task: DailyTask) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onToggleMissionCompletion?: (missionId: string) => void;
  activeBg?: { id: string; url: string; label: string; period: string };
  onShuffleBg?: () => void;
  onOpenProfile?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onNavigateTab,
  onOpenAiCoach,
  onLaunchPracticeSession,
  onToggleTopicState,
  activeBg = { id: 'morning', url: '/images/study-bg/study-art-morning.jpg', label: 'Morning Desk', period: 'Morning' },
  onShuffleBg,
  onOpenProfile,
}) => {
  const { user, profile } = useAuth();
  const [selectedFilterSubjectId, setSelectedFilterSubjectId] = useState<string>('all');
  const [activeMasteryTopic, setActiveMasteryTopic] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  // Notification center modal state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [hour]);

  const daysRemaining = useMemo(() => getDaysRemainingToExam(state), [state]);

  // Adaptive recommendation
  const adaptiveRecommendation = useMemo(() => {
    return getNextBestStudyAction(state);
  }, [state]);

  const recommendedSubject = useMemo(() => {
    return FMGE_SUBJECTS.find((s) => s.id === adaptiveRecommendation.subjectId) || FMGE_SUBJECTS[0];
  }, [adaptiveRecommendation.subjectId]);

  // Active displayed recommendation
  const activeFocusSubject = useMemo(() => {
    if (selectedFilterSubjectId === 'all') return recommendedSubject;
    return FMGE_SUBJECTS.find((s) => s.id === selectedFilterSubjectId) || recommendedSubject;
  }, [selectedFilterSubjectId, recommendedSubject]);

  const activeFocusTopic = useMemo(() => {
    if (selectedFilterSubjectId === 'all') {
      return {
        id: adaptiveRecommendation.topicId,
        name: adaptiveRecommendation.topicName,
        reason: adaptiveRecommendation.reason || 'High-yield NBE exam blueprint topic recommended for mastery.',
        isHighYield: true,
      };
    }
    const firstUnfinished =
      activeFocusSubject.topics.find((t) => !state.topicsState?.[`${activeFocusSubject.id}-${t.id}`]?.notesDone) ||
      activeFocusSubject.topics[0];
    return {
      id: firstUnfinished.id,
      name: firstUnfinished.name,
      reason: `Master core high-yield principles and clinical diagnosis in ${activeFocusSubject.name}.`,
      isHighYield: firstUnfinished.isHighYield,
    };
  }, [selectedFilterSubjectId, activeFocusSubject, adaptiveRecommendation, state.topicsState]);

  // Last studied topic for "Continue Studying"
  const recentStudyTopic = useMemo(() => {
    const physSubject = FMGE_SUBJECTS.find((s) => s.id === 'physiology') || FMGE_SUBJECTS[1];
    return {
      subject: physSubject,
      topicId: 'phys-1',
      topicName: 'General Physiology & Cell Membrane Transport',
      status: 'Notes completed · QBank practice pending',
    };
  }, []);

  // Quick subject list with status
  const subjectList = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      const allTopics = [...sub.topics, ...(state.subjectProgress?.[sub.id]?.customTopics || [])];
      const doneNotes = allTopics.filter(
        (t) => state.topicsState?.[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      const percentage = Math.round((doneNotes / Math.max(1, allTopics.length)) * 100);

      let statusText = 'On Track';
      let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      if (percentage < 30) {
        statusText = 'Needs Focus';
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200/60';
      } else if (percentage >= 50) {
        statusText = 'Strong';
        statusColor = 'text-sky-700 bg-sky-50 border-sky-200/60';
      }
      return {
        ...sub,
        percentage,
        statusText,
        statusColor,
      };
    });
  }, [state.subjectProgress, state.topicsState]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: Array<{ subject: (typeof FMGE_SUBJECTS)[0]; topic: (typeof FMGE_SUBJECTS)[0]['topics'][0] }> = [];
    for (const sub of FMGE_SUBJECTS) {
      for (const top of sub.topics) {
        if (top.name.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q)) {
          results.push({ subject: sub, topic: top });
          if (results.length >= 8) break;
        }
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [searchQuery]);

  const userName = user?.displayName || profile?.displayName || state.settings.userName || 'Dr. unsay';
  const initials = (userName || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative min-h-screen font-['Plus_Jakarta_Sans'] text-slate-900 pb-28 lg:pb-12">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 space-y-5 sm:space-y-7">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              {greeting}, {userName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <div className="flex items-center gap-2.5 mt-0.5">
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Click to change target exam date"
                >
                  {daysRemaining} days to FMGE ({state.settings?.examDate || '2026-06-28'})
                </button> · Target {state.settings?.targetScore || 200}+ · 19 Subjects
              </p>
              {onShuffleBg && (
                <button
                  type="button"
                  onClick={onShuffleBg}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-slate-500 bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
                  title="Click to shuffle study atmosphere"
                >
                  <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                  <span>{activeBg.label} ({activeBg.period}) ⇄</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Search bar & notification trigger */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="relative w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search anything... ⌘K"
                className="w-full h-10 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-full shadow-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Notification Bell (Opens real Notification Center) */}
            <button
              type="button"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white border border-slate-200 shadow-xs text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors shrink-0"
              title="View Study Notifications"
            >
              <Bell className="h-4.5 w-4.5 stroke-[1.8]" />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </button>

            {/* Avatar Pill */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 text-white font-['Outfit'] font-bold text-xs shadow-xs shrink-0 hover:bg-slate-800 transition-all cursor-pointer ring-2 ring-slate-900/10"
              title="View Doctor Profile & Exam Blueprint"
            >
              {initials}
            </button>
          </div>
        </div>

        {/* Live Search Matrix Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-2 animate-in fade-in duration-150 z-30">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Results</span>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {searchResults.map(({ subject, topic }) => (
                <div
                  key={`${subject.id}-${topic.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">{subject.name}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate block">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setActiveMasteryTopic({
                          subjectId: subject.id,
                          topicId: topic.id,
                          topicName: topic.name,
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Study
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        onLaunchPracticeSession?.(subject.id, topic.id, topic.name);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      10 MCQs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
          <button
            type="button"
            onClick={() => setSelectedFilterSubjectId('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              selectedFilterSubjectId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            All Subjects (19)
          </button>
          {FMGE_SUBJECTS.slice(0, 8).map((sub) => {
            const active = selectedFilterSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedFilterSubjectId(sub.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigateTab('syllabus')}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            •••
          </button>
        </div>

        {/* Main Hero Card (TODAY'S FOCUS) */}
        <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.08)] p-6 sm:p-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/60 font-mono">
                  ★ TODAY'S FOCUS
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {activeFocusSubject.name.toUpperCase()} · {activeFocusSubject.weightage} MARKS
                </span>
              </div>

              <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {activeFocusTopic.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                {activeFocusTopic.reason}
              </p>

              {/* Study Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/70">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> ~20 minutes
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/70">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" /> 10 Clinical MCQs
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/70">
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" /> Active Recall (R2)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveMasteryTopic({
                      subjectId: activeFocusSubject.id,
                      topicId: activeFocusTopic.id,
                      topicName: activeFocusTopic.name,
                    })
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" /> Start Session
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubject(activeFocusSubject.id)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Subject Roadmap <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Right Telemetry Column (Visible on Desktop / Stacked underneath on Mobile) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-5 text-white shadow-inner flex flex-col justify-between h-48 sm:h-52">
                {/* Telemetry Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                      CLINICAL TELEMETRY · {activeFocusSubject.name.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800/60">
                    {activeFocusSubject.weightage} MARKS
                  </span>
                </div>

                {/* Animated Medical Waveform */}
                <div className="my-auto py-1 sm:py-2">
                  <MedicalWaveform height={44} color="#38bdf8" className="w-full opacity-90" />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>LEAD II · 25mm/s</span>
                    <span className="text-slate-300 font-medium">HR 72 BPM · NSR</span>
                    <span>NBE HIGH-YIELD</span>
                  </div>
                </div>

                {/* Telemetry Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-400 truncate max-w-[180px]">{activeFocusTopic.name}</span>
                  <span className="text-emerald-400 font-semibold uppercase tracking-wider">DIAGNOSTIC TRIAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Studying Row */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            CONTINUE STUDYING
          </span>

          <div
            onClick={() =>
              setActiveMasteryTopic({
                subjectId: recentStudyTopic.subject.id,
                topicId: recentStudyTopic.topicId,
                topicName: recentStudyTopic.topicName,
              })
            }
            className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <BookOpen className="h-4.5 w-4.5 text-slate-700" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 font-mono">
                    {recentStudyTopic.subject.name.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">· Last practiced recently</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                  {recentStudyTopic.topicName}
                </h3>
                <p className="text-xs text-slate-500 truncate">{recentStudyTopic.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 group-hover:text-slate-900 shrink-0 pl-2">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Bottom Section: 2-Column Desktop Split (Curriculum Matrix + Quick Actions Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Curriculum Matrix, 7/12 width) */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              YOUR STUDY · FMGE CURRICULUM MATRIX
            </span>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {subjectList.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Subject Name & Icon */}
                  <div className="flex items-center gap-3 min-w-0 sm:w-2/5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Activity className="h-3.5 w-3.5 stroke-[2]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {sub.name}
                    </span>
                  </div>

                  {/* Marks */}
                  <div className="hidden sm:block text-xs font-mono text-slate-400 w-20">
                    {sub.weightage} marks
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="flex items-center gap-2.5 w-1/3 max-w-[140px]">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full transition-all duration-300"
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-600 shrink-0">
                      {sub.percentage}%
                    </span>
                  </div>

                  {/* Status Pill Badge */}
                  <div className="flex items-center gap-1 shrink-0 pl-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${sub.statusColor}`}
                    >
                      {sub.statusText}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              ))}

              {/* View all subjects footer */}
              <div
                onClick={() => onNavigateTab('syllabus')}
                className="p-3 bg-slate-50/50 hover:bg-slate-100/70 text-center text-xs font-semibold text-sky-700 transition-colors cursor-pointer"
              >
                View All 19 Subjects →
              </div>
            </div>
          </div>

          {/* Right Column (Quick Actions 2x3 Grid, 5/12 width) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              QUICK ACTIONS
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* 1. 10 MCQs Topic Drill */}
              <div
                onClick={() => onNavigateTab('practice')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    10 MCQs
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Topic Drill</p>
                </div>
              </div>

              {/* 2. Grand Test */}
              <div
                onClick={() => onNavigateTab('grandtests')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    Grand Test
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Full Syllabus</p>
                </div>
              </div>

              {/* 3. Study Coach */}
              <div
                onClick={() => onOpenAiCoach('strategy')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Study Coach
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ask Anything</p>
                </div>
              </div>

              {/* 4. Error Vault */}
              <div
                onClick={() => onNavigateTab('errors')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                    Error Vault
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Review Mistakes</p>
                </div>
              </div>

              {/* 5. Revision */}
              <div
                onClick={() => onNavigateTab('revision')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Revision
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Spaced Recall</p>
                </div>
              </div>

              {/* 6. Daily Planner */}
              <div
                onClick={() => onNavigateTab('daily')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    Daily Planner
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Plan Your Day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Mastery Workspace Modal */}
      {activeMasteryTopic && (
        <TopicMasteryWorkspace
          subjectId={activeMasteryTopic.subjectId}
          topicId={activeMasteryTopic.topicId}
          topicName={activeMasteryTopic.topicName}
          state={state}
          onClose={() => setActiveMasteryTopic(null)}
          onOpenAiCoach={onOpenAiCoach}
          onLaunchPracticeMcq={(ctx) =>
            onLaunchPracticeSession?.(ctx.subjectId, ctx.topicId, ctx.topicName, ctx.subtopic)
          }
          onToggleTopicState={onToggleTopicState || (() => {})}
        />
      )}

      {/* Real-time Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        state={state}
        onNavigateTab={onNavigateTab}
        onSelectSubject={onSelectSubject}
        onLaunchPracticeSession={onLaunchPracticeSession}
      />
    </div>
  );
};
