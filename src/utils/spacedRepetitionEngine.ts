import { ErrorNotebookItem, MedicalPearl } from '../types';

/**
 * Scientific Spaced Repetition Engine (FSRS / SM-2 Derived)
 * Calibrated for:
 * 1. Clinical Medical Pearls (Active recall ratings: 'again' | 'hard' | 'good' | 'easy')
 * 2. Mistake Remediation in Blunder Vault (Expanding intervals: Day 1 -> 3 -> 7 -> 21 -> 60)
 */

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCalculationResult {
  srsInterval: number;
  srsRepetitions: number;
  srsEaseFactor: number;
  srsDueDate: string;
  srsLastReviewed: string;
}

export const SPACED_INTERVAL_LADDER = [1, 3, 7, 21, 60] as const;

export type SpacedStage = 'due' | 'learning' | 'reviewing' | 'mastered';

/**
 * Returns today's ISO date string in YYYY-MM-DD format.
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Adds a given number of calendar days to an ISO YYYY-MM-DD date string.
 */
export const addDaysToDateString = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + Math.max(1, days));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysToDate = addDaysToDateString;

/**
 * Calculate the next review schedule for a clinical pearl based on student's recall feedback.
 */
export function calculateNextReview(
  pearl: MedicalPearl,
  rating: SrsRating,
  todayStr: string = getTodayDateString()
): SrsCalculationResult {
  const currentReps = pearl.srsRepetitions ?? 0;
  const currentInterval = pearl.srsInterval ?? 0;
  let ease = pearl.srsEaseFactor ?? 2.5;

  let nextInterval: number;
  let nextReps: number;

  switch (rating) {
    case 'again': {
      // Complete lapse in memory
      nextReps = 0;
      nextInterval = 1;
      ease = Math.max(1.3, ease - 0.2);
      break;
    }
    case 'hard': {
      // Recalled with significant hesitation
      nextReps = currentReps + 1;
      nextInterval = Math.max(1, Math.round((currentInterval || 1) * 1.2));
      ease = Math.max(1.3, ease - 0.15);
      break;
    }
    case 'good': {
      // Standard successful active recall
      nextReps = currentReps + 1;
      if (nextReps === 1) {
        nextInterval = 1;
      } else if (nextReps === 2) {
        nextInterval = 3;
      } else {
        nextInterval = Math.round((currentInterval || 3) * ease);
      }
      break;
    }
    case 'easy': {
      // Instant, pathognomonic reflex recall
      nextReps = currentReps + 1;
      if (nextReps === 1) {
        nextInterval = 4;
      } else if (nextReps === 2) {
        nextInterval = 10;
      } else {
        nextInterval = Math.round((currentInterval || 4) * ease * 1.3);
      }
      ease = Math.min(3.0, ease + 0.15);
      break;
    }
  }

  // Cap interval at 180 days (practical pre-exam window)
  nextInterval = Math.min(180, nextInterval);

  return {
    srsInterval: nextInterval,
    srsRepetitions: nextReps,
    srsEaseFactor: Number(ease.toFixed(2)),
    srsDueDate: addDaysToDate(todayStr, nextInterval),
    srsLastReviewed: new Date().toISOString(),
  };
}

/**
 * Checks if a pearl is due for spaced recall review today or earlier.
 */
export function isPearlDue(pearl: MedicalPearl, todayStr: string = getTodayDateString()): boolean {
  if (!pearl.srsDueDate) {
    // Unscheduled or newly bookmarked pearls are considered due for their initial review
    return pearl.isBookmarked === true;
  }
  return pearl.srsDueDate <= todayStr;
}

/**
 * Filters and sorts all pearls that are due today for active review.
 */
export function getDuePearls(pearls: MedicalPearl[], todayStr: string = getTodayDateString()): MedicalPearl[] {
  return pearls
    .filter((p) => isPearlDue(p, todayStr))
    .sort((a, b) => {
      // Priority 1: Lapsed / failed pearls (reps === 0)
      const repsA = a.srsRepetitions ?? 0;
      const repsB = b.srsRepetitions ?? 0;
      if (repsA !== repsB) return repsA - repsB;

      // Priority 2: Overdue dates (earlier due dates first)
      const dateA = a.srsDueDate || '0000-00-00';
      const dateB = b.srsDueDate || '0000-00-00';
      return dateA.localeCompare(dateB);
    });
}

/**
 * Determines whether an Error Notebook item is due for spaced review on or before targetDate.
 */
