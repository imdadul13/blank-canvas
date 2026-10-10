import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Search,
  BookOpen,
  Play,
  RotateCcw,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  Activity,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  FileText,
  Filter,
  Download,
  Heart,
  Wind,
  Droplets,
  Layers,
  Brain,
  X,
  LayoutDashboard,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { ConceptRemediationModal } from './ConceptRemediationModal';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import {
  extractConceptGap,
  generateConceptRemediationPackage,
  ConceptRemediationPackage,
} from '../utils/errorRemediationEngine';
import {
  getSpacedErrorsSummary,
  formatSpacedIntervalBadge,
  isSpacedErrorDue,
} from '../utils/spacedRepetitionEngine';

export type MistakeType =
  | 'Concept Gap'
  | 'Knowledge Recall'
  | 'Careless Mistake'
  | 'Clinical Interpretation';

export function classifyMistakeType(err: ErrorNotebookItem): MistakeType {
  const text = `${err.myMistake || ''} ${err.questionGist || ''} ${err.correctConcept || ''} ${err.topic || ''}`.toLowerCase();
  if (text.includes('careless') || text.includes('rushed') || text.includes('except') || text.includes('misread') || text.includes('silly') || text.includes('not read')) return 'Careless Mistake';
  if (text.includes('recall') || text.includes('memor') || text.includes('forgot') || text.includes('formula') || text.includes('dose') || text.includes('criteria') || text.includes('number') || text.includes('table') || text.includes('staged') || text.includes('value')) return 'Knowledge Recall';
  if (text.includes('interpret') || text.includes('ecg') || text.includes('xray') || text.includes('radiolog') || text.includes('ct') || text.includes('mri') || text.includes('presentation') || text.includes('case') || text.includes('finding') || text.includes('image') || text.includes('diagnosis')) return 'Clinical Interpretation';
  return 'Concept Gap';
}

export function getSystemCategory(subjectId: string, topic: string): string {
  const text = `${subjectId} ${topic}`.toLowerCase();
  if (text.includes('cardio') || text.includes('heart') || text.includes('ecg') || text.includes('coronary') || text.includes('infarct') || text.includes('arrhythmia') || text.includes('hypertension') || text.includes('vascular')) return 'Cardiovascular';
  if (text.includes('pulmon') || text.includes('respir') || text.includes('pneumonia') || text.includes('lung') || text.includes('asthma') || text.includes('copd') || text.includes('tb') || text.includes('tuberculosis')) return 'Respiratory';
  if (text.includes('endocrin') || text.includes('thyroid') || text.includes('diabet') || text.includes('adrenal') || text.includes('hormone') || text.includes('pituitary')) return 'Endocrine';
  if (text.includes('nephro') || text.includes('kidney') || text.includes('renal') || text.includes('electrolyte') || text.includes('glomerul') || text.includes('urinary')) return 'Renal';
  if (text.includes('gi') || text.includes('liver') || text.includes('hepat') || text.includes('cirrhosis') || text.includes('pancrea') || text.includes('gastric') || text.includes('bowel') || text.includes('ulcer')) return 'Gastrointestinal';
  if (text.includes('neuro') || text.includes('brain') || text.includes('stroke') || text.includes('nerve') || text.includes('plexus') || text.includes('peroneal') || text.includes('cranial') || text.includes('seizure')) return 'Neurological';
  if (text.includes('ortho') || text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('knee') || text.includes('muscle')) return 'Musculoskeletal';
  if (text.includes('obg') || text.includes('preeclampsia') || text.includes('eclampsia') || text.includes('pregnancy') || text.includes('labor') || text.includes('uterus') || text.includes('cervix') || text.includes('ovary')) return 'Obstetrics & Gyn';
  if (text.includes('pediatr') || text.includes('neonat') || text.includes('child')) return 'Pediatrics';
  if (text.includes('derma') || text.includes('skin') || text.includes('bullous') || text.includes('rash')) return 'Dermatology';
  if (text.includes('ophthalm') || text.includes('eye') || text.includes('glaucoma') || text.includes('retina')) return 'Ophthalmology';
  if (text.includes('ent') || text.includes('ear') || text.includes('nose') || text.includes('throat')) return 'ENT';
  if (text.includes('psych') || text.includes('schiz') || text.includes('depress') || text.includes('bipolar')) return 'Psychiatry';
  if (text.includes('micro') || text.includes('infect') || text.includes('bacteri') || text.includes('viral') || text.includes('parasit')) return 'Infectious Diseases';
  return 'General & Multi-System';
}

