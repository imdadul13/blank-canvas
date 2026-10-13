import { FMGESubject, GrandTest, McqAttempt, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

export type SprintErrorType = 'knowledge' | 'confusion' | 'misread' | 'guess';

export interface SprintDay {
  title: string;
  subjects: string[];
  focus: string;
  questions: number;
  fullMock?: boolean;
  restDay?: boolean;
  checkpoint?: boolean;
}

export interface SprintSubjectTier {
  tier: 1 | 2 | 3;
  name: string;
  markRange: string;
  description: string;
  badgeColor: string;
  subjectIds: string[];
  mustKnowTopics: Record<string, string[]>;
}

// NBEMS blueprint mark allocation (300 Marks Total).
export const FMGE_BLUEPRINT_MARKS: Record<string, number> = {
  anatomy: 17,
  physiology: 17,
  biochemistry: 17,
  pathology: 13,
  microbiology: 13,
  pharmacology: 13,
  fmt: 10,
  medicine: 33,
  psychiatry: 5,
  dermatology: 5,
  radiotherapy: 5,
  surgery: 32,
  anesthesia: 5,
  orthopedics: 5,
  radiology: 5,
  pediatrics: 15,
  ophthalmology: 15,
  ent: 15,
  obg: 30,
  psm: 30,
};

export const SPRINT_TIERS: SprintSubjectTier[] = [
  {
    tier: 1,
    name: 'The Big 6 (Passing Anchor)',
    markRange: '165+ Marks',
    description: 'Carries >55% of the total 300 marks. Securing 65-70% accuracy here guarantees crossing the 150-mark pass line.',
    badgeColor: '#30D158',
    subjectIds: ['psm', 'obg', 'surgery', 'medicine', 'pathology', 'pharmacology'],
    mustKnowTopics: {
      psm: ['National Immunization Schedule & Cold Chain', 'Screening Tests (2x2 table, PPV/NPV)', 'Epidemiological Study Designs', 'Biostatistics (Tests of Significance)', 'National Health Programs (NTEP, NVBDCP)'],
      obg: ['Pritchard Regimen for Eclampsia', 'Partogram & Active Management of Labor', 'Postpartum Hemorrhage (PPH) Algorithm', 'Contraception & USG Markers in Pregnancy', 'Cervical Cancer & Endometrial Hyperplasia'],
      surgery: ['Burns (Parkland Formula & Fluid Resuscitation)', 'ATLS Primary Survey & Trauma Triage', 'Acute Abdomen & Intestinal Obstruction', 'Thyroid Malignancies & Post-Op Complications', 'Breast Carcinoma (Triple Assessment & Staging)'],
      medicine: ['ECG STEMI Localization & Arrhythmias', 'Heart Failure & Hypertension Guidelines', 'Diabetic Emergencies (DKA vs HHS)', 'Acid-Base Disturbances & ABG Interpretation', 'Tuberculosis & Pneumonia Management'],
      pathology: ['Neoplasia (Oncogenes, Tumor Markers, Hallmarks)', 'Glomerulonephritis (Nephritic vs Nephrotic EM Findings)', 'Leukemias & Lymphomas (Translocations & Markers)', 'Anemias & Peripheral Blood Smear Morphology', 'Shock & Thrombosis (Virchow Triad)'],
      pharmacology: ['Autonomic Drugs (Receptors & Toxins)', 'Antimicrobial Drug of Choice (DOC) & Resistance', 'Cardiovascular Pharmacology (Anti-arrhythmics, Anti-HTN)', 'CNS Drugs & Antiepileptics', 'General Pharmacology (Half-Life, Clearance, Phase 1/2)'],
    },
  },
  {
    tier: 2,
    name: 'High-Yield Short Subjects',
    markRange: '65 Marks',
    description: 'Compact syllabus with high question predictability. High ROI subjects that boost score into the 180-200+ safety zone.',
    badgeColor: '#007AFF',
    subjectIds: ['pediatrics', 'ophthalmology', 'ent', 'microbiology', 'fmt'],
    mustKnowTopics: {
      pediatrics: ['Developmental Milestones & Red Flags', 'Neonatal Resuscitation & Jaundice', 'Cyanotic vs Acyanotic Congenital Heart Diseases', 'Severe Acute Malnutrition (SAM) Protocols'],
      ophthalmology: ['Glaucoma (Open vs Angle-Closure Management)', 'Cataract Types & Post-Op Complications', 'Fundus Lesions (Diabetic Retinopathy, CRVO, CRAO)', 'Neuro-ophthalmology & Pupillary Light Reflexes'],
      ent: ['Tympanic Membrane Pathology & Otosclerosis', 'Tonsillitis, Quinsy & Deep Neck Infections', 'Stridor & Epiglottitis vs Croup', 'Epistaxis Management Algorithm'],
      microbiology: ['Bacterial Staining & Culture Media', 'Parasitology (Malaria, Amoebiasis, Helminths)', 'Virology (Hepatitis Serology, HIV, Dengue, Rabies)', 'Hospital Infection Control & Autoclaving'],
      fmt: ['Forensic Thanatology & Time Since Death', 'Firearm Injuries & Ballistics Patterns', 'Toxicology (Organophosphates, Snake Bite, Opioids)', 'Medical Law, IPC Sections & Consent'],
    },
  },
  {
    tier: 3,
    name: 'Rapid Recall & Clinical Allies',
    markRange: '70 Marks',
    description: 'Focus exclusively on volatile one-liners, high-yield diagnostic spotters, and classic anatomical relationships.',
    badgeColor: '#AF52DE',
    subjectIds: ['anatomy', 'physiology', 'biochemistry', 'dermatology', 'psychiatry', 'orthopedics', 'radiology', 'anesthesia'],
    mustKnowTopics: {
      anatomy: ['Brachial Plexus & Upper Limb Nerve Lesions', 'Knee Joint Ligaments & Foot Drop', 'Cranial Nerve Foramina & Brainstem Syndromes'],
      physiology: ['Wiggers Diagram & Cardiac PV Loops', 'Renal Countercurrent Mechanism & Acid-Base', 'Endocrine Negative Feedback Axes'],
      biochemistry: ['Inborn Errors of Metabolism & Enzyme Deficiencies', 'Vitamin Deficiencies & Biochemical Cycles', 'Lipoprotein Metabolism & Hyperlipidemias'],
      dermatology: ['Bullous Disorders (Pemphigus vs Pemphigoid)', 'Leprosy Classification & Psoriasis', 'Sexually Transmitted Infections (Ulcer Algorithms)'],
      psychiatry: ['Schizophrenia vs Bipolar Criteria', 'Defense Mechanisms & Substance Dependence', 'Psychopharmacology Side Effects (NMS, EPS)'],
      orthopedics: ['Pediatric Fractures & Dislocations (Colles, Monteggia, Galeazzi)', 'Bone Tumors by Age & X-Ray Appearances', 'Peripheral Nerve Compression Syndromes'],
      radiology: ['Classic Chest X-Ray Signs (Pneumothorax, Collapse, Kerley B)', 'CT Head in Trauma (EDH vs SDH vs SAH)', 'Contrast Studies & Radiation Protection Rules'],
      anesthesia: ['Airway Assessment (Mallampati Score)', 'Local Anesthetics & Toxicity (LIPID Rescue)', 'CPR Guidelines (BLS & ACLS Algorithms)'],
    },
  },
];

export const SPRINT_DAYS: SprintDay[] = [
  { title: 'Baseline · mixed diagnostic', subjects: [], focus: 'Start with a timed 50-question mixed set. Review every wrong, guessed and slow answer; this is a diagnostic, not a prediction of your final score.', questions: 50 },
  { title: 'Medicine · foundations & emergencies', subjects: ['medicine'], focus: 'Approach, common presentations, ECG, shock, fluids and emergency first steps.', questions: 60 },
  { title: 'Medicine · systems & image cases', subjects: ['medicine'], focus: 'Cardiology, respiratory, neurology, renal and endocrine patterns; review ECGs and radiology.', questions: 60 },
  { title: 'Surgery · core decisions', subjects: ['surgery'], focus: 'Trauma, acute abdomen, fluids, wound healing, breast and thyroid; practise the next best step.', questions: 60 },
  { title: 'Obstetrics & gynaecology', subjects: ['obg'], focus: 'Antenatal care, labour, obstetric emergencies, contraception, malignancy and key thresholds.', questions: 60 },
  { title: 'Pediatrics', subjects: ['pediatrics'], focus: 'Growth, development, vaccines, neonatology, nutrition and common pediatric emergencies.', questions: 50 },
  { title: 'PSM · prevention & programs', subjects: ['psm'], focus: 'Screening, epidemiology, biostatistics, national programs and prevention levels.', questions: 50 },
  { title: 'Pathology', subjects: ['pathology'], focus: 'General pathology, hematology, neoplasia and image-based morphology.', questions: 50 },
  { title: 'Pharmacology', subjects: ['pharmacology'], focus: 'Mechanisms, adverse effects, antidotes, interactions and drug of choice.', questions: 50 },
  { title: 'Microbiology', subjects: ['microbiology'], focus: 'Organism-to-disease links, lab diagnosis, vaccines and antimicrobial choices.', questions: 50 },
  { title: 'Anatomy & physiology', subjects: ['anatomy', 'physiology'], focus: 'Neuroanatomy, nerves, embryology, reflexes and high-yield physiology graphs.', questions: 50 },
  { title: 'Biochemistry & forensic medicine', subjects: ['biochemistry', 'fmt'], focus: 'Metabolic diseases, vitamins, molecular methods, toxicology and legal essentials.', questions: 50 },
  { title: 'ENT & ophthalmology', subjects: ['ent', 'ophthalmology'], focus: 'Visual and clinical spotters, red flags, common nerve lesions and first-line management.', questions: 50 },
  { title: 'Short subjects & radiotherapy', subjects: ['dermatology', 'psychiatry', 'orthopedics', 'radiology', 'anesthesia'], focus: 'Recognize classic images, emergency actions, common drugs and frequently confused pairs; include core radiotherapy principles because it carries a separate 5-mark blueprint allocation.', questions: 60 },
  { title: 'Checkpoint · mixed timed set', subjects: [], focus: 'Take a timed 100-question mixed set. Compare accuracy and pacing with your baseline, then use the next study blocks for the weakest areas.', questions: 100, checkpoint: true },
  { title: 'Repair your highest-impact gaps', subjects: [], focus: 'Use recent question accuracy, uncertain answers and mock weaknesses to choose two priority subjects. Revisit missed concepts before new content.', questions: 70 },
  { title: 'Checkpoint · full mock', subjects: [], focus: 'Complete a 300-question mock as two 150-question blocks, each timed for 150 minutes, with a break between them. Review wrong, guessed and skipped answers, then record weak subjects in Grand Tests.', questions: 300, fullMock: true, checkpoint: true },
  { title: 'Repair the final gaps', subjects: [], focus: 'Target the three weakest subjects from your mock; finish image questions and revisit your error list.', questions: 80 },
  { title: 'Final checkpoint · mixed recall', subjects: [], focus: 'Do a 100-question mixed set, or a full mock only if you are rested and have not completed one recently. Review recurring errors; avoid exhausting yourself before the exam.', questions: 100, checkpoint: true },
  { title: 'Exam eve · light recall & rest', subjects: [], focus: 'Review only your own concise error list, essential images and formulas. Prepare exam logistics, stop early, eat normally and protect sleep. No full mock or new chapters.', questions: 20, restDay: true },
];

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const FMGE_EXAM_DATE = '2026-10-31';

export function daysUntilFmge(examDate = FMGE_EXAM_DATE): number {
  const today = new Date(`${localDateKey()}T12:00:00`);
  const exam = new Date(`${examDate}T12:00:00`);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86_400_000));
}

