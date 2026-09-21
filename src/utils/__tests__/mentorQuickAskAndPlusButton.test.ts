import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('Mentor Quick Ask (+) Button & Effortless Inquiry Navigation', () => {
  it('1. AiCoachView defines handleQuickAskNew with scroll and focus behavior', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('const handleQuickAskNew = () =>'), 'Must define handleQuickAskNew');
    assert.ok(coachContent.includes('textareaRef.current.focus()'), 'Must focus textarea automatically');
    assert.ok(coachContent.includes('textareaRef.current.scrollIntoView'), 'Must scroll textarea into view');
    assert.ok(coachContent.includes('setIsPromptHighlighted(true)'), 'Must highlight prompt desk with glowing ring');
  });

  it('2. Floating Quick Ask New (+) Action Button is rendered for instant access without scrolling', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('Floating Quick "Ask New (+)" Action Button'), 'Must include floating action button');
    assert.ok(coachContent.includes('Ask New'), 'Must show Ask New label');
    assert.ok(coachContent.includes('onClick={handleQuickAskNew}'), 'Must bind to handleQuickAskNew');
    assert.ok(coachContent.includes('fixed bottom-'), 'Must be fixed in viewport so scrolling is never required');
  });

  it('3. Sticky consultation sub-header allows quick ask and new chat from the top of messages', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('Sticky Consultation Sub-Header with Instant + Ask Action Button'), 'Must include sticky sub-header');
    assert.ok(coachContent.includes('Ask Question'), 'Must include Ask Question quick trigger');
  });

  it('4. MentorPromptDesk includes a + button for quick fresh inquiry next to attachment tools', () => {
    const deskContent = fs.readFileSync('src/components/mentor/MentorPromptDesk.tsx', 'utf8');
    assert.ok(deskContent.includes('onNewSession?: () => void;'), 'MentorPromptDeskProps must accept onNewSession');
    assert.ok(deskContent.includes('onClick={onNewSession}'), 'Must bind onNewSession to button');
    assert.ok(deskContent.includes('Start a new consultation (clean slate)'), 'Must provide clear title for new inquiry button');
  });
});
