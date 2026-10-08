import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Activity,
  Target,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Sprout,
  Play,
  FileText,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  X,
  RotateCcw,
  Check,
  Zap,
  Brain,
  Award,
  Search,
  Filter,
  Clock,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState } from '../types';
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

// — Circular gauge
const Gauge: React.FC<{
  pct: number; size?: number; sw?: number; color?: string; track?: string;
}> = ({ pct, size = 56, sw = 5, color = '#007AFF', track = '#E5E7EB' }) => {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <span className="absolute font-mono text-[11px] font-black text-slate-900 tracking-tight leading-none">
        {pct}%
      </span>
    </div>
  );
};

// — Phase pill badge
const PhasePill: React.FC<{ label: string; active: boolean; color: string; bgActive: string; onClick: () => void }> = ({
  label, active, color, bgActive, onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer border ${
      active
        ? `text-white shadow-sm`
        : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'
    }`}
    style={active ? { background: color, borderColor: color } : {}}
  >
    {label}
  </button>
);

const PHASE_COLORS = {
  r1: { color: '#0891B2', track: '#CFFAFE', gradient: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50', border: 'border-cyan-200/60', text: 'text-cyan-700' },
  r2: { color: '#D97706', track: '#FEF3C7', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-700' },
  r3: { color: '#E11D48', track: '#FFE4E6', gradient: 'from-rose-500 to-red-600', bg: 'bg-rose-50', border: 'border-rose-200/60', text: 'text-rose-700' },
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
  const [sortBy, setSortBy] = useState<'priority' | 'progress-asc' | 'progress-desc' | 'alpha'>('priority');
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarSubjectId, setCalendarSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'r1' | 'r2' | 'r3'>('all');

  const subjectsWithMetrics = useMemo(() => {
    return FMGE_SUBJECTS.map((sub) => {
      const subProgress = state.subjectProgress[sub.id];
      const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
      const total = Math.max(1, allTopics.length);

      const notesDone = allTopics.filter(t => state.topicsState[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone).length;
      const r1Done = allTopics.filter(t => state.topicsState[`${sub.id}-${t.id}`]?.r1Done ?? t.r1Done).length;
      const r2Done = allTopics.filter(t => state.topicsState[`${sub.id}-${t.id}`]?.r2Done ?? t.r2Done).length;
      const r3Done = allTopics.filter(t => state.topicsState[`${sub.id}-${t.id}`]?.r3Done ?? t.r3Done).length;

      return {
        subject: sub,
        allTopics,
        totalTopics: allTopics.length,
        notesDone,
        r1Done, r2Done, r3Done,
        progressPct: Math.round((notesDone / total) * 100),
        r1Pct: Math.round((r1Done / total) * 100),
        r2Pct: Math.round((r2Done / total) * 100),
        r3Pct: Math.round((r3Done / total) * 100),
        revisionTargetDate: subProgress?.targetRevisionDate,
      };
    });
  }, [state.subjectProgress, state.topicsState]);

  const sorted = useMemo(() => {
    let list = [...subjectsWithMetrics];
    if (sortBy === 'priority') list.sort((a, b) => b.subject.weightage - a.subject.weightage);
    else if (sortBy === 'progress-asc') list.sort((a, b) => a.progressPct - b.progressPct);
    else if (sortBy === 'progress-desc') list.sort((a, b) => b.progressPct - a.progressPct);
    else list.sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.subject.name.toLowerCase().includes(q) || item.subject.code.toLowerCase().includes(q));
    }
    if (phaseFilter === 'r1') list = list.filter(item => item.r1Pct < 100);
    else if (phaseFilter === 'r2') list = list.filter(item => item.r2Pct < 100);
    else if (phaseFilter === 'r3') list = list.filter(item => item.r3Pct < 100);

    return list;
  }, [subjectsWithMetrics, sortBy, searchQuery, phaseFilter]);

  const displayed = showAll ? sorted : sorted.slice(0, 10);

  const handleContinueRevision = () => {
    for (const item of subjectsWithMetrics) {
      const pending = item.allTopics.find(t =>
        !(state.topicsState[`${item.subject.id}-${t.id}`]?.r1Done ?? t.r1Done)
      );
      if (pending) { onSelectSubject(item.subject.id); return; }
    }
    if (FMGE_SUBJECTS.length > 0) onSelectSubject(FMGE_SUBJECTS[0].id);
  };

  const handleFocusWeak = () => {
    setSortBy('progress-asc');
    setShowAll(true);
    const weakest = [...subjectsWithMetrics].sort((a, b) => a.progressPct - b.progressPct)[0];
    if (weakest) setExpandedId(weakest.subject.id);
  };

  const calendarSubject = calendarSubjectId
    ? subjectsWithMetrics.find(s => s.subject.id === calendarSubjectId)
    : null;

  // Overall revision health
  const overallRevisionPct = Math.round(
    ((stats.completedR1Topics || 0) + (stats.completedR2Topics || 0) + (stats.completedR3Topics || 0)) /
    (Math.max(1, (stats.totalTopics || 1) * 3)) * 100
  );

  return (
    <div
      className="space-y-5 sm:space-y-7 pb-24 sm:pb-20 lg:pb-16 font-['Plus_Jakarta_Sans'] text-[#1D1D1F]"
    >

      {/* ═══ HERO BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem]"
        style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #1A3A5C 40%, #0E4F8C 70%, #0070CC 100%)',
          boxShadow: '0 8px 40px rgba(0,112,204,0.28), 0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {/* Radial glow */}
        <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(0,122,255,0.35) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Decorative orbit circles */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 sm:w-52 sm:h-52 rounded-full border border-white/[0.08] pointer-events-none" />
        <div className="absolute right-16 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/[0.06] pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                  REVISION MATRIX
                </span>
              </div>

              <h1 className="text-[36px] sm:text-[48px] font-black tracking-[-0.04em] leading-[0.88] text-white">
                Learn.<br />
                <span style={{ color: '#60B3FF' }}>Revise. Retain.</span>
              </h1>

              <p className="text-[13px] sm:text-[14px] text-white/60 leading-snug max-w-sm">
                3-phase spaced-repetition system — R1 Foundation · R2 Rapid Review · R3 Final Sprint
              </p>

              {/* Overall progress bar */}
              <div className="max-w-xs space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
                  <span>Revision health</span>
                  <span style={{ color: '#60B3FF' }}>{overallRevisionPct}%</span>
                </div>
                <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallRevisionPct}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #60B3FF 0%, #007AFF 100%)', boxShadow: '0 0 10px rgba(96,179,255,0.6)' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: 3 phase summary pills */}
            <div className="flex sm:flex-row lg:flex-col gap-2.5 sm:gap-3 lg:gap-2 shrink-0">
              {[
                { label: 'R1 Foundation', pct: stats.r1Percentage || 0, done: stats.completedR1Topics || 0, color: '#0891B2', icon: BookOpen },
                { label: 'R2 Rapid Review', pct: stats.r2Percentage || 0, done: stats.completedR2Topics || 0, color: '#D97706', icon: RotateCcw },
                { label: 'R3 Final Sprint', pct: stats.r3Percentage || 0, done: stats.completedR3Topics || 0, color: '#E11D48', icon: Target },
              ].map(({ label, pct, done, color, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}30` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider leading-none">{label}</div>
                    <div className="text-[13px] font-bold text-white leading-tight mt-0.5">
                      {done}
                      <span className="text-white/40 text-[10px] font-normal"> / {stats.totalTopics}</span>
                      <span className="ml-1.5 font-mono text-[11px]" style={{ color }}>{pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ 3 PHASE BENTO CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[
          {
            phase: 'R1', title: 'Foundation', subtitle: 'Build core concepts',
            pct: stats.r1Percentage || 0, done: stats.completedR1Topics || 0,
            ...PHASE_COLORS.r1,
            description: 'First-pass study → Notes + textbook understanding',
          },
          {
            phase: 'R2', title: 'Rapid Review', subtitle: 'Active recall & MCQs',
            pct: stats.r2Percentage || 0, done: stats.completedR2Topics || 0,
            ...PHASE_COLORS.r2,
            description: 'Spaced repetition → Quick-fire recall sessions',
          },
          {
            phase: 'R3', title: 'Final Sprint', subtitle: 'High-yield blitz',
            pct: stats.r3Percentage || 0, done: stats.completedR3Topics || 0,
            ...PHASE_COLORS.r3,
            description: 'Exam-mode revision → FMGE high-yield only',
          },
        ].map(({ phase, title, subtitle, pct, done, color, track, gradient, bg, border, text, description }, i) => (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border ${border} bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-all group`}
          >
            {/* Subtle color wash */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `${color}05` }} />

            <div className="relative flex flex-col gap-3.5">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                    style={{ boxShadow: `0 3px 10px ${color}35` }}>
                    <span className="font-mono font-black text-[13px]">{phase}</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1D1D1F] text-[14px] leading-tight">{title}</div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5">{subtitle}</div>
                  </div>
                </div>
                <Gauge pct={pct} size={52} sw={4.5} color={color} track={track} />
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct > 0 ? 5 : 0, pct)}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-mono text-slate-500">{done} / {stats.totalTopics} topics</span>
                  <span className="font-semibold" style={{ color }}>{pct}% done</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-[#8E8E93] leading-snug border-t border-slate-100 pt-2.5">
                {description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ MAIN SUBJECT MATRIX ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Subject list — full width on mobile, 8 cols on lg */}
        <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden">

          {/* Card header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF] shrink-0">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">Subject Revision Matrix</h2>
                <p className="text-[11px] text-[#8E8E93] font-mono">19 subjects · {stats.totalTopics} topics total</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Phase filter pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
                {(['all', 'r1', 'r2', 'r3'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPhaseFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono uppercase transition-all cursor-pointer ${
                      phaseFilter === f
                        ? 'bg-white text-[#1D1D1F] shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {f === 'all' ? 'All' : f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11.5px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 cursor-pointer"
                >
                  <option value="priority">Exam priority</option>
                  <option value="progress-desc">Progress ↓</option>
                  <option value="progress-asc">Progress ↑</option>
                  <option value="alpha">A–Z</option>
                </select>
                <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search row */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search subjects…"
                className="w-full pl-8 pr-8 py-2 text-[12.5px] text-[#1D1D1F] placeholder:text-[#8E8E93] bg-transparent border-none outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#C7C7CC] flex items-center justify-center text-white cursor-pointer hover:bg-[#8E8E93] transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 sm:px-6 py-2 border-b border-slate-100 bg-slate-50/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">Subject</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 w-10 text-center">R1</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 w-10 text-center">R2</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 w-10 text-center">R3</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93] w-8"></span>
          </div>

          {/* Subject rows */}
          <div className="divide-y divide-slate-100/80">
            {displayed.map((item, idx) => {
              const isExpanded = expandedId === item.subject.id;
              const isComplete = item.progressPct === 100;
              const subColor = item.subject.color || '#007AFF';

              return (
                <div key={item.subject.id}>
                  {/* Summary row */}
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.025 }}
                    onClick={() => setExpandedId(isExpanded ? null : item.subject.id)}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 sm:px-6 py-3 hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    {/* Subject info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Left accent + number */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: isComplete ? '#30D158' : subColor }} />
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono text-[10px] font-semibold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[13px] text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors truncate">
                            {item.subject.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0"
                            style={{ color: subColor, background: `${subColor}12`, borderColor: `${subColor}30` }}>
                            {item.subject.weightage}M
                          </span>
                          {isComplete && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/25 shrink-0">
                              <Check className="h-2.5 w-2.5" />
                              Done
                            </span>
                          )}
                        </div>

                        {/* Progress mini bar (visible on all sizes) */}
                        <div className="mt-1 h-1 w-full max-w-[120px] bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.progressPct}%`, background: isComplete ? '#30D158' : subColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Phase progress — hidden on mobile, shown on sm+ */}
                    <div className="hidden sm:flex items-center justify-center w-10">
                      <span className={`text-[11px] font-mono font-bold ${item.r1Pct === 100 ? 'text-cyan-600' : 'text-slate-300'}`}>
                        {item.r1Pct === 100 ? <Check className="h-3.5 w-3.5 inline" /> : `${item.r1Pct}%`}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-10">
                      <span className={`text-[11px] font-mono font-bold ${item.r2Pct === 100 ? 'text-amber-600' : 'text-slate-300'}`}>
                        {item.r2Pct === 100 ? <Check className="h-3.5 w-3.5 inline" /> : `${item.r2Pct}%`}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center justify-center w-10">
                      <span className={`text-[11px] font-mono font-bold ${item.r3Pct === 100 ? 'text-rose-600' : 'text-slate-300'}`}>
                        {item.r3Pct === 100 ? <Check className="h-3.5 w-3.5 inline" /> : `${item.r3Pct}%`}
                      </span>
                    </div>

                    {/* Expand toggle */}
                    <div className="flex items-center justify-center w-8 col-start-2 sm:col-auto">
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Expanded topic list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-3 sm:mx-6 mb-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 overflow-hidden">
                          {/* Expanded header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 bg-white/60">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[12.5px] text-[#1D1D1F]">{item.subject.name}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-slate-200/70 text-slate-600">
                                {item.subject.weightage} Marks
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setCalendarSubjectId(item.subject.id); setCalendarOpen(true); }}
                                className="flex items-center gap-1 text-[11px] text-[#8E8E93] hover:text-[#007AFF] transition-colors cursor-pointer"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{item.revisionTargetDate ? item.revisionTargetDate : 'Set date'}</span>
                              </button>
                              <span className="text-[#C7C7CC]">·</span>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onSelectSubject(item.subject.id); }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer"
                              >
                                Open Study
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Phase column headers inside expanded */}
                          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 border-b border-slate-100 bg-white/30">
                            <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#8E8E93]">Topic</span>
                            <span className="text-[9.5px] font-bold uppercase tracking-widest text-cyan-600 w-10 text-center">R1</span>
                            <span className="text-[9.5px] font-bold uppercase tracking-widest text-amber-600 w-10 text-center">R2</span>
                            <span className="text-[9.5px] font-bold uppercase tracking-widest text-rose-600 w-10 text-center">R3</span>
                          </div>

                          {/* Topic rows */}
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100/70">
                            {item.allTopics.map((topic) => {
                              const tState = state.topicsState[`${item.subject.id}-${topic.id}`] || {};
                              const isR1 = tState.r1Done ?? topic.r1Done;
                              const isR2 = tState.r2Done ?? topic.r2Done;
                              const isR3 = tState.r3Done ?? topic.r3Done;

                              return (
                                <div key={topic.id}
                                  className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 bg-white/40 hover:bg-white/70 transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {topic.isHighYield && (
                                      <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500 shrink-0" />
                                    )}
                                    <span className="text-[12px] font-medium text-[#1D1D1F] truncate">
                                      {topic.name}
                                    </span>
                                  </div>

                                  {/* R1 toggle */}
                                  <button
                                    type="button"
                                    title="Toggle R1 Foundation"
                                    onClick={() => onToggleTopicState(item.subject.id, topic.id, 'r1Done')}
                                    className={`w-10 h-7 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center border ${
                                      isR1
                                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                        : 'bg-white text-slate-300 border-slate-200 hover:border-cyan-300 hover:text-cyan-500'
                                    }`}
                                  >
                                    {isR1 ? <Check className="h-3 w-3" /> : 'R1'}
                                  </button>

                                  {/* R2 toggle */}
                                  <button
                                    type="button"
                                    title="Toggle R2 Rapid Review"
                                    onClick={() => onToggleTopicState(item.subject.id, topic.id, 'r2Done')}
                                    className={`w-10 h-7 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center border ${
                                      isR2
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-white text-slate-300 border-slate-200 hover:border-amber-300 hover:text-amber-500'
                                    }`}
                                  >
                                    {isR2 ? <Check className="h-3 w-3" /> : 'R2'}
                                  </button>

                                  {/* R3 toggle */}
                                  <button
                                    type="button"
                                    title="Toggle R3 Final Sprint"
                                    onClick={() => onToggleTopicState(item.subject.id, topic.id, 'r3Done')}
                                    className={`w-10 h-7 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center border ${
                                      isR3
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                        : 'bg-white text-slate-300 border-slate-200 hover:border-rose-300 hover:text-rose-500'
                                    }`}
                                  >
                                    {isR3 ? <Check className="h-3 w-3" /> : 'R3'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/40">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-[12px] font-semibold text-[#3A3A3C] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span>{showAll ? `Show fewer` : `View all ${sorted.length} subjects`}</span>
              <motion.div animate={{ rotate: showAll ? 180 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Right sidebar — Quick Actions & Journey */}
        <div className="lg:col-span-4 space-y-4">

          {/* Quick Actions */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20 flex items-center justify-center text-[#FF9500]">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-tight">Quick Actions</h3>
                <p className="text-[11px] text-[#8E8E93]">Jump right in</p>
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              {[
                {
                  label: 'Continue Revision', sub: 'Pick up where you left off',
                  icon: Play, iconBg: '#007AFF', iconFill: true,
                  onClick: handleContinueRevision,
                },
                {
                  label: 'Focus Weak Subjects', sub: 'Sort by lowest progress',
                  icon: Target, iconBg: '#FF3B30', iconFill: false,
                  onClick: handleFocusWeak,
                },
                {
                  label: 'View Curriculum', sub: 'Switch to study mode',
                  icon: BookOpen, iconBg: '#30D158', iconFill: false,
                  onClick: onBackToCurriculum,
                },
                {
                  label: 'Revision Calendar', sub: 'Set target dates',
                  icon: Calendar, iconBg: '#5856D6', iconFill: false,
                  onClick: () => { setCalendarSubjectId(null); setCalendarOpen(true); },
                },
                ...(onNavigateTab ? [{
                  label: 'Analytics', sub: 'View detailed progress',
                  icon: BarChart3, iconBg: '#FF9500', iconFill: false,
                  onClick: () => onNavigateTab('progress'),
                }] : []),
              ].map(({ label, sub, icon: Icon, iconBg, iconFill, onClick }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={onClick}
                  className="w-full p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-200 flex items-center gap-3 text-left cursor-pointer transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-105"
                    style={{ background: iconBg, boxShadow: `0 2px 8px ${iconBg}40` }}>
                    <Icon className={`h-4 w-4 ${iconFill ? 'fill-white' : ''}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-tight">
                      {label}
                    </div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5 truncate">{sub}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Stats tile */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center text-[#30D158]">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-[#1D1D1F] text-[14px]">Revision Stats</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Topics', value: stats.totalTopics, icon: BookOpen, color: '#007AFF' },
                { label: 'Covered', value: stats.completedR1Topics || 0, icon: CheckCircle2, color: '#30D158' },
                { label: 'Progress', value: `${stats.r1Percentage || 0}%`, icon: Activity, color: '#FF9500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                  <div className="font-black text-[18px] text-[#1D1D1F] leading-none tracking-tight">{value}</div>
                  <div className="text-[10px] text-[#8E8E93] font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Motivational banner */}
            <div className="relative overflow-hidden rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, #E8F9EE 0%, #D0F2DC 100%)', border: '1px solid rgba(48,209,88,0.25)' }}>
              <Sprout className="h-4 w-4 text-[#30D158] mb-2" />
              <p className="text-[11.5px] font-medium text-[#1A7A35] leading-snug italic">
                "Small, consistent revisions today build the confident doctor you'll be tomorrow."
              </p>
              {/* Mountain decoration */}
              <svg className="absolute right-0 bottom-0 opacity-20 pointer-events-none" width="100" height="44" viewBox="0 0 100 44" fill="none">
                <path d="M0 44L30 18L55 32L80 7L100 44H0Z" fill="#30D158" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ REVISION CALENDAR MODAL (inline, no createPortal) ═══ */}
      <AnimatePresence>
        {calendarOpen && (
          <motion.div
            key="calendar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="font-['Plus_Jakarta_Sans']"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9500, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => { if (e.target === e.currentTarget) setCalendarOpen(false); }}
          >
            <motion.div
              key="calendar-card"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-[0_25px_60px_rgba(0,0,0,0.2)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#5856D6]/10 border border-[#5856D6]/20 flex items-center justify-center text-[#5856D6]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">
                      {calendarSubject ? calendarSubject.subject.name : 'Revision Calendar'}
                    </h3>
                    <p className="text-[11px] text-[#8E8E93]">
                      {calendarSubject ? 'Set your target revision date' : 'Schedule target dates for all subjects'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#8E8E93] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {(calendarSubject ? [calendarSubject] : subjectsWithMetrics).map((item) => (
                  <div key={item.subject.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-[#1D1D1F] truncate">{item.subject.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-600 shrink-0">
                          {item.subject.weightage}M
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-[#8E8E93] font-mono">
                        <span>R1: {item.r1Pct}%</span>
                        <span>·</span>
                        <span>R2: {item.r2Pct}%</span>
                        <span>·</span>
                        <span>R3: {item.r3Pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.revisionTargetDate && (
                        <Clock className="h-3 w-3 text-[#5856D6]" />
                      )}
                      <input
                        type="date"
                        value={item.revisionTargetDate || ''}
                        onChange={e => onUpdateSubjectRevisionDate(item.subject.id, e.target.value)}
                        aria-label={`Target date for ${item.subject.name}`}
                        className="px-2.5 py-1.5 text-[12px] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 font-mono text-[#1D1D1F] cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)', boxShadow: '0 3px 10px rgba(88,86,214,0.35)' }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
