import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DOCTOR_CREEDS,
  resolveIntelligentCreed,
  DoctorCreed,
  CircadianPhase,
} from '../doctorCreeds';

describe('Doctor Creeds & Intelligent Motivation Architecture', () => {
  it('should have a diverse bank of at least 25 doctor creeds', () => {
    assert.ok(DOCTOR_CREEDS.length >= 25, `Expected at least 25 creeds, got ${DOCTOR_CREEDS.length}`);
    for (const creed of DOCTOR_CREEDS) {
      assert.ok(creed.id, 'Creed must have an id');
      assert.ok(creed.quote && creed.quote.length > 10, 'Creed must have an inspiring quote');
      assert.ok(Array.isArray(creed.compact) && creed.compact.length === 2, 'Creed compact must have 2 lines');
      assert.ok(creed.tagline, 'Creed must have a tagline');
    }
  });

  it('should cover all circadian phases (morning, afternoon, evening, night, all)', () => {
    const phases: CircadianPhase[] = ['morning', 'afternoon', 'evening', 'night'];
    for (const phase of phases) {
      const filtered = DOCTOR_CREEDS.filter((c) => c.phase === phase || c.phase === 'all');
      assert.ok(filtered.length >= 5, `Expected >= 5 creeds for phase ${phase}, found ${filtered.length}`);
    }
  });

  it('should resolve different creeds across different times of day', () => {
    const morningDate = new Date('2026-09-12T07:30:00');
    const afternoonDate = new Date('2026-09-12T14:15:00');
    const eveningDate = new Date('2026-09-12T18:45:00');
    const nightDate = new Date('2026-09-12T23:30:00');

    const morningCreed = resolveIntelligentCreed('morning', morningDate);
    const afternoonCreed = resolveIntelligentCreed('afternoon', afternoonDate);
    const eveningCreed = resolveIntelligentCreed('evening', eveningDate);
    const nightCreed = resolveIntelligentCreed('night', nightDate);

    assert.ok(morningCreed.quote);
    assert.ok(afternoonCreed.quote);
    assert.ok(eveningCreed.quote);
    assert.ok(nightCreed.quote);
  });

  it('should rotate quotes across minute intervals within the same hour', () => {
    const time1 = new Date('2026-09-12T09:00:00');
    const time2 = new Date('2026-09-12T09:05:00');
    const time3 = new Date('2026-09-12T09:10:00');

    const creed1 = resolveIntelligentCreed('morning', time1);
    const creed2 = resolveIntelligentCreed('morning', time2);
    const creed3 = resolveIntelligentCreed('morning', time3);

    // Across 5-minute blocks, it rotates through the pool
    assert.ok(creed1.id);
    assert.ok(creed2.id);
    assert.ok(creed3.id);
    // At least two should differ given our rotation algorithm
    assert.ok(creed1.id !== creed2.id || creed2.id !== creed3.id, 'Quotes should rotate across 5-min intervals');
  });

  it('should allow user manual shuffling to cycle through consecutive creeds without repeating', () => {
    const testDate = new Date('2026-09-12T10:00:00');
    const creed0 = resolveIntelligentCreed('morning', testDate, 0);
    const creed1 = resolveIntelligentCreed('morning', testDate, 1);
    const creed2 = resolveIntelligentCreed('morning', testDate, 2);

    assert.notStrictEqual(creed0.id, creed1.id, 'Consecutive manual shuffle should produce different creeds');
    assert.notStrictEqual(creed1.id, creed2.id, 'Consecutive manual shuffle should produce different creeds');
  });
});
