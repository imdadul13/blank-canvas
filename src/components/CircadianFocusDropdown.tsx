import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Sunset, Moon, Activity, ChevronDown, Check } from 'lucide-react';
import { CircadianTheme } from '../hooks/useCircadianTheme';

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

  // Current display label matching the reference banner (e.g., "Dawn Focus", "Afternoon Focus", etc.)
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
    id: 'morning' | 'sunset' | 'night' | 'auto';
    label: string;
    sublabel: string;
    icon: typeof Sun;
    color: string;
  }> = [
    { id: 'auto', label: 'Automatic Solar', sublabel: 'Harmonize with daylight', icon: Activity, color: 'text-emerald-500' },
    { id: 'morning', label: 'Dawn Focus', sublabel: '05:00 – 12:00 Morning clarity', icon: Sun, color: 'text-amber-500' },
    { id: 'sunset', label: 'Dusk Focus', sublabel: '17:00 – 21:00 Golden hour', icon: Sunset, color: 'text-orange-500' },
    { id: 'night', label: 'Night Focus', sublabel: '21:00 – 05:00 Nocturnal calm', icon: Moon, color: 'text-sky-400' },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-xs border select-none ${
          circadian.isNight
            ? 'bg-slate-900/80 text-cyan-200 border-cyan-500/30 hover:bg-slate-800'
            : 'bg-white/90 text-amber-900 border-amber-200/80 hover:bg-amber-50/60'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${circadian.iconColor} stroke-[2.2] shrink-0`} />
        <span className="font-medium tracking-tight">{focusLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 mt-1.5 w-56 rounded-2xl p-1.5 z-50 backdrop-blur-xl shadow-xl border ${
              circadian.isNight
                ? 'bg-slate-900/95 border-sky-800/80 text-slate-200'
                : 'bg-white/95 border-stone-200/90 text-slate-800'
            }`}
          >
            <div className="px-2.5 py-1.5 mb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
              Circadian Lighting
            </div>
            {phases.map((p) => {
              const Icon = p.icon;
              const isSelected =
                p.id === 'auto'
                  ? circadian.themeSetting === 'auto'
                  : p.id === 'morning'
                  ? circadian.themeSetting === 'morning' || (circadian.themeSetting === 'auto' && circadian.timeOfDay === 'morning')
                  : p.id === 'sunset'
                  ? circadian.themeSetting === 'sunset' || (circadian.themeSetting === 'auto' && (circadian.timeOfDay === 'afternoon' || circadian.timeOfDay === 'evening'))
                  : circadian.themeSetting === 'night' || (circadian.themeSetting === 'auto' && circadian.timeOfDay === 'night');

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    circadian.setTheme(p.id as any);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? circadian.isNight
                        ? 'bg-sky-950/80 text-cyan-200 font-bold'
                        : 'bg-teal-50 text-[#006B63] font-bold'
                      : circadian.isNight
                      ? 'hover:bg-slate-800 text-slate-300'
                      : 'hover:bg-stone-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                    <div>
                      <p className="leading-tight">{p.label}</p>
                      <p className="text-[10px] font-normal text-slate-400 leading-tight">{p.sublabel}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
