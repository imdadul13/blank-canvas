import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Settings,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Brain,
  Cloud,
  User,
  ShieldCheck,
  Database,
  BookOpen,
  Target,
  Clock,
  Activity,
  CheckCircle2,
  Download,
  Sun,
  Moon,
  Sparkles,
  Award,
  ChevronDown,
} from 'lucide-react';
import { AppState, ErrorNotebookItem, DailyTask, DailyStudyLog, MedicalPearl } from '../types';
import { AppStats, downloadBackupFile } from '../utils/storage';
import { TelegramHubView } from './TelegramHubView';
import { ActiveTab } from './Navbar';

interface MoreViewProps {
  state: AppState;
  stats: AppStats;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  onOpenCloudSync?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenAiCoach?: (
    initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy',
    subjectId?: string,
    topicName?: string
  ) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
  onToggleErrorReviewed?: (id: string) => void;
  onDeleteErrorItem?: (id: string) => void;
  onUpdateAppState?: (updater: (prev: AppState) => AppState) => void;
  onAddTask?: (task: DailyTask) => void;
  onToggleTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateDailyLog?: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
  onToggleBookmark?: (pearlId: string) => void;
  onAddCustomPearl?: (pearl: MedicalPearl) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string
  ) => void;
  onSelectSubject?: (subjectId: string) => void;
}

type MoreSection = 'hub' | 'telegram';

function activateDirectoryCardWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
  }
}

