import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Home,
  BookOpen,
  Edit3,
  BarChart3,
  BookMarked,
  Users,
  Settings2,
  MoreHorizontal,
  GraduationCap,
  Send,
  ChevronRight,
  Compass,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ListChecks,
} from 'lucide-react';
import OneShotLogo from './OneShotLogo';
import { SyncStatus } from '../types';
import { SPRING_SNAPPY, TAB_PILL_TRANSITION } from '../utils/motionTokens';

export type ActiveTab =
  | 'dashboard'
  | 'syllabus'
  | 'practice'
  | 'questionbank'
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
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenCloudSync?: () => void;
  onOpenOnboarding?: () => void;
  userName: string;
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

const primaryNavItems = [
  { id: 'dashboard' as ActiveTab, label: 'Home',        desc: 'Your study command center', icon: Home,      color: '#007AFF', bg: '#EBF3FF', activeBg: '#007AFF' },
  { id: 'syllabus'  as ActiveTab, label: 'Study',       desc: 'Subjects & topic mastery',  icon: BookOpen,  color: '#30D158', bg: '#E3F9EC', activeBg: '#30D158' },
  { id: 'practice'  as ActiveTab, label: 'Practice',    desc: 'MCQs & timed sessions',     icon: Edit3,     color: '#FF9500', bg: '#FFF4E0', activeBg: '#FF9500' },
  { id: 'questionbank' as ActiveTab, label: 'Question Bank', desc: 'FMGE, NEET-PG & INI-CET', icon: ListChecks, color: '#5856D6', bg: '#EEEDFA', activeBg: '#5856D6' },
  { id: 'progress'  as ActiveTab, label: 'Performance', desc: 'Analytics & accuracy',      icon: BarChart3, color: '#5AC8FA', bg: '#E4F5FF', activeBg: '#5AC8FA' },
  { id: 'pearls'    as ActiveTab, label: 'Knowledge',   desc: 'Pearls & quick recall',     icon: BookMarked,color: '#BF5AF2', bg: '#F3E8FF', activeBg: '#BF5AF2' },
  { id: 'aicoach'   as ActiveTab, label: 'Mentor',      desc: 'AI-powered guidance',       icon: Users,     color: '#5856D6', bg: '#EEEDFA', activeBg: '#5856D6' },
];

interface MoreUtilityItem {
  id: string;
  label: string;
  icon: typeof GraduationCap;
  desc: string;
  tab?: ActiveTab;
  action?: 'cloudsync' | 'settings' | 'onboarding';
}

