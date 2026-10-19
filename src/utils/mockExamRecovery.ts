const MOCK_EXAM_RECOVERY_KEY = 'fmge_nbe_mock_recovery_v1';
const MAX_RECOVERY_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface MockExamRecoverySnapshot<Question = unknown> {
  version: 1;
  savedAt: number;
  deadlineAt: number;
  examMode: 50 | 150;
  currentIndex: number;
  questions: Question[];
  isTcsIonSkin: boolean;
}

export function getMockExamRemainingSeconds(
  deadlineAt: number,
  now = Date.now(),
): number {
  return Math.max(0, Math.ceil((deadlineAt - now) / 1000));
}

export function saveMockExamRecovery<Question>(
  snapshot: Omit<MockExamRecoverySnapshot<Question>, 'version' | 'savedAt'>,
): void {
  try {
    localStorage.setItem(
      MOCK_EXAM_RECOVERY_KEY,
      JSON.stringify({ ...snapshot, version: 1, savedAt: Date.now() }),
    );
  } catch (error) {
    console.warn('Could not save the active mock exam:', error);
  }
}

export function loadMockExamRecovery<Question>(
  now = Date.now(),
): MockExamRecoverySnapshot<Question> | null {
  try {
    const raw = localStorage.getItem(MOCK_EXAM_RECOVERY_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as MockExamRecoverySnapshot<Question>;
    const valid =
      snapshot?.version === 1 &&
      Number.isFinite(snapshot.savedAt) &&
      now - snapshot.savedAt <= MAX_RECOVERY_AGE_MS &&
      Number.isFinite(snapshot.deadlineAt) &&
      (snapshot.examMode === 50 || snapshot.examMode === 150) &&
      Number.isInteger(snapshot.currentIndex) &&
      Array.isArray(snapshot.questions) &&
      snapshot.questions.length > 0 &&
      snapshot.currentIndex >= 0 &&
      snapshot.currentIndex < snapshot.questions.length &&
      typeof snapshot.isTcsIonSkin === 'boolean';
    if (valid) return snapshot;
  } catch (error) {
    console.warn('Could not restore the active mock exam:', error);
  }
  clearMockExamRecovery();
  return null;
}

export function clearMockExamRecovery(): void {
  try {
    localStorage.removeItem(MOCK_EXAM_RECOVERY_KEY);
  } catch (error) {
    console.warn('Could not clear the saved mock exam:', error);
  }
}
