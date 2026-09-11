import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Search,
  Star,
  Plus,
  Copy,
  Check,
  Tag,
  BookOpen,
  Brain,
  Pill,
  ShieldAlert,
  Flame,
  Scale,
  Award,
  Activity,
  Layers,
  HelpCircle,
  X,
  ArrowRight,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MedicalPearl, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { INITIAL_PEARLS } from '../data/initialPearls';
import {
  searchOrGenerateMedicalPearl,
  fetchOrGenerateMedicalPearl,
  COMPREHENSIVE_PEARL_REPOSITORY,
  DynamicPearlTopicPackage
} from '../utils/medicalPearlsEngine';

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
      keyBoxClass: 'bg-emerald-50/50 border-emerald-200/70 text-emerald-950',
      keyLabelClass: 'text-emerald-800',
      tagBadgeClass: 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50',
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
      keyBoxClass: 'bg-sky-50/50 border-sky-200/70 text-sky-950',
      keyLabelClass: 'text-sky-800',
      tagBadgeClass: 'bg-sky-50/50 text-sky-700 border-sky-200/50',
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
      keyBoxClass: 'bg-purple-50/50 border-purple-200/70 text-purple-950',
      keyLabelClass: 'text-purple-800',
      tagBadgeClass: 'bg-purple-50/50 text-purple-700 border-purple-200/50',
      icon: Activity,
    };
  }

  // Mnemonic: Blue/teal informational treatment
  return {
    typeLabel: 'Mnemonic',
    badgeClass: 'bg-[#006B63]/10 text-[#006B63] border-[#006B63]/20',
    keyBoxClass: 'bg-stone-50 border-stone-200/80 text-stone-900',
    keyLabelClass: 'text-stone-700',
    tagBadgeClass: 'bg-stone-50 text-stone-600 border-stone-200/60',
    icon: Brain,
  };
};

interface PearlsVaultViewProps {
  state: AppState;
  onToggleBookmark: (pearlId: string) => void;
  onAddCustomPearl: (pearl: MedicalPearl) => void;
}

