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

export function getCircadianTheme(timeOfDay: TimeOfDay, cycleTheme: () => void): CircadianTheme {
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
        iconBg: 'bg-amber-50/90 border-amber-200/80 text-amber-700',
        badgeBg: 'bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-teal-500/10',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-200/80',
        bannerBg: 'bg-gradient-to-br from-[#FFFDF7] via-[#FAFBF8] via-45% to-[#EEFBF7]',
        cardBorder: 'border-stone-200/80',
        titleGrad: 'bg-gradient-to-r from-[#003830] via-[#008779] via-35% to-[#10B981]',
        subtitleColor: 'text-stone-600',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(251,191,36,0.18),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(45,212,191,0.16),transparent_70%)]',
        topLight: 'from-transparent via-amber-400/35 to-transparent',
        shimmerGlow: 'via-amber-400 shadow-[0_0_14px_#f59e0b]',
        orb1: 'from-amber-400/35 via-yellow-200/25 to-transparent',
        orb2: 'from-teal-300/30 via-emerald-100/20 to-transparent',
        orb3: 'from-amber-200/25 via-teal-100/20 to-transparent',
        accentText: 'text-amber-700',
        isNight: false,
        cycleTheme,
      };

    case 'afternoon':
      return {
        timeOfDay: 'afternoon',
        phase: 'afternoon',
        label: 'Daylight Sprint',
        subLabel: 'High-Zenith Clinical Drill',
        greeting: 'Good afternoon,',
        quote: 'Peak cognitive momentum for active recall.',
        Icon: SunMedium,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-50/90 border-stone-200/80 text-[#006B63]',
        badgeBg: 'bg-gradient-to-r from-teal-500/15 via-emerald-400/10 to-sky-500/10',
        badgeText: 'text-teal-800',
        badgeBorder: 'border-stone-200/80',
        bannerBg: 'bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#EEFBFB]',
        cardBorder: 'border-stone-200/80',
        titleGrad: 'bg-gradient-to-r from-[#003830] via-[#008779] via-35% to-[#10B981]',
        subtitleColor: 'text-stone-600',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(14,165,233,0.16),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(45,212,191,0.18),transparent_70%)]',
        topLight: 'from-transparent via-teal-400/35 to-transparent',
        shimmerGlow: 'via-teal-400 shadow-[0_0_14px_#2dd4bf]',
        orb1: 'from-teal-400/35 via-emerald-200/25 to-transparent',
        orb2: 'from-cyan-300/30 via-teal-100/20 to-transparent',
        orb3: 'from-sky-200/25 via-emerald-100/20 to-transparent',
        accentText: 'text-teal-700',
        isNight: false,
        cycleTheme,
      };

    case 'evening':
      return {
        timeOfDay: 'evening',
        phase: 'evening',
        label: 'Golden Hour',
        subLabel: 'Sunset Synthesis & Revision',
        greeting: 'Good evening,',
        quote: 'Consolidate the day’s high-yield pearls.',
        Icon: Sunset,
        iconColor: 'text-orange-500',
        iconBg: 'bg-orange-50/90 border-orange-200/80 text-orange-700',
        badgeBg: 'bg-gradient-to-r from-orange-500/15 via-amber-400/10 to-rose-500/10',
        badgeText: 'text-orange-800',
        badgeBorder: 'border-orange-200/80',
        bannerBg: 'bg-gradient-to-br from-[#FFF9F3] via-[#FAF8F5] via-45% to-[#F5ECE5]',
        cardBorder: 'border-stone-200/80',
        titleGrad: 'bg-gradient-to-r from-stone-950 via-amber-950 to-orange-800',
        subtitleColor: 'text-stone-600',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(249,115,22,0.18),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(244,63,94,0.14),transparent_70%)]',
        topLight: 'from-transparent via-orange-400/40 to-transparent',
        shimmerGlow: 'via-orange-400 shadow-[0_0_14px_#f97316]',
        orb1: 'from-orange-400/35 via-amber-200/25 to-transparent',
        orb2: 'from-rose-300/25 via-orange-100/20 to-transparent',
        orb3: 'from-amber-200/25 via-rose-100/20 to-transparent',
        accentText: 'text-orange-700',
        isNight: false,
        cycleTheme,
      };

    case 'night':
    default:
      return {
        timeOfDay: 'night',
        phase: 'night',
        label: 'Night Vigil',
        subLabel: 'Nocturnal Stargazer Focus',
        greeting: 'Good evening,',
        quote: 'Quiet nocturnal hours build clinical mastery.',
        Icon: Moon,
        iconColor: 'text-cyan-300',
        iconBg: 'bg-sky-950/80 border-sky-800/80 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
        badgeBg: 'bg-gradient-to-r from-sky-500/25 via-cyan-500/20 to-indigo-500/20',
        badgeText: 'text-cyan-200',
        badgeBorder: 'border-cyan-500/50 shadow-[0_0_10px_rgba(56,189,248,0.25)]',
        bannerBg: 'bg-gradient-to-br from-[#06111E] via-[#0B1E34] via-45% to-[#071524]',
        cardBorder: 'border-sky-800/40 shadow-[0_12px_36px_rgba(2,6,23,0.5)]',
        titleGrad: 'bg-gradient-to-r from-white via-slate-100 to-cyan-200',
        subtitleColor: 'text-slate-300',
        auraGrad: 'bg-[radial-gradient(ellipse_85%_65%_at_15%_18%,rgba(56,189,248,0.24),transparent_65%),radial-gradient(ellipse_75%_55%_at_85%_85%,rgba(99,102,241,0.20),transparent_70%)]',
        topLight: 'from-transparent via-cyan-400/50 to-transparent',
        shimmerGlow: 'via-cyan-300 shadow-[0_0_20px_#38bdf8]',
        orb1: 'from-cyan-500/25 via-sky-400/15 to-transparent',
        orb2: 'from-indigo-500/25 via-blue-400/15 to-transparent',
        orb3: 'from-sky-400/20 via-cyan-300/10 to-transparent',
        accentText: 'text-cyan-300',
        isNight: true,
        cycleTheme,
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

  return useMemo(() => getCircadianTheme(timeOfDay, cycleTheme), [timeOfDay, cycleTheme]);
}
