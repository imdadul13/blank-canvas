import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Award,
  BookOpen,
  Filter,
  Play,
  RotateCcw,
  Activity,
  Flame,
  Lightbulb,
  Search,
  X,
  Check,
  Circle,
  ChevronLeft,
  TrendingUp,
  FileText,
  Eye,
  HelpCircle,
  ExternalLink,
  Copy,
  CheckCheck,
  Maximize2,
  RefreshCw,
  Sparkle,
  BookmarkCheck,
  Stethoscope,
  Microscope,
  Pill,
  Brain,
  Bookmark,
} from 'lucide-react';
import { FMGE_SUBJECTS } from '../../data/fmgeSubjects';
import {
  SPRINT_TIERS,
  SPRINT_DAYS,
  daysUntilFmge,
  sprintDateForIndex,
  sprintDayIndex,
  checklistsForPlan,
  buildAdaptiveSprintDays,
  localDateKey,
  FMGE_EXAM_DATE,
  type SprintDay,
} from '../../utils/sprintEngine';
import {
  getDailyStudyBlueprint,
  SPRINT_STUDY_BLUEPRINTS,
  type BlueprintTopic,
  type DailyStudyBlueprint,
} from '../../data/sprintStudyBlueprints';
import {
  VISUAL_CONCEPT_REGISTRY,
  VERIFIED_IBQ_BANK,
  getVerifiedIBQsForSubject,
  type VisualConceptAsset,
  type RawIBQItem,
} from '../../utils/visualQuestionEngine';
import { INITIAL_PEARLS } from '../../data/initialPearls';
import { FMGE_TOPIC_KNOWLEDGE_BASE, getMedicalTopicKnowledge, type MedicalTopicKnowledge } from '../../utils/topicKnowledgeBase';
import { RAPID_REVISION_DECK_TEXT } from '../../data/rapidRevisionDeckText';
import { IbqRapidRecallModal } from '../IbqRapidRecallModal';
import { calculateTopicPerformanceMetrics } from '../../utils/performanceEngine';
import type { AppState, McqAttempt, GrandTest } from '../../types';
import { SubjectAppleIcon } from '../SubjectAppleIcon';
import { StudyInsightRail, StudyModuleHeader } from './StudyModuleHeader';

