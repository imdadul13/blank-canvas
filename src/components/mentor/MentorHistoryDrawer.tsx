import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  X,
  Clock,
  Star,
  Stethoscope,
  Brain,
  Pill,
  Microscope,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Layers,
  Award,
  AlertTriangle,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { CoachSession } from '../AiCoachView';
import { useCircadianTheme } from '../../hooks/useCircadianTheme';
import {
  extractSessionIntelligence,
  groupSessionsByDate,
  filterSessions,
  SessionIntentType,
  SessionIntelligence,
} from '../../utils/mentorSessionIntelligence';

interface MentorHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  sessions: CoachSession[];
  filteredSessions?: CoachSession[];
  activeSessionId: string | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectSession: (session: CoachSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onTogglePinSession?: (id: string, e: React.MouseEvent) => void;
  onClearAllHistory: () => void;
  onClearUnpinnedHistory?: () => void;
  formatRelativeDate: (dateStr: string) => string;
}

export const MentorHistoryDrawer: React.FC<MentorHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onNewSession,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onTogglePinSession,
  onClearAllHistory,
  onClearUnpinnedHistory,
  formatRelativeDate,
}) => {
  const circadian = useCircadianTheme();
  const [internalSearch, setInternalSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<SessionIntentType>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const starredCount = useMemo(() => sessions.filter((s) => s.isPinned).length, [sessions]);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Keyboard accessibility: ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmClear) setConfirmClear(false);
        else if (sessionToDelete) setSessionToDelete(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmClear, sessionToDelete, onClose]);

  // Compute processed, filtered, and sorted sessions
  const processedSessions = useMemo(() => {
    return filterSessions(sessions, internalSearch, activeFilter);
  }, [sessions, internalSearch, activeFilter]);

  // Group filtered sessions into smart date buckets
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(processedSessions);
  }, [processedSessions]);

  // Quick filter pills definition
  const filterPills: Array<{ id: SessionIntentType; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'mcq', label: 'MCQs', icon: Award },
    { id: 'concept', label: 'Concepts', icon: Brain },
    { id: 'differential', label: 'Differentials', icon: Stethoscope },
    { id: 'pharmacology', label: 'Pharma & DOC', icon: Pill },
    { id: 'investigation', label: 'Investigations', icon: Microscope },
  ];

  const getIntentIcon = (type: SessionIntentType) => {
    switch (type) {
      case 'mcq':
        return Award;
      case 'differential':
        return Stethoscope;
      case 'pharmacology':
        return Pill;
      case 'investigation':
        return Microscope;
      case 'revision':
        return RotateCcw;
      default:
        return Brain;
    }
  };

  const activeCount = sessions.filter((s) => s.id === activeSessionId).length;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/50 backdrop-blur-xs select-none">
          {/* Backdrop Click Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-pointer"
            aria-hidden="true"
          />

          {/* Main Slide-Over Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`relative w-full max-w-full sm:max-w-md lg:max-w-lg h-[100dvh] flex flex-col shadow-2xl border-l z-10 font-sans transition-colors duration-300 ${
              circadian.isNight
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-[#FAF9F6] border-stone-200/90 text-slate-900'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-history-title"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
            }}
          >
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1.5 sm:hidden shrink-0" />

            {/* ── 1. Editorial Drawer Header ───────────────────────────────────── */}
            <div
              className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between shrink-0 ${
                circadian.isNight
                  ? 'bg-slate-900/90 border-slate-800/80'
                  : 'bg-white/90 border-stone-200/80 backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Glowing Clinical Insignia */}
                <div
                  className={`relative flex items-center justify-center h-10 w-10 rounded-2xl shrink-0 shadow-xs transition-transform ${
                    circadian.isNight
                      ? 'bg-gradient-to-br from-slate-800 to-cyan-950 text-cyan-400 border border-cyan-500/30'
                      : 'bg-gradient-to-br from-[#006B63] to-[#044E48] text-emerald-50 shadow-teal-950/15'
                  }`}
                >
                  <History className="h-5 w-5 stroke-[2]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      id="mentor-history-title"
                      className={`text-base sm:text-lg font-extrabold uppercase tracking-tight font-['Outfit'] truncate ${
                        circadian.isNight
                          ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-slate-950 via-slate-800 to-[#006B63] bg-clip-text text-transparent'
                      }`}
                    >
                      Consultation History
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono tracking-tight">
                    {sessions.length} saved session{sessions.length === 1 ? '' : 's'}
                    {activeCount > 0 && ' · 1 live session'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-full transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
                  circadian.isNight
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-stone-100'
                }`}
                aria-label="Close consultation history drawer"
                title="Close (Esc)"
              >
                <X className="h-5 w-5 stroke-[2.2]" />
              </button>
            </div>

            {/* ── 2. Top Actions & Smart Search Desk ──────────────────────────── */}
            <div
              className={`p-3.5 sm:p-4 border-b space-y-3 shrink-0 ${
                circadian.isNight
                  ? 'bg-slate-900/60 border-slate-800/80'
                  : 'bg-gradient-to-b from-white to-[#F5F8F7] border-stone-200/70'
              }`}
            >
              {/* Primary Call-to-Action: Start New Consultation */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNewSession();
                  onClose();
                }}
                className="w-full min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#10B981] hover:from-[#005750] hover:to-[#059669] text-white text-xs font-bold font-['Outfit'] tracking-wide shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98 select-none"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Start New Clinical Consultation</span>
              </motion.button>

              {/* Smart Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={internalSearch}
                  onChange={(e) => setInternalSearch(e.target.value)}
                  placeholder="Search past topics, questions, subjects..."
                  className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 font-sans ${
                    circadian.isNight
                      ? 'bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/30 focus:border-cyan-500'
                      : 'bg-white border border-stone-200 text-slate-900 placeholder:text-slate-400 focus:ring-[#006B63]/20 focus:border-[#006B63]'
                  }`}
                />
                {internalSearch && (
                  <button
                    type="button"
                    onClick={() => setInternalSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Smart Quick Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x text-xs">
                {filterPills.map((pill) => {
                  const Icon = pill.icon;
                  const isActive = activeFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setActiveFilter(pill.id)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10.5px] font-bold font-mono tracking-tight transition-all cursor-pointer shrink-0 flex items-center gap-1 border ${
                        isActive
                          ? 'bg-[#006B63] text-white border-[#006B63] shadow-2xs'
                          : circadian.isNight
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          : 'bg-white text-slate-600 border-stone-200/90 hover:border-teal-300 hover:text-[#006B63]'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{pill.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 3. Scrollable Session List with Date Grouping ─────────────── */}
            <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-3 space-y-4 touch-scroll">
              {processedSessions.length === 0 ? (
                /* Editorial Empty State */
                <div className="text-center py-16 px-4 space-y-3">
                  <div
                    className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                      circadian.isNight ? 'bg-slate-800 text-slate-400' : 'bg-teal-50 text-[#006B63]'
                    }`}
                  >
                    <MessageSquare className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <div className="space-y-1">
                    <h3
                      className={`text-sm font-bold font-['Outfit'] ${
                        circadian.isNight ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {internalSearch || activeFilter !== 'all'
                        ? 'No matching consultations found'
                        : 'No saved consultations yet'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {internalSearch || activeFilter !== 'all'
                        ? 'Try modifying your search or switching filter categories.'
                        : 'Ask your Faculty Mentor clinical questions, request drills, or analyze investigations to build your history.'}
                    </p>
                  </div>
                  {internalSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setInternalSearch('');
                        setActiveFilter('all');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#006B63] bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer font-['Outfit']"
                    >
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              ) : (
                groupedSessions.map((group) => (
                  <div key={group.label} className="space-y-2">
                    {/* Date Bucket Header */}
                    <div className="flex items-center gap-2 px-1 pt-1">
                      <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">
                        {group.label}
                      </span>
                      <div className="flex-1 h-[1px] bg-slate-200/60 dark:bg-slate-800/80" />
                    </div>

                    {/* Session Cards in Group */}
                    <div className="space-y-2">
                      {group.sessions.map((s) => {
                        const isActive = s.id === activeSessionId;
                        const intel: SessionIntelligence = extractSessionIntelligence(s);
                        const IntentIcon = getIntentIcon(intel.intentType);

                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              onSelectSession(s);
                              onClose();
                            }}
                            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isActive
                                ? circadian.isNight
                                  ? 'bg-slate-800/90 border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-xs'
                                  : 'bg-[#E8F5F3]/90 border-[#006B63]/50 ring-1 ring-[#006B63]/25 shadow-xs'
                                : circadian.isNight
                                ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 shadow-2xs'
                                : 'bg-white hover:bg-teal-50/40 border-stone-200/90 hover:border-teal-300/80 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="min-w-0 flex-1 space-y-1.5">
                                {/* Top Badges Row: Subject + Intent + Telemetry */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Active Status Badge */}
                                  {isActive && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006B63] text-white text-[9px] font-bold font-mono tracking-wider uppercase shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                      Live
                                    </span>
                                  )}

                                  {/* Auto-detected Subject Badge */}
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono tracking-wide uppercase border shadow-2xs"
                                    style={{
                                      borderColor: `${intel.subjectColor}40`,
                                      backgroundColor: `${intel.subjectColor}14`,
                                      color: intel.subjectColor,
                                    }}
                                  >
                                    {intel.subjectName}
                                  </span>

                                  {/* Intent Pill */}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium font-sans ${
                                      circadian.isNight
                                        ? 'bg-slate-700/80 text-slate-300'
                                        : 'bg-stone-100 text-stone-700'
                                    }`}
                                  >
                                    <IntentIcon className="h-2.5 w-2.5 text-[#006B63]" />
                                    <span>{intel.intentLabel}</span>
                                  </span>

                                  {/* MCQ Telemetry Badge */}
                                  {intel.mcqScore && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono border ${
                                        intel.mcqScore.percentage >= 60
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                                      }`}
                                    >
                                      <CheckCircle2 className="h-2.5 w-2.5" />
                                      <span>
                                        {intel.mcqScore.correct}/{intel.mcqScore.total} ({intel.mcqScore.percentage}%)
                                      </span>
                                    </span>
                                  )}
                                </div>

                                {/* Consultation Title */}
                                <h4
                                  className={`text-xs sm:text-[13px] font-bold font-['Outfit'] line-clamp-1 leading-snug group-hover:text-[#006B63] transition-colors ${
                                    circadian.isNight ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {s.title}
                                </h4>

                                {/* Clean Conversation Excerpt */}
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {intel.keyExcerpt}
                                </p>

                                {/* Metadata Footer Row: Time + Message Count */}
                                <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatRelativeDate(s.updatedAt || s.createdAt)}</span>
                                  </div>
                                  <span>·</span>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>
                                      {intel.messageCount} msg{intel.messageCount === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Action Tools: Pin & Delete */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                {/* Star / Pin Button */}
                                {onTogglePinSession && (
                                  <button
                                    type="button"
                                    onClick={(e) => onTogglePinSession(s.id, e)}
                                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                      s.isPinned
                                        ? 'text-amber-500 hover:text-amber-600 bg-amber-50/80 dark:bg-amber-950/40'
                                        : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50/60 dark:hover:bg-slate-700 opacity-60 hover:opacity-100'
                                    }`}
                                    title={s.isPinned ? 'Unpin consultation' : 'Pin to top of history'}
                                    aria-label="Pin consultation"
                                  >
                                    <Star
                                      className={`h-3.5 w-3.5 ${s.isPinned ? 'fill-amber-400' : ''}`}
                                    />
                                  </button>
                                )}

                                {/* Delete Session Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionToDelete(s.id);
                                  }}
                                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                                  title="Delete consultation"
                                  aria-label="Delete consultation"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── 4. In-Drawer Confirmation Banners (Single Item or Clear All) ─ */}
            {sessionToDelete && (
              <div
                className={`p-3.5 border-t shrink-0 ${
                  circadian.isNight ? 'bg-slate-900 border-slate-800' : 'bg-rose-50/90 border-rose-200'
                }`}
              >
                <div className="space-y-2">
                  <p className="text-xs font-bold text-rose-950 dark:text-rose-300 font-['Outfit']">
                    Delete this consultation from history?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        onDeleteSession(sessionToDelete, e);
                        setSessionToDelete(null);
                      }}
                      className="flex-1 min-h-[36px] py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-['Outfit'] transition-all cursor-pointer shadow-2xs"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionToDelete(null)}
                      className="flex-1 min-h-[36px] py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-['Outfit'] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. Drawer Footer with Upgraded Clinical Clear History Experience ─────────── */}
            <div
              className={`p-3.5 sm:p-4 border-t text-xs shrink-0 transition-colors ${
                circadian.isNight
                  ? 'bg-slate-900/95 border-slate-800 text-slate-400'
                  : 'bg-stone-50/95 border-stone-200 text-slate-600'
              }`}
            >
              {sessions.length === 0 ? (
                <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 py-1">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Database className="h-3.5 w-3.5" />
                    <span>Memory clean · 0 saved</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    ONE SHOT FMGE
                  </span>
                </div>
              ) : confirmClear ? (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`p-3.5 sm:p-4 rounded-3xl border shadow-lg space-y-3 ${
                    circadian.isNight
                      ? 'bg-slate-850 border-rose-500/30 bg-gradient-to-b from-slate-800 to-slate-900'
                      : 'bg-white border-rose-200/90 bg-gradient-to-b from-white to-rose-50/20'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <AlertTriangle className="h-4 w-4 stroke-[2.2]" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="text-xs sm:text-[13px] font-bold font-['Outfit'] text-slate-900 dark:text-white">
                        Reset Consultation Memory?
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                        {starredCount > 0
                          ? `You have ${starredCount} starred consultation${starredCount === 1 ? '' : 's'}. You can preserve starred topics or clear everything.`
                          : `This will permanently clear all ${sessions.length} saved consultations, clinical pearls, and drill attempts from this workspace.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    {starredCount > 0 && onClearUnpinnedHistory && (
                      <button
                        type="button"
                        onClick={() => {
                          onClearUnpinnedHistory();
                          setConfirmClear(false);
                        }}
                        className="flex-1 min-h-[38px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold font-['Outfit'] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <Star className="h-3.5 w-3.5 fill-white" />
                        <span>Keep Starred ({starredCount})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClearAllHistory();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="flex-1 min-h-[38px] px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold font-['Outfit'] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[2]" />
                      <span>Clear All ({sessions.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold font-['Outfit'] transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className={`group/clear min-h-[40px] px-3 py-2 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-semibold select-none ${
                      circadian.isNight
                        ? 'bg-slate-800/80 hover:bg-rose-950/40 border-slate-700/80 hover:border-rose-800/60 text-slate-300 hover:text-rose-300 shadow-2xs'
                        : 'bg-white hover:bg-rose-50/80 border-stone-200/90 hover:border-rose-200/80 text-stone-600 hover:text-rose-700 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Clear saved consultation history"
                  >
                    <div className="h-5 w-5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover/clear:scale-110">
                      <Trash2 className="h-3 w-3 stroke-[2.2]" />
                    </div>
                    <span className="font-['Outfit']">Clear History</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-slate-400 font-mono text-[10px] font-medium border border-stone-200/60 dark:border-slate-700/60 shadow-2xs">
                      <Database className="h-3 w-3 text-slate-400" />
                      <span>{sessions.length} saved</span>
                      {starredCount > 0 && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">★ {starredCount}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
