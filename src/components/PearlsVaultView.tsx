import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  Copy,
  Check,
  BookOpen,
  Brain,
  Pill,
  Scale,
  Activity,
  X,
  Clock,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Printer,
  Zap,
  Flame,
  Layers,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MedicalPearl, AppState } from '../types';
import { speechEngine } from '../utils/speechEngine';
import {
  getDuePearls,
  calculateNextReview,
  SrsRating,
} from '../utils/spacedRepetitionEngine';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { INITIAL_PEARLS } from '../data/initialPearls';
import {
  searchOrGenerateMedicalPearl,
  fetchOrGenerateMedicalPearl,
  COMPREHENSIVE_PEARL_REPOSITORY,
  DynamicPearlTopicPackage,
} from '../utils/medicalPearlsEngine';
import { useCircadianTheme } from '../hooks/useCircadianTheme';
import { CircadianHeaderAtmosphere, CircadianPill } from './CircadianHeaderAtmosphere';
import { HeaderTabInsignia } from './HeaderTabInsignia';
import { ExamEveCheatSheetModal } from './ExamEveCheatSheetModal';

// Visual theme helper for consistent, subtle content differentiation
const getPearlVisualTheme = (pearl: MedicalPearl) => {
  const tagsLower = pearl.tags.map((t) => t.toLowerCase());
  const titleLower = pearl.title.toLowerCase();

  // DOC / Pharmacotherapy: Mint/green therapeutic treatment
  if (
    tagsLower.some((t) => t.includes('doc') || t.includes('drug') || t.includes('pharma') || t.includes('treatment')) ||
    titleLower.includes('drug of choice')
  ) {
    return {
      typeLabel: 'DOC & Protocol',
      badgeClass: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
      keyBoxClass: 'bg-emerald-50/60 border-emerald-200/70 text-emerald-950',
      keyLabelClass: 'text-emerald-800',
      icon: Pill,
    };
  }

  // Formula / Rule: Blue informational treatment
  if (
    tagsLower.some((t) => t.includes('formula') || t.includes('rule') || t.includes('score') || t.includes('calculation')) ||
    titleLower.includes('formula') ||
    titleLower.includes('score')
  ) {
    return {
      typeLabel: 'Formula & Rule',
      badgeClass: 'bg-sky-50/90 text-sky-800 border-sky-200/80',
      keyBoxClass: 'bg-sky-50/60 border-sky-200/70 text-sky-950',
      keyLabelClass: 'text-sky-800',
      icon: Scale,
    };
  }

  // Classification / Triad / Clinical: Purple treatment
  if (
    tagsLower.some((t) => t.includes('triad') || t.includes('classification') || t.includes('syndrome') || t.includes('clinical')) ||
    titleLower.includes('triad') ||
    titleLower.includes('syndrome') ||
    titleLower.includes('classification')
  ) {
    return {
      typeLabel: 'Diagnostic Hallmark',
      badgeClass: 'bg-purple-50/90 text-purple-800 border-purple-200/80',
      keyBoxClass: 'bg-purple-50/60 border-purple-200/70 text-purple-950',
      keyLabelClass: 'text-purple-800',
      icon: Activity,
    };
  }

  // Mnemonic: Teal informational treatment
  return {
    typeLabel: 'Mnemonic',
    badgeClass: 'bg-[#006B63]/10 text-[#006B63] border-[#006B63]/20',
    keyBoxClass: 'bg-stone-50/80 border-stone-200/80 text-stone-900',
    keyLabelClass: 'text-stone-700',
    icon: Brain,
  };
};

interface PearlsVaultViewProps {
  state: AppState;
  onToggleBookmark: (pearlId: string) => void;
  onAddCustomPearl: (pearl: MedicalPearl) => void;
}

type KnowledgeViewMode = 'all' | 'synthesizer' | 'vault';

