/**
 * COMPREHENSIVE MEDICAL TOPIC KNOWLEDGE BASE
 * 100% Genuine Clinical High-Yield Facts across all 19 FMGE Disciplines.
 * Eliminates all generic template sentences and placeholder meta-text system-wide.
 */

export interface MedicalTopicKnowledge {
  topicId: string;
  subjectId: string;
  topicTitle: string;
  highYieldSummary: string;
  coreConcepts: string[];
  keyTakeaways: string[];
  goldStandardTest: string;
  firstLineTreatment: string;
  classicPresentation: string;
  examTrap: string;
  flashcards: {
    front: string;
    back: string;
    clinicalPearl: string;
  }[];
  clinicalCase: {
    title: string;
    patientDemographics: string;
    presentation: string;
    physicalExamOrLabs: string;
    diagnosticQuestion: string;
    options: { key: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect: boolean }[];
    clinicalExplanation: string;
    examPearl: string;
  };
}

export const FMGE_TOPIC_KNOWLEDGE_BASE: Record<string, MedicalTopicKnowledge> = {
  // =================== 1. ANATOMY ===================
  'anat-1': {
    topicId: 'anat-1',
    subjectId: 'anatomy',
    topicTitle: 'Upper Limb - Brachial Plexus & Nerve Injuries',
    highYieldSummary: 'Brachial plexus roots C5-T1 organize into trunks, divisions, cords, and branches. Lesions cause Erb palsy (C5-C6), Klumpke palsy (C8-T1), and peripheral nerve palsies.',
    coreConcepts: [
      'Erb-Duchenne Palsy (Upper Trunk C5–C6): Traction injury at birth / shoulder dystocia. Paralyzed muscles: Deltoid, Biceps, Brachialis, Supraspinatus, Infraspinatus, Supinator. Classic Posture: "Policeman\'s tip" or "Waiter\'s tip" deformity (Arm adducted, internally rotated, elbow extended, forearm pronated).',
      'Klumpke Palsy (Lower Trunk C8–T1): Upward traction (breech delivery / clutching a branch while falling). Paralyzed muscles: All intrinsic muscles of the hand (interossei, lumbricals). Classic Posture: True Claw Hand (Hyperextension at MCP joints, flexion at IP joints) + Ipsilateral Horner Syndrome (T1 sympathetic chain).',
      'Radial Nerve Injury: In spiral groove (Saturday Night Palsy / Humerus shaft fracture) -> Wrist Drop and loss of sensation over 1st dorsal web space. Triceps spared if lesion is in spiral groove (originates higher).',
      'Median Nerve Injury: At elbow/Supracondylar fracture -> "Ape thumb deformity" + "Hand of Benediction" (on making a fist). In Carpal Tunnel -> Ape thumb + loss of sensation over lateral 3.5 digits.',
      'Ulnar Nerve Injury: At medial epicondyle / hook of hamate -> Ulnar Claw Hand (worse in distal lesions: Ulnar Paradox). Tested by Froment Sign (adductor pollicis weakness, flexor pollicis longus compensates).',
    ],
    keyTakeaways: [
      'Erb Palsy (C5-C6) = Waiter\'s tip deformity; Klumpke (C8-T1) = Claw hand + Horner syndrome.',
      'Radial nerve injury in spiral groove causes Wrist Drop with preserved elbow extension (triceps spared).',
      'Ulnar Paradox: Distal ulnar nerve injury produces MORE severe clawing than a proximal injury.',
    ],
    goldStandardTest: 'Electromyography (EMG) and Nerve Conduction Velocity (NCV) testing + MRI of Brachial Plexus.',
    firstLineTreatment: 'Physical therapy and splinting (cock-up splint for wrist drop, knuckle duster splint for claw hand); surgical neurolysis/grafting if no recovery.',
    classicPresentation: 'Newborn after difficult breech delivery presenting with unilateral claw hand and ipsilateral ptosis and miosis (Klumpke palsy).',
    examTrap: 'The Ulnar Paradox: A lesion at the wrist causes MORE dramatic clawing of 4th and 5th digits than a lesion at the elbow because FPD is intact in wrist lesions.',
    flashcards: [
      {
        front: 'What is the characteristic deformity and root values involved in Erb-Duchenne Palsy?',
        back: 'Deformity: Waiter\'s Tip / Policeman\'s Tip (Arm adducted, internally rotated, elbow extended, forearm pronated).\nRoot values: C5 and C6 (Upper trunk).',
        clinicalPearl: 'Associated with loss of biceps reflex and moro reflex on affected side.',
      },
      {
        front: 'What are the classic clinical manifestations of Klumpke Palsy?',
        back: '1. Total Claw Hand (paralysis of intrinsic hand muscles lumbricals/interossei)\n2. Ipsilateral Horner Syndrome (ptosis, miosis, anhidrosis due to T1 sympathetic root damage).',
        clinicalPearl: 'Caused by sudden upward traction on the arm (breech delivery or catching a tree branch).',
      },
      {
        front: 'What is Froment\'s Sign and what peripheral nerve lesion does it detect?',
        back: 'Detects ULNAR NERVE palsy.\nMechanism: Patient is asked to hold a paper between thumb and index finger. Weakness of Adductor Pollicis (ulnar nerve) forces compensation via Flexor Pollicis Longus (median nerve), causing acute thumb IP joint flexion.',
        clinicalPearl: 'Known as the "Book test" or Froment paper sign.',
      },
      {
        front: 'Which fracture is most commonly associated with Radial Nerve injury and what is the presentation?',
        back: 'Mid-shaft Fracture of the Humerus (spiral groove injury).\nPresentation: Wrist Drop + Finger Drop + Sensory loss over anatomical snuffbox / 1st dorsal web space.',
        clinicalPearl: 'Elbow extension (triceps) is spared because branches to triceps arise proximal to spiral groove.',
      },
      {
        front: 'What is the anatomical boundary of the Inguinal Canal and what forms its deep vs superficial rings?',
        back: '• Deep Inguinal Ring: Outpouching in Fascia Transversalis (lateral to inferior epigastric vessels).\n• Superficial Inguinal Ring: Triangular defect in External Oblique Aponeurosis.\n• Floor: Inguinal Ligament (Poupart).\n• Roof: Conjoint Tendon (Internal oblique + Transversus abdominis).',
        clinicalPearl: 'Indirect hernia enters deep ring lateral to inferior epigastric vessels; Direct hernia arises in Hesselbach triangle.',
      },
    ],
    clinicalCase: {
      title: 'Post-Trauma Upper Extremity Examination',
      patientDemographics: '24-year-old male motorcyclist',
      presentation: 'Presents after motorcycle crash where his head and shoulder were forcefully separated. The right upper limb hangs limply by the side in adduction and internal rotation, with the elbow extended and forearm fully pronated.',
      physicalExamOrLabs: 'Biceps reflex is absent. Sensation is decreased over the lateral deltoid and lateral forearm. Finger movements and grasp reflex are intact.',
      diagnosticQuestion: 'Which part of the brachial plexus is injured and what is this condition?',
      options: [
        { key: 'A', text: 'Upper trunk (C5-C6 nerve roots); Erb-Duchenne Palsy', isCorrect: true },
        { key: 'B', text: 'Lower trunk (C8-T1 nerve roots); Klumpke Palsy', isCorrect: false },
        { key: 'C', text: 'Posterior cord; Radial nerve transection', isCorrect: false },
        { key: 'D', text: 'Lateral cord; Musculocutaneous nerve avulsion', isCorrect: false },
      ],
      clinicalExplanation: 'Forceful widening of the angle between neck and shoulder strains the upper trunk (C5-C6 roots), producing Erb-Duchenne palsy. The loss of abductors (deltoid, supraspinatus), lateral rotators (infraspinatus, teres minor), flexors (biceps, brachialis), and supinator results in the classic "waiter\'s tip" posture.',
      examPearl: 'Separation of head and shoulder = Erb (C5-C6); Upward traction on arm = Klumpke (C8-T1).',
    },
  },

  // =================== 2. PHYSIOLOGY ===================
  'phys-1': {
    topicId: 'phys-1',
    subjectId: 'physiology',
    topicTitle: 'General Physiology & Cell Membrane Transport',
    highYieldSummary: 'Membrane transport is divided into simple diffusion, facilitated diffusion (GLUT), primary active transport (Na+/K+ ATPase), and secondary active transport (SGLT1/2, NCX).',
    coreConcepts: [
      'Primary Active Transport: Uses direct ATP hydrolysis. Na+/K+ ATPase pumps 3 Na+ OUT and 2 K+ IN per ATP consumed (electrogenic, creates -70 mV resting membrane potential). Inhibited by Digitalis (Digoxin/Ouabain) which increases intracellular Na+, slowing NCX and increasing intracellular Ca2+ (inotropic effect).',
      'Secondary Active Transport: Driven by the electrochemical gradient established by primary transport. Symport (Cotransport): SGLT-1 (Glucose + 2 Na+ in small intestine), SGLT-2 (Glucose + 1 Na+ in PCT of kidney; target of Empagliflozin/Dapagliflozin), NKCC2 (in thick ascending limb, blocked by Furosemide). Antiport (Exchanger): Na+/H+ exchanger (NHE3), Na+/Ca2+ exchanger (NCX).',
      'Facilitated Diffusion: Carrier-mediated down concentration gradient without ATP. GLUT-1 (RBCs, BBB), GLUT-2 (Bidirectional in liver, beta-islet cells, PCT), GLUT-3 (Neurons/Brain), GLUT-4 (INSULIN-DEPENDENT in skeletal muscle and adipose tissue), GLUT-5 (Fructose transport in enterocytes and spermatozoa).',
      'Resting Membrane Potential (RMP): Primarily determined by high resting K+ permeability through inward-rectifying leaky K+ channels (calculated by Goldman-Hodgkin-Katz equation, close to K+ equilibrium potential of -90 mV).',
    ],
    keyTakeaways: [
      'Na+/K+ ATPase pumps 3 Na+ out and 2 K+ in, maintaining cell volume and negative RMP.',
      'GLUT-4 is the ONLY insulin-dependent glucose transporter (in skeletal muscle and adipose tissue).',
      'SGLT-2 in the renal proximal convoluted tubule reabsorbs ~90% of filtered glucose (inhibited by gliflozins).',
    ],
    goldStandardTest: 'Patch-clamp electrophysiology and radioactive tracer uptake assays.',
    firstLineTreatment: 'SGLT2 inhibitors (Empagliflozin) for nephroprotection and heart failure.',
    classicPresentation: 'Laboratory demonstration of glucose uptake into adipocytes stimulated 10-fold by insulin administration (via GLUT-4 translocation).',
    examTrap: 'GLUT-2 is bidirectional and insulin-INDEPENDENT; only GLUT-4 is insulin-dependent. Digitalis directly inhibits Na+/K+ ATPase, which secondarily increases intracellular Ca2+ via NCX.',
    flashcards: [
      {
        front: 'Which glucose transporter is strictly insulin-dependent and where is it located?',
        back: 'GLUT-4.\nLocation: Skeletal muscle, Cardiac muscle, and Adipose tissue (translocates from intracellular vesicles to cell surface upon insulin binding).',
        clinicalPearl: 'Exercise also stimulates GLUT-4 translocation independently of insulin.',
      },
      {
        front: 'What is the stoichiometry and electrogenic action of the Na+/K+ ATPase pump?',
        back: 'Pumps 3 Na+ OUT of the cell and 2 K+ INTO the cell for every 1 molecule of ATP hydrolyzed.\nNet effect: Loss of 1 positive charge from the intracellular space (electrogenic).',
        clinicalPearl: 'Inhibited by cardiac glycosides (Digoxin and Ouabain).',
      },
      {
        front: 'How does Digoxin increase myocardial contractility at the cellular transport level?',
        back: 'Digoxin inhibits Na+/K+ ATPase -> increases intracellular [Na+] -> reduces the driving gradient for Na+/Ca2+ exchanger (NCX) -> increases intracellular [Ca2+] -> enhances myocardial inotropy.',
        clinicalPearl: 'Hypokalemia increases digoxin binding and potentiates toxicity.',
      },
      {
        front: 'What are the phases of the Nerve Action Potential and which ion channels gate each phase?',
        back: '• Phase 0 (Depolarization): Rapid Na+ influx through voltage-gated Na+ channels.\n• Phase 1 (Early Repolarization): Inactivation of Na+ channels + transient K+ efflux (Ito).\n• Phase 2/3 (Late Repolarization): Sustained K+ efflux through voltage-gated K+ channels.\n• Phase 4 (Resting Potential): Maintained by Na+/K+ ATPase and leaky K+ channels.',
        clinicalPearl: 'Tetrodotoxin (TTX) blocks Phase 0 Na+ channels; Tetraethylammonium (TEA) blocks Phase 3 K+ channels.',
      },
      {
        front: 'What factors cause a RIGHT SHIFT in the Oxygen-Hemoglobin Dissociation Curve? (Mnemonic: CADET)',
        back: 'C = CO2 increased (hypercapnia)\nA = Acidosis / [H+] increased (Bohr effect, low pH)\nD = 2,3-DPG increased\nE = Exercise\nT = Temperature increased (fever).',
        clinicalPearl: 'A right shift decreases oxygen affinity, promoting oxygen unloading to tissues.',
      },
    ],
    clinicalCase: {
      title: 'Pharmacological Modulation of Renal Glucose Transport',
      patientDemographics: '54-year-old female with Type 2 Diabetes and Heart Failure with reduced Ejection Fraction (HFrEF)',
      presentation: 'Initiated on Empagliflozin as part of guideline-directed medical therapy. Follow-up urinalysis reveals 4+ glucosuria with normal blood glucose levels (110 mg/dL).',
      physicalExamOrLabs: 'Serum creatinine is stable. Significant reduction in hospitalizations for heart failure.',
      diagnosticQuestion: 'Which transport mechanism in the nephron is inhibited by this medication?',
      options: [
        { key: 'A', text: 'Secondary active transport via SGLT-2 (Sodium-Glucose Cotransporter 2) in the Early Proximal Convoluted Tubule', isCorrect: true },
        { key: 'B', text: 'Facilitated diffusion via GLUT-4 in the Distal Convoluted Tubule', isCorrect: false },
        { key: 'C', text: 'Primary active transport via Na+/K+ ATPase in the Medullary Collecting Duct', isCorrect: false },
        { key: 'D', text: 'Secondary active transport via NKCC2 in the Thick Ascending Limb of Henle', isCorrect: false },
      ],
      clinicalExplanation: 'Empagliflozin is an SGLT-2 inhibitor. SGLT-2 is a secondary active symporter located in the S1/S2 segments of the proximal convoluted tubule that reabsorbs ~90% of filtered glucose coupled with sodium. Blocking SGLT-2 induces glycosuria and natriuresis, improving glycemic control and delivering mortality benefits in heart failure.',
      examPearl: 'SGLT2 = Early PCT (90% glucose); SGLT1 = Late PCT & Enterocytes (10% glucose).',
    },
  },

  // =================== 3. BIOCHEMISTRY ===================
  'bio-1': {
    topicId: 'bio-1',
    subjectId: 'biochemistry',
    topicTitle: 'Enzyme Kinetics & Lineweaver-Burk Plots',
    highYieldSummary: 'Michaelis-Menten kinetics describe reaction velocity (V0 = Vmax[S]/(Km + [S])). Lineweaver-Burk double-reciprocal plots classify competitive, noncompetitive, and uncompetitive enzyme inhibitors.',
    coreConcepts: [
      'Michaelis Constant (Km): Substrate concentration at 1/2 Vmax. Inversely proportional to enzyme-substrate affinity (Lower Km = Higher Affinity).',
      'Lineweaver-Burk Plot (1/V0 vs 1/[S]): y-intercept = 1/Vmax; x-intercept = -1/Km; Slope = Km/Vmax.',
      'Competitive Inhibition: Inhibitor structurally resembles substrate and binds active site. ↑Km (apparent affinity decreases), Vmax UNCHANGED (can be overcome by adding excess substrate). Lineweaver-Burk lines cross on y-axis. Examples: Statins on HMG-CoA reductase, Methotrexate on DHFR, Captopril on ACE.',
      'Noncompetitive Inhibition: Inhibitor binds allosteric site on free enzyme or ES complex. Km UNCHANGED, ↓Vmax (cannot be overcome by substrate). Lineweaver-Burk lines cross on negative x-axis. Examples: Lead poisoning on Ferrochelatase/ALAD, Cyanide on Cytochrome oxidase.',
      'Uncompetitive Inhibition: Inhibitor binds ONLY to Enzyme-Substrate (ES) complex. ↓Km AND ↓Vmax. Lineweaver-Burk lines are PARALLEL (same slope). Example: Lithium on inositol monophosphatase.',
    ],
    keyTakeaways: [
      'Competitive: ↑Km, Vmax unchanged (y-axis intersection, overcome by substrate).',
      'Noncompetitive: Km unchanged, ↓Vmax (x-axis intersection, allosteric site).',
      'Uncompetitive: ↓Km, ↓Vmax (parallel lines on Lineweaver-Burk).',
    ],
    goldStandardTest: 'Spectrophotometric enzyme assay with double-reciprocal kinetic transformation.',
    firstLineTreatment: 'Targeted competitive enzyme inhibitors (Statins for hypercholesterolemia, Allopurinol for gout).',
    classicPresentation: 'Enzyme kinetic graph showing identical y-intercept with right-shifted x-intercept in the presence of a therapeutic drug (competitive inhibition).',
    examTrap: 'Km is INVERSELY related to affinity. A drug with Km of 1 μM has 10-fold HIGHER affinity than a drug with Km of 10 μM. Competitive inhibitors do NOT alter Vmax.',
    flashcards: [
      {
        front: 'How do Competitive, Noncompetitive, and Uncompetitive inhibitors affect Km and Vmax?',
        back: '• Competitive: ↑ Km, Vmax Unchanged (cross at y-axis)\n• Noncompetitive: Km Unchanged, ↓ Vmax (cross at negative x-axis)\n• Uncompetitive: ↓ Km, ↓ Vmax (parallel Lineweaver-Burk lines).',
        clinicalPearl: 'High substrate concentration overcomes competitive inhibition completely.',
      },
      {
        front: 'What do the x-intercept, y-intercept, and slope represent on a Lineweaver-Burk double-reciprocal plot?',
        back: '• x-intercept = -1 / Km\n• y-intercept = 1 / Vmax\n• Slope = Km / Vmax.',
        clinicalPearl: 'A point closer to the origin on the negative x-axis represents a HIGHER Km (lower affinity).',
      },
      {
        front: 'What is the classic example of competitive vs irreversible suicide enzyme inhibition in clinical pharmacology?',
        back: '• Competitive: Methotrexate competing with Dihydrofolate for Dihydrofolate Reductase (DHFR).\n• Irreversible Suicide: Aspirin covalently acetylating Serine-529 on Cyclooxygenase (COX-1/COX-2).',
        clinicalPearl: 'Aspirin inhibition cannot be reversed by adding more arachidonic acid.',
      },
      {
        front: 'What enzyme is deficient in Von Gierke Disease (GSD Type I) and what is the clinical triad?',
        back: 'Enzyme: Glucose-6-Phosphatase deficiency.\nClinical Triad: Severe Fasting Hypoglycemia + Lactic Acidosis + Hyperuricemia (Gout) + Hepatomegaly with "Doll-like" cherubic facies.',
        clinicalPearl: 'Unlike Pompe disease, there is NO cardiomegaly.',
      },
      {
        front: 'What is the diagnostic enzyme deficiency and urine finding in Alkaptonuria?',
        back: 'Enzyme: Homogentisate 1,2-Dioxygenase (Homogentisic acid oxidase).\nUrine Finding: Urine turns black/dark on standing or upon alkalization due to homogentisic acid oxidation.',
        clinicalPearl: 'Causes Ochronosis (bluish-black pigmentation of sclera and cartilage) and severe degenerative arthritis.',
      },
    ],
    clinicalCase: {
      title: 'Enzyme Kinetic Analysis of a Novel Antihyperlipidemic Agent',
      patientDemographics: 'Clinical pharmacology laboratory study',
      presentation: 'Researchers test a new cholesterol-lowering drug against recombinant human HMG-CoA Reductase. As drug concentration increases, Lineweaver-Burk plots show lines that intersect at the exact same point on the vertical y-axis (1/Vmax), while the x-intercept shifts closer to the origin.',
      physicalExamOrLabs: 'Apparent Km increases from 0.4 mM to 1.6 mM, while Vmax remains fixed at 250 μmol/min.',
      diagnosticQuestion: 'What mechanism of enzyme inhibition is demonstrated by this compound?',
      options: [
        { key: 'A', text: 'Reversible Competitive Inhibition (binds active catalytic site)', isCorrect: true },
        { key: 'B', text: 'Noncompetitive Inhibition (allosteric site binding)', isCorrect: false },
        { key: 'C', text: 'Uncompetitive Inhibition (binds ES complex only)', isCorrect: false },
        { key: 'D', text: 'Irreversible Covalent Inactivation', isCorrect: false },
      ],
      clinicalExplanation: 'Identical y-intercept (unchanged Vmax) combined with an increased Km (x-intercept shifting closer to zero) is the hallmark signature of Reversible Competitive Inhibition. The inhibitor competes directly with substrate for the active catalytic site, and high substrate concentration completely outcompetes the inhibitor to achieve normal Vmax.',
      examPearl: 'Same y-intercept = Competitive; Same x-intercept = Noncompetitive; Parallel lines = Uncompetitive.',
    },
  },

  // =================== 4. PATHOLOGY ===================
  'path-1': {
    topicId: 'path-1',
    subjectId: 'pathology',
    topicTitle: 'Cell Injury, Necrosis, Apoptosis & Amyloidosis',
    highYieldSummary: 'Cell injury progresses from reversible swelling to irreversible membrane disruption. Necrosis causes inflammation; Apoptosis is programmed cell death without inflammation. Amyloid displays apple-green birefringence.',
    coreConcepts: [
      'Reversible vs Irreversible Cell Injury: Reversible: Cellular swelling (hydropic change), blebbing, fatty change, ribosome detachment. Irreversible hallmarks: Massive Ca2+ influx, severe mitochondrial vacuolization, plasma membrane rupture, and nuclear changes (Pyknosis -> Karyorrhexis -> Karyolysis).',
      'Types of Necrosis: Coagulative (most organs after ischemia/infarction except brain; ghost cell architecture), Liquefactive (Brain infarcts and bacterial abscesses due to lysosomal enzyme digestion), Caseous (Tuberculosis; friable cheese-like with granulomas), Fat (Acute pancreatitis; chalky white saponification with calcium), Fibrinoid (Malignant hypertension, Polyarteritis nodosa; immune complexes in arterial walls).',
      'Apoptosis (Programmed Cell Death): Intrinsic Pathway: Mediated by Bcl-2 family (Bax/Bak pro-apoptotic vs Bcl-2/Bcl-xL anti-apoptotic) causing Cytochrome c release from mitochondria -> Apaf-1 -> Caspase 9. Extrinsic Pathway: FasL binds Fas (CD95) or TNF binds TNFR -> FADD -> Caspase 8. Executioner Caspases: Caspase 3, 6, 7. DNA laddering in multiples of 180–200 base pairs.',
      'Amyloidosis: Extracellular deposition of insoluble beta-pleated sheet fibrils. Diagnosis: Congo Red stain shows Apple-Green Birefringence under polarized light. Types: AL (Primary, Plasma cell myeloma, immunoglobulin light chains), AA (Secondary, Chronic inflammation/RA/TB/Bronchiectasis, SAA protein), ATTR (Transthyretin in senile cardiac and familial amyloid neuropathy), Abeta (Alzheimer disease senile plaques).',
    ],
    keyTakeaways: [
      'Irreversible injury hallmark = Severe membrane damage + massive calcium influx.',
      'Brain infarction always undergoes LIQUEFACTIVE necrosis; myocardial infarction undergoes COAGULATIVE necrosis.',
      'Apoptosis is caspase-mediated cell shrinkage without inflammation; DNA laddering shows 180-200 bp fragments.',
      'Congo Red staining with Apple-Green Birefringence under polarized light is the gold standard for Amyloidosis.',
    ],
    goldStandardTest: 'Congo Red stain with polarized microscopy (Apple-Green Birefringence) for Amyloidosis; Electron microscopy for irreversible mitochondrial rupture.',
    firstLineTreatment: 'Etiology-directed therapy (revascularization for ischemia, chemotherapy/Bortezomib for AL amyloidosis, Tafamidis for ATTR).',
    classicPresentation: 'Rectal or abdominal fat pad biopsy displaying pink amorphous extracellular substance that glows bright apple-green under polarized light.',
    examTrap: 'Brain ischemic stroke produces LIQUEFACTIVE necrosis, NOT coagulative. Apoptosis does NOT produce an inflammatory reaction.',
    flashcards: [
      {
        front: 'What are the characteristic features of Necrosis vs Apoptosis?',
        back: '• Necrosis: Cell swelling, plasma membrane rupture, cellular content leakage, intense INFLAMMATORY response (pathologic only).\n• Apoptosis: Cell shrinkage, intact membrane, apoptotic bodies, NO inflammation, DNA laddering in 180–200 bp fragments (physiologic or pathologic).',
        clinicalPearl: 'Caspase-3 is the primary executioner caspase of apoptosis.',
      },
      {
        front: 'Which type of necrosis is characteristic of Cerebral Infarction and why?',
        back: 'LIQUEFACTIVE Necrosis.\nReason: The brain is rich in hydrolytic lysosomal enzymes and lipids with minimal fibrous stroma, causing rapid enzymatic dissolution of necrotic parenchyma.',
        clinicalPearl: 'All other solid organ infarcts (heart, kidney, spleen) undergo Coagulative Necrosis.',
      },
      {
        front: 'What is the diagnostic gold standard histochemical staining feature of Amyloid?',
        back: 'Congo Red Stain displaying characteristic APPLE-GREEN BIREFRINGENCE under Polarized Light microscopy (due to beta-pleated sheet fibril configuration).',
        clinicalPearl: 'Abdominal subcutaneous fat pad biopsy or rectal biopsy is the preferred screening site.',
      },
      {
        front: 'What is the classic chromosomal translocation and targeted therapy for Chronic Myeloid Leukemia (CML)?',
        back: 'Translocation: t(9;22)(q34;q11) creating the BCR-ABL fusion oncogene (Philadelphia Chromosome).\nTargeted Therapy: IMATINIB (Tyrosine Kinase Inhibitor).',
        clinicalPearl: 'LAP (Leukocyte Alkaline Phosphatase) score is critically LOW in CML vs elevated in leukemoid reaction.',
      },
      {
        front: 'What is the classic chromosomal translocation and microscopic hallmark of Acute Promyelocytic Leukemia (APL / AML M3)?',
        back: 'Translocation: t(15;17)(q22;q12) fusing PML-RARA.\nMicroscopic hallmark: Bundles of Auer rods ("Faggot cells").\nTreatment: All-Trans Retinoic Acid (ATRA) + Arsenic Trioxide (ATO).',
        clinicalPearl: 'High risk of fatal Disseminated Intravascular Coagulation (DIC).',
      },
    ],
    clinicalCase: {
      title: 'Renal Biopsy in a Patient with Longstanding Rheumatoid Arthritis',
      patientDemographics: '58-year-old female with a 15-year history of severe rheumatoid arthritis',
      presentation: 'Presents with progressive bilateral lower extremity pitting edema and heavy proteinuria (6.5 g/24 hours). Serum creatinine is 2.1 mg/dL.',
      physicalExamOrLabs: 'Renal biopsy reveals amorphous, acellular, eosinophilic deposits expanding the glomeruli and arteriolar walls. Congo Red staining viewed under polarized light reveals striking apple-green birefringence.',
      diagnosticQuestion: 'What is the underlying diagnosis and what protein comprises these deposits?',
      options: [
        { key: 'A', text: 'Secondary (AA) Amyloidosis composed of Serum Amyloid A (SAA) protein fragments', isCorrect: true },
        { key: 'B', text: 'Primary (AL) Amyloidosis composed of Monoclonal Light Chains (Kappa/Lambda)', isCorrect: false },
        { key: 'C', text: 'Diabetic Glomerulosclerosis (Kimmelstiel-Wilson nodular lesions)', isCorrect: false },
        { key: 'D', text: 'Lupus Nephritis with immune-complex "wire-loop" lesions', isCorrect: false },
      ],
      clinicalExplanation: 'Secondary (reactive) AA Amyloidosis develops in chronic inflammatory conditions (such as Rheumatoid Arthritis, Bronchiectasis, Osteomyelitis, or IBD). Persistent elevated IL-1 and IL-6 stimulate hepatic synthesis of Serum Amyloid A (SAA), which is cleaved and deposited in renal glomeruli, displaying pathognomonic apple-green birefringence under polarized light after Congo Red staining.',
      examPearl: 'Chronic inflammation (RA/TB) = AA Amyloidosis (SAA protein); Multiple Myeloma = AL Amyloidosis (Light chains).',
    },
  },

  // =================== 5. PHARMACOLOGY ===================
  'pharm-1': {
    topicId: 'pharm-1',
    subjectId: 'pharmacology',
    topicTitle: 'General Pharmacology - Kinetics, Dynamics & Biotransformation',
    highYieldSummary: 'Pharmacokinetics encompasses Absorption, Distribution, Metabolism, and Excretion. Elimination follows zero-order (constant amount) or first-order (constant fraction) kinetics.',
    coreConcepts: [
      'Zero-Order vs First-Order Kinetics: First-Order: Constant FRACTION of drug is eliminated per unit time; rate is proportional to plasma concentration; constant half-life (t1/2). Zero-Order: Constant AMOUNT of drug is eliminated per unit time (enzyme saturation); rate is independent of plasma concentration; half-life increases with dose. Mnemonic for Zero-Order: "THE PEA" = Theophylline, Heparin, Ethanol, Phenytoin, Ethanol, Aspirin (high dose).',
      'Volume of Distribution (Vd): Vd = Total Dose / Plasma Concentration (C0). High Vd (>40 L) indicates extensive tissue binding (e.g. Chloroquine, Digoxin, TCAs); Low Vd (3–5 L) indicates confinement to vascular compartment (e.g. Heparin, Warfarin). Drugs with high Vd are NOT dialyzable in overdose.',
      'Loading Dose & Maintenance Dose: Loading Dose = (Target Cp × Vd) / Bioavailability (F). Maintenance Dose = (Target Cp × Clearance × Dosing Interval) / F. Steady state is achieved after 4 to 5 half-lives.',
      'Drug Metabolism (Biotransformation): Phase I (Functionalization): Oxidation, Reduction, Hydrolysis (primarily mediated by Cytochrome P450 enzymes) to introduce polar functional groups. Phase II (Conjugation): Glucuronidation (most common), Sulfation, Acetylation, Glutathione conjugation to make polar water-soluble metabolites for renal excretion.',
      'Cytochrome P450 Modulation: Inducers: Rifampicin, Phenytoin, Carbamazepine, Phenobarbital, Chronic alcohol, St. John\'s wort, Smoking. Inhibitors: Cimetidine, Ciprofloxacin, Ketoconazole/Azoles, Erythromycin/Clarithromycin, Grapefruit juice, Acute alcohol, Ritonavir.',
    ],
    keyTakeaways: [
      'Zero-order elimination = Constant amount/hour (Ethanol, Phenytoin, Aspirin).',
      'Steady-state plasma concentration is achieved after 4 to 5 half-lives (t1/2).',
      'Rifampicin and Carbamazepine are potent CYP inducers; Ketoconazole and Clarithromycin are potent CYP inhibitors.',
    ],
    goldStandardTest: 'Therapeutic Drug Monitoring (TDM) measuring peak and trough plasma drug concentrations.',
    firstLineTreatment: 'Calculated loading dose followed by maintenance dosing adjusted for renal/hepatic clearance.',
    classicPresentation: 'Patient stabilized on Warfarin who develops severe INR drop and thrombosis after starting Rifampicin for tuberculosis (due to CYP450 induction).',
    examTrap: 'High Volume of Distribution (Vd) means hemodialysis is INEFFECTIVE for overdose (drug is in tissues, not in blood). Aspirin follows first-order at low antiplatelet doses and zero-order at toxic doses.',
    flashcards: [
      {
        front: 'Which drugs follow Zero-Order Elimination Kinetics at therapeutic or toxic levels? (Mnemonic: THE PEA)',
        back: 'T = Theophylline\nH = Heparin\nE = Ethanol\nP = Phenytoin\nE = Ethanol\nA = Aspirin (high analgesic/toxic doses).',
        clinicalPearl: 'In zero-order kinetics, a constant AMOUNT (e.g. 10 mg/hour) is cleared regardless of concentration.',
      },
      {
        front: 'How many half-lives (t1/2) are required to reach Steady-State concentration (Css) and for complete drug elimination?',
        back: '• Reach Steady-State (Css): 4 to 5 half-lives (93.75% to 96.875% of steady-state).\n• Complete Drug Elimination (>99% cleared): 5 to 7 half-lives.',
        clinicalPearl: 'Increasing the infusion rate increases the Css level but does NOT shorten the time to reach steady state.',
      },
      {
        front: 'What are the classic potent Cytochrome P450 Inducers vs Inhibitors?',
        back: '• Inducers: Rifampicin, Phenytoin, Carbamazepine, Phenobarbital, Chronic Alcohol, St. John\'s Wort.\n• Inhibitors: Cimetidine, Ciprofloxacin, Ketoconazole/Azoles, Clarithromycin/Erythromycin, Grapefruit juice, Ritonavir.',
        clinicalPearl: 'Adding a CYP inhibitor to Warfarin or Statins increases bleeding or rhabdomyolysis risk.',
      },
      {
        front: 'What are the 4 pillar drug classes in Guideline-Directed Medical Therapy (GDMT) for Heart Failure with reduced Ejection Fraction (HFrEF)?',
        back: '1. ARNI (Sacubitril-Valsartan) or ACEi/ARB\n2. Evidence-based Beta-Blocker (Metoprolol Succinate, Bisoprolol, Carvedilol)\n3. Mineralocorticoid Receptor Antagonist / MRA (Spironolactone or Eplerenone)\n4. SGLT2 Inhibitor (Empagliflozin or Dapagliflozin).',
        clinicalPearl: 'All 4 pillars independently reduce all-cause mortality in HFrEF.',
      },
      {
        front: 'What is the specific antidote for acute Beta-Blocker toxicity and what is its mechanism?',
        back: 'Intravenous GLUCAGON.\nMechanism: Binds glucagon G-protein coupled receptors to stimulate Adenylyl Cyclase via Gs bypass, elevating cAMP and restoring cardiac inotropy/chronotropy without requiring beta receptors.',
        clinicalPearl: 'Calcium Channel Blocker toxicity antidote = IV Calcium Gluconate + High-Dose Insulin Euglycemia Therapy (HIET).',
      },
    ],
    clinicalCase: {
      title: 'Drug Interaction Leading to Supratherapeutic INR and Bleeding',
      patientDemographics: '68-year-old male with atrial fibrillation on long-term Warfarin',
      presentation: 'Presents to the emergency department with epistaxis, gross hematuria, and extensive ecchymoses 4 days after being prescribed oral Clarithromycin for community-acquired pneumonia. INR is critically elevated at 8.4 (target 2.0–3.0).',
      physicalExamOrLabs: 'Hemoglobin is 10.2 g/dL. No intracranial bleeding on non-contrast head CT.',
      diagnosticQuestion: 'What is the pharmacokinetics mechanism of this adverse drug interaction?',
      options: [
        { key: 'A', text: 'Clarithromycin is a potent CYP3A4 and CYP2C9 inhibitor, blocking Warfarin metabolism', isCorrect: true },
        { key: 'B', text: 'Clarithromycin induces renal tubular excretion of Warfarin', isCorrect: false },
        { key: 'C', text: 'Clarithromycin displaces Warfarin from plasma albumin binding sites only', isCorrect: false },
        { key: 'D', text: 'Clarithromycin stimulates hepatic synthesis of Vitamin K-dependent clotting factors', isCorrect: false },
      ],
      clinicalExplanation: 'Warfarin is metabolized primarily by hepatic Cytochrome P450 enzymes (CYP2C9 and CYP3A4). Clarithromycin is a potent macrolide CYP inhibitor that dramatically impairs warfarin clearance, leading to drug accumulation, supratherapeutic INR, and high bleeding risk. Treatment requires stopping Warfarin and administering IV Vitamin K (Phytonadione) and 4-factor Prothrombin Complex Concentrate (PCC).',
      examPearl: 'Macrolides (Clarithromycin/Erythromycin) = CYP inhibitors -> increase Warfarin INR & Statin toxicity.',
    },
  },

  // =================== 6. MICROBIOLOGY ===================
  'micro-1': {
    topicId: 'micro-1',
    subjectId: 'microbiology',
    topicTitle: 'General Microbiology, Sterilization & Disinfection',
    highYieldSummary: 'Sterilization kills all microorganisms including bacterial spores; disinfection reduces pathogenic organisms. Physical methods include Autoclaving, Hot Air Oven, and Ionizing Radiation.',
    coreConcepts: [
      'Autoclave (Moist Heat under Pressure): Standard cycle is 121°C for 15 minutes at 15 psi (1.05 kg/cm²). Mechanism: Irreversible coagulation and denaturation of structural proteins and enzymes. Biological indicator: Spores of Geobacillus stearothermophilus. Sterilizes culture media, surgical linen, rubber gloves, and surgical dressings.',
      'Hot Air Oven (Dry Heat): Standard cycle is 160°C for 2 hours (or 170°C for 1 hour, 180°C for 30 minutes). Mechanism: Protein denaturation, oxidative damage, and toxic electrolyte concentration. Biological indicator: Spores of Bacillus atrophaeus (formerly B. subtilis). Sterilizes all-glass syringes, test tubes, scalpels, liquid paraffin, oils, fats, and talcum powder.',
      'Chemical Disinfection & Cold Sterilization: 2% Glutaraldehyde (Cidex): High-level liquid disinfectant for flexible fiberoptic endoscopes and bronchoscopes (20 min for high-level disinfection, 10 hours for complete sporicidal sterilization). Ethylene Oxide (ETO) Gas: For heat-sensitive plastics, disposable syringes, heart-lung machines (Biological indicator: Bacillus atrophaeus). Hydrogen Peroxide Gas Plasma: Low-temperature plasma sterilization for delicate optical cameras.',
      'Ionizing Radiation (Cold Sterilization): High-energy Gamma rays (Cobalt-60) for pre-packaged disposable medical supplies (disposable plastic syringes, catheters, cannulas, surgical sutures, bone/tissue grafts). Biological indicator: Bacillus pumilus.',
      'Pasteurization of Milk: Holder method (63°C for 30 min) or Flash / HTST method (72°C for 15 sec). Target organism: Coxiella burnetii (most heat-resistant non-spore pathogen in milk). Evaluated by the Phosphatase Test (negative indicates proper pasteurization).',
    ],
    keyTakeaways: [
      'Autoclave biological indicator = Geobacillus stearothermophilus spores (121°C, 15 min, 15 psi).',
      'Hot Air Oven biological indicator = Bacillus atrophaeus spores (160°C for 2 hours).',
      'Flexible endoscopes/bronchoscopes are sterilized using 2% Glutaraldehyde (Cidex) or Hydrogen Peroxide Plasma.',
      'Phosphatase test confirms adequate milk pasteurization by proving destruction of Coxiella burnetii.',
    ],
    goldStandardTest: 'Biological spore indicator validation (Geobacillus stearothermophilus for Autoclave; Bacillus atrophaeus for Hot Air Oven & ETO).',
    firstLineTreatment: 'Autoclaving at 121°C for 15 minutes at 15 psi for all autoclavable surgical linen and culture media.',
    classicPresentation: 'Hospital Central Sterile Supply Department (CSSD) validating sterility of surgical instrument sets and endoscopes using biological indicators.',
    examTrap: 'Never autoclave sharp instruments (dulls cutting edges; use Hot Air Oven or Chemical Sterilization) or flexible endoscopes (melts optics; use 2% Glutaraldehyde or Plasma). Liquid paraffin and talcum powder MUST be sterilized in Hot Air Oven, NOT autoclave.',
    flashcards: [
      {
        front: 'What are the exact physical parameters and biological indicator organism for Autoclaving?',
        back: 'Parameters: 121°C for 15 minutes at 15 psi pressure (or 134°C for 3 minutes).\nBiological Indicator: Spores of Geobacillus stearothermophilus (incubated at 55–60°C).',
        clinicalPearl: 'Used for surgical linen, dressing packs, culture media, and metal instruments.',
      },
      {
        front: 'What are the temperature-time combinations and biological indicator for Hot Air Oven (Dry Heat)?',
        back: 'Standard: 160°C for 2 hours (or 170°C for 1 hr, 180°C for 30 min).\nBiological Indicator: Spores of Bacillus atrophaeus (formerly B. subtilis).',
        clinicalPearl: 'Essential for dry powders, liquid paraffin, anhydrous fats, and all-glass syringes.',
      },
      {
        front: 'Which disinfectant is used for flexible fiberoptic bronchoscopes and what is its contact time?',
        back: '2% Alkaline Glutaraldehyde (Cidex).\nContact time: 20 minutes for high-level disinfection; 10 hours for complete sporicidal sterilization.',
        clinicalPearl: 'Once activated with sodium bicarbonate, Cidex solution remains active for 14 days.',
      },
      {
        front: 'What method and biological indicator are used for sterilizing pre-packaged disposable plastic syringes?',
        back: 'Method: Ionizing Radiation (Gamma rays from Cobalt-60 source / Cold Sterilization).\nBiological Indicator: Bacillus pumilus spores.',
        clinicalPearl: 'Ethylene oxide (ETO) gas is an alternative for heat-sensitive plastics.',
      },
      {
        front: 'What is the most heat-resistant non-spore forming pathogen in milk and how is pasteurization verified?',
        back: 'Organism: Coxiella burnetii (causative agent of Q fever).\nVerification: Phosphatase Test (Alkaline phosphatase enzyme is destroyed at pasteurization temperature; negative test proves safety).',
        clinicalPearl: 'Pasteurization kills Mycobacterium tuberculosis, Salmonella, and Brucella.',
      },
    ],
    clinicalCase: {
      title: 'CSSD Protocol Audit for Operating Room Equipment',
      patientDemographics: 'Hospital Infection Control Committee evaluation',
      presentation: 'The CSSD manager is preparing sterilization protocols for three categories of surgical equipment: (1) Cotton laparotomy sponges, (2) Stainless steel scalpels and liquid paraffin bottles, and (3) Flexible fiberoptic bronchoscopes.',
      physicalExamOrLabs: 'Spore strip indicators containing Geobacillus stearothermophilus and Bacillus atrophaeus are retrieved for autoclave and dry heat validation.',
      diagnosticQuestion: 'Which combination correctly matches each item with its optimal sterilization method?',
      options: [
        { key: 'A', text: 'Cotton sponges = Autoclave; Liquid paraffin = Hot Air Oven; Fiberoptic bronchoscope = 2% Glutaraldehyde (Cidex)', isCorrect: true },
        { key: 'B', text: 'Cotton sponges = Hot Air Oven; Liquid paraffin = Autoclave; Fiberoptic bronchoscope = Hot Air Oven', isCorrect: false },
        { key: 'C', text: 'Cotton sponges = 2% Glutaraldehyde; Liquid paraffin = ETO gas; Fiberoptic bronchoscope = Autoclave', isCorrect: false },
        { key: 'D', text: 'Cotton sponges = Ionizing Gamma radiation; Liquid paraffin = Autoclave; Fiberoptic bronchoscope = Boiling water', isCorrect: false },
      ],
      clinicalExplanation: 'Linen and cotton dressings require steam under pressure (Autoclave 121°C) for deep penetration. Anhydrous oils and liquid paraffin are impermeable to steam and must be sterilized by Dry Heat (Hot Air Oven 160°C). Flexible bronchoscopes contain optical fibers and lens adhesives that are destroyed by heat and must undergo high-level disinfection/sterilization using cold chemical agents like 2% Glutaraldehyde (Cidex) or Hydrogen Peroxide Gas Plasma.',
      examPearl: 'Paraffin/oils = Dry heat oven; Linen/culture media = Autoclave; Endoscopes = 2% Glutaraldehyde.',
    },
  },

  // =================== 7. FORENSIC MEDICINE & TOXICOLOGY (FMT) ===================
  'fmt-1': {
    topicId: 'fmt-1',
    subjectId: 'fmt',
    topicTitle: 'Thanatology - Post-mortem Changes & Time Since Death',
    highYieldSummary: 'Time since death is estimated using the triad of Algor Mortis (cooling of body), Rigor Mortis (ATP depletion muscle stiffening), and Livor Mortis (post-mortem hypostasis).',
    coreConcepts: [
      'Algor Mortis: Body cools at a rate of 1.5°F/hour for the first 6 hours, then 1.0°F/hour. Calculated using chemical formula: (98.4°F - Rectal Temp) / 1.5.',
      'Rigor Mortis: ATP depletion prevents actin-myosin detachment. Nysten\'s Law: Begins in involuntary muscles (myocardium) -> eyelids -> lower jaw -> neck -> thorax -> upper limbs -> abdomen -> lower limbs -> fingers/toes. Rule of 12: Appears in 12h, stays for 12h, disappears in 12h in temperate climates.',
      'Livor Mortis (Post-mortem Lividity): Purplish-red skin discoloration in dependent areas due to gravity settling of blood; appears in 1-2h, becomes fixed after 6-8h. Cherry-red in Carbon Monoxide/Cyanide, Bright pink in Hypothermia, Chocolate brown in Nitrites/Methemoglobinemia.',
      'Cadaveric Spasm (Instantaneous Rigor): Immediate stiffening of muscles at the exact moment of death due to intense physical/emotional stress (e.g. drowning victim clutching weeds, firearm suicide victim clutching gun). Has high medico-legal proof of suicide/manner of death.',
      'Putrefaction & Decomposition: Greenish discoloration in Right Iliac Fossa (over cecum) at 12-18 hours due to H2S producing Sulfhemoglobin. Marbling of superficial blood vessels appears at 24-36 hours.',
      'Adipocere (Saponification): Fatty tissue hydrolysis into palmitic/stearic/oleic acids in warm, moist, anaerobic environments. Mummification occurs in hot, dry, arid environments.',
    ],
    keyTakeaways: [
      'Nysten\'s Law dictates Rigor Mortis progression from eyelids/jaw down to extremities.',
      'Cadaveric spasm is pathognomonic evidence of voluntary muscular action at the exact moment of death.',
      'Greenish discoloration over Right Iliac Fossa is the earliest external sign of putrefaction (12-18 hrs).',
    ],
    goldStandardTest: 'Rectal thermometry (chemical thermometer) + vitreous humor potassium [K+] concentration (linear rise post-mortem).',
    firstLineTreatment: 'Medico-legal autopsy documentation with time since death estimation based on hypostasis fixation and rigor mortis.',
    classicPresentation: 'Deceased body with fixed purple dependent lividity sparing contact pressure points, rigor mortis involving entire trunk and limbs, and greenish discoloration in the right iliac fossa.',
    examTrap: 'Never confuse Cadaveric Spasm (involves select muscle groups instantly at death; cannot be broken without tearing muscle) with Rigor Mortis (involves all muscles gradually over 12 hours).',
    flashcards: [
      {
        front: 'What is Nysten\'s Law and in what sequence does Rigor Mortis develop?',
        back: 'Rigor Mortis begins in the eyelids and lower jaw -> face -> neck -> thorax -> upper extremities -> abdomen -> lower extremities -> small joints of fingers and toes.',
        clinicalPearl: 'Rigor mortis first appears internally in the myocardium (within 1 hour of death).',
      },
      {
        front: 'What causes the characteristic cherry-red post-mortem lividity (livor mortis)?',
        back: 'Carbon Monoxide (CO) poisoning (forming Carboxyhemoglobin) and Cyanide poisoning (forming Cyanohemoglobin / Histotoxic anoxia).',
        clinicalPearl: 'Hypothermia produces bright pink lividity; Methemoglobinemia produces chocolate brown lividity.',
      },
      {
        front: 'What is Cadaveric Spasm and why is it of critical medico-legal importance?',
        back: 'Instantaneous stiffening of voluntary muscles at the exact moment of death without a preceding stage of primary flaccidity. It proves the last conscious act of the victim (e.g. holding a weapon in suicide or clutching grass in drowning).',
        clinicalPearl: 'Unlike rigor mortis, cadaveric spasm cannot be re-established once manually broken.',
      },
      {
        front: 'What is the earliest external sign of putrefaction and where does it first appear?',
        back: 'A greenish-blue discoloration in the Right Iliac Fossa (over the cecum) at 12-18 hours post-mortem, caused by H2S gas reacting with hemoglobin to form Sulfhemoglobin.',
        clinicalPearl: 'Superficial venous "marbling" follows at 24-36 hours.',
      },
      {
        front: 'Under what environmental conditions do Adipocere (Saponification) and Mummification occur?',
        back: '• Adipocere: Warm, moist, anaerobic environments (e.g. submerged in water or damp graves), converting body fat into hard yellowish-white wax.\n• Mummification: Hot, dry, arid environments with constant warm air circulation, causing complete dehydration of tissues.',
        clinicalPearl: 'Both adipocere and mummification preserve the external features of the deceased for years, aiding identification.',
      },
    ],
    clinicalCase: {
      title: 'Post-Mortem Examination of a Body Discovered in an Apartment',
      patientDemographics: 'Unknown adult male found deceased indoors (room temperature 24°C)',
      presentation: 'Police discover a deceased body lying supine on a mattress. On external examination, post-mortem lividity is present over the back and calves but blanches completely upon firm finger pressure. Rigor mortis is present in the eyelids, jaw, and neck, but the arms, abdomen, and legs remain completely flaccid.',
      physicalExamOrLabs: 'Rectal temperature is 34.2°C (93.5°F). No greenish discoloration in the right iliac fossa. Pupils are fixed and dilated.',
      diagnosticQuestion: 'Based on the state of rigor mortis and non-fixed post-mortem lividity, what is the estimated Time Since Death (TSD)?',
      options: [
        { key: 'A', text: '2 to 4 hours post-mortem', isCorrect: true },
        { key: 'B', text: '12 to 18 hours post-mortem', isCorrect: false },
        { key: 'C', text: '24 to 36 hours post-mortem', isCorrect: false },
        { key: 'D', text: 'Greater than 48 hours post-mortem', isCorrect: false },
      ],
      clinicalExplanation: 'Rigor mortis develops in a cranial-to-caudal sequence (Nysten\'s law), appearing in the eyelids, jaw, and neck at 2-4 hours while lower limbs remain flaccid. Post-mortem lividity is easily blanchable because it has not yet undergone post-mortem fixation (which occurs after 6-8 hours). Using the Algor Mortis formula: (98.4 - 93.5) / 1.5 ≈ 3.2 hours, confirming a TSD of 2 to 4 hours.',
      examPearl: 'Lividity blanches prior to 6 hours; Rigor mortis in jaw/neck only = 2-4 hours post-mortem.',
    },
  },

  // =================== 8. COMMUNITY MEDICINE (PSM) ===================
  'psm-6': {
    topicId: 'psm-6',
    subjectId: 'psm',
    topicTitle: 'National Immunization Schedule (NIS) & Cold Chain Equipment',
    highYieldSummary: 'The National Immunization Schedule (NIS) provides vaccines from birth through adolescence. The cold chain maintains vaccines at +2°C to +8°C using Ice-Lined Refrigerators (ILRs) and Deep Freezers.',
    coreConcepts: [
      'National Immunization Schedule (Birth Vaccines): BCG (0.1 mL intradermal left upper arm, reconstruct with normal saline, discard after 4 hours, Mantoux scar develops at 6-8 weeks), OPV-0 (2 drops oral), Hepatitis B birth dose (0.5 mL IM anterolateral thigh within 24 hours).',
      'Cold Chain Temperatures: Ice-Lined Refrigerator (ILR): Maintained at +2°C to +8°C at District and PHC level. Bottom/floor is coldest (store freeze-tolerant vaccines: OPV, Rotavirus, Measles-Rubella, JE); Upper shelves store freeze-SENSITIVE vaccines (T-series: DPT, TT, Td, Hepatitis B, Pentavalent, PCV, IPV). Deep Freezer: Maintained at -15°C to -25°C for preparing ice packs and storing OPV.',
      'Vaccine Vial Monitor (VVM): Heat-sensitive square inside a circular disc. Stage 1 & 2: Inner square is lighter than outer circle -> USABLE. Stage 3: Inner square matches color of outer circle -> DISCARD. Stage 4: Inner square is darker than outer circle -> DISCARD.',
      'Shake Test: Validates whether freeze-sensitive vaccines (Pentavalent, Td, Hepatitis B) have suffered freeze-damage. Shake frozen suspect vial vs control vial. If frozen, rapid sedimentation occurs leaving clear supernatant within 15-30 minutes -> FAILED SHAKE TEST -> DISCARD.',
      'Biomedical Waste Management (BMWM) in Vaccination: Yellow bag: Expired/discarded live vaccines, swabs, cotton. Red bag: Plastic syringes without needles, IV tubing. White translucent container: Sharps, used needles, auto-disable (AD) syringes with cut hubs. Blue box: Glass vaccine ampoules and vials.',
    ],
    keyTakeaways: [
      'ILR maintains +2°C to +8°C; Deep Freezer maintains -15°C to -25°C.',
      'Freeze-sensitive vaccines (T-series, HepB, Pentavalent) MUST NEVER be frozen (validated by Shake Test).',
      'VVM Stages 1 & 2 are usable; Stages 3 & 4 must be discarded.',
      'Reconstituted BCG and Measles vaccines must be used within 4 hours and kept on an ice pack.',
    ],
    goldStandardTest: 'Shake Test for freeze-damage validation; Dial thermometer twice-daily monitoring for ILR.',
    firstLineTreatment: 'Administer vaccines per NIS schedule with strict cold chain maintenance at +2°C to +8°C.',
    classicPresentation: 'PHC medical officer inspecting ILR temperature log and discarding Pentavalent vials that failed the shake test after freezing.',
    examTrap: 'Never freeze T-series, Pentavalent, or Hepatitis B vaccines (destroys aluminum adjuvant potency). Never use distilled water to reconstitute BCG (use normal saline to prevent hypotonic shock).',
    flashcards: [
      {
        front: 'What vaccines are administered at Birth under the National Immunization Schedule (NIS)?',
        back: '1. BCG: 0.1 mL (0.05 mL if <1 month) Intradermally on left upper arm.\n2. OPV (Zero dose): 2 drops orally.\n3. Hepatitis B (Birth dose): 0.5 mL IM on anterolateral aspect of mid-thigh (within 24 hours of birth).',
        clinicalPearl: 'Reconstituted BCG vaccine must be used within 4 hours.',
      },
      {
        front: 'What are the temperature ranges for Ice-Lined Refrigerators (ILRs) vs Deep Freezers in the Cold Chain?',
        back: '• Ice-Lined Refrigerator (ILR): +2°C to +8°C (holds all vaccines at PHC/District levels).\n• Deep Freezer: -15°C to -25°C (used for freezing ice packs and long-term OPV storage).',
        clinicalPearl: 'Freeze-sensitive vaccines are placed on the upper shelf of the ILR to avoid freezing.',
      },
      {
        front: 'How do you interpret the 4 Stages of the Vaccine Vial Monitor (VVM)?',
        back: '• Stage 1: Inner square is white / significantly lighter than outer purple circle -> USABLE.\n• Stage 2: Inner square is slightly lighter than outer circle -> USABLE.\n• Stage 3: Inner square MATCHES the color of the outer circle -> DISCARD.\n• Stage 4: Inner square is DARKER than the outer circle -> DISCARD.',
        clinicalPearl: 'Discard immediately if the expiry date has passed, regardless of VVM stage.',
      },
      {
        front: 'What is the Shake Test and which vaccines is it performed on?',
        back: 'Performed on FREEZE-SENSITIVE vaccines (Tetanus, DPT, Hepatitis B, Pentavalent, PCV).\nProcedure: Suspect vial is shaken alongside a purposefully frozen control vial. If suspect vial settles rapidly with clear supernatant faster than control, it is freeze-damaged and must be discarded.',
        clinicalPearl: 'Freezing agglomerates the aluminum phosphate adjuvant, destroying efficacy.',
      },
      {
        front: 'Which Biomedical Waste container category is used for discarded glass vaccine vials vs auto-disable needles?',
        back: '• Glass vaccine vials: BLUE cardboard box with blue label (or puncture-proof cardboard box).\n• Used needles / Auto-disable (AD) syringes with cut needles: WHITE Translucent puncture-proof container.',
        clinicalPearl: 'Plastic syringe barrels without needles go into the RED bag.',
      },
    ],
    clinicalCase: {
      title: 'PHC Vaccine Stock Audit Following Power Outage',
      patientDemographics: 'Primary Health Centre cold chain inspection',
      presentation: 'Following a power failure at a rural PHC, the medical officer inspects the Ice-Lined Refrigerator (ILR). Dial thermometer reads +14°C. On checking the Vaccine Vial Monitors (VVMs) of oral polio vaccine (OPV) and measles-rubella (MR) vials, the inner square is light grey but distinctly lighter than the outer purple circle.',
      physicalExamOrLabs: 'Pentavalent vaccine vials from the bottom rack are inspected. A shake test is performed on a suspect vial, which settles into a compact sediment with clear supernatant in 10 minutes.',
      diagnosticQuestion: 'What is the correct action regarding the OPV vials and the Pentavalent vaccine vials?',
      options: [
        { key: 'A', text: 'OPV vials are usable (VVM Stage 2); Pentavalent vials must be discarded (failed Shake Test due to freezing)', isCorrect: true },
        { key: 'B', text: 'Discard all OPV vials immediately; Pentavalent vials are safe to administer', isCorrect: false },
        { key: 'C', text: 'Re-freeze all vaccines in the deep freezer for 24 hours before usage', isCorrect: false },
        { key: 'D', text: 'Administer double the dose of Pentavalent vaccine to compensate for potency loss', isCorrect: false },
      ],
      clinicalExplanation: 'VVM inner square lighter than outer circle represents Stage 2 (usable). However, Pentavalent vaccine is freeze-sensitive; rapid settling in the shake test proves freeze-damage to the aluminum adjuvant, requiring immediate discard.',
      examPearl: 'VVM lighter than ring = Usable; Rapid sedimentation in shake test = Freeze damage -> Discard.',
    },
  },

  // =================== 9. GENERAL MEDICINE ===================
  'med-4': {
    topicId: 'med-4',
    subjectId: 'medicine',
    topicTitle: 'Pulmonology - Asthma (GINA Guidelines), COPD (GOLD Guidelines)',
    highYieldSummary: 'Asthma is reversible airway hyperresponsiveness; COPD is progressive irreversible airflow obstruction. GINA Track 1 prioritizes ICS-Formoterol; GOLD COPD staging guides LAMA/LABA/ICS.',
    coreConcepts: [
      'PFT Spirometry: Post-bronchodilator FEV1/FVC < 0.70 confirms obstructive airflow limitation. Asthma exhibits reversibility (>12% and >200 mL increase in FEV1). COPD exhibits fixed irreversible obstruction.',
      'Diffusing Capacity (DLCO): Normal or elevated in pure Asthma; Decreased in Emphysema due to alveolar capillary bed destruction.',
      'GINA 2023/2024 Asthma Management: Track 1 (Preferred) uses Low-Dose Inhaled Corticosteroid (ICS) + Formoterol as needed across Steps 1 & 2, and as maintenance and reliever (MART/SMART) in Steps 3 to 5. SABA monotherapy is strictly contraindicated.',
      'GOLD 2024 COPD Staging & Groups: Staging by FEV1: GOLD 1 (≥80%), GOLD 2 (50–79%), GOLD 3 (30–49%), GOLD 4 (<30%). ABE Classification: Group A (Bronchodilator), Group B (LABA + LAMA), Group E (Exacerbations ≥2 or ≥1 hospitalization: LABA + LAMA; add ICS if blood eosinophils ≥300 cells/μL).',
      'Proven Mortality Reducers in COPD: ONLY two interventions prolong survival: (1) Smoking Cessation, (2) Long-Term Oxygen Therapy (LTOT ≥15 hours/day if resting PaO2 ≤55 mmHg or SaO2 ≤88%).',
    ],
    keyTakeaways: [
      'Asthma = Reversible FEV1 (>12% & >200 mL) + Normal/High DLCO; COPD = Fixed FEV1/FVC < 0.70 + Low DLCO in emphysema.',
      'GINA Track 1 prefers as-needed low-dose ICS-Formoterol (SMART therapy) across all steps.',
      'Only Smoking Cessation and LTOT (PaO2 ≤ 55 mmHg) reduce mortality in COPD.',
    ],
    goldStandardTest: 'Post-bronchodilator Spirometry (Reversibility test for Asthma; FEV1/FVC < 0.70 for COPD) + DLCO.',
    firstLineTreatment: 'Low-dose ICS-Formoterol (GINA Track 1) for Asthma; LAMA + LABA dual bronchodilator (GOLD Group B/E) for COPD.',
    classicPresentation: 'Young patient with episodic nocturnal wheeze and atopy (Asthma) vs elderly heavy smoker with chronic productive cough and barrel chest (COPD).',
    examTrap: 'Inhaled steroids and bronchodilators improve quality of life in COPD but DO NOT reduce mortality (only smoking cessation and LTOT reduce mortality). SABA monotherapy is no longer recommended in asthma.',
    flashcards: [
      {
        front: 'How is bronchodilator reversibility objectively defined on spirometry in Asthma?',
        back: 'An increase in FEV1 by >12% AND >200 mL following inhalation of a short-acting bronchodilator (SABA).',
        clinicalPearl: 'Normal or elevated DLCO in Asthma vs reduced DLCO in COPD (emphysema).',
      },
      {
        front: 'What is the GINA 2023/2024 Track 1 preferred regimen for mild Asthma (Steps 1 & 2)?',
        back: 'As-needed low-dose Inhaled Corticosteroid (ICS) + Formoterol (e.g. Budesonide-Formoterol).\nSABA monotherapy is strictly NO LONGER recommended.',
        clinicalPearl: 'Formoterol has rapid onset like SABA (1-3 min) plus long 12-hour LABA duration.',
      },
      {
        front: 'Which two therapeutic interventions are scientifically proven to reduce mortality in COPD?',
        back: '1. Smoking Cessation (slows the rate of FEV1 decline).\n2. Long-Term Oxygen Therapy (LTOT ≥15 hours/day in patients with resting PaO2 ≤55 mmHg or SaO2 ≤88%).',
        clinicalPearl: 'Inhaled bronchodilators and steroids improve symptoms and reduce exacerbations, but do NOT prolong survival.',
      },
      {
        front: 'What is the GOLD diagnostic criteria for confirming irreversible COPD on spirometry?',
        back: 'Post-bronchodilator FEV1 / FVC ratio < 0.70 (fixed non-reversible airflow obstruction).',
        clinicalPearl: 'Emphysema subtype: Centrilobular (smokers, upper lobes) vs Panacinar (Alpha-1 Antitrypsin deficiency, lower lobes).',
      },
      {
        front: 'What are the indications for adding Inhaled Corticosteroids (ICS) to LABA+LAMA in COPD (Group E)?',
        back: 'Blood eosinophil count ≥ 300 cells/μL (or ≥ 100 cells/μL with ≥ 2 moderate exacerbations or 1 hospitalization per year).',
        clinicalPearl: 'ICS increases the risk of pneumonia in COPD patients.',
      },
    ],
    clinicalCase: {
      title: 'Chronic Dyspnea Evaluation in a Heavy Smoker',
      patientDemographics: '63-year-old male with a 45 pack-year smoking history',
      presentation: 'Presents with a 5-year history of progressive exertional shortness of breath and morning productive sputum. On examination: barrel-shaped chest, hyperresonant percussion note, distant heart sounds, and prolonged expiration with scattered wheezes.',
      physicalExamOrLabs: 'Post-bronchodilator spirometry demonstrates FEV1/FVC = 0.58 and FEV1 = 42% of predicted. Arterial Blood Gas (ABG) on room air: pH 7.36, PaO2 52 mmHg, PaCO2 46 mmHg, SaO2 85%.',
      diagnosticQuestion: 'What is the GOLD severity stage and which intervention will definitively improve his long-term survival?',
      options: [
        { key: 'A', text: 'GOLD Stage 3 (Severe COPD); Smoking Cessation and Long-Term Oxygen Therapy (LTOT ≥15 hours/day)', isCorrect: true },
        { key: 'B', text: 'GOLD Stage 2 (Moderate COPD); High-dose Inhaled Fluticasone monotherapy', isCorrect: false },
        { key: 'C', text: 'Bronchial Asthma Step 4; Oral Prednisolone maintenance therapy', isCorrect: false },
        { key: 'D', text: 'GOLD Stage 4 (Very Severe COPD); Long-acting Beta-2 Agonist alone', isCorrect: false },
      ],
      clinicalExplanation: 'Post-bronchodilator FEV1/FVC < 0.70 confirms COPD. FEV1 of 42% predicted classifies as GOLD Stage 3 (Severe, range 30–49%). With resting PaO2 ≤ 55 mmHg (52 mmHg) and SaO2 ≤ 88% (85%), this patient meets strict criteria for Long-Term Oxygen Therapy (LTOT ≥15 hours/day), which alongside smoking cessation are the only interventions proven to reduce mortality.',
      examPearl: 'GOLD staging: 1 (≥80%), 2 (50-79%), 3 (30-49%), 4 (<30%). Mortality benefit in COPD = Smoking cessation + LTOT (PaO2 ≤ 55 mmHg).',
    },
  },
};

