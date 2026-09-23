import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, SunMedium, Sunset, Moon, Activity, ChevronDown, Check } from 'lucide-react';
import { CircadianTheme, TimeOfDay } from '../hooks/useCircadianTheme';

interface CircadianFocusDropdownProps {
  circadian: CircadianTheme;
  className?: string;
}

export const CircadianFocusDropdown: React.FC<CircadianFocusDropdownProps> = ({
  circadian,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Current display label matching the reference banner (e.g., "Dawn Focus", "Zenith Focus", etc.)
  const focusLabel =
    circadian.timeOfDay === 'morning'
      ? 'Dawn Focus'
      : circadian.timeOfDay === 'afternoon'
      ? 'Zenith Focus'
      : circadian.timeOfDay === 'evening'
      ? 'Dusk Focus'
      : 'Night Focus';

  const CurrentIcon = circadian.Icon;

  const phases: Array<{
    id: TimeOfDay | 'auto';
    label: string;
    sublabel: string;
    icon: typeof Sun;
    color: string;
  }> = [
    { id: 'auto', label: 'Automatic Solar', sublabel: 'Harmonize with daylight', icon: Activity, color: 'text-emerald-500' },
    { id: 'morning', label: 'Dawn Focus', sublabel: '05:00 – 12:00 · Morning clarity', icon: Sun, color: 'text-amber-500' },
    { id: 'afternoon', label: 'Zenith Focus', sublabel: '12:00 – 17:00 · Peak momentum', icon: SunMedium, color: 'text-teal-500' },
    { id: 'evening', label: 'Dusk Focus', sublabel: '17:00 – 21:00 · Golden hour', icon: Sunset, color: 'text-orange-500' },
    { id: 'night', label: 'Night Focus', sublabel: '21:00 – 05:00 · Nocturnal calm', icon: Moon, color: 'text-sky-400' },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block text-left z-30 ${className}`}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer border select-none ${
          circadian.isNight
            ? 'bg-slate-900/85 text-slate-100 border-slate-700/80 hover:bg-slate-800 hover:border-cyan-500/50 shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
            : 'bg-white/90 text-slate-800 border-stone-200/90 hover:bg-white hover:border-teal-400/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${circadian.iconColor} stroke-[2.2] shrink-0`} />
        <span className="font-semibold tracking-tight">{focusLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`absolute right-0 mt-1.5 w-60 rounded-2xl p-1.5 z-50 backdrop-blur-2xl shadow-2xl border ${
              circadian.isNight
                ? 'bg-slate-900/95 border-slate-700/90 text-slate-100 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
                : 'bg-white/95 border-stone-200/95 text-slate-800 shadow-[0_16px_48px_rgba(0,107,99,0.12)]'
            }`}
          >
            <div className="px-2.5 py-1.5 mb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <span>Circadian Lighting</span>
              <span className="text-[9px] font-mono text-teal-600 dark:text-teal-400 font-bold uppercase">SwiftUI</span>
            </div>
            <div className="space-y-0.5">
              {phases.map((p) => {
                const Icon = p.icon;
                const isSelected =
                  p.id === 'auto'
                    ? circadian.themeSetting === 'auto'
                    : p.id === 'morning'
                    ? circadian.themeSetting === 'morning' || (circadian.themeSetting === 'auto' && circadian.timeOfDay === 'morning')
                    : p.id === 'afternoon'
                    ? circadian.themeSetting === 'afternoon' || (circadian.themeSetting === 'auto' && circadian.timeOfDay === 'afternoon')
                    : p.id === 'evening'
                    ? circadian.themeSetting === 'evening' || circadian.themeSetting === 'sunset' || (circadian.themeSetting === 'auto' && circadian.timeOfDay === 'evening')
                    : circadian.themeSetting === 'night' || (circadian.themeSetting === 'auto' && circadian.timeOfDay === 'night');

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      circadian.setTheme(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? circadian.isNight
                          ? 'bg-sky-950/80 text-cyan-200 font-bold'
                          : 'bg-teal-50 text-[#006B63] font-bold'
                        : circadian.isNight
                        ? 'hover:bg-slate-800/80 text-slate-200'
                        : 'hover:bg-stone-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${p.color} shrink-0`} />
                      <div>
                        <p className="leading-tight font-semibold">{p.label}</p>
                        <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{p.sublabel}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
