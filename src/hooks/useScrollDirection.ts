import { useState, useEffect, useRef } from 'react';

export interface ScrollDirectionState {
  /** True when scrolling up or when near the top of the viewport; false when scrolling down */
  isVisible: boolean;
  /** Current scroll direction */
  scrollDirection: 'up' | 'down';
  /** Live scroll position in pixels */
  scrollY: number;
  /** True when scroll position is at or near the top of the page (<= 40px) */
  isAtTop: boolean;
}

/**
 * Hook to dynamically auto-hide and reveal navigation bars and tab headers on scroll.
 * 
 * - When scrolling down: triggers `isVisible = false` so headers smoothly hide.
 * - When scrolling up: triggers `isVisible = true` so headers immediately slide back in.
 * - At the top of the page (<= 40px): `isVisible = true` is guaranteed.
 * 
 * Uses requestAnimationFrame and a hysteresis threshold to avoid jitters on micro-scrolls.
 */
export function useScrollDirection(threshold: number = 10): ScrollDirectionState {
  const [isVisible, setIsVisible] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    lastScrollY.current = window.scrollY;

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // Always visible when near top of the page
      if (currentScrollY <= 40) {
        setIsVisible(true);
        setScrollDirection('up');
        lastScrollY.current = currentScrollY;
        ticking.current = false;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // Only toggle if scroll difference exceeds threshold
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          // Scrolling DOWN -> hide navbars & tab headers
          setIsVisible(false);
          setScrollDirection('down');
        } else {
          // Scrolling UP -> reveal navbars & tab headers
          setIsVisible(true);
          setScrollDirection('up');
        }
        lastScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return {
    isVisible,
    scrollDirection,
    scrollY,
    isAtTop: scrollY <= 40,
  };
}
