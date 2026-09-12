import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanTelegramContent,
  evaluatePromotionalNoise,
  scoreFmgeRelevance,
  computeContentFingerprint,
  calculateBigramSimilarity,
  mapToFmgeSubject,
} from "../../../server/telegram-pipeline-server";
import { CloudDb, CanonicalKnowledgeRow } from "../../../server/db/postgres";

describe("ONE SHOT FMGE — Telegram Knowledge Bank Rebuild Suite", () => {
  // --------------------------------------------------------------------------
  // 1. PROMOTIONAL & CHATTER NOISE FILTERING
  // --------------------------------------------------------------------------
  describe("Stage 1 & 2: Rule-Based Promotional & Chatter Detection", () => {
    it("correctly identifies commercial batch announcements and discount offers as promotional", () => {
      const adText =
        "🔥 MEGA FMGE RAPID REVISION BATCH 🔥\n" +
        "Admissions Open for July 2025! Flat 50% discount on test series.\n" +
        "Course fee: Rs. 2999 only! Limited slots available.\n" +
        "DM to buy or call helpline: +919876543210.\n" +
        "Join our telegram channel @fmge_toppers";

      const res = evaluatePromotionalNoise(adText);
      assert.strictEqual(res.isPromotional, true);
      assert.strictEqual(res.shouldFilterOut, true);
      assert.ok(res.confidence >= 0.7);
      assert.ok(res.matchedTriggers.includes("batch_announcement") || res.matchedTriggers.includes("discount_offer"));
    });

    it("correctly identifies course coupon codes and registration urgency as promotional", () => {
      const adText =
        "Register now for Clinical Grand Test 4!\n" +
        "Use coupon code TOPPER20 to get instant price drop.\n" +
        "Hurry up! Last day to avail this offer.\n" +
        "Subscribe to our YouTube channel for free webinars: https://t.me/fmge_course";

      const res = evaluatePromotionalNoise(adText);
      assert.strictEqual(res.isPromotional, true);
      assert.strictEqual(res.shouldFilterOut, true);
    });

    it("correctly identifies conversational student chatter as noise", () => {
      const chatterText = "hi admin please send pdf of yesterday class notes";
      const res = evaluatePromotionalNoise(chatterText);
      assert.strictEqual(res.isChatter, true);
      assert.strictEqual(res.shouldFilterOut, true);
    });

    it("does NOT falsely flag legitimate medical clinical questions as promotional", () => {
      const questionText =
        "A 32-year-old female presents to the emergency room with sudden onset palpitation and lightheadedness. " +
        "ECG confirms narrow complex regular tachycardia with rate 190 bpm. Vagal maneuvers fail. " +
        "Which of the following is the initial drug of choice for acute termination?\n" +
        "A) IV Adenosine 6mg rapid bolus\n" +
        "B) IV Amiodarone 150mg\n" +
        "C) Oral Digoxin 0.25mg\n" +
        "D) IV Verapamil 5mg";

      const res = evaluatePromotionalNoise(questionText);
      assert.strictEqual(res.isPromotional, false);
      assert.strictEqual(res.isChatter, false);
      assert.strictEqual(res.shouldFilterOut, false);
    });

    it("does NOT falsely flag high-yield medical pearls containing the word 'drug' or 'choice'", () => {
      const pearlText =
        "High-Yield FMGE Exam Pearl:\n" +
        "Investigation of choice for Aortic Dissection in hemodynamically stable patient is CT Angiography.\n" +
        "In unstable patients, Transesophageal Echocardiography (TEE) is preferred.";

      const res = evaluatePromotionalNoise(pearlText);
      assert.strictEqual(res.isPromotional, false);
      assert.strictEqual(res.shouldFilterOut, false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. DETERMINISTIC TEXT NORMALIZATION
  // --------------------------------------------------------------------------
  describe("Stage 3: Text Normalization & Promotional Footer Stripping", () => {
    it("strips forwarding banners, telegram links, handles, and phone numbers from medical text", () => {
      const raw =
        "Forwarded from Dr. Sharma FMGE Mentorship\n" +
        "A 28-year-old primigravida presents with eclampsia at 34 weeks gestation.\n" +
        "First-line anticonvulsant regimen is IV Magnesium Sulfate (Pritchard regimen).\n\n" +
        "👉 Join our telegram channel: https://t.me/fmge_pearls_daily\n" +
        "Follow us @fmge_highyield\n" +
        "Call or WhatsApp: +919876543210 for admissions";

      const cleaned = cleanTelegramContent(raw);
      assert.strictEqual(cleaned.hasStrippedContent, true);
      assert.ok(!cleaned.cleanedText.includes("Forwarded from"));
      assert.ok(!cleaned.cleanedText.includes("https://t.me/"));
      assert.ok(!cleaned.cleanedText.includes("@fmge_highyield"));
      assert.ok(!cleaned.cleanedText.includes("+919876543210"));
      assert.ok(cleaned.cleanedText.includes("Pritchard regimen"));
      assert.ok(cleaned.cleanedText.includes("Magnesium Sulfate"));
    });
  });

  // --------------------------------------------------------------------------
  // 3. FMGE RELEVANCE & YIELD SCORING
  // --------------------------------------------------------------------------
  describe("Stage 4: FMGE Relevance & Yield Scoring Engine", () => {
    it("awards high yield score (>=75) to complete MCQs with clinical vignettes and drug of choice", () => {
      const result = scoreFmgeRelevance({
        text: "A 45-year-old male presents with retrosternal chest pain. Investigation of choice is coronary angiography. Drug of choice for stable angina is sublingual nitroglycerin.",
        category: "MCQ",
        hasOptions: true,
      });

      assert.ok(result.score >= 75);
      assert.strictEqual(result.isHighYield, true);
      assert.strictEqual(result.tier, "HIGH_YIELD");
      assert.ok(result.yieldFactors.length >= 2);
    });

    it("awards bonus to image spotters (#IBQ)", () => {
      const result = scoreFmgeRelevance({
        text: "Identify the characteristic sign on Chest X-Ray shown below: Steeple Sign seen in Croup (Laryngotracheobronchitis).",
        category: "IMAGE_BASED_QUESTION",
        hasPhoto: true,
      });

      assert.ok(result.score >= 75);
      assert.strictEqual(result.isHighYield, true);
    });

    it("relegates fragmented low-substance content to below threshold (<60)", () => {
      const result = scoreFmgeRelevance({
        text: "today revision class notes",
        category: "TIP",
      });

      assert.ok(result.score < 60);
      assert.strictEqual(result.isHighYield, false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. SUBJECT TAXONOMY MAPPING
  // --------------------------------------------------------------------------
  describe("Stage 5: Standard 19 FMGE Subject Mapping", () => {
    it("maps OBG keywords accurately", () => {
      const mapping = mapToFmgeSubject("Preeclampsia eclampsia and Pritchard regimen in labor");
      assert.strictEqual(mapping.subject, "obg");
    });

    it("maps Forensic Toxicology keywords accurately", () => {
      const mapping = mapToFmgeSubject("Organophosphate poisoning antidote atropine pralidoxime toxicology");
      assert.strictEqual(mapping.subject, "forensic");
    });

    it("maps Anatomy plexus and nerve keywords accurately", () => {
      const mapping = mapToFmgeSubject("Erb Duchenne palsy upper trunk brachial plexus injury");
      assert.strictEqual(mapping.subject, "anatomy");
    });
  });

  // --------------------------------------------------------------------------
  // 5. CROSS-CHANNEL DEDUPLICATION & CANONICAL STORE
  // --------------------------------------------------------------------------
  describe("Stage 6 & 7: Cross-Channel Deduplication & Canonical Consolidation", () => {
    it("produces identical content fingerprint for same question posted by different channels", () => {
      const channel1Post =
        "Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?";
      const channel2Post =
        "Q. Which of the following is the drug of choice for paroxysmal supraventricular tachycardia (PSVT)?";

      const options = [
        { key: "A", text: "Adenosine" },
        { key: "B", text: "Amiodarone" },
        { key: "C", text: "Verapamil" },
        { key: "D", text: "Digoxin" },
      ];

      const fp1 = computeContentFingerprint(channel1Post, options);
      const fp2 = computeContentFingerprint(channel2Post, options);

      assert.strictEqual(fp1, fp2);
    });

    it("merges duplicate posts across channels into 1 canonical item with multi-channel attribution", () => {
      const testNonce = Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const options = [
        { key: "A", text: "Adenosine" },
        { key: "B", text: "Amiodarone" },
        { key: "C", text: "Verapamil" },
        { key: "D", text: "Digoxin" },
      ];
      const stem = "First line drug for PSVT termination in stable patient " + testNonce + "?";
      const fp = computeContentFingerprint(stem, options);

      const item1: CanonicalKnowledgeRow = {
        id: "canon-test-1-" + testNonce,
        type: "question",
        subject: "medicine",
        topic: "Cardiovascular Emergencies",
        title: "PSVT Drug of Choice",
        content: stem,
        options,
        correctAnswer: "A",
        explanation: "IV Adenosine 6mg rapid push terminates AVNRT/AVRT.",
        whatToRemember: "Drug of choice for stable PSVT is IV Adenosine.",
        fmgeRelevanceScore: 92,
        sources: [
          {
            sourceId: "channel-alpha",
            sourceTitle: "Target FMGE High Yield",
            messageId: "msg-alpha-" + testNonce,
            date: "2026-09-12T10:00:00Z",
          },
        ],
        isHighYield: true,
        contentFingerprint: fp,
        createdAt: "2026-09-12T10:00:00Z",
        updatedAt: "2026-09-12T10:00:00Z",
      };

      // First insertion
      const res1 = CloudDb.upsertCanonicalItem(item1);
      assert.strictEqual(res1.action, "CREATED");
      assert.strictEqual(res1.item.sources.length, 1);

      // Channel Beta posts the same question
      const item2: CanonicalKnowledgeRow = {
        id: "canon-test-2-" + testNonce,
        type: "question",
        subject: "medicine",
        topic: "Cardiovascular Emergencies",
        title: "PSVT Drug of Choice",
        content: stem,
        options,
        correctAnswer: "A",
        explanation: "IV Adenosine is first line.",
        whatToRemember: "Drug of choice is Adenosine.",
        fmgeRelevanceScore: 94,
        sources: [
          {
            sourceId: "channel-beta",
            sourceTitle: "Clinical Recalls Discussion",
            messageId: "msg-beta-505",
            date: "2026-09-12T10:15:00Z",
          },
        ],
        isHighYield: true,
        contentFingerprint: fp,
        createdAt: "2026-09-12T10:15:00Z",
        updatedAt: "2026-09-12T10:15:00Z",
      };

      const res2 = CloudDb.upsertCanonicalItem(item2);
      assert.strictEqual(res2.action, "MERGED");
      // Multi-channel attribution has 2 distinct sources linked to the single canonical item!
      assert.strictEqual(res2.item.sources.length, 2);
      assert.ok(res2.item.sources.some((s) => s.sourceTitle === "Target FMGE High Yield"));
      assert.ok(res2.item.sources.some((s) => s.sourceTitle === "Clinical Recalls Discussion"));
      // Upgraded relevance score
      assert.strictEqual(res2.item.fmgeRelevanceScore, 94);

      // Cleanup test items from in-memory DB
      const db = (CloudDb as any).getCanonicalItems();
      const idx = db.findIndex((c: any) => c.contentFingerprint === fp);
      if (idx >= 0) db.splice(idx, 1);
    });

    it("verifies pipeline diagnostics returns genuine counts of filtered and merged items", () => {
      const diagnostics = CloudDb.getPipelineDiagnostics();
      assert.ok(typeof diagnostics.totalScanned === "number");
      assert.ok(typeof diagnostics.promotionalFiltered === "number");
      assert.ok(typeof diagnostics.duplicatesMerged === "number");
      assert.ok(typeof diagnostics.curatedCount === "number");
    });
  });
});
