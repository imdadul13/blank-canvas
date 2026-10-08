import React, { useState, useMemo } from 'react';
import {
  Play,
  Search,
  ChevronDown,
  Target,
  BookOpen,
  Layers,
  TrendingUp,
  Stethoscope,
  X,
  CheckCircle2,
  Zap,
  BarChart3,
  Brain,
  Star,
  Activity,
  Award,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, ErrorNotebookItem, DailyTask } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getSubjectVisualTheme } from './SubjectAppleIcon';

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

const PILLARS = [
  { icon: Target,       label: 'Real Exam Format',      sub: '10-MCQ clinical drills',   color: '#007AFF', grad: 'from-blue-500 to-cyan-500'    },
  { icon: BookOpen,     label: 'Deep Explanations',     sub: 'Distractor breakdown',      color: '#5856D6', grad: 'from-violet-500 to-purple-600' },
  { icon: Layers,       label: 'Distractor Analysis',   sub: 'Learn why traps fail',      color: '#30D158', grad: 'from-emerald-500 to-teal-600'  },
  { icon: TrendingUp,   label: 'Track Progress',        sub: 'Live pacing & accuracy',    color: '#FF9500', grad: 'from-amber-500 to-orange-500'   },
  { icon: Stethoscope,  label: 'Clinical Retention',    sub: 'High-yield recalls',        color: '#FF3B30', grad: 'from-rose-500 to-red-600'       },
];

