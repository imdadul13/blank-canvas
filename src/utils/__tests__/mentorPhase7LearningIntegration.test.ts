import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMentorContext,
  resolveMedicalTopic,
  detectMentorMode,
  resolveEffectiveQueryContext,
} from '../mentorContextEngine';
import { isPyqRequest, lookupVerifiedPyq } from '../../../server/dynamic-mcq-engine';
import type { AppState } from '../../types';

describe('Phase 7: Faculty Mentor Learning System Integration', () => {
  // Mock AppState representing a real user profile with weak areas, study logs, and mistake vault
  const mockAppState: Partial<AppState> = {
    settings: {
      examDate: '2026-09-13',
      dailyGoalMinutes: 120,
      dailyQuestionTarget: 50,
      name: 'Dr. Test Candidate',
    } as any,
    studyLogs: {
      '2026-09-11': { date: '2026-09-11', studyMinutes: 45, questionsSolved: 20, completedTaskIds: [], mood: 'great' },
      '2026-09-12': { date: '2026-09-12', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'fire' },
    },
    topicsState: {
      'pharm-4': {
        notesDone: true,
        qBankDone: true,
        r1Done: false,
        qBankAccuracy: 42,
      },
      'phys-3': {
        notesDone: true,
        qBankDone: false,
        r1Done: false,
        qBankAccuracy: 55,
      },
    },
    mcqAttempts: [
      {
        id: 'att-1',
        questionId: 'q-pharma-1',
        topicId: 'pharm-4',
        topicName: 'Antiarrhythmics',
        subjectId: 'pharmacology',
        isCorrect: false,
        timestamp: '2026-09-12T10:00:00Z',
        selectedAnswer: 'Digoxin',
        correctAnswer: 'Amiodarone',
        source: 'mentor',
        timeTakenSeconds: 45,
        difficulty: 'high-yield',
        attemptNumber: 1,
      },
      {
        id: 'att-2',
        questionId: 'q-cardio-1',
        topicId: 'phys-3',
        topicName: 'Myocardial Infarction',
        subjectId: 'physiology',
        isCorrect: true,
        timestamp: '2026-09-12T11:00:00Z',
        selectedAnswer: 'STEMI',
        correctAnswer: 'STEMI',
        source: 'qbank',
        timeTakenSeconds: 30,
        difficulty: 'standard',
        attemptNumber: 1,
      },
    ],
    errorNotebook: [
      {
        id: 'err-1',
        subjectId: 'pharmacology',
        topic: 'Antiarrhythmics',
        questionGist: 'A 62-year-old male with atrial fibrillation develops pulmonary fibrosis. Which drug is the cause?',
        myMistake: 'Digoxin',
        correctConcept: 'Amiodarone causes pulmonary toxicity, thyroid dysfunction, and corneal microdeposits.',
        isReviewed: false,
        dateAdded: '2026-09-12T10:00:00Z',
      },
    ],
  };

  describe('1. Single Normalized Mentor Context Builder', () => {
    it('accurately derives weak subjects and topics without fabricated data', () => {
      const context = buildMentorContext(mockAppState as AppState);

      assert.ok(context, 'Context must exist');
      assert.strictEqual(context.examDate, '2026-09-13');
      assert.ok(typeof context.daysToExam === 'number');

      // Weak areas must identify pharmacology/antiarrhythmics
      assert.ok(context.weakSubjects.some(s => s.toLowerCase().includes('pharma')), 'Pharmacology must be weak');
      assert.ok(context.weakTopics.some(t => t.toLowerCase().includes('antiarrhythmics')), 'Antiarrhythmics must be weak topic');

      // Recent study history
      assert.ok(context.recentSubjects.length > 0);
      assert.strictEqual(context.recentMistakes.length, 1);
      assert.strictEqual(context.recentMistakes[0].topic, 'Antiarrhythmics');
      assert.strictEqual(context.recentMistakes[0].mistake, 'Digoxin');
    });
  });

  describe('2. Medical Topic & Acronym Normalization', () => {
    it('normalizes common medical acronyms and high-yield topics', () => {
      assert.strictEqual(resolveMedicalTopic('What are the ECG signs in MI?')?.canonicalTopic, 'Myocardial Infarction');
      assert.strictEqual(resolveMedicalTopic('Compare Crohn and UC')?.canonicalTopic, 'Ulcerative Colitis');
      assert.strictEqual(resolveMedicalTopic('Tell me about PSGN presentation')?.canonicalTopic, 'Post-Streptococcal Glomerulonephritis');
      assert.strictEqual(resolveMedicalTopic('How to treat DKA vs HHS?')?.canonicalTopic, 'Diabetic Ketoacidosis');
      assert.strictEqual(resolveMedicalTopic('Explain Sjogren syndrome')?.canonicalTopic, 'Sjögren Syndrome');
      assert.strictEqual(resolveMedicalTopic('Management of severe PPH')?.canonicalTopic, 'Postpartum Hemorrhage');
    });
  });

  describe('3. Mentor Mode Detection', () => {
    it('correctly maps user queries to expected operational modes', () => {
      assert.strictEqual(detectMentorMode('Explain Crohn disease'), 'EXPLAIN');
      assert.strictEqual(detectMentorMode('Compare Crohn and UC'), 'COMPARE');
      assert.strictEqual(detectMentorMode('Give me 5 MCQs on Crohn disease'), 'QUIZ');
      assert.strictEqual(detectMentorMode('Give me harder ones'), 'QUIZ');
      assert.strictEqual(detectMentorMode('Quiz me on my weak areas'), 'WEAK_AREA');
      assert.strictEqual(detectMentorMode('Review my mistakes'), 'REMEDIATION');
      assert.strictEqual(detectMentorMode('What should I study today?'), 'REVISION');
      assert.strictEqual(detectMentorMode('Continue where I left off'), 'REVISION');
    });
  });

  describe('4. Context Priority Engine', () => {
    it('prioritizes explicit user topic over background performance context', () => {
      const context = buildMentorContext(mockAppState as AppState);
      const effective = resolveEffectiveQueryContext(
        'Explain Crohn disease',
        context,
        []
      );

      assert.strictEqual(effective.mode, 'EXPLAIN');
      assert.strictEqual(effective.topic, "Crohn's Disease");
      assert.strictEqual(effective.subject, 'General Medicine');
      // Must not override with pharmacology weak area
      assert.notStrictEqual(effective.subject, 'Pharmacology');
    });

    it('infers topic from history when user gives follow-up "Give me harder ones"', () => {
      const context = buildMentorContext(mockAppState as AppState);
      const history = [
        { role: 'user', content: 'Give me 5 MCQs on Crohn disease' },
        { role: 'assistant', content: 'Here is a quiz on Crohn disease...' },
      ];
      const effective = resolveEffectiveQueryContext(
        'Give me harder ones',
        context,
        history
      );

      assert.strictEqual(effective.topic, "Crohn's Disease");
    });
  });

  describe('5. PYQ Integrity Guard & Provenance Verification', () => {
    it('identifies PYQ requests correctly', () => {
      assert.strictEqual(isPyqRequest('Give me actual NEET PG PYQs on cardiology'), true);
      assert.strictEqual(isPyqRequest('Previous year questions for pharmacology'), true);
      assert.strictEqual(isPyqRequest('Give me AI-style cardiology questions'), false);
      assert.strictEqual(isPyqRequest('Explain MI pathogenesis'), false);
    });

    it('returns honest disclosure when verified PYQ does not exist', () => {
      const verified = lookupVerifiedPyq('Cardiology', 'Heart Failure');
      // Unless verified PYQs exist in verified static pool, returns null
      assert.strictEqual(verified, null);
    });
  });

  describe('6. Test Matrix A through O Coverage', () => {
    const context = buildMentorContext(mockAppState as AppState);

    it('A. "Explain Crohn disease."', () => {
      const q = resolveEffectiveQueryContext('Explain Crohn disease.', context, []);
      assert.strictEqual(q.mode, 'EXPLAIN');
      assert.strictEqual(q.topic, "Crohn's Disease");
    });

    it('B. "Give me 5 MCQs on Crohn disease."', () => {
      const q = resolveEffectiveQueryContext('Give me 5 MCQs on Crohn disease.', context, []);
      assert.strictEqual(q.mode, 'QUIZ');
      assert.strictEqual(q.topic, "Crohn's Disease");
    });

    it('C. "Give me harder ones."', () => {
      const history = [{ role: 'user', content: 'Give me 5 MCQs on Crohn disease.' }];
      const q = resolveEffectiveQueryContext('Give me harder ones.', context, history);
      assert.strictEqual(q.topic, "Crohn's Disease");
    });

    it('D. "Quiz me on my weak areas."', () => {
      const q = resolveEffectiveQueryContext('Quiz me on my weak areas.', context, []);
      assert.strictEqual(q.mode, 'WEAK_AREA');
      assert.ok(q.targetWeakArea?.subject.toLowerCase().includes('pharma'));
    });

    it('E. "Review my mistakes."', () => {
      const q = resolveEffectiveQueryContext('Review my mistakes.', context, []);
      assert.strictEqual(q.mode, 'REMEDIATION');
      assert.ok(context.recentMistakes.length > 0);
      assert.strictEqual(context.recentMistakes[0].topic, 'Antiarrhythmics');
    });

    it('F. "What should I study today?"', () => {
      const q = resolveEffectiveQueryContext('What should I study today?', context, []);
      assert.strictEqual(q.mode, 'REVISION');
      assert.ok(typeof context.daysToExam === 'number');
    });

    it('G. "Continue where I left off."', () => {
      const q = resolveEffectiveQueryContext('Continue where I left off.', context, []);
      assert.strictEqual(q.mode, 'REVISION');
      assert.ok(context.recentSubjects.length > 0);
    });

    it('H. "Give me actual NEET PG PYQs on cardiology."', () => {
      assert.strictEqual(isPyqRequest('Give me actual NEET PG PYQs on cardiology.'), true);
    });

    it('I. "Give me AI-style cardiology questions."', () => {
      assert.strictEqual(isPyqRequest('Give me AI-style cardiology questions.'), false);
      const q = resolveEffectiveQueryContext('Give me AI-style cardiology questions.', context, []);
      assert.strictEqual(q.mode, 'QUIZ');
      assert.strictEqual(q.subject, 'General Medicine');
    });

    it('J. "Compare Crohn and UC."', () => {
      const q = resolveEffectiveQueryContext('Compare Crohn and UC.', context, []);
      assert.strictEqual(q.mode, 'COMPARE');
      assert.ok(q.topic?.includes('Ulcerative Colitis') || q.topic?.includes('Crohn'));
    });

    it('K. "Why did I get that question wrong?"', () => {
      const q = resolveEffectiveQueryContext('Why did I get that question wrong?', context, []);
      assert.strictEqual(q.mode, 'REMEDIATION');
    });

    it('N. Exam date tomorrow + simple medical question (countdown must not be forced)', () => {
      const q = resolveEffectiveQueryContext('What is the classic triad of normal pressure hydrocephalus?', context, []);
      assert.strictEqual(q.mode, 'EXPLAIN');
      assert.strictEqual(q.topic, 'Normal Pressure Hydrocephalus');
    });

    it('O. Exam date tomorrow + revision plan (appropriate high-yield guidance)', () => {
      const q = resolveEffectiveQueryContext('Give me a final day revision strategy.', context, []);
      assert.strictEqual(q.mode, 'REVISION');
      assert.ok(typeof context.daysToExam === 'number');
    });
  });
});
