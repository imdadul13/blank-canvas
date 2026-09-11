import type React from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Droplet,
  Flame,
  GraduationCap,
  RotateCcw,
  Award,
  Trophy,
  Timer,
} from 'lucide-react';
import { AppState } from '../types';
import { getLocalDateKey } from '../utils/date';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

// ============================================================================
// STORAGE KEYS & VERSIONING
// ============================================================================

export const NOTIFICATION_STORAGE_KEY = 'fmge_notification_center_v1';
export const INSIGHTS_STORAGE_KEY_V2 = 'fmge_study_insights_v2';

// ============================================================================
// TYPES & LIFECYCLE
// ============================================================================

export type NotificationCategory = 'revision' | 'wellness' | 'focus' | 'error' | 'exam';
export type InsightSeverity = 'critical' | 'actionable' | 'achievement' | 'routine';
export type InsightStatus = 'unseen' | 'seen' | 'dismissed' | 'resolved';

export interface SmartNotification {
  id: string; // Semantic identity: ruleId:subjectId:topicId:bucket
  ruleId?: string;
  category: NotificationCategory;
  priority: 'high' | 'medium' | 'low';
  severity?: InsightSeverity;
  status?: InsightStatus;
  condition: string; // State signature
  cooldownMs: number;
  title: string;
  description: string;
  time: string;
  actionLabel: string;
  onAction: () => void;
  icon: React.ElementType;
  iconColor: string;
  subjectId?: string;
  topicId?: string;
  baseline?: number;
  badge?: string;
}

export type DismissalRecord = {
  hiddenAt: number;
  condition: string;
  baseline?: number;
  status?: InsightStatus;
};

export interface StoredInsightRecord {
  id: string;
  ruleId: string;
  subjectId?: string;
  topicId?: string;
  status: InsightStatus;
  firstGeneratedAt: number;
  lastSeenAt?: number;
  dismissedAt?: number;
  dismissedBaseline?: number;
  condition: string;
  severity: InsightSeverity;
}

export type InsightStore = Record<string, StoredInsightRecord>;

// ============================================================================
// PERSISTENCE & SAFE MIGRATION
// ============================================================================

export function loadInsightStore(): InsightStore {
  try {
    const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as InsightStore;
      }
    }
  } catch {
    /* storage parse failed */
  }

  // Safe migration fallback from v1 without destroying v1
  try {
    const legacyRaw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Record<string, DismissalRecord>;
      const migrated: InsightStore = {};
      for (const [id, rec] of Object.entries(legacy)) {
        migrated[id] = {
          id,
          ruleId: id.replace('notif-', ''),
          status: 'dismissed',
          firstGeneratedAt: rec.hiddenAt || Date.now(),
          dismissedAt: rec.hiddenAt || Date.now(),
          condition: rec.condition || '',
          severity: 'actionable',
        };
      }
      return migrated;
    }
  } catch {
    /* legacy migration failed */
  }

  return {};
}

export function saveInsightStore(store: InsightStore): void {
  try {
    localStorage.setItem(INSIGHTS_STORAGE_KEY_V2, JSON.stringify(store));
  } catch {
    /* storage unavailable */
  }
}

/** Legacy support for components expecting loadDismissals */
export function loadDismissals(): Record<string, DismissalRecord> {
  const store = loadInsightStore();
  const legacy: Record<string, DismissalRecord> = {};
  for (const [id, rec] of Object.entries(store)) {
    if (rec.status === 'dismissed') {
      legacy[id] = {
        hiddenAt: rec.dismissedAt || rec.firstGeneratedAt,
        condition: rec.condition,
        baseline: rec.dismissedBaseline,
        status: rec.status,
      };
    }
  }
  return legacy;
}

/** Legacy support for components expecting saveDismissals */
export function saveDismissals(dismissals: Record<string, DismissalRecord>): void {
  try {
    // Keep v1 updated for legacy readers
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(dismissals));

    // Also synchronize into v2 insight store
    const store = loadInsightStore();
    for (const [id, rec] of Object.entries(dismissals)) {
      store[id] = {
        id,
        ruleId: store[id]?.ruleId || id.replace('notif-', ''),
        status: rec.status || 'dismissed',
        firstGeneratedAt: store[id]?.firstGeneratedAt || rec.hiddenAt || Date.now(),
        dismissedAt: rec.hiddenAt || Date.now(),
        dismissedBaseline: rec.baseline !== undefined ? rec.baseline : store[id]?.dismissedBaseline,
        condition: rec.condition,
        severity: store[id]?.severity || 'actionable',
      };
    }
    saveInsightStore(store);
  } catch {
    /* storage unavailable */
  }
}

// ============================================================================
// LIFECYCLE & RESURFACING GATES
// ============================================================================

/**
 * Evaluates whether an insight is eligible to be shown.
 * - Dismissed insights REMAIN dismissed while underlying condition is unchanged or improving.
 * - Cooldown timers NEVER blindly resurrect identical insights.
 * - Positive progress NEVER resurrects a dismissed warning.
 * - Only a new semantic identity (worsening state bucket or new event) is shown.
 */
