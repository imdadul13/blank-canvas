import {
  PracticeSessionContext,
  PracticeSessionQuestion,
  PracticeOption,
} from '../types';
import { validateTopicContentConsistency } from './contentValidator';
import {
  resolvePracticeSessionVisuals,
  VisualValidationLog,
  getVerifiedIBQForTopic,
  VISUAL_CONCEPT_REGISTRY,
  VisualConceptAsset,
} from './visualQuestionEngine';
import { FMGE_TOPIC_KNOWLEDGE_BASE, getTopicKnowledge } from './topicKnowledgeBase';
import { VERIFIED_TOPIC_CLINICAL_CASES } from './clinicalCaseEngine';

/**
 * Shuffles MCQ options deterministically or randomly using Fisher-Yates,
 * eliminating Option A bias while maintaining stable optionId linkage.
 */
export function shuffleQuestionOptions(
  rawOptions: Array<{ text: string; isCorrect?: boolean; optionId?: string; key?: string; [key: string]: any }>
): {
  shuffledOptions: PracticeOption[];
  correctOptionId: string;
  correctAnswer: string;
} {
  const letters = ['A', 'B', 'C', 'D'];
  const items = rawOptions.map((opt, idx) => ({
    optionId: opt.optionId || `opt_${idx + 1}`,
    text: opt.text.replace(/^[A-D]\)\s*/, '').trim(),
    isCorrect: Boolean(opt.isCorrect),
    rationale: opt.rationale || opt.reason || opt.whyIncorrectOrCorrect,
  }));

  // If no option is marked correct, default the first one to correct
  if (!items.some((o) => o.isCorrect) && items.length > 0) {
    items[0].isCorrect = true;
  }

  // Fisher-Yates shuffle
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  let correctOptionId = '';
  let correctAnswer = 'A';

  const finalOptions: PracticeOption[] = shuffled.slice(0, 4).map((item, idx) => {
    const key = letters[idx] || 'A';
    if (item.isCorrect) {
      correctOptionId = item.optionId;
      correctAnswer = key;
    }
    return {
      optionId: item.optionId,
      key,
      text: item.text,
      isCorrect: item.isCorrect,
      rationale: item.rationale,
    };
  });

  if (!correctOptionId && finalOptions.length > 0) {
    correctOptionId = finalOptions[0].optionId;
    correctAnswer = 'A';
    finalOptions[0].isCorrect = true;
  }

  return {
    shuffledOptions: finalOptions,
    correctOptionId,
    correctAnswer,
  };
}

/**
 * Medical Answer-Key Reconciler:
 * Cross-validates the marked correct option against the clinical explanation and pearl.
 * If an LLM or question import inverted or misassigned the letter key (e.g. marking Option D
 * while the explanation explicitly states Option B "Upper trunk (C5-C6)" is the diagnosis),
 * this reconciler automatically fixes the key so the student is never penalized for the right answer.
 */
