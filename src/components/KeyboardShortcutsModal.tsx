import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, Command, Sparkles, BookOpen, Layers, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Global' | 'Navigation' | 'Study & Practice';
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const modKey = isMac ? '⌘' : 'Ctrl';

const getShortcuts = (mod: string): ShortcutItem[] => [
  {
    keys: [mod, 'K'],
    description: 'Open Universal Command Palette (Search & Jump)',
    category: 'Global',
  },
  {
    keys: [mod, 'B'],
    description: 'Toggle Desktop Navigation Sidebar ON / OFF',
    category: 'Global',
  },
  {
    keys: [mod, 'J'],
    description: 'Enter Zen Focus Room (Binaural Beats & Timer)',
    category: 'Global',
  },
  {
    keys: ['?'],
    description: 'Show Keyboard Shortcuts Cheatsheet',
    category: 'Global',
  },
  {
    keys: ['Esc'],
    description: 'Close active modal or dismiss flyout',
    category: 'Global',
  },
  {
    keys: ['Space'],
    description: 'Flip flashcard front/back in Flashcard view',
    category: 'Study & Practice',
  },
  {
    keys: ['1', '–', '4'],
    description: 'Select MCQ choices A, B, C, D directly',
    category: 'Study & Practice',
  },
  {
    keys: ['→'],
    description: 'Next flashcard or question',
    category: 'Study & Practice',
  },
  {
    keys: ['←'],
    description: 'Previous flashcard or question',
    category: 'Study & Practice',
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = getShortcuts(modKey);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['Global', 'Study & Practice'] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden font-sans z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#006B63] shadow-2xs">
                <Keyboard className="h-4 w-4" />
              </div>
              <div>
                <h3 id="shortcuts-title" className="text-sm font-bold text-slate-900 font-['Outfit']">
                  Keyboard Shortcuts
                </h3>
                <p className="text-[11px] text-slate-400">Power-user keybindings for high-speed FMGE revision</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Close keyboard shortcuts"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {categories.map((cat) => {
              const items = shortcuts.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {cat}
                  </h4>
                  <div className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden bg-slate-50/30">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3.5 py-2.5 hover:bg-white transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-700">{item.description}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-semibold text-slate-800 bg-white border border-slate-250 rounded-lg shadow-2xs font-mono"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-semibold text-slate-700">?</kbd> anywhere to open</span>
            <span className="text-teal-700 font-medium">ONE SHOT FMGE</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
