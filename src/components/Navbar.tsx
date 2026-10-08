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
  GraduationCap,
  Send,
  Bell,
  ChevronRight,
  ChevronDown,
  Compass,
  ArrowLeft,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  ShieldCheck,
  Target,
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
  onOpenOnboarding?: () => void;
  userName: string;
  userEmail?: string;
  photoURL?: string | null;
  syncStatus?: SyncStatus;
  isGuest?: boolean;
  onExitGuest?: () => void;
  // Desktop sidebar toggle & hover props
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isSidebarHovered?: boolean;
  onSidebarHoverEnter?: () => void;
  onSidebarHoverLeave?: () => void;
  isNavVisible?: boolean;
}

export const primaryNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home',        desc: 'Your study command center', icon: Home,      color: '#007AFF', bg: '#EBF3FF', activeBg: '#007AFF' },
  { id: 'syllabus'  as ActiveTab, label: 'Study',       desc: 'Subjects & topic mastery',  icon: BookOpen,  color: '#30D158', bg: '#E3F9EC', activeBg: '#30D158' },
  { id: 'practice'  as ActiveTab, label: 'Practice',    desc: 'MCQs & timed sessions',     icon: Edit3,     color: '#FF9500', bg: '#FFF4E0', activeBg: '#FF9500' },
  { id: 'progress'  as ActiveTab, label: 'Performance', desc: 'Analytics & accuracy',      icon: BarChart3, color: '#5AC8FA', bg: '#E4F5FF', activeBg: '#5AC8FA' },
  { id: 'pearls'    as ActiveTab, label: 'Knowledge',   desc: 'Pearls & quick recall',     icon: BookMarked,color: '#BF5AF2', bg: '#F3E8FF', activeBg: '#BF5AF2' },
  { id: 'aicoach'   as ActiveTab, label: 'Mentor',      desc: 'AI-powered guidance',       icon: Users,     color: '#5856D6', bg: '#EEEDFA', activeBg: '#5856D6' },
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
  action?: 'cloudsync' | 'settings' | 'onboarding';
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
    id: 'onboarding',
    label: 'Calibrate Blueprint',
    icon: Compass,
    desc: 'Personalized FMGE roadmap',
    action: 'onboarding',
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