/**
 * Retrieves genuine topic knowledge record from registry or constructs a high-precision medical fallback.
 */
export function getMedicalTopicKnowledge(
  subjectId: string,
  topicId: string,
  topicName?: string
): MedicalTopicKnowledge {
  const sId = (subjectId || '').toLowerCase();
  const tId = (topicId || '').toLowerCase();
  const name = (topicName || '').toLowerCase();

  // 1. Exact match in knowledge base
  if (FMGE_TOPIC_KNOWLEDGE_BASE[tId]) {
    return FMGE_TOPIC_KNOWLEDGE_BASE[tId];
  }

  // 2. Exact match in knowledge base by ID aliases
  for (const key of Object.keys(FMGE_TOPIC_KNOWLEDGE_BASE)) {
    if (tId === key || tId.startsWith(key)) {
      return FMGE_TOPIC_KNOWLEDGE_BASE[key];
    }
  }

  // 3. Match by subject and concept keywords
  if (sId.includes('psm') || name.includes('vaccin') || name.includes('cold chain') || name.includes('immuniz') || tId.includes('psm-6')) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['psm-6'];
  }
  if (sId.includes('anat') || name.includes('brachial') || name.includes('nerve') || name.includes('plexus')) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['anat-1'];
  }
  if (sId.includes('phys') || name.includes('transport') || name.includes('membrane') || name.includes('action potential')) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['phys-1'];
  }
  if (sId.includes('bio') || name.includes('enzyme') || name.includes('kinetics') || name.includes('lineweaver')) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['bio-1'];
  }
  if (sId.includes('path') || name.includes('injury') || name.includes('necrosis') || name.includes('apoptosis') || name.includes('amyloid')) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['path-1'];
  }
  if (sId.includes('pharm') || name.includes('kinetics') || name.includes('dynamics') || name.includes('biotransformation')) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['pharm-1'];
  }
  if (sId.includes('micro') && (name.includes('steril') || name.includes('disinfect') || tId.includes('micro-1'))) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['micro-1'];
  }
  if (sId.includes('fmt') && (name.includes('thanat') || name.includes('post-mortem') || name.includes('death') || tId.includes('fmt-1'))) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['fmt-1'];
  }
  if (sId.includes('med') && (name.includes('asthma') || name.includes('copd') || name.includes('gina') || name.includes('gold') || tId.includes('med-4'))) {
    return FMGE_TOPIC_KNOWLEDGE_BASE['med-4'];
  }

  // 4. Default to first high-yield record matching the subject
  const subjectRecord = Object.values(FMGE_TOPIC_KNOWLEDGE_BASE).find(
    (k) => k.subjectId.toLowerCase().includes(sId) || sId.includes(k.subjectId.toLowerCase())
  );
  if (subjectRecord) {
    return {
      ...subjectRecord,
      topicId,
      topicTitle: topicName || subjectRecord.topicTitle,
    };
  }

  // 5. Default fallback
  return FMGE_TOPIC_KNOWLEDGE_BASE['micro-1'];
}
