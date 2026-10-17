import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('Question Bank - Personalized Mistake Review Optimization', () => {
  it('1. QuestionBankView decoples submit button loading from background tutor review', () => {
    const qbView = fs.readFileSync('src/components/QuestionBankView.tsx', 'utf8');
    
    // submit() must immediately release loading
    assert.ok(qbView.includes('setLoading(false);'), 'Must release loading state on answer submit');
    assert.ok(!qbView.includes('await requestTutorReview(answer.answerReceipt)'), 'Must NOT synchronously await requestTutorReview in submit');
    assert.ok(qbView.includes('void requestTutorReview(answer.answerReceipt)'), 'Must call requestTutorReview non-blockingly');
  });

  it('2. QuestionBankView maintains client session cache and does not disable Next Question', () => {
    const qbView = fs.readFileSync('src/components/QuestionBankView.tsx', 'utf8');
    
    // Cache ref must be declared
    assert.ok(qbView.includes('tutorCacheRef'), 'Must declare tutorCacheRef for instant retrieval');
    assert.ok(qbView.includes('tutorCacheRef.current[q.id]'), 'Must look up cached tutor review for question');
    
    // Next question button must NOT be disabled on tutorLoading
    assert.ok(qbView.includes("onClick={next} disabled={loading}"), 'Next button must not be disabled on background tutorLoading');
    assert.ok(!qbView.includes("disabled={loading||tutorLoading}"), 'Must not disable Next button while tutor is loading');
  });

  it('3. Server fmge-routes implements in-memory LRU cache and instant fallback synthesis', () => {
    const routes = fs.readFileSync('server/fmge-routes.ts', 'utf8');
    
    // Must contain cache declaration and lookup
    assert.ok(routes.includes('tutorReviewCache'), 'Must maintain in-memory tutorReviewCache');
    assert.ok(routes.includes('X-Cache'), 'Must indicate cache status');
    
    // Must use fast-path model with capped timeout (<= 8s)
    assert.ok(routes.includes('gemini-flash-lite-latest') || routes.includes('gemini-3.5-flash-lite'), 'Must use fast lite model for tutor');
    assert.ok(routes.includes('timeoutMs: 7000') || routes.includes('timeoutMs: 8000'), 'Must cap tutor timeout to under 8s');
    
    // Must contain generateInstantTutorReview fallback
    assert.ok(routes.includes('function generateInstantTutorReview'), 'Must implement instant clinical fallback synthesizer');
    assert.ok(routes.includes('generateInstantTutorReview(question'), 'Must invoke fallback when Gemini times out or is unavailable');
  });

  it('4. Rate limit on /api/question-bank/tutor is raised for responsive study sprints', () => {
    const routes = fs.readFileSync('server/fmge-routes.ts', 'utf8');
    assert.ok(routes.includes('app.post("/api/question-bank/tutor", createRequestRateLimit({ windowMs: 60_000, maxRequests: 30 })'), 'Must permit at least 30 tutor requests per minute');
  });
});
