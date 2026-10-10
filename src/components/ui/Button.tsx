import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY } from '@/utils/motionTokens';

/**
 * Button — the app's only button.
 *
 * Five intents, three sizes. Everything is expressed through the runtime
 * `--accent` pair, so a Button placed inside `[data-accent="mentor"]`
 * re-themes itself without being told.
 *
 * `pressed` is a separate visual from `hover`: on touch there is no hover,
 * and the app's tactile language is a 2% scale-down, not a colour change.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  // Use the ink step for white-on-accent contrast; keep the hue from the
  // current workspace while avoiding low-contrast lime, cyan, and orange fills.
  primary: cn(
    'bg-[var(--accent-ink)] text-white shadow-e3',
    'hover:brightness-[1.06] active:brightness-95',
  ),
  // Hairline-bordered neutral surface. The default for anything that is not
  // the one primary action in a view.
  secondary: cn(
    'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-hairline-strong)]',
    'shadow-e1 hover:bg-[var(--color-surface-row)]',
    'active:bg-[var(--color-surface-muted)]',
  ),
  // No surface until touched. For toolbars and inline actions.
  ghost: cn(
    'text-[var(--color-ink-2)]',
    'hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
  ),
  // Text-only, accent-tinted. Tertiary actions inside a card.
  quiet: 'text-accent hover:bg-accent-tint',
  danger: 'bg-[var(--color-fail-ink)] text-white shadow-e3 hover:brightness-105',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px]',
  // 44px: the tap-target floor, and the default for anything primary.
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-[15px]',
};

const RADIUS: Record<ButtonSize, string> = {
  sm: 'rounded-xl',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width. */
  block?: boolean;
  /** Square icon-only button; `size` sets the box. */
  icon?: boolean;
}

/**
 * The press response is a spring, not a CSS `active:scale`.
 *
 * A 150ms transform transition is a linear ramp: it starts and stops at full
 * speed, so a press reads as a snap rather than a physical push. This is the
 * one control every candidate touches all day, so it gets real spring physics
 * — a hair of lift on hover, a 2.5% compress on press, both settling on
 * `SPRING_SNAPPY`. Colour and shadow still transition via CSS; only the
 * transform is handed to motion, so nothing else about the button changes.
 */
function useButtonPress() {
  const reduced = useReducedMotion();
  if (reduced) return {};
  return {
    whileHover: { scale: 1.015, transition: SPRING_SNAPPY },
    whileTap: { scale: 0.975, transition: SPRING_SNAPPY },
  };
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'secondary', size = 'md', block, icon, className, children, type = 'button', ...props },
    ref,
  ) => {
    const press = useButtonPress();
    /* `ButtonProps` extends the DOM button attributes, whose `onAnimationStart`
       / `onAnimationEnd` / `onAnimationIteration` mean CSS animation events.
       Motion redefines those three as its own animation callbacks, so the two
       signatures are genuinely incompatible. Nothing in the app passes them, and
       the runtime behaviour is identical, so the rest is forwarded as-is. */
    const rest = props as unknown as React.ComponentProps<typeof motion.button>;
    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex select-none items-center justify-center whitespace-nowrap',
          'font-semibold tracking-[-0.01em]',
          'transition-[background-color,color,filter,box-shadow] duration-150',
          'disabled:pointer-events-none disabled:opacity-45',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
          VARIANT[variant],
          SIZE[size],
          RADIUS[size],
          icon && (size === 'lg' ? 'w-12 px-0' : size === 'sm' ? 'w-9 px-0' : 'w-11 px-0'),
          block && 'w-full',
          className,
        )}
        {...press}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';

/**
 * Pill — the app's chip. Status, filters, subjects, follow-ups.
 *
 * Built on `rounded-full` because a pill is *meant* to be a pill; the
 * 82 misuses of `rounded-full` on rectangular controls in the Mentor tab
 * were the actual inconsistency.
 */
export type PillTone = 'neutral' | 'accent' | 'pass' | 'warn' | 'fail' | 'info';

const PILL_TONE: Record<PillTone, string> = {
  neutral: 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-2)]',
  accent: 'bg-accent-tint text-[var(--accent-ink)]',
  pass: 'bg-[var(--color-pass-wash)] text-[var(--color-pass-ink)]',
  warn: 'bg-[var(--color-warn-wash)] text-[var(--color-warn-ink)]',
  fail: 'bg-[var(--color-fail-wash)] text-[var(--color-fail-ink)]',
  info: 'bg-[var(--color-home-wash)] text-[var(--color-ios-blue)]',
};

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /** Renders as a real, keyboard-operable button when provided. */
  onClick?: React.MouseEventHandler<HTMLElement>;
  selected?: boolean;
  disabled?: boolean;
}

export const Pill = React.forwardRef<HTMLElement, PillProps>(
  ({ tone = 'neutral', onClick, selected, disabled, className, children, ...props }, ref) => {
    const cls = cn(
      'inline-flex min-h-7 items-center gap-1.5 rounded-full',
      'px-3 py-1 text-xs font-semibold tracking-[0.005em]',
      'transition-[background-color,color,border-color,filter] duration-150',
      onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      PILL_TONE[tone],
      selected && 'ring-1 ring-inset ring-accent',
      className,
    );

    if (onClick) {
      return (
        <button
          type="button"
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
          disabled={disabled}
          className={cls}
          aria-pressed={selected}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      );
    }
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={cls} {...props}>
        {children}
      </span>
    );
  },
);
Pill.displayName = 'Pill';

/** The uppercase micro-label that sits above a hero or a section. */
export function Eyebrow({
  children,
  className,
  tone = 'accent',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'accent' | 'neutral';
}) {
  return (
    <span
      className={cn(
        't-eyebrow',
        tone === 'accent' ? 'text-accent' : 'text-[var(--color-ink-3)]',
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Card — the surface unit. One border recipe, one radius, one shadow.
 *
 * `raised` is for anything that floats (a sticky header, a docked composer);
 * plain is for content that sits *in* the page and should not compete with
 * it for attention.
 */
export function Card({
  children,
  className,
  raised,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  raised?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'surface-card',
        raised && 'surface-card-raised material-thick',
        interactive && 'surface-card-interactive cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Hairline separator that respects the current surface. */
export function Divider({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={cn(
        vertical ? 'w-px self-stretch' : 'h-px w-full',
        'bg-[var(--color-hairline)]',
        className,
      )}
    />
  );
}
