import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getInitialAppState } from '../../data/sampleData';
import { notificationAllowedByPreferences } from '../notificationEngine';

describe('notification preferences', () => {
  it('keeps all reminder categories enabled by default', () => {
    const state = getInitialAppState();
    assert.equal(notificationAllowedByPreferences(state, { category: 'revision', ruleId: 'revision_due' }), true);
    assert.equal(notificationAllowedByPreferences(state, { category: 'focus', ruleId: 'streak_defense' }), true);
    assert.equal(notificationAllowedByPreferences(state, { category: 'exam', ruleId: 'exam_countdown' }), true);
  });

  it('suppresses only disabled reminder families', () => {
    const state = getInitialAppState();
    state.settings.revisionRemindersEnabled = false;
    state.settings.streakRemindersEnabled = false;
    state.settings.mockRemindersEnabled = false;

    assert.equal(notificationAllowedByPreferences(state, { category: 'revision', ruleId: 'revision_due' }), false);
    assert.equal(notificationAllowedByPreferences(state, { category: 'focus', ruleId: 'streak_defense' }), false);
    assert.equal(notificationAllowedByPreferences(state, { category: 'wellness', ruleId: 'streak_milestone' }), false);
    assert.equal(notificationAllowedByPreferences(state, { category: 'exam', ruleId: 'gt_baseline_needed' }), false);
    assert.equal(notificationAllowedByPreferences(state, { category: 'error', ruleId: 'recurrent_concept_trap' }), true);
    assert.equal(notificationAllowedByPreferences(state, { category: 'wellness', ruleId: 'cognitive_reset' }), true);
  });
});
