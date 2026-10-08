import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { AppState, UserProfile } from '../types';
import { normalizeAppState } from './storage';
import { getInitialAppState } from '../data/sampleData';
import { apiFetch } from './api';

const LEGACY_STORAGE_KEYS = ['fmge_study_tracker_v2', 'fmge_study_tracker_state', 'fmge_tracker_state_v1'];

// Firestore metadata belongs to the document, not to the React AppState. Keeping
// it out of comparisons prevents an acknowledgement snapshot from looking like a
// different user state solely because updatedAt changed.
function normalizeCloudState(data: Record<string, unknown>): AppState | null {
  const { userId: _userId, updatedAt: _updatedAt, ...state } = data;
  return normalizeAppState(state);
}

export function getUserStorageKey(uid: string): string {
  return `fmge_study_tracker_user_${uid}`;
}

export function loadUserLocalCache(uid: string): AppState | null {
  try {
    const raw = localStorage.getItem(getUserStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeAppState(parsed);
    }
  } catch (err) {
    console.error('Error loading local cache for user:', uid, err);
  }
  return null;
}

export function saveUserLocalCache(uid: string, state: AppState): void {
  try {
    localStorage.setItem(getUserStorageKey(uid), JSON.stringify(state));
  } catch (err) {
    console.error('Error saving local cache for user:', uid, err);
  }
}

export function clearUserLocalCache(uid: string): void {
  try {
    localStorage.removeItem(getUserStorageKey(uid));
  } catch (err) {
    console.error('Error clearing local cache for user:', uid, err);
  }
}

export function hasLegacyLocalData(): boolean {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const hasTopics = parsed.topicsState && Object.keys(parsed.topicsState).length > 0;
        const hasGTs = Array.isArray(parsed.grandTests) && parsed.grandTests.length > 0;
        const hasErrors = Array.isArray(parsed.errorNotebook) && parsed.errorNotebook.length > 0;
        if (hasTopics || hasGTs || hasErrors) {
          return true;
        }
      }
    }
  } catch (err) {
    console.error('Error checking legacy local data:', err);
  }
  return false;
}

export function getLegacyLocalData(): AppState | null {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeAppState(parsed);
        if (normalized) return normalized;
      }
    }
  } catch (err) {
    console.error('Error getting legacy local data:', err);
  }
  return null;
}

export function clearLegacyLocalData(): void {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error('Error clearing legacy local data:', err);
  }
}

// ----------------- POSTGRES CLOUD OPERATIONS -----------------

