import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CloudDb,
  CanonicalKnowledgeRow,
  computeFingerprint,
} from "../../../server/db/postgres";
import { syncAllMonitoredSourcesNow } from "../../../server/telegram-worker";

describe("ONE SHOT FMGE — Telegram Knowledge Bank Phase 2 API & Contract Suite", () => {
  beforeEach(() => {
    CloudDb.resetTelegramNamespace();
  });

  // --------------------------------------------------------------------------
  // 1. EMPTY DATABASE HANDLING
  // --------------------------------------------------------------------------
  describe("1. Empty Database Handling", () => {
    it("returns clean empty arrays, zero counts, and null timestamps on fresh slate", () => {
      const curated = CloudDb.queryCuratedCanonicalItems();
      assert.strictEqual(curated.total, 0);
      assert.strictEqual(curated.items.length, 0);
      assert.strictEqual(curated.hasMore, false);
      assert.strictEqual(curated.page, 1);

      const raw = CloudDb.queryRawMessages();
      assert.strictEqual(raw.total, 0);
      assert.strictEqual(raw.items.length, 0);
      assert.strictEqual(raw.hasMore, false);

      const counts = CloudDb.getCuratedCounts();
      assert.strictEqual(counts.totalCurated, 0);
      assert.strictEqual(counts.examPearls, 0);
      assert.strictEqual(counts.questions, 0);
      assert.strictEqual(counts.imageSpotters, 0);
      assert.strictEqual(counts.videos, 0);
      assert.strictEqual(counts.clinicalTips, 0);
      assert.strictEqual(counts.notices, 0);

      const diagnostics = CloudDb.getPipelineDiagnostics();
      assert.strictEqual(diagnostics.scanned, 0);
      assert.strictEqual(diagnostics.newMessages, 0);
      assert.strictEqual(diagnostics.promotionalFiltered, 0);
      assert.strictEqual(diagnostics.duplicatesMerged, 0);
      assert.strictEqual(diagnostics.lowYieldFiltered, 0);
      assert.strictEqual(diagnostics.curatedItems, 0);
      assert.strictEqual(diagnostics.failed, 0);
      assert.strictEqual(diagnostics.lastSyncAt, null);
    });
  });

  // --------------------------------------------------------------------------
  // 2. CURATED FEED EXCLUDES PROMOTIONAL & LOW YIELD NOISE
  // --------------------------------------------------------------------------
  describe("2. Curated Items Filter Noise", () => {
    it("ensures raw promotional and low-yield messages do not enter canonical knowledge feed", () => {
      // Record a promotional raw message
      CloudDb.insertRawMessage({
        id: "msg-ad-1",
        sourceId: "src-ad",
        telegramMessageId: 101,
        messageDate: "2026-09-12T08:00:00Z",
        rawText: "Flat 50% discount on FMGE Rapid Revision batch! Join now @toppers",
        mediaType: "NONE",
        status: "PROMOTIONAL",
        errorMessage: "Filtered non-clinical content (discount_offer)",
        receivedAt: "2026-09-12T08:00:00Z",
      });

      // Record a low yield chatter message
      CloudDb.insertRawMessage({
        id: "msg-chat-1",
        sourceId: "src-chat",
        telegramMessageId: 102,
        messageDate: "2026-09-12T08:05:00Z",
        rawText: "pls upload pdf notes of today lecture",
        mediaType: "NONE",
        status: "LOW_YIELD",
        errorMessage: "Student chatter",
        receivedAt: "2026-09-12T08:05:00Z",
      });

      // Record a legitimate high-yield clinical canonical item
      CloudDb.upsertCanonicalItem({
        id: "canon-1",
        type: "question",
        subject: "medicine",
        topic: "Cardiology",
        title: "PSVT Drug of Choice",
        content: "A 30-year-old with narrow complex tachycardia. Initial drug of choice?",
        options: [
          { key: "A", text: "Adenosine" },
          { key: "B", text: "Digoxin" },
        ],
        correctAnswer: "A",
        explanation: "IV Adenosine 6mg rapid push is first line.",
        whatToRemember: "Adenosine terminates AVNRT acutely.",
        fmgeRelevanceScore: 92,
        sources: [
          {
            sourceId: "src-med",
            sourceTitle: "Target FMGE",
            messageId: "msg-103",
            date: "2026-09-12T08:10:00Z",
          },
        ],
        isHighYield: true,
        contentFingerprint: "fp-psvt-1",
        createdAt: "2026-09-12T08:10:00Z",
        updatedAt: "2026-09-12T08:10:00Z",
      });

      const curated = CloudDb.queryCuratedCanonicalItems();
      assert.strictEqual(curated.total, 1);
      assert.strictEqual(curated.items[0].id, "canon-1");

      const diag = CloudDb.getPipelineDiagnostics();
      assert.strictEqual(diag.scanned, 2);
      assert.strictEqual(diag.promotionalFiltered, 1);
      assert.strictEqual(diag.lowYieldFiltered, 1);
      assert.strictEqual(diag.curatedItems, 1);
    });
  });

  // --------------------------------------------------------------------------
  // 3. CROSS-CHANNEL DEDUPLICATION & MULTI-CHANNEL ATTRIBUTION
  // --------------------------------------------------------------------------
  describe("3. Deduplication and Multi-Channel Attribution", () => {
    it("merges duplicate posts across channels into 1 canonical item with 2 distinct sources", () => {
      const stem = "Drug of choice for neurocysticercosis with live cysts";
      const options = [
        { key: "A", text: "Albendazole" },
        { key: "B", text: "Praziquantel" },
      ];
      const fp = computeFingerprint(stem, options);

      const item1: CanonicalKnowledgeRow = {
        id: "canon-ncc-1",
        type: "question",
        subject: "pharmacology",
        topic: "Antiparasitic Drugs",
        title: "Neurocysticercosis DOC",
        content: stem,
        options,
        correctAnswer: "A",
        explanation: "Albendazole is drug of choice for NCC.",
        whatToRemember: "Albendazole is first line for parenchymal NCC.",
        fmgeRelevanceScore: 90,
        sources: [
          {
            sourceId: "chan-prep",
            sourceTitle: "PrepPulse FMGE",
            messageId: "msg-9901",
            date: "2026-09-12T09:00:00Z",
          },
        ],
        isHighYield: true,
        contentFingerprint: fp,
        createdAt: "2026-09-12T09:00:00Z",
        updatedAt: "2026-09-12T09:00:00Z",
      };

      const res1 = CloudDb.upsertCanonicalItem(item1);
      assert.strictEqual(res1.action, "CREATED");

      // Same question posted by another channel
      const item2: CanonicalKnowledgeRow = {
        id: "canon-ncc-2",
        type: "question",
        subject: "pharmacology",
        topic: "Antiparasitic Drugs",
        title: "Neurocysticercosis DOC",
        content: stem,
        options,
        correctAnswer: "A",
        explanation: "Albendazole is DOC.",
        whatToRemember: "Albendazole for NCC.",
        fmgeRelevanceScore: 95,
        sources: [
          {
            sourceId: "chan-marrow",
            sourceTitle: "Marrow Recalls & High Yield",
            messageId: "msg-4412",
            date: "2026-09-12T09:30:00Z",
          },
        ],
        isHighYield: true,
        contentFingerprint: fp,
        createdAt: "2026-09-12T09:30:00Z",
        updatedAt: "2026-09-12T09:30:00Z",
      };

      const res2 = CloudDb.upsertCanonicalItem(item2);
      assert.strictEqual(res2.action, "MERGED");

      const curated = CloudDb.queryCuratedCanonicalItems();
      assert.strictEqual(curated.total, 1);
      assert.strictEqual(curated.items[0].sources.length, 2);
      assert.ok(curated.items[0].sources.some((s) => s.sourceTitle === "PrepPulse FMGE"));
      assert.ok(curated.items[0].sources.some((s) => s.sourceTitle === "Marrow Recalls & High Yield"));
      assert.strictEqual(curated.items[0].fmgeRelevanceScore, 95);
    });
  });

  // --------------------------------------------------------------------------
  // 4. RAW MESSAGES PROCESSING STATES STREAM
  // --------------------------------------------------------------------------
  describe("4. Raw Message Processing Stream", () => {
    it("exposes raw message processing states and classification rationale", () => {
      CloudDb.upsertSources([
        {
          id: "src-1",
          accountId: "acc-1",
          telegramChannelId: -10012345678,
          title: "FMGE Master Channel",
          type: "channel",
          memberCount: 5000,
          isMonitored: true,
          lastProcessedMessageId: 50,
        },
      ]);

      CloudDb.insertRawMessage({
        id: "raw-1",
        sourceId: "src-1",
        telegramMessageId: 48,
        messageDate: "2026-09-12T07:00:00Z",
        rawText: "Join coaching batch for 5000 INR",
        mediaType: "NONE",
        status: "PROMOTIONAL",
        errorMessage: "Filtered commercial ad",
        receivedAt: "2026-09-12T07:00:00Z",
      });

      CloudDb.insertRawMessage({
        id: "raw-2",
        sourceId: "src-1",
        telegramMessageId: 49,
        messageDate: "2026-09-12T07:10:00Z",
        rawText: "Duplicate of PSVT MCQ posted again",
        mediaType: "NONE",
        status: "DUPLICATE",
        errorMessage: "Merged with canonical item fp-psvt-1",
        receivedAt: "2026-09-12T07:10:00Z",
      });

      CloudDb.insertRawMessage({
        id: "raw-3",
        sourceId: "src-1",
        telegramMessageId: 50,
        messageDate: "2026-09-12T07:20:00Z",
        rawText: "Clinical question on Kawasaki disease coronary aneurysm",
        mediaType: "IMAGE",
        status: "PROCESSED",
        receivedAt: "2026-09-12T07:20:00Z",
      });

      // Query all raw messages
      const allRaw = CloudDb.queryRawMessages();
      assert.strictEqual(allRaw.total, 3);
      assert.strictEqual(allRaw.items[0].sourceTitle, "FMGE Master Channel");

      // Filter by processingState PROMOTIONAL
      const promoOnly = CloudDb.queryRawMessages({ processingState: "PROMOTIONAL" });
      assert.strictEqual(promoOnly.total, 1);
      assert.strictEqual(promoOnly.items[0].status, "PROMOTIONAL");
      assert.strictEqual(promoOnly.items[0].reason, "Filtered commercial ad");

      // Filter by processingState DUPLICATE
      const dupsOnly = CloudDb.queryRawMessages({ processingState: "DUPLICATE" });
      assert.strictEqual(dupsOnly.total, 1);
      assert.strictEqual(dupsOnly.items[0].status, "DUPLICATE");
    });
  });

  // --------------------------------------------------------------------------
  // 5. SERVER-SIDE PAGINATION
  // --------------------------------------------------------------------------
  describe("5. Server-Side Pagination", () => {
    it("correctly slices pages and reports total and hasMore", () => {
      for (let i = 1; i <= 15; i++) {
        CloudDb.upsertCanonicalItem({
          id: `canon-page-${i}`,
          type: "pearl",
          subject: "pathology",
          topic: `Topic ${i}`,
          title: `Exam Pearl ${i}`,
          content: `Takeaway content for item ${i}`,
          fmgeRelevanceScore: 80 + (i % 15),
          sources: [
            {
              sourceId: "src-p",
              sourceTitle: "Pathology Pearls",
              messageId: `msg-${i}`,
              date: new Date(Date.now() - i * 60000).toISOString(),
            },
          ],
          isHighYield: true,
          contentFingerprint: `fp-page-${i}`,
          createdAt: new Date(Date.now() - i * 60000).toISOString(),
          updatedAt: new Date(Date.now() - i * 60000).toISOString(),
        });
      }

      // Page 1 with limit 5
      const p1 = CloudDb.queryCuratedCanonicalItems({ page: 1, limit: 5 });
      assert.strictEqual(p1.total, 15);
      assert.strictEqual(p1.items.length, 5);
      assert.strictEqual(p1.page, 1);
      assert.strictEqual(p1.limit, 5);
      assert.strictEqual(p1.hasMore, true);

      // Page 2 with limit 5
      const p2 = CloudDb.queryCuratedCanonicalItems({ page: 2, limit: 5 });
      assert.strictEqual(p2.items.length, 5);
      assert.strictEqual(p2.hasMore, true);

      // Page 3 with limit 5
      const p3 = CloudDb.queryCuratedCanonicalItems({ page: 3, limit: 5 });
      assert.strictEqual(p3.items.length, 5);
      assert.strictEqual(p3.hasMore, false);

      // Page 4 with limit 5 (empty)
      const p4 = CloudDb.queryCuratedCanonicalItems({ page: 4, limit: 5 });
      assert.strictEqual(p4.items.length, 0);
      assert.strictEqual(p4.hasMore, false);
    });
  });

  // --------------------------------------------------------------------------
  // 6. SERVER-SIDE SEARCH
  // --------------------------------------------------------------------------
  describe("6. Server-Side Keyword Search", () => {
    it("finds matches across title, content, explanation, and distractors", () => {
      CloudDb.upsertCanonicalItem({
        id: "canon-search-1",
        type: "question",
        subject: "microbiology",
        topic: "Bacteriology",
        title: "Gram-Negative Bacilli Identification",
        content: "A patient presents with bloody diarrhea after consuming poultry. Stool culture shows curved seagull-winged gram negative bacilli.",
        options: [
          { key: "A", text: "Campylobacter jejuni" },
          { key: "B", text: "Salmonella typhi" },
        ],
        correctAnswer: "A",
        explanation: "Campylobacter jejuni is microaerophilic and has seagull appearance.",
        whatToRemember: "Campylobacter is associated with Guillain-Barre syndrome.",
        fmgeRelevanceScore: 93,
        sources: [
          {
            sourceId: "src-micro",
            sourceTitle: "Microbiology Hub",
            messageId: "m-501",
            date: "2026-09-12T10:00:00Z",
          },
        ],
        isHighYield: true,
        contentFingerprint: "fp-campy",
        createdAt: "2026-09-12T10:00:00Z",
        updatedAt: "2026-09-12T10:00:00Z",
      });

      // Search by keyword in content
      const res1 = CloudDb.queryCuratedCanonicalItems({ search: "seagull" });
      assert.strictEqual(res1.total, 1);
      assert.strictEqual(res1.items[0].id, "canon-search-1");

      // Search by keyword in explanation
      const res2 = CloudDb.queryCuratedCanonicalItems({ search: "microaerophilic" });
      assert.strictEqual(res2.total, 1);

      // Search by keyword in whatToRemember
      const res3 = CloudDb.queryCuratedCanonicalItems({ search: "Guillain-Barre" });
      assert.strictEqual(res3.total, 1);

      // Search by keyword in options
      const res4 = CloudDb.queryCuratedCanonicalItems({ search: "Campylobacter" });
      assert.strictEqual(res4.total, 1);

      // Non-existent search
      const res5 = CloudDb.queryCuratedCanonicalItems({ search: "unrelatednonsensekeyword" });
      assert.strictEqual(res5.total, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. MULTI-PARAMETER FILTERING (Subject, Type, HighYield, MinRelevance)
  // --------------------------------------------------------------------------
  describe("7. Multi-Parameter Filtering", () => {
    beforeEach(() => {
      // Item 1: High yield medicine pearl
      CloudDb.upsertCanonicalItem({
        id: "item-1",
        type: "pearl",
        subject: "medicine",
        topic: "Endocrinology",
        title: "Pheochromocytoma Rule of 10s",
        content: "10% bilateral, 10% extra-adrenal, 10% malignant, 10% pediatric.",
        fmgeRelevanceScore: 90,
        sources: [{ sourceId: "s1", sourceTitle: "Chan 1", messageId: "1", date: "2026-09-12T01:00:00Z" }],
        isHighYield: true,
        contentFingerprint: "fp-1",
        createdAt: "2026-09-12T01:00:00Z",
        updatedAt: "2026-09-12T01:00:00Z",
      });

      // Item 2: Image question in surgery with score 78
      CloudDb.upsertCanonicalItem({
        id: "item-2",
        type: "image",
        subject: "surgery",
        topic: "Abdomen",
        title: "Coffee Bean Sign",
        content: "Abdominal X-ray showing massive dilated loop pointing to right upper quadrant.",
        mediaUrl: "/uploads/telegram/media/coffee_bean.jpg",
        mediaType: "IMAGE",
        fmgeRelevanceScore: 78,
        sources: [{ sourceId: "s2", sourceTitle: "Chan 2", messageId: "2", date: "2026-09-12T02:00:00Z" }],
        isHighYield: true,
        contentFingerprint: "fp-2",
        createdAt: "2026-09-12T02:00:00Z",
        updatedAt: "2026-09-12T02:00:00Z",
      });

      // Item 3: Notice with score 65, isHighYield: false
      CloudDb.upsertCanonicalItem({
        id: "item-3",
        type: "notice",
        subject: "administration",
        topic: "Exam Center Update",
        title: "Exam Center Allocation",
        content: "NBEMS announced exam center list.",
        fmgeRelevanceScore: 65,
        sources: [{ sourceId: "s3", sourceTitle: "Chan 3", messageId: "3", date: "2026-09-12T03:00:00Z" }],
        isHighYield: false,
        contentFingerprint: "fp-3",
        createdAt: "2026-09-12T03:00:00Z",
        updatedAt: "2026-09-12T03:00:00Z",
      });
    });

    it("filters by subject accurately", () => {
      const med = CloudDb.queryCuratedCanonicalItems({ subject: "medicine" });
      assert.strictEqual(med.total, 1);
      assert.strictEqual(med.items[0].id, "item-1");

      const surg = CloudDb.queryCuratedCanonicalItems({ subject: "surgery" });
      assert.strictEqual(surg.total, 1);
      assert.strictEqual(surg.items[0].id, "item-2");
    });

    it("filters by type accurately", () => {
      const pearls = CloudDb.queryCuratedCanonicalItems({ type: "pearl" });
      assert.strictEqual(pearls.total, 1);
      assert.strictEqual(pearls.items[0].id, "item-1");

      const images = CloudDb.queryCuratedCanonicalItems({ type: "image" });
      assert.strictEqual(images.total, 1);
      assert.strictEqual(images.items[0].id, "item-2");
    });

    it("filters by minRelevance score accurately", () => {
      const highOnly = CloudDb.queryCuratedCanonicalItems({ minRelevance: 85 });
      assert.strictEqual(highOnly.total, 1);
      assert.strictEqual(highOnly.items[0].id, "item-1");

      const midAndAbove = CloudDb.queryCuratedCanonicalItems({ minRelevance: 75 });
      assert.strictEqual(midAndAbove.total, 2);
    });

    it("filters by highYield boolean accurately", () => {
      const highOnly = CloudDb.queryCuratedCanonicalItems({ highYield: true });
      assert.strictEqual(highOnly.total, 2);

      const nonHigh = CloudDb.queryCuratedCanonicalItems({ highYield: false });
      assert.strictEqual(nonHigh.total, 1);
      assert.strictEqual(nonHigh.items[0].id, "item-3");
    });
  });

  // --------------------------------------------------------------------------
  // 8. STATUS ENDPOINT CONTRACT (Real Account, Worker Heartbeat, DB Health)
  // --------------------------------------------------------------------------
  describe("8. Health & Status Contract", () => {
    it("reports real telegram account, worker heartbeat, and database health", () => {
      // Connect test account
      CloudDb.upsertAccount({
        id: "acc-user-1",
        userId: "987654321",
        phoneNumber: "+919876543210",
        firstName: "Dr. Candidate",
        username: "drcandidate",
        encryptedSession: "enc-session-test",
        isAuthenticated: true,
        connectedAt: "2026-09-12T00:00:00Z",
        lastActiveAt: "2026-09-12T00:00:00Z",
      });

      // Record worker heartbeat
      CloudDb.recordHeartbeat({
        workerStatus: "ONLINE",
        lastSuccessfulTelegramUpdate: "2026-09-12T11:00:00Z",
        activeSourcesCount: 5,
        lastError: undefined,
      });

      const account = CloudDb.getAccount();
      const hb = CloudDb.getHeartbeat();
      const isConnected = Boolean(account && account.isAuthenticated);

      assert.strictEqual(isConnected, true);
      assert.strictEqual(account?.phoneNumber, "+919876543210");
      assert.strictEqual(hb?.workerStatus, "ONLINE");
      assert.strictEqual(hb?.lastSuccessfulTelegramUpdate, "2026-09-12T11:00:00Z");
      assert.strictEqual(hb?.activeSourcesCount, 5);
    });
  });

  // --------------------------------------------------------------------------
  // 9. SYNC-NOW DIAGNOSTICS CONTRACT
  // --------------------------------------------------------------------------
  describe("9. Manual Sync Diagnostics Contract", () => {
    it("returns genuine operation diagnostics from sync execution", async () => {
      const syncRes = await syncAllMonitoredSourcesNow();
      assert.ok(typeof syncRes.success === "boolean");
      assert.ok(syncRes.diagnostics);
      assert.ok(typeof syncRes.diagnostics.scanned === "number");
      assert.ok(typeof syncRes.diagnostics.newMessages === "number");
      assert.ok(typeof syncRes.diagnostics.promotionalFiltered === "number");
      assert.ok(typeof syncRes.diagnostics.duplicatesMerged === "number");
      assert.ok(typeof syncRes.diagnostics.lowYieldFiltered === "number");
      assert.ok(typeof syncRes.diagnostics.curatedItems === "number");
      assert.ok(typeof syncRes.diagnostics.failed === "number");

      // Backward compatible fields for UI toast
      assert.ok(typeof syncRes.monitoredSourcesCount === "number");
      assert.ok(typeof syncRes.newMessagesCount === "number");
    });
  });

  // --------------------------------------------------------------------------
  // 10. SAVED ITEMS VAULT WITH CANONICAL ITEM IDS
  // --------------------------------------------------------------------------
  describe("10. Saved Items Vault with Canonical IDs", () => {
    it("safely toggles, updates student notes, and removes canonical items", () => {
      const canonId = "canon-saved-test-1";

      // 1. Toggle item into vault
      const toggle1 = CloudDb.toggleSavedItem({
        itemId: canonId,
        itemType: "question",
        subject: "Obstetrics",
        title: "Active Management of Third Stage of Labour",
        content: "Drug of choice for AMTSL prophylaxis?",
        options: [{ key: "A", text: "Oxytocin 10 IU IM" }],
        correctAnswer: "A",
        explanation: "Oxytocin 10 IU IM is first line for AMTSL.",
        tags: ["High-Yield", "ObsGyn", "RepeatPYQ"],
        studentNotes: "Must remember 10 IU IM within 1 min of delivery.",
        sourceChannel: "FMGE ObsGyn Rapid Review",
      });

      assert.strictEqual(toggle1.isSaved, true);
      assert.ok(toggle1.item);
      assert.strictEqual(toggle1.item.itemId, canonId);
      assert.strictEqual(toggle1.item.studentNotes, "Must remember 10 IU IM within 1 min of delivery.");

      // 2. Query saved items
      const savedItems = CloudDb.getSavedItems({ subject: "Obstetrics" });
      assert.strictEqual(savedItems.length, 1);
      assert.strictEqual(savedItems[0].itemId, canonId);

      // 3. Update notes
      const updated = CloudDb.updateSavedItemNotes(
        toggle1.item.id,
        "Updated notes: Don't give Methylergonovine in hypertensive mothers!",
        ["High-Yield", "AMTSL"]
      );
      assert.ok(updated);
      assert.ok(updated.studentNotes?.includes("hypertensive mothers"));

      // 4. Toggle again to unsave
      const toggle2 = CloudDb.toggleSavedItem({
        itemId: canonId,
        itemType: "question",
        subject: "Obstetrics",
        title: "Active Management of Third Stage of Labour",
        content: "Drug of choice for AMTSL prophylaxis?",
      });
      assert.strictEqual(toggle2.isSaved, false);

      const remaining = CloudDb.getSavedItems();
      assert.strictEqual(remaining.length, 0);
    });
  });
});
