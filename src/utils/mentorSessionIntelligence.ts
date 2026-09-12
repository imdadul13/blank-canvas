import type { CoachSession } from '../components/AiCoachView';

export type SessionIntentType =
  | 'all'
  | 'starred'
  | 'mcq'
  | 'differential'
  | 'pharmacology'
  | 'investigation'
  | 'revision'
  | 'concept';

export interface SessionIntelligence {
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  intentType: SessionIntentType;
  intentLabel: string;
  hasQuiz: boolean;
  totalMcqs: number;
  mcqsAnswered: number;
  mcqScore?: {
    correct: number;
    total: number;
    percentage: number;
  };
  hasImage: boolean;
  keyExcerpt: string;
  isPinned: boolean;
  messageCount: number;
}

const SUBJECT_KEYWORDS: Array<{
  name: string;
  code: string;
  color: string;
  patterns: RegExp[];
}> = [
  {
    name: 'Pharmacology',
    code: 'PHARM',
    color: '#0D9488',
    patterns: [
      /\b(drug|doc|pharmacology|pharm|mechanism of action|toxicity|adverse effect|side effect|contraindicated|beta blocker|antibiotic|pritchard|adenosine|amiodarone|steroid|aspirin)\b/i,
    ],
  },
  {
    name: 'Obstetrics & Gyn',
    code: 'OBG',
    color: '#DB2777',
    patterns: [
      /\b(obg|obstetric|gynecology|pregnancy|preeclampsia|eclampsia|labor|pph|cervical|amenorrhea|ovarian|placenta|uterine)\b/i,
    ],
  },
  {
    name: 'General Surgery',
    code: 'SURG',
    color: '#E11D48',
    patterns: [
      /\b(surgery|surgical|burns|parkland|appendicitis|cholecystitis|hernia|trauma|laparotomy|anastomosis|fistula|hemoperitoneum)\b/i,
    ],
  },
  {
    name: 'Pathology',
    code: 'PATH',
    color: '#7C3AED',
    patterns: [
      /\b(pathology|biopsy|histology|granuloma|neoplasia|oncogene|carcinoma|stain|amyloid|necrosis|infarction|reed-sternberg)\b/i,
    ],
  },
  {
    name: 'Microbiology',
    code: 'MICRO',
    color: '#059669',
    patterns: [
      /\b(microbiology|bacteria|virus|fungal|parasite|culture|gram-positive|gram-negative|tuberculosis|bacillus|staph|strep|malaria)\b/i,
    ],
  },
  {
    name: 'PSM / Community Med',
    code: 'PSM',
    color: '#2563EB',
    patterns: [
      /\b(psm|community medicine|epidemiology|vaccine|cold chain|vvm|sensitivity|specificity|ppv|npv|incidence|prevalence)\b/i,
    ],
  },
  {
    name: 'Pediatrics',
    code: 'PEDI',
    color: '#EA580C',
    patterns: [
      /\b(pediatric|pediatrics|infant|child|neonate|milestones|tetralogy|kawasaki|ricketts|measles|apgar)\b/i,
    ],
  },
  {
    name: 'Radiology',
    code: 'RADIO',
    color: '#4F46E5',
    patterns: [
      /\b(radiology|x-ray|chest x-ray|ct scan|mri|ultrasound|fast exam|contrast|sign|opacity|consolidation)\b/i,
    ],
  },
  {
    name: 'Dermatology',
    code: 'DERM',
    color: '#D97706',
    patterns: [
      /\b(dermatology|skin|rash|pemphigus|psoriasis|nikolsky|melanoma|bullous|eczema|lichen planus)\b/i,
    ],
  },
  {
    name: 'Orthopedics',
    code: 'ORTHO',
    color: '#9333EA',
    patterns: [
      /\b(orthopedic|orthopedics|fracture|dislocation|bone|compartment syndrome|plaster|nerve injury|scaphoid|colles)\b/i,
    ],
  },
  {
    name: 'Ophthalmology',
    code: 'OPHTH',
    color: '#0284C7',
    patterns: [
      /\b(ophthalmology|eye|cornea|retina|glaucoma|cataract|papilledema|uveitis|fundoscopy|strabismus)\b/i,
    ],
  },
  {
    name: 'ENT',
    code: 'ENT',
    color: '#C026D3',
    patterns: [
      /\b(ent|ear|tympanic|tonsil|larynx|stridor|epistaxis|meniere|rhinitis|sinusitis)\b/i,
    ],
  },
  {
    name: 'Anatomy',
    code: 'ANAT',
    color: '#F97316',
    patterns: [
      /\b(anatomy|brachial plexus|nerve|artery|vein|triangle|foramen|perineal|canal|embryology|snuffbox)\b/i,
    ],
  },
  {
    name: 'Physiology',
    code: 'PHYS',
    color: '#EAB308',
    patterns: [
      /\b(physiology|cardiac cycle|action potential|gfr|nephron|countercurrent|surfactant|respiratory mechanics)\b/i,
    ],
  },
  {
    name: 'Biochemistry',
    code: 'BIOCH',
    color: '#10B981',
    patterns: [
      /\b(biochemistry|enzyme|vitamin|glycolysis|krebs|metabolism|inborn errors|porphyria|lipoprotein)\b/i,
    ],
  },
  {
    name: 'Psychiatry',
    code: 'PSYCH',
    color: '#6366F1',
    patterns: [
      /\b(psychiatry|schizophrenia|bipolar|depression|delusion|hallucination|dementia|antipsychotic|lithium)\b/i,
    ],
  },
  {
    name: 'General Medicine',
    code: 'MED',
    color: '#006B63',
    patterns: [
      /\b(medicine|cardio|ecg|heart block|stemi|nstemi|myocardial|diabetes|hypertension|nephrotic|nephritic|crohn|colitis|sle|sjögren|sjogren|stroke|status epilepticus)\b/i,
    ],
  },
];

