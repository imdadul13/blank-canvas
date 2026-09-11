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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { GrandTest, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';

interface GrandTestsViewProps {
  state: AppState;
  onAddGrandTest: (gt: GrandTest) => void;
  onDeleteGrandTest: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const GrandTestsView: React.FC<GrandTestsViewProps> = ({
  state,
  onAddGrandTest,
  onDeleteGrandTest,
  onNavigateTab,
}) => {
  const [showAddGTModal, setShowAddGTModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

      {/* 1. Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => onNavigateTab('progress')}
              className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>PERFORMANCE</span>
            </button>
          ) : (
            <span className="text-stone-500">PERFORMANCE</span>
          )}
          <span className="text-stone-400">•</span>
          <span className="text-[#006B63] font-bold">GRAND TESTS &amp; MOCK EXAMS</span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-teal-50 text-teal-800 border border-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            NBE Cutoff: 150/300
          </span>
        </div>
      </div>

      {/* 2. Hero Header Card with Motion & Visual Animations */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#F1F5FA] p-4 sm:px-6 sm:py-3.5 shadow-xs"
      >
        {/* Dynamic Animated Ambient Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">

          {/* Soft glowing corner radial gradient orbs with breathing motion */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.35, 0.6, 0.35],
              x: [0, 16, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/35 via-emerald-200/25 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
              y: [0, -10, 0],
            }}
            transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-16 -left-12 h-60 w-60 rounded-full bg-gradient-to-tr from-cyan-300/25 via-teal-100/20 to-transparent blur-3xl"
          />

          {/* Subtle Coordinate Grid */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.035] text-teal-950 pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="gt-hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="28" cy="28" r="0.75" fill="currentColor" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gt-hero-grid)" />
          </svg>

          {/* Premium Alpine Summit of Triumph & Victory Colonnade Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[520px] overflow-hidden opacity-45 sm:opacity-60 md:opacity-[0.72] select-none pointer-events-none block">
            <svg viewBox="0 0 520 145" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <linearGradient id="gt-sky-dawn" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.6" />
                  <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gt-mtn-far" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#334155" stopOpacity="0.55" />
                </linearGradient>
                <linearGradient id="gt-summit-cliff" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#0F766E" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#044E48" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="gt-column-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="40%" stopColor="#E2E8F0" />
                  <stop offset="80%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>
                <radialGradient id="gt-dawn-sun" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#FBBF24" stopOpacity="0.4" />
                  <stop offset="85%" stopColor="#10B981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Golden Dawn Sun Corona behind the Summit */}
              <motion.circle
                cx="430"
                cy="48"
                r="55"
                fill="url(#gt-dawn-sun)"
                animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* ═══ 1. DISTANT ALPINE RIDGES & ROLLING HORIZON ═══ */}
              <path
                d="M 120 145 L 200 95 L 260 120 L 330 75 L 420 110 L 520 85 L 520 145 Z"
                fill="url(#gt-mtn-far)"
              />

              {/* Low Valley Mist Drifting horizontally */}
              <motion.path
                d="M 100 125 Q 220 112 340 122 Q 440 115 520 122"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.35"
                animate={{ x: [-15, 15, -15] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* ═══ 2. FOREGROUND ASCENDING SUMMIT CLIFF (PAST 150 CUTOFF) ═══ */}
              <path
                d="M 180 145 L 270 115 L 340 85 L 400 62 L 470 58 L 520 70 L 520 145 Z"
                fill="url(#gt-summit-cliff)"
              />

              {/* 150-Mark Milestone Inscription Plaque on Cliff Face */}
              <g transform="translate(285, 112) rotate(-18)">
                <rect x="0" y="0" width="58" height="15" rx="3" fill="#0F172A" opacity="0.6" />
                <rect x="1" y="1" width="56" height="13" rx="2" stroke="#F59E0B" strokeWidth="0.8" fill="none" />
                <text x="29" y="10.5" textAnchor="middle" fill="#FDE68A" fontSize="8" fontWeight="800" fontFamily="monospace" letterSpacing="0.8">
                  ★ 150 CUTOFF
                </text>
              </g>

              {/* ═══ 3. TRIUMPHAL VICTORY COLONNADE & LAUREL ARCHWAY ═══ */}
              <g transform="translate(425, 20)">
                {/* Archway Pediment / Entablature Top */}
                <polygon points="0,8 38,0 76,8" fill="url(#gt-column-grad)" />
                <rect x="2" y="8" width="72" height="5" rx="1" fill="url(#gt-column-grad)" />
                {/* Golden Inscribed Star of Excellence */}
                <circle cx="38" cy="4" r="2.5" fill="#F59E0B" />

                {/* Left Classical Column */}
                <rect x="8" y="13" width="7" height="36" fill="url(#gt-column-grad)" />
                <rect x="6" y="13" width="11" height="2" fill="url(#gt-column-grad)" />
                <rect x="6" y="47" width="11" height="2" fill="url(#gt-column-grad)" />

                {/* Right Classical Column */}
                <rect x="61" y="13" width="7" height="36" fill="url(#gt-column-grad)" />
                <rect x="59" y="13" width="11" height="2" fill="url(#gt-column-grad)" />
                <rect x="59" y="47" width="11" height="2" fill="url(#gt-column-grad)" />

                {/* Central Arch Curve */}
                <path
                  d="M 15 28 C 15 18, 61 18, 61 28"
                  stroke="url(#gt-column-grad)"
                  strokeWidth="2.5"
                  fill="none"
                />

                {/* Golden Triumph Beacon Light in Center Arch */}
                <circle cx="38" cy="27" r="3.5" fill="#F59E0B" />
                <motion.circle
                  cx="38"
                  cy="27"
                  r="7"
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                  fill="none"
                  animate={{ scale: [1, 2.2], opacity: [0.9, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                />
              </g>

              {/* ═══ 4. VICTORIOUS DOCTOR SILHOUETTE ON SUMMIT PRECIPICE ═══ */}
              <g transform="translate(390, 32) scale(0.65)">
                {/* Head with Stethoscope around neck */}
                <ellipse cx="14" cy="8" rx="5.5" ry="6.5" fill="#0F172A" />
                {/* Body in White Coat */}
                <path d="M 9 15 L 19 15 L 22 40 L 6 40 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
                {/* Stethoscope */}
                <path d="M 11 15 C 11 21, 17 21, 17 15" stroke="#0D9488" strokeWidth="1.5" fill="none" />
                <circle cx="14" cy="23" r="1.8" fill="#0D9488" />
                {/* Billowing White Coat Tail in Mountain Breeze */}
                <motion.path
                  d="M 6 32 Q -4 34 -8 40 Q -2 36 6 38"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="0.8"
                  animate={{ scaleX: [1, 1.15, 1], skewX: [0, -3, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Legs Standing Firmly on Plateau */}
                <rect x="9" y="40" width="3.5" height="18" fill="#1E293B" />
                <rect x="15" y="40" width="3.5" height="18" fill="#1E293B" />
              </g>

              {/* ═══ 5. SOARING EAGLE / BIRDS OVER DAWN SUMMIT ═══ */}
              <motion.g
                animate={{
                  x: [0, 180],
                  y: [0, -14],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              >
                <g transform="translate(210, 35) scale(0.7)">
                  <motion.path
                    d="M 0 0 Q 6 -8 14 -3 Q 22 -8 28 0 Q 18 -2 14 3 Q 10 -2 0 0 Z"
                    fill="#1E293B"
                    animate={{ scaleY: [1, 0.4, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </g>
              </motion.g>

              {/* Second High-Altitude Bird */}
              <motion.g
                animate={{
                  x: [0, 150],
                  y: [0, -8],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear', delay: 3 }}
              >
                <g transform="translate(280, 20) scale(0.5)">
                  <motion.path
                    d="M 0 0 Q 6 -7 12 -2 Q 18 -7 24 0 Q 15 -2 12 2 Q 9 -2 0 0 Z"
                    fill="#334155"
                    animate={{ scaleY: [1, 0.4, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </g>
              </motion.g>
            </svg>
          </div>
        </div>

        {/* Header Content Body */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            {/* Clean Unboxed Eyebrow */}
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700 font-mono block">
              NBE Simulation · 300 Questions
            </span>

            {/* Heading with Minimal Insignia */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-50/90 border border-indigo-100/90 text-indigo-700 shadow-2xs shrink-0">
                <Award className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-indigo-700 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 bg-clip-text text-transparent tracking-tight font-['Outfit'] leading-snug">
                  Grand Tests &amp; Mocks
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-normal line-clamp-1 sm:line-clamp-none">
                  Simulate 300-Q NBE exams &amp; track your trajectory past the 150-mark cutoff.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                <span className="text-slate-400">Tests:</span>
                <span className="font-bold text-slate-900">{stats.totalTests}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                <span className="text-slate-400">Latest:</span>
                <span className={`font-bold ${stats.latestPassed ? 'text-emerald-700' : stats.latestScore > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                  {stats.latestScore > 0 ? `${stats.latestScore}/300` : 'None'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                <span className="text-slate-400">Peak:</span>
                <span className="font-bold text-teal-700">
                  {stats.highestScore > 0 ? `${stats.highestScore}/300` : '-'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                <span className="text-slate-400">Pass Rate:</span>
                <span className="font-bold text-emerald-700">
                  {stats.clearanceRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowAddGTModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#00524c] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Grand Test</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* 3. Primary Actions & Benchmark Bar: Clear NBE benchmark card (300 questions / 150 pass mark) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: NBE 300-Question / 150-Pass Mark Benchmark Blueprint */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#00685f]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    NBE Examination Benchmark
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#00685f] text-white text-[10px] font-mono font-bold">
                    OFFICIAL SCHEME
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  National Board of Examinations (NBE) FMGE Screening Standard
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setShowAddGTModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Grand Test</span>
            </button>
          </div>

          {/* Scheme Breakdown Grid (3 Pillars: Total Qs, Pass Mark, No Negative Marking) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* 300 Questions */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
              <div className="text-[11px] font-mono uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>Format</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-900">
                300 <span className="text-xs font-normal text-slate-500 font-sans">Questions</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Paper 1 (150 Qs) + Paper 2 (150 Qs)
              </div>
            </div>

            {/* 150 Pass Mark */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
              <div className="text-[11px] font-mono uppercase font-bold text-emerald-800 mb-1 flex items-center justify-between">
                <span>Pass Benchmark</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-800">
                150 <span className="text-xs font-normal text-emerald-700 font-sans">Marks (50%)</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Strict qualifying standard, no negative marking
              </div>
            </div>

            {/* Timing & Discipline */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
              <div className="text-[11px] font-mono uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>Stamina Target</span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-900">
                300 <span className="text-xs font-normal text-slate-500 font-sans">Minutes</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                2.5 hours Paper 1 • 2.5 hours Paper 2
              </div>
            </div>
          </div>

          {/* Visual Benchmark Scale: 0 to 300 with 150 Cutoff Marker */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Cutoff Trajectory Scale</span>
              {stats.totalTests > 0 ? (
                <span className="font-mono text-[#00685f]">
                  Latest: {stats.latestScore}/300 ({stats.latestScore >= 150 ? `+${stats.latestScore - 150} above cutoff` : `${150 - stats.latestScore} to pass`})
                </span>
              ) : (
                <span className="text-slate-400">Aim for ≥150 in every full mock</span>
              )}
            </div>

            <div className="relative w-full h-3.5 rounded-full bg-slate-100 overflow-hidden">
              {/* Passing threshold indicator (50% mark) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                style={{ left: '50%' }}
                title="150 Pass Cutoff (50%)"
              />

              {/* Progress bar based on latest score */}
              {stats.totalTests > 0 && (
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    stats.latestScore >= 150 ? 'bg-[#00685f]' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, (stats.latestScore / 300) * 100))}%` }}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>0 M</span>
              <span className="text-slate-900 font-bold flex items-center gap-1">
                ▲ 150 CUTOFF (50%)
              </span>
              <span>300 M</span>
            </div>
          </div>
        </div>

        {/* Right Card: Student Mock Portfolio Summary */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-[#00685f]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Mock Performance
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {stats.totalTests} {stats.totalTests === 1 ? 'MOCK' : 'MOCKS'}
            </span>
          </div>

          {stats.totalTests > 0 ? (
            <div className="space-y-3.5">
              {/* Latest Score Tile */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                    Latest Mock Result
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-extrabold font-mono text-slate-900">
                      {stats.latestScore}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 300</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    stats.latestScore >= 150
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                      : 'bg-amber-50 text-amber-800 border-amber-200/90'
                  }`}
                >
                  {stats.latestScore >= 150 ? 'PASS' : 'NEEDS BOOST'}
                </span>
              </div>

              {/* 2x2 Grid: Highest, Average, Clearance Rate, Delta */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Highest Mock
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {stats.highestScore} <span className="text-[10px] text-slate-400">/300</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Average Score
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {stats.averageScore} <span className="text-[10px] text-slate-400">/300</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Clearance Rate
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {stats.clearanceRate}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Trajectory Delta
                  </span>
                  <span
                    className={`text-base font-bold font-mono ${
                      stats.scoreDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {stats.scoreDelta >= 0 ? `+${stats.scoreDelta}` : stats.scoreDelta}
                  </span>
                </div>
              </div>

              {/* Paper 1 vs Paper 2 Balance */}
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <span>Avg Paper 1: <strong className="font-mono text-slate-900">{stats.averagePaper1}m</strong></span>
                <span>Avg Paper 2: <strong className="font-mono text-slate-900">{stats.averagePaper2}m</strong></span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                No mock data recorded yet. Log your first test to see automatic trend insights and paper splits.
              </p>
            </div>
          )}

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Evaluated against NBE 150 pass mark</span>
          </div>
        </div>
      </div>

      {/* 4. Score Trajectory Progression (Visible when >= 2 tests logged) */}
      {gts.length >= 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#00685f]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Score Progression Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological mock exam progression relative to the 150-mark cutoff
                </p>
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
              {stats.scoreDelta >= 0 ? `+${stats.scoreDelta} PTS IMPROVEMENT` : `${stats.scoreDelta} PTS TREND`}
            </div>
          </div>

          {/* Visual Timeline Nodes */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="flex items-center gap-3 sm:gap-4 min-w-[560px] pt-4">
              {[...gts]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((gt, idx) => {
                  const isPass = gt.score >= 150;
                  const deltaTo150 = gt.score - 150;

                  return (
                    <div
                      key={gt.id}
                      className="flex-1 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="font-bold text-slate-700">GT #{idx + 1}</span>
                        <span>{gt.date}</span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold font-mono text-slate-900 group-hover:text-[#00685f] transition-colors">
                          {gt.score}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPass ? `+${deltaTo150}` : `${deltaTo150}`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 truncate font-medium">
                        {gt.title}
                      </div>

                      {/* Mini bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPass ? 'bg-[#00685f]' : 'bg-amber-500'}`}
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

      {/* 5. Filter & Search Controls (Visible when tests exist) */}
      {gts.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests, platforms, or weak areas..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Filter Pills & Sort */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Platform Dropdown */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Platforms</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            {[
              { id: 'all', label: 'All Status' },
              { id: 'pass', label: '✅ Pass (≥150)' },
              { id: 'fail', label: '⚠️ Needs Boost' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#00685f] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer ml-auto md:ml-0"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>
      )}

      {/* 6. Grand Test History Cards Grid or Empty State */}
      {filteredGTs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGTs.map((gt) => {
            const isPassed = gt.score >= 150;
            const accuracy = Math.round(
              (gt.correctCount / (gt.correctCount + gt.incorrectCount || 1)) * 100
            );
            const delta = gt.score - 150;

            const p1 = gt.paper1Score ?? Math.round(gt.score / 2);
            const p2 = gt.paper2Score ?? (gt.score - p1);

            const isDeleting = deleteConfirmId === gt.id;

            return (
              <div
                key={gt.id}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 relative ${
                  isPassed ? 'border-emerald-200/90 shadow-xs' : 'border-slate-200/80 shadow-xs'
                }`}
              >
                {/* Card Top: Platform Tag, Title, Date & Delete Action */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-[#00685f]">
                        {gt.platform}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {gt.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{gt.date}</span>
                      </div>
                    </div>

                    {/* Delete with inline confirmation */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200 shrink-0">
                        <span className="text-[10px] font-bold text-rose-700 px-1">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(gt.id, gt.title)}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 rounded-lg bg-white text-slate-600 text-[10px] font-bold border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(gt.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Delete test record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Score Callout Card */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          TOTAL SCORE
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-3xl font-extrabold font-mono ${
                              isPassed ? 'text-emerald-800' : 'text-amber-700'
                            }`}
                          >
                            {gt.score}
                          </span>
                          <span className="text-xs font-mono text-slate-400">/ 300</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            isPassed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isPassed ? (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              <span>PASS (≥150)</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              <span>NEEDS BOOST</span>
                            </>
                          )}
                        </span>
                        <div className="text-[11px] font-mono font-semibold text-slate-600">
                          {isPassed ? `+${delta} marks above cutoff` : `${Math.abs(delta)} marks to pass`}
                        </div>
                      </div>
                    </div>

                    {/* Secondary Metrics: Accuracy & Percentile */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <span>Accuracy: <strong>{accuracy}%</strong></span>
                      {gt.percentile !== undefined && (
                        <span>Percentile: <strong className="font-mono text-[#00685f]">{gt.percentile}th</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Paper 1 & Paper 2 Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          Paper 1 (Pre/Para)
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono font-bold text-slate-900 text-sm">{p1} / 150</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round((p1 / 150) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00685f]"
                          style={{ width: `${Math.min(100, Math.max(5, (p1 / 150) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          Paper 2 (Clinical)
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono font-bold text-slate-900 text-sm">{p2} / 150</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round((p2 / 150) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-600"
                          style={{ width: `${Math.min(100, Math.max(5, (p2 / 150) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Distribution Bar (Correct / Incorrect / Skipped) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Questions Breakdown</span>
                      <span className="font-mono font-medium">
                        {gt.correctCount + gt.incorrectCount + gt.skippedCount} Qs
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.max(0, (gt.correctCount / 300) * 100)}%` }}
                        title={`${gt.correctCount} Correct`}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${Math.max(0, (gt.incorrectCount / 300) * 100)}%` }}
                        title={`${gt.incorrectCount} Incorrect`}
                      />
                      <div
                        className="bg-slate-300 h-full"
                        style={{ width: `${Math.max(0, (gt.skippedCount / 300) * 100)}%` }}
                        title={`${gt.skippedCount} Skipped`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="text-emerald-700 font-bold">{gt.correctCount} Correct</span>
                      <span className="text-rose-700 font-bold">{gt.incorrectCount} Incorrect</span>
                      <span className="text-slate-500">{gt.skippedCount} Skipped</span>
                    </div>
                  </div>

                  {/* Weak Subjects Tags */}
                  {gt.weakSubjectIds && gt.weakSubjectIds.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Tagged Weak Areas ({gt.weakSubjectIds.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {gt.weakSubjectIds.map((id) => {
                          const sub = FMGE_SUBJECTS.find((s) => s.id === id);
                          return (
                            <span
                              key={id}
                              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                            >
                              {sub?.name || id}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes / Reflections */}
                  {gt.keyMistakesNotes && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70 space-y-0.5">
                        <span className="font-bold text-amber-900 block text-[10px] uppercase font-mono">
                          Clinical Reflections:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                          {gt.keyMistakesNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. Empty State: Intentional & Guiding */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-8">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-[#00685f] flex items-center justify-center mx-auto shadow-xs">
              <GraduationCap className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-wider inline-block">
              NO GRAND TESTS LOGGED YET
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">
              Ready to benchmark your FMGE preparation?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Grand Tests are the single highest-yield diagnostic for FMGE success. Record your 300-question mock results from Marrow, Prepladder, Cerebellum, or offline mocks to unlock passing probability and paper balance analytics.
            </p>
          </div>

          {/* 3 Step Action Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-[#00685f] text-white font-mono font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">Simulate 300 Questions</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take a full timed mock test under strict CBT conditions: 150 Qs Paper 1, 150 Qs Paper 2.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-[#00685f] text-white font-mono font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">Log Your Breakdown</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Record your total score, correct vs incorrect counts, and Paper 1 vs Paper 2 splits.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-[#00685f] text-white font-mono font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">Triage Weak Subjects</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tag your weak areas to automatically feed into the Adaptive Planner &amp; AI Coach.
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAddGTModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Your First Grand Test</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. REDESIGNED LOG GRAND TEST MODAL */}
      {showAddGTModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00685f] text-[10px] font-mono font-bold">
                    NBE 300-MARK RECORD
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                  Log Grand Test Result
                </h3>
                <p className="text-xs text-slate-500">
                  Record your full 300-mark mock test score to evaluate your trajectory against the 150-mark pass mark.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddGTModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGT} className="space-y-5 text-xs">
              {/* Section 1: Test Identity */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase text-slate-400">
                  1. Test Identity &amp; Platform
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Test Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marrow GT 18 or Prepladder CBT 3"
                      value={newGT.title}
                      onChange={(e) => setNewGT({ ...newGT, title: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00685f] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Test Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newGT.date}
                      onChange={(e) => setNewGT({ ...newGT, date: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00685f] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Platform selector pills */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#00685f] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    2. Overall Score &amp; Percentile
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      (newGT.score || 0) >= 150
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {(newGT.score || 0) >= 150
                      ? `PASS (+${(newGT.score || 0) - 150})`
                      : `NEEDS BOOST (${150 - (newGT.score || 0)} to pass)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
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
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-base font-extrabold font-mono text-slate-900 focus:border-[#00685f] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
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
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:border-[#00685f] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Paper 1 & Paper 2 Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-slate-400">
                  <span>3. Paper Splits (150 Marks Each)</span>
                  <span className="text-slate-500 font-normal">
                    P1 + P2 = {(Number(newGT.paper1Score) || 0) + (Number(newGT.paper2Score) || 0)}/300
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Paper 1 (Pre/Para) / 150
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={newGT.paper1Score}
                      onChange={(e) => setNewGT({ ...newGT, paper1Score: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-[#00685f] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Paper 2 (Clinical) / 150
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={newGT.paper2Score}
                      onChange={(e) => setNewGT({ ...newGT, paper2Score: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-[#00685f] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Question Count Distribution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-slate-400">
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
                      className="w-full h-10 px-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold font-mono text-emerald-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                      className="w-full h-10 px-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-bold font-mono text-rose-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                      Skipped
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={newGT.skippedCount}
                      onChange={(e) => setNewGT({ ...newGT, skippedCount: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-700 focus:bg-white focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Tag Weak Subjects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 text-[11px]">
                    5. Tag Weak Areas in this GT ({newGT.weakSubjectIds?.length || 0} selected)
                  </label>
                  <span className="text-[10px] text-slate-400">Click to toggle</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {FMGE_SUBJECTS.map((sub) => {
                      const isSelected = newGT.weakSubjectIds?.includes(sub.id);
                      return (
                        <button
                          type="button"
                          key={sub.id}
                          onClick={() => toggleWeakSubject(sub.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
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
                <label className="block font-bold text-slate-700 text-[11px]">
                  6. Clinical Reflections &amp; Time Management Takeaways
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ran out of time in Paper 2 last 20 questions. Need to review OBG partograms and PSM formulas..."
                  value={newGT.keyMistakesNotes}
                  onChange={(e) => setNewGT({ ...newGT, keyMistakesNotes: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00685f] focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGTModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00685f] hover:bg-[#005049] text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Save Grand Test Result
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
