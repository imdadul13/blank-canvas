import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cleanTextForClipboard } from '../../components/AiCoachView';

describe('Phase 8 — Faculty Mentor Live Session UX & Response Experience', () => {
  describe('1. Clean Clipboard Copy Sanitization', () => {
    it('strips markdown headers, bold tokens, blockquotes, and link syntax', () => {
      const dirtyMarkdown = `### 🩺 High-Yield IBD Breakdown: **Crohn's Disease**

> 💡 **Core Diagnostic Rule**: Look for transmural non-caseating granulomas.

- **Location**: Affects **any part of GI tract** from [mouth to anus](https://example.com).
- **Gold standard**: Colonoscopy with ileoscopy and biopsy.
\`\`\`ts
const codeSnippet = true;
\`\`\`
Refer to \`ASCA\` and \`p-ANCA\`.`;

      const cleaned = cleanTextForClipboard(dirtyMarkdown);

      assert.ok(!cleaned.includes('###'), 'Headers must be stripped');
      assert.ok(!cleaned.includes('**'), 'Bold stars must be stripped');
      assert.ok(!cleaned.includes('> 💡'), 'Blockquotes must be stripped');
      assert.ok(!cleaned.includes('```'), 'Code fences must be stripped');
      assert.ok(!cleaned.includes('https://example.com'), 'Raw link URLs must be stripped');
      assert.ok(cleaned.includes('mouth to anus'), 'Link text must be preserved');
      assert.ok(cleaned.includes("Crohn's Disease"), 'Plain text must be preserved');
      assert.ok(cleaned.includes('Colonoscopy with ileoscopy'), 'Clinical content must be intact');
    });

    it('gracefully handles empty or pure whitespace strings', () => {
      assert.equal(cleanTextForClipboard(''), '');
      assert.equal(cleanTextForClipboard('   '), '');
    });
  });

  describe('2. Selective Medical Concept Emphasis in MarkdownRenderer', () => {
    it('MarkdownRenderer defines medical anchor badges for high-yield keywords', () => {
      const rendererFile = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');

      assert.ok(rendererFile.includes('isAnchor'), 'Must define isAnchor check');
      assert.ok(rendererFile.includes('gold standard'), 'Must highlight gold standard');
      assert.ok(rendererFile.includes('first-line'), 'Must highlight first-line');
      assert.ok(rendererFile.includes('most common'), 'Must highlight most common');
      assert.ok(rendererFile.includes('contraindicated'), 'Must highlight contraindicated');
      assert.ok(rendererFile.includes('classic presentation'), 'Must highlight classic presentation');
      assert.ok(rendererFile.includes('fmge pearl'), 'Must highlight fmge pearl');
    });
  });

  describe('3. Response Hierarchy & Length Scaling in Server Engine', () => {
    it('server fmge-routes contains explicit response scaling directives', () => {
      const serverRoutes = fs.readFileSync('server/fmge-routes.ts', 'utf8');

      assert.ok(serverRoutes.includes('RESPONSE HIERARCHY & LENGTH SCALING'), 'Must instruct Gemini on response hierarchy');
      assert.ok(serverRoutes.includes('SHORT FACTUAL QUESTIONS'), 'Must scale short questions to direct answers');
      assert.ok(serverRoutes.includes('TEACHING REQUESTS'), 'Must scale teaching requests to numbered modules');
      assert.ok(serverRoutes.includes('RAPID REVISION'), 'Must support rapid clinical flow');
      assert.ok(serverRoutes.includes('DYNAMIC SUGGESTED FOLLOW-UPS'), 'Must require 3-5 tailored prompt chips');
    });

    it('offline engine returns direct concise answer for short gold standard queries', () => {
      const serverRoutes = fs.readFileSync('server/fmge-routes.ts', 'utf8');

      assert.ok(serverRoutes.includes('Direct Answer: Gold Standard for Crohn\'s Disease'), 'Must provide direct answer for gold standard');
      assert.ok(serverRoutes.includes('Rapid Revision: **Crohn\'s Disease**'), 'Must provide rapid revision definition flow');
      assert.ok(serverRoutes.includes('Clinical Faculty Masterclass: **Crohn\'s Disease**'), 'Must provide 7-module masterclass for teaching');
    });
  });

  describe('4. MCQ 4-Part Remediation & Gentle Feedback Experience', () => {
    it('MentorClinicalChallengeCard implements structured remediation sections', () => {
      const cardFile = fs.readFileSync('src/components/mentor/MentorClinicalChallengeCard.tsx', 'utf8');

      // Header & counter
      assert.ok(cardFile.includes('counterText'), 'Must support question counter');
      assert.ok(cardFile.includes('questionNumber'), 'Must accept questionNumber prop');

      // Structured remediation
      assert.ok(cardFile.includes('Why you missed it'), 'Must provide distractor trap analysis for misses');
      assert.ok(cardFile.includes('Clinical Rationale · Why Option'), 'Must provide why correct option is correct');
      assert.ok(cardFile.includes('Why other options are wrong'), 'Must provide distractor breakdown');
      assert.ok(cardFile.includes('FMGE Key Takeaway · Pearl'), 'Must provide high-yield pearl');

      // Gentle non-harsh styling
      assert.ok(cardFile.includes('bg-teal-50/70'), 'Must use soft teal instead of harsh neon green');
      assert.ok(cardFile.includes('bg-amber-50/70'), 'Must use gentle sand/amber tone instead of harsh red');
    });

    it('MentorQuizRunner implements structured remediation and locked answers', () => {
      const runnerFile = fs.readFileSync('src/components/mentor/MentorQuizRunner.tsx', 'utf8');

      assert.ok(runnerFile.includes('Why you missed it'), 'Must provide missed trap explanation');
      assert.ok(runnerFile.includes('Clinical Reasoning Checkpoint · Why Option'), 'Must provide correct rationale checkpoint');
      assert.ok(runnerFile.includes('Why other options are less appropriate:'), 'Must provide distractor analysis');
      assert.ok(runnerFile.includes('Watch for this FMGE Trap: FMGE Pearl'), 'Must provide exam trap pearl');
    });
  });

  describe('5. Live Session UX: Auto-Scroll, Thinking State & Session Resumption', () => {
    it('AiCoachView implements calm faculty thinking state', () => {
      const coachFile = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');

      assert.ok(
        coachFile.includes('Faculty Mentor: Reviewing the clinical reasoning…'),
        'Must display calm senior faculty thinking text'
      );
    });

    it('AiCoachView respects user scroll position and provides latest message return button', () => {
      const coachFile = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');

      assert.ok(coachFile.includes('isUserScrolledUpRef'), 'Must track user upward scroll');
      assert.ok(coachFile.includes('Latest message'), 'Must provide smooth Latest Message floating pill');
      assert.ok(coachFile.includes('handleRetry'), 'Must support Try Again retry action on error');
    });

    it('AiCoachView persists active quiz sessions and supports continuation', () => {
      const coachFile = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');

      assert.ok(coachFile.includes('quizSession'), 'Must manage active quiz session');
      assert.ok(coachFile.includes('Boolean(s.quizSession)'), 'Must persist sessions with active quiz state');
    });
  });
});