export const PearlsVaultView: React.FC<PearlsVaultViewProps> = ({
  state,
  onToggleBookmark,
  onAddCustomPearl,
}) => {
  const circadian = useCircadianTheme(state.settings?.bgTheme);

  // SwiftUI-style active view mode
  const [activeViewMode, setActiveViewMode] = useState<KnowledgeViewMode>('all');

  // Master Vault filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mnemonics' | 'doc' | 'formulas'>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active On-Demand Topic Generator state
  const [activeTopicQuery, setActiveTopicQuery] = useState<string>('COPD');
  const [generatedTopic, setGeneratedTopic] = useState<DynamicPearlTopicPackage>(() =>
    searchOrGenerateMedicalPearl('COPD')
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // In-session recent topics shelf
  const [recentTopics, setRecentTopics] = useState<string[]>(() => ['COPD']);

  const handleQueryTopic = async (topic: string) => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setActiveTopicQuery(trimmed);
    setIsGenerating(true);
    setGenerationError(null);
    setRecentTopics((prev) => [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8));
    try {
      const result = await fetchOrGenerateMedicalPearl(trimmed);
      setGeneratedTopic(result);
    } catch (err) {
      console.error('Pearl generation error:', err);
      const fallback = searchOrGenerateMedicalPearl(trimmed);
      if (fallback) {
        setGeneratedTopic(fallback);
      } else {
        setGenerationError('Could not synthesize knowledge for this topic. Please try another clinical term.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedToVault = () => {
    const topicTitle = generatedTopic.mnemonic?.title?.toLowerCase();
    const topicName = generatedTopic.topicName?.toLowerCase();

    // Check if a pearl with this title already exists in the archive
    const existing = allPearls.find(
      (p) =>
        (topicTitle && p.title.toLowerCase() === topicTitle) ||
        (topicName && p.title.toLowerCase() === topicName)
    );

    if (existing) {
      onToggleBookmark(existing.id);
      return;
    }

    // Otherwise, create a new custom pearl marked bookmarked
    const newId = `dyn-pearl-${Date.now()}`;
    const pearl: MedicalPearl = {
      id: newId,
      subjectId: generatedTopic.subjectId,
      title: generatedTopic.mnemonic?.title || generatedTopic.topicName,
      highYieldKey: `${generatedTopic.mnemonic?.acronym || 'KEY'}: ${generatedTopic.oneLineTakeaway}`,
      explanation: `${generatedTopic.mnemonic?.breakdown?.map((b) => `${b.letter} = ${b.meaning} (${b.clinicalNote})`).join('\n') || ''}\n\nDOC: ${generatedTopic.drugOfChoice?.firstLineDrug || 'N/A'}\n\nTriad: ${generatedTopic.diagnosticTriad?.components?.join(', ') || 'N/A'}`,
      tags: ['Mnemonic', 'DOC', 'High-Yield'],
      isHighYield: true,
      isBookmarked: true,
    };
    onAddCustomPearl(pearl);
  };

  // Combine initial pearls, curated repository, and user's custom pearls
  const allPearls = useMemo(() => {
    const repositoryAsPearls: MedicalPearl[] = COMPREHENSIVE_PEARL_REPOSITORY.map((item, idx) => ({
      id: `repo-pearl-${idx}`,
      subjectId: item.subjectId,
      title: item.mnemonic.title,
      highYieldKey: `${item.mnemonic.acronym} • ${item.drugOfChoice.firstLineDrug}`,
      explanation: item.mnemonic.breakdown.map((b) => `• ${b.letter}: ${b.meaning} - ${b.clinicalNote}`).join('\n') + `\n\n📌 Triad: ${item.diagnosticTriad.components.join(' · ')}`,
      tags: ['Mnemonic', 'DOC', 'High-Yield'],
      isHighYield: true,
    }));

    const combined = [...INITIAL_PEARLS, ...repositoryAsPearls, ...(state.customPearls || [])];
    const bookmarkSet = new Set(state.bookmarkedPearlIds || []);

    // Deduplicate by title
    const seen = new Set<string>();
    const uniqueList: MedicalPearl[] = [];
    for (const p of combined) {
      if (!seen.has(p.title.toLowerCase())) {
        seen.add(p.title.toLowerCase());
        uniqueList.push({
          ...p,
          isBookmarked: bookmarkSet.has(p.id),
        });
      }
    }
    return uniqueList;
  }, [state.customPearls, state.bookmarkedPearlIds]);

  // Derived starred status for current generated package
  const isGeneratedSaved = useMemo(() => {
    if (!generatedTopic) return false;
    const topicTitle = generatedTopic.mnemonic?.title?.toLowerCase();
    const topicName = generatedTopic.topicName?.toLowerCase();
    return allPearls.some(
      (p) =>
        p.isBookmarked &&
        ((topicTitle && p.title.toLowerCase() === topicTitle) ||
         (topicName && p.title.toLowerCase() === topicName))
    );
  }, [allPearls, generatedTopic]);

  // Filtered pearls
  const filteredPearls = useMemo(() => {
    return allPearls.filter((p) => {
      if (bookmarkedOnly && !p.isBookmarked) return false;
      if (selectedSubject !== 'all' && p.subjectId !== selectedSubject) return false;
      if (selectedCategory === 'mnemonics' && !p.tags.some((t) => t.toLowerCase().includes('mnemonic'))) return false;
      if (
        selectedCategory === 'doc' &&
        !p.tags.some((t) => t.toLowerCase().includes('doc')) &&
        !p.title.toLowerCase().includes('drug of choice') &&
        !p.highYieldKey.toLowerCase().includes('doc')
      ) return false;
      if (
        selectedCategory === 'formulas' &&
        !p.tags.some((t) => t.toLowerCase().includes('formula') || t.toLowerCase().includes('rule')) &&
        !p.title.toLowerCase().includes('formula') &&
        !p.title.toLowerCase().includes('regimen') &&
        !p.title.toLowerCase().includes('criteria') &&
        !p.highYieldKey.toLowerCase().includes('formula')
      ) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesKey = p.highYieldKey.toLowerCase().includes(q);
        const matchesExpl = p.explanation.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesExpl) return false;
      }
      return true;
    });
  }, [allPearls, bookmarkedOnly, selectedSubject, selectedCategory, searchQuery]);

  const bookmarkedCount = allPearls.filter((pearl) => pearl.isBookmarked).length;

  // Spaced Repetition (SRS) Due Today queue
  const duePearls = useMemo(() => {
    return getDuePearls(allPearls.filter((p) => p.isBookmarked));
  }, [allPearls]);

  const [isSrsReviewOpen, setIsSrsReviewOpen] = useState<boolean>(false);
  const [srsIndex, setSrsIndex] = useState<number>(0);
  const [isSrsAnswerRevealed, setIsSrsAnswerRevealed] = useState<boolean>(false);
  const [isCheatSheetModalOpen, setIsCheatSheetModalOpen] = useState<boolean>(false);

  // Audio Read-Aloud state
  const [playingPearlId, setPlayingPearlId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = speechEngine.subscribe((isPlaying, activeId) => {
      setPlayingPearlId(isPlaying ? (activeId || null) : null);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleAudio = (pearl: MedicalPearl) => {
    if (playingPearlId === pearl.id) {
      speechEngine.stop();
    } else {
      speechEngine.speak(
        pearl.id,
        `${pearl.title}. High Yield Takeaway: ${pearl.highYieldKey}. ${pearl.explanation}`
      );
    }
  };

  const handleStartCommuteAudio = () => {
    if (filteredPearls.length === 0) return;
    const playlistItems = filteredPearls.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.highYieldKey,
      text: `High Yield Takeaway: ${p.highYieldKey}. ${p.explanation}`,
      subjectName: p.subjectId,
    }));
    speechEngine.playPlaylist(playlistItems, 0);
  };

  const handleSrsRate = (rating: SrsRating) => {
    const currentPearl = duePearls[srsIndex];
    if (!currentPearl) return;
    const result = calculateNextReview(currentPearl, rating);
    const updated: MedicalPearl = { ...currentPearl, ...result };
    onAddCustomPearl(updated);
    setIsSrsAnswerRevealed(false);
    if (srsIndex < duePearls.length - 1) {
      setSrsIndex((prev) => prev + 1);
    } else {
      setIsSrsReviewOpen(false);
      setSrsIndex(0);
    }
  };

  const handlePrintCheatSheet = () => {
    const printContent = filteredPearls
      .slice(0, 50)
      .map(
        (p, idx) => `
      <div style="break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 10px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: bold; color: #006B63; text-transform: uppercase;">${p.subjectId}</span>
          <span style="font-size: 9px; color: #64748b;">${p.tags.slice(0, 3).join(' • ')}</span>
        </div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${idx + 1}. ${p.title}</div>
        <div style="background: #f0fdf4; border-left: 3px solid #16a34a; padding: 6px 8px; margin: 6px 0; font-size: 11px; font-weight: 600; color: #14532d;">
          ⭐ Takeaway: ${p.highYieldKey}
        </div>
        <div style="font-size: 11px; color: #334155; line-height: 1.4; white-space: pre-line;">${p.explanation}</div>
      </div>
    `
      )
      .join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ONE SHOT FMGE — High-Yield Medical Pearls</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 8px; }
            .header { border-bottom: 2px solid #006B63; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
            .grid { column-count: 2; column-gap: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 18px; color: #006B63; font-weight: 800;">ONE SHOT FMGE — High-Yield Pearls Cheat Sheet</h1>
              <div style="font-size: 11px; color: #64748b;">2-Column Medical Rapid Revision Deck • ${filteredPearls.length} Pearls • ${new Date().toLocaleDateString()}</div>
            </div>
            <button class="no-print" onclick="window.print()" style="background: #006B63; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Print / Save as PDF</button>
          </div>
          <div class="grid">${printContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
    }, 250);
  };

  const handleCopy = (pearl: MedicalPearl) => {
    navigator.clipboard.writeText(`${pearl.title}\nKey Point: ${pearl.highYieldKey}\n\n${pearl.explanation}`);
    setCopiedId(pearl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyGenerated = () => {
    const text = `🧠 ${generatedTopic.mnemonic.title} (${generatedTopic.mnemonic.acronym})\n\n${generatedTopic.mnemonic.breakdown.map((b) => `• [${b.letter}] ${b.meaning}: ${b.clinicalNote}`).join('\n')}\n\n💊 Drug of Choice: ${generatedTopic.drugOfChoice.firstLineDrug}\nMechanism: ${generatedTopic.drugOfChoice.mechanism}\n\n🔍 Diagnostic Triad:\n${generatedTopic.diagnosticTriad.components.map((c) => `• ${c}`).join('\n')}\nSign: ${generatedTopic.diagnosticTriad.pathognomonicSign}\n\n⚠️ Exam Traps:\n${generatedTopic.examTraps.map((t) => `• Trap: ${t.trap} -> ${t.remedy}`).join('\n')}\n\n🎯 1-Line Key: ${generatedTopic.oneLineTakeaway}`;
    navigator.clipboard.writeText(text);
    setCopiedId('generated');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pt-3 sm:pt-5 pb-20 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans']">
      {/* ═══ 1. KNOWLEDGE IDENTITY HEADER CARD ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-3xl border p-4 sm:px-6 sm:py-3.5 shadow-xs transition-colors duration-700 ${circadian.bannerBg} ${circadian.cardBorder}`}
      >
        <CircadianHeaderAtmosphere circadian={circadian} />
        {/* Dynamic Animated Ambient Knowledge & Synapse Background Effects */}
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
            className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/35 via-yellow-200/25 to-transparent blur-3xl"
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
            className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-teal-200/30 via-emerald-100/20 to-transparent blur-3xl"
          />
          <div className="absolute -top-12 left-1/3 h-52 w-96 rounded-full bg-gradient-to-r from-amber-200/20 via-teal-100/15 to-transparent blur-3xl" />

          {/* Subtle Cognitive Neural / Knowledge Matrix Lattice */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.035] text-amber-950 pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="knowledge-neural-matrix" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="1.1" fill="currentColor" />
                <path d="M 14 0 L 14 28 M 0 14 L 28 14" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#knowledge-neural-matrix)" />
          </svg>

          {/* Premium Luminescent Memory Pearl Reliquary & Sacred Cerebral Arbor Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[520px] overflow-hidden opacity-45 sm:opacity-60 md:opacity-[0.72] select-none pointer-events-none block">
            <svg viewBox="0 0 520 135" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <radialGradient id="pearl-halo-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="40%" stopColor="#0D9488" stopOpacity="0.22" />
                  <stop offset="75%" stopColor="#004D40" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#004D40" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="pearl-pedestal-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="25%" stopColor="#D97706" />
                  <stop offset="50%" stopColor="#FDE68A" />
                  <stop offset="75%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
                <linearGradient id="pearl-cushion-velvet" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00695C" />
                  <stop offset="50%" stopColor="#004D40" />
                  <stop offset="100%" stopColor="#002D26" />
                </linearGradient>
                <radialGradient id="pearl-shell-interior" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#CCFBF1" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#FEF3C7" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.5" />
                </radialGradient>
                <linearGradient id="pearl-shell-exterior" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#042F2E" />
                  <stop offset="50%" stopColor="#115E59" />
                  <stop offset="100%" stopColor="#0F766E" />
                </linearGradient>
                <radialGradient id="great-pearl-core" cx="35%" cy="32%" r="65%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="20%" stopColor="#FEF08A" />
                  <stop offset="48%" stopColor="#99F6E4" />
                  <stop offset="78%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#92400E" />
                </radialGradient>
                <linearGradient id="arbor-filigree-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#004D40" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#0D9488" stopOpacity="0.9" />
                  <stop offset="80%" stopColor="#D97706" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.75" />
                </linearGradient>
                <radialGradient id="mini-pearl-grad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="45%" stopColor="#FEF08A" />
                  <stop offset="100%" stopColor="#D97706" />
                </radialGradient>
              </defs>

              {/* Ambient Radiant Halo */}
              <motion.ellipse
                cx="380"
                cy="70"
                rx="90"
                ry="58"
                fill="url(#pearl-halo-glow)"
                animate={{ scale: [1, 1.15, 1], opacity: [0.65, 0.95, 0.65] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Sacred Cerebral Arbor of Alexandria — Architectural Filigree Arches */}
              <g id="cerebral-arbor">
                {/* Central Pointed Gothic Memory Arch */}
                <path
                  d="M 320 125 C 320 50, 360 22, 380 18 C 400 22, 440 50, 440 125"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M 295 128 C 295 38, 355 12, 380 8 C 405 12, 465 38, 465 128"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                  fill="none"
                  opacity="0.45"
                />

                {/* Left Branch Architecture (Diagnostic Triads & Clinical Pearls) */}
                <motion.path
                  d="M 350 95 C 320 78, 275 62, 235 48 C 210 40, 185 42, 160 46"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="5 3.5"
                  animate={{ strokeDashoffset: [0, -60] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
                <path
                  d="M 275 62 C 255 82, 225 96, 195 94"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeDasharray="3 3"
                  opacity="0.75"
                />
                <path
                  d="M 235 48 C 228 28, 205 20, 185 22"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />

                {/* Right Branch Architecture (Drug of Choice & Golden Mnemonics) */}
                <motion.path
                  d="M 410 95 C 440 78, 485 62, 525 48 C 550 40, 575 42, 600 46"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="5 3.5"
                  animate={{ strokeDashoffset: [0, -60] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
                <path
                  d="M 485 62 C 505 82, 535 96, 565 94"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeDasharray="3 3"
                  opacity="0.75"
                />
                <path
                  d="M 525 48 C 532 28, 555 20, 575 22"
                  stroke="url(#arbor-filigree-grad)"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
              </g>

              {/* Mini High-Yield Branch Pearls (Diagnostic Nodes) */}
              <g id="branch-pearls">
                {/* Node 1: Apex Wisdom Blossom */}
                <g transform="translate(380, 18)">
                  <circle r="4.2" fill="url(#mini-pearl-grad)" />
                  <motion.circle
                    r="4.2"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                </g>

                {/* Node 2: Triad Node Left */}
                <g transform="translate(160, 46)">
                  <circle r="4" fill="url(#mini-pearl-grad)" />
                  <motion.circle
                    r="4"
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="1.2"
                    animate={{ scale: [1, 2.2], opacity: [0.75, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                  />
                </g>

                {/* Node 3: Pharmacotherapy Node Upper Left */}
                <g transform="translate(185, 22)">
                  <circle r="3.2" fill="url(#mini-pearl-grad)" />
                  <circle r="1" fill="#FFFFFF" cx="-0.8" cy="-0.8" />
                </g>

                {/* Node 4: Trap / Caveat Node Lower Left */}
                <g transform="translate(195, 94)">
                  <circle r="3.4" fill="url(#mini-pearl-grad)" />
                  <circle r="1" fill="#FFFFFF" cx="-0.8" cy="-0.8" />
                </g>

                {/* Node 5: Mnemonic Node Right */}
                <g transform="translate(525, 48)">
                  <circle r="3.8" fill="url(#mini-pearl-grad)" />
                  <motion.circle
                    r="3.8"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1.2"
                    animate={{ scale: [1, 2.2], opacity: [0.75, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 1.1 }}
                  />
                </g>
              </g>

              {/* The Classical Reliquary Pedestal */}
              <g id="reliquary-pedestal">
                {/* Plinth Base */}
                <polygon points="325,132 435,132 427,124 333,124" fill="url(#pearl-pedestal-gold)" />
                <line x1="327" y1="124" x2="433" y2="124" stroke="#FEF08A" strokeWidth="0.8" opacity="0.8" />

                {/* Fluted Column Shaft */}
                <polygon points="338,124 422,124 416,114 344,114" fill="url(#pearl-pedestal-gold)" />
                <line x1="360" y1="124" x2="362" y2="114" stroke="#78350F" strokeWidth="1" opacity="0.6" />
                <line x1="380" y1="124" x2="380" y2="114" stroke="#FEF08A" strokeWidth="1" opacity="0.8" />
                <line x1="400" y1="124" x2="398" y2="114" stroke="#78350F" strokeWidth="1" opacity="0.6" />

                {/* Medallion on Shaft */}
                <circle cx="380" cy="119" r="3.2" fill="#78350F" />
                <circle cx="380" cy="119" r="2.2" fill="#FDE68A" />

                {/* Velvet Presentation Cushion with Gold Cord */}
                <path
                  d="M 346 114 Q 380 118 414 114 Q 422 107 410 103 Q 380 99 350 103 Q 338 107 346 114 Z"
                  fill="url(#pearl-cushion-velvet)"
                />
                <path
                  d="M 346 114 Q 380 118 414 114"
                  stroke="#FDE68A"
                  strokeWidth="1.2"
                  fill="none"
                  strokeDasharray="2.5 2"
                />
              </g>

              {/* Iridescent Nautilus & Oyster Reliquary Shell */}
              <g id="oyster-reliquary">
                {/* Upper Open Canopy Shell */}
                <path
                  d="M 342 84 C 336 52, 372 40, 380 40 C 388 40, 424 52, 418 84 C 408 74, 380 71, 342 84 Z"
                  fill="url(#pearl-shell-interior)"
                  stroke="#0D9488"
                  strokeWidth="1.2"
                />
                {/* Fluted Shell Ribs */}
                <path d="M 380 41 L 380 72" stroke="#FEF3C7" strokeWidth="0.9" opacity="0.75" />
                <path d="M 380 41 L 362 76" stroke="#FEF3C7" strokeWidth="0.8" opacity="0.65" />
                <path d="M 380 41 L 398 76" stroke="#FEF3C7" strokeWidth="0.8" opacity="0.65" />
                <path d="M 380 41 L 348 81" stroke="#5EEAD4" strokeWidth="0.7" opacity="0.5" />
                <path d="M 380 41 L 412 81" stroke="#5EEAD4" strokeWidth="0.7" opacity="0.5" />

                {/* Lower Supporting Shell Basin */}
                <path
                  d="M 338 103 C 344 116, 416 116, 422 103 C 427 92, 416 85, 380 88 C 344 85, 333 92, 338 103 Z"
                  fill="url(#pearl-shell-exterior)"
                  stroke="#D97706"
                  strokeWidth="1"
                />
              </g>

              {/* The Great Radiant Memory Pearl */}
              <g id="great-memory-pearl">
                {/* Expanding Resonance Aureole Rings */}
                <motion.circle
                  cx="380"
                  cy="74"
                  r="19"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  animate={{ scale: [1, 1.48], opacity: [0.85, 0] }}
                  transition={{ duration: 2.7, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="380"
                  cy="74"
                  r="19"
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="1.4"
                  animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                  transition={{ duration: 2.7, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
                />

                {/* Central Spherical Pearl Body */}
                <circle
                  cx="380"
                  cy="74"
                  r="19"
                  fill="url(#great-pearl-core)"
                  filter="drop-shadow(0 4px 14px rgba(217, 119, 6, 0.45))"
                />

                {/* Lustrous Pearl Surface Highlights */}
                <ellipse
                  cx="373"
                  cy="67"
                  rx="7"
                  ry="4"
                  transform="rotate(-30 373 67)"
                  fill="#FFFFFF"
                  opacity="0.88"
                />
                <circle cx="370" cy="65" r="2.2" fill="#FFFFFF" opacity="0.95" />
                <ellipse
                  cx="386"
                  cy="82"
                  rx="9"
                  ry="2.5"
                  transform="rotate(-20 386 82)"
                  fill="#FEF08A"
                  opacity="0.35"
                />
              </g>

              {/* Gyroscopic Orbital Rings of Clinical Wisdom */}
              <g id="pearl-orbitals">
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: '380px', originY: '74px' }}
                >
                  <ellipse
                    cx="380"
                    cy="74"
                    rx="30"
                    ry="11"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    opacity="0.75"
                    transform="rotate(-22 380 74)"
                  />
                  <circle cx="408" cy="63" r="2" fill="#FEF08A" />
                </motion.g>
                <motion.g
                  animate={{ rotate: -360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: '380px', originY: '74px' }}
                >
                  <ellipse
                    cx="380"
                    cy="74"
                    rx="33"
                    ry="12"
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="1.1"
                    strokeDasharray="4 4"
                    opacity="0.7"
                    transform="rotate(32 380 74)"
                  />
                  <circle cx="352" cy="85" r="2.2" fill="#5EEAD4" />
                </motion.g>
              </g>

              {/* Drifting Golden Knowledge Motes & Memory Fireflies */}
              <motion.circle
                cx="342"
                cy="52"
                r="1.6"
                fill="#FEF08A"
                animate={{ y: [0, -14, 0], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="418"
                cy="46"
                r="1.8"
                fill="#F59E0B"
                animate={{ y: [0, -18, 0], opacity: [0.4, 0.95, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
              <motion.circle
                cx="318"
                cy="38"
                r="1.4"
                fill="#5EEAD4"
                animate={{ y: [0, -12, 0], opacity: [0.2, 0.85, 0.2] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
              />
              <motion.circle
                cx="446"
                cy="32"
                r="1.5"
                fill="#FEF08A"
                animate={{ y: [0, -15, 0], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
              />
              <motion.circle
                cx="360"
                cy="30"
                r="1.2"
                fill="#FEF08A"
                animate={{ y: [0, -10, 0], opacity: [0.25, 0.8, 0.25] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
            </svg>
          </div>
        </div>

        {/* Header Main Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-3.5 max-w-2xl min-w-0">
            <HeaderTabInsignia tab="pearls" circadian={circadian} />

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                <h1 className={`text-lg sm:text-xl lg:text-[23px] font-extrabold uppercase font-['Outfit'] tracking-tight ${circadian.isNight ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-200' : circadian.titleGrad} bg-clip-text text-transparent leading-snug shrink-0`}>
                  KNOWLEDGE &amp; PEARLS
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold font-mono tracking-[0.14em] uppercase border ${circadian.badgeBg} ${circadian.badgeBorder} ${circadian.badgeText} shadow-2xs shrink-0`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Clinical Synthesis
                </span>
              </div>

              <p className={`text-xs sm:text-sm ${circadian.subtitleColor} leading-normal max-w-xl line-clamp-1 sm:line-clamp-none`}>
                Clinical mnemonics, Drugs of Choice (DOC), diagnostic triads, and exam traps.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-start md:self-center shrink-0">
            <CircadianPill circadian={circadian} onCycle={circadian.cycleTheme} />

            {/* Spaced Repetition Due Today Review Button */}
            {duePearls.length > 0 && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSrsIndex(0);
                  setIsSrsAnswerRevealed(false);
                  setIsSrsReviewOpen(true);
                }}
                className="w-full sm:w-auto px-3 py-1.5 min-h-[36px] justify-center rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
              >
                <Flame className="h-3.5 w-3.5 fill-white text-white animate-pulse" />
                <span>Review Due ({duePearls.length})</span>
              </motion.button>
            )}

            {/* Hands-Free Commute Audio Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartCommuteAudio}
              className="w-full sm:w-auto px-3 py-1.5 min-h-[36px] justify-center rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border bg-teal-50/90 hover:bg-teal-100 text-teal-900 border-teal-200/80 shadow-2xs"
              title="Listen to active pearls sequentially in hands-free commute mode"
            >
              <Headphones className="h-3.5 w-3.5 text-teal-700" />
              <span>Commute Audio</span>
            </motion.button>

            {/* Printable Cheat Sheet Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCheatSheetModalOpen(true)}
              className="w-full sm:w-auto px-3 py-1.5 min-h-[36px] justify-center rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border bg-white/80 hover:bg-white text-stone-700 border-teal-200/70 hover:border-teal-300 shadow-2xs"
              title="Open print-optimized 2-column clinical cheat sheet"
            >
              <Printer className="h-3.5 w-3.5 text-teal-700" />
              <span className="hidden sm:inline">Cheat Sheet</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => {
                setBookmarkedOnly(!bookmarkedOnly);
                const vaultEl = document.getElementById('master-vault');
                if (vaultEl && !bookmarkedOnly) {
                  vaultEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`w-full sm:w-auto px-3.5 py-1.5 min-h-[36px] justify-center rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border shadow-2xs backdrop-blur-sm ${
                bookmarkedOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20 shadow-xs'
                  : circadian.isNight
                    ? 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border-slate-700/80 hover:border-slate-600'
                    : 'bg-white/80 hover:bg-white text-stone-700 border-teal-200/70 hover:border-teal-300'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-white text-white' : 'fill-amber-500/20 text-amber-500'}`} />
              <span>Starred ({bookmarkedCount})</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ═══ 2. SWIFTUI-GRADE SEGMENTED VIEW SWITCHER ═══ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* iOS-style Segmented Picker */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 backdrop-blur-md border border-slate-300/60 shadow-inner max-w-full overflow-x-auto scrollbar-none">
          {[
            { id: 'all' as KnowledgeViewMode, label: 'All Knowledge', icon: Layers },
            { id: 'synthesizer' as KnowledgeViewMode, label: 'Clinical Synthesizer', icon: Brain },
            { id: 'vault' as KnowledgeViewMode, label: `Revision Vault (${allPearls.length})`, icon: BookOpen },
          ].map((tab) => {
            const isActive = activeViewMode === tab.id;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveViewMode(tab.id)}
                className={`relative px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                  isActive ? 'text-[#004D47]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="knowledge-segmented-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 rounded-xl bg-white shadow-xs border border-slate-200/60"
                  />
                )}
                <TabIcon className="h-3.5 w-3.5 relative z-10 stroke-[2.2]" />
                <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Stat Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>{filteredPearls.length} Pearls In Deck</span>
          <span>•</span>
          <span className="text-[#006B63] font-bold">19 Subjects</span>
        </div>
      </div>

      {/* ═══ SPACED REPETITION DUE TODAY CARD (REPLACES STATIC MARKETING FLUFF) ═══ */}
      {duePearls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-teal-500/10 border border-amber-300/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Flame className="w-5 h-5 fill-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-['Outfit'] text-slate-900">
                  Spaced Memory Recall • {duePearls.length} Due Today
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                  SM-2 Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Consolidate long-term clinical recall before knowledge decays. Takes ~2 minutes.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setSrsIndex(0);
              setIsSrsAnswerRevealed(false);
              setIsSrsReviewOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer font-['Outfit']"
          >
            <span>Start Recall Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}

      {/* ═══ 3. AI CLINICAL CONCEPT SYNTHESIZER (VISIBLE IN 'all' OR 'synthesizer') ═══ */}
      {(activeViewMode === 'all' || activeViewMode === 'synthesizer') && (
        <motion.section
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/90 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.98),0_10px_32px_rgba(0,107,99,0.04)] space-y-4"
        >
          <div className="max-w-2xl space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/70 text-[#006B63] text-[10.5px] font-bold font-mono uppercase tracking-wider">
              <Brain className="h-3 w-3 text-[#006B63]" />
              <span>Instant Clinical Synthesis</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight leading-snug">
              Synthesize Any Clinical Disease or Concept
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              Enter any FMGE condition or syndrome to generate a high-yield mnemonic, drug of choice, diagnostic triad, and examiner traps.
            </p>
          </div>

          {/* Search & Synthesize Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQueryTopic(activeTopicQuery);
            }}
            className="relative flex items-center bg-stone-50/80 hover:bg-white focus-within:bg-white border border-stone-200 focus-within:border-[#006B63] focus-within:ring-3 focus-within:ring-[#006B63]/10 rounded-2xl p-1.5 transition-all shadow-xs"
          >
            <Search className="ml-2.5 sm:ml-3 h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={activeTopicQuery}
              onChange={(e) => setActiveTopicQuery(e.target.value)}
              placeholder="Search or enter concept (e.g. COPD, Celiac Disease, Burns)..."
              aria-label="Medical concept query"
              className="flex-1 bg-transparent px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
            />
            {activeTopicQuery && (
              <button
                type="button"
                onClick={() => setActiveTopicQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer mr-1 shrink-0"
                aria-label="Clear input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isGenerating || !activeTopicQuery.trim()}
              className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs font-bold font-['Outfit'] bg-[#006B63] hover:bg-[#005750] text-white transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              {isGenerating ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden xs:inline">Synthesizing...</span>
                </>
              ) : (
                <>
                  <Brain className="h-3.5 w-3.5 text-teal-200" />
                  <span>Synthesize</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Quick-Starts Horizontal Shelf */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [mask-image:linear-gradient(to_right,black_92%,transparent_100%)]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0">
              Quick Starts:
            </span>
            {[
              'COPD',
              'Celiac Disease',
              'Asthma',
              'Multiple Myeloma',
              'Tetralogy of Fallot',
              'Burns Parkland Formula',
              'Monteggia vs Galeazzi',
              'Eclampsia Pritchard Regimen',
              'Glasgow Coma Scale',
              'Horner Syndrome',
              'MEN 1, 2A, 2B',
              'Poisoning Antidotes',
            ].map((topic) => {
              const isSelected = activeTopicQuery.toLowerCase() === topic.toLowerCase();
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleQueryTopic(topic)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                      : 'bg-stone-50/70 hover:bg-white text-slate-700 border-stone-200/70 hover:border-teal-300'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          {/* Recent Queries Shelf */}
          {recentTopics && recentTopics.length > 0 && (
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-slate-400 shrink-0">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-semibold text-slate-500 font-mono uppercase tracking-wider">
                  Recent:
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {recentTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleQueryTopic(topic)}
                    className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-100/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60 font-medium transition-colors cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* ═══ 4. GENERATED CLINICAL SHEET (READING EXPERIENCE) ═══ */}
      {isGenerating && (
        <div className="bg-white/80 backdrop-blur-md border border-[#006B63]/30 rounded-3xl p-5 sm:p-6 flex items-center gap-3.5 shadow-xs animate-pulse">
          <div className="h-10 w-10 rounded-2xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
            <span className="h-4.5 w-4.5 border-2 border-[#006B63]/30 border-t-[#006B63] rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-slate-900">
              Synthesizing Clinical Reference Sheet...
            </h3>
            <p className="text-xs text-slate-500">
              Extracting structured mnemonics, drugs of choice, diagnostic hallmarks, and NBE examiner traps.
            </p>
          </div>
        </div>
      )}

      {generationError && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 flex items-center gap-3 text-rose-900 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{generationError}</p>
        </div>
      )}

      {generatedTopic && (activeViewMode === 'all' || activeViewMode === 'synthesizer') && (
        <motion.article
          layout
          id="generated-knowledge-sheet"
          className="bg-white/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 md:p-8 border border-white/90 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.98),0_15px_40px_rgba(0,107,99,0.06)] space-y-6"
        >
          {/* Header & Quick Action Buttons */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/60 pb-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                {generatedTopic.subjectName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20 font-mono tracking-wide">
                    {generatedTopic.subjectName}
                  </span>
                )}
                {generatedTopic.mnemonic?.acronym && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/90 font-mono tracking-wider">
                    {generatedTopic.mnemonic.acronym}
                  </span>
                )}
                <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                  NBE High-Yield Reference
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-slate-900 tracking-tight leading-tight">
                {generatedTopic.topicName || generatedTopic.mnemonic?.title}
              </h2>

              {generatedTopic.mnemonic?.title && generatedTopic.topicName && generatedTopic.mnemonic.title !== generatedTopic.topicName && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {generatedTopic.mnemonic.title}
                </p>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyGenerated}
                className="px-3.5 py-2 rounded-xl text-xs font-bold font-['Outfit'] bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer shadow-2xs flex items-center gap-1.5"
                aria-label="Copy knowledge summary"
              >
                {copiedId === 'generated' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveGeneratedToVault}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer border shadow-xs flex items-center gap-1.5 ${
                  isGeneratedSaved
                    ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}
                aria-label="Save this topic pearl"
              >
                <Star className={`h-3.5 w-3.5 ${isGeneratedSaved ? 'fill-white text-white' : 'fill-amber-500/20 text-amber-600'}`} />
                <span>{isGeneratedSaved ? 'Saved to Vault' : 'Save to Starred'}</span>
              </button>
            </div>
          </header>

          {/* 1-Line Key Anchor Box */}
          {generatedTopic.oneLineTakeaway && (
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white border border-slate-800 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider">
                  1-Line Key Anchor
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  FMGE Exam Essential
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                {generatedTopic.oneLineTakeaway}
              </p>
            </div>
          )}

          {/* 4 Key Points at a Glance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Point 01: DOC */}
            {generatedTopic.drugOfChoice?.firstLineDrug && (
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/70 space-y-1">
                <div className="text-[10px] font-bold font-mono uppercase text-emerald-800">
                  Point 01 • Therapeutic DOC
                </div>
                <div className="text-xs sm:text-sm font-bold font-['Outfit'] text-emerald-950 leading-snug">
                  {generatedTopic.drugOfChoice.firstLineDrug}
                </div>
                <div className="text-[11px] text-emerald-800/80 line-clamp-2">
                  {generatedTopic.drugOfChoice.condition || 'First-line protocol'}
                </div>
              </div>
            )}

            {/* Point 02: Hallmark / Sign */}
            {generatedTopic.diagnosticTriad?.pathognomonicSign && (
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200/70 space-y-1">
                <div className="text-[10px] font-bold font-mono uppercase text-purple-800">
                  Point 02 • Diagnostic Sign
                </div>
                <div className="text-xs sm:text-sm font-bold font-['Outfit'] text-purple-950 leading-snug">
                  {generatedTopic.diagnosticTriad.pathognomonicSign}
                </div>
                <div className="text-[11px] text-purple-800/80">
                  Pathognomonic hallmark
                </div>
              </div>
            )}

            {/* Point 03: Clinical Presentation / Triad */}
            {generatedTopic.diagnosticTriad?.triadName && (
              <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-200/70 space-y-1">
                <div className="text-[10px] font-bold font-mono uppercase text-sky-800">
                  Point 03 • Triad / Syndrome
                </div>
                <div className="text-xs sm:text-sm font-bold font-['Outfit'] text-sky-950 leading-snug">
                  {generatedTopic.diagnosticTriad.triadName}
                </div>
                <div className="text-[11px] text-sky-800/80">
                  {generatedTopic.diagnosticTriad.components?.length || 3} Cardinal findings
                </div>
              </div>
            )}

            {/* Point 04: Top Trap Rule */}
            {generatedTopic.examTraps && generatedTopic.examTraps.length > 0 && (
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/70 space-y-1">
                <div className="text-[10px] font-bold font-mono uppercase text-amber-800">
                  Point 04 • Examiner Trap
                </div>
                <div className="text-xs sm:text-sm font-bold font-['Outfit'] text-slate-900 leading-snug">
                  {generatedTopic.examTraps[0].trap}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium line-clamp-2">
                  {generatedTopic.examTraps[0].remedy}
                </div>
              </div>
            )}
          </div>

          {/* Mnemonic Clinical Breakdown */}
          {generatedTopic.mnemonic && generatedTopic.mnemonic.breakdown && generatedTopic.mnemonic.breakdown.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 border-b border-stone-200/60 pb-2">
                <div className="h-7 w-7 rounded-lg bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold font-['Outfit'] text-slate-900">
                  Mnemonic Clinical Breakdown
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {generatedTopic.mnemonic.breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="bg-stone-50/70 rounded-2xl p-3.5 border border-stone-200/70 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {item.letter}
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-['Outfit'] text-slate-900 leading-snug">
                        {item.meaning}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.clinicalNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drug of Choice & Treatment Protocol */}
          {generatedTopic.drugOfChoice && (
            <div className="bg-emerald-50/60 rounded-3xl p-5 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm font-['Outfit']">
                <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4" />
                </div>
                <span>Drug of Choice (DOC) &amp; Treatment Protocol</span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
                  First-Line Pharmacotherapy
                </div>
                <div className="text-base sm:text-lg font-bold font-['Outfit'] text-emerald-950">
                  {generatedTopic.drugOfChoice.firstLineDrug}
                </div>
              </div>

              {generatedTopic.drugOfChoice.mechanism && (
                <div className="bg-white/90 rounded-2xl p-3.5 border border-emerald-200/70 space-y-0.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
                    Pharmacological Mechanism
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    {generatedTopic.drugOfChoice.mechanism}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Clinical Presentation & Diagnostic Triad */}
          {generatedTopic.diagnosticTriad && (
            <div className="bg-purple-50/60 rounded-3xl p-5 border border-purple-200/80 space-y-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-sm font-['Outfit']">
                <div className="h-7 w-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <span>Clinical Presentation &amp; Diagnostic Triad</span>
              </div>

              {generatedTopic.diagnosticTriad.components && generatedTopic.diagnosticTriad.components.length > 0 && (
                <div className="space-y-1.5">
                  {generatedTopic.diagnosticTriad.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 rounded-xl p-3 border border-purple-200/70 flex items-start gap-2.5"
                    >
                      <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-purple-950 font-medium leading-relaxed">
                        {comp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* High-Frequency Exam Traps */}
          {generatedTopic.examTraps && generatedTopic.examTraps.length > 0 && (
            <div className="bg-amber-50/60 rounded-3xl p-5 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm font-['Outfit']">
                <div className="h-7 w-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span>High-Frequency FMGE Exam Traps</span>
              </div>

              <div className="space-y-2.5">
                {generatedTopic.examTraps.map((trap, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs space-y-2"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                        Trap #{idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        {trap.trap}
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-200/70">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 font-mono block">
                        Clinical Solution
                      </span>
                      <p className="text-xs text-emerald-950 font-semibold leading-relaxed mt-0.5">
                        {trap.remedy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      )}

      {/* ═══ 5. MASTER REVISION KNOWLEDGE VAULT (VISIBLE IN 'all' OR 'vault') ═══ */}
      {(activeViewMode === 'all' || activeViewMode === 'vault') && (
        <motion.section
          layout
          id="master-vault"
          className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-white/90 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.98),0_10px_32px_rgba(0,107,99,0.04)] space-y-5"
        >
          {/* Vault Header & Toolbar */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-stone-200/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Personal Revision Library
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20">
                  {filteredPearls.length} Pearls
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-slate-900 tracking-tight">
                MY KNOWLEDGE VAULT
              </h3>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 shrink-0">
              <button
                type="button"
                onClick={() => setBookmarkedOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  bookmarkedOnly
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-amber-500 text-amber-500' : 'text-amber-500 fill-amber-400/30'}`} />
                <span>{bookmarkedCount} Starred</span>
              </button>
            </div>
          </header>

          {/* Unified Vault Search & Filter Controls */}
          <div className="space-y-3">
            {/* Search Input Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved pearls by keyword, drug, or formula..."
                aria-label="Search saved pearls"
                className="w-full h-10 pl-10 pr-10 rounded-2xl bg-stone-50/80 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#006B63] focus:ring-3 focus:ring-[#006B63]/10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none font-medium shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Subject Selector & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Subject Selector */}
              <div className="shrink-0 w-full sm:w-auto">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full sm:w-auto h-9 px-3 rounded-xl bg-stone-50 hover:bg-white border border-stone-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#006B63] cursor-pointer transition-colors shadow-xs font-['Outfit']"
                  aria-label="Filter pearls by subject"
                >
                  <option value="all">All 19 Subjects</option>
                  {FMGE_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none [mask-image:linear-gradient(to_right,black_92%,transparent_100%)]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'mnemonics', label: 'Mnemonics' },
                  { id: 'doc', label: 'DOC' },
                  { id: 'formulas', label: 'Formulas' },
                ].map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`h-8 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                          : 'bg-stone-50 hover:bg-white text-slate-700 border-stone-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}

                {/* Reset Filters */}
                {(selectedSubject !== 'all' || selectedCategory !== 'all' || bookmarkedOnly || searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject('all');
                      setSelectedCategory('all');
                      setBookmarkedOnly(false);
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    title="Reset all filters"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pearls Grid */}
          {filteredPearls.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-stone-50/60 border border-dashed border-stone-200 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto shadow-2xs">
                {bookmarkedOnly ? (
                  <Star className="h-5 w-5 text-amber-500 fill-amber-400/30" />
                ) : (
                  <Search className="h-5 w-5 text-stone-400" />
                )}
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  {bookmarkedOnly ? 'No Starred Pearls in Vault' : 'No Matching Pearls Found'}
                </h4>
                <p className="text-xs text-slate-500">
                  {bookmarkedOnly
                    ? 'Star high-yield pearls from the AI Knowledge generator to build your personal revision deck.'
                    : 'No pearls match your search criteria. Try a broader term or reset filters.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('all');
                  setSelectedCategory('all');
                  setBookmarkedOnly(false);
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Show All Pearls</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPearls.map((pearl) => {
                const subject = FMGE_SUBJECTS.find((s) => s.id === pearl.subjectId);
                const theme = getPearlVisualTheme(pearl);
                const ThemeIcon = theme.icon;

                return (
                  <motion.article
                    key={pearl.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_6px_20px_rgba(0,107,99,0.03)] hover:shadow-md hover:border-teal-200/80 transition-all flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-800 border border-slate-200/80 shrink-0">
                            {subject?.name || pearl.subjectId}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border shrink-0 ${theme.badgeClass}`}>
                            <ThemeIcon className="h-3 w-3" />
                            <span>{theme.typeLabel}</span>
                          </span>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Audio Read-Aloud Button */}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => handleToggleAudio(pearl)}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                              playingPearlId === pearl.id
                                ? 'text-[#006B63] bg-teal-100/90 animate-pulse'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={playingPearlId === pearl.id ? 'Stop audio' : 'Listen to pearl'}
                            aria-label="Listen to pearl"
                          >
                            {playingPearlId === pearl.id ? (
                              <Volume2 className="h-4 w-4 text-[#006B63]" />
                            ) : (
                              <VolumeX className="h-4 w-4" />
                            )}
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => handleCopy(pearl)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Copy pearl"
                            aria-label="Copy pearl"
                          >
                            {copiedId === pearl.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => onToggleBookmark(pearl.id)}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                              pearl.isBookmarked
                                ? 'text-amber-500 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={pearl.isBookmarked ? 'Remove from starred' : 'Star pearl'}
                            aria-label={pearl.isBookmarked ? 'Unstar pearl' : 'Star pearl'}
                          >
                            <Star className={`h-4 w-4 ${pearl.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </motion.button>
                        </div>
                      </div>

                      {/* Pearl Title */}
                      <h4 className="text-base font-bold font-['Outfit'] text-slate-900 leading-snug tracking-tight">
                        {pearl.title}
                      </h4>

                      {/* High-Yield Key Box */}
                      <div className={`p-3 rounded-2xl border text-xs sm:text-[13px] font-semibold leading-relaxed font-mono space-y-0.5 ${theme.keyBoxClass}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.keyLabelClass}`}>
                          High-Yield Takeaway
                        </div>
                        <div className="break-words">
                          {pearl.highYieldKey}
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs sm:text-[13px] text-slate-600 whitespace-pre-line leading-relaxed break-words font-normal">
                        {pearl.explanation}
                      </p>
                    </div>

                    {/* Card Footer: Tags */}
                    {pearl.tags && pearl.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
                        {pearl.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium font-mono bg-slate-50 text-slate-500 border border-slate-200/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          )}
        </motion.section>
      )}

      {/* ═══ 6. SPACED REPETITION (SM-2) ACTIVE RECALL REVIEW MODAL ═══ */}
      <AnimatePresence>
        {isSrsReviewOpen && duePearls.length > 0 && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative flex flex-col w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/90 overflow-hidden"
            >
              {/* Review Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/70 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Flame className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                      Spaced Recall Session
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Item <span className="font-bold text-slate-800">{srsIndex + 1}</span> of{' '}
                      {duePearls.length} due today
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSrsReviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-7 space-y-5">
                {duePearls[srsIndex] && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-teal-50 text-[#006B63] border border-teal-200">
                          {duePearls[srsIndex].subjectId}
                        </span>
                        {duePearls[srsIndex].tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Audio Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(duePearls[srsIndex])}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          playingPearlId === duePearls[srsIndex].id
                            ? 'bg-teal-100 text-teal-800 border-teal-300 animate-pulse'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
                        }`}
                        title="Listen to pearl"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit'] leading-snug">
                      {duePearls[srsIndex].title}
                    </h2>

                    {!isSrsAnswerRevealed ? (
                      <div className="pt-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsSrsAnswerRevealed(true)}
                          className="w-full py-4 bg-[#006B63] hover:bg-[#005750] text-white rounded-2xl font-bold font-['Outfit'] text-sm shadow-md shadow-teal-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="h-4 w-4 text-amber-300" />
                          <span>Show High-Yield Key &amp; Answer</span>
                        </motion.button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* High-Yield Key Box */}
                        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
                            High-Yield Takeaway
                          </span>
                          <p className="text-sm font-bold text-emerald-950 leading-relaxed font-sans">
                            {duePearls[srsIndex].highYieldKey}
                          </p>
                        </div>

                        {/* Detailed Clinical Explanation */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                          {duePearls[srsIndex].explanation}
                        </div>

                        {/* Rating Row (SM-2) */}
                        <div className="pt-2 space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center font-mono">
                            Rate Recall Accuracy
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSrsRate('again')}
                              className="py-2.5 px-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-center text-xs font-bold text-rose-800 transition-colors cursor-pointer"
                            >
                              <div>Again</div>
                              <div className="text-[10px] font-normal text-rose-600">1 day</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSrsRate('hard')}
                              className="py-2.5 px-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-center text-xs font-bold text-amber-800 transition-colors cursor-pointer"
                            >
                              <div>Hard</div>
                              <div className="text-[10px] font-normal text-amber-600">3 days</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSrsRate('good')}
                              className="py-2.5 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
                            >
                              <div>Good</div>
                              <div className="text-[10px] font-normal text-emerald-600">7 days</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSrsRate('easy')}
                              className="py-2.5 px-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-2xl text-center text-xs font-bold text-teal-800 transition-colors cursor-pointer"
                            >
                              <div>Easy</div>
                              <div className="text-[10px] font-normal text-teal-600">14+ days</div>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Yield Exam-Eve Printable Cheat Sheet Modal */}
      <ExamEveCheatSheetModal
        isOpen={isCheatSheetModalOpen}
        onClose={() => setIsCheatSheetModalOpen(false)}
        state={state}
      />
    </div>
  );
};
