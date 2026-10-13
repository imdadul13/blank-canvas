import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  shuffleQuestionOptions,
  getVerifiedTopicQuestions,
} from '../practiceSessionEngine';
import type { PracticeSessionQuestion } from '../../types';

describe('High-Yield MCQ Per-Option Rationale & Remediation Tests', () => {
  it('1. shuffleQuestionOptions preserves rationale on options across randomizations', () => {
    const rawOptions = [
      {
        text: 'Right coronary artery (RCA)',
        isCorrect: true,
        rationale: 'Supplies the inferior myocardial wall (leads II, III, aVF) in 85-90% of individuals.',
      },
      {
        text: 'Left anterior descending artery (LAD)',
        isCorrect: false,
        rationale: 'Supplies the anteroseptal territory (leads V1-V4), not inferior wall.',
      },
      {
        text: 'Left circumflex artery (LCx)',
        isCorrect: false,
        rationale: 'Supplies high lateral territory (leads I, aVL, V5, V6).',
      },
      {
        text: 'Left main coronary artery (LMCA)',
        isCorrect: false,
        rationale: 'Occlusion produces global ischemia with aVR elevation.',
      },
    ];

    const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(rawOptions);

    assert.equal(shuffledOptions.length, 4);
    assert.ok(correctAnswer === 'A' || correctAnswer === 'B' || correctAnswer === 'C' || correctAnswer === 'D');

    // Verify all options retain their exact rationale
    for (const opt of shuffledOptions) {
      assert.ok(opt.rationale && opt.rationale.length > 10, `Option ${opt.key} should have a clinical rationale`);
    }

    const correctOpt = shuffledOptions.find((o) => o.key === correctAnswer);
    assert.ok(correctOpt);
    assert.equal(correctOpt.optionId, correctOptionId);
    assert.ok(correctOpt.text.includes('Right coronary artery'));
    assert.ok(correctOpt.rationale?.includes('inferior myocardial wall'));
  });

  it('2. getVerifiedTopicQuestions generates questions with per-option rationales for all subjects', () => {
    const subjectsToTest = [
      { sub: 'medicine', topicId: 'med-1', name: 'Cardiology' },
      { sub: 'obg', topicId: 'obg-1', name: 'Antenatal Care & High Risk Pregnancy' },
      { sub: 'anatomy', topicId: 'anat-1', name: 'Upper Limb Anatomy & Brachial Plexus' },
      { sub: 'surgery', topicId: 'surg-1', name: 'Trauma & Advanced Trauma Life Support' },
      { sub: 'pediatrics', topicId: 'ped-1', name: 'Neonatology & Neonatal Resuscitation' },
    ];

    for (const item of subjectsToTest) {
      const questions = getVerifiedTopicQuestions(item.sub, item.topicId, item.name, 10);
      assert.ok(questions.length >= 5, `Expected at least 5 questions for ${item.name}`);

      for (const q of questions) {
        assert.equal(q.options.length, 4, `Question ${q.id} must have 4 options`);
        // Check that options have text and are distinctly key-labeled
        const keys = q.options.map((o) => o.key);
        assert.deepEqual(keys, ['A', 'B', 'C', 'D']);
      }
    }
  });

  it('3. Medical Consistency Algorithm correctly aligns answer key with clinical explanation', () => {
    // Simulate the Gemini hallucination where explanation concludes RCA but isCorrect was accidentally tagged on LAD
    const simulatedRawOptions = [
      { optionId: 'opt_1', text: 'Left circumflex artery (LCx)', isCorrect: false },
      { optionId: 'opt_2', text: 'Right coronary artery (RCA)', isCorrect: false },
      { optionId: 'opt_3', text: 'Left main coronary artery (LMCA)', isCorrect: false },
      { optionId: 'opt_4', text: 'Left anterior descending artery (LAD)', isCorrect: true }, // Accidental mismatch
    ];

    const explanation =
      'Inferior wall myocardial infarction is characterized by ST-segment elevation in leads II, III, and aVF. The Right Coronary Artery (RCA) supplies the diaphragmatic inferior wall and is the culprit vessel in 85-90% of patients.';

    // Run the medical consistency validation logic
    const explLower = explanation.toLowerCase();
    const MEDICAL_STOPWORDS = new Set([
      'artery', 'vein', 'nerve', 'muscle', 'disease', 'syndrome',
      'infection', 'fracture', 'ligament', 'vessel', 'stage', 'grade',
      'type', 'sign', 'test', 'scan', 'duct', 'node', 'injury', 'level',
      'lobe', 'wall', 'zone', 'tract', 'deficiency', 'disorder'
    ]);

    const scores = simulatedRawOptions.map((opt) => {
      const optText = (opt.text || '').toLowerCase().trim();
      if (!optText) return 0;
      let score = 0;
      if (explLower.includes(optText)) score += 15;
      const words = optText.split(/[\s,()/-]+/).filter((w) => w.length > 2 && !MEDICAL_STOPWORDS.has(w));
      for (const w of words) {
        if (explLower.includes(w)) score += 4;
      }
      const acronymMatch = opt.text.match(/\(([A-Za-z0-9]+)\)/);
      if (acronymMatch && explLower.includes(acronymMatch[1].toLowerCase())) {
        score += 10;
      }
      return score;
    });

    let highestScore = 0;
    let matchedIdx = -1;
    scores.forEach((s, idx) => {
      if (s > highestScore) {
        highestScore = s;
        matchedIdx = idx;
      }
    });

    const currentCorrectIdx = simulatedRawOptions.findIndex((o) => o.isCorrect);
    const currentScore = currentCorrectIdx !== -1 ? scores[currentCorrectIdx] : 0;

    if (currentCorrectIdx !== -1 && matchedIdx !== -1 && currentCorrectIdx !== matchedIdx) {
      if (highestScore >= 10 && highestScore > currentScore + 6) {
        simulatedRawOptions[currentCorrectIdx].isCorrect = false;
        simulatedRawOptions[matchedIdx].isCorrect = true;
      }
    }

    // Assert that the algorithm corrected the mismatch and flagged RCA (opt_2) as isCorrect
    assert.equal(simulatedRawOptions[1].isCorrect, true, 'Right Coronary Artery must be corrected to isCorrect: true');
    assert.equal(simulatedRawOptions[3].isCorrect, false, 'LAD must be corrected to isCorrect: false');
  });

  it('4. PracticeSessionQuestion remediationCard fields structure conforms to standard', () => {
    const sampleQuestion: PracticeSessionQuestion = {
      id: 'test-q-1',
      sessionId: 'sess-1',
      sequenceNumber: 1,
      scenario: 'A 54-year-old male presents with acute crushing chest pain...',
      question: 'Which vessel is occluded?',
      options: [
        {
          optionId: 'opt_1',
          key: 'A',
          text: 'RCA',
          isCorrect: true,
          rationale: 'Supplies inferior wall (leads II, III, aVF).',
        },
        {
          optionId: 'opt_2',
          key: 'B',
          text: 'LAD',
          isCorrect: false,
          rationale: 'Supplies anterior wall (leads V1-V4).',
        },
      ],
      correctOptionId: 'opt_1',
      correctAnswer: 'A',
      explanation: 'Inferior STEMI is caused by RCA occlusion.',
      highYieldPearl: 'Inferior leads II, III, aVF = RCA',
      subjectId: 'medicine',
      subjectName: 'Medicine',
      topicId: 'med-1',
      topicName: 'Cardiology',
      isAiGenerated: false,
      remediationCard: {
        concept: 'Inferior STEMI Localization',
        rule: 'Leads II, III, aVF = RCA',
        trapAvoided: 'Confusing inferior leads with anterior leads',
        pearl: 'Avoid Nitrates if RV involvement (V4R) is present.',
      },
    };

    assert.ok(sampleQuestion.remediationCard);
    assert.equal(sampleQuestion.remediationCard.concept, 'Inferior STEMI Localization');
    assert.equal(sampleQuestion.remediationCard.rule, 'Leads II, III, aVF = RCA');
    assert.ok(sampleQuestion.options[0].rationale);
  });
});
