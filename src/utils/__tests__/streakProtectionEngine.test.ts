import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProtectedStudyStreak,
  canActivateDutyShield,
  activateDutyShield,
  getStreakProtectionStatus,
  MAX_MONTHLY_STREAK_FREEZES,
} from '../streakProtectionEngine';
import { AppState, DailyStudyLog } from '../../types';
import { getLocalDateKey } from '../date';

describe('Clinical Duty Streak Protection Engine', () => {
  it('1. Empty study logs without freeze returns 0 streak', () => {
    assert.equal(calculateProtectedStudyStreak({}, []), 0);
  });

  it('2. Freeze bridges a missed day and preserves streak continuity', () => {
    const today = new Date();
    const todayKey = getLocalDateKey(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);

    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    const dayBeforeKey = getLocalDateKey(dayBefore);

    // Logs: day before studied, yesterday missed, today studied
    const logs: Record<string, DailyStudyLog> = {
      [todayKey]: { date: todayKey, studyMinutes: 45, questionsSolved: 20, mood: 'great', completedTaskIds: [] },
      [dayBeforeKey]: { date: dayBeforeKey, studyMinutes: 60, questionsSolved: 30, mood: 'fire', completedTaskIds: [] },
    };

    // Without freeze: yesterday has a gap, so streak is just 1 (today)
    const rawStreak = calculateProtectedStudyStreak(logs, []);
    assert.equal(rawStreak, 1);

    // With yesterday protected by hospital duty freeze: streak bridges across to 3 days!
    const protectedStreak = calculateProtectedStudyStreak(logs, [yesterdayKey]);
    assert.equal(protectedStreak, 3);
  });

  it('3. canActivateDutyShield validates monthly limit and duplicates', () => {
    const todayKey = getLocalDateKey();
    const mockState: Partial<AppState> = {
      streakFreezesAvailable: 2,
      streakFreezeDates: [],
    };

    // First activation allowed
    assert.equal(canActivateDutyShield(mockState as AppState, todayKey).allowed, true);

    // After using 2:
    const exhaustedState: Partial<AppState> = {
      streakFreezesAvailable: 0,
      streakFreezeDates: ['2026-09-01', '2026-09-05'],
    };
    const checkExhausted = canActivateDutyShield(exhaustedState as AppState, todayKey);
    assert.equal(checkExhausted.allowed, false);
    assert.ok(checkExhausted.reason?.includes('Monthly quota reached'));

    // Duplicate check
    const duplicateState: Partial<AppState> = {
      streakFreezesAvailable: 1,
      streakFreezeDates: [todayKey],
    };
    const checkDuplicate = canActivateDutyShield(duplicateState as AppState, todayKey);
    assert.equal(checkDuplicate.allowed, false);
    assert.ok(checkDuplicate.reason?.includes('already active'));
  });

  it('4. activateDutyShield deducts from quota and registers protected date', () => {
    const todayKey = getLocalDateKey();
    const baseState: Partial<AppState> = {
      streakFreezesAvailable: 2,
      streakFreezeDates: [],
    };

    const nextState = activateDutyShield(baseState as AppState, todayKey);
    assert.equal(nextState.streakFreezesAvailable, 1);
    assert.deepEqual(nextState.streakFreezeDates, [todayKey]);

    const status = getStreakProtectionStatus(nextState);
    assert.equal(status.availableCount, 1);
    assert.equal(status.maxMonthly, MAX_MONTHLY_STREAK_FREEZES);
    assert.equal(status.isActiveToday, true);
  });
});
