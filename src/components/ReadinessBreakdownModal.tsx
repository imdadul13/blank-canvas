import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  TrendingUp,
  RotateCcw,
  Brain,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Target,
  Zap,
  ArrowRight,
  BarChart2,
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

// iOS Apple color tokens
const IOS = {
  blue: '#007AFF',
  green: '#30D158',
  amber: '#FF9500',
  red: '#FF3B30',
  purple: '#5856D6',
  nearBlack: '#1D1D1F',
  tertiary: '#8E8E93',
  bg: '#F2F2F7',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  separator: 'rgba(60,60,67,0.12)',
};

// Pillar icon map
const PILLAR_ICON: Record<string, React.ReactNode> = {
  topic_mastery: <BookOpen className="w-4 h-4" />,
  high_yield_mastery: <Zap className="w-4 h-4" />,
  mcq_accuracy: <Target className="w-4 h-4" />,
  gt_performance: <BarChart2 className="w-4 h-4" />,
  gt_trend: <TrendingUp className="w-4 h-4" />,
  revision_completion: <RotateCcw className="w-4 h-4" />,
  error_burden: <AlertTriangle className="w-4 h-4" />,
  study_consistency: <Calendar className="w-4 h-4" />,
};

// Pillar accent color map
const PILLAR_COLOR: Record<string, string> = {
  topic_mastery: IOS.blue,
  high_yield_mastery: IOS.purple,
  mcq_accuracy: IOS.blue,
  gt_performance: IOS.green,
  gt_trend: IOS.amber,
  revision_completion: IOS.purple,
  error_burden: IOS.red,
  study_consistency: IOS.green,
};

const getStatusInfo = (status: string, score: number) => {
  if (status === 'no_data') {
    return { label: 'No Data', color: IOS.tertiary, bg: 'rgba(142,142,147,0.12)' };
  }
  if (status === 'fulfilled' || score >= 70) {
    return { label: 'Fulfilled', color: IOS.green, bg: 'rgba(48,209,88,0.12)' };
  }
  if (status === 'needs_attention' || score >= 45) {
    return { label: 'Needs Attention', color: IOS.amber, bg: 'rgba(255,149,0,0.12)' };
  }
  return { label: 'Critical', color: IOS.red, bg: 'rgba(255,59,48,0.12)' };
};

const getBarColor = (isNoData: boolean, score: number) => {
  if (isNoData) return IOS.tertiary;
  if (score >= 70) return IOS.green;
  if (score >= 45) return IOS.amber;
  return IOS.red;
};

const getStageBadge = (score: number) => {
  if (score >= 75) return { label: 'Exam Ready', color: IOS.green, bg: 'rgba(48,209,88,0.12)' };
  if (score >= 50) return { label: 'Developing', color: IOS.amber, bg: 'rgba(255,149,0,0.12)' };
  return { label: 'Needs Focus', color: IOS.red, bg: 'rgba(255,59,48,0.12)' };
};

