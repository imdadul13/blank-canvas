import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMcqFromMarkdown } from '../../components/AiCoachView';

test('Mentor Phase 5B - parseMcqFromMarkdown correctly parses markdown questions without revealing answers', () => {
  const sampleMarkdown = `A 45-year-old woman presents with persistent dry eyes and xerostomia for 8 months. On examination, bilateral parotid enlargement is noted. Schirmer's test reveals 3 mm wetting in 5 minutes.

A. Schirmer test
B. Anti-Ro / SSA antibody
C. Minor salivary gland lip biopsy
D. Rose Bengal corneal staining

Correct Answer: Option C

Clinical Reasoning:
Minor salivary gland lip biopsy showing focal lymphocytic sialadenitis (focus score >= 1 per 4 mm² of tissue) remains the definitive gold standard diagnostic investigation for Sjögren syndrome.

FMGE Takeaway:
Focus score >= 1 on minor salivary gland biopsy is the definitive histopathological discriminator.

Exam Trap:
Anti-Ro and Anti-La are highly sensitive serological screening markers, but histopathological tissue biopsy is the definitive gold standard.`;

  const parsed = parseMcqFromMarkdown(sampleMarkdown, 'General Medicine', 'Rheumatology');
  assert.ok(parsed !== null, 'Should successfully parse structured MCQ');
  assert.equal(parsed.quiz.options.length, 4);
  assert.equal(parsed.quiz.options[0].key, 'A');
  assert.equal(parsed.quiz.options[1].key, 'B');
  assert.equal(parsed.quiz.options[2].key, 'C');
  assert.equal(parsed.quiz.options[3].key, 'D');
  assert.equal(parsed.quiz.correctKey, 'C');
  assert.ok(parsed.quiz.explanation.includes('Minor salivary gland lip biopsy'));
  assert.ok(parsed.quiz.fmgeTakeaway?.includes('Focus score'));
  assert.ok(parsed.quiz.trap?.includes('Anti-Ro'));
  // Ensure the answer is stripped from cleaned text so it never leaks
  assert.ok(!parsed.cleanedText.includes('Correct Answer: Option C'));
});

test('Mentor Phase 5B - parseMcqFromMarkdown safely ignores normal non-MCQ clinical explanations', () => {
  const normalText = `### Nephrotic Syndrome Overview
Nephrotic syndrome is characterized by heavy proteinuria (>3.5 g/day), hypoalbuminemia (<3.0 g/dL), generalized edema, and hyperlipidemia.
- **Minimal Change Disease**: Most common in children. Normal on light microscopy, podocyte effacement on electron microscopy.
- **Membranous Nephropathy**: Subepithelial spike and dome appearance.`;

  const result = parseMcqFromMarkdown(normalText);
  assert.equal(result, null, 'Should return null for non-MCQ conversational explanations');
});

test('Mentor Phase 5B - Exam countdown formatting handles edge cases gracefully', () => {
  const formatCountdown = (days: number | null | undefined) => {
    if (days === undefined || days === null) return { text: 'Target', sub: 'to FMGE' };
    if (days < 0) return { text: 'Ready', sub: 'Exam Phase' };
    if (days === 0) return { text: 'Today', sub: 'Exam Day' };
    if (days === 1) return { text: 'Tomorrow', sub: '1d to FMGE' };
    return { text: `${days}d`, sub: 'to FMGE' };
  };

  assert.deepEqual(formatCountdown(45), { text: '45d', sub: 'to FMGE' });
  assert.deepEqual(formatCountdown(1), { text: 'Tomorrow', sub: '1d to FMGE' });
  assert.deepEqual(formatCountdown(0), { text: 'Today', sub: 'Exam Day' });
  assert.deepEqual(formatCountdown(-2), { text: 'Ready', sub: 'Exam Phase' });
  assert.deepEqual(formatCountdown(null), { text: 'Target', sub: 'to FMGE' });
});
