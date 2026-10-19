import type { AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getTopPriorityTopics } from './adaptivePriorityEngine';
import { calculateOverallPerformance } from './performanceEngine';
import { calculateStudyReadiness } from './readinessEngine';
import { calculateAppStats } from './storage';

function tableCell(value: unknown): string {
  return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export function buildProgressReport(state: AppState, generatedAt = new Date()): string {
  const stats = calculateAppStats(state);
  const performance = calculateOverallPerformance(state);
  const readiness = calculateStudyReadiness(state);
  const priorities = getTopPriorityTopics(state, 5);
  const candidateName = state.settings?.userName?.trim() || 'FMGE Aspirant';
  const mocks = [...(state.grandTests || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const subjectRows = FMGE_SUBJECTS.map((subject) => {
    const metrics = performance.subjectMetrics[subject.id];
    return [
      subject.name,
      subject.weightage,
      metrics?.totalAttempts || 0,
      metrics?.totalAttempts ? `${metrics.accuracy}%` : 'Not attempted',
      metrics?.topicsMasteredCount || 0,
      metrics?.repeatedErrorsCount || 0,
    ];
  });

  const lines = [
    `# FMGE Progress Report — ${candidateName}`,
    '',
    `Generated: ${generatedAt.toLocaleString()}`,
    `Target exam: ${state.settings?.examDate || 'Not set'}`,
    `Target score: ${state.settings?.targetScore || 'Not set'} / 300`,
    '',
    '## Readiness snapshot',
    '',
    `- Readiness score: ${readiness.score == null ? 'Not enough data' : `${readiness.score}/100`}`,
    `- Overall syllabus readiness: ${stats.overallReadinessScore}%`,
    `- High-yield readiness: ${stats.highYieldReadinessScore}%`,
    `- Estimated mastered marks: ${stats.estimatedMasteredMarks}/${stats.totalMarksInSyllabus}`,
    `- Notes completed: ${stats.completedNotesTopics}/${stats.totalTopics} topics (${stats.notesPercentage}%)`,
    `- Revision coverage: R1 ${stats.r1Percentage}% · R2 ${stats.r2Percentage}% · R3 ${stats.r3Percentage}%`,
    '',
    '## Question performance',
    '',
    `- Total questions recorded: ${performance.totalAttempts}`,
    `- Overall accuracy: ${performance.totalAttempts ? `${performance.overallAccuracy}%` : 'No attempts yet'}`,
    `- Recent accuracy: ${performance.recentAttempts.length ? `${performance.recentAccuracy}%` : 'No recent attempts'}`,
    `- Average response time: ${performance.avgResponseTimeSeconds ? `${performance.avgResponseTimeSeconds} seconds` : 'Not available'}`,
    `- Repeated errors: ${performance.totalRepeatedErrors}`,
    `- Error Notebook items: ${state.errorNotebook?.length || 0}`,
    '',
    '## Priority focus',
    '',
    ...(priorities.length
      ? priorities.map((topic, index) =>
          `${index + 1}. **${topic.subjectName} — ${topic.topicName}**: ${topic.explanation}`,
        )
      : ['No priority topics are available yet.']),
    '',
    '## Recent mock history',
    '',
    ...(mocks.length
      ? [
          '| Date | Test | Score | Correct | Incorrect | Skipped |',
          '| --- | --- | ---: | ---: | ---: | ---: |',
          ...mocks.map((mock) =>
            `| ${[
              mock.date,
              mock.title || mock.platform,
              `${mock.score}/${mock.totalMarks || 300}`,
              mock.correctCount ?? '—',
              mock.incorrectCount ?? '—',
              mock.skippedCount ?? '—',
            ].map(tableCell).join(' | ')} |`,
          ),
        ]
      : ['No mock scores have been logged.']),
    '',
    '## Subject overview',
    '',
    '| Subject | Blueprint marks | Questions | Accuracy | Mastered topics | Repeated errors |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...subjectRows.map((row) => `| ${row.map(tableCell).join(' | ')} |`),
    '',
    '---',
    '',
    'This report summarizes activity recorded in ONE SHOT FMGE. Readiness and projected mastery are study-planning signals, not guarantees of examination performance.',
    '',
  ];

  return lines.join('\n');
}

export function downloadProgressReport(state: AppState): void {
  const report = buildProgressReport(state);
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  const safeName = (state.settings?.userName || 'FMGE_Aspirant')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  anchor.href = url;
  anchor.download = `${safeName || 'FMGE_Aspirant'}_Progress_Report_${date}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
