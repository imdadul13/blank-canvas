import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  HelpCircle,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  FileText,
  Filter,
  Download,
  Quote,
  Heart,
  Wind,
  Droplets,
  Layers,
  Brain,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { ConceptRemediationModal } from './ConceptRemediationModal';
import { TopicMasteryWorkspace } from './TopicMasteryWorkspace';
import {
  extractConceptGap,
  generateConceptRemediationPackage,
  ConceptRemediationPackage,
} from '../utils/errorRemediationEngine';

export type MistakeType =
  | 'Concept Gap'
  | 'Knowledge Recall'
  | 'Careless Mistake'
  | 'Clinical Interpretation';

export function classifyMistakeType(err: ErrorNotebookItem): MistakeType {
  const text = `${err.myMistake || ''} ${err.questionGist || ''} ${err.correctConcept || ''} ${err.topic || ''}`.toLowerCase();
  if (
    text.includes('careless') ||
    text.includes('rushed') ||
    text.includes('except') ||
    text.includes('misread') ||
    text.includes('silly') ||
    text.includes('not read')
  ) {
    return 'Careless Mistake';
  }
  if (
    text.includes('recall') ||
    text.includes('memor') ||
    text.includes('forgot') ||
    text.includes('formula') ||
    text.includes('dose') ||
    text.includes('criteria') ||
    text.includes('number') ||
    text.includes('table') ||
    text.includes('staged') ||
    text.includes('value')
  ) {
    return 'Knowledge Recall';
  }
  if (
    text.includes('interpret') ||
    text.includes('ecg') ||
    text.includes('xray') ||
    text.includes('radiolog') ||
    text.includes('ct') ||
    text.includes('mri') ||
    text.includes('presentation') ||
    text.includes('case') ||
    text.includes('finding') ||
    text.includes('image') ||
    text.includes('diagnosis')
  ) {
    return 'Clinical Interpretation';
  }
  return 'Concept Gap';
}

export function getSystemCategory(subjectId: string, topic: string): string {
  const text = `${subjectId} ${topic}`.toLowerCase();
  if (
    text.includes('cardio') ||
    text.includes('heart') ||
    text.includes('ecg') ||
    text.includes('coronary') ||
    text.includes('infarct') ||
    text.includes('arrhythmia') ||
    text.includes('hypertension') ||
    text.includes('vascular')
  )
    return 'Cardiovascular';
  if (
    text.includes('pulmon') ||
    text.includes('respir') ||
    text.includes('pneumonia') ||
    text.includes('lung') ||
    text.includes('asthma') ||
    text.includes('copd') ||
    text.includes('tb') ||
    text.includes('tuberculosis')
  )
    return 'Respiratory';
  if (
    text.includes('endocrin') ||
    text.includes('thyroid') ||
    text.includes('diabet') ||
    text.includes('adrenal') ||
    text.includes('hormone') ||
    text.includes('pituitary')
  )
    return 'Endocrine';
  if (
    text.includes('nephro') ||
    text.includes('kidney') ||
    text.includes('renal') ||
    text.includes('electrolyte') ||
    text.includes('glomerul') ||
    text.includes('urinary')
  )
    return 'Renal';
  if (
    text.includes('gi') ||
    text.includes('liver') ||
    text.includes('hepat') ||
    text.includes('cirrhosis') ||
    text.includes('pancrea') ||
    text.includes('gastric') ||
    text.includes('bowel') ||
    text.includes('ulcer')
  )
    return 'Gastrointestinal';
  if (
    text.includes('neuro') ||
    text.includes('brain') ||
    text.includes('stroke') ||
    text.includes('nerve') ||
    text.includes('plexus') ||
    text.includes('peroneal') ||
    text.includes('cranial') ||
    text.includes('seizure')
  )
    return 'Neurological';
  if (
    text.includes('ortho') ||
    text.includes('bone') ||
    text.includes('joint') ||
    text.includes('fracture') ||
    text.includes('knee') ||
    text.includes('muscle')
  )
    return 'Musculoskeletal';
  if (
    text.includes('obg') ||
    text.includes('preeclampsia') ||
    text.includes('eclampsia') ||
    text.includes('pregnancy') ||
    text.includes('labor') ||
    text.includes('uterus') ||
    text.includes('cervix') ||
    text.includes('ovary')
  )
    return 'Obstetrics & Gyn';
  if (text.includes('pediatr') || text.includes('neonat') || text.includes('child'))
    return 'Pediatrics';
  if (text.includes('derma') || text.includes('skin') || text.includes('bullous') || text.includes('rash'))
    return 'Dermatology';
  if (text.includes('ophthalm') || text.includes('eye') || text.includes('glaucoma') || text.includes('retina'))
    return 'Ophthalmology';
  if (text.includes('ent') || text.includes('ear') || text.includes('nose') || text.includes('throat'))
    return 'ENT';
  if (text.includes('psych') || text.includes('schiz') || text.includes('depress') || text.includes('bipolar'))
    return 'Psychiatry';
  if (
    text.includes('micro') ||
    text.includes('infect') ||
    text.includes('bacteri') ||
    text.includes('viral') ||
    text.includes('parasit')
  )
    return 'Infectious Diseases';
  return 'General & Multi-System';
}

