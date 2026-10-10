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
  Lightbulb,
  ChevronDown,
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
    badgeClass: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20',
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
      explanation: item.mnemonic.breakdown.map((b) => `• ${b.letter}: ${b.meaning} - ${b.clinicalNote}`).join('\n') + `\n\nTriad: ${item.diagnosticTriad.components.join(' · ')}`,
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
          <span style="font-size: 10px; font-weight: bold; color: #007AFF; text-transform: uppercase;">${p.subjectId}</span>
          <span style="font-size: 9px; color: #64748b;">${p.tags.slice(0, 3).join(' • ')}</span>
        </div>
        <div style="font-size: 13px; font-weight: bold; color: #1C1C1E; margin-bottom: 4px;">${idx + 1}. ${p.title}</div>
        <div style="background: #f0fdf4; border-left: 3px solid #16a34a; padding: 6px 8px; margin: 6px 0; font-size: 11px; font-weight: 600; color: #14532d;">
          Takeaway: ${p.highYieldKey}
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1C1C1E; margin: 0; padding: 8px; }
            .header { border-bottom: 2px solid #007AFF; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
            .grid { column-count: 2; column-gap: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 18px; color: #007AFF; font-weight: 800;">ONE SHOT FMGE — High-Yield Pearls Cheat Sheet</h1>
              <div style="font-size: 11px; color: #64748b;">2-Column Medical Rapid Revision Deck • ${filteredPearls.length} Pearls • ${new Date().toLocaleDateString()}</div>
            </div>
            <button class="no-print" onclick="window.print()" style="background: #007AFF; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Print / Save as PDF</button>
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
    const text = `[Mnemonic] ${generatedTopic.mnemonic.title} (${generatedTopic.mnemonic.acronym})\n\n${generatedTopic.mnemonic.breakdown.map((b) => `• [${b.letter}] ${b.meaning}: ${b.clinicalNote}`).join('\n')}\n\n[Drug of Choice] ${generatedTopic.drugOfChoice.firstLineDrug}\nMechanism: ${generatedTopic.drugOfChoice.mechanism}\n\n[Diagnostic Triad]\n${generatedTopic.diagnosticTriad.components.map((c) => `• ${c}`).join('\n')}\nSign: ${generatedTopic.diagnosticTriad.pathognomonicSign}\n\n[Exam Traps]\n${generatedTopic.examTraps.map((t) => `• Trap: ${t.trap} -> ${t.remedy}`).join('\n')}\n\n[Key Anchor] ${generatedTopic.oneLineTakeaway}`;
    navigator.clipboard.writeText(text);
    setCopiedId('generated');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div data-accent="knowledge" className="space-y-4 sm:space-y-6 pt-3 sm:pt-5 pb-20 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans']">
      {/* ═══ 1. KNOWLEDGE IDENTITY HEADER CARD ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="premium-page-hero relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F5EAFF 0%, #E8CCFD 40%, #CE90F5 70%, #BF5AF2 100%)', boxShadow: '0 8px 40px rgba(191,90,242,0.14), 0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {/* Decorative right glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(191,90,242,0.28) 0%, transparent 70%)' }} />
        {/* Top inner shine */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

  <div className="relative z-10 p-4 sm:p-5 lg:p-6">
    {/* Eyebrow */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10.5px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: '#5B006E' }}>
        LEARN • CONNECT • APPLY • CLINICAL PEARLS VAULT
      </span>
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase"
        style={{ background: 'rgba(255,255,255,0.55)', color: '#5B006E', border: '1px solid rgba(91,0,110,0.15)' }}>
        Clinical Synthesis
      </span>
    </div>

    {/* Main row */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Icon */}
      <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(91,0,110,0.15)' }}>
        <Lightbulb className="w-7 h-7" style={{ color: '#5B006E' }} />
      </div>

      {/* Text */}
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-[#1D1D1F]">
          KNOWLEDGE <span style={{ color: '#BF5AF2' }}>&amp;</span> PEARLS
        </h1>
        <p className="text-xs sm:text-sm leading-relaxed max-w-xl" style={{ color: '#3A3A3C' }}>
          Clinical mnemonics, Drugs of Choice (DOC), diagnostic triads, and exam traps.
        </p>
      </div>
    </div>

    {/* Action pills */}
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleStartCommuteAudio}
        className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
        style={{ background: 'rgba(255,255,255,0.55)', color: '#3A3A3C', border: '1px solid rgba(91,0,110,0.15)' }}
      >
        <Headphones className="h-3.5 w-3.5" style={{ color: '#5B006E' }} />
        <span>Commute Audio</span>
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsCheatSheetModalOpen(true)}
        className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
        style={{ background: 'rgba(255,255,255,0.55)', color: '#3A3A3C', border: '1px solid rgba(91,0,110,0.15)' }}
      >
        <Printer className="h-3.5 w-3.5" style={{ color: '#5B006E' }} />
        <span>Cheat Sheet</span>
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => { setBookmarkedOnly(!bookmarkedOnly); }}
        className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
        style={bookmarkedOnly
          ? { background: '#BF5AF2', color: '#fff', boxShadow: '0 4px 14px rgba(191,90,242,0.3)' }
          : { background: 'rgba(255,255,255,0.55)', color: '#3A3A3C', border: '1px solid rgba(91,0,110,0.15)' }
        }
      >
        <Star className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-white text-white' : ''}`} style={!bookmarkedOnly ? { color: '#BF5AF2', fill: 'rgba(191,90,242,0.25)' } : {}} />
        <span>Starred ({bookmarkedCount})</span>
      </motion.button>
    </div>
  </div>
