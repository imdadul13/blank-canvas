import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Target,
  BookOpen,
  TrendingUp,
  RotateCcw,
  Brain,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { ReadinessBreakdown, ReadinessComponentDetail } from '../types';

interface ReadinessBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  readiness: ReadinessBreakdown;
  onNavigateTab?: (tab: string) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string) => void;
  topPrioritySubjectId?: string;
  topPriorityTopicId?: string;
  topPriorityTopicName?: string;
}

export const ReadinessBreakdownModal: React.FC<ReadinessBreakdownModalProps> = ({
  isOpen,
  onClose,
  readiness,
  onNavigateTab,
  onLaunchPracticeSession,
  topPrioritySubjectId = 'medicine',
  topPriorityTopicId = 'med-1',
  topPriorityTopicName = 'Cardiology - Ischemic Heart Disease & ECG',
}) => {
  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Readiness Verdict Stage Label
  const getStageBadge = (score: number) => {
    if (score >= 75) {
      return { label: 'Exam Ready', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (score >= 50) {
      return { label: 'Developing', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { label: 'Needs Focus', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const stage = getStageBadge(readiness.score);

  // Helper for pillar specific CTA and prescription
  const getPillarPrescription = (comp: ReadinessComponentDetail) => {
    switch (comp.id) {
      case 'topic_mastery':
        return {
          prescription:
            comp.score >= 75
              ? 'Excellent syllabus coverage. Maintain retention with spaced question drills.'
              : 'Target core clinical subject notes (Medicine, Surgery, OBG, PSM) to boost syllabus breadth.',
          actionLabel: 'Explore Study Syllabus',
          onClick: () => {
            onClose();
            onNavigateTab?.('syllabus');
          },
        };
      case 'high_yield_mastery':
        return {
          prescription:
            comp.score >= 75
              ? 'High-yield topics well solidified across primary clinical papers.'
              : 'Focus on high-yield topics marked with the star badge in high-weightage disciplines.',
          actionLabel: 'Study High-Yield Topics',
          onClick: () => {
            onClose();
            onNavigateTab?.('syllabus');
          },
        };
      case 'mcq_accuracy':
        return {
          prescription:
            comp.status === 'no_data'
              ? 'Establish baseline by completing at least 15 timed practice MCQs.'
              : comp.score >= 70
              ? 'Clinical reasoning is sharp. Aim to maintain 65%+ on clinical vignettes.'
              : 'MCQ accuracy is below target. Review question stems carefully and eliminate distractors.',
          actionLabel: 'Launch Clinical Drill',
          onClick: () => {
            onClose();
            onLaunchPracticeSession?.(
              topPrioritySubjectId,
              topPriorityTopicId,
              topPriorityTopicName
            );
          },
        };
      case 'gt_performance':
        return {
          prescription:
            comp.status === 'no_data'
              ? 'No 300-Q Grand Test logged. Schedule a full-length mock to evaluate endurance.'
              : comp.score >= 60
              ? 'Passing margin established. Target 180+ marks for safe comfort zone.'
              : 'Current mock exam performance is below 150 marks. Triage weak papers immediately.',
          actionLabel: 'Grand Tests Hub',
          onClick: () => {
            onClose();
            onNavigateTab?.('grandtests');
          },
        };
      case 'gt_trend':
        return {
          prescription:
            comp.status === 'no_data'
              ? 'Requires 2+ consecutive Grand Tests to compute trajectory.'
              : comp.score >= 60
              ? 'Score trajectory is moving positively or holds strong passing stability.'
              : 'Scores have dipped in recent mocks. Check if error fatigue occurred in Paper 2.',
          actionLabel: 'View Mock Progression',
          onClick: () => {
            onClose();
            onNavigateTab?.('grandtests');
          },
        };
      case 'revision_completion':
        return {
          prescription:
            comp.score >= 70
              ? 'Revision cadence is on schedule for NBE exam date.'
              : 'Spaced revision (R1/R2) backlog detected. Schedule revision blocks for past subjects.',
          actionLabel: 'Plan Spaced Revision',
          onClick: () => {
            onClose();
            onNavigateTab?.('revision');
          },
        };
      case 'error_burden':
        return {
          prescription:
            comp.status === 'no_data'
              ? 'No mistakes logged. Send missed questions to Error Vault for automated remediation.'
              : comp.score >= 70
              ? 'Most logged mistakes have been remediated and confirmed retained.'
              : 'Unreviewed mistakes in the 20th Notebook are weighing down readiness.',
          actionLabel: 'Review Error Vault',
          onClick: () => {
            onClose();
            onNavigateTab?.('errors');
          },
        };
      case 'study_consistency':
        return {
          prescription:
            comp.score >= 75
              ? 'Consistent daily habit logged over the past 14 days.'
              : 'Maintain steady daily study logs and question goals to protect retention momentum.',
          actionLabel: 'Open Daily Planner',
          onClick: () => {
            onClose();
            onNavigateTab?.('daily');
          },
        };
      default:
        return {
          prescription: comp.details,
          actionLabel: 'View Workspace',
          onClick: () => onClose(),
        };
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-[#DCE4E1] shadow-xl overflow-hidden my-auto text-[#121E1B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 sm:px-8 border-b border-[#EAEFEA] bg-[#FAF9F5]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#00685f]">
                DIAGNOSTIC DRILL-DOWN
              </span>
              <span className="w-1 h-1 rounded-full bg-[#00685f]/40" />
              <span className="text-xs text-stone-400 font-mono">8-PILLAR ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Newsreader'] tracking-tight bg-gradient-to-r from-stone-900 via-stone-800 to-[#00685f] bg-clip-text text-transparent">
              Exam Readiness Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Transparent assessment of your exam preparation, weighted directly against the National Board of Examinations (NBE) blueprint.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Score Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-5">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
                  <circle cx="42" cy="42" r="34" fill="none" stroke="#EAEFEA" strokeWidth="8" />
                  <circle
                    cx="42"
                    cy="42"
                    r="34"
                    fill="none"
                    stroke="#00685f"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(100, Math.max(0, readiness.score)) / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold font-mono text-[#121E1B] leading-none">
                    {readiness.score}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono mt-0.5">/100</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                    CURRENT STATUS
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 leading-snug">
                  {readiness.summaryText}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-stone-200/80 sm:pl-6 shrink-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
              <span className="text-[11px] font-mono uppercase text-stone-400">Total Pillars</span>
              <span className="font-mono font-bold text-lg text-stone-800">8 Evaluated</span>
              <span className="text-[10px] font-mono text-stone-400">Normalized to 100%</span>
            </div>
          </div>

          {/* 8-Pillars Diagnostic Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                Component Performance & Clinical Prescription
              </h3>
              <span className="text-xs text-stone-400 font-mono">Click action to execute</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readiness.components.map((comp) => {
                const isNoData = comp.status === 'no_data';
                const scoreVal = isNoData ? 0 : comp.score;
                const { prescription, actionLabel, onClick } = getPillarPrescription(comp);

                let statusBadge = {
                  label: 'Optimal',
                  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                };
                if (isNoData) {
                  statusBadge = {
                    label: 'Calibrating',
                    classes: 'bg-stone-100 text-stone-600 border-stone-200',
                  };
                } else if (comp.status === 'needs_work') {
                  statusBadge = {
                    label: 'Needs Work',
                    classes: 'bg-rose-50 text-rose-700 border-rose-200',
                  };
                } else if (comp.status === 'moderate') {
                  statusBadge = {
                    label: 'Moderate',
                    classes: 'bg-amber-50 text-amber-700 border-amber-200',
                  };
                }

                return (
                  <div
                    key={comp.id}
                    className="p-4 rounded-2xl bg-white border border-[#DCE4E1] shadow-2xs hover:border-[#00685f]/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    {/* Card Top */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {comp.name}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-600 shrink-0">
                            {comp.weight}% WT
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusBadge.classes}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Progress bar + Score */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-500 truncate max-w-[200px]">{comp.label}</span>
                          <span className="font-bold text-[#121E1B]">
                            {isNoData ? '—' : `${scoreVal} / 100`}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isNoData
                                ? 'bg-stone-200'
                                : scoreVal >= 70
                                ? 'bg-[#00685f]'
                                : scoreVal >= 45
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                          />
                        </div>
                      </div>

                      {/* Detail text */}
                      <p className="text-xs text-stone-600 leading-snug">
                        <span className="font-semibold text-stone-700">Diagnosis: </span>
                        {comp.details}
                      </p>

                      {/* Clinical Prescription */}
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-700 space-y-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00685f] block">
                          RECOMMENDED NEXT STEP
                        </span>
                        <p className="text-stone-600 leading-relaxed text-[11px]">{prescription}</p>
                      </div>
                    </div>

                    {/* Card Action Button */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-stone-400">Target: Lift +10%</span>
                      <button
                        type="button"
                        onClick={onClick}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#00685f] hover:text-[#005049] hover:underline cursor-pointer"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-[#EAEFEA] bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400">
            Readiness dynamically updates as drills, notes, and Grand Tests are recorded.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
