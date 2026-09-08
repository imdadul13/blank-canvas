import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { AppState, McqAttempt } from '../types';

interface AccuracyTrendDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  overallAccuracy: number;
  recentAccuracy: number;
  onLaunchPracticeSession?: () => void;
}

export const AccuracyTrendDetailModal: React.FC<AccuracyTrendDetailModalProps> = ({
  isOpen,
  onClose,
  state,
  overallAccuracy,
  recentAccuracy,
  onLaunchPracticeSession,
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

  // Aggregate attempts into chronological practice sessions/chunks
  const sessions = useMemo(() => {
    const attempts = state.mcqAttempts || [];
    if (attempts.length === 0) return [];

    // Group attempts by date or sessionId
    const sessionMap: Record<
      string,
      {
        id: string;
        date: string;
        attempts: McqAttempt[];
        correctCount: number;
        accuracy: number;
        avgPaceSeconds: number;
      }
    > = {};

    attempts.forEach((att) => {
      // Use sessionId or format date chunk
      const d = att.timestamp ? att.timestamp.slice(0, 10) : 'Unknown Date';
      const key = att.sessionId || d;

      if (!sessionMap[key]) {
        sessionMap[key] = {
          id: key,
          date: att.timestamp ? new Date(att.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : 'Practice Session',
          attempts: [],
          correctCount: 0,
          accuracy: 0,
          avgPaceSeconds: 0,
        };
      }

      sessionMap[key].attempts.push(att);
      if (att.isCorrect) sessionMap[key].correctCount++;
    });

    const list = Object.values(sessionMap).map((s) => {
      const total = s.attempts.length;
      const acc = total > 0 ? Math.round((s.correctCount / total) * 100) : 0;
      const totalTime = s.attempts.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0);
      const pace = total > 0 ? Math.round((totalTime / total) * 10) / 10 : 0;
      return {
        ...s,
        accuracy: acc,
        avgPaceSeconds: pace,
      };
    });

    // Sort newest first
    list.sort((a, b) => {
      const timeA = a.attempts[0]?.timestamp ? new Date(a.attempts[0].timestamp).getTime() : 0;
      const timeB = b.attempts[0]?.timestamp ? new Date(b.attempts[0].timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [state.mcqAttempts]);

  if (!isOpen) return null;

  const totalAttempts = state.mcqAttempts?.length || 0;
  const delta = recentAccuracy - overallAccuracy;
  const isImproving = delta > 2;
  const isDeclining = delta < -2;

  let trendVerdict = {
    title: 'Stable Trajectory',
    description: 'Recent clinical performance closely matches your historical baseline.',
    badge: 'STABLE',
    style: 'text-stone-700 bg-stone-100 border-stone-200',
    icon: Minus,
  };

  if (isImproving) {
    trendVerdict = {
      title: 'Positive Progression',
      description: `Recent 15-question accuracy (${recentAccuracy}%) is trending +${delta}% higher than historical average.`,
      badge: 'IMPROVING',
      style: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: TrendingUp,
    };
  } else if (isDeclining) {
    trendVerdict = {
      title: 'Accuracy Dip Detected',
      description: `Recent attempts (${recentAccuracy}%) fell ${Math.abs(delta)}% below baseline. Distractor elimination needs reinforcement.`,
      badge: 'DIP DETECTED',
      style: 'text-rose-700 bg-rose-50 border-rose-200',
      icon: TrendingDown,
    };
  }

  const TrendIcon = trendVerdict.icon;

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
                LONGITUDINAL DIAGNOSTIC
              </span>
              <span className="w-1 h-1 rounded-full bg-[#00685f]/40" />
              <span className="text-xs text-stone-400 font-mono">
                {sessions.length} SESSIONS RECORDED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Newsreader'] tracking-tight text-[#121E1B]">
              Accuracy Trend & Trajectory
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Longitudinal tracking of clinical question accuracy against the mandatory 50% NBE FMGE passing benchmark.
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
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Overall Accuracy */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Overall Accuracy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {totalAttempts > 0 ? `${overallAccuracy}%` : '—'}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  ({totalAttempts} questions)
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                NBE Target: $\ge 50\%$ minimum
              </span>
            </div>

            {/* Recent Accuracy */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Recent 15 Attempts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {totalAttempts > 0 ? `${recentAccuracy}%` : '—'}
                </span>
                {totalAttempts > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      delta >= 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {delta >= 0 ? `+${delta}%` : `${delta}%`}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                Last 15 question window
              </span>
            </div>

            {/* 50% Benchmark Status */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                50% Pass Benchmark
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  50%
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    overallAccuracy >= 50 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {totalAttempts === 0
                    ? 'Pending'
                    : overallAccuracy >= 50
                    ? `+${overallAccuracy - 50}% Clear`
                    : `${overallAccuracy - 50}% Deficit`}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                Minimum 150/300 marks
              </span>
            </div>
          </div>

          {/* Trajectory Verdict Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs shrink-0">
              <TrendIcon className="w-5 h-5 text-[#00685f]" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900">{trendVerdict.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${trendVerdict.style}`}>
                  {trendVerdict.badge}
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {trendVerdict.description}
              </p>
            </div>
          </div>

          {/* Session History Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500">
                Chronological Practice Sessions
              </h3>
              <span className="text-xs font-mono text-stone-400">
                Sorted by most recent
              </span>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-2.5">
                {sessions.map((sess, idx) => {
                  const isPassing = sess.accuracy >= 50;
                  return (
                    <div
                      key={sess.id || idx}
                      className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 font-mono">
                            {sess.date}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              isPassing
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                : 'bg-rose-50 text-rose-700 border-rose-200/60'
                            }`}
                          >
                            {isPassing ? 'PASSED 50%' : 'BELOW 50%'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-mono">
                          {sess.correctCount} correct of {sess.attempts.length} MCQs · Avg pace: {sess.avgPaceSeconds}s
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-lg font-extrabold font-mono text-[#121E1B]">
                            {sess.accuracy}%
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 block">
                            Session Accuracy
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-6">
                <Activity className="w-8 h-8 text-stone-300 mx-auto" />
                <h4 className="text-sm font-bold text-stone-800">No Recorded Practice Sessions</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Complete 10-question practice drills to generate your chronological accuracy trajectory.
                </p>
                {onLaunchPracticeSession && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchPracticeSession();
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#00685f] hover:bg-[#005049] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Launch First 10-MCQ Session</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-[#EAEFEA] bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400">
            Trajectory updates in real-time as question sets conclude.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
          >
            Close Trend Detail
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
