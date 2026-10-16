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
import { generateMixed10Quiz } from '../../components/study/ExamSprintView';

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

    const uncalibratedPlan = buildAdaptiveSprintDays([], [], {});
    assert.equal(uncalibratedPlan.length, 20);
    assert.equal(uncalibratedPlan[4].title, SPRINT_DAYS[4].title, 'Must preserve custom title when !hasEvidence');
    assert.equal(uncalibratedPlan[4].focus, SPRINT_DAYS[4].focus, 'Must preserve custom focus when !hasEvidence');
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

  it('validates exact emergency schedule dates for October 14–30, 2026', () => {
    const examDate = '2026-10-31';

    // Oct 14–15: OBG
    assert.equal(sprintDateForIndex(3, examDate), '2026-10-14');
    assert.deepEqual(SPRINT_DAYS[3].subjects, ['obg']);
    assert.equal(sprintDateForIndex(4, examDate), '2026-10-15');
    assert.deepEqual(SPRINT_DAYS[4].subjects, ['obg']);

    // Oct 16–17: PSM / Community Medicine
    assert.equal(sprintDateForIndex(5, examDate), '2026-10-16');
    assert.deepEqual(SPRINT_DAYS[5].subjects, ['psm']);
    assert.equal(sprintDateForIndex(6, examDate), '2026-10-17');
    assert.deepEqual(SPRINT_DAYS[6].subjects, ['psm']);

    // Oct 18: Biochemistry + FMT
    assert.equal(sprintDateForIndex(7, examDate), '2026-10-18');
    assert.deepEqual(SPRINT_DAYS[7].subjects, ['biochemistry', 'fmt']);

    // Oct 19: Anatomy
    assert.equal(sprintDateForIndex(8, examDate), '2026-10-19');
    assert.deepEqual(SPRINT_DAYS[8].subjects, ['anatomy']);

    // Oct 20: Microbiology
    assert.equal(sprintDateForIndex(9, examDate), '2026-10-20');
    assert.deepEqual(SPRINT_DAYS[9].subjects, ['microbiology']);

    // Oct 21: Pharmacology
    assert.equal(sprintDateForIndex(10, examDate), '2026-10-21');
    assert.deepEqual(SPRINT_DAYS[10].subjects, ['pharmacology']);

    // Oct 22: Pathology + core Physiology
    assert.equal(sprintDateForIndex(11, examDate), '2026-10-22');
    assert.deepEqual(SPRINT_DAYS[11].subjects, ['pathology', 'physiology']);

    // Oct 23–24: General Surgery + Orthopedics
    assert.equal(sprintDateForIndex(12, examDate), '2026-10-23');
    assert.deepEqual(SPRINT_DAYS[12].subjects, ['surgery', 'orthopedics']);
    assert.equal(sprintDateForIndex(13, examDate), '2026-10-24');
    assert.deepEqual(SPRINT_DAYS[13].subjects, ['surgery', 'orthopedics']);

    // Oct 25: Selective Medicine
    assert.equal(sprintDateForIndex(14, examDate), '2026-10-25');
    assert.ok(SPRINT_DAYS[14].subjects.includes('medicine'));

    // Oct 26: Short 5 Blitz (dermatology, psychiatry, anesthesia, radiology, radiotherapy)
    assert.equal(sprintDateForIndex(15, examDate), '2026-10-26');
    assert.ok(SPRINT_DAYS[15].subjects.includes('dermatology'));
    assert.ok(SPRINT_DAYS[15].subjects.includes('psychiatry'));
    assert.ok(SPRINT_DAYS[15].subjects.includes('radiology'));

    // Oct 27: Pediatrics, ENT, Ophthalmology
    assert.equal(sprintDateForIndex(16, examDate), '2026-10-27');
    assert.deepEqual(SPRINT_DAYS[16].subjects, ['pediatrics', 'ent', 'ophthalmology']);

    // Oct 28–29: Timed mixed recall and mock review
    assert.equal(sprintDateForIndex(17, examDate), '2026-10-28');
    assert.ok(SPRINT_DAYS[17].fullMock, 'Oct 28 must be full mock simulation day');
    assert.equal(SPRINT_DAYS[17].questions, 300);
    assert.equal(sprintDateForIndex(18, examDate), '2026-10-29');
    assert.ok(SPRINT_DAYS[18].checkpoint);

    // Oct 30: Light revision, volatile facts, image review and rest
    assert.equal(sprintDateForIndex(19, examDate), '2026-10-30');
    assert.ok(SPRINT_DAYS[19].restDay);
  });

  it('respects custom configured examDate without date shifting', () => {
    const customExam = '2026-12-15';
    const day19Date = sprintDateForIndex(19, customExam);
    assert.equal(day19Date, '2026-12-14', 'Day 19 eve must be exactly 1 day before custom exam');
    const day0Date = sprintDateForIndex(0, customExam);
    assert.equal(day0Date, '2026-11-25', 'Day 0 must be exactly 20 days before custom exam');
  });

  it('records incorrect answers and lucky guesses into error notebook without duplication', async () => {
    const { recordMcqAttempt } = await import('../performanceEngine');
    const baseState: any = {
      settings: { examDate: '2026-10-31' },
      mcqAttempts: [],
      studyLogs: {},
      topicsState: {},
      errorNotebook: [],
    };

    // 1. Incorrect attempt should enter Error Vault
    const res1 = recordMcqAttempt(baseState, {
      questionId: 'q-test-1',
      source: 'qbank',
      subjectId: 'obg',
      topicId: 'obg-1',
      topicName: 'Eclampsia',
      selectedAnswer: 'B',
      correctAnswer: 'A',
      isCorrect: false,
      confidence: 'medium',
      timeTakenSeconds: 30,
    });
    assert.equal(res1.updatedState.errorNotebook.length, 1);
    assert.equal(res1.updatedState.errorNotebook[0].id, 'err-q-test-1');
    assert.ok(res1.updatedState.errorNotebook[0].myMistake.includes('Selected option B'));

    // 2. Repeat incorrect attempt should update existing card rather than duplicate
    const res2 = recordMcqAttempt(res1.updatedState, {
      questionId: 'q-test-1',
      source: 'qbank',
      subjectId: 'obg',
      topicId: 'obg-1',
      topicName: 'Eclampsia',
      selectedAnswer: 'C',
      correctAnswer: 'A',
      isCorrect: false,
      confidence: 'low',
      timeTakenSeconds: 25,
    });
    assert.equal(res2.updatedState.errorNotebook.length, 1, 'Must not duplicate error card for same question');
    assert.ok(res2.updatedState.errorNotebook[0].myMistake.includes('Selected option C'));

    // 3. Correct answer with confidence 'guess' must enter Error Vault
    const res3 = recordMcqAttempt(res2.updatedState, {
      questionId: 'q-test-2',
      source: 'qbank',
      subjectId: 'psm',
      topicId: 'psm-1',
      topicName: 'Vaccines',
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      confidence: 'guess',
      timeTakenSeconds: 15,
    });
    assert.equal(res3.updatedState.errorNotebook.length, 2, 'Lucky guess must enter error notebook for SRS review');
    const guessCard = res3.updatedState.errorNotebook.find((c: any) => c.id === 'err-q-test-2');
    assert.ok(guessCard, 'Guess card must be present');
    assert.ok(guessCard.myMistake.includes('guessing'), 'Mistake label should indicate guess/fragile recall');

    // 4. Confident correct answer must NOT enter Error Vault
    const res4 = recordMcqAttempt(res3.updatedState, {
      questionId: 'q-test-3',
      source: 'qbank',
      subjectId: 'anatomy',
      topicId: 'anat-1',
      topicName: 'Brachial Plexus',
      selectedAnswer: 'D',
      correctAnswer: 'D',
      isCorrect: true,
      confidence: 'high',
      timeTakenSeconds: 20,
    });
    assert.equal(res4.updatedState.errorNotebook.length, 2, 'Confident correct answer must not enter error notebook');
  });

  it('preserves guest study progress and completed tasks across simulated reload', async () => {
    const { resolveCloudConflict } = await import('../cloudSync');
    const { getInitialAppState } = await import('../../data/sampleData');

    // 1. User completes a study task and an MCQ attempt
    const initial = getInitialAppState();
    initial.dailyTasks = [
      { id: 'task-obg-1', title: 'Revise Preeclampsia protocol', completed: true, durationMinutes: 45, priority: 'high', type: 'revision' }
    ];
    initial.mcqAttempts = [
      {
        id: 'att-1',
        questionId: 'q-obg-1',
        subjectId: 'obg',
        topicId: 'obg-1',
        isCorrect: true,
        selectedAnswer: 'B',
        correctAnswer: 'B',
        confidence: 'guess',
        source: 'qbank',
        timeTakenSeconds: 30,
        attemptNumber: 1,
        timestamp: new Date().toISOString(),
      }
    ];
    initial.errorNotebook = [
      {
        id: 'err-q-obg-1',
        subjectId: 'obg',
        topicId: 'obg-1',
        topic: 'Preeclampsia',
        questionGist: 'First-line drug for severe hypertension in pregnancy',
        myMistake: 'Lucky guess; fragile recall requires review',
        correctConcept: 'Labetalol / Hydralazine / Nifedipine',
        isReviewed: false,
        dateAdded: '2026-10-14',
      }
    ];

    // 2. Simulate local storage JSON serialization & deserialization (as happens across page refresh)
    const serialized = JSON.stringify(initial);
    const rehydrated = JSON.parse(serialized);

    assert.equal(rehydrated.dailyTasks.length, 1);
    assert.equal(rehydrated.dailyTasks[0].completed, true);
    assert.equal(rehydrated.mcqAttempts.length, 1);
    assert.equal(rehydrated.errorNotebook.length, 1);
    assert.equal(rehydrated.errorNotebook[0].id, 'err-q-obg-1');

    // 3. Verify resolveCloudConflict does not overwrite newer local tasks when reconciling with empty or stale cloud state
    const staleCloudState = getInitialAppState();
    const resolved = resolveCloudConflict(rehydrated, staleCloudState);

    assert.equal(resolved.dailyTasks.length, 1, 'Local completed daily task must survive reconciliation');
    assert.equal(resolved.dailyTasks[0].completed, true);
    assert.equal(resolved.mcqAttempts.length, 1, 'Local MCQ attempt must survive reconciliation');
    assert.equal(resolved.errorNotebook.length, 1, 'Error notebook item must survive reconciliation');
  });

  it('validates Daily Study Blueprint dataset completeness and subject sequence', async () => {
    const { SPRINT_STUDY_BLUEPRINTS, getDailyStudyBlueprint } = await import(
      '../../data/sprintStudyBlueprints'
    );
    const { VISUAL_CONCEPT_REGISTRY } = await import('../visualQuestionEngine');

    // 1. Must cover all 20 sprint days + Day 20 (Exam Day)
    assert.equal(
      SPRINT_STUDY_BLUEPRINTS.length,
      21,
      'Must contain exactly 21 blueprints (Days 0-19 sprint + Day 20 exam day)'
    );

    // 2. Test getDailyStudyBlueprint retrieval and fallback
    for (let i = 0; i < 21; i++) {
      const bp = getDailyStudyBlueprint(i);
      assert.ok(bp, `Blueprint for day ${i} must exist`);
      assert.equal(bp.dayIndex, i);
      assert.ok(bp.title.length > 5, 'Title must be descriptive');
      assert.ok(bp.missionStatement.length > 10, 'Mission statement must be actionable');
      assert.ok(bp.activeRecallGuidance.length > 10, 'Active recall guidance required');
      assert.ok(bp.questionPracticeGuidance.length > 10, 'Question practice guidance required');
      assert.ok(bp.errorRemediationGuidance.length > 10, 'Error remediation guidance required');
      assert.ok(bp.revisionGuidance.length > 10, 'Revision guidance required');
    }

    // Fallback for out of range
    const bpNegative = getDailyStudyBlueprint(-1);
    assert.equal(bpNegative.dayIndex, 0, 'Negative day index falls back to Day 0');
    const bpOverflow = getDailyStudyBlueprint(99);
    assert.equal(bpOverflow.dayIndex, 20, 'Overflow day index falls back to last blueprint (Day 20)');

    // 3. Verify all topics in blueprints correspond to real subjects and topics in FMGE_SUBJECTS
    const validSubjectIds = new Set(FMGE_SUBJECTS.map((s) => s.id));
    const validTopicIds = new Set<string>();
    for (const sub of FMGE_SUBJECTS) {
      for (const t of sub.topics) {
        validTopicIds.add(t.id);
      }
    }

    let totalMustStudy = 0;
    let totalIfTimeRemains = 0;

    for (const bp of SPRINT_STUDY_BLUEPRINTS) {
      for (const subId of bp.subjects) {
        assert.ok(validSubjectIds.has(subId), `Subject ${subId} in blueprint must exist in FMGE_SUBJECTS`);
      }

      for (const topic of bp.mustStudyTopics) {
        totalMustStudy++;
        assert.ok(
          validTopicIds.has(topic.id),
          `Topic ${topic.id} (${topic.name}) must exist in FMGE_SUBJECTS`
        );
        assert.ok(validSubjectIds.has(topic.subjectId), `Subject ${topic.subjectId} must exist`);
        assert.ok(topic.coreConcepts.length >= 2, `${topic.id} must have at least 2 core clinical concepts`);
        assert.equal(topic.priority, 'must_study');

        if (topic.visualConceptKey) {
          assert.ok(
            VISUAL_CONCEPT_REGISTRY[topic.visualConceptKey],
            `Visual concept key ${topic.visualConceptKey} must exist in VISUAL_CONCEPT_REGISTRY`
          );
        }
      }

      for (const topic of bp.ifTimeRemainsTopics) {
        totalIfTimeRemains++;
        assert.ok(
          validTopicIds.has(topic.id),
          `If-time topic ${topic.id} must exist in FMGE_SUBJECTS`
        );
        assert.equal(topic.priority, 'if_time_remains');
        if (topic.visualConceptKey) {
          assert.ok(
            VISUAL_CONCEPT_REGISTRY[topic.visualConceptKey],
            `Visual concept key ${topic.visualConceptKey} must exist in VISUAL_CONCEPT_REGISTRY`
          );
        }
      }
    }

    assert.ok(totalMustStudy >= 40, 'Must have at least 40 must-study topics across the sprint');
    assert.ok(totalIfTimeRemains >= 15, 'Must have secondary high-yield edge topics');

    // 4. Verify exact emergency study schedule subject alignments (Days 3 to 19):
    // Oct 14–15 (Days 3-4): OBG
    assert.deepEqual(getDailyStudyBlueprint(3).subjects, ['obg']);
    assert.deepEqual(getDailyStudyBlueprint(4).subjects, ['obg']);

    // Oct 16–17 (Days 5-6): PSM
    assert.deepEqual(getDailyStudyBlueprint(5).subjects, ['psm']);
    assert.deepEqual(getDailyStudyBlueprint(6).subjects, ['psm']);

    // Oct 18 (Day 7): Biochem + FMT
    assert.deepEqual(getDailyStudyBlueprint(7).subjects, ['biochemistry', 'fmt']);

    // Oct 19 (Day 8): Anatomy
    assert.deepEqual(getDailyStudyBlueprint(8).subjects, ['anatomy']);

    // Oct 20 (Day 9): Microbiology
    assert.deepEqual(getDailyStudyBlueprint(9).subjects, ['microbiology']);

    // Oct 21 (Day 10): Pharmacology
    assert.deepEqual(getDailyStudyBlueprint(10).subjects, ['pharmacology']);

    // Oct 22 (Day 11): Pathology + core Physiology
    assert.deepEqual(getDailyStudyBlueprint(11).subjects, ['pathology', 'physiology']);

    // Oct 23–24 (Days 12-13): General Surgery + Orthopedics
    assert.deepEqual(getDailyStudyBlueprint(12).subjects, ['surgery', 'orthopedics']);
    assert.deepEqual(getDailyStudyBlueprint(13).subjects, ['surgery', 'orthopedics']);

    // Oct 25–26 (Days 14-15): Selective Medicine + short subjects
    assert.deepEqual(getDailyStudyBlueprint(14).subjects, ['medicine', 'dermatology', 'psychiatry']);
    assert.deepEqual(getDailyStudyBlueprint(15).subjects, ['medicine', 'radiology', 'anesthesia']);

    // Oct 27 (Day 16): Pediatrics, ENT, Ophthalmology
    assert.deepEqual(getDailyStudyBlueprint(16).subjects, ['pediatrics', 'ent', 'ophthalmology']);

    // Oct 28–29 (Days 17-18): Grand Tests / Mixed Timed Recall
    assert.equal(getDailyStudyBlueprint(17).isFullMock, true);
    assert.equal(getDailyStudyBlueprint(18).targetQuestions, 100);

    // Oct 30 (Day 19): Rest & Volatile Facts Eve
    assert.equal(getDailyStudyBlueprint(19).isRestDay, true);

    // Oct 31 (Day 20): Official Exam Day Protocol
    assert.equal(getDailyStudyBlueprint(20).isExamDay, true);
  });

  it('guarantees generateMixed10Quiz produces 10 questions with 0 duplicate stems, shuffled options, and no cross-topic mismatches', () => {
    const questions = generateMixed10Quiz('obg', 'Obstetrics & Gynecology', 'Cervical Cancer Screening & FIGO Staging');
    assert.equal(questions.length, 10, 'Must generate exactly 10 questions (5 text + 5 image)');

    // 1. Verify 5 text and 5 image questions
    const textQuestions = questions.filter((q) => q.type === 'text');
    const imgQuestions = questions.filter((q) => q.type === 'image');
    assert.equal(textQuestions.length, 5, 'Must have exactly 5 text questions');
    assert.equal(imgQuestions.length, 5, 'Must have exactly 5 image questions');

    // 2. Verify all stems are unique (NO DUPLICATE QUESTIONS)
    const stems = questions.map((q) => q.stem.trim());
    const uniqueStems = new Set(stems);
    assert.equal(uniqueStems.size, 10, 'All 10 questions must have completely unique stems');

    // 3. Verify options are shuffled (not all option A)
    const correctOptions = questions.map((q) => q.correctOptionId);
    const uniqueCorrect = new Set(correctOptions);
    assert.ok(uniqueCorrect.size > 1, 'Correct options must be shuffled across multiple letters, not always A');

    // 4. Verify no cross-topic leak (Cervical Cancer quiz must NOT return Eclampsia / Pritchard regimen as correct answer)
    for (const q of textQuestions) {
      const correctOpt = q.options.find((o) => o.id === q.correctOptionId);
      assert.ok(correctOpt, 'Each question must have a valid correct option');
      assert.ok(
        !correctOpt.text.toLowerCase().includes('pritchard') &&
        !correctOpt.text.toLowerCase().includes('knee jerk') &&
        !correctOpt.text.toLowerCase().includes('loading 4g iv'),
        `Cervical cancer text question must never return eclampsia Pritchard regimen! Found: ${correctOpt.text}`
      );
    }

    // 5. Verify clean grammar: NO "presents with Presents to" and NO double periods ".."
    for (const q of questions) {
      assert.ok(!q.stem.includes('presents with Presents'), 'Question stem must not contain duplicate presents with Presents');
      assert.ok(!q.stem.includes('..'), 'Question stem must not contain double periods ..');
    }

    // 6. Verify image questions have valid URLs and smart stems
    for (const q of imgQuestions) {
      assert.ok(q.imageUrl, 'Image question must have an imageUrl');
      assert.ok(q.options.length === 4, 'Image question must have 4 options');
      // For instruments, distractors must not be generic non-instrument placeholders
      if (q.stem.includes('surgical instrument')) {
        for (const opt of q.options) {
          assert.ok(
            !opt.text.includes('Benign architectural variant') &&
            !opt.text.includes('Non-specific artifactual radiographic shadow'),
            `Instrument options must not contain generic dummy text: ${opt.text}`
          );
        }
      }
    }
  });
});
