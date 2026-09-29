import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Download,
  History,
  MessageSquare,
  Microscope,
  Pill as PillIcon,
  Plus,
  RotateCcw,
  Search,
  Star,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react';
import { CoachSession } from '../AiCoachView';
import {
  extractSessionIntelligence,
  filterSessions,
  groupSessionsByDate,
  SessionIntentType,
  SessionIntelligence,
} from '../../utils/mentorSessionIntelligence';
import { Modal } from '../ui/Modal';
import { Button, Card, Pill } from '../ui/Button';
import { cn } from '@/lib/utils';

const MENTOR = 'var(--color-mentor)';

interface MentorHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  sessions: CoachSession[];
  activeSessionId: string | null;
  onSelectSession: (session: CoachSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onTogglePinSession?: (id: string, e: React.MouseEvent) => void;
  onClearAllHistory: () => void;
  onClearUnpinnedHistory?: () => void;
  formatRelativeDate: (dateStr: string) => string;
  onExportSession?: (session: CoachSession) => void;
}

const FILTERS: Array<{
  id: SessionIntentType;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'all', label: 'All', icon: History },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'mcq', label: 'MCQs', icon: Award },
  { id: 'concept', label: 'Concepts', icon: Brain },
  { id: 'differential', label: 'Differentials', icon: Stethoscope },
  { id: 'pharmacology', label: 'Pharma & DOC', icon: PillIcon },
  { id: 'investigation', label: 'Investigations', icon: Microscope },
];

function intentIcon(type: SessionIntentType) {
  switch (type) {
    case 'mcq':
      return Award;
    case 'differential':
      return Stethoscope;
    case 'pharmacology':
      return PillIcon;
    case 'investigation':
      return Microscope;
    case 'revision':
      return RotateCcw;
    default:
      return Brain;
  }
}

/** 32px visual box, 44px effective target — the drawer is full of these. */
function ToolButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'hit-expand grid size-8 place-items-center rounded-lg',
        'text-[var(--color-ink-3)] transition-colors',
        'hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}

