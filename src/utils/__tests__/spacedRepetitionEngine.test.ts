import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPACED_INTERVAL_LADDER,
  recordSpacedAttempt,
  isSpacedErrorDue,
  getSpacedErrorsSummary,
  formatSpacedIntervalBadge,
  addDaysToDateString,
} from '../spacedRepetitionEngine';
import { ErrorNotebookItem } from '../../types';

describe('Spaced Repetition (FSRS / SM-2) Engine for Mistake Remediation', () => {
  const sampleError: ErrorNotebookItem = {
    id: 'err-1',
    subjectId: 'medicine',
    topic: 'Cardiology',
    questionGist: 'Patient with Beck Triad and pulsus paradoxus',
    myMistake: 'Chose Constrictive Pericarditis',
    correctConcept: 'Cardiac Tamponade presents with hypotension, muffled heart sounds, elevated JVP',
    isReviewed: false,
    dateAdded: '2026-09-01',
  };

  it('1. Fresh unreviewed error is immediately flagged as due', () => {
    assert.equal(isSpacedErrorDue(sampleError, '2026-09-01'), true);
  });

  it('2. First successful attempt advances to Day 1 interval', () => {
    const afterFirst = recordSpacedAttempt(sampleError, true, '2026-09-01');
    assert.equal(afterFirst.isReviewed, true);
    assert.equal(afterFirst.repetitionCount, 1);
    assert.equal(afterFirst.repetitionIntervalDays, 1);
    assert.equal(afterFirst.spacedStage, 'learning');
    assert.equal(afterFirst.nextReviewDueDate, '2026-09-02');
  });

  it('3. Consecutive successful attempts follow the calibrated ladder (1 -> 3 -> 7 -> 21 -> 60)', () => {
    let current = recordSpacedAttempt(sampleError, true, '2026-09-01'); // 1d -> 2026-09-02
    assert.equal(current.repetitionIntervalDays, 1);

    current = recordSpacedAttempt(current, true, '2026-09-02'); // 3d -> 2026-09-05
    assert.equal(current.repetitionCount, 2);
    assert.equal(current.repetitionIntervalDays, 3);
    assert.equal(current.spacedStage, 'learning');

    current = recordSpacedAttempt(current, true, '2026-09-05'); // 7d -> 2026-09-12
    assert.equal(current.repetitionCount, 3);
    assert.equal(current.repetitionIntervalDays, 7);
    assert.equal(current.spacedStage, 'reviewing');

    current = recordSpacedAttempt(current, true, '2026-09-12'); // 21d -> 2026-10-03
    assert.equal(current.repetitionCount, 4);
    assert.equal(current.repetitionIntervalDays, 21);
    assert.equal(current.spacedStage, 'mastered');
  });

  it('4. Repeated blunder resets repetition count to 0 and makes it due immediately', () => {
    const advanced: ErrorNotebookItem = {
      ...sampleError,
      isReviewed: true,
      repetitionCount: 3,
      repetitionIntervalDays: 7,
      spacedStage: 'reviewing',
      nextReviewDueDate: '2026-09-10',
    };

    const lapsed = recordSpacedAttempt(advanced, false, '2026-09-10');
    assert.equal(lapsed.isReviewed, false);
    assert.equal(lapsed.repetitionCount, 0);
    assert.equal(lapsed.repetitionIntervalDays, 1);
    assert.equal(lapsed.spacedStage, 'due');
    assert.equal(lapsed.nextReviewDueDate, '2026-09-10');
    assert.equal(isSpacedErrorDue(lapsed, '2026-09-10'), true);
  });

  it('5. getSpacedErrorsSummary accurately tallies due vs learning vs mastered', () => {
    const notebook: ErrorNotebookItem[] = [
      { ...sampleError, id: '1', nextReviewDueDate: '2026-09-15', spacedStage: 'due' },
      { ...sampleError, id: '2', isReviewed: true, nextReviewDueDate: '2026-09-20', spacedStage: 'learning' },
      { ...sampleError, id: '3', isReviewed: true, nextReviewDueDate: '2026-09-25', spacedStage: 'reviewing' },
      { ...sampleError, id: '4', isReviewed: true, nextReviewDueDate: '2026-10-05', spacedStage: 'mastered' },
    ];

    const summary = getSpacedErrorsSummary(notebook, '2026-09-16');
    assert.equal(summary.dueCount, 1);
    assert.equal(summary.learningCount, 1);
    assert.equal(summary.reviewingCount, 1);
    assert.equal(summary.masteredCount, 1);
    assert.equal(summary.totalCount, 4);
  });

  it('6. formatSpacedIntervalBadge produces crisp clinical labels', () => {
    const dueItem: ErrorNotebookItem = { ...sampleError, isReviewed: false };
    assert.equal(formatSpacedIntervalBadge(dueItem).label, 'Due Now');

    const learningItem: ErrorNotebookItem = {
      ...sampleError,
      isReviewed: true,
      nextReviewDueDate: '2026-09-30',
      repetitionIntervalDays: 3,
      spacedStage: 'learning',
    };
    assert.equal(formatSpacedIntervalBadge(learningItem).label, 'Recall in 3d');
  });

  it('7. addDaysToDateString handles month rollovers correctly', () => {
    assert.equal(addDaysToDateString('2026-09-30', 3), '2026-10-03');
    assert.equal(addDaysToDateString('2026-12-31', 1), '2027-01-01');
  });
});
