import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('Universal Command Palette (Cmd+K / Ctrl+K) & Navigation', () => {
  it('1. CommandPaletteModal component exists and covers all 19 FMGE subjects', () => {
    const paletteContent = fs.readFileSync('src/components/CommandPaletteModal.tsx', 'utf8');
    assert.ok(paletteContent.includes('FMGE_SUBJECTS.forEach'), 'Must iterate through all 19 FMGE subjects');
    assert.ok(paletteContent.includes('Ask Faculty Mentor'), 'Must include quick action for AI Coach');
    assert.ok(paletteContent.includes('Start Practice QBank Session'), 'Must include quick action for practice MCQs');
    assert.ok(paletteContent.includes('Review Mistake Notebook'), 'Must include quick action for errors review');
    assert.ok(paletteContent.includes('Explore Pearls Vault'), 'Must include quick action for pearls vault');
  });

  it('2. CommandPaletteModal handles keyboard navigation and shortcuts', () => {
    const paletteContent = fs.readFileSync('src/components/CommandPaletteModal.tsx', 'utf8');
    assert.ok(paletteContent.includes("e.key === 'ArrowDown'"), 'Must support ArrowDown navigation');
    assert.ok(paletteContent.includes("e.key === 'ArrowUp'"), 'Must support ArrowUp navigation');
    assert.ok(paletteContent.includes("e.key === 'Enter'"), 'Must support Enter selection');
    assert.ok(paletteContent.includes("e.key === 'Escape'"), 'Must support Escape to dismiss');
  });

  it('3. App.tsx binds global Cmd+K shortcut and mounts CommandPaletteModal', () => {
    const appContent = fs.readFileSync('src/App.tsx', 'utf8');
    assert.ok(appContent.includes('isCommandPaletteOpen'), 'App.tsx must manage isCommandPaletteOpen state');
    assert.ok(appContent.includes("e.key.toLowerCase() === 'k'"), 'Must listen for Cmd+K / Ctrl+K');
    assert.ok(appContent.includes('<CommandPaletteModal'), 'Must mount CommandPaletteModal');
    assert.ok(appContent.includes('onAddCustomPearl={handleAddCustomPearl}'), 'Must pass handleAddCustomPearl to AiCoachView');
    assert.ok(appContent.includes('onAddErrorItem={handleAddErrorItem}'), 'Must pass handleAddErrorItem to AiCoachView');
  });
});
