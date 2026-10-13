import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPRINT_TIERS,
  SPRINT_DAYS,
  FMGE_BLUEPRINT_MARKS,
  daysUntilFmge,
  sprintDateForIndex,
  sprintDayIndex,
  checklistsForPlan,
  buildAdaptiveSprintDays,
} from '../sprintEngine';
import { generateFlashcardDeck } from '../flashcardEngine';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import type { McqAttempt, GrandTest } from '../../types';

describe('Sprint Engine & High-Yield 20-Day System', () => {
  it('validates NBEMS blueprint marks cover all core examination subjects', () => {
    const totalBlueprintMarks = Object.values(FMGE_BLUEPRINT_MARKS).reduce((a, b) => a + b, 0);
    assert.equal(totalBlueprintMarks, 300, 'Total blueprint marks must sum to 300');
    assert.ok(FMGE_BLUEPRINT_MARKS.medicine >= 30, 'Medicine must carry at least 30 marks');
    assert.ok(FMGE_BLUEPRINT_MARKS.surgery >= 30, 'Surgery must carry at least 30 marks');
    assert.ok(FMGE_BLUEPRINT_MARKS.obg >= 30, 'OBG must carry at least 30 marks');
    assert.ok(FMGE_BLUEPRINT_MARKS.psm >= 30, 'PSM must carry at least 30 marks');
  });

  it('validates 3-tier structure and Big 6 mark dominance', () => {
    assert.equal(SPRINT_TIERS.length, 3, 'Must define exactly 3 tiers');
    const tier1 = SPRINT_TIERS.find((t) => t.tier === 1);
    assert.ok(tier1, 'Tier 1 must exist');
    assert.equal(tier1.subjectIds.length, 6, 'Tier 1 must contain exactly the Big 6 subjects');

    const big6Subjects = ['psm', 'obg', 'surgery', 'medicine', 'pathology', 'pharmacology'];
    for (const subId of big6Subjects) {
      assert.ok(tier1.subjectIds.includes(subId), `Tier 1 must include ${subId}`);
      assert.ok(tier1.mustKnowTopics[subId]?.length > 0, `${subId} must have must-know topics`);
    }

    const tier1Marks = tier1.subjectIds.reduce(
      (sum, id) => sum + (FMGE_BLUEPRINT_MARKS[id] || 0),
      0
    );
    assert.ok(tier1Marks >= 150, 'Tier 1 Big 6 marks alone must exceed the 150 passing cutoff');
  });

  it('verifies SPRINT_DAYS contains exactly 20 days with checkpoint and full mock', () => {
    assert.equal(SPRINT_DAYS.length, 20, 'Sprint must contain 20 days');
    const fullMockDay = SPRINT_DAYS.find((d) => d.fullMock);
    assert.ok(fullMockDay, 'Sprint must contain at least one full mock day');
    assert.equal(fullMockDay.questions, 300, 'Full mock must test 300 questions');

    const restDay = SPRINT_DAYS[SPRINT_DAYS.length - 1];
    assert.ok(restDay.restDay, 'Day 20 (eve) must be marked as rest day');
  });

  it('verifies checklist generation with hours scaling', () => {
    const regularDay = SPRINT_DAYS[1];
    const checklists6h = checklistsForPlan(regularDay, 6, 60);
    assert.equal(checklists6h.length, 4, 'Must produce 4 distinct daily study phases');
    assert.ok(checklists6h[0].includes('Focused revision'), 'Phase 1 must be focused revision');
    assert.ok(checklists6h[1].includes('Active recall'), 'Phase 2 must be active recall');
    assert.ok(checklists6h[2].includes('Question practice'), 'Phase 3 must be question practice');
    assert.ok(checklists6h[3].includes('Error review'), 'Phase 4 must be error review');

    const mockDay = SPRINT_DAYS.find((d) => d.fullMock)!;
    const mockChecklists = checklistsForPlan(mockDay, 6, 300);
    assert.ok(mockChecklists[2].includes('Timed mock: complete two 150-question blocks'));
  });

  it('adapts sprint priority when student has recent errors and mock weaknesses', () => {
    const attempts: McqAttempt[] = [
      {
        id: 'att-1',
        questionId: 'q-obg-1',
        source: 'qbank',
        subjectId: 'obg',
        topicId: 'obg-1',
        isCorrect: false,
        confidence: 'guess',
        selectedAnswer: 'A',
        timeTakenSeconds: 32,
        attemptNumber: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'att-2',
        questionId: 'q-obg-2',
        source: 'qbank',
        subjectId: 'obg',
        topicId: 'obg-1',
        isCorrect: false,
        confidence: 'low',
        selectedAnswer: 'B',
        timeTakenSeconds: 28,
        attemptNumber: 1,
        timestamp: new Date().toISOString(),
      },
    ];

    const grandTests: GrandTest[] = [
      {
        id: 'gt-1',
        title: 'Mock 1',
        platform: 'NBE Mock',
        date: '2026-10-01',
        score: 135,
        totalMarks: 300,
        correctCount: 135,
        incorrectCount: 165,
        skippedCount: 0,
        weakSubjectIds: ['obg', 'surgery'],
        strongSubjectIds: ['psm'],
        keyMistakesNotes: 'Eclampsia management',
      },
    ];

    const adaptivePlan = buildAdaptiveSprintDays(attempts, grandTests, {});
    assert.equal(adaptivePlan.length, 20, 'Adaptive plan must still have 20 days');
    assert.ok(adaptivePlan[4].focus.length > 0, 'Must have calibrated focus text');
  });

  it('validates authentic flashcard deck generation across disciplines', () => {
    const subjectsToTest = ['obg', 'anatomy', 'medicine', 'pharmacology', 'pathology'];
    for (const subId of subjectsToTest) {
      const subject = FMGE_SUBJECTS.find((s) => s.id === subId);
      assert.ok(subject, `Subject ${subId} must exist`);
      const topic = subject.topics[0];
      assert.ok(topic, `Topic for ${subId} must exist`);

      const deck = generateFlashcardDeck(subject.id, topic.id, topic.name);
      assert.ok(deck.cards.length >= 3, `${topic.name} must have at least 3 flashcards`);
      for (const card of deck.cards) {
        assert.ok(card.front.length > 10, 'Card front must be an informative clinical question');
        assert.ok(card.back.length > 5, 'Card back must contain clinical answer');
        assert.ok(['high-yield', 'core', 'trap'].includes(card.difficulty), 'Valid difficulty');
      }
    }
  });
});
