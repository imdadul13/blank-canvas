import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Brain,
  CheckCircle2,
  Loader2,
  CalendarPlus,
  Stethoscope,
  Lightbulb,
  ShieldAlert,
  Target,
  BookOpen,
  BarChart2,
  Zap,
} from 'lucide-react';
import { PredictedTopicItem, DailyTask } from '../types';

interface PredictionExplanationModalProps {
  topic: PredictedTopicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleTopicState: (subjectId: string, topicId: string, field: 'r1Done' | 'r2Done' | 'r3Done') => void;
  onAddTask: (task: DailyTask) => void;
  onOpenAiCoach: (tab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy', subjectId?: string, topicName?: string) => void;
}

interface AiStrategyState {
  studyStrategy: string;
  clinicalVignetteClue: string;
  drugOfChoiceOrGoldStandard: string;
  examTrapWarning: string;
  memoryMnemonic: string;
}

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  VERY_HIGH: { color: '#FF3B30', bg: 'rgba(255,59,48,0.08)', border: 'rgba(255,59,48,0.25)', label: 'VERY HIGH' },
  HIGH:      { color: '#FF9500', bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.25)', label: 'HIGH' },
  MODERATE:  { color: '#007AFF', bg: 'rgba(0,122,255,0.08)', border: 'rgba(0,122,255,0.25)', label: 'MODERATE' },
  LOW:       { color: '#30D158', bg: 'rgba(48,209,88,0.08)', border: 'rgba(48,209,88,0.25)', label: 'LOW' },
};

const getRisk = (level?: string) => RISK_CONFIG[level || ''] || RISK_CONFIG['MODERATE'];