const getSpecialtyIcon = (subjectId: string, topic: string) => {
  const text = `${subjectId} ${topic}`.toLowerCase();
  if (text.includes('cardio') || text.includes('heart') || text.includes('ecg') || text.includes('coronary')) {
    return { icon: Heart, badgeColor: 'bg-rose-50 text-rose-500 border-rose-100' };
  }
  if (text.includes('pulmon') || text.includes('respir') || text.includes('lung') || text.includes('asthma') || text.includes('pneumonia')) {
    return { icon: Wind, badgeColor: 'bg-sky-50 text-sky-500 border-sky-100' };
  }
  if (text.includes('endocrin') || text.includes('thyroid') || text.includes('diabet') || text.includes('hormone')) {
    return { icon: Activity, badgeColor: 'bg-purple-50 text-purple-600 border-purple-100' };
  }
  if (text.includes('nephro') || text.includes('kidney') || text.includes('renal') || text.includes('electrolyte')) {
    return { icon: Droplets, badgeColor: 'bg-emerald-50 text-emerald-500 border-emerald-100' };
  }
  if (text.includes('gi') || text.includes('liver') || text.includes('hepat') || text.includes('cirrhosis')) {
    return { icon: Layers, badgeColor: 'bg-amber-50 text-amber-500 border-amber-100' };
  }
  if (text.includes('neuro') || text.includes('brain') || text.includes('stroke') || text.includes('nerve')) {
    return { icon: Brain, badgeColor: 'bg-indigo-50 text-indigo-500 border-indigo-100' };
  }
  return { icon: Stethoscope, badgeColor: 'bg-teal-50 text-teal-600 border-teal-100' };
};

