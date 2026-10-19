import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getInitialAppState } from '../../data/sampleData';
import { buildProgressReport } from '../progressReport';

describe('mentor-friendly progress report', () => {
  it('summarizes readiness, performance, mocks, priorities, and all subjects', () => {
    const state = getInitialAppState();
    state.settings.userName = 'Dr. Test';
    state.grandTests = [{
      id: 'gt-report-1',
      title: 'Weekly Mock',
      platform: 'NBE Mock',
      date: '2026-10-18',
      score: 162,
      totalMarks: 300,
      correctCount: 162,
      incorrectCount: 100,
      skippedCount: 38,
      weakSubjectIds: ['anatomy'],
      strongSubjectIds: ['medicine'],
      keyMistakesNotes: 'Review anatomy landmarks.',
    }];

    const report = buildProgressReport(state, new Date('2026-10-19T10:00:00.000Z'));

    assert.match(report, /FMGE Progress Report — Dr\. Test/);
    assert.match(report, /## Readiness snapshot/);
    assert.match(report, /## Question performance/);
    assert.match(report, /## Priority focus/);
    assert.match(report, /Weekly Mock/);
    assert.match(report, /162\/300/);
    assert.match(report, /General Medicine/);
    assert.match(report, /not guarantees of examination performance/);
    assert(!report.includes('undefined'));
  });
});