const getSpecialtyIcon = (subjectId: string, topic: string) => {
  const text = `${subjectId} ${topic}`.toLowerCase();
  if (text.includes('cardio') || text.includes('heart') || text.includes('ecg') || text.includes('coronary')) return { icon: Heart, color: '#FF3B30' };
  if (text.includes('pulmon') || text.includes('respir') || text.includes('lung') || text.includes('asthma') || text.includes('pneumonia')) return { icon: Wind, color: '#5AC8FA' };
  if (text.includes('endocrin') || text.includes('thyroid') || text.includes('diabet') || text.includes('hormone')) return { icon: Activity, color: '#5856D6' };
  if (text.includes('nephro') || text.includes('kidney') || text.includes('renal') || text.includes('electrolyte')) return { icon: Droplets, color: '#30D158' };
  if (text.includes('gi') || text.includes('liver') || text.includes('hepat') || text.includes('cirrhosis')) return { icon: Layers, color: '#FF9500' };
  if (text.includes('neuro') || text.includes('brain') || text.includes('stroke') || text.includes('nerve')) return { icon: Brain, color: '#007AFF' };
  return { icon: Stethoscope, color: '#8E8E93' };
};

const MISTAKE_TYPE_COLORS: Record<MistakeType, { color: string; bg: string; border: string }> = {
  'Concept Gap':            { color: '#FF3B30', bg: 'rgba(255,59,48,0.08)',  border: 'rgba(255,59,48,0.2)'  },
  'Knowledge Recall':       { color: '#FF9500', bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.2)' },
  'Careless Mistake':       { color: '#5856D6', bg: 'rgba(88,86,214,0.08)', border: 'rgba(88,86,214,0.2)' },
  'Clinical Interpretation':{ color: '#30D158', bg: 'rgba(48,209,88,0.08)', border: 'rgba(48,209,88,0.2)' },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

export interface ErrorsViewProps {
  state: AppState;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed: (id: string) => void;
  onDeleteErrorItem: (id: string) => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string, subtopic?: string) => void;
  onOpenAiCoach?: (initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy', subjectId?: string, topicName?: string) => void;
  onSelectSubject?: (subjectId: string) => void;
  onToggleTopicState?: (subjectId: string, topicId: string, flag: 'notesDone' | 'qBankDone' | 'r1Done') => void;
  onBackToPerformance?: () => void;
}

export const ErrorsView: React.FC<ErrorsViewProps> = ({
  state,
  onAddErrorItem,
  onToggleErrorReviewed,
  onDeleteErrorItem,
  onUpdateAppState,
  onLaunchPracticeSession,
  onOpenAiCoach,
  onSelectSubject,
  onToggleTopicState,
  onBackToPerformance,
}) => {
  const [activeRemediationPackage, setActiveRemediationPackage] = useState<ConceptRemediationPackage | null>(null);
  const [activeTopicForMastery, setActiveTopicForMastery] = useState<{ subjectId: string; topicId: string; topicName: string } | null>(null);

  const [mainFilterTab, setMainFilterTab] = useState<'all' | 'spaced' | 'subject' | 'system' | 'type'>('all');
  const [selectedSpacedStage, setSelectedSpacedStage] = useState<'all' | 'due' | 'learning' | 'reviewing' | 'mastered'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);
  const [newError, setNewError] = useState<Partial<ErrorNotebookItem>>({
    subjectId: 'medicine',
    topic: 'Coronary Artery Disease',
    questionGist: '',
    myMistake: '',
    correctConcept: '',
  });

  const errors = useMemo(() => state.errorNotebook || [], [state.errorNotebook]);
  const spacedSummary = useMemo(() => getSpacedErrorsSummary(errors), [errors]);

  const metrics = useMemo(() => {
    const total = errors.length;
    const reviewed = errors.filter((e) => e.isReviewed).length;
    const unreviewed = total - reviewed;
    const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    return { total, reviewed, unreviewed, pct };
  }, [errors]);

  const patternInsights = useMemo(() => {
    if (errors.length === 0) return { conceptGap: 0, knowledgeRecall: 0, carelessMistake: 0, clinicalInterpretation: 0 };
    let cg = 0, kr = 0, cm = 0, ci = 0;
    errors.forEach((err) => {
      const t = classifyMistakeType(err);
      if (t === 'Concept Gap') cg++;
      else if (t === 'Knowledge Recall') kr++;
      else if (t === 'Careless Mistake') cm++;
      else ci++;
    });
    const n = errors.length;
    return {
      conceptGap: Math.round((cg / n) * 100),
      knowledgeRecall: Math.round((kr / n) * 100),
      carelessMistake: Math.round((cm / n) * 100),
      clinicalInterpretation: Math.max(0, 100 - Math.round((cg / n) * 100) - Math.round((kr / n) * 100) - Math.round((cm / n) * 100)),
    };
  }, [errors]);

  const availableSystems = useMemo(() => {
    const map = new Map<string, number>();
    errors.forEach((err) => { const sys = getSystemCategory(err.subjectId, err.topic); map.set(sys, (map.get(sys) || 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [errors]);

  const availableSubjects = useMemo(() => {
    const map = new Map<string, number>();
    errors.forEach((err) => { map.set(err.subjectId, (map.get(err.subjectId) || 0) + 1); });
    return FMGE_SUBJECTS.filter((s) => map.has(s.id)).map((s) => ({ ...s, errorCount: map.get(s.id) || 0 }));
  }, [errors]);

  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      if (mainFilterTab === 'spaced') {
        if (selectedSpacedStage === 'due' && !isSpacedErrorDue(err)) return false;
        if (selectedSpacedStage === 'learning' && (err.spacedStage !== 'learning' || isSpacedErrorDue(err))) return false;
        if (selectedSpacedStage === 'reviewing' && (err.spacedStage !== 'reviewing' || isSpacedErrorDue(err))) return false;
        if (selectedSpacedStage === 'mastered' && (err.spacedStage !== 'mastered' || isSpacedErrorDue(err))) return false;
      } else if (mainFilterTab === 'subject') {
        if (selectedSubjectFilter !== 'all' && err.subjectId !== selectedSubjectFilter) return false;
      } else if (mainFilterTab === 'system') {
        if (selectedSystemFilter !== 'all' && getSystemCategory(err.subjectId, err.topic) !== selectedSystemFilter) return false;
      } else if (mainFilterTab === 'type') {
        if (selectedTypeFilter !== 'all' && classifyMistakeType(err) !== selectedTypeFilter) return false;
      } else if (mainFilterTab === 'all') {
        if (statusFilter === 'pending' && err.isReviewed) return false;
        if (statusFilter === 'resolved' && !err.isReviewed) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId);
        const matchText = `${err.questionGist} ${err.myMistake || ''} ${err.correctConcept || ''} ${err.topic} ${sub?.name || ''} ${classifyMistakeType(err)} ${getSystemCategory(err.subjectId, err.topic)}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      return true;
    });
  }, [errors, mainFilterTab, selectedSpacedStage, selectedSubjectFilter, selectedSystemFilter, selectedTypeFilter, statusFilter, searchQuery]);

  const handleExportErrors = () => {
    const exportData = {
      title: 'ONE SHOT FMGE — Error Vault',
      exportDate: new Date().toISOString(),
      summary: { totalMistakes: errors.length, resolved: metrics.reviewed, pending: metrics.unreviewed, remediationRate: `${metrics.pct}%` },
      errors: errors.map((err) => ({
        subject: FMGE_SUBJECTS.find((s) => s.id === err.subjectId)?.name || err.subjectId,
        topic: err.topic, question: err.questionGist, myMistake: err.myMistake,
        correctConcept: err.correctConcept, mistakeType: classifyMistakeType(err),
        system: getSystemCategory(err.subjectId, err.topic), isResolved: err.isReviewed, dateLogged: err.dateAdded,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fmge-error-vault-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleQuickReviewNow = () => {
    const pendingErr = errors.find((e) => !e.isReviewed) || errors[0];
    if (pendingErr && onLaunchPracticeSession) {
      const sub = FMGE_SUBJECTS.find((s) => s.id === pendingErr.subjectId) || FMGE_SUBJECTS[0];
      const matchedTopic = sub.topics.find((t) => t.id === pendingErr.topicId || t.name === pendingErr.topic) || sub.topics[0];
      onLaunchPracticeSession(sub.id, matchedTopic.id, pendingErr.topic || matchedTopic.name);
    } else if (onLaunchPracticeSession) {
      onLaunchPracticeSession('medicine', 'med-1', 'Cardiovascular System');
    }
  };

  const handleSaveError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newError.questionGist || !newError.correctConcept) return;
    const sub = FMGE_SUBJECTS.find((s) => s.id === newError.subjectId) || FMGE_SUBJECTS[0];
    const defaultTopic = sub?.topics[0];
    const item: ErrorNotebookItem = {
      id: `err-${Date.now()}`,
      subjectId: newError.subjectId || 'medicine',
      topicId: defaultTopic?.id || 'med-1',
      topic: newError.topic || defaultTopic?.name || 'General Clinical Topic',
      questionGist: newError.questionGist,
      myMistake: newError.myMistake || '',
      correctConcept: newError.correctConcept,
      isReviewed: false,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    onAddErrorItem(item);
    setShowAddErrorModal(false);
    setNewError({ subjectId: 'medicine', topic: 'Coronary Artery Disease', questionGist: '', myMistake: '', correctConcept: '' });
  };

  const resetFilters = () => {
    setMainFilterTab('all'); setSelectedSubjectFilter('all');
    setSelectedSystemFilter('all'); setSelectedTypeFilter('all'); setSearchQuery('');
  };

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans'] text-[#1D1D1F]">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11.5px] font-medium text-[#8E8E93]">
        <button type="button" onClick={onBackToPerformance}
          className="flex items-center gap-1 hover:text-[#1D1D1F] transition-colors cursor-pointer">
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Performance</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC]" />
        <span className="font-bold text-[#1D1D1F]">Error Vault</span>
      </nav>

      {/* Hero header */}
      <div className="error-vault-hero relative rounded-3xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(255,59,48,0.10) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/65 to-transparent pointer-events-none" />
        <div className="relative z-10 px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/15 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-[#D92D25]" />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9342C]">
                Error Vault · Clinical Remediation
              </span>
            </div>
            <h1 className="text-[22px] sm:text-[28px] font-black tracking-tight text-[#1D1D1F] leading-tight">
              Turn Mistakes Into Mastery
            </h1>
            <p className="text-[12px] text-[#6E6E73] max-w-md">
              Review, understand, and overcome weak areas with structured distractor and error analysis.
            </p>
          </div>
          <button type="button" onClick={() => setShowAddErrorModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2F2F7] text-[#FF3B30] text-[12px] font-bold cursor-pointer transition-colors shadow-sm shrink-0">
            <Plus className="h-4 w-4" />
            Log Mistake
          </button>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Errors', value: metrics.total, sub: 'Questions to review', icon: FileText, color: '#FF3B30', bg: 'rgba(255,59,48,0.06)', border: 'rgba(255,59,48,0.18)' },
          { label: 'Resolved', value: metrics.reviewed, sub: metrics.total > 0 ? `${metrics.pct}% cleared` : 'No history yet', icon: CheckCircle2, color: '#30D158', bg: 'rgba(48,209,88,0.06)', border: 'rgba(48,209,88,0.18)' },
          { label: 'Pending', value: metrics.unreviewed, sub: metrics.total > 0 ? `${100 - metrics.pct}% backlog` : 'No errors yet', icon: Clock, color: '#FF9500', bg: 'rgba(255,149,0,0.06)', border: 'rgba(255,149,0,0.18)' },
          { label: 'Due Today', value: spacedSummary.dueCount, sub: metrics.total > 0 ? 'Spaced recall queue' : 'No reviews due', icon: RotateCcw, color: '#007AFF', bg: 'rgba(0,122,255,0.06)', border: 'rgba(0,122,255,0.18)' },
        ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className="p-4 rounded-2xl border space-y-2" style={{ background: bg, borderColor: border }}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#8E8E93]">{label}</span>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
            </div>
            <div className="text-[26px] font-black font-mono leading-none" style={{ color }}>{value}</div>
            <p className="text-[11px] text-[#8E8E93]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left: filters + error list */}
        <div className="lg:col-span-8 space-y-4">

          {/* Filter card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Main tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Errors' },
                  { id: 'spaced', label: `Spaced (${spacedSummary.dueCount} due)` },
                  { id: 'subject', label: 'Subject' },
                  { id: 'system', label: 'System' },
                  { id: 'type', label: 'Type' },
                ].map((tab) => (
                  <button key={tab.id} type="button"
                    onClick={() => { setMainFilterTab(tab.id as any); setVisibleCount(5); }}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      mainFilterTab === tab.id
                        ? 'bg-[#FF3B30] text-white shadow-sm'
                        : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative w-full md:w-60 shrink-0">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="Search error vault…" value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(5); }}
                  className="w-full rounded-full bg-[#F2F2F7] border border-transparent focus:border-[#FF3B30] focus:bg-white pl-9 pr-8 py-1.5 text-[12px] text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/15 transition-all" />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C7C7CC] hover:text-[#8E8E93]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary pills */}
            {mainFilterTab === 'spaced' && (
              <div className="flex items-center gap-2 pt-1 border-t border-[rgba(60,60,67,0.06)] overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-mono uppercase text-[#8E8E93] shrink-0">Stage:</span>
                {[
                  { id: 'all', label: `All (${spacedSummary.totalCount})` },
                  { id: 'due', label: `Due Today (${spacedSummary.dueCount})` },
                  { id: 'learning', label: `Learning (${spacedSummary.learningCount})` },
                  { id: 'reviewing', label: `Lock-in (${spacedSummary.reviewingCount})` },
                  { id: 'mastered', label: `Mastered (${spacedSummary.masteredCount})` },
                ].map((s) => (
                  <button key={s.id} type="button" onClick={() => { setSelectedSpacedStage(s.id as any); setVisibleCount(5); }}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer whitespace-nowrap transition-all ${
                      selectedSpacedStage === s.id
                        ? s.id === 'due' ? 'bg-[#FF3B30] text-white' : 'bg-[#1D1D1F] text-white'
                        : s.id === 'due' && spacedSummary.dueCount > 0
                        ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7]'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'all' && (
              <div className="flex items-center gap-2 pt-1 border-t border-[rgba(60,60,67,0.06)]">
                <span className="text-[10px] font-mono uppercase text-[#8E8E93]">Status:</span>
                {[
                  { id: 'all', label: `All (${metrics.total})` },
                  { id: 'pending', label: `Pending (${metrics.unreviewed})` },
                  { id: 'resolved', label: `Resolved (${metrics.reviewed})` },
                ].map((s) => (
                  <button key={s.id} type="button" onClick={() => setStatusFilter(s.id as any)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                      statusFilter === s.id ? 'bg-[#F2F2F7] text-[#1D1D1F]' : 'text-[#8E8E93] hover:text-[#1D1D1F]'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'subject' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[rgba(60,60,67,0.06)] pb-1 scrollbar-none">
                <button type="button" onClick={() => setSelectedSubjectFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 cursor-pointer transition-all ${selectedSubjectFilter === 'all' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]'}`}>
                  All
                </button>
                {availableSubjects.map((sub) => (
                  <button key={sub.id} type="button" onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 cursor-pointer whitespace-nowrap transition-all ${selectedSubjectFilter === sub.id ? 'bg-[#1D1D1F] text-white' : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA]'}`}>
                    {sub.name} ({sub.errorCount})
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'system' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[rgba(60,60,67,0.06)] pb-1 scrollbar-none">
                <button type="button" onClick={() => setSelectedSystemFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 cursor-pointer transition-all ${selectedSystemFilter === 'all' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'}`}>
                  All
                </button>
                {availableSystems.map(([sys, count]) => (
                  <button key={sys} type="button" onClick={() => setSelectedSystemFilter(sys)}
                    className={`px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 cursor-pointer whitespace-nowrap transition-all ${selectedSystemFilter === sys ? 'bg-[#1D1D1F] text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'}`}>
                    {sys} ({count})
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'type' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[rgba(60,60,67,0.06)] pb-1 scrollbar-none">
                <button type="button" onClick={() => setSelectedTypeFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 cursor-pointer transition-all ${selectedTypeFilter === 'all' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'}`}>
                  All
                </button>
                {(['Concept Gap', 'Knowledge Recall', 'Careless Mistake', 'Clinical Interpretation'] as MistakeType[]).map((type) => {
                  const count = errors.filter((e) => classifyMistakeType(e) === type).length;
                  const { color } = MISTAKE_TYPE_COLORS[type];
                  return (
                    <button key={type} type="button" onClick={() => setSelectedTypeFilter(type)}
                      className="px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 cursor-pointer whitespace-nowrap transition-all"
                      style={selectedTypeFilter === type
                        ? { background: color, color: 'white' }
                        : { background: '#F2F2F7', color: '#6E6E73' }}>
                      {type} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error list */}
          {filteredErrors.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-4 text-center rounded-2xl bg-white border-2 border-dashed border-[rgba(48,209,88,0.25)] bg-[#F0FFF4]/50">
              <div className="w-12 h-12 rounded-2xl bg-[#30D158]/15 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#30D158]" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-[15px] font-bold text-[#1D1D1F]">No mistakes found</h3>
                <p className="text-[12px] text-[#8E8E93] leading-relaxed">
                  {errors.length === 0
                    ? 'Start logging mistakes from practice drills and grand tests to build your error vault.'
                    : 'No errors match your current filters.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowAddErrorModal(true)}
                  className="px-4 py-2 rounded-full bg-[#1D1D1F] hover:bg-[#3A3A3C] text-white text-[12px] font-bold cursor-pointer transition-colors">
                  + Log Mistake
                </button>
                {(searchQuery || mainFilterTab !== 'all' || selectedSubjectFilter !== 'all') && (
                  <button type="button" onClick={resetFilters}
                    className="px-4 py-2 rounded-full border border-[rgba(60,60,67,0.15)] text-[#6E6E73] text-[12px] font-medium cursor-pointer hover:bg-[#F2F2F7]">
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredErrors.slice(0, visibleCount).map((err) => {
                const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId) || FMGE_SUBJECTS[0];
                const matchedTopic = sub.topics.find((t) => t.id === err.topicId || t.name === err.topic) || sub.topics[0];
                const mistakeType = classifyMistakeType(err);
                const conceptGap = extractConceptGap(err.subjectId, err.topicId || matchedTopic.id, err.questionGist, err.myMistake);
                const { icon: SpecIcon, color: specColor } = getSpecialtyIcon(err.subjectId, err.topic);
                const typeStyle = MISTAKE_TYPE_COLORS[mistakeType];
                const isExpanded = expandedErrorId === err.id;
                const badge = formatSpacedIntervalBadge(err);

                return (
                  <div key={err.id}
                    className="rounded-2xl border bg-white overflow-hidden transition-all"
                    style={{ borderColor: isExpanded ? 'rgba(255,59,48,0.35)' : err.isReviewed ? 'rgba(48,209,88,0.2)' : 'rgba(60,60,67,0.1)', boxShadow: isExpanded ? '0 4px 16px rgba(255,59,48,0.08)' : undefined }}>

                    {/* Card header */}
                    <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Left accent bar */}
                        <div className="w-1 h-full min-h-[44px] rounded-full shrink-0 self-stretch" style={{ background: specColor, opacity: 0.7 }} />
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${specColor}15`, border: `1px solid ${specColor}30` }}>
                          <SpecIcon className="w-4.5 h-4.5" style={{ color: specColor }} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#F2F2F7] text-[#3A3A3C]">{sub.name}</span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                              style={{ color: typeStyle.color, background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
                              {mistakeType}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>{badge.label}</span>
                            {err.isReviewed && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/25">Resolved</span>
                            )}
                          </div>
                          <h3 className="text-[13px] font-semibold text-[#1D1D1F] leading-snug line-clamp-1">{err.questionGist}</h3>
                          <p className="text-[11.5px] text-[#8E8E93]">{err.topic || matchedTopic.name} · {formatDate(err.dateAdded)}</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedErrorId(isExpanded ? null : err.id); }}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                          isExpanded ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]' : 'bg-[#F2F2F7] text-[#1D1D1F] border-transparent hover:bg-[#E5E5EA]'
                        }`}>
                        {isExpanded ? 'Close' : 'Review'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable drawer */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden">
                          <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 border-t border-[rgba(60,60,67,0.06)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                              <div className="p-3.5 rounded-2xl bg-[#FFF0F0] border border-[rgba(255,59,48,0.15)] space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#FF3B30]">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Why It's Wrong &amp; Clinical Trap
                                </div>
                                {err.myMistake && <p className="text-[12px] text-[#3A3A3C] font-medium"><span className="font-bold">Your choice:</span> {err.myMistake}</p>}
                                <p className="text-[12px] text-[#3A3A3C] leading-snug"><span className="font-bold">Trap:</span> {conceptGap.classicTrap}</p>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-[#F0F8FF] border border-[rgba(0,122,255,0.15)] space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#007AFF]">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  Core Concept &amp; Clinical Retainer
                                </div>
                                <p className="text-[12px] text-[#1D1D1F] font-semibold leading-snug">{err.correctConcept}</p>
                                <p className="text-[11px] font-mono text-[#8E8E93]">{sub.name} → {err.topic || matchedTopic.name}</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(60,60,67,0.06)]">
                              <div className="flex flex-wrap items-center gap-2">
                                <button type="button" onClick={() => onToggleErrorReviewed(err.id)}
                                  className={`text-[12px] px-3.5 py-1.5 rounded-full font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                                    err.isReviewed
                                      ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30'
                                      : 'bg-[#30D158] text-white border-[#30D158] shadow-sm'
                                  }`}>
                                  <Check className="w-3.5 h-3.5" />
                                  {err.isReviewed ? 'Resolved' : 'Mark Resolved'}
                                </button>
                                {onLaunchPracticeSession && (
                                  <button type="button" onClick={() => onLaunchPracticeSession(sub.id, matchedTopic.id, err.topic || matchedTopic.name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[12px] font-bold border border-transparent cursor-pointer">
                                    <Play className="h-3 w-3 fill-current" />
                                    10-MCQ Drill
                                  </button>
                                )}
                                <button type="button"
                                  onClick={() => setActiveTopicForMastery({ subjectId: sub.id, topicId: matchedTopic.id, topicName: err.topic || matchedTopic.name })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0056CC] text-white text-[12px] font-bold cursor-pointer shadow-sm">
                                  <BookOpen className="h-3 w-3" />
                                  6-Step Study
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button"
                                  onClick={() => setActiveRemediationPackage(generateConceptRemediationPackage(err.subjectId, err.topicId || matchedTopic.id, conceptGap.conceptId, conceptGap.conceptName))}
                                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#007AFF] hover:text-[#0056CC] cursor-pointer">
                                  Full Remediation <ArrowRight className="h-3 w-3" />
                                </button>
                                {onOpenAiCoach && (
                                  <button type="button"
                                    onClick={() => onOpenAiCoach('concept', sub.id, `FMGE Error: "${err.questionGist}". Mistake: "${err.myMistake || 'Misidentified'}". Correct: "${err.correctConcept || conceptGap.conceptName}". Explain why the distractor was tricky and give a high-yield memory hook.`)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5856D6]/10 hover:bg-[#5856D6]/20 text-[#5856D6] border border-[#5856D6]/25 text-[12px] font-bold cursor-pointer">
                                    <Brain className="h-3.5 w-3.5" />
                                    AI Explain
                                  </button>
                                )}
                                <button type="button" onClick={() => onDeleteErrorItem(err.id)}
                                  className="p-1.5 text-[#C7C7CC] hover:text-[#FF3B30] hover:bg-[#FF3B30]/08 rounded-full cursor-pointer transition-colors"
                                  title="Delete error">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredErrors.length > visibleCount && (
                <button type="button" onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-[#F9F9F9] border border-[rgba(60,60,67,0.1)] text-[12px] font-bold text-[#1D1D1F] cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                  Load More ({filteredErrors.length - visibleCount} remaining)
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Insights + Quick Actions */}
        <div className="lg:col-span-4 space-y-4">

          {/* Error Insights */}
          <div className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#FF3B30]" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#1D1D1F]">Error Insights</h2>
                <p className="text-[11px] text-[#8E8E93]">Understand your mistake patterns</p>
              </div>
            </div>
            <div className="space-y-3">
              {([
                { label: 'Concept Gap', value: patternInsights.conceptGap, color: '#FF3B30' },
                { label: 'Knowledge Recall', value: patternInsights.knowledgeRecall, color: '#FF9500' },
                { label: 'Careless Mistake', value: patternInsights.carelessMistake, color: '#5856D6' },
                { label: 'Clinical Interpretation', value: patternInsights.clinicalInterpretation, color: '#30D158' },
              ]).map(({ label, value, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#3A3A3C] font-medium">{label}</span>
                  <span className="font-mono font-bold text-[#1D1D1F]">{metrics.total > 0 ? `${value}%` : '—'}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#F2F2F7] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${metrics.total > 0 ? value : 0}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Resolution progress ring */}
            <div className="pt-3 border-t border-[rgba(60,60,67,0.06)] flex items-center gap-3">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
                  <circle cx="26" cy="26" r="20" fill="none" stroke="#F2F2F7" strokeWidth="5" />
                  <circle cx="26" cy="26" r="20" fill="none"
                    stroke={metrics.total === 0 ? '#C7C7CC' : metrics.pct >= 70 ? '#30D158' : metrics.pct >= 40 ? '#FF9500' : '#FF3B30'}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - metrics.pct / 100)}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                </svg>
                <span className="absolute text-[11px] font-black font-mono text-[#1D1D1F]">{metrics.total > 0 ? `${metrics.pct}%` : '—'}</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#1D1D1F]">Resolution Rate</p>
                <p className="text-[11px] text-[#8E8E93]">{metrics.reviewed} of {metrics.total} reviewed</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-5 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#FF9500]" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-[#1D1D1F]">Quick Actions</h2>
                <p className="text-[11px] text-[#8E8E93]">Get the most from your vault</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Review Now', sub: 'Start 10-Q drill', icon: Play, color: '#30D158', action: handleQuickReviewNow },
                { label: 'By Subject', sub: 'Focus on subject', icon: BookOpen, color: '#007AFF', action: () => { setMainFilterTab('subject'); } },
                { label: 'By Mistake Type', sub: 'Target areas', icon: Filter, color: '#5856D6', action: () => { setMainFilterTab('type'); } },
                { label: 'Export List', sub: 'Save for offline', icon: Download, color: '#FF9500', action: handleExportErrors },
              ].map(({ label, sub, icon: Icon, color, action }) => (
                <motion.button key={label} type="button"
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={action}
                  className="p-3.5 rounded-2xl border border-[rgba(60,60,67,0.1)] bg-[#F9F9F9] hover:bg-white hover:border-[rgba(60,60,67,0.2)] text-left space-y-2 cursor-pointer group transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#1D1D1F]">{label}</p>
                    <p className="text-[10.5px] text-[#8E8E93]">{sub}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Spaced Repetition status */}
          {spacedSummary.dueCount > 0 && (
            <div className="p-4 rounded-2xl border flex items-center gap-3"
              style={{ background: 'rgba(255,59,48,0.05)', borderColor: 'rgba(255,59,48,0.2)' }}>
              <div className="w-8 h-8 rounded-xl bg-[#FF3B30]/15 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-[#FF3B30]" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[#1D1D1F]">{spacedSummary.dueCount} errors due for review</p>
                <p className="text-[11px] text-[#8E8E93]">Spaced repetition ladder ready</p>
              </div>
              <button type="button" onClick={() => { setMainFilterTab('spaced'); setSelectedSpacedStage('due'); }}
                className="px-3 py-1.5 rounded-full bg-[#FF3B30] text-white text-[11px] font-bold cursor-pointer shrink-0 shadow-sm">
                Start
              </button>
            </div>
          )}

          {/* Motivation */}
          <div className="p-4 rounded-2xl border border-[rgba(60,60,67,0.08)] bg-[#F9F9F9] flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#30D158] shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#8E8E93] italic leading-relaxed">
              "Every mistake is a lesson that makes you a stronger doctor." — OneShot FMGE
            </p>
          </div>
        </div>
      </div>

      {/* Log Mistake Modal — inline fixed, no createPortal */}
      {showAddErrorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9350, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
          onClick={() => setShowAddErrorModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative w-full max-w-lg bg-[#F8FAFA] rounded-3xl border border-slate-200/80 shadow-[0_25px_60px_rgba(0,0,0,0.22)] overflow-hidden my-auto font-['Plus_Jakarta_Sans']"
            onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(60,60,67,0.1)] bg-white/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-[#FF3B30]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF3B30]">Log Mistake</span>
                </div>
                <h2 className="text-[18px] font-black text-[#1D1D1F]">Clinical Question Error</h2>
              </div>
              <button type="button" onClick={() => setShowAddErrorModal(false)}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center text-[#8E8E93] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveError} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#1D1D1F]">Subject</label>
                <select value={newError.subjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const s = FMGE_SUBJECTS.find((sub) => sub.id === subId);
                    setNewError({ ...newError, subjectId: subId, topic: s?.topics[0]?.name || 'General Topic' });
                  }}
                  className="w-full p-2.5 rounded-xl border border-[rgba(60,60,67,0.15)] bg-white text-[12px] font-medium text-[#1D1D1F] focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/15">
                  {FMGE_SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.weightage}M)</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#1D1D1F]">Topic Title</label>
                <input type="text" value={newError.topic}
                  onChange={(e) => setNewError({ ...newError, topic: e.target.value })}
                  placeholder="e.g. Asthma, Knee Joint, Coronary Artery Disease…"
                  className="w-full p-2.5 rounded-xl border border-[rgba(60,60,67,0.15)] bg-white text-[12px] text-[#1D1D1F] focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#1D1D1F]">Question Gist / Clinical Stem</label>
                <textarea rows={2} value={newError.questionGist}
                  onChange={(e) => setNewError({ ...newError, questionGist: e.target.value })}
                  placeholder="Briefly describe what the clinical question presented…"
                  required
                  className="w-full p-2.5 rounded-xl border border-[rgba(60,60,67,0.15)] bg-white text-[12px] text-[#1D1D1F] resize-none focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#1D1D1F]">My Selected Answer / Mistake</label>
                <input type="text" value={newError.myMistake}
                  onChange={(e) => setNewError({ ...newError, myMistake: e.target.value })}
                  placeholder="e.g. Confused with unstable angina; missed the ST elevation"
                  className="w-full p-2.5 rounded-xl border border-[rgba(60,60,67,0.15)] bg-white text-[12px] text-[#1D1D1F] focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#1D1D1F]">Correct Concept / Diagnostic Discriminator</label>
                <textarea rows={2} value={newError.correctConcept}
                  onChange={(e) => setNewError({ ...newError, correctConcept: e.target.value })}
                  placeholder="What is the definitive high-yield guideline or discriminator?"
                  required
                  className="w-full p-2.5 rounded-xl border border-[rgba(60,60,67,0.15)] bg-white text-[12px] text-[#1D1D1F] resize-none focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/15" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgba(60,60,67,0.08)]">
                <button type="button" onClick={() => setShowAddErrorModal(false)}
                  className="px-4 py-2 rounded-full border border-[rgba(60,60,67,0.15)] text-[#6E6E73] text-[12px] font-bold cursor-pointer hover:bg-[#F2F2F7]">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-full bg-[#FF3B30] hover:bg-[#E0352B] text-white text-[12px] font-bold cursor-pointer shadow-sm transition-colors">
                  Save Error Note
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {activeRemediationPackage && (
        <ConceptRemediationModal
          remediationPackage={activeRemediationPackage}
          onClose={() => setActiveRemediationPackage(null)}
          onUpdateAppState={onUpdateAppState}
        />
      )}

      {activeTopicForMastery && (
        <TopicMasteryWorkspace
          subjectId={activeTopicForMastery.subjectId}
          topicId={activeTopicForMastery.topicId}
          topicName={activeTopicForMastery.topicName}
          state={state}
          onClose={() => setActiveTopicForMastery(null)}
          onLaunchPracticeMcq={(ctx) => {
            if (onLaunchPracticeSession) onLaunchPracticeSession(ctx.subjectId, ctx.topicId, ctx.topicName, ctx.subtopic);
          }}
          onToggleTopicState={(onToggleTopicState as any) || (() => {})}
          onOpenAiCoach={onOpenAiCoach}
        />
      )}
    </div>
  );
};
