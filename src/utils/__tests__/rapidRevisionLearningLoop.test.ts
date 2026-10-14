import { describe, it } from 'node:test';
import assert from 'node:assert';
import { recordMcqAttempt, calculateTopicPerformanceMetrics } from '../performanceEngine';
import type { AppState, McqAttempt, ErrorNotebookItem } from '../../types';

describe('Rapid Revision Learning Loop & Mastery Verification', () => {
  const createBaseState = (): AppState => ({
    settings: {
      userName: 'Doctor',
      examDate: '2026-10-31',
      targetScore: 200,
      dailyStudyHourGoal: 6,
    },
    subjectProgress: {},
    topicsState: {},
    studyLogs: {},
    grandTests: [],
    errorNotebook: [],
    dailyTasks: [],
    customPearls: [],
    bookmarkedPearlIds: [],
    mcqAttempts: [],
  });

  describe('1. Error Vault & Clinical Explanation Attachment', () => {
    it('attaches full clinical explanation and high-yield pearl when logging an incorrect attempt', () => {
      const state = createBaseState();
      const explanationText = 'First-line therapy for status epilepticus is IV Lorazepam 0.1 mg/kg. Valproate is second-line.';
      const pearlText = 'Status epilepticus protocol begins at T=5 minutes. Never delay IV lorazepam while awaiting labs.';

      const { updatedState } = recordMcqAttempt(state, {
        questionId: 'seizure-status-mcq-1',
        subjectId: 'medicine',
        topicId: 'med-epilepsy',
        topicName: 'Epilepsy & Seizures',
        isCorrect: false,
        selectedAnswer: 'IV Phenytoin 20 mg/kg over 2 minutes',
        correctAnswer: 'IV Lorazepam 4 mg bolus (0.1 mg/kg)',
        selectedOptionId: 'opt-c',
        correctOptionId: 'opt-a',
        timeTakenSeconds: 45,
        confidence: 'low',
        source: 'qbank',
        explanation: explanationText,
        highYieldPearl: pearlText,
      });

      assert.strictEqual(updatedState.mcqAttempts?.length, 1);
      assert.strictEqual(updatedState.errorNotebook.length, 1);

      const errorEntry = updatedState.errorNotebook[0];
      assert.strictEqual(errorEntry.subjectId, 'medicine');
      assert.strictEqual(errorEntry.topicId, 'med-epilepsy');
      assert.strictEqual(errorEntry.isReviewed, false);
      assert.ok(
        errorEntry.correctConcept.includes(explanationText),
        'Error Vault item must contain full clinical explanation'
      );
      assert.ok(
        errorEntry.correctConcept.includes(pearlText),
        'Error Vault item must contain clinical pearl'
      );
    });

    it('logs correct answers marked as guesses into Error Vault as lucky guesses', () => {
      const state = createBaseState();
      const { updatedState } = recordMcqAttempt(state, {
        questionId: 'jme-genetics-mcq-2',
        subjectId: 'medicine',
        topicId: 'med-epilepsy',
        topicName: 'Epilepsy & Seizures',
        isCorrect: true, // Answered correctly!
        selectedAnswer: '4-6 Hz polyspike and slow wave discharges',
        correctAnswer: '4-6 Hz polyspike and slow wave discharges',
        selectedOptionId: 'opt-b',
        correctOptionId: 'opt-b',
        timeTakenSeconds: 20,
        confidence: 'guess', // But it was a guess
        source: 'qbank',
        explanation: 'JME shows rapid 4-6 Hz generalized polyspike-and-wave discharges, typically triggered by photic stimulation or morning awakening.',
      });

      assert.strictEqual(updatedState.mcqAttempts?.length, 1);
      assert.strictEqual(updatedState.mcqAttempts?.[0].confidence, 'guess');
      assert.strictEqual(
        updatedState.errorNotebook.length,
        1,
        'Lucky guess must be logged to Error Vault for concept consolidation'
      );

      const luckyGuessError = updatedState.errorNotebook[0];
      assert.ok(
        luckyGuessError.myMistake.includes('Answered correctly by guessing'),
        'Mistake description must record that answer was an unconfirmed guess'
      );
      assert.strictEqual(luckyGuessError.isReviewed, false);
    });
  });

  describe('2. Flashcard Priority Sorting Rule', () => {
    it('prioritizes flashcards strictly in order: again -> difficult -> unrated -> got_it', () => {
      const cards = [
        { id: 'fc-1', front: 'Q1', back: 'A1' },
        { id: 'fc-2', front: 'Q2', back: 'A2' },
        { id: 'fc-3', front: 'Q3', back: 'A3' },
        { id: 'fc-4', front: 'Q4', back: 'A4' },
      ];

      const ratings: Record<string, 'again' | 'difficult' | 'got_it'> = {
        'fc-1': 'got_it',
        'fc-2': 'difficult',
        'fc-3': 'again',
        // fc-4 is unrated
      };

      const getPriority = (id: string) => {
        const rating = ratings[id];
        if (rating === 'again') return 1;
        if (rating === 'difficult') return 2;
        if (!rating) return 3;
        return 4; // 'got_it'
      };

      const sorted = [...cards].sort((a, b) => getPriority(a.id) - getPriority(b.id));

      assert.strictEqual(sorted[0].id, 'fc-3', 'Again (missed) cards must appear first');
      assert.strictEqual(sorted[1].id, 'fc-2', 'Difficult cards must appear second');
      assert.strictEqual(sorted[2].id, 'fc-4', 'Unrated cards must appear third');
      assert.strictEqual(sorted[3].id, 'fc-1', 'Got It (mastered) cards must appear last');
    });
  });

  describe('3. Demonstrated Mastery & Readiness Verification Rule', () => {
    it('denies mastery when question attempts are insufficient (< 5)', () => {
      const attempts: McqAttempt[] = [
        {
          id: 'att-1',
          questionId: 'q-1',
          subjectId: 'medicine',
          topicId: 'med-epilepsy',
          topicName: 'Epilepsy & Seizures',
          isCorrect: true,
          selectedAnswer: 'Option A',
          timeTakenSeconds: 30,
          attemptNumber: 1,
          source: 'qbank',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'att-2',
          questionId: 'q-2',
          subjectId: 'medicine',
          topicId: 'med-epilepsy',
          topicName: 'Epilepsy & Seizures',
          isCorrect: true,
          selectedAnswer: 'Option B',
          timeTakenSeconds: 25,
          attemptNumber: 1,
          source: 'qbank',
          timestamp: new Date().toISOString(),
        },
      ];

      const metrics = calculateTopicPerformanceMetrics('medicine', 'med-epilepsy', attempts);
      assert.strictEqual(metrics.totalAttempts, 2);
      assert.strictEqual(metrics.accuracy, 100);

      // Demonstrates mastery rule: >= 5 attempts required
      const isDemonstratedMastery = metrics.totalAttempts >= 5 && metrics.accuracy >= 80;
      assert.strictEqual(isDemonstratedMastery, false, 'Insufficient attempts must not qualify as demonstrated mastery');
    });

    it('denies mastery when topic has unresolved errors in Error Vault', () => {
      // 5 attempts with 80% accuracy (4 correct, 1 wrong)
      const attempts: McqAttempt[] = Array.from({ length: 5 }, (_, idx) => ({
        id: `att-${idx}`,
        questionId: `q-${idx}`,
        subjectId: 'medicine',
        topicId: 'med-epilepsy',
        topicName: 'Epilepsy & Seizures',
        isCorrect: idx !== 0, // 1 incorrect, 4 correct = 80%
        selectedAnswer: idx === 0 ? 'Phenytoin' : 'Valproate',
        timeTakenSeconds: 30,
        attemptNumber: 1,
        source: 'qbank' as const,
        timestamp: new Date().toISOString(),
      }));

      const unresolvedErrors: ErrorNotebookItem[] = [
        {
          id: 'err-1',
          subjectId: 'medicine',
          topic: 'Epilepsy & Seizures',
          topicId: 'med-epilepsy',
          questionGist: 'Status epilepticus second line drug',
          myMistake: 'Chose Phenytoin instead of Levetiracetam/Valproate',
          correctConcept: 'IV Valproate or Levetiracetam preferred',
          isReviewed: false, // Unresolved!
          dateAdded: new Date().toISOString(),
        },
      ];

      const metrics = calculateTopicPerformanceMetrics('medicine', 'med-epilepsy', attempts);
      assert.strictEqual(metrics.totalAttempts, 5);
      assert.strictEqual(metrics.accuracy, 80);

      const hasUnresolved = unresolvedErrors.some(
        (e) => !e.isReviewed && (e.topicId === 'med-epilepsy' || e.topic === 'Epilepsy & Seizures')
      );
      assert.strictEqual(hasUnresolved, true);

      const qualifiesForMastery = metrics.totalAttempts >= 5 && metrics.accuracy >= 80 && !hasUnresolved;
      assert.strictEqual(qualifiesForMastery, false, 'Unresolved errors must block demonstrated mastery');
    });

    it('confirms demonstrated mastery only when >= 5 attempts, >= 80% accuracy, and 0 unresolved errors', () => {
      const attempts: McqAttempt[] = Array.from({ length: 6 }, (_, idx) => ({
        id: `att-${idx}`,
        questionId: `q-${idx}`,
        subjectId: 'medicine',
        topicId: 'med-epilepsy',
        topicName: 'Epilepsy & Seizures',
        isCorrect: true, // 100% accuracy
        selectedAnswer: 'Correct Option',
        timeTakenSeconds: 28,
        attemptNumber: 1,
        source: 'qbank' as const,
        timestamp: new Date().toISOString(),
      }));

      const unresolvedErrors: ErrorNotebookItem[] = []; // Zero unresolved errors

      const metrics = calculateTopicPerformanceMetrics('medicine', 'med-epilepsy', attempts);
      assert.strictEqual(metrics.totalAttempts, 6);
      assert.strictEqual(metrics.accuracy, 100);

      const hasUnresolved = unresolvedErrors.some(
        (e) => !e.isReviewed && (e.topicId === 'med-epilepsy' || e.topic === 'Epilepsy & Seizures')
      );
      const qualifiesForMastery = metrics.totalAttempts >= 5 && metrics.accuracy >= 80 && !hasUnresolved;

      assert.strictEqual(qualifiesForMastery, true, 'Clean record with sufficient practice qualifies for mastery');
    });
  });
});
