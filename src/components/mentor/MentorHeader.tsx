import React from 'react';
import { motion } from 'motion/react';
import {
  History,
  Plus,
  KeyRound,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Brain,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Button, Pill } from '../ui/Button';
import { IconTile } from '../ui/surface';

export type MentorTabMode = 'consultation' | 'quiz' | 'viva';

export interface MentorHeaderProps {
  daysRemaining?: number | null;
  sessionsCount: number;
  activeSessionTitle?: string;
  onOpenHistory: () => void;
  onNewSession: () => void;
  isGoldenHourMode?: boolean;
  onToggleGoldenHour?: () => void;
  onOpenKeyConfig?: () => void;
  isAiConfigured?: boolean | null;
  isAiStatusUnavailable?: boolean;
  onCheckAiStatus?: () => void;
  activeMode?: MentorTabMode;
  onModeChange?: (mode: MentorTabMode) => void;
  onBackToOverview?: () => void;
}

/**
 * Editorial Apple HIG Faculty Mentor Header.
 *
 * Distinct Signature Palette: Luminous Medical Sky & Azure
 * - Apple luminous azure daylight gradient with soft blue ambient glow
 * - Compact height with zero unnecessary clutter
 * - Compact, truthful AI engine status with a primary action
 */
export const MentorHeader: React.FC<MentorHeaderProps> = ({
  daysRemaining,
  sessionsCount,
  onOpenHistory,
  onNewSession,
  onOpenKeyConfig,
  isAiConfigured = null,
  isAiStatusUnavailable = false,
  onCheckAiStatus,
  activeMode = 'consultation',
  onModeChange,
}) => {
  const statusLabel = isAiStatusUnavailable
    ? 'Status unavailable'
    : isAiConfigured === null
    ? 'Checking intelligence'
    : isAiConfigured
    ? 'Clinical intelligence ready'
    : 'AI setup required';

  const statusDetail = isAiStatusUnavailable
    ? 'Retry the readiness check before beginning a live consultation.'
    : isAiConfigured
    ? 'Ready for case reasoning, viva, and exam-pattern questions.'
    : 'Connect Gemini to unlock real-time faculty reasoning.';

  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="system-page-header mentor-hero premium-page-hero relative overflow-hidden"
      data-header-art="signal"
    >
      <div className="mentor-hero-orb is-one" aria-hidden="true" />
      <div className="mentor-hero-orb is-two" aria-hidden="true" />
      <div className="mentor-hero-grid" aria-hidden="true" />

      <div className="mentor-hero-inner relative z-10 p-5 sm:p-7 lg:p-8">
        <div className="mentor-hero-meta flex min-w-0 flex-wrap items-center justify-between gap-3">
          <Pill tone="accent" className="mentor-hero-eyebrow">
            <Brain className="size-3.5" />
            One Shot Clinical Intelligence
          </Pill>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onOpenHistory}>
              <History className="size-3.5" />
              {sessionsCount} {sessionsCount === 1 ? 'case' : 'cases'}
            </Button>
            <Pill tone="pass" className="hidden sm:inline-flex">
              <ShieldCheck className="size-3.5" />
              NBE grounded
            </Pill>
          </div>
        </div>

        <div className="mentor-hero-layout mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.46fr)] lg:items-end">
          <div className="min-w-0">
            <h1 className="mentor-hero-title text-[var(--color-ink)]">
              Think clinically.
              <span> Answer decisively.</span>
            </h1>
            <p className="mentor-hero-copy mt-3 max-w-2xl text-[var(--color-ink-2)]">
              Your private FMGE faculty room for differential diagnosis, exam-pattern reasoning,
              targeted quizzes, and high-yield viva practice.
            </p>

            <div
              role="group"
              aria-label="Mentor mode"
              className="mentor-mode-switch mt-5 flex w-full max-w-xl items-center gap-1 overflow-x-auto rounded-2xl p-1.5 sm:w-fit sm:overflow-visible"
            >
              {([
                { id: 'consultation' as const, label: 'Consultation', compactLabel: 'Consult', icon: MessageSquare },
                { id: 'quiz' as const, label: '5Q Clinical Quiz', compactLabel: '5Q Quiz', icon: HelpCircle },
                { id: 'viva' as const, label: 'Differential Viva', compactLabel: 'Viva', icon: Brain },
              ]).map(({ id, label, compactLabel, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onModeChange?.(id)}
                  aria-label={label}
                  aria-pressed={activeMode === id}
                  className={`mentor-mode-button flex min-w-0 flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold sm:flex-none ${
                    activeMode === id ? 'is-active' : ''
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="sm:hidden">{compactLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mentor-command-card rounded-3xl p-4 sm:p-5">
            <div className="flex items-start gap-3.5">
              <div className="relative">
                <IconTile icon={Brain} size={48} color="var(--accent-ink)" className="mentor-command-icon" />
                <span className={`mentor-command-dot ${isAiConfigured ? 'is-ready' : 'is-warn'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="t-eyebrow text-[var(--color-ink-3)]">Faculty engine</div>
                <div className="mt-1 text-sm font-bold text-[var(--color-ink)]" aria-live="polite">
                  {statusLabel}
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-ink-2)]">{statusDetail}</p>
              </div>
            </div>

            <div className="mentor-command-metrics mt-4 grid grid-cols-2">
              <div>
                <span className="t-eyebrow text-[var(--color-ink-3)]">Consultations</span>
                <strong className="mt-1 block text-lg font-bold tabular-nums text-[var(--color-ink)]">{sessionsCount}</strong>
              </div>
              <div>
                <span className="t-eyebrow text-[var(--color-ink-3)]">Exam horizon</span>
                <strong className="mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums text-[var(--color-ink)]">
                  <Calendar className="size-4 text-accent" />
                  {daysRemaining !== undefined && daysRemaining !== null ? `${daysRemaining}d` : 'Set date'}
                </strong>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              block
              onClick={isAiStatusUnavailable ? onCheckAiStatus : isAiConfigured ? onNewSession : onOpenKeyConfig}
              disabled={isAiStatusUnavailable ? !onCheckAiStatus : isAiConfigured === null || (!isAiConfigured && !onOpenKeyConfig)}
              className="mt-4"
            >
              {isAiStatusUnavailable ? <RefreshCw className="size-4" /> : isAiConfigured ? <Plus className="size-4" /> : isAiConfigured === null ? <RefreshCw className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {isAiStatusUnavailable ? 'Check status' : isAiConfigured ? 'New Chat' : isAiConfigured === null ? 'Checking setup' : 'Configure clinical AI'}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