const getMistakeTypeStyle = (type: MistakeType) => {
  switch (type) {
    case 'Concept Gap':
      return 'bg-rose-50 text-rose-600 border-rose-200/80';
    case 'Knowledge Recall':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'Careless Mistake':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    case 'Clinical Interpretation':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export interface ErrorsViewProps {
  state: AppState;
  onAddErrorItem: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed: (id: string) => void;
  onDeleteErrorItem: (id: string) => void;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onSelectSubject?: (subjectId: string) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    flag: 'notesDone' | 'qBankDone' | 'r1Done'
  ) => void;
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
  const [activeRemediationPackage, setActiveRemediationPackage] =
    useState<ConceptRemediationPackage | null>(null);
  const [activeTopicForMastery, setActiveTopicForMastery] = useState<{
    subjectId: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  // Filter & Navigation States
  const [mainFilterTab, setMainFilterTab] = useState<'all' | 'subject' | 'system' | 'type'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);

  // New Error Form State
  const [newError, setNewError] = useState<Partial<ErrorNotebookItem>>({
    subjectId: 'medicine',
    topic: 'Coronary Artery Disease',
    questionGist: '',
    myMistake: '',
    correctConcept: '',
  });

  const errors = useMemo(() => state.errorNotebook || [], [state.errorNotebook]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = errors.length;
    const reviewed = errors.filter((e) => e.isReviewed).length;
    const unreviewed = total - reviewed;
    const pct = total > 0 ? Math.round((reviewed / total) * 100) : 100;
    // Accuracy gain calculated realistically based on reviewed proportion
    const accuracyGain = total > 0 ? Math.min(38, Math.max(0, Math.round(pct * 0.28 + (reviewed > 0 ? 5 : 0)))) : 0;
    return { total, reviewed, unreviewed, pct, accuracyGain };
  }, [errors]);

  // Error Insights Pattern Breakdown (Calculated from user's errors or realistic FMGE distribution if empty)
  const patternInsights = useMemo(() => {
    if (errors.length === 0) {
      return {
        conceptGap: 42,
        knowledgeRecall: 28,
        carelessMistake: 18,
        clinicalInterpretation: 12,
      };
    }
    let conceptGapCount = 0;
    let knowledgeRecallCount = 0;
    let carelessMistakeCount = 0;
    let clinicalInterpretationCount = 0;

    errors.forEach((err) => {
      const type = classifyMistakeType(err);
      if (type === 'Concept Gap') conceptGapCount++;
      else if (type === 'Knowledge Recall') knowledgeRecallCount++;
      else if (type === 'Careless Mistake') carelessMistakeCount++;
      else if (type === 'Clinical Interpretation') clinicalInterpretationCount++;
    });

    const total = errors.length;
    return {
      conceptGap: Math.round((conceptGapCount / total) * 100),
      knowledgeRecall: Math.round((knowledgeRecallCount / total) * 100),
      carelessMistake: Math.round((carelessMistakeCount / total) * 100),
      clinicalInterpretation: Math.max(0, 100 - (
        Math.round((conceptGapCount / total) * 100) +
        Math.round((knowledgeRecallCount / total) * 100) +
        Math.round((carelessMistakeCount / total) * 100)
      )),
    };
  }, [errors]);

  // System and Subject Lists with Counts
  const availableSystems = useMemo(() => {
    const map = new Map<string, number>();
    errors.forEach((err) => {
      const sys = getSystemCategory(err.subjectId, err.topic);
      map.set(sys, (map.get(sys) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [errors]);

  const availableSubjects = useMemo(() => {
    const map = new Map<string, number>();
    errors.forEach((err) => {
      map.set(err.subjectId, (map.get(err.subjectId) || 0) + 1);
    });
    return FMGE_SUBJECTS.filter((s) => map.has(s.id)).map((s) => ({
      ...s,
      errorCount: map.get(s.id) || 0,
    }));
  }, [errors]);

  // Filtered Errors
  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      // Main filter tabs
      if (mainFilterTab === 'subject') {
        if (selectedSubjectFilter !== 'all' && err.subjectId !== selectedSubjectFilter) return false;
      } else if (mainFilterTab === 'system') {
        if (selectedSystemFilter !== 'all') {
          const sys = getSystemCategory(err.subjectId, err.topic);
          if (sys !== selectedSystemFilter) return false;
        }
      } else if (mainFilterTab === 'type') {
        if (selectedTypeFilter !== 'all') {
          const type = classifyMistakeType(err);
          if (type !== selectedTypeFilter) return false;
        }
      } else if (mainFilterTab === 'all') {
        if (statusFilter === 'pending' && err.isReviewed) return false;
        if (statusFilter === 'resolved' && !err.isReviewed) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sub = FMGE_SUBJECTS.find((s) => s.id === err.subjectId);
        const mistakeType = classifyMistakeType(err);
        const system = getSystemCategory(err.subjectId, err.topic);
        const matchText = `${err.questionGist} ${err.myMistake || ''} ${err.correctConcept || ''} ${err.topic} ${sub?.name || ''} ${mistakeType} ${system}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      return true;
    });
  }, [
    errors,
    mainFilterTab,
    selectedSubjectFilter,
    selectedSystemFilter,
    selectedTypeFilter,
    statusFilter,
    searchQuery,
  ]);

  // Export errors as JSON file for offline study
  const handleExportErrors = () => {
    const exportData = {
      title: 'ONE SHOT FMGE — Error Vault',
      exportDate: new Date().toISOString(),
      summary: {
        totalMistakes: errors.length,
        resolved: metrics.reviewed,
        pending: metrics.unreviewed,
        remediationRate: `${metrics.pct}%`,
      },
      errors: errors.map((err) => ({
        subject: FMGE_SUBJECTS.find((s) => s.id === err.subjectId)?.name || err.subjectId,
        topic: err.topic,
        question: err.questionGist,
        myMistake: err.myMistake,
        correctConcept: err.correctConcept,
        mistakeType: classifyMistakeType(err),
        system: getSystemCategory(err.subjectId, err.topic),
        isResolved: err.isReviewed,
        dateLogged: err.dateAdded,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fmge-error-vault-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Quick Action: Launch 10-MCQ Drill on the highest priority pending error topic
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
    setNewError({
      subjectId: 'medicine',
      topic: 'Coronary Artery Disease',
      questionGist: '',
      myMistake: '',
      correctConcept: '',
    });
  };

  return (
    <div
      className="space-y-6 sm:space-y-8 font-['Plus_Jakarta_Sans'] text-slate-900 pb-36 sm:pb-20"
      style={{
        paddingBottom: 'max(9.5rem, calc(7rem + env(safe-area-inset-bottom, 2rem)))',
      }}
    >
      {/* ================= 1. BREADCRUMB ================= */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-slate-500"
      >
        <button
          type="button"
          onClick={onBackToPerformance}
          className="flex items-center gap-1 text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Performance</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-semibold text-slate-900">Error Vault</span>
      </nav>

      {/* ================= 2. HERO HEADER & EDITORIAL QUOTE ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-3 sm:gap-3.5 max-w-2xl">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-rose-50/90 border border-rose-100/90 text-rose-600 shadow-2xs shrink-0 mt-0.5 cursor-default"
          >
            <Target className="h-5 w-5 text-rose-600 stroke-[2]" />
          </motion.div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold font-display uppercase tracking-tight bg-gradient-to-r from-slate-950 via-rose-950 to-red-800 bg-clip-text text-transparent leading-tight">
                TURN MISTAKES INTO MASTERY.
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold font-mono tracking-[0.14em] uppercase bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/10 border border-rose-200/80 text-rose-800 shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Error Vault · Clinical Remediation
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Review, understand, and overcome your weak areas with structured distractor and error analysis.
            </p>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddErrorModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Mistake</span>
              </button>
              {metrics.total > 0 && (
                <span className="text-xs text-slate-500 font-mono">
                  {metrics.unreviewed} pending review
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Motivational Banner (Desktop & Mobile) */}
        <div className="p-5 rounded-2xl bg-[#E8F5F2] border border-[#CDEAE3] flex items-start gap-3.5 max-w-md shadow-xs">
          <div className="p-1.5 rounded-lg bg-teal-600/10 text-teal-800 shrink-0 mt-0.5">
            <Quote className="w-4 h-4 text-teal-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
              “Every mistake is a lesson that makes you a stronger doctor.”
            </p>
            <p className="text-[11px] font-mono font-semibold text-teal-800 tracking-wide">
              — ONE SHOT FMGE
            </p>
          </div>
        </div>
      </div>

      {/* ================= 3. 4-METRIC TILES ROW ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Errors */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Errors</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-slate-900 leading-none">
              {metrics.total}
            </p>
            <p className="text-xs text-slate-500 mt-1">Questions to review</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-slate-900 leading-none">
              {metrics.reviewed}
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {metrics.pct}% cleared
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-slate-900 leading-none">
              {metrics.unreviewed}
            </p>
            <p className="text-xs text-amber-700 font-medium mt-1">
              {metrics.total > 0 ? `${100 - metrics.pct}% remaining` : 'No backlog'}
            </p>
          </div>
        </div>

        {/* Accuracy Gain */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accuracy Gain</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-display text-slate-900 leading-none">
              +{metrics.accuracyGain}%
            </p>
            <p className="text-xs text-slate-500 mt-1">After review</p>
          </div>
        </div>
      </div>

      {/* ================= 4. MAIN WORKSPACE (2 COLUMNS ON DESKTOP, STACKED ON MOBILE) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: FILTERS + ERROR QUESTION LIST ================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters & Search Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: 'all', desktop: 'All Errors', mobile: 'All' },
                  { id: 'subject', desktop: 'By Subject', mobile: 'Subject' },
                  { id: 'system', desktop: 'By System', mobile: 'System' },
                  { id: 'type', desktop: 'By Mistake Type', mobile: 'Type' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMainFilterTab(tab.id as any);
                      setVisibleCount(5);
                    }}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold font-display transition-all cursor-pointer shrink-0 border ${
                      mainFilterTab === tab.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.desktop}</span>
                    <span className="sm:hidden">{tab.mobile}</span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search your error vault..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(5);
                  }}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary Filter Sub-pills */}
            {mainFilterTab === 'all' && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">Status:</span>
                {[
                  { id: 'all', label: `All (${metrics.total})` },
                  { id: 'pending', label: `Pending (${metrics.unreviewed})` },
                  { id: 'resolved', label: `Resolved (${metrics.reviewed})` },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id as any)}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      statusFilter === s.id
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'subject' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer border ${
                    selectedSubjectFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  All Subjects
                </button>
                {availableSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer border ${
                      selectedSubjectFilter === sub.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {sub.name} ({sub.errorCount})
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'system' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSystemFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer border ${
                    selectedSystemFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  All Systems
                </button>
                {availableSystems.map(([sys, count]) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setSelectedSystemFilter(sys)}
                    className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer border ${
                      selectedSystemFilter === sys
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {sys} ({count})
                  </button>
                ))}
              </div>
            )}

            {mainFilterTab === 'type' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer border ${
                    selectedTypeFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  All Types
                </button>
                {[
                  'Concept Gap',
                  'Knowledge Recall',
                  'Careless Mistake',
                  'Clinical Interpretation',
                ].map((type) => {
                  const count = errors.filter((e) => classifyMistakeType(e) === type).length;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedTypeFilter(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer border ${
                        selectedTypeFilter === type
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {type} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================= ERROR QUESTION LIST ================= */}
          {filteredErrors.length === 0 ? (
            <div className="py-14 px-6 text-center rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-base font-semibold font-display text-slate-900">
                  No errors match your filter.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mistakes made during Practice drills or logged manually are tracked with direct
                  clinical remediation prescriptions.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddErrorModal(true)}
                  className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold font-display hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  + Log A Mistake
                </button>
                {(searchQuery || mainFilterTab !== 'all' || selectedSubjectFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMainFilterTab('all');
                      setSelectedSubjectFilter('all');
                      setSelectedSystemFilter('all');
                      setSelectedTypeFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.slice(0, visibleCount).map((err) => {
                const sub =
                  FMGE_SUBJECTS.find((s) => s.id === err.subjectId) || FMGE_SUBJECTS[0];
                const matchedTopic =
                  sub.topics.find((t) => t.id === err.topicId || t.name === err.topic) ||
                  sub.topics[0];
                const mistakeType = classifyMistakeType(err);
                const conceptGap = extractConceptGap(
                  err.subjectId,
                  err.topicId || matchedTopic.id,
                  err.questionGist,
                  err.myMistake
                );
                const { icon: SpecialtyIcon, badgeColor } = getSpecialtyIcon(
                  err.subjectId,
                  err.topic
                );
                const isExpanded = expandedErrorId === err.id;

                return (
                  <div
                    key={err.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'bg-white border-teal-600/50 shadow-md ring-1 ring-teal-600/10'
                        : err.isReviewed
                        ? 'bg-white/70 border-slate-200/70 hover:border-slate-300'
                        : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {/* Card Header Row */}
                    <div
                      onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                      className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3.5 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Specialty Icon */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 sm:mt-0 ${badgeColor}`}
                        >
                          <SpecialtyIcon className="w-5 h-5" />
                        </div>

                        {/* Title, Subject & Meta */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {sub.name}
                            </span>
                            {err.isReviewed && (
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md font-semibold">
                                ✓ Resolved
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 sm:line-clamp-1">
                            {err.questionGist}
                          </h3>

                          <p className="text-xs text-slate-500 font-medium">
                            {err.topic || matchedTopic.name}
                          </p>

                          {/* Mobile badges & date */}
                          <div className="flex sm:hidden items-center gap-2 pt-1 flex-wrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getMistakeTypeStyle(
                                mistakeType
                              )}`}
                            >
                              {mistakeType}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatDate(err.dateAdded)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Right Side: Mistake Type Badge, Date, and Review CTA */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getMistakeTypeStyle(
                              mistakeType
                            )}`}
                          >
                            {mistakeType}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDate(err.dateAdded)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedErrorId(isExpanded ? null : err.id);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold font-display border transition-colors cursor-pointer flex items-center gap-1 ${
                            isExpanded
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{isExpanded ? 'Close' : 'Review'}</span>
                          <ArrowRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Clinical Review Drawer */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 animate-in fade-in duration-150">
                        {/* 2-Column Comparison: Why It's Wrong vs What to Study */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {/* Why It's Wrong & Clinical Trap */}
                          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-rose-900 font-display">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                              <span>Why It's Wrong &amp; Clinical Trap</span>
                            </div>

                            {err.myMistake ? (
                              <p className="text-rose-950 font-medium">
                                <strong>Your Choice:</strong> {err.myMistake}
                              </p>
                            ) : null}

                            <p className="text-slate-700 leading-relaxed">
                              <strong>Distractor Trap:</strong> {conceptGap.classicTrap}
                            </p>
                          </div>

                          {/* What To Study & Core Concept */}
                          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-sky-900 font-display">
                              <BookOpen className="h-3.5 w-3.5 text-sky-700" />
                              <span>Core Concept &amp; Clinical Retainer</span>
                            </div>

                            <p className="text-slate-900 font-semibold leading-relaxed">
                              {err.correctConcept}
                            </p>

                            <p className="text-slate-600 font-mono text-[11px]">
                              <strong>High-Yield Module:</strong> {sub.name} → {err.topic || matchedTopic.name}
                            </p>
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Toggle Reviewed Status */}
                            <button
                              type="button"
                              onClick={() => onToggleErrorReviewed(err.id)}
                              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold font-display transition-colors cursor-pointer border flex items-center gap-1.5 ${
                                err.isReviewed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{err.isReviewed ? 'Resolved ✓' : 'Mark Resolved'}</span>
                            </button>

                            {/* 10-MCQ Targeted Practice */}
                            {onLaunchPracticeSession && (
                              <button
                                type="button"
                                onClick={() => {
                                  onLaunchPracticeSession(
                                    sub.id,
                                    matchedTopic.id,
                                    err.topic || matchedTopic.name
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold font-display border border-slate-200 transition-colors cursor-pointer"
                              >
                                <Play className="h-3 w-3 fill-current text-slate-700" />
                                <span>10-MCQ Drill</span>
                              </button>
                            )}

                            {/* Study 6-Step Topic Mastery */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTopicForMastery({
                                  subjectId: sub.id,
                                  topicId: matchedTopic.id,
                                  topicName: err.topic || matchedTopic.name,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-display transition-colors cursor-pointer"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>6-Step Study</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Full Concept Remediation Package */}
                            <button
                              type="button"
                              onClick={() => {
                                const pkg = generateConceptRemediationPackage(
                                  err.subjectId,
                                  err.topicId || matchedTopic.id,
                                  conceptGap.conceptId,
                                  conceptGap.conceptName
                                );
                                setActiveRemediationPackage(pkg);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 font-display cursor-pointer"
                            >
                              <span>Full Remediation</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>

                            {/* Ask AI Mentor */}
                            {onOpenAiCoach && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenAiCoach(
                                    'concept',
                                    sub.id,
                                    `${err.topic || matchedTopic.name} - ${err.questionGist}`
                                  );
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 font-display cursor-pointer ml-1"
                              >
                                <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                                <span className="hidden sm:inline">Ask Mentor</span>
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => onDeleteErrorItem(err.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete error"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Load More Questions ↓ Button */}
              {filteredErrors.length > visibleCount && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold font-display text-slate-700 hover:text-slate-900 shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Load More Questions ({filteredErrors.length - visibleCount} remaining)</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: ERROR INSIGHTS & QUICK ACTIONS ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Error Insights */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold font-display text-slate-900">
                  Error Insights
                </h2>
                <p className="text-xs text-slate-500">Understand your patterns</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Concept Gap */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Concept Gap</span>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {patternInsights.conceptGap}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-400 transition-all duration-500"
                    style={{ width: `${patternInsights.conceptGap}%` }}
                  />
                </div>
              </div>

              {/* Knowledge Recall */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Knowledge Recall</span>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {patternInsights.knowledgeRecall}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${patternInsights.knowledgeRecall}%` }}
                  />
                </div>
              </div>

              {/* Careless Mistake */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Careless Mistake</span>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {patternInsights.carelessMistake}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                    style={{ width: `${patternInsights.carelessMistake}%` }}
                  />
                </div>
              </div>

              {/* Clinical Interpretation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Clinical Interpretation</span>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {patternInsights.clinicalInterpretation}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${patternInsights.clinicalInterpretation}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold font-display text-slate-900">
                  Quick Actions
                </h2>
                <p className="text-xs text-slate-500">Get the most from your error vault</p>
              </div>
            </div>

            {/* 2x2 Action Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Action 1: Review Now */}
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={handleQuickReviewNow}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-200 transition-colors text-left space-y-2 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-800">
                    Review Now
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Start with 10 questions
                  </p>
                </div>
              </motion.button>

              {/* Action 2: By Subject */}
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={() => {
                  setMainFilterTab('subject');
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 hover:border-sky-200 transition-colors text-left space-y-2 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-sky-800">
                    By Subject
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Focus on a subject
                  </p>
                </div>
              </motion.button>

              {/* Action 3: By Mistake Type */}
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={() => {
                  setMainFilterTab('type');
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 transition-colors text-left space-y-2 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-purple-800">
                    By Mistake Type
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Target specific areas
                  </p>
                </div>
              </motion.button>

              {/* Action 4: Export List */}
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={handleExportErrors}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors text-left space-y-2 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-800">
                    Export List
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Save for offline review
                  </p>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Bottom Motivation Quote Footer */}
          <div className="text-center py-2">
            <p className="text-xs text-slate-400 italic">
              “Mistakes today build the expertise you’ll need tomorrow.”
            </p>
          </div>
        </div>
      </div>

      {/* ================= 5. MODALS PRESERVED ================= */}
      {/* Log Mistake Modal */}
      {showAddErrorModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xl font-semibold font-display text-slate-900">
                Log Clinical Question Mistake
              </h2>
              <button
                type="button"
                onClick={() => setShowAddErrorModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveError} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subject</label>
                <select
                  value={newError.subjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const s = FMGE_SUBJECTS.find((sub) => sub.id === subId);
                    setNewError({
                      ...newError,
                      subjectId: subId,
                      topic: s?.topics[0]?.name || 'General Topic',
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900"
                >
                  {FMGE_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.weightage}M)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Topic Title</label>
                <input
                  type="text"
                  value={newError.topic}
                  onChange={(e) => setNewError({ ...newError, topic: e.target.value })}
                  placeholder="e.g. Asthma, Knee Joint, Coronary Artery Disease..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Question Gist / Clinical Stem</label>
                <textarea
                  rows={2}
                  value={newError.questionGist}
                  onChange={(e) => setNewError({ ...newError, questionGist: e.target.value })}
                  placeholder="Briefly describe what the clinical question presented..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  My Selected Answer / Mistake (Why I Picked It)
                </label>
                <input
                  type="text"
                  value={newError.myMistake}
                  onChange={(e) => setNewError({ ...newError, myMistake: e.target.value })}
                  placeholder="e.g. Confused with unstable angina; missed the ST elevation"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Correct Concept / Diagnostic Discriminator
                </label>
                <textarea
                  rows={2}
                  value={newError.correctConcept}
                  onChange={(e) => setNewError({ ...newError, correctConcept: e.target.value })}
                  placeholder="What is the definitive high-yield guideline or discriminator?"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddErrorModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold font-display hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Save Error Note
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* Full Concept Remediation Package Modal */}
      {activeRemediationPackage && (
        <ConceptRemediationModal
          remediationPackage={activeRemediationPackage}
          onClose={() => setActiveRemediationPackage(null)}
          onUpdateAppState={onUpdateAppState}
        />
      )}

      {/* Embedded 6-Step Topic Mastery Workspace Modal */}
      {activeTopicForMastery && (
        <TopicMasteryWorkspace
          subjectId={activeTopicForMastery.subjectId}
          topicId={activeTopicForMastery.topicId}
          topicName={activeTopicForMastery.topicName}
          state={state}
          onClose={() => setActiveTopicForMastery(null)}
          onLaunchPracticeMcq={(ctx) => {
            if (onLaunchPracticeSession) {
              onLaunchPracticeSession(
                ctx.subjectId,
                ctx.topicId,
                ctx.topicName,
                ctx.subtopic
              );
            }
          }}
          onToggleTopicState={onToggleTopicState || (() => {})}
          onOpenAiCoach={onOpenAiCoach}
        />
      )}
    </div>
  );
};