export function getStoredTopicMastery(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('fmge_sprint_topic_mastery');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setStoredTopicMastery(mastery: Record<string, boolean>): void {
  try {
    localStorage.setItem('fmge_sprint_topic_mastery', JSON.stringify(mastery));
  } catch {}
}

export function getMatchingPearls(subjectId: string, topicQuery: string, customPearls: any[] = []): any[] {
  const all = [...INITIAL_PEARLS, ...(customPearls || [])];
  const qTerms = (topicQuery || '')
    .toLowerCase()
    .split(/[\s,()\/&-]+/)
    .filter((w) => w.length > 3);
  const sLower = subjectId.toLowerCase();

  const matched = all.filter((p) => {
    if (p.subjectId?.toLowerCase() !== sLower) return false;
    if (qTerms.length === 0) return true;
    const text = `${p.title} ${p.highYieldKey} ${p.explanation}`.toLowerCase();
    return qTerms.some((term) => text.includes(term));
  });

  return matched.length > 0 ? matched : all.filter((p) => p.subjectId?.toLowerCase() === sLower);
}

export function getMatchingKnowledgeBase(subjectId: string, topicQuery: string): MedicalTopicKnowledge | null {
  return getMedicalTopicKnowledge(subjectId, '', topicQuery);
}

export function searchRapidRevisionDeck(subjectName: string, topicQuery: string): Array<{ page: number; text: string }> {
  const matchedPages: Array<{ page: number; text: string }> = [];
  const deck = RAPID_REVISION_DECK_TEXT as unknown as Record<string, ReadonlyArray<{ page: number; text: string }>>;
  const qTerms = (topicQuery || '')
    .toLowerCase()
    .split(/[\s,()\/&-]+/)
    .filter((w) => w.length > 3);
  const sLower = subjectName.toLowerCase();

  for (const part of Object.values(deck)) {
    if (!Array.isArray(part)) continue;
    for (const item of part) {
      const tLower = item.text.toLowerCase();
      const matchesTopic = qTerms.some((term) => tLower.includes(term));
      const matchesSubject = tLower.includes(sLower);
      if (matchesTopic || (matchesSubject && qTerms.length === 0)) {
        matchedPages.push(item);
        if (matchedPages.length >= 3) break;
      }
    }
    if (matchedPages.length >= 3) break;
  }
  return matchedPages;
}

export function getMatchingVisualAssets(subjectId: string, topicQuery: string): VisualConceptAsset[] {
  const sLower = subjectId.toLowerCase();
  const qTerms = (topicQuery || '')
    .toLowerCase()
    .split(/[\s,()\/&-]+/)
    .filter((w) => w.length > 3);
  const matched: VisualConceptAsset[] = [];

  for (const asset of Object.values(VISUAL_CONCEPT_REGISTRY)) {
    const assetSubjects = (asset.subjects || []).map((s) => s.toLowerCase());
    const matchesSubject = assetSubjects.includes(sLower) || asset.conceptKey.toLowerCase().startsWith(sLower.slice(0, 4));
    if (!matchesSubject) continue;

    if (qTerms.length === 0) {
      matched.push(asset);
    } else {
      const assetSearch = `${asset.conceptKey} ${asset.visualTarget} ${asset.keyVisualFinding} ${asset.whatToLookFor} ${(asset.searchTerms || []).join(' ')}`.toLowerCase();
      if (qTerms.some((term) => assetSearch.includes(term))) {
        matched.push(asset);
      }
    }
    if (matched.length >= 4) break;
  }

  if (matched.length === 0) {
    for (const asset of Object.values(VISUAL_CONCEPT_REGISTRY)) {
      const assetSubjects = (asset.subjects || []).map((s) => s.toLowerCase());
      if (assetSubjects.includes(sLower) || asset.conceptKey.toLowerCase().startsWith(sLower.slice(0, 4))) {
        matched.push(asset);
        if (matched.length >= 3) break;
      }
    }
  }

  return matched;
}

export function generateClinicalFallbackNotes(
  subjectId: string,
  subjectName: string,
  topic: string,
  mode: 'cram' | 'tables' | 'oneliners'
): string {
  const kb = getMatchingKnowledgeBase(subjectId, topic);
  const pearls = getMatchingPearls(subjectId, topic);
  const visualAssets = getMatchingVisualAssets(subjectId, topic);

  if (mode === 'cram') {
    return `# 📖 Complete Cram Notes: ${topic} (${subjectName})

### 1. 🎯 Core Pathophysiology & Diagnostic Criteria
${kb ? kb.coreConcepts.map((c) => `- ${c}`).join('\n') : `- Essential high-yield clinical mechanisms for ${topic} in ${subjectName}.\n- Pathognomonic clinical signs and criteria tested in NBEMS FMGE.`}

### 2. 🔬 Gold Standard & Investigation of Choice (IOC)
- **Investigation of Choice (IOC):** ${kb?.goldStandardTest || 'Targeted diagnostic protocol per national clinical guidelines.'}
- **Gold Standard Test:** ${kb?.goldStandardTest || 'Confirmatory histopathology / definitive laboratory assay.'}
- **Key Visual Finding:** ${visualAssets[0]?.keyVisualFinding || 'Characteristic radiological / morphological pattern.'}

### 3. First-Line Management & Drug of Choice (DOC)
- **Drug of Choice (DOC):** ${kb?.firstLineTreatment || 'First-line antimicrobial / pharmacotherapy per latest guidelines.'}
- **Clinical Trap:** ${kb?.examTrap || 'Watch out for atypical presentations and contraindications.'}

### 4. Named Signs, Triads & Radiology Spotters
${visualAssets.map((a) => `- **${a.visualTarget}:** ${a.keyVisualFinding} (*What to look for:* ${a.whatToLookFor})`).join('\n') || '- Classic signs and eponymous presentations frequently tested.'}

### 5. High-Yield Numbers & Diagnostic Cut-offs
${kb ? kb.keyTakeaways.map((t) => `- **Key Rule:** ${t}`).join('\n') : `- Rapid recall formulas and time-sensitive treatment windows.`}`;
  }

  if (mode === 'tables') {
    return `# Confused Pairs & Differentiator Tables: ${topic}

### Table 1: Classic Clinical Differentiators for ${topic}

| Clinical Parameter | Primary Entity (${topic}) | Key Mimic / Differential |
|---|---|---|
| **Etiology / Mechanism** | Hallmark pathophysiology | Alternative mechanism |
| **Investigation of Choice** | ${kb?.goldStandardTest || 'Specific gold standard test'} | Routine baseline assessment |
| **Drug of Choice** | ${kb?.firstLineTreatment || 'First-line targeted drug'} | Alternative management |
| **Pathognomonic Sign** | ${visualAssets[0]?.keyVisualFinding || 'Classic hallmark sign'} | Distractor clinical finding |
| **Common Exam Trap** | ${kb?.examTrap || 'Examiners test this contrast'} | Watch for atypical presentations |

- **Exam Trap Warning:** Examiners frequently swap these two conditions in vignette distractor options!
- **2-Second Rule of Thumb:** Look for the gold-standard test (${kb?.goldStandardTest || 'IOC'}) in the question stem.`;
  }

  const lines: string[] = [];
  if (kb) {
    kb.keyTakeaways.forEach((t) => {
      lines.push(`${lines.length + 1}. **${t.split('=')[0] || t.slice(0, 30)}:** ${t.split('=')[1] || t} — *High frequency NBEMS recall*`);
    });
  }
  pearls.forEach((p) => {
    lines.push(`${lines.length + 1}. **${p.title}:** ${p.highYieldKey} — *Tested in recent cycles*`);
  });
  visualAssets.forEach((a) => {
    lines.push(`${lines.length + 1}. **${a.visualTarget}:** ${a.keyVisualFinding} — *Image spotter clue*`);
  });

  while (lines.length < 15) {
    const n = lines.length + 1;
    lines.push(`${n}. **${topic} High-Yield Rule ${n}:** Investigation of Choice is ${kb?.goldStandardTest || 'the gold standard'}; DOC is ${kb?.firstLineTreatment || 'first-line protocol'}. — *Direct 1-point question*`);
  }

  return `# 🎯 5-Year Recall One-Liners: ${topic} (${subjectName})\n\n${lines.slice(0, 15).join('\n')}`;
}

export interface CustomMixedQuestion {
  id: string;
  type: 'text' | 'image';
  stem: string;
  imageUrl?: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  rationale: string;
  pearl?: string;
  imageFinding?: string;
  whatToLookFor?: string;
}

function formatClinicalStem(
  demographics: string,
  presentation: string,
  physicalExamOrLabs: string,
  diagnosticQuestion: string
): string {
  let demo = (demographics || '').trim();
  let pres = (presentation || '').trim();
  let exam = (physicalExamOrLabs || '').trim();
  let q = (diagnosticQuestion || '').trim();

  // Strip accidental redundant leading verbs from presentation
  if (/^presents\s+with\s+/i.test(pres)) {
    pres = pres.replace(/^presents\s+with\s+/i, '');
  } else if (/^presents\s+to\s+/i.test(pres)) {
    pres = pres.replace(/^presents\s+to\s+/i, 'to ');
  } else if (/^presents\s+/i.test(pres)) {
    pres = pres.replace(/^presents\s+/i, '');
  } else if (/^admitted\s+to\s+/i.test(pres)) {
    pres = pres.replace(/^admitted\s+to\s+/i, 'to ');
  } else if (/^admitted\s+/i.test(pres)) {
    pres = pres.replace(/^admitted\s+/i, '');
  }

  // Ensure clean lead-in
  let combinedIntro = '';
  if (/^(to|with|following|after|during|on|at)\s+/i.test(pres)) {
    combinedIntro = `${demo} presents ${pres}`;
  } else {
    combinedIntro = `${demo} presents with ${pres}`;
  }

  // Strip trailing punctuation
  combinedIntro = combinedIntro.replace(/\.+$/, '');
  exam = exam.replace(/\.+$/, '');
  q = q.replace(/\.+$/, '');

  let full = `${combinedIntro}. Physical examination and initial labs reveal: ${exam}. ${q}`;
  // Remove multiple periods
  full = full.replace(/\.{2,}/g, '.');
  return full;
}

function shuffleQuestionOptions<T extends { id: string; text: string }>(
  options: T[],
  correctId: string
): { shuffled: T[]; newCorrectId: string } {
  const items = [...options];
  const correctItem = items.find((o) => o.id === correctId) || items[0];

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const letters = ['A', 'B', 'C', 'D'];
  let newCorrectId = 'A';
  const shuffled = items.map((item, idx) => {
    const letter = letters[idx] || item.id;
    if (item === correctItem || item.text === correctItem.text) {
      newCorrectId = letter;
    }
    return {
      ...item,
      id: letter,
    };
  });

  return { shuffled, newCorrectId };
}

function formatVisualOptionText(target: string, conceptKey?: string): string {
  if (!target) return 'Characteristic clinical finding';

  const key = (conceptKey || '').toLowerCase();
  if (key.includes('babcock')) return 'Babcock tissue grasping forceps';
  if (key.includes('hydatidiform_mole')) return 'Complete hydatidiform mole (Snowstorm appearance on USG)';
  if (key.includes('brachial_plexus')) return "Erb's palsy (Upper trunk C5-C6 lesion, Waiter's tip)";
  if (key.includes('claw_hand')) return 'Klumpke paralysis (Lower trunk C8-T1 total claw hand)';
  if (key.includes('knee_cruciate')) return 'Anterior cruciate ligament (ACL) complete tear';
  if (key.includes('action_potential')) return 'Ventricular cardiac action potential (Phase 0 Na+ influx)';
  if (key.includes('na_k_atpase')) return 'Na+/K+-ATPase primary active transport pump';
  if (key.includes('body_fluid')) return 'Total body water fluid compartments (Indicator dilution)';
  if (key.includes('lineweaver')) return 'Lineweaver-Burk plot of competitive enzyme inhibition';
  if (key.includes('dose_response')) return 'Log dose-response curve showing competitive antagonism';
  if (key.includes('minimal_change')) return 'Minimal change disease (Podocyte foot process effacement on EM)';
  if (key.includes('reed_sternberg')) return 'Reed-Sternberg cell (Classic Hodgkin lymphoma, Owl-eye)';
  if (key.includes('acid_fast') || key.includes('mycobacterium')) return 'Acid-fast bacilli (Mycobacterium tuberculosis, ZN stain)';
  if (key.includes('strep_pneumoniae')) return 'Streptococcus pneumoniae (Lancet-shaped Gram-positive diplococci)';
  if (key.includes('inferior_stemi')) return 'Acute Inferior Wall STEMI (ST elevation in leads II, III, aVF)';
  if (key.includes('complete_heart_block')) return 'Complete (Third-degree) AV heart block with AV dissociation';
  if (key.includes('anterior_stemi')) return 'Acute Anterior Wall STEMI (LAD occlusion, V1-V4 elevation)';
  if (key.includes('wpw_syndrome')) return 'Wolff-Parkinson-White (WPW) syndrome (Short PR & Delta wave)';
  if (key.includes('pneumothorax')) return 'Tension pneumothorax (Visceral pleural line & mediastinal shift)';
  if (key.includes('pneumoperitoneum')) return 'Pneumoperitoneum (Crescentic free gas under right diaphragm dome)';
  if (key.includes('crao')) return 'Central retinal artery occlusion (CRAO with Cherry-red spot)';
  if (key.includes('crvo')) return 'Central retinal vein occlusion (CRVO with Blood & Thunder fundus)';
  if (key.includes('pemphigus')) return 'Pemphigus vulgaris (Suprabasal acantholysis & tombstone row)';
  if (key.includes('erythema_multiforme')) return 'Erythema multiforme (Target / Iris erythematous lesion)';

  return target
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getSmartImageStem(imageType: string, index = 0): string {
  const typeLower = (imageType || '').toLowerCase();
  if (typeLower.includes('instrument')) {
    const variations = [
      'Examine the surgical instrument shown in the image below. Identify the instrument and its primary clinical application:',
      'Review the surgical or obstetric instrument shown below. Which of the following is the definitive identification and purpose?',
      'Identify the surgical instrument demonstrated in the clinical image below:',
      'Based on the structural design and tips of the instrument shown below, what is the correct identification?',
    ];
    return variations[index % variations.length];
  }
  if (typeLower.includes('ecg')) {
    const variations = [
      'Examine the 12-lead ECG rhythm strip shown below. Which of the following is the definitive diagnosis?',
      'Review the electrocardiogram tracing demonstrated below. What is the characteristic diagnostic rhythm?',
      'A patient presents with acute symptoms; review the 12-lead ECG shown below. What is the primary diagnosis?',
    ];
    return variations[index % variations.length];
  }
  if (typeLower.includes('ultrasound') || typeLower.includes('usg')) {
    const variations = [
      'Examine the ultrasound imaging study shown below. Which classic diagnostic hallmark is demonstrated?',
      'Review the sonographic scan shown below. What is the pathognomonic diagnostic feature?',
      'A pelvic ultrasound is performed as shown below. Identify the characteristic diagnostic finding:',
    ];
    return variations[index % variations.length];
  }
  if (typeLower.includes('x-ray') || typeLower.includes('radiology') || typeLower.includes('ct')) {
    const variations = [
      'Review the radiological study shown below. Which of the following is the characteristic hallmark finding?',
      'Examine the diagnostic radiograph shown below. What is the definitive imaging finding?',
      'A diagnostic X-ray is obtained as shown below. Identify the characteristic pathological sign:',
    ];
    return variations[index % variations.length];
  }
  if (typeLower.includes('histopathology') || typeLower.includes('pathology')) {
    const variations = [
      'Examine the high-power histopathological section shown below. What is the classic diagnostic finding?',
      'Review the microscopic biopsy section demonstrated below. Which pathognomonic feature is visible?',
      'A tissue biopsy is stained as shown below. What is the definitive pathological diagnosis?',
    ];
    return variations[index % variations.length];
  }
  if (typeLower.includes('fundoscopy') || typeLower.includes('ophthalmology')) {
    const variations = [
      'Examine the fundoscopic examination finding shown below. What is the definitive clinical diagnosis?',
      'Review the retinal photograph demonstrated below. Which pathognomonic sign is present?',
    ];
    return variations[index % variations.length];
  }
  if (typeLower.includes('dermatology')) {
    const variations = [
      'Examine the dermatological lesion shown in the clinical photograph below. What is the pathognomonic diagnosis?',
      'Review the skin lesion illustrated in the clinical image below. What is the primary diagnosis?',
    ];
    return variations[index % variations.length];
  }
  const qVariations = [
    `Examine the anatomical or diagnostic illustration shown below (${imageType}). Based on the structural relations and clinical findings, what is demonstrated?`,
    `Review the provided clinical study (${imageType}). Which of the following represents the correct anatomical localization or pathological lesion?`,
    `Identify the classic diagnostic feature shown in the accompanying ${imageType} study:`,
    `Examine the morphological characteristics shown in this ${imageType}. What is the primary diagnosis?`,
  ];
  return qVariations[index % qVariations.length];
}

function getSmartVisualDistractors(asset: VisualConceptAsset, subName: string): string[] {
  const typeLower = (asset.imageType || '').toLowerCase();
  const keyLower = (asset.conceptKey || '').toLowerCase();

  if (typeLower.includes('instrument') || keyLower.includes('instrument')) {
    const instruments = [
      'Allis tissue grasping forceps (Traumatic grasping of tough fascial edges)',
      'Kocher hemostatic clamp (Crushing hemostasis of tough vascular pedicles)',
      'Sponge holding forceps (Rampley forceps for antiseptic skin painting)',
      'Green-Armytage clamp (Hemostasis of uterine angles during cesarean)',
      'Sims double-bladed posterior vaginal speculum',
      'Hegar uterine cervical dilators',
    ];
    return instruments.filter((inst) => !inst.toLowerCase().includes(asset.visualTarget.slice(0, 7)));
  }

  if (typeLower.includes('ecg') || keyLower.includes('ecg')) {
    return [
      'Atrial fibrillation with rapid ventricular response and absent P waves',
      'Ventricular tachycardia (monomorphic) with AV dissociation',
      'First-degree AV block with fixed PR prolongation > 200 ms',
      'Sinus bradycardia with non-conducted premature atrial complexes',
    ];
  }

  if (typeLower.includes('ultrasound') || keyLower.includes('ultrasound')) {
    return [
      'Normal intrauterine gestational sac with visible yolk sac and cardiac activity',
      'Ectopic tubal pregnancy with adnexal mass and ring-of-fire vascularity',
      'Corpus luteum hemorrhagic cyst with thick echogenic walls',
      'Ovarian dermoid cyst with acoustic shadowing and Rokitansky protuberance',
    ];
  }

  if (typeLower.includes('x-ray') || typeLower.includes('radiology') || keyLower.includes('xray')) {
    return [
      'Right middle lobe consolidation with air bronchograms',
      'Pleural effusion with blunting of costophrenic angle and meniscus sign',
      'Pneumoperitoneum with subdiaphragmatic crescent of free gas',
      'Barium swallow showing Bird-beak appearance of Achalasia cardia',
    ];
  }

  if (typeLower.includes('histopathology') || typeLower.includes('pathology') || keyLower.includes('histo')) {
    return [
      'Caseating granulomatous inflammation with Langhans multinucleated giant cells',
      'Papillary thyroid carcinoma with Orphan Annie eye nuclei and psammoma bodies',
      'Acute myeloid leukemia (AML) with intracellular Auer rods',
      'Burkitt lymphoma with starry-sky pattern and tingible-body macrophages',
    ];
  }

  if (typeLower.includes('fundoscopy') || typeLower.includes('ophthalmology')) {
    return [
      'Branch retinal vein occlusion with sectoral flame hemorrhages',
      'Non-proliferative diabetic retinopathy with microaneurysms and hard exudates',
      'Rhegmatogenous retinal detachment with corrugated grey retina',
      'Bilateral optic disc edema (Papilledema) with blurred margins',
    ];
  }

  if (typeLower.includes('dermatology') || keyLower.includes('derm')) {
    return [
      'Bullous pemphigoid with tense subepidermal bullae (BP180 autoantibodies)',
      'Psoriasis vulgaris with silvery micaceous scales and Auspitz sign',
      'Lichen planus with pruritic polygonal purple planar papules (Wickham striae)',
      'Pityriasis rosea with herald patch and Christmas tree distribution',
    ];
  }

  return [
    `Characteristic pathognomonic presentation in ${subName}`,
    `Reactive inflammatory response in ${subName}`,
    `Atypical non-malignant variant in ${subName}`,
    `Post-infectious cellular proliferation in ${subName}`,
  ];
}

export function generateMixed10Quiz(subjectId: string, subjectName: string, topicName: string): CustomMixedQuestion[] {
  const result: CustomMixedQuestion[] = [];
  const sLower = subjectId.toLowerCase();

  // 1. Resolve authentic topic knowledge
  const kb = getMedicalTopicKnowledge(subjectId, '', topicName);

  // 2. Build 5 distinct high-yield text questions
  if (kb?.clinicalCase) {
    const cc = kb.clinicalCase;
    const stem = formatClinicalStem(cc.patientDemographics, cc.presentation, cc.physicalExamOrLabs, cc.diagnosticQuestion);
    const { shuffled, newCorrectId } = shuffleQuestionOptions(
      cc.options.map((o) => ({ id: o.key, text: o.text })),
      cc.options.find((o) => o.isCorrect)?.key || 'A'
    );
    result.push({
      id: `quiz-text-${subjectId}-case`,
      type: 'text',
      stem,
      options: shuffled,
      correctOptionId: newCorrectId,
      rationale: cc.clinicalExplanation,
      pearl: cc.examPearl,
    });
  }

  // Question 2: Investigation / Screening Gold Standard
  if (result.length < 5) {
    const goldStandard = kb?.goldStandardTest || `High-resolution diagnostic evaluation and targeted tissue testing for ${topicName}`;
    const dists = [
      `Empirical observation without confirmatory testing or tissue sampling`,
      `Non-contrast plain radiography and routine electrolyte profile alone`,
      `Delayed follow-up evaluation in 12 months without immediate investigation`,
    ];
    if (sLower === 'obg' || topicName.toLowerCase().includes('cervic') || topicName.toLowerCase().includes('pap')) {
      dists[0] = 'Pelvic ultrasound alone without cervical cytology or HPV testing';
      dists[1] = 'Serum CA-125 measurement and observation for 6 months';
      dists[2] = 'Empirical broad-spectrum oral antibiotics without tissue sampling';
    } else if (sLower === 'surgery' || topicName.toLowerCase().includes('burn') || topicName.toLowerCase().includes('trauma')) {
      dists[0] = 'Immediate oral fluid challenge without intravenous access';
      dists[1] = 'Broad-spectrum systemic corticosteroid therapy';
      dists[2] = 'Exploratory laparotomy without hemodynamic stabilization';
    } else if (sLower === 'medicine' || topicName.toLowerCase().includes('ecg') || topicName.toLowerCase().includes('heart')) {
      dists[0] = 'Serum troponin level at 72 hours without baseline 12-lead ECG';
      dists[1] = 'Exercise treadmill testing during active resting chest pain';
      dists[2] = 'Transthoracic echocardiogram after 3 months of observation';
    }

    const { shuffled, newCorrectId } = shuffleQuestionOptions(
      [
        { id: 'A', text: goldStandard },
        { id: 'B', text: dists[0] },
        { id: 'C', text: dists[1] },
        { id: 'D', text: dists[2] },
      ],
      'A'
    );
    result.push({
      id: `quiz-text-${subjectId}-inv`,
      type: 'text',
      stem: `A patient presents for clinical evaluation and initial diagnostic workup of ${topicName} in ${subjectName}. Based on standard NBEMS guidelines, what is the definitive gold standard investigation or primary screening modality?`,
      options: shuffled,
      correctOptionId: newCorrectId,
      rationale: `Gold standard investigation: ${goldStandard}. ${kb?.highYieldSummary || ''}`,
      pearl: kb?.keyTakeaways?.[0] || goldStandard,
    });
  }

  // Question 3: First-line Treatment / Management Protocol
  if (result.length < 5) {
    const doc = kb?.firstLineTreatment || `Initiate guideline-directed first-line pharmacological or procedural protocol for ${topicName}`;
    const dists = [
      `Systemic high-dose corticosteroid pulse therapy`,
      `Immediate exploratory surgical intervention without staging or resuscitation`,
      `Discontinue all active treatment and adopt expectant watchful waiting`,
    ];
    if (sLower === 'obg' || topicName.toLowerCase().includes('cervic') || topicName.toLowerCase().includes('figo')) {
      dists[0] = 'Total abdominal hysterectomy with conservation of parametrium in all stages';
      dists[1] = 'Oral progestin therapy and expectant observation for 1 year';
      dists[2] = 'Neoadjuvant immunotherapy without radiation or platinum chemotherapy';
    } else if (sLower === 'medicine' || topicName.toLowerCase().includes('arrhythmia') || topicName.toLowerCase().includes('dka')) {
      dists[0] = 'Oral calcium channel blockers without cardiac monitoring';
      dists[1] = 'Immediate intravenous sodium bicarbonate bolus without fluid hydration';
      dists[2] = 'Intravenous loop diuretics as monotherapy';
    }

    const { shuffled, newCorrectId } = shuffleQuestionOptions(
      [
        { id: 'A', text: doc },
        { id: 'B', text: dists[0] },
        { id: 'C', text: dists[1] },
        { id: 'D', text: dists[2] },
      ],
      'A'
    );
    result.push({
      id: `quiz-text-${subjectId}-doc`,
      type: 'text',
      stem: `In the clinical management of ${topicName}, what is the definitive first-line treatment of choice or therapeutic protocol recommended by NBEMS?`,
      options: shuffled,
      correctOptionId: newCorrectId,
      rationale: `Definitive first-line management: ${doc}. ${kb?.examTrap || ''}`,
      pearl: kb?.examTrap || doc,
    });
  }

  // Question 4: Core Concept / Diagnostic Criteria
  if (result.length < 5) {
    const card = kb?.flashcards?.[0];
    const correctConcept = card?.back?.split('\n')[0] || kb?.coreConcepts?.[0] || `Essential diagnostic criteria and staging rules for ${topicName}`;
    const dists = [
      `Pathology is limited to superficial epithelium without risk of deeper anatomical progression`,
      `Clinical staging relies exclusively on post-operative histopathological specimens`,
      `Routine screening is contraindicated in asymptomatic individuals due to low specificity`,
    ];
    if (sLower === 'obg' || topicName.toLowerCase().includes('cervic')) {
      dists[0] = 'HPV 6 and 11 are the primary high-risk drivers of invasive cervical carcinoma';
      dists[1] = 'Screening is recommended annually starting at age 18 regardless of sexual history';
      dists[2] = 'Parametrial invasion represents FIGO Stage I and is managed with simple conization';
    }

    const { shuffled, newCorrectId } = shuffleQuestionOptions(
      [
        { id: 'A', text: correctConcept },
        { id: 'B', text: dists[0] },
        { id: 'C', text: dists[1] },
        { id: 'D', text: dists[2] },
      ],
      'A'
    );
    result.push({
      id: `quiz-text-${subjectId}-concept`,
      type: 'text',
      stem: card?.front || `Regarding the core clinical concepts and diagnostic staging for ${topicName}, which of the following statements is correct?`,
      options: shuffled,
      correctOptionId: newCorrectId,
      rationale: card?.back || kb?.coreConcepts?.[0] || correctConcept,
      pearl: card?.clinicalPearl || kb?.keyTakeaways?.[0],
    });
  }

  // Question 5: High-Yield Exam Trap / Clinical Pitfall
  if (result.length < 5) {
    const card2 = kb?.flashcards?.[1] || kb?.flashcards?.[0];
    const correctTrap = kb?.examTrap || card2?.clinicalPearl || kb?.keyTakeaways?.[1] || `Careful staging is mandatory to prevent inappropriate surgical or therapeutic intervention in ${topicName}`;
    const dists = [
      `Always proceed directly to radical surgical extirpation regardless of parametrial involvement`,
      `Biopsy confirmation is unnecessary if physical examination is suggestive`,
      `Diagnostic sensitivity is identical between rapid inspection and molecular assays`,
    ];
    if (sLower === 'obg' || topicName.toLowerCase().includes('cervic')) {
      dists[0] = 'Primary radical hysterectomy is the preferred treatment for FIGO Stage IIB and above';
      dists[1] = 'Colposcopy-directed punch biopsy should be avoided in premenopausal patients';
      dists[2] = 'Visual inspection with acetic acid is 100% sensitive for endocervical canal lesions';
    }

    const { shuffled, newCorrectId } = shuffleQuestionOptions(
      [
        { id: 'A', text: correctTrap },
        { id: 'B', text: dists[0] },
        { id: 'C', text: dists[1] },
        { id: 'D', text: dists[2] },
      ],
      'A'
    );
    result.push({
      id: `quiz-text-${subjectId}-trap`,
      type: 'text',
      stem: `When managing a patient with ${topicName}, which of the following represents a high-yield clinical guideline rule or critical exam pitfall to avoid?`,
      options: shuffled,
      correctOptionId: newCorrectId,
      rationale: `Clinical guideline takeaway: ${correctTrap}`,
      pearl: correctTrap,
    });
  }

  // 3. Build 5 distinct Image-Based Questions (Questions 6 to 10)
  // Check verified IBQ bank first
  const ibqs = VERIFIED_IBQ_BANK.filter(
    (q) => q.subject.toLowerCase() === sLower || q.subject.toLowerCase().includes(sLower)
  );

  for (const ibq of ibqs) {
    if (result.length < 10) {
      const { shuffled, newCorrectId } = shuffleQuestionOptions(ibq.options, ibq.correctOptionId);
      result.push({
        id: `quiz-img-${ibq.id}`,
        type: 'image',
        stem: ibq.vignette,
        imageUrl: ibq.imageSrc,
        options: shuffled,
        correctOptionId: newCorrectId,
        rationale: ibq.explanation.detailedRationale || 'Diagnostic clinical rationale for the image finding.',
        imageFinding: ibq.explanation.imageFinding,
        whatToLookFor: (ibq.explanation.highYieldBuzzwords || []).join(', '),
      });
    }
  }

  // Next, pull distinct visual assets from VISUAL_CONCEPT_REGISTRY
  const visualAssets = Object.values(VISUAL_CONCEPT_REGISTRY).filter(
    (a) => (a.subjects || []).map((s) => s.toLowerCase()).includes(sLower) || a.conceptKey.toLowerCase().startsWith(sLower.slice(0, 4))
  );

  let vIdx = 0;
  const usedConceptKeys = new Set<string>();
  while (result.length < 10) {
    let asset = visualAssets[vIdx % Math.max(1, visualAssets.length)];
    if (!asset || usedConceptKeys.has(asset.conceptKey)) {
      // Find an unused asset from registry
      const allAssets = Object.values(VISUAL_CONCEPT_REGISTRY);
      const unused = allAssets.find((a) => !usedConceptKeys.has(a.conceptKey));
      asset = unused || allAssets[vIdx % allAssets.length];
    }
    usedConceptKeys.add(asset.conceptKey);
    vIdx++;

    const qNum = result.length + 1;
    const stem = getSmartImageStem(asset.imageType, qNum);
    const targetText = formatVisualOptionText(asset.visualTarget, asset.conceptKey);
    const dists = getSmartVisualDistractors(asset, subjectName);

    const { shuffled, newCorrectId } = shuffleQuestionOptions(
      [
        { id: 'A', text: targetText },
        { id: 'B', text: dists[0] || 'Benign reactive change' },
        { id: 'C', text: dists[1] || 'Post-inflammatory cellular alteration' },
        { id: 'D', text: dists[2] || 'Atypical non-diagnostic variant' },
      ],
      'A'
    );

    result.push({
      id: `quiz-img-synth-${asset.conceptKey}-${qNum}`,
      type: 'image',
      stem,
      imageUrl: asset.imageUrl,
      options: shuffled,
      correctOptionId: newCorrectId,
      rationale: `${asset.keyVisualFinding}\n\nWhat to look for: ${asset.whatToLookFor}`,
      imageFinding: asset.keyVisualFinding,
      whatToLookFor: asset.whatToLookFor,
    });
  }

  return result;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pIdx} className="italic text-slate-600">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const flushTable = (key: string) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={key} className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeader.length > 0 && (
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="p-2.5 font-bold border-r border-slate-200 last:border-r-0">
                      {th.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((tr, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                  {tr.map((td, cIdx) => (
                    <td key={cIdx} className="p-2.5 border-t border-slate-100 border-r border-slate-100 last:border-r-0 text-slate-700">
                      {renderFormattedInline(td.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cols = trimmed.split('|').slice(1, -1);
      if (cols.every((c) => c.trim().replace(/-/g, '').replace(/:/g, '') === '')) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cols;
      } else {
        tableRows.push(cols);
      }
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-base sm:text-lg font-black text-slate-900 mt-4 mb-2">{renderFormattedInline(trimmed.replace(/^#\s+/, ''))}</h2>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-sm sm:text-base font-bold text-slate-800 mt-3 mb-1.5">{renderFormattedInline(trimmed.replace(/^##\s+/, ''))}</h3>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-xs sm:text-sm font-bold text-emerald-800 mt-2.5 mb-1 flex items-center gap-1.5">{renderFormattedInline(trimmed.replace(/^###\s+/, ''))}</h4>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 my-1 leading-relaxed pl-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
          <span className="flex-1">{renderFormattedInline(trimmed.replace(/^[-•]\s+/, ''))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 my-1 leading-relaxed pl-2">
          <span className="font-mono font-bold text-emerald-700 shrink-0">{match ? match[1] + '.' : '•'}</span>
          <span className="flex-1">{renderFormattedInline(match ? match[2] : trimmed)}</span>
        </div>
      );
    } else {
      elements.push(<p key={i} className="text-xs text-slate-700 my-1.5 leading-relaxed">{renderFormattedInline(trimmed)}</p>);
    }
  }

  if (inTable) {
    flushTable('table-end');
  }

  return <div className="space-y-1">{elements}</div>;
};

// ═══ SPRINT STUDY DESK MODAL (INSTANT NOTES + GEMINI DEEP DIVE) ═══
interface SprintStudyDeskModalProps {
  deskState: {
    isOpen: boolean;
    subjectId: string;
    subjectName: string;
    topicName: string;
    matchedTopicId?: string;
  };
  onClose: () => void;
  onLaunchPracticeMcq: (subjectId: string, topicId?: string, topicName?: string) => void;
  onLaunchIbq: (subjectId: string, topicName?: string) => void;
  onLaunchAiQuiz: (subjectId: string, topicName?: string) => void;
  topicMastery: Record<string, boolean>;
  toggleTopicMastery: (subId: string, topicName: string) => void;
  customPearls?: any[];
}

const SprintStudyDeskModal: React.FC<SprintStudyDeskModalProps> = ({
  deskState,
  onClose,
  onLaunchPracticeMcq,
  onLaunchIbq,
  onLaunchAiQuiz,
  topicMastery,
  toggleTopicMastery,
  customPearls = [],
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'gemini'>('notes');
  const [geminiMode, setGeminiMode] = useState<'cram' | 'tables' | 'oneliners' | null>(null);
  const [geminiContent, setGeminiContent] = useState<string>('');
  const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const masteryKey = `${deskState.subjectId.toLowerCase()}::${deskState.topicName.toLowerCase().trim()}`;
  const isMastered = !!topicMastery[masteryKey];

  const kb = useMemo(
    () => getMatchingKnowledgeBase(deskState.subjectId, deskState.topicName),
    [deskState.subjectId, deskState.topicName]
  );
  const visualAssets = useMemo(
    () => getMatchingVisualAssets(deskState.subjectId, deskState.topicName),
    [deskState.subjectId, deskState.topicName]
  );
  const pearls = useMemo(
    () => getMatchingPearls(deskState.subjectId, deskState.topicName, customPearls),
    [deskState.subjectId, deskState.topicName, customPearls]
  );
  const revisionSnippets = useMemo(
    () => searchRapidRevisionDeck(deskState.subjectId, deskState.topicName),
    [deskState.subjectId, deskState.topicName]
  );

  const handleCopy = () => {
    if (!geminiContent) return;
    navigator.clipboard.writeText(geminiContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateGemini = async (mode: 'cram' | 'tables' | 'oneliners') => {
    const cacheKey = `fmge_sprint_material_${deskState.subjectId}_${deskState.topicName}_${mode}`.toLowerCase();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setGeminiContent(cached);
      setGeminiMode(mode);
      setActiveTab('gemini');
      return;
    }

    setIsLoadingGemini(true);
    setGeminiMode(mode);
    setActiveTab('gemini');

    let prompt = '';
    if (mode === 'cram') {
      prompt = `Act as an expert FMGE medical educator. Generate Complete Cram Notes for the FMGE exam on the topic "${deskState.topicName}" in the subject "${deskState.subjectName}". Include:
1. Core Concepts & Pathophysiology
2. Gold Standard & Investigation of Choice (IOC)
3. Drug of Choice (DOC) & First-line management
4. Named Signs, Triads & Visual spotters
5. High-Yield Numbers & Diagnostic cut-offs.
Keep it bullet-point, high-yield, and focused on scoring points in the upcoming NBEMS FMGE.`;
    } else if (mode === 'tables') {
      prompt = `Act as an expert FMGE medical educator. Generate Confused Pairs & Volatile Differentiator Tables for "${deskState.topicName}" in "${deskState.subjectName}". 
Create clear markdown comparison tables contrasting easily confused diseases, mimickers, and volatile high-yield numbers that NBEMS frequently uses as traps in FMGE vignettes.`;
    } else {
      prompt = `Act as an expert FMGE medical educator. Generate exactly 15 rapid-fire FMGE 5-year recall one-liners for "${deskState.topicName}" in "${deskState.subjectName}".
Format as a numbered list: 1. [Buzzword / Key finding]: [Definitive answer] — [Brief exam cue].`;
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          studentContext: {
            weakSubjects: [deskState.subjectId],
            targetScore: 200,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setGeminiContent(data.reply);
          localStorage.setItem(cacheKey, data.reply);
          setIsLoadingGemini(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Gemini chat request failed, using clinical fallback notes', err);
    }

    const fallback = generateClinicalFallbackNotes(deskState.subjectId, deskState.subjectName, deskState.topicName, mode);
    setGeminiContent(fallback);
    localStorage.setItem(cacheKey, fallback);
    setIsLoadingGemini(false);
  };

  return (
    <div className="study-suite-modal-backdrop fixed inset-0 z-[9100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <SubjectAppleIcon subjectId={deskState.subjectId} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {deskState.subjectName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sprint Study Desk</span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-white truncate leading-tight">
                {deskState.topicName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleTopicMastery(deskState.subjectId, deskState.topicName)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMastered
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/10 text-white/80 border-white/20 hover:border-emerald-400'
              }`}
            >
              {isMastered ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-white/60" />
              )}
              <span>{isMastered ? 'Mastered ✓' : 'Mark Mastered'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 1-Click Action Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Launch Tests for this Topic:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onLaunchPracticeMcq(deskState.subjectId, deskState.matchedTopicId, deskState.topicName)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>📝 Text MCQ Test</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchIbq(deskState.subjectId, deskState.topicName)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>🖼️ Image (IBQ) Test</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchAiQuiz(deskState.subjectId, deskState.topicName)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Brain className="h-3.5 w-3.5" />
              <span>AI Custom Quiz (5T+5I)</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-5 border-b border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            <span>Built-In High-Yield Material & Spotters</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gemini'
                ? 'border-purple-600 text-purple-950 bg-purple-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-purple-600" />
            <span>Gemini AI Live Study Generator</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'notes' ? (
            <>
              {/* 1. Medical Topic Knowledge Base */}
              {kb && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Standard High-Yield Clinical Profile
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Gold Standard / Investigation of Choice:
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {kb.goldStandardTest}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        First-Line Treatment / Drug of Choice:
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {kb.firstLineTreatment}
                      </p>
                    </div>
                  </div>

                  {kb.examTrap && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Examiner Clinical Trap:
                      </span>
                      <p className="text-rose-950 font-medium leading-relaxed">{kb.examTrap}</p>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Core Concepts Tested:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {kb.coreConcepts.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {kb.keyTakeaways.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Key Diagnostic Rules & Formulas:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {kb.keyTakeaways.map((t, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-800 font-medium leading-snug">
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Visual Spotter Cards with Images */}
              {visualAssets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Eye className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Verified Visual Spotters & Diagnostic Images ({visualAssets.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visualAssets.map((asset, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs space-y-3 p-3.5"
                      >
                        <div className="relative rounded-xl bg-slate-900 min-h-[170px] max-h-[220px] flex items-center justify-center overflow-hidden">
                          <img
                            src={asset.imageUrl}
                            alt={asset.visualTarget}
                            className="max-h-[200px] w-auto object-contain cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setZoomedImage(asset.imageUrl)}
                          />
                          <button
                            type="button"
                            onClick={() => setZoomedImage(asset.imageUrl)}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="h-3 w-3" /> Zoom
                          </button>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            {asset.imageType} Spotter
                          </span>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                            {asset.visualTarget}
                          </h5>
                          <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                            {asset.keyVisualFinding}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-950 space-y-0.5">
                          <span className="font-bold text-indigo-800 block">What to look for on image:</span>
                          <p className="leading-relaxed">{asset.whatToLookFor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. High-Yield Medical Pearls */}
              {pearls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                      <Award className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">
                      High-Yield Exam Pearls ({pearls.length})
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {pearls.map((pearl, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                            {pearl.title}
                          </h5>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                            {pearl.category || 'High-Yield'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-950 leading-snug">
                          Key Takeaway: {pearl.highYieldKey}
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {pearl.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Rapid Revision Text Extract */}
              {revisionSnippets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                      <Layers className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Rapid Revision Deck Key Notes
                    </h4>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-2 text-xs">
                    {revisionSnippets.map((snip, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-purple-100/90 text-slate-800 leading-relaxed space-y-1">
                        <span className="font-mono font-bold text-purple-700 block text-[10px] uppercase">
                          Rapid Deck Page {snip.page}
                        </span>
                        <p className="line-clamp-4 leading-relaxed">{snip.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Tab 2: Gemini AI Live Generator */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Gemini Live Medical Generator (@google/genai)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Instant structured notes, differentiator tables, and PYQ one-liners tailored to NBEMS FMGE benchmarks.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleGenerateGemini('cram')}
                    disabled={isLoadingGemini}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      geminiMode === 'cram'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Complete Cram Notes</span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-2 ${geminiMode === 'cram' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Core mechanism, IOC, DOC, triads & high-yield formulas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateGemini('tables')}
                    disabled={isLoadingGemini}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      geminiMode === 'tables'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Confused Pairs Tables</span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-2 ${geminiMode === 'tables' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      Markdown comparison tables contrasting lookalike mimickers.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateGemini('oneliners')}
                    disabled={isLoadingGemini}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      geminiMode === 'oneliners'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      <span>5-Yr Recall One-Liners</span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-2 ${geminiMode === 'oneliners' ? 'text-purple-100' : 'text-slate-500'}`}>
                      15 rapid-fire FMGE PYQ buzzword-to-answer facts.
                    </p>
                  </button>
                </div>
              </div>

              {isLoadingGemini && (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-purple-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800">
                    Synthesizing high-yield NBEMS points with Gemini...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Retrieving gold-standard criteria, contraindications, and volatile tables.
                  </p>
                </div>
              )}

              {!isLoadingGemini && geminiContent && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
                      Generated Clinical High-Yield Notes
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                    </button>
                  </div>

                  <MarkdownRenderer content={geminiContent} />
                </div>
              )}

              {!isLoadingGemini && !geminiContent && (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <FileText className="h-8 w-8 text-purple-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    Select a Generator Mode Above
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Complete Cram Notes", "Confused Pairs Tables", or "5-Yr Recall One-Liners" to produce live study material.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-slate-500">
            {isMastered ? '✓ Topic is marked as Mastered' : '○ Not yet marked as mastered'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-all"
          >
            Done Studying
          </button>
        </div>

        {/* Image Zoom Modal */}
        <AnimatePresence>
          {zoomedImage && (
            <div
              className="study-suite-modal-backdrop fixed inset-0 z-[9200] flex items-center justify-center p-4 bg-black/80"
              onClick={() => setZoomedImage(null)}
            >
              <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 p-2 rounded-2xl overflow-hidden">
                <img
                  src={zoomedImage}
                  alt="Zoomed finding"
                  className="max-h-[85vh] w-auto object-contain mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white cursor-pointer hover:bg-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ═══ INTERACTIVE IBQ SPOTTER QUIZ MODAL ═══
interface InteractiveIbqQuizModalProps {
  quiz: {
    isOpen: boolean;
    subjectId: string;
    subjectName: string;
    questions: Array<{
      id: string;
      vignette: string;
      imageSrc: string;
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
      imageFinding?: string;
      whatToLookFor?: string;
      rationale?: string;
    }>;
    currentIndex: number;
    selectedAnswers: Record<number, string>;
    isCompleted: boolean;
    score: number;
    showAnnotated: boolean;
  };
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onRetest: () => void;
  onOpenStudyDesk: (subjectId: string) => void;
}

const InteractiveIbqQuizModal: React.FC<InteractiveIbqQuizModalProps> = ({
  quiz,
  onClose,
  onSelectOption,
  onNextQuestion,
  onPrevQuestion,
  onRetest,
  onOpenStudyDesk,
}) => {
  const currentQ = quiz.questions[quiz.currentIndex];
  const selectedAns = quiz.selectedAnswers[quiz.currentIndex];
  const isAnswered = !!selectedAns;

  return (
    <div className="study-suite-modal-backdrop fixed inset-0 z-[9100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-indigo-950 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                {quiz.subjectName} · IBQ Spotter Drill
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Question {quiz.currentIndex + 1} of {quiz.questions.length}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-indigo-900 text-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-700">
              Score: {quiz.score} / {quiz.questions.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quiz Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {quiz.isCompleted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  IBQ Spotter Test Complete!
                </h4>
                <p className="text-xs text-slate-500">
                  You scored {quiz.score} out of {quiz.questions.length} ({Math.round((quiz.score / Math.max(1, quiz.questions.length)) * 100)}%)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 max-w-md mx-auto text-xs text-indigo-950 font-medium">
                {Math.round((quiz.score / Math.max(1, quiz.questions.length)) * 100) >= 70
                  ? '🎯 Passing Benchmark Cleared! Your visual pattern recognition in this subject is exam-ready.'
                  : '⚠️ Review Visual Spotters! Click Open Study Desk to review the image findings and buzzwords.'}
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onRetest}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  Retest Quiz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyDesk(quiz.subjectId);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Open Study Desk
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : currentQ ? (
            <>
              {/* Question Vignette */}
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                {currentQ.vignette}
              </p>

              {/* Medical Image Display */}
              <div className="relative rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center min-h-[190px] max-h-[260px] overflow-hidden">
                <img
                  src={currentQ.imageSrc}
                  alt="Clinical Diagnostic Finding"
                  className="max-h-[240px] w-auto object-contain rounded-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAns === opt.id;
                  const isCorrect = opt.id === currentQ.correctOptionId;

                  let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-400';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-600 border-emerald-600 text-white font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-600 border-rose-600 text-white font-bold';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => onSelectOption(opt.id)}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className="font-mono font-bold shrink-0">{opt.id}.</span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                      {isAnswered && isCorrect && <Check className="h-4 w-4 shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <X className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Post-Answer Explanation Box */}
              {isAnswered && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2 text-xs text-indigo-950">
                  <div className="font-bold text-sm text-indigo-900 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-indigo-600" />
                    <span>Visual Spotter Breakdown:</span>
                  </div>

                  {currentQ.imageFinding && (
                    <div>
                      <span className="font-bold text-indigo-800">Key Finding: </span>
                      <span>{currentQ.imageFinding}</span>
                    </div>
                  )}

                  {currentQ.whatToLookFor && (
                    <div>
                      <span className="font-bold text-indigo-800">What to look for on image: </span>
                      <span>{currentQ.whatToLookFor}</span>
                    </div>
                  )}

                  {currentQ.rationale && (
                    <p className="pt-1 text-slate-700 leading-relaxed border-t border-indigo-100">
                      {currentQ.rationale}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Navigation */}
        {!quiz.isCompleted && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              disabled={quiz.currentIndex === 0}
              onClick={onPrevQuestion}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>

            {isAnswered ? (
              <button
                type="button"
                onClick={onNextQuestion}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>{quiz.currentIndex === quiz.questions.length - 1 ? 'Finish Drill' : 'Next Question'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Select an option to view rationale</span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ═══ INTERACTIVE AI CUSTOM QUIZ MODAL (5 TEXT + 5 IMAGE WITH 45S TIMER) ═══
interface InteractiveAiCustomQuizModalProps {
  quiz: {
    isOpen: boolean;
    subjectId: string;
    subjectName: string;
    topicName: string;
    questions: CustomMixedQuestion[];
    currentIndex: number;
    selectedAnswers: Record<number, string>;
    isCompleted: boolean;
    score: number;
    timeLeft: number;
  };
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
  onNextQuestion: () => void;
  onRetest: () => void;
  onOpenStudyDesk: (subjectId: string, topicName: string) => void;
}

const InteractiveAiCustomQuizModal: React.FC<InteractiveAiCustomQuizModalProps> = ({
  quiz,
  onClose,
  onSelectOption,
  onNextQuestion,
  onRetest,
  onOpenStudyDesk,
}) => {
  const currentQ = quiz.questions[quiz.currentIndex];
  const selectedAns = quiz.selectedAnswers[quiz.currentIndex];
  const isAnswered = !!selectedAns;

  const timerPct = Math.min(100, Math.max(0, (quiz.timeLeft / 45) * 100));
  const timerColor = quiz.timeLeft > 15 ? 'bg-emerald-500' : quiz.timeLeft > 5 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse';

  return (
    <div className="study-suite-modal-backdrop fixed inset-0 z-[9100] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-purple-950 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                {quiz.subjectName} · AI Custom Quiz (5T + 5I)
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Question {quiz.currentIndex + 1} of 10
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-purple-900 text-purple-200 px-2.5 py-1 rounded-lg border border-purple-700">
              Score: {quiz.score} / 10
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 45s Pacing Alert Timer Bar */}
        {!quiz.isCompleted && (
          <div className="px-5 py-2 bg-slate-900 text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-400" />
                <span>45s Pacing Alert</span>
              </span>
              <span className={quiz.timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}>
                {quiz.timeLeft}s
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${timerColor}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            {quiz.timeLeft === 0 && !isAnswered && (
              <div className="mt-1.5 text-[10px] font-bold text-rose-400">
                ⏱️ Pacing Alert: 45 seconds elapsed! In FMGE, pacing 45s per MCQ guarantees finishing 300 questions. Select an option below.
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {quiz.isCompleted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-purple-200 flex items-center justify-center mx-auto text-purple-600">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  AI Custom Quiz Complete!
                </h4>
                <p className="text-xs text-slate-500">
                  Final Score: {quiz.score} / 10 ({quiz.score * 10}%)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 max-w-md mx-auto text-xs text-purple-950 font-medium">
                {quiz.score >= 7
                  ? '🎯 Passing Benchmark Cleared! High retention of both text clinical vignettes and visual spotters.'
                  : '⚠️ Review Study Notes! Revisit volatile numbers and visual clues to reach 70%+ benchmark.'}
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onRetest}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                >
                  Retest Quiz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyDesk(quiz.subjectId, quiz.topicName);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Open Study Desk
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : currentQ ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  currentQ.type === 'image'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {currentQ.type === 'image' ? '🖼️ Visual Spotter' : '📝 Clinical Vignette'}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                {currentQ.stem}
              </p>

              {currentQ.type === 'image' && currentQ.imageUrl && (
                <div className="relative rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center min-h-[180px] max-h-[240px] overflow-hidden">
                  <img
                    src={currentQ.imageUrl}
                    alt="Clinical finding"
                    className="max-h-[220px] w-auto object-contain rounded-lg"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 4 Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAns === opt.id;
                  const isCorrect = opt.id === currentQ.correctOptionId;

                  let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-400';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-600 border-emerald-600 text-white font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-600 border-rose-600 text-white font-bold';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => onSelectOption(opt.id)}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className="font-mono font-bold shrink-0">{opt.id}.</span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                      {isAnswered && isCorrect && <Check className="h-4 w-4 shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <X className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Post-Answer Explanation Box */}
              {isAnswered && (
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2 text-xs text-purple-950">
                  <div className="font-bold text-sm text-purple-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>Clinical Breakdown & Rationales:</span>
                  </div>

                  {currentQ.rationale && (
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {currentQ.rationale}
                    </p>
                  )}

                  {currentQ.imageFinding && (
                    <div className="text-[11.5px] text-indigo-900">
                      <span className="font-bold text-indigo-800">Visual Cue: </span>
                      <span>{currentQ.imageFinding} ({currentQ.whatToLookFor})</span>
                    </div>
                  )}

                  {currentQ.pearl && (
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200 text-[11.5px] text-purple-950">
                      <span className="font-bold text-purple-700">Exam Pearl: </span>
                      <span>{currentQ.pearl}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Navigation */}
        {!quiz.isCompleted && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
            {isAnswered ? (
              <button
                type="button"
                onClick={onNextQuestion}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>{quiz.currentIndex === 9 ? 'Finish Quiz' : 'Next Question'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Select an option before continuing</span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface ExamSprintViewProps {
  state: AppState;
  onLaunchPracticeMcq: (subjectId: string, topicId?: string, topicName?: string) => void;
  onOpenFlashcards: (subjectId: string, topicId?: string) => void;
  onSelectSubject: (subjectId: string) => void;
  onUpdateSprint?: (sprint: NonNullable<AppState['fmgeSprint']>) => void;
  onOpenDailyPlanner?: () => void;
  onOpenRevisionMatrix?: () => void;
  onNavigateTab?: (tab: any) => void;
  onToggleTopicState?: (
    subjectId: string,
    topicId: string,
    field: 'notesDone' | 'qBankDone' | 'r1Done' | 'r2Done' | 'r3Done'
  ) => void;
}

// — Circular SVG Gauge
const Gauge: React.FC<{
  pct: number;
  size?: number;
  sw?: number;
  color?: string;
  track?: string;
}> = ({ pct, size = 52, sw = 4.5, color = '#10B981', track = '#E5E7EB' }) => {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-black text-slate-900 tracking-tight leading-none">
        {pct}%
      </span>
    </div>
  );
};

export const ExamSprintView: React.FC<ExamSprintViewProps> = ({
  state,
  onLaunchPracticeMcq,
  onOpenFlashcards,
  onSelectSubject,
  onUpdateSprint,
  onOpenDailyPlanner,
  onOpenRevisionMatrix,
  onNavigateTab,
  onToggleTopicState,
}) => {
  const sprint = state.fmgeSprint;
  const attempts = state.mcqAttempts || [];
  const grandTests = state.grandTests || [];

  const [activeTier, setActiveTier] = useState<number | 'all'>('all');
  const [dailyHours, setDailyHours] = useState<number>(sprint?.dailyHours || 6);
  const [activeVisualAsset, setActiveVisualAsset] = useState<VisualConceptAsset | null>(null);
  const [showAnnotatedImage, setShowAnnotatedImage] = useState(false);
  const [showChecklistTasks, setShowChecklistTasks] = useState(false);

  // Topic mastery tracking persisted in localStorage
  const [topicMastery, setTopicMastery] = useState<Record<string, boolean>>(getStoredTopicMastery);

  const toggleTopicMastery = (subId: string, topicName: string) => {
    const key = `${subId.toLowerCase()}::${topicName.toLowerCase().trim()}`;
    setTopicMastery((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setStoredTopicMastery(next);
      return next;
    });
  };

  // Inline Study Material Desk state
  const [deskState, setDeskState] = useState<{
    isOpen: boolean;
    subjectId: string;
    subjectName: string;
    topicName: string;
    matchedTopicId?: string;
  } | null>(null);

  // Interactive IBQ Quiz Modal state
  const [activeIbqQuiz, setActiveIbqQuiz] = useState<{
    isOpen: boolean;
    subjectId: string;
    subjectName: string;
    questions: Array<{
      id: string;
      vignette: string;
      imageSrc: string;
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
      imageFinding?: string;
      whatToLookFor?: string;
      rationale?: string;
    }>;
    currentIndex: number;
    selectedAnswers: Record<number, string>;
    isCompleted: boolean;
    score: number;
    showAnnotated: boolean;
  } | null>(null);

  // AI Custom Quiz Modal state (5 Text + 5 Image Qs with 45s timer)
  const [activeCustomQuiz, setActiveCustomQuiz] = useState<{
    isOpen: boolean;
    subjectId: string;
    subjectName: string;
    topicName: string;
    questions: CustomMixedQuestion[];
    currentIndex: number;
    selectedAnswers: Record<number, string>;
    isCompleted: boolean;
    score: number;
    timeLeft: number;
  } | null>(null);

  const [isIbqBankModalOpen, setIsIbqBankModalOpen] = useState(false);

  const configuredExamDate = state.settings?.examDate || FMGE_EXAM_DATE;
  const daysLeft = daysUntilFmge(configuredExamDate);
  const isExamDay = daysLeft === 0;

  // Compute current sprint day index (0 to 19)
  const currentDay = sprint
    ? sprintDayIndex(sprint.startedOn, configuredExamDate)
    : Math.min(19, Math.max(0, 20 - daysLeft));
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  const adaptiveDays = useMemo(
    () => buildAdaptiveSprintDays(attempts, grandTests, sprint?.errorTypes || {}),
    [attempts, grandTests, sprint?.errorTypes]
  );

  const activePlan: SprintDay = adaptiveDays[selectedDay] || adaptiveDays[0];
  const blueprint: DailyStudyBlueprint = useMemo(
    () => getDailyStudyBlueprint(selectedDay),
    [selectedDay]
  );

  // Helper to get friendly subject name
  const getSubjectName = (subId: string) => {
    return FMGE_SUBJECTS.find((s) => s.id === subId)?.name || subId.toUpperCase();
  };

  // Helper to check if a blueprint topic is marked as completed
  const isTopicCompleted = (topic: BlueprintTopic): boolean => {
    const key = `${topic.subjectId}-${topic.id}`;
    const topicState = state.topicsState[key];
    if (topicState && typeof topicState.notesDone === 'boolean') {
      return topicState.notesDone;
    }
    return !!(
      sprint?.completedTasks?.[`topic-${topic.id}`] ||
      sprint?.completedTasks?.[`${selectedDay}-topic-${topic.id}`]
    );
  };

  // Helper for topic revision status
  const getTopicRevisionState = (topic: BlueprintTopic) => {
    const key = `${topic.subjectId}-${topic.id}`;
    const topicState = state.topicsState[key];
    return {
      r1: !!topicState?.r1Done,
      r2: !!topicState?.r2Done,
      r3: !!topicState?.r3Done,
    };
  };

  // Handle toggling topic completion in both topicsState and sprint.completedTasks
  const handleToggleSprintTopic = (topic: BlueprintTopic) => {
    const currentlyDone = isTopicCompleted(topic);
    const nextDone = !currentlyDone;

    if (onToggleTopicState) {
      onToggleTopicState(topic.subjectId, topic.id, 'notesDone');
    }

    if (onUpdateSprint) {
      const updatedTasks = {
        ...(sprint?.completedTasks || {}),
        [`topic-${topic.id}`]: nextDone,
        [`${selectedDay}-topic-${topic.id}`]: nextDone,
      };
      onUpdateSprint({
        startedOn: sprint?.startedOn || localDateKey(),
        dailyHours,
        completedTasks: updatedTasks,
        ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}),
        ...(sprint?.taskQuestionIds ? { taskQuestionIds: sprint.taskQuestionIds } : {}),
      });
    }
  };

  // Handle toggling revision round
  const handleToggleRevisionRound = (
    topic: BlueprintTopic,
    field: 'r1Done' | 'r2Done' | 'r3Done'
  ) => {
    if (onToggleTopicState) {
      onToggleTopicState(topic.subjectId, topic.id, field);
    }
  };

  // Performance metrics & error vault items for a topic
  const getTopicPerformance = (topic: BlueprintTopic) => {
    return calculateTopicPerformanceMetrics(topic.subjectId, topic.id, attempts);
  };

  const getTopicUnreviewedErrorsCount = (topic: BlueprintTopic) => {
    return (state.errorNotebook || []).filter(
      (err) =>
        !err.isReviewed &&
        (err.topicId === topic.id || (err.subjectId === topic.subjectId && err.topic === topic.name))
    ).length;
  };

  // Unreviewed errors for today's subjects
  const unreviewedSubjectErrors = useMemo(() => {
    const subjects = blueprint.subjects;
    return (state.errorNotebook || []).filter(
      (err) => !err.isReviewed && subjects.includes(err.subjectId)
    );
  }, [state.errorNotebook, blueprint.subjects]);

  // Today's attempts & accuracy metrics
  const todayDateKey = localDateKey();
  const todayAttempts = useMemo(() => {
    return (attempts || []).filter((a) => a.timestamp && a.timestamp.startsWith(todayDateKey));
  }, [attempts, todayDateKey]);

  const todayCorrect = todayAttempts.filter((a) => a.isCorrect).length;
  const todayAccuracy =
    todayAttempts.length > 0 ? Math.round((todayCorrect / todayAttempts.length) * 100) : 0;

  // Blueprint topics completion metrics
  const mustStudyCompletedCount = blueprint.mustStudyTopics.filter(isTopicCompleted).length;
  const ifTimeRemainsCompletedCount = blueprint.ifTimeRemainsTopics.filter(isTopicCompleted).length;
  const totalBlueprintTopicsCount = blueprint.mustStudyTopics.length;
  const blueprintCompletionPct =
    totalBlueprintTopicsCount > 0
      ? Math.round((mustStudyCompletedCount / totalBlueprintTopicsCount) * 100)
      : 100;

  // Launchers for Study Desk, IBQ Quiz, and AI Custom Quiz
  const handleOpenStudyDesk = (subjectId: string, topicName?: string, matchedTopicId?: string) => {
    const subName = getSubjectName(subjectId);
    const resolvedTopic = topicName || (activePlan.subjects.includes(subjectId) ? activePlan.title : 'High-Yield Core Review');
    setDeskState({
      isOpen: true,
      subjectId,
      subjectName: subName,
      topicName: resolvedTopic,
      matchedTopicId,
    });
  };

  const handleLaunchIbqQuiz = (subjectId: string, topicName?: string) => {
    const subName = getSubjectName(subjectId);
    const sLower = subjectId.toLowerCase();

    // 1. Check verified IBQ bank
    const verified = VERIFIED_IBQ_BANK.filter(
      (q) => q.subject.toLowerCase() === sLower || q.subject.toLowerCase().includes(sLower)
    );

    // 2. Also check visual concept registry
    const visualAssets = Object.values(VISUAL_CONCEPT_REGISTRY).filter(
      (a) => (a.subjects || []).map(s => s.toLowerCase()).includes(sLower) || a.conceptKey.toLowerCase().startsWith(sLower.slice(0, 4))
    );

    const questions: Array<{
      id: string;
      vignette: string;
      imageSrc: string;
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
      imageFinding?: string;
      whatToLookFor?: string;
      rationale?: string;
    }> = [];

    verified.forEach((q) => {
      const { shuffled, newCorrectId } = shuffleQuestionOptions(q.options, q.correctOptionId);
      questions.push({
        id: q.id,
        vignette: q.vignette,
        imageSrc: q.imageSrc,
        options: shuffled,
        correctOptionId: newCorrectId,
        imageFinding: q.explanation.imageFinding,
        whatToLookFor: (q.explanation.highYieldBuzzwords || []).join(', '),
        rationale: q.explanation.detailedRationale,
      });
    });

    const usedKeys = new Set(verified.map((q) => q.id));
    visualAssets.forEach((asset, idx) => {
      if (questions.length < 8 && !usedKeys.has(asset.conceptKey)) {
        usedKeys.add(asset.conceptKey);
        const stem = getSmartImageStem(asset.imageType);
        const targetText = formatVisualOptionText(asset.visualTarget, asset.conceptKey);
        const dists = getSmartVisualDistractors(asset, subName);

        const { shuffled, newCorrectId } = shuffleQuestionOptions(
          [
            { id: 'A', text: targetText },
            { id: 'B', text: dists[0] },
            { id: 'C', text: dists[1] },
            { id: 'D', text: dists[2] },
          ],
          'A'
        );

        questions.push({
          id: `ibq-asset-${asset.conceptKey}-${idx}`,
          vignette: stem,
          imageSrc: asset.imageUrl,
          options: shuffled,
          correctOptionId: newCorrectId,
          imageFinding: asset.keyVisualFinding,
          whatToLookFor: asset.whatToLookFor,
          rationale: `${asset.keyVisualFinding}. High-yield cue: ${asset.whatToLookFor}`,
        });
      }
    });

    if (questions.length === 0) {
      Object.values(VISUAL_CONCEPT_REGISTRY).slice(0, 6).forEach((asset, idx) => {
        const stem = getSmartImageStem(asset.imageType);
        const targetText = formatVisualOptionText(asset.visualTarget, asset.conceptKey);
        const dists = getSmartVisualDistractors(asset, subName);

        const { shuffled, newCorrectId } = shuffleQuestionOptions(
          [
            { id: 'A', text: targetText },
            { id: 'B', text: dists[0] },
            { id: 'C', text: dists[1] },
            { id: 'D', text: dists[2] },
          ],
          'A'
        );

        questions.push({
          id: `ibq-fallback-${idx}`,
          vignette: stem,
          imageSrc: asset.imageUrl,
          options: shuffled,
          correctOptionId: newCorrectId,
          imageFinding: asset.keyVisualFinding,
          whatToLookFor: asset.whatToLookFor,
          rationale: asset.keyVisualFinding,
        });
      });
    }

    setActiveIbqQuiz({
      isOpen: true,
      subjectId,
      subjectName: subName,
      questions,
      currentIndex: 0,
      selectedAnswers: {},
      isCompleted: false,
      score: 0,
      showAnnotated: false,
    });
  };

  const handleLaunchCustom10Quiz = (subjectId: string, topicName?: string) => {
    const subName = getSubjectName(subjectId);
    const resolvedTopic = topicName || 'High-Yield Core Review';
    const questions = generateMixed10Quiz(subjectId, subName, resolvedTopic);

    setActiveCustomQuiz({
      isOpen: true,
      subjectId,
      subjectName: subName,
      topicName: resolvedTopic,
      questions,
      currentIndex: 0,
      selectedAnswers: {},
      isCompleted: false,
      score: 0,
      timeLeft: 45,
    });
  };

  // 45-Second Pacing Timer countdown
  useEffect(() => {
    if (!activeCustomQuiz || !activeCustomQuiz.isOpen || activeCustomQuiz.isCompleted) return;
    const timer = setInterval(() => {
      setActiveCustomQuiz((prev) => {
        if (!prev || prev.isCompleted) return prev;
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCustomQuiz?.currentIndex, activeCustomQuiz?.isOpen, activeCustomQuiz?.isCompleted]);

  // Tier metrics computation - driven by mustKnowTopics and topicMastery check-offs
  const tierMetrics = useMemo(() => {
    return SPRINT_TIERS.map((tier) => {
      let totalTopics = 0;
      let completedTopics = 0;

      tier.subjectIds.forEach((subId) => {
        const mustKnows = tier.mustKnowTopics[subId] || [];
        totalTopics += mustKnows.length;
        mustKnows.forEach((tName) => {
          const key = `${subId.toLowerCase()}::${tName.toLowerCase().trim()}`;
          if (topicMastery[key]) {
            completedTopics++;
          }
        });
      });

      if (totalTopics === 0) {
        tier.subjectIds.forEach((subId) => {
          const sub = FMGE_SUBJECTS.find((s) => s.id === subId);
          if (!sub) return;
          const subProgress = state.subjectProgress[subId];
          const allTopics = [...sub.topics, ...(subProgress?.customTopics || [])];
          totalTopics += allTopics.length;
          completedTopics += allTopics.filter(
            (t) => state.topicsState[`${subId}-${t.id}`]?.notesDone ?? t.notesDone
          ).length;
        });
      }

      const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      return {
        ...tier,
        totalTopics,
        completedTopics,
        pct,
      };
    });
  }, [topicMastery, state.subjectProgress, state.topicsState]);

  // Overall sprint progress
  const overallSprintPct = Math.round(((20 - Math.min(20, Math.max(0, daysLeft))) / 20) * 100);

  const handleToggleTask = (taskIndex: number) => {
    if (!onUpdateSprint) return;
    const key = `${selectedDay}-${taskIndex}`;
    const updatedTasks = {
      ...(sprint?.completedTasks || {}),
      [key]: !sprint?.completedTasks?.[key],
    };
    onUpdateSprint({
      startedOn: sprint?.startedOn || localDateKey(),
      dailyHours,
      completedTasks: updatedTasks,
      ...(sprint?.errorTypes ? { errorTypes: sprint.errorTypes } : {}),
      ...(sprint?.taskQuestionIds ? { taskQuestionIds: sprint.taskQuestionIds } : {}),
    });
  };

  const tasksForToday = useMemo(() => {
    const questionTarget = activePlan.fullMock
      ? 300
      : selectedDay === 0
      ? 50
      : Math.max(20, Math.round((activePlan.questions * dailyHours) / 6));
    return checklistsForPlan(activePlan, dailyHours, questionTarget);
  }, [activePlan, dailyHours, selectedDay]);

  const activeDayTasksCompletedCount = tasksForToday.filter(
    (_, idx) => !!sprint?.completedTasks?.[`${selectedDay}-${idx}`]
  ).length;

  // 5-Metric Transparent Readiness Summary across all 19 FMGE subjects
  const readinessMetrics = useMemo(() => {
    let totalTopics = 0;
    let reviewedTopics = 0;
    const allTopicsList: { subjectId: string; topicId: string; topicName: string }[] = [];

    FMGE_SUBJECTS.forEach((sub) => {
      const subProg = state.subjectProgress[sub.id];
      const topics = [...sub.topics, ...(subProg?.customTopics || [])];
      topics.forEach((t) => {
        totalTopics += 1;
        const key = `${sub.id}-${t.id}`;
        const isDone = state.topicsState[key]?.notesDone ?? t.notesDone ?? false;
        if (isDone) reviewedTopics += 1;
        allTopicsList.push({ subjectId: sub.id, topicId: t.id, topicName: t.name });
      });
    });

    const totalQuestions = (attempts || []).length;
    const correctCount = (attempts || []).filter((a) => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const unresolvedErrors = (state.errorNotebook || []).filter((e) => !e.isReviewed);

    // Strict demonstrated mastery:
    // Topic is only counted as mastered if:
    // 1. At least 5 attempts in that topic
    // 2. Topic accuracy >= 80%
    // 3. Zero unresolved errors in Error Vault for this topic
    let demonstratedMasteryCount = 0;
    allTopicsList.forEach((t) => {
      const tAttempts = (attempts || []).filter(
        (a) => a.topicId === t.topicId || (a.subjectId === t.subjectId && a.topicName === t.topicName)
      );
      if (tAttempts.length >= 5) {
        const tCorrect = tAttempts.filter((a) => a.isCorrect).length;
        const tAcc = (tCorrect / tAttempts.length) * 100;
        const hasUnresolved = unresolvedErrors.some(
          (e) => e.topicId === t.topicId || (e.subjectId === t.subjectId && e.topic === t.topicName)
        );
        if (tAcc >= 80 && !hasUnresolved) {
          demonstratedMasteryCount += 1;
        }
      }
    });

    return {
      totalTopics,
      reviewedTopics,
      reviewedPct: totalTopics > 0 ? Math.round((reviewedTopics / totalTopics) * 100) : 0,
      totalQuestions,
      accuracy,
      unresolvedErrorsCount: unresolvedErrors.length,
      unresolvedErrors,
      demonstratedMasteryCount,
    };
  }, [state.subjectProgress, state.topicsState, state.errorNotebook, attempts]);

  return (
    <div className="study-module-root study-sprint-premium space-y-5 sm:space-y-7 pb-24 sm:pb-20 lg:pb-16 font-sans text-[#1D1D1F]">
      <StudyModuleHeader
        eyebrow={isExamDay ? `Exam day · ${configuredExamDate}` : '20-day adaptive plan'}
        title={isExamDay ? 'Exam Day' : 'Your 20-Day'}
        accentTitle={isExamDay ? 'Calm. Clear. Ready.' : 'FMGE Sprint'}
        description={isExamDay
          ? 'A calm final protocol for two focused papers. Trust your preparation, keep moving, and answer every question.'
          : 'A focused daily system that combines high-yield revision, active recall, targeted MCQs, and error repair.'}
        icon={Flame}
        accent="#30D158"
        tint="#E8F9EE"
        progress={isExamDay ? 100 : overallSprintPct}
        progressLabel={isExamDay ? 'Exam status' : 'Sprint progress'}
        progressMeta={isExamDay ? 'Ready for 300 questions' : `${daysLeft} days remaining · Day ${selectedDay + 1}`}
        stats={[
          { label: 'Today’s questions', value: String(todayAttempts.length), color: '#007AFF' },
          { label: 'Accuracy', value: `${todayAccuracy}%`, color: '#30D158' },
          { label: 'Open errors', value: String(readinessMetrics.unresolvedErrorsCount), color: '#FF9500' },
        ]}
        primaryAction={{
          label: isExamDay ? 'Start volatile drill' : 'Begin today’s drill',
          onClick: () => onLaunchPracticeMcq(blueprint.subjects[0] || activePlan.subjects[0] || 'obg'),
        }}
        secondaryAction={onOpenDailyPlanner ? { label: 'Open Daily Planner', onClick: onOpenDailyPlanner } : undefined}
      />

      <StudyInsightRail
        title="Exam-weight priorities"
        subtitle="Three layers · 300 marks"
        items={tierMetrics.map((tier, index) => ({
          eyebrow: `Tier ${index + 1}`,
          title: index === 0 ? 'Heavyweights' : index === 1 ? 'High-yield clinical' : 'Pre-clinical & shorts',
          value: `${tier.pct}%`,
          meta: `${tier.completedTopics} of ${tier.totalTopics} topics complete`,
          progress: tier.pct,
          color: index === 0 ? '#30D158' : index === 1 ? '#30B0C7' : '#5856D6',
          icon: index === 0 ? Target : index === 1 ? Activity : Brain,
          description: index === 0
            ? 'The six subjects that carry the largest share of your qualifying score.'
            : index === 1
            ? 'Clinical disciplines with strong marks gained per focused study hour.'
            : 'Compact, pattern-rich subjects suited to rapid recall and visual revision.',
        }))}
      />

      {/* ═══ 2.5 TRANSPARENT READINESS SUMMARY (5 CRITICAL LEARNING METRICS) ═══ */}
      <div className="study-readiness-panel rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#1B1C20] p-4 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#1D1D1F] dark:text-white text-[15px] leading-tight flex items-center gap-2">
                <span>Transparent Exam Readiness Verification</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  Oct 31, 2026 Target
                </span>
              </h2>
              <p className="text-[11px] text-[#8E8E93] dark:text-slate-400">
                Honest progress tracking separating raw syllabus completion from verified MCQ accuracy and Error Vault status.
              </p>
            </div>
          </div>
          {onOpenRevisionMatrix && (
            <button
              type="button"
              onClick={onOpenRevisionMatrix}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>View Revision Matrix</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Material Reviewed */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              Material Reviewed
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {readinessMetrics.reviewedTopics}
              </span>
              <span className="text-xs font-mono text-slate-400">/ {readinessMetrics.totalTopics}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${readinessMetrics.reviewedPct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5 font-mono">
              {readinessMetrics.reviewedPct}% topics reviewed
            </span>
          </div>

          {/* 2. Questions Attempted */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              Questions Solved
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {readinessMetrics.totalQuestions}
              </span>
              <span className="text-xs font-mono text-slate-400">MCQs</span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight pt-1">
              Active volume across verified drills and mocks
            </p>
          </div>

          {/* 3. Overall Accuracy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              Overall Accuracy
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                readinessMetrics.totalQuestions === 0
                  ? 'text-slate-400'
                  : readinessMetrics.accuracy >= 70
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : readinessMetrics.accuracy >= 55
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}>
                {readinessMetrics.totalQuestions > 0 ? `${readinessMetrics.accuracy}%` : '—'}
              </span>
              <span className="text-xs font-mono text-slate-400">target ≥65%</span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight pt-1">
              {readinessMetrics.totalQuestions === 0
                ? 'No MCQs logged yet'
                : readinessMetrics.accuracy >= 70
                ? 'On track for safe 150+ margin'
                : 'Need more active recall retesting'}
            </p>
          </div>

          {/* 4. Unresolved Errors */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              Unresolved Errors
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                readinessMetrics.unresolvedErrorsCount === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {readinessMetrics.unresolvedErrorsCount}
              </span>
              <span className="text-xs font-mono text-slate-400">in Error Vault</span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight pt-1">
              {readinessMetrics.unresolvedErrorsCount === 0
                ? 'Zero pending weak items'
                : 'Prioritized for rapid retest'}
            </p>
          </div>

          {/* 5. Demonstrated Mastery */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 space-y-1 col-span-2 lg:col-span-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-semibold block">
              Demonstrated Mastery
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100 tracking-tight">
                {readinessMetrics.totalQuestions < 10 ? '—' : readinessMetrics.demonstratedMasteryCount}
              </span>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                {readinessMetrics.totalQuestions < 10 ? 'insufficient data' : 'topics verified'}
              </span>
            </div>
            <p className="text-[10px] text-emerald-900 dark:text-emerald-200/80 leading-tight pt-1">
              {readinessMetrics.totalQuestions < 10
                ? 'Solve ≥10 questions to establish performance'
                : 'Strict rule: ≥5 MCQs, ≥80% accuracy, 0 unresolved errors'}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 3. MAIN SPRINT MATRIX (8 COLS) + SIDEBAR (4 COLS) ═══ */}
      <div className="study-sprint-workspace grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 8 Cols */}
        <div className="study-sprint-main lg:col-span-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden space-y-5 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">
                  {isExamDay ? 'NBE FMGE Exam Day Protocol' : 'Daily Study Blueprint · 20-Day Sprint'}
                </h2>
                <p className="text-[11px] text-[#8E8E93] font-mono">
                  {isExamDay
                    ? `${configuredExamDate} · D-Day`
                    : `${sprintDateForIndex(selectedDay, configuredExamDate)} · Day ${selectedDay + 1} of 20 ${
                        selectedDay === currentDay ? '(Today)' : ''
                      }`}
                </p>
              </div>
            </div>

            {/* Hours selector (hidden on exam day) */}
            {!isExamDay && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs">
                <span className="font-semibold text-slate-500 pl-1.5">Study Target:</span>
                {[4, 6, 8, 10].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDailyHours(h)}
                    className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                      dailyHours === h
                        ? 'bg-white text-[#1D1D1F] shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            )}
          </div>

          {isExamDay ? (
            /* Dedicated Exam Day Protocol View */
            <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-5">
              <div className="flex items-center gap-3 border-b border-emerald-200/80 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Official Exam Day Protocol · 300 Questions
                  </h3>
                  <p className="text-xs text-slate-600">
                    Two 150-minute blocks · Passing threshold: 150 / 300 (50%) · Zero negative marking
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-800">
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 1: Never Leave Blanks</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    FMGE has strictly ZERO negative marking. Even on complete guesses, selecting an answer gives you a 25% chance of securing a pass-defining mark.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 2: Pacing Discipline (60s / Q)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    150 questions in 150 minutes per paper. Mark lengthy clinical vignettes for review and keep moving. Finish your first sweep in 120 minutes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 3: Read Lead-In First</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    For lengthy clinical stems, read the last sentence (the actual question) and the 4 options before reading the vignette. This instantly filters what data to spot.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200/80 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Rule 4: Trust First Instinct</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Only change an answer if you find an objective misread in your initial attempt. Overthinking during second-guessing degrades clinical accuracy.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-200/80">
                <span className="text-xs font-semibold text-emerald-900">
                  You are prepared. You only need 150 marks out of 300 to qualify as a doctor in India.
                </span>
                {onOpenRevisionMatrix && (
                  <button
                    type="button"
                    onClick={onOpenRevisionMatrix}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    Quick Matrix Recall
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 20-Day Stepper Horizontal Scroller */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Day Timeline (20 Days to FMGE)
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  {adaptiveDays.map((dayPlan, idx) => {
                    const isToday = idx === currentDay;
                    const isSelected = idx === selectedDay;
                    const dayDateStr = sprintDateForIndex(idx, configuredExamDate);
                    const dayBlueprint = getDailyStudyBlueprint(idx);
                    const mustStudyCount = dayBlueprint.mustStudyTopics.length;
                    const doneCount = dayBlueprint.mustStudyTopics.filter(isTopicCompleted).length;
                    const isDone = mustStudyCount > 0 && doneCount === mustStudyCount;

                    const dayDate = new Date(`${dayDateStr}T12:00:00`);
                    const monthShort = dayDate.toLocaleDateString('en-US', { month: 'short' });
                    const dayNum = dayDate.getDate();

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDay(idx)}
                        className={`shrink-0 flex flex-col items-center justify-center min-w-[74px] py-2 px-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                            : isToday
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-400/40'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">
                          {idx === 19 ? 'Eve' : isToday ? 'Today' : `Day ${idx + 1}`}
                        </span>
                        <span className="text-xs font-black">
                          {monthShort} {dayNum}
                        </span>
                        {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-300 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ 1. TODAY'S MISSION CARD ═══ */}
              <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/80 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        Day {selectedDay + 1} of 20
                      </span>
                      <span className="text-xs text-slate-600 font-mono font-semibold">
                        {sprintDateForIndex(selectedDay, configuredExamDate)}
                      </span>
                      {selectedDay === currentDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          Current Date
                        </span>
                      )}
                      {blueprint.isFullMock && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          300Q Full Mock
                        </span>
                      )}
                      {blueprint.isRestDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Rest & Calibration
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {blueprint.title}
                    </h3>

                    {/* Subject Insignias */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {blueprint.subjects.map((subId) => (
                        <div
                          key={subId}
                          onClick={() => onSelectSubject(subId)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-[11px] font-bold shadow-2xs hover:border-emerald-400 transition-colors cursor-pointer"
                        >
                          <SubjectAppleIcon subjectId={subId} size="sm" />
                          <span>{getSubjectName(subId)}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium pt-1">
                      {blueprint.missionStatement}
                    </p>
                  </div>

                  {/* Right: Mission Progress Gauge */}
                  <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs shrink-0 gap-2">
                    <Gauge pct={blueprintCompletionPct} size={58} sw={5} color="#059669" track="#E2E8F0" />
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-slate-900">
                        {mustStudyCompletedCount} / {totalBlueprintTopicsCount} Done
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Must-Study Core</div>
                    </div>
                  </div>
                </div>

                {/* Workload Targets & Quick Launch */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/70 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Target Time
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {dailyHours} Hours
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      MCQ Goal
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {blueprint.targetQuestions} Questions
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Today Solved
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {todayAttempts.length} MCQs ({todayAccuracy}%)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Errors in Subject
                    </span>
                    <span className="text-sm font-black text-amber-600 font-mono">
                      {unreviewedSubjectErrors.length} Pending
                    </span>
                  </div>
                </div>

                {/* ═══ 1-CLICK VERIFICATION & MATERIAL DESK LAUNCHER ═══ */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        Today's Verification & High-Yield Material Desk
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Read inline cram notes or launch instant test for today's subjects
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenStudyDesk(blueprint.subjects[0] || 'obg', blueprint.mustStudyTopics[0]?.name)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Open Instant High-Yield Notes & Gemini Study Generator"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                      <span>📖 Study Desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchPracticeMcq(
                          blueprint.subjects[0] || 'obg',
                          blueprint.mustStudyTopics[0]?.id,
                          blueprint.mustStudyTopics[0]?.name
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Launch clinical vignette practice test"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>📝 Text MCQ Test</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchIbqQuiz(blueprint.subjects[0] || 'obg', blueprint.mustStudyTopics[0]?.name)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Launch verified visual spotter test"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>🖼️ Image (IBQ) Test</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchCustom10Quiz(blueprint.subjects[0] || 'obg', blueprint.mustStudyTopics[0]?.name)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Launch 10-Question Mixed Text + Image Test with 45s timer"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      <span>AI Custom Quiz (5T+5I)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsIbqBankModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Browse Full 200+ Image Bank"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-500" />
                      <span>All IBQs</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══ 2. MUST-STUDY TOPICS CHECKLIST ═══ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        Must-Study Topics (High-Yield Priority Core)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Prioritized essential concepts required to guarantee passing accuracy
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {mustStudyCompletedCount} / {blueprint.mustStudyTopics.length} Completed
                  </span>
                </div>

                <div className="space-y-3">
                  {blueprint.mustStudyTopics.map((topic) => {
                    const isDone = isTopicCompleted(topic);
                    const perf = getTopicPerformance(topic);
                    const topicErrors = getTopicUnreviewedErrorsCount(topic);
                    const rev = getTopicRevisionState(topic);
                    const visualAsset = topic.visualConceptKey
                      ? VISUAL_CONCEPT_REGISTRY[topic.visualConceptKey]
                      : null;

                    return (
                      <div
                        key={topic.id}
                        className={`rounded-2xl border p-4 transition-all space-y-3.5 ${
                          isDone
                            ? 'bg-emerald-50/40 border-emerald-200/90 text-slate-600'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Topic Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSprintTopic(topic)}
                              className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-emerald-500'
                              }`}
                              title={isDone ? 'Mark as pending' : 'Mark topic as studied'}
                            >
                              {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </button>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <SubjectAppleIcon subjectId={topic.subjectId} size="sm" />
                                  <span>{getSubjectName(topic.subjectId)}</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ~{topic.estimatedMinutes} min
                                </span>

                                {/* Adaptive Performance Badge */}
                                {perf.totalAttempts > 0 ? (
                                  <span
                                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                                      perf.accuracy >= 70
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {perf.accuracy}% Acc ({perf.totalAttempts} Qs)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    Unattempted
                                  </span>
                                )}

                                {topicErrors > 0 && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    <span>{topicErrors} in Error Vault</span>
                                  </span>
                                )}
                              </div>

                              <h5
                                onClick={() => handleOpenStudyDesk(topic.subjectId, topic.name, topic.id)}
                                className={`text-sm sm:text-[15px] font-bold leading-tight cursor-pointer hover:text-emerald-700 transition-colors ${
                                  isDone ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                                title="Click to open inline study notes & Gemini cram desk"
                              >
                                {topic.name}
                              </h5>
                            </div>
                          </div>

                          {/* Quick 1-Click Topic Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenStudyDesk(topic.subjectId, topic.name, topic.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Open inline high-yield notes and visual spotters"
                            >
                              <BookOpen className="h-3 w-3 text-emerald-400" />
                              <span>📖 Study</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onLaunchPracticeMcq(topic.subjectId, topic.id, topic.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Launch 10-MCQ drill for this topic"
                            >
                              <Zap className="h-3 w-3" />
                              <span>10 Qs</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLaunchIbqQuiz(topic.subjectId, topic.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Launch IBQ spotter quiz for this topic"
                            >
                              <Eye className="h-3 w-3 text-indigo-600" />
                              <span>IBQ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenFlashcards(topic.subjectId, topic.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Study flashcards for this topic"
                            >
                              <Layers className="h-3 w-3 text-indigo-600" />
                              <span>Cards</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectSubject(topic.subjectId)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                              title="Open Subject Syllabus"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Core Clinical Concepts */}
                        <div className="space-y-1 pl-8">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Key Clinical High-Yield Concepts:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {topic.coreConcepts.map((concept, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                <span>{concept}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Clinical Traps / Pearls (if any) */}
                        {topic.clinicalTraps && topic.clinicalTraps.length > 0 && (
                          <div className="ml-8 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px]">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span>Clinical Trap & Exam Pearl</span>
                            </div>
                            {topic.clinicalTraps.map((trap, tIdx) => (
                              <p key={tIdx} className="leading-snug">
                                {trap}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Learning Material Tags & Revision Rounds Bar */}
                        <div className="ml-8 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          {/* Learning Material Availability */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Materials:
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Layers className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Flashcards Available</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Zap className="h-2.5 w-2.5 text-emerald-600" />
                              <span>10-MCQ Drill Available</span>
                            </span>
                            {visualAsset ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveVisualAsset(visualAsset);
                                  setShowAnnotatedImage(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                <Eye className="h-2.5 w-2.5 text-indigo-600" />
                                <span>Verified Image Asset Available</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                <HelpCircle className="h-2.5 w-2.5 text-slate-400" />
                                <span>Material unavailable (Visual Asset) · Text guidance provided</span>
                              </span>
                            )}
                          </div>

                          {/* Spaced Revision R1/R2/R3 Matrix Toggles */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Revision:</span>
                            {(['r1Done', 'r2Done', 'r3Done'] as const).map((rKey, idx) => {
                              const isRevDone =
                                rKey === 'r1Done' ? rev.r1 : rKey === 'r2Done' ? rev.r2 : rev.r3;
                              return (
                                <button
                                  key={rKey}
                                  type="button"
                                  onClick={() => handleToggleRevisionRound(topic, rKey)}
                                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                                    isRevDone
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                                  }`}
                                  title={`Toggle Revision Round ${idx + 1}`}
                                >
                                  R{idx + 1}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ 3. ADDITIONAL HIGH-YIELD TOPICS (IF TIME REMAINS) ═══ */}
              {blueprint.ifTimeRemainsTopics.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                        <Bookmark className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          Additional High-Yield Topics (If Time Remains)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Secondary high-frequency topics to consolidate score after finishing the core checklist
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                      {ifTimeRemainsCompletedCount} / {blueprint.ifTimeRemainsTopics.length} Completed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {blueprint.ifTimeRemainsTopics.map((topic) => {
                      const isDone = isTopicCompleted(topic);
                      const perf = getTopicPerformance(topic);
                      const rev = getTopicRevisionState(topic);
                      const visualAsset = topic.visualConceptKey
                        ? VISUAL_CONCEPT_REGISTRY[topic.visualConceptKey]
                        : null;

                      return (
                        <div
                          key={topic.id}
                          className={`rounded-2xl border p-3.5 transition-all space-y-3 ${
                            isDone
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSprintTopic(topic)}
                                className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white hover:border-emerald-500'
                                }`}
                              >
                                {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                              </button>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    <SubjectAppleIcon subjectId={topic.subjectId} size="sm" />
                                    <span>{getSubjectName(topic.subjectId)}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ~{topic.estimatedMinutes} min
                                  </span>
                                  {perf.totalAttempts > 0 && (
                                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {perf.accuracy}% Acc
                                    </span>
                                  )}
                                </div>
                                <h5
                                  className={`text-sm font-bold leading-tight ${
                                    isDone ? 'line-through text-slate-400' : 'text-slate-800'
                                  }`}
                                >
                                  {topic.name}
                                </h5>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => onLaunchPracticeMcq(topic.subjectId, topic.id, topic.name)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <Zap className="h-3 w-3" />
                                <span>10 Qs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenFlashcards(topic.subjectId, topic.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <Layers className="h-3 w-3 text-indigo-600" />
                                <span>Cards</span>
                              </button>
                            </div>
                          </div>

                          {/* Core Concepts */}
                          <div className="space-y-1 pl-7.5">
                            <ul className="space-y-1 text-xs text-slate-600">
                              {topic.coreConcepts.map((concept, cIdx) => (
                                <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                                  <span>{concept}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Material status & R1-R3 */}
                          <div className="pl-7.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {visualAsset ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVisualAsset(visualAsset);
                                    setShowAnnotatedImage(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                                >
                                  <Eye className="h-2.5 w-2.5 text-indigo-600" />
                                  <span>Visual Asset Available</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  Material unavailable (Visual) · Text guidance provided
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {(['r1Done', 'r2Done', 'r3Done'] as const).map((rKey, idx) => {
                                const isRevDone =
                                  rKey === 'r1Done' ? rev.r1 : rKey === 'r2Done' ? rev.r2 : rev.r3;
                                return (
                                  <button
                                    key={rKey}
                                    type="button"
                                    onClick={() => handleToggleRevisionRound(topic, rKey)}
                                    className={`px-1.5 py-0.5 text-[9.5px] font-mono font-bold rounded transition-all cursor-pointer ${
                                      isRevDone
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    R{idx + 1}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ 4. CLINICAL PROTOCOL SECTIONS (RECALL, PRACTICE, ERRORS, REVISION) ═══ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* 5. Active Recall Guidance */}
                <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-indigo-950">
                        Active Recall Protocol
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenFlashcards(blueprint.subjects[0] || 'obg')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Layers className="h-3 w-3" />
                      <span>Launch Cards</span>
                    </button>
                  </div>
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    {blueprint.activeRecallGuidance}
                  </p>
                </div>

                {/* 6. Question Practice Guidance */}
                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <Target className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                        Question Practice ({blueprint.targetQuestions} Target)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchPracticeMcq(
                          blueprint.subjects[0] || 'obg',
                          blueprint.mustStudyTopics[0]?.id,
                          blueprint.mustStudyTopics[0]?.name
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Start Drill</span>
                    </button>
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    {blueprint.questionPracticeGuidance}
                  </p>
                </div>

                {/* 7. Error Remediation & Vault */}
                <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-rose-950">
                        Error Vault Remediation
                      </h4>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('errors')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Open Vault</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-rose-900/80 leading-relaxed">
                    {blueprint.errorRemediationGuidance}
                  </p>
                  <div className="text-[11px] font-bold text-rose-800">
                    {unreviewedSubjectErrors.length > 0
                      ? `${unreviewedSubjectErrors.length} unreviewed mistakes or lucky guesses waiting for review in ${blueprint.subjects.join(', ').toUpperCase()}`
                      : 'Zero pending errors for today\'s subjects. Review your lucky guesses after your practice drill.'}
                  </div>
                </div>

                {/* 8. Spaced Revision Guidance */}
                <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                        <Layers className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-purple-950">
                        Spaced Revision Guidance
                      </h4>
                    </div>
                    {onOpenRevisionMatrix && (
                      <button
                        type="button"
                        onClick={onOpenRevisionMatrix}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Layers className="h-3 w-3" />
                        <span>Matrix</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    {blueprint.revisionGuidance}
                  </p>
                </div>
              </div>

              {/* Collapsible Daily Discipline 4-Phase Checklist */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChecklistTasks(!showChecklistTasks)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 py-1 cursor-pointer hover:text-slate-900"
                >
                  <span className="uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Daily Discipline Protocol Tasks ({activeDayTasksCompletedCount} / {tasksForToday.length})</span>
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[11px] font-bold text-emerald-600">
                      {Math.round((activeDayTasksCompletedCount / tasksForToday.length) * 100)}%
                    </span>
                    {showChecklistTasks ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {showChecklistTasks && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2.5">
                    {tasksForToday.map((taskText, tIdx) => {
                      const isTaskDone = !!sprint?.completedTasks?.[`${selectedDay}-${tIdx}`];
                      return (
                        <div
                          key={tIdx}
                          onClick={() => handleToggleTask(tIdx)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isTaskDone
                              ? 'bg-emerald-50 border-emerald-200 text-slate-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isTaskDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isTaskDone && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <p className={`text-xs leading-relaxed ${isTaskDone ? 'line-through opacity-70' : 'font-medium'}`}>
                            {taskText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ═══ 9. END-OF-DAY PROGRESS & REFLECTION SUMMARY ═══ */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>End-of-Day Completion & Verification</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {mustStudyCompletedCount === blueprint.mustStudyTopics.length && mustStudyCompletedCount > 0
                      ? '✓ Mission Complete'
                      : 'In Progress'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">Topics Completed</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {mustStudyCompletedCount} / {blueprint.mustStudyTopics.length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">MCQs Solved Today</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {todayAttempts.length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">Today Accuracy</div>
                    <div className="text-base font-black text-emerald-600 mt-0.5">
                      {todayAccuracy}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-mono">Unreviewed Errors</div>
                    <div className="text-base font-black text-rose-600 mt-0.5">
                      {unreviewedSubjectErrors.length}
                    </div>
                  </div>
                </div>

                <p className="text-[11.5px] text-slate-600 leading-snug">
                  {mustStudyCompletedCount === blueprint.mustStudyTopics.length && mustStudyCompletedCount > 0
                    ? `Outstanding work! You have cleared all must-study topics for Day ${selectedDay + 1}. Ensure your flashcard review and error queue are cleared before rest.`
                    : `${blueprint.mustStudyTopics.length - mustStudyCompletedCount} must-study topics remaining for today's mission. Check off each topic as you complete recall and practice.`}
                </p>
              </div>
            </>
          )}

          {/* Weightage Tiers Matrix with Subjects */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span>Subject Weightage Tiers</span>
              </span>

              {/* Tier Filter Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                {(['all', 1, 2, 3] as const).map((tierVal) => (
                  <button
                    key={tierVal}
                    type="button"
                    onClick={() => setActiveTier(tierVal)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                      activeTier === tierVal
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tierVal === 'all' ? 'All' : `T${tierVal}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPRINT_TIERS.filter((t) => activeTier === 'all' || t.tier === activeTier).flatMap((tier) =>
                tier.subjectIds.map((subId) => {
                  const subject = FMGE_SUBJECTS.find((s) => s.id === subId);
                  if (!subject) return null;
                  const mustKnow = tier.mustKnowTopics[subId] || [];

                  return (
                    <div
                      key={subId}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3.5 shadow-2xs"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <SubjectAppleIcon subjectId={subId} size="md" />
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                                {subject.name}
                              </h5>
                              <span className="text-[11px] font-bold text-emerald-600">
                                ~{subject.weightage} Marks · Tier {tier.tier}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenStudyDesk(subId)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Open Study Desk with high-yield cram notes and spotters"
                          >
                            <BookOpen className="h-3 w-3 text-emerald-600" />
                            <span>Study Desk</span>
                          </button>
                        </div>

                        {mustKnow.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Must-Know High-Yield Topics:
                            </span>
                            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                              {mustKnow.map((t, idx) => {
                                const key = `${subId.toLowerCase()}::${t.toLowerCase().trim()}`;
                                const isDone = !!topicMastery[key];
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                                      isDone
                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                                        : 'bg-slate-50/80 border-slate-100 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <div
                                      onClick={() => handleOpenStudyDesk(subId, t)}
                                      className="flex items-center gap-2 truncate cursor-pointer flex-1"
                                      title="Click to view notes and study desk"
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isDone ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                                      <span className={`truncate text-[11.5px] ${isDone ? 'line-through text-slate-400' : ''}`}>
                                        {t}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTopicMastery(subId, t);
                                      }}
                                      className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                        isDone
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-300 bg-white hover:border-emerald-500'
                                      }`}
                                      title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                                    >
                                      {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3 Explicit Test Launchers on every Subject Card */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onLaunchPracticeMcq(subId)}
                          className="flex-1 min-w-[75px] py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                          title="Launch clinical vignette text MCQs"
                        >
                          <Zap className="h-3 w-3" />
                          <span>📝 Text</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchIbqQuiz(subId)}
                          className="flex-1 min-w-[75px] py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                          title="Launch image spotters"
                        >
                          <Eye className="h-3 w-3" />
                          <span>🖼️ IBQ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLaunchCustom10Quiz(subId)}
                          className="flex-1 min-w-[75px] py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                          title="Launch 10Q AI Mixed Test with 45s timer"
                        >
                          <Brain className="h-3 w-3" />
                          <span>AI Quiz</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSubject(subId)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                          title="View Subject Syllabus"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4 Cols (Sidebar with Quick Actions & Stats) */}
        <div className="study-sprint-sidebar lg:col-span-4 space-y-4">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-tight">Sprint Actions</h3>
                <p className="text-[11px] text-[#8E8E93]">High-impact shortcuts</p>
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              {[
                {
                  label: "Start Today's 10-MCQ Blitz",
                  sub: `Day ${selectedDay + 1}: ${blueprint.title}`,
                  icon: Play,
                  iconBg: '#10B981',
                  onClick: () => onLaunchPracticeMcq(blueprint.subjects[0] || 'obg'),
                },
                {
                  label: 'Tier 1 Heavyweights Blitz',
                  sub: 'Medicine, Surgery, OBG, PSM (165M)',
                  icon: Award,
                  iconBg: '#0891B2',
                  onClick: () => onLaunchPracticeMcq('medicine'),
                },
                {
                  label: 'Study High-Yield Flashcards',
                  sub: 'Rapid buzzwords & diagnostic traps',
                  icon: Layers,
                  iconBg: '#6366F1',
                  onClick: () => onOpenFlashcards(blueprint.subjects[0] || 'obg'),
                },
                {
                  label: 'Review Grand Tests',
                  sub: 'Full-length 300Q benchmarks',
                  icon: ShieldCheck,
                  iconBg: '#F59E0B',
                  onClick: () => onSelectSubject('medicine'),
                },
              ].map(({ label, sub, icon: Icon, iconBg, onClick }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={onClick}
                  className="w-full p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-200 flex items-center gap-3 text-left cursor-pointer transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-105"
                    style={{ background: iconBg, boxShadow: `0 2px 8px ${iconBg}40` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] text-[#1D1D1F] group-hover:text-emerald-600 transition-colors leading-tight">
                      {label}
                    </div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5 truncate">{sub}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#C7C7CC] group-hover:text-emerald-600 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Compact Revision & Error Queue */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-tight">Revision & Error Queue</h3>
                  <p className="text-[11px] text-[#8E8E93]">Urgent items for remediation</p>
                </div>
              </div>
              {readinessMetrics.unresolvedErrorsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  {readinessMetrics.unresolvedErrorsCount} Due
                </span>
              )}
            </div>

            <div className="p-3.5 space-y-2">
              {readinessMetrics.unresolvedErrors.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center space-y-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-emerald-950">Clean Slate</p>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    All logged mistakes and lucky guesses have been resolved.
                  </p>
                </div>
              ) : (
                <>
                  {readinessMetrics.unresolvedErrors.slice(0, 3).map((err) => (
                    <div
                      key={err.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-500 truncate">
                          {err.subjectId.toUpperCase()} · {err.topic || 'General'}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          {err.title || 'Concept Gap'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-snug">
                        {err.questionGist || err.myMistake || 'Mistake logged in question practice.'}
                      </p>
                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onLaunchPracticeMcq(err.subjectId, err.topicId, err.topic)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Play className="h-2.5 w-2.5" /> Retest
                        </button>
                      </div>
                    </div>
                  ))}

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('errors')}
                      className="w-full py-2 rounded-xl text-center text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Open Error Vault ({readinessMetrics.unresolvedErrorsCount} total mistakes) →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Tile */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-bold text-[#1D1D1F] text-[14px]">Sprint Benchmarks</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Days Left', value: daysLeft, icon: Clock, color: '#10B981' },
                { label: 'Topics Done', value: `${mustStudyCompletedCount}/${totalBlueprintTopicsCount}`, icon: CheckCircle2, color: '#0891B2' },
                { label: 'Core Target', value: '165M', icon: Award, color: '#F59E0B' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color }} />
                  <div className="font-black text-[16px] text-[#1D1D1F] leading-none tracking-tight">{value}</div>
                  <div className="text-[10px] text-[#8E8E93] font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Motivational Maxim Banner */}
            <div
              className="relative overflow-hidden rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              <Flame className="h-4 w-4 text-emerald-600 mb-2" />
              <p className="text-[11.5px] font-medium text-emerald-900 leading-snug italic">
                "When you are 20 days away from FMGE, active MCQ volume and spaced testing trump passive reading every time."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ VERIFIED DIAGNOSTIC VISUAL ASSET PREVIEW MODAL ═══ */}
      <AnimatePresence>
        {activeVisualAsset && (
          <div className="study-suite-modal-backdrop fixed inset-0 z-[9100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      Verified Clinical Visual Finding
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {activeVisualAsset.conceptKey}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVisualAsset(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Visual Target & Key Finding */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Diagnostic Finding:
                  </span>
                  <div className="font-bold text-sm text-indigo-950">
                    {activeVisualAsset.keyVisualFinding}
                  </div>
                  <div className="text-xs text-indigo-800">
                    Target: {activeVisualAsset.visualTarget} · {activeVisualAsset.imageType}
                  </div>
                </div>

                {/* Clean vs Annotated Toggle */}
                <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setShowAnnotatedImage(false)}
                    className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      !showAnnotatedImage
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Clean (Exam Mode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnnotatedImage(true)}
                    className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      showAnnotatedImage
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Annotated (Review Mode)
                  </button>
                </div>

                {/* Image Display */}
                <div className="relative rounded-2xl bg-slate-900 flex items-center justify-center p-4 min-h-[220px] overflow-hidden">
                  <img
                    src={
                      showAnnotatedImage
                        ? activeVisualAsset.annotatedImageUrl
                        : activeVisualAsset.cleanImageUrl
                    }
                    alt={activeVisualAsset.keyVisualFinding}
                    className="max-h-[260px] w-auto object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback text if the file is an SVG placeholder
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* What to look for */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    What to Look For:
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {activeVisualAsset.whatToLookFor}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVisualAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                {activeVisualAsset.subjects[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      const sub = activeVisualAsset.subjects[0];
                      setActiveVisualAsset(null);
                      onLaunchPracticeMcq(sub);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Practice MCQs</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SPRINT STUDY & MATERIAL DESK MODAL ═══ */}
      <AnimatePresence>
        {deskState?.isOpen && (
          <SprintStudyDeskModal
            deskState={deskState}
            onClose={() => setDeskState(null)}
            onLaunchPracticeMcq={(sId, tId, tName) => {
              setDeskState(null);
              onLaunchPracticeMcq(sId, tId, tName);
            }}
            onLaunchIbq={(sId, tName) => {
              setDeskState(null);
              handleLaunchIbqQuiz(sId, tName);
            }}
            onLaunchAiQuiz={(sId, tName) => {
              setDeskState(null);
              handleLaunchCustom10Quiz(sId, tName);
            }}
            topicMastery={topicMastery}
            toggleTopicMastery={toggleTopicMastery}
            customPearls={state.customPearls}
          />
        )}
      </AnimatePresence>

      {/* ═══ INTERACTIVE IBQ SPOTTER QUIZ MODAL ═══ */}
      <AnimatePresence>
        {activeIbqQuiz?.isOpen && (
          <InteractiveIbqQuizModal
            quiz={activeIbqQuiz}
            onClose={() => setActiveIbqQuiz(null)}
            onSelectOption={(optionId) => {
              setActiveIbqQuiz((prev) => {
                if (!prev) return null;
                const curQ = prev.questions[prev.currentIndex];
                const isCorrect = optionId === curQ?.correctOptionId;
                return {
                  ...prev,
                  selectedAnswers: { ...prev.selectedAnswers, [prev.currentIndex]: optionId },
                  score: isCorrect ? prev.score + 1 : prev.score,
                };
              });
            }}
            onNextQuestion={() => {
              setActiveIbqQuiz((prev) => {
                if (!prev) return null;
                if (prev.currentIndex >= prev.questions.length - 1) {
                  return { ...prev, isCompleted: true };
                }
                return { ...prev, currentIndex: prev.currentIndex + 1 };
              });
            }}
            onPrevQuestion={() => {
              setActiveIbqQuiz((prev) => {
                if (!prev || prev.currentIndex <= 0) return prev;
                return { ...prev, currentIndex: prev.currentIndex - 1 };
              });
            }}
            onRetest={() => {
              setActiveIbqQuiz((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  currentIndex: 0,
                  selectedAnswers: {},
                  isCompleted: false,
                  score: 0,
                };
              });
            }}
            onOpenStudyDesk={(sId) => {
              setActiveIbqQuiz(null);
              handleOpenStudyDesk(sId);
            }}
          />
        )}
      </AnimatePresence>

      {/* ═══ INTERACTIVE AI CUSTOM QUIZ MODAL (5T + 5I WITH 45S TIMER) ═══ */}
      <AnimatePresence>
        {activeCustomQuiz?.isOpen && (
          <InteractiveAiCustomQuizModal
            quiz={activeCustomQuiz}
            onClose={() => setActiveCustomQuiz(null)}
            onSelectOption={(optionId) => {
              setActiveCustomQuiz((prev) => {
                if (!prev) return null;
                const curQ = prev.questions[prev.currentIndex];
                const isCorrect = optionId === curQ?.correctOptionId;
                return {
                  ...prev,
                  selectedAnswers: { ...prev.selectedAnswers, [prev.currentIndex]: optionId },
                  score: isCorrect ? prev.score + 1 : prev.score,
                };
              });
            }}
            onNextQuestion={() => {
              setActiveCustomQuiz((prev) => {
                if (!prev) return null;
                if (prev.currentIndex >= prev.questions.length - 1) {
                  return { ...prev, isCompleted: true };
                }
                return { ...prev, currentIndex: prev.currentIndex + 1, timeLeft: 45 };
              });
            }}
            onRetest={() => {
              setActiveCustomQuiz((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  currentIndex: 0,
                  selectedAnswers: {},
                  isCompleted: false,
                  score: 0,
                  timeLeft: 45,
                };
              });
            }}
            onOpenStudyDesk={(sId, tName) => {
              setActiveCustomQuiz(null);
              handleOpenStudyDesk(sId, tName);
            }}
          />
        )}
      </AnimatePresence>

      {/* ═══ ALL-SUBJECT VERIFIED IBQ BANK MODAL ═══ */}
      {isIbqBankModalOpen && (
        <IbqRapidRecallModal
          isOpen={isIbqBankModalOpen}
          onClose={() => setIsIbqBankModalOpen(false)}
        />
      )}
    </div>
  );
};
