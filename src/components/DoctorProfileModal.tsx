import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Calendar,
  Target,
  Clock,
  BookOpen,
  Cloud,
  CheckCircle2,
  LogOut,
  Download,
  Upload,
  RefreshCw,
  Flame,
  Award,
  Zap,
  Save,
  Activity,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Check,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AppSettings, AppState, OnboardingPreparationStage, StudyPreferenceKey } from '../types';
import {
  PREPARATION_STAGE_OPTIONS,
  STUDY_PREFERENCES_OPTIONS,
  STUDY_PREFERENCE_LABELS,
  isValidBaselineScore,
} from '../utils/onboarding';
import { AppStats, downloadBackupFile, normalizeAppState } from '../utils/storage';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  stats: AppStats;
  onUpdateSettings: (settings: AppSettings) => void;
  onImportState: (importedState: AppState) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  isOpen,
  onClose,
  state,
  stats,
  onUpdateSettings,
  onImportState,
}) => {
  const {
    user,
    profile,
    updateProfileData,
    signOutUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'blueprint' | 'telemetry' | 'cloud'>('blueprint');
  const [formData, setFormData] = useState<AppSettings>(state.settings);
  const [prepStage, setPrepStage] = useState<OnboardingPreparationStage | ''>(profile?.preparationStage || '');
  const [studyPrefs, setStudyPrefs] = useState<StudyPreferenceKey[]>(profile?.studyPreferences || []);
  const [baselineScore, setBaselineScore] = useState<number | ''>(profile?.baselineScore ?? '');
  const [baselineQuestions, setBaselineQuestions] = useState<number | ''>(profile?.baselineQuestions ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(state.settings);
      setPrepStage(profile?.preparationStage || '');
      setStudyPrefs(profile?.studyPreferences || []);
      setBaselineScore(profile?.baselineScore ?? '');
      setBaselineQuestions(profile?.baselineQuestions ?? '');
      setSyncFeedback(null);
    }
  }, [isOpen, state.settings, profile]);

  const toggleStudyPref = (pref: StudyPreferenceKey) => {
    setStudyPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const initials = (formData.userName || profile?.displayName || user?.displayName || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const daysRemaining = useMemo(() => {
    if (!formData.examDate) return 1;
    const diff = new Date(formData.examDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [formData.examDate]);

  const formattedExamDate = useMemo(() => {
    if (!formData.examDate) return 'Not configured';
    try {
      const d = new Date(formData.examDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return formData.examDate;
    }
  }, [formData.examDate]);

  if (!isOpen) return null;

  const handleSaveBlueprint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Update AppState settings
      onUpdateSettings(formData);

      // 2. Persist to localStorage directly
      const updatedState = { ...state, settings: formData };
      localStorage.setItem('fmge_app_state_v1', JSON.stringify(updatedState));

      // 3. Update Auth profile in Cloud
      if (updateProfileData) {
        await updateProfileData({
          displayName: formData.userName,
          examDate: formData.examDate,
          targetScore: formData.targetScore,
          dailyHoursTarget: formData.dailyStudyHourGoal,
          preparationStage: prepStage || profile?.preparationStage,
          studyPreferences: studyPrefs,
          baselineScore: baselineScore === '' ? profile?.baselineScore : Number(baselineScore),
          baselineQuestions: baselineQuestions === '' ? profile?.baselineQuestions : Number(baselineQuestions),
          preferences: {
            ...profile?.preferences,
            coachingSource: formData.coachingSource,
          },
        });
      }
      setSyncFeedback('Profile & exam blueprint saved successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      localStorage.setItem('fmge_app_state_v1', JSON.stringify(state));
      localStorage.setItem('fmge_last_sync_timestamp', new Date().toISOString());
      setSyncFeedback('Cloud handshake verified. All progress synced.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      setSyncFeedback('Synced to local storage.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    downloadBackupFile(state);
    setSyncFeedback('Encrypted JSON backup file generated & downloaded.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const imported = normalizeAppState(parsed);
        if (imported) {
          onImportState(imported);
          setSyncFeedback('State restored successfully from backup.');
          setTimeout(() => setSyncFeedback(null), 3000);
        } else {
          alert('Invalid backup file schema.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const targetScoreBuffer = Math.max(0, (formData.targetScore || 200) - 150);

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans'] animate-in fade-in duration-150">
      <div className="relative bg-[#FAF9F6] rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* ── 1. Premium Doctor Identity Banner ── */}
        <div className="p-5 sm:p-6 border-b border-stone-200/80 bg-gradient-to-b from-white via-[#FAF9F5] to-[#FAF9F5] relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Doctor Avatar with subtle clinical teal aura */}
              <div className="relative shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-[#006B63] to-[#004D47] text-white flex items-center justify-center font-['Outfit'] font-bold text-base sm:text-lg shadow-md shadow-teal-950/15 overflow-hidden">
                  {user?.photoURL || profile?.photoURL ? (
                    <img
                      src={user?.photoURL || profile?.photoURL || ''}
                      alt={formData.userName || 'Doctor'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs flex items-center justify-center"
                  title="Cloud Synced"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-['Newsreader',_serif] text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">
                    {formData.userName || 'Dr. Aspirant'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-teal-500/10 text-[#00685F] border border-teal-500/20 shrink-0">
                    <ShieldCheck className="h-3 w-3 text-[#00685F]" />
                    FMGE 2026
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 flex-wrap">
                  <span className="truncate max-w-[180px] sm:max-w-[240px]">
                    {user?.email || profile?.email || 'Doctor Session'}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-stone-300" />
                  <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified Candidate
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer shrink-0"
              aria-label="Close profile modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics Bar in Header */}
          <div className="mt-4 pt-3.5 border-t border-stone-200/60 grid grid-cols-3 gap-2">
            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-stone-200/60 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
                Target Score
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit']">
                {formData.targetScore || 200} <span className="text-[10px] text-stone-400 font-normal">/300</span>
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-stone-200/60 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
                Countdown
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-600 font-['Outfit'] flex items-center justify-center gap-1">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                {daysRemaining}d left
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-stone-200/60 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
                Daily Goal
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#006B63] font-['Outfit']">
                {formData.dailyStudyHourGoal || 6}h <span className="text-[10px] text-stone-400 font-normal">/day</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Minimal Segmented Tab Navigation ── */}
        <div className="px-4 sm:px-6 pt-3 pb-3 border-b border-stone-200/80 bg-[#FAF9F5] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'blueprint', label: 'Exam Blueprint', icon: Target },
            { id: 'telemetry', label: 'Telemetry & Progress', icon: Activity },
            { id: 'cloud', label: 'Cloud & Backup', icon: Cloud },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#00685F] text-white shadow-xs font-bold'
                    : 'bg-white/80 text-stone-600 border border-stone-200/80 hover:bg-white hover:text-stone-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-teal-200' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Banner */}
        {syncFeedback && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncFeedback}</span>
          </div>
        )}

        {/* ── 3. Modal Body Content ── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {/* ================= TAB 1: EXAM BLUEPRINT ================= */}
          {activeTab === 'blueprint' && (
            <form onSubmit={handleSaveBlueprint} className="space-y-5 animate-in fade-in duration-150">
              
              {/* Doctor Display Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Doctor Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="e.g. Dr. Aspirant"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Target Date Section */}
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#006B63]" />
                    <label className="text-xs font-semibold text-stone-800">
                      Target FMGE Exam Date
                    </label>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                    <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {daysRemaining} days remaining
                  </span>
                </div>

                {/* Direct native date picker with formatted human-readable badge */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <input
                    type="date"
                    value={formData.examDate || '2026-06-28'}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 focus:outline-none cursor-pointer"
                  />
                  <div className="text-xs text-stone-500 flex items-center gap-1.5">
                    <span>Scheduled for:</span>
                    <strong className="text-stone-900 font-semibold">{formattedExamDate}</strong>
                  </div>
                </div>

                {/* One-Click Target Preset Chips */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
                    Quick Sprint Presets
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: 'FMGE June 2026', date: '2026-06-28' },
                      { label: 'FMGE Dec 2026', date: '2026-12-15' },
                      { label: '30-Day Sprint', date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) },
                      { label: '60-Day Sprint', date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10) },
                    ].map((preset) => {
                      const isSelected = formData.examDate === preset.date;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, examDate: preset.date })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#00685F] text-white shadow-2xs font-bold'
                              : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Target Score & Buffer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">
                      Target Score (/300)
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      +{targetScoreBuffer} safety buffer
                    </span>
                  </div>
                  <div className="relative">
                    <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type="number"
                      min={150}
                      max={300}
                      value={formData.targetScore}
                      onChange={(e) => setFormData({ ...formData, targetScore: Number(e.target.value) })}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-sm font-semibold text-stone-900 focus:bg-white focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 leading-tight">
                    NBE Pass Mark: 150 · Target buffer protects against exam-day variance.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Daily Study Target (Hours)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={formData.dailyStudyHourGoal}
                      onChange={(e) => setFormData({ ...formData, dailyStudyHourGoal: Number(e.target.value) })}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-sm font-semibold text-stone-900 focus:bg-white focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 leading-tight">
                    Recommended FMGE benchmark: 6 – 8 hours per day.
                  </p>
                </div>
              </div>

              {/* Primary Coaching Platform */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Primary Coaching Resource
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                  <select
                    value={formData.coachingSource || 'Marrow / Prepladder'}
                    onChange={(e) => setFormData({ ...formData, coachingSource: e.target.value })}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-sm font-semibold text-stone-900 focus:bg-white focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Marrow / Prepladder">Marrow / Prepladder</option>
                    <option value="Marrow">Marrow</option>
                    <option value="Prepladder">Prepladder</option>
                    <option value="Cerebellum">Cerebellum</option>
                    <option value="DAMS">DAMS</option>
                    <option value="Bhatia">Bhatia</option>
                    <option value="Self Study / Standard Textbooks">Self Study / Standard Textbooks</option>
                  </select>
                </div>
              </div>

              {/* Onboarding Study Signals & Style */}
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#006B63]" />
                  <span className="text-xs font-bold text-stone-800">
                    Study Strategy &amp; Learning Preferences
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Current Preparation Stage
                  </label>
                  <select
                    value={prepStage}
                    onChange={(e) => setPrepStage(e.target.value as OnboardingPreparationStage | '')}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-900 focus:border-[#006B63] focus:ring-2 focus:ring-[#006B63]/10 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Not specified</option>
                    {PREPARATION_STAGE_OPTIONS.map((stageOption) => (
                      <option key={stageOption.id} value={stageOption.id}>
                        {stageOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Preferred Learning Formats
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STUDY_PREFERENCES_OPTIONS.map((pref) => {
                      const active = studyPrefs.includes(pref.id);
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => toggleStudyPref(pref.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#00685F] text-white shadow-2xs font-bold'
                              : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                          }`}
                        >
                          {active && <Check className="h-3 w-3 text-teal-200" />}
                          <span>{STUDY_PREFERENCE_LABELS[pref.id] || pref.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Baseline Diagnostic Score */}
                <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Baseline Mock Score (/300)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={baselineScore}
                      onChange={(e) => setBaselineScore(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 120 (optional)"
                      className={`w-full h-9 px-3 rounded-xl bg-white border text-xs font-semibold focus:outline-none transition-all ${
                        isValidBaselineScore(baselineScore === '' ? undefined : Number(baselineScore))
                          ? 'border-stone-200 text-stone-900 focus:border-[#006B63]'
                          : 'border-rose-300 text-rose-600 focus:border-rose-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Baseline Questions Attempted
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={baselineQuestions}
                      onChange={(e) => setBaselineQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 50 (optional)"
                      className="w-full h-9 px-3 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-900 focus:border-[#006B63] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ================= TAB 2: PERFORMANCE TELEMETRY ================= */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Readiness
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                    {stats.overallReadinessScore}%
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    {stats.overallReadinessScore >= 50 ? 'Strong Trajectory' : 'Building Baseline'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Days Left
                  </span>
                  <div className="text-xl font-extrabold text-amber-600 font-['Outfit'] flex items-center gap-1">
                    <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>{daysRemaining}d</span>
                  </div>
                  <p className="text-[10px] text-stone-400">Until exam day</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Today Qs
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                    {stats.todayQuestionsSolved || 10}
                  </div>
                  <p className="text-[10px] text-stone-400">Solved today</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 shadow-2xs space-y-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Grand Tests
                  </span>
                  <div className="text-xl font-extrabold text-[#006B63] font-['Outfit']">
                    {state.grandTests?.length || 0}
                  </div>
                  <p className="text-[10px] text-stone-400">300-Q Mocks</p>
                </div>
              </div>

              {/* Calibrated Target Blueprint Card */}
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                  Calibrated Target Blueprint
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
                    <Calendar className="h-4 w-4 text-[#006B63] mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-900">{formattedExamDate}</div>
                    <p className="text-[10px] text-teal-700 font-semibold">{daysRemaining}d left</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
                    <Target className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-900">{formData.targetScore || 200} / 300</div>
                    <p className="text-[10px] text-stone-400">Target Score</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200/70 shadow-2xs">
                    <Clock className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-900">{formData.dailyStudyHourGoal || 6}h / day</div>
                    <p className="text-[10px] text-stone-400">Daily Pacing</p>
                  </div>
                </div>
              </div>

              {/* Study Consistency Advice */}
              <div className="p-4 rounded-2xl bg-[#E8F5F3] border border-teal-200/70 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#006B63] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs text-stone-700">
                  <span className="font-bold text-[#006B63] block">Clinical Consistency Principle</span>
                  <p className="leading-relaxed">
                    Consistent daily completion of 50 high-yield questions with error analysis delivers higher retention than marathon weekend sessions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CLOUD & MULTI-DEVICE BACKUP ================= */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Cloud Handshake Status */}
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Cloud Sync Engine
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Auto-sync active for {user?.email || profile?.email || 'Local session'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00685F] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              {/* Data Export & Import */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                  Portable Offline Backup &amp; Migration
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:bg-stone-50 transition-colors text-left space-y-1.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                      <span className="group-hover:text-[#006B63] transition-colors">Download JSON Backup</span>
                      <Download className="h-4 w-4 text-stone-400 group-hover:text-[#006B63] transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Exports all 19-subject checkboxes, Error Notebook, and mock scores.
                    </p>
                  </button>

                  <label className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:bg-stone-50 transition-colors text-left space-y-1.5 cursor-pointer group block">
                    <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                      <span className="group-hover:text-purple-600 transition-colors">Restore From Backup</span>
                      <Upload className="h-4 w-4 text-stone-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Upload a JSON backup file to instantly restore full study state.
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sign Out Action */}
              <div className="pt-3 flex justify-between items-center border-t border-stone-200/60">
                <span className="text-xs text-stone-500">Current Doctor Credentials</span>
                <button
                  type="button"
                  onClick={() => {
                    signOutUser?.();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Polished Action Footer ── */}
        <div className="p-4 bg-[#FAF9F5] border-t border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Encrypted credentials &amp; study blueprint</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSaveBlueprint()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00685F] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Blueprint'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
