import React from 'react';
import { Check, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface McqOption {
  key: string;
  text: string;
}

interface McqOptionListProps {
  options: McqOption[];
  /** The key currently staged but not yet submitted. */
  stagedKey: string | null;
  /** The key the learner actually submitted. */
  userAnswer?: string | null;
  correctKey: string;
  revealed: boolean;
  onSelect: (key: string) => void;
  className?: string;
}

/**
 * The one MCQ option renderer.
 *
 * `MentorQuizRunner` and `MentorClinicalChallengeCard` each shipped their own
 * copy of this state machine — same four states, same letter pill, same radio,
 * same two trailing badges, but drifted apart: one used `#007AFF` and a
 * teal-50 fill, the other teal, and they disagreed about the correct-option
 * ring. Consolidating it also lets the reveal state use the same semantic
 * tokens the rest of the app uses for pass/fail, so "correct" reads green here
 * for the same reason it reads green in Performance.
 *
 * State precedence: revealed-wrong beats revealed-dimmed, and staged only
 * applies while nothing is revealed.
 */
export const McqOptionList: React.FC<McqOptionListProps> = ({
  options,
  stagedKey,
  userAnswer,
  correctKey,
  revealed,
  onSelect,
  className,
}) => (
  <div className={cn('grid grid-cols-1 gap-2.5', className)}>
    {options.map((opt) => {
      const isStaged = !revealed && stagedKey === opt.key;
      const isSelected = userAnswer === opt.key;
      const isCorrect = opt.key === correctKey;

      const correct = revealed && isCorrect;
      const wrong = revealed && isSelected && !isCorrect;
      const dimmed = revealed && !isCorrect && !isSelected;

      return (
        <button
          key={opt.key}
          type="button"
          disabled={revealed}
          aria-pressed={isStaged || isSelected}
          onClick={() => onSelect(opt.key)}
          className={cn(
            'flex min-h-[50px] w-full cursor-pointer items-start gap-3.5 rounded-2xl border p-3.5 text-left text-sm font-medium leading-relaxed transition-[background-color,border-color,box-shadow,opacity] duration-150 sm:p-4',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            'disabled:cursor-default',
            correct &&
              'border-[color-mix(in_srgb,var(--color-pass)_45%,transparent)] bg-[var(--color-pass-wash)] font-semibold text-[var(--color-pass-ink)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-pass)_16%,transparent)]',
            wrong &&
              'border-[color-mix(in_srgb,var(--color-fail)_40%,transparent)] bg-[var(--color-fail-wash)] font-semibold text-[var(--color-fail-ink)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-fail)_14%,transparent)]',
            dimmed && 'border-[var(--color-hairline)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-4)] opacity-70',
            isStaged &&
              'border-accent bg-accent-tint font-semibold text-[var(--color-ink)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_18%,transparent)]',
            !revealed &&
              !isStaged &&
              'border-[var(--color-hairline)] bg-white text-[var(--color-ink-2)] shadow-e1 hover:border-accent/40 hover:bg-accent-tint',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
              correct && 'border-[var(--color-pass)] bg-[var(--color-pass)]',
              wrong && 'border-[var(--color-fail)] bg-[var(--color-fail)]',
              dimmed && 'border-[var(--color-hairline)] bg-[var(--color-surface-sunken)]',
              isStaged && 'border-accent bg-white',
              !revealed && !isStaged && 'border-[var(--color-hairline-strong)] bg-white',
            )}
          >
            {correct || wrong ? (
              <span className="size-1.5 rounded-full bg-white" />
            ) : isStaged ? (
              <span className="size-2 rounded-full bg-accent" />
            ) : null}
          </span>

          <span
            aria-hidden="true"
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-lg text-xs font-bold transition-colors',
              correct && 'bg-[var(--color-pass)] text-white',
              wrong && 'bg-[var(--color-fail)] text-white',
              dimmed && 'border border-[var(--color-hairline)] bg-white text-[var(--color-ink-4)]',
              isStaged && 'bg-accent text-white',
              !revealed && !isStaged && 'border border-[var(--color-hairline)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-2)]',
            )}
          >
            {opt.key}
          </span>

          <span className="min-w-0 flex-1 pt-0.5">{opt.text}</span>

          {correct && (
            <span className="t-caption ml-auto flex shrink-0 self-center items-center gap-1 font-semibold text-[var(--color-pass-ink)]">
              <Check className="size-3.5 stroke-[2.5]" />
              Correct
            </span>
          )}
          {wrong && (
            <span className="t-caption ml-auto flex shrink-0 self-center items-center gap-1 font-semibold text-[var(--color-fail-ink)]">
              <X className="size-3.5 stroke-[2.5]" />
              Your answer
            </span>
          )}
          {isStaged && (
            <CheckCircle2 aria-hidden="true" className="ml-auto size-4 shrink-0 self-center fill-accent text-white" />
          )}
        </button>
      );
    })}
  </div>
);
