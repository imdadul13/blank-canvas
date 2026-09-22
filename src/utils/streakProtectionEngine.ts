import { AppState, DailyStudyLog } from '../types';
import { getLocalDateKey } from './date';

/**
 * Clinical Duty Streak Protection Engine
 * Allows FMGE candidates on intensive clinical rotations (ICU, casualty, night shifts)
 * to freeze and protect their hard-earned daily study streak.
 */

export const MAX_MONTHLY_STREAK_FREEZES = 2;

export interface StreakProtectionStatus {
  availableCount: number;
  maxMonthly: number;
  isActiveToday: boolean;
  usedDates: string[];
}

/**
 * Calculates current streak taking into account days covered by hospital duty shields.
 */
export function calculateProtectedStudyStreak(
  studyLogs: Record<string, DailyStudyLog> = {},
  streakFreezeDates: string[] = []
): number {
  const freezeSet = new Set(streakFreezeDates);
  const todayKey = getLocalDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  let currentCheckDate = new Date();
  const todayLog = studyLogs[todayKey];
  const hasTodayActivity =
    (todayLog &&
      (todayLog.studyMinutes > 0 ||
        todayLog.questionsSolved > 0 ||
        (todayLog.completedTaskIds && todayLog.completedTaskIds.length > 0))) ||
    freezeSet.has(todayKey);

  if (!hasTodayActivity) {
    const yesterdayLog = studyLogs[yesterdayKey];
    const hasYesterdayActivity =
      (yesterdayLog && (yesterdayLog.studyMinutes > 0 || yesterdayLog.questionsSolved > 0)) ||
      freezeSet.has(yesterdayKey);
    if (!hasYesterdayActivity) {
      return 0;
    }
    currentCheckDate = yesterday;
  }

  let streak = 0;
  // Maximum loop guard to prevent infinite traversal
  for (let i = 0; i < 365; i++) {
    const checkKey = getLocalDateKey(currentCheckDate);
    const log = studyLogs[checkKey];
    const hasActivity =
      log &&
      (log.studyMinutes > 0 ||
        log.questionsSolved > 0 ||
        (log.completedTaskIds && log.completedTaskIds.length > 0));
    const hasFreeze = freezeSet.has(checkKey);

    if (hasActivity || hasFreeze) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.max(1, streak);
}

/**
 * Checks if the user is eligible to activate a Hospital Duty Shield for the given date.
 */
export function canActivateDutyShield(
  state: AppState,
  targetDateStr: string = getLocalDateKey()
): { allowed: boolean; reason?: string } {
  const freezes = state.streakFreezesAvailable ?? MAX_MONTHLY_STREAK_FREEZES;
  const used = state.streakFreezeDates || [];

  if (used.includes(targetDateStr)) {
    return { allowed: false, reason: 'Hospital duty shield is already active for today.' };
  }

  if (freezes <= 0) {
    return {
      allowed: false,
      reason: `Monthly quota reached (${MAX_MONTHLY_STREAK_FREEZES}/${MAX_MONTHLY_STREAK_FREEZES} shields used this month).`,
    };
  }

  return { allowed: true };
}

/**
 * Activates a clinical duty shield for today, preserving the student's study streak.
 */
export function activateDutyShield(
  state: AppState,
  targetDateStr: string = getLocalDateKey()
): AppState {
  const check = canActivateDutyShield(state, targetDateStr);
  if (!check.allowed) return state;

  const currentAvailable = state.streakFreezesAvailable ?? MAX_MONTHLY_STREAK_FREEZES;
  const currentDates = state.streakFreezeDates || [];

  return {
    ...state,
    streakFreezesAvailable: Math.max(0, currentAvailable - 1),
    streakFreezeDates: [...currentDates, targetDateStr],
  };
}

/**
 * Retrieves summary status of hospital duty shields for the current user.
 */
export function getStreakProtectionStatus(state: AppState): StreakProtectionStatus {
  const available = state.streakFreezesAvailable ?? MAX_MONTHLY_STREAK_FREEZES;
  const used = state.streakFreezeDates || [];
  const todayKey = getLocalDateKey();

  return {
    availableCount: available,
    maxMonthly: MAX_MONTHLY_STREAK_FREEZES,
    isActiveToday: used.includes(todayKey),
    usedDates: used,
  };
}
