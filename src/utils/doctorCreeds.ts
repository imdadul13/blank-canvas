/**
 * Doctor Creeds & Intelligent Motivation Bank for FMGE Aspirants
 * Provides high-yield, medicine-specific motivational quotes categorized by circadian phase
 * with dynamic rotation across hours and minutes, and click-to-shuffle capability.
 */

export type CircadianPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export interface DoctorCreed {
  id: string;
  quote: string;
  compact: [string, string]; // Line 1 and Line 2 for narrow header display
  phase?: CircadianPhase | 'all';
  tagline: string;
}

export const DOCTOR_CREEDS: DoctorCreed[] = [
  // --- Dawn & Morning (Energizing, Focus, Daily Foundation) ---
  {
    id: 'dawn-1',
    quote: 'Discipline today leads to freedom tomorrow.',
    compact: ['Discipline today leads to', 'freedom tomorrow. —'],
    phase: 'morning',
    tagline: "DOCTOR'S CREED · FMGE READY",
  },
  {
    id: 'dawn-2',
    quote: 'Every concept you master at dawn is a diagnosis made with confidence tomorrow.',
    compact: ['Master at dawn today,', 'diagnose with confidence tomorrow. —'],
    phase: 'morning',
    tagline: 'DAWN FOCUS · CLINICAL INSTINCT',
  },
  {
    id: 'dawn-3',
    quote: "The white coat isn't given; it is earned one concept at a time.",
    compact: ["The white coat isn't given;", 'it is earned concept by concept. —'],
    phase: 'morning',
    tagline: 'HIGH-YIELD MINDSET · FMGE BOUND',
  },
  {
    id: 'dawn-4',
    quote: 'Morning clarity turns difficult pharmacology into lifelong clinical reflex.',
    compact: ['Morning clarity turns', 'pharma into clinical reflex. —'],
    phase: 'morning',
    tagline: 'PHARMA MASTERY · DAWN SPRINT',
  },
  {
    id: 'dawn-5',
    quote: 'Your future stethoscope will hear the heartbeat of your dedication today.',
    compact: ['Your future stethoscope hears', 'the heartbeat of your study today. —'],
    phase: 'morning',
    tagline: 'PATIENT FIRST · WHITE COAT READY',
  },
  {
    id: 'dawn-6',
    quote: 'Start strong. The 150+ milestone is forged in your morning discipline.',
    compact: ['The 150+ milestone is forged', 'in your morning discipline. —'],
    phase: 'morning',
    tagline: 'TARGET 150+ · NBE READY',
  },

  // --- Afternoon (Momentum, Stamina, Breakthrough, Grit) ---
  {
    id: 'noon-1',
    quote: 'When stamina wanes, let your clinical purpose carry the revision.',
    compact: ['When stamina wanes, let your', 'purpose carry the revision. —'],
    phase: 'afternoon',
    tagline: 'PEAK STAMINA · HIGH ZENITH',
  },
  {
    id: 'noon-2',
    quote: 'Active recall now prevents second-guessing in the exam hall.',
    compact: ['Active recall now prevents', 'second-guessing in the exam. —'],
    phase: 'afternoon',
    tagline: 'ACTIVE RECALL · REVISION SPRINT',
  },
  {
    id: 'noon-3',
    quote: 'Turn mistakes into memory pearls — every error corrected is +1 in the exam.',
    compact: ['Every error corrected today is', '+1 in the final exam. —'],
    phase: 'afternoon',
    tagline: 'PEARL CONSOLIDATION · ZERO PANIC',
  },
  {
    id: 'noon-4',
    quote: 'Doubt kills more exam dreams than tough questions ever will. Trust your prep.',
    compact: ['Doubt kills more dreams than questions.', 'Trust your preparation. —'],
    phase: 'afternoon',
    tagline: 'UNSHAKABLE RESOLVE · KEEP DRILLING',
  },
  {
    id: 'noon-5',
    quote: 'Grand Tests test your preparation; your persistence proves your character.',
    compact: ['Grand Tests test your prep;', 'persistence proves character. —'],
    phase: 'afternoon',
    tagline: 'GT MASTERY · CLINICAL GRIT',
  },
  {
    id: 'noon-6',
    quote: 'Champions study with full commitment on the days they feel completely ordinary.',
    compact: ['Champions study with heart on', 'the days they feel ordinary. —'],
    phase: 'afternoon',
    tagline: 'CHAMPION MINDSET · CLINICAL GRIT',
  },

  // --- Evening (Synthesis, Reflection, Consolidation) ---
  {
    id: 'eve-1',
    quote: 'Consolidate today’s high-yield pearls. Revision is where mastery crystallizes.',
    compact: ['Consolidate your pearls today;', 'revision crystallizes mastery. —'],
    phase: 'evening',
    tagline: 'GOLDEN HOUR · PEARL SYNTHESIS',
  },
  {
    id: 'eve-2',
    quote: 'Consistency outpaces raw brilliance when brilliance forgets to revise.',
    compact: ['Consistency outpaces brilliance', 'when brilliance forgets to revise. —'],
    phase: 'evening',
    tagline: 'SYNAPTIC RETENTION · REVISION LOOP',
  },
  {
    id: 'eve-3',
    quote: 'You are one focused day closer to your permanent medical license.',
    compact: ['One focused day closer to your', 'permanent medical license. —'],
    phase: 'evening',
    tagline: 'MCI REGISTRATION · LICENSED DOCTOR',
  },
  {
    id: 'eve-4',
    quote: 'Reviewing difficult topics tonight turns exam panic into clinical reflex.',
    compact: ['Review tough topics tonight;', 'turn panic into clinical reflex. —'],
    phase: 'evening',
    tagline: 'SYSTEMIC REVIEW · CONFIDENCE LOCK',
  },
  {
    id: 'eve-5',
    quote: 'A day spent mastering medicine is a sacred deposit into your clinical future.',
    compact: ['A day spent mastering medicine is', 'a deposit in your future. —'],
    phase: 'evening',
    tagline: 'SACRED CALLING · HEALER IN TRAINING',
  },
  {
    id: 'eve-6',
    quote: "Close today's study block with pride. You showed up for your future patients.",
    compact: ["Close your books with pride.", 'You showed up for your patients. —'],
    phase: 'evening',
    tagline: 'PATIENT ADVOCATE · NO REGRETS',
  },

  // --- Night (Quiet Grit, Midnight Oil, Nocturnal Mastery) ---
  {
    id: 'night-1',
    quote: 'Quiet nocturnal hours build clinical mastery while the world rests.',
    compact: ['Quiet nocturnal hours build', 'mastery while the world rests. —'],
    phase: 'night',
    tagline: 'NIGHT VIGIL · NOCTURNAL FOCUS',
  },
  {
    id: 'night-2',
    quote: 'The midnight oil burns bright, but your medical dream burns brighter.',
    compact: ['The midnight oil burns bright;', 'your dream burns brighter. —'],
    phase: 'night',
    tagline: 'MEDICINE CALLING · MIDNIGHT VIGIL',
  },
  {
    id: 'night-3',
    quote: 'Every tough concept conquered tonight will feel effortless on exam day.',
    compact: ['Every tough concept conquered tonight', 'feels effortless on exam day. —'],
    phase: 'night',
    tagline: 'EXAM TEMPERING · ZERO DOUBT',
  },
  {
    id: 'night-4',
    quote: 'Calm mind, steady hands. You are stronger and sharper than your doubts.',
    compact: ['Calm mind, steady hands.', 'You are sharper than your doubts. —'],
    phase: 'night',
    tagline: 'INNER FORTITUDE · SURGICAL CALM',
  },
  {
    id: 'night-5',
    quote: 'Silent dedication in the late hours creates the physicians patients trust most.',
    compact: ['Late-hour dedication creates', 'the physicians patients trust most. —'],
    phase: 'night',
    tagline: 'FUTURE CONSULTANT · UNWAVERING TRUST',
  },
  {
    id: 'night-6',
    quote: 'Rest well when your study block ends — memory consolidation happens in sleep.',
    compact: ['Rest well when done;', 'memory consolidates in sleep. —'],
    phase: 'night',
    tagline: 'SYNAPTIC CONSOLIDATION · REST & RECHARGE',
  },

  // --- Universal Clinical Power (Applicable Across All Hours) ---
  {
    id: 'uni-1',
    quote: 'Knowledge is the only shield a doctor carries into the emergency ward.',
    compact: ['Knowledge is the only shield', 'a doctor carries into the ward. —'],
    phase: 'all',
    tagline: 'EMERGENCY READY · DOCTOR OF MEDICINE',
  },
  {
    id: 'uni-2',
    quote: "Don't study just to pass — study until clinical diagnosis becomes your second nature.",
    compact: ["Don't study just to pass;", 'study until diagnosis is second nature. —'],
    phase: 'all',
    tagline: 'DIAGNOSTIC INTUITION · NBE READY',
  },
  {
    id: 'uni-3',
    quote: 'The stethoscope weighs mere ounces, but carries a lifetime of patient trust.',
    compact: ['The stethoscope weighs mere ounces,', 'but carries a lifetime of trust. —'],
    phase: 'all',
    tagline: 'CLINICAL WEIGHT · SACRED TRUST',
  },
  {
    id: 'uni-4',
    quote: 'Every single mark above 150 is built on patient, unglamorous consistency.',
    compact: ['Every mark above 150 is built on', 'patient, unglamorous consistency. —'],
    phase: 'all',
    tagline: 'THRESHOLD BREAKER · 150+ CONFIRMED',
  },
  {
    id: 'uni-5',
    quote: 'Master the high-yield core. Clinical precision always triumphs over panic.',
    compact: ['Master the high-yield core.', 'Precision always beats panic. —'],
    phase: 'all',
    tagline: 'HIGH-YIELD CORE · CLINICAL PRECISION',
  },
  {
    id: 'uni-6',
    quote: 'One day, a patient will walk out of the hospital healthy because of your study today.',
    compact: ['A patient will walk out healthy', 'because of your study today. —'],
    phase: 'all',
    tagline: 'SAVING LIVES · THE NOBLE PROFESSION',
  },
];

