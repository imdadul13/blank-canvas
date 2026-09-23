import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, SunMedium, Sunset, Moon, Activity, ChevronDown, Check } from 'lucide-react';
import { CircadianTheme, TimeOfDay } from '../hooks/useCircadianTheme';

interface CircadianFocusDropdownProps {
  circadian: CircadianTheme;
  className?: string;
  align?: 'right' | 'left';
}

export const CircadianFocusDropdown: React.FC<CircadianFocusDropdownProps> = ({
  circadian,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
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
    timeTag: string;
    icon: typeof Sun;
    color: string;
  }> = [
    { id: 'auto', label: 'Auto Solar', timeTag: 'Live Solar', icon: Activity, color: 'text-emerald-500' },
    { id: 'morning', label: 'Dawn Focus', timeTag: '05:00 - 12:00', icon: Sun, color: 'text-amber-500' },
    { id: 'afternoon', label: 'Zenith Focus', timeTag: '12:00 - 17:00', icon: SunMedium, color: 'text-teal-500' },
    { id: 'evening', label: 'Dusk Focus', timeTag: '17:00 - 21:00', icon: Sunset, color: 'text-orange-500' },
    { id: 'night', label: 'Night Focus', timeTag: '21:00 - 05:00', icon: Moon, color: 'text-sky-400' },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block text-left z-40 ${className}`}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-xl transition-all cursor-pointer border select-none ${
          circadian.isNight
            ? 'bg-slate-900/90 text-slate-100 border-sky-500/40 hover:bg-slate-800 hover:border-cyan-400 shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]'
            : 'bg-white/95 text-slate-900 border-teal-200/80 hover:bg-white hover:border-teal-400 shadow-[0_4px_16px_rgba(0,107,99,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)]'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${circadian.iconColor} stroke-[2.4] shrink-0`} />
        <span className="font-bold tracking-tight">{focusLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-250 opacity-70 ${isOpen ? 'rotate-180 text-teal-600 dark:text-cyan-400' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent backdrop shield to safely isolate popover and prevent unwanted clicks */}
            <div
              className="fixed inset-0 z-40 bg-black/10 dark:bg-black/40 backdrop-blur-[1px]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1.5 w-64 rounded-2xl p-1.5 z-50 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.25)] border ${
                circadian.isNight
                  ? 'bg-slate-900/98 border-slate-700 text-slate-100 ring-1 ring-sky-500/30'
                  : 'bg-white/98 border-slate-200/90 text-slate-900 ring-1 ring-teal-500/15'
              }`}
            >
              <div className={`px-2.5 py-1 mb-1 text-[10px] font-mono font-black uppercase tracking-wider border-b flex items-center justify-between ${
                circadian.isNight ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-200/80'
              }`}>
                <span>Circadian Focus</span>
                <span className={`text-[8.5px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                  circadian.isNight
                    ? 'text-cyan-300 bg-sky-950/80 border-sky-500/40'
                    : 'text-teal-700 bg-teal-500/10 border-teal-300/40'
                }`}>
                  Solar SF
                </span>
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
                    <motion.button
                      key={p.id}
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      onClick={() => {
                        circadian.setTheme(p.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? circadian.isNight
                            ? 'bg-sky-950/90 text-cyan-200 font-extrabold border border-cyan-500/40 shadow-xs'
                            : 'bg-teal-500/15 text-[#004D40] font-extrabold border border-teal-300/80 shadow-xs'
                          : circadian.isNight
                          ? 'hover:bg-slate-800/90 text-slate-200 hover:text-white'
                          : 'hover:bg-slate-100/90 text-slate-800 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 ${p.color} shrink-0 stroke-[2.2]`} />
                        <span className="font-bold text-xs truncate">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-[10px] font-mono font-medium ${
                          circadian.isNight ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {p.timeTag}
                        </span>
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 shrink-0 stroke-[3] ${
                            circadian.isNight ? 'text-cyan-300' : 'text-emerald-600'
                          }`} />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
