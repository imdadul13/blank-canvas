import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, SunMedium, Sunset, Moon, LucideIcon } from 'lucide-react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface CircadianTheme {
  timeOfDay: TimeOfDay;
  phase: TimeOfDay;
  label: string;
  subLabel: string;
  greeting: string;
  quote: string;
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  bannerBg: string;
  cardBorder: string;
  titleGrad: string;
  subtitleColor: string;
  auraGrad: string;
  topLight: string;
  shimmerGlow: string;
  orb1: string;
  orb2: string;
  orb3: string;
  accentText: string;
  isNight: boolean;
  cycleTheme: () => void;
  setTheme: (theme: TimeOfDay | 'auto') => void;
  themeSetting?: string;
}

export function resolveTimeOfDay(hour: number, themeSetting?: string): TimeOfDay {
  // 1. Check local manual cycle override first
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('fmge_circadian_override');
    if (override === 'morning' || override === 'afternoon' || override === 'evening' || override === 'night') {
      return override;
    }
  }

  // 2. Check user settings
  if (themeSetting === 'morning') return 'morning';
  if (themeSetting === 'afternoon') return 'afternoon';
  if (themeSetting === 'sunset') return 'evening';
  if (themeSetting === 'night') return 'night';

  // 3. Real-time circadian calculation
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getCircadianTheme(
  timeOfDay: TimeOfDay,
  cycleTheme: () => void,
  setTheme: (theme: TimeOfDay | 'auto') => void = () => {},
  themeSetting?: string
): CircadianTheme {
  switch (timeOfDay) {
    case 'morning':
      return {
        timeOfDay: 'morning',
        phase: 'morning',
        label: 'Dawn Focus',
        subLabel: 'Sunrise Study Session',
        greeting: 'Good morning,',
        quote: 'Fresh minds master high-yield concepts faster.',
        Icon: Sun,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/15 border-amber-300/70 text-amber-800 dark:text-amber-300',
        badgeBg: 'bg-amber-500/12 dark:bg-amber-400/15',
        badgeText: 'text-amber-900 dark:text-amber-200 font-bold',
        badgeBorder: 'border-amber-300/80 dark:border-amber-400/30',
        bannerBg: 'bg-gradient-to-br from-amber-500/[0.08] via-white/95 to-teal-500/[0.06] backdrop-blur-2xl',
        cardBorder: 'border-amber-200/90 dark:border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.08),0_1px_3px_rgba(0,0,0,0.04)]',
        titleGrad: 'bg-gradient-to-r from-[#003830] via-[#008779] via-35% to-[#10B981]',
        subtitleColor: 'text-slate-600 dark:text-slate-300 font-medium',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(251,191,36,0.22),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(45,212,191,0.18),transparent_70%)]',
        topLight: 'from-transparent via-amber-400/40 to-transparent',
        shimmerGlow: 'via-amber-400 shadow-[0_0_16px_#f59e0b]',
        orb1: 'from-amber-400/35 via-yellow-200/25 to-transparent',
        orb2: 'from-teal-300/30 via-emerald-100/20 to-transparent',
        orb3: 'from-amber-200/25 via-teal-100/20 to-transparent',
        accentText: 'text-amber-800 dark:text-amber-300',
        isNight: false,
        cycleTheme,
        setTheme,
        themeSetting,
      };

    case 'afternoon':
      return {
        timeOfDay: 'afternoon',
        phase: 'afternoon',
        label: 'Zenith Focus',
        subLabel: 'High-Zenith Clinical Drill',
        greeting: 'Good afternoon,',
        quote: 'Peak cognitive momentum for active recall.',
        Icon: SunMedium,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-500/15 border-teal-300/70 text-teal-800 dark:text-teal-300',
        badgeBg: 'bg-teal-500/12 dark:bg-teal-400/15',
        badgeText: 'text-teal-900 dark:text-teal-200 font-bold',
        badgeBorder: 'border-teal-300/80 dark:border-teal-400/30',
        bannerBg: 'bg-gradient-to-br from-teal-500/[0.08] via-white/95 to-emerald-500/[0.06] backdrop-blur-2xl',
        cardBorder: 'border-teal-200/90 dark:border-teal-500/30 shadow-[0_8px_32px_rgba(0,107,99,0.08),0_1px_3px_rgba(0,0,0,0.04)]',
        titleGrad: 'bg-gradient-to-r from-[#003830] via-[#008779] via-35% to-[#10B981]',
        subtitleColor: 'text-slate-600 dark:text-slate-300 font-medium',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(14,165,233,0.18),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(45,212,191,0.22),transparent_70%)]',
        topLight: 'from-transparent via-teal-400/40 to-transparent',
        shimmerGlow: 'via-teal-400 shadow-[0_0_16px_#2dd4bf]',
        orb1: 'from-teal-400/35 via-emerald-200/25 to-transparent',
        orb2: 'from-cyan-300/30 via-teal-100/20 to-transparent',
        orb3: 'from-sky-200/25 via-emerald-100/20 to-transparent',
        accentText: 'text-teal-800 dark:text-teal-300',
        isNight: false,
        cycleTheme,
        setTheme,
        themeSetting,
      };

    case 'evening':
      return {
        timeOfDay: 'evening',
        phase: 'evening',
        label: 'Dusk Focus',
        subLabel: 'Sunset Synthesis & Revision',
        greeting: 'Good evening,',
        quote: 'Consolidate the day’s high-yield pearls.',
        Icon: Sunset,
        iconColor: 'text-orange-500',
        iconBg: 'bg-orange-500/15 border-orange-300/70 text-orange-800 dark:text-orange-300',
        badgeBg: 'bg-orange-500/12 dark:bg-orange-400/15',
        badgeText: 'text-orange-900 dark:text-orange-200 font-bold',
        badgeBorder: 'border-orange-300/80 dark:border-orange-400/30',
        bannerBg: 'bg-gradient-to-br from-orange-500/[0.08] via-white/95 to-amber-500/[0.06] backdrop-blur-2xl',
        cardBorder: 'border-orange-200/90 dark:border-orange-500/30 shadow-[0_8px_32px_rgba(249,115,22,0.08),0_1px_3px_rgba(0,0,0,0.04)]',
        titleGrad: 'bg-gradient-to-r from-stone-950 via-amber-950 to-orange-800',
        subtitleColor: 'text-slate-600 dark:text-slate-300 font-medium',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(249,115,22,0.22),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(244,63,94,0.16),transparent_70%)]',
        topLight: 'from-transparent via-orange-400/40 to-transparent',
        shimmerGlow: 'via-orange-400 shadow-[0_0_16px_#f97316]',
        orb1: 'from-orange-400/35 via-amber-200/25 to-transparent',
        orb2: 'from-rose-300/25 via-orange-100/20 to-transparent',
        orb3: 'from-amber-200/25 via-rose-100/20 to-transparent',
        accentText: 'text-orange-800 dark:text-orange-300',
        isNight: false,
        cycleTheme,
        setTheme,
        themeSetting,
      };

    case 'night':
    default:
      return {
        timeOfDay: 'night',
        phase: 'night',
        label: 'Night Focus',
        subLabel: 'Nocturnal Stargazer Focus',
        greeting: 'Good evening,',
        quote: 'Quiet nocturnal hours build clinical mastery.',
        Icon: Moon,
        iconColor: 'text-cyan-300',
        iconBg: 'bg-sky-950/80 border-sky-800/80 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
        badgeBg: 'bg-sky-500/25',
        badgeText: 'text-cyan-200 font-bold',
        badgeBorder: 'border-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.3)]',
        bannerBg: 'bg-gradient-to-br from-[#06111E] via-[#0B1E34] to-[#071524]',
        cardBorder: 'border-sky-500/40 shadow-[0_12px_44px_rgba(2,6,23,0.65),0_0_24px_rgba(56,189,248,0.15)]',
        titleGrad: 'bg-gradient-to-r from-white via-slate-100 to-cyan-200',
        subtitleColor: 'text-slate-300 font-medium',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(56,189,248,0.26),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(99,102,241,0.22),transparent_70%)]',
        topLight: 'from-transparent via-cyan-400/50 to-transparent',
        shimmerGlow: 'via-cyan-300 shadow-[0_0_20px_#38bdf8]',
        orb1: 'from-cyan-500/25 via-sky-400/15 to-transparent',
        orb2: 'from-indigo-500/25 via-blue-400/15 to-transparent',
        orb3: 'from-sky-400/20 via-cyan-300/10 to-transparent',
        accentText: 'text-cyan-300',
        isNight: true,
        cycleTheme,
        setTheme,
        themeSetting,
      };
  }
}

