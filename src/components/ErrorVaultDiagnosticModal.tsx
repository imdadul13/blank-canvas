import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Target,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';
import { AppState, ErrorNotebookItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

interface ErrorVaultDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNavigateTab?: (tab: string) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string,
    subtopic?: string,
    source?: any
  ) => void;
}

export const ErrorVaultDiagnosticModal: React.FC<ErrorVaultDiagnosticModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigateTab,
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

  const errorNotebook = state.errorNotebook || [];

  // Categorize errors
  const { unresolvedErrors, reviewedErrors, repeatedMistakes, subjectBreakdown } = useMemo(() => {
    const unresolved: ErrorNotebookItem[] = [];
    const reviewed: ErrorNotebookItem[] = [];
    const repeated: ErrorNotebookItem[] = [];
    const subjMap: Record<string, number> = {};

    errorNotebook.forEach((item) => {
      if (item.isReviewed) {
        reviewed.push(item);
      } else {
        unresolved.push(item);
      }

      // Check if repeated
      if ((item as any).missCount && (item as any).missCount >= 2) {
        repeated.push(item);
      }

      subjMap[item.subjectId] = (subjMap[item.subjectId] || 0) + 1;
    });

    return {
      unresolvedErrors: unresolved,
      reviewedErrors: reviewed,
      repeatedMistakes: repeated,
      subjectBreakdown: subjMap,
    };
  }, [errorNotebook]);

  if (!isOpen) return null;

  const totalErrors = errorNotebook.length;
  const resolutionRate =
    totalErrors > 0 ? Math.round((reviewedErrors.length / totalErrors) * 100) : 100;

  const topUnresolvedSubjectId = Object.entries(subjectBreakdown).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  const topSubject = FMGE_SUBJECTS.find((s) => s.id === topUnresolvedSubjectId);

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
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-rose-600">
                20TH NOTEBOOK DIAGNOSTIC
              </span>
              <span className="w-1 h-1 rounded-full bg-rose-400" />
              <span className="text-xs text-stone-400 font-mono">
                {totalErrors} MISTAKES LOGGED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Newsreader'] tracking-tight text-[#121E1B]">
              Error Vault & Mistake Remediation
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Diagnostic audit of missed questions, conceptual traps, and recurring errors across your QBank and mock tests.
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Unresolved Mistakes */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Unresolved Mistakes
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {unresolvedErrors.length}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  / {totalErrors} total
                </span>
              </div>
              <span className="text-[10px] font-mono text-rose-600 block">
                {unresolvedErrors.length > 0 ? 'Pending conceptual remediation' : 'All mistakes cleared!'}
              </span>
            </div>

            {/* Remediation Rate */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Remediation Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {resolutionRate}%
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  ({reviewedErrors.length} reviewed)
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                Target: $\ge 70\%$ remediation
              </span>
            </div>

            {/* Repeated Errors */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono block">
                Repeated Error Concepts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#121E1B]">
                  {repeatedMistakes.length}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 block">
                Missed $\ge 2$ times across sessions
              </span>
            </div>
          </div>

          {/* Action Callout Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <h4 className="text-sm font-bold text-stone-900">
                  {unresolvedErrors.length > 0
                    ? `${unresolvedErrors.length} Unresolved Errors in 20th Notebook`
                    : 'Zero Unreviewed Mistakes'}
                </h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {unresolvedErrors.length > 0
                  ? 'Failing to remediate missed questions is the #1 predictor of score plateaus in the final 30 days.'
                  : 'Your Error Notebook is fully remediated. Continue logging tricky questions during daily drills.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTab?.('errors');
              }}
              className="px-4 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Open Error Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Unresolved Mistakes Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-500">
                Highest-Priority Unresolved Mistakes
              </h4>
              <span className="text-xs font-mono text-stone-400">
                {unresolvedErrors.length} cards pending
              </span>
            </div>

            {unresolvedErrors.length > 0 ? (
              <div className="space-y-2.5">
                {unresolvedErrors.slice(0, 8).map((err) => {
                  const s = FMGE_SUBJECTS.find((sub) => sub.id === err.subjectId);
                  return (
                    <div
                      key={err.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#DCE4E1] hover:border-rose-200 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                            {s?.name || err.subjectId}
                          </span>
                          <span className="text-xs font-bold text-stone-900 truncate">
                            {err.topic}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {err.dateAdded}
                        </span>
                      </div>

                      <p className="text-xs text-stone-700 font-medium leading-snug">
                        {err.questionGist}
                      </p>

                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/60 text-[11px] text-stone-600 space-y-0.5">
                        <div>
                          <strong className="text-rose-700">My Trap:</strong> {err.myMistake}
                        </div>
                        <div>
                          <strong className="text-emerald-700">Correct Rule:</strong> {err.correctConcept}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-stone-800">Clean Slate</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  No unreviewed mistakes currently logged in your Error Notebook.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-[#EAEFEA] bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400">
            Reviewing an error marks it resolved and lifts your readiness score.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
          >
            Close Vault Diagnostic
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