const getGaugeColor = (score: number) => {
  if (score >= 75) return IOS.green;
  if (score >= 50) return IOS.amber;
  return IOS.red;
};

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

  const score = readiness.score ?? 0;
  const stage = getStageBadge(score);
  const gaugeColor = getGaugeColor(score);
  const gaugeR = 38;
  const gaugeCircumference = 2 * Math.PI * gaugeR;
  const gaugeOffset = gaugeCircumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  const getPillarPrescription = (comp: ReadinessComponentDetail) => {
    switch (comp.id) {
      case 'topic_mastery':
        return {
          prescription:
            comp.score >= 75
              ? 'Excellent syllabus coverage. Maintain retention with spaced question drills.'
              : 'Target core clinical subject notes (Medicine, Surgery, OBG, PSM) to boost syllabus breadth.',
          actionLabel: 'Explore Study Syllabus',
          onClick: () => { onClose(); onNavigateTab?.('syllabus'); },
        };
      case 'high_yield_mastery':
        return {
          prescription:
            comp.score >= 75
              ? 'High-yield topics well solidified across primary clinical papers.'
              : 'Focus on high-yield topics marked with the star badge in high-weightage disciplines.',
          actionLabel: 'Study High-Yield Topics',
          onClick: () => { onClose(); onNavigateTab?.('syllabus'); },
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
            onLaunchPracticeSession?.(topPrioritySubjectId, topPriorityTopicId, topPriorityTopicName);
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
          onClick: () => { onClose(); onNavigateTab?.('grandtests'); },
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
          onClick: () => { onClose(); onNavigateTab?.('grandtests'); },
        };
      case 'revision_completion':
        return {
          prescription:
            comp.score >= 70
              ? 'Revision cadence is on schedule for NBE exam date.'
              : 'Spaced revision (R1/R2) backlog detected. Schedule revision blocks for past subjects.',
          actionLabel: 'Plan Spaced Revision',
          onClick: () => { onClose(); onNavigateTab?.('revision'); },
        };
      case 'error_burden':
        return {
          prescription:
            comp.status === 'no_data'
              ? 'No mistakes logged. Send missed questions to Error Vault for automated remediation.'
              : comp.score >= 70
              ? 'Most logged mistakes have been remediated and confirmed retained.'
              : 'Unreviewed mistakes in the Error Notebook are weighing down readiness.',
          actionLabel: 'Review Error Vault',
          onClick: () => { onClose(); onNavigateTab?.('errors'); },
        };
      case 'study_consistency':
        return {
          prescription:
            comp.score >= 75
              ? 'Consistent daily habit logged over the past 14 days.'
              : 'Maintain steady daily study logs and question goals to protect retention momentum.',
          actionLabel: 'Open Daily Planner',
          onClick: () => { onClose(); onNavigateTab?.('daily'); },
        };
      default:
        return {
          prescription: comp.details,
          actionLabel: 'View Workspace',
          onClick: () => onClose(),
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9300,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '56rem',
          background: IOS.bg,
          borderRadius: '1.5rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.32), 0 8px 24px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '90vh',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: IOS.nearBlack,
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            flexShrink: 0,
            background: IOS.white,
            borderBottom: `1px solid ${IOS.separator}`,
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: IOS.blue,
              }}
            >
              8-PILLAR READINESS
            </span>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: IOS.nearBlack,
                margin: 0,
              }}
            >
              Exam Readiness Breakdown
            </h2>
            <p style={{ fontSize: '0.75rem', color: IOS.tertiary, margin: 0, lineHeight: 1.4 }}>
              Transparent assessment weighted against the NBE blueprint.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              flexShrink: 0,
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: 'rgba(142,142,147,0.16)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: IOS.tertiary,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(142,142,147,0.28)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(142,142,147,0.16)')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            maxHeight: '72vh',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Score Hero */}
          <div
            style={{
              background: IOS.white,
              borderRadius: '1.25rem',
              border: `1px solid ${IOS.separator}`,
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Circular gauge */}
            <div style={{ position: 'relative', flexShrink: 0, width: 96, height: 96 }}>
              <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="48" cy="48" r={gaugeR} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
                <motion.circle
                  cx="48"
                  cy="48"
                  r={gaugeR}
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  initial={{ strokeDashoffset: gaugeCircumference }}
                  animate={{ strokeDashoffset: gaugeOffset }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: IOS.nearBlack,
                    lineHeight: 1,
                  }}
                >
                  {readiness.score}
                </span>
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.625rem',
                    color: IOS.tertiary,
                    marginTop: '0.125rem',
                  }}
                >
                  /100
                </span>
              </div>
            </div>

            {/* Status + summary */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: IOS.tertiary,
                  }}
                >
                  CURRENT STATUS
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '99px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    background: stage.bg,
                    color: stage.color,
                  }}
                >
                  {stage.label}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#3C3C43', lineHeight: 1.45, margin: 0 }}>
                {readiness.summaryText}
              </p>
            </div>

            {/* Pillar count */}
            <div
              style={{
                flexShrink: 0,
                borderLeft: `1px solid ${IOS.separator}`,
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.125rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.625rem',
                  color: IOS.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Total Pillars
              </span>
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: IOS.nearBlack,
                }}
              >
                8 Evaluated
              </span>
              <span
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.5625rem', color: IOS.tertiary }}
              >
                Normalized to 100%
              </span>
            </div>
          </div>

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: IOS.tertiary,
              }}
            >
              COMPONENT PERFORMANCE & PRESCRIPTION
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.5625rem',
                color: IOS.tertiary,
              }}
            >
              Tap action to execute
            </span>
          </div>

          {/* 2-column pillar grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 22rem), 1fr))',
              gap: '0.875rem',
            }}
          >
            {readiness.components.map((comp) => {
              const isNoData = comp.status === 'no_data';
              const scoreVal = isNoData ? 0 : comp.score;
              const { prescription, actionLabel, onClick } = getPillarPrescription(comp);
              const statusInfo = getStatusInfo(comp.status, comp.score);
              const accentColor = PILLAR_COLOR[comp.id] ?? IOS.blue;
              const barColor = getBarColor(isNoData, scoreVal);
              const icon = PILLAR_ICON[comp.id] ?? <CheckCircle2 className="w-4 h-4" />;

              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    background: IOS.white,
                    borderRadius: '1rem',
                    border: `1px solid ${IOS.separator}`,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {/* Card header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      {/* Icon badge */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '0.5rem',
                          background: `${accentColor}18`,
                          color: accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              color: IOS.nearBlack,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {comp.name}
                          </span>
                          <span
                            style={{
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '0.5625rem',
                              fontWeight: 700,
                              background: 'rgba(142,142,147,0.12)',
                              color: IOS.tertiary,
                              padding: '0.1rem 0.375rem',
                              borderRadius: '0.25rem',
                              flexShrink: 0,
                            }}
                          >
                            {comp.weight}% WT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status pill */}
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '99px',
                        fontSize: '0.5625rem',
                        fontWeight: 700,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '0.5625rem',
                          color: IOS.tertiary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '65%',
                        }}
                      >
                        {comp.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: IOS.nearBlack,
                        }}
                      >
                        {isNoData ? '—' : `${scoreVal}/100`}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '0.375rem',
                        borderRadius: '99px',
                        background: 'rgba(60,60,67,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                        style={{
                          height: '100%',
                          borderRadius: '99px',
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <p style={{ fontSize: '0.6875rem', color: '#3C3C43', lineHeight: 1.45, margin: 0 }}>
                    <span style={{ fontWeight: 600, color: IOS.nearBlack }}>Diagnosis: </span>
                    {comp.details}
                  </p>

                  {/* Prescription box */}
                  <div
                    style={{
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.625rem',
                      background: `${accentColor}0D`,
                      border: `1px solid ${accentColor}20`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: accentColor,
                      }}
                    >
                      RECOMMENDED NEXT STEP
                    </span>
                    <p style={{ fontSize: '0.6875rem', color: '#3C3C43', lineHeight: 1.4, margin: 0 }}>
                      {prescription}
                    </p>
                  </div>

                  {/* CTA footer */}
                  <div
                    style={{
                      paddingTop: '0.5rem',
                      borderTop: `1px solid ${IOS.separator}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.5625rem',
                        color: IOS.tertiary,
                      }}
                    >
                      Target: Lift +10%
                    </span>
                    <button
                      type="button"
                      onClick={onClick}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: accentColor,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      <span>{actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            flexShrink: 0,
            background: IOS.white,
            borderTop: `1px solid ${IOS.separator}`,
            padding: '0.875rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.5625rem',
              color: IOS.tertiary,
              lineHeight: 1.4,
            }}
          >
            Readiness dynamically updates as drills, notes, and Grand Tests are recorded.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              padding: '0.5rem 1.25rem',
              borderRadius: '99px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: IOS.nearBlack,
              color: IOS.white,
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.82')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