export function useCircadianTheme(themeSetting?: string): CircadianTheme {
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [override, setOverride] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fmge_circadian_override');
    }
    return null;
  });

  useEffect(() => {
    // Listen for cross-tab or in-app circadian theme changes
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setOverride(customEvent.detail || localStorage.getItem('fmge_circadian_override'));
    };

    window.addEventListener('circadian-theme-change', handleSync);
    window.addEventListener('storage', handleSync);

    const interval = setInterval(() => {
      const nowHour = new Date().getHours();
      setCurrentHour((prev) => (prev !== nowHour ? nowHour : prev));
    }, 60000);

    return () => {
      window.removeEventListener('circadian-theme-change', handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(interval);
    };
  }, []);

  const timeOfDay = useMemo(() => {
    if (override === 'morning' || override === 'afternoon' || override === 'evening' || override === 'night') {
      return override as TimeOfDay;
    }
    return resolveTimeOfDay(currentHour, themeSetting);
  }, [currentHour, themeSetting, override]);

  const cycleTheme = useCallback(() => {
    const cycleOrder: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    const currentIdx = cycleOrder.indexOf(timeOfDay);
    const nextTheme = cycleOrder[(currentIdx + 1) % cycleOrder.length];
    if (typeof window !== 'undefined') {
      localStorage.setItem('fmge_circadian_override', nextTheme);
      window.dispatchEvent(new CustomEvent('circadian-theme-change', { detail: nextTheme }));
    }
    setOverride(nextTheme);
  }, [timeOfDay]);

  const setTheme = useCallback((nextTheme: TimeOfDay | 'auto') => {
    if (typeof window !== 'undefined') {
      if (nextTheme === 'auto') {
        localStorage.removeItem('fmge_circadian_override');
        window.dispatchEvent(new CustomEvent('circadian-theme-change', { detail: null }));
        setOverride(null);
      } else {
        localStorage.setItem('fmge_circadian_override', nextTheme);
        window.dispatchEvent(new CustomEvent('circadian-theme-change', { detail: nextTheme }));
        setOverride(nextTheme);
      }
    }
  }, []);

  return useMemo(
    () => getCircadianTheme(timeOfDay, cycleTheme, setTheme, themeSetting || (override ? override : 'auto')),
    [timeOfDay, cycleTheme, setTheme, themeSetting, override]
  );
}
