import type { McqAttempt } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

export interface ReviewQueueItem {
  questionId: string;
  subjectId: string;
  subjectName: string;
  timestamp: string;
  dueAt: number;
  lastCorrect: boolean;
  confidence?: McqAttempt['confidence'];
  attemptCount: number;
}

/** Builds the learner's spaced-recall schedule from saved Question Bank attempts. */
export function buildDueReviewQueue(attempts: McqAttempt[]): ReviewQueueItem[] {
  const byQuestion = new Map<string, McqAttempt[]>();
  attempts.filter((attempt) => attempt.source === 'qbank' && attempt.questionId && attempt.timestamp).forEach((attempt) => {
    const list = byQuestion.get(attempt.questionId) || [];
    list.push(attempt);
    byQuestion.set(attempt.questionId, list);
  });
  const dayMs = 24 * 60 * 60 * 1000;
  return [...byQuestion.entries()].flatMap(([questionId, history]) => {
    const ordered = history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const latest = ordered[ordered.length - 1];
    const latestTime = Date.parse(latest.timestamp);
    if (!Number.isFinite(latestTime) || !ordered.some((attempt) => !attempt.isCorrect || attempt.confidence === 'guess' || attempt.confidence === 'low')) return [];
    const securelyCorrect = latest.isCorrect && ['high', 'certain'].includes(latest.confidence || '');
    let intervalDays = 1;
    if (securelyCorrect) {
      let streak = 0;
      for (let i = ordered.length - 1; i >= 0; i -= 1) {
        const attempt = ordered[i];
        if (!attempt.isCorrect || !['high', 'certain'].includes(attempt.confidence || '')) break;
        streak += 1;
      }
      intervalDays = [1, 3, 7, 14][Math.min(3, Math.max(0, streak - 1))];
    }
    return [{
      questionId,
      subjectId: latest.subjectId,
      subjectName: latest.topicName || FMGE_SUBJECTS.find((subject) => subject.id === latest.subjectId)?.name || latest.subjectId,
      timestamp: latest.timestamp,
      dueAt: latestTime + intervalDays * dayMs,
      lastCorrect: latest.isCorrect,
      confidence: latest.confidence,
      attemptCount: ordered.length,
    }];
  }).sort((a, b) => a.dueAt - b.dueAt || a.timestamp.localeCompare(b.timestamp)).slice(0, 100);
}
