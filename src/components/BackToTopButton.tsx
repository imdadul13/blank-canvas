import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface BackToTopButtonProps {
  threshold?: number;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ threshold = 350 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const reducedMotion = useReducedMotion();
  const { isVisible: isNavVisible } = useScrollDirection(12);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  const dynamicBottom = isDesktop
    ? '1.5rem'
    : isNavVisible
      ? 'calc(4.75rem + env(safe-area-inset-bottom, 0px))'
      : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          whileHover={reducedMotion ? undefined : { scale: 1.06, y: -2 }}
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          style={{
            bottom: dynamicBottom,
            transition: reducedMotion ? 'none' : 'bottom 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="fixed right-5 lg:right-6 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] backdrop-blur-md border border-slate-700/60 cursor-pointer select-none group"
          title="Scroll back to top"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="h-3.5 w-3.5 text-teal-300 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform duration-200" />
          <span className="text-[11px] font-semibold tracking-wide font-sans hidden sm:inline text-slate-200 group-hover:text-white">
            Top
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
