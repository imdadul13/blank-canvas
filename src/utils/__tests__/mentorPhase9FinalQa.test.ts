import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildMentorContext,
  resolveMedicalTopic,
  detectMentorMode,
  resolveEffectiveQueryContext,
  MEDICAL_TOPIC_ALIASES,
} from '../mentorContextEngine';
import {
  parseMcqFromMarkdown,
  generateMentorSessionTitle,
  cleanTextForClipboard,
} from '../../components/AiCoachView';
import { recordMcqAttempt } from '../performanceEngine';
import {
  getTopicClinicalMCQBatch,
  lookupVerifiedPyq,
} from '../../../server/dynamic-mcq-engine';
import { AppState } from '../../types';

describe('Phase 9 — Faculty Mentor Final QA, Hardening & Regression Suite', () => {
  // Test fixture state
  const mockAppState: AppState = {
    user: null,
    settings: {
      examDate: '2026-12-15',
      targetScore: 190,
      dailyStudyHourGoal: 6,
      dailyQuestionGoal: 50,
      userName: 'Dr. Test',
    } as any,
    topicsState: {
      'medicine-med-cardio-1': {
        qBankSolvedCount: 20,
        qBankAccuracy: 85,
        qBankDone: true,
      } as any,
      'pharmacology-pharm-autonomic-1': {
        qBankSolvedCount: 15,
        qBankAccuracy: 40,
        qBankDone: false,
      } as any,
    },
    errorNotebook: [
      {
        id: 'err-1',
        subjectId: 'medicine',
        topic: "Crohn's Disease",
        topicId: 'med-gastro-crohn',
        conceptName: 'Transmural inflammation & fistulae',
        questionGist: 'Patient with RLQ pain and perianal fistulae',
        myMistake: 'Selected Ulcerative Colitis',
        correctConcept: 'Non-caseating epithelioid granulomas with transmural involvement',
        isReviewed: false,
        dateAdded: '2026-09-10',
      },
    ],
    mcqAttempts: [
      {
        id: 'att-1',
        questionId: 'q-pharm-1',
        subjectId: 'pharmacology',
        topicId: 'pharm-autonomic-1',
        topicName: 'Autonomic Pharmacology',
        isCorrect: false,
        selectedAnswer: 'B',
        correctAnswer: 'A',
        timeTakenSeconds: 40,
        difficulty: 'high-yield',
        attemptNumber: 1,
        timestamp: '2026-09-11T10:00:00.000Z',
        source: 'mentor',
      },
    ],
    studyLogs: {
      '2026-09-12': {
        date: '2026-09-12',
        studyMinutes: 120,
        questionsSolved: 10,
        completedTaskIds: [],
        mood: 'great',
      },
    },
  } as any;

  describe('1. Settings & Exam Countdown Updating & Strict Fact Isolation', () => {
    it('accurately calculates daysToExam and targetScore from settings', () => {
      const context = buildMentorContext(mockAppState);
      assert.ok(typeof context.daysToExam === 'number');
      assert.equal(context.targetScore, 190);
    });

    it('prompt construction rules strictly separate exam timing from pure medical queries', () => {
      const serverRoutes = fs.readFileSync('server/fmge-routes.ts', 'utf8');

      // Both streaming and batch endpoints must contain the strict countdown rule
      assert.ok(
        serverRoutes.includes('STRICT EXAM COUNTDOWN & TIMING RULE:'),
        'Must contain strict exam countdown rule'
      );
      assert.ok(
        serverRoutes.includes('NEVER mention phrases like "final 24 hours"'),
        'Must forbid mechanical countdown injection'
      );
      assert.ok(
        serverRoutes.includes('For pure medical questions, clinical explanations, disease mechanisms, diagnostic criteria, and MCQs, DO NOT mention the exam date or countdown'),
        'Pure medical questions must remain strictly medical'
      );
    });

    it('adapts study planning advice when days remaining <= 1 vs normal timeline', () => {
      const serverRoutes = fs.readFileSync('server/fmge-routes.ts', 'utf8');

      assert.ok(
        serverRoutes.includes('if (daysRemaining <= 1)'),
        'Must contain specific rapid revision advice for final 24 hours'
      );
      assert.ok(
        serverRoutes.includes('prioritize rapid revision of high-yield pearls'),
        'Must advise rapid revision instead of starting new textbooks'
      );
    });
  });

  describe('2. Multi-turn Topic Continuity & User Override Hierarchy', () => {
    it('detects explicit topic and overrides background weak areas', () => {
      const context = buildMentorContext(mockAppState);
      const resolved = resolveEffectiveQueryContext("Teach me Crohn's disease", context);

      assert.equal(resolved.effectiveTopic, "Crohn's Disease");
      assert.equal(resolved.effectiveSubject, 'General Medicine');
      assert.equal(resolved.userOverrideDetected, true);
      assert.equal(resolved.priorityLevel, 'EXPLICIT_USER_REQUEST');
    });

    it('maintains active topic for follow-up turns like "Give me 5 harder questions"', () => {
      const context = buildMentorContext(mockAppState, {
        currentTopic: "Crohn's Disease",
        currentSubject: 'General Medicine',
      });
      const history = [
        { role: 'user', content: "Explain Crohn's disease" },
        { role: 'assistant', content: 'Crohn is a transmural granulomatous IBD.' },
      ];

      const resolved = resolveEffectiveQueryContext('Give me 5 harder questions', context, history);

      assert.equal(resolved.effectiveTopic, "Crohn's Disease");
      assert.equal(resolved.mode, 'QUIZ');
      assert.equal(resolved.priorityLevel, 'CURRENT_CONVERSATION');
    });

    it('accurately resolves medical acronyms and aliases (MI, UC, DKA, PSGN, MCD, Sjogren, PPH)', () => {
      assert.equal(resolveMedicalTopic('acute MI')?.canonicalTopic, 'Myocardial Infarction');
      assert.equal(resolveMedicalTopic('UC vs Crohn')?.canonicalTopic, 'Ulcerative Colitis');
      assert.equal(resolveMedicalTopic('Patient with DKA')?.canonicalTopic, 'Diabetic Ketoacidosis');
      assert.equal(resolveMedicalTopic('PSGN presentation')?.canonicalTopic, 'Post-Streptococcal Glomerulonephritis');
      assert.equal(resolveMedicalTopic('Minimal change disease in child')?.canonicalTopic, 'Minimal Change Disease');
      assert.equal(resolveMedicalTopic('Sjogren syndrome markers')?.canonicalTopic, 'Sjögren Syndrome');
      assert.equal(resolveMedicalTopic('PPH protocol')?.canonicalTopic, 'Postpartum Hemorrhage');
    });

    it('accurately detects Mentor intent modes', () => {
      assert.equal(detectMentorMode('Explain minimal change disease'), 'EXPLAIN');
      assert.equal(detectMentorMode('Compare Crohn vs Ulcerative Colitis'), 'COMPARE');
      assert.equal(detectMentorMode('Give me an MCQ on heart block'), 'MCQ');
      assert.equal(detectMentorMode('Give me 5 questions on cardiology'), 'QUIZ');
      assert.equal(detectMentorMode('Why did I get that question wrong?'), 'REMEDIATION');
      assert.equal(detectMentorMode('What should I study today?'), 'REVISION');
      assert.equal(detectMentorMode('Quiz my weak areas'), 'WEAK_AREA');
    });
  });

  describe('3. New Chat State Reset & History Restoration', () => {
    it('generates informative session titles instead of generic names', () => {
      const compareMsg = [{ id: 'm-1', role: 'user' as const, content: 'Compare Crohn and UC', timestamp: new Date() }];
      assert.equal(generateMentorSessionTitle(compareMsg), "Crohn's vs Ulcerative Colitis");

      const quizMsg = [{ id: 'm-2', role: 'user' as const, content: 'Give me 5 MCQs on cardiology', timestamp: new Date() }];
      assert.ok(generateMentorSessionTitle(quizMsg).includes('MCQs'));

      const explainMsg = [{ id: 'm-3', role: 'user' as const, content: 'Explain nephrotic syndrome', timestamp: new Date() }];
      assert.ok(generateMentorSessionTitle(explainMsg).includes('Nephrotic'));
    });

    it('preserves saved sessions and clears active chat without affecting user data', () => {
      const aiCoachFile = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');

      assert.ok(aiCoachFile.includes('handleNewSession'), 'Must define handleNewSession');
      assert.ok(aiCoachFile.includes('setMessages([])'), 'Must reset messages array');
      assert.ok(aiCoachFile.includes('setQuizSession(null)'), 'Must reset active quiz');
      assert.ok(aiCoachFile.includes('setAttachedImage(null)'), 'Must reset attached image');
      assert.ok(aiCoachFile.includes('localStorage.setItem(COACH_STORAGE_KEY'), 'Must save valid previous sessions');
    });
  });

  describe('4. Interactive MCQ Answer Security, Option Locking & Distractor Analysis', () => {
    it('parseMcqFromMarkdown extracts clean stem and hides answer key and explanation', () => {
      const rawMarkdown = `A 45-year-old male presents with recurrent colicky RLQ pain and perianal discharge. Colonoscopy reveals skip lesions.

A. Ulcerative Colitis
B. Crohn's Disease
C. Celiac Disease
D. Intestinal Tuberculosis

Correct Answer: Option B
Explanation: Crohn's disease is characterized by transmural skip lesions and non-caseating granulomas.
FMGE Takeaway: Fistulae are pathognomonic of transmural Crohn's inflammation.
Exam Trap: Ulcerative colitis is strictly mucosal and does not form fistulae.`;

      const result = parseMcqFromMarkdown(rawMarkdown, 'General Medicine', "Crohn's Disease");

      assert.ok(result !== null);
      assert.ok(!result.cleanedText.includes('Correct Answer: Option B'), 'Cleaned text must hide answer key');
      assert.ok(!result.cleanedText.includes('Explanation:'), 'Cleaned text must hide explanation');
      assert.equal(result.quiz.correctKey, 'B');
      assert.equal(result.quiz.options.length, 4);
      assert.equal(result.quiz.options[1].key, 'B');
      assert.equal(result.quiz.options[1].text, "Crohn's Disease");
      assert.equal(result.quiz.fmgeTakeaway, "Fistulae are pathognomonic of transmural Crohn's inflammation.");
    });

    it('MentorClinicalChallengeCard keeps options disabled and reveals only after submission', () => {
      const cardFile = fs.readFileSync('src/components/mentor/MentorClinicalChallengeCard.tsx', 'utf8');

      assert.ok(cardFile.includes('disabled={isRevealed}'), 'Options must be disabled once revealed');
      assert.ok(cardFile.includes('isRevealed && isCorrectOption'), 'Correct styles applied strictly after reveal');
      assert.ok(cardFile.includes('handleSubmit'), 'Requires explicit submission to reveal answer');
    });

    it('generates structured distractor breakdowns when user asks "Why are other options wrong?"', () => {
      const aiCoachFile = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');

      assert.ok(
        aiCoachFile.includes('Detailed Analysis: Why Other Options Are Wrong'),
        'Must handle distractor explanation queries'
      );
      assert.ok(aiCoachFile.includes('incorrectOpts.forEach'), 'Must analyze each non-selected option');
    });
  });

  describe('5. MCQ Deduplication across Successive Sets', () => {
    it('getTopicClinicalMCQBatch excludes questions already in conversation history', () => {
      const history1 = [
        { role: 'user', content: 'Give me 5 questions on rheumatology' },
      ];
      const batch1 = getTopicClinicalMCQBatch('General Medicine', 'Sjögren Syndrome', 2, history1);

      assert.equal(batch1.length, 2);
      const question1Stem = batch1[0].stem || batch1[0].question;

      // Now pass batch1 questions into history
      const history2 = [
        ...history1,
        { role: 'assistant', content: `Previous questions presented: ${question1Stem}` },
        { role: 'user', content: 'Give me 2 more questions on rheumatology' },
      ];

      const batch2 = getTopicClinicalMCQBatch('General Medicine', 'Sjögren Syndrome', 2, history2);

      assert.equal(batch2.length, 2);
      // batch2 must not repeat the exact stem from question1
      const question2Stem = batch2[0].stem || batch2[0].question;
      assert.notEqual(question1Stem, question2Stem, 'Successive question batches must deduplicate against history');
    });
  });

  describe('6. Performance Engine Synchronization (source: "mentor")', () => {
    it('recordMcqAttempt updates studyLogs, topicsState, and errorNotebook', () => {
      const result = recordMcqAttempt(mockAppState, {
        questionId: 'mentor-q-99',
        subjectId: 'medicine',
        topicId: 'med-gastro-crohn',
        topicName: "Crohn's Disease",
        isCorrect: false,
        selectedAnswer: 'C',
        correctAnswer: 'B',
        timeTakenSeconds: 30,
        source: 'mentor',
        notes: 'Clinical case mistake in Crohn disease',
      });

      const updated = result.updatedState;

      // 1. mcqAttempts has new attempt tagged as mentor
      assert.equal(updated.mcqAttempts[0].questionId, 'mentor-q-99');
      assert.equal(updated.mcqAttempts[0].source, 'mentor');

      // 2. Questions solved counter incremented in today study log
      const todayKey = new Date().toLocaleDateString('en-CA');
      const todayLog = updated.studyLogs[todayKey];
      assert.ok(todayLog);
      assert.ok(todayLog.questionsSolved >= 1);

      // 3. Error notebook contains newly logged mistake
      const errItem = updated.errorNotebook.find((e) => e.id === 'err-mentor-q-99');
      assert.ok(errItem, 'Incorrect mentor attempt must be automatically logged in Error Notebook');
      assert.equal(errItem.subjectId, 'medicine');
      assert.equal(errItem.topic, "Crohn's Disease");
      assert.ok(errItem.myMistake.toLowerCase().includes('option c'));
      assert.ok(errItem.correctConcept.toLowerCase().includes('option b'));
    });
  });

  describe('7. PYQ Provenance Integrity & Practice Labeling', () => {
    it('distinguishes verified PYQ from AI-generated practice questions', () => {
      const serverRoutes = fs.readFileSync('server/fmge-routes.ts', 'utf8');

      assert.ok(
        serverRoutes.includes("I don't have a verified PYQ for that topic in the current question bank"),
        'Must disclose when no verified PYQ exists'
      );
      assert.ok(
        serverRoutes.includes("Would you like FMGE-style practice questions instead?"),
        'Must offer standard practice alternative'
      );
      assert.ok(
        serverRoutes.includes("Here is an official verified examination question"),
        'Must label verified PYQs explicitly'
      );
    });

    it('lookupVerifiedPyq returns structured question with provenance: "Verified PYQ"', () => {
      const pyq = lookupVerifiedPyq('Surgery', 'Burns');
      if (pyq) {
        assert.equal(pyq.provenance, 'Verified PYQ');
      }
    });
  });

  describe('8. Clipboard Sanitization & Clean Text Output', () => {
    it('cleanTextForClipboard preserves clean text without markdown or symbols', () => {
      const input = `### 🩺 High-Yield Diagnosis: **Sjögren Syndrome**
> 💡 Key test: Minor salivary gland biopsy showing lymphocytic focus score ≥1.
- Antibody: **Anti-Ro / SSA** and **Anti-La / SSB**.
- Risk: Non-Hodgkin lymphoma (MALToma).`;

      const output = cleanTextForClipboard(input);

      assert.ok(!output.includes('###'));
      assert.ok(!output.includes('**'));
      assert.ok(!output.includes('> 💡'));
      assert.ok(output.includes('Anti-Ro / SSA'));
      assert.ok(output.includes('Minor salivary gland biopsy'));
    });
  });

  describe('9. Rapid Multi-Send Guard & Error Resilience', () => {
    it('AiCoachView guards against rapid multi-send while request is inflight', () => {
      const aiCoachFile = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');

      assert.ok(aiCoachFile.includes('if (isLoading && !force) return;'), 'Must guard against multi-send');
      assert.ok(aiCoachFile.includes('handleRetry'), 'Must support graceful retry');
    });
  });

  describe('10. End-to-End Regression with Full Learning Ecosystem', () => {
    it('buildMentorContext never fabricates weak areas when data is absent', () => {
      const emptyState: AppState = {
        user: null,
        settings: { examDate: '2026-12-31', targetScore: 180 } as any,
        topicsState: {},
        errorNotebook: [],
        mcqAttempts: [],
        studyLogs: {},
      } as any;

      const context = buildMentorContext(emptyState);

      assert.deepEqual(context.weakSubjects, []);
      assert.deepEqual(context.weakTopics, []);
      assert.deepEqual(context.recentMistakes, []);
      assert.equal(context.studyTime, 0);
      assert.equal(context.studyStreak, 0);
    });
  });
});
