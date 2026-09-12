import crypto from "crypto";

// ============================================================================
// 1. 19 STANDARD FMGE / NExT SUBJECT TAXONOMY
// ============================================================================
export const FMGE_19_SUBJECTS: { id: string; name: string; aliases: string[] }[] = [
  { id: "medicine", name: "General Medicine", aliases: ["medicine", "internal medicine", "cardio", "pulmo", "neuro", "gastro", "nephro", "endocrinology"] },
  { id: "surgery", name: "General Surgery", aliases: ["surgery", "trauma", "gi surgery", "surgical", "urology", "burns"] },
  { id: "obg", name: "Obstetrics & Gynecology", aliases: ["obstetrics", "gynecology", "obg", "ob-gyn", "labor", "antenatal", "eclampsia"] },
  { id: "psm", name: "Preventive & Social Medicine", aliases: ["psm", "preventive", "community medicine", "epidemiology", "biostatistics", "screening", "vaccines"] },
  { id: "forensic", name: "Forensic Medicine & Toxicology", aliases: ["forensic", "fmt", "toxicology", "poisoning", "poisons", "autopsy", "post-mortem", "legal", "ipc"] },
  { id: "pathology", name: "Pathology", aliases: ["pathology", "patho", "histology", "biopsy", "neoplasia", "hematology"] },
  { id: "pharmacology", name: "Pharmacology", aliases: ["pharmacology", "pharma", "drug of choice", "adverse effect", "antidote", "mechanism of action"] },
  { id: "anatomy", name: "Anatomy", aliases: ["anatomy", "embryology", "histology", "nerve supply", "blood supply", "triangles", "brachial plexus"] },
  { id: "physiology", name: "Physiology", aliases: ["physiology", "cardiac cycle", "renal clearance", "action potential", "respiratory volume"] },
  { id: "biochemistry", name: "Biochemistry", aliases: ["biochemistry", "metabolism", "enzymes", "vitamins", "cycles", "inborn errors"] },
  { id: "microbiology", name: "Microbiology", aliases: ["microbiology", "bacteriology", "virology", "parasitology", "mycology", "gram positive", "gram negative"] },
  { id: "ent", name: "ENT", aliases: ["ent", "ear", "nose", "throat", "audiometry", "otology", "rhinology", "laryngology"] },
  { id: "ophthalmology", name: "Ophthalmology", aliases: ["ophthalmology", "ophthal", "eye", "retina", "cornea", "glaucoma", "fundus"] },
  { id: "pediatrics", name: "Pediatrics", aliases: ["pediatrics", "peds", "milestones", "neonatology", "congenital", "growth chart"] },
  { id: "dermatology", name: "Dermatology", aliases: ["dermatology", "derma", "skin", "bullous", "rash", "psoriasis", "eczema"] },
  { id: "orthopedics", name: "Orthopedics", aliases: ["orthopedics", "ortho", "fractures", "bone", "joints", "dislocation", "splint"] },
  { id: "psychiatry", name: "Psychiatry", aliases: ["psychiatry", "psych", "schizophrenia", "depression", "bipolar", "dsm", "defense mechanisms"] },
  { id: "radiology", name: "Radiology", aliases: ["radiology", "radio", "x-ray", "ct scan", "mri", "ultrasound", "sign in radiology"] },
  { id: "anesthesia", name: "Anesthesia", aliases: ["anesthesia", "anaesthesia", "airway", "mac", "etomidate", "propofol", "spinal anesthesia"] },
];

export function mapToFmgeSubject(subjectOrText: string): { subject: string; topic: string } {
  const text = (subjectOrText || "").toLowerCase();
  
  for (const subj of FMGE_19_SUBJECTS) {
    for (const alias of subj.aliases) {
      if (text.includes(alias)) {
        return { subject: subj.id, topic: subj.name };
      }
    }
  }
  return { subject: "medicine", topic: "Clinical High-Yield Practice" };
}

// ============================================================================
// 2. TEXT NORMALIZATION & CLEANING
// ============================================================================

const PROMO_FOOTER_PATTERNS = [
  /join\s*(?:our|the)?\s*(?:telegram|channel|group|discussion|batch|course)[^\n]*/gi,
  /subscribe\s*(?:to|on)?\s*(?:youtube|channel|our)[^\n]*/gi,
  /follow\s*us\s*(?:on|at)?[^\n]*/gi,
  /https?:\/\/t\.me\/[a-zA-Z0-9_+/]+/gi,
  /t\.me\/[a-zA-Z0-9_+/]+/gi,
  /@[a-zA-Z0-9_]{4,32}/gi, // Telegram usernames/handles
  /for\s*(?:more|daily)\s*(?:mcqs|quizzes|updates|notes|recalls)[^\n]*/gi,
  /call\s*(?:or\s*whatsapp)?\s*[:\-\s]*\+?[0-9\s\-]{8,15}/gi,
  /whatsapp\s*(?:us|at)?\s*[:\-\s]*\+?[0-9\s\-]{8,15}/gi,
  /discount\s*code\s*[:\-\s]*[a-zA-Z0-9_-]+/gi,
  /use\s*coupon\s*[:\-\s]*[a-zA-Z0-9_-]+/gi,
  /click\s*here\s*to\s*(?:join|register|download|enroll)[^\n]*/gi,
  /download\s*(?:our)?\s*app\s*(?:from|on)?[^\n]*/gi,
  /limited\s*seats?\s*(?:available|left)?[^\n]*/gi,
  /admission\s*(?:open|closing)[^\n]*/gi,
];

