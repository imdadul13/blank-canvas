import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  BarChart3,
  Settings,
  MoreHorizontal,
  Cloud,
  GraduationCap,
  RotateCcw,
  FileSpreadsheet,
  TrendingUp,
  ChevronDown,
  Menu,
  Bell,
  Bookmark,
  Stethoscope,
  Send,
  Search,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import OneShotLogo from './OneShotLogo';
import { AppStats } from '../utils/storage';
import { SyncStatus } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'syllabus'
  | 'practice'
  | 'progress'
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
  { id: 'progress' as ActiveTab, label: 'Performance', icon: BarChart3 },
  { id: 'pearls' as ActiveTab, label: 'Knowledge', icon: Bookmark },
  { id: 'aicoach' as ActiveTab, label: 'Mentor', icon: Stethoscope },
];

export const secondaryNavItems = [
  { id: 'grandtests' as ActiveTab, label: 'Grand Tests', icon: GraduationCap, desc: '300-Q NBE mock exam' },
  { id: 'revision' as ActiveTab, label: 'Spaced Revision', icon: RotateCcw, desc: 'Ebbinghaus retention desk' },
  { id: 'errors' as ActiveTab, label: 'Error Vault', icon: FileSpreadsheet, desc: 'Mistake triage & remediation' },
  { id: 'predictor' as ActiveTab, label: 'Score Predictor', icon: TrendingUp, desc: 'Monte Carlo pass probability' },
  { id: 'daily' as ActiveTab, label: 'Daily Planner', icon: Calendar, desc: 'Personalized study schedule' },
  { id: 'telegram' as ActiveTab, label: 'Telegram Hub', icon: Send, desc: 'Curated question feeds' },
];

export const mobileNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
  { id: 'syllabus' as ActiveTab, label: 'Study', icon: BookOpen },
  { id: 'practice' as ActiveTab, label: 'Practice', icon: HelpCircle },
  { id: 'progress' as ActiveTab, label: 'Performance', icon: BarChart3 },
  { id: 'aicoach' as ActiveTab, label: 'Mentor', icon: Stethoscope },
];

export const mobileMoreItems: Array<{ id: ActiveTab; label: string; icon: typeof LayoutDashboard; desc?: string }> = [
  { id: 'pearls' as ActiveTab, label: 'Knowledge', icon: Bookmark },
  ...secondaryNavItems.map((s) => ({ ...s })),
];

