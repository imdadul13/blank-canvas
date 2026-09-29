import React from 'react';
import { Activity, Check, ChevronDown, Moon, Sun, SunMedium, Sunset } from 'lucide-react';
import { CircadianTheme, TimeOfDay } from '../hooks/useCircadianTheme';
import { Popover, PopoverItem, PopoverLabel } from './ui/Popover';
import { cn } from '@/lib/utils';

interface CircadianFocusDropdownProps {
  circadian: CircadianTheme;
  className?: string;
  align?: 'start' | 'center' | 'end' | 'right' | 'left';
  /** Read the trigger off a dark backdrop (the Mentor hero) or a light one. */
  isDark?: boolean;
}

const PHASES: Array<{
  id: TimeOfDay | 'auto';
  label: string;
  time: string;
  icon: typeof Sun;
  color: string;
}> = [
  { id: 'auto', label: 'Auto Solar', time: 'Live', icon: Activity, color: '#30D158' },
  { id: 'morning', label: 'Dawn Focus', time: '05:00–12:00', icon: Sun, color: '#FF9500' },
  { id: 'afternoon', label: 'Zenith Focus', time: '12:00–17:00', icon: SunMedium, color: '#5AC8FA' },
  { id: 'evening', label: 'Dusk Focus', time: '17:00–21:00', icon: Sunset, color: '#FF6B35' },
  { id: 'night', label: 'Night Focus', time: '21:00–05:00', icon: Moon, color: '#BF5AF2' },
];

export const CircadianFocusDropdown: React.FC<CircadianFocusDropdownProps> = ({
  circadian,
  className = '',
  align = 'end',
  isDark = true,
}) => {
  const popoverAlign = align === 'right' ? 'end' : align === 'left' ? 'start' : align;
  const focusLabel =
    circadian.timeOfDay === 'morning'
      ? 'Dawn Focus'
      : circadian.timeOfDay === 'afternoon'
        ? 'Zenith Focus'
        : circadian.timeOfDay === 'evening'
          ? 'Dusk Focus'
          : 'Night Focus';

  const currentPhase = PHASES.find((p) => p.id === circadian.timeOfDay) ?? PHASES[2];
  const CurrentIcon = circadian.Icon;

  const isSelected = (id: TimeOfDay | 'auto') => {
    if (id === 'auto') return circadian.themeSetting === 'auto' || !circadian.themeSetting;
    if (circadian.themeSetting === id) return true;
    // 'sunset' is the legacy stored value for the evening phase.
    if (id === 'evening' && circadian.themeSetting === 'sunset') return true;
    return circadian.themeSetting === 'auto' && circadian.timeOfDay === id;
  };

  return (
    <Popover
      align={popoverAlign}
      side="bottom"
      // Portalled to <body>, so it needs the accent handed to it explicitly.
      accent="var(--color-mentor)"
      trigger={
        <button
          type="button"
          className={cn(
            'hit-expand inline-flex min-h-[36px] select-none items-center gap-1.5 rounded-full py-1.5 pl-2.5 pr-3',
            'text-[12px] font-semibold tracking-tight transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            isDark
              ? 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
              : 'border border-[rgba(60,60,67,0.12)] bg-white/80 text-[#1D1D1F] hover:bg-white',
            className,
          )}
        >
          <span
            aria-hidden="true"
            className="grid size-5 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: `${currentPhase.color}30`, color: currentPhase.color }}
          >
            <CurrentIcon className="size-3 stroke-[2.2]" />
          </span>
          <span>{focusLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-3 transition-transform duration-200',
              isDark ? 'text-white/50' : 'text-[#8E8E93]',
            )}
            // Rotate the chevron from the trigger's own open state.
            style={{ rotate: 'var(--radix-popover-trigger-open, 0deg)' }}
          />
        </button>
      }
    >
      <PopoverLabel>Circadian phase</PopoverLabel>
      {PHASES.map((p) => {
        const Icon = p.icon;
        const selected = isSelected(p.id);
        return (
          <PopoverItem
            key={p.id}
            active={selected}
            onClick={() => circadian.setTheme(p.id)}
            className="gap-3"
          >
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: `${p.color}20`, color: p.color }}
            >
              <Icon className="size-3.5 stroke-[2]" />
            </span>
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            <span className="t-caption shrink-0 tabular-nums text-[var(--color-ink-3)]">
              {p.time}
            </span>
            {selected && <Check aria-hidden="true" className="size-3.5 shrink-0 stroke-[2.5]" />}
          </PopoverItem>
        );
      })}
    </Popover>
  );
};