export const MoreView: React.FC<MoreViewProps> = ({
  state,
  stats,
  onOpenSettings,
  onOpenProfile,
  onOpenCloudSync,
  onNavigateTab,
  onOpenAiCoach,
  onAddErrorItem,
  onUpdateAppState,
}) => {
  const [activeSection, setActiveSection] = useState<MoreSection>('hub');
  const [isBlueprintExpanded, setIsBlueprintExpanded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const targetScore = state.settings?.targetScore || 180;

  const handleExportBackup = () => {
    downloadBackupFile(state);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  };

  const currentThemeMode = state.settings?.bgTheme || 'auto';
  const themeLabel =
    currentThemeMode === 'morning'
      ? 'Morning Daylight'
      : currentThemeMode === 'sunset'
      ? 'Sunset Amber'
      : currentThemeMode === 'night'
      ? 'Night Indigo'
      : 'Auto Circadian';

  return (
    <div
      data-accent="home"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 pb-24 sm:pb-20 lg:pb-16 font-sans text-slate-900"
    >
      {/* Back button if in sub-section */}
      {activeSection !== 'hub' && (
        <div className="pb-1">
          <button
            type="button"
            onClick={() => setActiveSection('hub')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to System Directory</span>
          </button>
        </div>
      )}

      {/* VIEW: MAIN HUB */}
      {activeSection === 'hub' && (
        <div className="space-y-6">
          {/* ================= DOCTOR CANDIDATE IDENTITY & SYSTEM HERO ================= */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="premium-page-hero relative rounded-[2rem] overflow-hidden bg-white border border-[rgba(60,60,67,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 sm:p-7"
          >
            {/* Soft Ambient Background Highlights */}
            <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gradient-to-br from-[#007AFF]/10 via-[#5856D6]/5 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 size-72 rounded-full bg-gradient-to-tr from-[#10B981]/8 via-[#0284C7]/5 to-transparent blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Doctor Monogram & Credential Profile */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-br from-[#007AFF] via-[#3875FF] to-[#5856D6] flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-sm shrink-0 ring-4 ring-[#007AFF]/10">
                  <User className="size-7 sm:size-8 stroke-[2.2]" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F]">
                      Study tools &amp; settings
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#10B981]/10 text-[#059669] border border-[#10B981]/25">
                      <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      Your study workspace
                    </span>
                  </div>

                  <p className="text-[12.5px] sm:text-[13px] text-[#6E6E73] font-medium leading-relaxed">
                    Practice tools, account details, and app preferences in one place.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[12px] font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <User className="size-3.5 text-[#007AFF]" />
                    <span>Candidate Profile</span>
                  </button>
                )}

                {onOpenCloudSync && (
                  <button
                    type="button"
                    onClick={onOpenCloudSync}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-[12px] font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Cloud className="size-3.5 text-[#5856D6]" />
                    <span>Cloud Sync</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white text-[12px] font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Settings className="size-3.5 stroke-[2.4]" />
                  <span>Preferences</span>
                </button>
              </div>
            </div>
          </motion.header>

          {/* ================= iOS SETTINGS GROUPED INSET DIRECTORY ================= */}
          <div className="space-y-6">
            {/* GROUP 1: CLINICAL PRACTICE & SIMULATION */}
            <div className="space-y-3">
              <div className="px-1 text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                Study &amp; practice
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Grand Tests Item */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onNavigateTab?.('grandtests')}
                  role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                  className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#EEF2FF] via-[#F8FAFF] to-white border border-[#C7D2FE]/70 hover:border-[#818CF8]/80 shadow-[0_4px_20px_rgba(79,70,229,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#5856D6] to-[#4338CA] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(88,86,214,0.30)] group-hover:scale-[1.06] transition-transform">
                      <GraduationCap className="size-6 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5856D6]/10 text-[#5856D6] text-[11px] font-mono font-bold border border-[#5856D6]/20">
                      300 Qs · 300 Min
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#5856D6] transition-colors leading-snug">
                      Grand Tests &amp; Mock Exam Simulator
                    </h3>
                    <p className="text-[12px] text-[#6E6E73] font-medium leading-relaxed">
                      Full 300-question timed CBT simulation with Paper 1/Paper 2 balance analytics.
                    </p>
                  </div>

                  <div className="flex items-center text-[12px] font-semibold text-[#5856D6] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Launch Simulator</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>

                {/* Telegram Hub Item */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => (onNavigateTab ? onNavigateTab('telegram') : setActiveSection('telegram'))}
                  role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                  className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#EFF8FF] via-[#F8FAFF] to-white border border-[#BAE6FD]/70 hover:border-[#38BDF8]/80 shadow-[0_4px_20px_rgba(2,132,199,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(2,132,199,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(2,132,199,0.30)] group-hover:scale-[1.06] transition-transform">
                      <Send className="size-5 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0284C7]/10 text-[#0284C7] text-[11px] font-mono font-bold border border-[#0284C7]/20">
                      {state.telegramQuestions?.length || 0} Questions
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#0284C7] transition-colors leading-snug">
                      Telegram Medical Wire &amp; Recall Hub
                    </h3>
                    <p className="text-[12px] text-[#6E6E73] font-medium leading-relaxed">
                      Curated peer channel questions, clinical spotters, and high-noise filtering.
                    </p>
                  </div>

                  <div className="flex items-center text-[12px] font-semibold text-[#0284C7] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Medical Wire</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>

                {/* Faculty Mentor Launcher */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    if (onOpenAiCoach) {
                      onOpenAiCoach('strategy');
                    } else if (onNavigateTab) {
                      onNavigateTab('aicoach');
                    }
                  }}
                  role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                  className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#FAF5FF] via-[#FDFBFF] to-white border border-[#E9D5FF]/70 hover:border-[#C084FC]/80 shadow-[0_4px_20px_rgba(168,85,247,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,122,255,0.30)] group-hover:scale-[1.06] transition-transform">
                      <Brain className="size-5 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-mono font-bold border border-[#007AFF]/20">
                      NBE Grounded
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                      Clinical Faculty Mentor
                    </h3>
                    <p className="text-[12px] text-[#6E6E73] font-medium leading-relaxed">
                      Differential diagnosis consultations, bedside vivas, and weak topic remediation.
                    </p>
                  </div>

                  <div className="flex items-center text-[12px] font-semibold text-[#007AFF] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Consult Mentor</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* GROUP 2: DOCTOR IDENTITY & DATA BACKUP */}
            <div className="space-y-3">
              <div className="px-1 text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                Account &amp; data
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Candidate Profile */}
                {onOpenProfile && (
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={onOpenProfile}
                    role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                    className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFF] to-white border border-[#BFDBFE]/70 hover:border-[#60A5FA]/80 shadow-[0_4px_20px_rgba(0,122,255,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,122,255,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="size-12 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#0256B3] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,122,255,0.30)] group-hover:scale-[1.06] transition-transform">
                        <User className="size-5 stroke-[2.2]" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-mono font-bold border border-[#007AFF]/20">
                        Target {targetScore}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                        Doctor Candidate Profile
                      </h3>
                      <p className="text-[12px] text-[#86868B] font-medium leading-relaxed">
                        NBE exam date countdown, target score calibration, and preparation timeline.
                      </p>
                    </div>

                    <div className="flex items-center text-[12px] font-semibold text-[#007AFF] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Edit Profile</span>
                      <ChevronRight className="size-3.5" />
                    </div>
                  </motion.div>
                )}

                {/* Cloud Sync */}
                {onOpenCloudSync && (
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={onOpenCloudSync}
                    role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                    className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#F0FDF4] via-[#F9FDFB] to-white border border-[#BBF7D0]/70 hover:border-[#4ADE80]/80 shadow-[0_4px_20px_rgba(16,185,129,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="size-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(16,185,129,0.30)] group-hover:scale-[1.06] transition-transform">
                        <Cloud className="size-5 stroke-[2.2]" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-mono font-bold border border-[#10B981]/20">
                        Cloud sync
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#10B981] transition-colors leading-snug">
                        Cloud sync
                      </h3>
                      <p className="text-[12px] text-[#86868B] font-medium leading-relaxed">
                        Keep your study data available across signed-in devices.
                      </p>
                    </div>

                    <div className="flex items-center text-[12px] font-semibold text-[#10B981] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Manage Sync</span>
                      <ChevronRight className="size-3.5" />
                    </div>
                  </motion.div>
                )}

                {/* Offline JSON Export */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleExportBackup}
                  role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                  className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#FFFBEB] via-[#FFFDF5] to-white border border-[#FDE68A]/70 hover:border-[#FBBF24]/80 shadow-[0_4px_20px_rgba(245,158,11,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.30)] group-hover:scale-[1.06] transition-transform">
                      <Download className="size-5 stroke-[2.2]" />
                    </div>
                    {downloadSuccess ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[11px] font-mono font-bold flex items-center gap-1 border border-[#10B981]/20">
                        <CheckCircle2 className="size-3" />
                        Saved!
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#D97706] text-[11px] font-mono font-bold border border-[#F59E0B]/20">
                        Download JSON
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#F59E0B] transition-colors leading-snug">
                      Download a backup
                    </h3>
                    <p className="text-[12px] text-[#86868B] font-medium leading-relaxed">
                      Save a copy of your study data to this device.
                    </p>
                  </div>

                  <div className="flex items-center text-[12px] font-semibold text-[#F59E0B] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Export Data</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* GROUP 3: SYSTEM PREFERENCES & ATMOSPHERE */}
            <div className="space-y-3">
              <div className="px-1 text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                App preferences
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* App Settings */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={onOpenSettings}
                  role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                  className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#F8FAFC] via-[#FCFDFE] to-white border border-[#CBD5E1]/70 hover:border-[#94A3B8]/80 shadow-[0_4px_20px_rgba(100,116,139,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(100,116,139,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#64748B] to-[#475569] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(100,116,139,0.30)] group-hover:scale-[1.06] transition-transform">
                      <Settings className="size-5 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#64748B]/10 text-[#475569] text-[11px] font-mono font-bold border border-[#64748B]/20">
                      Customize
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#64748B] transition-colors leading-snug">
                      Preferences &amp; Calibration
                    </h3>
                    <p className="text-[12px] text-[#86868B] font-medium leading-relaxed">
                      Target score, daily study hours, sound effects, and MCQ timer settings.
                    </p>
                  </div>

                  <div className="flex items-center text-[12px] font-semibold text-[#64748B] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Preferences</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>

                {/* Circadian Atmosphere Row */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={onOpenSettings}
                  role="button" tabIndex={0} onKeyDown={activateDirectoryCardWithKeyboard}
                  className="directory-card p-5 sm:p-6 rounded-[26px] bg-gradient-to-b from-[#FFF7ED] via-[#FFFBF7] to-white border border-[#FFEDD5]/70 hover:border-[#FB923C]/80 shadow-[0_4px_20px_rgba(249,115,22,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.12)] cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#EA580C] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(255,149,0,0.30)] group-hover:scale-[1.06] transition-transform">
                      <Sun className="size-5 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF9500]/10 text-[#EA580C] text-[11px] font-mono font-bold border border-[#FF9500]/20">
                      {themeLabel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-[#1D1D1F] group-hover:text-[#FF9500] transition-colors leading-snug">
                      Theme &amp; appearance
                    </h3>
                    <p className="text-[12px] text-[#86868B] font-medium leading-relaxed">
                      Choose a light, sunset, or night study background.
                    </p>
                  </div>

                  <div className="flex items-center text-[12px] font-semibold text-[#FF9500] gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Adjust Theme</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ================= NBE EXAM BLUEPRINT WEIGHTAGE OVERVIEW ================= */}
          <div className="rounded-[28px] bg-gradient-to-b from-[#F0F7FF] via-[#F8FBFF] to-white border border-[#D0E7FF]/80 shadow-[0_4px_24px_rgba(0,122,255,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-5 sm:p-7 space-y-4">
            <div
              onClick={() => setIsBlueprintExpanded((p) => !p)}
              role="button" tabIndex={0} aria-expanded={isBlueprintExpanded}
              onKeyDown={activateDirectoryCardWithKeyboard}
              className="flex items-center justify-between cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#007AFF]"
            >
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,122,255,0.30)] shrink-0">
                  <BookOpen className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1D1D1F]">
                    NBE Examination Blueprint &amp; Subject Weightage
                  </h3>
                  <p className="text-[12px] text-[#6E6E73] font-medium">
                    300 Questions · 300 Marks · No Negative Marking · 150 Marks Cutoff
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-[#007AFF] hidden sm:inline">
                  {isBlueprintExpanded ? 'Collapse' : 'Expand Blueprint'}
                </span>
                <div className={`size-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#1D1D1F] transition-transform duration-200 ${isBlueprintExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="size-4" />
                </div>
              </div>
            </div>

            {/* 3 Pillars Summary Always Visible */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/15 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#007AFF]">Pre-Clinical</span>
                  <span className="text-[11px] font-mono font-bold text-[#007AFF] bg-white px-2 py-0.5 rounded-full">
                    51 Qs (17%)
                  </span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">Anatomy, Physiology, Biochemistry</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#5856D6]/5 border border-[#5856D6]/15 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#5856D6]">Para-Clinical</span>
                  <span className="text-[11px] font-mono font-bold text-[#5856D6] bg-white px-2 py-0.5 rounded-full">
                    79 Qs (26.3%)
                  </span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">Pathology, Pharma, Micro, FMT, PSM</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#10B981]/5 border border-[#10B981]/15 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#10B981]">Clinical Disciplines</span>
                  <span className="text-[11px] font-mono font-bold text-[#10B981] bg-white px-2 py-0.5 rounded-full">
                    170 Qs (56.7%)
                  </span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73]">Medicine, Surgery, OBGYN, Peds, Minors</p>
              </div>
            </div>

            {/* Expanded Detailed Breakdown */}
            <AnimatePresence>
              {isBlueprintExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden pt-3 border-t border-[rgba(60,60,67,0.06)]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Pre-Clinical Detailed */}
                    <div className="p-3.5 rounded-2xl bg-[#FBFBFD] border border-black/[0.04] space-y-2">
                      <div className="text-[12px] font-bold text-[#1D1D1F] border-b border-black/[0.04] pb-1.5">
                        Pre-Clinical (51 Marks)
                      </div>
                      <ul className="text-[12px] text-[#6E6E73] space-y-1.5">
                        <li className="flex justify-between"><span>Anatomy</span><strong className="font-mono text-[#1D1D1F]">17 Qs</strong></li>
                        <li className="flex justify-between"><span>Physiology</span><strong className="font-mono text-[#1D1D1F]">17 Qs</strong></li>
                        <li className="flex justify-between"><span>Biochemistry</span><strong className="font-mono text-[#1D1D1F]">17 Qs</strong></li>
                      </ul>
                    </div>

                    {/* Para-Clinical Detailed */}
                    <div className="p-3.5 rounded-2xl bg-[#FBFBFD] border border-black/[0.04] space-y-2">
                      <div className="text-[12px] font-bold text-[#1D1D1F] border-b border-black/[0.04] pb-1.5">
                        Para-Clinical (79 Marks)
                      </div>
                      <ul className="text-[12px] text-[#6E6E73] space-y-1.5">
                        <li className="flex justify-between"><span>Pathology</span><strong className="font-mono text-[#1D1D1F]">13 Qs</strong></li>
                        <li className="flex justify-between"><span>Pharmacology</span><strong className="font-mono text-[#1D1D1F]">13 Qs</strong></li>
                        <li className="flex justify-between"><span>Microbiology</span><strong className="font-mono text-[#1D1D1F]">13 Qs</strong></li>
                        <li className="flex justify-between"><span>Forensic Medicine</span><strong className="font-mono text-[#1D1D1F]">10 Qs</strong></li>
                        <li className="flex justify-between"><span>PSM / Community Med</span><strong className="font-mono text-[#1D1D1F]">30 Qs</strong></li>
                      </ul>
                    </div>

                    {/* Clinical Detailed */}
                    <div className="p-3.5 rounded-2xl bg-[#FBFBFD] border border-black/[0.04] space-y-2">
                      <div className="text-[12px] font-bold text-[#1D1D1F] border-b border-black/[0.04] pb-1.5">
                        Clinical Disciplines (170 Marks)
                      </div>
                      <ul className="text-[12px] text-[#6E6E73] space-y-1.5">
                        <li className="flex justify-between"><span>General Medicine</span><strong className="font-mono text-[#1D1D1F]">33 Qs</strong></li>
                        <li className="flex justify-between"><span>General Surgery</span><strong className="font-mono text-[#1D1D1F]">32 Qs</strong></li>
                        <li className="flex justify-between"><span>Obstetrics &amp; Gynae</span><strong className="font-mono text-[#1D1D1F]">30 Qs</strong></li>
                        <li className="flex justify-between"><span>Paediatrics</span><strong className="font-mono text-[#1D1D1F]">15 Qs</strong></li>
                        <li className="flex justify-between"><span>Minor Specialties</span><strong className="font-mono text-[#1D1D1F]">60 Qs</strong></li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ================= APPLE PRIVACY & TELEMETRY FOOTER ================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#F2F2F7]/70 border border-black/[0.04] text-[11.5px] text-[#86868B]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#10B981]" />
              <span>Study data saves on this device and syncs when you sign in.</span>
            </div>
            <span className="font-mono text-[10.5px]">NBE CBT Standard Aligned</span>
          </div>
        </div>
      )}

      {/* VIEW: TELEGRAM HUB */}
      {activeSection === 'telegram' && (
        <TelegramHubView
          onAddToErrorNotebook={onAddErrorItem || (() => {})}
          onUpdateAppState={onUpdateAppState || (() => {})}
        />
      )}
    </div>
  );
};
