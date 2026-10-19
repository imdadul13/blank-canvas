import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  clearMockExamRecovery,
  getMockExamRemainingSeconds,
  loadMockExamRecovery,
  saveMockExamRecovery,
} from '../mockExamRecovery';

const memoryStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => memoryStorage.get(key) || null,
  setItem: (key: string, value: string) => memoryStorage.set(key, String(value)),
  removeItem: (key: string) => memoryStorage.delete(key),
};

describe('NBE mock exam recovery', () => {
  it('restores answers and navigation from a valid snapshot', () => {
    clearMockExamRecovery();
    saveMockExamRecovery({
      deadlineAt: Date.now() + 60_000,
      examMode: 50,
      currentIndex: 1,
      questions: [{ id: 'q1', answer: 'A' }, { id: 'q2', answer: 'C' }],
      isTcsIonSkin: false,
    });

    const restored = loadMockExamRecovery<{ id: string; answer: string }>();
    assert(restored);
    assert.equal(restored.currentIndex, 1);
    assert.equal(restored.questions[1].answer, 'C');
    assert.equal(restored.examMode, 50);
  });

  it('uses an absolute deadline so background time cannot pause the exam', () => {
    assert.equal(getMockExamRemainingSeconds(160_000, 100_000), 60);
    assert.equal(getMockExamRemainingSeconds(99_000, 100_000), 0);
  });

  it('rejects malformed recovery data', () => {
    memoryStorage.set('fmge_nbe_mock_recovery_v1', JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      deadlineAt: Date.now() + 60_000,
      examMode: 50,
      currentIndex: 4,
      questions: [{ id: 'q1' }],
      isTcsIonSkin: false,
    }));
    assert.equal(loadMockExamRecovery(), null);
  });
});
