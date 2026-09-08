import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('FMGE AI Coach - Response Content & Document Rendering', () => {
  it('1. POST /api/ai/chat endpoint is configured with Gemini 3.7 Flash and student context', async () => {
    const routesContent = fs.readFileSync('server/fmge-routes.ts', 'utf8');
    assert.ok(routesContent.includes('app.post("/api/ai/chat"'), 'POST /api/ai/chat must be mounted');
    assert.ok(routesContent.includes('gemini-3.7-flash'), 'Must use Gemini 3.7 Flash');
    assert.ok(routesContent.includes('systemInstruction'), 'Must supply FMGE system instruction');
    assert.ok(routesContent.includes('studentContext'), 'Must inject live student tracker context');
  });

  it('2. Structured MCQ output schema is defined for clinical vignettes', () => {
    const routesContent = fs.readFileSync('server/fmge-routes.ts', 'utf8');
    assert.ok(routesContent.includes('"singleMcq"'), 'Must define singleMcq field in response schema');
    assert.ok(routesContent.includes('"quizSession"'), 'Must define quizSession field in response schema');
    assert.ok(routesContent.includes('"distractorBreakdown"'), 'Must define distractorBreakdown in schema');
  });

  it('3. Heart block MCQ returns complete clinical stem and distractor explanations', () => {
    const bank = JSON.parse(fs.readFileSync('server/data/hy_subject_bank.json', 'utf8'));
    const hb = bank.medicine.find((q: any) => q.topic.includes('Heart Block'));
    assert.ok(hb, 'Heart block question exists');
    assert.ok(hb.question.includes('Stokes-Adams'), 'Contains Stokes Adams attacks');
    assert.ok(hb.question.includes('cannon \'a\' waves'), 'Contains cannon a waves');
    assert.ok(hb.question.includes('AV dissociation'), 'Contains AV dissociation');
    assert.equal(hb.options.length, 4);
    assert.equal(hb.correctKey, 'A');
  });

  it('4. MarkdownRenderer uses clean document flow without multi-column breakdown', () => {
    const mdRenderer = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');
    assert.ok(!mdRenderer.includes('columns-'), 'Must not contain column classes');
    assert.ok(!mdRenderer.includes('grid-cols-'), 'Must not break normal text into grid columns');
    assert.ok(mdRenderer.includes('w-full'), 'Must render full-width blocks');
    assert.ok(mdRenderer.includes('break-words'), 'Must support word wrapping');
  });

  it('5. MarkdownRenderer contains unconditional loop advancement safeguard', () => {
    const mdRenderer = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');
    assert.ok(mdRenderer.includes('startIndex'), 'Must track startIndex');
    assert.ok(mdRenderer.includes('i === startIndex'), 'Must verify guaranteed loop advancement');
    assert.ok(mdRenderer.includes('i++;'), 'Must increment i unconditionally');
  });

  it('6. MentorClinicalChallengeCard provides dedicated clinical MCQ challenge layout', () => {
    const cardContent = fs.readFileSync('src/components/mentor/MentorClinicalChallengeCard.tsx', 'utf8');
    assert.ok(cardContent.includes('Clinical Challenge'), 'Must include Clinical Challenge header');
    assert.ok(cardContent.includes('Submit Answer'), 'Must include Submit Answer primary action');
    assert.ok(cardContent.includes('Clinical Rationale'), 'Must include Clinical Rationale section');
    assert.ok(cardContent.includes('Why other options are wrong'), 'Must include distractor analysis');
    assert.ok(cardContent.includes('FMGE Key Takeaway'), 'Must support high-yield takeaway');
    assert.ok(cardContent.includes('handleSelectOption'), 'Must support staged option selection');
  });

  it('7. AiCoachView integrates MentorClinicalChallengeCard with answer recording', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('MentorClinicalChallengeCard'), 'Must import and mount MentorClinicalChallengeCard');
    assert.ok(coachContent.includes('onAnswer={handleSingleQuizAnswer}'), 'Must bind to handleSingleQuizAnswer for attempt logging');
  });

  it('8. MentorQuizRunner provides 5-question clinical reasoning runner layout', () => {
    const runnerContent = fs.readFileSync('src/components/mentor/MentorQuizRunner.tsx', 'utf8');
    assert.ok(runnerContent.includes('Clinical Challenge'), 'Must include Clinical Challenge header');
    assert.ok(runnerContent.includes('5-question clinical reasoning session'), 'Must include session subtitle');
    assert.ok(runnerContent.includes('Question {currentIndex + 1} of {totalQuestions}'), 'Must show progression counter');
    assert.ok(runnerContent.includes('Submit Answer'), 'Must include staged submission button');
    assert.ok(runnerContent.includes('Clinical Reasoning Checkpoint'), 'Must include faculty clinical checkpoint');
    assert.ok(runnerContent.includes('Why other options are less appropriate:'), 'Must include distractor rationale breakdown');
    assert.ok(runnerContent.includes('Watch for this FMGE Trap:'), 'Must include FMGE exam trap highlight');
    assert.ok(runnerContent.includes('Clinical Challenge Complete'), 'Must include completion view');
    assert.ok(runnerContent.includes('Review 5 Questions'), 'Must support question review toggle');
    assert.ok(runnerContent.includes('Start Another Clinical Challenge'), 'Must include restart action');
  });

  it('9. AiCoachView mounts MentorQuizRunner with existing quiz session handlers', () => {
    const coachContent = fs.readFileSync('src/components/AiCoachView.tsx', 'utf8');
    assert.ok(coachContent.includes('MentorQuizRunner'), 'Must import and mount MentorQuizRunner');
    assert.ok(coachContent.includes('onAnswer={handleQuizSessionAnswer}'), 'Must preserve attempt logging via handleQuizSessionAnswer');
    assert.ok(coachContent.includes('onNextQuestion={handleNextQuizQuestion}'), 'Must preserve question progression');
    assert.ok(coachContent.includes('onRestartQuiz={startQuizMode}'), 'Must preserve quiz batch restart');
    assert.ok(coachContent.includes('onClose={() => setQuizSession(null)}'), 'Must support returning to mentor chat');
  });
});
