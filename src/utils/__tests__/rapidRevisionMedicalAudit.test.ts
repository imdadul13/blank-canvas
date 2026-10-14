import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMedicalTopicKnowledge, FMGE_TOPIC_KNOWLEDGE_BASE } from '../topicKnowledgeBase';
import { VERIFIED_TOPIC_CLINICAL_CASES, generateTopicClinicalCasesDeck } from '../clinicalCaseEngine';
import { VERIFIED_TOPIC_FLASHCARDS, generateFlashcardDeck } from '../flashcardEngine';
import { getVerifiedTopicQuestions } from '../practiceSessionEngine';
import { determineMasteryStatus, countRepeatedErrors } from '../performanceEngine';
import { McqAttempt } from '../../types';

describe('Rapid Revision Quality Upgrade — Medical Content Audit & Topic Mastery', () => {
  describe('1. Epilepsy & Seizures Pack (med-10) Clinical Rigor', () => {
    it('provides accurate high-yield knowledge for med-10 with ILAE classification and SE protocol', () => {
      const knowledge = getMedicalTopicKnowledge('medicine', 'med-10', 'Neurology - Epilepsy & Seizures');
      assert.ok(knowledge, 'Knowledge must exist for med-10');

      // Check ILAE 2017 distinction in core concepts and high yield summary
      const fullText = [
        knowledge.highYieldSummary,
        ...(knowledge.coreConcepts || []),
        ...(knowledge.keyTakeaways || []),
        knowledge.examTrap,
      ].join(' ');

      assert.match(
        fullText,
        /ILAE|Focal|Generalized/i,
        'Must cite ILAE 2017/2022 classification distinction'
      );

      // Check JME female treatment caveats
      assert.match(
        knowledge.firstLineTreatment || '',
        /Levetiracetam|Lamotrigine/i,
        'Must recommend Levetiracetam or Lamotrigine for females of childbearing potential'
      );
      assert.match(
        fullText,
        /Valproate|teratogen|spina bifida/i,
        'Must highlight Valproate teratogenicity in females of childbearing potential'
      );
      assert.match(
        fullText,
        /Carbamazepine|Phenytoin|aggravate|contraindicated/i,
        'Must highlight that sodium channel blockers aggravate myoclonus'
      );

      // Check Status Epilepticus Protocol
      assert.match(
        fullText,
        /Lorazepam|Midazolam/i,
        'Phase 1 SE must include Lorazepam or Midazolam'
      );
      assert.match(
        fullText,
        /ESETT|Levetiracetam|Fosphenytoin/i,
        'Phase 2 SE must include non-sedating ASMs per ESETT'
      );
    });

    it('contains verified clinical cases for med-10 with 16yo female JME and Status Epilepticus', () => {
      const deck = generateTopicClinicalCasesDeck('medicine', 'med-10', 'Epilepsy');
      assert.ok(deck.cases.length >= 2, 'Should have at least 2 verified cases for med-10');

      // Case 1: 16yo female with morning myoclonic jerks (JME)
      const jmeCase = deck.cases.find(
        (c) => c.presentation.includes('16-year-old') || c.presentation.includes('morning')
      );
      assert.ok(jmeCase, '16yo female JME case must be present');
      assert.ok(
        jmeCase.clinicalExplanation.toLowerCase().includes('teratogen') ||
          jmeCase.clinicalExplanation.toLowerCase().includes('childbearing'),
        'JME rationale must explicitly discuss teratogenicity and childbearing age caveats'
      );
      assert.ok(
        jmeCase.clinicalExplanation.includes('Carbamazepine') || jmeCase.clinicalExplanation.includes('Phenytoin'),
        'JME rationale must warn against sodium channel blockers aggravating myoclonus'
      );

      // Case 2: Status Epilepticus emergency protocol
      const seCase = deck.cases.find(
        (c) =>
          c.title.toLowerCase().includes('status epilepticus') ||
          c.presentation.toLowerCase().includes('status epilepticus')
      );
      assert.ok(seCase, 'Status epilepticus emergency case must be present');
      assert.ok(
        seCase.clinicalExplanation.includes('Lorazepam') || seCase.clinicalExplanation.includes('ESETT'),
        'SE rationale must specify initial benzodiazepine or ESETT non-sedating ASMs'
      );
    });

    it('generates verified active recall flashcards for med-10 with clinical pearls', () => {
      const deck = generateFlashcardDeck('medicine', 'med-10', 'Epilepsy & Seizures');
      assert.ok(deck.cards.length >= 5, 'Should generate at least 5 verified flashcards');

      const femaleJmeCard = deck.cards.find(
        (c) =>
          c.front.toLowerCase().includes('16-year-old') ||
          c.front.toLowerCase().includes('female')
      );
      assert.ok(femaleJmeCard, '16yo female JME flashcard must exist');
      assert.ok(
        femaleJmeCard.back.includes('Levetiracetam') || femaleJmeCard.back.includes('Lamotrigine'),
        '16yo female JME card back must specify safe options for females of childbearing potential'
      );

      const seCard = deck.cards.find((c) => c.front.toLowerCase().includes('status epilepticus'));
      assert.ok(seCard, 'Status epilepticus flashcard must exist');
      assert.ok(
        seCard.back.includes('Lorazepam') || seCard.back.includes('Levetiracetam'),
        'SE card must outline stepwise management'
      );
    });
  });

  describe('2. Antiepileptic Pharmacology Pack (pharm-5) Clinical Rigor', () => {
    it('provides accurate high-yield pharmacology knowledge for pharm-5', () => {
      const knowledge = getMedicalTopicKnowledge('pharmacology', 'pharm-5', 'Antiepileptics');
      assert.ok(knowledge, 'Knowledge must exist for pharm-5');

      const fullText = [
        knowledge.highYieldSummary,
        ...(knowledge.coreConcepts || []),
        ...(knowledge.keyTakeaways || []),
        knowledge.examTrap,
      ].join(' ');

      assert.match(
        fullText,
        /Valproate|neural tube|spina bifida/i,
        'Pharm-5 must state Valproate teratogenicity (neural tube defects)'
      );
      assert.match(
        fullText,
        /Carbamazepine|Phenytoin/i,
        'Pharm-5 must warn that sodium channel blockers worsen absence and myoclonic seizures'
      );
      assert.match(
        fullText,
        /HLA-B\*1502|Stevens-Johnson|Ethosuximide/i,
        'Pharm-5 must include HLA-B*1502 or Ethosuximide for absence'
      );
    });

    it('generates verified questions for pharm-5 without hallucination', () => {
      const questions = getVerifiedTopicQuestions('pharmacology', 'pharm-5', 'Antiepileptics', 10);
      assert.ok(questions.length >= 5, 'Should return verified questions for pharm-5');
      assert.strictEqual(
        questions.every((q) => q.isAiGenerated === false),
        true,
        'All returned questions must be marked verified (not AI generated)'
      );
    });
  });

  describe('3. Objective Performance-Based Mastery Rule Validation', () => {
    it('labels attempts < 5 as unattempted or developing, not mastered', () => {
      // 3 attempts with 100% accuracy — not enough data for mastery!
      const status = determineMasteryStatus(3, 100, 0);
      assert.notStrictEqual(status, 'mastered', 'Cannot award mastery with fewer than 5 attempts');
      assert.strictEqual(status, 'proficient', 'Should be proficient, not mastered');
    });

    it('requires ≥85% accuracy and ≥5 attempts for full mastered status', () => {
      const masteredStatus = determineMasteryStatus(6, 88, 0);
      assert.strictEqual(masteredStatus, 'mastered', '≥5 attempts with ≥85% accuracy and 0 repeat errors is mastered');

      const strugglingStatus = determineMasteryStatus(6, 45, 0);
      assert.strictEqual(strugglingStatus, 'struggling', 'Low accuracy (<50%) is struggling');

      const developingStatus = determineMasteryStatus(6, 68, 0);
      assert.strictEqual(developingStatus, 'developing', 'Moderate accuracy (<70%) is developing');
    });

    it('correctly detects repeated errors across attempts', () => {
      const attempts: McqAttempt[] = [
        {
          id: '1',
          questionId: 'q-jme-1',
          subjectId: 'medicine',
          topicId: 'med-10',
          isCorrect: false,
          selectedAnswer: 'A',
          correctAnswer: 'B',
          source: 'qbank',
          timestamp: new Date().toISOString(),
          timeTakenSeconds: 30,
          attemptNumber: 1,
        },
        {
          id: '2',
          questionId: 'q-jme-1',
          subjectId: 'medicine',
          topicId: 'med-10',
          isCorrect: false,
          selectedAnswer: 'C',
          correctAnswer: 'B',
          source: 'qbank',
          timestamp: new Date().toISOString(),
          timeTakenSeconds: 25,
          attemptNumber: 2,
        },
        {
          id: '3',
          questionId: 'q-se-1',
          subjectId: 'medicine',
          topicId: 'med-10',
          isCorrect: true,
          selectedAnswer: 'A',
          correctAnswer: 'A',
          source: 'qbank',
          timestamp: new Date().toISOString(),
          timeTakenSeconds: 20,
          attemptNumber: 1,
        },
      ];

      const repeats = countRepeatedErrors(attempts);
      assert.strictEqual(repeats, 1, 'Should detect 1 question with repeated mistakes');

      const statusWithRepeats = determineMasteryStatus(5, 80, 2);
      assert.strictEqual(statusWithRepeats, 'struggling', '2 or more repeat errors forces struggling status');
    });
  });
});
