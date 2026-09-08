import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  PlusCircle,
  Calendar,
} from 'lucide-react';
import { GrandTest } from '../types';

interface GrandTestDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTests: GrandTest[];
  onNavigateTab?: (tab: string) => void;
}

export const GrandTestDiagnosticModal: React.FC<GrandTestDiagnosticModalProps> = ({
  isOpen,
  onClose,
  grandTests = [],
  onNavigateTab,
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

  // Sort tests chronologically (newest first)
  const sortedTests = [...grandTests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestGT = sortedTests[0] || null;
  const passBenchmark = 150; // out of 300
  const latestScore = latestGT ? latestGT.score : 0;
  const latestPercentage = latestGT ? Math.round((latestScore / (latestGT.totalMarks || 300)) * 100) : 0;
  const passMargin = latestScore - passBenchmark;
  const isPassing = passMargin >= 0;

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
                MOCK EXAM DIAGNOSTIC
              </span>
              <span className="w-1 h-1 rounded-full bg-[#00685f]/40" />
              <span className="text-xs text-stone-400 font-mono">
                {grandTests.length} GRAND TESTS LOGGED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Newsreader'] tracking-tight text-[#121E1B]">
              Grand Test Performance
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Full-length 300-mark mock exam records evaluated against the NBE passing cutoff (150/300, 50%).
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
          {latestGT ? (
            <>
              {/* Latest GT Highlight Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                      MOST RECENT MOCK EXAM
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 font-['Newsreader']">
                      {latestGT.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                      <span>{latestGT.platform}</span>
                      <span>•</span>
                      <span>{latestGT.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-3xl font-extrabold font-mono text-[#121E1B]">
                          {latestGT.score}
                        </span>
                        <span className="text-xs font-mono text-stone-400">
                          / {latestGT.totalMarks || 300}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#00685f] block">
                        {latestPercentage}% Accuracy
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono border shrink-0 ${
                        isPassing
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isPassing ? `+${passMargin} Above Pass` : `${passMargin} Below Pass`}
                    </span>
                  </div>
                </div>

                {/* Sub-scores (Paper 1 & Paper 2 if logged) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-200/60 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white border border-stone-200/60">
                    <span className="text-stone-400 text-[10px] block">CORRECT</span>
                    <span className="text-base font-bold text-emerald-700">{latestGT.correctCount || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-stone-200/60">
                    <span className="text-stone-400 text-[10px] block">INCORRECT</span>
                    <span className="text-base font-bold text-rose-600">{latestGT.incorrectCount || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-stone-200/60">
                    <span className="text-stone-400 text-[10px] block">PAPER 1 (PRE/PARA)</span>
                    <span className="text-base font-bold text-stone-800">
                      {latestGT.paper1Score !== undefined ? `${latestGT.paper1Score} / 150` : '—'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-stone-200/60">
                    <span className="text-stone-400 text-[10px] block">PAPER 2 (CLINICAL)</span>
                    <span className="text-base font-bold text-stone-800">
                      {latestGT.paper2Score !== undefined ? `${latestGT.paper2Score} / 150` : '—'}
                    </span>
                  </div>
                </div>

                {/* Key mistakes note if provided */}
                {latestGT.keyMistakesNotes && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                      DEBRIEF NOTES & WEAK AREAS
                    </span>
                    <p className="text-stone-700 leading-relaxed italic">
                      "{latestGT.keyMistakesNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Historical GT Progression List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500">
                    All Logged Grand Tests ({sortedTests.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab?.('grandtests');
                    }}
                    className="text-xs font-bold text-[#00685f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage in Grand Tests Tab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {sortedTests.map((gt) => {
                    const margin = gt.score - passBenchmark;
                    const pass = margin >= 0;
                    return (
                      <div
                        key={gt.id}
                        className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <h5 className="text-sm font-bold text-stone-900">{gt.title}</h5>
                          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                            <span>{gt.platform}</span>
                            <span>•</span>
                            <span>{gt.date}</span>
                            {gt.percentile !== undefined && gt.percentile > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-teal-700 font-bold">{gt.percentile}th %ile</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-base font-extrabold font-mono text-[#121E1B]">
                              {gt.score} <span className="text-xs font-normal text-stone-400">/ 300</span>
                            </span>
                            <span className="text-[10px] font-mono text-stone-400 block">
                              {Math.round((gt.score / (gt.totalMarks || 300)) * 100)}%
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              pass
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                : 'bg-rose-50 text-rose-700 border-rose-200/60'
                            }`}
                          >
                            {pass ? `+${margin}` : margin}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-3 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-6">
              <Award className="w-8 h-8 text-stone-300 mx-auto" />
              <h4 className="text-sm font-bold text-stone-800">No Grand Tests Logged</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Log your full-length 300-question mock exams (from Marrow, Prepladder, Cerebellum, or NBE CBTs) to evaluate paper-level readiness against the 150-mark pass benchmark.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.('grandtests');
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#00685f] hover:bg-[#005049] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log Grand Test Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-[#EAEFEA] bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400">
            Passing criteria: 150/300 marks (50%) with no negative marking.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
          >
            Close Grand Tests
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
