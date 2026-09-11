import React, { useState } from 'react';
import {
  Send,
  Settings,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Cloud,
  LayoutGrid,
} from 'lucide-react';
import { AppState, ErrorNotebookItem, DailyTask, DailyStudyLog, MedicalPearl } from '../types';
import { AppStats } from '../utils/storage';
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

export const MoreView: React.FC<MoreViewProps> = ({
  state,
  stats,
  onOpenSettings,
  onOpenProfile,
  onOpenCloudSync,
  onNavigateTab,
  onAddErrorItem,
  onUpdateAppState,
}) => {
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
      id: 'cloudsync',
      title: 'Cloud Sync & Backup',
      subtitle: 'Safely backup and synchronize study logs across devices.',
      badge: 'Cloud Sync',
      icon: Cloud,
      action: () => onOpenCloudSync?.(),
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
          <header className="space-y-3 border-b border-slate-200/80 pb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#00685F] via-[#0D9488] to-[#044E48] text-white shadow-[0_8px_20px_rgba(0,107,99,0.18)] border border-white/80 ring-1 ring-black/5 shrink-0">
                <LayoutGrid className="h-5 w-5 text-white stroke-[1.8]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#00685F] text-[10px] sm:text-[11px] font-bold font-mono tracking-wider">
                  CLINICAL SUITE · UTILITIES
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold font-display tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-[#006B63] bg-clip-text text-transparent">
              Clinical Utilities &amp; Services
            </h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
              Grand test mock exams, Telegram clinical feed, cloud telemetry synchronization, and application preferences.
            </p>
          </header>

          {/* Directory of Hub Items */}
          <div className="divide-y divide-slate-100 editorial-surface overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {utilityItems.map(({ id, title, subtitle, badge, icon: Icon, action }) => (
              <div
                key={id}
                onClick={action}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 group-hover:bg-[#006B63]/10 group-hover:text-[#006B63] transition-colors">
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
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                    {badge}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
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
