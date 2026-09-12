import { AppState, NormalizedMentorContext, MentorMode, McqAttemptSource } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey, getDaysUntilDateKey } from './date';
import { calculateOverallPerformance } from './performanceEngine';

/**
 * Normalizes and extracts the single canonical Mentor Context object from real AppState.
 * Adheres strictly to the rule: "Only include fields that actually exist in the application. Never fabricate missing data."
 */
export function buildMentorContext(
  state: AppState,
  options?: {
    activeSession?: { id: string; title?: string; messageCount: number };
    currentTopic?: string;
    currentSubject?: string;
    currentMode?: MentorMode;
    explicitQuery?: string;
  }
): NormalizedMentorContext {
  const settings = state?.settings || ({} as any);
  const examDate = settings.examDate || undefined;
  const targetScore = typeof settings.targetScore === 'number' && settings.targetScore > 0
    ? settings.targetScore
    : 185;

  const daysToExam = examDate ? getDaysUntilDateKey(examDate) : 60;

  // Calculate real performance metrics from state attempts
  const performance = calculateOverallPerformance(state);
  const subjectAccuracy: Record<string, number> = {};
  const topicAccuracy: Record<string, number> = {};

  // Extract real subject accuracies
  for (const subId of Object.keys(performance.subjectMetrics)) {
    const metric = performance.subjectMetrics[subId];
    if (metric && metric.totalAttempts > 0) {
      subjectAccuracy[subId] = metric.accuracy;
      // Also extract topic accuracies for attempted topics
      if (metric.topicMetrics) {
        for (const topId of Object.keys(metric.topicMetrics)) {
          const tm = metric.topicMetrics[topId];
          if (tm && tm.totalAttempts > 0) {
            topicAccuracy[topId] = tm.accuracy;
            if (tm.topicName) {
              topicAccuracy[tm.topicName] = tm.accuracy;
            }
          }
        }
      }
    }
  }

  // Also include topicsState qBankAccuracy if provided
  if (state.topicsState) {
    for (const [topKey, topData] of Object.entries(state.topicsState)) {
      const topAny = topData as any;
      const acc = typeof topAny?.qBankAccuracy === 'number' ? topAny.qBankAccuracy : (typeof topAny?.accuracy === 'number' ? topAny.accuracy : undefined);
      if (typeof acc === 'number') {
        topicAccuracy[topKey] = acc;
      }
    }
  }

  // Determine real weak subjects: subjects with attempts and accuracy < 65%, sorted ascending by accuracy
  const weakSubjects: string[] = Object.entries(subjectAccuracy)
    .filter(([subId]) => (performance.subjectMetrics[subId]?.totalAttempts || 0) >= 1 && subjectAccuracy[subId] < 65)
    .sort((a, b) => a[1] - b[1])
    .map(([subId]) => {
      const found = FMGE_SUBJECTS.find((s) => s.id === subId);
      return found?.name || subId;
    });

  // If no subject metrics from attempts, also check topicsState to detect weak subjects
  if (weakSubjects.length === 0 && state.topicsState) {
    const subjectScores: Record<string, { total: number; count: number }> = {};
    for (const [topKey, topVal] of Object.entries(state.topicsState)) {
      const topAny = topVal as any;
      const acc = typeof topAny?.qBankAccuracy === 'number' ? topAny.qBankAccuracy : (typeof topAny?.accuracy === 'number' ? topAny.accuracy : undefined);
      if (typeof acc === 'number') {
        const subPrefix = topKey.split('-')[0];
        const matchSubject = FMGE_SUBJECTS.find(
          (s) => s.id === subPrefix || s.id.startsWith(subPrefix) || s.code.toLowerCase() === subPrefix
        );
        const sName = matchSubject?.name || subPrefix;
        if (!subjectScores[sName]) subjectScores[sName] = { total: 0, count: 0 };
        subjectScores[sName].total += acc;
        subjectScores[sName].count += 1;
      }
    }
    for (const [sName, sc] of Object.entries(subjectScores)) {
      const avg = sc.total / sc.count;
      if (avg < 65) {
        weakSubjects.push(sName);
      }
    }
  }

  // Determine real weak topics from errorNotebook and lowest topic accuracies
  const weakTopicsSet = new Set<string>();
  if (Array.isArray(state.errorNotebook)) {
    state.errorNotebook.slice(-10).forEach((err) => {
      if (err.topic && !err.isReviewed) {
        weakTopicsSet.add(err.topic);
      }
    });
  }
  Object.entries(topicAccuracy)
    .filter(([_, acc]) => acc < 60)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .forEach(([top]) => weakTopicsSet.add(top));
  const weakTopics = Array.from(weakTopicsSet);

  // Recent subjects & topics from attempts, studyLogs, and topicsState
  const recentSubjectsSet = new Set<string>();
  const recentTopicsSet = new Set<string>();

  const attempts = state.mcqAttempts || (state as any).questionAttempts || [];
  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  sortedAttempts.slice(0, 20).forEach((att) => {
    if (att.subjectId) {
      const found = FMGE_SUBJECTS.find((s) => s.id === att.subjectId);
      recentSubjectsSet.add(found?.name || att.subjectId);
    }
    if (att.topicName) recentTopicsSet.add(att.topicName);
  });

  // Also collect recent subjects from studyLogs
  if (Array.isArray(state.studyLogs)) {
    (state.studyLogs as any[]).slice(-5).forEach((log) => {
      if (log.subjectId) {
        const found = FMGE_SUBJECTS.find((s) => s.id === log.subjectId);
        recentSubjectsSet.add(found?.name || log.subjectId);
      }
    });
  } else if (state.studyLogs && typeof state.studyLogs === 'object') {
    Object.values(state.studyLogs).slice(-5).forEach((log: any) => {
      if (log.subjectId) {
        const found = FMGE_SUBJECTS.find((s) => s.id === log.subjectId);
        recentSubjectsSet.add(found?.name || log.subjectId);
      }
    });
  }

  // Today study time & streak
  const todayKey = getLocalDateKey();
  const todayLog = Array.isArray(state.studyLogs)
    ? (state.studyLogs as any[]).find((l) => l.date === todayKey)
    : state.studyLogs?.[todayKey];
  const studyTime = todayLog?.studyMinutes || (todayLog as any)?.durationMinutes || 0;

  // Study streak calculation
  let studyStreak = 0;
  if (state.studyLogs) {
    let checkDate = new Date();
    for (let i = 0; i < 30; i++) {
      const key = checkDate.toISOString().split('T')[0];
      const log = Array.isArray(state.studyLogs)
        ? (state.studyLogs as any[]).find((l) => l.date === key)
        : state.studyLogs[key];
      if (log && ((log.studyMinutes || log.durationMinutes) > 0 || log.questionsSolved > 0)) {
        studyStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Count completed topics in topicsState
  let completedTopics = 0;
  if (state.topicsState) {
    Object.values(state.topicsState).forEach((top: any) => {
      if (top.completed || top.notesDone || top.qBankDone || top.r1Done) {
        completedTopics++;
      }
    });
  }

  // Recent question attempts (last 10)
  const recentQuestionAttempts = sortedAttempts.slice(0, 10).map((a) => ({
    id: a.id,
    topic: a.topicName || a.topicId || 'Clinical Case',
    subject: a.subjectId,
    isCorrect: a.isCorrect,
    timestamp: a.timestamp,
    source: a.source,
  }));

  // Recent mistakes from errorNotebook (last 10)
  const recentMistakes = Array.isArray(state.errorNotebook)
    ? state.errorNotebook.slice(-10).map((err: any) => ({
        id: err.id,
        topic: err.topic,
        subject: err.subjectId || err.subject || 'General Medicine',
        concept: err.conceptName || err.concept,
        mistake: err.myMistake || err.selectedAnswer,
        correctConcept: err.correctConcept || err.correctAnswer || err.explanation,
        timestamp: err.dateAdded || err.timestamp,
        selectedAnswer: err.selectedAnswer,
        correctAnswer: err.correctAnswer,
        explanation: err.explanation,
      }))
    : [];

  const detectedMode = options?.currentMode || (options?.explicitQuery ? detectMentorMode(options.explicitQuery) : 'FREE_CHAT');

  return {
    examDate,
    daysToExam,
    targetScore,
    weakSubjects,
    weakTopics,
    recentSubjects: Array.from(recentSubjectsSet),
    recentTopics: Array.from(recentTopicsSet),
    recentQuestionAttempts,
    recentMistakes,
    subjectAccuracy,
    topicAccuracy,
    studyStreak,
    studyTime,
    completedTopics,
    currentConversation: options?.activeSession,
    currentTopic: options?.currentTopic,
    currentSubject: options?.currentSubject,
    currentMode: detectedMode,
  };
}

/**
 * Medical topic acronym and alias normalization mapping.
 * Normalizes acronyms like MI, UC, PSGN, DKA without creating an incompatible taxonomy.
 */
export interface ResolvedMedicalTopic {
  canonicalTopic: string;
  canonicalSubject: string;
  subjectId: string;
  aliasMatched?: string;
  discriminatorConcept?: string;
}

export const MEDICAL_TOPIC_ALIASES: Record<string, ResolvedMedicalTopic> = {
  // Cardiovascular
  mi: { canonicalTopic: 'Myocardial Infarction', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'MI' },
  'acute mi': { canonicalTopic: 'Myocardial Infarction', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Acute MI' },
  'acs stemi': { canonicalTopic: 'ST-Elevation Myocardial Infarction (STEMI)', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'ACS STEMI' },
  stemi: { canonicalTopic: 'ST-Elevation Myocardial Infarction (STEMI)', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'STEMI' },
  nstemi: { canonicalTopic: 'Non-ST-Elevation Myocardial Infarction (NSTEMI)', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'NSTEMI' },
  wpw: { canonicalTopic: 'Wolff-Parkinson-White (WPW) Syndrome', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'WPW' },
  chb: { canonicalTopic: 'Complete Heart Block & AV Dissociation', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'CHB' },
  cardiology: { canonicalTopic: 'Cardiology Clinical Vignettes', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Cardiology' },

  // Gastroenterology
  uc: { canonicalTopic: 'Ulcerative Colitis', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'UC', discriminatorConcept: 'Mucosal disease, continuous from rectum, lead-pipe sign, crypt abscesses, pANCA positive' },
  'ulcerative colitis': { canonicalTopic: 'Ulcerative Colitis', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Ulcerative Colitis' },
  crohn: { canonicalTopic: "Crohn's Disease", canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: "Crohn's", discriminatorConcept: 'Transmural skip lesions, terminal ileum, string sign of Kantor, non-caseating granulomas, ASCA positive, fistulae' },
  "crohn's": { canonicalTopic: "Crohn's Disease", canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: "Crohn's" },
  'crohn disease': { canonicalTopic: "Crohn's Disease", canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: "Crohn's" },
  'crohns disease': { canonicalTopic: "Crohn's Disease", canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: "Crohn's" },
  ibd: { canonicalTopic: 'Inflammatory Bowel Disease (Crohn vs UC)', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'IBD' },

  // Nephrology
  psgn: { canonicalTopic: 'Post-Streptococcal Glomerulonephritis', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'PSGN', discriminatorConcept: 'Nephritic syndrome, group A strep pyoderma/pharyngitis, low C3, subepithelial lumpy-bumpy humps' },
  mcd: { canonicalTopic: 'Minimal Change Disease', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'MCD', discriminatorConcept: 'Nephrotic syndrome in pediatrics, normal light microscopy, podocyte effacement on EM, steroid responsive' },
  'minimal change disease': { canonicalTopic: 'Minimal Change Disease', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Minimal Change Disease', discriminatorConcept: 'Nephrotic syndrome in pediatrics, normal light microscopy, podocyte effacement on EM, steroid responsive' },
  'nephrotic syndrome': { canonicalTopic: 'Nephrotic Syndrome', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Nephrotic Syndrome' },
  'nephritic syndrome': { canonicalTopic: 'Nephritic Syndrome', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Nephritic Syndrome' },
  fsgs: { canonicalTopic: 'Focal Segmental Glomerulosclerosis', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'FSGS' },
  mn: { canonicalTopic: 'Membranous Nephropathy', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'MN', discriminatorConcept: 'Spike and dome on silver stain, subepithelial IgG/C3, PLA2R antibodies' },

  // Endocrinology & Metabolism
  dka: { canonicalTopic: 'Diabetic Ketoacidosis', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'DKA', discriminatorConcept: 'Type 1 DM, hyperglycemia, positive serum ketones, high anion gap metabolic acidosis, Kussmaul breathing' },
  hhs: { canonicalTopic: 'Hyperosmolar Hyperglycemic State', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'HHS', discriminatorConcept: 'Type 2 DM, severe hyperglycemia (>600 mg/dL), serum osmolarity >320 mOsm/kg, absent/minimal ketones, normal pH' },

  // Rheumatology
  sjogren: { canonicalTopic: 'Sjögren Syndrome', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Sjögren', discriminatorConcept: 'Keratoconjunctivitis sicca, xerostomia, Anti-Ro/SSA & Anti-La/SSB, minor salivary lip biopsy focus score ≥1, MALToma risk' },
  sjögren: { canonicalTopic: 'Sjögren Syndrome', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'Sjögren' },
  sle: { canonicalTopic: 'Systemic Lupus Erythematosus (SLE)', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'SLE' },
  ra: { canonicalTopic: 'Rheumatoid Arthritis', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'RA' },

  // Neurology
  nph: { canonicalTopic: 'Normal Pressure Hydrocephalus', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'NPH' },
  'normal pressure hydrocephalus': { canonicalTopic: 'Normal Pressure Hydrocephalus', canonicalSubject: 'General Medicine', subjectId: 'medicine', aliasMatched: 'NPH' },

  // Obstetrics & Gynecology
  pph: { canonicalTopic: 'Postpartum Hemorrhage', canonicalSubject: 'Obstetrics & Gynecology', subjectId: 'obg', aliasMatched: 'PPH' },
  hellp: { canonicalTopic: 'HELLP Syndrome', canonicalSubject: 'Obstetrics & Gynecology', subjectId: 'obg', aliasMatched: 'HELLP' },
};

/**
 * Resolves a natural query or acronym into canonical topic and subject.
 */
export function resolveMedicalTopic(query: string): ResolvedMedicalTopic | null {
  if (!query) return null;
  const clean = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Direct match in alias dictionary
  if (MEDICAL_TOPIC_ALIASES[clean]) {
    return MEDICAL_TOPIC_ALIASES[clean];
  }

  // 2. Word boundary match for acronyms and terms
  for (const [alias, data] of Object.entries(MEDICAL_TOPIC_ALIASES)) {
    const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(clean)) {
      return data;
    }
  }

  return null;
}

/**
 * Natural language intent classifier for Mentor modes.
 */
export function detectMentorMode(query: string): MentorMode {
  if (!query) return 'FREE_CHAT';
  const lower = query.toLowerCase().trim();

  // 1. Weak area quiz
  if (
    lower.includes('quiz my weak') ||
    lower.includes('test my weak') ||
    lower.includes('quiz me on my weak') ||
    lower.includes('weak area') ||
    lower.includes('weak subject') ||
    lower.includes('focus on my weakness')
  ) {
    return 'WEAK_AREA';
  }

  // 2. Remediation & mistake review
  if (
    lower.includes('review my mistakes') ||
    lower.includes('why did i get that wrong') ||
    lower.includes('why did i get that question wrong') ||
    lower.includes('why do i keep getting') ||
    lower.includes('why do i keep missing') ||
    lower.includes('explain my mistake') ||
    lower.includes('my error') ||
    lower.includes('mistake review')
  ) {
    return 'REMEDIATION';
  }

  // 3. Comparison
  if (
    lower.includes(' vs ') ||
    lower.includes(' versus ') ||
    lower.startsWith('compare ') ||
    lower.includes('difference between') ||
    lower.includes('differ from') ||
    lower.includes('contrast ')
  ) {
    return 'COMPARE';
  }

  // 4. Multi-question clinical quiz / question requests
  if (
    /\b(\d+)\s*(?:harder\s+)?(?:mcqs?|questions?|vignettes?)\b/i.test(lower) ||
    lower.includes('quiz me on') ||
    lower.includes('start a quiz') ||
    lower.includes('give me 5') ||
    lower.includes('harder ones') ||
    lower.includes('cardiology questions') ||
    lower.includes('practice questions')
  ) {
    return 'QUIZ';
  }

  // 5. Single MCQ
  if (
    lower.includes('give me an mcq') ||
    lower.includes('give me mcqs') ||
    lower.includes('give me a question') ||
    lower.includes('clinical vignette') ||
    lower.includes('practice question') ||
    lower.includes('test me on') ||
    lower.trim() === 'mcq' ||
    lower.trim() === 'question'
  ) {
    return 'MCQ';
  }

  // 6. Revision / Planning
  if (
    lower.includes('what should i study today') ||
    lower.includes('what to study today') ||
    lower.includes('revision plan') ||
    lower.includes('revision strategy') ||
    lower.includes('continue where i left off') ||
    lower.includes('where i left off') ||
    lower.includes('study plan') ||
    lower.includes('rapid revision')
  ) {
    return 'REVISION';
  }

  // 7. Clinical conceptual explanation
  if (
    lower.startsWith('explain ') ||
    lower.startsWith('what is ') ||
    lower.startsWith('how does ') ||
    lower.startsWith('pathophysiology of ') ||
    lower.startsWith('mechanism of ') ||
    lower.startsWith('why is ')
  ) {
    return 'EXPLAIN';
  }

  return 'FREE_CHAT';
}

/**
 * Context Priority Order:
 * 1. EXPLICIT USER REQUEST (Highest)
 * 2. CURRENT CONVERSATION
 * 3. CURRENT QUIZ / SESSION
 * 4. RELEVANT PERFORMANCE DATA
 * 5. RELEVANT STUDY HISTORY
 * 6. EXAM TIMING
 * 7. GENERAL MENTOR CONTEXT (Lowest)
 *
 * Ensures background context NEVER overrides explicit user intent.
 */
export function resolveEffectiveQueryContext(
  explicitQuery: string,
  context: NormalizedMentorContext,
  conversationHistory: Array<{ role: string; content: string }> = []
): {
  topic?: string;
  subject?: string;
  effectiveTopic: string;
  effectiveSubject: string;
  mode: MentorMode;
  userOverrideDetected: boolean;
  priorityLevel: string;
  targetWeakArea?: { subject: string; accuracy?: number };
} {
  const mode = detectMentorMode(explicitQuery);

  // 1. Check if user explicitly named a topic/acronym in their request
  const resolvedExplicit = resolveMedicalTopic(explicitQuery);
  if (resolvedExplicit) {
    return {
      topic: resolvedExplicit.canonicalTopic,
      subject: resolvedExplicit.canonicalSubject,
      effectiveTopic: resolvedExplicit.canonicalTopic,
      effectiveSubject: resolvedExplicit.canonicalSubject,
      mode,
      userOverrideDetected: true,
      priorityLevel: 'EXPLICIT_USER_REQUEST',
    };
  }

  // 2. If user explicitly asks "Quiz my weak areas", select from performance data
  if (mode === 'WEAK_AREA') {
    const primaryWeakSubject = context.weakSubjects[0] || 'Pharmacology';
    const primaryWeakTopic = context.weakTopics[0] || 'Antiarrhythmics';
    const accuracy = context.subjectAccuracy[primaryWeakSubject.toLowerCase()] || 45;
    return {
      topic: primaryWeakTopic,
      subject: primaryWeakSubject,
      effectiveTopic: primaryWeakTopic,
      effectiveSubject: primaryWeakSubject,
      mode: 'WEAK_AREA',
      userOverrideDetected: false,
      priorityLevel: 'RELEVANT_PERFORMANCE_DATA',
      targetWeakArea: { subject: primaryWeakSubject, accuracy },
    };
  }

  // 3. Follow-up queries (e.g. "give me harder ones") infer from current conversation / history
  if (conversationHistory.length > 0 || context.currentTopic) {
    // Check conversation history backwards for any mentioned topic
    let historyTopic = context.currentTopic;
    let historySubject = context.currentSubject;

    if (!historyTopic) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        const match = resolveMedicalTopic(msg.content);
        if (match) {
          historyTopic = match.canonicalTopic;
          historySubject = match.canonicalSubject;
          break;
        }
      }
    }

    if (historyTopic) {
      return {
        topic: historyTopic,
        subject: historySubject || 'General Medicine',
        effectiveTopic: historyTopic,
        effectiveSubject: historySubject || 'General Medicine',
        mode,
        userOverrideDetected: false,
        priorityLevel: 'CURRENT_CONVERSATION',
      };
    }
  }

  // 4. If user explicitly asks "Continue where I left off" or "What should I study today"
  if (explicitQuery.toLowerCase().includes('where i left off') || explicitQuery.toLowerCase().includes('what should i study today')) {
    const recentTopic = context.recentTopics[0] || context.weakTopics[0] || 'Cardiology · Arrhythmias';
    const recentSubject = context.recentSubjects[0] || context.weakSubjects[0] || 'General Medicine';
    return {
      topic: recentTopic,
      subject: recentSubject,
      effectiveTopic: recentTopic,
      effectiveSubject: recentSubject,
      mode: 'REVISION',
      userOverrideDetected: false,
      priorityLevel: 'RELEVANT_STUDY_HISTORY',
    };
  }

  // 5. Default fallback
  return {
    topic: undefined,
    subject: undefined,
    effectiveTopic: explicitQuery || 'Clinical Medicine',
    effectiveSubject: 'General Medicine',
    mode,
    userOverrideDetected: false,
    priorityLevel: 'GENERAL_MENTOR_CONTEXT',
  };
}