const moreUtilityItems: MoreUtilityItem[] = [
  {
    id: 'grandtests',
    label: 'Grand Tests',
    icon: GraduationCap,
    desc: 'Mock results & timed practice',
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

const mobileNavOrder: ActiveTab[] = [
  'dashboard',
  'syllabus',
  'aicoach',
  'practice',
  'questionbank',
];

const mobileNavItems = mobileNavOrder.map(
  (id) => primaryNavItems.find((item) => item.id === id)!
);

const mobileMoreUtilityItems: MoreUtilityItem[] = [
  {
    id: 'progress',
    label: 'Performance',
    icon: BarChart3,
    desc: 'Analytics, accuracy & errors',
    tab: 'progress',
  },
  ...moreUtilityItems,
];

const isTabActive = (id: ActiveTab, currentTab: ActiveTab) => {
  if (currentTab === id) return true;
  if (id === 'syllabus' && currentTab === 'revision') return true;
  if (id === 'progress' && (currentTab === 'errors' || currentTab === 'predictor')) return true;
  if (id === 'dashboard' && currentTab === 'daily') return true;
  return false;
};

function syncStatusPresentation(status: SyncStatus, isGuest?: boolean) {
  if (isGuest) return { label: 'Saved on this device', short: 'Local', color: '#FF9F0A', animating: false };
  if (status === 'syncing') return { label: 'Syncing changes…', short: 'Syncing', color: '#007AFF', animating: true };
  if (status === 'error') return { label: 'Sync failed · saved on device', short: 'Retry', color: '#FF3B30', animating: false };
  if (status === 'offline') return { label: 'Offline · saved on device', short: 'Offline', color: '#FF9F0A', animating: false };
  return { label: 'Synced to cloud', short: 'Synced', color: '#34C759', animating: false };
}

/* ─── Desktop Sidebar ────────────────────────────────────────────── */
export const SidebarDock: React.FC<NavbarProps> = ({
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
  const syncPresentation = syncStatusPresentation(syncStatus, isGuest);
  const initials = (userName || 'Dr')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
      className={`app-sidebar hidden xl:flex flex-col w-64 h-screen select-none font-sans fixed inset-y-0 left-0 transition-colors duration-200 ${
        isSidebarOpen
          ? 'is-pinned z-40'
          : 'is-floating z-50'
      } ${!isVisible ? 'pointer-events-none' : 'pointer-events-auto'}`}
      aria-label="Desktop Navigation"
    >
      {/* ── Top: Brand Header ───────────────────────────────── */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="app-sidebar-brand mx-3 mt-3 mb-3 px-3 py-3 flex items-center justify-between gap-2 shrink-0">
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
              className="app-sidebar-toggle h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Collapse (⌘B)' : 'Pin (⌘B)'}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4 stroke-[1.8]" /> : <PanelLeftOpen className="h-4 w-4 stroke-[2]" />}
            </motion.button>
          )}
        </div>

        {/* ── Section: Menu (Assorted Apple Colors) ─────────── */}
        <nav className="px-3 pb-2 space-y-[3px] shrink-0" aria-label="Main Navigation">
          <p className="app-sidebar-section-title px-2 pb-1.5 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#8E8E93] select-none">Menu</p>
          {primaryNavItems.map(({ id, label, desc, icon: Icon, color, bg }) => {
            const active = isTabActiveLocal(id);
            return (
              <div key={id} className="relative">
                {/* Animated active background pill */}
                {active && !reducedMotion && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    transition={TAB_PILL_TRANSITION(reducedMotion)}
                    className="app-sidebar-active-pill absolute inset-0 rounded-2xl"
                    style={{ '--nav-color': color } as React.CSSProperties}
                  />
                )}
                {active && reducedMotion && (
                  <div className="app-sidebar-active-pill absolute inset-0 rounded-2xl" style={{ '--nav-color': color } as React.CSSProperties} />
                )}

                <motion.button
                  type="button"
                  onClick={() => handleNavClick(id)}
                  aria-current={active ? 'page' : undefined}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  transition={SPRING_SNAPPY}
                    className={`app-sidebar-item relative z-10 w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-[13.5px] transition-all duration-150 cursor-pointer outline-none group ${
                    active
                      ? 'font-bold text-[#1D1D1F]'
                      : 'font-semibold text-[#48484A] hover:text-[#1D1D1F] hover:bg-black/[0.035]'
                  }`}
                >
                  {/* Assorted Apple squircle icon container */}
                  <div
                    className="app-sidebar-icon h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{ '--nav-color': color, '--nav-bg': bg } as React.CSSProperties}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 stroke-[2.2]"
                      aria-hidden="true"
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
        <div className="app-sidebar-divider mx-4 my-2 border-t border-black/[0.06] shrink-0" />

        {/* ── Section: Tools (More) ─────────────────────────── */}
        <div
          className="px-3 shrink-0"
          ref={moreMenuRef}
          onMouseEnter={handleMoreMouseEnter}
          onMouseLeave={handleMoreMouseLeave}
        >
          <p className="app-sidebar-section-title px-2 pb-1.5 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[#8E8E93] select-none">Tools</p>

          <div className="relative">
            {/* Active pill for More */}
            {isSecondaryActive && !reducedMotion && (
              <motion.div
                layoutId="sidebar-active-pill"
                transition={TAB_PILL_TRANSITION(reducedMotion)}
                className="app-sidebar-active-pill absolute inset-0 rounded-2xl"
                style={{ '--nav-color': '#007AFF' } as React.CSSProperties}
              />
            )}
            {isSecondaryActive && reducedMotion && (
              <div className="app-sidebar-active-pill absolute inset-0 rounded-2xl" style={{ '--nav-color': '#007AFF' } as React.CSSProperties} />
            )}

            <motion.button
              type="button"
              onClick={() => { handleNavClick('more'); setIsMoreMenuOpen((prev) => !prev); }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              transition={SPRING_SNAPPY}
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="menu"
              aria-label="More utilities"
              className={`app-sidebar-more relative z-10 w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-[13.5px] transition-all duration-150 cursor-pointer outline-none group ${
                isSecondaryActive || isMoreMenuOpen
                  ? 'font-bold text-[#007AFF]'
                  : 'font-semibold text-[#48484A] hover:text-[#1D1D1F] hover:bg-black/[0.035]'
              }`}
            >
              <div
                className={`app-sidebar-more-icon ${isSecondaryActive || isMoreMenuOpen ? 'is-active' : ''} h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200`}
              >
                <MoreHorizontal
                  className="h-4 w-4 stroke-[2.2]"
                  aria-hidden="true"
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
                  className="app-sidebar-popover absolute left-[calc(100%+12px)] bottom-0 w-64 rounded-3xl py-2.5 px-2 z-[60]"
                role="menu"
                aria-label="Secondary Utilities"
              >
                <button
                  type="button"
                  onClick={() => { handleNavClick('more'); setIsMoreMenuOpen(false); }}
                  className="app-sidebar-popover-heading w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F2F2F7] border-b border-black/[0.06] mb-1.5 pb-2.5 cursor-pointer text-left group transition-colors"
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
                        className={`app-sidebar-popover-item w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
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

      {/* ── Bottom: sync status ─────────────────────────────── */}
      <div className="app-sidebar-footer px-3 pb-4 pt-2 shrink-0">
        <div className="app-sidebar-divider border-t border-black/[0.06] mb-3" />

        <button
          type="button"
          onClick={onOpenProfile}
          className="app-sidebar-profile w-full flex items-center gap-3 rounded-2xl p-2.5 text-left"
        >
          <span className="app-sidebar-avatar grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-bold">
            {photoURL ? <img src={photoURL} alt="" className="h-full w-full object-cover" /> : initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-[var(--color-ink)]">{userName || 'Doctor'}</span>
            <span className="mt-0.5 block truncate text-[10.5px] font-medium text-[var(--color-ink-2)]">
              {isGuest ? 'Local practice profile' : 'FMGE study profile'}
            </span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-3)]" />
        </button>

        {/* Sync row */}
        <button type="button" onClick={onOpenCloudSync}
          className="app-sidebar-sync mt-2 w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-colors cursor-pointer group"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {syncPresentation.animating && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ backgroundColor: syncPresentation.color }} />}
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: syncPresentation.color }} />
          </span>
          <span className="app-sidebar-sync-label text-[11px] font-semibold text-[#8E8E93] group-hover:text-[#1D1D1F] flex-1 text-left transition-colors">
            {syncPresentation.label}
          </span>
          <span className="app-sidebar-sync-auto text-[10px] font-semibold">{isGuest ? 'Device' : 'Auto'}</span>
        </button>

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
    activeTab === 'progress' ||
    activeTab === 'errors' ||
    activeTab === 'predictor' ||
    activeTab === 'grandtests' ||
    activeTab === 'telegram' ||
    activeTab === 'pearls' ||
    activeTab === 'more';
  const reducedMotion = useReducedMotion();
  const syncPresentation = syncStatusPresentation(syncStatus, isGuest);

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
        className="app-mobile-header xl:hidden sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between font-sans transition-all bg-white dark:bg-[#101114]"
        style={{
          borderBottom: 'none',
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
              className="app-mobile-exit inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer"
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
              className="app-mobile-sync flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
              title="Cloud Sync & Local Snapshots"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${syncPresentation.animating ? 'animate-pulse' : ''}`} style={{ backgroundColor: syncPresentation.color }} />
              <span className="text-[10px] font-medium hidden xs:inline">{syncPresentation.short}</span>
            </button>
          )}

          {/* Avatar Profile Trigger */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="app-mobile-avatar h-9 w-9 rounded-xl text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-all overflow-hidden"
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
        className="mobile-dock-anchor xl:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1rem)] sm:w-auto"
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
        <div className="premium-mobile-dock relative flex w-full items-end gap-2 select-none">
          <div className="mobile-tab-dock mobile-dock-cluster relative flex min-w-0 flex-1 items-end">
            {mobileNavItems.map(({ id, label, icon: Icon, color }) => {
              const active = isTabActive(id, activeTab);

              return (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.88 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => { setActiveTab(id); setMobileMoreOpen(false); }}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  className={`mobile-dock-button relative flex min-w-0 flex-1 flex-col items-center justify-end ${
                    id === 'aicoach' ? 'mobile-dock-mentor' : ''
                  } ${active ? 'is-active' : ''}`}
                  style={
                    {
                      '--dock-item-accent': color,
                    } as React.CSSProperties
                  }
                >
                  {active && (
                    <motion.div
                      layoutId="tab-active-bg"
                      className="mobile-dock-active absolute"
                      style={
                        {
                          '--dock-item-accent': color,
                        } as React.CSSProperties
                      }
                      transition={TAB_PILL_TRANSITION(reducedMotion)}
                    />
                  )}

                  <span className="mobile-dock-icon relative z-10">
                    <Icon />
                  </span>

                  <span className="mobile-dock-item-label relative z-10">
                    {label === 'Question Bank' ? 'Questions' : label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="mobile-more-shell relative flex shrink-0" ref={mobileMoreRef}>
            <button
              type="button"
              className={`mobile-dock-button mobile-dock-more${activeTab === 'more' || isSecondaryActive ? ' is-active' : ''}`}
              aria-label="More"
              aria-expanded={mobileMoreOpen}
              aria-haspopup="menu"
              onClick={() => setMobileMoreOpen((prev) => !prev)}
            >
              <MoreHorizontal />
            </button>

            {/* Mobile Floating Action Sheet / Popover anchored above bottom dock */}
            <AnimatePresence>
              {mobileMoreOpen && (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="mobile-more-popover absolute right-0 bottom-[calc(100%+0.75rem)] w-64 max-w-[calc(100vw-2rem)] z-[70] rounded-3xl p-2 font-sans"
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
                    {mobileMoreUtilityItems.map((item) => {
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
            </div>
          </motion.nav>
    </>
  );
};
