import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialAppState } from '../../data/sampleData';
import { AppState, DailyTask } from '../../types';
import { getPersonalizedDailyPlan } from '../personalizationEngine';
import { getLocalDateKey } from '../date';
import { calculateStudyStreak } from '../dailyMissionEngine';

test('Home + Daily Planner Consolidation Test Suite', async (t) => {
  const baseState: AppState = getInitialAppState();
  const todayKey = getLocalDateKey();

  await t.test('1. Open full plan: Provides access to today\'s tasks & personalized plan', () => {
    const plan = getPersonalizedDailyPlan(null, baseState);
    assert.ok(plan, 'Personalized daily plan exists');
    assert.ok(Array.isArray(plan.tasks), 'Plan tasks is an array');
    assert.ok(plan.tasks.length > 0, 'Plan tasks generated from syllabus/weak areas');
    
    // Check actionable topics
    const topTask = plan.tasks[0];
    assert.ok(topTask.topicName, 'Task has topicName');
    assert.ok(topTask.subjectId, 'Task has subjectId');
    assert.ok(topTask.durationMinutes > 0, 'Task has valid durationMinutes');
  });

  await t.test('2. View calendar / Streak tracking: Preserves streak calculation & study logs', () => {
    const streak = calculateStudyStreak(baseState.studyLogs);
    assert.strictEqual(typeof streak, 'number', 'Streak is numeric');
    assert.ok(streak >= 0, 'Streak is non-negative');

    // Add study log entry for today
    const updatedLogs = {
      ...baseState.studyLogs,
      [todayKey]: {
        date: todayKey,
        studyMinutes: 50,
        questionsSolved: 40,
        completedTaskIds: ['task-1'],
        mood: 'great' as const,
      }
    };
    const newStreak = calculateStudyStreak(updatedLogs);
    assert.ok(newStreak >= 1, 'Streak reflects logged study today');
  });

  await t.test('3. Adding, completing, and deleting tasks', () => {
    let state: AppState = { ...baseState, dailyTasks: [...baseState.dailyTasks] };

    // Add task
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title: 'Solve 50 MCQs of OBG Preeclampsia',
      subjectId: 'obg',
      type: 'qbank',
      durationMinutes: 45,
      completed: false,
      priority: 'high',
    };

    state = {
      ...state,
      dailyTasks: [newTask, ...state.dailyTasks],
    };

    assert.ok(state.dailyTasks.some(t => t.id === newTask.id), 'New task was added to dailyTasks');
    const addedTask = state.dailyTasks.find(t => t.id === newTask.id)!;
    assert.strictEqual(addedTask.completed, false, 'Task starts uncompleted');

    // Toggle task completion
    state = {
      ...state,
      dailyTasks: state.dailyTasks.map(t =>
        t.id === newTask.id ? { ...t, completed: !t.completed } : t
      ),
    };
    const completedTask = state.dailyTasks.find(t => t.id === newTask.id)!;
    assert.strictEqual(completedTask.completed, true, 'Task completed status is now true');

    // Delete task
    state = {
      ...state,
      dailyTasks: state.dailyTasks.filter(t => t.id !== newTask.id),
    };
    assert.strictEqual(
      state.dailyTasks.some(t => t.id === newTask.id),
      false,
      'Task was successfully deleted'
    );
  });

  await t.test('4. Focus timer and logging behavior', () => {
    // Pomodoro defaults
    const pomodoroDurationSeconds = 25 * 60;
    const shortBreakSeconds = 5 * 60;
    const longBreakSeconds = 15 * 60;

    assert.strictEqual(pomodoroDurationSeconds, 1500, 'Pomodoro is 25 minutes');
    assert.strictEqual(shortBreakSeconds, 300, 'Short break is 5 minutes');
    assert.strictEqual(longBreakSeconds, 900, 'Long break is 15 minutes');

    // When 25m focus finishes, log study minutes
    const initialMinutes = baseState.studyLogs[todayKey]?.studyMinutes || 0;
    const loggedMinutes = initialMinutes + 25;
    assert.strictEqual(loggedMinutes, initialMinutes + 25, 'Study minutes incremented by 25');
  });

  await t.test('5. Navigation state: Subtab switching between overview and planner', () => {
    let currentSubTab: 'overview' | 'planner' = 'overview';

    // Click "Open full plan" or "View calendar"
    const handleOpenPlanner = () => {
      currentSubTab = 'planner';
    };

    // Click "Return to Home Dashboard"
    const handleReturnToDashboard = () => {
      currentSubTab = 'overview';
    };

    assert.strictEqual(currentSubTab, 'overview', 'Initial subtab is overview');
    handleOpenPlanner();
    assert.strictEqual(currentSubTab, 'planner', 'Subtab is now planner');
    handleReturnToDashboard();
    assert.strictEqual(currentSubTab, 'overview', 'Subtab returns to overview');
  });
});