export function cleanTelegramContent(rawText: string): {
  cleanedText: string;
  hasStrippedContent: boolean;
  strippedCount: number;
} {
  if (!rawText) return { cleanedText: "", hasStrippedContent: false, strippedCount: 0 };

  let text = rawText;
  let strippedCount = 0;

  // 1. Remove Telegram forwarded headers if present
  text = text.replace(/^Forwarded from[^\n]*\n?/gim, "");

  // 2. Remove standard footer promo regexes
  for (const pattern of PROMO_FOOTER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      strippedCount += matches.length;
      text = text.replace(pattern, " ");
    }
  }

  // 3. Remove excessive markdown artifacts and symbols
  text = text
    .replace(/[👉👇🔗📞📢🔥⚡💥🎯🚨📍]/g, " ") // Marketing and pointer emojis
    .replace(/\n{3,}/g, "\n\n") // Collapse triple line breaks
    .replace(/[ \t]{2,}/g, " ") // Collapse multiple spaces
    .trim();

  return {
    cleanedText: text,
    hasStrippedContent: strippedCount > 0,
    strippedCount,
  };
}

// ============================================================================
// 3. RULE-BASED PROMOTIONAL & CHATTER CLASSIFIER
// ============================================================================

const PROMOTIONAL_TRIGGERS: { pattern: RegExp; weight: number; label: string }[] = [
  // Commercial courses, batches, sales
  { pattern: /\b(?:new\s*batch|live\s*batch|fast\s*track\s*batch|rapid\s*revision\s*batch)\b/i, weight: 40, label: "batch_announcement" },
  { pattern: /\b(?:admissions?\s*open|enroll\s*now|registration\s*open|register\s*now)\b/i, weight: 40, label: "enrollment_call" },
  { pattern: /\b(?:flat\s*\d+%\s*off|discount\s*of|\d+%\s*discount|early\s*bird\s*offer)\b/i, weight: 45, label: "discount_offer" },
  { pattern: /\b(?:course\s*fee|fees?|affordable\s*price|price\s*drop|rs\.?\s*\d{3,5}|inr\s*\d{3,5})\b/i, weight: 35, label: "pricing" },
  { pattern: /\b(?:dm\s*to\s*buy|inbox\s*for\s*details|contact\s*admin|msg\s*admin)\b/i, weight: 40, label: "admin_contact" },
  { pattern: /\b(?:test\s*series\s*starts|mock\s*exam\s*subscription|premium\s*access)\b/i, weight: 35, label: "test_series_sales" },
  { pattern: /\b(?:call\s*us\s*at|whatsapp\s*us\s*on|helpline\s*number)\b/i, weight: 35, label: "contact_number" },
  { pattern: /\b(?:coupon\s*code|promo\s*code|referral\s*code)\b/i, weight: 40, label: "promo_code" },
  { pattern: /\b(?:limited\s*slots|few\s*seats\s*left|hurry\s*up|last\s*day\s*to\s*avail)\b/i, weight: 30, label: "urgency_sales" },

  // Social handles & channel cross-promotions
  { pattern: /\b(?:join\s*our\s*(?:discussion|backup|vip)\s*channel)\b/i, weight: 35, label: "channel_cross_promo" },
  { pattern: /\b(?:subscribe\s*our\s*youtube\s*channel|link\s*in\s*bio)\b/i, weight: 35, label: "social_promo" },
];

const CHATTER_TRIGGERS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /^(?:hi|hello|good\s*morning|good\s*evening|gm|ge|admin\s*please|can\s*anyone\s*send|please\s*upload|pdf\s*needed)\b/i, weight: 40, label: "greeting_or_request" },
  { pattern: /\b(?:when\s*is\s*the\s*class|class\s*timing|link\s*not\s*working|audio\s*not\s*clear)\b/i, weight: 35, label: "class_logistics" },
  { pattern: /^(?:ok|okay|thank\s*you|thanks|thx|done|got\s*it|yes|no)\b/i, weight: 45, label: "short_ack" },
];

export interface ClassificationResult {
  isPromotional: boolean;
  isChatter: boolean;
  shouldFilterOut: boolean;
  confidence: number;
  matchedTriggers: string[];
}

