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
} from 'lucide-react';
import { motion } from 'motion/react';
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
  onLaunchPracticeSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('medicine');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedSubject = useMemo(() => {
    if (selectedSubjectId === 'all') return null;
    return FMGE_SUBJECTS.find((s) => s.id === selectedSubjectId) || FMGE_SUBJECTS[0];
  }, [selectedSubjectId]);

  // Filter topics based on subject and search query
  const displayedTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (selectedSubjectId === 'all') {
      const all: Array<{
        subjectId: string;
        subjectName: string;
        subjectWeightage: number;
        id: string;
        name: string;
        isHighYield: boolean;
      }> = [];

      FMGE_SUBJECTS.forEach((sub) => {
        sub.topics.forEach((t) => {
          if (!query || t.name.toLowerCase().includes(query) || sub.name.toLowerCase().includes(query)) {
            all.push({
              subjectId: sub.id,
              subjectName: sub.name,
              subjectWeightage: sub.weightage,
              id: t.id,
              name: t.name,
              isHighYield: Boolean(t.isHighYield),
            });
          }
        });
      });
      return all;
    }

    if (!selectedSubject) return [];

    return selectedSubject.topics
      .filter((t) => !query || t.name.toLowerCase().includes(query))
      .map((t) => ({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        subjectWeightage: selectedSubject.weightage,
        id: t.id,
        name: t.name,
        isHighYield: Boolean(t.isHighYield),
      }));
  }, [selectedSubjectId, selectedSubject, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 space-y-4 sm:space-y-6 font-['Inter'] text-[#121e1b]">
      {/* ================= 1. PRACTICE EDITORIAL HEADER CARD ================= */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#EEFBFB] p-4 sm:px-6 sm:py-3.5 shadow-xs"
      >
        {/* Dynamic Animated Ambient Clinical Practice Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">

          {/* Soft glowing corner radial gradient orbs with breathing motion */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.4, 0.65, 0.4],
              x: [0, 18, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/40 via-emerald-200/30 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.25, 0.45, 0.25],
              y: [0, -12, 0],
            }}
            transition={{
              duration: 9.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-200/35 via-teal-100/25 to-transparent blur-3xl"
          />
          <div className="absolute -top-12 left-1/3 h-52 w-96 rounded-full bg-gradient-to-r from-teal-200/25 via-emerald-100/20 to-transparent blur-3xl" />

          {/* Subtle Precision Clinical Calibration Dot & Cross Pattern */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.04] text-teal-950 pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="practice-calibration-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 15 11 L 15 19 M 11 15 L 19 15" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="15" cy="15" r="0.8" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#practice-calibration-grid)" />
          </svg>

          {/* Premium Doctor's Clinical Diagnostic Desk & Stethoscope Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[480px] overflow-hidden opacity-40 sm:opacity-55 md:opacity-[0.68] select-none pointer-events-none block">
            <svg viewBox="0 0 480 140" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <linearGradient id="practice-chart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#E6FFFA" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#B2F5EA" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="practice-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2E8F0" />
                  <stop offset="40%" stopColor="#94A3B8" />
                  <stop offset="70%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#64748B" />
                </linearGradient>
                <linearGradient id="steth-tube-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="45%" stopColor="#0D9488" />
                  <stop offset="100%" stopColor="#004D40" />
                </linearGradient>
                <radialGradient id="chestpiece-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#14B8A6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient Diagnostic Halo */}
              <motion.circle
                cx="375"
                cy="72"
                r="62"
                fill="url(#chestpiece-glow)"
                animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* ═══ 1. CLINICAL VIGNETTE CASE CHART / CLIPBOARD ═══ */}
              <g transform="translate(350, 42) rotate(-5)">
                {/* Clipboard Backing Plate */}
                <rect x="-65" y="-10" width="130" height="92" rx="7" fill="#0F766E" opacity="0.35" />
                {/* Medical Paper Sheet */}
                <rect x="-60" y="-6" width="120" height="85" rx="5" fill="url(#practice-chart-grad)" stroke="#99F6E4" strokeWidth="0.8" />
                {/* Metal Clip at Top */}
                <rect x="-24" y="-12" width="48" height="12" rx="3" fill="url(#practice-metal-grad)" />
                <circle cx="0" cy="-6" r="2.5" fill="#334155" />

                {/* Patient Case Vignette Text Line Simulation */}
                <g stroke="#0F766E" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round">
                  <line x1="-50" y1="12" x2="10" y2="12" />
                  <line x1="-50" y1="18" x2="35" y2="18" />
                  <line x1="-50" y1="24" x2="45" y2="24" />
                  <line x1="-50" y1="30" x2="-5" y2="30" />
                </g>

                {/* Printed Clinical Vitals / Electrocardiogram Ribbon on Sheet */}
                <path
                  d="M -50 52 L -32 52 L -28 44 L -24 62 L -20 38 L -16 58 L -12 52 L 2 52 L 6 46 L 10 56 L 14 52 L 48 52"
                  stroke="#0284C7"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.85"
                />
              </g>

              {/* ═══ 2. LITTMANN-STYLE ACOUSTIC STETHOSCOPE ═══ */}
              <g transform="translate(370, 75)">
                {/* Binaural Chrome Headset Arch */}
                <path
                  d="M -85 -35 C -75 -65, -35 -70, -10 -60"
                  stroke="url(#practice-metal-grad)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M -60 -30 C -52 -55, -20 -62, 5 -55"
                  stroke="url(#practice-metal-grad)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Soft Rubber Eartips */}
                <ellipse cx="-85" cy="-35" rx="3.5" ry="5" fill="#0F172A" />
                <ellipse cx="-60" cy="-30" rx="3.5" ry="5" fill="#0F172A" />
                {/* Binaural Spring Yoke Junction */}
                <path d="M -10 -60 Q 0 -58 10 -46" stroke="url(#practice-metal-grad)" strokeWidth="3" fill="none" />
                <path d="M 5 -55 Q 8 -52 10 -46" stroke="url(#practice-metal-grad)" strokeWidth="3" fill="none" />

                {/* Flexible Rubber Stethoscope Tubing S-Curve */}
                <path
                  d="M 10 -46 C 25 -25, 45 -5, 30 20 C 15 45, -20 35, -25 10 C -30 -12, 5 -10, 20 5 C 32 18, 48 24, 65 20"
                  stroke="url(#steth-tube-grad)"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Stethoscope Dual-Sided Chestpiece at (65, 20) */}
                <g transform="translate(65, 20)">
                  {/* Stem Connection */}
                  <rect x="-8" y="-3" width="8" height="6" rx="1.5" fill="url(#practice-metal-grad)" />
                  {/* Outer Diaphragm Rim */}
                  <circle r="16" fill="url(#practice-metal-grad)" stroke="#0F766E" strokeWidth="1" />
                  {/* Inner Acoustic Diaphragm Surface */}
                  <circle r="12.5" fill="#004D40" />
                  <circle r="10.5" fill="url(#practice-metal-grad)" opacity="0.4" />
                  {/* Acoustic Center Core */}
                  <circle r="4" fill="#0284C7" />
                  <circle r="1.5" fill="#FFFFFF" />

                  {/* Gentle Rhythmic Pulse Ring */}
                  <motion.circle
                    r="16"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    fill="none"
                    animate={{ scale: [1, 1.8], opacity: [0.85, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.circle
                    r="16"
                    stroke="#14B8A6"
                    strokeWidth="1.2"
                    fill="none"
                    animate={{ scale: [1, 2.3], opacity: [0.65, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                  />
                </g>
              </g>

              {/* ═══ 3. HOLOGRAPHIC DIAGNOSTIC PULSE WAVE & VITAL NODES ═══ */}
              <motion.path
                d="M 170 115 L 210 115 L 218 100 L 226 130 L 234 92 L 242 125 L 248 115 L 290 115"
                stroke="#0EA5E9"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.8"
                animate={{
                  opacity: [0.4, 0.95, 0.4],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Traveling Cardiac Vitals Signal */}
              <motion.circle
                r="3"
                fill="#0284C7"
                animate={{
                  cx: [170, 210, 218, 226, 234, 242, 248, 290],
                  cy: [115, 115, 100, 130, 92, 125, 115, 115],
                  opacity: [0, 0.8, 1, 1, 1, 1, 0.8, 0],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Floating Clinical Particle Blips */}
              <motion.circle cx="310" cy="45" r="2" fill="#38BDF8" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
              <motion.circle cx="440" cy="55" r="1.5" fill="#14B8A6" animate={{ opacity: [0.1, 0.7, 0.1] }} transition={{ duration: 3.8, repeat: Infinity, delay: 0.8 }} />
              <motion.circle cx="280" cy="85" r="1.8" fill="#0D9488" animate={{ opacity: [0.2, 0.75, 0.2] }} transition={{ duration: 2.7, repeat: Infinity, delay: 1.4 }} />
            </svg>
          </div>
        </div>

        {/* Content Layout with Original Previous Texts */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-3.5 max-w-2xl">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-sky-50/90 border border-sky-100/90 text-sky-600 shadow-2xs shrink-0 mt-0.5 cursor-default"
            >
              <Stethoscope className="h-5 w-5 text-sky-600 stroke-[2]" />
            </motion.div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-[25px] font-extrabold uppercase tracking-tight bg-gradient-to-r from-slate-950 via-sky-950 to-blue-800 bg-clip-text text-transparent leading-snug">
                  Clinical Vignettes &amp; Drills
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold font-mono tracking-[0.14em] uppercase bg-gradient-to-r from-sky-500/15 via-teal-500/10 to-blue-500/10 border border-sky-200/80 text-sky-800 shadow-2xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Practice Engine · 10 MCQs
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#3d4947] leading-normal line-clamp-1 sm:line-clamp-none">
                10-MCQ clinical drills with instant distractor breakdowns &amp; recall testing.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ================= SUBJECT NAVIGATION & CONTROLS ================= */}
      <div className="space-y-4">
        {/* Horizontal Subject Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              selectedSubjectId === 'all'
                ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                : 'bg-white hover:bg-[#F7F9F8] text-[#3d4947] hover:text-[#121e1b] border-[#DCE4E1]'
            }`}
          >
            <span>All Subjects</span>
          </button>

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
                <span className="ml-1 text-[10px] font-mono opacity-80">({sub.weightage}M)</span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66716F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics or modules..."
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-xl bg-white border border-[#DCE4E1] hover:border-[#B6C8C3] focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 text-xs sm:text-sm text-[#121e1b] placeholder:text-[#66716F] transition-all outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#66716F] hover:text-[#121e1b] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subject Selector Dropdown */}
          <div className="relative shrink-0 sm:w-56">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 sm:py-2.5 rounded-xl bg-white border border-[#DCE4E1] hover:border-[#B6C8C3] focus:border-[#006B63] text-xs sm:text-sm font-medium text-[#121e1b] cursor-pointer outline-none transition-all shadow-2xs"
            >
              <option value="all">All Subjects ({FMGE_SUBJECTS.length})</option>
              {FMGE_SUBJECTS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.weightage}M)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#66716F] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ================= TOPICS & DRILLS CONTAINER ================= */}
      <div className="clinical-card p-5 sm:p-7 lg:p-8 space-y-4 sm:space-y-6 bg-white rounded-3xl border border-[#DCE4E1] shadow-2xs">
        {/* Container Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F3F2] text-xs font-semibold uppercase tracking-wider text-[#66716F] font-mono">
          <span>
            {selectedSubject ? `${selectedSubject.name} High-Yield Modules` : 'High-Yield Clinical Modules'}
          </span>
          <span className="hidden sm:inline">10-MCQ Clinical Drill</span>
        </div>

        {/* Topics List */}
        {displayedTopics.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-medium text-[#66716F]">
              No modules found matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectId('medicine');
              }}
              className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer"
            >
              Reset filters to Medicine
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F3F2]">
            {displayedTopics.map((topic) => (
              <div
                key={`${topic.subjectId}-${topic.id}`}
                className="py-4 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#F7F9F8] rounded-xl transition-all group"
              >
                {/* Topic Info */}
                <div className="min-w-0 pr-2 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold font-['Newsreader'] text-[#121e1b] group-hover:text-[#006B63] transition-colors leading-snug">
                      {topic.name}
                    </span>
                    {topic.isHighYield && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#006B63] border border-[#006B63]/20 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                        HIGH YIELD
                      </span>
                    )}
                    {selectedSubjectId === 'all' && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F0F3F2] text-[#4A5553] text-[10px] font-mono shrink-0">
                        {topic.subjectName} · {topic.subjectWeightage}M
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#66716F] leading-relaxed">
                    Standard FMGE clinical vignette distribution · 10 questions with distractor analysis
                  </p>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => onLaunchPracticeSession(topic.subjectId, topic.id, topic.name)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#006B63] hover:bg-[#005049] text-white text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start 10-MCQs</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= EXAM VALUE PILLARS & FEATURE SECTION ================= */}
      <div className="pt-2 border-t border-[#EAEFEA]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 items-stretch">
          {/* Pillar 1 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Real Exam Format</h4>
              <p className="text-[11px] text-[#66716F]">10-MCQ clinical vignettes</p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Detailed Explanations</h4>
              <p className="text-[11px] text-[#66716F]">Understand every concept</p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Distractor Analysis</h4>
              <p className="text-[11px] text-[#66716F]">Learn from every option</p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#121e1b]">Track Your Progress</h4>
              <p className="text-[11px] text-[#66716F]">Get better, every day</p>
            </div>
          </div>

          {/* Pillar 5 / Quote Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F0FDF8] to-[#F7FAF9] border border-[#D5E4DE] flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1 shadow-2xs">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold font-['Newsreader'] italic text-[#121e1b] leading-tight">
                &ldquo;Practice with purpose. Perform with confidence.&rdquo;
              </p>
            </div>
            <span className="text-base shrink-0">🌱</span>
          </div>
        </div>
      </div>
    </div>
  );
};

