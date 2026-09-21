/**
 * Spaced Repetition Memory Engine (Modified SuperMemo SM-2).
 * Optimizes medical recall intervals to ensure retention through the FMGE examination.
 */

import { MedicalPearl } from '../types';

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCalculationResult {
  srsInterval: number; // in days
  srsRepetitions: number;
  srsEaseFactor: number;
  srsDueDate: string; // YYYY-MM-DD
  srsLastReviewed: string; // ISO String
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + Math.max(1, days));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