export function shouldShow(n: SmartNotification, dismissals: Record<string, DismissalRecord>): boolean {
  // Check v2 store first
  const store = loadInsightStore();
  const stored = store[n.id];

  if (stored) {
    if (stored.status === 'dismissed') {
      // If condition hasn't worsened beyond the dismissed baseline, keep suppressed
      if (n.baseline !== undefined && stored.dismissedBaseline !== undefined) {
        if (n.baseline <= stored.dismissedBaseline) {
          return false; // Condition unchanged or improved
        }
      }
      return false; // Kept dismissed
    }
    if (stored.status === 'resolved') {
      return false;
    }
  }

  // Check legacy dismissals map passed from component state
  const legacyRec = dismissals[n.id];
  if (legacyRec) {
    if (legacyRec.status === 'dismissed') {
      return false;
    }
    if (legacyRec.baseline !== undefined && n.baseline !== undefined) {
      if (n.baseline <= legacyRec.baseline) {
        return false;
      }
    }
    // Condition exact match: stay dismissed (NO timer resurrection)
    if (legacyRec.condition === n.condition) {
      return false;
    }
  }

  return true;
}

export function markInsightSeen(id: string): void {
  const store = loadInsightStore();
  if (store[id]) {
    store[id].lastSeenAt = Date.now();
    if (store[id].status === 'unseen') {
      store[id].status = 'seen';
    }
  } else {
    store[id] = {
      id,
      ruleId: id.split(':')[0] || 'insight',
      status: 'seen',
      firstGeneratedAt: Date.now(),
      lastSeenAt: Date.now(),
      condition: '',
      severity: 'actionable',
    };
  }
  saveInsightStore(store);
}

export function markInsightDismissed(id: string, condition: string, baseline?: number): void {
  const store = loadInsightStore();
  store[id] = {
    id,
    ruleId: store[id]?.ruleId || id.split(':')[0] || 'insight',
    status: 'dismissed',
    firstGeneratedAt: store[id]?.firstGeneratedAt || Date.now(),
    dismissedAt: Date.now(),
    dismissedBaseline: baseline,
    condition,
    severity: store[id]?.severity || 'actionable',
  };
  saveInsightStore(store);

  // Sync to legacy v1 format
  const dismissals = loadDismissals();
  dismissals[id] = {
    hiddenAt: Date.now(),
    condition,
    baseline,
    status: 'dismissed',
  };
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(dismissals));
  } catch {
    /* storage unavailable */
  }
}

export function markInsightResolved(id: string): void {
  const store = loadInsightStore();
  if (store[id]) {
    store[id].status = 'resolved';
  } else {
    store[id] = {
      id,
      ruleId: id.split(':')[0] || 'insight',
      status: 'resolved',
      firstGeneratedAt: Date.now(),
      condition: '',
      severity: 'actionable',
    };
  }
  saveInsightStore(store);
}

// ============================================================================
// TIME FORMATTING HELPER
// ============================================================================

function timeAgo(minutes: number): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ============================================================================
// ACTIONS INTERFACE
// ============================================================================

export interface NotificationActions {
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectSubject?: (subjectId: string) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string) => void;
  onDismiss?: (id: string, condition: string) => void;
  onBreakLogged?: (message: string) => void;
}

// ============================================================================
// 15 DETERMINISTIC INTELLIGENCE RULES
// ============================================================================

