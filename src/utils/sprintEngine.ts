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
      obg: [
        'Labor & Partograph (Alert/Action line)',
        'AMTSL & PPH Management Algorithm',
        'Pritchard Regimen for Eclampsia (MgSO4)',
        'Placenta Previa vs Abruption',
        'Contraception & USG Markers in Pregnancy',
        'Mullerian Anomalies & Molar Pregnancy',
        'Ca Cervix & Ca Endometrium Staging',
      ],
      psm: [
        '2x2 Screening Tables (Sens, Spec, PPV, NPV)',
        'Cohort vs Case-Control Study Designs',
        'NIS Vaccines, Cold Chain & Open Vial Policy',
        'Biomedical Waste (BMW) Color Bins & Disposal',
        'NTEP & NVBDCP National Health Programs',
        'Mortality & Fertility Rate Formulas',
      ],
      surgery: [
        'ATLS Primary Survey, GCS & FAST Exam',
        'Parkland Formula for Fluid Resuscitation in Burns',
        'Breast Carcinoma (Triple Assessment & Staging)',
        'Thyroid Malignancies & Post-Op Complications',
        'Inguinal & Femoral Hernias',
        'Charcot Triad, Courvoisier Law & Acute Abdomen',
        'Volvulus & Intestinal Obstruction X-Rays',
      ],
      medicine: [
        'ECG STEMI Localization & Arrhythmias',
        'Acid-Base Disturbances & ABG Interpretation',
        'Diabetic Emergencies (DKA vs HHS)',
        'Hyperkalemia & Electrolyte Emergencies',
        'Acute Stroke CT & Thrombolysis Window',
        'Infective Endocarditis (Modified Duke Criteria)',
        'Pleural Effusion (Light Criteria)',
        'Status Epilepticus Management Protocol',
      ],
      pathology: [
        'Hypersensitivity Reactions Type I-IV',
        'Translocations, Oncogenes & Tumor Markers',
        'Nephritic vs Nephrotic Syndromes (Biopsy & EM)',
        'Leukemias, Lymphomas & Blood Smear Morphology',
        'Shock, Embolism & Virchow Triad',
      ],
      pharmacology: [
        'Drug of Choice (DOC) Master Table',
        'Specific Emergency Antidotes',
        'Teratogenic Drugs & FDA Safety Categories',
        'Anti-TB, Anti-Epileptic, Lithium & Digoxin Toxicities',
        'Zero-Order vs First-Order Elimination Kinetics',
      ],
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
      pediatrics: [
        'Developmental Milestones & Red Flags',
        'Neonatal Resuscitation Program (NRP) & Jaundice',
        'Congenital Heart Diseases (Boot-shaped, Egg-on-string, Snowman)',
        'Severe Acute Malnutrition (SAM) Protocols',
        'Croup vs Acute Epiglottitis',
      ],
      ophthalmology: [
        'Glaucoma (Open vs Angle-Closure Management)',
        'Cataract Types & Post-Op Complications',
        'Diabetic Retinopathy & Fundus Spotters (CRVO, CRAO)',
        'Neuro-ophthalmology & Pupillary Reflexes',
      ],
      ent: [
        'Tympanic Membrane Pathology, Otosclerosis & ASOM/CSOM',
        'Rinne & Weber Tuning Fork Tests',
        'Cholesteatoma & Deep Neck Infections',
        'Stridor & Epiglottitis vs Croup',
        'Epistaxis Management Algorithm',
      ],
      microbiology: [
        'Selective Media, Bacterial Staining & Culture',
        'Sterilization Controls & Autoclaving Standards',
        'Hepatitis B Serology Markers & Window Period',
        'HIV Staging & CD4 Opportunistic Infections',
        'Fungi (Mucor, Aspergillus, Candida) & Parasite Eggs/Cysts',
      ],
      fmt: [
        'Forensic Thanatology (Rigor & Livor Mortis, Algor Mortis)',
        'Firearm Ballistics & Injury Patterns',
        'Toxicology Antidotes (Organophosphates, Snake Bite, Opioids)',
        'Medical Jurisprudence, IPC/BNS Sections & Consent',
      ],
    },
  },
  {
    tier: 3,
    name: 'Rapid Recall & Clinical Allies',
    markRange: '70 Marks',
    description: 'Focus exclusively on volatile one-liners, high-yield diagnostic spotters, and classic anatomical relationships.',
    badgeColor: '#AF52DE',
    subjectIds: ['anatomy', 'physiology', 'biochemistry', 'dermatology', 'psychiatry', 'orthopedics', 'radiology', 'anesthesia', 'radiotherapy'],
    mustKnowTopics: {
      anatomy: [
        'Brachial Plexus (Erb vs Klumpke Palsy)',
        'Upper & Lower Limb Nerve Palsies (Foot Drop, Claw Hand, Wrist Drop)',
        'Cranial Nerve Foramina & Skull Base Syndromes',
        'Pharyngeal Arches, Pouches & Clefts Derivatives',
        'Dermatomes & Key Sensory Landmarks',
      ],
      physiology: [
        'Wiggers Diagram & Cardiac PV Loops',
        'Oxygen-Hemoglobin Dissociation Curve Shifts',
        'Acid-Base & Renal Clearance Mechanisms',
        'Countercurrent Multiplier & Glomerular Filtration',
        'Endocrine Negative Feedback Axes',
      ],
      biochemistry: [
        'Rate-Limiting Enzymes & Metabolic Cycles',
        'Vitamin Deficiencies & Biochemical Manifestations',
        'Glycogen Storage Diseases (Von Gierke, Pompe, McArdle)',
        'Lysosomal Storage Diseases (Gaucher, Niemann-Pick, Tay-Sachs)',
        'Inborn Errors of Metabolism & Lipoprotein Disorders',
      ],
      dermatology: [
        'Bullous Disorders (Pemphigus Vulgaris vs Bullous Pemphigoid)',
        'Sexually Transmitted Infections (STI Syndromic Color Kits)',
        'Leprosy Ridley-Jopling Classification & Reactions',
        'Psoriasis vs Lichen Planus Morphology',
      ],
      psychiatry: [
        'Schizophrenia vs Bipolar Disorder Diagnostic Criteria',
        'Extrapyramidal Symptoms (EPS) & Neuroleptic Malignant Syndrome (NMS)',
        'Lithium Toxicity & Mood Stabilizers',
        'Defense Mechanisms & Substance Dependence',
      ],
      orthopedics: [
        'Bone Tumors by Age & Classic X-Rays (Sunburst, Codman, Onion-skin, Soap-bubble)',
        'Pediatric Fractures & Dislocations (Colles, Smith, Monteggia, Galeazzi)',
        'Peripheral Nerve Compression & Compartment Syndrome',
        'Spinal Tuberculosis (Pott Spine)',
      ],
      radiology: [
        'Classic Chest X-Ray Signs (Pneumothorax, Sail Sign, Kerley B Lines)',
        'CT Head in Trauma (EDH vs SDH vs SAH)',
        'Barium Studies (Bird-beak, Corkscrew, Apple-core)',
        'Radiation Protection & Contrast Reactions',
      ],
      anesthesia: [
        'Mallampati Airway Assessment & Intubation Guidelines',
        'Capnography Waveforms (Curare Cleft, Shark-fin)',
        'Local Anesthetics & Lipid Rescue Protocol',
        'Malignant Hyperthermia & Dantrolene Dosing',
        'CPR Guidelines (BLS & ACLS Algorithms)',
      ],
      radiotherapy: [
        'Brachytherapy vs Teletherapy Sources (Co-60, Ir-192, I-131)',
        'Linear Accelerator (LINAC) & Radiation Units (Gy, Sv)',
        'Radiation Toxicity (Acute vs Late Effects & Radioprotectors)',
      ],
    },
  },
];