export const PracticeView: React.FC<PracticeViewProps> = ({
  state,
  onLaunchPracticeSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('medicine');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHighYield, setFilterHighYield] = useState(false);

  const selectedSubject = useMemo(
    () => FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || FMGE_SUBJECTS[0],
    [selectedSubjectId]
  );

  const allTopicsList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const all: Array<{
      subjectId: string; subjectName: string; subjectWeightage: number;
      id: string; name: string; isHighYield: boolean;
    }> = [];
    FMGE_SUBJECTS.forEach((sub) => {
      sub.topics.forEach((t) => {
        if (!query || t.name.toLowerCase().includes(query) || sub.name.toLowerCase().includes(query)) {
          all.push({
            subjectId: sub.id, subjectName: sub.name, subjectWeightage: sub.weightage,
            id: t.id, name: t.name, isHighYield: Boolean(t.isHighYield),
          });
        }
      });
    });
    return all;
  }, [searchQuery]);

  const displayedTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let topics = selectedSubject.topics
      .filter((t) => !query || t.name.toLowerCase().includes(query))
      .map((t) => ({
        subjectId: selectedSubject.id, subjectName: selectedSubject.name,
        subjectWeightage: selectedSubject.weightage, id: t.id,
        name: t.name, isHighYield: Boolean(t.isHighYield),
      }));
    if (filterHighYield) topics = topics.filter((t) => t.isHighYield);
    return topics;
  }, [selectedSubject, searchQuery, filterHighYield]);

  const highYieldCount = displayedTopics.filter((t) => t.isHighYield).length;
  const subjectTheme = getSubjectVisualTheme(selectedSubject.id);

  return (
    <div data-accent="practice" className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 sm:pb-20 lg:pb-16 space-y-5 font-['Plus_Jakarta_Sans'] text-[#1D1D1F]">

      {/* ═══ HERO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="premium-page-hero relative rounded-[1.75rem] sm:rounded-[2.25rem] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE0A0 40%, #FFC860 70%, #FF9500 100%)',
          boxShadow: '0 8px 40px rgba(255,149,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Decorative right glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,149,0,0.28) 0%, transparent 70%)' }} />
        {/* Top inner shine */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

        {/* Animated pulse rings (top-right) */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 sm:w-56 sm:h-56 pointer-events-none">
          <motion.div className="absolute inset-0 rounded-full border border-[#FF9500]/[0.15]"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute inset-4 rounded-full border border-[#FF9500]/[0.10]"
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,149,0,0.12)' }}
            >
              <Stethoscope className="h-7 w-7" style={{ color: 'rgba(180,80,0,0.4)' }} />
            </motion.div>
          </div>
        </div>

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl border flex items-center justify-center"
              style={{ background: 'rgba(255,149,0,0.15)', borderColor: 'rgba(180,80,0,0.2)' }}>
              <Activity className="h-3.5 w-3.5" style={{ color: '#7A3A00' }} />
            </div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#7A3A00' }}>
              PRACTICE ENGINE · 10-MCQ CLINICAL DRILLS
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-12">
            {/* Left: headline */}
            <div className="flex-1 min-w-0 space-y-3">
              <h1 className="text-[36px] sm:text-[50px] font-black tracking-[-0.04em] leading-[0.88] text-[#1D1D1F]">
                Clinical<br />
                <span style={{ color: '#FF9500' }}>Vignettes</span>
                <span className="text-[#1D1D1F]"> &amp; Drills</span>
              </h1>
              <p className="text-[13px] sm:text-[14px] leading-snug max-w-sm" style={{ color: '#3A3A3C' }}>
                FMGE-style 10-MCQ sessions with active recall, distractor breakdown &amp; instant feedback.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { icon: Zap,          label: 'Active Recall',       color: '#FF9500' },
                  { icon: BarChart3,    label: 'Performance Insights', color: '#30D158' },
                  { icon: CheckCircle2, label: 'Exam-Ready',           color: '#007AFF' },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(180,80,0,0.15)' }}>
                    <Icon className="h-3 w-3" style={{ color }} />
                    <span style={{ color: '#3A3A3C' }}>{label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right: stat capsules */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap lg:flex-nowrap">
              <div className="flex flex-col items-center px-5 py-3.5 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(180,80,0,0.15)' }}>
                <span className="font-black text-[28px] text-[#1D1D1F] leading-none">{allTopicsList.length}</span>
                <span className="text-[11px] font-medium mt-0.5" style={{ color: '#6E6E73' }}>Topics</span>
              </div>
              <div className="flex flex-col items-center px-5 py-3.5 rounded-2xl text-center"
                style={{ background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.25)' }}>
                <span className="font-black text-[28px] leading-none" style={{ color: '#C85000' }}>
                  {allTopicsList.filter((t) => t.isHighYield).length}
                </span>
                <span className="text-[11px] font-medium mt-0.5" style={{ color: '#C85000' }}>High-Yield</span>
              </div>
              <div className="flex flex-col items-center px-5 py-3.5 rounded-2xl text-center"
                style={{ background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.2)' }}>
                <span className="font-black text-[28px] leading-none" style={{ color: '#1A7A35' }}>19</span>
                <span className="text-[11px] font-medium mt-0.5" style={{ color: '#1A7A35' }}>Subjects</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ STICKY SUBJECT SELECTOR + CONTROLS ═══ */}
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 space-y-3 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-[rgba(60,60,67,0.1)]">
        {/* Subject pill scroller */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
          {FMGE_SUBJECTS.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            const theme = getSubjectVisualTheme(sub.id);
            return (
              <motion.button
                key={sub.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedSubjectId(sub.id); setSearchQuery(''); setFilterHighYield(false); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-white text-[#3A3A3C] border-[rgba(60,60,67,0.12)] hover:text-[#1D1D1F] hover:border-[rgba(60,60,67,0.22)] shadow-xs'
                }`}
                style={isSelected ? { background: theme.color, borderColor: theme.color, boxShadow: `0 2px 8px ${theme.color}40` } : {}}
              >
                <span>{sub.name}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-white/70' : 'text-[#8E8E93]'}`}>{sub.weightage}M</span>
              </motion.button>
            );
          })}
        </div>

        {/* Search + filters row */}
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${selectedSubject.name} topics…`}
              className="w-full pl-9 pr-9 py-2 text-[13px] text-[#1D1D1F] placeholder:text-[#8E8E93] bg-white border border-[rgba(60,60,67,0.12)] rounded-xl outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15 transition-all shadow-xs"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#C7C7CC] flex items-center justify-center text-white cursor-pointer hover:bg-[#8E8E93] transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* High-yield filter toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterHighYield(!filterHighYield)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-all cursor-pointer shrink-0 ${
              filterHighYield
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white text-[#3A3A3C] border-[rgba(60,60,67,0.12)] hover:border-amber-300 shadow-xs'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${filterHighYield ? 'fill-white' : 'text-amber-500'}`} />
            <span className="hidden sm:inline">High-Yield</span>
            {highYieldCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${filterHighYield ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'}`}>
                {highYieldCount}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* ═══ SUBJECT CONTEXT CARD ═══ */}
      <motion.div
        key={selectedSubjectId}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5"
        style={{
          background: `linear-gradient(135deg, ${subjectTheme.color}08 0%, white 60%)`,
          borderColor: `${subjectTheme.color}25`,
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 80% 50%, ${subjectTheme.color}10 0%, transparent 70%)` }} />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Color accent block */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-lg shadow-sm"
              style={{ background: `linear-gradient(135deg, ${subjectTheme.color} 0%, ${subjectTheme.color}CC 100%)`, boxShadow: `0 4px 14px ${subjectTheme.color}40` }}>
              {selectedSubject.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-[17px] text-[#1D1D1F] truncate">{selectedSubject.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono shrink-0"
                  style={{ color: subjectTheme.color, background: `${subjectTheme.color}12`, borderColor: `${subjectTheme.color}30` }}>
                  {selectedSubject.weightage} Marks
                </span>
              </div>
              <p className="text-[12px] text-[#8E8E93] mt-0.5">
                {displayedTopics.length} topics · {highYieldCount} high-yield · 10 MCQs per session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-[rgba(60,60,67,0.12)] text-[#3A3A3C] shadow-xs whitespace-nowrap">
              FMGE Blueprint
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══ TOPIC DRILLS LIST ═══ */}
      <div className="rounded-2xl sm:rounded-3xl border border-[rgba(60,60,67,0.09)] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* List header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[rgba(60,60,67,0.07)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${subjectTheme.color} 0%, ${subjectTheme.color}CC 100%)`, boxShadow: `0 2px 8px ${subjectTheme.color}35` }}>
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-[14px] text-[#1D1D1F]">
                {filterHighYield ? 'High-Yield ' : ''}{selectedSubject.name} Topics
              </span>
              <span className="ml-2 text-[11px] text-[#8E8E93] font-mono">{displayedTopics.length} modules</span>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-semibold text-[#8E8E93] bg-[#F2F2F7] px-2.5 py-1 rounded-lg">
            10-MCQ / session
          </span>
        </div>

        {/* Topics */}
        <AnimatePresence mode="wait">
          {displayedTopics.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex flex-col items-center gap-4 text-center px-6"
            >
              {/* Illustrated empty state */}
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${subjectTheme.color}15` }}>
                  <Search className="h-7 w-7" style={{ color: subjectTheme.color }} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF3B30] border-2 border-white flex items-center justify-center">
                  <X className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-[#1D1D1F]">
                  {filterHighYield ? 'No high-yield topics here' : `No topics match "${searchQuery}"`}
                </h3>
                <p className="text-[12px] text-[#8E8E93] mt-1">
                  {filterHighYield ? 'Try turning off the High-Yield filter' : 'Try a different search term or subject'}
                </p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSearchQuery(''); setFilterHighYield(false); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold cursor-pointer shadow-sm transition-all"
                style={{ background: subjectTheme.color, boxShadow: `0 3px 10px ${subjectTheme.color}40` }}
              >
                Clear filters
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-[rgba(60,60,67,0.06)]"
            >
              {displayedTopics.map((topic, idx) => (
                <motion.div
                  key={`${topic.subjectId}-${topic.id}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.02, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onLaunchPracticeSession(topic.subjectId, topic.id, topic.name)}
                  className="group flex items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-[#F2F2F7]/60 transition-colors cursor-pointer"
                >
                  {/* Left: accent + topic info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Subject color accent bar */}
                    <div className="w-1 h-10 rounded-full shrink-0 transition-all group-hover:h-12"
                      style={{ background: topic.isHighYield ? '#FF9500' : subjectTheme.color }} />

                    {/* Index */}
                    <span className="w-6 h-6 rounded-md bg-[#F2F2F7] text-[#8E8E93] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Topic name + badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[14px] text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                          {topic.name}
                        </span>
                        {topic.isHighYield && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            High-Yield
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-[#8E8E93] mt-0.5">
                        10 clinical vignettes · FMGE pattern · instant breakdown
                      </p>
                    </div>
                  </div>

                  {/* Right: CTA */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                    onClick={(e) => { e.stopPropagation(); onLaunchPracticeSession(topic.subjectId, topic.id, topic.name); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold text-white shrink-0 cursor-pointer transition-all shadow-xs group-hover:shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${subjectTheme.color} 0%, ${subjectTheme.color}CC 100%)`,
                      boxShadow: `0 2px 8px ${subjectTheme.color}35`,
                    }}
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Start</span>
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ FEATURE PILLARS ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="h-3.5 w-3.5 text-[#8E8E93]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Why Practice Here</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PILLARS.map(({ icon: Icon, label, sub, color, grad }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative overflow-hidden p-4 rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:border-[rgba(60,60,67,0.14)] transition-all group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `${color}05` }} />
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${grad} text-white flex items-center justify-center mb-3 shadow-sm`}
                style={{ boxShadow: `0 3px 10px ${color}35` }}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-[13px] text-[#1D1D1F] leading-tight">{label}</h4>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
