import { SlideDeck, VisualSlideItem, NormalizedTopicIntelligence } from '../types';
import { getNormalizedTopicIntelligence } from './topicIntelligence';
import { getMedicalTopicKnowledge } from './topicKnowledgeBase';
import { filterTopicSafeContent } from './contentValidator';
import { getVerifiedVisualAssetForTopic } from './visualQuestionEngine';

export const VERIFIED_TOPIC_SLIDES: Record<string, VisualSlideItem[]> = {
  // Anatomy - Knee Joint & Nerve Lesions
  'anat-4': [
    {
      id: 'slide-anat-4-1',
      slideNumber: 1,
      title: 'Knee Joint & Nerve Injuries — High-Yield Overview',
      subtitle: 'Anatomy • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        '**Joint Architecture:** Modified hinge (bicondylar) synovial joint with meniscal shock absorbers.',
        '**Primary Stabilizers:** ACL (stops anterior tibial slip) • PCL (stops posterior slip) • MCL & LCL.',
        '**Vulnerable Nerves:** Common Peroneal at fibular neck (Foot Drop) • Tibial nerve in popliteal fossa.',
        '**Key Exam Rule:** LAMP mnemonic (Lateral condyle = ACL, Medial condyle = PCL).',
      ],
      keyTakeaways: ['LAMP mnemonic: Lateral femoral condyle = ACL, Medial femoral condyle = PCL'],
    },
    {
      id: 'slide-anat-4-2',
      slideNumber: 2,
      title: 'Cruciate Ligaments & Menisci Anatomy',
      subtitle: 'Biomechanics and Injury Patterns',
      category: 'anatomy_patho',
      bullets: [
        '**ACL Course:** Anterior intercondylar tibia → Medial surface of lateral femoral condyle.',
        '**PCL Course:** Posterior intercondylar tibia → Lateral surface of medial femoral condyle (thicker/stronger).',
        '**Medial Meniscus:** C-shaped, attached firmly to MCL (frequently injured in twisting valgus).',
        '**Lateral Meniscus:** O-shaped, more mobile, separated from LCL by popliteus tendon.',
      ],
      keyTakeaways: [
        'O\'Donoghue\'s Unholy Triad: ACL + MCL + Medial Meniscus (valgus trauma)',
      ],
      imageUrl: '/assets/medical-images/anat-knee-joint.svg',
      imageCaption: 'Knee Joint Anatomy — Cruciate Ligaments (ACL & PCL) and Menisci',
      visualTarget: 'Cruciate Ligaments & Menisci Anatomy',
      whatToLookFor: 'Examine cruciate ligaments (ACL/PCL), collateral ligaments, and menisci in relation to the femoral condyles and tibial plateau.',
    },
    {
      id: 'slide-anat-4-3',
      slideNumber: 3,
      title: 'Physical Diagnostic Tests of the Knee',
      subtitle: 'Gold-Standard Clinical Maneuvers',
      category: 'diagnostics',
      bullets: [
        '**Lachman Test:** Most sensitive test for ACL rupture (20-30° knee flexion; hamstrings relaxed).',
        '**Anterior Drawer:** Evaluates ACL translation at 90° flexion (less sensitive due to spasm).',
        '**Posterior Sag & Drawer:** Diagnostic for PCL rupture (classic dashboard injury).',
        '**McMurray Test:** Ext rotation + valgus = Medial Meniscus; Int rotation + varus = Lateral Meniscus.',
      ],
      keyTakeaways: ['Lachman is clinically superior to Anterior Drawer because hamstrings are relaxed.'],
    },
    {
      id: 'slide-anat-4-4',
      slideNumber: 4,
      title: 'Common Peroneal vs Tibial Nerve Lesions',
      subtitle: 'Motor & Sensory Loss Comparison',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Common Peroneal (L4-S2):** Winds around neck of fibula; vulnerable to casts & fractures.',
        '**Motor Deficit:** Loss of Dorsiflexion + Eversion → Foot Drop with high-steppage gait.',
        '**Sensory Deficit:** Anterolateral leg & dorsum of foot (1st web space by Deep Peroneal).',
        '**Tibial Nerve (L4-S3):** Popliteal fossa & deep compartment → Loss of Plantarflexion (no tiptoeing).',
      ],
      keyTakeaways: ['PED: Peroneal Everts and Dorsiflexes; TIP: Tibial Inverts and Plantarflexes'],
    },
    {
      id: 'slide-anat-4-5',
      slideNumber: 5,
      title: 'Popliteal Fossa & Pes Anserinus',
      subtitle: 'Surgical Spaces & Bursae',
      category: 'exam_traps',
      bullets: [
        '**Popliteal Fossa (Superficial to Deep):** Tibial Nerve → Popliteal Vein → Popliteal Artery (NVA).',
        '**Popliteus Muscle:** Unlocks the knee by laterally rotating femur on fixed tibia.',
        '**Pes Anserinus (SGT):** Sartorius (Femoral), Gracilis (Obturator), Semitendinosus (Sciatic).',
        '**Suprapatellar Bursa:** Communicates freely with knee cavity; primary arthrocentesis access.',
      ],
      examTrapWarning: 'Never confuse Prepatellar bursitis (Housemaid\'s knee) with Infrapatellar bursitis (Clergyman\'s knee).',
    },
    {
      id: 'slide-anat-4-6',
      slideNumber: 6,
      title: 'Rapid Revision Comparison Table',
      subtitle: 'Knee Pathology Master Table',
      category: 'summary_table',
      bullets: [
        'High-yield summary table for quick 2-minute revision of knee and lower limb trauma.',
        'Review the key clinical discriminator test and vulnerable anatomical site before exam day.',
      ],
      quickTable: {
        headers: ['Condition / Structure', 'Mechanism / Site', 'Key Clinical Finding', 'Nerve / Root'],
        rows: [
          ['ACL Rupture', 'Valgus twisting blow', 'Lachman test positive, hemarthrosis', 'Tibial translation'],
          ['PCL Rupture', 'Dashboard impact', 'Posterior sag sign positive', 'P-M attachment'],
          ['Peroneal Nerve Injury', 'Fibular neck fracture', 'Foot drop, high steppage gait', 'L4, L5, S1'],
          ['Tibial Nerve Injury', 'Popliteal laceration', 'Loss of tiptoe stance, sole anesthesia', 'S1, S2'],
          ['Pes Anserinus', 'Overuse tendonitis', 'Medial joint line pain below joint', 'Sartorius, Gracilis, ST'],
        ],
      },
    },
  ],

  // Anatomy - Upper Limb Brachial Plexus
  'anat-1': [
    {
      id: 'slide-anat-1-1',
      slideNumber: 1,
      title: 'Brachial Plexus & Upper Limb Nerve Lesions',
      subtitle: 'Anatomy • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        '**Roots (5):** Anterior primary rami of C5, C6, C7, C8, and T1.',
        '**Trunks (3):** Upper (C5-C6), Middle (C7), and Lower (C8-T1).',
        '**Cords (3):** Lateral, Posterior, Medial (named relative to 2nd part of Axillary Artery).',
        '**Terminal Branches:** Musculocutaneous, Axillary, Radial, Median, and Ulnar nerves.',
      ],
      keyTakeaways: ['High exam yield: Erb palsy (upper trunk C5-C6) vs Klumpke palsy (lower trunk C8-T1).'],
      imageUrl: '/assets/medical-images/anat-brachial-plexus.svg',
      imageCaption: 'Brachial Plexus Architecture — Roots, Trunks, Divisions & Cords',
      visualTarget: 'Brachial Plexus Anatomy (C5-T1)',
      whatToLookFor: 'Identify junction of C5 and C6 anterior rami forming the upper trunk (Erb point).',
    },
    {
      id: 'slide-anat-1-2',
      slideNumber: 2,
      title: 'Erb-Duchenne vs Klumpke Paralysis',
      subtitle: 'Traction Injuries & Deformities',
      category: 'anatomy_patho',
      bullets: [
        '**Erb\'s Palsy (C5-C6):** Excessive neck-shoulder traction (breech delivery, motorcycle shoulder impact).',
        '**Erb Posture:** Policeman\'s / Waiter\'s Tip hand (adducted, internally rotated, pronated forearm).',
        '**Klumpke\'s (C8-T1):** Upward hyperabduction traction (catching tree branch, breech arm pull).',
        '**Klumpke Posture:** Total Claw Hand (MCP hyperextension, IP flexion) + Ipsilateral Horner Syndrome (T1).',
      ],
      keyTakeaways: ['Klumpke damages T1 sympathetic preganglionic fibers → Ptosis, Miosis, Anhidrosis.'],
      imageUrl: '/assets/medical-images/anat-claw-hand.svg',
      imageCaption: 'Klumpke Paralysis — Total Claw Hand Deformity (C8-T1)',
      visualTarget: 'Klumpke Total Claw Hand',
      whatToLookFor: 'Hyperextension at MCP joints and flexion at IP joints with thenar/hypothenar intrinsic muscle wasting.',
    },
    {
      id: 'slide-anat-1-3',
      slideNumber: 3,
      title: 'Radial, Median & Ulnar Nerve Syndromes',
      subtitle: 'Fracture Correlations & Hand Deformities',
      category: 'diagnostics',
      bullets: [
        '**Radial Nerve:** Midshaft humerus fracture / Saturday night palsy → Wrist Drop (loss of extension).',
        '**Median Nerve:** Supracondylar humerus fracture & Carpal Tunnel → Ape Thumb & Hand of Benediction.',
        '**Ulnar Nerve:** Medial epicondyle fracture & Guyon canal → Ulnar Claw Hand & positive Froment Sign.',
        '**Axillary Nerve:** Surgical neck humerus fracture → Deltoid paralysis & regimental badge sensory loss.',
      ],
      examTrapWarning: 'Ulnar Paradox: High ulnar lesion (elbow) has LESS severe clawing than low ulnar lesion (wrist).',
    },
    {
      id: 'slide-anat-1-4',
      slideNumber: 4,
      title: 'Nerve Injury Master Summary Table',
      subtitle: 'Upper Limb Rapid Revision',
      category: 'summary_table',
      bullets: [
        'Comprehensive upper limb nerve injury comparison for FMGE clinical and image-based MCQs.',
        'Always check the exact fracture location to predict the corresponding peripheral nerve injury.',
      ],
      quickTable: {
        headers: ['Nerve', 'Vulnerable Location', 'Motor Deformity', 'Sensory Loss Area'],
        rows: [
          ['Radial', 'Spiral groove of humerus', 'Wrist drop, loss of finger extension', '1st dorsal web space (snuffbox)'],
          ['Ulnar', 'Medial epicondyle / Guyon canal', 'Claw hand, Froment sign', 'Medial 1.5 fingers (hypothenar)'],
          ['Median', 'Carpal tunnel / Supracondylar', 'Ape thumb, thenar atrophy', 'Lateral 3.5 fingers (palmar)'],
          ['Axillary', 'Surgical neck of humerus', 'Loss of arm abduction (15-90°)', 'Regimental badge area (lateral shoulder)'],
          ['Long Thoracic', 'Axillary lymph node dissection', 'Winged scapula (Serratus anterior)', 'No major cutaneous loss'],
        ],
      },
    },
  ],

  // Medicine - Cardiology
  'med-1': [
    {
      id: 'slide-med-1-1',
      slideNumber: 1,
      title: 'Cardiology: Arrhythmias & Acute Coronary Syndromes',
      subtitle: 'Medicine • High-Yield Emergency Protocols',
      category: 'overview',
      bullets: [
        '**Tachyarrhythmias:** Narrow complex (SVT, AFib, Flutter) vs Wide complex (VTach, WPW pre-excitation).',
        '**STEMI vs NSTEMI:** STEMI = Transmural ischemia (immediate cath); NSTEMI = Subendocardial ischemia.',
        '**RV Infarction:** Complicates 30-50% of inferior MIs; preload dependent (give normal saline, NO nitrates).',
        '**Heart Failure GDMT:** Quadruple therapy (ARNI/ACEi + Beta-blocker + MRA + SGLT2 inhibitor).',
      ],
      keyTakeaways: ['Immediate synchronized cardioversion for any unstable tachyarrhythmia with pulse.'],
    },
    {
      id: 'slide-med-1-2',
      slideNumber: 2,
      title: 'Tachyarrhythmias Emergency Management Protocol',
      subtitle: 'Adenosine, Amiodarone & Cardioversion',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Regular SVT:** Vagal maneuvers → IV Adenosine (6 mg rapid push, then 12 mg with flush).',
        '**Atrial Fibrillation:** Rate control (Beta-blocker / Diltiazem) + DOAC anticoagulation (CHA2DS2-VASc >= 2/3).',
        '**Stable Monomorphic VT:** IV Amiodarone (150 mg over 10 min) or IV Procainamide.',
        '**Unstable Tachycardia (Shock/Chest Pain):** Immediate Synchronized DC Cardioversion.',
        '**Pulseless VT / VFib:** Immediate CPR + Unsynchronized Defibrillation (Epi + Amiodarone).',
      ],
      keyTakeaways: ['Adenosine has half-life < 10 sec; give via large antecubital vein with rapid saline flush.'],
    },
    {
      id: 'slide-med-1-3',
      slideNumber: 3,
      title: 'STEMI vs RVMI Management Traps',
      subtitle: 'Coronary Anatomy & Contraindicated Drugs',
      category: 'exam_traps',
      bullets: [
        '**Inferior Wall STEMI:** ST elevation in II, III, aVF (Right Coronary Artery RCA occlusion).',
        '**Right Ventricular MI Triad:** Hypotension + Elevated JVP + Clear Lung Fields.',
        '**CONTRAINDICATED in RVMI:** Nitroglycerin, Morphine, Diuretics (cause severe circulatory collapse).',
        '**Emergency Management:** Rapid IV Isotonic Normal Saline volume expansion.',
      ],
      examTrapWarning: 'Never give nitrates or diuretics to a hypotensive patient with inferior STEMI before checking V4R lead.',
      imageUrl: '/images/ibq/cardio_inferior_stemi.jpg',
      imageCaption: '12-Lead ECG — Acute Inferior Wall STEMI (RCA Occlusion)',
      visualTarget: 'Inferior STEMI (ST Elevation II, III, aVF)',
      whatToLookFor: 'Identify ST segment elevation in leads II, III, and aVF with reciprocal ST depression in leads I and aVL.',
    },
    {
      id: 'slide-med-1-4',
      slideNumber: 4,
      title: 'Wolff-Parkinson-White (WPW) & Pre-excitation',
      subtitle: 'Accessory Pathway & Antidysrhythmics',
      category: 'diagnostics',
      bullets: [
        '**ECG Triad:** Short PR interval (<120 ms) + Delta wave (slurred upstroke) + Widened QRS.',
        '**Pathophysiology:** Accessory pathway (Bundle of Kent) bypassing normal AV node delay.',
        '**DOC for Pre-excited AFib:** IV Procainamide or Ibutilide.',
        '**CONTRAINDICATED:** AV nodal blockers (Adenosine, Digoxin, Verapamil, Beta-blockers) precipitate VFib.',
      ],
      keyTakeaways: ['Avoid AV nodal blockers in WPW with pre-excited Atrial Fibrillation.'],
      imageUrl: '/images/ibq/cardiology_wpw_syndrome_ecg.jpg',
      imageCaption: '12-Lead ECG — Wolff-Parkinson-White Pre-excitation (Delta Wave & Short PR)',
      visualTarget: 'WPW Syndrome (Delta Wave & Short PR)',
      whatToLookFor: 'Identify short PR interval (<120 ms), slurred initial delta wave on QRS upstroke, and widened QRS.',
    },
  ],

  // Medicine - Valvular Heart Diseases & Endocarditis
  'med-3': [
    {
      id: 'slide-med-3-1',
      slideNumber: 1,
      title: 'Infective Endocarditis & Modified Duke Criteria',
      subtitle: 'Cardiology • Diagnostic Workup & Stigmata',
      category: 'overview',
      bullets: [
        '**Diagnostic Rule:** Modified Duke Criteria: 2 Major OR 1 Major + 3 Minor OR 5 Minor = Definite IE.',
        '**Major 1 (Blood Cultures):** 2 separate blood cultures positive for typical IE organisms (Viridans, S. aureus).',
        '**Major 2 (Echocardiogram):** Oscillating vegetation, intracardiac abscess, new prosthetic dehiscence.',
        '**Vascular Phenomena:** Janeway lesions (painless macules on palms/soles), splinter hemorrhages.',
        '**Immunologic Phenomena:** Osler nodes (painful nodules on pulp of fingers/toes), Roth spots in retina.',
      ],
      keyTakeaways: ['Janeway lesions = Painless erythematous macules on palms/soles (vascular emboli).', 'Osler nodes = Painful nodules on finger/toe pads (immune complexes).'],
    },
    {
      id: 'slide-med-3-2',
      slideNumber: 2,
      title: 'Valvular Murmurs & Diagnostic Maneuvers',
      subtitle: 'Auscultation Pearls & Dynamic Changes',
      category: 'diagnostics',
      bullets: [
        '**Mitral Stenosis:** Loud S1 + Opening Snap + Mid-diastolic rumble with presystolic accentuation.',
        '**Aortic Stenosis:** Harsh crescendo-decrescendo systolic murmur at right 2nd ICS radiating to carotids + Pulsus parvus et tardus.',
        '**Aortic Regurgitation:** Early diastolic decrescendo at left sternal border + Wide pulse pressure (Corrigan water-hammer).',
        '**Mitral Regurgitation:** Holosystolic blowing murmur at apex radiating to left axilla.',
        '**Carvallo Sign:** Right-sided murmurs increase with inspiration; left-sided increase with expiration.',
      ],
      examTrapWarning: 'All right-sided murmurs INCREASE with inspiration (Carvallo sign); left-sided murmurs increase with expiration.',
    },
    {
      id: 'slide-med-3-3',
      slideNumber: 3,
      title: 'Valvular Disease Quick Comparison Master Table',
      subtitle: 'FMGE High-Yield Summary',
      category: 'summary_table',
      bullets: [
        'Rapid reference guide for valvular heart disease murmurs, radiation patterns, and classic peripheral signs.',
      ],
      quickTable: {
        headers: ['Valvular Lesion', 'Murmur Timing & Character', 'Radiation', 'Classic Physical Signs'],
        rows: [
          ['Mitral Stenosis', 'Mid-diastolic rumble + Opening snap', 'Localized to apex', 'Malar flush, tapping apex beat'],
          ['Aortic Stenosis', 'Crescendo-decrescendo systolic', 'Carotid arteries', 'Pulsus parvus et tardus, SAD triad'],
          ['Aortic Regurgitation', 'Early diastolic decrescendo', 'Left sternal border', 'Corrigan pulse, de Musset sign, Duroziez sign'],
          ['Mitral Regurgitation', 'Holosystolic blowing murmur', 'Left axilla', 'Displaced hyperdynamic apex beat'],
        ],
      },
    },
  ],

  // Medicine - Pulmonology (Asthma & COPD)
  'med-4': [
    {
      id: 'slide-med-4-1',
      slideNumber: 1,
      title: 'Asthma vs COPD: Spirometry & Pathophysiology',
      subtitle: 'Pulmonology • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        '**Obstructive Defect:** Post-bronchodilator spirometry showing FEV1/FVC < 0.70 in both conditions.',
        '**Asthma Reversibility:** Post-bronchodilator FEV1 increase > 12% AND > 200 mL confirms asthma.',
        '**COPD Irreversibility:** Airflow limitation is fixed with post-BD FEV1/FVC < 0.70.',
        '**Diffusion Capacity (DLCO):** Normal or elevated in Asthma; REDUCED in emphysematous COPD.',
      ],
      keyTakeaways: ['Reversible obstruction with normal DLCO = Asthma; Fixed obstruction with reduced DLCO = Emphysema.'],
    },
    {
      id: 'slide-med-4-2',
      slideNumber: 2,
      title: 'GINA Guidelines: Stepwise Asthma Pharmacotherapy',
      subtitle: 'GINA Track 1 (Preferred) vs Track 2 Regimens',
      category: 'pharmacology_mgmt',
      bullets: [
        '**GINA Track 1 (Preferred):** Low-dose ICS-formoterol as single maintenance and reliever therapy (SMART / MART).',
        '**GINA Steps 1 & 2:** As-needed low-dose ICS-formoterol alone (NO daily controller needed for mild symptoms).',
        '**GINA Step 3:** Low-dose daily ICS-formoterol maintenance + as-needed reliever.',
        '**GINA Step 4:** Medium-dose daily ICS-formoterol maintenance + as-needed reliever.',
        '**GINA Step 5:** High-dose ICS-LABA + Add-on LAMA (Tiotropium) or Biologics (Anti-IgE, Anti-IL5).',
      ],
      examTrapWarning: 'SABA monotherapy without ICS is contraindicated due to increased risk of fatal asthma exacerbations.',
    },
    {
      id: 'slide-med-4-3',
      slideNumber: 3,
      title: 'GOLD Guidelines & COPD Management',
      subtitle: 'GOLD ABE Groups & Proven Mortality Reducers',
      category: 'diagnostics',
      bullets: [
        '**GOLD Group A:** Bronchodilator (SABA or LABA/LAMA) for mild infrequent symptoms.',
        '**GOLD Group B:** LABA + LAMA combination (e.g. Indacaterol/Glycopyrronium).',
        '**GOLD Group E:** LABA + LAMA; add Inhaled Corticosteroid (Triple Therapy) if blood eosinophils >= 300 cells/uL.',
        '**Proven Mortality Reducers:** (1) Smoking cessation, (2) Long-Term Oxygen Therapy (LTOT >= 15h/day).',
      ],
      keyTakeaways: ['Only Smoking Cessation and LTOT demonstrate definitive survival improvement in COPD.'],
    },
    {
      id: 'slide-med-4-4',
      slideNumber: 4,
      title: 'Acute Severe Asthma (Status Asthmaticus) Emergency Protocol',
      subtitle: 'Ominous Signs & Escalation Sequence',
      category: 'exam_traps',
      bullets: [
        '**Initial Therapy:** High-flow Oxygen (target SpO2 93-95%) + Nebulized Salbutamol + Ipratropium + IV Hydrocortisone.',
        '**Second-Line Rescue:** IV Magnesium Sulfate (2 g over 20 min) for severe refractory bronchospasm.',
        '**Ominous Signs:** "Silent Chest" (loss of wheezing due to severe air hunger) and PaCO2 >= 42 mmHg.',
        '**Intubation Indications:** Coma, respiratory arrest, or severe refractory acidosis.',
      ],
      examTrapWarning: 'A PaCO2 of 40 mmHg in a breathless, tachypneic asthmatic represents impending respiratory arrest, NOT normocapnia.',
    },
    {
      id: 'slide-med-4-5',
      slideNumber: 5,
      title: 'Pulmonology Master Comparison Table',
      subtitle: 'Asthma vs COPD Quick Revision',
      category: 'summary_table',
      bullets: [
        'High-yield comparison table for rapid 1-minute exam day revision.',
      ],
      quickTable: {
        headers: ['Parameter', 'Bronchial Asthma', 'Chronic Obstructive Pulmonary Disease (COPD)'],
        rows: [
          ['Onset Age', 'Usually childhood / young adult (<40 yrs)', 'Typically older adults (>40-50 yrs, heavy smoking)'],
          ['Airflow Obstruction', 'Reversible (>12% and >200 mL FEV1 increase)', 'Fixed / Irreversible post-BD FEV1/FVC < 0.70'],
          ['DLCO Diffusion', 'Normal or Elevated', 'Significantly Reduced in Emphysema'],
          ['Inflammatory Cells', 'Eosinophils, CD4+ Th2, IL-4/IL-5/IL-13', 'Neutrophils, CD8+ cytotoxic T cells, Macrophages'],
          ['First-Line Controller', 'Inhaled Corticosteroid (ICS-Formoterol)', 'Long-Acting Bronchodilators (LAMA + LABA)'],
        ],
      },
    },
  ],

  // Pharmacology - Autonomic Drugs
  'pharm-1': [
    {
      id: 'slide-pharm-1-1',
      slideNumber: 1,
      title: 'Autonomic Pharmacology & Antidotes',
      subtitle: 'Pharmacology • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        '**Cholinergic (Parasympathetic):** ACh acts on Muscarinic (M1-M5, Gq/Gi) and Nicotinic (Nm, Nn ion channels).',
        '**Adrenergic (Sympathetic):** Norepinephrine & Epinephrine act on Alpha (a1, a2) and Beta (b1, b2, b3) receptors.',
        '**Antidote Master Pairs:** Organophosphates = Atropine + Pralidoxime; Beta-blockers = IV Glucagon; Heparin = Protamine.',
      ],
      keyTakeaways: ['High focus on poisoning presentations and receptor selectivity.'],
      imageUrl: '/assets/medical-images/pharm-dose-response-curve.svg',
      imageCaption: 'Pharmacology Dose-Response — Log Concentration vs Receptor Binding',
      visualTarget: 'Dose-Response Curve & Antagonist Shift',
      whatToLookFor: 'Observe parallel rightward shift with preserved maximum response (100% Emax) indicative of competitive antagonism.',
    },
    {
      id: 'slide-pharm-1-2',
      slideNumber: 2,
      title: 'Organophosphate Poisoning & Antidotes',
      subtitle: 'Toxidrome & Management Sequence',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Mechanism:** Irreversible organophosphate binding to Acetylcholinesterase → massive ACh surge.',
        '**DUMBBELLS Toxidrome:** Diarrhea, Urination, Miosis, Bradycardia, Bronchorrhea, Emesis, Lacrimation, Salivation.',
        '**Atropine Protocol:** Antagonizes muscarinic receptors; end point of titration is clearing of bronchial secretions.',
        '**Pralidoxime (2-PAM):** Regenerates enzyme by hydrolyzing phosphate-ester bond before chemical aging occurs.',
      ],
      examTrapWarning: 'Carbamate poisoning does NOT cause aging; treat with Atropine ONLY (Pralidoxime contraindicated).',
    },
    {
      id: 'slide-pharm-1-3',
      slideNumber: 3,
      title: 'Adrenergic Receptors & Clinical Agonists',
      subtitle: 'Receptor Selectivity Master Rules',
      category: 'diagnostics',
      bullets: [
        '**Alpha-1 (Gq):** Vascular smooth muscle contraction → ↑BP, mydriasis (Phenylephrine, Midodrine).',
        '**Alpha-2 (Gi):** Presynaptic inhibition of sympathetic outflow → ↓BP (Clonidine, Methyldopa in pregnancy).',
        '**Beta-1 (Gs):** Increases heart rate, contractility, and renin release from JG cells (Dobutamine).',
        '**Beta-2 (Gs):** Bronchodilation, uterine relaxation, and vasodilation (Salbutamol, Terbutaline).',
      ],
      keyTakeaways: ['Beta-blocker toxicity antidote is IV Glucagon (bypasses beta receptors via adenylate cyclase).'],
    },
    {
      id: 'slide-pharm-1-4',
      slideNumber: 4,
      title: 'Anticholinergic Toxicity (Atropine Overdose)',
      subtitle: 'Classic Mnemonic & Physostigmine Antidote',
      category: 'exam_traps',
      bullets: [
        '**Toxidrome Mnemonic:** Hot as a hare, Blind as a bat, Dry as a bone, Red as a beet, Mad as a hatter.',
        '**Antidote:** Physostigmine (tertiary amine that crosses Blood-Brain Barrier into CNS).',
        '**Contraindication:** Avoid Physostigmine in TCA overdose with wide QRS (give IV Sodium Bicarbonate).',
      ],
      examTrapWarning: 'Neostigmine and Pyridostigmine are quaternary amines and DO NOT cross the blood-brain barrier.',
    },
  ],

  // OBGYN - Pre-eclampsia & MgSO4
  'obg-2': [
    {
      id: 'slide-obg-2-1',
      slideNumber: 1,
      title: 'Preeclampsia, Eclampsia & MgSO4 Regimens',
      subtitle: 'OBGYN • High-Yield Emergency Obstetrics',
      category: 'overview',
      bullets: [
        '**Diagnostic Criteria:** BP >= 140/90 after 20 weeks gestation + Proteinuria (>= 300 mg/24h or 1+ dipstick).',
        '**Severe Features:** BP >= 160/110, intractable headache, visual scotomata, RUQ pain, platelets < 100,000.',
        '**Eclampsia Definition:** Preeclampsia complicated by generalized tonic-clonic convulsions.',
        '**Drug of Choice:** Magnesium Sulfate (MgSO4) is DOC for seizure prophylaxis and active control.',
      ],
      keyTakeaways: ['Definitive cure for preeclampsia/eclampsia is DELIVERY of fetus and placenta.'],
    },
    {
      id: 'slide-obg-2-2',
      slideNumber: 2,
      title: 'Pritchard vs Zuspan Regimens',
      subtitle: 'MgSO4 Dosing & Monitoring',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Pritchard Loading:** 4 g IV (20% solution over 5 min) + 10 g IM (5 g in each buttock).',
        '**Pritchard Maintenance:** 5 g IM 4-hourly in alternate buttocks for 24h postpartum.',
        '**Zuspan Protocol:** 4 g IV loading over 15-20 min followed by 1–2 g/hr continuous IV infusion.',
        '**Safety Prerequisites:** (1) Patellar reflex present, (2) RR >= 12/min, (3) Urine output >= 30 mL/hr.',
      ],
      examTrapWarning: 'Magnesium toxicity antidote is 10 mL of 10% Calcium Gluconate IV given over 10 minutes.',
    },
    {
      id: 'slide-obg-2-3',
      slideNumber: 3,
      title: 'Magnesium Toxicity Signs & Cut-offs',
      subtitle: 'Clinical Monitoring & Antidote',
      category: 'diagnostics',
      bullets: [
        '**Earliest Warning Sign (8-10 mEq/L):** Loss of Patellar Reflex (Knee Jerk).',
        '**Respiratory Depression (>12 mEq/L):** Bradypnea (<12 breaths/min) and hypoventilation.',
        '**Cardiac Arrest (>15 mEq/L):** Fatal conduction block and asystole.',
        '**Immediate Action:** Stop MgSO4 and administer 10 mL 10% Calcium Gluconate IV slowly over 10 minutes.',
      ],
      keyTakeaways: ['Loss of patellar reflex is the earliest warning sign of toxicity.'],
    },
    {
      id: 'slide-obg-2-4',
      slideNumber: 4,
      title: 'Antihypertensive Protocols in Pregnancy',
      subtitle: 'Safe vs Contraindicated Drugs',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Emergency First-Line:** IV Labetalol (20 mg initial bolus), IV Hydralazine, or Oral Nifedipine.',
        '**Maintenance Drug:** Oral Labetalol or Oral Alpha-Methyldopa (central alpha-2 agonist).',
        '**STRICTLY CONTRAINDICATED:** ACE inhibitors & ARBs (cause fetal renal dysgenesis & oligohydramnios).',
      ],
      examTrapWarning: 'Never give ACEi or ARBs to any pregnant female at any gestational age.',
    },
  ],

  // Anatomy - Thorax: Mediastinum, Heart & Coronary Circulation
  'anat-5': [
    {
      id: 'slide-anat-5-1',
      slideNumber: 1,
      title: 'Mediastinal Divisions & Critical Landmarks',
      subtitle: 'Thoracic Anatomy • FMGE Core',
      category: 'overview',
      bullets: [
        '**Transverse Thoracic Plane:** Extends from Sternal Angle of Louis to T4/T5 intervertebral disc.',
        '**Superior vs Inferior:** Divides mediastinum into superior compartment and inferior compartment.',
        '**Angle of Louis Landmarks:** Tracheal bifurcation (carina), Aortic arch start/end, Azygos vein into SVC.',
      ],
      keyTakeaways: ['Transverse thoracic plane is at the level of T4-T5 intervertebral disc.'],
    },
    {
      id: 'slide-anat-5-2',
      slideNumber: 2,
      title: 'Mediastinal Contents & Compartments',
      subtitle: 'Anatomical Spaces and Differential Diagnoses',
      category: 'anatomy_patho',
      bullets: [
        '**Superior Contents:** Thymus, Brachiocephalic veins, SVC, Aortic arch & 3 branches, Trachea, Esophagus.',
        '**Middle Contents:** Pericardium, Heart, Ascending aorta, Pulmonary trunk, Phrenic nerves.',
        '**Posterior Contents (DATES):** Descending aorta, Azygos veins, Thoracic duct, Esophagus, Sympathetic trunks.',
        '**Anterior Mass (4 Ts):** Thymoma, Teratoma, Thyroid substernal goiter, Terrible lymphoma.',
      ],
      keyTakeaways: ['Posterior mediastinum mnemonic = DATES.'],
    },
    {
      id: 'slide-anat-5-3',
      slideNumber: 3,
      title: 'Coronary Arteries & Territorial Supply',
      subtitle: 'RCA vs LCA Clinical Distribution',
      category: 'diagnostics',
      bullets: [
        '**Right Coronary Artery (RCA):** Supplies SA node (60%), AV node (90%), RV free wall, and PDA (85%).',
        '**Left Anterior Descending (LAD):** Supplies anterior 2/3 of septum, anterior LV, and apex ("widow maker").',
        '**Left Circumflex (LCx):** Supplies lateral LV free wall and SA node in 40% of individuals.',
      ],
      examTrapWarning: 'Coronary dominance is defined by the artery giving rise to the PDA (Posterior Descending Artery). 85% of humans are Right Dominant.',
    },
    {
      id: 'slide-anat-5-4',
      slideNumber: 4,
      title: 'Cardiac Conduction Blood Supply & MI Traps',
      subtitle: 'Nodal Ischemia & Preload Dependence',
      category: 'exam_traps',
      bullets: [
        '**Inferior STEMI:** ST elevation in leads II, III, aVF; high risk of sinus bradycardia and AV block.',
        '**RV Infarction Sign:** ST elevation in lead V4R; triad of hypotension, elevated JVP, clear lungs.',
        '**Preload Collapse:** Nitrates and Diuretics are strictly contraindicated in RV infarction.',
      ],
      examTrapWarning: 'Never administer Nitrates to an Inferior STEMI patient without checking lead V4R for RV involvement.',
      imageUrl: '/images/ibq/cardio_inferior_stemi.jpg',
      imageCaption: '12-Lead ECG — Inferior Wall STEMI (RCA Occlusion & AV Nodal Risk)',
      visualTarget: 'Inferior STEMI (ST Elevation II, III, aVF)',
      whatToLookFor: 'Identify ST segment elevation in leads II, III, and aVF with reciprocal ST depression in leads I and aVL.',
    },
    {
      id: 'slide-anat-5-5',
      slideNumber: 5,
      title: 'Pericardial Spaces, Beck\'s Triad & Pericardiocentesis',
      subtitle: 'Clinical Correlations & Emergency Procedures',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Transverse Sinus of Theile:** Behind Ascending Aorta and Pulmonary trunk, in front of SVC (clamping great vessels in bypass).',
        '**Oblique Sinus:** Cul-de-sac behind left atrium, bounded by pulmonary veins.',
        '**Beck\'s Triad (Tamponade):** Hypotension + Elevated JVP + Muffled Heart Sounds.',
        '**Pericardiocentesis:** Subxiphoid Larrey approach (between xiphoid and left 7th costal cartilage at 45°).',
      ],
      keyTakeaways: ['Larrey space subxiphoid puncture avoids the internal thoracic vessels and pleural cavity.'],
    },
  ],

  // Pathology - Neoplasia
  'path-4': [
    {
      id: 'slide-path-4-1',
      slideNumber: 1,
      title: 'Hallmarks of Cancer & Molecular Oncology',
      subtitle: 'Pathology • FMGE High Priority Core',
      category: 'overview',
      bullets: [
        '**Hallmarks of Cancer:** Self-sufficient growth, evasion of apoptosis, Warburg aerobic glycolysis, VEGF angiogenesis.',
        '**Oncogenes vs TSGs:** Proto-oncogenes need 1 mutation (gain-of-function); TSGs need 2 hits (Knudson hypothesis).',
        '**TP53 (17p):** "Guardian of the genome"; arrests cell cycle at G1/S via p21 or activates BAX apoptosis.',
      ],
      keyTakeaways: ['Warburg Effect = Aerobic glycolysis (glucose -> lactate even in presence of oxygen).'],
    },
    {
      id: 'slide-path-4-2',
      slideNumber: 2,
      title: 'Tumor Suppressor Genes & Clinical Syndromes',
      subtitle: 'TP53, RB1, APC, BRCA, WT1, NF1/2',
      category: 'anatomy_patho',
      bullets: [
        '**TP53 (17p):** Li-Fraumeni syndrome (sarcoma, breast, brain, adrenal cortical carcinoma).',
        '**RB1 (13q):** Retinoblastoma and Osteosarcoma; hypophosphorylated RB arrests E2F transcription.',
        '**APC (5q):** Degrades beta-catenin; loss causes Familial Adenomatous Polyposis (FAP).',
        '**BRCA1/2 (17q/13q):** DNA homologous recombination repair (breast and ovarian carcinomas).',
        '**VHL (3p):** Ubiquitinates HIF-1alpha; loss causes Renal Cell Carcinoma & Hemangioblastomas.',
      ],
      keyTakeaways: ['TP53 is the most common mutated gene in all human cancers.'],
    },
    {
      id: 'slide-path-4-3',
      slideNumber: 3,
      title: 'Chromosomal Translocations in Neoplasia',
      subtitle: 'Classic FMGE Cytogenetic Buzzwords',
      category: 'diagnostics',
      bullets: [
        '**t(9;22) BCR-ABL:** Chronic Myeloid Leukemia (CML) and ALL (Philadelphia chromosome); treat with Imatinib.',
        '**t(15;17) PML-RARA:** Acute Promyelocytic Leukemia (APML - M3); Auer rods in blasts, treat with ATRA.',
        '**t(8;14) c-MYC-IgH:** Burkitt Lymphoma ("starry sky" histopathology, EBV association).',
        '**t(14;18) BCL2-IgH:** Follicular Lymphoma (overexpression of anti-apoptotic BCL2 protein).',
        '**t(11;22):** Ewing Sarcoma (small round blue cells, onion-skin periosteal reaction on X-ray).',
      ],
      examTrapWarning: 'APML t(15;17) has high risk of DIC; urgent treatment with ATRA is curative.',
      imageUrl: '/images/ibq/pathology_auer_rods.jpg',
      imageCaption: 'Bone Marrow Smear — APML (Auer Rods in Promyelocytic Blasts)',
      visualTarget: 'Auer Rods in APML (t(15;17))',
      whatToLookFor: 'Identify needle-like crystalline cytoplasmic inclusions (Auer rods) within leukemic blast cells.',
    },
    {
      id: 'slide-path-4-4',
      slideNumber: 4,
      title: 'Tumor Markers & Clinical Applications',
      subtitle: 'Screening, Monitoring & Staging',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Alpha-fetoprotein (AFP):** Hepatocellular Carcinoma & Yolk Sac (endodermal sinus) Tumors.',
        '**CEA:** Colorectal Carcinoma (primarily used for postoperative recurrence monitoring).',
        '**CA-125:** Epithelial Ovarian Carcinoma.',
        '**CA 19-9:** Pancreatic Adenocarcinoma & Cholangiocarcinoma.',
        '**Calcitonin:** Medullary Thyroid Carcinoma (derived from parafollicular C cells, MEN 2).',
        '**Beta-hCG:** Choriocarcinoma and Complete Hydatidiform Mole.',
        '**S-100:** Melanoma, Schwannoma, Langerhans Cell Histiocytosis.',
      ],
      keyTakeaways: ['Tumor markers are primarily used for MONITORING RESPONSE TO THERAPY and recurrence, not initial definitive diagnosis.'],
    },
  ],

  // =================== BIOCHEMISTRY ===================
  'bio-1': [
    {
      id: 'slide-bio-1-1',
      slideNumber: 1,
      title: 'Michaelis-Menten Kinetics, Km & Vmax',
      subtitle: 'Enzyme Kinetics & Substrate Affinity',
      category: 'overview',
      bullets: [
        '**Michaelis Constant (Km):** Substrate concentration [S] producing half-maximal velocity (1/2 Vmax).',
        '**Affinity Rule:** Lower Km = Higher enzyme-substrate affinity; Higher Km = Lower affinity.',
        '**Vmax Principle:** Maximal velocity when 100% of enzyme catalytic sites are saturated.',
        '**Kinetics Order:** First-order when [S] << Km; Zero-order (rate independent of [S]) when [S] >> Km.',
      ],
      keyTakeaways: ['Km is an intrinsic constant for a given enzyme-substrate pair and is independent of enzyme concentration.'],
    },
    {
      id: 'slide-bio-1-2',
      slideNumber: 2,
      title: 'Lineweaver-Burk Double-Reciprocal Plot',
      subtitle: 'Graphical Analysis of Enzyme Kinetics',
      category: 'diagnostics',
      bullets: [
        '**Equation:** 1/V0 = (Km/Vmax) · (1/[S]) + (1/Vmax), derived from taking reciprocal of Michaelis-Menten equation.',
        '**Y-Intercept:** 1 / Vmax (higher intercept = LOWER Vmax).',
        '**X-Intercept:** -1 / Km (closer to zero = HIGHER Km / lower affinity).',
        '**Slope:** Km / Vmax.',
        '**Competitive Inhibitor:** Same y-intercept (same Vmax); x-intercept shifts right toward zero (↑Km).',
      ],
      keyTakeaways: ['Lineweaver-Burk plots linearize hyperbolic Michaelis-Menten curves into a straight line (y = mx + c).'],
      imageUrl: '/assets/medical-images/biochem-lineweaver-burk.svg',
      imageCaption: 'Lineweaver-Burk Double-Reciprocal Plot — Competitive Inhibition Shift',
      visualTarget: 'Double-Reciprocal Plot (1/V vs 1/[S])',
      whatToLookFor: 'Note lines intersecting on the vertical y-axis (same Vmax) with shifted x-intercept (increased Km).',
    },
    {
      id: 'slide-bio-1-3',
      slideNumber: 3,
      title: 'Competitive vs Noncompetitive vs Uncompetitive Inhibition',
      subtitle: 'Inhibition Patterns & Lineweaver-Burk Graphs',
      category: 'anatomy_patho',
      bullets: [
        '**Competitive:** Inhibitor binds active site. Km INCREASES, Vmax UNCHANGED. Overcome by adding excess substrate.',
        '**Noncompetitive:** Inhibitor binds allosteric site. Km UNCHANGED, Vmax DECREASES. Cannot be overcome by substrate.',
        '**Uncompetitive:** Inhibitor binds ES complex only. BOTH Km and Vmax DECREASE equally → Parallel Lineweaver-Burk lines.',
        '**Irreversible:** Covalent bond (e.g. Aspirin on COX, Organophosphates on AChE) permanently inactivates enzyme.',
      ],
      quickTable: {
        headers: ['Inhibition Type', 'Km Effect', 'Vmax Effect', 'Lineweaver-Burk Shift'],
        rows: [
          ['Competitive', 'Increases (↑)', 'Unchanged', 'Lines intersect on y-axis (same y-intercept)'],
          ['Noncompetitive', 'Unchanged', 'Decreases (↓)', 'Lines intersect on x-axis (same x-intercept)'],
          ['Uncompetitive', 'Decreases (↓)', 'Decreases (↓)', 'Parallel lines (same slope Km/Vmax)'],
        ],
      },
    },
    {
      id: 'slide-bio-1-4',
      slideNumber: 4,
      title: 'Pharmacological & Clinical Enzyme Inhibitors',
      subtitle: 'High-Yield Medical Examples',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Statins (Atorvastatin):** Competitive reversible inhibitors of HMG-CoA reductase (cholesterol pathway).',
        '**Methotrexate:** Competitive inhibitor of Dihydrofolate Reductase (DHFR) in nucleotide synthesis.',
        '**Allopurinol:** Suicide inhibitor of Xanthine Oxidase (lowers uric acid in gout).',
        '**Physostigmine:** Reversible carbamate inhibitor of Acetylcholinesterase (crosses BBB).',
        '**Lead Poisoning:** Noncompetitive inhibitor of Ferrochelatase and ALA dehydratase (heme synthesis).',
      ],
      keyTakeaways: ['High-dose folate can overcome methotrexate inhibition; leucovorin (folinic acid) bypasses DHFR completely.'],
    },
    {
      id: 'slide-bio-1-5',
      slideNumber: 5,
      title: 'FMGE Traps & Calculation Pearls',
      subtitle: 'Avoid Common Examiner Traps',
      category: 'exam_traps',
      bullets: [
        '**Affinity Trap:** A drug with lower Km (e.g. 2 μM) has HIGHER affinity than a drug with Km = 20 μM.',
        '**Half-Max Velocity:** If substrate [S] = Km, reaction rate V0 is EXACTLY half-maximal (1/2 Vmax).',
        '**Vmax Invariance:** Competitive inhibitors do NOT alter Vmax because high substrate outcompetes inhibitor.',
        '**Slope Calculation:** Slope of double-reciprocal plot = Km / Vmax.',
      ],
      examTrapWarning: 'If Lineweaver-Burk lines cross at the vertical y-axis, the inhibition is COMPETITIVE. If they cross at the negative horizontal x-axis, it is NONCOMPETITIVE.',
    },
  ],

  // =================== PHARMACOLOGY - BETA BLOCKERS ===================
  'pharm-2': [
    {
      id: 'slide-pharm-2-1',
      slideNumber: 1,
      title: 'Adrenergic Agonists & Beta Blockers',
      subtitle: 'Pharmacology • Receptor Subtypes & Drug Classification',
      category: 'overview',
      bullets: [
        '**Beta-1 Receptors (Gs):** Located in heart (increases HR/contractility) & kidney JG cells (renin release).',
        '**Beta-2 Receptors (Gs):** Bronchial smooth muscle (bronchodilation) & vascular smooth muscle (vasodilation).',
        '**Cardioselective (AMEBA):** Atenolol, Metoprolol, Esmolol (ultra-short acting, t1/2 ~9 min), Bisoprolol, Acebutolol.',
        '**Non-Selective:** Propranolol (lipophilic, crosses BBB → essential tremor, migraine), Timolol, Nadolol.',
        '**Alpha + Beta Blockers:** Labetalol (DOC in pregnancy preeclampsia & aortic dissection) and Carvedilol (HFrEF).',
      ],
      keyTakeaways: ['AMEBA mnemonic = Atenolol, Metoprolol, Esmolol, Bisoprolol, Acebutolol (Cardioselective Beta-1).'],
      imageUrl: '/assets/medical-images/pharm-dose-response-curve.svg',
      imageCaption: 'Pharmacology Dose-Response — Competitive Antagonist Parallel Shift',
      visualTarget: 'Dose-Response Antagonist Shift',
      whatToLookFor: 'Identify parallel rightward shift with preserved maximum response (100% Emax) indicative of competitive antagonism.',
    },
    {
      id: 'slide-pharm-2-2',
      slideNumber: 2,
      title: 'Clinical Indications, Contraindications & Antidote',
      subtitle: 'Evidence-Based Indications & Toxicity Management',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Evidence-Based Indications:** Post-MI (reduces remodeling & SCD), HFrEF (Carvedilol, Metoprolol succinate, Bisoprolol).',
        '**Contraindications:** Severe Asthma/COPD, 2nd/3rd degree AV Block, Cardiogenic shock, Decompensated Acute HF.',
        '**Pheochromocytoma Rule:** ALWAYS establish Alpha-1 blockade BEFORE starting a Beta-blocker to avoid lethal crisis.',
        '**Overdose Antidote:** IV GLUCAGON (activates adenylyl cyclase via Gs bypass, restoring cAMP and cardiac contractility).',
      ],
      keyTakeaways: ['Glucagon is the antidote for Beta-blocker overdose; Atropine and IV fluids are initial supportive measures.'],
    },
  ],

  // =================== PATHOLOGY - HODGKIN LYMPHOMA ===================
  'path-8': [
    {
      id: 'slide-path-8-1',
      slideNumber: 1,
      title: 'Hodgkin Lymphoma & Reed-Sternberg Cells',
      subtitle: 'Hematopathology • Diagnostic Criteria & Subtypes',
      category: 'overview',
      bullets: [
        '**Hallmark Cell:** Giant binucleated Reed-Sternberg (RS) cell with "owl-eye" prominent eosinophilic nucleoli.',
        '**Classic Immunophenotype:** CD15 (+) and CD30 (+); negative for CD45 and CD20.',
        '**Nodular Sclerosis (~70%):** Most common subtype; collagen bands, lacunar cells, excellent prognosis in young females.',
        '**Mixed Cellularity:** Associated with EBV infection; abundant eosinophils, histiocytes, plasma cells.',
        '**Popcorn Cell Exception:** NLPHL has "Popcorn" L&H cells that are CD20 (+), CD45 (+), CD15 (-), CD30 (-).',
      ],
      keyTakeaways: ['Classic Hodgkin RS cells are CD15(+) and CD30(+). Popcorn cells in NLPHL are CD20(+) and CD45(+).'],
      imageUrl: '/assets/medical-images/histo-reed-sternberg.svg',
      imageCaption: 'Hodgkin Lymphoma — Classical Reed-Sternberg Cell (Owl-Eye Morphology)',
      visualTarget: 'Reed-Sternberg Cell (CD15+, CD30+)',
      whatToLookFor: 'Examine mirror-image bilobed nuclei with prominent cherry-red inclusion-like nucleoli surrounded by clear halos.',
    },
    {
      id: 'slide-path-8-2',
      slideNumber: 2,
      title: 'Ann Arbor Staging & ABVD Chemotherapy Protocol',
      subtitle: 'Clinical Staging & Standard First-Line Regimen',
      category: 'pharmacology_mgmt',
      bullets: [
        '**Ann Arbor Stage I & II:** Confined to ONE side of diaphragm (I = single region; II = >=2 regions).',
        '**Ann Arbor Stage III:** Lymph node involvement on BOTH sides of the diaphragm (may include spleen Stage III-S).',
        '**Ann Arbor Stage IV:** Disseminated involvement of extralymphatic organs (bone marrow, liver, lungs).',
        '**ABVD Regimen:** Adriamycin (Cardiotoxicity), Bleomycin (Pulmonary fibrosis), Vinblastine (Neuropathy), Dacarbazine.',
      ],
      keyTakeaways: ['Bleomycin toxicity manifests as pulmonary fibrosis (monitor DLCO); Doxorubicin causes dilated cardiomyopathy (monitor LVEF).'],
    },
  ],

  // =================== PHYSIOLOGY - ACTION POTENTIAL ===================
  'phys-2': [
    {
      id: 'slide-phys-2-1',
      slideNumber: 1,
      title: 'Membrane Potentials & Action Potential Biophysics',
      subtitle: 'Nerve-Muscle Physiology • Ion Gradients & Refractory Periods',
      category: 'overview',
      bullets: [
        '**Resting Membrane Potential:** -70 mV in nerve axons; -90 mV in skeletal and ventricular myocytes.',
        '**RMP Maintenance:** High resting K+ permeability (K+ leak channels) + Electrogenic Na+/K+ ATPase (3 Na+ out, 2 K+ in).',
        '**Phase 0 Depolarization:** Voltage-gated Na+ channel influx (blocked by Tetrodotoxin TTX).',
        '**Repolarization:** Inactivation of Na+ channels + Voltage-gated K+ channel efflux (blocked by TEA).',
        '**Refractory Periods:** Absolute = Na+ channels inactivated; Relative = elevated threshold during late repolarization.',
      ],
      keyTakeaways: ['Absolute refractory period sets the upper limit for action potential firing frequency and ensures unidirectional conduction.'],
      imageUrl: '/assets/medical-images/physio-action-potential.svg',
      imageCaption: 'Ventricular Action Potential — Phases 0 to 4 Ion Dynamics',
      visualTarget: 'Cardiac Action Potential Curve',
      whatToLookFor: 'Identify Phase 0 steep upstroke (fast Na+ channels) followed by Phase 2 plateau (Ca2+ influx).',
    },
  ],
};