export function buildNotifications(
  state: AppState,
  dismissals: Record<string, DismissalRecord>,
  actions: NotificationActions
): SmartNotification[] {
  const candidates: SmartNotification[] = [];
  const now = Date.now();
  const todayKey = getLocalDateKey();

  const subjectName = (id?: string) =>
    FMGE_SUBJECTS.find((s) => s.id === id)?.name || id || 'Clinical Medicine';

  // --------------------------------------------------------------------------
  // CATEGORY A: CLINICAL PERFORMANCE & ACCURACY
  // --------------------------------------------------------------------------

  // Rule 1: RECURRENT CONCEPT TRAP (Critical)
  // Detects if the exact same concept/subtopic was missed >= 2 times in unreviewed errors
  const unreviewedMistakes = Object.values(state.errorNotebook || {}).filter(
    (m) => m && !m.isReviewed
  );

  const conceptCounts: Record<string, { count: number; subjectId: string; topic: string; conceptName: string }> = {};
  for (const m of unreviewedMistakes) {
    const key = (m.conceptName || m.topic || m.questionGist || '').toLowerCase().trim();
    if (!key) continue;
    if (!conceptCounts[key]) {
      conceptCounts[key] = {
        count: 0,
        subjectId: m.subjectId,
        topic: m.topic || 'Core Concept',
        conceptName: m.conceptName || m.topic || 'Clinical Vignette',
      };
    }
    conceptCounts[key].count += 1;
  }

  const recurrentEntry = Object.values(conceptCounts).find((c) => c.count >= 2);
  if (recurrentEntry) {
    const bucket = recurrentEntry.count >= 4 ? 'high-recurrence' : 'recurrence';
    const conceptSlug = (recurrentEntry.conceptName || recurrentEntry.topic).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const semId = `recurrent_trap:${recurrentEntry.subjectId}:${conceptSlug}:${bucket}`;
    candidates.push({
      id: semId,
      ruleId: 'recurrent_concept_trap',
      category: 'error',
      priority: 'high',
      severity: 'critical',
      condition: `recurrent:${recurrentEntry.subjectId}:${recurrentEntry.count}`,
      cooldownMs: 0,
      baseline: recurrentEntry.count,
      badge: 'RECURRENT TRAP',
      title: `Repeated Mistake: ${recurrentEntry.conceptName}`,
      description: `You have missed questions on ${recurrentEntry.conceptName} (${subjectName(recurrentEntry.subjectId)}) ${recurrentEntry.count} times without remediation. Master the discriminating concept in Error Vault.`,
      time: 'Immediate',
      actionLabel: 'Remediate Concept',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('errors');
      },
      icon: AlertTriangle,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200/80',
      subjectId: recurrentEntry.subjectId,
    });
  }

  // Rule 2: SUBJECT ACCURACY DROP (Critical / Actionable)
  // Meaningful sample size (>= 10 attempts in subject), accuracy in last 10 attempts drops < 50%
  if (state.mcqAttempts && state.mcqAttempts.length >= 10) {
    const subjectAttempts: Record<string, boolean[]> = {};
    for (const a of state.mcqAttempts) {
      if (!a.subjectId) continue;
      if (!subjectAttempts[a.subjectId]) subjectAttempts[a.subjectId] = [];
      subjectAttempts[a.subjectId].push(Boolean(a.isCorrect));
    }

    for (const [subId, attempts] of Object.entries(subjectAttempts)) {
      if (attempts.length >= 10) {
        const recent10 = attempts.slice(-10);
        const recentCorrect = recent10.filter(Boolean).length;
        const recentAccuracy = Math.round((recentCorrect / recent10.length) * 100);

        if (recentAccuracy < 50) {
          const bucket = recentAccuracy <= 30 ? 'severe' : 'moderate';
          const semId = `subject_accuracy_drop:${subId}:${bucket}`;
          candidates.push({
            id: semId,
            ruleId: 'subject_accuracy_drop',
            category: 'error',
            priority: 'high',
            severity: 'critical',
            condition: `drop:${subId}:${recentAccuracy}`,
            cooldownMs: 0,
            baseline: recentAccuracy,
            badge: 'ACCURACY DROP',
            title: `${subjectName(subId)} Accuracy Dip (${recentAccuracy}%)`,
            description: `Recent question accuracy in ${subjectName(subId)} dropped to ${recentAccuracy}% across your last 10 attempts. Target weak clinical vignettes before advancing.`,
            time: 'Recent MCQs',
            actionLabel: 'Target Weak Vignettes',
            onAction: () => {
              actions.onClose();
              actions.onSelectSubject?.(subId);
            },
            icon: Flame,
            iconColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
            subjectId: subId,
          });
          break; // Cap to 1 subject drop alert
        }
      }
    }
  }

  // Rule 3: SPEED TRAP (Actionable)
  // Detects >= 3 incorrect answers where timeSpentSeconds <= 18 (rushing through clinical questions)
  if (state.mcqAttempts && state.mcqAttempts.length >= 5) {
    const recentAttempts = state.mcqAttempts.slice(-20);
    const speedErrors = recentAttempts.filter(
      (a) => !a.isCorrect && a.timeTakenSeconds !== undefined && a.timeTakenSeconds > 0 && a.timeTakenSeconds <= 18
    );

    if (speedErrors.length >= 3) {
      const bucket = speedErrors.length >= 8 ? '8-plus' : speedErrors.length >= 5 ? '5-7' : '3-4';
      const semId = `speed_trap:clinical-rush:${bucket}`;
      candidates.push({
        id: semId,
        ruleId: 'speed_trap',
        category: 'focus',
        priority: 'medium',
        severity: 'actionable',
        condition: `speed:${bucket}`,
        cooldownMs: 0,
        baseline: speedErrors.length,
        badge: 'PACING COACH',
        title: 'Speed Trap: Rushing Clinical Vignettes',
        description: `${speedErrors.length} recent mistakes occurred with under 18 seconds spent per question. In NBE vignettes, read the final lead-in sentence first, then parse patient vitals.`,
        time: 'Pacing Signal',
        actionLabel: 'Practice Pacing',
        onAction: () => {
          actions.onClose();
          actions.onNavigateTab('practice');
        },
        icon: Timer,
        iconColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
      });
    }
  }

  // Rule 4: REMEDIATION SUCCESS (Achievement)
  // Positive reinforcement when >= 3 errors in errorNotebook have been reviewed/remediated
  const resolvedMistakes = Object.values(state.errorNotebook || {}).filter(
    (m) => m && m.isReviewed
  );
  if (resolvedMistakes.length >= 3) {
    const semId = `remediation_success:milestone:${Math.floor(resolvedMistakes.length / 3) * 3}`;
    candidates.push({
      id: semId,
      ruleId: 'remediation_success',
      category: 'error',
      priority: 'low',
      severity: 'achievement',
      condition: `resolved_count:${resolvedMistakes.length}`,
      cooldownMs: 0,
      badge: 'CONCEPT LOCKED',
      title: `${resolvedMistakes.length} Concepts Remediated!`,
      description: `Solid progress in Error Vault: you have systematically reviewed and remediated ${resolvedMistakes.length} previous question traps.`,
      time: 'Remediation Milestone',
      actionLabel: 'View Error Vault',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('errors');
      },
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      subjectId: resolvedMistakes[0]?.subjectId,
    });
  }

  // --------------------------------------------------------------------------
  // CATEGORY B: REVISION & RETENTION
  // --------------------------------------------------------------------------

  // Rule 5: REVISION DUE (Actionable)
  // Only surfaces when targetRevisionDate <= todayKey. Persists until advanced or completed.
  const dueSubjects = Object.values(state.subjectProgress || {}).filter(
    (s) => s && s.targetRevisionDate && s.targetRevisionDate <= todayKey
  );
  if (dueSubjects.length > 0) {
    const dueCount = dueSubjects.length;
    for (const sub of dueSubjects) {
      const targetDateKey = (sub.targetRevisionDate || '').slice(0, 10);
      const semId = `revision_due:${sub.subjectId}:${targetDateKey}`;
      candidates.push({
        id: semId,
        ruleId: 'revision_due',
        category: 'revision',
        priority: 'high',
        severity: 'actionable',
        condition: `revision:${sub.subjectId}:${targetDateKey}`,
        cooldownMs: 0,
        baseline: dueCount,
        badge: 'ACTIVE RECALL',
        title: dueCount === 1 ? `Revision Due: ${subjectName(sub.subjectId)}` : `Revision Due: ${subjectName(sub.subjectId)} (${dueCount} Due)`,
        description: `Scientifically scheduled recall interval reached for ${subjectName(sub.subjectId)}. Quick 20-minute active recall cements long-term memory.`,
        time: 'Due today',
        actionLabel: 'Launch Revision',
        onAction: () => {
          actions.onClose();
          actions.onNavigateTab('revision');
        },
        icon: RotateCcw,
        iconColor: 'text-teal-600 bg-teal-50 border-teal-200/80',
        subjectId: sub.subjectId,
      });
    }
  }

  // Rule 6: HIGH YIELD PRACTICE GAP (Actionable)
  // High-yield topic has complete notes but zero QBank practice done.
  // Note: Named high_yield_practice_gap because current telemetry lacks per-topic timestamp decay.
  if (state.topicsState) {
    for (const [key, topicData] of Object.entries(state.topicsState)) {
      if (topicData?.notesDone && !topicData?.qBankDone && (topicData.qBankSolvedCount || 0) === 0) {
        const hyphenIdx = key.indexOf('-');
        const subId = hyphenIdx !== -1 ? key.slice(0, hyphenIdx) : key;
        const topId = hyphenIdx !== -1 ? key.slice(hyphenIdx + 1) : key;
        const sub = FMGE_SUBJECTS.find((s) => s.id === subId);
        const top = sub?.topics.find((t) => t.id === topId);
        if (top && top.isHighYield) {
          const semId = `high_yield_practice_gap:${subId}:${topId}`;
          candidates.push({
            id: semId,
            ruleId: 'high_yield_practice_gap',
            category: 'revision',
            priority: 'medium',
            severity: 'actionable',
            condition: `practice_gap:${key}`,
            cooldownMs: 0,
            badge: 'RETENTION RISK',
            title: `QBank Gap: ${top.name}`,
            description: `High-yield blueprint topic in ${subjectName(subId)} has complete notes but 0 practice questions logged. Solving 10 MCQs doubles retention.`,
            time: 'Practice Gap',
            actionLabel: 'Solve 10 MCQs',
            onAction: () => {
              actions.onClose();
              actions.onLaunchPracticeSession?.(subId, top.id, top.name);
            },
            icon: BookOpen,
            iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
            subjectId: subId,
            topicId: topId,
          });
          break; // Cap to 1 gap alert
        }
      }
    }
  }

  // Rule 7: SUBJECT MASTERY (Achievement)
  // All high-yield topics in a subject completed with strong confidence
  for (const sub of FMGE_SUBJECTS) {
    const prog = state.subjectProgress?.[sub.id];
    if (prog && (prog.confidence === 'strong' || prog.confidence === 'mastered')) {
      const hyTopics = sub.topics.filter((t) => t.isHighYield);
      const doneNotes = hyTopics.filter(
        (t) => state.topicsState?.[`${sub.id}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      if (hyTopics.length > 0 && doneNotes === hyTopics.length) {
        const semId = `subject_mastery:${sub.id}:high-yield-complete`;
        candidates.push({
          id: semId,
          ruleId: 'subject_mastery',
          category: 'revision',
          priority: 'low',
          severity: 'achievement',
          condition: `mastery:${sub.id}`,
          cooldownMs: 0,
          badge: 'MILESTONE',
          title: `${sub.name} Blueprint Mastered`,
          description: `All ${hyTopics.length} high-yield topics in ${sub.name} completed with strong clinical confidence. Subject ready for Grand Test validation.`,
          time: 'Mastery',
          actionLabel: 'Review Syllabus',
          onAction: () => {
            actions.onClose();
            actions.onSelectSubject?.(sub.id);
          },
          icon: Trophy,
          iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
          subjectId: sub.id,
        });
        break; // 1 mastery milestone at a time
      }
    }
  }

  // --------------------------------------------------------------------------
  // CATEGORY C: GRAND TEST INTELLIGENCE
  // --------------------------------------------------------------------------

  // Rule 8: REPEATED GT WEAKNESS (Critical)
  // Detects if a subject was flagged in weakSubjectIds across 2 consecutive GTs
  if (state.grandTests && state.grandTests.length >= 2) {
    const sortedGts = state.grandTests.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const [latestGt, prevGt] = sortedGts;
    const commonWeak = (latestGt.weakSubjectIds || []).filter((s) => (prevGt.weakSubjectIds || []).includes(s));

    if (commonWeak.length > 0) {
      const weakSub = commonWeak[0];
      const semId = `gt_repeated_weakness:${weakSub}:${latestGt.id}`;
      candidates.push({
        id: semId,
        ruleId: 'repeated_gt_weakness',
        category: 'exam',
        priority: 'high',
        severity: 'critical',
        condition: `weak:${weakSub}:${latestGt.id}`,
        cooldownMs: 0,
        badge: 'EXAM VULNERABILITY',
        title: `Persistent Weakness: ${subjectName(weakSub)}`,
        description: `${subjectName(weakSub)} was flagged as a low-scoring subject in your last 2 consecutive Grand Tests (${prevGt.title} & ${latestGt.title}). Prioritize its high-yield weightage.`,
        time: 'Mock Analysis',
        actionLabel: 'Open GT Diagnostics',
        onAction: () => {
          actions.onClose();
          actions.onNavigateTab('grandtests');
        },
        icon: AlertTriangle,
        iconColor: 'text-rose-600 bg-rose-50 border-rose-200/80',
        subjectId: weakSub,
      });
    }
  }

  // Rule 9: PAPER IMBALANCE (Actionable)
  // Discrepancy of >= 20 marks between Paper 1 and Paper 2 in latest GT
  // Semantic buckets: 20-29, 30-39, 40-plus. Numeric changes within bucket do NOT create new insights.
  if (state.grandTests && state.grandTests.length >= 1) {
    const latestGt = state.grandTests.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (latestGt.paper1Score !== undefined && latestGt.paper2Score !== undefined) {
      const delta = Math.abs(latestGt.paper1Score - latestGt.paper2Score);
      if (delta >= 20) {
        const bucket = delta >= 40 ? '40-plus' : delta >= 30 ? '30-39' : '20-29';
        const weaker = latestGt.paper1Score < latestGt.paper2Score ? 'Paper 1 (Pre/Para-Clinical)' : 'Paper 2 (Clinical)';
        const semId = `paper_imbalance:${latestGt.id}:${bucket}`;
        candidates.push({
          id: semId,
          ruleId: 'paper_imbalance',
          category: 'exam',
          priority: 'medium',
          severity: 'actionable',
          condition: `imbalance:${latestGt.id}:${bucket}`,
          cooldownMs: 0,
          baseline: delta,
          badge: 'SCORE ASYMMETRY',
          title: `Paper Discrepancy: ${delta} Marks`,
          description: `Significant gap in ${latestGt.title}: ${weaker} scored ${delta} marks lower. FMGE requires balanced mastery to cross the 150 cutoff comfortably.`,
          time: 'Score Balance',
          actionLabel: 'Analyze Papers',
          onAction: () => {
            actions.onClose();
            actions.onNavigateTab('grandtests');
          },
          icon: GraduationCap,
          iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
        });
      }
    }
  }

  // Rule 10: GT SCORE IMPROVEMENT (Achievement)
  // Scores increased by >= 10 marks from previous test
  // Identity tied to the GT event (latestGt.id). Score delta changes within same GT do not duplicate achievement.
  if (state.grandTests && state.grandTests.length >= 2) {
    const sortedGts = state.grandTests.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const [latestGt, prevGt] = sortedGts;
    const diff = latestGt.score - prevGt.score;
    if (diff >= 10) {
      const semId = `gt_score_improvement:${latestGt.id}`;
      candidates.push({
        id: semId,
        ruleId: 'gt_score_improvement',
        category: 'exam',
        priority: 'low',
        severity: 'achievement',
        condition: `gt_plus:${latestGt.id}`,
        cooldownMs: 0,
        badge: 'SCORE SURGE',
        title: `+${diff} Marks Grand Test Surge!`,
        description: `Your full-length mock score jumped from ${prevGt.score} to ${latestGt.score} in ${latestGt.title}. Revision trajectory is tracking toward target.`,
        time: 'Score Gain',
        actionLabel: 'View Growth Graph',
        onAction: () => {
          actions.onClose();
          actions.onNavigateTab('grandtests');
        },
        icon: Trophy,
        iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      });
    }
  }

  // --------------------------------------------------------------------------
  // CATEGORY D: STUDY BEHAVIOR & STREAK INTEGRITY
  // --------------------------------------------------------------------------

  // Rule 11: STREAK DEFENSE (Actionable)
  // User has an established streak (>= 3 days), today has 0 minutes, and local time is late (>= 17:00)
  const studyDates = Object.keys(state.studyLogs || {}).sort();
  let currentStreak = 0;
  if (studyDates.length >= 3) {
    const last7Days = studyDates.slice(-7);
    currentStreak = last7Days.filter((d) => (state.studyLogs[d]?.studyMinutes || 0) > 0).length;
  }
  const todayLog = state.studyLogs?.[todayKey];
  const didStudyToday = !!todayLog && (todayLog.studyMinutes || 0) > 0;
  const currentHour = new Date().getHours();

  if (currentStreak >= 3 && !didStudyToday && currentHour >= 17) {
    const semId = `streak_defense:${todayKey}`;
    candidates.push({
      id: semId,
      ruleId: 'streak_defense',
      category: 'focus',
      priority: 'high',
      severity: 'actionable',
      condition: `streak_defend:${todayKey}`,
      cooldownMs: 0,
      baseline: currentStreak,
      badge: 'STREAK DEFENSE',
      title: `Protect Your ${currentStreak}-Day Streak`,
      description: `You've built consistent study momentum over ${currentStreak} days. Solve a 10-minute micro-QBank block tonight to keep your streak alive.`,
      time: 'Evening Alert',
      actionLabel: 'Start 10m Micro-Block',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('dashboard');
      },
      icon: Flame,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
    });
  }

  // Rule 12: STREAK MILESTONE (Achievement)
  // Streak milestone at 7, 14, 21, 30 days
  if (currentStreak >= 7 && didStudyToday) {
    const milestoneDays = currentStreak >= 30 ? 30 : currentStreak >= 21 ? 21 : currentStreak >= 14 ? 14 : 7;
    const semId = `streak_milestone:${milestoneDays}-days`;
    candidates.push({
      id: semId,
      ruleId: 'streak_milestone',
      category: 'wellness',
      priority: 'low',
      severity: 'achievement',
      condition: `streak_achieved:${milestoneDays}`,
      cooldownMs: 0,
      badge: 'CONSISTENCY',
      title: `${milestoneDays}-Day Study Streak Unlocked!`,
      description: `Exceptional exam discipline: ${milestoneDays} consecutive study days logged. Consistency is the highest-predictive factor for FMGE clearance.`,
      time: 'Streak Milestone',
      actionLabel: 'Keep Going',
      onAction: () => {
        actions.onClose();
      },
      icon: Award,
      iconColor: 'text-amber-500 bg-amber-50 border-amber-200/80',
    });
  }

  // Rule 13: WORKLOAD OVERLOAD (Routine / Actionable)
  // Detects unrealistic workload: >= 5 uncompleted tasks with total planned duration >= 360m (6 hours)
  // Semantic buckets: 'overloaded' (360-479m) vs 'severely-overloaded' (>= 480m / 8h)
  const openTasks = Object.values(state.dailyTasks || {}).filter((t) => t && !t.completed);
  const totalOpenMinutes = openTasks.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
  if (openTasks.length >= 5 && totalOpenMinutes >= 360) {
    const bucket = totalOpenMinutes >= 480 ? 'severely-overloaded' : 'overloaded';
    const semId = `workload_overload:${todayKey}:${bucket}`;
    candidates.push({
      id: semId,
      ruleId: 'workload_overload',
      category: 'focus',
      priority: 'medium',
      severity: 'routine',
      condition: `overload:${todayKey}:${bucket}`,
      cooldownMs: 0,
      baseline: totalOpenMinutes,
      badge: 'FATIGUE RISK',
      title: totalOpenMinutes >= 480 ? 'Severe Planned Workload (8+ Hours)' : 'Heavy Planned Workload (6+ Hours)',
      description: `${openTasks.length} open tasks totaling ${Math.round(totalOpenMinutes / 60)} hours scheduled. Prune to 3 high-yield non-negotiables to avoid cognitive burnout.`,
      time: 'Schedule Optimization',
      actionLabel: 'Reorder Tasks',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('daily');
      },
      icon: Clock,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    });
  }

  // --------------------------------------------------------------------------
  // CATEGORY E: WELLNESS & FOCUS
  // --------------------------------------------------------------------------

  // Rule 14: COGNITIVE RESET PROTOCOL (Routine)
  // True recurring reminder: fires when interval has elapsed since last acknowledgment/break.
  // Each cycle forms a distinct break event: cognitive_reset:<interval>:<cycleIndex>
  const breakMinutes = state.settings.breakReminderInterval || 45;
  const breakIntervalMs = breakMinutes * 60000;
  
  // Find last break logged / dismissed in store or legacy dismissals
  const breakStore = loadInsightStore();
  let lastBreakTimestamp = 0;
  for (const [id, rec] of Object.entries(breakStore)) {
    if (id.startsWith('cognitive_reset:') || id === 'notif-break') {
      const ts = rec.dismissedAt || rec.firstGeneratedAt || 0;
      if (ts > lastBreakTimestamp) lastBreakTimestamp = ts;
    }
  }
  const legacyBreak = dismissals['notif-break'];
  if (legacyBreak && legacyBreak.hiddenAt > lastBreakTimestamp) {
    lastBreakTimestamp = legacyBreak.hiddenAt;
  }

  // If no break was ever logged, initialize baseline
  const timeSinceLastBreak = lastBreakTimestamp > 0 ? now - lastBreakTimestamp : breakIntervalMs;
  const breakDue = timeSinceLastBreak >= breakIntervalMs;

  if (breakDue) {
    const breakCycle = lastBreakTimestamp > 0 
      ? Math.floor(lastBreakTimestamp / breakIntervalMs) + 1 
      : 1;
    const semId = `cognitive_reset:${breakMinutes}:cycle-${breakCycle}`;
    candidates.push({
      id: semId,
      ruleId: 'cognitive_reset',
      category: 'wellness',
      priority: 'low',
      severity: 'routine',
      condition: `break_cycle:${breakMinutes}:${breakCycle}`,
      cooldownMs: breakIntervalMs,
      badge: 'WELLNESS',
      title: 'Micro-Break Protocol',
      description: `You are due a ${breakMinutes}-minute cognitive reset: stand, hydrate, and relax focal convergence 20 feet away for 20 seconds.`,
      time: timeAgo(Math.round(breakMinutes)),
      actionLabel: 'Hydrate & Reset',
      onAction: () => {
        actions.onBreakLogged?.('Logged a healthy reset. Cognitive stamina restored — back to high-yield work.');
        actions.onDismiss?.(semId, `break_cycle:${breakMinutes}:${breakCycle}`);
      },
      icon: Droplet,
      iconColor: 'text-sky-600 bg-sky-50 border-sky-200/80',
    });
  }

  // Rule 15: EXAM COUNTDOWN MILESTONE (Actionable)
  // Evaluated if exam date exists and <= 45 days
  if (state.settings.examDate) {
    const msLeft = new Date(state.settings.examDate).getTime() - now;
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (daysLeft >= 0 && daysLeft <= 45) {
      const semId = `exam_countdown:${daysLeft <= 15 ? 'final-sprint' : 'countdown'}`;
      candidates.push({
        id: semId,
        ruleId: 'exam_countdown',
        category: 'exam',
        priority: 'medium',
        severity: 'actionable',
        condition: `exam_days:${daysLeft <= 15 ? 'sprint' : 'prep'}`,
        cooldownMs: 0,
        badge: 'EXAM COUNTDOWN',
        title: `${daysLeft} Days to FMGE Exam Day`,
        description: daysLeft <= 15
          ? 'Final 15-day sprint: switch focus exclusively to rapid revision high-yield tables, PSM formulas, and image-based questions.'
          : `${daysLeft} days remaining. Maintain daily QBank practice volume and review your Error Vault entries regularly.`,
        time: `T-${daysLeft}d`,
        actionLabel: 'Review Blueprint',
        onAction: () => {
          actions.onClose();
          actions.onNavigateTab('dashboard');
        },
        icon: CalendarDays,
        iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      });
    }
  }

  // Rule 16: UNREVIEWED ERRORS BACKLOG (Actionable)
  // Surfaces when student has >= 3 unreviewed errors in Error Vault and no recurrent trap active
  if (unreviewedMistakes.length >= 3 && !recurrentEntry) {
    const bucket = unreviewedMistakes.length >= 10 ? '10-plus' : unreviewedMistakes.length >= 6 ? '6-9' : '3-5';
    const semId = `unreviewed_errors_backlog:${bucket}`;
    candidates.push({
      id: semId,
      ruleId: 'unreviewed_errors_backlog',
      category: 'error',
      priority: 'medium',
      severity: 'actionable',
      condition: `unreviewed:${bucket}`,
      cooldownMs: 0,
      baseline: unreviewedMistakes.length,
      badge: 'ERROR VAULT',
      title: `${unreviewedMistakes.length} Unreviewed Question Traps`,
      description: `You have ${unreviewedMistakes.length} mistakes waiting in your Error Notebook. Reviewing distractors and diagnostic traps now prevents repeating them on exam day.`,
      time: 'Error Backlog',
      actionLabel: 'Review Error Vault',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('errors');
      },
      icon: AlertTriangle,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200/80',
      subjectId: unreviewedMistakes[0]?.subjectId,
    });
  }

  // Rule 17: GRAND TEST BASELINE NEEDED (Actionable)
  // Proactively detects when a candidate has 0 full-length mock attempts
  if (!state.grandTests || state.grandTests.length === 0) {
    const semId = 'gt_baseline_needed:first-mock';
    candidates.push({
      id: semId,
      ruleId: 'gt_baseline_needed',
      category: 'exam',
      priority: 'medium',
      severity: 'actionable',
      condition: 'gt_count:0',
      cooldownMs: 0,
      baseline: 0,
      badge: 'MOCK BENCHMARK',
      title: 'Establish Your Grand Test Baseline',
      description: 'You have not recorded a full 300-Q mock exam yet. Taking a diagnostic Grand Test benchmarks your Paper 1 vs Paper 2 pacing and identifies hidden syllabus gaps.',
      time: 'Diagnostic Benchmark',
      actionLabel: 'Schedule Grand Test',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('grandtests');
      },
      icon: GraduationCap,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    });
  }

  // Rule 18: CORE HIGH-WEIGHTAGE SUBJECT GAP (Actionable)
  // Flags top 3 subjects (Medicine ~35M, Surgery ~30M, OBG ~30M) if completely unstarted
  const coreSubjects = ['medicine', 'surgery', 'obg'];
  for (const coreSubId of coreSubjects) {
    const subProgress = state.subjectProgress?.[coreSubId];
    const subDef = FMGE_SUBJECTS.find((s) => s.id === coreSubId);
    if (subDef) {
      const doneNotes = subDef.topics.filter(
        (t) => state.topicsState?.[`${coreSubId}-${t.id}`]?.notesDone ?? t.notesDone
      ).length;
      if (doneNotes === 0 && (!subProgress || subProgress.confidence === 'low' || subProgress.confidence === 'not-started' || !subProgress.confidence)) {
        const semId = `core_subject_gap:${coreSubId}`;
        candidates.push({
          id: semId,
          ruleId: 'core_subject_gap',
          category: 'focus',
          priority: 'medium',
          severity: 'actionable',
          condition: `core_gap:${coreSubId}:0`,
          cooldownMs: 0,
          badge: 'HIGH-YIELD CORE',
          title: `Unstarted Heavyweight: ${subDef.name}`,
          description: `${subDef.name} accounts for ~${subDef.weightage} marks in FMGE. Securing core topics in this subject is essential to build your pass buffer.`,
          time: `Weightage: ~${subDef.weightage}M`,
          actionLabel: `Study ${subDef.name}`,
          onAction: () => {
            actions.onClose();
            actions.onSelectSubject?.(coreSubId);
          },
          icon: BookOpen,
          iconColor: 'text-teal-600 bg-teal-50 border-teal-200/80',
          subjectId: coreSubId,
        });
        break; // Max 1 core gap
      }
    }
  }

  // --------------------------------------------------------------------------
  // RANKING & CAPPING (Maximum 5-6 Active Insights)
  // --------------------------------------------------------------------------

  // 1. Filter out dismissed or resolved insights
  const activeCandidates = candidates.filter((n) => shouldShow(n, dismissals));

  // 2. Sort candidates by deterministic clinical priority
  const severityWeight: Record<InsightSeverity, number> = {
    critical: 400,
    actionable: 300,
    achievement: 200,
    routine: 100,
  };

  const sorted = activeCandidates.sort((a, b) => {
    const sevA = severityWeight[a.severity || 'actionable'];
    const sevB = severityWeight[b.severity || 'actionable'];
    if (sevB !== sevA) return sevB - sevA;

    // Weight by FMGE subject importance if applicable
    const subA = FMGE_SUBJECTS.find((s) => s.id === a.subjectId)?.weightage || 10;
    const subB = FMGE_SUBJECTS.find((s) => s.id === b.subjectId)?.weightage || 10;
    if (subB !== subA) return subB - subA;

    return 0;
  });

  // 3. Apply category balance caps:
  // - Max 1 critical
  // - Max 2 actionable
  // - Max 1 achievement
  // - Max 1 routine
  // - Total max: 4 to 5 items
  const result: SmartNotification[] = [];
  let criticalCount = 0;
  let actionableCount = 0;
  let achievementCount = 0;
  let routineCount = 0;

  const store = loadInsightStore();
  for (const item of sorted) {
    const sev = item.severity || 'actionable';
    const storedRec = store[item.id];
    item.status = storedRec ? storedRec.status : 'unseen';

    if (sev === 'critical' && criticalCount < 1) {
      result.push(item);
      criticalCount += 1;
    } else if (sev === 'actionable' && actionableCount < 3) {
      result.push(item);
      actionableCount += 1;
    } else if (sev === 'achievement' && achievementCount < 1) {
      result.push(item);
      achievementCount += 1;
    } else if (sev === 'routine' && routineCount < 2) {
      result.push(item);
      routineCount += 1;
    }

    if (result.length >= 6) break;
  }

  return result;
}

// ============================================================================
// LIGHTWEIGHT UNREAD CHECKER FOR SHELL / BELL
// ============================================================================

/**
 * Returns true ONLY when at least one currently eligible insight has:
 * - status === 'unseen'
 * or represents a genuinely new semantic insight that has never been seen/dismissed/resolved.
 */
export function hasUnreadNotifications(state: AppState): boolean {
  const dismissals = loadDismissals();
  const noop: NotificationActions = {
    onClose: () => {},
    onNavigateTab: () => {},
    onSelectSubject: () => {},
    onLaunchPracticeSession: () => {},
    onDismiss: () => {},
    onBreakLogged: () => {},
  };
  const all = buildNotifications(state, dismissals, noop);
  const store = loadInsightStore();

  return all.some((n) => {
    const rec = store[n.id];
    // If not in store, it is a brand new semantic insight => unread
    if (!rec) return true;
    // If in store with status === 'unseen' => unread
    return rec.status === 'unseen';
  });
}
