/**
 * Mentor's entity palette.
 *
 * Mentor is not monochrome. Every surface in the tab that represents a
 * *distinguishable thing* — a mode of asking, a subject, a recall action, a
 * clinical risk — takes one colour from this fixed set, and that colour
 * always means the same thing everywhere it appears.
 *
 * The shape matches `DashboardView`'s per-subject map (`bar` / `track` /
 * `badge` / `text`) on purpose: Dashboard already proved the pattern on a
 * screen full of entities. What was missing was discipline — the earlier
 * `MentorValuePropsBanner` handed five props five unrelated hues with nothing
 * to tie them to, which is decoration, not a system.
 *
 * Rules, so this stays a system and not a second rainbow:
 *   1. the brand teal is reserved for Mentor itself and primary actions
 *   2. a hue is bound to an entity, never to a position, so a card keeps its
 *      colour when the list reorders
 *   3. red is reserved for clinical risk and wrong answers; amber for caution;
 *      green for confirmed-correct. Those three never become decorative.
 *
 * Values are the same Apple system colours Dashboard already ships, so the
 * tabs read as one family.
 */
export type MentorHueKey =
  | 'mentor'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'green'
  | 'red'
  | 'amber';

export interface MentorHue {
  /** Solid fill: progress bars, the letter pill, ring strokes. */
  bar: string;
  /** Recessed track behind a `bar`. */
  track: string;
  /** 10% wash + 15% hairline + full-strength text, for inline chips. */
  badge: string;
  /** Text/icon colour only, no background. */
  text: string;
  /** Icon-tile wash. */
  tint: string;
  /** 15% hairline, for a translucent card edge that must read as tinted. */
  edge: string;
}

const hue = (hex: string, alpha = 0.1): MentorHue => ({
  bar: hex,
  track: `color-mix(in srgb, ${hex} 9%, transparent)`,
  badge: `text-[color-mix(in_srgb,${hex}_82%,black)] bg-[color-mix(in_srgb,${hex}_${alpha * 100}%,white)] border-[color-mix(in_srgb,${hex}_18%,transparent)]`,
  text: hex,
  tint: `color-mix(in srgb, ${hex} 10%, white)`,
  edge: `color-mix(in srgb, ${hex} 15%, transparent)`,
});

export const MENTOR_HUES: Record<MentorHueKey, MentorHue> = {
  mentor: hue('#007AFF'),
  blue: hue('#32ADE6'),
  purple: hue('#BF5AF2'),
  orange: hue('#FF9500'),
  green: hue('#30D158'),
  red: hue('#FF3B30'),
  amber: hue('#FF9F0A'),
};

/** Hero wash, per the four-stop ramp the reference heroes use. */
export const MENTOR_HERO_STOPS: [string, string, string, string] = [
  '#EFF6FF',
  '#DBEAFE',
  '#93C5FD',
  '#007AFF',
];

/**
 * The four ways to ask. Each keeps its hue everywhere it appears — card,
 * chip, and the icon that opens the result.
 */
export const ASK_MODE_HUE: Record<string, MentorHueKey> = {
  concept: 'blue',
  compare: 'purple',
  mcq: 'orange',
  quiz: 'green',
};

/** Recall actions after an answer. */
export const RECALL_HUE = {
  mcq: 'orange',
  traps: 'amber',
  doc: 'green',
} as const satisfies Record<string, MentorHueKey>;
