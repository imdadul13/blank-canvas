import type { Transition } from 'motion/react';

/**
 * Motion Tokens — SwiftUI-inspired motion grammar.
 *
 * Springs communicate direct manipulation and spatial movement. Opacity,
 * progress and backdrop changes use finite curves: springing those properties
 * creates an artificial flash that does not exist in native iOS transitions.
 */

// ── SwiftUI Spring Presets ──────────────────────────────────────────────────

/** .snappy — tab switches, nav pills, icon hits. No visible bounce. */
export const SPRING_SNAPPY  = { type: 'spring' as const, stiffness: 400, damping: 35, mass: 1 };

/** .smooth — page-level transitions, card enters. Barely-perceptible settle. */
export const SPRING_SMOOTH  = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };

/** .bouncy — celebratory reveals, stat counter finishes. Playful overshoot. */
export const SPRING_BOUNCY  = { type: 'spring' as const, stiffness: 420, damping: 20, mass: 1 };

/** .gentle — large modal sheets, sidebar expand. Slow, authoritative settle. */
export const SPRING_GENTLE  = { type: 'spring' as const, stiffness: 260, damping: 32, mass: 1 };

/** Default — used wherever a single spring is referenced generically. */
export const EASE_SPRING = SPRING_SMOOTH;

// ── Bézier Easing ───────────────────────────────────────────────────────────

/** Apple's preferred ease-out — fast start, graceful tail. */
export const EASE_SWIFT     = [0.16, 1, 0.3, 1] as const;
/** Softer ease-out for larger, slower elements. */
export const EASE_GENTLE    = [0.25, 1, 0.5, 1] as const;
/** Extreme ease-out for hero reveals. */
export const EASE_OUT_EXPO  = [0.19, 1, 0.22, 1] as const;

export const MOTION_DURATION = {
  instant: 0.12,
  fast: 0.18,
  standard: 0.24,
  deliberate: 0.32,
} as const;

export const FADE_TRANSITION: Transition = {
  duration: MOTION_DURATION.fast,
  ease: EASE_SWIFT,
};

export const REDUCED_TRANSITION: Transition = {
  duration: MOTION_DURATION.instant,
  ease: 'linear',
};

// ── Composed Transition Factories ───────────────────────────────────────────

/** View-level transition. Tabs crossfade with only a trace of depth movement. */
export const PAGE_TRANSITION = (reduced: boolean | null) => ({
  initial:    reduced ? { opacity: 0 } : { opacity: 0, y: 5, scale: 0.998 },
  animate:    { opacity: 1, y: 0, scale: 1 },
  exit:       reduced ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.998 },
  transition: reduced ? REDUCED_TRANSITION : { duration: MOTION_DURATION.standard, ease: EASE_SWIFT },
});

/** Staggered list/card entrance — 40ms between each item, capped at 320ms total. */
export const CARD_STAGGER = (index: number, reduced: boolean | null) => ({
  initial:    reduced ? false : { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  transition: reduced
    ? { duration: 0 }
    : { ...SPRING_SMOOTH, delay: Math.min(index * 0.04, 0.32) },
});

/** Card hover — lifts 3px, barely scales. Tap snaps back. */
export const CARD_HOVER = (reduced: boolean | null) =>
  reduced ? {} : {
    whileHover: { y: -3, scale: 1.008, transition: SPRING_SMOOTH },
    whileTap:   { y: 0,  scale: 0.975, transition: SPRING_SNAPPY },
  };

/** Button press — SwiftUI .buttonStyle(.plain) micro-scale. */
export const BUTTON_PRESS = (reduced: boolean | null) =>
  reduced ? {} : {
    whileHover: { scale: 1.03, transition: SPRING_SNAPPY },
    whileTap:   { scale: 0.95, transition: SPRING_SNAPPY },
  };

/** Icon hit — slight scale + micro-rotate on hover, snaps on tap. */
export const ICON_HOVER = (reduced: boolean | null) =>
  reduced ? {} : {
    whileHover: { scale: 1.12, rotate: [-2, 2, 0], transition: SPRING_BOUNCY },
    whileTap:   { scale: 0.90, transition: SPRING_SNAPPY },
  };

/** Tab indicator pill — snappy layout spring so the indicator slides, not jumps. */
export const TAB_PILL_TRANSITION = (reduced: boolean | null) =>
  reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 34 };

/** Bottom sheet / modal present — authoritative, settles with minimal bounce. */
export const SHEET_TRANSITION = (reduced: boolean | null) => ({
  initial:    reduced ? { opacity: 0 } : { opacity: 0, y: 44, scale: 0.985 },
  animate:    { opacity: 1, y: 0,  scale: 1 },
  exit:       reduced ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.99 },
  transition: reduced ? REDUCED_TRANSITION : SPRING_GENTLE,
});

/** Number count-up spring — fast settle so stat cards feel alive. */
export const COUNTER_SPRING = { type: 'spring' as const, stiffness: 500, damping: 40, mass: 1 };

export type PresentationMotion = 'center' | 'sheet' | 'drawer' | 'fullscreen' | 'popover';

/** Shared presentation choreography for every portal and deep workspace. */
export const PRESENTATION_MOTION = (
  reduced: boolean | null,
  presentation: PresentationMotion = 'center',
) => {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: REDUCED_TRANSITION,
    };
  }

  if (presentation === 'sheet') return SHEET_TRANSITION(false);
  if (presentation === 'drawer') {
    return {
      initial: { opacity: 0, x: 44 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 36 },
      transition: SPRING_GENTLE,
    };
  }
  if (presentation === 'fullscreen') {
    return {
      initial: { opacity: 0, scale: 1.004 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.002 },
      transition: { duration: MOTION_DURATION.standard, ease: EASE_SWIFT },
    };
  }
  if (presentation === 'popover') {
    return {
      initial: { opacity: 0, y: -8, scale: 0.985 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -5, scale: 0.99 },
      transition: SPRING_SNAPPY,
    };
  }
  return {
    initial: { opacity: 0, y: 14, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.985 },
    transition: SPRING_GENTLE,
  };
};

/** Scrims fade; they never bounce. */
export const BACKDROP_MOTION = (reduced: boolean | null) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: reduced ? REDUCED_TRANSITION : FADE_TRANSITION,
});