</motion.header>

      {/* ═══ 2. SEGMENTED VIEW SWITCHER ═══ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 rounded-2xl border shadow-sm" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.8)' }}>
          {[
            { id: 'all' as KnowledgeViewMode, label: 'All Knowledge', compactLabel: 'All', icon: Layers },
            { id: 'synthesizer' as KnowledgeViewMode, label: 'Clinical Synthesizer', compactLabel: 'Synthesize', icon: Brain },
            { id: 'vault' as KnowledgeViewMode, label: `Revision Vault (${allPearls.length})`, compactLabel: 'Vault', icon: BookOpen },
          ].map((tab) => {
            const isActive = activeViewMode === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveViewMode(tab.id)}
                className="relative px-2.5 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 select-none"
                style={{ color: isActive ? '#BF5AF2' : '#8E8E93' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="knowledge-segmented-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 rounded-xl shadow-sm bg-white"
                    style={{ boxShadow: '0 2px 8px rgba(191,90,242,0.18)' }}
                  />
                )}
                <TabIcon className="h-3.5 w-3.5 relative z-10 stroke-[2.2]" style={{ color: isActive ? '#BF5AF2' : '#8E8E93' }} />
                <span className="relative z-10 whitespace-nowrap sm:hidden">{tab.compactLabel}</span>
                <span className="relative z-10 whitespace-nowrap hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8E8E93] font-mono">
          <span>{filteredPearls.length} pearls</span>
          <span>•</span>
          <span>19 subjects</span>
        </div>
      </div>

      {duePearls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4"
          style={{ background: 'rgba(255,149,0,0.06)', borderLeftColor: '#FF9500', border: '1px solid rgba(255,149,0,0.25)', borderLeftWidth: '4px' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)' }}>
              <Flame className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold" style={{ color: '#1D1D1F' }}>
                  Spaced Memory Recall — {duePearls.length} Due Today
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">
                  SM-2
                </span>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: '#6E6E73' }}>
                Consolidate long-term clinical recall before knowledge decays. ~2 minutes.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setSrsIndex(0); setIsSrsAnswerRevealed(false); setIsSrsReviewOpen(true); }}
            className="px-4 py-2 rounded-xl text-white font-bold text-[13px] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            style={{ background: '#FF9500' }}
          >
            <span>Start Recall Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}

      {(activeViewMode === 'all' || activeViewMode === 'synthesizer') && (
        <motion.section
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="rounded-2xl bg-white p-5 sm:p-6 space-y-4"
          style={{ border: '1px solid rgba(60,60,67,0.12)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="max-w-2xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(191,90,242,0.1)', color: '#BF5AF2' }}>
              <Brain className="h-3 w-3" />
              <span>Instant Clinical Synthesis</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-black tracking-tight leading-snug" style={{ color: '#1D1D1F' }}>
              Synthesize Any Clinical Disease or Concept
            </h2>
            <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: '#6E6E73' }}>
              Enter any FMGE condition or syndrome to generate a high-yield mnemonic, drug of choice, diagnostic triad, and examiner traps.
            </p>
          </div>

          {/* Search & Synthesize Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleQueryTopic(activeTopicQuery); }}
            className="relative flex items-center h-12 rounded-2xl px-1.5 transition-all"
            style={{ background: '#F2F2F7', border: '1px solid rgba(60,60,67,0.12)' }}
          >
            <Search className="ml-2 h-4 w-4 shrink-0 pointer-events-none" style={{ color: '#8E8E93' }} />
            <input
              type="text"
              value={activeTopicQuery}
              onChange={(e) => setActiveTopicQuery(e.target.value)}
              placeholder="Search or enter concept (e.g. COPD, Celiac Disease, Burns)..."
              aria-label="Medical concept query"
              className="flex-1 bg-transparent px-2.5 text-[14px] font-medium placeholder-[#8E8E93] focus:outline-none min-w-0"
              style={{ color: '#1D1D1F' }}
            />
            {activeTopicQuery && (
              <button type="button" onClick={() => setActiveTopicQuery('')} className="p-1 rounded-md transition-colors cursor-pointer mr-1 shrink-0" style={{ color: '#8E8E93' }}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isGenerating || !activeTopicQuery.trim()}
              className="h-9 px-4 rounded-xl text-[13px] font-bold text-white transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
              style={{ background: '#BF5AF2' }}
            >
              {isGenerating ? (
                <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="hidden xs:inline">Synthesizing...</span></>
              ) : (
                <><Brain className="h-3.5 w-3.5 text-white/80" /><span>Synthesize</span></>
              )}
            </motion.button>
          </form>

          {/* Quick-Starts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ maskImage: 'linear-gradient(to right, black 92%, transparent 100%)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono shrink-0" style={{ color: '#8E8E93' }}>Quick Starts:</span>
            {['COPD','Celiac Disease','Asthma','Multiple Myeloma','Tetralogy of Fallot','Burns Parkland Formula','Monteggia vs Galeazzi','Eclampsia Pritchard Regimen','Glasgow Coma Scale','Horner Syndrome','MEN 1, 2A, 2B','Poisoning Antidotes'].map((topic) => {
              const isSelected = activeTopicQuery.toLowerCase() === topic.toLowerCase();
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleQueryTopic(topic)}
                  className="px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
                  style={isSelected
                    ? { background: '#BF5AF2', color: '#fff', border: '1px solid #BF5AF2' }
                    : { background: '#fff', color: '#3A3A3C', border: '1px solid rgba(60,60,67,0.12)' }
                  }
                >
                  {topic}
                </button>
              );
            })}
          </div>

          {/* Recent Topics */}
          {recentTopics && recentTopics.length > 0 && (
            <div className="pt-2 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: 'rgba(60,60,67,0.08)' }}>
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" style={{ color: '#8E8E93' }} />
                <span className="text-[10px] font-semibold font-mono uppercase tracking-wider" style={{ color: '#8E8E93' }}>Recent:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {recentTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleQueryTopic(topic)}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
                    style={{ background: '#F2F2F7', color: '#3A3A3C', border: '1px solid rgba(60,60,67,0.1)' }}
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
        <div className="rounded-2xl p-5 sm:p-6 flex items-center gap-3.5 animate-pulse bg-white" style={{ border: '1px solid rgba(60,60,67,0.12)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(191,90,242,0.1)' }}>
            <span className="h-4 w-4 border-2 rounded-full animate-spin block" style={{ borderColor: 'rgba(191,90,242,0.3)', borderTopColor: '#BF5AF2' }} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: '#1D1D1F' }}>
              Synthesizing Clinical Reference Sheet...
            </h3>
            <p className="text-[13px]" style={{ color: '#6E6E73' }}>
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
          className="rounded-2xl bg-white overflow-hidden space-y-0"
          style={{ border: '1px solid rgba(60,60,67,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          {/* Header gradient band */}
          <header className="p-5 sm:p-6 space-y-4" style={{ background: 'linear-gradient(135deg, #F5EAFF 0%, #EDD6FF 100%)' }}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  {generatedTopic.subjectName && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide" style={{ background: 'rgba(191,90,242,0.15)', color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.3)' }}>
                      {generatedTopic.subjectName}
                    </span>
                  )}
                  {generatedTopic.mnemonic?.acronym && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                      {generatedTopic.mnemonic.acronym}
                    </span>
                  )}
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#8E8E93' }}>
                    NBE High-Yield Reference
                  </span>
                </div>

                <h2 className="text-[26px] sm:text-[32px] font-black tracking-tight leading-tight" style={{ color: '#1D1D1F' }}>
                  {generatedTopic.topicName || generatedTopic.mnemonic?.title}
                </h2>

                {generatedTopic.mnemonic?.title && generatedTopic.topicName && generatedTopic.mnemonic.title !== generatedTopic.topicName && (
                  <p className="text-[13px] font-medium" style={{ color: '#3A3A3C' }}>
                    {generatedTopic.mnemonic.title}
                  </p>
                )}
              </div>

              {/* Actions Bar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyGenerated}
                  className="px-3.5 py-2 rounded-xl text-[13px] font-bold bg-white/80 hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5"
                  style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#3A3A3C' }}
                  aria-label="Copy knowledge summary"
                >
                  {copiedId === 'generated' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" style={{ color: '#6E6E73' }} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveGeneratedToVault}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isGeneratedSaved
                      ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                      : 'bg-white/80 hover:bg-white text-amber-900'
                  }`}
                  style={{ border: isGeneratedSaved ? '1px solid #d97706' : '1px solid rgba(60,60,67,0.15)' }}
                  aria-label="Save this topic pearl"
                >
                  <Star className={`h-3.5 w-3.5 ${isGeneratedSaved ? 'fill-white text-white' : 'fill-amber-500/20 text-amber-600'}`} />
                  <span>{isGeneratedSaved ? 'Saved to Vault' : 'Save to Starred'}</span>
                </button>
              </div>
            </div>
          </header>

          {/* 1-Line Key Anchor Box */}
          {generatedTopic.oneLineTakeaway && (
            <div className="p-4 sm:p-5 space-y-1.5" style={{ background: 'linear-gradient(to right, #5B0091, #BF5AF2)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  KEY ANCHOR
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  • FMGE Exam Essential
                </span>
              </div>
              <p className="text-[14px] font-semibold text-white leading-relaxed">
                {generatedTopic.oneLineTakeaway}
              </p>
            </div>
          )}

          {/* 4 Key Points at a Glance — Apple Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5 sm:p-6">
            {/* Point 01: DOC */}
            {generatedTopic.drugOfChoice?.firstLineDrug && (
              <div className="rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] shadow-sm overflow-hidden flex flex-col">
                <div className="h-1.5 w-full bg-emerald-500" />
                <div className="p-4 space-y-2 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black text-[#8E8E93] font-mono">01</span>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] mt-0.5">Drug of Choice</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)' }}>
                      <Pill className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-[#1D1D1F] leading-snug mt-1">
                    {generatedTopic.drugOfChoice.firstLineDrug}
                  </div>
                  <div className="text-[11px] text-[#6E6E73] leading-snug line-clamp-2">
                    {generatedTopic.drugOfChoice.condition || 'First-line protocol'}
                  </div>
                </div>
              </div>
            )}

            {/* Point 02: Hallmark / Sign */}
            {generatedTopic.diagnosticTriad?.pathognomonicSign && (
              <div className="rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] shadow-sm overflow-hidden flex flex-col">
                <div className="h-1.5 w-full" style={{ background: '#BF5AF2' }} />
                <div className="p-4 space-y-2 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black text-[#8E8E93] font-mono">02</span>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] mt-0.5">Hallmark Sign</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #D599F5 0%, #BF5AF2 100%)' }}>
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-[#1D1D1F] leading-snug mt-1">
                    {generatedTopic.diagnosticTriad.pathognomonicSign}
                  </div>
                  <div className="text-[11px] text-[#6E6E73] leading-snug">Pathognomonic hallmark</div>
                </div>
              </div>
            )}

            {/* Point 03: Clinical Presentation / Triad */}
            {generatedTopic.diagnosticTriad?.triadName && (
              <div className="rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] shadow-sm overflow-hidden flex flex-col">
                <div className="h-1.5 w-full bg-sky-400" />
                <div className="p-4 space-y-2 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black text-[#8E8E93] font-mono">03</span>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] mt-0.5">Diagnostic Triad</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7DD3FC 0%, #0EA5E9 100%)' }}>
                      <Scale className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-[#1D1D1F] leading-snug mt-1">
                    {generatedTopic.diagnosticTriad.triadName}
                  </div>
                  <div className="text-[11px] text-[#6E6E73] leading-snug">
                    {generatedTopic.diagnosticTriad.components?.length || 3} Cardinal findings
                  </div>
                </div>
              </div>
            )}

            {/* Point 04: Top Trap Rule */}
            {generatedTopic.examTraps && generatedTopic.examTraps.length > 0 && (
              <div className="rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] shadow-sm overflow-hidden flex flex-col">
                <div className="h-1.5 w-full bg-amber-400" />
                <div className="p-4 space-y-2 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black text-[#8E8E93] font-mono">04</span>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] mt-0.5">Exam Trap</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)' }}>
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-[15px] font-bold text-[#1D1D1F] leading-snug mt-1">
                    {generatedTopic.examTraps[0].trap}
                  </div>
                  <div className="text-[11px] text-[#6E6E73] leading-snug line-clamp-2" style={{ color: '#30D158' }}>
                    {generatedTopic.examTraps[0].remedy}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mnemonic Clinical Breakdown */}
          {generatedTopic.mnemonic && generatedTopic.mnemonic.breakdown && generatedTopic.mnemonic.breakdown.length > 0 && (
            <div className="space-y-3 px-5 sm:px-6 pb-2">
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(60,60,67,0.08)' }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(191,90,242,0.1)', color: '#BF5AF2' }}>
                  <Brain className="h-4 w-4 stroke-[2]" />
                </div>
                <h3 className="text-[17px] font-bold" style={{ color: '#1D1D1F' }}>
                  Mnemonic Breakdown
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {generatedTopic.mnemonic.breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[#F2F2F7] p-4 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-[#BF5AF2] text-white font-black text-[13px] flex items-center justify-center shrink-0">
                        {item.letter}
                      </span>
                      <span className="text-[14px] font-bold leading-snug text-[#1D1D1F]">
                        {item.meaning}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed font-normal text-[#6E6E73]">
                      {item.clinicalNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drug of Choice & Treatment Protocol */}
          {generatedTopic.drugOfChoice && (
            <details className="group rounded-2xl mx-5 sm:mx-6 overflow-hidden" style={{ background: '#EDFDF5', border: '1px solid rgba(48,209,88,0.2)' }}>
              <summary className="min-h-14 flex cursor-pointer list-none items-center gap-3 p-4 font-bold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600">
                <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4" />
                </div>
                <span className="flex-1 text-[15px] font-bold text-[#1D1D1F]">Full treatment detail</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-emerald-800 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 px-4 pb-4 sm:px-5">
              <h3 className="text-[12px] font-semibold text-emerald-800">Drug of Choice (DOC) &amp; Treatment Protocol</h3>

              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-700">
                  First-Line Pharmacotherapy
                </div>
                <div className="text-[22px] font-black text-[#1D1D1F]">
                  {generatedTopic.drugOfChoice.firstLineDrug}
                </div>
              </div>

              {generatedTopic.drugOfChoice.mechanism && (
                <div className="bg-white rounded-xl p-4 space-y-0.5" style={{ border: '1px solid rgba(48,209,88,0.15)' }}>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">
                    Pharmacological Mechanism
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#1D1D1F]">
                    {generatedTopic.drugOfChoice.mechanism}
                  </p>
                </div>
              )}
              </div>
            </details>
          )}

          {/* Clinical Presentation & Diagnostic Triad */}
          {generatedTopic.diagnosticTriad && (
            <details className="group rounded-2xl mx-5 sm:mx-6 overflow-hidden" style={{ background: '#F0EAFF', border: '1px solid rgba(191,90,242,0.2)' }}>
              <summary className="min-h-14 flex cursor-pointer list-none items-center gap-3 p-4 font-bold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7B2CBF]">
                <div className="h-7 w-7 rounded-xl text-white flex items-center justify-center shrink-0" style={{ background: '#BF5AF2' }}>
                  <Activity className="h-4 w-4" />
                </div>
                <span className="flex-1 text-[15px] font-bold text-[#1D1D1F]">Full diagnostic detail</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#7B2CBF] transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 px-4 pb-4 sm:px-5">
              <h3 className="text-[12px] font-semibold text-[#7B2CBF]">Clinical Presentation &amp; Diagnostic Triad</h3>

              {generatedTopic.diagnosticTriad.components && generatedTopic.diagnosticTriad.components.length > 0 && (
                <div className="space-y-1.5">
                  {generatedTopic.diagnosticTriad.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-3 flex items-start gap-3"
                    >
                      <span className="h-6 w-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ background: '#BF5AF2' }}>
                        {idx + 1}
                      </span>
                      <span className="text-[13px] font-medium leading-relaxed text-[#1D1D1F]">
                        {comp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </details>
          )}

          {/* High-Frequency Exam Traps */}
          {generatedTopic.examTraps && generatedTopic.examTraps.length > 0 && (
            <details className="group rounded-2xl mx-5 sm:mx-6 mb-5 sm:mb-6 overflow-hidden" style={{ background: '#FFF8EE', border: '1px solid rgba(255,149,0,0.2)' }}>
              <summary className="min-h-14 flex cursor-pointer list-none items-center gap-3 p-4 font-bold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600">
                <div className="h-7 w-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="flex-1 text-[15px] font-bold text-[#1D1D1F]">All exam traps ({generatedTopic.examTraps.length})</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-amber-800 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 px-4 pb-4 sm:px-5">
              <h3 className="text-[12px] font-semibold text-amber-800">High-Frequency FMGE Exam Traps</h3>

              <div className="space-y-2.5">
                {generatedTopic.examTraps.map((trap, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-[#FF3B30] bg-white rounded-xl p-4 space-y-2"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono" style={{ background: '#FFF0EE', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                        Trap #{idx + 1}
                      </span>
                      <p className="text-[14px] font-semibold text-[#1D1D1F] leading-relaxed">
                        {trap.trap}
                      </p>
                    </div>

                    <div className="rounded-xl p-2.5 bg-[#EDFDF5]" style={{ border: '1px solid rgba(48,209,88,0.2)' }}>
                      <span className="text-[9px] font-bold uppercase tracking-wider font-mono block text-[#30D158]">
                        Clinical Solution
                      </span>
                      <p className="text-[12px] font-semibold leading-relaxed mt-0.5 text-[#1D1D1F]">
                        {trap.remedy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </details>
          )}
        </motion.article>
      )}

      {/* ═══ 5. MASTER REVISION KNOWLEDGE VAULT (VISIBLE IN 'all' OR 'vault') ═══ */}
      {(activeViewMode === 'all' || activeViewMode === 'vault') && (
        <motion.section
          layout
          id="master-vault"
          className="rounded-2xl bg-white p-5 sm:p-6 space-y-5"
          style={{ border: '1px solid rgba(60,60,67,0.12)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* Vault Header & Toolbar */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4" style={{ borderBottom: '1px solid rgba(60,60,67,0.08)' }}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8E8E93' }}>
                  Personal Revision Library
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold" style={{ background: 'rgba(191,90,242,0.1)', color: '#BF5AF2' }}>
                  {filteredPearls.length} Pearls
                </span>
              </div>

              <h3 className="text-[22px] font-black tracking-tight" style={{ color: '#1D1D1F' }}>
                MY KNOWLEDGE VAULT
              </h3>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBookmarkedOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                  bookmarkedOnly
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-white text-[#3A3A3C] border border-[rgba(60,60,67,0.15)] hover:bg-[#F2F2F7]'
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#8E8E93' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved pearls by keyword, drug, or formula..."
                aria-label="Search saved pearls"
                className="w-full h-11 pl-10 pr-10 rounded-xl outline-none transition-all font-medium focus:ring-2 focus:ring-[#BF5AF2]/15 focus:border-[#BF5AF2]"
                style={{ background: '#F2F2F7', border: '1px solid transparent', color: '#1D1D1F', fontSize: '13px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors cursor-pointer"
                  style={{ color: '#8E8E93' }}
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
                  className="w-full sm:w-auto h-9 px-3 rounded-xl border-0 text-[13px] font-semibold focus:outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-[#BF5AF2]/15"
                  style={{ background: '#F2F2F7', color: '#1D1D1F' }}
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
                      className="px-4 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer"
                      style={isSelected
                        ? { background: '#BF5AF2', color: '#fff' }
                        : { background: '#F2F2F7', color: '#3A3A3C' }
                      }
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    style={{ color: '#6E6E73' }}
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
            <div className="py-16 px-4 text-center rounded-2xl space-y-4" style={{ background: '#F2F2F7', border: '1px dashed rgba(60,60,67,0.2)' }}>
              <div className="w-14 h-14 rounded-2xl bg-[#F5EAFF] flex items-center justify-center mx-auto">
                {bookmarkedOnly ? (
                  <Star className="h-6 w-6 text-amber-500 fill-amber-400/30" />
                ) : (
                  <Search className="h-6 w-6" style={{ color: '#BF5AF2' }} />
                )}
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-[17px] font-bold text-[#1D1D1F]">
                  {bookmarkedOnly ? 'No Starred Pearls in Vault' : 'No Matching Pearls Found'}
                </h4>
                <p className="text-[13px] text-[#6E6E73]">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-colors cursor-pointer bg-[#1D1D1F]"
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
                    className="p-5 rounded-2xl bg-white flex flex-col justify-between space-y-3 transition-all hover:shadow-md"
                    style={{ border: '1px solid rgba(60,60,67,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(191,90,242,0.3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(60,60,67,0.1)'; }}
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ background: '#F2F2F7', color: '#3A3A3C' }}>
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
                              playingPearlId === pearl.id ? 'animate-pulse' : ''
                            }`}
                            style={playingPearlId === pearl.id ? { color: '#BF5AF2', background: 'rgba(191,90,242,0.1)' } : { color: '#C7C7CC' }}
                            title={playingPearlId === pearl.id ? 'Stop audio' : 'Listen to pearl'}
                            aria-label="Listen to pearl"
                          >
                            {playingPearlId === pearl.id ? (
                              <Volume2 className="h-4 w-4" style={{ color: '#BF5AF2' }} />
                            ) : (
                              <VolumeX className="h-4 w-4" />
                            )}
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => handleCopy(pearl)}
                            className="p-1.5 rounded-xl transition-colors cursor-pointer"
                            style={{ color: '#C7C7CC' }}
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
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer`}
                            style={{ color: pearl.isBookmarked ? '#FF9500' : '#C7C7CC' }}
                            title={pearl.isBookmarked ? 'Remove from starred' : 'Star pearl'}
                            aria-label={pearl.isBookmarked ? 'Unstar pearl' : 'Star pearl'}
                          >
                            <Star className={`h-4 w-4 ${pearl.isBookmarked ? 'fill-amber-500' : ''}`} />
                          </motion.button>
                        </div>
                      </div>

                      {/* Pearl Title */}
                      <h4 className="text-[16px] font-bold leading-snug tracking-tight" style={{ color: '#1D1D1F' }}>
                        {pearl.title}
                      </h4>

                      {/* High-Yield Key Box */}
                      <div className="p-3 rounded-xl space-y-1 border-l-4" style={{ background: '#F5EAFF', borderLeftColor: '#BF5AF2' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#BF5AF2' }}>
                          High-Yield Key
                        </div>
                        <div className="text-[13px] font-semibold leading-relaxed break-words" style={{ color: '#1D1D1F' }}>
                          {pearl.highYieldKey}
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-[12px] whitespace-pre-line leading-relaxed break-words font-normal" style={{ color: '#6E6E73' }}>
                        {pearl.explanation}
                      </p>
                    </div>

                    {/* Card Footer: Tags */}
                    {pearl.tags && pearl.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5" style={{ borderTop: '1px solid rgba(60,60,67,0.08)' }}>
                        {pearl.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-medium font-mono"
                            style={{ background: '#F2F2F7', color: '#8E8E93' }}
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative flex flex-col w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-1 w-full bg-[#F2F2F7]">
                <div
                  className="h-1 bg-[#BF5AF2] transition-all duration-300"
                  style={{ width: `${(srsIndex / duePearls.length) * 100}%` }}
                />
              </div>

              {/* Review Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(60,60,67,0.1)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#BF5AF2] flex items-center justify-center">
                    <Flame className="h-4 w-4 fill-white text-white" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                      Recall Session
                    </h3>
                    <p className="text-[13px] text-[#8E8E93]">
                      Item <span className="font-bold text-[#1D1D1F]">{srsIndex + 1}</span> of {duePearls.length}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSrsReviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#3A3A3C] transition-colors cursor-pointer hover:bg-[#E5E5EA]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-5">
                {duePearls[srsIndex] && (
                  <div className="space-y-4">
                    {/* Subject badge row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#F5EAFF] text-[#BF5AF2] rounded-full text-[11px] font-semibold px-2.5 py-0.5">
                          {duePearls[srsIndex].subjectId}
                        </span>
                        {duePearls[srsIndex].tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="bg-[#F2F2F7] text-[#6E6E73] text-[11px] rounded-md px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Audio Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(duePearls[srsIndex])}
                        className={`w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center transition-colors cursor-pointer ${playingPearlId === duePearls[srsIndex].id ? 'animate-pulse' : ''}`}
                        style={playingPearlId === duePearls[srsIndex].id ? { background: 'rgba(191,90,242,0.1)', color: '#BF5AF2' } : { color: '#6E6E73' }}
                        title="Listen to pearl"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Pearl title */}
                    <h2 className="text-[22px] font-black text-[#1D1D1F] leading-tight tracking-tight">
                      {duePearls[srsIndex].title}
                    </h2>

                    {!isSrsAnswerRevealed ? (
                      <div className="space-y-4">
                        {/* Frosted prompt card */}
                        <div className="rounded-2xl bg-[#F5EAFF] border border-[rgba(191,90,242,0.2)] p-6 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#BF5AF2] text-white mx-auto flex items-center justify-center">
                            <Brain className="h-6 w-6" />
                          </div>
                          <div className="text-[15px] font-semibold text-[#1D1D1F]">What do you recall?</div>
                          <div className="text-[12px] text-[#6E6E73]">Try to recall the key clinical point before revealing</div>
                        </div>

                        {/* Reveal button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsSrsAnswerRevealed(true)}
                          className="w-full h-12 rounded-2xl bg-[#BF5AF2] text-white text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <Zap className="h-4 w-4 text-amber-300" />
                          <span>Reveal High-Yield Answer</span>
                        </motion.button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* High-Yield Key Box */}
                        <div className="rounded-2xl p-4 space-y-1 bg-[#F5EAFF] border-l-4 border-[#BF5AF2]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#BF5AF2]">
                            HIGH-YIELD KEY
                          </span>
                          <p className="text-[14px] font-bold text-[#1D1D1F] leading-relaxed">
                            {duePearls[srsIndex].highYieldKey}
                          </p>
                        </div>

                        {/* Explanation */}
                        <div className="rounded-2xl bg-[#F2F2F7] p-4 text-[13px] text-[#3A3A3C] leading-relaxed whitespace-pre-wrap">
                          {duePearls[srsIndex].explanation}
                        </div>

                        {/* Rating Row (SM-2) */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] text-center">
                            HOW WELL DID YOU RECALL?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSrsRate('again')}
                              className="flex-1 py-3 rounded-2xl text-center cursor-pointer transition-all bg-[#FFF0EE] border border-[rgba(255,59,48,0.2)] hover:bg-[#FFE5E3]"
                            >
                              <div className="text-[14px] font-bold text-[#FF3B30]">Again</div>
                              <div className="text-[10px] font-medium text-[#FF3B30] mt-0.5">&lt; 1 day</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSrsRate('hard')}
                              className="flex-1 py-3 rounded-2xl text-center cursor-pointer transition-all bg-[#FFF8EE] border border-[rgba(255,149,0,0.2)] hover:bg-[#FFF3E0]"
                            >
                              <div className="text-[14px] font-bold text-[#FF9500]">Hard</div>
                              <div className="text-[10px] font-medium text-[#FF9500] mt-0.5">3 days</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSrsRate('good')}
                              className="flex-1 py-3 rounded-2xl text-center cursor-pointer transition-all bg-[#EDFDF5] border border-[rgba(48,209,88,0.2)] hover:bg-[#D6FAE8]"
                            >
                              <div className="text-[14px] font-bold text-[#30D158]">Good</div>
                              <div className="text-[10px] font-medium text-[#30D158] mt-0.5">7 days</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSrsRate('easy')}
                              className="flex-1 py-3 rounded-2xl text-center cursor-pointer transition-all bg-[#EBF8FF] border border-[rgba(90,200,250,0.2)] hover:bg-[#D0F0FC]"
                            >
                              <div className="text-[14px] font-bold text-[#5AC8FA]">Easy</div>
                              <div className="text-[10px] font-medium text-[#5AC8FA] mt-0.5">14+ days</div>
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
