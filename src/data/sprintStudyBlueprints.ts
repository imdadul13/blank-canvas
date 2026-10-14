import { FMGE_SUBJECTS } from './fmgeSubjects';

export interface BlueprintTopic {
  id: string; // e.g. 'obg-2'
  name: string;
  subjectId: string;
  priority: 'must_study' | 'if_time_remains';
  estimatedMinutes: number;
  coreConcepts: string[];
  clinicalTraps?: string[];
  visualConceptKey?: string;
}

export interface DailyStudyBlueprint {
  dayIndex: number;
  dateStr: string; // YYYY-MM-DD
  title: string;
  subjects: string[];
  focus: string;
  targetHours: number;
  targetQuestions: number;
  missionStatement: string;
  mustStudyTopics: BlueprintTopic[];
  ifTimeRemainsTopics: BlueprintTopic[];
  activeRecallGuidance: string;
  questionPracticeGuidance: string;
  errorRemediationGuidance: string;
  revisionGuidance: string;
  isFullMock?: boolean;
  isRestDay?: boolean;
  isExamDay?: boolean;
}

export const SPRINT_STUDY_BLUEPRINTS: DailyStudyBlueprint[] = [
  // Day 0 (2026-10-11): Baseline Diagnostic
  {
    dayIndex: 0,
    dateStr: '2026-10-11',
    title: 'Baseline Diagnostic & Pacing Sweep',
    subjects: ['medicine', 'surgery', 'obg', 'psm'],
    focus: 'Timed 50-question diagnostic baseline to establish test rhythm and gauge discipline strengths.',
    targetHours: 4,
    targetQuestions: 50,
    missionStatement: 'Measure your baseline timing at 60 seconds per question with zero negative marking. Identify initial gap subjects.',
    mustStudyTopics: [
      {
        id: 'psm-3',
        name: 'Screening Tests (2x2 Table, PPV/NPV)',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Sensitivity = TP / (TP + FN); Specificity = TN / (TN + FP)',
          'Positive Predictive Value (PPV) depends heavily on disease prevalence in the tested population',
          'Likelihood ratio positive = Sensitivity / (1 - Specificity)',
        ],
        clinicalTraps: ['Prevalence increases PPV but leaves Sensitivity and Specificity unchanged.'],
      },
      {
        id: 'obg-2',
        name: 'Pre-eclampsia & Pritchard MgSO4 Protocol',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Loading dose: 4g IV (20% solution over 5-10 min) + 10g IM (5g in each buttock, 50% solution with 1% lignocaine)',
          'Maintenance dose: 5g IM 4-hourly in alternate buttocks after checking patellar reflexes, respiratory rate (>16/min), and urine output (>30 mL/hr)',
          'Antidote for magnesium toxicity: 10 mL of 10% Calcium Gluconate IV slowly over 10 minutes',
        ],
        clinicalTraps: ['Loss of patellar knee jerk is the earliest sign of MgSO4 toxicity (occurs at 8-10 mEq/L).'],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'med-1',
        name: 'ECG STEMI Localization',
        subjectId: 'medicine',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Inferior wall MI = Leads II, III, aVF (Right Coronary Artery)',
          'Anterior / Septal MI = Leads V1-V4 (Left Anterior Descending Artery)',
          'Lateral wall MI = Leads I, aVL, V5, V6 (Left Circumflex Artery)',
        ],
        visualConceptKey: 'med:ecg_inferior_stemi',
      },
    ],
    activeRecallGuidance: 'Write out the 2x2 table and Pritchard dosage without looking at notes.',
    questionPracticeGuidance: 'Complete a timed 50-MCQ baseline set. Mark any question where you had to guess.',
    errorRemediationGuidance: 'Log any misses into the Error Vault to seed your revision priorities.',
    revisionGuidance: 'Review your overall baseline accuracy and calibrate your daily study target.',
  },

  // Day 1 (2026-10-12): Foundation & Emergency Medicine
  {
    dayIndex: 1,
    dateStr: '2026-10-12',
    title: 'Emergency Medicine & Shock Resuscitation',
    subjects: ['medicine'],
    focus: 'Shock classification, fluid resuscitation, DKA vs HHS protocols, and emergency ACLS rhythms.',
    targetHours: 6,
    targetQuestions: 50,
    missionStatement: 'Master life-threatening acute algorithms that NBE tests across medicine and emergency care.',
    mustStudyTopics: [
      {
        id: 'med-3',
        name: 'Diabetic Ketoacidosis (DKA) vs HHS Management',
        subjectId: 'medicine',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Fluid of choice: 0.9% Normal Saline (1-1.5 L in the first hour)',
          'Regular Insulin infusion: 0.1 units/kg/hr IV once serum potassium is >3.3 mEq/L',
          'Add 5% Dextrose when blood glucose drops below 200 mg/dL in DKA to prevent cerebral edema while clearing ketosis',
        ],
        clinicalTraps: ['Never start insulin if potassium is <3.3 mEq/L; replace potassium first to prevent fatal arrhythmias.'],
      },
      {
        id: 'med-1',
        name: 'Arrhythmias & Conduction Blocks',
        subjectId: 'medicine',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          '1st Degree AV Block = PR interval > 0.20s (5 small squares), constant',
          'Mobitz Type I (Wenckebach) = Progressive PR lengthening until a dropped QRS; benign nodal lesion',
          'Mobitz Type II = Constant PR interval with sudden dropped QRS; infranodal (His-Purkinje), requires pacemaker',
          '3rd Degree (Complete) Heart Block = Complete AV dissociation; P waves and QRS complexes march independently',
        ],
        visualConceptKey: 'med:ecg_complete_heart_block',
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'med-2',
        name: 'Acute Coronary Syndromes & Heart Failure',
        subjectId: 'medicine',
        priority: 'if_time_remains',
        estimatedMinutes: 30,
        coreConcepts: [
          'Primary PCI door-to-balloon time goal: <90 minutes; Fibrinolytic door-to-needle: <30 minutes',
          'Troponin I is the most sensitive and specific biomarker (elevated for 7-10 days); CK-MB detects re-infarction',
        ],
      },
    ],
    activeRecallGuidance: 'Sketch the AV block progression and write the electrolyte replacement criteria for DKA.',
    questionPracticeGuidance: 'Target 50 cardiology and metabolic MCQs. Pay special attention to ECG image questions.',
    errorRemediationGuidance: 'Check whether your misses were due to misreading the ECG lead or formula confusion.',
    revisionGuidance: 'Flag DKA fluid protocol in your Revision Matrix as R1 complete once secure.',
  },

  // Day 2 (2026-10-13): Pre-sprint Review & Acute Surgery
  {
    dayIndex: 2,
    dateStr: '2026-10-13',
    title: 'Trauma Triage & Acute Surgical Protocols',
    subjects: ['surgery'],
    focus: 'ATLS primary survey, burns Parkland formula, acute abdomen, and surgical fluid balance.',
    targetHours: 6,
    targetQuestions: 50,
    missionStatement: 'Consolidate the surgical core before beginning the primary sprint subject sequence.',
    mustStudyTopics: [
      {
        id: 'surg-1',
        name: 'ATLS Primary Survey & Trauma Triage',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'ABCDE sequence: Airway with cervical spine protection → Breathing → Circulation & hemorrhage control → Disability (GCS) → Exposure & hypothermia prevention',
          'Tension Pneumothorax: Immediate needle thoracostomy at 5th intercostal space anterior axillary line (or 2nd ICS MCL) before chest tube insertion',
          'FAST windows: Hepatorenal (Morison pouch), Splenorenal, Pelvic (pouch of Douglas), and Subxiphoid pericardial window',
        ],
        visualConceptKey: 'rad:tension_pneumothorax_jpg',
      },
      {
        id: 'surg-2',
        name: 'Burns & Modified Parkland Formula',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Parkland Formula: Total Ringer Lactate in first 24h = 4 mL × Body Weight (kg) × % TBSA burn',
          'Give 50% of the calculated volume in the first 8 hours from the time of burn injury, and the remaining 50% over the next 16 hours',
          'Urine output monitoring target: 0.5 to 1.0 mL/kg/hr in adults (1-2 mL/kg/hr in electrical burns to clear myoglobin)',
        ],
        clinicalTraps: ['The 8-hour clock begins at the TIME OF BURN INJURY, not at the time of hospital admission.'],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'surg-5',
        name: 'Acute Abdomen & Appendicitis Diagnosis',
        subjectId: 'surgery',
        priority: 'if_time_remains',
        estimatedMinutes: 30,
        coreConcepts: [
          'Alvarado score criteria (MANTRELS: Migration, Anorexia, Nausea, Tenderness, Rebound, Elevation temp, Leukocytosis, Shift left)',
          'Pneumoperitoneum: Gas under right dome of diaphragm on erect chest X-ray',
        ],
        visualConceptKey: 'rad:chest_xray_pneumoperitoneum',
      },
    ],
    activeRecallGuidance: 'Recite the Rule of Nines percentages for head, chest, abdomen, each arm, and each leg.',
    questionPracticeGuidance: 'Practice 50 surgery calculation and trauma scenario MCQs.',
    errorRemediationGuidance: 'Review calculation mistakes in burns formulas. Note whether you factored time from burn.',
    revisionGuidance: 'Schedule trauma triage for quick R1 revisit in 3 days.',
  },

  // Day 3 (2026-10-14): Obstetrics Core
  {
    dayIndex: 3,
    dateStr: '2026-10-14',
    title: 'Obstetrics Core · Labor, Eclampsia & PPH',
    subjects: ['obg'],
    focus: 'High-weight obstetric emergencies: Pritchard regimen, partogram milestones, PPH algorithms, and APH.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Lock down the highest-weight obstetric algorithms. OBG provides ~30 marks in the exam.',
    mustStudyTopics: [
      {
        id: 'obg-2',
        name: 'Preeclampsia, Eclampsia & MgSO4 Pritchard Regimen',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Diagnostic criteria: BP >= 140/90 mmHg on two occasions 4 hours apart after 20 weeks gestation + proteinuria or signs of end-organ damage',
          'MgSO4 Pritchard: 4g IV + 10g IM loading; 5g IM every 4 hours maintenance',
          'Definitive management for severe preeclampsia/eclampsia: Delivery of the baby regardless of gestational age once maternal condition is stabilized',
        ],
        clinicalTraps: ['Magnesium toxicity: Loss of knee jerks (8-10 mEq/L) precedes respiratory depression (>12 mEq/L).'],
      },
      {
        id: 'obg-3',
        name: 'Normal Labor, Mechanism & Modified WHO Partogram',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Active stage of labor starts at 5 cm cervical dilatation',
          'Alert Line: Cervical dilatation rate of 1 cm/hour; Action Line: 4 hours to the right of the Alert Line',
          'Cardinal movements of labor: Engagement → Descent → Flexion → Internal rotation → Extension → Restitution → External rotation → Expulsion',
        ],
      },
      {
        id: 'obg-4',
        name: 'Postpartum Hemorrhage (PPH) & Management Algorithm',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Definition: Blood loss > 500 mL following vaginal delivery or > 1000 mL following cesarean delivery',
          'Most common cause: Uterine Atony (80%). Management: Uterine massage + Oxytocin (10 IU IM / 20-40 IU in IV infusion)',
          'Second-line uterotonics: Methylergonovine (0.2 mg IM, contraindicated in hypertension), Carboprost / PGF2alpha (contraindicated in asthma)',
          'Surgical compression: B-Lynch brace suture for refractory atonic PPH',
        ],
        clinicalTraps: ['Methylergometrine is contraindicated in Preeclampsia and heart disease.'],
      },
      {
        id: 'obg-5',
        name: 'Obstetric Emergencies - APH & Cord Prolapse',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Placenta Previa: Painless, causeless, recurrent bright red bleeding. Avoid digital vaginal examination',
          'Abruptio Placentae: Painful, dark red bleeding with woody hard, tender uterus. Couvelaire uterus',
          'Cord Prolapse: Immediate knee-chest or exaggerated Trendelenburg position; elevate presenting part with gloved hand; emergency cesarean delivery',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'obg-1',
        name: 'Physiology of Pregnancy & Antenatal Care',
        subjectId: 'obg',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Physiologic changes: Plasma volume increases by 50%, RBC mass by 20% → physiologic hemodilution anemia',
          'Naegele rule for EDD: First day of Last Menstrual Period (LMP) + 9 calendar months + 7 days',
        ],
      },
      {
        id: 'obg-6',
        name: 'Medical Disorders in Pregnancy - GDM & Anemia',
        subjectId: 'obg',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'DIPSI diagnostic criteria: 75g oral glucose load irrespective of last meal; 2-hour plasma glucose >= 140 mg/dL',
          'Target fasting glucose in pregnancy: <95 mg/dL; 1-hour postprandial: <140 mg/dL; 2-hour: <120 mg/dL',
        ],
      },
    ],
    activeRecallGuidance: 'State the Pritchard dosing schedule and write down the four causes of PPH (4 Ts: Tone, Trauma, Tissue, Thrombin).',
    questionPracticeGuidance: 'Solve 60 OBG MCQs focusing on labor curves, drug contraindications, and emergency obstetric management.',
    errorRemediationGuidance: 'Review your mistakes in PPH uterotonics contraindications and placenta previa vs abruption tables.',
    revisionGuidance: 'Check off R1 in Revision Matrix for Pritchard Protocol and PPH algorithms.',
  },

  // Day 4 (2026-10-15): Gynaecology Core
  {
    dayIndex: 4,
    dateStr: '2026-10-15',
    title: 'Gynaecology Core · Cancers, Contraception & PCOS',
    subjects: ['obg'],
    focus: 'Cervical cancer screening & FIGO staging, contraceptive methods & MTP Act 2021, ovarian tumors, PCOS.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master the high-yield gynaecology topics tested repeatedly in FMGE clinical vignettes.',
    mustStudyTopics: [
      {
        id: 'obg-8',
        name: 'Cervical Cancer Screening & FIGO Staging',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'HPV high-risk strains: HPV 16 (most oncogenic, squamous cell CA) and HPV 18 (adenocarcinoma)',
          'Screening guidelines: Liquid-based cytology (LBC) + HPV co-testing starting at age 30',
          'Transformation zone is the most common site of origin (squamocolumnar junction)',
          'FIGO Stage I: Confined to cervix; Stage II: Extends beyond uterus but not to pelvic wall or lower third of vagina; Stage III: Pelvic wall or lower 1/3 vagina or hydronephrosis; Stage IV: Bladder/rectal mucosa or distant metastases',
        ],
      },
      {
        id: 'obg-7',
        name: 'Contraception & MTP Act (2021 Amendment)',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'MTP Act 2021: Upper limit for termination of pregnancy increased to 24 weeks for vulnerable categories (survivors of rape, incest, minors, fetal abnormalities)',
          'One RMP opinion required up to 20 weeks; two RMPs required between 20-24 weeks; Medical Board opinion for severe fetal abnormalities beyond 24 weeks',
          'Emergency contraception: Levonorgestrel 1.5 mg within 72 hours; Copper-T IUD is the most effective post-coital method up to 5 days',
        ],
        clinicalTraps: ['Combined oral contraceptive pills are contraindicated in women >35 years who smoke or have history of DVT.'],
      },
      {
        id: 'obg-10',
        name: 'Ovarian Tumors - Germ Cell vs Epithelial',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Most common ovarian tumor in young women (<30 years): Mature Cystic Teratoma (Dermoid Cyst)',
          'Most common malignant germ cell tumor: Dysgerminoma (marker: LDH, radiosensitive)',
          'Endodermal Sinus (Yolk Sac) Tumor: Schiller-Duval bodies, marker: Alpha-Fetoprotein (AFP)',
          'Granulosa Cell Tumor: Call-Exner bodies, produces Estrogen → precocious puberty / postmenopausal bleeding',
        ],
        visualConceptKey: 'obg:hydatidiform_mole_jpg',
      },
      {
        id: 'obg-13',
        name: 'PCOS (Rotterdam Criteria) & Endometriosis',
        subjectId: 'obg',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Rotterdam Criteria (2 of 3 required): 1. Oligo- or anovulation; 2. Clinical/biochemical hyperandrogenism; 3. Polycystic ovaries on USG ("string of pearls" appearance, >=20 follicles)',
          'LH:FSH ratio is characteristically elevated (2:1 or 3:1)',
          'Endometriosis: Dysmenorrhea, dyspareunia, dyschezia; "Powder-burn" lesions and chocolate cysts of ovary',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'obg-9',
        name: 'Endometrial Hyperplasia & Carcinoma',
        subjectId: 'obg',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Cardinal symptom: Postmenopausal bleeding. Mandatory investigation: Transvaginal USG followed by endometrial biopsy',
          'Cutoff for endometrial thickness in postmenopausal women without HRT: > 4 mm warrants biopsy',
        ],
      },
      {
        id: 'obg-12',
        name: 'Abnormal Uterine Bleeding (PALM-COEIN)',
        subjectId: 'obg',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Structural causes (PALM): Polyp, Adenomyosis, Leiomyoma, Malignancy',
          'Non-structural causes (COEIN): Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not classified',
        ],
      },
    ],
    activeRecallGuidance: 'List the tumor markers for Dysgerminoma, Yolk Sac Tumor, and Choriocarcinoma from memory.',
    questionPracticeGuidance: 'Complete 60 MCQs on FIGO staging, MTP rules, and ovarian tumor histology images.',
    errorRemediationGuidance: 'Verify that you can cleanly distinguish Call-Exner bodies from Schiller-Duval bodies.',
    revisionGuidance: 'Mark OBG module R1 complete in your Revision Matrix.',
  },

  // Day 5 (2026-10-16): PSM Part 1 - Epidemiology & Biostatistics
  {
    dayIndex: 5,
    dateStr: '2026-10-16',
    title: 'PSM · Epidemiology & Biostatistics',
    subjects: ['psm'],
    focus: 'Core quantitative scoring section: Study designs, screening metrics, significance tests, and bias.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master the mathematical questions in PSM. These are guaranteed scoring marks with no ambiguity.',
    mustStudyTopics: [
      {
        id: 'psm-3',
        name: 'Screening Tests - 2x2 Table, Sensitivity, Specificity & PPV',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Sensitivity = TP / (TP + FN); False Negative Rate = 1 - Sensitivity',
          'Specificity = TN / (TN + FP); False Positive Rate = 1 - Specificity',
          'Positive Predictive Value (PPV) = TP / (TP + FP); increases with higher disease prevalence',
          'Negative Predictive Value (NPV) = TN / (TN + FN); decreases with higher disease prevalence',
        ],
        clinicalTraps: ['Screening tests require high Sensitivity (to rule out); Diagnostic tests require high Specificity (to rule in).'],
      },
      {
        id: 'psm-2',
        name: 'Epidemiological Study Designs & Association Metrics',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Case-Control: Retrospective; measures Exposure Odds Ratio (OR = ad/bc); best for rare diseases',
          'Cohort Study: Prospective/retrospective; measures Incidence, Relative Risk (RR) and Attributable Risk (AR); best for rare exposures',
          'Randomized Controlled Trial (RCT): Gold standard for establishing causality; utilizes Blinding and Randomization to eliminate bias',
          'Cross-Sectional Study: Measures Prevalence; provides a snapshot in time; cannot determine temporal sequence',
        ],
      },
      {
        id: 'psm-4',
        name: 'Biostatistics - Normal Curve & Tests of Significance',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Normal Distribution (Gaussian): Mean = Median = Mode; Mean +/- 1 SD = 68.3%, +/- 2 SD = 95.4%, +/- 3 SD = 99.7%',
          'Chi-Square Test: Compares proportions / categorical qualitative data (e.g., smokers vs non-smokers)',
          'Student t-Test: Compares means of quantitative continuous variables between two groups',
          'ANOVA (F-test): Compares means of quantitative variables among three or more groups',
        ],
      },
      {
        id: 'psm-1',
        name: 'Epidemiology - Levels of Prevention',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 20,
        coreConcepts: [
          'Primordial: Prevention of emergence of risk factors (e.g., lifestyle education in children)',
          'Primary: Action taken prior to onset of disease (e.g., immunization, masks, nutritional supplementation)',
          'Secondary: Early detection and prompt treatment to arrest disease (e.g., screening tests, Pap smear, sputum examination)',
          'Tertiary: Limitation of disability and rehabilitation (e.g., physiotherapy after stroke, reconstructive surgery)',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'psm-8',
        name: 'Demography, Vital Statistics & Demographic Cycle',
        subjectId: 'psm',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Infant Mortality Rate (IMR): Number of deaths of infants under 1 year per 1,000 live births',
          'Maternal Mortality Ratio (MMR): Maternal deaths per 100,000 live births (denominator is live births, not total population)',
          'Demographic Stage of India: Late Expanding (Stage 3 - birth rate falling, death rate rapidly low)',
        ],
      },
      {
        id: 'psm-11',
        name: 'Occupational Health & Pneumoconiosis',
        subjectId: 'psm',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Silicosis: Eggshell calcification of hilar lymph nodes; increases risk of pulmonary tuberculosis',
          'Asbestosis: Ferruginous bodies in sputum, lower lobe fibrosis, mesothelioma risk',
          'Byssinosis: "Monday morning chest tightness" caused by cotton textile dust exposure',
        ],
      },
    ],
    activeRecallGuidance: 'Draw the 2x2 table from memory, calculate PPV with a 10% prevalence, and state which significance test to use for 3 treatment groups.',
    questionPracticeGuidance: 'Solve 60 MCQs concentrating strictly on biostatistics calculations, study design discrimination, and prevention levels.',
    errorRemediationGuidance: 'Confirm you do not confuse Odds Ratio formula with Relative Risk formula.',
    revisionGuidance: 'Lock in formulas in your personal cheat sheet for rapid eve revision.',
  },

  // Day 6 (2026-10-17): PSM Part 2 - National Health Programs & Vaccines
  {
    dayIndex: 6,
    dateStr: '2026-10-17',
    title: 'PSM · National Programs, Vaccines & Waste Management',
    subjects: ['psm'],
    focus: 'National Immunization Schedule, cold chain equipment, NTEP algorithms, and Biomedical Waste rules.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master the high-yield public health guidelines that appear consistently on every FMGE paper.',
    mustStudyTopics: [
      {
        id: 'psm-5',
        name: 'Immunization Schedule, Cold Chain & VVM Stages',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Birth vaccines: BCG (0.05 mL intradermal, left upper arm), OPV zero dose (2 drops oral), Hepatitis B birth dose (0.5 mL IM, anterolateral thigh within 24h)',
          'Cold chain temperature range: +2°C to +8°C for walk-in coolers and deep freezers / ILRs',
          'Most heat-sensitive vaccine: Oral Polio Vaccine (OPV); Most freeze-sensitive: Hepatitis B, Td/TT, DPT',
          'Vaccine Vial Monitor (VVM): Discard vaccine when the inner square matches or is darker than the outer circle (Stages 3 and 4)',
        ],
      },
      {
        id: 'psm-6',
        name: 'NTEP (Tuberculosis) & Vector-Borne Disease Control',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Diagnostic test of choice under NTEP: CBNAAT / GeneXpert (detects M. tuberculosis and Rifampicin resistance simultaneously within 2 hours)',
          'Daily fixed-dose combination regimen (FDC): 2 months HRZE (Intensive phase) + 4 months HRE (Continuation phase)',
          'Nikshay portal: Direct benefit transfer (DBT) of Rs 500/month for nutritional support (Nikshay Poshan Yojana)',
        ],
      },
      {
        id: 'psm-10',
        name: 'Biomedical Waste (BMW) Management 2016 Rules',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Yellow bag: Anatomical waste, placenta, soiled cotton/gauze, expired cytotoxic drugs, microbiology cultures (Treatment: Incineration / Plasma pyrolysis)',
          'Red bag: Contaminated recyclable plastics: IV bottles, tubing, catheters, urine bags, syringes without needles (Treatment: Autoclaving / Microwaving then shredding)',
          'White translucent puncture-proof container: Sharps, needles, scalpels, blades (Treatment: Autoclaving and dry heat sterilization)',
          'Blue cardboard box / container: Broken glassware, ampoules, metallic orthopedic implants (Treatment: Disinfection with 1-2% sodium hypochlorite / Autoclaving)',
        ],
        clinicalTraps: ['Never put needles or scalpels into Yellow or Red bags; sharps go exclusively into White puncture-proof containers.'],
      },
      {
        id: 'psm-12',
        name: 'National Health Programs - NVBDCP & RMNCH+A',
        subjectId: 'psm',
        priority: 'must_study',
        estimatedMinutes: 20,
        coreConcepts: [
          'NVBDCP vectors: Anopheles (Malaria), Culex (Lymphatic filariasis, Japanese Encephalitis), Aedes (Dengue, Chikungunya, Zika), Phlebotomus (Kala-Azar)',
          'National Deworming Day: Bi-annual administration of Albendazole 400 mg (children 1-19 years)',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'psm-9',
        name: 'Nutrition & Severe Acute Malnutrition (SAM)',
        subjectId: 'psm',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'SAM diagnostic criteria: Weight-for-height < -3 Z scores, or mid-upper arm circumference (MUAC) < 115 mm, or presence of bilateral pitting edema',
          'Vitamin A prophylaxis schedule: Total 9 doses starting at 9 months with Measles (100,000 IU), then 200,000 IU every 6 months up to 5 years',
        ],
      },
      {
        id: 'psm-7',
        name: 'Non-Communicable Diseases & Screening Guidelines',
        subjectId: 'psm',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'National Program for Prevention & Control of Cancer, Diabetes, CVD & Stroke (NPCDCS)',
          'Visual Inspection with Acetic Acid (VIA) for cervical cancer screening in primary health centers',
        ],
      },
    ],
    activeRecallGuidance: 'Recite the color coding for disposal of a used Foley catheter, a placenta, an amputated limb, and a suture needle.',
    questionPracticeGuidance: 'Practice 60 MCQs covering vaccine temperature rules, VVM scenarios, and BMW color matching.',
    errorRemediationGuidance: 'Ensure you never miss the distinction between Red (tubing/plastics) and Yellow (soiled anatomical) waste.',
    revisionGuidance: 'PSM is complete. Schedule a rapid 15-minute formula flash review for Day 17.',
  },

  // Day 7 (2026-10-18): Biochemistry + FMT
  {
    dayIndex: 7,
    dateStr: '2026-10-18',
    title: 'Biochemistry + Forensic Medicine & Toxicology',
    subjects: ['biochemistry', 'fmt'],
    focus: 'Inborn errors of metabolism, enzyme blocks, toxicology antidotes, postmortem changes, and medical law.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Combine the high-yield metabolic pathways with forensic toxicology for a compact 27-mark day.',
    mustStudyTopics: [
      {
        id: 'bio-1',
        name: 'Inborn Errors of Metabolism & Enzyme Deficiencies',
        subjectId: 'biochemistry',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Phenylketonuria (PKU): Phenylalanine Hydroxylase deficiency → mousy odor of urine, intellectual disability, hypopigmentation',
          'Alkaptonuria: Homogentisate Oxidase deficiency → urine turns black on standing, ochronosis of cartilage and sclera',
          'Maple Syrup Urine Disease (MSUD): Branched-chain alpha-keto acid dehydrogenase deficiency → sweet maple syrup burnt sugar odor of urine',
          'Homocystinuria: Cystathionine beta-synthase deficiency → downward ectopia lentis, marfanoid habitus, thromboembolic events',
        ],
        clinicalTraps: ['Downward lens subluxation occurs in Homocystinuria; Upward lens subluxation occurs in Marfan Syndrome.'],
      },
      {
        id: 'fmt-6',
        name: 'Forensic Toxicology - Organophosphates, Aluminum Phosphide & Snake Bites',
        subjectId: 'fmt',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Organophosphates: Inhibit acetylcholinesterase → DUMBELS symptoms (Diarrhea, Urination, Miosis, Bradycardia, Emesis, Lacrimation, Salivation). Antidote: Atropine (titrate until clear chest) + Pralidoxime (2-PAM)',
          'Aluminum Phosphide (Celphos): Releases phosphine gas with garlic / decaying fish odor; inhibits cytochrome c oxidase; no specific antidote, gastric lavage with potassium permanganate (KMnO4)',
          'Viperidae (Vipers): Vasculotoxic & hemotoxic → local swelling, coagulopathy, bleeding. Elapidae (Cobras, Kraits): Neurotoxic → ptosis, respiratory paralysis',
        ],
      },
      {
        id: 'fmt-1',
        name: 'Forensic Thanatology - Postmortem Changes & Rigor Mortis',
        subjectId: 'fmt',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Rigor Mortis: Rule of 12 (appears in 12 hours, stays 12 hours, disappears in 12 hours); follows Nysten rule (starts in eyelids, then jaw, neck, trunk, limbs)',
          'Postmortem Lividity (Hypostasis): Fixed after 6-8 hours; Cherry red in Carbon Monoxide, Bright red in Cyanide, Chocolate brown in Methemoglobin',
          'Putrefaction earliest external sign: Greenish discoloration of skin over the right iliac fossa (cecum)',
        ],
      },
      {
        id: 'bio-5',
        name: 'Vitamins & Metabolic High-Yield Roles',
        subjectId: 'biochemistry',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Thiamine (B1): Cofactor for Pyruvate Dehydrogenase, Alpha-ketoglutarate Dehydrogenase, Transketolase. Deficiency: Wernicke-Korsakoff syndrome, Beriberi',
          'Niacin (B3): Synthesized from Tryptophan. Deficiency: Pellagra (4 Ds: Diarrhea, Dermatitis, Dementia, Death)',
          'Cobalamin (B12): Methylmalonic acid and Homocysteine both elevated; causes Subacute Combined Degeneration of spinal cord (unlike Folate deficiency)',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'fmt-3',
        name: 'Firearm & Explosive Injuries',
        subjectId: 'fmt',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Contact range: Muzzle imprint, burning, singeing of hair, cherry red margins',
          'Close range: Tattooing (unburnt powder grains embedded in dermis; cannot be washed off)',
          'Intermediate range: Stippling / powder fouling (can be wiped away)',
        ],
      },
      {
        id: 'fmt-10',
        name: 'Medical Jurisprudence, Consent & IPC Sections',
        subjectId: 'fmt',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Volenti non fit injuria: No injury is done to one who consents willingly',
          'Res ipsa loquitur: The thing speaks for itself (rule of evidence in gross medical negligence)',
          'Age of consent for medical examination: 12 years (treatment), 18 years (independent surgical consent)',
        ],
      },
    ],
    activeRecallGuidance: 'Write down the classic odor and specific antidote for Cyanide, OP poisoning, Paracetamol, and Opioids.',
    questionPracticeGuidance: 'Solve 60 MCQs split evenly between inborn errors of metabolism and forensic toxicology/thanatology.',
    errorRemediationGuidance: 'Review poisoning vignettes where students frequently mistake organophosphate signs for opioid overdose.',
    revisionGuidance: 'Mark Biochem & FMT complete in Revision Matrix.',
  },

  // Day 8 (2026-10-19): Anatomy - Nerves & Relations
  {
    dayIndex: 8,
    dateStr: '2026-10-19',
    title: 'Anatomy · Nerve Lesions, Spaces & Skull Base',
    subjects: ['anatomy'],
    focus: 'Brachial plexus injuries, lower limb nerve palsies, cranial nerve exits, inguinal canal, and brainstem pathways.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Focus on clinical anatomy, nerve lesions, and spatial relationships that NBE questions rely upon.',
    mustStudyTopics: [
      {
        id: 'anat-1',
        name: 'Upper Limb - Brachial Plexus & Nerve Injuries',
        subjectId: 'anatomy',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Erb-Duchenne Palsy: Upper trunk injury (C5, C6). "Waiter\'s tip" / "Policeman\'s tip" hand posture (arm adducted, internally rotated; forearm pronated, wrist flexed)',
          'Klumpke Palsy: Lower trunk injury (C8, T1). True "Claw Hand" with Horner Syndrome (damage to T1 sympathetic fibers)',
          'Radial Nerve Injury: Wrist Drop (injury at spiral groove of humerus; triceps spared)',
          'Median Nerve Injury: "Ape Hand" / "Hand of Benediction"; loss of thumb opposition',
          'Ulnar Nerve Injury: Claw hand deformity involving 4th and 5th digits; positive Froment sign (Adductor pollicis paralysis)',
        ],
        visualConceptKey: 'anat:brachial_plexus_c5_c6',
      },
      {
        id: 'anat-4',
        name: 'Lower Limb - Knee Joint & Nerve Lesions',
        subjectId: 'anatomy',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Common Peroneal (Fibular) Nerve: Winds around the neck of the fibula; injury causes Foot Drop (loss of dorsiflexion and eversion) and sensory loss on dorsum of foot',
          'Tibial Nerve: Injury causes loss of plantar flexion and inversion; sensory loss over the sole of foot',
          'Unholy Triad of O\'Donoghue: Injury to Anterior Cruciate Ligament (ACL), Medial Collateral Ligament (MCL), and Medial Meniscus',
        ],
        visualConceptKey: 'anat:knee_cruciate_ligaments',
      },
      {
        id: 'anat-10',
        name: 'Head & Neck - Cranial Nerve Foramina & Dural Sinuses',
        subjectId: 'anatomy',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Superior Orbital Fissure: Cranial Nerves III, IV, V1 (Ophthalmic), VI, and superior ophthalmic vein',
          'Foramen Rotundum: Maxillary nerve (V2); Foramen Ovale: Mandibular nerve (V3), Accessory meningeal artery, Lesser petrosal nerve, Emissary vein (MALE)',
          'Jugular Foramen: Cranial Nerves IX, X, XI, and Internal Jugular Vein',
          'Cavernous Sinus structures in lateral wall: CN III, IV, V1, V2; Structure passing through center: Internal Carotid Artery and CN VI',
        ],
      },
      {
        id: 'anat-12',
        name: 'Neuroanatomy - Brainstem & Circle of Willis',
        subjectId: 'anatomy',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Lateral Medullary Syndrome (Wallenberg): Occlusion of PICA; ipsilateral ataxia, loss of facial pain/temp, Horner syndrome, dysphagia, hoarseness; contralateral loss of body pain/temp',
          'Medial Medullary Syndrome: Anterior spinal artery occlusion; ipsilateral tongue paralysis (CN XII), contralateral hemiparesis, contralateral loss of vibration/proprioception',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'anat-7',
        name: 'Abdomen - Inguinal Canal & Hernia Anatomy',
        subjectId: 'anatomy',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Hesselbach Triangle: Inguinal ligament (inferior), Inferior epigastric vessels (lateral), Rectus abdominis lateral border (medial). Site of Direct Inguinal Hernia (medial to inferior epigastric)',
          'Indirect Inguinal Hernia: Enters deep inguinal ring (lateral to inferior epigastric vessels)',
        ],
      },
      {
        id: 'anat-13',
        name: 'Embryology - Pharyngeal Arches & Heart Development',
        subjectId: 'anatomy',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          '1st Arch: Mandible, Malleus, Incus, Muscles of Mastication (CN V3)',
          '2nd Arch: Stapes, Styloid, Reichert cartilage, Muscles of Facial Expression (CN VII)',
          '3rd Arch: Greater horn of hyoid, Stylopharyngeus (CN IX)',
          '4th & 6th Arches: Laryngeal cartilages, Intrinsic laryngeal muscles (CN X - superior and recurrent laryngeal nerves)',
        ],
      },
    ],
    activeRecallGuidance: 'Sketch the brachial plexus trunks, divisions, and cords, and name the nerve through the carpal tunnel.',
    questionPracticeGuidance: 'Solve 60 anatomy MCQs focusing on nerve injuries, motor deficits, and skull base foramina matching.',
    errorRemediationGuidance: 'Review your mistakes in PICA vs AICA occlusion clinical presentations.',
    revisionGuidance: 'Schedule Anatomy R1 revision in your matrix.',
  },

  // Day 9 (2026-10-20): Microbiology - Bugs & Antibiograms
  {
    dayIndex: 9,
    dateStr: '2026-10-20',
    title: 'Microbiology · Virology, Parasitology & Staining',
    subjects: ['microbiology'],
    focus: 'Viral hepatitis serology, HIV opportunistic infections, malaria microscopy, culture media, and sterilization.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master hepatitis serology, parasitology microscopy images, and hospital infection control protocols.',
    mustStudyTopics: [
      {
        id: 'micro-5',
        name: 'Virology - Hepatitis Serology & HIV',
        subjectId: 'microbiology',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'HBsAg: First marker to appear; signifies active infection (acute or chronic)',
          'Anti-HBs: Indicates recovery and long-term immunity (also the only positive marker after Hepatitis B vaccination)',
          'Anti-HBc IgM: Sole positive marker during the "Window Period" (between disappearance of HBsAg and appearance of Anti-HBs)',
          'HBeAg: Indicates high viral replication, high infectivity, and active transmission',
          'HIV opportunistic infections: Pneumocystis jirovecii (CD4 < 200, silver stain, DOC: TMP-SMX), Cryptococcal meningitis (CD4 < 100, India ink, DOC: Amphotericin B + Flucytosine)',
        ],
      },
      {
        id: 'micro-7',
        name: 'Parasitology - Malaria, Amoebiasis & Leishmania',
        subjectId: 'microbiology',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Plasmodium falciparum: Multiple ring forms per RBC, appliqué/accolé forms, banana/crescent-shaped gametocytes; causes malignant tertian malaria',
          'Plasmodium vivax: Schüffner dots, enlarged RBCs, amoeboid trophozoites; relapse occurs from dormant liver Hypnozoites (eradicated by Primaquine)',
          'Leishmania donovani: Amastigote form (LD body) within macrophages on bone marrow biopsy; Montenegro skin test; DOC: Liposomal Amphotericin B',
        ],
        visualConceptKey: 'micro:falciparum_gametocyte_jpg',
      },
      {
        id: 'micro-1',
        name: 'General Microbiology, Staining & Culture Media',
        subjectId: 'microbiology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Gram Staining sequence: Crystal Violet (Primary) → Gram Iodine (Mordant) → 95% Ethanol/Acetone (Decolorizer) → Safranin (Counterstain)',
          'Ziehl-Neelsen (Acid-Fast) Staining: 20% H2SO4 decolorizer for Mycobacterium tuberculosis; 5% H2SO4 for Mycobacterium leprae; 1% for Nocardia',
          'Selective media: Lowenstein-Jensen (LJ) medium for TB; TCBS agar for Vibrio cholerae (yellow colonies); MacConkey agar for lactose fermenters (pink colonies)',
        ],
        visualConceptKey: 'micro:acid_fast_mycobacterium_tb',
      },
      {
        id: 'micro-11',
        name: 'Hospital Infection Control & Autoclaving',
        subjectId: 'microbiology',
        priority: 'must_study',
        estimatedMinutes: 20,
        coreConcepts: [
          'Autoclave standard parameters: 121°C at 15 lbs/sq inch pressure for 15 minutes',
          'Biological indicator for Autoclave: Geobacillus stearothermophilus spores',
          'Biological indicator for Dry Heat (Hot Air Oven): Bacillus atrophaeus (Bacillus subtilis)',
          'Disinfectant of choice for blood spills: 1% to 10% Sodium Hypochlorite (minimum 20 minutes contact time)',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'micro-2',
        name: 'Gram-Positive Cocci - Staph & Strep',
        subjectId: 'microbiology',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Staphylococcus aureus: Catalase positive, Coagulase positive, golden yellow colonies on nutrient agar',
          'Streptococcus pneumoniae: Catalase negative, alpha-hemolytic, bile soluble, optochin sensitive, lancet-shaped diplococci',
        ],
        visualConceptKey: 'micro:strep_pneumoniae_gram_stain',
      },
      {
        id: 'micro-4',
        name: 'Mycobacteria & Treponema Pallidum',
        subjectId: 'microbiology',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Syphilis: Treponema pallidum; primary chancre (painless indurated ulcer); secondary condyloma lata; tertiary gumma and tabes dorsalis',
          'Serological tests: VDRL and RPR (non-treponemal, track treatment response); FTA-ABS and TPHA (treponemal, remain positive for life)',
        ],
      },
    ],
    activeRecallGuidance: 'Draw the Hepatitis B serology window period graph and identify the only positive marker during this gap.',
    questionPracticeGuidance: 'Practice 60 microbiology MCQs focusing on serology panels, parasite blood smears, and culture media.',
    errorRemediationGuidance: 'Review your mistakes in distinguishing non-treponemal (VDRL) from treponemal (TPHA) test indications.',
    revisionGuidance: 'Flag Autoclave biological indicators in your memory bank for final review.',
  },

  // Day 10 (2026-10-21): Pharmacology - Receptors & DOCs
  {
    dayIndex: 10,
    dateStr: '2026-10-21',
    title: 'Pharmacology · Autonomic, Antimicrobials & CVS',
    subjects: ['pharmacology'],
    focus: 'ANS receptor pharmacology, antimicrobial drugs of choice, cardiovascular therapeutics, and emergency antidotes.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master the core receptor mechanisms, first-line drug choices, and high-yield toxicities.',
    mustStudyTopics: [
      {
        id: 'pharm-1',
        name: 'Autonomic Nervous System - Cholinergic & Anticholinergic',
        subjectId: 'pharmacology',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Pilocarpine: Muscarinic agonist; drug of choice for acute angle-closure glaucoma (causes miosis, opens canal of Schlemm)',
          'Physostigmine: Tertiary amine (crosses blood-brain barrier); antidote for Atropine toxicity',
          'Neostigmine: Quaternary amine (does not cross BBB); used for Myasthenia Gravis and reversal of nondepolarizing neuromuscular blockade',
          'Atropine: Non-selective competitive muscarinic antagonist; causes mydriasis, cycloplegia, tachycardia, dry secretions, urinary retention',
        ],
      },
      {
        id: 'pharm-2',
        name: 'Autonomic Nervous System - Adrenergic Drugs',
        subjectId: 'pharmacology',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Epinephrine (Adrenaline): Drug of choice for Anaphylactic Shock (0.5 mg of 1:1,000 solution IM in anterolateral thigh)',
          'Norepinephrine: Drug of choice for Septic Shock (potent alpha-1 vasoconstriction with modest beta-1)',
          'Dopamine: Dose-dependent actions: Low dose (1-2 mcg/kg/min, renal vasodilation via D1), medium dose (2-10 mcg, beta-1 inotropic), high dose (>10 mcg, alpha-1 vasoconstriction)',
          'Beta-blockers: Selective beta-1 blockers (A-M: Atenolol, Metoprolol, Bisoprolol); Mixed alpha/beta blockers: Labetalol (DOC in pregnancy HTN), Carvedilol (heart failure)',
        ],
        clinicalTraps: ['Pure beta-blockers without prior alpha-blockade are contraindicated in Pheochromocytoma (causes unopposed severe alpha vasoconstrictive hypertensive crisis).'],
      },
      {
        id: 'pharm-5',
        name: 'Antimicrobials - Mechanism, Resistance & Drugs of Choice',
        subjectId: 'pharmacology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'DOC for MRSA: Vancomycin or Linezolid (inhibits 50S subunit, risk of thrombocytopenia and serotonin syndrome)',
          'DOC for Pseudomonas aeruginosa: Piperacillin-Tazobactam, Cefepime, Meropenem, or Ceftazidime',
          'DOC for Syphilis: Benzathine Penicillin G; DOC for Enteric (Typhoid) Fever: Ceftriaxone or Azithromycin',
          'DOC for Clostridioides difficile colitis: Oral Vancomycin or Fidaxomicin',
        ],
      },
      {
        id: 'pharm-3',
        name: 'Cardiovascular Pharmacology - Antihypertensives & Antiarrhythmics',
        subjectId: 'pharmacology',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'ACE Inhibitors (Enalapril, Ramipril): Inhibit conversion of Angiotensin I to II, prevent bradykinin degradation → dry cough and angioedema. Absolutely contraindicated in pregnancy (teratogenic)',
          'Amiodarone (Class III K+ channel blocker): High-yield adverse effects: Pulmonary fibrosis, Thyroid dysfunction (hypo- or hyperthyroidism), Corneal microdeposits, Blue-gray skin discoloration',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'pharm-7',
        name: 'CNS Pharmacology - Antiepileptics',
        subjectId: 'pharmacology',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'DOC for Absence Seizures: Ethosuximide (blocks T-type Ca2+ channels); alternative: Valproate',
          'DOC for Status Epilepticus: IV Lorazepam (0.1 mg/kg) followed by IV Levetiracetam or Fosphenytoin',
          'Sodium Valproate: Broad-spectrum; high teratogenic risk (neural tube defects)',
        ],
      },
      {
        id: 'pharm-12',
        name: 'General Pharmacology - Kinetics & Antidotes',
        subjectId: 'pharmacology',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Paracetamol toxicity: N-acetylcysteine (replenishes glutathione stores)',
          'Heparin reversal: Protamine sulfate; Warfarin reversal: Vitamin K1 (Phytomenadione) and 4-factor Prothrombin Complex Concentrate (PCC)',
        ],
      },
    ],
    activeRecallGuidance: 'Write the drugs of choice for Anaphylaxis, MRSA, Absence seizures, and Acute angle-closure glaucoma.',
    questionPracticeGuidance: 'Solve 60 pharmacology MCQs with emphasis on drug mechanisms, contraindications, and emergency antidotes.',
    errorRemediationGuidance: 'Review your mistakes in Class I vs Class III antiarrhythmic electrophysiology mechanisms.',
    revisionGuidance: 'Mark Pharma R1 complete in Revision Matrix.',
  },

  // Day 11 (2026-10-22): Pathology + Core Physiology
  {
    dayIndex: 11,
    dateStr: '2026-10-22',
    title: 'Pathology + Core Physiology · Neoplasia & Renal/CVS',
    subjects: ['pathology', 'physiology'],
    focus: 'Hallmarks of cancer, leukemia translocations, glomerulonephritis, Wiggers diagram, and countercurrent mechanism.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Combine cellular mechanisms with physiologic loops for two foundational pre-clinical subjects.',
    mustStudyTopics: [
      {
        id: 'path-4',
        name: 'Neoplasia - Hallmarks, Oncogenes & Tumor Markers',
        subjectId: 'pathology',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Proto-oncogenes: Activation of a single allele causes cancer (gain of function); e.g., KRAS (colon, lung, pancreas), HER2/neu (breast, gastric), BCR-ABL (CML)',
          'Tumor suppressor genes: Require two-hit inactivation (loss of function); e.g., TP53 (most frequently mutated gene in human cancer, guardian of genome), RB1 (retinoblastoma, osteosarcoma)',
          'Tumor markers: AFP (Hepatocellular carcinoma, Non-seminomatous germ cell tumors), PSA (Prostate CA), CA-125 (Ovarian epithelial CA), CA 19-9 (Pancreatic adenocarcinoma), CEA (Colorectal CA)',
        ],
        visualConceptKey: 'path:psammoma_bodies_jpg',
      },
      {
        id: 'path-6',
        name: 'Hematology - Leukemias & Lymphomas',
        subjectId: 'pathology',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'CML: t(9;22) Philadelphia chromosome, BCR-ABL fusion tyrosine kinase; low Leukocyte Alkaline Phosphatase (LAP) score',
          'APL (AML M3): t(15;17) PML-RARA fusion; Auer rods present; risk of DIC; treated with All-Trans Retinoic Acid (ATRA) and Arsenic Trioxide',
          'Burkitt Lymphoma: t(8;14) c-MYC translocation; "starry sky" histological appearance',
          'Hodgkin Lymphoma: Reed-Sternberg cells (CD15+, CD30+, CD45-); Nodular Sclerosis is the most common subtype',
        ],
        visualConceptKey: 'path:reed_sternberg_hodgkin',
      },
      {
        id: 'path-8',
        name: 'Renal Pathology - Glomerulonephritis',
        subjectId: 'pathology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Minimal Change Disease: Most common cause of nephrotic syndrome in children; normal light microscopy, diffuse effacement of podocyte foot processes on EM; steroid responsive',
          'Membranous Nephropathy: Most common nephrotic syndrome in adults; subepithelial "spike and dome" deposits on silver stain; anti-PLA2R antibodies',
          'Post-Streptococcal GN (PSGN): Nephritic syndrome; subepithelial "humps" on EM, lumpy-bumpy granular IF; low C3 levels',
          'Rapidly Progressive GN (RPGN): Crescent formation composed of proliferating parietal epithelial cells and macrophages',
        ],
        visualConceptKey: 'path:minimal_change_electron_microscopy',
      },
      {
        id: 'phys-3',
        name: 'CVS Physiology - Wiggers Diagram & PV Loops',
        subjectId: 'physiology',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Isovolumetric Contraction: Mitral valve closes (S1) → pressure rises with constant volume → Aortic valve opens',
          'Isovolumetric Relaxation: Aortic valve closes (S2) → pressure falls with constant volume → Mitral valve opens',
          'Jugular Venous Pulse (JVP): a wave = right atrial contraction; c wave = tricuspid bulging during isovolumetric ventricular contraction; v wave = venous filling against closed tricuspid valve',
        ],
        visualConceptKey: 'physio:cardiac_action_potential',
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'phys-7',
        name: 'Renal Physiology - GFR & Countercurrent Mechanism',
        subjectId: 'physiology',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Loop of Henle countercurrent multiplier: Descending limb is permeable to water (concentrates tubular fluid); Ascending limb is impermeable to water and actively transports Na-K-2Cl (dilutes tubular fluid)',
          'Vasa recta act as countercurrent exchangers to maintain the medullary hyperosmolar gradient',
        ],
      },
      {
        id: 'path-5',
        name: 'Hematology - RBC Disorders & Anemias',
        subjectId: 'pathology',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Iron Deficiency: Microcytic hypochromic, low serum ferritin, high TIBC',
          'Megaloblastic Anemia: Macrocytic, hypersegmented neutrophils (>= 5 lobes), elevated homocysteine',
        ],
        visualConceptKey: 'path:sickle_cells_jpg',
      },
    ],
    activeRecallGuidance: 'List the four major chromosomal translocations: t(9;22), t(15;17), t(8;14), and t(11;14), with their corresponding malignancies.',
    questionPracticeGuidance: 'Solve 60 MCQs covering histology electron microscopy patterns, leukemia markers, and cardiac cycle events.',
    errorRemediationGuidance: 'Ensure you can differentiate subepithelial humps (PSGN) from subepithelial spikes (Membranous) on renal biopsy.',
    revisionGuidance: 'Log Pathology and Physiology completion in your Revision Matrix.',
  },

  // Day 12 (2026-10-23): Surgery + Orthopedics Part 1
  {
    dayIndex: 12,
    dateStr: '2026-10-23',
    title: 'General Surgery + Orthopedics · Part 1',
    subjects: ['surgery', 'orthopedics'],
    focus: 'ATLS trauma resuscitation, burns management, pediatric orthopedic emergencies, and upper limb fractures.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master fracture classifications, neurovascular complications, and surgical trauma protocols.',
    mustStudyTopics: [
      {
        id: 'surg-1',
        name: 'Trauma & Critical Care - Primary Survey & FAST',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Glasgow Coma Scale (GCS): Eye opening (4), Verbal response (5), Motor response (6); Minimum score = 3, Maximum = 15; Score <= 8 mandates definitive airway intubation',
          'Flail Chest: Paradoxical inward movement of a segment of chest wall during inspiration; management: analgesia and positive pressure ventilation if in respiratory failure',
          'Cardiac Tamponade (Beck Triad): Hypotension, Jugular venous distension, Muffled heart sounds; Pulsus paradoxus (fall in systolic BP > 10 mmHg on inspiration)',
        ],
      },
      {
        id: 'surg-2',
        name: 'Burns - Modified Parkland Formula & Inhalation Injury',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Indications for escharotomy: Full-thickness circumferential burns of limbs (prevent compartment syndrome) or chest wall (prevent respiratory restriction)',
          'Carbon monoxide poisoning: High-affinity binding to hemoglobin (carboxyhemoglobin); pulse oximetry falsely normal; treated with 100% normobaric or hyperbaric oxygen',
        ],
      },
      {
        id: 'ortho-1',
        name: 'Upper Limb Fractures - Pediatric & Eponymous',
        subjectId: 'orthopedics',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Supracondylar Fracture of Humerus: Most common pediatric elbow fracture; extension type (posterior displacement of distal fragment); complication: Volkmann Ischemic Contracture (injury to brachial artery) and Anterior Interosseous Nerve (AIN) injury',
          'Monteggia Fracture-Dislocation: Fracture of proximal third of Ulna with dislocation of Radial Head',
          'Galeazzi Fracture-Dislocation: Fracture of distal third of Radius with dislocation of Distal Radioulnar Joint (DRUJ)',
          'Colles Fracture: Dinner fork deformity; extra-articular fracture of distal radius with dorsal displacement and dorsal tilt',
        ],
        visualConceptKey: 'rad:colles_fracture_jpg',
      },
      {
        id: 'ortho-4',
        name: 'Pediatric Orthopedics - CTEV, DDH, Perthes & SCFE',
        subjectId: 'orthopedics',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Congenital Talipes Equinovarus (CTEV / Clubfoot): Deformity components (CAVE): Cavus, Adductus, Varus, Equinus. Treatment of choice: Ponseti serial casting method',
          'Developmental Dysplasia of the Hip (DDH): Barlow test (dislocates hip), Ortolani test (relocates dislocated hip); treated with Pavlik harness',
          'Slipped Capital Femoral Epiphysis (SCFE): Overweight adolescent boy with painful limp; Trethowan sign (Klein line fails to intersect femoral head epiphysis)',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'ortho-2',
        name: 'Lower Limb Fractures - Neck of Femur & Ankle',
        subjectId: 'orthopedics',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Intracapsular Neck of Femur Fracture: High risk of Avascular Necrosis (AVN) of femoral head due to disruption of retinacular branches of medial circumflex femoral artery',
          'Garden classification for femoral neck fractures; managed with hemiarthroplasty / total hip arthroplasty in elderly patients',
        ],
      },
      {
        id: 'surg-5',
        name: 'Acute Abdomen - Appendicitis & Peritonitis',
        subjectId: 'surgery',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'McBurney point: One-third the distance from the anterior superior iliac spine to the umbilicus',
          'Rovsing sign: Pain in right lower quadrant on palpation of left lower quadrant',
        ],
      },
    ],
    activeRecallGuidance: 'Differentiate Monteggia vs Galeazzi using the mnemonic "MUGR" (Monteggia = Ulna fracture; Galeazzi = Radius fracture).',
    questionPracticeGuidance: 'Solve 60 MCQs concentrating on eponymous fractures, GCS scoring, and pediatric hip conditions.',
    errorRemediationGuidance: 'Review your mistakes in distinguishing Perthes disease (younger, avascular necrosis) from SCFE (adolescent, slip).',
    revisionGuidance: 'Record upper limb orthopedic fracture patterns in your personal summary notebook.',
  },

  // Day 13 (2026-10-24): Surgery + Orthopedics Part 2
  {
    dayIndex: 13,
    dateStr: '2026-10-24',
    title: 'General Surgery + Orthopedics · Part 2',
    subjects: ['surgery', 'orthopedics'],
    focus: 'Breast cancer triple assessment, thyroid malignancies, intestinal obstruction, and bone tumors by age and X-ray.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master cancer staging, operative indications, and classic X-ray bone tumor appearances.',
    mustStudyTopics: [
      {
        id: 'surg-3',
        name: 'Breast Diseases - Triple Assessment & Cancer Staging',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Triple Assessment: 1. Clinical examination; 2. Imaging (Mammography in women >35 years, Ultrasound in women <35 years); 3. Core needle core biopsy (histopathology)',
          'Most common histologic type: Invasive Ductal Carcinoma (No Special Type, NST)',
          'Receptor status testing: Estrogen Receptor (ER), Progesterone Receptor (PR), HER2/neu; Triple Negative Breast Cancer has worst prognosis',
          'Sentinel Lymph Node Biopsy (SLNB): Uses blue dye and technetium-99m sulfur colloid to identify the first draining node, avoiding unnecessary axillary clearance',
        ],
      },
      {
        id: 'surg-4',
        name: 'Thyroid Surgery - Malignancies & Post-Op Complications',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Papillary Thyroid Carcinoma (most common, best prognosis): Orphan Annie eye nuclei, Psammoma bodies, intranuclear inclusions; spreads via lymphatics',
          'Follicular Thyroid Carcinoma: Capsular or vascular invasion required for diagnosis (cannot be confirmed on FNAC alone); hematogenous spread to bones/lungs',
          'Medullary Thyroid Carcinoma: Originates from C-cells (calcitonin marker); associated with MEN 2A and 2B (RET proto-oncogene); Amyloid stroma (Apple-green birefringence with Congo Red)',
          'Post-op complications: Injury to Recurrent Laryngeal Nerve (unilateral = hoarseness; bilateral = stridor and airway obstruction); Hypocalcemia from parathyroid damage',
        ],
      },
      {
        id: 'surg-6',
        name: 'GI Surgery - Intestinal Obstruction & Hernias',
        subjectId: 'surgery',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Small bowel obstruction: Central air-fluid levels with step-ladder pattern; valvulae conniventes completely cross the lumen',
          'Sigmoid Volvulus: Elderly, chronically constipated; "Coffee bean" sign on abdominal X-ray; birds beak appearance on barium enema',
          'Cecal Volvulus: Embryonic non-fixation of right colon; comma-shaped loop pointing to left upper quadrant',
        ],
        visualConceptKey: 'rad:coffee_bean_volvulus_jpg',
      },
      {
        id: 'ortho-6',
        name: 'Bone Tumors by Age & X-Ray Appearances',
        subjectId: 'orthopedics',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Osteosarcoma (10-20 years, metaphysis of knee): "Sunburst" periosteal reaction and Codman triangle; elevated alkaline phosphatase',
          'Ewing Sarcoma (10-20 years, diaphysis of long bones): "Onion-peel" concentric periosteal reaction; t(11;22) translocation; small round blue cell tumor',
          'Giant Cell Tumor / Osteoclastoma (20-40 years, epiphysis after physeal closure): "Soap-bubble" eccentric radiolucency',
          'Multiple Myeloma (>50 years, skull/spine): "Punched-out" lytic lesions without sclerotic borders; Bence Jones proteinuria; M-spike on electrophoresis',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'ortho-5',
        name: 'Bone Infections - Osteomyelitis & Pott Spine',
        subjectId: 'orthopedics',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Acute osteomyelitis: Most common organism is Staphylococcus aureus; starts in metaphysis due to hairpin vascular loops',
          'Sequestrum = Dead necrotic bone; Involucrum = New reactive bone sleeve surrounding dead bone',
          'Tuberculous Spondylitis (Pott spine): Earliest site is paradiscal anterior body; leads to collapse, kyphosis (gibbus deformity), and cold abscess',
        ],
      },
      {
        id: 'ortho-3',
        name: 'Joint Dislocations - Shoulder & Hip',
        subjectId: 'orthopedics',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Shoulder: Anterior dislocation (most common); loss of normal rounded shoulder contour; Bankart lesion (labrum) and Hill-Sachs lesion (humeral head); Axillary nerve at risk',
          'Hip: Posterior dislocation (most common, dashboard injury); limb is flexed, adducted, and internally rotated; Sciatic nerve at risk',
        ],
      },
    ],
    activeRecallGuidance: 'Recite the location and characteristic X-ray appearance for Osteosarcoma, Ewing Sarcoma, and Giant Cell Tumor.',
    questionPracticeGuidance: 'Solve 60 surgery and orthopedics MCQs focusing on breast cancer receptors, thyroid cancer histology, and bone tumor X-rays.',
    errorRemediationGuidance: 'Review your mistakes in anterior vs posterior hip dislocation positioning.',
    revisionGuidance: 'Mark Surgery and Orthopedics modules R1 complete in your Revision Matrix.',
  },

  // Day 14 (2026-10-25): Selective Medicine + Short Subjects Part 1
  {
    dayIndex: 14,
    dateStr: '2026-10-25',
    title: 'Medicine + Dermatology & Psychiatry',
    subjects: ['medicine', 'dermatology', 'psychiatry'],
    focus: 'Cardiology ECG interpretation, diabetic emergencies, blistering skin diseases, and psychiatric diagnostic criteria.',
    targetHours: 6,
    targetQuestions: 65,
    missionStatement: 'Combine cardiology emergency decisions with high-scoring short clinical subjects.',
    mustStudyTopics: [
      {
        id: 'med-1',
        name: 'Cardiology - ECG Arrhythmias & Pre-excitation',
        subjectId: 'medicine',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Atrial Fibrillation: Irregularly irregular ventricular rhythm, absent P waves, fibrillatory baseline; risk of embolic stroke (calculate CHA2DS2-VASc score)',
          'Wolff-Parkinson-White (WPW) Syndrome: Accessory bundle of Kent; triad of short PR interval (<0.12s), Delta wave (slurred QRS upstroke), and wide QRS',
          'Ventricular Tachycardia: Monomorphic vs Polymorphic (Torsades de pointes caused by prolonged QT; treated with IV Magnesium Sulfate)',
        ],
        visualConceptKey: 'med:ecg_wpw_syndrome',
      },
      {
        id: 'med-3',
        name: 'Endocrinology - Diabetic Emergencies',
        subjectId: 'medicine',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'DKA: Hyperglycemia (>250 mg/dL), metabolic acidosis (pH < 7.30, serum bicarbonate < 18 mEq/L), positive urine/serum ketones, elevated anion gap (>12)',
          'Hyperosmolar Hyperglycemic State (HHS): Blood glucose > 600 mg/dL, serum osmolality > 320 mOsm/kg, minimal or absent ketones, profound dehydration',
        ],
      },
      {
        id: 'derm-3',
        name: 'Vesiculobullous Disorders - Pemphigus vs Pemphigoid',
        subjectId: 'dermatology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Pemphigus Vulgaris: Autoantibodies against Desmoglein 3 and 1 (desmosomes); intraepidermal acantholysis; flaccid fragile blisters; Nikolsky sign positive; mucosal involvement common; "Fishnet" / reticular IgG on IF',
          'Bullous Pemphigoid: Autoantibodies against BP180 and BP230 (hemidesmosomes); subepidermal blister; tense firm bullae; Nikolsky sign negative; linear IgG and C3 along basement membrane zone on IF',
        ],
        visualConceptKey: 'derm:pemphigus_vulgaris_histology',
      },
      {
        id: 'psych-1',
        name: 'Schizophrenia & Other Psychotic Disorders',
        subjectId: 'psychiatry',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Diagnostic criteria (DSM-5 / ICD-11): Minimum 1 month of active symptoms including at least one of: Delusions, Hallucinations (third-person auditory hallucinations), or Disorganized speech',
          'Schneiderian First-Rank Symptoms: Thought insertion, thought withdrawal, thought broadcasting, auditory hallucinations arguing or commenting on patient actions',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'psych-5',
        name: 'Psychopharmacology - Antipsychotics & Mood Stabilizers',
        subjectId: 'psychiatry',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Extrapyramidal symptoms: Acute dystonia (treated with Benztropine / Promethazine), Akathisia (restlessness, treated with Propranolol), Tardive dyskinesia (involuntary orofacial movements)',
          'Neuroleptic Malignant Syndrome (NMS): Hyperthermia, lead-pipe muscle rigidity, autonomic instability, elevated CPK; treated with Dantrolene and Bromocriptine',
          'Lithium: Narrow therapeutic index (0.6-1.2 mEq/L); toxicity causes coarse tremors, ataxia, confusion; teratogenic (Ebstein anomaly)',
        ],
      },
      {
        id: 'derm-1',
        name: 'Infections - Leprosy & Scabies',
        subjectId: 'dermatology',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Leprosy (Ridley-Jopling classification): Tuberculoid (high CMI, solitary hypopigmented anesthetic patch, lepromin positive) vs Lepromatous (low CMI, multiple symmetric nodules, leonine facies, lepromin negative, globi of AFB)',
          'Scabies: Sarcoptes scabiei; nocturnal pruritus, burrows in finger web spaces and flexor wrists; treated with 5% Permethrin cream applied from neck down',
        ],
      },
    ],
    activeRecallGuidance: 'Compare Pemphigus Vulgaris vs Bullous Pemphigoid on blister type, Nikolsky sign, and target antigen.',
    questionPracticeGuidance: 'Solve 65 MCQs across ECG rhythm diagnosis, blistering skin histology, and psychiatry vignette questions.',
    errorRemediationGuidance: 'Review your mistakes in NMS vs Serotonin Syndrome clinical features (hyperreflexia in serotonin vs lead-pipe rigidity in NMS).',
    revisionGuidance: 'Check off Medicine Part 1, Dermatology, and Psychiatry in your Revision Matrix.',
  },

  // Day 15 (2026-10-26): Selective Medicine + Short Subjects Part 2
  {
    dayIndex: 15,
    dateStr: '2026-10-26',
    title: 'Medicine + Radiology & Anesthesia',
    subjects: ['medicine', 'radiology', 'anesthesia'],
    focus: 'Tuberculosis regimens, chest X-ray emergency patterns, head CT trauma findings, and ACLS CPR algorithms.',
    targetHours: 6,
    targetQuestions: 65,
    missionStatement: 'Master radiological spotters and emergency resuscitation protocols that yield rapid exam points.',
    mustStudyTopics: [
      {
        id: 'med-5',
        name: 'Pulmonology - Tuberculosis & Pneumonia',
        subjectId: 'medicine',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'NTEP First-line TB regimen: 2HRZE + 4HRE daily fixed-dose combination',
          'High-yield drug adverse effects: Isoniazid (peripheral neuropathy, preventable with Pyridoxine B6; hepatotoxicity); Rifampicin (orange-red body secretions); Pyrazinamide (hyperuricemia/gout, hepatotoxicity); Ethambutol (retrobulbar optic neuritis, red-green color blindness)',
          'Community-Acquired Pneumonia (CURB-65 score): Confusion, Urea > 7 mmol/L, Respiratory rate >= 30/min, Blood pressure < 90/60 mmHg, Age >= 65 years. Score >= 2 requires hospital admission; score >= 3 requires ICU evaluation',
        ],
      },
      {
        id: 'rad-1',
        name: 'Chest Radiology - Classic Emergency Signs',
        subjectId: 'radiology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Tension Pneumothorax: Hyperlucent hemithorax, absent bronchovascular markings, depression of hemidiaphragm, contralateral tracheal and mediastinal shift',
          'Pleural Effusion: Blunting of costophrenic angle (visible on erect CXR at 150-200 mL; on lateral decubitus at 50 mL); meniscus sign',
          'Lobar Collapse: Golden S curve of Santer (right upper lobe collapse with central hilar mass)',
        ],
        visualConceptKey: 'rad:chest_xray_pneumothorax',
      },
      {
        id: 'rad-2',
        name: 'Neuroimaging - Trauma CT (EDH vs SDH vs SAH)',
        subjectId: 'radiology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Extradural (Epidural) Hematoma (EDH): Rupture of Middle Meningeal Artery; biconvex (lentiform), hyperdense extra-axial collection; does NOT cross suture lines; classic "lucid interval"',
          'Subdural Hematoma (SDH): Rupture of bridging cortical veins; crescentic (concavo-convex) hyperdense collection; CAN cross suture lines; common in elderly and alcoholics with minor trauma',
          'Subarachnoid Hemorrhage (SAH): Rupture of saccular (berry) aneurysm in Circle of Willis; blood hyperdensity in basal cisterns and sulci; "worst headache of my life" (thunderclap headache)',
        ],
      },
      {
        id: 'anes-3',
        name: 'Cardiopulmonary Resuscitation - BLS & ACLS',
        subjectId: 'anesthesia',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Compression rate: 100-120 per minute; depth: 5-6 cm (2-2.4 inches) in adults with complete chest recoil',
          'Compression-to-ventilation ratio: 30:2 in adults (both 1-rescuer and 2-rescuer until advanced airway is placed)',
          'Shockable rhythms: Ventricular Fibrillation (VF) and Pulseless Ventricular Tachycardia (pVT) → immediate unsynchronized shock (120-200 J biphasic) + CPR for 2 minutes before rhythm check',
          'Non-shockable rhythms: Asystole and Pulseless Electrical Activity (PEA) → immediate CPR + Epinephrine 1 mg IV every 3-5 minutes',
        ],
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'anes-4',
        name: 'Airway Management - Mallampati & Intubation',
        subjectId: 'anesthesia',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Modified Mallampati Classification: Class I (Soft palate, fauces, uvula, pillars visible); Class II (Soft palate, fauces, uvula visible); Class III (Soft palate, base of uvula visible); Class IV (Hard palate only visible; predictor of difficult intubation)',
          'Sellick maneuver: Cricoid pressure used during rapid sequence induction to prevent regurgitation and aspiration',
        ],
      },
      {
        id: 'med-2',
        name: 'Cardiology - Myocardial Infarction Management',
        subjectId: 'medicine',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Dual antiplatelet therapy (Aspirin + P2Y12 inhibitor: Clopidogrel, Ticagrelor, or Prasugrel) + Statin + Heparin',
          'Post-MI mechanical complications: Ventricular free wall rupture (Day 3-5, acute tamponade), Papillary muscle rupture (acute severe mitral regurgitation murmur)',
        ],
      },
    ],
    activeRecallGuidance: 'Sketch the CT head profile for EDH (lentiform, artery) vs SDH (crescent, vein) and state whether each crosses suture lines.',
    questionPracticeGuidance: 'Solve 65 MCQs concentrating on CT head images, chest X-rays, ACLS resuscitation algorithms, and TB drug toxicities.',
    errorRemediationGuidance: 'Review your mistakes in shockable vs non-shockable arrest management.',
    revisionGuidance: 'Mark Radiology and Anesthesia complete in Revision Matrix.',
  },

  // Day 16 (2026-10-27): Pediatrics, ENT & Ophthalmology
  {
    dayIndex: 16,
    dateStr: '2026-10-27',
    title: 'Pediatrics, ENT & Ophthalmology · High-Yield Trio',
    subjects: ['pediatrics', 'ent', 'ophthalmology'],
    focus: 'Developmental milestones, neonatal jaundice, congenital heart diseases, otosclerosis, epistaxis, and glaucoma.',
    targetHours: 6,
    targetQuestions: 60,
    missionStatement: 'Master the high-scoring trio that carries ~45 marks in the clinical paper.',
    mustStudyTopics: [
      {
        id: 'ped-1',
        name: 'Developmental Milestones & Red Flags',
        subjectId: 'pediatrics',
        priority: 'must_study',
        estimatedMinutes: 35,
        coreConcepts: [
          'Gross motor: Social smile (2 months), Neck holding (3 months), Rolls over (5 months), Sits without support (8 months), Crawls (9 months), Stands without support (10-12 months), Walks independently (13-15 months), Climbs stairs 2 feet per step (2 years)',
          'Fine motor: Immature pincer grasp (9 months), Mature neat pincer grasp (12 months), Tower of 3 cubes (18 months), Tower of 6 cubes (2 years), Copies a circle (3 years), Copies a cross (4 years), Copies a triangle (5 years)',
          'Language & Social: Monosyllables (6 months), Bisyllables with meaning (12 months), 2-3 word sentences (2 years), Waves bye-bye (9 months), Parallel play (2 years)',
        ],
      },
      {
        id: 'ped-2',
        name: 'Neonatology - Resuscitation, APGAR & Jaundice',
        subjectId: 'pediatrics',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'APGAR score: Evaluated at 1 min and 5 min; components: Appearance (color), Pulse (HR > 100), Grimace (reflex response), Activity (muscle tone), Respiration (effort); Max score = 10',
          'Physiologic Jaundice: Appears after 24 hours of life; peaks on day 3-5; clears by day 10-14 in term infants; serum bilirubin rises < 5 mg/dL/day; direct bilirubin is normal',
          'Pathologic Jaundice: Appears within the first 24 hours of life (most common cause: Rh or ABO incompatibility); serum bilirubin rises > 5 mg/dL/day; direct bilirubin > 2 mg/dL',
          'Phototherapy: Wavelength 460-490 nm (blue-green spectrum); converts toxic unconjugated bilirubin into water-soluble Lumirubin through structural photoisomerization',
        ],
      },
      {
        id: 'oph-4',
        name: 'Glaucoma - Primary Open vs Acute Angle Closure',
        subjectId: 'ophthalmology',
        priority: 'must_study',
        estimatedMinutes: 30,
        coreConcepts: [
          'Acute Angle-Closure Glaucoma: Sudden severe eye pain, headache, nausea, colored halos around lights, cloudy "steamy" cornea, fixed mid-dilated pupil, rock-hard eyeball (IOP > 50 mmHg). Emergency management: IV Mannitol, topical Pilocarpine 2%, Timolol, and oral Acetazolamide; definitive treatment: Bilateral Laser Peripheral Iridotomy',
          'Primary Open-Angle Glaucoma: Asymptomatic insidious bilateral optic neuropathy; painless progressive peripheral visual field loss (arcuate scotoma, tunnel vision); cup-to-disc ratio > 0.5. First-line medical therapy: Topical Prostaglandin analogs (Latanoprost, increases uveoscleral outflow)',
        ],
        visualConceptKey: 'ophth:fundoscopy_crao',
      },
      {
        id: 'ent-2',
        name: 'Ear - Hearing Loss (Tuning Fork) & Otosclerosis',
        subjectId: 'ent',
        priority: 'must_study',
        estimatedMinutes: 25,
        coreConcepts: [
          'Rinne Test: Air Conduction (AC) vs Bone Conduction (BC). Normal / Sensorineural: AC > BC (Rinne positive); Conductive Hearing Loss: BC > AC (Rinne negative)',
          'Weber Test: Normal = heard in both ears equally. Lateralizes to the poorer/diseased ear in Conductive hearing loss; lateralizes to the better/normal ear in Sensorineural hearing loss',
          'Otosclerosis: Autosomal dominant with incomplete penetrance; fixation of stapes footplate at oval window; progressive conductive hearing loss, Carhart notch (dip at 2000 Hz on audiometry), Schwartz sign (flamingo pink glow through tympanic membrane); treatment of choice: Stapedotomy with piston prosthesis',
        ],
        visualConceptKey: 'ent:tympanic_perforation_jpg',
      },
    ],
    ifTimeRemainsTopics: [
      {
        id: 'ped-5',
        name: 'Pediatric Cardiology - Congenital Heart Diseases',
        subjectId: 'pediatrics',
        priority: 'if_time_remains',
        estimatedMinutes: 25,
        coreConcepts: [
          'Tetralogy of Fallot (most common cyanotic CHD): 1. VSD; 2. Pulmonary stenosis / RV outflow obstruction; 3. Overriding of aorta; 4. Right ventricular hypertrophy. "Boot-shaped heart" (coeur en sabot) on CXR. Tet spells managed with knee-chest position and oxygen',
          'Transposition of the Great Arteries (TGA): Most common cyanotic CHD in the immediate newborn period; "Egg on a string" appearance on CXR',
        ],
      },
      {
        id: 'oph-5',
        name: 'Retina - Fundus Lesions & Retinopathy',
        subjectId: 'ophthalmology',
        priority: 'if_time_remains',
        estimatedMinutes: 20,
        coreConcepts: [
          'Central Retinal Artery Occlusion (CRAO): Sudden painless profound loss of vision; "Cherry-red spot" at macula with pale ischemic retina',
          'Central Retinal Vein Occlusion (CRVO): "Blood and thunder" fundus appearance with extensive flame hemorrhages, disc edema, and cotton-wool spots',
        ],
        visualConceptKey: 'ophth:cherry_red_spot_jpg',
      },
    ],
    activeRecallGuidance: 'Recite the milestone ages for copying a circle (3y), cross (4y), and triangle (5y), and draw the tuning fork test matrix.',
    questionPracticeGuidance: 'Solve 60 MCQs covering milestone scenarios, phototherapy guidelines, tuning fork results, and fundus image spotters.',
    errorRemediationGuidance: 'Review your mistakes in tuning fork lateralization patterns for conductive vs sensorineural hearing loss.',
    revisionGuidance: 'Mark Pediatrics, ENT, and Ophthalmology complete in Revision Matrix.',
  },

  // Day 17 (2026-10-28): Timed Mixed Recall & Mock Review Part 1
  {
    dayIndex: 17,
    dateStr: '2026-10-28',
    title: 'Full 300Q Simulation · Pacing & Discipline',
    subjects: [],
    focus: 'Full-length 300-question timed exam simulation in two 150-minute blocks. Simulate exam day pressure.',
    targetHours: 8,
    targetQuestions: 300,
    isFullMock: true,
    missionStatement: 'Execute two unbroken 150-minute testing sweeps. Never leave any question blank because FMGE has zero negative marking.',
    mustStudyTopics: [],
    ifTimeRemainsTopics: [],
    activeRecallGuidance: 'Simulate exact exam conditions: Paper 1 (150 Qs in 150 min), scheduled break, Paper 2 (150 Qs in 150 min).',
    questionPracticeGuidance: 'Complete the full 300-question mock or two 150-question timed blocks. Keep moving at 60 seconds per question.',
    errorRemediationGuidance: 'Categorize every incorrect or guessed answer: 1. Knowledge gap; 2. Misread stem; 3. Trap confusion; 4. Lucky guess.',
    revisionGuidance: 'Log your score into Grand Test tracker. Analyze your mark margin against the 150-mark pass line.',
  },

  // Day 18 (2026-10-29): Timed Mixed Recall & Mock Review Part 2
  {
    dayIndex: 18,
    dateStr: '2026-10-29',
    title: 'Diagnostic Error Remediation & Volatile Recall',
    subjects: [],
    focus: 'Systematic clearance of the Error Vault, recurring traps from the mock, staging numbers, and formulas.',
    targetHours: 6,
    targetQuestions: 100,
    missionStatement: 'Clear your weakest recurring traps identified in yesterday\'s full-length simulation.',
    mustStudyTopics: [],
    ifTimeRemainsTopics: [],
    activeRecallGuidance: 'Review your personalized Error Vault cards. Reattempt every missed or guessed question until you can explain why.',
    questionPracticeGuidance: 'Solve 100 mixed recall questions focusing specifically on your weakest subjects from yesterday\'s mock.',
    errorRemediationGuidance: 'Ensure all flagged error cards in Error Vault are retested and marked as reviewed.',
    revisionGuidance: 'Focus only on high-yield volatile numbers: incubation periods, criteria scores, and drug dosages.',
  },

  // Day 19 (2026-10-30): Light Revision, Volatile Facts & Rest
  {
    dayIndex: 19,
    dateStr: '2026-10-30',
    title: 'Exam Eve · Volatile Facts, Image Spotters & Rest',
    subjects: [],
    focus: 'Personalized Error Vault review, 50 key visual image spotters, logistics verification, and mandatory early sleep.',
    targetHours: 4,
    targetQuestions: 20,
    isRestDay: true,
    missionStatement: 'Protect your energy and clarity. No heavy tests or exhaustion. Verify test logistics and sleep early.',
    mustStudyTopics: [],
    ifTimeRemainsTopics: [],
    activeRecallGuidance: 'Flip through your personalized high-yield image cards and 20th notebook formulas. Stop studying by 6:00 PM.',
    questionPracticeGuidance: 'Limit practice to at most 20 gentle recall questions. Do not take any new mock tests today.',
    errorRemediationGuidance: 'Briefly review your top 10 most common personal error traps so they are fresh in your mind.',
    revisionGuidance: 'Verify exam documents: Admit Card printout, original government photo ID, passport size photos, transparent water bottle.',
  },

  // Day 20 / Exam Day (2026-10-31): Official Exam Day Protocol
  {
    dayIndex: 20,
    dateStr: '2026-10-31',
    title: 'NBE FMGE Exam Day Protocol · 150+ to Victory',
    subjects: [],
    focus: 'Official NBEMS examination day execution. Two 150-minute parts. 150/300 to qualify.',
    targetHours: 0,
    targetQuestions: 300,
    isExamDay: true,
    missionStatement: 'Today is the day, Doctor. You need 150 marks out of 300 to qualify as a doctor in India. Trust your training.',
    mustStudyTopics: [],
    ifTimeRemainsTopics: [],
    activeRecallGuidance: 'Remain calm. Breathe steadily during check-in. Review your core mantras.',
    questionPracticeGuidance: 'In the real exam: 300 questions. Answer EVERY question. Zero negative marking.',
    errorRemediationGuidance: 'Trust your first clinical instinct. Never second-guess unless an objective misread is discovered.',
    revisionGuidance: 'Celebrate your qualification tonight.',
  },
];

export function getDailyStudyBlueprint(dayIndex: number): DailyStudyBlueprint {
  if (dayIndex >= 0 && dayIndex < SPRINT_STUDY_BLUEPRINTS.length) {
    return SPRINT_STUDY_BLUEPRINTS[dayIndex];
  }
  // Fallback to closest valid blueprint
  if (dayIndex >= SPRINT_STUDY_BLUEPRINTS.length) {
    return SPRINT_STUDY_BLUEPRINTS[SPRINT_STUDY_BLUEPRINTS.length - 1];
  }
  return SPRINT_STUDY_BLUEPRINTS[0];
}
