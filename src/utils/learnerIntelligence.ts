import { AppState, McqAttempt } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from './date';

/** A factual, shared summary of what the learner has done and how they responded. */
export interface LearnerPulse {
  todayStudyMinutes: number;
  todayLoggedQuestions: number;
  todayAttemptCount: number;
  todayAccuracy: number | null;
  recentAttemptCount: number;
  recentAccuracy: number | null;
  recentMedianResponseSeconds: number | null;
  confidentMisses: number;
  unsureCorrect: number;
  focusMinutesBySubject: Array<{ subjectId: string; subjectName: string; minutes: number }>;
  latestActivity: { subjectName: string; topicName: string; timestamp: string } | null;
  dataNote: string;
}

const subjectName = (id: string) => FMGE_SUBJECTS.find((subject) => subject.id === id)?.name || id;
const confidenceIsSure = (attempt: McqAttempt) => ['high', 'certain'].includes(attempt.confidence || '');
const confidenceIsUnsure = (attempt: McqAttempt) => ['guess', 'low'].includes(attempt.confidence || '');

export function getLearnerPulse(state: AppState, now = new Date()): LearnerPulse {
  const today = getLocalDateKey(now);
  const todayLog = state.studyLogs?.[today];
  const attempts = Array.isArray(state.mcqAttempts) ? state.mcqAttempts : [];
  const ordered = [...attempts]
    .filter((attempt) => Number.isFinite(new Date(attempt.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const todayAttempts = ordered.filter((attempt) => getLocalDateKey(new Date(attempt.timestamp)) === today);
  const recent = ordered.slice(0, 20);
  const accuratePct = (items: McqAttempt[]) => items.length
    ? Math.round(items.filter((attempt) => attempt.isCorrect).length / items.length * 100)
    : null;
  const responseTimes = recent.map((attempt) => attempt.timeTakenSeconds)
    .filter((seconds) => Number.isFinite(seconds) && seconds > 0)
    .sort((a, b) => a - b);
  const medianResponse = responseTimes.length
    ? responseTimes[Math.floor((responseTimes.length - 1) / 2)]
    : null;
  const bySubject = new Map<string, number>();
  for (const attempt of todayAttempts) {
    if (Number.isFinite(attempt.timeTakenSeconds) && attempt.timeTakenSeconds > 0) {
      bySubject.set(attempt.subjectId, (bySubject.get(attempt.subjectId) || 0) + attempt.timeTakenSeconds);
    }
  }
  const latest = ordered[0];
  const minutesBySubject = [...bySubject.entries()]
    .map(([subjectId, seconds]) => ({ subjectId, subjectName: subjectName(subjectId), minutes: Math.round(seconds / 60) }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    todayStudyMinutes: todayLog?.studyMinutes || 0,
    todayLoggedQuestions: todayLog?.questionsSolved || 0,
    todayAttemptCount: todayAttempts.length,
    todayAccuracy: accuratePct(todayAttempts),
    recentAttemptCount: recent.length,
    recentAccuracy: accuratePct(recent),
    recentMedianResponseSeconds: medianResponse,
    confidentMisses: recent.filter((attempt) => !attempt.isCorrect && confidenceIsSure(attempt)).length,
    unsureCorrect: recent.filter((attempt) => attempt.isCorrect && confidenceIsUnsure(attempt)).length,
    focusMinutesBySubject: minutesBySubject,
    latestActivity: latest ? {
      subjectName: subjectName(latest.subjectId),
      topicName: latest.topicName || 'Question practice',
      timestamp: latest.timestamp,
    } : null,
    dataNote: 'Focus minutes come from completed study timers. Subject time is estimated only from recorded question response time.',
  };
}
