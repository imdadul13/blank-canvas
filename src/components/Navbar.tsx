import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Home,
  BookOpen,
  Edit3,
  BarChart3,
  BookMarked,
  Users,
  Settings,
  Settings2,
  MoreHorizontal,
  Cloud,
  GraduationCap,
  Send,
  Bell,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import OneShotLogo from './OneShotLogo';
import { AppStats } from '../utils/storage';
import { SyncStatus } from '../types';
import { EASE_SPRING } from '../utils/motionTokens';

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
  | 'aicoach'
  | 'more';

export interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: AppStats;
  onOpenAiCoach: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onOpenCloudSync?: () => void;
  userName: string;
  userEmail?: string;
  photoURL?: string | null;
  syncStatus?: SyncStatus;
}

export const primaryNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home', icon: Home },
  { id: 'syllabus' as ActiveTab, label: 'Study', icon: BookOpen },
  { id: 'practice' as ActiveTab, label: 'Practice', icon: Edit3 },
  { id: 'progress' as ActiveTab, label: 'Performance', icon: BarChart3 },
  { id: 'pearls' as ActiveTab, label: 'Knowledge', icon: BookMarked },
  { id: 'aicoach' as ActiveTab, label: 'Mentor', icon: Users },
];

export const secondaryNavItems = [
  { id: 'grandtests' as ActiveTab, label: 'Grand Tests', icon: GraduationCap, desc: '300-Q NBE mock exam' },
  { id: 'telegram' as ActiveTab, label: 'Telegram Hub', icon: Send, desc: 'Curated question feeds' },
];

export interface MoreUtilityItem {
  id: string;
  label: string;
  icon: typeof GraduationCap;
  desc: string;
  tab?: ActiveTab;
  action?: 'cloudsync' | 'settings';
}

export const moreUtilityItems: MoreUtilityItem[] = [
  {
    id: 'grandtests',
    label: 'Grand Tests',
    icon: GraduationCap,
    desc: '300-Q NBE mock exam',
    tab: 'grandtests',
  },
  {
    id: 'telegram',
    label: 'Telegram Hub',
    icon: Send,
    desc: 'Curated question feeds',
    tab: 'telegram',
  },
  {
    id: 'cloudsync',
    label: 'Cloud Sync',
    icon: Cloud,
    desc: 'Backup & sync progress',
    action: 'cloudsync',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings2,
    desc: 'App preferences & target',
    action: 'settings',
  },
];

export const mobileNavItems = primaryNavItems;

export const isTabActive = (id: ActiveTab, currentTab: ActiveTab) => {
  if (currentTab === id) return true;
  if (id === 'syllabus' && currentTab === 'revision') return true;
  if (id === 'progress' && (currentTab === 'errors' || currentTab === 'predictor')) return true;
  if (id === 'dashboard' && currentTab === 'daily') return true;
  return false;
};

/* ─── Ambient Lower Sidebar Medical Motif ───────────────────────────
   Directly matching Reference B:
   - Faint, elegant caduceus line-art watermark on the right
   - Graceful clinical ECG / rhythm wave starting from left margin
   - Luminous gold/amber node sitting atop the waveform with a radiant halo
   - Stacked editorial tagline:
     "Better Doctors"
     "Brighter Tomorrows.™"
   - Fully contained within the sidebar width (no horizontal bleed)
   ──────────────────────────────────────────────────────────────── */