export function sprintDateForIndex(dayIndex: number, examDate = FMGE_EXAM_DATE): string {
  const date = new Date(`${examDate}T12:00:00`);
  date.setDate(date.getDate() - (SPRINT_DAYS.length - dayIndex));
  return localDateKey(date);
}

export function sprintDayIndex(_startedOn: string, examDate = FMGE_EXAM_DATE): number {
  return Math.min(SPRINT_DAYS.length - 1, Math.max(0, 20 - daysUntilFmge(examDate)));
}

export function checklistsForPlan(plan: SprintDay, hours: number, questionTarget: number): string[] {
  return [
    `Focused revision (${(hours * (plan.restDay ? 0.35 : 0.4)).toFixed(1)} h): ${plan.focus}`,
    `Active recall (${(hours * 0.2).toFixed(1)} h): retrieve key facts without notes, then correct only what you missed.`,
    plan.fullMock
      ? 'Timed mock: complete two 150-question blocks in 150 minutes each, with an exam-style break; answer every question because FMGE has no negative marking.'
      : `Question practice (${(hours * (plan.restDay ? 0.1 : 0.3)).toFixed(1)} h): aim for about ${questionTarget} questions, then review the reasoning.`,
    plan.restDay
      ? 'Exam readiness: prepare documents and route, set a reasonable bedtime, and avoid late-night cramming.'
      : `Error review (${(hours * 0.1).toFixed(1)} h): explain each miss or guess, write the corrected rule, and revisit due cards tomorrow.`,
  ];
}