/**
 * Deterministically and smartly resolves a creed based on:
 * - Current circadian phase (morning, afternoon, evening, night)
 * - Time of day (rotates every 5 minutes / hourly)
 * - User override shuffle index (if clicked)
 */
export function resolveIntelligentCreed(
  phase: CircadianPhase,
  timestamp: Date = new Date(),
  manualOffset: number = 0
): DoctorCreed {
  // 1. Filter creeds that match the current phase or 'all'
  const matchingCreeds = DOCTOR_CREEDS.filter(
    (c) => c.phase === phase || c.phase === 'all'
  );

  const pool = matchingCreeds.length > 0 ? matchingCreeds : DOCTOR_CREEDS;

  // 2. Intelligent time-based slotting:
  // Rotates every 5 minutes throughout the day, ensuring high variety across minutes and hours
  const hour = timestamp.getHours();
  const minuteBlock = Math.floor(timestamp.getMinutes() / 5); // 0 to 11
  const dayOfYear = Math.floor(
    (timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Pseudo-random hash that changes every 5 minutes and changes across days & hours
  const timeHash = (dayOfYear * 288 + hour * 12 + minuteBlock) % 10000;

  const resolvedIndex = Math.abs(timeHash + manualOffset) % pool.length;
  return pool[resolvedIndex];
}
