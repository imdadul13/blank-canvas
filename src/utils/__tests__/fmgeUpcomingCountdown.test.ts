import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getNextFmgeSessionDate, getDaysUntilDateKey } from '../date';
import { getDaysRemainingToExam } from '../adaptivePriorityEngine';
import { calculateAppStats } from '../storage';
import { getInitialAppState } from '../../data/sampleData';

describe('FMGE Dynamic Upcoming Exam Session & Countdown', () => {
  test('calculates correct upcoming session for September 2026', () => {
    const testDate = new Date(2026, 8, 21); // Sept 21, 2026
    const nextSession = getNextFmgeSessionDate(testDate);
    assert.equal(nextSession, '2026-12-20', 'Upcoming session should be December 20, 2026');
  });

  test('calculates correct upcoming session for January 2027', () => {
    const testDate = new Date(2027, 0, 15); // Jan 15, 2027
    const nextSession = getNextFmgeSessionDate(testDate);
    assert.equal(nextSession, '2027-06-28', 'Upcoming session should be June 28, 2027');
  });

  test('calculates correct upcoming session after December session', () => {
    const testDate = new Date(2026, 11, 25); // Dec 25, 2026
    const nextSession = getNextFmgeSessionDate(testDate);
    assert.equal(nextSession, '2027-06-28', 'After Dec session should roll over to June 28 of next year');
  });

  test('getDaysRemainingToExam never returns 1 when examDate is expired in past', () => {
    const state = getInitialAppState();
    // Simulate expired June 2026 target
    state.settings.examDate = '2026-06-28';
    const remaining = getDaysRemainingToExam(state);
    assert.ok(remaining > 30, `Expected remaining days to be realistic upcoming cycle (>30), got ${remaining}`);
  });

  test('getDaysRemainingToExam respects valid future examDate', () => {
    const state = getInitialAppState();
    const future = new Date();
    future.setDate(future.getDate() + 75);
    const yr = future.getFullYear();
    const mo = String(future.getMonth() + 1).padStart(2, '0');
    const da = String(future.getDate()).padStart(2, '0');
    state.settings.examDate = `${yr}-${mo}-${da}`;

    const remaining = getDaysRemainingToExam(state);
    assert.ok(remaining >= 74 && remaining <= 76, `Expected ~75 days, got ${remaining}`);
  });

  test('calculateAppStats calculates positive daysRemaining for state', () => {
    const state = getInitialAppState();
    const stats = calculateAppStats(state);
    assert.ok(stats.daysRemaining > 30, `Expected stats.daysRemaining to be > 30, got ${stats.daysRemaining}`);
  });
});