export function buildAdaptiveSprintDays(
  attempts: McqAttempt[],
  grandTests: GrandTest[],
  errorTypes: Record<string, SprintErrorType> = {}
): SprintDay[] {
  const recentCutoff = Date.now() - 30 * 86_400_000;
  const recentAttempts = attempts.filter(
    (attempt) =>
      attempt.timestamp &&
      Date.parse(attempt.timestamp) >= recentCutoff &&
      !['NEET-PG', 'INI-CET'].includes(attempt.exam || '')
  );
  const latestTests = [...grandTests].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const weakFromMocks = new Set(latestTests.flatMap((test) => test.weakSubjectIds || []));
  const strongFromMocks = new Set(latestTests.flatMap((test) => test.strongSubjectIds || []));
  const bySubject = new Map<string, McqAttempt[]>();

  [...recentAttempts]
    .filter((attempt) => attempt.subjectId && attempt.timestamp)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .forEach((attempt) => {
      const list = bySubject.get(attempt.subjectId) || [];
      list.push(attempt);
      bySubject.set(attempt.subjectId, list);
    });

  const ranked = FMGE_SUBJECTS.map((subject) => {
    const sample = (bySubject.get(subject.id) || []).slice(-40);
    const accuracy = sample.length
      ? sample.filter((attempt) => attempt.isCorrect).length / sample.length
      : null;
    const secureCorrect = sample.filter(
      (attempt) => attempt.isCorrect && !['guess', 'low'].includes(attempt.confidence || '')
    ).length;
    const reviewWeightedAccuracy = sample.length
      ? (secureCorrect +
          sample.filter((attempt) => attempt.isCorrect && ['guess', 'low'].includes(attempt.confidence || ''))
            .length *
            0.35) /
        sample.length
      : null;
    const evidence = Math.min(1, sample.length / 15);
    const adjustedWeakness =
      reviewWeightedAccuracy === null ? 0.5 : 0.5 + (0.5 - reviewWeightedAccuracy) * evidence;
    const taggedErrors = sample.filter((attempt) => errorTypes[attempt.questionId]);
    const knowledgeErrors = taggedErrors.filter(
      (attempt) => errorTypes[attempt.questionId] === 'knowledge'
    ).length;
    const confusionErrors = taggedErrors.filter(
      (attempt) => errorTypes[attempt.questionId] === 'confusion'
    ).length;
    const guessErrors = taggedErrors.filter(
      (attempt) => errorTypes[attempt.questionId] === 'guess'
    ).length;
    const misreadErrors = taggedErrors.filter(
      (attempt) => errorTypes[attempt.questionId] === 'misread'
    ).length;
    const confidentMisses = sample.filter(
      (attempt) => !attempt.isCorrect && ['high', 'certain'].includes(attempt.confidence || '')
    ).length;
    const topicErrors = new Map<string, number>();

    for (const attempt of sample) {
      const topic = (
        attempt.subtopic ||
        (attempt.subtopicId && attempt.subtopicId !== subject.id ? attempt.subtopicId : '')
      ).trim();
      if (topic && (!attempt.isCorrect || ['guess', 'low'].includes(attempt.confidence || ''))) {
        topicErrors.set(topic, (topicErrors.get(topic) || 0) + 1);
      }
    }

    const weakTopics = [...topicErrors]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([topic]) => topic);
    const blueprintWeight = FMGE_BLUEPRINT_MARKS[subject.id] ?? subject.weightage;
    const score =
      (blueprintWeight / 35) * 0.62 +
      adjustedWeakness * 0.38 +
      Math.min(
        0.2,
        knowledgeErrors * 0.035 +
          confusionErrors * 0.025 +
          misreadErrors * 0.02 +
          guessErrors * 0.02 +
          confidentMisses * 0.025
      ) +
      (weakFromMocks.has(subject.id) ? 0.28 : 0) -
      (strongFromMocks.has(subject.id) ? 0.12 : 0);

    return {
      id: subject.id,
      name: subject.name,
      blueprintWeight,
      score,
      accuracy,
      count: sample.length,
      uncertain: sample.filter(
        (attempt) =>
          attempt.confidence === 'guess' ||
          attempt.confidence === 'low' ||
          attempt.confidence === 'medium'
      ).length,
      knowledgeErrors,
      confusionErrors,
      confidentMisses,
      weakTopics,
    };
  }).sort((a, b) => b.score - a.score);

  const hasEvidence = recentAttempts.length > 0 || grandTests.length > 0;
  const makeAdaptiveDay = (index: number, selected: typeof ranked, label: string) => {
    const names = selected.map((subject) => subject.name);
    const details = selected.map((subject) => {
      if (subject.count >= 5 && subject.accuracy !== null) {
        return `${subject.name} (${subject.blueprintWeight} blueprint marks; ${Math.round(subject.accuracy * 100)}% raw accuracy${
          subject.uncertain ? `; ${subject.uncertain} guessed or unsure` : ''
        }${subject.knowledgeErrors ? `; ${subject.knowledgeErrors} tagged knowledge gaps` : ''}${
          subject.confusionErrors ? `; ${subject.confusionErrors} tagged option confusions` : ''
        }${subject.confidentMisses ? `; ${subject.confidentMisses} confident errors` : ''}${
          subject.weakTopics.length ? `; revisit ${subject.weakTopics.join(', ')}` : ''
        } across ${subject.count} recent attempts)`;
      }
      if (weakFromMocks.has(subject.id)) return `${subject.name} (flagged weak in a recent mock)`;
      return `${subject.name} (high blueprint weight; gather more answers to calibrate)`;
    });

    return {
      ...SPRINT_DAYS[index],
      title: names.length ? `${label} · ${names.join(' & ')}` : SPRINT_DAYS[index].title,
      subjects: names.length ? selected.map((subject) => subject.id) : SPRINT_DAYS[index].subjects,
      focus: hasEvidence
        ? `Prioritize ${details.join('; ')}. Review missed and guessed questions, then retrieve the key rules without notes.`
        : `Start with high-weight areas: ${names.join(', ')}. Take the baseline set so later revision can target your actual gaps.`,
    };
  };

  const days = [...SPRINT_DAYS];
  for (const index of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17]) {
    const selected =
      index < 13
        ? ranked
            .filter((subject) => SPRINT_DAYS[index].subjects.includes(subject.id))
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
        : ranked.slice(0, index === 18 ? 3 : 2);
    if (selected.length) {
      days[index] = makeAdaptiveDay(
        index,
        selected,
        hasEvidence ? 'Personalized focus' : 'High-yield focus'
      );
    }
  }

  return days;
}
