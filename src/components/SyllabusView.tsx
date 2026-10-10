import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  BookOpen,
  Clock,
  Target,
  X,
  ArrowRight,
  Bone,
  Heart,
  FlaskConical,
  Microscope,
  Pill,
  ShieldCheck,
  Scale,
  Users,
  Eye,
  Headphones,
  Stethoscope,
  Scissors,
  Baby,
  Smile,
  Activity,
  Brain,
  ScanLine,
  Syringe,
  CheckCircle2,
  Compass,
  RotateCw,
  Layers,
  BarChart3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, SubjectPhase, ConfidenceLevel } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { SubjectAppleIcon, getSubjectVisualTheme } from './SubjectAppleIcon';
import { DoctorMountainArt } from './DoctorMountainArt';
import { RevisionMatrixView } from './RevisionMatrixView';
import { AppStats, calculateAppStats } from '../utils/storage';
import { useCircadianTheme } from '../hooks/useCircadianTheme';
import { CircadianHeaderAtmosphere, CircadianPill } from './CircadianHeaderAtmosphere';
import { HeaderTabInsignia } from './HeaderTabInsignia';
import { CircadianFocusDropdown } from './CircadianFocusDropdown';
import { HeaderGlassIcon } from './HeaderGlassIcon';

interface SyllabusViewProps {
  state: AppState;
  stats?: AppStats;
  onSelectSubject: (subjectId: string) => void;
  onToggleTopicState: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
  onUpdateConfidence: (subjectId: string, confidence: ConfidenceLevel) => void;
  onUpdateSubjectRevisionDate?: (subjectId: string, date: string) => void;
  subTab?: 'curriculum' | 'revision';
  onSubTabChange?: (tab: 'curriculum' | 'revision') => void;
  onNavigateTab?: (tab: any) => void;
}