/**
 * Generates an exam-oriented visual crash course module for any FMGE topic.
 */
export function generateSlideDeck(
  subjectId: string,
  topicId: string,
  topicName?: string
): SlideDeck {
  const topicIntel: NormalizedTopicIntelligence = getNormalizedTopicIntelligence(subjectId, topicId, topicName);
  const key = topicId;
  const verifiedSlides = VERIFIED_TOPIC_SLIDES[key] || [];

  if (VERIFIED_TOPIC_SLIDES[key] && VERIFIED_TOPIC_SLIDES[key].length > 0) {
    const slides = [...VERIFIED_TOPIC_SLIDES[key]];
    // If none of the static slides currently has an image, attach verified visual asset if one genuinely exists
    if (!slides.some((s) => s.imageUrl)) {
      const topicNameForLookup = topicName || topicIntel.canonicalName;
      const verifiedAsset = getVerifiedVisualAssetForTopic(subjectId, topicNameForLookup);
      if (verifiedAsset) {
        const targetIdx = slides.length > 1 ? 1 : 0;
        slides[targetIdx] = {
          ...slides[targetIdx],
          imageUrl: verifiedAsset.imageUrl,
          imageCaption: verifiedAsset.title,
          visualTarget: verifiedAsset.title,
          whatToLookFor: verifiedAsset.whatToLookFor,
        };
      }
    }
    return {
      topicId,
      topicName: topicIntel.canonicalName,
      subjectId,
      subjectName: topicIntel.subjectName,
      slides,
    };
  }

  // Dynamic Topic-Type-Aware Slide Generation
  const dynamicSlides: VisualSlideItem[] = [];

  switch (topicIntel.topicType) {
    case 'biochemical_concept':
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — Fundamentals & Kinetic Principles`,
          subtitle: `${topicIntel.subjectName} • FMGE Biochemical Review`,
          category: 'overview',
          bullets: [
            `**Core Mechanism:** ${topicIntel.conceptClusters[0] || 'Enzymatic kinetics and substrate binding equilibria'}.`,
            `**Rate-Limiting Factors:** ${topicIntel.conceptClusters[1] || 'Regulatory allosteric controls and coenzyme requirements'}.`,
            '**Kinetic Parameters:** Master the mathematical relationship between Km, Vmax, and substrate saturation.',
            '**Exam Priority:** Focus on graphical transformations and enzyme modulation patterns.',
          ],
          keyTakeaways: [`Understand intrinsic enzyme affinity (Km) and maximal catalytic velocity (Vmax).`],
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Lineweaver-Burk & Graphical Transformations',
          subtitle: 'Double-Reciprocal Plot Diagnostics',
          category: 'diagnostics',
          bullets: [
            '**Double-Reciprocal Equation:** 1/V0 = (Km/Vmax) · (1/[S]) + (1/Vmax).',
            '**X-Intercept:** -1 / Km (closer to zero = higher Km / lower substrate affinity).',
            '**Y-Intercept:** 1 / Vmax (higher intercept = lower maximal catalytic velocity).',
            '**Slope:** Km / Vmax.',
          ],
          keyTakeaways: ['Graphical analysis allows rapid visual identification of inhibition mechanisms.'],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: 'Inhibition Patterns & Clinical Pharmacology',
          subtitle: 'Competitive, Noncompetitive & Uncompetitive Mechanisms',
          category: 'anatomy_patho',
          bullets: [
            '**Competitive Inhibition:** ↑Km, unchanged Vmax (overcome by substrate). E.g. Statins, Methotrexate.',
            '**Noncompetitive Inhibition:** Unchanged Km, ↓Vmax (allosteric binding). E.g. Heavy metals, Lead.',
            '**Uncompetitive Inhibition:** ↓Km, ↓Vmax (binds ES complex only). Parallel Lineweaver-Burk lines.',
            '**Irreversible Inhibition:** Covalent active site binding (e.g. Aspirin, Organophosphates).',
          ],
          quickTable: {
            headers: ['Inhibition Mechanism', 'Km Change', 'Vmax Change', 'Lineweaver-Burk Intercepts'],
            rows: [
              ['Competitive', 'Increases (↑)', 'Unchanged', 'Same y-intercept (1/Vmax)'],
              ['Noncompetitive', 'Unchanged', 'Decreases (↓)', 'Same x-intercept (-1/Km)'],
              ['Uncompetitive', 'Decreases (↓)', 'Decreases (↓)', 'Parallel lines (same slope)'],
            ],
          },
        },
        {
          id: `slide-${topicId}-4`,
          slideNumber: 4,
          title: 'FMGE Traps & High-Yield Calculations',
          subtitle: 'Examiner Pitfalls & Buzzwords',
          category: 'exam_traps',
          bullets: [
            '**Affinity Rule:** Never confuse Km with affinity: Lower Km indicates HIGHER substrate affinity.',
            '**Half-Velocity:** At [S] = Km, the reaction rate is exactly half of Vmax (1/2 Vmax).',
            '**Shift Direction:** Competitive inhibitors shift the Lineweaver-Burk plot to the right.',
          ],
          examTrapWarning: 'Distinguish between reversible competitive inhibitors (overcome by substrate) and irreversible suicide inhibitors.',
        }
      );
      break;

    case 'anatomical_structure':
      // Region-aware slide generation: only limb/nerve topics feature characteristic
      // peripheral-nerve posture examples; abdomen/embryology/thorax/pelvis/head-neck
      // topics must never receive cross-regional nerve-lesion content.
      const isNeuromuscularRegion =
        /upper limb|lower limb|knee|brachial|plexus|nerve|peroneal|tibial|radial|ulnar|median|femoral|hand|foot/i.test(topicIntel.canonicalName);
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — Anatomical Organization`,
          subtitle: `${topicIntel.subjectName} • Surgical & Regional Anatomy`,
          category: 'overview',
          bullets: [
            `**Topographical Boundaries:** ${topicIntel.conceptClusters[0] || 'Anatomical boundaries and fascial compartments'}.`,
            `**Neurovascular Relations:** ${topicIntel.conceptClusters[1] || 'Arterial, venous, and neural courses'}.`,
            '**Surgical Landmarks:** Mastering fascial sheaths, muscular attachments, and regional spaces.',
            '**Exam Correlation:** High-frequency cross-sections and applied clinical trauma questions.',
          ],
          keyTakeaways: ['Memorize neurovascular relations from superficial to deep in this region.'],
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Innervation, Blood Supply & Functional Mechanics',
          subtitle: 'Regional Distribution & Autonomous Zones',
          category: 'anatomy_patho',
          bullets: [
            '**Motor Distribution:** Segmental muscle innervation and pathognomonic functional deficits.',
            '**Sensory Innervation:** Cutaneous nerve territories and autonomous sensory testing points.',
            '**Vascular Supply:** Collateral arterial anastomoses and vulnerability to ischemic necrosis.',
          ],
          keyTakeaways: ['Identify autonomous sensory testing zones for individual peripheral nerves.'],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: isNeuromuscularRegion ? 'Clinical Lesions, Nerve Entrapments & Surgical Traps' : 'Regional Clinical Correlations & Surgical Traps',
          subtitle: isNeuromuscularRegion ? 'High-Yield Postures & Signs' : 'Topographical Correlates',
          category: 'exam_traps',
          bullets: isNeuromuscularRegion
            ? [
                '**Characteristic Deformities:** Classic postures (e.g. wrist drop, claw hand, foot drop, winged scapula).',
                '**Fracture Associations:** Vulnerable sites at surgical neck, midshaft groove, and joint articulations.',
                '**Entrapment Points:** Predilection across tight fibro-osseous canals and fibrous arches.',
              ]
            : [
                '**Visceral Relations:** Peritoneal compartments, retroperitoneal spaces, and clinical spread.',
                '**Surgical Approaches:** High-yield anatomical safe zones and operative access routes.',
                '**Vascular Territories:** Watershed zones and their acute pathological sequelae.',
              ],
          ...(isNeuromuscularRegion
            ? { examTrapWarning: 'Always evaluate proximal vs distal nerve lesions; distal lesions exhibit paradoxical worsening of deformities.' }
            : { examTrapWarning: 'Map the regional anatomy to its applied surgical and pathological correlations for FMGE.' }),
        }
      );
      break;

    case 'pharmacological_class':
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — Mechanisms & Receptors`,
          subtitle: `${topicIntel.subjectName} • Drug Class Review`,
          category: 'overview',
          bullets: [
            `**Primary Receptor Target:** ${topicIntel.conceptClusters[0] || 'Receptor selectivity and second messenger signaling'}.`,
            `**Pharmacodynamics:** ${topicIntel.conceptClusters[1] || 'Cardiovascular, autonomic, and organ effects'}.`,
            '**Classification:** Key prototype agents, subtype selectivity, and half-life kinetics.',
          ],
          keyTakeaways: ['Distinguish between selective and non-selective receptor antagonists.'],
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Clinical Indications & First-Line Protocols',
          subtitle: 'Evidence-Based Pharmacotherapy',
          category: 'pharmacology_mgmt',
          bullets: [
            '**Approved Indications:** High-yield clinical guideline indications and proven mortality benefits.',
            '**Dosing Strategy:** Emergency acute administration vs chronic outpatient maintenance.',
            '**Special Populations:** Pregnancy safety categories, renal dose adjustments, and elderly precautions.',
          ],
          keyTakeaways: ['Know the specific agent of choice for pregnancy-induced disorders and emergencies.'],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: 'Contraindications, Adverse Reactions & Antidotes',
          subtitle: 'Toxicity Management & Drug Interactions',
          category: 'exam_traps',
          bullets: [
            '**Absolute Contraindications:** Life-threatening risks (e.g. active bronchospasm, advanced heart block).',
            '**Key Interactions:** Important CYP450 inducer/inhibitor interactions and additive toxicities.',
            '**Specific Antidotes:** First-line emergency reversal agents and stabilization protocols.',
          ],
          examTrapWarning: 'Never administer non-selective agents in active bronchospasm or high-degree AV block.',
        }
      );
      break;

    case 'clinical_disease':
    default: {
      const kb = getMedicalTopicKnowledge(subjectId, topicId, topicName || topicIntel.canonicalName);
      dynamicSlides.push(
        {
          id: `slide-${topicId}-1`,
          slideNumber: 1,
          title: `${topicIntel.canonicalName} — High-Yield Clinical Core`,
          subtitle: `${topicIntel.subjectName} • FMGE Core Blueprint`,
          category: 'overview',
          bullets: kb.coreConcepts.slice(0, 4).map((c, i) => {
            const prefixes = ['**Core Pathophysiology:**', '**Clinical Presentation:**', '**Key Diagnostic Finding:**', '**Hallmark Feature:**'];
            return c.startsWith('**') ? c : `${prefixes[i % prefixes.length]} ${c}`;
          }),
          keyTakeaways: kb.keyTakeaways.length > 0 ? [kb.keyTakeaways[0]] : [kb.highYieldSummary],
          examTrapWarning: kb.examTrap,
        },
        {
          id: `slide-${topicId}-2`,
          slideNumber: 2,
          title: 'Diagnostic Algorithm & Gold Standard',
          subtitle: 'Best Initial vs Confirmatory Modalities',
          category: 'diagnostics',
          bullets: [
            `**Gold-Standard Test:** ${kb.goldStandardTest}`,
            `**Classic Presentation:** ${kb.classicPresentation}`,
            `**Core Discriminator:** ${kb.keyTakeaways[0] || 'Prioritize definitive diagnostic confirmation over non-specific screening.'}`,
          ],
          keyTakeaways: [kb.goldStandardTest],
        },
        {
          id: `slide-${topicId}-3`,
          slideNumber: 3,
          title: 'Guideline Management & Stepwise Regimens',
          subtitle: 'Evidence-Based Interventions',
          category: 'pharmacology_mgmt',
          bullets: [
            `**First-Line Management:** ${kb.firstLineTreatment}`,
            `**Clinical Takeaway:** ${kb.keyTakeaways[1] || 'Guideline-directed medical therapy.'}`,
            `**Common Pitfall:** ${kb.examTrap}`,
          ],
          keyTakeaways: [kb.firstLineTreatment],
          examTrapWarning: kb.examTrap,
        },
        {
          id: `slide-${topicId}-4`,
          slideNumber: 4,
          title: 'FMGE Exam Traps & Lookalike Differentials',
          subtitle: 'Clinical Vignette Discriminators',
          category: 'exam_traps',
          bullets: [
            `**Top Exam Trap:** ${kb.examTrap}`,
            `**Diagnostic Discriminator:** ${kb.keyTakeaways[0] || 'Differentiate primary diagnostic criteria from clinical mimics.'}`,
            `**Guideline Rule:** ${kb.keyTakeaways[1] || 'Follow structured guideline escalation.'}`,
          ],
          keyTakeaways: [kb.examTrap],
          examTrapWarning: kb.examTrap,
        }
      );
      break;
    }
  }

  // Shared topic-contamination validation boundary: drop any slide whose content carries
  // cross-topic/regional-anatomy contamination for the ACTIVE topic before it reaches the UI.
  const topicNameForValidation = topicName || topicIntel.canonicalName;
  const safeSlides = filterTopicSafeContent(dynamicSlides, subjectId, topicId, topicNameForValidation, (s) => `${s.title} ${s.subtitle} ${(s.bullets || []).join(' ')} ${(s.keyTakeaways || []).join(' ')} ${s.examTrapWarning || ''}`, topicIntel.topicType);

  // Attach strictly verified medical image if an authentic match exists for the topic
  const topicNameForLookup = topicName || topicIntel.canonicalName;
  const verifiedAsset = getVerifiedVisualAssetForTopic(subjectId, topicNameForLookup);
  if (verifiedAsset && safeSlides.length > 0) {
    const targetIdx = safeSlides.length > 1 ? 1 : 0;
    if (!safeSlides[targetIdx].imageUrl) {
      safeSlides[targetIdx].imageUrl = verifiedAsset.imageUrl;
      safeSlides[targetIdx].imageCaption = verifiedAsset.title;
      safeSlides[targetIdx].visualTarget = verifiedAsset.title;
      safeSlides[targetIdx].whatToLookFor = verifiedAsset.whatToLookFor;
    }
  }

  return {
    topicId,
    topicName: topicIntel.canonicalName,
    subjectId,
    subjectName: topicIntel.subjectName,
    slides: safeSlides,
  };
}
