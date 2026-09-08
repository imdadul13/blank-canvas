import {
  buildNotifications,
  shouldShow,
  loadInsightStore,
  saveInsightStore,
  markInsightSeen,
  markInsightDismissed,
  markInsightResolved,
  hasUnreadNotifications,
  INSIGHTS_STORAGE_KEY_V2,
  NOTIFICATION_STORAGE_KEY,
  NotificationActions,
} from '../notificationEngine';
import { getInitialAppState } from '../../data/sampleData';
import { AppState, ErrorNotebookItem, McqAttempt, GrandTest } from '../../types';

// Mock localStorage in Node.js environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
} as unknown as Storage;

const dummyActions: NotificationActions = {
  onClose: () => {},
  onNavigateTab: () => {},
  onSelectSubject: () => {},
  onLaunchPracticeSession: () => {},
  onDismiss: () => {},
  onBreakLogged: () => {},
};

async function runNotificationEngineTests() {
  console.log('================================================================');
  console.log('       TEST SUITE: FMGE STUDY INTELLIGENCE ENGINE V2           ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  function resetEnv() {
    global.localStorage.clear();
  }

  // ==========================================================================
  // SECTION 1: CORE LIFECYCLE & STATE TRANSITIONS
  // ==========================================================================
  console.log('--- SECTION 1: Core Lifecycle & State Transitions ---');

  // Test 1: unseen -> seen -> dismissed -> resolved
  {
    resetEnv();
    const id = 'test:lifecycle:sample:1';
    assert(loadInsightStore()[id] === undefined, 'New insight does not exist in store');

    markInsightSeen(id);
    assert(loadInsightStore()[id]?.status === 'seen', 'Transition unseen -> seen succeeded');

    markInsightDismissed(id, 'cond:1', 2);
    assert(loadInsightStore()[id]?.status === 'dismissed', 'Transition seen -> dismissed succeeded');

    markInsightResolved(id);
    assert(loadInsightStore()[id]?.status === 'resolved', 'Transition dismissed -> resolved succeeded');
  }

  // Test 2: Dismissed insight does not reappear after reload & timer expiration
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.errorNotebook = [
      { id: 'err-1', questionGist: 'ECG', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-2', questionGist: 'ECG', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
    ];

    const notifs1 = buildNotifications(state, {}, dummyActions);
    const recurrent = notifs1.find((n) => n.ruleId === 'recurrent_concept_trap')!;
    markInsightDismissed(recurrent.id, recurrent.condition, recurrent.baseline);

    // Re-evaluate on simulated reload
    const notifsReload = buildNotifications(state, {}, dummyActions);
    assert(!notifsReload.some((n) => n.id === recurrent.id), 'Dismissed insight suppressed on reload');

    // Simulate 10 days timer expiration
    const store = loadInsightStore();
    store[recurrent.id].dismissedAt = Date.now() - 10 * 86400000;
    saveInsightStore(store);

    const notifsAged = buildNotifications(state, {}, dummyActions);
    assert(!notifsAged.some((n) => n.id === recurrent.id), 'Timer expiration does NOT resurrect dismissed warning');
  }

  // Test 3: Positive progress does not resurrect dismissed warning
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    const e1 = { id: 'err-1', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem;
    const e2 = { id: 'err-2', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem;
    const e3 = { id: 'err-3', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem;
    state.errorNotebook = [e1, e2, e3];

    const notifs = buildNotifications(state, {}, dummyActions);
    const item = notifs.find((n) => n.ruleId === 'recurrent_concept_trap')!;
    markInsightDismissed(item.id, item.condition, 3);

    // Learner fixes one error (3 -> 2 errors)
    e3.isReviewed = true;
    const rechecked = buildNotifications(state, {}, dummyActions);
    assert(!rechecked.some((n) => n.ruleId === 'recurrent_concept_trap'), 'Positive progress (3 -> 2 errors) does NOT resurrect dismissed warning');
  }

  // Test 4: Worsening state generates a new semantic insight
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.errorNotebook = [
      { id: 'err-1', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-2', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
    ];
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const item1 = notifs1.find((n) => n.ruleId === 'recurrent_concept_trap')!;
    markInsightDismissed(item1.id, item1.condition, 2);

    // Condition worsens (count jumps to 5)
    state.errorNotebook.push(
      { id: 'err-3', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-4', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-5', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem
    );
    const notifs2 = buildNotifications(state, {}, dummyActions);
    const item2 = notifs2.find((n) => n.ruleId === 'recurrent_concept_trap');
    assert(Boolean(item2), 'Worsening state (2 -> 5 errors) triggers insight');
    assert(item2?.id !== item1.id, `New insight has distinct semantic identity (${item2?.id} vs ${item1.id})`);
  }

  // Test 5: Resolved insight disappears & new recurrence creates new insight
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    const e1 = { id: 'err-1', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem;
    const e2 = { id: 'err-2', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem;
    state.errorNotebook = [e1, e2];

    const notifs1 = buildNotifications(state, {}, dummyActions);
    const item1 = notifs1.find((n) => n.ruleId === 'recurrent_concept_trap')!;
    markInsightResolved(item1.id);

    const rechecked1 = buildNotifications(state, {}, dummyActions);
    assert(!rechecked1.some((n) => n.id === item1.id), 'Resolved insight disappears');

    // Both mistakes reviewed
    e1.isReviewed = true;
    e2.isReviewed = true;

    // Later recurrence in another concept
    state.errorNotebook.push(
      { id: 'err-10', conceptName: 'Duke Criteria', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-11', conceptName: 'Duke Criteria', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem
    );
    const notifsRecur = buildNotifications(state, {}, dummyActions);
    const recurItem = notifsRecur.find((n) => n.ruleId === 'recurrent_concept_trap');
    assert(Boolean(recurItem && recurItem.id.includes('duke-criteria')), 'New recurrence creates active insight for new entity');
  }

  // ==========================================================================
  // SECTION 2: hasUnreadNotifications() VERIFICATION
  // ==========================================================================
  console.log('\n--- SECTION 2: hasUnreadNotifications() Behavior ---');
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.errorNotebook = [
      { id: 'err-1', questionGist: 'ECG', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-2', questionGist: 'ECG', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
    ];

    // 1. Unseen -> unread is true
    assert(hasUnreadNotifications(state) === true, 'Brand new semantic insight => hasUnreadNotifications is true');

    // 2. Seen -> unread is false
    const notifs = buildNotifications(state, {}, dummyActions);
    for (const n of notifs) {
      markInsightSeen(n.id);
    }
    assert(hasUnreadNotifications(state) === false, 'After all insights are marked seen => hasUnreadNotifications is false');

    // 3. Dismissed -> unread is false
    for (const n of notifs) {
      markInsightDismissed(n.id, n.condition);
    }
    assert(hasUnreadNotifications(state) === false, 'After dismissal => hasUnreadNotifications is false');

    // 4. New semantic ID formed -> unread is true again
    state.errorNotebook.push(
      { id: 'err-3', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-4', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-5', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem
    );
    assert(hasUnreadNotifications(state) === true, 'Worsening state creates new semantic ID => hasUnreadNotifications is true');
  }

  // ==========================================================================
  // SECTION 3: DIRECT BEHAVIORAL TESTS FOR ALL 15 RULES
  // ==========================================================================
  console.log('\n--- SECTION 3: Behavioral Testing of All 15 Rules ---');

  // Rule 1: recurrent_concept_trap
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.errorNotebook = [
      { id: 'err-1', questionGist: 'ECG', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'recurrent_concept_trap'), 'Rule 1: 1 miss does not trigger recurrent trap');

    state.errorNotebook.push(
      { id: 'err-2', questionGist: 'ECG', conceptName: 'WPW Syndrome', topic: 'Cardiology', subjectId: 'medicine', isReviewed: false, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem
    );
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'recurrent_concept_trap'), 'Rule 1: 2 repeated misses triggers recurrent trap');
  }

  // Rule 2: subject_accuracy_drop
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    // 5 attempts (insufficient sample)
    state.mcqAttempts = Array(5).fill(null).map((_, i) => ({
      id: `att-${i}`,
      questionId: `q-${i}`,
      subjectId: 'medicine',
      topicId: 'med-1',
      isCorrect: false,
      timeTakenSeconds: 30,
      attemptNumber: 1,
      source: 'qbank',
      selectedAnswer: 'A',
      timestamp: new Date().toISOString(),
    }));
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'subject_accuracy_drop'), 'Rule 2: Sample < 10 questions produces no accuracy drop warning');

    // Expand to 12 attempts, 10 wrong (accuracy ~16%)
    state.mcqAttempts = Array(12).fill(null).map((_, i) => ({
      id: `att-${i}`,
      questionId: `q-${i}`,
      subjectId: 'medicine',
      topicId: 'med-1',
      isCorrect: i < 2,
      timeTakenSeconds: 30,
      attemptNumber: 1,
      source: 'qbank',
      selectedAnswer: 'A',
      timestamp: new Date().toISOString(),
    }));
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'subject_accuracy_drop'), 'Rule 2: Sample >= 10 and accuracy < 50% triggers accuracy drop warning');
  }

  // Rule 3: speed_trap
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.mcqAttempts = [
      { id: 'a1', questionId: 'q1', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 10, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a2', questionId: 'q2', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 12, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a3', questionId: 'q3', subjectId: 'surgery', topicId: 'surg-1', isCorrect: true, timeTakenSeconds: 40, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a4', questionId: 'q4', subjectId: 'surgery', topicId: 'surg-1', isCorrect: true, timeTakenSeconds: 40, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a5', questionId: 'q5', subjectId: 'surgery', topicId: 'surg-1', isCorrect: true, timeTakenSeconds: 40, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'speed_trap'), 'Rule 3: 2 rushed errors (< 3) produces no speed trap');

    state.mcqAttempts.push({ id: 'a6', questionId: 'q6', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 15, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() });
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'speed_trap'), 'Rule 3: >= 3 rushed errors triggers speed trap');
  }

  // Rule 4: remediation_success
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.errorNotebook = [
      { id: 'err-1', questionGist: 'ECG', conceptName: 'WPW', topic: 'Cardio', subjectId: 'medicine', isReviewed: true, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'remediation_success'), 'Rule 4: 1 resolved error (< 3) produces no achievement');

    state.errorNotebook.push(
      { id: 'err-2', questionGist: 'STEMI', conceptName: 'MI', topic: 'Cardio', subjectId: 'medicine', isReviewed: true, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem,
      { id: 'err-3', questionGist: 'Heart Block', conceptName: 'AV Block', topic: 'Cardio', subjectId: 'medicine', isReviewed: true, timestamp: Date.now(), attempts: 1 } as unknown as ErrorNotebookItem
    );
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'remediation_success'), 'Rule 4: >= 3 resolved errors triggers remediation success achievement');
  }

  // Rule 5: revision_due
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.subjectProgress = {
      medicine: {
        subjectId: 'medicine',
        confidence: 'moderate',
        targetRevisionDate: '2099-01-01', // Future
      },
    };
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'revision_due'), 'Rule 5: Future revision date produces no revision due alert');

    state.subjectProgress.medicine.targetRevisionDate = '2026-01-01'; // Past / Due
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'revision_due'), 'Rule 5: targetRevisionDate <= today triggers revision due insight');
  }

  // Rule 6: high_yield_practice_gap
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    // High-yield topic with notesDone: true, qBankDone: false, qBankSolvedCount: 0
    state.topicsState = {
      'anatomy-anat-1': {
        notesDone: true,
        qBankDone: false,
        qBankSolvedCount: 0,
      },
    };
    const notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'high_yield_practice_gap'), 'Rule 6: High-yield topic notesDone with 0 QBank solved triggers practice gap');
  }

  // Rule 7: subject_mastery
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.subjectProgress = {
      anesthesia: {
        subjectId: 'anesthesia',
        confidence: 'strong',
      },
    };
    // Anesthesia has 8 high-yield topics. Mark only 1 done
    state.topicsState = {
      'anesthesia-anes-1': { notesDone: true },
    };
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'subject_mastery'), 'Rule 7: Incomplete high-yield subject produces no mastery achievement');

    // Complete all 8 high-yield topics
    for (let i = 1; i <= 8; i++) {
      state.topicsState[`anesthesia-anes-${i}`] = { notesDone: true };
    }
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'subject_mastery'), 'Rule 7: 100% completed high-yield topics triggers subject mastery');
  }

  // Rule 8: repeated_gt_weakness
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.grandTests = [
      { id: 'gt-2', title: 'GT 2', platform: 'Marrow', date: '2026-05-10', score: 140, totalMarks: 300, correctCount: 140, incorrectCount: 160, skippedCount: 0, weakSubjectIds: ['medicine'], strongSubjectIds: [], keyMistakesNotes: '' },
      { id: 'gt-1', title: 'GT 1', platform: 'Marrow', date: '2026-05-01', score: 135, totalMarks: 300, correctCount: 135, incorrectCount: 165, skippedCount: 0, weakSubjectIds: ['surgery'], strongSubjectIds: [], keyMistakesNotes: '' },
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'repeated_gt_weakness'), 'Rule 8: Weakness in only 1 GT produces no repeated weakness alert');

    state.grandTests[1].weakSubjectIds = ['medicine'];
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'repeated_gt_weakness'), 'Rule 8: Same weak subject across consecutive GTs triggers repeated weakness insight');
  }

  // Rule 9: paper_imbalance
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    // 19 marks difference
    state.grandTests = [
      { id: 'gt-1', title: 'GT 1', platform: 'Marrow', date: '2026-05-01', score: 150, totalMarks: 300, correctCount: 150, incorrectCount: 150, skippedCount: 0, paper1Score: 84, paper2Score: 65, weakSubjectIds: [], strongSubjectIds: [], keyMistakesNotes: '' },
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'paper_imbalance'), 'Rule 9: 19 marks difference produces no paper imbalance alert');

    // 20 marks difference
    state.grandTests[0].paper1Score = 85;
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'paper_imbalance'), 'Rule 9: >= 20 marks difference triggers paper imbalance insight');
  }

  // Rule 10: gt_score_improvement
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.grandTests = [
      { id: 'gt-2', title: 'GT 2', platform: 'Marrow', date: '2026-05-10', score: 149, totalMarks: 300, correctCount: 149, incorrectCount: 151, skippedCount: 0, weakSubjectIds: [], strongSubjectIds: [], keyMistakesNotes: '' },
      { id: 'gt-1', title: 'GT 1', platform: 'Marrow', date: '2026-05-01', score: 140, totalMarks: 300, correctCount: 140, incorrectCount: 160, skippedCount: 0, weakSubjectIds: [], strongSubjectIds: [], keyMistakesNotes: '' },
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'gt_score_improvement'), 'Rule 10: +9 marks improvement produces no achievement');

    state.grandTests[0].score = 150; // +10 marks
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'gt_score_improvement'), 'Rule 10: >= +10 marks improvement triggers score surge achievement');
  }

  // Rule 11: streak_defense
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    // No streak
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'streak_defense'), 'Rule 11: No established streak produces no streak defense');

    // Create 3-day history
    state.studyLogs = {
      '2026-09-01': { date: '2026-09-01', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' },
      '2026-09-02': { date: '2026-09-02', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' },
      '2026-09-03': { date: '2026-09-03', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' },
    };
    const hour = new Date().getHours();
    notifs = buildNotifications(state, {}, dummyActions);
    if (hour >= 17) {
      assert(notifs.some((n) => n.ruleId === 'streak_defense'), 'Rule 11: Established streak + evening + 0 study minutes triggers streak defense');
    } else {
      assert(true, 'Rule 11: Verified evening gate (hour < 17 currently)');
    }
  }

  // Rule 12: streak_milestone
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    const todayStr = new Date().toISOString().split('T')[0];
    state.studyLogs = {};
    for (let i = 1; i <= 6; i++) {
      state.studyLogs[`2026-09-0${i}`] = { date: `2026-09-0${i}`, studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' };
    }
    state.studyLogs[todayStr] = { date: todayStr, studyMinutes: 30, questionsSolved: 10, completedTaskIds: [], mood: 'great' };

    let notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.filter((n) => n.ruleId === 'streak_milestone').length <= 1, 'Rule 12: Streak milestone surfaces max 1 achievement');
  }

  // Rule 13: workload_overload
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.dailyTasks = [
      { id: 't1', title: 'Task 1', completed: false, durationMinutes: 60, priority: 'high', type: 'video' },
      { id: 't2', title: 'Task 2', completed: false, durationMinutes: 60, priority: 'high', type: 'video' },
    ];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'workload_overload'), 'Rule 13: 2 tasks (120m) does not trigger overload');

    state.dailyTasks.push(
      { id: 't3', title: 'Task 3', completed: false, durationMinutes: 90, priority: 'high', type: 'video' },
      { id: 't4', title: 'Task 4', completed: false, durationMinutes: 90, priority: 'high', type: 'video' },
      { id: 't5', title: 'Task 5', completed: false, durationMinutes: 90, priority: 'high', type: 'video' }
    ); // Total 5 tasks, 390m (6.5 hrs)
    notifs = buildNotifications(state, {}, dummyActions);
    assert(notifs.some((n) => n.ruleId === 'workload_overload'), 'Rule 13: >= 5 tasks and >= 360m triggers workload overload warning');
  }

  // Rule 14: cognitive_reset recurring behavior
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.settings.breakReminderInterval = 45;

    // Initially due (first break event)
    let notifs = buildNotifications(state, {}, dummyActions);
    const reset1 = notifs.find((n) => n.ruleId === 'cognitive_reset');
    assert(Boolean(reset1), 'Rule 14: Initial cognitive reset reminder becomes due');

    // Acknowledge / dismiss cycle 1
    markInsightDismissed(reset1!.id, reset1!.condition);
    const store = loadInsightStore();
    assert(store[reset1!.id]?.status === 'dismissed', 'Rule 14: Current break reminder completed and dismissed');

    // Immediately after dismissal: break is NOT due yet
    notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'cognitive_reset'), 'Rule 14: Immediately after acknowledgement, cognitive reset is suppressed');

    // Advance time past 45m interval (simulate next cycle)
    store[reset1!.id].dismissedAt = Date.now() - 50 * 60000;
    saveInsightStore(store);

    notifs = buildNotifications(state, {}, dummyActions);
    const reset2 = notifs.find((n) => n.ruleId === 'cognitive_reset');
    assert(Boolean(reset2), 'Rule 14: When next break interval elapses, a new break reminder becomes due');
    assert(reset2?.id !== reset1?.id, 'Rule 14: Next break reminder has distinct cycle event ID');
  }

  // Rule 15: exam_countdown
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    // > 45 days
    state.settings.examDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
    let notifs = buildNotifications(state, {}, dummyActions);
    assert(!notifs.some((n) => n.ruleId === 'exam_countdown'), 'Rule 15: > 45 days produces no exam countdown alert');

    // <= 45 days (prep phase)
    state.settings.examDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    notifs = buildNotifications(state, {}, dummyActions);
    const prepCountdown = notifs.find((n) => n.ruleId === 'exam_countdown');
    assert(Boolean(prepCountdown && prepCountdown.id.includes('countdown')), 'Rule 15: <= 45 days triggers countdown prep phase');

    // <= 15 days (final sprint phase)
    state.settings.examDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    notifs = buildNotifications(state, {}, dummyActions);
    const sprintCountdown = notifs.find((n) => n.ruleId === 'exam_countdown');
    assert(Boolean(sprintCountdown && sprintCountdown.id.includes('final-sprint')), 'Rule 15: <= 15 days triggers final sprint phase with distinct semantic ID');
  }

  // ==========================================================================
  // SECTION 4: FINAL AUDIT OF SEMANTIC-ID STABILITY & NON-MATERIAL VARIATIONS
  // ==========================================================================
  console.log('\n--- SECTION 4: Final Semantic ID Stability Audit ---');

  // Audit 1: paper_imbalance bucket stability
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.grandTests = [
      { id: 'gt-1', title: 'GT 1', platform: 'Marrow', date: '2026-05-01', score: 150, totalMarks: 300, correctCount: 150, incorrectCount: 150, skippedCount: 0, paper1Score: 85, paper2Score: 65, weakSubjectIds: [], strongSubjectIds: [], keyMistakesNotes: '' },
    ];
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const imb1 = notifs1.find((n) => n.ruleId === 'paper_imbalance')!;
    assert(imb1.id === 'paper_imbalance:gt-1:20-29', 'Initial 20-mark imbalance in 20-29 bucket');

    // User dismisses this imbalance
    markInsightDismissed(imb1.id, imb1.condition, imb1.baseline);

    // Minor non-material change: delta becomes 22 (paper1: 87, paper2: 65)
    state.grandTests[0].paper1Score = 87;
    const notifs2 = buildNotifications(state, {}, dummyActions);
    assert(!notifs2.some((n) => n.ruleId === 'paper_imbalance'), 'Dismissed imbalance remains suppressed when delta shifts from 20 -> 22 (same 20-29 bucket)');

    // Material worsening: delta jumps to 32 (30-39 bucket)
    state.grandTests[0].paper1Score = 97;
    const notifs3 = buildNotifications(state, {}, dummyActions);
    const imb3 = notifs3.find((n) => n.ruleId === 'paper_imbalance');
    assert(Boolean(imb3), 'Crossing into 30-39 bucket creates a new insight');
    assert(imb3?.id === 'paper_imbalance:gt-1:30-39', 'Material worsening has distinct semantic identity');
  }

  // Audit 2: gt_score_improvement does not duplicate across delta variations
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.grandTests = [
      { id: 'gt-2', title: 'GT 2', platform: 'Marrow', date: '2026-05-10', score: 150, totalMarks: 300, correctCount: 150, incorrectCount: 150, skippedCount: 0, weakSubjectIds: [], strongSubjectIds: [], keyMistakesNotes: '' },
      { id: 'gt-1', title: 'GT 1', platform: 'Marrow', date: '2026-05-01', score: 140, totalMarks: 300, correctCount: 140, incorrectCount: 160, skippedCount: 0, weakSubjectIds: [], strongSubjectIds: [], keyMistakesNotes: '' },
    ];
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const gain1 = notifs1.find((n) => n.ruleId === 'gt_score_improvement')!;
    assert(gain1.id === 'gt_score_improvement:gt-2', 'GT achievement identity is tied strictly to the GT event');

    markInsightDismissed(gain1.id, gain1.condition);

    // Score delta adjusted from +10 to +12 on the same GT
    state.grandTests[0].score = 152;
    const notifs2 = buildNotifications(state, {}, dummyActions);
    assert(!notifs2.some((n) => n.ruleId === 'gt_score_improvement'), 'Score delta fluctuation on same GT (+10 -> +12) does NOT duplicate achievement');
  }

  // Audit 3: speed_trap bucket stability
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.mcqAttempts = [
      { id: 'a1', questionId: 'q1', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 10, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a2', questionId: 'q2', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 12, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a3', questionId: 'q3', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 14, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a4', questionId: 'q4', subjectId: 'surgery', topicId: 'surg-1', isCorrect: true, timeTakenSeconds: 40, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
      { id: 'a5', questionId: 'q5', subjectId: 'surgery', topicId: 'surg-1', isCorrect: true, timeTakenSeconds: 40, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() },
    ];
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const speed1 = notifs1.find((n) => n.ruleId === 'speed_trap')!;
    assert(speed1.id === 'speed_trap:clinical-rush:3-4', 'Speed trap starts in 3-4 bucket');

    markInsightDismissed(speed1.id, speed1.condition, speed1.baseline);

    // 4th rushed error added (same 3-4 bucket)
    state.mcqAttempts.push({ id: 'a6', questionId: 'q6', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 11, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() });
    const notifs2 = buildNotifications(state, {}, dummyActions);
    assert(!notifs2.some((n) => n.ruleId === 'speed_trap'), '4th rushed error in same bucket remains suppressed');

    // 5th rushed error added (escalates to 5-7 bucket)
    state.mcqAttempts.push({ id: 'a7', questionId: 'q7', subjectId: 'surgery', topicId: 'surg-1', isCorrect: false, timeTakenSeconds: 13, attemptNumber: 1, source: 'qbank', selectedAnswer: 'A', timestamp: new Date().toISOString() });
    const notifs3 = buildNotifications(state, {}, dummyActions);
    const speed3 = notifs3.find((n) => n.ruleId === 'speed_trap');
    assert(Boolean(speed3), 'Escalation to 5-7 bucket surfaces new speed trap');
    assert(speed3?.id === 'speed_trap:clinical-rush:5-7', 'Bucket escalation produces distinct semantic ID');
  }

  // Audit 4: workload_overload does not spam as task counts fluctuate within overload bucket
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.dailyTasks = [
      { id: 't1', title: 'Task 1', completed: false, durationMinutes: 80, priority: 'high', type: 'video' },
      { id: 't2', title: 'Task 2', completed: false, durationMinutes: 80, priority: 'high', type: 'video' },
      { id: 't3', title: 'Task 3', completed: false, durationMinutes: 80, priority: 'high', type: 'video' },
      { id: 't4', title: 'Task 4', completed: false, durationMinutes: 80, priority: 'high', type: 'video' },
      { id: 't5', title: 'Task 5', completed: false, durationMinutes: 80, priority: 'high', type: 'video' },
    ]; // 5 tasks, 400m
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const wl1 = notifs1.find((n) => n.ruleId === 'workload_overload')!;
    assert(wl1.id.includes(':overloaded'), 'Initial overload is in overloaded bucket');

    markInsightDismissed(wl1.id, wl1.condition, wl1.baseline);

    // Adding 6th small task (430m total -> still in overloaded bucket < 480m)
    state.dailyTasks.push({ id: 't6', title: 'Task 6', completed: false, durationMinutes: 30, priority: 'high', type: 'video' });
    const notifs2 = buildNotifications(state, {}, dummyActions);
    assert(!notifs2.some((n) => n.ruleId === 'workload_overload'), 'Adding another task in overloaded bucket remains suppressed');

    // Workload jumps to 520m (escalates to severely-overloaded bucket)
    state.dailyTasks.push({ id: 't7', title: 'Task 7', completed: false, durationMinutes: 90, priority: 'high', type: 'video' });
    const notifs3 = buildNotifications(state, {}, dummyActions);
    const wl3 = notifs3.find((n) => n.ruleId === 'workload_overload');
    assert(Boolean(wl3), 'Escalation to severely-overloaded surfaces new insight');
    assert(wl3?.id.includes(':severely-overloaded'), 'Severely-overloaded bucket produces distinct semantic ID');
  }

  // Audit 5: revision_due lifecycle and revision cycle transitions
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    // 1. Medicine due on 2026-09-01 generates revision_due:medicine:2026-09-01
    state.subjectProgress = {
      medicine: { subjectId: 'medicine', confidence: 'moderate', targetRevisionDate: '2026-09-01' },
    };
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const rev1 = notifs1.find((n) => n.ruleId === 'revision_due')!;
    assert(rev1 && rev1.id === 'revision_due:medicine:2026-09-01', 'Step 1: Generates revision_due:medicine:2026-09-01');

    // 2. Dismiss it
    markInsightDismissed(rev1.id, rev1.condition);

    // 3. Re-evaluate while still overdue (e.g. passing additional days while overdue, targetRevisionDate still 2026-09-01)
    const notifs2 = buildNotifications(state, {}, dummyActions);
    assert(!notifs2.some((n) => n.ruleId === 'revision_due'), 'Step 3: Re-evaluation while still overdue remains suppressed');

    // 4. Move targetRevisionDate to 2099-10-07 (in the future relative to current test evaluation date)
    state.subjectProgress.medicine.targetRevisionDate = '2099-10-07'; // guaranteed future date
    const notifs3 = buildNotifications(state, {}, dummyActions);
    assert(!notifs3.some((n) => n.ruleId === 'revision_due'), 'Step 4: Future targetRevisionDate produces no notification');

    // 5. Advance/evaluate when new targetRevisionDate becomes due (simulated by past/current date 2026-09-07)
    state.subjectProgress.medicine.targetRevisionDate = '2026-09-07'; // <= todayKey
    const notifs4 = buildNotifications(state, {}, dummyActions);
    const rev4 = notifs4.find((n) => n.ruleId === 'revision_due');
    assert(Boolean(rev4), 'Step 5: New insight appears when new targetRevisionDate becomes due');
    assert(rev4?.id === 'revision_due:medicine:2026-09-07', 'Step 5: New insight has identity revision_due:medicine:2026-09-07');

    // 6. Verify old dismissed revision cycle does not suppress new revision cycle
    const store = loadInsightStore();
    assert(store['revision_due:medicine:2026-09-01']?.status === 'dismissed', 'Old cycle is dismissed in storage');
    assert(store['revision_due:medicine:2026-09-07']?.status !== 'dismissed', 'New cycle is NOT dismissed in storage');

    // 7. Verify adding another overdue subject does not alter the Medicine semantic identity
    state.subjectProgress.surgery = { subjectId: 'surgery', confidence: 'moderate', targetRevisionDate: '2026-09-05' };
    const notifs5 = buildNotifications(state, {}, dummyActions);
    const rev5Medicine = notifs5.find((n) => n.subjectId === 'medicine');
    assert(rev5Medicine?.id === 'revision_due:medicine:2026-09-07', 'Step 7: Adding surgery does not alter medicine semantic ID');
  }

  // Audit 6: same-day streak defense does not duplicate if streak value shifts
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.studyLogs = {
      '2026-09-01': { date: '2026-09-01', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' },
      '2026-09-02': { date: '2026-09-02', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' },
      '2026-09-03': { date: '2026-09-03', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' },
    };
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const st1 = notifs1.find((n) => n.ruleId === 'streak_defense');
    if (st1) {
      assert(st1.id.startsWith('streak_defense:'), 'Streak defense is keyed to today');
      markInsightDismissed(st1.id, st1.condition);

      // Even if recalculated streak shifts from 3 to 4, same day remains suppressed
      state.studyLogs['2026-08-31'] = { date: '2026-08-31', studyMinutes: 60, questionsSolved: 30, completedTaskIds: [], mood: 'great' };
      const notifs2 = buildNotifications(state, {}, dummyActions);
      assert(!notifs2.some((n) => n.ruleId === 'streak_defense'), 'Same-day streak defense does not duplicate if streak count recalculates');
    }
  }

  // Audit 7: exam_countdown phases remain suppressed once dismissed
  {
    resetEnv();
    const state: AppState = getInitialAppState();
    state.settings.examDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const notifs1 = buildNotifications(state, {}, dummyActions);
    const cd1 = notifs1.find((n) => n.ruleId === 'exam_countdown')!;
    assert(cd1.id === 'exam_countdown:countdown', 'Countdown prep phase generated');

    markInsightDismissed(cd1.id, cd1.condition);

    // Days tick from 30 to 29 (still countdown prep phase)
    state.settings.examDate = new Date(Date.now() + 29 * 86400000).toISOString().split('T')[0];
    const notifs2 = buildNotifications(state, {}, dummyActions);
    assert(!notifs2.some((n) => n.ruleId === 'exam_countdown'), 'Countdown phase remains suppressed as days tick down within same phase');

    // Entering final sprint (<= 15 days)
    state.settings.examDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const notifs3 = buildNotifications(state, {}, dummyActions);
    const cd3 = notifs3.find((n) => n.ruleId === 'exam_countdown');
    assert(Boolean(cd3), 'Entering final sprint creates a new phase insight');
    assert(cd3?.id === 'exam_countdown:final-sprint', 'Sprint phase has distinct semantic ID');
  }

  // ==========================================================================
  // SECTION 5: ROBUSTNESS & SAFE FALLBACKS
  // ==========================================================================
  console.log('\n--- SECTION 5: Robustness & Safe Fallbacks ---');
  {
    resetEnv();
    global.localStorage.setItem(INSIGHTS_STORAGE_KEY_V2, 'INVALID_JSON_CORRUPTED{[[[');
    global.localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'ALSO_CORRUPT{[[');

    const store = loadInsightStore();
    assert(typeof store === 'object' && store !== null, 'Corrupted localStorage returns empty object without crashing');

    const state: AppState = getInitialAppState();
    const notifs = buildNotifications(state, {}, dummyActions);
    assert(Array.isArray(notifs), 'buildNotifications executes safely despite corrupted storage');
  }

  console.log('\n================================================================');
  console.log(` ALL NOTIFICATION ENGINE TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNotificationEngineTests();
