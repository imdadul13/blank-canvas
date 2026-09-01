import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Settings,
  MoreHorizontal,
  Cloud,
  GraduationCap,
  RotateCcw,
  FileSpreadsheet,
  TrendingUp,
  ChevronRight,
  Activity,
  Menu,
  Search,
  Bell
} from 'lucide-react';
import { AppStats } from '../utils/storage';
import { SyncStatus } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'syllabus'
  | 'practice'
  | 'progress'
  | 'more'
  | 'errors'
  | 'predictor'
  | 'revision'
  | 'grandtests'
  | 'daily'
  | 'pearls'
  | 'telegram'
  | 'aicoach';

export interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: AppStats;
  onOpenAiCoach: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  onOpenCloudSync?: () => void;
  userName: string;
  userEmail?: string;
  photoURL?: string | null;
  syncStatus?: SyncStatus;
}

export const primaryNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
  { id: 'syllabus' as ActiveTab, label: 'Study', icon: BookOpen },
  { id: 'practice' as ActiveTab, label: 'Practice', icon: HelpCircle },
  { id: 'aicoach' as ActiveTab, label: 'Study Coach', icon: MessageSquare },
  { id: 'progress' as ActiveTab, label: 'Progress', icon: BarChart3 },
];

export const secondaryNavItems = [
  { id: 'grandtests' as ActiveTab, label: 'Grand Tests', icon: GraduationCap },
  { id: 'revision' as ActiveTab, label: 'Revision', icon: RotateCcw },
  { id: 'errors' as ActiveTab, label: 'Error Vault', icon: FileSpreadsheet },
  { id: 'predictor' as ActiveTab, label: 'Predictor', icon: TrendingUp },
  { id: 'more' as ActiveTab, label: 'More', icon: MoreHorizontal },
];

export const mobileNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
  { id: 'syllabus' as ActiveTab, label: 'Study', icon: BookOpen },
  { id: 'practice' as ActiveTab, label: 'Practice', icon: HelpCircle },
  { id: 'aicoach' as ActiveTab, label: 'Coach', icon: MessageSquare },
  { id: 'more' as ActiveTab, label: 'More', icon: MoreHorizontal },
];

/** Desktop Full Navigation Rail matching the reference design */
export const SidebarDock: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenCloudSync,
  userName,
  photoURL,
  syncStatus = 'synced',
}) => {
  const initials = (userName || 'Dr')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isTabActive = (id: ActiveTab) => {
    return activeTab === id;
  };

  return (
    <aside className="hidden lg:flex flex-col justify-between py-6 px-4 w-[210px] xl:w-[220px] sticky top-0 h-screen z-40 bg-white/95 backdrop-blur-xl border-r border-slate-200/70 select-none shrink-0 font-['Plus_Jakarta_Sans']">
      {/* Top Brand Header */}
      <div className="flex flex-col gap-6">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 px-2 cursor-pointer group"
          title="ONE SHOT FMGE"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs group-hover:bg-slate-800 transition-colors">
            <Activity className="h-5 w-5 text-sky-400 stroke-[2.2]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-['Outfit'] text-[15px] font-extrabold tracking-tight text-slate-900">
              ONE SHOT
            </span>
            <span className="font-['Outfit'] text-[11px] font-semibold tracking-wider text-slate-400 mt-0.5">
              FMGE
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex flex-col gap-1 w-full" aria-label="Primary Navigation">
          {primaryNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActive(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer text-left ${
                  active
                    ? 'bg-slate-100/90 text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-slate-900 stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 w-full">
          {secondaryNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActive(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-3 h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer text-left ${
                  active
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-slate-900 stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Cloud Sync, Settings, Profile */}
      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
        {/* Sync Status Badge Card - Clickable to open Cloud Sync Center */}
        <div
          onClick={onOpenCloudSync}
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/90 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200/80 text-slate-600 text-xs transition-all cursor-pointer group"
          title="Open Cloud Telemetry & Sync Center"
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Cloud className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Sync Status</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-800 text-[11px] group-hover:text-emerald-700 transition-colors">Synced</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-0.5 animate-pulse" />
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-3 h-9 px-3 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

/** Mobile Purpose-Built Bottom Navigation */
export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenNotifications,
  onOpenCloudSync,
  userName,
  photoURL,
}) => {
  const initials = (userName || 'Dr')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isTabActive = (id: ActiveTab) => {
    return activeTab === id;
  };

  return (
    <>
      {/* Mobile Top Header matching mobile reference */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between font-['Plus_Jakarta_Sans']">
        {/* Left Hamburger + Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Activity className="h-3.5 w-3.5 text-sky-400 stroke-[2.2]" />
            </div>
            <span className="font-['Outfit'] text-xs font-bold tracking-tight text-slate-900">
              ONE SHOT <span className="text-[10px] font-medium text-slate-400">FMGE</span>
            </span>
          </div>
        </div>

        {/* Right Action Icons (Search, Bell, Cloud, Avatar) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('syllabus')}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="View Study Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCloudSync}
            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 transition-colors cursor-pointer"
            title="Open Cloud Telemetry & Sync Center"
          >
            <Cloud className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="h-7 w-7 rounded-full overflow-hidden bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
          >
            {photoURL ? (
              <img src={photoURL} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Floating Rounded Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] w-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_36px_rgba(15,23,42,0.14)] rounded-full px-2 py-1 font-['Plus_Jakarta_Sans']"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center gap-1">
          {mobileNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActive(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-full transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
                title={label}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-white stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}`} />
                {active && (
                  <span className="text-[11px] font-['Outfit'] font-bold tracking-tight">
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
