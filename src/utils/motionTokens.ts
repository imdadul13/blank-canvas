/**
 * Reusable Motion and Transition Tokens
 * Provides system-wide easing curves, transition presets, and reduced-motion fallbacks.
 */

// Apple SwiftUI Spring Physics
export const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 480, damping: 28 };
export const SPRING_SMOOTH = { type: 'spring' as const, stiffness: 380, damping: 30 };
export const SPRING_BOUNCY = { type: 'spring' as const, stiffness: 420, damping: 20 };
export const SPRING_GENTLE = { type: 'spring' as const, stiffness: 280, damping: 32 };
export const EASE_SPRING = SPRING_SMOOTH;

// Standard Bézier Easing Curves
export const EASE_SWIFT = [0.16, 1, 0.3, 1] as const;
export const EASE_GENTLE = [0.25, 1, 0.5, 1] as const;
export const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;

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
  transition: reduced ? { duration: 0 } : { duration: 0.36, delay: Math.min(index * 0.04, 0.32), ease: EASE_SWIFT },
});

/** Interactive card hover elevation with spring physics */
export const CARD_HOVER = (reduced: boolean | null) =>
  reduced
    ? {}
    : {
        whileHover: { y: -3, scale: 1.008, transition: SPRING_SMOOTH },
        whileTap: { y: 0, scale: 0.985, transition: SPRING_SNAPPY },
      };

/** Micro tactile button press (SwiftUI feel) */
export const BUTTON_PRESS = (reduced: boolean | null) =>
  reduced
    ? {}
    : {
        whileHover: { scale: 1.03, transition: SPRING_SNAPPY },
        whileTap: { scale: 0.95, transition: SPRING_SNAPPY },
      };

/** Floating icon micro-bounce on container hover */
export const ICON_HOVER = (reduced: boolean | null) =>
  reduced
    ? {}
    : {
        whileHover: { scale: 1.15, rotate: [-2, 2, 0], transition: SPRING_BOUNCY },
        whileTap: { scale: 0.9, transition: SPRING_SNAPPY },
      };

/** Tab indicator pill layout transition */
export const TAB_PILL_TRANSITION = (reduced: boolean | null) =>
  reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 450, damping: 32 };
