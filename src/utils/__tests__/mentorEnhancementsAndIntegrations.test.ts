import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('Faculty Mentor New Clinical & Retention Super-Features', () => {
  it('1. AiCoachView supports saving AI responses as custom pearls in Pearls Vault', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('onAddCustomPearl?: (pearl: MedicalPearl) => void;'), 'AiCoachViewProps must accept onAddCustomPearl');
    assert.ok(coachContent.includes('handleSaveToPearls'), 'AiCoachView must define handleSaveToPearls');
    assert.ok(coachContent.includes('Save as Pearl'), 'Must offer Save as Pearl button next to Copy');
    assert.ok(coachContent.includes('Saved to Pearls'), 'Must display feedback when pearl is saved');
  });

  it('2. AiCoachView provides interactive contextual active recall chips', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('Active Recall:'), 'Must display Active Recall section under answers');
    assert.ok(coachContent.includes('Quiz me on this'), 'Must provide one-tap Quiz me on this prompt chip');
    assert.ok(coachContent.includes('FMGE Traps'), 'Must provide one-tap FMGE Traps prompt chip');
    assert.ok(coachContent.includes('DOC & Protocol'), 'Must provide one-tap DOC & Protocol prompt chip');
  });

  it('3. MentorPromptDesk supports hands-free speech-to-text voice dictation', () => {
    const deskContent = fs.readFileSync('src/components/mentor/MentorPromptDesk.tsx', 'utf8');
    assert.ok(deskContent.includes('toggleVoiceDictation'), 'MentorPromptDesk must define toggleVoiceDictation');
    assert.ok(deskContent.includes('SpeechRecognition'), 'Must utilize Web Speech Recognition API');
    assert.ok(deskContent.includes('isListening'), 'Must track microphone recording state');
    assert.ok(deskContent.includes('Dictate question (Speech-to-Text)'), 'Must render dictation action button');
  });

  it('4. MentorClinicalChallengeCard supports one-tap logging of mistakes to error notebook', () => {
    const cardContent = fs.readFileSync('src/components/mentor/MentorClinicalChallengeCard.tsx', 'utf8');
    assert.ok(cardContent.includes('onAddErrorItem?: (item: ErrorNotebookItem) => void;'), 'Card must accept onAddErrorItem prop');
    assert.ok(cardContent.includes('Log to Mistake Notebook'), 'Must offer Log to Mistake Notebook action button');
    assert.ok(cardContent.includes('Logged to Mistake Notebook'), 'Must provide visual confirmation once logged');
  });

  it('5. MentorHistoryDrawer provides subject filtering and export consultation note', () => {
    const historyContent = fs.readFileSync('src/components/mentor/MentorHistoryDrawer.tsx', 'utf8');
    assert.ok(historyContent.includes('availableSubjects'), 'Must derive available subjects across past consultations');
    assert.ok(historyContent.includes('Subject:'), 'Must provide subject filter strip in history drawer');
    assert.ok(historyContent.includes('onExportSession'), 'Must accept onExportSession callback');
    assert.ok(historyContent.includes('Export consultation note (.md)'), 'Must render export note button');
  });
});
