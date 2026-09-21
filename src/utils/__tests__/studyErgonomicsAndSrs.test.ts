import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextReview,
  isPearlDue,
  getDuePearls,
  addDaysToDate,
} from '../spacedRepetitionEngine';
import { speechEngine } from '../speechEngine';
import { ambientAudioEngine } from '../ambientAudioEngine';
import { MedicalPearl } from '../../types';

describe('Spaced Repetition & Study Ergonomics Engine Suite', () => {
  const samplePearl: MedicalPearl = {
    id: 'pearl-obg-1',
    subjectId: 'obg',
    title: 'Pritchard Regimen for Eclampsia',
    highYieldKey: 'Loading dose: 4g IV + 10g IM. Maintenance: 5g IM q4h.',
    explanation: 'Calcium gluconate 10% 10mL is the antidote for toxicity.',
    tags: ['Eclampsia', 'MgSO4', 'DOC'],
    isBookmarked: true,
  };

  it('calculates correct date addition helper', () => {
    assert.equal(addDaysToDate('2026-09-22', 1), '2026-09-23');
    assert.equal(addDaysToDate('2026-09-22', 7), '2026-09-29');
    assert.equal(addDaysToDate('2026-09-30', 2), '2026-10-02');
  });

  it('handles "Again" rating (memory lapse) by resetting repetitions and setting 1 day interval', () => {
    const trainedPearl: MedicalPearl = {
      ...samplePearl,
      srsRepetitions: 4,
      srsInterval: 14,
      srsEaseFactor: 2.5,
    };

    const result = calculateNextReview(trainedPearl, 'again', '2026-09-22');
    assert.equal(result.srsRepetitions, 0);
    assert.equal(result.srsInterval, 1);
    assert.equal(result.srsDueDate, '2026-09-23');
    assert.equal(result.srsEaseFactor, 2.3); // Decreased ease
  });

  it('handles "Good" rating progression (Day 1 -> Day 3 -> interval * ease)', () => {
    // 1st review
    const r1 = calculateNextReview(samplePearl, 'good', '2026-09-22');
    assert.equal(r1.srsRepetitions, 1);
    assert.equal(r1.srsInterval, 1);
    assert.equal(r1.srsDueDate, '2026-09-23');

    // 2nd review
    const pearlAfterR1: MedicalPearl = { ...samplePearl, ...r1 };
    const r2 = calculateNextReview(pearlAfterR1, 'good', '2026-09-23');
    assert.equal(r2.srsRepetitions, 2);
    assert.equal(r2.srsInterval, 3);
    assert.equal(r2.srsDueDate, '2026-09-26');

    // 3rd review
    const pearlAfterR2: MedicalPearl = { ...samplePearl, ...r2 };
    const r3 = calculateNextReview(pearlAfterR2, 'good', '2026-09-26');
    assert.equal(r3.srsRepetitions, 3);
    assert.equal(r3.srsInterval, Math.round(3 * 2.5)); // 8 days
  });

  it('handles "Easy" rating with accelerated intervals and ease boost', () => {
    const r1 = calculateNextReview(samplePearl, 'easy', '2026-09-22');
    assert.equal(r1.srsRepetitions, 1);
    assert.equal(r1.srsInterval, 4);
    assert.equal(r1.srsDueDate, '2026-09-26');
    assert.equal(r1.srsEaseFactor, 2.65);
  });

  it('filters due pearls accurately based on date comparison', () => {
    const pearls: MedicalPearl[] = [
      { ...samplePearl, id: 'p1', srsDueDate: '2026-09-20' }, // Overdue
      { ...samplePearl, id: 'p2', srsDueDate: '2026-09-22' }, // Due today
      { ...samplePearl, id: 'p3', srsDueDate: '2026-09-25' }, // Future
      { ...samplePearl, id: 'p4', isBookmarked: true, srsDueDate: undefined }, // New bookmarked
      { ...samplePearl, id: 'p5', isBookmarked: false, srsDueDate: undefined }, // Unsaved
    ];

    const dueToday = getDuePearls(pearls, '2026-09-22');
    assert.equal(dueToday.length, 3); // p1, p2, p4
    const ids = dueToday.map((p) => p.id);
    assert.ok(ids.includes('p1'));
    assert.ok(ids.includes('p2'));
    assert.ok(ids.includes('p4'));
    assert.ok(!ids.includes('p3'));
    assert.ok(!ids.includes('p5'));
  });

  it('speechEngine exposes correct API and methods', () => {
    assert.equal(typeof speechEngine.speak, 'function');
    assert.equal(typeof speechEngine.stop, 'function');
    assert.equal(typeof speechEngine.setRate, 'function');
    assert.equal(typeof speechEngine.subscribe, 'function');
    speechEngine.setRate(1.25);
    assert.equal(speechEngine.getRate(), 1.25);
  });

  it('ambientAudioEngine supports modes and volume management', () => {
    assert.equal(typeof ambientAudioEngine.start, 'function');
    assert.equal(typeof ambientAudioEngine.stop, 'function');
    assert.equal(typeof ambientAudioEngine.setVolume, 'function');
    ambientAudioEngine.setVolume(0.5);
    assert.equal(ambientAudioEngine.getVolume(), 0.5);
  });
});