export function extractSessionIntelligence(session: CoachSession): SessionIntelligence {
  const messages = session.messages || [];
  const messageCount = messages.length;
  const isPinned = Boolean(session.isPinned);

  // 1. Check for Quiz / MCQ presence
  let hasQuiz = Boolean(session.quizSession && session.quizSession.questions?.length > 0);
  let totalMcqs = session.quizSession?.questions?.length || 0;
  let mcqsAnswered = session.quizSession?.userAnswers
    ? Object.keys(session.quizSession.userAnswers).length
    : 0;
  let scoreNum = session.quizSession?.score || 0;

  // Also inspect single message quizzes
  if (!hasQuiz) {
    let singleQuizCount = 0;
    let singleQuizAnswered = 0;
    let singleQuizScore = 0;

    for (const m of messages) {
      if (m.singleQuiz) {
        singleQuizCount++;
        if (m.singleQuiz.userAnswer) {
          singleQuizAnswered++;
          if (m.singleQuiz.userAnswer === m.singleQuiz.correctKey) {
            singleQuizScore++;
          }
        }
      } else if (m.content && (m.content.includes('[QUIZ_JSON]') || /Question\s+\d+\s+of\s+\d+/i.test(m.content))) {
        singleQuizCount++;
      }
    }

    if (singleQuizCount > 0) {
      hasQuiz = true;
      totalMcqs = singleQuizCount;
      mcqsAnswered = singleQuizAnswered;
      scoreNum = singleQuizScore;
    }
  }

  const mcqScore =
    hasQuiz && mcqsAnswered > 0
      ? {
          correct: scoreNum,
          total: totalMcqs || mcqsAnswered,
          percentage: Math.round((scoreNum / (totalMcqs || mcqsAnswered)) * 100),
        }
      : undefined;

  // 2. Check for image attachment
  const hasImage = messages.some(
    (m) =>
      Boolean(m.userAttachedImage?.url) ||
      /\b(ecg tracing|chest x-ray|ct scan|mri image|histopathology slide)\b/i.test(m.content)
  );

  // 3. Extract text content for classification
  const firstUserMsg = messages.find((m) => m.role === 'user')?.content || '';
  const combinedText = `${session.title} ${firstUserMsg} ${session.quizSession?.topic || ''} ${session.quizSession?.subject || ''}`;

  // 4. Detect Subject
  let subjectName = session.quizSession?.subject || session.subject || '';
  let subjectCode = 'FMGE';
  let subjectColor = '#006B63';

  if (!subjectName) {
    for (const sub of SUBJECT_KEYWORDS) {
      if (sub.patterns.some((p) => p.test(combinedText))) {
        subjectName = sub.name;
        subjectCode = sub.code;
        subjectColor = sub.color;
        break;
      }
    }
  } else {
    const match = SUBJECT_KEYWORDS.find((s) => s.name.toLowerCase() === subjectName.toLowerCase());
    if (match) {
      subjectCode = match.code;
      subjectColor = match.color;
    }
  }

  if (!subjectName) {
    subjectName = 'Clinical Medicine';
    subjectCode = 'MED';
    subjectColor = '#006B63';
  }

  // 5. Detect Intent
  let intentType: SessionIntentType = 'concept';
  let intentLabel = 'Clinical Concept';

  if (hasQuiz) {
    intentType = 'mcq';
    intentLabel = totalMcqs > 1 ? `MCQ Drill · ${totalMcqs}Qs` : 'Clinical Challenge';
  } else if (/\b(vs|versus|difference|compare|discriminat|differenti)\b/i.test(combinedText)) {
    intentType = 'differential';
    intentLabel = 'Differential Diagnosis';
  } else if (/\b(drug|doc|drug of choice|dosage|pharmacology|regimen)\b/i.test(combinedText)) {
    intentType = 'pharmacology';
    intentLabel = 'Pharma & DOC';
  } else if (hasImage || /\b(ecg|x-ray|ct|mri|ultrasound|biopsy|slide)\b/i.test(combinedText)) {
    intentType = 'investigation';
    intentLabel = 'Investigation Review';
  } else if (/\b(rapid|revision|pearl|summary|high-yield|recall)\b/i.test(combinedText)) {
    intentType = 'revision';
    intentLabel = 'High-Yield Revision';
  }

  // 6. Clean Excerpt
  let keyExcerpt = firstUserMsg.trim();
  if (!keyExcerpt && messages.length > 0) {
    keyExcerpt = messages[0].content.trim();
  }
  // Strip Markdown
  keyExcerpt = keyExcerpt
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[QUIZ_JSON\][\s\S]*?\[\/QUIZ_JSON\]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (keyExcerpt.length > 100) {
    keyExcerpt = keyExcerpt.substring(0, 97) + '...';
  }

  return {
    subjectName,
    subjectCode,
    subjectColor,
    intentType,
    intentLabel,
    hasQuiz,
    totalMcqs,
    mcqsAnswered,
    mcqScore,
    hasImage,
    keyExcerpt: keyExcerpt || 'Clinical consultation with Faculty Mentor',
    isPinned,
    messageCount,
  };
}