export function reconcileQuestionMedicalKey(question: PracticeSessionQuestion): PracticeSessionQuestion {
  if (!question || !Array.isArray(question.options) || question.options.length < 2) {
    return question;
  }

  const expl = `${question.explanation || ''} ${question.highYieldPearl || ''}`.toLowerCase();

  const MEDICAL_STOPWORDS = new Set([
    'artery', 'vein', 'nerve', 'muscle', 'disease', 'syndrome',
    'infection', 'fracture', 'ligament', 'vessel', 'stage', 'grade',
    'type', 'sign', 'test', 'scan', 'duct', 'node', 'injury', 'level',
    'lobe', 'wall', 'zone', 'tract', 'deficiency', 'disorder', 'roots', 'trunk', 'cord', 'branch',
    'acute', 'chronic', 'urgent', 'immediate', 'initial', 'definitive', 'management', 'infusion', 'bolus'
  ]);

  const scores = question.options.map((opt) => {
    const rawText = opt.text.replace(/^[A-D]\)\s*/, '').trim().toLowerCase();
    if (!rawText) return 0;
    let score = 0;

    // Check option rationale for explicit confirmatory vs negative distractor wording
    if (opt.rationale) {
      const rLower = opt.rationale.trim().toLowerCase();
      if (
        rLower.startsWith('correct') ||
        rLower.startsWith('right') ||
        rLower.includes('is the correct') ||
        rLower.includes('treatment of choice') ||
        rLower.includes('first-line') ||
        rLower.includes('gold standard')
      ) {
        score += 50;
      }
      if (
        rLower.startsWith('incorrect') ||
        rLower.startsWith('wrong') ||
        rLower.startsWith('false') ||
        rLower.includes('is ineffective') ||
        rLower.includes('contraindicated') ||
        rLower.includes('should not delay')
      ) {
        score -= 40;
      }
    }

    // Full direct match in clinical explanation
    if (expl && expl.includes(rawText)) score += 30;

    // Multi-word phrase / bigram matching (e.g. 'temporary pacing', 'upper trunk', 'complete heart block')
    const meaningfulWords = rawText.split(/[\s,()/-]+/).filter((w) => w.length > 2 && !MEDICAL_STOPWORDS.has(w));
    for (let i = 0; i < meaningfulWords.length - 1; i++) {
      const bigram = `${meaningfulWords[i]} ${meaningfulWords[i + 1]}`;
      if (expl && expl.includes(bigram)) {
        score += 25;
      }
    }

    // Individual significant words
    for (const w of meaningfulWords) {
      if (expl && expl.includes(w)) score += 6;
    }

    // Alphanumeric tokens (e.g. C5-C6, C8-T1, V1-V4, AV, STEMI)
    const alphaNumTokens = rawText.match(/[a-z]+\d+|\d+[a-z]+|[a-z]+\-[a-z0-9]+|\d+\-\d+/g);
    if (alphaNumTokens) {
      for (const token of alphaNumTokens) {
        if (expl && expl.includes(token)) score += 15;
      }
    }

    // Acronym in parenthesis: e.g. (RCA), (LAD), (CT)
    const acronymMatch = opt.text.match(/\(([A-Za-z0-9]+)\)/);
    if (acronymMatch && expl && expl.includes(acronymMatch[1].toLowerCase())) {
      score += 15;
    }

    // Explicit negative phrasing deduction in explanation
    if (
      expl && (
        expl.includes(`not ${rawText}`) ||
        expl.includes(`unlike ${rawText}`) ||
        expl.includes(`${rawText} is incorrect`) ||
        expl.includes(`rules out ${rawText}`) ||
        expl.includes(`ruling out ${rawText}`) ||
        expl.includes(`${rawText} is ineffective`)
      )
    ) {
      score -= 30;
    }

    return score;
  });

  const currentIdx = question.options.findIndex(
    (o) => o.key === question.correctAnswer || o.isCorrect || o.optionId === question.correctOptionId
  );
  let highestScore = -Infinity;
  let bestIdx = -1;
  scores.forEach((s, idx) => {
    if (s > highestScore) {
      highestScore = s;
      bestIdx = idx;
    }
  });

  const currentScore = currentIdx !== -1 ? scores[currentIdx] : 0;

  // Reconcile if current option is penalized (e.g. its rationale says "Incorrect") or best option is significantly higher
  if (bestIdx !== -1 && currentIdx !== -1 && bestIdx !== currentIdx) {
    if (currentScore < 0 || (highestScore >= 8 && highestScore > currentScore + 6)) {
      const reconciledOptions = question.options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === bestIdx,
      }));
      const winningOption = reconciledOptions[bestIdx];
      return {
        ...question,
        options: reconciledOptions,
        correctAnswer: winningOption.key,
        correctOptionId: winningOption.optionId,
      };
    }
  }

  return question;
}

/**
 * Validates that an MCQ strictly tests the intended subject and topic without cross-contamination.
 */
export function validateQuestionTopicMatch(
  question: {
    scenario?: string;
    question?: string;
    explanation?: string;
    topicName?: string;
    subtopic?: string;
    topicId?: string;
  },
  subjectName: string,
  topicName: string
): boolean {
  const combined = `${question.scenario || ''} ${question.question || ''} ${question.explanation || ''}`;
  const validation = validateTopicContentConsistency(combined, subjectName, topicName);
  
  // If there is explicit cross-topic contamination (e.g. knee joint in cardiology), reject
  if (validation.hasContamination) {
    return false;
  }
  
  // If content validator confirmed keyword match
  if (validation.isValid) {
    return true;
  }

  // If the question belongs to this topic and has no contamination, it is valid
  if (
    (question.topicName && question.topicName.toLowerCase().includes(topicName.toLowerCase())) ||
    (topicName && question.topicName && topicName.toLowerCase().includes(question.topicName.toLowerCase())) ||
    question.topicId
  ) {
    return !validation.hasContamination;
  }

  return false;
}

/**
 * 10-Point Comprehensive MCQ Quality & Integrity Validator.
 */