export const isSpacedErrorDue = (
  item: ErrorNotebookItem,
  targetDateStr: string = getTodayDateString()
): boolean => {
  // If never scheduled or marked unreviewed, it is due
  if (!item.nextReviewDueDate) {
    return !item.isReviewed;
  }
  return item.nextReviewDueDate <= targetDateStr;
};

/**
 * Advances or resets an Error Notebook item's spaced repetition state based on recall success.
 */
export const recordSpacedAttempt = (
  item: ErrorNotebookItem,
  wasCorrect: boolean,
  currentDateStr: string = getTodayDateString()
): ErrorNotebookItem => {
  const currentCount = item.repetitionCount || 0;
  const currentEase = item.easeFactor || 2.5;

  if (!wasCorrect) {
    // Lapse / Mistake repeated: reset to day 1 interval
    return {
      ...item,
      isReviewed: false,
      repetitionCount: 0,
      repetitionIntervalDays: 1,
      easeFactor: Math.max(1.3, Math.round((currentEase - 0.2) * 100) / 100),
      lastReviewedDate: currentDateStr,
      nextReviewDueDate: currentDateStr, // due immediately
      spacedStage: 'due',
      remediatedAt: undefined,
    };
  }

  // Successful recall: advance on the calibrated ladder
  const nextCount = currentCount + 1;
  const ladderIndex = Math.min(nextCount - 1, SPACED_INTERVAL_LADDER.length - 1);
  const nextInterval = SPACED_INTERVAL_LADDER[ladderIndex];

  let nextStage: SpacedStage = 'learning';
  if (nextInterval >= 21) {
    nextStage = 'mastered';
  } else if (nextInterval >= 7) {
    nextStage = 'reviewing';
  }

  const nextDueDate = addDaysToDateString(currentDateStr, nextInterval);

  return {
    ...item,
    isReviewed: true,
    repetitionCount: nextCount,
    repetitionIntervalDays: nextInterval,
    easeFactor: Math.min(3.0, Math.round((currentEase + 0.1) * 100) / 100),
    lastReviewedDate: currentDateStr,
    nextReviewDueDate: nextDueDate,
    spacedStage: nextStage,
    remediatedAt: currentDateStr,
    remediationScore: 100,
  };
};

export interface SpacedErrorsSummary {
  dueCount: number;
  learningCount: number;
  reviewingCount: number;
  masteredCount: number;
  totalCount: number;
  dueItems: ErrorNotebookItem[];
  learningItems: ErrorNotebookItem[];
  reviewingItems: ErrorNotebookItem[];
  masteredItems: ErrorNotebookItem[];
}

/**
 * Categorizes the user's entire Error Notebook into spaced repetition stages.
 */
export const getSpacedErrorsSummary = (
  errorNotebook: ErrorNotebookItem[] = [],
  targetDateStr: string = getTodayDateString()
): SpacedErrorsSummary => {
  const dueItems: ErrorNotebookItem[] = [];
  const learningItems: ErrorNotebookItem[] = [];
  const reviewingItems: ErrorNotebookItem[] = [];
  const masteredItems: ErrorNotebookItem[] = [];

  for (const item of errorNotebook) {
    if (isSpacedErrorDue(item, targetDateStr)) {
      dueItems.push(item);
    } else if (item.spacedStage === 'mastered') {
      masteredItems.push(item);
    } else if (item.spacedStage === 'reviewing') {
      reviewingItems.push(item);
    } else {
      learningItems.push(item);
    }
  }

  return {
    dueCount: dueItems.length,
    learningCount: learningItems.length,
    reviewingCount: reviewingItems.length,
    masteredCount: masteredItems.length,
    totalCount: errorNotebook.length,
    dueItems,
    learningItems,
    reviewingItems,
    masteredItems,
  };
};

/**
 * Formats a clean clinical chip label for an error's spaced interval.
 */
export const formatSpacedIntervalBadge = (item: ErrorNotebookItem): {
  label: string;
  className: string;
} => {
  if (isSpacedErrorDue(item)) {
    return {
      label: 'Due Now',
      className: 'bg-rose-500/10 text-rose-700 border-rose-200/70',
    };
  }

  const days = item.repetitionIntervalDays || 1;

  if (item.spacedStage === 'mastered') {
    return {
      label: `Mastered (${days}d)`,
      className: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/70',
    };
  }

  if (item.spacedStage === 'reviewing') {
    return {
      label: `Lock-in (${days}d)`,
      className: 'bg-teal-500/10 text-teal-800 border-teal-200/70',
    };
  }

  return {
    label: `Recall in ${days}d`,
    className: 'bg-amber-500/10 text-amber-800 border-amber-200/70',
  };
};