async function postgresJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  if (!response.ok) throw new Error(`Saved data request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export async function getUserProfileDoc(uid: string): Promise<UserProfile | null> {
  try {
    const result = await postgresJson<{ profile: UserProfile | null }>('/api/user/profile');
    if (result.profile) return result.profile;

    // One-time, non-destructive backfill: existing Firebase profiles are copied
    // into PostgreSQL the first time that user signs in after the migration.
    const legacySnap = await getDoc(doc(db, 'users', uid));
    if (legacySnap.exists()) {
      const legacyProfile = legacySnap.data() as UserProfile;
      const migrated = await postgresJson<{ profile: UserProfile }>('/api/user/profile/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: legacyProfile }),
      });
      return migrated.profile;
    }
  } catch (err) {
    console.error('Error fetching user profile from PostgreSQL:', err);
    throw err;
  }
  return null;
}

export async function createUserProfileDoc(
  user: User,
  initialData?: Partial<UserProfile>
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: user.uid,
    displayName: initialData?.displayName || user.displayName || user.email?.split('@')[0] || 'Doctor',
    email: user.email || '',
    photoURL: user.photoURL || null,
    examDate: initialData?.examDate || '2026-10-15',
    targetScore: initialData?.targetScore || 185,
    dailyHoursTarget: initialData?.dailyHoursTarget || 6,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    onboardingCompleted: initialData?.onboardingCompleted ?? false,
    onboardingVersion: initialData?.onboardingVersion,
    preparationStage: initialData?.preparationStage,
    studyPreferences: initialData?.studyPreferences,
    baselineScore: initialData?.baselineScore,
    baselineQuestions: initialData?.baselineQuestions,
    onboardingCompletedAt: initialData?.onboardingCompletedAt,
    profileUpdatedAt: initialData?.profileUpdatedAt,
    preferences: {
      coachingSource: initialData?.preferences?.coachingSource || 'Marrow / Prepladder',
      primaryPlatform: initialData?.preferences?.primaryPlatform || 'Marrow',
      theme: 'calm-teal',
      notificationsEnabled: true,
      ...initialData?.preferences,
    },
  };

  try {
    await postgresJson('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return profile;
  } catch (err) {
    console.error('Error creating user profile in PostgreSQL:', err);
    throw err;
  }
}

export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await postgresJson('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, lastActiveAt: new Date().toISOString() }),
    });
  } catch (err) {
    console.error('Error updating user profile in PostgreSQL:', err);
    throw err;
  }
}

export async function getUserStateFromCloud(uid: string): Promise<AppState | null> {
  try {
    const result = await postgresJson<{ state: Record<string, unknown> | null }>('/api/user/state');
    if (result.state) return normalizeCloudState(result.state);

    // Keep existing Firebase data intact while copying it into PostgreSQL.
    const legacySnap = await getDoc(doc(db, 'userData', uid));
    if (legacySnap.exists()) {
      const legacyState = normalizeCloudState(legacySnap.data());
      if (legacyState) {
        const migrated = await postgresJson<{ state: Record<string, unknown> }>('/api/user/state/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: legacyState }),
        });
        const normalized = normalizeCloudState(migrated.state);
        if (normalized) {
          saveUserLocalCache(uid, normalized);
          return normalized;
        }
        return legacyState;
      }
    }
  } catch (err) {
    console.error('Error loading user state from PostgreSQL:', err);
    throw err;
  }
  return null;
}

export async function saveUserStateToCloud(uid: string, state: AppState): Promise<void> {
  try {
    const sanitizedState = JSON.parse(JSON.stringify(state));
    await postgresJson('/api/user/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: sanitizedState }),
    });
    // Also save in local storage cache for instant offline read
    saveUserLocalCache(uid, state);
  } catch (err) {
    console.error('Error saving user state to PostgreSQL:', err);
    throw err;
  }
}

export function subscribeToUserState(
  uid: string,
  onUpdate: (cloudState: AppState) => void,
  onError?: (err: Error) => void
): () => void {
  let active = true;
  let lastSerialized = '';
  const poll = async () => {
    try {
      const result = await postgresJson<{ state: Record<string, unknown> | null }>('/api/user/state');
      const normalized = result.state ? normalizeCloudState(result.state) : null;
      if (active && normalized) {
        const serialized = JSON.stringify(normalized);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          onUpdate(normalized);
        }
      }
    } catch (err) {
      console.warn('PostgreSQL sync polling failed:', err);
      if (active && onError) onError(err instanceof Error ? err : new Error('PostgreSQL sync failed.'));
    }
  };
  void poll();
  const timer = window.setInterval(() => void poll(), 5000);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}

export function getPendingQueueKey(uid: string): string {
  return `fmge_pending_sync_queue_${uid}`;
}

export function savePendingOfflineWrite(uid: string, state: AppState): void {
  try {
    localStorage.setItem(getPendingQueueKey(uid), JSON.stringify(state));
  } catch (err) {
    console.error('Error saving pending offline write:', err);
  }
}

export function getPendingOfflineWrite(uid: string): AppState | null {
  try {
    const raw = localStorage.getItem(getPendingQueueKey(uid));
    if (raw) {
      return normalizeAppState(JSON.parse(raw));
    }
  } catch (err) {
    console.error('Error getting pending offline write:', err);
  }
  return null;
}

export function clearPendingOfflineWrite(uid: string): void {
  try {
    localStorage.removeItem(getPendingQueueKey(uid));
  } catch (err) {
    console.error('Error clearing pending offline write:', err);
  }
}

/**
 * Resolves conflict between local state and cloud state deterministically.
 * Merges distinct MCQ attempts, Error Vault items, and retains the latest updates.
 */
export function resolveCloudConflict(localState: AppState, cloudState: AppState): AppState {
  const localAttempts = localState.mcqAttempts || [];
  const cloudAttempts = cloudState.mcqAttempts || [];

  // Merge attempts by unique ID or questionId + timestamp
  const attemptMap = new Map<string, typeof localAttempts[0]>();
  cloudAttempts.forEach((a) => attemptMap.set(a.id || `${a.questionId}_${a.timestamp}`, a));
  localAttempts.forEach((a) => attemptMap.set(a.id || `${a.questionId}_${a.timestamp}`, a));
  const mergedAttempts = Array.from(attemptMap.values());

  // Merge Error Vault items
  const errorMap = new Map<string, typeof localState.errorNotebook[0]>();
  (cloudState.errorNotebook || []).forEach((e) => errorMap.set(e.id, e));
  (localState.errorNotebook || []).forEach((e) => errorMap.set(e.id, e));
  const mergedErrors = Array.from(errorMap.values());

  // Merge Grand Tests
  const gtMap = new Map<string, typeof localState.grandTests[0]>();
  (cloudState.grandTests || []).forEach((gt) => gtMap.set(gt.id, gt));
  (localState.grandTests || []).forEach((gt) => gtMap.set(gt.id, gt));
  const mergedGTs = Array.from(gtMap.values());

  // Topics State: take the union with highest completion/revision count
  const mergedTopicsState: AppState['topicsState'] = { ...(cloudState.topicsState || {}) };
  for (const [tId, lTopic] of Object.entries(localState.topicsState || {})) {
    if (!mergedTopicsState[tId]) {
      mergedTopicsState[tId] = lTopic;
    } else {
      mergedTopicsState[tId] = {
        ...mergedTopicsState[tId],
        ...lTopic,
        notesDone: mergedTopicsState[tId].notesDone || lTopic.notesDone,
        qBankDone: mergedTopicsState[tId].qBankDone || lTopic.qBankDone,
        r1Done: mergedTopicsState[tId].r1Done || lTopic.r1Done,
        r2Done: mergedTopicsState[tId].r2Done || lTopic.r2Done,
        r3Done: mergedTopicsState[tId].r3Done || lTopic.r3Done,
        isBookmarked: mergedTopicsState[tId].isBookmarked || lTopic.isBookmarked,
        personalNotes: lTopic.personalNotes || mergedTopicsState[tId].personalNotes,
      };
    }
  }

  return {
    ...cloudState,
    settings: {
      ...cloudState.settings,
      ...localState.settings,
    },
    mcqAttempts: mergedAttempts,
    errorNotebook: mergedErrors,
    grandTests: mergedGTs,
    topicsState: mergedTopicsState,
    studyLogs: { ...(cloudState.studyLogs || {}), ...(localState.studyLogs || {}) },
    completedMissionIds: { ...(cloudState.completedMissionIds || {}), ...(localState.completedMissionIds || {}) },
    bookmarkedPearlIds: Array.from(new Set([...(cloudState.bookmarkedPearlIds || []), ...(localState.bookmarkedPearlIds || [])])),
    customPearls: [...(cloudState.customPearls || []), ...(localState.customPearls || [])].filter(
      (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
    ),
    telegramQuestions: [...(cloudState.telegramQuestions || []), ...(localState.telegramQuestions || [])].filter(
      (q, idx, arr) => arr.findIndex((x) => x.id === q.id) === idx
    ),
  };
}

export async function resetStudyProgressInCloud(uid: string, currentState: AppState): Promise<AppState> {
  const fresh = getInitialAppState();
  const resetState: AppState = {
    ...fresh,
    settings: currentState.settings,
    bookmarkedPearlIds: currentState.bookmarkedPearlIds,
    customPearls: currentState.customPearls,
    telegramChannels: currentState.telegramChannels,
    telegramQuestions: currentState.telegramQuestions,
    telegramAnnouncements: currentState.telegramAnnouncements,
  };

  await saveUserStateToCloud(uid, resetState);
  clearPendingOfflineWrite(uid);
  return resetState;
}

export async function resetFullAccountInCloud(uid: string): Promise<AppState> {
  const blankState = getInitialAppState();
  await saveUserStateToCloud(uid, blankState);
  clearUserLocalCache(uid);
  clearPendingOfflineWrite(uid);
  return blankState;
}