/* ─── Desktop Sidebar ────────────────────────────────────────────── */
export const SidebarDock: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenAiCoach,
  onOpenNotifications,
  unreadNotificationCount,
  onOpenCloudSync,
  onOpenOnboarding,
  userName,
  photoURL,
  syncStatus = 'synced',
  isGuest,
  onExitGuest,
  isSidebarOpen = true,
  onToggleSidebar,
  isSidebarHovered = false,
  onSidebarHoverEnter,
  onSidebarHoverLeave,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const moreHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reducedMotion = useReducedMotion();

  const QUOTES = [
    { text: 'Every question answered is a life better served.', author: null },
    { text: 'The good physician treats the disease. The great physician treats the patient.', author: 'Osler' },
    { text: 'Study hard today. Heal lives tomorrow.', author: null },
    { text: 'Medicine is learned at the bedside, not in the classroom.', author: 'Osler' },
    { text: 'Your future patients are counting on your focus right now.', author: null },
  ] as const;
  const [quoteIdx, setQuoteIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const isVisible = isSidebarOpen || isSidebarHovered;

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    if (!isSidebarOpen) {
      onSidebarHoverLeave?.();
    }
  };

  // Close hover sidebar if clicked outside when unpinned
  useEffect(() => {
    if (isSidebarOpen || !isSidebarHovered) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onSidebarHoverLeave?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, isSidebarHovered, onSidebarHoverLeave]);

  const handleMoreMouseEnter = () => {
    if (moreHoverTimeoutRef.current) clearTimeout(moreHoverTimeoutRef.current);
    setIsMoreMenuOpen(true);
  };

  const handleMoreMouseLeave = () => {
    if (moreHoverTimeoutRef.current) clearTimeout(moreHoverTimeoutRef.current);
    moreHoverTimeoutRef.current = setTimeout(() => {
      setIsMoreMenuOpen(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (moreHoverTimeoutRef.current) clearTimeout(moreHoverTimeoutRef.current);
    };
  }, []);

  const isTabActiveLocal = (id: ActiveTab) => isTabActive(id, activeTab);
  const isSecondaryActive =
    activeTab === 'grandtests' || activeTab === 'telegram' || activeTab === 'more';

  // Close more menu when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{
        x: isVisible ? 0 : -280,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onSidebarHoverEnter}
      onMouseLeave={onSidebarHoverLeave}
      className={`hidden lg:flex flex-col w-60 xl:w-64 h-screen select-none font-sans fixed inset-y-0 left-0 transition-colors duration-200 ${
        isSidebarOpen
          ? 'bg-white/95 backdrop-blur-2xl saturate-150 border-r border-black/[0.07] z-40'
          : 'bg-white/98 backdrop-blur-2xl border-r border-black/[0.09] shadow-[0_24px_64px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.06)] z-50'
      } ${!isVisible ? 'pointer-events-none' : 'pointer-events-auto'}`}
      aria-label="Desktop Navigation"
    >
      {/* ── Top: Brand Header ───────────────────────────────── */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 shrink-0">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="cursor-pointer min-w-0 flex-1 transition-opacity hover:opacity-80 active:opacity-50"
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavClick('dashboard'); } }}
            aria-label="ONE SHOT FMGE — Go to Home"
          >
            <OneShotLogo variant="horizontal" showTagline={false} />
          </div>
          {onToggleSidebar && (
            <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={onToggleSidebar}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-black/[0.05]"
              title={isSidebarOpen ? 'Collapse (⌘B)' : 'Pin (⌘B)'}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4 stroke-[1.8]" /> : <PanelLeftOpen className="h-4 w-4 stroke-[2]" />}
            </motion.button>
          )}
        </div>

        {/* ── Section: Menu (Assorted Apple Colors) ─────────── */}
        <nav className="px-3 pb-2 space-y-[3px] shrink-0" aria-label="Main Navigation">
          <p className="px-2 pb-1.5 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#8E8E93] select-none">Menu</p>
          {primaryNavItems.map(({ id, label, desc, icon: Icon, color, bg }) => {
            const active = isTabActiveLocal(id);
            return (
              <div key={id} className="relative">
                {/* Animated active background pill */}
                {active && !reducedMotion && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    transition={EASE_SPRING}
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${color}14`, border: `1px solid ${color}28` }}
                  />
                )}
                {active && reducedMotion && (
                  <div className="absolute inset-0 rounded-xl" style={{ background: `${color}14`, border: `1px solid ${color}28` }} />
                )}

                <motion.button
                  type="button"
                  onClick={() => handleNavClick(id)}
                  aria-current={active ? 'page' : undefined}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  className={`relative z-10 w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13.5px] transition-all duration-150 cursor-pointer outline-none group ${
                    active
                      ? 'font-bold text-[#1D1D1F]'
                      : 'font-semibold text-[#48484A] hover:text-[#1D1D1F] hover:bg-black/[0.035]'
                  }`}
                >
                  {/* Assorted Apple squircle icon container */}
                  <div
                    className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200"
                    style={active
                      ? { background: color, boxShadow: `0 3px 10px ${color}45` }
                      : { background: bg }
                    }
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 stroke-[2.2]"
                      style={{ color: active ? 'white' : color }}
                    />
                  </div>

                  {/* Label + desc */}
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="leading-tight truncate tracking-tight">{label}</span>
                    {active && (
                      <motion.span
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-medium leading-tight truncate mt-[1px]"
                        style={{ color: `${color}cc` }}
                      >
                        {desc}
                      </motion.span>
                    )}
                  </div>

                  {/* Active chevron */}
                  {active && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto">
                      <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" style={{ color }} />
                    </motion.div>
                  )}
                </motion.button>
              </div>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="mx-4 my-2 border-t border-black/[0.06] shrink-0" />

        {/* ── Section: Tools (More) ─────────────────────────── */}
        <div
          className="px-3 shrink-0"
          ref={moreMenuRef}
          onMouseEnter={handleMoreMouseEnter}
          onMouseLeave={handleMoreMouseLeave}
        >
          <p className="px-2 pb-1.5 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#8E8E93] select-none">Tools</p>

          <div className="relative">
            {/* Active pill for More */}
            {isSecondaryActive && !reducedMotion && (
              <motion.div
                layoutId="sidebar-active-pill"
                transition={EASE_SPRING}
                className="absolute inset-0 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/25"
              />
            )}
            {isSecondaryActive && reducedMotion && (
              <div className="absolute inset-0 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/25" />
            )}

            <motion.button
              type="button"
              onClick={() => { handleNavClick('more'); setIsMoreMenuOpen((prev) => !prev); }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="menu"
              aria-label="More utilities"
              className={`relative z-10 w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13.5px] transition-all duration-150 cursor-pointer outline-none group ${
                isSecondaryActive || isMoreMenuOpen
                  ? 'font-bold text-[#007AFF]'
                  : 'font-semibold text-[#48484A] hover:text-[#1D1D1F] hover:bg-black/[0.035]'
              }`}
            >
              <div
                className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200"
                style={isSecondaryActive || isMoreMenuOpen
                  ? { background: '#007AFF', boxShadow: '0 3px 10px rgba(0,122,255,0.38)' }
                  : { background: '#EBF3FF' }
                }
              >
                <MoreHorizontal
                  className="h-4 w-4 stroke-[2.2]"
                  style={{ color: isSecondaryActive || isMoreMenuOpen ? 'white' : '#007AFF' }}
                />
              </div>
              <span className="tracking-tight">More</span>
              <ChevronRight
                className={`h-3.5 w-3.5 ml-auto stroke-[2.5] transition-transform duration-200 ${
                  isSecondaryActive || isMoreMenuOpen ? 'text-[#007AFF]' : 'text-[#8E8E93]'
                } ${isMoreMenuOpen ? 'rotate-90' : ''}`}
              />
            </motion.button>

            {/* Hover bridge */}
            <div className="absolute left-full top-0 w-4 h-full pointer-events-auto" />

            {/* ── Popover ── */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-[calc(100%+12px)] bottom-0 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl py-2.5 px-2 z-[60] border border-black/[0.08] shadow-[0_20px_52px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]"
                role="menu"
                aria-label="Secondary Utilities"
              >
                <button
                  type="button"
                  onClick={() => { handleNavClick('more'); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F2F2F7] border-b border-black/[0.06] mb-1.5 pb-2.5 cursor-pointer text-left group transition-colors"
                >
                  <div className="flex items-center gap-2 text-[#1D1D1F] group-hover:text-[#007AFF] font-bold text-xs transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5 text-[#007AFF]" />
                    <span>Utilities Directory</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8E8E93] group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all" />
                </button>

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
                            handleNavClick(item.tab);
                          } else if (item.action === 'cloudsync') {
                            onOpenCloudSync?.();
                            if (!isSidebarOpen) onSidebarHoverLeave?.();
                          } else if (item.action === 'onboarding') {
                            onOpenOnboarding?.();
                            if (!isSidebarOpen) onSidebarHoverLeave?.();
                          } else if (item.action === 'settings') {
                            onOpenSettings();
                            if (!isSidebarOpen) onSidebarHoverLeave?.();
                          }
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                          active ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'hover:bg-[#F2F2F7] text-[#3A3A3C] hover:text-[#1D1D1F]'
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            active ? 'bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.35)]' : 'bg-[#EBF3FF] group-hover:bg-[#007AFF]/10'
                          }`}
                        >
                          <Icon className="h-4 w-4" style={{ color: active ? 'white' : '#007AFF' }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold leading-tight">{label}</span>
                          <span className="text-[10px] text-[#8E8E93] truncate">{desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

        {/* Flexible calm Apple negative space */}
        <div className="flex-1" />
      </div>

      {/* ── Bottom: Sync + Apple Glass Quote Card ──────────── */}
      <div className="px-3 pb-4 pt-2 shrink-0">
        <div className="border-t border-black/[0.06] mb-3" />

        {/* Sync row */}
        <button type="button" onClick={onOpenCloudSync}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-black/[0.03] transition-colors cursor-pointer group mb-3"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34C759]" />
          </span>
          <span className="text-[11px] font-semibold text-[#8E8E93] group-hover:text-[#1D1D1F] flex-1 text-left transition-colors">
            {syncStatus === 'offline' ? 'Offline Ready' : 'Synced to cloud'}
          </span>
          <span className="text-[10px] font-medium text-[#C7C7CC]">Auto</span>
        </button>

        {/* Animated Quote Card */}
        <div
          className="relative overflow-hidden rounded-2xl p-3.5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,245,247,0.92) 100%)',
          }}
        >
          {/* Subtle ambient azure glow */}
          <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-[#007AFF]/10 blur-xl" />

          {/* ECG art row */}
          <div className="relative flex items-center gap-2 mb-2">
            {/* Pulsing dot */}
            <div className="relative shrink-0 flex items-center justify-center h-4 w-4">
              <span className="absolute inset-0 rounded-full bg-[#007AFF]/25 animate-ping" style={{ animationDuration: '2.4s' }} />
              <span className="relative h-2 w-2 rounded-full bg-[#007AFF] shadow-[0_0_6px_rgba(0,122,255,0.6)]" />
            </div>

            {/* ECG trace SVG */}
            <svg viewBox="0 0 100 20" className="flex-1 h-3.5 overflow-visible" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="ecg-grad-sb" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#5AC8FA" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M0 10 L18 10 L22 4 L26 16 L30 3 L34 10 L44 10 L47 7 L50 10 L100 10"
                stroke="url(#ecg-grad-sb)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Rotating quote */}
          <div className="relative min-h-[2.8rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIdx}
                initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1"
              >
                <p className="text-[11.5px] font-semibold leading-[1.4] text-[#1D1D1F] tracking-tight">
                  "{QUOTES[quoteIdx].text}"
                </p>
                {QUOTES[quoteIdx].author && (
                  <p className="text-[10px] font-bold text-[#8E8E93] tracking-wide">— {QUOTES[quoteIdx].author}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

/* ─── Mobile Navigation ──────────────────────────────────────────── */
/** Mobile Purpose-Built Bottom Navigation & Top Bar */
export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfile,
  onOpenCloudSync,
  onOpenOnboarding,
  userName,
  photoURL,
  syncStatus = 'synced',
  isGuest,
  onExitGuest,
  isNavVisible = true,
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
      {/* ── Mobile Top Header with Dynamic Auto-Hide ── */}
      <motion.header
        initial={false}
        animate={reducedMotion
          ? { opacity: isNavVisible ? 1 : 0 }
          : { y: isNavVisible ? 0 : -90, opacity: isNavVisible ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 28 }}
        className="lg:hidden sticky top-0 z-40 bg-white/85 backdrop-blur-2xl saturate-[180%] border-b border-black/[0.06] px-4 py-2.5 flex items-center justify-between font-sans shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all"
        style={{
          paddingTop: 'max(0.625rem, calc(0.5rem + env(safe-area-inset-top, 0px)))',
          paddingLeft: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-left, 0px)))',
          paddingRight: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-right, 0px)))',
        }}
      >
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

          {isGuest && onExitGuest && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={onExitGuest}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EBF3FF] backdrop-blur-md border border-[#B8D9FF] text-[11px] font-extrabold text-[#007AFF] shadow-2xs cursor-pointer"
              title="Exit Local Practice Mode"
            >
              <ArrowLeft className="h-3 w-3 stroke-[2.5]" />
              <span>Exit</span>
            </motion.button>
          )}
        </div>

        {/* Right Action Icons: Sync Pill + Bell + More Utilities + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F2F2F7]/90 hover:bg-[#F0F6FF] border border-[rgba(60,60,67,0.12)] text-[11px] font-semibold text-[#3A3A3C] hover:text-[#007AFF] transition-colors cursor-pointer shadow-2xs"
              title="Cloud Sync & Local Snapshots"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#30D158] animate-pulse" />
              <span className="text-[10px] font-medium hidden xs:inline">{syncStatus === 'offline' ? 'Offline' : 'Synced'}</span>
            </button>
          )}

          {/* Avatar Profile Trigger */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="h-9 w-9 rounded-full bg-[#2A2322] text-white font-bold text-xs flex items-center justify-center ring-2 ring-[rgba(0,0,0,0.10)] shadow-xs cursor-pointer hover:ring-[#007AFF] transition-all overflow-hidden"
            title={`${userName} — Doctor Profile`}
            aria-label={`${userName} — Doctor Profile`}
          >
            {photoURL ? (
              <img src={photoURL} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </button>
        </div>
      </motion.header>

      {/* ── iOS-style Floating Tab Bar ── */}
      <motion.nav
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1rem)] sm:w-auto sm:max-w-[calc(100vw-2rem)]"
        style={{
          bottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
          transformOrigin: 'center bottom',
        }}
        initial={false}
        animate={reducedMotion
          ? { opacity: isNavVisible ? 1 : 0 }
          : { y: isNavVisible ? 0 : 100, opacity: isNavVisible ? 1 : 0, scale: isNavVisible ? 1 : 0.94 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 32 }}
        aria-label="Mobile Navigation"
      >
        {/* Glass pill container */}
        <div
          className="flex w-full items-end justify-between gap-0 px-1 pt-2 pb-1.5 rounded-[28px] select-none sm:w-auto sm:justify-start sm:gap-0.5 sm:px-2"
          style={{
            background: 'var(--mobile-dock-surface, rgba(255,255,255,0.88))',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            border: '1px solid var(--mobile-dock-border, rgba(0,0,0,0.08))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.98), 0 12px 36px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.06)',
          }}
        >
          {mobileNavItems.map(({ id, label, icon: Icon, color, bg }) => {
            const active = isTabActiveLocal(id);
            return (
              <motion.button
                key={id}
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={() => { setActiveTab(id); setMobileMoreOpen(false); }}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className="relative flex min-w-0 flex-1 flex-col items-center justify-end rounded-2xl outline-none transition-colors focus-visible:ring-2 sm:min-w-[52px] sm:flex-none"
                style={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  paddingBottom: 2,
                  // the ring follows the tab's own colour, like the drawer pill
                  ['--tw-ring-color' as string]: `${color}59`,
                }}
              >
                {/* Active background capsule */}
                {active && (
                  <motion.div
                    layoutId="tab-active-bg"
                    className="absolute inset-x-0 top-0 bottom-5 rounded-2xl"
                    style={{ background: `${color}1A` }}
                  transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={active ? { scale: 1.06 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="relative z-10 mb-0.5"
                >
                  <Icon
                    className="transition-all duration-150"
                    style={{
                      width: 22, height: 22,
                      color: active ? color : 'var(--mobile-dock-icon, #3C3C43)',
                      opacity: active ? 1 : 0.6,
                      strokeWidth: active ? 2.2 : 1.9,
                      fill: active ? `${color}26` : 'transparent',
                    }}
                  />
                </motion.div>

                {/* Label — always visible, iOS HIG */}
                <span
                  className="mobile-dock-item-label relative z-10 font-sans leading-none transition-all duration-150"
                  style={{
                  fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    letterSpacing: '-0.01em',
                    color: active ? color : 'var(--mobile-dock-label, rgba(60,60,67,0.6))',
                  }}
                >
                  {label === 'Performance' ? 'Stats' : label === 'Knowledge' ? 'Pearls' : label}
                </span>
              </motion.button>
            );
          })}

          {/* More tab */}
          {(() => {
            const active = activeTab === 'more' || isSecondaryActive;
            return (
              <div className="relative flex min-w-0 flex-1 sm:flex-none" ref={mobileMoreRef}>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  onClick={() => {
                    setMobileMoreOpen((prev) => !prev);
                  }}
                  aria-expanded={mobileMoreOpen}
                  aria-haspopup="menu"
                  aria-current={active ? 'page' : undefined}
                  aria-label="More"
                  className="relative flex min-w-0 flex-1 flex-col items-center justify-end rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 sm:min-w-[52px] sm:flex-none"
                  style={{ paddingLeft: 2, paddingRight: 2, paddingBottom: 2 }}
                >
                  {active && (
                    <motion.div
                      layoutId="tab-active-bg"
                      className="absolute inset-x-0 top-0 bottom-5 rounded-2xl"
                      style={{ background: 'rgba(0,122,255,0.10)' }}
                      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <motion.div
                    animate={active ? { scale: 1.06 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="relative z-10 mb-0.5"
                  >
                    <MoreHorizontal
                      style={{
                        width: 22, height: 22,
                        color: active ? '#007AFF' : 'var(--mobile-dock-icon, #3C3C43)',
                        opacity: active ? 1 : 0.6,
                        strokeWidth: active ? 2.2 : 1.9,
                      }}
                    />
                  </motion.div>
                  <span
                    className="mobile-dock-item-label relative z-10 font-sans leading-none transition-all duration-150"
                    style={{
                      fontSize: 11,
                      fontWeight: active ? 600 : 400,
                      letterSpacing: '-0.01em',
                      color: active ? '#007AFF' : 'var(--mobile-dock-label, rgba(60,60,67,0.6))',
                    }}
                  >
                    More
                  </span>
                </motion.button>

                {/* Mobile Floating Action Sheet / Popover anchored above bottom dock */}
                <AnimatePresence>
                  {mobileMoreOpen && (
                    <motion.div
                      initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 bottom-[calc(100%+0.75rem)] w-64 max-w-[calc(100vw-2rem)] z-[70] rounded-2xl bg-white/95 backdrop-blur-2xl saturate-[180%] border border-[rgba(60,60,67,0.10)] shadow-[0_20px_52px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.08)] p-2 font-sans"
                      role="menu"
                      aria-label="Secondary Utilities"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('more');
                          setMobileMoreOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F2F2F7] border-b border-black/[0.06] mb-1.5 pb-2 cursor-pointer text-left group transition-colors"
                      >
                        <div className="flex items-center gap-2 text-[#1D1D1F] group-hover:text-[#007AFF] font-bold text-xs transition-colors">
                          <MoreHorizontal className="h-3.5 w-3.5 text-[#007AFF]" />
                          <span>All Utilities &amp; Directory</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-[#8E8E93] group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <div className="space-y-0.5">
                        {moreUtilityItems.map((item) => {
                          const { id, label, icon: Icon, desc } = item;
                          const itemActive = Boolean(item.tab && activeTab === item.tab);
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
                                } else if (item.action === 'onboarding') {
                                  onOpenOnboarding?.();
                                } else if (item.action === 'settings') {
                                  onOpenSettings();
                                }
                                setMobileMoreOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                                itemActive
                                  ? 'bg-[#EBF3FF] text-[#007AFF]'
                                  : 'hover:bg-[#F0F6FF] hover:text-[#007AFF] text-[#3A3A3C]'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg shrink-0 transition-colors ${
                                  itemActive
                                    ? 'bg-[#007AFF] text-white shadow-2xs'
                                    : 'bg-[#F2F2F7] text-[#6E6E73] group-hover:bg-[#007AFF]/10 group-hover:text-[#007AFF]'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-semibold leading-tight">{label}</span>
                                <span className="text-[10px] text-[#8E8E93] truncate">{desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}
        </div>
      </motion.nav>
    </>
  );
};
