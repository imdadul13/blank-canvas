import React, { useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Target,
  TrendingUp,
  Flame,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const errorNotebook = state.errorNotebook || [];

  const { unresolvedErrors, reviewedErrors, repeatedMistakes, subjectBreakdown } = useMemo(() => {
    const unresolved: ErrorNotebookItem[] = [];
    const reviewed: ErrorNotebookItem[] = [];
    const repeated: ErrorNotebookItem[] = [];
    const subjMap: Record<string, number> = {};

    errorNotebook.forEach((item) => {
      if (item.isReviewed) reviewed.push(item);
      else unresolved.push(item);
      if ((item as any).missCount && (item as any).missCount >= 2) repeated.push(item);
      subjMap[item.subjectId] = (subjMap[item.subjectId] || 0) + 1;
    });

    return { unresolvedErrors: unresolved, reviewedErrors: reviewed, repeatedMistakes: repeated, subjectBreakdown: subjMap };
  }, [errorNotebook]);

  const totalErrors = errorNotebook.length;
  const resolutionRate = totalErrors > 0 ? Math.round((reviewedErrors.length / totalErrors) * 100) : 100;
  const topUnresolvedSubjectId = Object.entries(subjectBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSubject = FMGE_SUBJECTS.find((s) => s.id === topUnresolvedSubjectId);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9400, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="relative w-full max-w-4xl my-auto bg-[#F8FAFA] rounded-3xl border border-slate-200/80 shadow-[0_25px_60px_rgba(0,0,0,0.22)] overflow-hidden text-[#1D1D1F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 sm:px-8 py-5 border-b border-slate-200/60 bg-white/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-[#FF3B30]" />
              </div>
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-[#FF3B30]">
                Error Vault Diagnostic
              </span>
              <span className="w-1 h-1 rounded-full bg-[#C7C7CC]" />
              <span className="text-[11px] font-mono text-[#8E8E93]">{totalErrors} mistakes logged</span>
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-black tracking-tight text-[#1D1D1F] leading-tight">
              Error Vault &amp; Mistake Remediation
            </h2>
            <p className="text-[12.5px] text-[#6E6E73] max-w-xl leading-relaxed">
              Diagnostic audit of missed questions, conceptual traps, and recurring errors across your QBank and mock tests.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#8E8E93] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-6 max-h-[72vh] overflow-y-auto">

          {/* Metric tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                label: 'Unresolved Mistakes',
                value: unresolvedErrors.length,
                sub: unresolvedErrors.length > 0 ? 'Pending remediation' : 'All cleared!',
                icon: AlertTriangle,
                color: unresolvedErrors.length > 0 ? '#FF3B30' : '#30D158',
                bg: unresolvedErrors.length > 0 ? '#FFF0F0' : '#F0FFF4',
                border: unresolvedErrors.length > 0 ? 'rgba(255,59,48,0.2)' : 'rgba(48,209,88,0.2)',
                mono: `/ ${totalErrors} total`,
              },
              {
                label: 'Remediation Rate',
                value: `${resolutionRate}%`,
                sub: resolutionRate >= 70 ? 'On track' : 'Target: ≥70%',
                icon: TrendingUp,
                color: resolutionRate >= 70 ? '#30D158' : '#FF9500',
                bg: resolutionRate >= 70 ? '#F0FFF4' : '#FFF8F0',
                border: resolutionRate >= 70 ? 'rgba(48,209,88,0.2)' : 'rgba(255,149,0,0.2)',
                mono: `${reviewedErrors.length} reviewed`,
              },
              {
                label: 'Repeated Errors',
                value: repeatedMistakes.length,
                sub: 'Missed ≥2 times',
                icon: Flame,
                color: repeatedMistakes.length > 0 ? '#FF9500' : '#8E8E93',
                bg: repeatedMistakes.length > 0 ? '#FFF8F0' : '#F2F2F7',
                border: repeatedMistakes.length > 0 ? 'rgba(255,149,0,0.2)' : 'rgba(142,142,147,0.15)',
                mono: 'across sessions',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg, border, mono }) => (
              <div key={label} className="p-4 rounded-2xl border space-y-2"
                style={{ background: bg, borderColor: border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#8E8E93]">{label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-black leading-none font-mono" style={{ color }}>{value}</span>
                  <span className="text-[11px] text-[#8E8E93] font-mono">{mono}</span>
                </div>
                <span className="text-[11px] font-medium" style={{ color }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* Weak subject callout */}
          {topSubject && unresolvedErrors.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border"
              style={{ background: 'rgba(255,59,48,0.04)', borderColor: 'rgba(255,59,48,0.18)' }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-[#FF3B30]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[14px] text-[#1D1D1F]">
                    {unresolvedErrors.length} Unresolved Errors · Weakest: {topSubject.name}
                  </h4>
                  <p className="text-[12px] text-[#6E6E73] mt-0.5 leading-snug">
                    Failing to remediate missed questions is the #1 predictor of score plateaus in the final 30 days.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); onNavigateTab?.('errors'); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-white cursor-pointer transition-all shrink-0 shadow-sm"
                style={{ background: '#FF3B30', boxShadow: '0 3px 10px rgba(255,59,48,0.35)' }}
              >
                Open Error Vault
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Unresolved list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
                Highest-Priority Unresolved Mistakes
              </span>
              <span className="text-[11px] font-mono text-[#8E8E93]">{unresolvedErrors.length} pending</span>
            </div>

            {unresolvedErrors.length > 0 ? (
              <div className="space-y-2.5">
                {unresolvedErrors.slice(0, 8).map((err) => {
                  const s = FMGE_SUBJECTS.find((sub) => sub.id === err.subjectId);
                  return (
                    <div key={err.id}
                      className="p-4 rounded-2xl bg-white border border-[rgba(60,60,67,0.1)] hover:border-[rgba(255,59,48,0.25)] transition-all space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#F2F2F7] text-[#3A3A3C] border border-[rgba(60,60,67,0.12)]">
                            {s?.name || err.subjectId}
                          </span>
                          {err.topic && (
                            <span className="font-semibold text-[13px] text-[#1D1D1F] truncate">{err.topic}</span>
                          )}
                        </div>
                        <span className="text-[10.5px] font-mono text-[#8E8E93] shrink-0">{err.dateAdded}</span>
                      </div>

                      {err.questionGist && (
                        <p className="text-[12.5px] text-[#3A3A3C] font-medium leading-snug">{err.questionGist}</p>
                      )}

                      <div className="grid sm:grid-cols-2 gap-2">
                        {err.myMistake && (
                          <div className="p-2.5 rounded-xl bg-[#FFF0F0] border border-[rgba(255,59,48,0.15)] text-[11.5px] text-[#3A3A3C]">
                            <span className="font-bold text-[#FF3B30]">My Trap: </span>{err.myMistake}
                          </div>
                        )}
                        {err.correctConcept && (
                          <div className="p-2.5 rounded-xl bg-[#F0FFF4] border border-[rgba(48,209,88,0.2)] text-[11.5px] text-[#3A3A3C]">
                            <span className="font-bold text-[#30D158]">Correct Rule: </span>{err.correctConcept}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-3 text-center rounded-2xl border-2 border-dashed border-[rgba(48,209,88,0.25)] bg-[#F0FFF4]/50">
                <div className="w-12 h-12 rounded-2xl bg-[#30D158]/15 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-[#30D158]" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-[#1D1D1F]">Clean Slate</h4>
                  <p className="text-[12px] text-[#8E8E93] mt-0.5 max-w-xs">
                    No unreviewed mistakes. Keep logging tricky questions during daily drills.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11.5px] text-[#8E8E93]">
            <Shield className="h-3.5 w-3.5 text-[#30D158]" />
            <span>Reviewing an error marks it resolved and lifts your readiness score.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-[12px] font-bold bg-[#1D1D1F] hover:bg-[#3A3A3C] text-white cursor-pointer transition-colors shrink-0"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