/** Desktop Top Global Header (Stitch Architecture) */
export const SidebarDock: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenCloudSync,
  syncStatus = 'synced',
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  const isTabActive = (id: ActiveTab) => activeTab === id;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      const nearTop = y < 90;

      if (delta > 6 && y > 150 && !isMoreMenuOpen) {
        setHidden(true);
      } else if (delta < -4 || nearTop) {
        setHidden(false);
      }
      setScrolled(y > 24);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMoreMenuOpen]);

  return (
    <header
      className={`hidden lg:block fixed top-0 left-0 right-0 z-50 font-['Inter'] select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled
          ? 'bg-[#ffffff]/80 backdrop-blur-xl border-b border-[#DCE4E1]/80 shadow-[0_8px_30px_rgba(18,30,27,0.08)]'
          : 'bg-[#F7F9F8]/45 backdrop-blur-md border-b border-[#DCE4E1]/50 shadow-[0_1px_0_rgba(229,221,211,0.4)]'
      }`}
    >
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center cursor-pointer group shrink-0"
          title="ONE SHOT FMGE"
        >
          <OneShotLogo variant="compact" />
        </div>

        {/* Center: Primary Navigation Links */}
        <nav className="flex items-center gap-1" aria-label="Primary Navigation">
          {primaryNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActive(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 h-9 px-3.5 rounded-md text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#F5F7F8] text-[#006B63] font-semibold shadow-xs'
                    : 'text-[#3d4947] hover:text-[#121e1b] hover:bg-[#F7F9F8]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#006B63] stroke-[2.2]' : 'text-[#66716F] stroke-[1.8]'}`} />
                <span>{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#006B63] rounded-full" />
                )}
              </button>
            );
          })}

          {/* Secondary Tools Dropdown Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                secondaryNavItems.some((s) => s.id === activeTab)
                  ? 'bg-[#F5F7F8] text-[#006B63] font-semibold'
                  : 'text-[#3d4947] hover:text-[#121e1b] hover:bg-[#F7F9F8]'
              }`}
              title="More tools"
            >
              <span>More</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-[#DCE4E1] p-1.5 z-50 divide-y divide-[#F5F7F8] animate-in fade-in zoom-in-95 duration-150">
                <div className="py-1">
                  {secondaryNavItems.map(({ id, label, icon: Icon, desc }) => {
                    const active = isTabActive(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setActiveTab(id);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#F5F7F8] text-[#006B63]'
                            : 'hover:bg-[#F7F9F8] text-[#121e1b]'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 ${active ? 'bg-[#006B63] text-white' : 'bg-[#f4eee7] text-[#006B63]'}`}>
                          <Icon className="h-4 w-4 shrink-0" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold leading-tight">{label}</span>
                          <span className="text-[11px] text-[#66716F] truncate">{desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Actions, Sync, Notifications, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Cloud Sync Telemetry Badge */}
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#f4eee7] hover:bg-[#F5F7F8] border border-[#E4E8EB]/60 text-[#2c694e] text-xs transition-colors cursor-pointer"
              title="Cloud Telemetry & Sync Center"
            >
              <Cloud className="h-3.5 w-3.5 text-[#006B63]" />
              <span className="font-mono text-[11px] font-semibold">Synced</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#008378] animate-pulse" />
            </button>
          )}

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-[#3d4947] hover:text-[#121e1b] rounded-md hover:bg-[#F7F9F8] transition-colors cursor-pointer"
            title="Application Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

/** Mobile Purpose-Built Bottom Navigation & Top Bar */
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

  const isTabActive = (id: ActiveTab) => activeTab === id;

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setMobileMoreOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileMoreOpen]);

  return (
    <>
      {/* Mobile Top Header matching Stitch mobile specification */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#ffffff]/95 backdrop-blur-md border-b border-[#DCE4E1] px-4 py-2.5 flex items-center justify-between font-['Inter']">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-[#3d4947] hover:text-[#121e1b] rounded-md cursor-pointer"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center cursor-pointer"
            title="ONE SHOT FMGE"
          >
            <OneShotLogo variant="compact" />
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 text-[#3d4947] hover:text-[#121e1b] rounded-full hover:bg-[#F7F9F8] transition-colors cursor-pointer"
              title="View Study Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            </button>
          )}

          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="p-1.5 text-[#006B63] hover:text-[#005049] rounded-full bg-[#f4eee7] border border-[#E4E8EB] transition-colors cursor-pointer"
              title="Cloud Telemetry"
            >
              <Cloud className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProfile}
            className="h-7 w-7 rounded-full overflow-hidden bg-[#006B63] text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
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
        ref={mobileMoreRef}
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] w-auto bg-[#ffffff]/95 backdrop-blur-xl border border-[#DCE4E1] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full px-2 py-1 font-['Inter']"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
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
                    ? 'bg-[#006B63] text-white shadow-xs font-semibold'
                    : 'text-[#66716F] hover:text-[#121e1b] hover:bg-[#F7F9F8]'
                }`}
                title={label}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-white stroke-[2.2]' : 'text-[#66716F] stroke-[1.8]'}`} />
                {active && (
                  <span className="text-[11px] font-semibold tracking-tight">
                    {label}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen((o) => !o)}
            className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-full transition-all duration-150 cursor-pointer ${
              mobileMoreOpen
                ? 'bg-[#006B63] text-white shadow-xs font-semibold'
                : 'text-[#66716F] hover:text-[#121e1b] hover:bg-[#F7F9F8]'
            }`}
            title="More"
          >
            <MoreHorizontal className={`h-4 w-4 ${mobileMoreOpen ? 'text-white stroke-[2.2]' : 'text-[#66716F] stroke-[1.8]'}`} />
            {mobileMoreOpen && (
              <span className="text-[11px] font-semibold tracking-tight">More</span>
            )}
          </button>
        </div>

        {/* Mobile "More" Overlay Menu */}
        {mobileMoreOpen && (
          <div
            className="absolute bottom-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[60vh] overflow-y-auto rounded-2xl bg-[#ffffff]/95 backdrop-blur-xl border border-[#DCE4E1] shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-2 font-['Inter']"
            role="menu"
            aria-label="All Tabs"
            onClick={() => setMobileMoreOpen(false)}
          >
            {mobileMoreItems.map(({ id, label, icon: Icon, desc }) => {
              const active = isTabActive(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setMobileMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    active ? 'bg-[#006B63]/10 text-[#006B63]' : 'text-[#121e1b] hover:bg-[#F7F9F8]'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-[#006B63]' : 'text-[#66716F]'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{label}</span>
                    {desc && <span className="block text-[11px] text-[#66716F] truncate">{desc}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
};
