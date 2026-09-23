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
        iconBg: 'bg-amber-500/15 border-amber-300/90 text-amber-950 dark:text-amber-200',
        badgeBg: 'bg-amber-500/15 dark:bg-amber-400/20',
        badgeText: 'text-amber-950 dark:text-amber-200 font-black',
        badgeBorder: 'border-amber-300 dark:border-amber-400/40',
        bannerBg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-slate-200/90 dark:border-slate-800',
        cardBorder: 'border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)]',
        titleGrad: 'bg-gradient-to-r from-slate-950 via-teal-900 to-[#10B981]',
        subtitleColor: 'text-slate-700 dark:text-slate-200 font-semibold',
        auraGrad: 'bg-[radial-gradient(ellipse_60%_50%_at_15%_10%,rgba(245,158,11,0.06),transparent_60%),radial-gradient(ellipse_50%_40%_at_85%_80%,rgba(20,184,166,0.05),transparent_60%)]',
        topLight: 'from-transparent via-amber-400/40 to-transparent',
        shimmerGlow: 'via-amber-400 shadow-[0_0_16px_#f59e0b]',
        orb1: 'from-amber-400/10 via-amber-200/5 to-transparent',
        orb2: 'from-teal-400/10 via-emerald-200/5 to-transparent',
        orb3: 'from-amber-300/8 via-transparent to-transparent',
        accentText: 'text-amber-950 dark:text-amber-300 font-black',
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
        iconBg: 'bg-teal-500/15 border-teal-300/90 text-teal-950 dark:text-teal-200',
        badgeBg: 'bg-teal-500/15 dark:bg-teal-400/20',
        badgeText: 'text-teal-950 dark:text-teal-200 font-black',
        badgeBorder: 'border-teal-300 dark:border-teal-400/40',
        bannerBg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-slate-200/90 dark:border-slate-800',
        cardBorder: 'border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)]',
        titleGrad: 'bg-gradient-to-r from-slate-950 via-teal-900 to-[#10B981]',
        subtitleColor: 'text-slate-700 dark:text-slate-200 font-semibold',
        auraGrad: 'bg-[radial-gradient(ellipse_60%_50%_at_15%_10%,rgba(13,148,136,0.06),transparent_60%),radial-gradient(ellipse_50%_40%_at_85%_80%,rgba(16,185,129,0.05),transparent_60%)]',
        topLight: 'from-transparent via-teal-400/40 to-transparent',
        shimmerGlow: 'via-teal-400 shadow-[0_0_16px_#2dd4bf]',
        orb1: 'from-teal-400/10 via-emerald-200/5 to-transparent',
        orb2: 'from-cyan-300/10 via-teal-100/5 to-transparent',
        orb3: 'from-sky-200/8 via-transparent to-transparent',
        accentText: 'text-teal-950 dark:text-teal-300 font-black',
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
        iconBg: 'bg-orange-500/15 border-orange-300/90 text-orange-950 dark:text-orange-200',
        badgeBg: 'bg-orange-500/15 dark:bg-orange-400/20',
        badgeText: 'text-orange-950 dark:text-orange-200 font-black',
        badgeBorder: 'border-orange-300 dark:border-orange-400/40',
        bannerBg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-slate-200/90 dark:border-slate-800',
        cardBorder: 'border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)]',
        titleGrad: 'bg-gradient-to-r from-slate-950 via-amber-950 to-orange-800',
        subtitleColor: 'text-slate-700 dark:text-slate-200 font-semibold',
        auraGrad: 'bg-[radial-gradient(ellipse_60%_50%_at_15%_10%,rgba(249,115,22,0.06),transparent_60%),radial-gradient(ellipse_50%_40%_at_85%_80%,rgba(244,63,94,0.05),transparent_60%)]',
        topLight: 'from-transparent via-orange-400/40 to-transparent',
        shimmerGlow: 'via-orange-400 shadow-[0_0_16px_#f97316]',
        orb1: 'from-orange-400/10 via-amber-200/5 to-transparent',
        orb2: 'from-rose-300/10 via-orange-100/5 to-transparent',
        orb3: 'from-amber-200/8 via-transparent to-transparent',
        accentText: 'text-orange-950 dark:text-orange-300 font-black',
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
        badgeText: 'text-cyan-200 font-extrabold',
        badgeBorder: 'border-cyan-400/60 shadow-[0_0_14px_rgba(56,189,248,0.35)]',
        bannerBg: 'bg-gradient-to-br from-[#060D18] via-[#0B1829] to-[#081220] backdrop-blur-2xl',
        cardBorder: 'border-sky-500/50 shadow-[0_16px_50px_rgba(2,6,23,0.7),0_0_28px_rgba(56,189,248,0.2),inset_0_1px_1.5px_rgba(255,255,255,0.15)]',
        titleGrad: 'bg-gradient-to-r from-white via-slate-100 to-cyan-200',
        subtitleColor: 'text-slate-200 font-semibold',
        auraGrad: 'bg-[radial-gradient(ellipse_75%_65%_at_15%_15%,rgba(56,189,248,0.28),transparent_70%),radial-gradient(ellipse_70%_60%_at_85%_85%,rgba(99,102,241,0.22),transparent_70%)]',
        topLight: 'from-transparent via-cyan-400/50 to-transparent',
        shimmerGlow: 'via-cyan-300 shadow-[0_0_20px_#38bdf8]',
        orb1: 'from-cyan-500/25 via-sky-400/15 to-transparent',
        orb2: 'from-indigo-500/25 via-blue-400/15 to-transparent',
        orb3: 'from-sky-400/20 via-cyan-300/10 to-transparent',
        accentText: 'text-cyan-300 font-bold',
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
