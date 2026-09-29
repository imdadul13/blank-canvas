/**
 * Motion Tokens — SwiftUI Spring Physics
 * Spring values mirror SwiftUI's built-in presets as closely as Framer Motion allows.
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

// ── Composed Transition Factories ───────────────────────────────────────────

/** View-level entrance (tab switch, page load). Horizontal slide + fade. */
export const PAGE_TRANSITION = (reduced: boolean | null) => ({
  initial:    reduced ? false : { opacity: 0, x: 16 },
  animate:    { opacity: 1, x: 0 },
  exit:       reduced ? false : { opacity: 0, x: -12 },
  transition: reduced ? { duration: 0 } : SPRING_SNAPPY,
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
  initial:    reduced ? false : { opacity: 0, y: 40, scale: 0.96 },
  animate:    { opacity: 1, y: 0,  scale: 1 },
  exit:       reduced ? false : { opacity: 0, y: 32, scale: 0.97 },
  transition: reduced ? { duration: 0 } : SPRING_GENTLE,
});

/** Number count-up spring — fast settle so stat cards feel alive. */
export const COUNTER_SPRING = { type: 'spring' as const, stiffness: 500, damping: 40, mass: 1 };