export interface DateGroupedSessions {
  label: string;
  sessions: CoachSession[];
}

export function groupSessionsByDate(sessions: CoachSession[]): DateGroupedSessions[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfThisWeek = startOfToday - 6 * 86400000;

  const today: CoachSession[] = [];
  const yesterday: CoachSession[] = [];
  const thisWeek: CoachSession[] = [];
  const earlier: CoachSession[] = [];

  for (const s of sessions) {
    const timestamp = new Date(s.updatedAt || s.createdAt).getTime();
    if (isNaN(timestamp)) {
      earlier.push(s);
    } else if (timestamp >= startOfToday) {
      today.push(s);
    } else if (timestamp >= startOfYesterday) {
      yesterday.push(s);
    } else if (timestamp >= startOfThisWeek) {
      thisWeek.push(s);
    } else {
      earlier.push(s);
    }
  }

  const groups: DateGroupedSessions[] = [];
  if (today.length > 0) groups.push({ label: 'Today', sessions: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', sessions: yesterday });
  if (thisWeek.length > 0) groups.push({ label: 'Previous 7 Days', sessions: thisWeek });
  if (earlier.length > 0) groups.push({ label: 'Earlier Consultations', sessions: earlier });

  return groups;
}

export function filterSessions(
  sessions: CoachSession[],
  searchQuery: string,
  filterType: SessionIntentType = 'all'
): CoachSession[] {
  let result = sessions;

  // Filter by Intent / Starred
  if (filterType !== 'all') {
    if (filterType === 'starred') {
      result = result.filter((s) => s.isPinned);
    } else {
      result = result.filter((s) => {
        const intel = extractSessionIntelligence(s);
        return intel.intentType === filterType;
      });
    }
  }

  // Filter by Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((s) => {
      const intel = extractSessionIntelligence(s);
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchSubject = intel.subjectName.toLowerCase().includes(q) || intel.subjectCode.toLowerCase().includes(q);
      const matchIntent = intel.intentLabel.toLowerCase().includes(q);
      const matchMessages = (s.messages || []).some((m) => m.content.toLowerCase().includes(q));
      return matchTitle || matchSubject || matchIntent || matchMessages;
    });
  }

  // Pinned sessions always sort to the top, then newest by date
  return [...result].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
    const timeB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
    return timeB - timeA;
  });
}
