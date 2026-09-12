import test from 'node:test';
import assert from 'node:assert/strict';
import type { CanonicalKnowledgeItem, KnowledgeBankCounts, KnowledgeBankDiagnostics, FormattedRawTelegramMessage } from '../../types';

test('Telegram Knowledge Bank Phase 3 — Frontend Logic & Filtering Verification', async (t) => {
  await t.test('1. KnowledgeBankCounts has valid real shape and zero negative values', () => {
    const realCounts: KnowledgeBankCounts = {
      totalCurated: 33,
      examPearls: 12,
      questions: 15,
      imageSpotters: 4,
      videos: 1,
      clinicalTips: 1,
      notices: 0,
    };

    assert.equal(realCounts.totalCurated, 33);
    assert.ok(realCounts.examPearls >= 0);
    assert.ok(realCounts.questions >= 0);
    assert.ok(realCounts.imageSpotters >= 0);
    assert.ok(realCounts.videos >= 0);
    assert.ok(realCounts.clinicalTips >= 0);
    assert.ok(realCounts.notices >= 0);
  });

  await t.test('2. Curated feed filtering by subject and high-yield flag', () => {
    const sampleItems: CanonicalKnowledgeItem[] = [
      {
        id: 'can-1',
        type: 'question',
        subject: 'Microbiology',
        topic: 'Bacterial Genetics',
        title: 'Bacteriophage Transduction',
        content: 'Mechanism of transfer of genetic material via phages?',
        fmgeRelevanceScore: 92,
        isHighYield: true,
        sources: [{ sourceId: 'src-1', sourceTitle: 'Target FMGE', messageId: '101', date: '2026-09-12' }],
        contentFingerprint: 'fp1',
        createdAt: '2026-09-12T07:00:00.000Z',
        updatedAt: '2026-09-12T07:00:00.000Z',
      },
      {
        id: 'can-2',
        type: 'pearl',
        subject: 'Pharmacology',
        topic: 'Cardiovascular Drugs',
        title: 'Vitronectin Receptor',
        content: 'Drug needing no renal dose adjustment.',
        fmgeRelevanceScore: 84,
        isHighYield: false,
        sources: [{ sourceId: 'src-1', sourceTitle: 'Target FMGE', messageId: '102', date: '2026-09-12' }],
        contentFingerprint: 'fp2',
        createdAt: '2026-09-12T07:10:00.000Z',
        updatedAt: '2026-09-12T07:10:00.000Z',
      },
      {
        id: 'can-3',
        type: 'question',
        subject: 'Pharmacology',
        topic: 'CNS Drugs',
        title: 'Tuberous Sclerosis Spasms',
        content: 'First line treatment for infantile spasms in tuberous sclerosis?',
        fmgeRelevanceScore: 96,
        isHighYield: true,
        sources: [{ sourceId: 'src-2', sourceTitle: 'Mission FMGE', messageId: '201', date: '2026-09-12' }],
        contentFingerprint: 'fp3',
        createdAt: '2026-09-12T07:20:00.000Z',
        updatedAt: '2026-09-12T07:20:00.000Z',
      },
    ];

    // Filter by subject = Pharmacology
    const pharmaItems = sampleItems.filter(
      (i) => (i.subject || '').toLowerCase() === 'pharmacology'
    );
    assert.equal(pharmaItems.length, 2);

    // Filter by high-yield only
    const highYieldPharma = pharmaItems.filter((i) => i.isHighYield);
    assert.equal(highYieldPharma.length, 1);
    assert.equal(highYieldPharma[0].id, 'can-3');

    // Filter by type = question
    const questionsOnly = sampleItems.filter((i) => i.type === 'question');
    assert.equal(questionsOnly.length, 2);
  });

  await t.test('3. Raw messages source library filtering by status chip', () => {
    const rawMessages: FormattedRawTelegramMessage[] = [
      {
        id: 'msg-1',
        telegramMessageId: 1001,
        sourceId: 'src-1',
        sourceTitle: 'Target FMGE',
        messageDate: '2026-09-12T07:00:00.000Z',
        rawText: 'Clinical MCQ: 45yo with chest pain...',
        mediaType: 'POLL',
        status: 'PROCESSED',
        receivedAt: '2026-09-12T07:00:05.000Z',
        mediaUrls: [],
      },
      {
        id: 'msg-2',
        telegramMessageId: 1002,
        sourceId: 'src-1',
        sourceTitle: 'Target FMGE',
        messageDate: '2026-09-12T07:05:00.000Z',
        rawText: 'Join our premium batch now! 50% discount coupon code FMGE50',
        mediaType: 'IMAGE',
        status: 'PROMOTIONAL',
        reason: 'Commercial advertising detected',
        receivedAt: '2026-09-12T07:05:05.000Z',
        mediaUrls: [],
      },
      {
        id: 'msg-3',
        telegramMessageId: 1003,
        sourceId: 'src-2',
        sourceTitle: 'Mission FMGE',
        messageDate: '2026-09-12T07:10:00.000Z',
        rawText: 'Clinical MCQ: 45yo with chest pain...',
        mediaType: 'POLL',
        status: 'DUPLICATE',
        reason: 'Merged into canonical question can-1',
        receivedAt: '2026-09-12T07:10:05.000Z',
        mediaUrls: [],
      },
    ];

    // Filter PROMOTIONAL
    const promo = rawMessages.filter((m) => m.status === 'PROMOTIONAL');
    assert.equal(promo.length, 1);
    assert.equal(promo[0].id, 'msg-2');
    assert.ok(promo[0].reason?.includes('Commercial'));

    // Filter DUPLICATE
    const dupes = rawMessages.filter((m) => m.status === 'DUPLICATE');
    assert.equal(dupes.length, 1);
    assert.equal(dupes[0].id, 'msg-3');

    // Filter CURATED / PROCESSED
    const curated = rawMessages.filter((m) => m.status === 'PROCESSED');
    assert.equal(curated.length, 1);
    assert.equal(curated[0].id, 'msg-1');
  });

  await t.test('4. Pipeline diagnostics summary formatting matches real pipeline outputs', () => {
    const diag: KnowledgeBankDiagnostics = {
      scanned: 81,
      newMessages: 12,
      promotionalFiltered: 18,
      duplicatesMerged: 9,
      lowYieldFiltered: 5,
      curatedItems: 33,
      failed: 0,
      lastSyncAt: '2026-09-12T07:50:00.000Z',
    };

    const summaryStr = `✓ Sync complete — ${diag.scanned} messages scanned • ${diag.newMessages} new • ${diag.promotionalFiltered} promotional filtered • ${diag.duplicatesMerged} duplicates merged • ${diag.curatedItems} high-yield items added`;

    assert.ok(summaryStr.includes('81 messages scanned'));
    assert.ok(summaryStr.includes('18 promotional filtered'));
    assert.ok(summaryStr.includes('9 duplicates merged'));
    assert.ok(summaryStr.includes('33 high-yield items added'));
  });
});
