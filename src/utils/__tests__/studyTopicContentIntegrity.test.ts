import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getNormalizedTopicIntelligence, getTopicLearningContext, detectTopicCategory } from '../topicIntelligence';
import { generateSlideDeck } from '../slideEngine';
import { generateFlashcardDeck } from '../flashcardEngine';
import { generateTopicPearls } from '../pearlEngine';
import { generateTopicClinicalCasesDeck } from '../clinicalCaseEngine';
import { validateTopicContentConsistency } from '../contentValidator';

describe('Study Topic Content Integrity & Category Awareness', () => {
  it('correctly categorizes topic types for diverse medical disciplines', () => {
    assert.equal(detectTopicCategory('biochemistry', 'Enzyme Kinetics & Lineweaver-Burk Plots'), 'biochemical_concept');
    assert.equal(detectTopicCategory('anatomy', 'Upper Limb - Brachial Plexus & Nerve Injuries'), 'anatomical_structure');
    assert.equal(detectTopicCategory('physiology', 'Nerve-Muscle Physiology & Action Potentials'), 'physiological_mechanism');
    assert.equal(detectTopicCategory('pharmacology', 'Autonomic Nervous System - Beta Blockers'), 'pharmacological_class');
    assert.equal(detectTopicCategory('pathology', 'Hematology - Hodgkin & Non-Hodgkin Lymphomas'), 'pathological_entity');
    assert.equal(detectTopicCategory('medicine', 'Pulmonology - Asthma & COPD'), 'clinical_disease');
  });

  it('generates authentic, concept-rich slides for Biochemistry without generic disease templates', () => {
    const deck = generateSlideDeck('biochemistry', 'bio-1', 'Enzyme Kinetics & Lineweaver-Burk Plots');
    assert.ok(deck.slides.length >= 4);

    const fullSlideText = deck.slides.map(s => `${s.title} ${s.subtitle || ''} ${s.bullets.join(' ')}`).join(' ');
    assert.ok(fullSlideText.toLowerCase().includes('km'));
    assert.ok(fullSlideText.toLowerCase().includes('vmax'));
    assert.ok(fullSlideText.toLowerCase().includes('lineweaver'));
    assert.ok(fullSlideText.toLowerCase().includes('competitive'));

    // Reject cross-topic contamination
    const validation = validateTopicContentConsistency(fullSlideText, 'Biochemistry', 'Enzyme Kinetics', 'biochemical_concept');
    assert.equal(validation.isValid, true);
    assert.equal(validation.hasContamination, false);
  });

  it('generates authentic flashcards for Biochemistry containing Km, Vmax, and Lineweaver-Burk', () => {
    const flashcards = generateFlashcardDeck('biochemistry', 'bio-1', 'Enzyme Kinetics & Lineweaver-Burk Plots');
    assert.ok(flashcards.cards.length >= 5);

    const fullCardText = flashcards.cards.map(c => `${c.front} ${c.back} ${c.clinicalPearl || ''}`).join(' ');
    assert.ok(fullCardText.toLowerCase().includes('km'));
    assert.ok(fullCardText.toLowerCase().includes('vmax'));
    assert.ok(fullCardText.toLowerCase().includes('competitive'));
    assert.ok(!fullCardText.includes('myocardial infarction'));
  });

  it('generates authentic pearls for Biochemistry containing Lineweaver-Burk intercepts', () => {
    const pearls = generateTopicPearls('biochemistry', 'bio-1', 'Enzyme Kinetics & Lineweaver-Burk Plots');
    assert.ok(pearls.length >= 3);

    const fullPearlText = pearls.map(p => `${p.statement} ${p.discriminatorTip || ''} ${p.examTrapWarning || ''}`).join(' ');
    assert.ok(fullPearlText.toLowerCase().includes('competitive'));
    assert.ok(fullPearlText.toLowerCase().includes('lineweaver'));
    assert.ok(!fullPearlText.includes('ST elevation'));
  });

  it('generates authentic Pulmonology slides containing GINA & GOLD guidelines', () => {
    const deck = generateSlideDeck('medicine', 'med-4', 'Pulmonology - Asthma (GINA Guidelines), COPD (GOLD Guidelines)');
    assert.ok(deck.slides.length >= 3);

    const fullSlideText = deck.slides.map(s => `${s.title} ${s.subtitle || ''} ${s.bullets.join(' ')}`).join(' ');
    assert.ok(fullSlideText.toLowerCase().includes('gina'));
    assert.ok(fullSlideText.toLowerCase().includes('gold'));
    assert.ok(fullSlideText.toLowerCase().includes('spirometry'));
    assert.ok(fullSlideText.toLowerCase().includes('formoterol'));

    const validation = validateTopicContentConsistency(fullSlideText, 'General Medicine', 'Asthma and COPD', 'clinical_disease');
    assert.equal(validation.isValid, true);
    assert.equal(validation.hasContamination, false);
  });

  it('generates authentic Pathology flashcards containing Reed-Sternberg and CD15/CD30', () => {
    const flashcards = generateFlashcardDeck('pathology', 'path-8', 'Hematology - Hodgkin & Non-Hodgkin Lymphomas');
    const fullCardText = flashcards.cards.map(c => `${c.front} ${c.back} ${c.clinicalPearl || ''}`).join(' ');
    assert.ok(fullCardText.toLowerCase().includes('reed-sternberg'));
    assert.ok(fullCardText.includes('CD15'));
    assert.ok(fullCardText.includes('CD30'));
    assert.ok(!fullCardText.includes('bronchospasm'));
  });
});
