import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  Brain,
  Award,
  BookmarkCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Send,
  Zap,
  Clock,
  ChevronRight,
  GraduationCap,
  Activity,
  X,
} from 'lucide-react';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

export interface CommandItem {
  id: string;
  category: 'Actions' | 'Subjects' | 'Navigation';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.FC<{ className?: string }>;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectSubject?: (subjectId: string) => void;
  onOpenAiCoach?: (query?: string, subject?: string) => void;
  onLaunchPractice?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectSubject,
  onOpenAiCoach,
  onLaunchPractice,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // All command items
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // 1. High-Yield Actions
      {
        id: 'action-ask-mentor',
        category: 'Actions',
        title: 'Ask Faculty Mentor',
        subtitle: 'Consult senior faculty AI for clinical case dilemmas, ECGs, and DOCs',
        badge: 'AI Coach',
        badgeColor: '#00685F',
        icon: GraduationCap,
        onSelect: () => {
          onNavigateTab('aicoach');
          onClose();
        },
      },
      {
        id: 'action-practice-qbank',
        category: 'Actions',
        title: 'Start Practice QBank Session',
        subtitle: 'Solve exam-pattern MCQs with active distractor analysis',
        badge: 'QBank',
        badgeColor: '#0284C7',
        icon: Award,
        onSelect: () => {
          if (onLaunchPractice) {
            onLaunchPractice();
          } else {
            onNavigateTab('practice');
          }
          onClose();
        },
      },
      {
        id: 'action-review-mistakes',
        category: 'Actions',
        title: 'Review Mistake Notebook',
        subtitle: 'Revise logged error items and spaced repetition remediation traps',
        badge: 'Spaced Review',
        badgeColor: '#E11D48',
        icon: AlertTriangle,
        onSelect: () => {
          onNavigateTab('errors');
          onClose();
        },
      },
      {
        id: 'action-pearls-vault',
        category: 'Actions',
        title: 'Explore Pearls Vault',
        subtitle: 'Browse 2,000+ high-yield mnemonics, drugs of choice, and diagnostic triads',
        badge: 'Flashcards',
        badgeColor: '#059669',
        icon: BookmarkCheck,
        onSelect: () => {
          onNavigateTab('pearls');
          onClose();
        },
      },

      // 2. Navigation Tabs
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Clinical Command Center',
        subtitle: 'Dashboard overview, daily readiness, and mission progress',
        icon: Activity,
        onSelect: () => {
          onNavigateTab('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-daily-planner',
        category: 'Navigation',
        title: 'Daily Study Planner',
        subtitle: 'Timeboxing schedule, daily targets, and Pomodoro blocks',
        icon: Calendar,
        onSelect: () => {
          onNavigateTab('daily');
          onClose();
        },
      },
      {
        id: 'nav-syllabus',
        category: 'Navigation',
        title: 'Syllabus & Blueprint',
        subtitle: 'Track completion and high-yield topics across all 19 subjects',
        icon: BookOpen,
        onSelect: () => {
          onNavigateTab('syllabus');
          onClose();
        },
      },
      {
        id: 'nav-grand-tests',
        category: 'Navigation',
        title: 'Grand Tests Diagnostic',
        subtitle: 'Mock examination scores, percentile curves, and performance graphs',
        icon: TrendingUp,
        onSelect: () => {
          onNavigateTab('grand-tests');
          onClose();
        },
      },
      {
        id: 'nav-telegram',
        category: 'Navigation',
        title: 'Telegram Knowledge Hub',
        subtitle: 'Synced recalls, channel polls, and verified high-yield clinical notes',
        icon: Send,
        onSelect: () => {
          onNavigateTab('telegram');
          onClose();
        },
      },
    ];

    // 3. All 19 FMGE Subjects
    FMGE_SUBJECTS.forEach((subject) => {
      list.push({
        id: `subject-${subject.id}`,
        category: 'Subjects',
        title: subject.name,
        subtitle: `${subject.weightage} marks · ${subject.phase} phase · ${subject.description}`,
        badge: `${subject.weightage} Marks`,
        badgeColor: subject.color,
        icon: BookOpen,
        onSelect: () => {
          if (onSelectSubject) {
            onSelectSubject(subject.id);
            onNavigateTab('syllabus');
          } else {
            onNavigateTab('syllabus');
          }
          onClose();
        },
      });
    });

    return list;
  }, [onNavigateTab, onSelectSubject, onOpenAiCoach, onLaunchPractice, onClose]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.badge && c.badge.toLowerCase().includes(q))
    );
  }, [query, allCommands]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm select-none">
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Command Dialog Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[80vh]"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input Bar */}
          <div className="relative flex items-center px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 19 subjects, quick actions, pearls, errors, or commands..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 ml-2 text-[10px] font-mono text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md shrink-0">
              <span>ESC</span>
            </div>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1 divide-y divide-slate-50 max-h-[480px] scroll-smooth"
          >
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700 font-['Outfit']">No results found</p>
                <p className="text-xs text-slate-400 font-sans">
                  Try searching for a subject like "Pharma", "OBG", or "Anatomy"
                </p>
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => cmd.onSelect()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/90 text-teal-950 ring-1 ring-[#00685F]/20'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#00685F] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold font-['Outfit'] truncate">
                            {cmd.title}
                          </span>
                          {cmd.badge && (
                            <span
                              className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full uppercase border shrink-0"
                              style={{
                                color: cmd.badgeColor || '#00685F',
                                backgroundColor: `${cmd.badgeColor || '#00685F'}15`,
                                borderColor: `${cmd.badgeColor || '#00685F'}35`,
                              }}
                            >
                              {cmd.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-sans">
                          {cmd.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#00685F] font-bold">
                          <span>Select</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dialog Footer with Navigation Shortcuts */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9.5px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9.5px]">↓</kbd>
                <span className="ml-0.5">to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9.5px]">↵</kbd>
                <span className="ml-0.5">to open</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Quick Command Palette</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