// Subject Icon & Accent Palette Map aligned with clinical editorial aesthetics
function getSubjectVisual(subjectId: string, fallbackColor?: string) {
  const theme = getSubjectVisualTheme(subjectId);
  return {
    icon: theme.icon,
    color: theme.color || fallbackColor || '#007AFF',
    bg: `${theme.bgGradient} ${theme.border} ${theme.text}`,
    badge: theme.badgeType === 'high' ? 'High-yield' : theme.badgeType === 'important' ? 'Important' : 'Core',
    badgeType: theme.badgeType,
  };
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  state,
  stats,
  onSelectSubject,
  onToggleTopicState,
  onUpdateConfidence,
  onUpdateSubjectRevisionDate,
  subTab,
  onSubTabChange,
  onNavigateTab,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'curriculum' | 'revision'>(
    subTab || 'curriculum'
  );

  React.useEffect(() => {
    if (subTab) {
      setCurrentSubTab(subTab);
    }
  }, [subTab]);

  const handleSubTabChange = (tab: 'curriculum' | 'revision') => {
    setCurrentSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [phaseFilter, setPhaseFilter] = useState<'all' | SubjectPhase>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'weightage' | 'progress' | 'alpha'>('default');
  const circadian = useCircadianTheme(state.settings?.bgTheme);

  // Total topics count & completed statistics
  const overallStats = useMemo(() => {
    let totalTopics = 0;
    let completedNotes = 0;
    let completedSubjectsCount = 0;

    FMGE_SUBJECTS.forEach((sub) => {
      const subProgress = state.subjectProgress[sub.id];
      const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
      totalTopics += allTopics.length;
      const done = allTopics.filter(
        (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      completedNotes += done;
      if (allTopics.length > 0 && done === allTopics.length) {
        completedSubjectsCount++;
      }
    });

    const percentage = Math.round((completedNotes / Math.max(1, totalTopics)) * 100);
    return {
      totalTopics,
      completedNotes,
      percentage,
      totalSubjects: FMGE_SUBJECTS.length,
      completedSubjectsCount,
    };
  }, [state]);

  // Filtered & Sorted Subjects
  const filteredSubjects = useMemo(() => {
    let list = FMGE_SUBJECTS.filter((sub) => {
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

    if (sortBy === 'weightage') {
      list = [...list].sort((a, b) => b.weightage - a.weightage);
    } else if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progress') {
      list = [...list].sort((a, b) => {
        const aTopics = [...a.topics, ...(state.subjectProgress[a.id]?.customTopics || [])];
        const bTopics = [...b.topics, ...(state.subjectProgress[b.id]?.customTopics || [])];
        const aDone = aTopics.filter((t) => state.topicsState[`${a.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
        const bDone = bTopics.filter((t) => state.topicsState[`${b.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
        const aPct = aDone / Math.max(1, aTopics.length);
        const bPct = bDone / Math.max(1, bTopics.length);
        return aPct - bPct;
      });
    }

    return list;
  }, [phaseFilter, searchQuery, sortBy, state.subjectProgress, state.topicsState]);

  const PHASE_FILTERS = [
    { id: 'all',          label: 'All (19)',     short: 'All' },
    { id: 'pre-clinical', label: 'Pre-Clinical', short: 'Pre' },
    { id: 'para-clinical',label: 'Para-Clinical',short: 'Para' },
    { id: 'clinical',     label: 'Clinical',     short: 'Clinical' },
  ] as const;

  return (
    <div
      data-accent="study"
      className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 font-sans ${
        currentSubTab === 'revision' ? 'pb-28 sm:pb-20' : 'pb-20'
      }`}
    >
      {currentSubTab === 'revision' && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(60,60,67,0.08)] bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#3A3A3C]">
            <BookOpen className="h-4 w-4 text-[#30A854]" strokeWidth={2.2} />
            <span>Study Plan</span>
          </div>
          <div className="inline-flex rounded-full border border-[rgba(60,60,67,0.08)] bg-[#F2F2F7] p-1">
            {(['curriculum', 'revision'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={currentSubTab === tab}
                onClick={() => handleSubTabChange(tab)}
                className={`min-h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
                  currentSubTab === tab ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {tab === 'curriculum' ? 'Curriculum' : 'Revision'}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ── Hero Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`premium-page-hero relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(48,209,88,0.14),0_2px_8px_rgba(0,0,0,0.06)] ${currentSubTab === 'revision' ? 'hidden' : ''}`}
        style={{ background: 'linear-gradient(135deg, #E8F9EE 0%, #D0F2DC 40%, #B8E8C8 70%, #9EDDB6 100%)' }}
      >
        {/* Decorative right glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(48,209,88,0.28) 0%, transparent 70%)' }} />
        {/* Top inner shine */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[2rem] sm:rounded-t-[2.5rem]" />

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6 lg:p-8">
          {/* Top row: label + tab switcher */}
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#30D158]" strokeWidth={2.2} />
              <span className="text-[13px] font-semibold text-[#1A7A35]">Study Plan</span>
            </div>

            {/* Segmented tab switcher */}
            <div className="inline-flex p-1 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm">
              {(['curriculum', 'revision'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleSubTabChange(tab)}
                  className={`relative px-3.5 sm:px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    currentSubTab === tab ? 'text-[#1D1D1F]' : 'text-[#3A3A3C]/70 hover:text-[#1D1D1F]'
                  }`}
                >
                  {currentSubTab === tab && (
                    <motion.span
                      layoutId="study-subtab"
                      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab === 'curriculum' ? 'Curriculum' : 'Revision'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main: title + stats */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            {/* Left: heading + subtitle */}
            <div className="flex-1 min-w-0 space-y-3">
              <h1 className="text-[40px] sm:text-[52px] lg:text-[62px] font-black tracking-[-0.04em] leading-[0.88] text-[#1D1D1F]">
                Master<br />
                <span style={{ color: '#30D158' }}>19 Subjects</span>
              </h1>
              <p className="text-[14px] sm:text-[15px] font-medium text-[#3A3A3C] leading-snug max-w-xs">
                FMGE Blueprint · Clinical depth, step by step.
              </p>
              {/* Overall progress bar */}
              <div className="max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-[12px] font-semibold text-[#3A3A3C]">
                  <span>Overall Progress</span>
                  <span style={{ color: '#30D158' }}>{overallStats.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallStats.percentage}%` }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #30D158 0%, #25A244 100%)', boxShadow: '0 0 8px rgba(48,209,88,0.5)' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: complementary study-plan metrics. Overall completion is shown once in the progress bar. */}
            <div className="flex items-center gap-5 sm:gap-7 shrink-0">
              {/* Three useful counts replace a second copy of the completion gauge. */}
              <div className="space-y-3">
                {[
                  { label: 'Subjects', value: `${overallStats.completedSubjectsCount}/19`, color: '#30D158' },
                  { label: 'Topics',   value: `${overallStats.completedNotes}/${overallStats.totalTopics}`, color: '#007AFF' },
                  { label: 'Target',   value: `${state.settings?.targetScore || 200}+`, color: '#FF9500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[12px] font-medium text-[#3A3A3C] w-14">{label}</span>
                    <span className="text-[13px] font-bold text-[#1D1D1F]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {currentSubTab === 'curriculum' ? (
        <>
          {/* ── Filter + Search row ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Phase pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PHASE_FILTERS.map((p) => {
                const active = phaseFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPhaseFilter(p.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm'
                        : 'bg-white text-[#6E6E73] border-[rgba(60,60,67,0.12)] hover:text-[#1D1D1F] hover:border-[rgba(60,60,67,0.25)]'
                    }`}
                  >
                    <span className="hidden sm:inline">{p.label}</span>
                    <span className="sm:hidden">{p.short}</span>
                  </button>
                );
              })}
            </div>

            {/* Search + sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="h-3.5 w-3.5 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search subjects, topics…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white py-2 pl-9 pr-8 text-[12.5px] text-[#1D1D1F] placeholder:text-[#8E8E93] focus:border-[#30D158]/50 focus:ring-2 focus:ring-[#30D158]/15 focus:outline-none transition-all shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#C7C7CC] flex items-center justify-center text-white hover:bg-[#8E8E93] cursor-pointer transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white py-2 pl-3 pr-7 text-[12.5px] font-medium text-[#3A3A3C] focus:border-[#30D158]/50 focus:outline-none cursor-pointer transition-all shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                >
                  <option value="default">Default</option>
                  <option value="weightage">By Weightage</option>
                  <option value="progress">By Progress</option>
                  <option value="alpha">A–Z</option>
                </select>
                <ChevronRight className="h-3 w-3 text-[#8E8E93] absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ── Section label ── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
              {phaseFilter === 'all' ? 'All Subjects' : phaseFilter.replace('-', ' ')} · {filteredSubjects.length} disciplines
            </span>
            <span className="text-[11px] font-medium text-[#8E8E93]">
              {overallStats.completedSubjectsCount} completed
            </span>
          </div>

          {/* ── Subject list ── */}
          {filteredSubjects.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-5 text-center bg-white rounded-3xl border border-[rgba(60,60,67,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {/* Illustrated empty state icon */}
              <div className="relative">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#E8F9EE] to-[#C6F0D7] flex items-center justify-center shadow-sm border border-[#30D158]/15">
                  <Compass className="h-8 w-8 text-[#30D158]" strokeWidth={1.8} />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF9500] flex items-center justify-center border-2 border-white">
                  <Search className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-[16px] font-bold text-[#1D1D1F]">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No subjects in this phase'}
                </h3>
                <p className="text-[13px] text-[#8E8E93] leading-snug">
                  {searchQuery ? 'Try a different subject name or topic keyword.' : 'Select a different phase filter above.'}
                </p>
              </div>
              <button type="button"
                onClick={() => { setSearchQuery(''); setPhaseFilter('all'); }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#30D158] text-white text-[12px] font-semibold cursor-pointer hover:bg-[#25A244] transition-colors shadow-sm">
                <RotateCw className="h-3.5 w-3.5" />
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSubjects.map((sub, idx) => {
                const subProgress = state.subjectProgress[sub.id];
                const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
                const notesDoneCount = allTopics.filter(
                  (t) => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
                ).length;
                const pct = Math.round((notesDoneCount / Math.max(1, allTopics.length)) * 100);
                const nextTopic = allTopics.find((t) => !(state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone)) || allTopics[0];
                const visual = getSubjectVisual(sub.id, sub.color);
                const topicPreview = allTopics.slice(0, 3).map((t) => t.name).join(' · ');
                const isComplete = pct === 100;

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    className="relative group bg-white rounded-2xl border border-[rgba(60,60,67,0.08)] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] hover:border-[rgba(60,60,67,0.14)] transition-all overflow-hidden"
                  >
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
                      style={{ background: isComplete ? '#30D158' : visual.color }} />

                    {/* Hover color wash */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                      style={{ background: `${visual.color}05` }} />

                    <div className="relative z-10 flex items-center gap-3 sm:gap-4 pl-4 pr-3 sm:pr-4 py-3.5 sm:py-4">
                      {/* Icon */}
                      <div className="shrink-0">
                        <SubjectAppleIcon subjectId={sub.id} size="md" />
                      </div>

                      {/* Middle: name + topics */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[14px] sm:text-[15px] font-bold text-[#1D1D1F] truncate">
                            {sub.name}
                          </h3>
                          <span className="subject-mark-pill shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{ '--subject-accent': visual.color, color: visual.color, background: `${visual.color}10`, borderColor: `${visual.color}30` } as React.CSSProperties}>
                            {sub.weightage}M
                          </span>
                          {visual.badgeType === 'high' && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF3B30]/8 text-[#FF3B30] border border-[#FF3B30]/20">
                              <span className="h-1 w-1 rounded-full bg-[#FF3B30]" />
                              High-yield
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8E8E93] truncate hidden sm:block">{topicPreview}</p>
                      </div>

                      {/* Progress + CTA */}
                      <div className="shrink-0 flex items-center gap-3 sm:gap-4">
                        {/* Progress bar (md+) */}
                        <div className="hidden md:block w-28 space-y-1">
                          <div className="flex items-center justify-between text-[10.5px] font-medium text-[#8E8E93]">
                            <span>{notesDoneCount}/{allTopics.length}</span>
                            <span className="font-bold" style={{ color: isComplete ? '#30D158' : visual.color }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#F2F2F7] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(pct > 0 ? 6 : 0, pct)}%` }}
                              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full"
                              style={{ background: isComplete ? '#30D158' : visual.color }}
                            />
                          </div>
                        </div>

                        {/* Next topic (xl+) */}
                        {nextTopic && !isComplete && (
                          <div className="hidden xl:block min-w-0 max-w-[130px]">
                            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-[#C7C7CC]">Next</p>
                            <p className="text-[11.5px] font-semibold text-[#3A3A3C] truncate">{nextTopic.name}</p>
                          </div>
                        )}

                        {/* CTA button */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => { e.stopPropagation(); onSelectSubject(sub.id); }}
                          aria-label={`${isComplete ? 'Review' : 'Study'} ${sub.name}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white cursor-pointer transition-all shrink-0 shadow-sm"
                          style={{
                            background: isComplete
                              ? 'linear-gradient(135deg, #30D158 0%, #25A244 100%)'
                              : `linear-gradient(135deg, ${visual.color} 0%, ${visual.color}CC 100%)`,
                            boxShadow: `0 2px 8px ${visual.color}35`,
                          }}
                        >
                          <span>{isComplete ? 'Review' : 'Study'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <RevisionMatrixView
          state={state}
          stats={stats || calculateAppStats(state)}
          onSelectSubject={onSelectSubject}
          onToggleTopicState={onToggleTopicState}
          onUpdateSubjectRevisionDate={onUpdateSubjectRevisionDate || (() => {})}
          onBackToCurriculum={() => handleSubTabChange('curriculum')}
          onNavigateTab={onNavigateTab}
        />
      )}
    </div>
  );
};
