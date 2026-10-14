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
  { title: 'Baseline · mixed diagnostic', subjects: [], focus: 'Diagnostic 50-question mixed set to establish baseline accuracy and pacing across disciplines.', questions: 50 },
  { title: 'Foundation & high-yield setup', subjects: ['medicine'], focus: 'Approach, common presentations, ECG, shock, fluids and emergency first steps.', questions: 50 },
  { title: 'Pre-sprint review & recall kickstart', subjects: ['surgery'], focus: 'Trauma triage, acute abdomen, burns Parkland formula, wound healing and core algorithms.', questions: 50 },
  { title: 'Obstetrics & Gynaecology · Part 1', subjects: ['obg'], focus: 'Antenatal care, labor partogram, eclampsia (Pritchard regimen), PPH algorithm and obstetric emergencies.', questions: 60 },
  { title: 'Obstetrics & Gynaecology · Part 2', subjects: ['obg'], focus: 'Gynaecological oncology (cervical, endometrial, ovarian), contraception methods, USG markers and reproductive endocrinology.', questions: 60 },
  { title: 'PSM / Community Medicine · Part 1', subjects: ['psm'], focus: 'Epidemiology study designs, biostatistics tests of significance, screening 2x2 tables, sensitivity, specificity and PPV/NPV.', questions: 60 },
  { title: 'PSM / Community Medicine · Part 2', subjects: ['psm'], focus: 'National health programs (NTEP, NVBDCP), vaccine cold chain, VVM stages, immunization schedule and demographic indicators.', questions: 60 },
  { title: 'Biochemistry + FMT', subjects: ['biochemistry', 'fmt'], focus: 'Inborn errors of metabolism, vitamin deficiencies, toxicology (organophosphates, snake bite, opioids), thanatology and IPC medical jurisprudence.', questions: 60 },
  { title: 'Anatomy · Nerves & Relations', subjects: ['anatomy'], focus: 'Brachial plexus, upper & lower limb nerve lesions (foot drop, claw hand), cranial nerve foramina and brainstem cross-sections.', questions: 60 },
  { title: 'Microbiology · Bugs & Antibiograms', subjects: ['microbiology'], focus: 'Bacterial staining & culture media, virology (hepatitis serology, HIV, rabies), parasitology (malaria, amoebiasis) and infection control.', questions: 60 },
  { title: 'Pharmacology · Receptors & DOCs', subjects: ['pharmacology'], focus: 'Autonomic nervous system drugs, antimicrobial drugs of choice, cardiovascular pharmacology, antiepileptics and emergency antidotes.', questions: 60 },
  { title: 'Pathology + Core Physiology', subjects: ['pathology', 'physiology'], focus: 'Neoplasia hallmarks & tumor markers, hematology (leukemias, anemias), glomerulonephritis, Wiggers diagram, cardiac PV loops and countercurrent mechanism.', questions: 60 },
  { title: 'General Surgery + Orthopedics · Part 1', subjects: ['surgery', 'orthopedics'], focus: 'ATLS trauma primary survey, burns Parkland formula, acute abdomen, pediatric fractures (Colles, Monteggia, Galeazzi) and nerve injuries.', questions: 60 },
  { title: 'General Surgery + Orthopedics · Part 2', subjects: ['surgery', 'orthopedics'], focus: 'Breast triple assessment, thyroid malignancies, intestinal obstruction, arterial disorders and bone tumors by age & X-ray spotters.', questions: 60 },
  { title: 'Selective Medicine + Short Subjects · Part 1', subjects: ['medicine', 'dermatology', 'psychiatry'], focus: 'STEMI localization & arrhythmias, diabetic emergencies (DKA vs HHS), bullous disorders (pemphigus vs pemphigoid), schizophrenia and psychopharmacology side effects.', questions: 65 },
  { title: 'Selective Medicine + Short Subjects · Part 2', subjects: ['medicine', 'radiology', 'anesthesia', 'radiotherapy'], focus: 'Tuberculosis NTEP algorithms, chest X-ray signs, trauma CT head (EDH vs SDH vs SAH), BLS/ACLS CPR guidelines and core radiotherapy principles.', questions: 65 },
  { title: 'Pediatrics, ENT & Ophthalmology', subjects: ['pediatrics', 'ent', 'ophthalmology'], focus: 'Developmental milestones, neonatal jaundice, congenital heart diseases, otosclerosis, epistaxis, glaucoma, cataract and diabetic retinopathy fundus spotters.', questions: 60 },
  { title: 'Timed Mixed Recall & Mock Review · Part 1', subjects: [], focus: 'Full 300-question mock exam or two 150-question timed blocks. Simulate exam pacing: 1 minute per question. Review every wrong, guessed and skipped answer.', questions: 300, fullMock: true, checkpoint: true },
  { title: 'Timed Mixed Recall & Mock Review · Part 2', subjects: [], focus: 'Target recurring traps from mock review, volatile numbers, staging classifications, and 100-question mixed recall blitz.', questions: 100, checkpoint: true },
  { title: 'Light Revision, Volatile Facts, Image Review & Rest', subjects: [], focus: 'Review only your personalized Error Vault and 20th Notebook, key visual spotters and formulas. Stop early, verify hall ticket and logistics, protect sleep. No heavy testing.', questions: 20, restDay: true },
];

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const FMGE_EXAM_DATE = '2026-10-31';

function resolveSafeExamDate(examDate?: string): string {
  return examDate && /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? examDate : FMGE_EXAM_DATE;
}

export function daysUntilFmge(examDate = FMGE_EXAM_DATE): number {
  const safeExamDate = resolveSafeExamDate(examDate);
  const today = new Date(`${localDateKey()}T12:00:00`);
  const exam = new Date(`${safeExamDate}T12:00:00`);
  return Math.max(0, Math.ceil((exam.getTime() - today.getTime()) / 86_400_000));
}

export function sprintDateForIndex(dayIndex: number, examDate = FMGE_EXAM_DATE): string {
  const safeExamDate = resolveSafeExamDate(examDate);
  const date = new Date(`${safeExamDate}T12:00:00`);
  date.setDate(date.getDate() - (SPRINT_DAYS.length - dayIndex));
  return localDateKey(date);
}

export function sprintDayIndex(_startedOn: string, examDate = FMGE_EXAM_DATE): number {
  const safeExamDate = resolveSafeExamDate(examDate);
  return Math.min(SPRINT_DAYS.length - 1, Math.max(0, SPRINT_DAYS.length - daysUntilFmge(safeExamDate)));
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
  for (let index = 0; index < days.length; index++) {
    const day = SPRINT_DAYS[index];
    if (day.restDay) continue;

    if (day.subjects && day.subjects.length > 0) {
      const selected = ranked
        .filter((subject) => day.subjects.includes(subject.id))
        .sort((a, b) => b.score - a.score);

      if (selected.length) {
        days[index] = makeAdaptiveDay(
          index,
          selected,
          hasEvidence ? 'Personalized focus' : 'High-yield focus'
        );
      }
    } else if ((day.checkpoint || day.fullMock) && hasEvidence) {
      const topWeak = ranked.slice(0, 2);
      if (topWeak.length) {
        const weakNames = topWeak.map((s) => s.name).join(' & ');
        days[index] = {
          ...day,
          focus: `${day.focus} Focus post-test review on your weakest areas: ${weakNames}.`,
        };
      }
    }
  }

  return days;
}