export const PearlsVaultView: React.FC<PearlsVaultViewProps> = ({
  state,
  onToggleBookmark,
  onAddCustomPearl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mnemonics' | 'doc' | 'triads' | 'formulas' | 'traps'>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active On-Demand Topic Generator state
  const [activeTopicQuery, setActiveTopicQuery] = useState<string>('COPD');
  const [generatedTopic, setGeneratedTopic] = useState<DynamicPearlTopicPackage>(() =>
    searchOrGenerateMedicalPearl('COPD')
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // In-session recent topics shelf (strictly derived from in-session queries, no invented persistence)
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
    <div className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 pb-20 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 font-sans">
      {/* ═══ 1. KNOWLEDGE IDENTITY HEADER CARD ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#FAF8EE] p-4 sm:px-6 sm:py-3.5 shadow-xs"
      >
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
          <div className="flex items-start gap-3 sm:gap-3.5 max-w-2xl min-w-0">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50/90 border border-amber-100/90 text-amber-700 shadow-2xs shrink-0 mt-0.5 cursor-default"
            >
              <Brain className="h-5 w-5 text-amber-700 stroke-[2]" />
            </motion.div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap">
                <h1 className="text-lg sm:text-xl lg:text-[23px] font-extrabold uppercase font-['Outfit'] tracking-tight bg-gradient-to-r from-stone-950 via-amber-950 to-amber-800 bg-clip-text text-transparent leading-snug shrink-0">
                  KNOWLEDGE &amp; PEARLS
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold font-mono tracking-[0.14em] uppercase bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-200/80 text-amber-800 shadow-2xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  AI Synthesizer
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 leading-normal max-w-xl line-clamp-1 sm:line-clamp-none">
                Clinical mnemonics, Drugs of Choice (DOC), diagnostic triads, and exam traps.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-stretch sm:self-start md:self-center shrink-0">
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
                  : 'bg-white/80 hover:bg-white text-stone-700 border-teal-200/70 hover:border-teal-300'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-white text-white' : 'fill-amber-500/20 text-amber-500'}`} />
              <span>Starred Vault ({bookmarkedCount})</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ═══ 2. HERO / AI SEARCH WORKSPACE ═══ */}
      <div className="bg-gradient-to-b from-white via-white to-stone-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-stone-200/90 shadow-xs space-y-5">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100/90 border border-stone-200 text-stone-700 text-[11px] font-medium">
            <Award className="h-3 w-3 text-amber-500" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-stone-600">NBE Clinical Synthesis</span>
          </div>
          <h1 className="font-['Newsreader',_Georgia,_serif] text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight leading-[1.18] bg-gradient-to-r from-stone-950 via-stone-800 to-[#006B63] bg-clip-text text-transparent">
            Understand it. Remember it.
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
            Ask for any FMGE disease, syndrome, or clinical concept to synthesize a structured, high-yield mnemonic, drug of choice, diagnostic triad, and exam trap breakdown.
          </p>
        </div>

        {/* Search & Synthesize Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQueryTopic(activeTopicQuery);
          }}
          className="relative flex items-center bg-white border border-stone-200/90 rounded-2xl p-1.5 shadow-xs focus-within:border-[#006B63] focus-within:ring-2 focus-within:ring-[#006B63]/10 transition-all"
        >
          <Search className="ml-2 sm:ml-3 h-4 sm:h-4.5 w-4 sm:w-4.5 text-stone-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={activeTopicQuery}
            onChange={(e) => setActiveTopicQuery(e.target.value)}
            placeholder="Search topic (e.g. COPD, Asthma, Burns)..."
            aria-label="Medical concept query"
            className="flex-1 bg-transparent px-2 sm:px-3.5 text-xs sm:text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none min-w-0"
          />
          {activeTopicQuery && (
            <button
              type="button"
              onClick={() => setActiveTopicQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-md transition-colors cursor-pointer mr-1 shrink-0"
              aria-label="Clear input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isGenerating || !activeTopicQuery.trim()}
            className="h-10 px-3 sm:px-5 rounded-xl text-xs font-semibold bg-[#006B63] hover:bg-[#00554e] text-white transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 shadow-xs min-w-[90px] sm:min-w-0"
          >
            {isGenerating ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden xs:inline">Synthesizing...</span>
                <span className="xs:hidden">...</span>
              </>
            ) : (
              <>
                <Brain className="h-3.5 w-3.5 text-teal-200" />
                <span>Synthesize</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Starts */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 touch-pan-x">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono shrink-0">
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
                  className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 border flex items-center ${
                    isSelected
                      ? 'bg-[#006B63] text-white border-[#006B63] shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200/90'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recently Generated / Recent Topics Shelf */}
        <div className="pt-2.5 border-t border-stone-200/60 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-stone-400 shrink-0">
            <Clock className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-[10px] font-semibold text-stone-500 font-mono uppercase tracking-wider">Recent Topics:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {recentTopics && recentTopics.length > 0 ? (
              recentTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleQueryTopic(topic)}
                  className="px-2.5 py-0.5 rounded-lg text-xs bg-stone-100/90 hover:bg-stone-200/80 text-stone-700 border border-stone-200/90 font-medium transition-colors cursor-pointer"
                >
                  {topic}
                </button>
              ))
            ) : (
              <span className="text-xs text-stone-400 italic">
                Synthesized topics will appear here for fast re-access.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ 3. VALUE PROPOSITION CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="h-4.5 w-4.5 stroke-[1.8]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-stone-900">High-Yield Answers</h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Structured, exam-focused clinical breakdown for NBE FMGE topics.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="h-4.5 w-4.5 stroke-[1.8]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-stone-900">Evidence-Based</h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Organized around standard treatment protocols and diagnostic triads.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0 mt-0.5">
            <Star className="h-4.5 w-4.5 stroke-[1.8] fill-amber-500/20" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-stone-900">Save &amp; Revisit</h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Star important pearls directly into your personal revision vault.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 4. GENERATED KNOWLEDGE READING EXPERIENCE (EDITORIAL REFERENCE SHEET) ═══ */}
      {isGenerating && (
        <div className="bg-stone-50 border border-[#006B63]/30 rounded-2xl p-5 flex items-center gap-3.5 shadow-xs animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
            <span className="h-4 w-4 border-2 border-[#006B63]/30 border-t-[#006B63] rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              Synthesizing Clinical Reference Sheet...
            </h3>
            <p className="text-xs text-stone-500">
              Extracting structured mnemonics, drugs of choice, diagnostic hallmarks, and NBE examiner traps.
            </p>
          </div>
        </div>
      )}

      {generationError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{generationError}</p>
        </div>
      )}

      {generatedTopic && (
        <article
          id="generated-knowledge-sheet"
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-stone-200/90 shadow-xs space-y-6 sm:space-y-7 animate-in fade-in-50 duration-300 scroll-mt-6"
        >
          {/* 1. TOPIC IDENTITY / EDITORIAL HEADER */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                {generatedTopic.subjectName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20 font-mono tracking-wide">
                    {generatedTopic.subjectName}
                  </span>
                )}
                {generatedTopic.mnemonic?.acronym && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/90 font-mono tracking-wider">
                    {generatedTopic.mnemonic.acronym}
                  </span>
                )}
                <span className="text-[11px] text-stone-400 font-mono uppercase tracking-wider">
                  NBE High-Yield Reference
                </span>
              </div>

              <h2 className="font-['Newsreader',_Georgia,_serif] text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight break-words bg-gradient-to-r from-stone-950 via-stone-800 to-[#006B63] bg-clip-text text-transparent">
                {generatedTopic.topicName || generatedTopic.mnemonic?.title}
              </h2>

              {generatedTopic.mnemonic?.title && generatedTopic.topicName && generatedTopic.mnemonic.title !== generatedTopic.topicName && (
                <p className="text-xs sm:text-sm text-stone-600 font-medium break-words">
                  {generatedTopic.mnemonic.title}
                </p>
              )}
            </div>

            {/* Quick Actions (Copy & Save) */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyGenerated}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[38px] rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors border border-stone-200/90 cursor-pointer shadow-2xs"
                aria-label="Copy knowledge summary to clipboard"
              >
                {copiedId === 'generated' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-stone-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveGeneratedToVault}
                className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-xs ${
                  isGeneratedSaved
                    ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/90'
                }`}
                aria-label="Save this topic pearl to starred vault"
              >
                <Star className={`h-3.5 w-3.5 ${isGeneratedSaved ? 'fill-white text-white' : 'fill-amber-500/20 text-amber-600'}`} />
                <span>{isGeneratedSaved ? 'Saved to Vault ★' : 'Save to Starred'}</span>
              </button>
            </div>
          </header>

          {/* 2. KEY TAKEAWAY / 1-LINE KEY ANCHOR */}
          {generatedTopic.oneLineTakeaway && (
            <div className="bg-stone-900 rounded-2xl p-4 sm:p-5 text-white border border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-stone-950 font-mono text-[10px] font-extrabold uppercase tracking-wider">
                  1-Line Key Anchor
                </span>
                <span className="text-[11px] text-stone-400 font-mono tracking-wide">
                  FMGE Exam Essential
                </span>
              </div>
              <p className="text-xs sm:text-sm md:text-[15px] font-medium text-stone-100 leading-relaxed break-words">
                {generatedTopic.oneLineTakeaway}
              </p>
            </div>
          )}

          {/* 3. HIGH-YIELD KEY POINTS (AT-A-GLANCE SCAN GROUP) */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-stone-400 font-mono uppercase tracking-wider">
                Key Clinical Hallmarks • At A Glance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Point 01: DOC */}
              {generatedTopic.drugOfChoice?.firstLineDrug && (
                <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-200/70 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold font-mono uppercase text-emerald-800">
                    <span>Point 01</span>
                    <span className="text-emerald-700 font-semibold">Therapeutic DOC</span>
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-emerald-950 leading-snug">
                    {generatedTopic.drugOfChoice.firstLineDrug}
                  </div>
                  <div className="text-[11px] text-emerald-800/80 line-clamp-2">
                    {generatedTopic.drugOfChoice.condition || 'First-line protocol'}
                  </div>
                </div>
              )}

              {/* Point 02: Hallmark / Sign */}
              {generatedTopic.diagnosticTriad?.pathognomonicSign && (
                <div className="bg-purple-50/40 rounded-xl p-3.5 border border-purple-200/70 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold font-mono uppercase text-purple-800">
                    <span>Point 02</span>
                    <span className="text-purple-700 font-semibold">Diagnostic Sign</span>
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-purple-950 leading-snug">
                    {generatedTopic.diagnosticTriad.pathognomonicSign}
                  </div>
                  <div className="text-[11px] text-purple-800/80">
                    Pathognomonic hallmark
                  </div>
                </div>
              )}

              {/* Point 03: Clinical Presentation / Triad */}
              {generatedTopic.diagnosticTriad?.triadName && (
                <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-200/70 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold font-mono uppercase text-sky-800">
                    <span>Point 03</span>
                    <span className="text-sky-700 font-semibold">Triad / Syndrome</span>
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-sky-950 leading-snug">
                    {generatedTopic.diagnosticTriad.triadName}
                  </div>
                  <div className="text-[11px] text-sky-800/80">
                    {generatedTopic.diagnosticTriad.components?.length || 3} Cardinal findings
                  </div>
                </div>
              )}

              {/* Point 04: Top Trap Rule */}
              {generatedTopic.examTraps && generatedTopic.examTraps.length > 0 && (
                <div className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-200/70 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold font-mono uppercase text-amber-800">
                    <span>Point 04</span>
                    <span className="text-amber-700 font-semibold">Examiner Trap</span>
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug">
                    {generatedTopic.examTraps[0].trap}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium line-clamp-2">
                    ✓ {generatedTopic.examTraps[0].remedy}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 4. MNEMONIC CLINICAL BREAKDOWN */}
          {generatedTopic.mnemonic && generatedTopic.mnemonic.breakdown && generatedTopic.mnemonic.breakdown.length > 0 && (
            <section className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm sm:text-base">
                  <div className="h-7 w-7 rounded-lg bg-[#006B63]/10 text-[#006B63] flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 stroke-[1.8]" />
                  </div>
                  <span>Mnemonic Clinical Breakdown</span>
                </div>
                {generatedTopic.mnemonic.acronym && (
                  <span className="self-start sm:self-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
                    {generatedTopic.mnemonic.acronym}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {generatedTopic.mnemonic.breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="bg-stone-50/70 rounded-xl p-3.5 sm:p-4 border border-stone-200/80 hover:border-stone-300 transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-lg bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {item.letter}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                        {item.meaning}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-normal">
                      {item.clinicalNote}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. DRUG OF CHOICE (DOC) & PROTOCOL (GREEN / MINT TREATMENT) */}
          {generatedTopic.drugOfChoice && (
            <section className="bg-emerald-50/60 rounded-2xl p-5 sm:p-6 border border-emerald-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
                <div className="flex items-center gap-2 text-emerald-950 font-semibold text-sm sm:text-base">
                  <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Pill className="h-4 w-4 stroke-[1.8]" />
                  </div>
                  <span>Drug of Choice (DOC) &amp; Treatment Protocol</span>
                </div>
                {generatedTopic.drugOfChoice.condition && (
                  <span className="self-start sm:self-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/90 text-emerald-900 border border-emerald-200">
                    {generatedTopic.drugOfChoice.condition}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
                  First-Line Pharmacotherapy
                </div>
                <div className="text-sm sm:text-base md:text-lg font-bold text-emerald-950 leading-snug">
                  {generatedTopic.drugOfChoice.firstLineDrug}
                </div>
              </div>

              {generatedTopic.drugOfChoice.mechanism && (
                <div className="bg-white/80 rounded-xl p-3.5 sm:p-4 border border-emerald-200/70 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
                    Pharmacological Mechanism of Action
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    {generatedTopic.drugOfChoice.mechanism}
                  </p>
                </div>
              )}

              {generatedTopic.drugOfChoice.alternative && (
                <div className="text-xs text-emerald-900 pt-1 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="font-bold text-emerald-950 shrink-0">Second-Line / Allergy Alternative:</span>
                  <span className="leading-relaxed">{generatedTopic.drugOfChoice.alternative}</span>
                </div>
              )}
            </section>
          )}

          {/* 6 & 7. CLASSIC CLINICAL PRESENTATION & DIAGNOSTIC FINDINGS (PURPLE TREATMENT) */}
          {generatedTopic.diagnosticTriad && (
            <section className="bg-purple-50/60 rounded-2xl p-5 sm:p-6 border border-purple-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/70 pb-3">
                <div className="flex items-center gap-2 text-purple-950 font-semibold text-sm sm:text-base">
                  <div className="h-7 w-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 stroke-[1.8]" />
                  </div>
                  <span>Clinical Presentation &amp; Diagnostic Triad</span>
                </div>
                {generatedTopic.diagnosticTriad.triadName && (
                  <span className="self-start sm:self-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                    {generatedTopic.diagnosticTriad.triadName}
                  </span>
                )}
              </div>

              {/* Cardinal presentation & findings */}
              {generatedTopic.diagnosticTriad.components && generatedTopic.diagnosticTriad.components.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider font-mono">
                    Cardinal Findings &amp; Clinical Chronology
                  </div>
                  <div className="space-y-1.5">
                    {generatedTopic.diagnosticTriad.components.map((comp, idx) => (
                      <div
                        key={idx}
                        className="bg-white/80 rounded-xl p-3 sm:p-3.5 border border-purple-200/70 flex items-start gap-2.5"
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
                </div>
              )}

              {/* 7. Diagnostic / Imaging Hallmark & Pathognomonic Sign */}
              {generatedTopic.diagnosticTriad.pathognomonicSign && (
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-800 uppercase tracking-wider font-mono">
                    <Search className="h-3.5 w-3.5 text-purple-600" />
                    <span>Pathognomonic Sign &amp; Diagnostic Gold Standard</span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-950 font-semibold leading-relaxed">
                    {generatedTopic.diagnosticTriad.pathognomonicSign}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* 8. HIGH-FREQUENCY FMGE EXAM TRAPS (AMBER TREATMENT) */}
          {generatedTopic.examTraps && generatedTopic.examTraps.length > 0 && (
            <section className="bg-amber-50/60 rounded-2xl p-4 sm:p-6 border border-amber-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
                <div className="flex items-center gap-2 text-amber-950 font-semibold text-sm sm:text-base">
                  <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 stroke-[1.8]" />
                  </div>
                  <span>High-Frequency FMGE Exam Traps &amp; Examiner Pitfalls</span>
                </div>
                <span className="self-start sm:self-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                  {generatedTopic.examTraps.length} Traps
                </span>
              </div>

              <div className="space-y-3">
                {generatedTopic.examTraps.map((trap, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                        Examiner Trap #{idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed pt-0.5 break-words">
                        {trap.trap}
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 rounded-xl p-3 sm:p-3.5 border border-emerald-200/70 space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 font-mono">
                        Clinical Rule &amp; Solution
                      </span>
                      <p className="text-xs sm:text-sm text-emerald-950 font-semibold leading-relaxed pt-0.5 break-words">
                        {trap.remedy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9. FINAL TAKEAWAY / MEMORY ANCHOR CLOSING */}
          {generatedTopic.oneLineTakeaway && (
            <footer className="bg-stone-900 rounded-2xl p-4 sm:p-5 text-white border border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 font-mono text-[10px] font-extrabold uppercase tracking-wider">
                    Final Takeaway
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Quick Revision Key
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-stone-200 leading-relaxed break-words">
                  {generatedTopic.oneLineTakeaway}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 self-stretch sm:self-center">
                <button
                  type="button"
                  onClick={handleCopyGenerated}
                  className="flex-1 sm:flex-initial px-3.5 py-2 min-h-[36px] justify-center rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-stone-400" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveGeneratedToVault}
                  className="flex-1 sm:flex-initial px-3.5 py-2 min-h-[36px] justify-center rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Star className="h-3.5 w-3.5 fill-stone-950" />
                  <span>{isGeneratedSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </footer>
          )}
        </article>
      )}

      {/* ═══ 5. MY KNOWLEDGE VAULT / MASTER PEARLS ARCHIVE ═══ */}
      <section
        id="master-vault"
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-stone-200/90 shadow-xs space-y-6 scroll-mt-6"
      >
        {/* VAULT HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-stone-400 font-mono uppercase tracking-wider">
                Personal Revision Library
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20">
                {filteredPearls.length} {filteredPearls.length === 1 ? 'Pearl' : 'Pearls'}
              </span>
              {allPearls.length > filteredPearls.length && (
                <span className="text-xs text-stone-400 font-mono">
                  (of {allPearls.length} in vault)
                </span>
              )}
            </div>

            <h3 className="font-['Newsreader',_Georgia,_serif] text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight leading-tight">
              MY KNOWLEDGE VAULT
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 font-normal max-w-2xl leading-relaxed">
              Your saved high-yield FMGE pearls, formulas, mnemonics and treatment shortcuts.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 text-xs font-mono text-stone-600 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setBookmarkedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                bookmarkedOnly
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs font-bold'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/80'
              }`}
              title="Toggle Starred only filter"
            >
              <Star className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-amber-500 text-amber-500' : 'text-amber-500 fill-amber-400/30'}`} />
              <span>{bookmarkedCount} Starred</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-700 font-medium">
              <BookOpen className="h-3.5 w-3.5 text-stone-400" />
              <span>{allPearls.length} Total</span>
            </span>
          </div>
        </header>

        {/* SEARCH & FILTERS CONTROLS */}
        <div className="space-y-3.5">
          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved pearls by keyword, drug, or formula..."
              aria-label="Search saved pearls"
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-stone-50/90 hover:bg-stone-50 focus:bg-white border border-stone-200/90 focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 transition-all outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-md transition-colors cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Subject Dropdown & Category Filter Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Subject Selector */}
            <div className="shrink-0 w-full sm:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full sm:w-auto h-9 px-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/90 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#006B63] cursor-pointer transition-colors"
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

            {/* Category Filter Pills (horizontally scrollable on mobile without wrapping awkwardly) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none -mx-1 px-1 touch-pan-x">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}

              {/* Starred Toggle Filter Button */}
              <button
                type="button"
                onClick={() => setBookmarkedOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  bookmarkedOnly
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs font-bold'
                    : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Star className={`h-3 w-3 ${bookmarkedOnly ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}`} />
                <span>Starred ({bookmarkedCount})</span>
              </button>

              {/* Reset active filters button if any filter is applied */}
              {(selectedSubject !== 'all' || selectedCategory !== 'all' || bookmarkedOnly || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('all');
                    setSelectedCategory('all');
                    setBookmarkedOnly(false);
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                  title="Reset all filters"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PEARLS GRID OR REFINED EMPTY STATE */}
        {filteredPearls.length === 0 ? (
          <div className="py-12 sm:py-16 px-4 text-center rounded-2xl bg-stone-50/60 border border-dashed border-stone-200 space-y-3.5">
            <div className="h-12 w-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto shadow-2xs">
              {bookmarkedOnly ? (
                <Star className="h-5 w-5 text-amber-500 fill-amber-400/30" />
              ) : (
                <Search className="h-5 w-5 text-stone-400" />
              )}
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm sm:text-base font-semibold text-stone-900">
                {bookmarkedOnly ? 'No Starred Pearls in Vault' : 'No Matching Pearls Found'}
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                {bookmarkedOnly
                  ? 'Star high-yield pearls from the AI Knowledge generator or vault archive to build your rapid revision deck.'
                  : searchQuery.trim()
                  ? `No pearls matched "${searchQuery}". Try a broader term or reset the active filters.`
                  : 'No pearls match your selected subject and category criteria.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('all');
                  setSelectedCategory('all');
                  setBookmarkedOnly(false);
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Show All Pearls</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredPearls.map((pearl) => {
              const subject = FMGE_SUBJECTS.find((s) => s.id === pearl.subjectId);
              const theme = getPearlVisualTheme(pearl);
              const ThemeIcon = theme.icon;

              return (
                <article
                  key={pearl.id}
                  className="p-4 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Subject & Content Type Badge + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-stone-100 text-stone-800 border border-stone-200/80 shrink-0">
                          {subject?.name || pearl.subjectId}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border shrink-0 ${theme.badgeClass}`}>
                          <ThemeIcon className="h-3 w-3" />
                          <span>{theme.typeLabel}</span>
                        </span>
                      </div>

                      {/* Card Actions: Copy & Star */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(pearl)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Copy pearl to clipboard"
                          aria-label="Copy pearl"
                        >
                          {copiedId === pearl.id ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleBookmark(pearl.id)}
                          className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                            pearl.isBookmarked
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                          }`}
                          title={pearl.isBookmarked ? 'Remove from starred' : 'Star pearl'}
                          aria-label={pearl.isBookmarked ? 'Unstar pearl' : 'Star pearl'}
                        >
                          <Star className={`h-4 w-4 ${pearl.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Pearl Title */}
                    <h4 className="font-['Outfit',_sans-serif] text-base font-bold text-stone-900 leading-snug tracking-tight">
                      {pearl.title}
                    </h4>

                    {/* High-Yield Key Takeaway Box */}
                    <div className={`p-3 rounded-xl border text-xs sm:text-[13px] font-semibold leading-relaxed font-mono space-y-1 ${theme.keyBoxClass}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.keyLabelClass}`}>
                        High-Yield Takeaway
                      </div>
                      <div className="break-words">
                        {pearl.highYieldKey}
                      </div>
                    </div>

                    {/* Supporting Clinical Explanation */}
                    <p className="text-xs sm:text-[13px] text-stone-600 whitespace-pre-line leading-relaxed break-words font-normal">
                      {pearl.explanation}
                    </p>
                  </div>

                  {/* Card Footer: Tags */}
                  {pearl.tags && pearl.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-stone-100">
                      {pearl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium font-mono bg-stone-50 text-stone-600 border border-stone-200/60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