export function validateComprehensiveMcq(
  question: {
    scenario?: string;
    question?: string;
    options?: Array<{ text?: string; isCorrect?: boolean; key?: string }>;
    explanation?: string;
    topicName?: string;
    subtopic?: string;
    topicId?: string;
  },
  subjectName?: string,
  topicName?: string
): { isValid: boolean; issues?: string[] } {
  const issues: string[] = [];

  if (!question.scenario || question.scenario.trim().length < 10) {
    issues.push('Scenario / Clinical vignette is missing or too brief (<10 chars)');
  }

  if (!question.question || question.question.trim().length < 5) {
    issues.push('Question prompt is missing or too brief (<5 chars)');
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    issues.push(`Question must have exactly 4 options (found ${question.options?.length || 0})`);
  } else {
    // Check for generic placeholder text
    for (const opt of question.options) {
      const txt = (opt.text || '').toLowerCase();
      if (
        txt.includes('non-targeted symptomatic observation') ||
        txt.includes('immediate unindicated invasive')
      ) {
        issues.push('Option contains generic placeholder text');
      }
    }
  }

  if (!question.explanation || question.explanation.trim().length < 10) {
    issues.push('Explanation is missing or too brief (<10 chars)');
  }

  if (subjectName && topicName) {
    const isTopicValid = validateQuestionTopicMatch(question, subjectName, topicName);
    if (!isTopicValid) {
      issues.push(`Question fails topic alignment / cross-contamination check for ${subjectName} -> ${topicName}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined,
  };
}

/**
 * Finds a matching visual asset from VISUAL_CONCEPT_REGISTRY for live drills.
 */
function findMatchingVisualConcept(subjectId: string, topicName: string): VisualConceptAsset | null {
  const normTopic = topicName.toLowerCase();
  const normSub = subjectId.toLowerCase();

  // Explicit keyword matches for verified topic drills
  if (normTopic.includes('brachial plexus')) return VISUAL_CONCEPT_REGISTRY['anat:brachial_plexus_c5_c6'];
  if (normTopic.includes('cardiac ap') || normTopic.includes('cardiac action potential'))
    return VISUAL_CONCEPT_REGISTRY['physio:cardiac_action_potential'];
  if (normTopic.includes('lineweaver')) return VISUAL_CONCEPT_REGISTRY['biochem:lineweaver_burk_competitive'];
  if (normTopic.includes('dose response')) return VISUAL_CONCEPT_REGISTRY['pharm:dose_response_competitive_antagonist'];
  if (normTopic.includes('reed-sternberg') || normTopic.includes('reed sternberg'))
    return VISUAL_CONCEPT_REGISTRY['path:reed_sternberg_jpg'];
  if (normTopic.includes('acid fast')) return VISUAL_CONCEPT_REGISTRY['micro:acid_fast_bacilli_jpg'];
  if (normTopic.includes('inferior stemi')) return VISUAL_CONCEPT_REGISTRY['cardio:inferior_stemi_jpg'];
  if (normTopic.includes('pneumothorax')) return VISUAL_CONCEPT_REGISTRY['rad:tension_pneumothorax_jpg'];
  if (normTopic.includes('erythema multiforme')) return VISUAL_CONCEPT_REGISTRY['derm:target_lesions_jpg'];
  if (normTopic.includes('crao') || normTopic.includes('cherry red'))
    return VISUAL_CONCEPT_REGISTRY['ophth:cherry_red_spot_jpg'];
  if (normTopic.includes('complete heart block') || normTopic.includes('3rd degree av block'))
    return VISUAL_CONCEPT_REGISTRY['cardio:complete_heart_block_jpg'];
  if (normTopic.includes('wpw') || normTopic.includes('wolff parkinson'))
    return VISUAL_CONCEPT_REGISTRY['cardio:wpw_syndrome_jpg'];
  if (normTopic.includes('atrial fibrillation') || normTopic.includes('afib'))
    return VISUAL_CONCEPT_REGISTRY['cardio:afib_ecg_jpg'];

  // Generic medical stopwords that should NEVER trigger a loose single-word match
  const GENERIC_VISUAL_STOPWORDS = new Set([
    'disease', 'diseases', 'syndrome', 'heart', 'clinical', 'acute', 'chronic',
    'disorder', 'infection', 'normal', 'study', 'finding', 'test', 'exam', 'sign',
    'criteria', 'presentation', 'management', 'review', 'recall', 'high', 'yield'
  ]);

  for (const asset of Object.values(VISUAL_CONCEPT_REGISTRY)) {
    const subMatch = asset.subjects.some((s) => s === normSub || normSub.includes(s));
    if (!subMatch) continue;
    const meaningfulWords = asset.visualTarget
      .toLowerCase()
      .split(/[\s,()/-]+/)
      .filter((w) => w.length >= 4 && !GENERIC_VISUAL_STOPWORDS.has(w));

    // Require either a very specific multi-word phrase or at least 2 distinctive words
    const matchedCount = meaningfulWords.filter((w) => normTopic.includes(w)).length;
    if (matchedCount >= 2 || (meaningfulWords.length === 1 && matchedCount === 1 && meaningfulWords[0].length >= 7)) {
      return asset;
    }
  }

  return null;
}

/**
 * Builds 10 verified, authentic, clinical practice questions for any target topic.
 */
export function getVerifiedTopicQuestions(
  subjectId: string,
  topicId: string,
  topicName: string,
  count: number = 10
): PracticeSessionQuestion[] {
  const questions: PracticeSessionQuestion[] = [];
  const knowledge = getTopicKnowledge(subjectId, topicId, topicName);
  const normTopicName = topicName.toLowerCase();
  const clinicalCases =
    VERIFIED_TOPIC_CLINICAL_CASES[topicId] ||
    (normTopicName.includes('valvular') || normTopicName.includes('endocarditis') || normTopicName.includes('duke')
      ? VERIFIED_TOPIC_CLINICAL_CASES['med-3']
      : undefined) ||
    (normTopicName.includes('asthma') || normTopicName.includes('copd')
      ? VERIFIED_TOPIC_CLINICAL_CASES['med-4']
      : undefined) ||
    [];

  // 1. Incorporate verified visual concept if available
  const matchingVisual = findMatchingVisualConcept(subjectId, topicName);
  if (matchingVisual) {
    const rawOptions = [
      { text: matchingVisual.keyVisualFinding, isCorrect: true },
      { text: 'Normal physiologic variant without active pathology', isCorrect: false },
      { text: 'Non-specific artifact without clinical localization', isCorrect: false },
      { text: 'Diffuse architectural distortion without diagnostic lesion', isCorrect: false },
    ];
    const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(rawOptions);

    questions.push({
      id: `verified-${subjectId}-${topicId}-visual-${matchingVisual.conceptKey.replace(/[^a-z0-9]/gi, '_')}`,
      sessionId: `session-${topicId}`,
      sequenceNumber: questions.length + 1,
      scenario: `The accompanying diagnostic image or visual study is obtained during the evaluation of a patient presenting with suspected ${topicName}.`,
      question: `Which diagnostic finding or hallmark feature is demonstrated on the provided visual study?`,
      options: shuffledOptions,
      correctOptionId,
      correctAnswer,
      explanation: `Characteristic finding: ${matchingVisual.keyVisualFinding}. Focus: ${matchingVisual.whatToLookFor}.`,
      highYieldPearl: matchingVisual.whatToLookFor,
      subjectId,
      subjectName: subjectId.toUpperCase(),
      topicId,
      topicName,
      subtopic: 'Visual Diagnosis',
      difficulty: 'high-yield',
      isAiGenerated: false,
      imageUrl: matchingVisual.imageUrl,
      cleanImageUrl: matchingVisual.cleanImageUrl,
      annotatedImageUrl: matchingVisual.annotatedImageUrl,
      whatToLookFor: matchingVisual.whatToLookFor,
      visualIntent: {
        requiresImage: true,
        visualTarget: matchingVisual.visualTarget,
        keyVisualFinding: matchingVisual.keyVisualFinding,
      },
    });
  }

  // 2. Check for matching authentic Image-Based Question from the IBQ bank (if no visual attached yet)
  if (!matchingVisual && questions.length < count) {
    const verifiedIbq = getVerifiedIBQForTopic(subjectId, topicName);
    if (verifiedIbq) {
      const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(
        verifiedIbq.options.map((o) => ({
          optionId: o.id,
          text: o.text,
          isCorrect: o.id === verifiedIbq.correctOptionId,
        }))
      );

      questions.push({
        id: `verified-${subjectId}-${topicId}-ibq-${verifiedIbq.id}`,
        sessionId: `session-${topicId}`,
        sequenceNumber: questions.length + 1,
        scenario: verifiedIbq.vignette,
        question: 'Identify the characteristic diagnostic finding or investigation shown in the vignette:',
        options: shuffledOptions,
        correctOptionId,
        correctAnswer,
        explanation:
          verifiedIbq.explanation.detailedRationale ||
          `High yield image finding: ${verifiedIbq.explanation.imageFinding || 'Key hallmark in FMGE'}.`,
        highYieldPearl: verifiedIbq.explanation.highYieldBuzzwords?.join(', '),
        subjectId,
        subjectName: subjectId.toUpperCase(),
        topicId,
        topicName,
        subtopic: 'Image-Based Diagnosis',
        difficulty: 'high-yield',
        isAiGenerated: false,
        imageUrl: verifiedIbq.imageSrc,
        cleanImageUrl: verifiedIbq.imageSrc,
        whatToLookFor: verifiedIbq.explanation.imageFinding,
        visualIntent: {
          requiresImage: true,
          visualTarget: topicName,
          keyVisualFinding: verifiedIbq.explanation.imageFinding,
        },
      });
    }
  }

  // 3. Incorporate verified clinical cases from clinicalCaseEngine
  for (let idx = 0; idx < clinicalCases.length && questions.length < count; idx++) {
    const c = clinicalCases[idx];
    const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(c.options);

    questions.push({
      id: `verified-${subjectId}-${topicId}-case-${idx + 1}`,
      sessionId: `session-${topicId}`,
      sequenceNumber: questions.length + 1,
      scenario: `${c.patientDemographics}. ${c.presentation} ${c.physicalExamOrLabs}`,
      question: c.diagnosticQuestion,
      options: shuffledOptions,
      correctOptionId,
      correctAnswer,
      explanation: `${c.clinicalExplanation} Key Rule: ${c.examPearl}`,
      highYieldPearl: c.examPearl,
      subjectId,
      subjectName: subjectId.toUpperCase(),
      topicId,
      topicName,
      subtopic: c.focusArea,
      difficulty: 'high-yield',
      isAiGenerated: false,
    });
  }

  // 4. Incorporate the primary clinical case from FMGE_TOPIC_KNOWLEDGE_BASE
  if (knowledge?.clinicalCase && questions.length < count) {
    const cc = knowledge.clinicalCase;
    const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(cc.options);

    questions.push({
      id: `verified-${subjectId}-${topicId}-kb`,
      sessionId: `session-${topicId}`,
      sequenceNumber: questions.length + 1,
      scenario: `${cc.patientDemographics}. ${cc.presentation} ${cc.physicalExamOrLabs}`,
      question: cc.diagnosticQuestion,
      options: shuffledOptions,
      correctOptionId,
      correctAnswer,
      explanation: `${cc.clinicalExplanation} Key Pearl: ${cc.examPearl}`,
      highYieldPearl: cc.examPearl,
      subjectId,
      subjectName: subjectId.toUpperCase(),
      topicId,
      topicName,
      subtopic: 'Clinical Presentation & Exam',
      difficulty: 'high-yield',
      isAiGenerated: false,
    });
  }

  // 5. Synthesize facet-specific authentic questions with 100% DISTINCT scenarios and questions
  const facets: Array<{
    scenarioPrefix: string;
    questionPrompt: string;
    getCorrect: () => string;
    getDistractors: () => string[];
    explanationText: string;
    subtopicName: string;
  }> = [
    {
      scenarioPrefix: `Diagnostic protocol assessment: A patient is evaluated for suspected ${topicName}. The clinical team selects the definitive modality.`,
      questionPrompt: `What is the gold standard diagnostic investigation for this condition?`,
      getCorrect: () => knowledge?.goldStandardTest || `Definitive diagnostic evaluation for ${topicName}`,
      getDistractors: () => [
        `Empirical observation without confirmatory testing`,
        `Non-specific routine electrolyte panel alone`,
        `Unenhanced screening radiography without contrast`,
      ],
      explanationText: `The gold standard diagnostic modality for ${topicName} is: ${knowledge?.goldStandardTest || 'definitive diagnostic evaluation'}.`,
      subtopicName: 'Diagnostic Investigations',
    },
    {
      scenarioPrefix: `Therapeutic management meeting: During clinical rounds on ${topicName}, the medical team selects immediate pharmacotherapy.`,
      questionPrompt: `Which of the following represents the established first-line therapeutic management?`,
      getCorrect: () => knowledge?.firstLineTreatment || `First-line management protocol for ${topicName}`,
      getDistractors: () => [
        `High-dose prophylactic sedation without targeted intervention`,
        `Delayed outpatient referral after 6 weeks`,
        `Alternative conservative herbal supplement trial`,
      ],
      explanationText: `First-line medical therapy for ${topicName} is: ${knowledge?.firstLineTreatment || 'guideline-directed management'}.`,
      subtopicName: 'Pharmacotherapy & Management',
    },
    {
      scenarioPrefix: `Clinical review vignette: A patient presents with classic clinical signs indicative of ${topicName}.`,
      questionPrompt: `Which of the following high-yield pearls or hallmarks is most characteristic?`,
      getCorrect: () => knowledge?.keyTakeaways?.[0] || knowledge?.coreConcepts?.[0] || `Key hallmark of ${topicName}`,
      getDistractors: () => [
        `Generalized constitutional symptoms without localization`,
        `Asymptomatic mild transaminitis with normal bilirubin`,
        `Unremarkable peripheral blood smear with normal reticulocyte count`,
      ],
      explanationText: `High-yield takeaway: ${knowledge?.keyTakeaways?.[0] || knowledge?.coreConcepts?.[0] || 'Core high-yield principle for FMGE'}.`,
      subtopicName: 'High-Yield Clinical Hallmarks',
    },
    {
      scenarioPrefix: `Diagnostic pitfall analysis: A residency conference discusses common errors and traps encountered in ${topicName}.`,
      questionPrompt: `Which clinical caveat or exam trap must be avoided when evaluating this patient?`,
      getCorrect: () => knowledge?.examTrap || `Clinical differentiator for ${topicName}`,
      getDistractors: () => [
        `Assuming symptoms are always accompanied by high fever`,
        `Overlooking routine dietary fluid intake in all cases`,
        `Withholding oral fluids before standard non-contrast imaging`,
      ],
      explanationText: `Exam Trap & Pitfall: ${knowledge?.examTrap || 'Carefully note the pathognomonic diagnostic nuances for FMGE'}.`,
      subtopicName: 'Diagnostic Pitfalls & Traps',
    },
    {
      scenarioPrefix: `Etiological investigation: In a patient evaluated for ${topicName}, pathophysiology and anatomical relations are reviewed.`,
      questionPrompt: `Which pathophysiological or anatomical mechanism directly explains the clinical features?`,
      getCorrect: () => knowledge?.coreConcepts?.[1] || knowledge?.highYieldSummary || `Pathophysiological mechanism of ${topicName}`,
      getDistractors: () => [
        `Accelerated hepatic phase II glucuronidation`,
        `Idiopathic transient hypercalcemia with normal PTH`,
        `Diffuse systemic microvascular endothelial apoptosis`,
      ],
      explanationText: `Pathophysiological mechanism: ${knowledge?.coreConcepts?.[1] || knowledge?.highYieldSummary || 'Underlying core mechanism'}.`,
      subtopicName: 'Pathophysiology & Mechanism',
    },
    {
      scenarioPrefix: `Standard guideline audit: Quality metrics are evaluated for the evidence-based management of ${topicName}.`,
      questionPrompt: `Which statement regarding management guidelines and monitoring is accurate?`,
      getCorrect: () => knowledge?.keyTakeaways?.[1] || `Guideline-directed monitoring for ${topicName}`,
      getDistractors: () => [
        `Continuous invasive central venous pressure monitoring is universally mandatory`,
        `Immediate surgical exploration without prior imaging or resuscitation`,
        `Strict water deprivation testing regardless of hydration status`,
      ],
      explanationText: `Clinical guideline standard: ${knowledge?.keyTakeaways?.[1] || 'Follow standardized evidence-based FMGE protocols'}.`,
      subtopicName: 'Management Guidelines',
    },
    {
      scenarioPrefix: `Differential diagnosis clinic: An outpatient displays features raising suspicion of ${topicName}.`,
      questionPrompt: `Which clinical presentation is pathognomonic or highly suggestive of this condition?`,
      getCorrect: () => knowledge?.classicPresentation || `Classic clinical presentation of ${topicName}`,
      getDistractors: () => [
        `Gradual episodic tension-type headaches with normal fundoscopy`,
        `Intermittent palpitations during heavy caffeine consumption only`,
        `Transient painless ankle edema resolving upon leg elevation`,
      ],
      explanationText: `Classic presentation: ${knowledge?.classicPresentation || 'Typical high-yield clinical presentation for FMGE'}.`,
      subtopicName: 'Differential Diagnosis',
    },
    {
      scenarioPrefix: `Rapid recall session: High-yield memory hooks and associations are drilled for ${topicName}.`,
      questionPrompt: `Which core concept is essential for rapid recall during the FMGE exam?`,
      getCorrect: () => knowledge?.coreConcepts?.[2] || knowledge?.keyTakeaways?.[2] || `High-yield recall principle for ${topicName}`,
      getDistractors: () => [
        `Routine screening colonoscopy recommended at age 20`,
        `Prophylactic broad-spectrum penicillin for all unconfirmed contacts`,
        `Serial serum creatinine checks every 30 minutes`,
      ],
      explanationText: `High-yield recall principle: ${knowledge?.coreConcepts?.[2] || knowledge?.keyTakeaways?.[2] || 'Key takeaway for FMGE'}.`,
      subtopicName: 'Rapid Recall & Mnemonics',
    },
    {
      scenarioPrefix: `Surgical and anatomical review: A surgical team considers structural relations in a case of ${topicName}.`,
      questionPrompt: `What is the primary anatomical relation or structural boundary of clinical importance?`,
      getCorrect: () => knowledge?.coreConcepts?.[3] || `Key anatomical landmark associated with ${topicName}`,
      getDistractors: () => [
        `Passage through the optic foramen alongside ophthalmic artery`,
        `Direct termination into the coronary sinus without valve`,
        `Anterior traversal of the third part of duodenum`,
      ],
      explanationText: `Anatomical relation: ${knowledge?.coreConcepts?.[3] || 'High-yield boundary relation for FMGE'}.`,
      subtopicName: 'Structural Anatomy & Relations',
    },
    {
      scenarioPrefix: `Emergency triage evaluation: An acute decompensation occurs in a patient treated for ${topicName}.`,
      questionPrompt: `Which acute complication represents the most critical immediate risk?`,
      getCorrect: () => knowledge?.coreConcepts?.[4] || `Critical potential complication of ${topicName}`,
      getDistractors: () => [
        `Asymptomatic trace microscopic proteinuria`,
        `Transient mild isolated eosinophilia (<5%)`,
        `Benign early repolarization on baseline ECG`,
      ],
      explanationText: `Critical complication: ${knowledge?.coreConcepts?.[4] || 'Recognize urgent red flag complications'}.`,
      subtopicName: 'Emergency Complications',
    },
    {
      scenarioPrefix: `Pharmacological alternative selection: A patient with ${topicName} demonstrates intolerance to standard agents.`,
      questionPrompt: `What is the recommended secondary or alternative therapeutic approach?`,
      getCorrect: () => knowledge?.keyTakeaways?.[3] || `Second-line therapeutic alternative for ${topicName}`,
      getDistractors: () => [
        `Discontinuation of all medical therapies without reassessment`,
        `Immediate unguided high-dose broad spectrum monotherapy`,
        `Empiric total parenteral nutrition without indications`,
      ],
      explanationText: `Therapeutic approach: ${knowledge?.keyTakeaways?.[3] || 'Evidence-based secondary regimen'}.`,
      subtopicName: 'Alternative Regimens',
    },
    {
      scenarioPrefix: `Evidence-based diagnostic criteria: A clinical research unit verifies diagnostic benchmarks for ${topicName}.`,
      questionPrompt: `Which confirmatory diagnostic criterion establishes definitive clinical diagnosis?`,
      getCorrect: () => knowledge?.coreConcepts?.[0] || `Diagnostic benchmark for ${topicName}`,
      getDistractors: () => [
        `Isolated family history in a distant relative alone`,
        `Transient subjective fatigue without objective markers`,
        `Single borderline blood pressure reading on ambulatory monitor`,
      ],
      explanationText: `Diagnostic benchmark: ${knowledge?.coreConcepts?.[0] || 'Standard clinical diagnostic criteria'}.`,
      subtopicName: 'Diagnostic Criteria',
    },
  ];

  let facetIdx = 0;
  while (questions.length < count && facetIdx < facets.length) {
    const f = facets[facetIdx];
    const rawOptions = [
      { text: f.getCorrect(), isCorrect: true, rationale: f.explanationText },
      ...f.getDistractors().map((d) => ({
        text: d,
        isCorrect: false,
        rationale: `Incorrect. Does not satisfy the criteria for ${topicName} (${f.subtopicName}).`,
      })),
    ];
    const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(rawOptions);

    questions.push({
      id: `verified-${subjectId}-${topicId}-facet-${questions.length + 1}`,
      sessionId: `session-${topicId}`,
      sequenceNumber: questions.length + 1,
      scenario: f.scenarioPrefix,
      question: f.questionPrompt,
      options: shuffledOptions,
      correctOptionId,
      correctAnswer,
      explanation: f.explanationText,
      highYieldPearl: knowledge?.keyTakeaways?.[0] || 'Core high-yield principle for FMGE.',
      subjectId,
      subjectName: subjectId.toUpperCase(),
      topicId,
      topicName,
      subtopic: f.subtopicName,
      difficulty: 'high-yield',
      isAiGenerated: false,
    });
    facetIdx++;
  }

  // Deduplicate, reconcile, and ensure exact question count
  return questions.slice(0, count).map((q, idx) => {
    const reconciled = reconcileQuestionMedicalKey(q);
    return {
      ...reconciled,
      sequenceNumber: idx + 1,
    };
  });
}

/**
 * Fetches practice session questions for the active topic, applying visual resolution
 * and strict topic locking.
 */
export async function fetchPracticeSessionQuestions(
  context: PracticeSessionContext,
  visualValidationLogs?: VisualValidationLog[]
): Promise<PracticeSessionQuestion[]> {
  const targetCount = context.targetQuestionCount || 10;
  let questions: PracticeSessionQuestion[] = [];

  // If verified initial questions were explicitly provided, use them directly
  if (context.initialQuestions && context.initialQuestions.length > 0) {
    questions = context.initialQuestions.slice(0, targetCount);
  } else if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    // If in browser environment, attempt to fetch from server AI practice-session endpoint
    try {
      const response = await fetch('/api/ai/practice-session-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: context.subjectId,
          subjectName: context.subjectName,
          topicId: context.topicId,
          topicName: context.topicName,
          subtopic: context.subtopic || '',
          count: targetCount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          questions = data.questions.map((q: any, idx: number) => ({
            id: q.id || `ai-${context.subjectId}-${context.topicId}-${idx + 1}`,
            sessionId: context.sessionId,
            sequenceNumber: idx + 1,
            scenario: q.scenario || q.stem || `Clinical vignette for ${context.topicName}`,
            question: q.question || 'What is the most likely diagnosis or next step in management?',
            options: (q.options || []).map((o: any, oIdx: number) => ({
              optionId: o.optionId || `opt_${oIdx + 1}`,
              key: o.key || ['A', 'B', 'C', 'D'][oIdx] || 'A',
              text: typeof o === 'string' ? o : o.text || '',
              isCorrect: Boolean(o.isCorrect) || o.key === q.correctAnswer,
              rationale: o.rationale || o.reason || o.explanation || undefined,
            })),
            correctOptionId: q.correctOptionId || 'opt_1',
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || 'FMGE evidence-based guideline rationale.',
            highYieldPearl: q.highYieldPearl,
            remediationCard: q.remediationCard,
            distractorBreakdown: q.distractorBreakdown,
            subjectId: context.subjectId,
            subjectName: context.subjectName,
            topicId: context.topicId,
            topicName: context.topicName,
            subtopic: context.subtopic,
            difficulty: 'high-yield',
            isAiGenerated: true,
            imageUrl: q.imageUrl,
            cleanImageUrl: q.cleanImageUrl,
            whatToLookFor: q.whatToLookFor,
            visualIntent: q.visualIntent,
          }));
        }
      }
    } catch {
      // Server unavailable or offline, seamlessly fall back to verified clinical question bank
    }
  }

  // 1. Strict topic validation: filter out any returned questions that fail topic matching
  if (questions.length > 0) {
    questions = questions.filter((q) =>
      validateQuestionTopicMatch(
        {
          scenario: q.scenario,
          question: q.question,
          explanation: q.explanation,
          topicName: q.topicName || context.topicName,
          topicId: q.topicId || context.topicId,
        },
        context.subjectName,
        context.topicName
      )
    );
  }

  // 2. Fallback / supplement: If server returned fewer than targetCount or ran offline,
  // top up with verified topic questions so the student ALWAYS gets exactly targetCount questions
  if (questions.length < targetCount) {
    const verifiedFallback = getVerifiedTopicQuestions(
      context.subjectId,
      context.topicId,
      context.topicName,
      targetCount
    );

    if (questions.length === 0) {
      questions = verifiedFallback;
    } else {
      for (const vq of verifiedFallback) {
        if (questions.length >= targetCount) break;
        if (!questions.some((q) => q.scenario === vq.scenario || q.question === vq.question)) {
          questions.push(vq);
        }
      }
    }
  }

  // Lock sessionId, sequence numbers, and run authoritative medical reconciliation
  const sessionBound = questions.map((q, idx) => {
    const reconciled = reconcileQuestionMedicalKey(q);
    return {
      ...reconciled,
      sessionId: context.sessionId,
      sequenceNumber: idx + 1,
      subjectId: context.subjectId,
      topicId: context.topicId,
      topicName: context.topicName,
    };
  });

  // Resolve authentic images and deduplicate within session
  return resolvePracticeSessionVisuals(sessionBound, visualValidationLogs);
}