function AmbientMedicalMotif() {
  return (
    <div
      className="flex-1 flex flex-col justify-end relative px-4 pb-7 pt-4 select-none overflow-hidden min-h-[260px]"
      aria-hidden="true"
    >
      {/* Seamless atmospheric gradient wash filling the lower vertical void */}
      <div className="absolute inset-0 bg-gradient-to-t from-teal-50/70 via-emerald-50/25 to-transparent pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-16 w-36 h-36 rounded-full bg-amber-100/25 blur-2xl pointer-events-none" />
      <div className="absolute right-4 top-10 w-28 h-28 rounded-full bg-teal-50/40 blur-2xl pointer-events-none" />

      <div className="relative w-full h-[200px]">
        <svg
          viewBox="0 0 240 210"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            {/* Luminous dynamic gradient for the clinical rhythm line */}
            <linearGradient id="ecg-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#006B63" stopOpacity="0.25" />
              <stop offset="35%" stopColor="#0D9488" stopOpacity="0.75" />
              <stop offset="65%" stopColor="#F59E0B" stopOpacity="0.95" />
              <stop offset="78%" stopColor="#0D9488" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#006B63" stopOpacity="0.20" />
            </linearGradient>

            {/* Expansive radial glow for the amber pulse node */}
            <radialGradient id="pulse-aura-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background gentle acoustic resonance arcs filling upper space */}
          <path
            d="M 16 45 C 50 60, 85 95, 125 145"
            stroke="#006B63"
            strokeWidth="0.85"
            strokeOpacity="0.10"
            fill="none"
          />
          <path
            d="M 38 48 C 72 68, 105 110, 140 155"
            stroke="#006B63"
            strokeWidth="0.7"
            strokeOpacity="0.07"
            fill="none"
          />

          {/* Tall Grand Caduceus line-art motif rising gracefully */}
          <g stroke="#006B63" strokeOpacity="0.15" fill="none">
            {/* Central staff with top finial */}
            <line x1="172" y1="16" x2="172" y2="165" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="172" cy="14" r="3.5" fill="#006B63" fillOpacity="0.15" />
            {/* Symmetrical wings */}
            <path
              d="M 172 30 C 152 14, 128 18, 120 30 C 136 36, 154 32, 172 40"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 172 30 C 192 14, 216 18, 224 30 C 208 36, 190 32, 172 40"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Coiled Serpents */}
            <path
              d="M 172 38 C 146 48, 146 66, 172 76 C 198 86, 198 104, 172 114 C 146 124, 146 142, 172 152"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 172 38 C 198 48, 198 66, 172 76 C 146 86, 146 104, 172 114 C 198 124, 198 142, 172 152"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* Clinical Waveform Rhythm — tall, resonant curve */}
          <path
            d="M 10 135
               L 34 135
               C 40 135, 46 95, 52 95
               C 58 95, 64 170, 70 170
               C 76 170, 81 118, 86 118
               C 91 118, 96 148, 101 148
               C 108 148, 114 96, 122 96
               C 130 96, 138 132, 148 132
               C 158 132, 168 120, 176 122
               C 194 126, 212 155, 230 185"
            stroke="url(#ecg-line-gradient)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="ecg-line-draw"
          />

          {/* Luminous Gold Accent Node sitting at wave crest (cx=176, cy=122) */}
          <circle cx="176" cy="122" r="18" fill="url(#pulse-aura-grad)" className="ecg-dot-aura" />
          <circle cx="176" cy="122" r="8.5" fill="#F59E0B" className="ecg-dot-halo" />
          <circle cx="176" cy="122" r="3.8" fill="#D97706" className="ecg-dot-core" />
          <circle cx="176" cy="122" r="1.8" fill="#FFFDF5" />
        </svg>
      </div>

      {/* Brand Tagline in 2 lines with refined typography */}
      <div className="mt-[-14px] pl-2 z-10 relative">
        <p className="font-serif italic text-[14px] leading-[1.25] text-[#006B63] font-semibold tracking-normal">
          Better Doctors
        </p>
        <p className="font-serif italic text-[14px] leading-[1.25] text-[#006B63] font-semibold tracking-normal">
          Brighter Tomorrows.<span className="text-[9.5px] font-sans not-italic font-bold ml-0.5 text-amber-600 align-super">™</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Desktop Sidebar ────────────────────────────────────────────── */
/** Desktop Left Vertical Sidebar Dock (Visual Source of Truth Architecture) */
export const SidebarDock: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenAiCoach,
  onOpenCloudSync,
  userName,
  photoURL,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reducedMotion = useReducedMotion();

  const handleMoreMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsMoreMenuOpen(true);
  };

  const handleMoreMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMoreMenuOpen(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const isTabActiveLocal = (id: ActiveTab) => isTabActive(id, activeTab);
  const isSecondaryActive = activeTab === 'grandtests' || activeTab === 'telegram';

  // Outside click & ESC key listener
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreMenuOpen]);

  return (
    <aside
      className="hidden lg:flex flex-col justify-between w-60 xl:w-64 shrink-0 h-screen sticky top-0 bg-gradient-to-b from-white via-white to-teal-50/25 border-r border-slate-100/80 z-40 select-none font-['Plus_Jakarta_Sans']"
      aria-label="Desktop Navigation"
    >
      {/* ── Top: Logo & Primary Navigation ─────────────────── */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-100/80">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer rounded-xl p-1 -ml-1 transition-opacity hover:opacity-85 active:opacity-70"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('dashboard');
              }
            }}
            aria-label="ONE SHOT FMGE — Go to Home"
          >
            <OneShotLogo variant="horizontal" showTagline={true} />
          </div>
        </div>

        {/* Primary Navigation List */}
        <nav className="px-3 pt-3 space-y-1" aria-label="Main Navigation">
          {primaryNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActiveLocal(id);
            return (
              <div key={id} className="relative">
                {/* Shared animated background pill with subtle gradient luster — borderless */}
                {active && !reducedMotion && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E6F4F1] to-[#EDF8F6]"
                    transition={EASE_SPRING}
                  />
                )}
                {active && reducedMotion && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E6F4F1] to-[#EDF8F6]" />
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    active
                      ? 'text-[#006B63] font-semibold'
                      : 'text-slate-700 font-medium hover:text-[#006B63] hover:bg-slate-50/80'
                  }`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] shrink-0 transition-colors duration-150 ${
                      active
                        ? 'text-[#006B63] fill-[#006B63]/25 stroke-[#006B63] stroke-[2.2]'
                        : 'text-slate-500 stroke-[1.8]'
                    }`}
                  />
                  <span>{label}</span>
                </button>
              </div>
            );
          })}

          {/* Clean Separator Line */}
          <div className="pt-2 pb-1">
            <div className="border-t border-slate-100" />
          </div>

          {/* ── More Section (Interactive Card on Hover & Click) ──────────────── */}
          <div
            className="relative"
            ref={moreMenuRef}
            onMouseEnter={handleMoreMouseEnter}
            onMouseLeave={handleMoreMouseLeave}
          >
            <div className="relative">
              {isSecondaryActive && !reducedMotion && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E6F4F1] to-[#EDF8F6]"
                  transition={EASE_SPRING}
                />
              )}
              {isSecondaryActive && reducedMotion && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E6F4F1] to-[#EDF8F6]" />
              )}

              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                aria-expanded={isMoreMenuOpen}
                aria-haspopup="menu"
                aria-label="More utilities"
                className={`relative z-10 w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[14px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  isSecondaryActive || isMoreMenuOpen
                    ? 'text-[#006B63] font-semibold bg-[#E8F5F3]'
                    : 'text-slate-700 font-medium hover:text-[#006B63] hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                      isSecondaryActive || isMoreMenuOpen
                        ? 'bg-[#006B63]/15 text-[#006B63]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <MoreHorizontal className="h-4 w-4 stroke-[2]" />
                  </div>
                  <span>More</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    isMoreMenuOpen ? 'rotate-90 text-[#006B63]' : ''
                  }`}
                />
              </button>
            </div>

            {/* Seamless invisible hover bridge so cursor travels safely between trigger button and card popover */}
            <div className="absolute left-full top-0 w-3 h-full pointer-events-auto" />

            {/* ── Desktop Floating Card Popover ── */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-[calc(100%+8px)] top-0 w-64 bg-white/98 backdrop-blur-md rounded-2xl shadow-[0_14px_44px_rgba(0,0,0,0.14),0_3px_12px_rgba(0,0,0,0.06)] border border-slate-200/90 py-2.5 px-2 z-50 font-['Plus_Jakarta_Sans']"
                  role="menu"
                  aria-label="Secondary Utilities"
                >
                  {/* Top Bar matching Reference B panel 4 */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 mb-1.5">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                      <MoreHorizontal className="h-3.5 w-3.5 text-[#006B63]" />
                      <span>More</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Utility Items */}
                  <div className="space-y-0.5">
                    {moreUtilityItems.map((item) => {
                      const { id, label, icon: Icon, desc } = item;
                      const active = Boolean(item.tab && activeTab === item.tab);
                      return (
                        <button
                          key={id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            if (item.tab) {
                              setActiveTab(item.tab);
                            } else if (item.action === 'cloudsync') {
                              onOpenCloudSync?.();
                            } else if (item.action === 'settings') {
                              onOpenSettings();
                            }
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#E8F5F3] text-[#006B63]'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 transition-colors ${
                              active
                                ? 'bg-[#006B63] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold leading-tight">{label}</span>
                            <span className="text-[10px] text-slate-400 truncate">{desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* ── Bottom: Ambient Medical Signature ──────────────── */}
      <AmbientMedicalMotif />
    </aside>
  );
};

/* ─── Mobile Navigation ──────────────────────────────────────────── */
/** Mobile Purpose-Built Bottom Navigation & Top Bar */
export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenNotifications,
  unreadNotificationCount,
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

  const isTabActiveLocal = (id: ActiveTab) => isTabActive(id, activeTab);
  const isSecondaryActive =
    activeTab === 'grandtests' || activeTab === 'telegram' || activeTab === 'more';
  const reducedMotion = useReducedMotion();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
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
      {/* ── Mobile Top Header ──────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 flex items-center justify-between font-['Plus_Jakarta_Sans']">
        <div className="flex items-center gap-2">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('dashboard');
              }
            }}
            aria-label="ONE SHOT FMGE — Go to Home"
          >
            <OneShotLogo variant="compact" />
          </div>
        </div>

        {/* Right Action Icons: Bell + More Utilities + Avatar */}
        <div className="flex items-center gap-2">
          {onOpenNotifications && (
            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(false);
                onOpenNotifications();
              }}
              className="relative flex items-center justify-center h-9 w-9 rounded-full bg-white border border-stone-200/90 shadow-2xs text-stone-700 hover:text-stone-900 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]/40"
              title="Study Intelligence"
              aria-label={
                unreadNotificationCount && unreadNotificationCount > 0
                  ? `Study Intelligence, ${unreadNotificationCount} unread insights`
                  : 'Study Intelligence'
              }
            >
              <Bell className="h-4.5 w-4.5 stroke-[1.8]" />
              {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white font-['Outfit'] text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs leading-none">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile More Utilities Button in Top Header */}
          <div className="relative" ref={mobileMoreRef}>
            <button
              type="button"
              onClick={() => setMobileMoreOpen((o) => !o)}
              aria-expanded={mobileMoreOpen}
              aria-haspopup="menu"
              aria-label="More utilities"
              className={`relative flex items-center justify-center h-9 w-9 rounded-full border shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]/40 ${
                mobileMoreOpen || isSecondaryActive
                  ? 'bg-[#E8F5F3] border-teal-200 text-[#006B63]'
                  : 'bg-white border-stone-200/90 text-stone-700 hover:text-stone-900'
              }`}
              title="More utilities"
            >
              <MoreHorizontal className="h-4.5 w-4.5 stroke-[2]" />
            </button>

            {/* Mobile Top More Dropdown Menu matching Reference B Panel 4 */}
            <AnimatePresence>
              {mobileMoreOpen && (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-64 z-50 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-2 font-['Plus_Jakarta_Sans']"
                  role="menu"
                  aria-label="Secondary Utilities"
                >
                  <div
                    onClick={() => {
                      setActiveTab('more');
                      setMobileMoreOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveTab('more');
                        setMobileMoreOpen(false);
                      }
                    }}
                    className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 mb-1 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-slate-700 group-hover:text-[#006B63] font-semibold text-xs">
                      <MoreHorizontal className="h-3.5 w-3.5 text-[#006B63]" />
                      <span>More</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#006B63] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  {moreUtilityItems.map((item) => {
                    const { id, label, icon: Icon, desc } = item;
                    const active = Boolean(item.tab && activeTab === item.tab);
                    return (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          if (item.tab) {
                            setActiveTab(item.tab);
                          } else if (item.action === 'cloudsync') {
                            onOpenCloudSync?.();
                          } else if (item.action === 'settings') {
                            onOpenSettings();
                          }
                          setMobileMoreOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#E8F5F3] text-[#006B63]'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            active
                              ? 'bg-[#006B63] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold leading-tight">{label}</span>
                          {desc && (
                            <span className="block text-[10px] text-slate-400 truncate">{desc}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMoreOpen(false);
              onOpenProfile();
            }}
            className="h-8 w-8 rounded-full overflow-hidden bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer ring-2 ring-slate-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]/50"
            aria-label={`Profile: ${userName || 'User'}`}
          >
            {photoURL ? (
              <img src={photoURL} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Floating Bottom Navigation Bar matching Reference B Panel 6 ───────────── */}
      <nav
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)] w-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.10)] rounded-2xl px-2.5 py-1.5 font-['Plus_Jakarta_Sans']"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center gap-1 sm:gap-2">
          {mobileNavItems.map(({ id, label, icon: Icon }) => {
            const active = isTabActiveLocal(id);
            return (
              <div key={id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setMobileMoreOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center min-w-[46px] sm:min-w-[50px] py-1 px-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.95] ${
                    active
                      ? 'text-[#006B63]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={label}
                >
                  {active && !reducedMotion && (
                    <motion.div
                      layoutId="mobile-nav-active-tile"
                      className="absolute inset-0 rounded-xl bg-[#E8F5F3]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  {active && reducedMotion && (
                    <div className="absolute inset-0 rounded-xl bg-[#E8F5F3]" />
                  )}

                  <Icon
                    className={`relative z-10 h-[19px] w-[19px] transition-transform duration-150 ${
                      active
                        ? 'text-[#006B63] stroke-[2.2] fill-[#006B63]/25'
                        : 'text-slate-600 stroke-[1.8]'
                    }`}
                  />
                  <span
                    className={`relative z-10 text-[10px] leading-tight tracking-tight mt-0.5 ${
                      active ? 'font-semibold text-[#006B63]' : 'font-medium text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};
