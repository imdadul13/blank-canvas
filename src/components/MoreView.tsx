import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  Settings,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  LayoutGrid,
  Brain,
  Cloud,
  User,
  ShieldCheck,
  Database,
  Sparkles,
  BookOpen,
  Target,
  Clock,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { AppState, ErrorNotebookItem, DailyTask, DailyStudyLog, MedicalPearl } from '../types';
import { AppStats } from '../utils/storage';
import { TelegramHubView } from './TelegramHubView';
import { ActiveTab } from './Navbar';
import { useCircadianTheme } from '../hooks/useCircadianTheme';
import { CircadianHeaderAtmosphere, CircadianPill } from './CircadianHeaderAtmosphere';
import { HeaderTabInsignia } from './HeaderTabInsignia';
import { CircadianFocusDropdown } from './CircadianFocusDropdown';
import { HeaderGlassIcon } from './HeaderGlassIcon';

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
  const circadian = useCircadianTheme(state.settings?.bgTheme);
  const [activeSection, setActiveSection] = useState<MoreSection>('hub');

  const utilityItems = [
    {
      id: 'grandtests',
      title: 'Grand Tests (Mock Exam)',
      subtitle: 'Simulate full 300-question timed NBE examination with analytics.',
      badge: '300 Qs · 300 Min',
      icon: GraduationCap,
      action: () => onNavigateTab?.('grandtests'),
    },
    {
      id: 'telegram',
      title: 'Telegram Hub',
      subtitle: 'Curated question feeds and real-time clinical discussions.',
      badge: `${state.telegramQuestions?.length || 0} Questions`,
      icon: Send,
      action: () => (onNavigateTab ? onNavigateTab('telegram') : setActiveSection('telegram')),
    },
    {
      id: 'settings',
      title: 'Settings & Preferences',
      subtitle: 'Exam target score, daily study hours, and display preferences.',
      badge: `Target: ${state.settings?.targetScore || 180}/300`,
      icon: Settings,
      action: () => onOpenSettings(),
    },
  ];

  return (
    <div className="page-container space-y-8 font-sans text-slate-900">
      {/* Back button if in sub-section */}
      {activeSection !== 'hub' && (
        <div className="pb-2">
          <button
            type="button"
            onClick={() => setActiveSection('hub')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold font-display border border-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Utilities Directory</span>
          </button>
        </div>
      )}

      {/* VIEW: MAIN HUB */}
      {activeSection === 'hub' && (
        <div className="space-y-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`relative rounded-3xl border p-4 sm:px-6 sm:py-3.5 shadow-xs transition-colors duration-700 ${circadian.bannerBg} ${circadian.cardBorder}`}
          >
            <CircadianHeaderAtmosphere circadian={circadian} />

            <div className="relative z-10 space-y-3">
              {/* Top Utility Row */}
              <div className={`flex items-center justify-between gap-2 pb-2.5 border-b ${
                circadian.isNight ? 'border-sky-800/60' : 'border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.2em] uppercase ${
                    circadian.isNight ? 'text-teal-300' : 'text-teal-700'
                  }`}>
                    TOOLS • CONFIGURE • OPTIMIZE
                  </span>
                  <span className={`hidden sm:inline ${circadian.isNight ? 'text-sky-800' : 'text-slate-300'}`}>|</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono tracking-wider uppercase border shadow-2xs ${circadian.badgeBg} ${circadian.badgeBorder} ${circadian.badgeText}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    System Directory
                  </span>
                </div>

                <div className="shrink-0">
                  <CircadianFocusDropdown circadian={circadian} />
                </div>
              </div>

              {/* Main Header Content */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <HeaderGlassIcon
                    icon={LayoutGrid}
                    variant="slate"
                    isNight={circadian.isNight}
                  />

                  <div className="space-y-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight font-['Outfit'] leading-tight">
                      <span className={circadian.isNight ? 'text-teal-300' : 'text-[#005B54]'}>CLINICAL </span>
                      <span className={circadian.isNight ? 'text-white' : 'text-slate-950'}>UTILITIES &amp; SERVICES</span>
                    </h1>

                    <p className={`text-xs sm:text-sm leading-relaxed ${circadian.isNight ? 'text-slate-200' : 'text-slate-700 font-semibold'}`}>
                      Grand test mock exams, Telegram clinical feed, cloud telemetry synchronization, and application preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Directory of Hub Items */}
          <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,107,99,0.04)]">
            {utilityItems.map(({ id, title, subtitle, badge, icon: Icon, action }) => {
              const squircleClass =
                id === 'grandtests'
                  ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs shadow-sky-500/25'
                  : id === 'telegram'
                  ? 'bg-gradient-to-tr from-blue-400 to-sky-600 text-white shadow-xs shadow-blue-500/25'
                  : 'bg-gradient-to-tr from-slate-600 to-slate-800 text-white shadow-xs shadow-slate-600/25';

              return (
                <div
                  key={id}
                  onClick={action}
                  className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${squircleClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="text-base font-semibold font-display text-slate-900 group-hover:text-[#006B63] transition-colors">
                        {title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                    <span className="px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-700 text-xs font-mono font-semibold shadow-2xs">
                      {badge}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= HIGH-YIELD CLINICAL TOOLS LAUNCHPAD ================= */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              <span>Rapid Clinical Launchpad</span>
              <span>Essential Doctor Utilities</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Tool 1: AI Clinical Tutor */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => onOpenAiCoach?.('concept')}
                className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-teal-500/[0.06] via-white to-emerald-500/[0.02] border border-teal-200/80 shadow-[0_4px_18px_rgba(13,148,136,0.04)] hover:shadow-[0_8px_24px_rgba(13,148,136,0.12)] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shadow-teal-500/25 group-hover:scale-105 transition-transform">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                    AI TUTOR
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold font-display text-slate-900 group-hover:text-[#006B63] transition-colors">
                    Clinical Concept Tutor
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Differential diagnoses, pathognomonic triads, and rapid high-yield explanations.
                  </p>
                </div>
              </motion.div>

              {/* Tool 2: Candidate Profile */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => onOpenProfile?.()}
                className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-indigo-500/[0.06] via-white to-purple-500/[0.02] border border-indigo-200/80 shadow-[0_4px_18px_rgba(99,102,241,0.04)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80">
                    CANDIDATE
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold font-display text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Doctor Profile & Target
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Target NBE score, examination date countdown, and academic status.
                  </p>
                </div>
              </motion.div>

              {/* Tool 3: Cloud Synchronization Vault */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => onOpenCloudSync?.()}
                className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-sky-500/[0.06] via-white to-blue-500/[0.02] border border-sky-200/80 shadow-[0_4px_18px_rgba(14,165,233,0.04)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs shadow-sky-500/25 group-hover:scale-105 transition-transform">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200/80">
                    SYNC VAULT
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold font-display text-slate-900 group-hover:text-sky-600 transition-colors">
                    Encrypted Cloud Sync
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    End-to-end telemetry backup across study devices with zero data leakage.
                  </p>
                </div>
              </motion.div>

              {/* Tool 4: Settings & Targets */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => onOpenSettings()}
                className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-tr from-amber-500/[0.06] via-white to-orange-500/[0.02] border border-amber-200/80 shadow-[0_4px_18px_rgba(245,158,11,0.04)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)] transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shadow-amber-500/25 group-hover:scale-105 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                    SYSTEM
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold font-display text-slate-900 group-hover:text-amber-600 transition-colors">
                    App Preferences & Theme
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Circadian theme pacing, daily study hours, sound effects, and display.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ================= CLINICAL OFFLINE TELEMETRY & SYSTEM STATUS ================= */}
          <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-white/95 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,107,99,0.04)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center shadow-2xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    Clinical Telemetry & Offline Readiness
                  </h3>
                  <p className="text-xs text-slate-500">
                    Client-side database integrity, offline service worker, and examination telemetry.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  100% Client-Side Private
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    Curriculum Index
                  </span>
                  <span className="font-bold text-slate-800">19 / 19</span>
                </div>
                <div className="text-lg font-bold font-display text-slate-900">19 Disciplines</div>
                <p className="text-[11px] text-slate-500">Full NBE medical syllabus ready for offline revision</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-slate-400" />
                    Target Score
                  </span>
                  <span className="font-bold text-teal-700">{state.settings?.targetScore || 180}/300</span>
                </div>
                <div className="text-lg font-bold font-display text-slate-900">Qualify Target</div>
                <p className="text-[11px] text-slate-500">Passing criteria: 150/300 (50% raw score standard)</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Daily Commitment
                  </span>
                  <span className="font-bold text-indigo-700">{state.settings?.dailyStudyHourGoal || 6}h / Day</span>
                </div>
                <div className="text-lg font-bold font-display text-slate-900">Active Pacing</div>
                <p className="text-[11px] text-slate-500">Adaptive spaced repetition intervals synchronized</p>
              </div>
            </div>
          </div>

          {/* ================= NBE EXAM BLUEPRINT WEIGHTAGE OVERVIEW ================= */}
          <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-white/95 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,107,99,0.04)] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/70 text-[#006B63] flex items-center justify-center shadow-2xs shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-display text-slate-900">
                    NBE Examination Blueprint & Marks Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    300 Questions · 300 Marks · No Negative Marking
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 hidden sm:inline">
                Standard Weightage
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pre-Clinical */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-slate-900">Pre-Clinical</span>
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    51 Marks (17%)
                  </span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex justify-between"><span>Anatomy</span><strong className="font-mono">17 Qs</strong></li>
                  <li className="flex justify-between"><span>Physiology</span><strong className="font-mono">17 Qs</strong></li>
                  <li className="flex justify-between"><span>Biochemistry</span><strong className="font-mono">17 Qs</strong></li>
                </ul>
              </div>

              {/* Para-Clinical */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-slate-900">Para-Clinical</span>
                  <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60">
                    79 Marks (26.3%)
                  </span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex justify-between"><span>Pathology</span><strong className="font-mono">13 Qs</strong></li>
                  <li className="flex justify-between"><span>Pharmacology</span><strong className="font-mono">13 Qs</strong></li>
                  <li className="flex justify-between"><span>Microbiology</span><strong className="font-mono">13 Qs</strong></li>
                  <li className="flex justify-between"><span>Forensic Medicine</span><strong className="font-mono">10 Qs</strong></li>
                  <li className="flex justify-between"><span>PSM / Community Med</span><strong className="font-mono">30 Qs</strong></li>
                </ul>
              </div>

              {/* Clinical */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-slate-900">Clinical Disciplines</span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                    170 Marks (56.7%)
                  </span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex justify-between"><span>General Medicine</span><strong className="font-mono">33 Qs</strong></li>
                  <li className="flex justify-between"><span>General Surgery</span><strong className="font-mono">32 Qs</strong></li>
                  <li className="flex justify-between"><span>Obstetrics & Gynae</span><strong className="font-mono">30 Qs</strong></li>
                  <li className="flex justify-between"><span>Paediatrics</span><strong className="font-mono">15 Qs</strong></li>
                  <li className="flex justify-between"><span>Minor Specialties</span><strong className="font-mono">60 Qs</strong></li>
                </ul>
              </div>
            </div>
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
