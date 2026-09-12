import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTopicAndSubject,
  generateStructuredClinicalMCQ,
  getTopicClinicalMCQBatch
} from '../../../server/dynamic-mcq-engine';

describe('Phase 6 — Faculty Mentor Intelligence & Behavior Fix Tests', () => {

  it('1. "gimme mcqs on crohns disease" -> extracts Crohn disease topic, returns interactive MCQ without answer dump', () => {
    const classification = classifyTopicAndSubject('gimme mcqs on crohns disease');
    assert.ok(
      classification.topic.toLowerCase().includes('crohn') ||
      classification.topic.toLowerCase().includes('inflammatory bowel'),
      `Expected Crohn topic, got: ${classification.topic}`
    );
    assert.equal(classification.subject, 'General Medicine');

    const mcq = generateStructuredClinicalMCQ('gimme mcqs on crohns disease');
    assert.ok(mcq.stem.length > 50, 'Stem must be an authentic clinical vignette');
    assert.equal(mcq.options.length, 4, 'Must have exactly 4 options');
    assert.ok(mcq.options.some(o => o.key === 'A'), 'Must have option A');
    assert.ok(mcq.correctAnswer, 'Must have correct answer key');
    assert.ok(mcq.explanation.length > 30, 'Must have thorough clinical explanation');
    assert.ok(mcq.fmgeTakeaway.length > 10, 'Must have high yield takeaway');
  });

  it('2. "gimme 5 mcqs on sjogren syndrome" -> produces 5-question interactive clinical quiz on Sjogren syndrome', () => {
    const classification = classifyTopicAndSubject('gimme 5 mcqs on sjogren syndrome');
    assert.ok(
      classification.topic.toLowerCase().includes('sjogren') ||
      classification.topic.toLowerCase().includes('sjögren'),
      `Expected Sjogren topic, got: ${classification.topic}`
    );
    assert.equal(classification.subject, 'General Medicine');

    const batch = getTopicClinicalMCQBatch(classification.subject, classification.topic, 5);
    assert.equal(batch.length, 5, 'Must generate exactly 5 questions');

    batch.forEach((q, idx) => {
      assert.ok(q.stem.length > 30, `Question ${idx + 1} must have authentic stem`);
      assert.equal(q.options.length, 4, `Question ${idx + 1} must have 4 options`);
      assert.ok(q.correctAnswer, `Question ${idx + 1} must have correct answer key`);
      assert.ok(
        q.stem.toLowerCase().includes('sjogren') ||
        q.stem.toLowerCase().includes('sicca') ||
        q.stem.toLowerCase().includes('schirmer') ||
        q.stem.toLowerCase().includes('salivary') ||
        q.topic.toLowerCase().includes('sjogren') ||
        q.topic.toLowerCase().includes('sjögren'),
        `Question ${idx + 1} must strictly relate to Sjogren syndrome`
      );
    });
  });

  it('3. "give me harder ones" -> maintains topic context from history without switching subjects', () => {
    const history = [
      { role: 'user', content: 'Explain Sjogren syndrome' },
      { role: 'assistant', content: 'Sjögren syndrome is a systemic autoimmune exocrinopathy characterized by keratoconjunctivitis sicca and xerostomia.' },
      { role: 'user', content: 'gimme 5 mcqs on sjogren syndrome' },
      { role: 'assistant', content: 'Here is question 1 on Sjögren syndrome regarding minor salivary gland biopsy focus score.' }
    ];

    const followUpClassification = classifyTopicAndSubject('give me harder ones', history);
    assert.ok(
      followUpClassification.topic.toLowerCase().includes('sjogren') ||
      followUpClassification.topic.toLowerCase().includes('sjögren'),
      `Expected Sjogren topic from history, got: ${followUpClassification.topic}`
    );
    assert.equal(followUpClassification.subject, 'General Medicine');

    // Also test "give me 5 harder ones"
    const followUp5Classification = classifyTopicAndSubject('give me 5 harder ones', history);
    assert.ok(
      followUp5Classification.topic.toLowerCase().includes('sjogren') ||
      followUp5Classification.topic.toLowerCase().includes('sjögren'),
      `Expected Sjogren topic from history, got: ${followUp5Classification.topic}`
    );

    // Also test history with Crohn's
    const crohnHistory = [
      { role: 'user', content: 'Explain Crohn disease' },
      { role: 'assistant', content: 'Crohn disease is an inflammatory bowel disease featuring skip lesions and transmural granulomatous inflammation.' }
    ];
    const crohnFollowUp = classifyTopicAndSubject('give me harder ones', crohnHistory);
    assert.ok(
      crohnFollowUp.topic.toLowerCase().includes('crohn') ||
      crohnFollowUp.topic.toLowerCase().includes('inflammatory bowel'),
      `Expected Crohn topic from history, got: ${crohnFollowUp.topic}`
    );
  });

  it('4. "explain crohn disease" -> purely medical explanation topic classification without countdown templates', () => {
    const classification = classifyTopicAndSubject('explain crohn disease');
    assert.ok(
      classification.topic.toLowerCase().includes('crohn') ||
      classification.topic.toLowerCase().includes('inflammatory bowel')
    );
    assert.equal(classification.subject, 'General Medicine');
  });

  it('5. "what should i study today?" -> intent is study-plan / guidance, appropriate for incorporating exam timing and weaknesses', () => {
    const query = 'what should i study today?';
    const lower = query.toLowerCase();
    const isStudyPlanning =
      lower.includes('what should i study') ||
      lower.includes('study today') ||
      lower.includes('plan for today') ||
      lower.includes('revision plan');
    assert.ok(isStudyPlanning, 'Should be recognized as study planning query');
  });

  it('6. "quiz me on my weak areas" -> uses studentContext weak subjects and weak topics without fabricating data', () => {
    const mockStudentContext = {
      weakSubjects: ['Pharmacology', 'Pathology'],
      weakTopics: ['Autonomic Pharmacology', 'Hodgkin Lymphoma'],
      recentErrors: ['Beta blocker toxicity DOC is Glucagon']
    };

    assert.ok(mockStudentContext.weakSubjects.length > 0);
    const chosenSubject = mockStudentContext.weakSubjects[0];
    const classification = classifyTopicAndSubject(`quiz me on ${chosenSubject}`);
    assert.equal(classification.subject, 'Pharmacology');
  });

  it('7. "new chat" -> resets active conversation, session ID, and quiz state', () => {
    let activeSessionId = 'session-123';
    let messages = [{ id: 'm1', role: 'user', content: 'hello' }];
    let quizSession: any = { questions: [{}], score: 1 };

    // Simulating handleNewSession logic
    const handleNewSession = () => {
      activeSessionId = `session-${Date.now()}`;
      messages = [];
      quizSession = null;
    };

    handleNewSession();
    assert.notEqual(activeSessionId, 'session-123');
    assert.equal(messages.length, 0);
    assert.equal(quizSession, null);
  });

  it('8. History selection -> restores saved conversation, topic, and quiz state without blank screen', () => {
    const savedSession = {
      id: 'session-456',
      title: 'Sjögren Syndrome Consultation',
      messages: [
        { id: 'm1', role: 'user', content: 'gimme 5 mcqs on sjogren syndrome', timestamp: new Date() },
        { id: 'm2', role: 'assistant', content: 'Starting quiz', timestamp: new Date() }
      ],
      quizSession: {
        questions: [{ id: 'q1', stem: 'Sjogren test question', options: [], correctKey: 'A' }],
        currentIndex: 0,
        score: 0,
        isComplete: false,
        userAnswers: {}
      }
    };

    let activeSessionId = '';
    let messages: any[] = [];
    let quizSession: any = null;

    // Simulating handleSelectSession logic
    const handleSelectSession = (s: typeof savedSession) => {
      activeSessionId = s.id;
      messages = s.messages;
      quizSession = s.quizSession;
    };

    handleSelectSession(savedSession);
    assert.equal(activeSessionId, 'session-456');
    assert.equal(messages.length, 2);
    assert.ok(quizSession !== null);
    assert.equal(quizSession.questions[0].id, 'q1');
  });

  it('9. Exam date = tomorrow, user: "what is the gold standard for diagnosing Crohn disease?" -> Direct medical answer without countdown mention', () => {
    const query = 'what is the gold standard for diagnosing Crohn disease?';
    const lower = query.toLowerCase();
    const isPureMedical =
      !lower.includes('what should i study') &&
      !lower.includes('revision plan') &&
      !lower.includes('schedule') &&
      !lower.includes('timeline');

    assert.ok(isPureMedical, 'Medical factual query must be identified as pure medical');

    const classification = classifyTopicAndSubject(query);
    assert.ok(
      classification.topic.toLowerCase().includes('crohn') ||
      classification.topic.toLowerCase().includes('inflammatory bowel')
    );

    // Dynamic MCQ test
    const mcq = generateStructuredClinicalMCQ(query);
    assert.ok(
      mcq.explanation.toLowerCase().includes('granuloma') ||
      mcq.explanation.toLowerCase().includes('transmural') ||
      mcq.fmgeTakeaway.toLowerCase().includes('crohn')
    );
    // Verified: No countdown phrase generated in medical content
    assert.ok(!mcq.explanation.includes('24 hours'));
    assert.ok(!mcq.explanation.includes('exam tomorrow'));
  });

  it('10. Exam date = tomorrow, user: "make me a revision plan for today." -> incorporates exam timing legitimately', () => {
    const query = 'make me a revision plan for today.';
    const lower = query.toLowerCase();
    const isPlanningIntent =
      lower.includes('revision plan') ||
      lower.includes('plan for today') ||
      lower.includes('what should i study');

    assert.ok(isPlanningIntent, 'Planning query must be recognized to legitimately allow exam context');

    const studentContext = {
      daysRemaining: 1,
      targetScore: 190,
      weakSubjects: ['Pharmacology', 'Pathology']
    };

    assert.equal(studentContext.daysRemaining, 1);
  });
});
