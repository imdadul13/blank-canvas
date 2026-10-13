import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveCloudConflict, mergeFmgeSprintSnapshots } from '../cloudSync';
import { getInitialAppState } from '../../data/sampleData';
import { AppState, McqAttempt } from '../../types';

describe('Cloud Sync & Conflict Resolution Resilience', () => {
  it('1. resolveCloudConflict merges distinct MCQ attempts between local cache and cloud without dropping either', () => {
    const base = getInitialAppState();

    const localAttempt: McqAttempt = {
      id: 'attempt-local-1',
      questionId: 'q-med-1',
      selectedOptionId: 'opt-1',
      selectedAnswer: 'B',
      attemptNumber: 1,
      isCorrect: true,
      timestamp: '2026-10-14T01:00:00.000Z',
      timeTakenSeconds: 45,
      subjectId: 'medicine',
      topicId: 'med-1',
      source: 'qbank',
    };

    const cloudAttempt: McqAttempt = {
      id: 'attempt-cloud-1',
      questionId: 'q-surg-1',
      selectedOptionId: 'opt-2',
      selectedAnswer: 'C',
      attemptNumber: 1,
      isCorrect: false,
      timestamp: '2026-10-14T00:50:00.000Z',
      timeTakenSeconds: 60,
      subjectId: 'surgery',
      topicId: 'surg-1',
      source: 'qbank',
    };

    const localState: AppState = {
      ...base,
      mcqAttempts: [localAttempt],
    };

    const cloudState: AppState = {
      ...base,
      mcqAttempts: [cloudAttempt],
    };

    const resolved = resolveCloudConflict(localState, cloudState);

    assert.equal(resolved.mcqAttempts?.length, 2, 'Must contain both local and cloud attempts');
    assert(resolved.mcqAttempts?.some((a) => a.id === 'attempt-local-1'), 'Retains local attempt');
    assert(resolved.mcqAttempts?.some((a) => a.id === 'attempt-cloud-1'), 'Retains cloud attempt');
  });

  it('2. resolveCloudConflict merges topic revision ticks and checklists additively', () => {
    const base = getInitialAppState();

    const localState: AppState = {
      ...base,
      topicsState: {
        'anat-1': {
          notesDone: true,
          qBankDone: false,
          r1Done: false,
          r2Done: false,
          r3Done: false,
        },
      },
    };

    const cloudState: AppState = {
      ...base,
      topicsState: {
        'anat-1': {
          notesDone: false,
          qBankDone: true,
          r1Done: true,
          r2Done: false,
          r3Done: false,
        },
      },
    };

    const resolved = resolveCloudConflict(localState, cloudState);
    const anat = resolved.topicsState['anat-1'];

    assert(anat, 'Topic exists');
    assert.equal(anat.notesDone, true, 'Retains notesDone from local');
    assert.equal(anat.qBankDone, true, 'Retains qBankDone from cloud');
    assert.equal(anat.r1Done, true, 'Retains r1Done from cloud');
  });

  it('3. resolveCloudConflict preserves rapid revision and task progress across hard refresh recovery', () => {
    const base = getInitialAppState();

    const localState: AppState = {
      ...base,
      rapidRevisionProgress: {
        'cardio-high-yield': true,
        'renal-biopsy-pearls': true,
      },
      dailyTasks: [
        {
          id: 'task-1',
          title: 'Review 50 Pathology MCQs',
          type: 'qbank',
          durationMinutes: 45,
          completed: true,
          priority: 'high',
        },
      ],
    };

    const cloudState: AppState = {
      ...base,
      rapidRevisionProgress: {
        'cardio-high-yield': false,
        'neuro-tracts': true,
      },
      dailyTasks: [
        {
          id: 'task-2',
          title: 'Pharmacology ANS Flashcards',
          type: 'revision',
          durationMinutes: 30,
          completed: true,
          priority: 'medium',
        },
      ],
    };

    const resolved = resolveCloudConflict(localState, cloudState);

    // Rapid revision checklist items are additive; local overrides overlapping keys
    assert.equal(resolved.rapidRevisionProgress?.['cardio-high-yield'], true);
    assert.equal(resolved.rapidRevisionProgress?.['renal-biopsy-pearls'], true);
    assert.equal(resolved.rapidRevisionProgress?.['neuro-tracts'], true);

    // Daily tasks union preserved
    assert.equal(resolved.dailyTasks.length, 2);
    assert(resolved.dailyTasks.some((t) => t.id === 'task-1'));
    assert(resolved.dailyTasks.some((t) => t.id === 'task-2'));
  });

  it('4. mergeFmgeSprintSnapshots merges sprint tasks and selects newest update', () => {
    const olderCloudSprint = {
      startedOn: '2026-10-01',
      dailyHours: 6,
      updatedAt: '2026-10-13T10:00:00.000Z',
      completedTasks: { 'day-1-t1': true, 'day-1-t2': true },
    };

    const newerLocalSprint = {
      startedOn: '2026-10-01',
      dailyHours: 6,
      updatedAt: '2026-10-13T15:00:00.000Z',
      completedTasks: { 'day-1-t1': true, 'day-1-t3': true },
    };

    const merged = mergeFmgeSprintSnapshots(newerLocalSprint, olderCloudSprint);
    assert(merged, 'Sprint is not null');
    assert.equal(merged.completedTasks['day-1-t1'], true);
    assert.equal(merged.completedTasks['day-1-t2'], true);
    assert.equal(merged.completedTasks['day-1-t3'], true);
  });
});
