import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Award,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Search,
  Check,
  ChevronRight,
  Filter,
  Info,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  FileText,
  Clock,
  HelpCircle,
  X,
  Target,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { GrandTest, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';
import { NbeMockExamModal } from './NbeMockExamModal';
import { GrandTestDiagnosticModal } from './GrandTestDiagnosticModal';
import { ErrorNotebookItem } from '../types';

interface GrandTestsViewProps {
  state: AppState;
  onAddGrandTest: (gt: GrandTest) => void;
  onDeleteGrandTest: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
}

export const GrandTestsView: React.FC<GrandTestsViewProps> = ({
  state,
  onAddGrandTest,
  onDeleteGrandTest,
  onNavigateTab,
  onAddErrorItem,
}) => {
  const [showAddGTModal, setShowAddGTModal] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [selectedTestForDiagnostic, setSelectedTestForDiagnostic] = useState<GrandTest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedGTId, setExpandedGTId] = useState<string | null>(null);

  // Filters & Search
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // New GT Form State
  const [newGT, setNewGT] = useState<Partial<GrandTest>>({
    title: '',
    platform: 'Marrow',
    date: getLocalDateKey(),
    score: 150,
    totalMarks: 300,
    correctCount: 165,
    incorrectCount: 110,
    skippedCount: 25,
    percentile: 60,
    paper1Score: 75,
    paper2Score: 75,
    weakSubjectIds: [],
    strongSubjectIds: [],
    keyMistakesNotes: '',
  });

  const [subjectSearch, setSubjectSearch] = useState<string>('');

  const gts = useMemo(() => state.grandTests || [], [state.grandTests]);

  // Derived Analytics across all tests
  const stats = useMemo(() => {
    if (gts.length === 0) {
      return {
        totalTests: 0,
        latestScore: 0,
        latestPassed: false,
        latestDate: '',
        highestScore: 0,
        averageScore: 0,
        clearedCount: 0,
        clearanceRate: 0,
        averagePaper1: 0,
        averagePaper2: 0,
        scoreDelta: 0,
      };
    }

    // Sort chronologically ascending for progression trends
    const chronoSorted = [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = chronoSorted[chronoSorted.length - 1];
    const highest = Math.max(...gts.map((g) => g.score));
    const totalScoreSum = gts.reduce((sum, g) => sum + g.score, 0);
    const avgScore = Math.round(totalScoreSum / gts.length);
    const cleared = gts.filter((g) => g.score >= 150).length;
    const rate = Math.round((cleared / gts.length) * 100);

    const paper1Sum = gts.reduce((sum, g) => sum + (g.paper1Score || Math.round(g.score / 2)), 0);
    const paper2Sum = gts.reduce((sum, g) => sum + (g.paper2Score || Math.round(g.score / 2)), 0);
    const avgP1 = Math.round(paper1Sum / gts.length);
    const avgP2 = Math.round(paper2Sum / gts.length);

    // Delta between latest and first or previous
    const firstScore = chronoSorted[0].score;
    const delta = latest.score - firstScore;

    return {
      totalTests: gts.length,
      latestScore: latest.score,
      latestPassed: latest.score >= 150,
      latestDate: latest.date,
      highestScore: highest,
      averageScore: avgScore,
      clearedCount: cleared,
      clearanceRate: rate,
      averagePaper1: avgP1,
      averagePaper2: avgP2,
      scoreDelta: delta,
    };
  }, [gts]);

  // Filtered & Sorted list
  const filteredGTs = useMemo(() => {
    return gts
      .filter((gt) => {
        // Platform filter
        if (platformFilter !== 'all' && gt.platform !== platformFilter) {
          return false;
        }
        // Status filter
        if (statusFilter === 'pass' && gt.score < 150) return false;
        if (statusFilter === 'fail' && gt.score >= 150) return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = gt.title.toLowerCase().includes(q);
          const matchPlatform = gt.platform.toLowerCase().includes(q);
          const matchNotes = (gt.keyMistakesNotes || '').toLowerCase().includes(q);
          const matchWeak = (gt.weakSubjectIds || []).some((id) => {
            const sub = FMGE_SUBJECTS.find((s) => s.id === id);
            return sub && sub.name.toLowerCase().includes(q);
          });
          if (!matchTitle && !matchPlatform && !matchNotes && !matchWeak) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'score-desc') {
          return b.score - a.score;
        }
        if (sortBy === 'score-asc') {
          return a.score - b.score;
        }
        return 0;
      });
  }, [gts, platformFilter, statusFilter, sortBy, searchQuery]);

  // Handle Save
  const handleSaveGT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGT.title?.trim()) {
      showToast('Please enter a title for the Grand Test');
      return;
    }

    const finalScore = Number(newGT.score) || 0;
    const p1 = Number(newGT.paper1Score) || 0;
    const p2 = Number(newGT.paper2Score) || 0;

    const finalGT: GrandTest = {
      id: `gt-${Date.now()}`,
      title: newGT.title.trim(),
      platform: (newGT.platform as any) || 'Marrow',
      date: newGT.date || getLocalDateKey(),
      score: finalScore,
      totalMarks: 300,
      correctCount: Number(newGT.correctCount) || 0,
      incorrectCount: Number(newGT.incorrectCount) || 0,
      skippedCount: Number(newGT.skippedCount) || 0,
      percentile: newGT.percentile !== undefined && newGT.percentile !== null ? Number(newGT.percentile) : undefined,
      paper1Score: p1,
      paper2Score: p2,
      weakSubjectIds: newGT.weakSubjectIds || [],
      strongSubjectIds: newGT.strongSubjectIds || [],
      keyMistakesNotes: newGT.keyMistakesNotes?.trim() || '',
    };

    onAddGrandTest(finalGT);
    setShowAddGTModal(false);
    showToast(`Logged "${finalGT.title}" (${finalGT.score}/300) successfully!`);

    if (finalGT.score >= 150) {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.6 },
      });
    }

    // Reset
    setNewGT({
      title: '',
      platform: 'Marrow',
      date: getLocalDateKey(),
      score: 150,
      totalMarks: 300,
      correctCount: 165,
      incorrectCount: 110,
      skippedCount: 25,
      percentile: 60,
      paper1Score: 75,
      paper2Score: 75,
      weakSubjectIds: [],
      strongSubjectIds: [],
      keyMistakesNotes: '',
    });
  };

  const toggleWeakSubject = (subjectId: string) => {
    const curr = newGT.weakSubjectIds || [];
    if (curr.includes(subjectId)) {
      setNewGT({ ...newGT, weakSubjectIds: curr.filter((id) => id !== subjectId) });
    } else {
      setNewGT({ ...newGT, weakSubjectIds: [...curr, subjectId] });
    }
  };

  const handleDelete = (id: string, title: string) => {
    onDeleteGrandTest(id);
    setDeleteConfirmId(null);
    showToast(`Removed test record "${title}"`);
  };

  // Quick platform options
  const platforms: GrandTest['platform'][] = [
    'Marrow',
    'Prepladder',
    'Cerebellum',
    'DAMS',
    'Bhatia',
    'NBE Mock',
    'Other',
  ];

  return (
    <div
      className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-in fade-in duration-150 pb-36 sm:pb-20 text-slate-900"
      style={{ paddingBottom: 'max(9.5rem, calc(7rem + env(safe-area-inset-bottom, 2rem)))' }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Apple HIG Luminous Royal Indigo Hero Header — Matching DailyPlannerView Structure with Distinct Exam Indigo Palette */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(79,70,229,0.12),0_2px_8px_rgba(0,0,0,0.04)] border border-indigo-200/70"
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 35%, #C7D2FE 70%, #A5B4FC 100%)',
        }}
      >
        {/* Soft Ambient Radial Glow (Royal Indigo) */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-3/5"
          style={{
            background: 'radial-gradient(ellipse at 85% 45%, rgba(99,102,241,0.20) 0%, rgba(79,70,229,0.06) 50%, transparent 75%)',
          }}
        />

        <div className="relative z-10 p-5 sm:p-6 space-y-4">
          {/* Top Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 backdrop-blur-md border border-[rgba(60,60,67,0.08)] text-xs font-semibold text-[#4338CA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              <span className="uppercase tracking-wider text-[10.5px] font-bold">NBE CBT Simulation</span>
              <span className="text-[#C7C7CC]">·</span>
              <span className="text-[#3C3C43] font-normal hidden sm:inline">300 Questions Benchmark</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-md border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] shadow-xs">
                <Clock className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>{stats.totalTests} {stats.totalTests === 1 ? 'Mock' : 'Mocks'}</span>
              </div>

              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/80 backdrop-blur-md border border-indigo-200 text-[#4338CA] shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>{stats.clearanceRate}% Clearance</span>
              </div>

              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/80 backdrop-blur-md border border-emerald-200 text-emerald-700 shadow-xs">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>150 / 300 Pass</span>
              </div>
            </div>
          </div>

          {/* Main Row: Title & Subtitle + Mode Switcher + Right Gauge Widget */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 min-w-0 max-w-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-[-0.03em] leading-tight text-[#1D1D1F]">
                Grand Tests <span className="text-[#4338CA]">&amp; Mock Exams</span>
              </h1>
              <p className="text-xs sm:text-[13px] text-[#334155] font-medium leading-snug">
                Simulate 300-Q NBE exam sessions and benchmark your trajectory against the 150-mark pass threshold.
              </p>

              {/* Apple Segmented Pill Switch */}
              <div className="inline-flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md rounded-full border border-black/[0.08] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setShowMockModal(true)}
                  className="px-3 py-1 rounded-full text-xs font-bold text-[#64748B] hover:text-[#1D1D1F] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-[#4338CA]" />
                  <span>50Q Mini-Mock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticModal(true)}
                  className="px-3 py-1 rounded-full text-xs font-bold text-[#64748B] hover:text-[#1D1D1F] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3 h-3 text-[#4338CA]" />
                  <span>Diagnostics</span>
                </button>
              </div>
            </div>

            {/* Right Compact Circular Gauge Widget Card */}
            <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 sm:gap-4 shrink-0">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" stroke="#F2F2F7" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#4338CA"
                    strokeWidth="4.5"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 * (1 - Math.min(100, Math.max(0, stats.clearanceRate || 50)) / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-xs font-black text-[#1D1D1F] leading-none">
                    {stats.clearanceRate}%
                  </span>
                  <span className="text-[6.5px] font-mono font-bold uppercase tracking-wider text-[#4338CA] mt-0.5">
                    PASS
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="text-xs font-bold text-[#1D1D1F] truncate">
                  {stats.latestScore > 0 ? (
                    <span>Latest: {stats.latestScore}/300 ({stats.latestScore >= 150 ? `+${stats.latestScore - 150}` : `${stats.latestScore - 150}`})</span>
                  ) : (
                    <span>Target: 150/300 Marks</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGTModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                  <span>Log Grand Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 3 High-Impact Assorted Examination Bento Cards (Distinct from standard 4-tile rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: NBE Clearance Trajectory (Apple Emerald) */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] via-white to-teal-500/[0.03] border border-emerald-200/80 shadow-[0_2px_12px_rgba(16,185,129,0.04)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-emerald-800">
              Clearance Trajectory
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-emerald-800 leading-none">
                {stats.clearanceRate}%
              </span>
              <span className="text-[11.5px] font-medium text-emerald-700">
                ({stats.clearedCount}/{stats.totalTests || 0} Cleared)
              </span>
            </div>
            <p className="text-[11.5px] text-[#64748B] mt-1 font-medium">
              {stats.clearedCount > 0
                ? 'Consistently meeting NBE 150-mark threshold'
                : stats.totalTests > 0
                ? 'Targeting 150 pass mark on upcoming mock'
                : 'Log initial 300Q mock to benchmark trajectory'}
            </p>
          </div>
        </div>

        {/* Card 2: Paper 1 vs Paper 2 Balance (Cobalt & Iris Split) */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500/[0.08] via-white to-indigo-500/[0.03] border border-blue-200/80 shadow-[0_2px_12px_rgba(59,130,246,0.04)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-[#0056CC]">
              Paper Balance (Pre/Para vs Clinical)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1D1D1F] flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#007AFF]" />
                Paper 1: <strong className="font-mono">{stats.averagePaper1 || 75}/150</strong>
              </span>
              <span className="font-semibold text-[#1D1D1F] flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#5856D6]" />
                Paper 2: <strong className="font-mono">{stats.averagePaper2 || 75}/150</strong>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex">
              <div
                className="bg-[#007AFF] h-full"
                style={{ width: `${stats.averagePaper1 ? Math.round((stats.averagePaper1 / ((stats.averagePaper1 + stats.averagePaper2) || 150)) * 100) : 50}%` }}
                title="Paper 1 Proportion"
              />
              <div
                className="bg-[#5856D6] h-full"
                style={{ width: `${stats.averagePaper2 ? Math.round((stats.averagePaper2 / ((stats.averagePaper1 + stats.averagePaper2) || 150)) * 100) : 50}%` }}
                title="Paper 2 Proportion"
              />
            </div>
            <p className="text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Pre &amp; Para-Clinical</span>
              <span>Clinical Disciplines</span>
            </p>
          </div>
        </div>

        {/* Card 3: 300-Q CBT Speed & Stamina (Amber & Orange) */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/[0.08] via-white to-orange-500/[0.03] border border-amber-200/80 shadow-[0_2px_12px_rgba(245,158,11,0.04)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-amber-800">
              Exam Stamina &amp; Pacing
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-amber-800 leading-none">
                ~55s
              </span>
              <span className="text-[11.5px] font-medium text-amber-700">/ Question target</span>
            </div>
            <p className="text-[11.5px] text-[#64748B] mt-1 font-medium">
              300 minutes across two 150-min CBT sessions (No negative marking)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: 2-Column Architecture (Matching ErrorsView & Figma Screenshots) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Benchmark Desk, Trajectory, Filters, and Test Records Feed */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* NBE Score Predictor & Circular Benchmark Desk (Matching media_1790582425866.png) */}
          <div className="rounded-3xl border border-[rgba(60,60,67,0.1)] bg-white p-6 sm:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-5">
            {/* Top row with Dial & Bento Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Circular Dial Gauge */}
              <div className="relative inline-flex items-center justify-center shrink-0 self-center sm:self-auto">
                <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#F2F2F7" strokeWidth="10" />
                  <circle
                    cx="65"
                    cy="65"
                    r="52"
                    fill="none"
                    stroke={stats.latestScore >= 150 ? '#30D158' : stats.latestScore > 0 ? '#FF9500' : '#4338CA'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(1, Math.max(0.05, (stats.latestScore || 150) / 300)))}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-3xl font-black font-mono text-[#1D1D1F] leading-none">
                    {stats.latestScore > 0 ? stats.latestScore : 150}
                  </span>
                  <span className="text-[11px] text-[#8E8E93] font-mono mt-0.5">/ 300</span>
                </div>
              </div>

              {/* Status Header + 3 Bento Stat Cards */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      stats.latestScore >= 150
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : stats.latestScore > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-[#3730A3]/10 text-[#3730A3] border-[#3730A3]/20'
                    }`}
                  >
                    {stats.latestScore >= 150 ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>On Track to Clear (≥150)</span>
                      </>
                    ) : stats.latestScore > 0 ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>{150 - stats.latestScore} Marks to Pass Cutoff</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-3.5 h-3.5 text-[#3730A3]" />
                        <span>Cutoff Target: 150 / 300 (50%)</span>
                      </>
                    )}
                  </span>

                  <span className="text-[11px] text-[#8E8E93] font-medium hidden sm:inline">
                    NBE 300-Q CBT Standard
                  </span>
                </div>

                <p className="text-[12.5px] text-[#6E6E73] leading-relaxed">
                  Based on your full 300-mark mock test results, paper distribution, and CBT time management.
                </p>

                {/* 3 Apple Bento Stat Cards (Confidence, Likely Range, Delta style from media_1790582425866.png) */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-blue-50/40 border border-blue-100 flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#007AFF] flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#007AFF]" />
                      Avg Paper 1
                    </span>
                    <span className="text-base font-extrabold font-mono text-[#1D1D1F] mt-1">
                      {stats.averagePaper1 || 75} <span className="text-[10px] text-[#8E8E93] font-sans">/150</span>
                    </span>
                    <span className="text-[10px] text-[#8E8E93]">Pre &amp; Para-Clinical</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100 flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#5856D6] flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-[#5856D6]" />
                      Avg Paper 2
                    </span>
                    <span className="text-base font-extrabold font-mono text-[#1D1D1F] mt-1">
                      {stats.averagePaper2 || 75} <span className="text-[10px] text-[#8E8E93] font-sans">/150</span>
                    </span>
                    <span className="text-[10px] text-[#8E8E93]">Clinical Disciplines</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      Delta
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-700 mt-1">
                      {stats.scoreDelta >= 0 ? `+${stats.scoreDelta}` : stats.scoreDelta}
                    </span>
                    <span className="text-[10px] text-[#8E8E93]">vs initial mock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cutoff Trajectory Progress Bar (Scale 0 to 300) */}
            <div className="space-y-1.5 pt-3 border-t border-[rgba(60,60,67,0.07)]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#6E6E73]">NBE Examination Clearance Margin</span>
                <span className="font-mono text-[#3730A3] font-bold">
                  {stats.totalTests > 0
                    ? `Latest: ${stats.latestScore}/300 (${stats.latestScore >= 150 ? `+${stats.latestScore - 150} above cutoff` : `${150 - stats.latestScore} to pass`})`
                    : 'Target: 150/300 to qualify'}
                </span>
              </div>

              <div className="relative w-full h-3 rounded-full bg-[#E5E5EA] overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#1D1D1F] z-10"
                  style={{ left: '50%' }}
                  title="150 Pass Cutoff (50%)"
                />
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    stats.latestScore >= 150 ? 'bg-[#30D158]' : stats.latestScore > 0 ? 'bg-[#FF9500]' : 'bg-[#3730A3]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, ((stats.latestScore || 150) / 300) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] font-mono text-[#8E8E93]">
                <span>0 M</span>
                <span className="text-[#1D1D1F] font-bold">▲ 150 PASS CUTOFF (50%)</span>
                <span>300 M</span>
              </div>
            </div>
          </div>

          {/* Chronological Score Progression (Visible when >= 2 tests logged) */}
          {gts.length >= 2 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-[rgba(60,60,67,0.1)] shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-3.5">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[rgba(60,60,67,0.07)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#3730A3]/10 text-[#3730A3] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-[13.5px] font-bold text-[#1D1D1F]">
                      Score Progression Trajectory
                    </h3>
                    <p className="text-[11px] text-[#8E8E93]">
                      Chronological mock performance relative to the 150-mark cutoff
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono font-bold text-[#3730A3] bg-[#3730A3]/10 px-2.5 py-0.5 rounded-full border border-[#3730A3]/20">
                  {stats.scoreDelta >= 0 ? `+${stats.scoreDelta} PTS IMPROVEMENT` : `${stats.scoreDelta} PTS TREND`}
                </div>
              </div>

              <div className="overflow-x-auto pb-1 scrollbar-thin">
                <div className="flex items-center gap-3 min-w-[500px] pt-1">
                  {[...gts]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((gt, idx) => {
                      const isPass = gt.score >= 150;
                      const deltaTo150 = gt.score - 150;
                      return (
                        <div
                          key={gt.id}
                          className="flex-1 bg-[#F2F2F7]/50 hover:bg-white border border-[rgba(60,60,67,0.08)] hover:border-[#3730A3]/30 p-3 rounded-2xl transition-all space-y-1.5 group shadow-xs hover:shadow-md"
                        >
                          <div className="flex items-center justify-between text-[10.5px] font-mono text-[#8E8E93]">
                            <span className="font-bold text-[#1D1D1F]">GT #{idx + 1}</span>
                            <span>{gt.date}</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-black font-mono text-[#1D1D1F] group-hover:text-[#3730A3] transition-colors">
                              {gt.score}
                            </span>
                            <span
                              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                  : 'bg-rose-50 text-rose-800 border-rose-200/80'
                              }`}
                            >
                              {isPass ? `+${deltaTo150}` : `${deltaTo150}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6E6E73] truncate font-medium">
                            {gt.title}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isPass ? 'bg-[#30D158]' : 'bg-[#FF9500]'}`}
                              style={{ width: `${Math.min(100, Math.max(10, (gt.score / 300) * 100))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar matching Error Vault (media_1790582425871.png) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {[
                  { id: 'all', label: `All Tests (${gts.length})` },
                  { id: 'pass', label: `Cleared (${stats.clearedCount})` },
                  { id: 'fail', label: `Needs Boost (${gts.length - stats.clearedCount})` },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      statusFilter === st.id
                        ? 'bg-[#3730A3] text-white shadow-sm'
                        : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}

                <div className="h-4 w-px bg-[rgba(60,60,67,0.12)] shrink-0 mx-0.5" />

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="h-8 px-3 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-transparent text-[11.5px] font-bold text-[#1D1D1F] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 px-3 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-transparent text-[11.5px] font-bold text-[#1D1D1F] focus:outline-none cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="score-desc">Highest Score</option>
                  <option value="score-asc">Lowest Score</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-56 shrink-0">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grand tests…"
                  className="w-full rounded-full bg-[#F2F2F7] border border-transparent focus:border-[#3730A3] focus:bg-white pl-9 pr-8 py-1.5 text-[12px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#3730A3]/15 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C7C7CC] hover:text-[#8E8E93]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grand Tests Records List (Matching Biggest Risks item styling in media_1790582458273.png) */}
          {filteredGTs.length > 0 ? (
            <div className="space-y-3">
              {filteredGTs.map((gt, idx) => {
                const isPassed = gt.score >= 150;
                const accuracy = Math.round(
                  (gt.correctCount / (gt.correctCount + gt.incorrectCount || 1)) * 100
                );
                const delta = gt.score - 150;
                const p1 = gt.paper1Score ?? Math.round(gt.score / 2);
                const p2 = gt.paper2Score ?? (gt.score - p1);
                const isDeleting = deleteConfirmId === gt.id;
                const isExpanded = expandedGTId === gt.id;

                return (
                  <div
                    key={gt.id}
                    className={`bg-white rounded-2xl sm:rounded-3xl border transition-all ${
                      isExpanded
                        ? 'border-[#3730A3]/30 shadow-[0_8px_30px_rgba(55,48,163,0.08)]'
                        : 'border-[rgba(60,60,67,0.08)] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:border-[rgba(60,60,67,0.14)]'
                    }`}
                  >
                    {/* Collapsed Sleek Row Header (Click anywhere to expand/collapse) */}
                    <div
                      onClick={() => setExpandedGTId(isExpanded ? null : gt.id)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Accent Bar */}
                        <div
                          className={`w-1.5 h-10 rounded-full shrink-0 transition-all group-hover:scale-y-110 ${
                            isPassed ? 'bg-[#30D158]' : 'bg-[#FF9500]'
                          }`}
                        />
                        {/* Number Squircle */}
                        <div className="w-8 h-8 rounded-xl bg-[#F2F2F7] text-[#1D1D1F] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        {/* Title & Info */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[15px] text-[#1D1D1F] group-hover:text-[#3730A3] transition-colors leading-snug truncate">
                              {gt.title}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#3730A3]/10 text-[#3730A3] border border-[#3730A3]/15">
                              {gt.platform}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#8E8E93] flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#8E8E93]" />
                              {gt.date}
                            </span>
                            <span>•</span>
                            <span>P1: <strong className="text-[#1D1D1F] font-mono">{p1}</strong></span>
                            <span>•</span>
                            <span>P2: <strong className="text-[#1D1D1F] font-mono">{p2}</strong></span>
                            <span>•</span>
                            <span>Acc: <strong className="text-[#1D1D1F] font-mono">{accuracy}%</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score Mono + Pass Badge + Expand Chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span
                              className={`text-2xl font-black font-mono leading-none ${
                                isPassed ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {gt.score}
                            </span>
                            <span className="text-[11px] font-mono text-[#8E8E93]">/300</span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase mt-1 border ${
                              isPassed
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isPassed ? `PASS (+${delta})` : `NEEDS BOOST (${Math.abs(delta)} to pass)`}
                          </span>
                        </div>

                        {/* Rotating Chevron */}
                        <div className="w-7 h-7 rounded-full bg-[#F2F2F7] group-hover:bg-[#E5E5EA] flex items-center justify-center transition-colors">
                          <ChevronDown
                            className={`w-4 h-4 text-[#8E8E93] transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[#3730A3]' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Deep Layer */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden border-t border-[rgba(60,60,67,0.07)] bg-[#FAFBFD] px-4 sm:px-6 py-5 space-y-4"
                        >
                          {/* Paper 1 vs Paper 2 Mini Bento Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-[#007AFF]" />
                                  Paper 1 (Pre &amp; Para-Clinical)
                                </span>
                                <span className="font-mono font-bold text-[#1D1D1F]">{p1} / 150</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#007AFF] transition-all"
                                  style={{ width: `${Math.round((p1 / 150) * 100)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                                <span>Anat, Phys, Biochem, Path, Micro, Pharm, FMT</span>
                                <span className="font-mono font-bold">{Math.round((p1 / 150) * 100)}%</span>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                                  <BarChart3 className="w-3.5 h-3.5 text-[#5856D6]" />
                                  Paper 2 (Clinical Disciplines)
                                </span>
                                <span className="font-mono font-bold text-[#1D1D1F]">{p2} / 150</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#5856D6] transition-all"
                                  style={{ width: `${Math.round((p2 / 150) * 100)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                                <span>Med, Surg, OBG, Peds, PSM, ENT, Ophtha, Allied</span>
                                <span className="font-mono font-bold">{Math.round((p2 / 150) * 100)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Question Distribution Bar (Correct / Incorrect / Skipped) */}
                          <div className="p-3.5 rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between text-xs font-semibold text-[#1D1D1F]">
                              <span>Question Breakdown (300 Total)</span>
                              <span className="font-mono text-[11px] text-[#6E6E73]">
                                Accuracy: <strong className="text-emerald-700">{accuracy}%</strong>
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#E5E5EA] overflow-hidden flex">
                              <div
                                className="bg-[#30D158] h-full"
                                style={{ width: `${Math.max(0, (gt.correctCount / 300) * 100)}%` }}
                                title={`${gt.correctCount} Correct`}
                              />
                              <div
                                className="bg-[#FF3B30] h-full"
                                style={{ width: `${Math.max(0, (gt.incorrectCount / 300) * 100)}%` }}
                                title={`${gt.incorrectCount} Incorrect`}
                              />
                              <div
                                className="bg-[#C7C7CC] h-full"
                                style={{ width: `${Math.max(0, (gt.skippedCount / 300) * 100)}%` }}
                                title={`${gt.skippedCount} Skipped`}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10.5px] font-mono">
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-[#30D158]" />
                                {gt.correctCount} Correct ({Math.round((gt.correctCount / 300) * 100)}%)
                              </span>
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-[#FF3B30]" />
                                {gt.incorrectCount} Incorrect ({Math.round((gt.incorrectCount / 300) * 100)}%)
                              </span>
                              <span className="text-[#8E8E93] flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-[#C7C7CC]" />
                                {gt.skippedCount} Skipped ({Math.round((gt.skippedCount / 300) * 100)}%)
                              </span>
                            </div>
                          </div>

                          {/* Weak Subjects Tags if any */}
                          {gt.weakSubjectIds && gt.weakSubjectIds.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                High-Yield Weak Areas Identified:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {gt.weakSubjectIds.map((id) => {
                                  const sub = FMGE_SUBJECTS.find((s) => s.id === id);
                                  return (
                                    <span
                                      key={id}
                                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80"
                                    >
                                      {sub?.name || id}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Key Mistakes Notes */}
                          {gt.keyMistakesNotes && (
                            <div className="p-3 rounded-xl bg-white border border-[rgba(60,60,67,0.06)] text-xs text-[#6E6E73] leading-relaxed">
                              <strong className="text-[#1D1D1F] block mb-0.5 font-sans">Exam Retrospective:</strong>
                              {gt.keyMistakesNotes}
                            </div>
                          )}

                          {/* Deep Diagnostic and Delete Actions */}
                          <div className="pt-2 flex items-center justify-between border-t border-[rgba(60,60,67,0.06)]">
                            {/* Delete Action */}
                            {isDeleting ? (
                              <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                                <span className="text-[10.5px] text-rose-800 font-semibold px-1.5">Confirm delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(gt.id, gt.title)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10.5px] font-bold cursor-pointer"
                                >
                                  Yes, Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-white text-slate-600 text-[10.5px] font-bold border border-slate-200 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(gt.id)}
                                className="inline-flex items-center gap-1.5 text-xs text-[#8E8E93] hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete mock record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Record</span>
                              </button>
                            )}

                            {/* Launch Deep Diagnostic Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTestForDiagnostic(gt);
                                setShowDiagnosticModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3730A3] hover:bg-[#312E81] text-white text-[12px] font-bold cursor-pointer shadow-xs transition-all active:scale-95"
                            >
                              <span>Deep Diagnostic Breakdown</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Apple HIG Empty State matching Error Vault */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[rgba(60,60,67,0.1)] shadow-sm text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#3730A3]/10 text-[#3730A3] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#30D158]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-[#1D1D1F]">
                  No mock exams recorded yet
                </h3>
                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  Start logging your 300-question grand tests from Marrow, Prepladder, Cerebellum, or offline mocks to build your NBE clearance trajectory.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAddGTModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Grand Test</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Sidebar matching Error Vault & Predictor */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Exam Stamina & Paper Balance Card (Matching media_1790582425871.png) */}
          <div className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#3730A3]/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#3730A3]" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#1D1D1F]">Paper &amp; Stamina Insights</h2>
                <p className="text-[11px] text-[#8E8E93]">Understand your exam balance</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Paper 1 (Pre & Para-Clinical)',
                  value: stats.totalTests > 0 ? Math.round((stats.averagePaper1 / 150) * 100) : 50,
                  sub: `${stats.averagePaper1 || 75} / 150 marks`,
                  color: '#007AFF',
                },
                {
                  label: 'Paper 2 (Clinical Disciplines)',
                  value: stats.totalTests > 0 ? Math.round((stats.averagePaper2 / 150) * 100) : 50,
                  sub: `${stats.averagePaper2 || 75} / 150 marks`,
                  color: '#30D158',
                },
                {
                  label: '300-Q CBT Endurance',
                  value: stats.totalTests > 0 ? Math.min(100, Math.round((stats.clearedCount / (stats.totalTests || 1)) * 100) + 20) : 60,
                  sub: 'Stamina on final 50 Qs',
                  color: '#5856D6',
                },
                {
                  label: 'Qualifying Clearance Margin',
                  value: stats.totalTests > 0 ? Math.min(100, Math.round(((stats.highestScore || 150) / 300) * 100)) : 50,
                  sub: `Peak score: ${stats.highestScore || 150}/300`,
                  color: '#FF9500',
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#3A3A3C] font-medium">{label}</span>
                    <span className="font-mono font-bold text-[#1D1D1F]">{value}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#F2F2F7] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, background: color }}
                    />
                  </div>
                  <div className="text-[10px] text-[#8E8E93] text-right">{sub}</div>
                </div>
              ))}
            </div>

            {/* Clearance progress ring */}
            <div className="pt-3 border-t border-[rgba(60,60,67,0.06)] flex items-center gap-3">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
                  <circle cx="26" cy="26" r="20" fill="none" stroke="#F2F2F7" strokeWidth="5" />
                  <circle
                    cx="26"
                    cy="26"
                    r="20"
                    fill="none"
                    stroke={stats.clearanceRate >= 60 ? '#30D158' : stats.clearanceRate > 0 ? '#FF9500' : '#4338CA'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - (stats.clearanceRate || 50) / 100)}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <span className="absolute text-[11px] font-black font-mono text-[#1D1D1F]">
                  {stats.clearanceRate}%
                </span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#1D1D1F]">Mock Clearance Rate</p>
                <p className="text-[11px] text-[#8E8E93]">
                  {stats.clearedCount} of {stats.totalTests} cleared (≥150)
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Next Actions Card (Matching media_1790582458273.png) */}
          <div className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#1D1D1F]">Strategic Actions</h2>
                <p className="text-[11px] text-[#8E8E93]">Personalised steps to boost your score</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Action 1: 50-MCQ Mini Mock */}
              <button
                type="button"
                onClick={() => setShowMockModal(true)}
                className="w-full p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-50/70 text-left flex items-center justify-between gap-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[12.5px] font-bold text-[#1D1D1F] leading-snug">
                      Take 50-MCQ Mini-Mock
                    </h4>
                    <p className="text-[10.5px] text-[#6E6E73]">
                      Timed sprint under strict exam pressure
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#007AFF] opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 2: Error Vault */}
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('errors') : null}
                className="w-full p-3.5 rounded-2xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-50/70 text-left flex items-center justify-between gap-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#5856D6] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[12.5px] font-bold text-[#1D1D1F] leading-snug">
                      Review Error Vault
                    </h4>
                    <p className="text-[10.5px] text-[#6E6E73]">
                      Clear active mistakes from previous mocks
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5856D6] opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 3: Deep Diagnostic */}
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(true)}
                className="w-full p-3.5 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 hover:bg-indigo-50/70 text-left flex items-center justify-between gap-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#3730A3] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[12.5px] font-bold text-[#1D1D1F] leading-snug">
                      19-Subject Diagnostics
                    </h4>
                    <p className="text-[10.5px] text-[#6E6E73]">
                      Full weakness breakdown &amp; recommendations
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#3730A3] opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <p className="text-[10.5px] text-[#8E8E93] text-center pt-1">
              Recommendations adapt automatically to your latest activity.
            </p>
          </div>

          {/* NBE Protocol Blueprint Card */}
          <div className="p-4 rounded-2xl bg-[#F2F2F7]/50 border border-[rgba(60,60,67,0.06)] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8E8E93] block">
              OFFICIAL NBE PROTOCOL
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(60,60,67,0.06)]">
                <span className="text-[10px] text-[#8E8E93] block">Paper 1</span>
                <span className="font-bold font-mono text-[#1D1D1F]">150 Qs · 150 Mins</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[rgba(60,60,67,0.06)]">
                <span className="text-[10px] text-[#8E8E93] block">Paper 2</span>
                <span className="font-bold font-mono text-[#1D1D1F]">150 Qs · 150 Mins</span>
              </div>
            </div>
            <p className="text-[10.5px] text-[#8E8E93] leading-relaxed pt-1">
              No negative marking. A candidate must secure at least 150 out of 300 marks to qualify for provisional or permanent registration.
            </p>
          </div>
        </div>
      </div>

      {/* 6. REDESIGNED LOG GRAND TEST MODAL */}
      {showAddGTModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[rgba(60,60,67,0.12)] max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[rgba(60,60,67,0.08)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#3730A3]/10 text-[#3730A3] text-[10px] font-mono font-bold border border-[#3730A3]/20">
                    NBE 300-MARK RECORD
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">
                  Log Grand Test Result
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Record your full 300-mark mock test score to evaluate your trajectory against the 150-mark pass mark.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddGTModal(false)}
                className="w-8 h-8 rounded-full text-[#8E8E93] hover:text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGT} className="space-y-5 text-xs">
              {/* Section 1: Test Identity */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase text-[#8E8E93]">
                  1. Test Identity &amp; Platform
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1D1D1F] mb-1 text-[11px]">
                      Test Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marrow GT 18 or Prepladder CBT 3"
                      value={newGT.title}
                      onChange={(e) => setNewGT({ ...newGT, title: e.target.value })}
                      className="w-full h-10 px-3.5 bg-[#F2F2F7] border border-transparent focus:border-[#3730A3] focus:bg-white rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1D1D1F] mb-1 text-[11px]">
                      Test Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newGT.date}
                      onChange={(e) => setNewGT({ ...newGT, date: e.target.value })}
                      className="w-full h-10 px-3.5 bg-[#F2F2F7] border border-transparent focus:border-[#3730A3] focus:bg-white rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Platform selector pills */}
                <div>
                  <label className="block font-bold text-[#1D1D1F] mb-1 text-[11px]">
                    Platform / Coaching Source
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {platforms.map((p) => {
                      const isSel = newGT.platform === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewGT({ ...newGT, platform: p })}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#3730A3] text-white shadow-sm'
                              : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 2: Score & Cutoff Comparison */}
              <div className="p-4 rounded-2xl bg-[#F2F2F7]/50 border border-[rgba(60,60,67,0.06)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#8E8E93]">
                    2. Overall Score &amp; Percentile
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      (newGT.score || 0) >= 150
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                        : 'bg-amber-50 text-amber-800 border-amber-200/90'
                    }`}
                  >
                    {(newGT.score || 0) >= 150
                      ? `PASS (+${(newGT.score || 0) - 150})`
                      : `NEEDS BOOST (${150 - (newGT.score || 0)} to pass)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1D1D1F] mb-1 text-[11px]">
                      Final Score (out of 300) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      required
                      value={newGT.score}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewGT({ ...newGT, score: val });
                      }}
                      className="w-full h-11 px-3.5 bg-white border border-[rgba(60,60,67,0.1)] focus:border-[#3730A3] rounded-xl text-base font-extrabold font-mono text-[#1D1D1F] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1D1D1F] mb-1 text-[11px]">
                      Percentile (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 74"
                      value={newGT.percentile ?? ''}
                      onChange={(e) =>
                        setNewGT({
                          ...newGT,
                          percentile: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full h-11 px-3.5 bg-white border border-[rgba(60,60,67,0.1)] focus:border-[#3730A3] rounded-xl text-sm font-bold font-mono text-[#1D1D1F] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Paper 1 & Paper 2 Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-[#8E8E93]">
                  <span>3. Paper Splits (150 Marks Each)</span>
                  <span className="text-[#8E8E93] font-normal">
                    P1 + P2 = {(Number(newGT.paper1Score) || 0) + (Number(newGT.paper2Score) || 0)}/300
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">
                      Paper 1 (Pre/Para) / 150
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={newGT.paper1Score}
                      onChange={(e) => setNewGT({ ...newGT, paper1Score: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 bg-[#F2F2F7] border border-transparent focus:border-[#3730A3] focus:bg-white rounded-xl text-xs font-bold font-mono text-[#1D1D1F] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">
                      Paper 2 (Clinical) / 150
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={newGT.paper2Score}
                      onChange={(e) => setNewGT({ ...newGT, paper2Score: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 bg-[#F2F2F7] border border-transparent focus:border-[#3730A3] focus:bg-white rounded-xl text-xs font-bold font-mono text-[#1D1D1F] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Question Count Distribution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-[#8E8E93]">
                  <span>4. Question Breakdown (Total 300 Qs)</span>
                  <span
                    className={`font-normal ${
                      (Number(newGT.correctCount) || 0) +
                        (Number(newGT.incorrectCount) || 0) +
                        (Number(newGT.skippedCount) || 0) ===
                      300
                        ? 'text-emerald-700 font-bold'
                        : 'text-amber-600'
                    }`}
                  >
                    Sum:{' '}
                    {(Number(newGT.correctCount) || 0) +
                      (Number(newGT.incorrectCount) || 0) +
                      (Number(newGT.skippedCount) || 0)}
                    /300
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-emerald-800 mb-1 text-[11px]">
                      Correct
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={newGT.correctCount}
                      onChange={(e) => setNewGT({ ...newGT, correctCount: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold font-mono text-emerald-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-rose-800 mb-1 text-[11px]">
                      Incorrect
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={newGT.incorrectCount}
                      onChange={(e) => setNewGT({ ...newGT, incorrectCount: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-bold font-mono text-rose-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#6E6E73] mb-1 text-[11px]">
                      Skipped
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={newGT.skippedCount}
                      onChange={(e) => setNewGT({ ...newGT, skippedCount: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 bg-[#F2F2F7] border border-transparent focus:border-[rgba(60,60,67,0.2)] focus:bg-white rounded-xl text-xs font-bold font-mono text-[#1D1D1F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Tag Weak Subjects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#1D1D1F] text-[11px]">
                    5. Tag Weak Areas in this GT ({newGT.weakSubjectIds?.length || 0} selected)
                  </label>
                  <span className="text-[10px] text-[#8E8E93]">Click to toggle</span>
                </div>

                <div className="p-3 bg-[#F2F2F7]/50 rounded-2xl border border-[rgba(60,60,67,0.06)] max-h-36 overflow-y-auto space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {FMGE_SUBJECTS.map((sub) => {
                      const isSelected = newGT.weakSubjectIds?.includes(sub.id);
                      return (
                        <button
                          type="button"
                          key={sub.id}
                          onClick={() => toggleWeakSubject(sub.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-[#1D1D1F] border border-[rgba(60,60,67,0.1)] hover:border-[rgba(60,60,67,0.2)]'
                          }`}
                        >
                          {sub.name} (~{sub.weightage}m)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 6: Key Reflections / Mistakes Notes */}
              <div className="space-y-1">
                <label className="block font-bold text-[#1D1D1F] text-[11px]">
                  6. Clinical Reflections &amp; Time Management Takeaways
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ran out of time in Paper 2 last 20 questions. Need to review OBG partograms and PSM formulas..."
                  value={newGT.keyMistakesNotes}
                  onChange={(e) => setNewGT({ ...newGT, keyMistakesNotes: e.target.value })}
                  className="w-full p-3.5 bg-[#F2F2F7] border border-transparent focus:border-[#3730A3] focus:bg-white rounded-xl text-xs text-[#1D1D1F] focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(60,60,67,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowAddGTModal(false)}
                  className="px-5 py-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F] rounded-full font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3730A3] hover:bg-[#2E2882] text-white rounded-full font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Grand Test Result
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* 50-MCQ Timed NBE Examination Simulation */}
      <NbeMockExamModal
        isOpen={showMockModal}
        onClose={() => setShowMockModal(false)}
        onLogGrandTest={onAddGrandTest}
        onAddErrorItem={onAddErrorItem}
      />

      {/* Grand Test Deep Diagnostic Modal */}
      <GrandTestDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => {
          setShowDiagnosticModal(false);
          setSelectedTestForDiagnostic(null);
        }}
        grandTests={selectedTestForDiagnostic ? [selectedTestForDiagnostic] : gts}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
