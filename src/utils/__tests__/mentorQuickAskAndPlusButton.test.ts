import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('Mentor Streamlined Quick Ask & Decluttered Inquiry Navigation', () => {
  it('1. AiCoachView defines handleQuickAskNew with scroll, focus, and highlight behavior', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('const handleQuickAskNew = () =>'), 'Must define handleQuickAskNew');
    assert.ok(coachContent.includes('textareaRef.current.focus()'), 'Must focus textarea automatically');
    assert.ok(coachContent.includes('textareaRef.current.scrollIntoView'), 'Must scroll textarea into view');
    assert.ok(coachContent.includes('setIsPromptHighlighted(true)'), 'Must highlight prompt desk with glowing ring');
  });

  it('2. Streamlined Ask New jump button is only rendered when scrolled up away from bottom', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('{showScrollBottom && ('), 'Must be conditioned on showScrollBottom so zero clutter when at bottom');
    assert.ok(coachContent.includes('Ask New'), 'Must show clean Ask New label');
    assert.ok(coachContent.includes('onClick={handleQuickAskNew}'), 'Must bind to handleQuickAskNew to jump and focus');
  });

  it('3. Duplicate and cluttering buttons are eliminated from message view and prompt desk', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(!coachContent.includes('Sticky Consultation Sub-Header'), 'Sticky sub-header clutter must be removed');
    assert.ok(!coachContent.includes('fixed bottom-5 right-5'), 'Fixed bottom-right double button clutter must be removed');

    const deskContent = fs.readFileSync('src/components/mentor/MentorPromptDesk.tsx', 'utf8');
    assert.ok(!deskContent.includes('onNewSession'), 'MentorPromptDesk must not have duplicate onNewSession prop');
  });

  it('4. MentorHeader retains the primary, prominent New Chat button', () => {
    const headerContent = fs.readFileSync('src/components/mentor/MentorHeader.tsx', 'utf8');
    assert.ok(headerContent.includes('onNewSession'), 'MentorHeader must receive onNewSession');
    assert.ok(headerContent.includes('New Chat'), 'MentorHeader must display single authoritative New Chat action');
  });
});
