import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudDb } from '../../../server/db/postgres';
import { evaluatePromotionalNoise, cleanTelegramContent } from '../../../server/telegram-pipeline-server';
import { computeContentFingerprint, scoreFmgeRelevance } from '../../../server/telegram-pipeline-server';

test('Telegram Knowledge Bank Phase 4 — Complete End-to-End Integration & Production Hardening', async (t) => {
  await t.test('1. Real message identity and raw message immutability', () => {
    const originalText = 'Clinical MCQ: 30yo female presents with fever and cough...';
    const raw = CloudDb.insertRawMessage({
      sourceId: 'src-test-immutable',
      telegramMessageId: 8888,
      messageDate: '2026-09-12T07:00:00.000Z',
      rawText: originalText,
      mediaType: 'NONE',
      status: 'RECEIVED',
    });

    assert.equal(raw.inserted, true);
    assert.equal(raw.message.rawText, originalText);

    // Update message status with diagnostic error
    CloudDb.updateMessageStatus(raw.message.id, 'FAILED', 'Transient network error');
    const updated = CloudDb.getRawMessages().find((m) => m.id === raw.message.id);

    // Verify raw text and metadata were not mutated
    assert.equal(updated?.rawText, originalText);
    assert.equal(updated?.telegramMessageId, 8888);
    assert.equal(updated?.sourceId, 'src-test-immutable');
    assert.equal(updated?.status, 'FAILED');
    assert.equal(updated?.errorMessage, 'Transient network error');
  });

  await t.test('2. Idempotent raw message insertion', () => {
    // Attempting to insert the exact same message composite key
    const dup = CloudDb.insertRawMessage({
      sourceId: 'src-test-immutable',
      telegramMessageId: 8888,
      rawText: 'Modified text that should NOT overwrite',
    });

    assert.equal(dup.inserted, false);
    assert.equal(dup.action, 'DUPLICATE');
    assert.equal(dup.message.rawText, 'Clinical MCQ: 30yo female presents with fever and cough...');
  });

  await t.test('3. Promotional noise filter accuracy and trigger detection', () => {
    const promoPost = 'MEGA FMGE RAPID REVISION BATCH! 50% discount on test series. Call +919876543210 or join @fmge_batch for limited slots!';
    const evalResult = evaluatePromotionalNoise(promoPost);

    assert.equal(evalResult.isPromotional, true);
    assert.equal(evalResult.shouldFilterOut, true);
    assert.ok(evalResult.matchedTriggers.length >= 2);
    assert.ok(evalResult.confidence >= 0.7);

    // Legitimate clinical medical text should NOT be flagged as promotional
    const clinicalPost = 'A 45-year-old male with crushing substernal chest pain. ECG demonstrates ST-elevation in leads II, III, and aVF. What is the culprit vessel? A) RCA B) LAD C) LCx D) Left main';
    const clinicalEval = evaluatePromotionalNoise(clinicalPost);

    assert.equal(clinicalEval.isPromotional, false);
    assert.equal(clinicalEval.shouldFilterOut, false);
  });

  await t.test('4. Deduplication and multi-source canonical item merging', () => {
    const stemA = 'Which of the following is the drug of choice for paroxysmal supraventricular tachycardia?';
    const stemB = '  WHICH OF THE FOLLOWING IS THE DRUG OF CHOICE FOR PAROXYSMAL SUPRAVENTRICULAR TACHYCARDIA?  ';

    const fpA = computeContentFingerprint(stemA);
    const fpB = computeContentFingerprint(stemB);
    assert.equal(fpA, fpB, 'Fingerprint must be resilient to case and whitespace differences');

    const canonA = CloudDb.upsertCanonicalItem({
      id: 'canon-test-psvt',
      type: 'question',
      subject: 'Pharmacology',
      topic: 'Cardiovascular Drugs',
      title: 'Drug of choice for PSVT',
      content: stemA,
      fmgeRelevanceScore: 90,
      isHighYield: true,
      sources: [{ sourceId: 'src-chan-A', sourceTitle: 'Target FMGE', messageId: '101', date: '2026-09-12' }],
      contentFingerprint: fpA,
      createdAt: '2026-09-12T07:00:00.000Z',
      updatedAt: '2026-09-12T07:00:00.000Z',
    });

    assert.equal(canonA.action, 'CREATED');

    // Second channel posts the exact same question
    const canonB = CloudDb.upsertCanonicalItem({
      id: 'canon-test-psvt-dup',
      type: 'question',
      subject: 'Pharmacology',
      topic: 'Cardiovascular Drugs',
      title: 'Drug of choice for PSVT',
      content: stemB,
      fmgeRelevanceScore: 95,
      isHighYield: true,
      sources: [{ sourceId: 'src-chan-B', sourceTitle: 'Mission FMGE', messageId: '202', date: '2026-09-12' }],
      contentFingerprint: fpB,
      createdAt: '2026-09-12T07:05:00.000Z',
      updatedAt: '2026-09-12T07:05:00.000Z',
    });

    assert.equal(canonB.action, 'MERGED');
    assert.equal(canonB.item.id, 'canon-test-psvt');
    assert.equal(canonB.item.sources.length, 2);
    assert.equal(canonB.item.fmgeRelevanceScore, 95, 'Score upgraded to highest relevance');
  });

  await t.test('5. Server-side pagination, search, and filtering isolation', () => {
    const page1 = CloudDb.queryCuratedCanonicalItems({ page: 1, limit: 10 });
    const page2 = CloudDb.queryCuratedCanonicalItems({ page: 2, limit: 10 });

    assert.equal(page1.page, 1);
    assert.equal(page1.limit, 10);
    assert.equal(page2.page, 2);

    const ids1 = new Set(page1.items.map((i) => i.id));
    for (const item of page2.items) {
      assert.ok(!ids1.has(item.id), `Item ${item.id} should not appear on both page 1 and page 2`);
    }

    // Search query
    const searchRes = CloudDb.queryCuratedCanonicalItems({ search: 'PSVT' });
    assert.ok(searchRes.items.length >= 1);
    assert.ok(searchRes.items.some((i) => i.title.includes('PSVT') || i.content.includes('PSVT')));
  });

  await t.test('6. Saved vault integration with canonical item IDs', () => {
    const saved = CloudDb.toggleSavedItem({
      itemId: 'canon-test-psvt',
      itemType: 'question',
      subject: 'Pharmacology',
      title: 'Drug of choice for PSVT',
      content: 'Adenosine is drug of choice',
      tags: ['Cardiology', 'Rapid Review'],
    });

    assert.equal(saved.isSaved, true);
    assert.equal(saved.item?.itemId, 'canon-test-psvt');

    // Add student note
    const noted = CloudDb.updateSavedItemNotes(saved.item!.id, 'Remember: 6mg rapid IV push followed by flush');
    assert.ok(noted?.studentNotes?.includes('6mg rapid IV push'));

    // Toggle saved item to remove
    const removed = CloudDb.toggleSavedItem({
      itemId: 'canon-test-psvt',
      itemType: 'question',
      subject: 'Pharmacology',
      title: 'Drug of choice for PSVT',
      content: 'Adenosine is drug of choice',
    });
    assert.equal(removed.isSaved, false);
  });
});