export function evaluatePromotionalNoise(text: string): ClassificationResult {
  if (!text || text.trim().length < 15) {
    return {
      isPromotional: false,
      isChatter: true,
      shouldFilterOut: true,
      confidence: 0.9,
      matchedTriggers: ["too_short"],
    };
  }

  let promoScore = 0;
  let chatterScore = 0;
  const matchedTriggers: string[] = [];

  for (const trigger of PROMOTIONAL_TRIGGERS) {
    if (trigger.pattern.test(text)) {
      promoScore += trigger.weight;
      matchedTriggers.push(trigger.label);
    }
  }

  for (const trigger of CHATTER_TRIGGERS) {
    if (trigger.pattern.test(text)) {
      chatterScore += trigger.weight;
      matchedTriggers.push(trigger.label);
    }
  }

  // If text has heavy medical keywords, provide a stabilizing counter-balance
  // (e.g. "Doctor of choice for PSVT in emergency batch..." shouldn't be discarded purely on "batch")
  const medicalTokens = (text.match(/\b(?:diagnosis|treatment|patient|syndrome|investigation|drug|presentation|artery|nerve|fracture|sign|triad|biopsy|gold\s*standard)\b/gi) || []).length;

  const adjustedPromoScore = Math.max(0, promoScore - medicalTokens * 10);
  const isPromotional = adjustedPromoScore >= 40;
  const isChatter = chatterScore >= 40;

  return {
    isPromotional,
    isChatter,
    shouldFilterOut: isPromotional || isChatter,
    confidence: Math.min(1.0, (promoScore + chatterScore) / 60),
    matchedTriggers,
  };
}

// ============================================================================
// 4. FMGE RELEVANCE & YIELD SCORER (0 - 100)
// ============================================================================

export interface RelevanceScoreResult {
  score: number; // 0 - 100
  tier: "HIGH_YIELD" | "USEFUL" | "LOW_PRIORITY" | "REJECTED";
  isHighYield: boolean;
  yieldFactors: string[];
}

export function scoreFmgeRelevance(params: {
  text: string;
  category: string;
  hasPhoto?: boolean;
  hasVideo?: boolean;
  hasOptions?: boolean;
}): RelevanceScoreResult {
  let score = 50; // Baseline
  const factors: string[] = [];
  const lower = params.text.toLowerCase();

  // 1. Structure / Format bonuses
  if (params.hasOptions) {
    score += 15;
    factors.push("Complete MCQ Format");
  }

  if (params.hasPhoto || params.category === "IMAGE_BASED_QUESTION") {
    score += 15;
    factors.push("Image Based Question / Spotter");
  }

  if (params.hasVideo || params.category === "VIDEO_DEMONSTRATION") {
    score += 10;
    factors.push("Clinical Video Demonstration");
  }

  // 2. High-Yield Exam Signals
  if (/\b(?:gold\s*standard|investigation\s*of\s*choice|first\s*line|drug\s*of\s*choice|doc\s*for)\b/i.test(lower)) {
    score += 15;
    factors.push("High-Yield Gold Standard / Drug of Choice");
  }

  if (/\b(?:triad|pentad|classic\s*sign|sign|pathognomonic|hallmark)\b/i.test(lower)) {
    score += 12;
    factors.push("Pathognomonic Sign / Diagnostic Triad");
  }

  if (/\b(?:pyq|recall|fmge|neet\s*pg|ini\s*cet|nbe|nbems)\b/i.test(lower)) {
    score += 10;
    factors.push("Verified Exam Recall / PYQ");
  }

  // 3. Clinical Vignette depth
  if (/\b\d{1,2}[\s-]*(?:year[\s-]old|yo|m\/o|f\/o)\b/i.test(lower) || /\bpresents\s*with\b/i.test(lower)) {
    score += 10;
    factors.push("Authentic Clinical Vignette");
  }

  // 4. Official Notices
  if (params.category === "OFFICIAL_NOTICE") {
    score = Math.max(score, 85);
    factors.push("Official Examination Notice");
  }

  // 5. Length & Noise penalties
  if (params.text.length < 40 && !params.hasPhoto) {
    score -= 25;
    factors.push("Fragmented Content");
  }

  // Cap score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  let tier: RelevanceScoreResult["tier"] = "REJECTED";
  if (finalScore >= 75) tier = "HIGH_YIELD";
  else if (finalScore >= 60) tier = "USEFUL";
  else if (finalScore >= 45) tier = "LOW_PRIORITY";

  return {
    score: finalScore,
    tier,
    isHighYield: finalScore >= 75,
    yieldFactors: factors,
  };
}

// ============================================================================
// 5. CROSS-CHANNEL DEDUPLICATION & FINGERPRINTING
// ============================================================================

export function normalizeQuestionForFingerprint(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/^(?:q(?:uestion)?[\s\.\:\d\-\)]+|[0-9]{1,3}[\.\)\:\-\s]+)/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(?:which|is|the|of|in|a|an|to|for|at|on|with|by|following|what|who|presents|presented)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeContentFingerprint(text: string, options?: { key: string; text: string }[]): string {
  const normStem = normalizeQuestionForFingerprint(text);
  const normOptions = (options || [])
    .map((o) => o.text.toLowerCase().replace(/[^\w]/g, ""))
    .sort()
    .join("|");

  const combined = normStem + ":::" + normOptions;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

export function calculateBigramSimilarity(textA: string, textB: string): number {
  const a = normalizeQuestionForFingerprint(textA);
  const b = normalizeQuestionForFingerprint(textB);

  if (!a || !b) return 0;
  if (a === b) return 1.0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));

  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
