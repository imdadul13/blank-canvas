import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getGeminiApiKey } from '../../../server/fmge-routes';

describe('Gemini AI Engine Status & Configuration Verification', () => {
  it('1. getGeminiApiKey resolves and strips surrounding quotes cleanly', () => {
    const original = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = '  "test-api-key-123"  ';
      const resolved = getGeminiApiKey();
      assert.equal(resolved, 'test-api-key-123');

      process.env.GEMINI_API_KEY = "  'test-single-quotes'  ";
      const resolvedSingle = getGeminiApiKey();
      assert.equal(resolvedSingle, 'test-single-quotes');
    } finally {
      process.env.GEMINI_API_KEY = original;
    }
  });

  it('2. GET /api/ai/status endpoint responds with active configuration schema', async () => {
    const res = await fetch('http://localhost:3000/api/ai/status');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(typeof data.configured, 'boolean');
    assert.ok(data.status);
    assert.ok(data.activeModel);
  });

  it('3. POST /api/ai/config validates short or missing keys safely', async () => {
    const res = await fetch('http://localhost:3000/api/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'short' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('Valid Gemini API key string is required'));
  });

  it('4. GET /api/health includes geminiConfigured health signal', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(typeof data.geminiConfigured, 'boolean');
  });
});
