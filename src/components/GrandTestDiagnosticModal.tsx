import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Award,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { GrandTest } from '../types';

interface GrandTestDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTests: GrandTest[];
  onNavigateTab?: (tab: string) => void;
}

const PASS_BENCHMARK = 150;
const TOTAL_MARKS = 300;

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const GrandTestDiagnosticModal: React.FC<GrandTestDiagnosticModalProps> = ({
  isOpen,
  onClose,
  grandTests = [],
  onNavigateTab,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedTests = [...grandTests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestGT = sortedTests[0] ?? null;
  const latestScore = latestGT ? latestGT.score : 0;
  const latestTotal = latestGT?.totalMarks ?? TOTAL_MARKS;
  const latestPercentage = latestGT ? Math.round((latestScore / latestTotal) * 100) : 0;
  const passMargin = latestScore - PASS_BENCHMARK;
  const isPassing = passMargin >= 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9200,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="font-sans antialiased text-[#1D1D1F]"
        style={{
          width: '100%',
          maxWidth: '768px',
          backgroundColor: '#F2F2F7',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '20px 24px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#007AFF',
              }}
            >
              MOCK EXAM DIAGNOSTIC · {grandTests.length} TEST{grandTests.length !== 1 ? 'S' : ''}
            </span>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#1D1D1F',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Grand Test Performance
            </h2>
            <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
              Full-length 300-mark mock exams tracked against the NBE pass cutoff.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              flexShrink: 0,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F2F2F7',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              marginTop: '2px',
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '72vh',
            padding: '20px 20px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {latestGT ? (
            <>
              {/* Latest GT Hero Card */}
              <div
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #007AFF 0%, #0A2463 100%)',
                  padding: '22px',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 32px rgba(0,122,255,0.30)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* subtle texture ring */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-60px',
                    right: '-60px',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Row 1: label + platform pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
                    MOST RECENT MOCK EXAM
                  </span>
                  {latestGT.platform && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        color: '#FFFFFF',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      {latestGT.platform}
                    </span>
                  )}
                </div>

                {/* Title + date */}
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                  {latestGT.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
                  {formatDate(latestGT.date)}
                </p>

                {/* Score row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1, color: '#FFFFFF', letterSpacing: '-2px' }}>
                        {latestGT.score}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                        /{latestTotal}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                      {latestPercentage}% accuracy
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {/* Pass/Fail badge */}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '5px 14px',
                        borderRadius: '999px',
                        backgroundColor: isPassing ? '#30D158' : '#FF3B30',
                        color: '#FFFFFF',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {isPassing ? 'PASS' : 'FAIL'}
                    </span>
                    {/* Delta */}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                      {isPassing
                        ? `+${passMargin} above pass mark`
                        : `${Math.abs(passMargin)} below pass mark`}
                    </span>
                  </div>
                </div>

                {/* Sub-scores grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {[
                    { label: 'CORRECT', value: latestGT.correctCount ?? 0, color: '#30D158' },
                    { label: 'INCORRECT', value: latestGT.incorrectCount ?? 0, color: '#FF3B30' },
                    {
                      label: 'PAPER 1',
                      value: latestGT.paper1Score !== undefined ? `${latestGT.paper1Score}/150` : '—',
                      color: 'rgba(255,255,255,0.9)',
                    },
                    {
                      label: 'PAPER 2',
                      value: latestGT.paper2Score !== undefined ? `${latestGT.paper2Score}/150` : '—',
                      color: 'rgba(255,255,255,0.9)',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.10)',
                        borderRadius: '12px',
                        padding: '10px 10px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: item.color as string, lineHeight: 1.1 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Debrief notes */}
                {latestGT.keyMistakesNotes && (
                  <div
                    style={{
                      marginTop: '12px',
                      backgroundColor: 'rgba(255,149,0,0.18)',
                      border: '1px solid rgba(255,149,0,0.35)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                    }}
                  >
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF9500', display: 'block', marginBottom: '4px' }}>
                      DEBRIEF NOTES & WEAK AREAS
                    </span>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                      "{latestGT.keyMistakesNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Historical list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#8E8E93' }}>
                    All Logged Grand Tests ({sortedTests.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigateTab?.('grandtests'); }}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#007AFF',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: 0,
                    }}
                  >
                    Manage in Grand Tests Tab
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sortedTests.map((gt) => {
                    const margin = gt.score - PASS_BENCHMARK;
                    const pass = margin >= 0;
                    const pct = Math.round((gt.score / (gt.totalMarks ?? TOTAL_MARKS)) * 100);
                    return (
                      <div
                        key={gt.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {gt.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {gt.platform && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: '#EEF2FF',
                                  color: '#5856D6',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                }}
                              >
                                {gt.platform}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>{formatDate(gt.date)}</span>
                            {gt.percentile !== undefined && gt.percentile > 0 && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#007AFF' }}>
                                {gt.percentile}th %ile
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1D1D1F', lineHeight: 1.1 }}>
                              {gt.score}
                              <span style={{ fontSize: '11px', fontWeight: 500, color: '#8E8E93' }}> / {gt.totalMarks ?? TOTAL_MARKS}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>{pct}%</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: pass ? '#30D158' : '#FF3B30',
                                color: '#FFFFFF',
                              }}
                            >
                              {pass ? 'PASS' : 'FAIL'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: pass ? '#30D158' : '#FF3B30',
                              }}
                            >
                              {pass ? `+${margin}` : `${margin}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                gap: '14px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(48,209,88,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={36} color="#30D158" strokeWidth={1.8} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1D1D1F', margin: 0 }}>
                  No Grand Tests Logged
                </h4>
                <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0, lineHeight: 1.6, maxWidth: '360px' }}>
                  Log your full-length 300-question mock exams from Marrow, Prepladder, Cerebellum, or NBE CBTs to evaluate readiness against the 150-mark pass benchmark.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); onNavigateTab?.('grandtests'); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '11px 22px',
                  borderRadius: '999px',
                  backgroundColor: '#1D1D1F',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                <PlusCircle size={15} />
                Log Grand Test
              </button>
            </div>
          )}

          {/* bottom spacer */}
          <div style={{ height: '4px' }} />
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            backgroundColor: '#FFFFFF',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>
            NBE pass mark: 150/300 (50%) · No negative marking
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: '#1D1D1F',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