export const MentorHistoryDrawer: React.FC<MentorHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onNewSession,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onTogglePinSession,
  onClearAllHistory,
  onClearUnpinnedHistory,
  formatRelativeDate,
  onExportSession,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SessionIntentType>('all');
  const [subject, setSubject] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const starredCount = useMemo(() => sessions.filter((s) => s.isPinned).length, [sessions]);
  const isFiltering = query.length > 0 || activeFilter !== 'all' || subject !== 'all';

  const subjects = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const name = extractSessionIntelligence(s).subjectName;
      if (name) set.add(name);
    });
    return [...set].sort();
  }, [sessions]);
  const availableSubjects = subjects;

  const visible = useMemo(() => {
    const byIntentAndQuery = filterSessions(sessions, query, activeFilter);
    if (subject === 'all') return byIntentAndQuery;
    return byIntentAndQuery.filter(
      (s) => extractSessionIntelligence(s).subjectName === subject,
    );
  }, [sessions, query, activeFilter, subject]);

  const groups = useMemo(() => groupSessionsByDate(visible), [visible]);

  const close = () => {
    setQuery('');
    setActiveFilter('all');
    setSubject('all');
    setConfirmClear(false);
    setPendingDelete(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => !o && close()}
      variant="drawer"
      accent={MENTOR}
      title="Consultation History"
      header={
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-tint text-accent"
          >
            <History className="size-5 stroke-[2]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="t-title truncate">Consultation History</h2>
            <p className="t-caption mt-0.5 truncate tabular-nums">
              {sessions.length} saved session{sessions.length === 1 ? '' : 's'}
              {starredCount > 0 && ` · ${starredCount} starred`}
            </p>
          </div>
        </div>
      }
    >
      {/* ── Toolbar: new session, search, filters ──────────────────────── */}
      <div className="shrink-0 space-y-3.5 bg-[var(--color-surface-sunken)]/50 px-5 py-4 hairline-b">
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => {
            onNewSession();
            close();
          }}
        >
          <Plus className="size-[18px] stroke-[2.5]" />
          New Consultation
        </Button>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-3)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, subjects, questions"
            aria-label="Search consultation history"
            className={cn(
              'h-11 w-full rounded-xl border border-[var(--color-hairline)] bg-white pl-10 pr-10',
              'text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]',
              'transition-shadow outline-none',
              'focus:border-accent focus:ring-4 focus:ring-accent/15',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--color-ink-3)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="scroll-x-quiet -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 touch-pan-x">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <Pill
              key={id}
              tone={activeFilter === id ? 'accent' : 'neutral'}
              selected={activeFilter === id}
              onClick={() => setActiveFilter(id)}
              className="shrink-0"
            >
              <Icon className="size-3" />
              {label}
            </Pill>
          ))}
        </div>

        {subjects.length > 1 && (
          <div className="scroll-x-quiet -mx-1 flex items-center gap-1.5 overflow-x-auto border-t border-[var(--color-hairline-soft)] px-1 pt-3.5 touch-pan-x">
            <span className="text-[11px] font-semibold text-[var(--color-ink-3)] shrink-0 self-center">Subject:</span>
            {['all', ...subjects].map((s) => (
              <Pill
                key={s}
                tone={subject === s ? 'accent' : 'neutral'}
                selected={subject === s}
                onClick={() => setSubject(s)}
                className="shrink-0 capitalize"
              >
                {s === 'all' ? 'All subjects' : s}
              </Pill>
            ))}
          </div>
        )}
      </div>

      {/* ── Session list ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 touch-scroll scroll-quiet">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              aria-hidden="true"
              className="mb-4 grid size-14 place-items-center rounded-2xl bg-[var(--color-surface-sunken)] text-[var(--color-ink-3)]"
            >
              <MessageSquare className="size-6 stroke-[1.8]" />
            </span>
            <h3 className="t-section">
              {isFiltering ? 'No matching consultations' : 'No saved consultations yet'}
            </h3>
            <p className="t-body mt-2 max-w-[30ch] text-[var(--color-ink-3)]">
              {isFiltering
                ? 'Try a different search term, filter, or subject.'
                : 'Ask your faculty mentor a clinical question or request a drill to start building your history.'}
            </p>
            {isFiltering && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={() => {
                  setQuery('');
                  setActiveFilter('all');
                  setSubject('all');
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label}>
              <div className="mb-2.5 flex items-center gap-3">
                <h3 className="t-eyebrow text-[var(--color-ink-3)]">{group.label}</h3>
                <span className="h-px flex-1 bg-[var(--color-hairline)]" />
                <span className="t-caption tabular-nums text-[var(--color-ink-3)]">
                  {group.sessions.length}
                </span>
              </div>

              <div className="space-y-2">
                {group.sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const intel: SessionIntelligence = extractSessionIntelligence(s);
                  const IntentIcon = intentIcon(intel.intentType);
                  const passed = intel.mcqScore ? intel.mcqScore.percentage >= 60 : false;

                  return (
                    <Card
                      key={s.id}
                      interactive
                      className={cn(
                        'relative',
                        isActive && 'border-accent/40 bg-accent-wash shadow-e2',
                      )}
                    >
                      <div className="flex items-start gap-1 p-4">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSession(s);
                            close();
                          }}
                          className={cn(
                            'min-w-0 flex-1 text-left',
                            // Stretch the tap target over the whole card without
                            // nesting a button inside a button.
                            'after:absolute after:inset-0 after:content-[""] after:rounded-3xl',
                            'focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent',
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isActive && (
                              <Pill tone="accent">
                                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                                Live
                              </Pill>
                            )}
                            <Pill
                              className="border"
                              style={{
                                borderColor: `${intel.subjectColor}33`,
                                backgroundColor: `${intel.subjectColor}14`,
                                color: intel.subjectColor,
                              }}
                            >
                              {intel.subjectName}
                            </Pill>
                            <Pill tone="neutral">
                              <IntentIcon className="size-3 text-accent" />
                              {intel.intentLabel}
                            </Pill>
                            {intel.mcqScore && (
                              <Pill tone={passed ? 'pass' : 'warn'}>
                                <CheckCircle2 className="size-3" />
                                <span className="tabular-nums">
                                  {intel.mcqScore.correct}/{intel.mcqScore.total}
                                </span>
                              </Pill>
                            )}
                          </div>

                          <h4 className="t-title-sm mt-2.5 line-clamp-1">{s.title}</h4>
                          <p className="t-caption mt-1 line-clamp-2 text-[var(--color-ink-3)]">
                            {intel.keyExcerpt}
                          </p>

                          <div className="mt-2.5 flex items-center gap-2 text-[var(--color-ink-3)]">
                            <span className="t-caption inline-flex items-center gap-1.5 tabular-nums">
                              <Clock aria-hidden="true" className="size-3" />
                              {formatRelativeDate(s.updatedAt || s.createdAt)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="t-caption inline-flex items-center gap-1.5 tabular-nums">
                              <MessageSquare aria-hidden="true" className="size-3" />
                              {intel.messageCount} message{intel.messageCount === 1 ? '' : 's'}
                            </span>
                          </div>
                        </button>

                        <div className="relative z-10 flex shrink-0 items-center">
                          {onExportSession && (
                            <ToolButton
                              label="Export consultation note (.md)"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportSession(s);
                              }}
                            >
                              <Download className="size-4" />
                            </ToolButton>
                          )}
                          {onTogglePinSession && (
                            <ToolButton
                              label={s.isPinned ? 'Unpin consultation' : 'Pin consultation'}
                              onClick={(e) => onTogglePinSession(s.id, e)}
                              className={s.isPinned ? 'text-[var(--color-warn-ink)]' : undefined}
                            >
                              <Star className={cn('size-4', s.isPinned && 'fill-current')} />
                            </ToolButton>
                          )}
                          <ToolButton
                            label="Delete consultation"
                            className="hover:text-[var(--color-fail-ink)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDelete(s.id);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </ToolButton>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Destructive actions ────────────────────────────────────────── */}
      <div className="shrink-0 px-5 py-3.5 hairline-t">
        {pendingDelete ? (
          <div className="flex items-center gap-3">
            <p className="t-body min-w-0 flex-1 font-semibold text-[var(--color-fail-ink)]">
              Delete this consultation?
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                onDeleteSession(pendingDelete, e);
                setPendingDelete(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        ) : confirmClear ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--color-fail-wash)] text-[var(--color-fail-ink)]"
              >
                <AlertTriangle className="size-4 stroke-[2.2]" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="t-title-sm">Reset consultation memory?</h4>
                <p className="t-caption mt-1 text-[var(--color-ink-3)]">
                  {starredCount > 0
                    ? `${starredCount} starred consultation${starredCount === 1 ? '' : 's'} can be preserved.`
                    : `This permanently clears all ${sessions.length} saved consultation${sessions.length === 1 ? '' : 's'} from this workspace.`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {starredCount > 0 && onClearUnpinnedHistory && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClearUnpinnedHistory();
                    setConfirmClear(false);
                  }}
                >
                  <Star className="size-4 fill-current text-[var(--color-warn-ink)]" />
                  Keep starred ({starredCount})
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  onClearAllHistory();
                  close();
                }}
              >
                <Trash2 className="size-4" />
                Clear all ({sessions.length})
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
              <Trash2 className="size-4" />
              Clear history
            </Button>
            <span className="t-caption inline-flex items-center gap-1.5 tabular-nums text-[var(--color-ink-3)]">
              <Database aria-hidden="true" className="size-3.5" />
              {sessions.length} saved
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};