export const PredictionExplanationModal: React.FC<PredictionExplanationModalProps> = ({
  topic,
  isOpen,
  onClose,
  onToggleTopicState,
  onAddTask,
  onOpenAiCoach,
}) => {
  const [aiStrategy, setAiStrategy] = useState<AiStrategyState | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [addedToPlanner, setAddedToPlanner] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !topic) return null;

  const handleFetchAiStrategy = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/predict-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.topicName,
          subject: topic.subjectName,
          predictionScore: topic.score,
          predictionLevel: topic.levelLabel || 'HIGH',
          whyReasons: topic.whyReasons || [],
          userErrorCount: (topic.gtErrorCount || 0) + (topic.notebookErrorCount || 0),
          revisionGap: topic.prepStatus?.lastRevisionText || 'Pending',
        }),
      });
      const data = await res.json();
      setAiStrategy({
        studyStrategy: data?.studyStrategy || `Focus on high-yield clinical presentation, diagnostic algorithms, and first-line treatment guidelines for ${topic.topicName}.`,
        clinicalVignetteClue: data?.clinicalVignetteClue || 'Look for patient age, onset duration, and hallmark vital signs in the clinical vignette stem.',
        drugOfChoiceOrGoldStandard: data?.drugOfChoiceOrGoldStandard || 'Review the gold-standard diagnostic modality and first-line pharmacological agent.',
        examTrapWarning: data?.examTrapWarning || 'Beware of lookalike distractors that are contraindicated in acute presentations.',
        memoryMnemonic: data?.memoryMnemonic || 'Review the primary diagnostic triad and core pharmacological mechanisms.',
      });
    } catch {
      setAiStrategy({
        studyStrategy: `Master the diagnostic criteria and first-line management guidelines for ${topic.topicName}. Solve 15 related MCQs.`,
        clinicalVignetteClue: 'Identify discriminating symptoms and physical exam signs that separate this from classic differentials.',
        drugOfChoiceOrGoldStandard: 'Ensure you memorize both initial emergency resuscitation and definitive therapy.',
        examTrapWarning: 'Distractors frequently test second-line treatments or lookalikes with subtle differences.',
        memoryMnemonic: 'Focus on the primary clinical triad and key imaging/laboratory indicators.',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAddToPlanner = () => {
    const newTask: DailyTask = {
      id: `task-predict-${Date.now()}`,
      title: `[Predicted HY] ${topic.topicName}`,
      subjectId: topic.subjectId,
      topicName: topic.topicName,
      type: 'revision',
      durationMinutes: 45,
      completed: false,
      priority: 'high',
    };
    onAddTask(newTask);
    setAddedToPlanner(true);
    setTimeout(() => setAddedToPlanner(false), 3000);
  };

  const prepStatus = topic.prepStatus || {
    notesDone: false,
    qBankDone: false,
    r1Done: false,
    r2Done: false,
    r3Done: false,
    completionRate: 0,
    lastRevisionText: 'Not started',
  };

  const whyReasons = topic.whyReasons && topic.whyReasons.length > 0
    ? topic.whyReasons
    : ['High-frequency FMGE core syllabus concept'];

  const risk = getRisk(topic.level);

  const accuracy = (topic as any).accuracy ?? (topic.score ? Math.round(topic.score * 0.9) : 72);
  const questionsSolved = (topic as any).questionsSolved ?? topic.gtErrorCount ?? 0;

  const metrics = [
    {
      label: 'Predicted Score',
      value: `${topic.score ?? 80}`,
      unit: '/100',
      icon: Target,
      color: '#007AFF',
      bg: 'rgba(0,122,255,0.08)',
    },
    {
      label: 'Questions Solved',
      value: `${questionsSolved}`,
      unit: ' MCQs',
      icon: BookOpen,
      color: '#5856D6',
      bg: 'rgba(88,86,214,0.08)',
    },
    {
      label: 'Accuracy',
      value: `${accuracy}`,
      unit: '%',
      icon: BarChart2,
      color: '#30D158',
      bg: 'rgba(48,209,88,0.08)',
    },
  ];

  const aiStrategyCards = aiStrategy
    ? [
        { label: 'Study Strategy', content: aiStrategy.studyStrategy, color: '#007AFF', bg: 'rgba(0,122,255,0.06)', icon: Brain },
        { label: 'Clinical Vignette Clue', content: aiStrategy.clinicalVignetteClue, color: '#5856D6', bg: 'rgba(88,86,214,0.06)', icon: Stethoscope },
        { label: 'Drug of Choice / Gold Standard', content: aiStrategy.drugOfChoiceOrGoldStandard, color: '#30D158', bg: 'rgba(48,209,88,0.06)', icon: Zap },
        { label: 'Exam Trap Warning', content: aiStrategy.examTrapWarning, color: '#FF3B30', bg: 'rgba(255,59,48,0.06)', icon: ShieldAlert },
        { label: 'Memory Mnemonic', content: aiStrategy.memoryMnemonic, color: '#FF9500', bg: 'rgba(255,149,0,0.06)', icon: Lightbulb },
      ]
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9250,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '48rem',
          borderRadius: '24px',
          background: '#FFFFFF',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            flexShrink: 0,
            background: '#FFFFFF',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '20px 24px 18px',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F2F2F7',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
            }}
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {/* Eyebrow */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 6 }}>
            Topic Prediction · Risk Level
          </p>

          {/* Topic name */}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1D1D1F', lineHeight: 1.25, marginBottom: 10, paddingRight: 40 }}>
            {topic.topicName}
          </h2>

          {/* Badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {/* Subject pill */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                color: '#FFFFFF',
                background: topic.subjectColor || '#5856D6',
                letterSpacing: '0.04em',
              }}
            >
              {topic.subjectCode && <span>{topic.subjectCode} ·</span>}
              {topic.subjectName}
            </span>

            {/* Predicted score */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                color: '#007AFF',
                background: 'rgba(0,122,255,0.1)',
              }}
            >
              {topic.score ?? 80}/100
            </span>

            {/* Risk badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                color: risk.color,
                background: risk.bg,
                border: `1px solid ${risk.border}`,
                letterSpacing: '0.06em',
              }}
            >
              {risk.label} RISK
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '72vh',
            background: '#F2F2F7',
            padding: '20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 3-column metric grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {metrics.map(({ label, value, unit, icon: Icon, color, bg }) => (
              <div
                key={label}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#1D1D1F', lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93' }}>{unit}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Risk analysis card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${risk.color}`,
            }}
          >
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: risk.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Why This Topic is Flagged
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {whyReasons.map((reason, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: risk.color, marginTop: 5, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1D1D1F', lineHeight: 1.5 }}>{reason}</p>
                  </div>
                ))}
              </div>
              {topic.recommendedAction && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,149,0,0.08)',
                    border: '1px solid rgba(255,149,0,0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <Lightbulb size={14} color="#FF9500" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1D1D1F', lineHeight: 1.5 }}>{topic.recommendedAction}</p>
                </div>
              )}
            </div>
          </div>

          {/* Revision checklist */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Multi-Cycle Revision
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['r1Done', 'r2Done', 'r3Done'] as const).map((field, i) => {
                const done = prepStatus[field];
                const label = `R${i + 1}`;
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => onToggleTopicState(topic.subjectId, topic.topicId, field)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 0',
                      borderRadius: 12,
                      border: done ? 'none' : '1.5px solid rgba(0,0,0,0.12)',
                      background: done ? '#30D158' : '#F2F2F7',
                      color: done ? '#FFFFFF' : '#1D1D1F',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    <CheckCircle2 size={15} strokeWidth={2.5} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Strategy section */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiStrategy ? 12 : 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Study Strategy
              </p>
              {!aiStrategy && (
                <button
                  type="button"
                  onClick={handleFetchAiStrategy}
                  disabled={isLoadingAi}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#007AFF',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: isLoadingAi ? 'not-allowed' : 'pointer',
                    opacity: isLoadingAi ? 0.7 : 1,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {isLoadingAi ? (
                    <>
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Brain size={13} />
                      Generate AI Strategy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Loading spinner overlay */}
            <AnimatePresence>
              {isLoadingAi && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    zIndex: 2,
                  }}
                >
                  <Loader2 size={20} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#007AFF' }}>Synthesizing strategy…</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI strategy cards */}
            <AnimatePresence>
              {aiStrategy && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {aiStrategyCards.map(({ label, content, color, bg, icon: Icon }) => (
                    <div
                      key={label}
                      style={{
                        background: bg,
                        borderRadius: 12,
                        padding: '12px 14px',
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <Icon size={13} color={color} strokeWidth={2.5} />
                        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1D1D1F', lineHeight: 1.55 }}>{content}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!aiStrategy && !isLoadingAi && (
              <p style={{ fontSize: 12, color: '#8E8E93', fontWeight: 500, marginTop: 4 }}>
                Get personalized study strategy, clinical clues, and memory mnemonics for this topic.
              </p>
            )}
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {/* Add to Planner */}
            <button
              type="button"
              onClick={handleAddToPlanner}
              disabled={addedToPlanner}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                borderRadius: 14,
                border: 'none',
                background: addedToPlanner ? '#30D158' : '#F2F2F7',
                color: addedToPlanner ? '#FFFFFF' : '#1D1D1F',
                fontSize: 11,
                fontWeight: 700,
                cursor: addedToPlanner ? 'default' : 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.18s ease',
              }}
            >
              <CalendarPlus size={18} strokeWidth={2} />
              {addedToPlanner ? 'Added!' : 'Add to Planner'}
            </button>

            {/* Drill MCQs */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiCoach('vignette', topic.subjectId, topic.topicName);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                borderRadius: 14,
                border: 'none',
                background: '#F2F2F7',
                color: '#1D1D1F',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <Stethoscope size={18} strokeWidth={2} color="#007AFF" />
              Drill 10 MCQs
            </button>

            {/* Open AI Coach */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiCoach('strategy', topic.subjectId, topic.topicName);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                borderRadius: 14,
                border: 'none',
                background: '#F2F2F7',
                color: '#1D1D1F',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <Brain size={18} strokeWidth={2} color="#5856D6" />
              Open AI Coach
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            flexShrink: 0,
            background: '#FFFFFF',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#F2F2F7',
              color: '#1D1D1F',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Done
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
