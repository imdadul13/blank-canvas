import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

/**
 * Popover — anchored floating surface.
 *
 * Exists because the Mentor tab had a hand-rolled dropdown that rendered
 * *inside* the header at `z-[300]`, which meant it floated on top of every
 * `z-[100]` overlay in the tab. Portalling it fixes that permanently: a
 * popover's stacking no longer depends on where its trigger happens to live
 * in the DOM.
 *
 * Radix supplies the collision-aware positioning, outside-press dismissal,
 * Escape, focus management and typeahead; Motion supplies the scale/blur.
 */

/**
 * Lets a row dismiss the popover it lives in. "Pick one, menu closes" is the
 * expected behaviour everywhere, and it used to be re-implemented per call
 * site — the circadian dropdown was the one place that remembered to.
 */
const PopoverCloseContext = React.createContext<() => void>(() => {});

const SURFACE =
  'z-popover w-72 origin-[var(--radix-popover-content-transform-origin)] overflow-hidden ' +
  'rounded-2xl border border-[var(--color-hairline)] bg-white p-1.5 material-thick';

export interface PopoverProps {
  /** Controlled open state. Omit for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The trigger. Gets the a11y wiring and the open-state data attribute. */
  trigger: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  /** Identity hue for the portal, which sits outside any `data-accent` scope. */
  accent?: string;
  /** Popover content. Use <PopoverItem> and <PopoverLabel> inside. */
  children: React.ReactNode;
  contentClassName?: string;
}

export function Popover({
  open: openProp,
  onOpenChange,
  trigger,
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
  accent,
  children,
  contentClassName,
}: PopoverProps) {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const open = openProp ?? uncontrolled;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverCloseContext.Provider value={close}>
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>

      {/*
        No `open &&` branch and no AnimatePresence: Radix's Presence already
        holds the node while a CSS animation runs, and it keeps it mounted for
        the `data-state="closed"` frame so the exit can play. Driving the
        branch by hand would cut the exit off mid-flight.
      */}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={cn(
            SURFACE,
            'data-[state=open]:anim-pop-in data-[state=closed]:anim-pop-out',
            contentClassName,
          )}
          style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
        >
            {children}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverCloseContext.Provider>
    </PopoverPrimitive.Root>
  );
}

/**
 * One selectable row. A plain button rather than a Radix `Item` — Popover has
 * no item collection, so arrow-key roving would be the caller's job. Menus
 * that need arrow-key navigation should get a real Menu primitive.
 */
export const PopoverItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(({ children, className, active, onClick, ...props }, ref) => {
  const close = React.useContext(PopoverCloseContext);
  return (
  <button
    ref={ref}
    type="button"
    aria-current={active || undefined}
    onClick={(e) => {
      onClick?.(e);
      close();
    }}
    className={cn(
      'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2.5',
      'text-left text-[13px] font-medium',
      'transition-colors',
      'hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
      'focus-visible:outline-none focus-visible:bg-accent-tint focus-visible:text-accent',
      active && 'bg-accent-tint text-accent',
      className,
    )}
    {...props}
  >
    {children}
  </button>
  );
});
PopoverItem.displayName = 'PopoverItem';

/** Section heading inside a popover. */
export function PopoverLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('t-eyebrow px-3 pb-1 pt-2.5', className)}>{children}</div>;
}

export function PopoverSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-[var(--color-hairline)]" />;
}
