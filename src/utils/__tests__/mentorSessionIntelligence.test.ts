import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSessionIntelligence,
  groupSessionsByDate,
  filterSessions,
} from '../mentorSessionIntelligence';
import type { CoachSession } from '../../components/AiCoachView';

describe('Mentor Consultation Session Intelligence & Categorization', () => {
  const sampleSessions: CoachSession[] = [
    {
      id: 's-1',
      title: '5 high-yield clinical MCQs across different FMGE subjects',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm-1',
          role: 'user',
          content: 'Give me 5 high-yield clinical MCQs across different FMGE subjects with distractor analysis.',
          timestamp: new Date(),
        },
        {
          id: 'm-2',
          role: 'assistant',
          content: 'Here are 5 high-yield interdisciplinary clinical MCQs.',
          timestamp: new Date(),
        },
      ],
      quizSession: {
        subject: 'General Medicine',
        topic: 'Cardiology & Nephrology',
        questions: [
          {
            id: 'q-1',
            question: 'A 45yo male presents with chest pain...',
            stem: 'A 45yo male presents with chest pain...',
            options: [{ key: 'A', text: 'STEMI' }, { key: 'B', text: 'Pericarditis' }],
            correctKey: 'A',
            explanation: 'STEMI is correct.',
            subject: 'General Medicine',
            topic: 'STEMI',
          },
        ],
        currentIndex: 0,
        score: 1,
        isComplete: true,
        userAnswers: { 0: 'A' },
      },
    },
    {
      id: 's-2',
      title: 'Crohn disease vs Ulcerative Colitis',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      messages: [
        {
          id: 'm-3',
          role: 'user',
          content: 'What is the key difference between Crohn disease and ulcerative colitis on biopsy?',
          timestamp: new Date(),
        },
      ],
    },
    {
      id: 's-3',
      title: 'DOC for Status Epilepticus & Preeclampsia Pritchard Regimen',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      isPinned: true,
      messages: [
        {
          id: 'm-4',
          role: 'user',
          content: 'What is the drug of choice for status epilepticus and the dosage of MgSO4 in Pritchard regimen?',
          timestamp: new Date(),
        },
      ],
    },
    {
      id: 's-4',
      title: 'Chest X-Ray in Tension Pneumothorax',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), // Earlier
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      messages: [
        {
          id: 'm-5',
          role: 'user',
          content: 'Show me chest x-ray findings and needle thoracostomy site in tension pneumothorax.',
          timestamp: new Date(),
          userAttachedImage: {
            url: 'https://example.com/cxr.jpg',
            fileName: 'cxr_pneumothorax.jpg',
          },
        },
      ],
    },
  ];

  it('1. Correctly detects MCQ drill intent and score percentage', () => {
    const intel = extractSessionIntelligence(sampleSessions[0]);
    assert.equal(intel.intentType, 'mcq');
    assert.equal(intel.hasQuiz, true);
    assert.equal(intel.totalMcqs, 1);
    assert.equal(intel.mcqsAnswered, 1);
    assert.deepEqual(intel.mcqScore, { correct: 1, total: 1, percentage: 100 });
    assert.equal(intel.subjectName, 'General Medicine');
  });

  it('2. Correctly detects Differential Diagnosis intent', () => {
    const intel = extractSessionIntelligence(sampleSessions[1]);
    assert.equal(intel.intentType, 'differential');
    assert.equal(intel.intentLabel, 'Differential Diagnosis');
  });

  it('3. Correctly detects Pharmacology / DOC intent and Pinned flag', () => {
    const intel = extractSessionIntelligence(sampleSessions[2]);
    assert.equal(intel.intentType, 'pharmacology');
    assert.equal(intel.subjectName, 'Pharmacology');
    assert.equal(intel.isPinned, true);
  });

  it('4. Correctly detects Image / Investigation Review intent', () => {
    const intel = extractSessionIntelligence(sampleSessions[3]);
    assert.equal(intel.intentType, 'investigation');
    assert.equal(intel.hasImage, true);
    assert.equal(intel.subjectName, 'Radiology');
  });

  it('5. Correctly groups consultations into smart date buckets', () => {
    const groups = groupSessionsByDate(sampleSessions);
    assert.ok(groups.length >= 3);
    assert.equal(groups[0].label, 'Today');
    assert.equal(groups[0].sessions[0].id, 's-1');
    assert.equal(groups[1].label, 'Yesterday');
    assert.equal(groups[1].sessions[0].id, 's-2');
  });

  it('6. Filters by intent and prioritizes pinned consultations', () => {
    const pinnedFiltered = filterSessions(sampleSessions, '', 'starred');
    assert.equal(pinnedFiltered.length, 1);
    assert.equal(pinnedFiltered[0].id, 's-3');

    const mcqFiltered = filterSessions(sampleSessions, '', 'mcq');
    assert.equal(mcqFiltered.length, 1);
    assert.equal(mcqFiltered[0].id, 's-1');

    // Text search
    const searched = filterSessions(sampleSessions, 'Crohn', 'all');
    assert.equal(searched.length, 1);
    assert.equal(searched[0].id, 's-2');
  });
});
