/**
 * Reusable Motion and Transition Tokens
 * Provides system-wide easing curves, transition presets, and reduced-motion fallbacks.
 */

export const EASE_SWIFT = [0.16, 1, 0.3, 1] as const;
export const EASE_GENTLE = [0.25, 1, 0.5, 1] as const;
export const EASE_SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

/** Page entrance transition */
export const PAGE_TRANSITION = (reduced: boolean | null) => ({
  initial: reduced ? false : { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: reduced ? false : { opacity: 0, y: -8 },
  transition: reduced ? { duration: 0 } : { duration: 0.35, ease: EASE_SWIFT },
});

/** Staggered card entrance */
export const CARD_STAGGER = (index: number, reduced: boolean | null) => ({
  initial: reduced ? false : { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: reduced ? { duration: 0 } : { duration: 0.38, delay: index * 0.05, ease: EASE_SWIFT },
});

/** Interactive card hover elevation */
export const CARD_HOVER = (reduced: boolean | null) =>
  reduced
    ? {}
    : {
        whileHover: { y: -2, transition: { duration: 0.2, ease: EASE_SWIFT } },
        whileTap: { y: 0, scale: 0.995, transition: { duration: 0.1 } },
      };

/** Button micro-interaction */
export const BUTTON_PRESS = (reduced: boolean | null) =>
  reduced
    ? {}
    : {
        whileTap: { scale: 0.97, transition: { duration: 0.1 } },
      };
