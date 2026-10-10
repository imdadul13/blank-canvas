import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Target, BookOpen } from 'lucide-react';
import { AppState, TopicItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { calculateTopicPerformanceMetrics } from '../utils/performanceEngine';

interface TopicMasteryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
    source?: any
  ) => void;
  onOpenSubjectDiagnostic: (subjectId: string) => void;
}

type MasteryTier = 'all' | 'struggling' | 'developing' | 'proficient' | 'mastered' | 'unattempted';

const TIER_COLOR: Record<string, string> = {
  mastered: '#30D158',
  proficient: '#007AFF',
  developing: '#FF9500',
  struggling: '#FF3B30',
  unattempted: '#8E8E93',
};

const TIER_BG: Record<string, string> = {
  mastered: 'rgba(48,209,88,0.10)',
  proficient: 'rgba(0,122,255,0.10)',
  developing: 'rgba(255,149,0,0.10)',
  struggling: 'rgba(255,59,48,0.10)',
  unattempted: 'rgba(142,142,147,0.10)',
};

const TIER_LABEL: Record<string, string> = {
  mastered: 'Mastered',
  proficient: 'Proficient',
  developing: 'Developing',
  struggling: 'Struggling',
  unattempted: 'Unattempted',
};

export const TopicMasteryDetailModal: React.FC<TopicMasteryDetailModalProps> = ({
  isOpen,
  onClose,
  state,
  onLaunchPracticeSession,
  onOpenSubjectDiagnostic,
}) => {
  const [selectedTier, setSelectedTier] = useState<MasteryTier>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute all topics across all 19 subjects with real metrics
  const allTopicRows = useMemo(() => {
    const rows: {
      subjectId: string;
      subjectName: string;
      subjectWeightage: number;
      topic: TopicItem;
      metrics: any;
    }[] = [];

    const attempts = state.mcqAttempts || [];

    FMGE_SUBJECTS.forEach((subject) => {
      const customTopics = state.subjectProgress?.[subject.id]?.customTopics || [];
      const topics = [...subject.topics, ...customTopics];

      topics.forEach((topic) => {
        const tm = calculateTopicPerformanceMetrics(subject.id, topic.id, attempts, topic);
        rows.push({
          subjectId: subject.id,
          subjectName: subject.name,
          subjectWeightage: subject.weightage,
          topic,
          metrics: tm,
        });
      });
    });

    return rows;
  }, [state]);

  // Counts by tier
  const tierCounts = useMemo(() => {
    let mastered = 0;
    let proficient = 0;
    let developing = 0;
    let struggling = 0;
    let unattempted = 0;

    allTopicRows.forEach(({ metrics }) => {
      switch (metrics.masteryStatus) {
        case 'mastered':
          mastered++;
          break;
        case 'proficient':
          proficient++;
          break;
        case 'developing':
          developing++;
          break;
        case 'struggling':
          struggling++;
          break;
        case 'unattempted':
        default:
          unattempted++;
          break;
      }
    });

    return {
      all: allTopicRows.length,
      mastered,
      proficient,
      developing,
      struggling,
      unattempted,
    };
  }, [allTopicRows]);

  // Filtered list
  const filteredRows = useMemo(() => {
    let list = allTopicRows;

    if (selectedTier !== 'all') {
      list = list.filter((r) => r.metrics.masteryStatus === selectedTier);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.topic.name.toLowerCase().includes(query) ||
          r.subjectName.toLowerCase().includes(query)
      );
    }

    // Sort order: struggling first (most repeated errors), then developing, proficient, unattempted, mastered
    return list.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        struggling: 0,
        developing: 1,
        proficient: 2,
        unattempted: 3,
        mastered: 4,
      };
      const pDiff =
        (priorityOrder[a.metrics.masteryStatus] ?? 9) -
        (priorityOrder[b.metrics.masteryStatus] ?? 9);
      if (pDiff !== 0) return pDiff;

      // Secondary sort: repeated errors descending
      if (b.metrics.repeatedErrorsCount !== a.metrics.repeatedErrorsCount) {
        return b.metrics.repeatedErrorsCount - a.metrics.repeatedErrorsCount;
      }
      return a.metrics.accuracy - b.metrics.accuracy;
    });
  }, [allTopicRows, selectedTier, searchQuery]);

  if (!isOpen) return null;

  const total = allTopicRows.length || 1;
  const displayedRows = filteredRows.slice(0, 50);

  const tierTabs: { id: MasteryTier; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: tierCounts.all },
    { id: 'struggling', label: 'Struggling', count: tierCounts.struggling },
    { id: 'developing', label: 'Developing', count: tierCounts.developing },
    { id: 'proficient', label: 'Proficient', count: tierCounts.proficient },
    { id: 'mastered', label: 'Mastered', count: tierCounts.mastered },
    { id: 'unattempted', label: 'Unattempted', count: tierCounts.unattempted },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9050,
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
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '56rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '92vh',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '20px 24px 18px',
            borderBottom: '1px solid #F2F2F7',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#007AFF',
                textTransform: 'uppercase',
                marginBottom: '6px',
                margin: 0,
              }}
            >
              CURRICULUM DISTRIBUTION &nbsp;·&nbsp; {FMGE_SUBJECTS.length} SUBJECTS &nbsp;·&nbsp; {allTopicRows.length} TOPICS
            </p>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#1D1D1F',
                margin: '4px 0 0',
                letterSpacing: '-0.3px',
              }}
            >
              Topic Mastery Diagnostic
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#F2F2F7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#8E8E93',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#E5E5EA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F2F2F7'; }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div
          style={{
            maxHeight: '72vh',
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Distribution Bar */}
          <div
            style={{
              background: '#F2F2F7',
              borderRadius: '16px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Mastery Distribution
              </span>
              <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 600 }}>
                {allTopicRows.length} topics total
              </span>
            </div>

            {/* Segmented bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '100px',
                background: '#E5E5EA',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              {[
                { key: 'struggling', color: '#FF3B30', count: tierCounts.struggling },
                { key: 'developing', color: '#FF9500', count: tierCounts.developing },
                { key: 'proficient', color: '#007AFF', count: tierCounts.proficient },
                { key: 'mastered', color: '#30D158', count: tierCounts.mastered },
                { key: 'unattempted', color: '#C7C7CC', count: tierCounts.unattempted },
              ].map(({ key, color, count }) =>
                count > 0 ? (
                  <div
                    key={key}
                    title={`${TIER_LABEL[key]}: ${count}`}
                    style={{
                      width: `${(count / total) * 100}%`,
                      background: color,
                      height: '100%',
                      transition: 'width 0.4s ease',
                    }}
                  />
                ) : null
              )}
            </div>

            {/* Legend pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              {[
                { key: 'struggling', label: 'Struggling', color: '#FF3B30', count: tierCounts.struggling },
                { key: 'developing', label: 'Developing', color: '#FF9500', count: tierCounts.developing },
                { key: 'proficient', label: 'Proficient', color: '#007AFF', count: tierCounts.proficient },
                { key: 'mastered', label: 'Mastered', color: '#30D158', count: tierCounts.mastered },
                { key: 'unattempted', label: 'Unattempted', color: '#8E8E93', count: tierCounts.unattempted },
              ].map(({ key, label, color, count }) => (
                <span
                  key={key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1D1D1F',
                    background: '#FFFFFF',
                    borderRadius: '100px',
                    padding: '3px 10px 3px 6px',
                    border: `1px solid ${color}30`,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {label} <strong style={{ color }}>{count}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Controls: tier tabs + search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Tier tab pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '2px',
              }}
            >
              {tierTabs.map((tab) => {
                const isActive = selectedTier === tab.id;
                const tierColor = tab.id === 'all' ? '#1D1D1F' : TIER_COLOR[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedTier(tab.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '100px',
                      border: isActive ? 'none' : '1px solid #E5E5EA',
                      background: isActive
                        ? tab.id === 'all'
                          ? '#1D1D1F'
                          : tierColor
                        : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : tab.id === 'all' ? '#1D1D1F' : tierColor,
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: 'all 0.15s',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    {tab.label} {tab.count > 0 && (
                      <span style={{ opacity: isActive ? 0.75 : 0.6 }}>({tab.count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8E8E93',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search topics or subjects…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  borderRadius: '12px',
                  border: '1.5px solid #E5E5EA',
                  background: '#F2F2F7',
                  fontSize: '13px',
                  color: '#1D1D1F',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1.5px solid #007AFF';
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1.5px solid #E5E5EA';
                  e.currentTarget.style.background = '#F2F2F7';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Topic List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence mode="popLayout">
              {displayedRows.length > 0 ? (
                displayedRows.map(({ subjectId, subjectName, subjectWeightage, topic, metrics: tm }, idx) => {
                  const isAttempted = tm.totalAttempts > 0;
                  const tierColor = TIER_COLOR[tm.masteryStatus] ?? '#8E8E93';
                  const tierBg = TIER_BG[tm.masteryStatus] ?? 'rgba(142,142,147,0.10)';

                  return (
                    <motion.div
                      key={`${subjectId}-${topic.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.3) }}
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #F2F2F7',
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      {/* Left accent bar */}
                      <div
                        style={{
                          width: '4px',
                          background: tierColor,
                          flexShrink: 0,
                          borderRadius: '14px 0 0 14px',
                        }}
                      />

                      {/* Content */}
                      <div
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          minWidth: 0,
                        }}
                      >
                        {/* Top row: mastery badge, high-yield, subject pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: tierColor,
                              background: tierBg,
                              borderRadius: '100px',
                              padding: '2px 8px',
                            }}
                          >
                            {TIER_LABEL[tm.masteryStatus] ?? tm.masteryStatus}
                          </span>

                          {topic.isHighYield && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#FF9500',
                                background: 'rgba(255,149,0,0.10)',
                                borderRadius: '100px',
                                padding: '2px 7px',
                              }}
                            >
                              High-Yield
                            </span>
                          )}

                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#8E8E93',
                              background: '#F2F2F7',
                              borderRadius: '100px',
                              padding: '2px 8px',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={`${subjectName} · ${subjectWeightage}M`}
                          >
                            {subjectName}
                          </span>
                        </div>

                        {/* Topic name */}
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#1D1D1F',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {topic.name}
                        </p>

                        {/* Stats row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '11px',
                            color: '#8E8E93',
                            fontWeight: 600,
                          }}
                        >
                          <span>
                            Accuracy:{' '}
                            <strong style={{ color: isAttempted ? '#1D1D1F' : '#8E8E93' }}>
                              {isAttempted ? `${tm.accuracy}%` : '—'}
                            </strong>
                          </span>
                          <span style={{ color: '#C7C7CC' }}>·</span>
                          <span>
                            Solved: <strong style={{ color: '#1D1D1F' }}>{tm.totalAttempts}</strong>
                          </span>
                          {tm.repeatedErrorsCount > 0 && (
                            <>
                              <span style={{ color: '#C7C7CC' }}>·</span>
                              <span style={{ color: '#FF3B30', fontWeight: 700 }}>
                                {tm.repeatedErrorsCount} repeat error{tm.repeatedErrorsCount !== 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '12px 14px',
                          justifyContent: 'center',
                          alignItems: 'flex-end',
                          flexShrink: 0,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSubjectDiagnostic(subjectId);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '100px',
                            border: '1.5px solid #E5E5EA',
                            background: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#1D1D1F',
                            cursor: 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <BookOpen size={11} strokeWidth={2.5} />
                          Roadmap
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLaunchPracticeSession?.(
                              subjectId,
                              topic.id,
                              topic.name,
                              undefined,
                              'recommended_video_practice'
                            );
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '100px',
                            border: 'none',
                            background: '#007AFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(0,122,255,0.30)',
                          }}
                        >
                          <Target size={11} strokeWidth={2.5} />
                          Solve 10 MCQs
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: '#F2F2F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Search size={24} style={{ color: '#C7C7CC' }} />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                    No topics match
                  </p>
                  <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0 }}>
                    Try adjusting your filter or search query.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSelectedTier('all'); setSearchQuery(''); }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '100px',
                      border: 'none',
                      background: '#007AFF',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredRows.length > 50 && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#8E8E93',
                  fontWeight: 600,
                  padding: '8px 0',
                  margin: 0,
                }}
              >
                Showing 50 of {filteredRows.length} — refine your search to see more
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 24px',
            borderTop: '1px solid #F2F2F7',
            background: '#FAFAFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: '#8E8E93',
              margin: 0,
              fontWeight: 500,
            }}
          >
            Mastery status recalculates automatically as you practice.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '100px',
              border: 'none',
              background: '#1D1D1F',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