export const SPRINT_DAYS: SprintDay[] = [
  { title: 'Baseline · mixed diagnostic', subjects: [], focus: 'Diagnostic 50-question mixed set to establish baseline accuracy and pacing across disciplines.', questions: 50 },
  { title: 'Foundation & high-yield setup', subjects: ['medicine'], focus: 'Approach, common presentations, ECG, shock, fluids and emergency first steps.', questions: 50 },
  { title: 'Pre-sprint review & recall kickstart', subjects: ['surgery'], focus: 'Trauma triage, acute abdomen, burns Parkland formula, wound healing and core algorithms.', questions: 50 },
  { title: 'Obstetrics & Gynaecology · Part 1', subjects: ['obg'], focus: 'Antenatal care, labor partogram, eclampsia (Pritchard regimen), PPH algorithm and obstetric emergencies.', questions: 60 },
  { title: 'Obstetrics & Gynaecology · High-Yield Focus', subjects: ['obg'], focus: 'Labor/Partograph, AMTSL & PPH, Pritchard MgSO4, Previa vs Abruption, Contraception, Mullerian, Molar, Ca Cervix/Endometrium.', questions: 60 },
  { title: 'PSM / Community Medicine · Part 1 (Epidemiology & Biostats)', subjects: ['psm'], focus: '2x2 Screening (Sens/Spec/PPV/NPV), Cohort vs Case-Control, NIS Vaccines/Cold Chain/Open Vial, BMW Color Bins, NTEP/NVBDCP, Mortality formulas.', questions: 60 },
  { title: 'PSM / Community Medicine · Part 2 (Programs & Vaccines)', subjects: ['psm'], focus: 'NIS Vaccines, Cold Chain, Open Vial Policy, BMW Color Bins, NTEP, NVBDCP, and mortality/fertility formulas.', questions: 60 },
  { title: 'Biochemistry & FMT · Rapid Triage', subjects: ['biochemistry', 'fmt'], focus: 'Rate-limiting enzymes, Vitamins, Glycogen/Lysosomal storage diseases, Rigor/Livor mortis, Firearm ballistics, Toxicology antidotes, IPC/BNS.', questions: 60 },
  { title: 'Anatomy · High-Yield Relations & Foramina', subjects: ['anatomy'], focus: 'Brachial plexus (Erb/Klumpke), Limb nerve palsies, Skull foramina, Pharyngeal arches, Dermatomes.', questions: 60 },
  { title: 'Microbiology · Bugs, Stains & Serology', subjects: ['microbiology'], focus: 'Selective media & stains, Sterilization controls, Hep B serology, HIV CD4 infections, Fungi & Parasite eggs.', questions: 60 },
  { title: 'Pharmacology · DOCs, Antidotes & Tox', subjects: ['pharmacology'], focus: 'DOC master table, Specific Antidotes, Teratogenic drugs, Anti-TB/Anti-epileptic/Lithium/Digoxin toxicities, Zero-order kinetics.', questions: 60 },
  { title: 'Pathology & Physiology · Core Integration', subjects: ['pathology', 'physiology'], focus: 'Hypersensitivity I-IV, Translocations/Tumor markers, Nephritic/Nephrotic, Blood smears, Wiggers/PV loops, O2-Hb curve, ABG/Renal clearance.', questions: 60 },
  { title: 'General Surgery & Orthopedics · Trauma & Acute Care', subjects: ['surgery', 'orthopedics'], focus: 'ATLS/GCS/FAST, Parkland Burns, Acute abdomen, Pediatric fractures, Peripheral nerve injuries, Compartment syndrome.', questions: 60 },
  { title: 'General Surgery & Orthopedics · Systemic, Oncology & Tumors', subjects: ['surgery', 'orthopedics'], focus: 'Breast/Thyroid Ca, Hernias, Charcot triad/Courvoisier law, Volvulus X-rays, Bone tumors (Sunburst/Codman/Onion-skin/Soap-bubble), Named fractures.', questions: 60 },
  { title: 'Selective Medicine · High-Yield Heavyweights', subjects: ['medicine'], focus: 'ECG localization (STEMI/Blocks/Arrhythmias), ABG interpretation, DKA vs HHS, Hyperkalemia, Stroke CT, IE Duke criteria, Pleural effusion Light criteria, Status epilepticus.', questions: 65 },
  { title: 'Short 5 Blitz · Derma, Psych, Anaes, Radio, Radiotherapy', subjects: ['dermatology', 'psychiatry', 'anesthesia', 'radiology', 'radiotherapy'], focus: 'Pemphigus vs Pemphigoid, STI kits, EPS/NMS, Lithium, Mallampati/Capnography, Dantrolene/Lipid rescue, EDH vs SDH CT, CXR/Barium spotters, Co-60/Ir-192/I-131.', questions: 65 },
  { title: 'Pediatrics, ENT & Ophthalmology · Clinical Triad', subjects: ['pediatrics', 'ent', 'ophthalmology'], focus: 'Milestones, NRP/Jaundice, CHD X-rays (Boot-shaped/Egg-on-string/Snowman), SAM, Croup vs Epiglottitis, Glaucoma vs Cataract, Fundus spotters, Cholesteatoma, Otosclerosis, Rinne/Weber.', questions: 60 },
  { title: 'Full 300Q NBEMS Recall Mock', subjects: [], focus: 'Full 300-question mock exam across two 150-minute timed blocks. Simulate real exam pacing (1 minute per question). Answer every question (zero negative marking). Review all misses and guesses.', questions: 300, fullMock: true, checkpoint: true },
  { title: '200-IBQ Visual Spotter Marathon & Weak-Subject Patch', subjects: [], focus: 'Target 200 high-yield image-based questions (IBQs), ECG spotters, histology slides, radiology signs, instruments, and surgical specimens. Patch recurring traps from yesterday’s 300Q mock.', questions: 200, checkpoint: true },
  { title: 'Exam Eve Volatile Tables & Rest', subjects: [], focus: 'Review only high-yield volatile tables, drug of choice lists, tumor markers, IPC legal sections, and your personalized Error Vault. Stop early by 6 PM, verify hall ticket/ID proofs, and protect sleep.', questions: 30, restDay: true },
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
    if (!hasEvidence) {
      return SPRINT_DAYS[index];
    }

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
      focus: `Prioritize ${details.join('; ')}. Review missed and guessed questions, then retrieve the key rules without notes.`,
    };
  };

  const days = [...SPRINT_DAYS];
  if (!hasEvidence) {
    return days;
  }

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
