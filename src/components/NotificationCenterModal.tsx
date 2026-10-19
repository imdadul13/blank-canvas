import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bell,
  CheckCircle2,
  ArrowRight,
  Brain,
  Flame,
  Target,
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AppState } from '../types';
import {
  buildNotifications,
  loadDismissals,
  saveDismissals,
  shouldShow,
  type DismissalRecord,
  type SmartNotification,
} from '../utils/notificationEngine';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getDaysRemainingToExam } from '../utils/adaptivePriorityEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNavigateTab: (tab: any) => void;
  onSelectSubject?: (subjectId: string) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string
  ) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigateTab,
  onSelectSubject,
  onLaunchPracticeSession,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'clinical' | 'exam' | 'wellness'>('all');
  const [dismissals, setDismissals] = useState<Record<string, DismissalRecord>>(loadDismissals);
  const [wellnessLoggedToast, setWellnessLoggedToast] = useState<string | null>(null);

  useEffect(() => {
    saveDismissals(dismissals);
  }, [dismissals]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const persistDismiss = (id: string, condition: string) =>
    setDismissals((prev) => ({ ...prev, [id]: { hiddenAt: Date.now(), condition } }));

  const allNotifications: SmartNotification[] = useMemo(
    () =>
      buildNotifications(
        state,
        dismissals,
        {
          onClose,
          onNavigateTab,
          onSelectSubject,
          onLaunchPracticeSession,
          onDismiss: persistDismiss,
          onBreakLogged: (msg) => {
            setWellnessLoggedToast(msg);
            setTimeout(() => setWellnessLoggedToast(null), 3500);
          },
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, dismissals, onClose, onNavigateTab, onSelectSubject, onLaunchPracticeSession]
  );

  const daysRemaining = useMemo(() => {
    return getDaysRemainingToExam(state);
  }, [state]);

  const unreviewedMistakesCount = useMemo(() => {
    return Object.values(state.errorNotebook || {}).filter((m) => m && !m.isReviewed).length;
  }, [state.errorNotebook]);

  // System Recommended Focus Topic (Highest-yield topic currently incomplete)
  const recommendedFocus = useMemo(() => {
    for (const sub of FMGE_SUBJECTS) {
      const unfinishedHY = sub.topics.find(
        (t) => t.isHighYield && !state.topicsState?.[`${sub.id}-${t.id}`]?.notesDone
      );
      if (unfinishedHY) {
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          topicId: unfinishedHY.id,
          topicName: unfinishedHY.name,
          weightage: sub.weightage,
        };
      }
    }
    const defaultSub = FMGE_SUBJECTS[0];
    return {
      subjectId: defaultSub.id,
      subjectName: defaultSub.name,
      topicId: defaultSub.topics[0]?.id || 'top-1',
      topicName: defaultSub.topics[0]?.name || 'Cardiology',
      weightage: defaultSub.weightage,
    };
  }, [state.topicsState]);

  if (!isOpen) return null;

  const visibleNotifications = allNotifications.filter((n) => shouldShow(n, dismissals));

  const filteredNotifications = visibleNotifications.filter((n) => {
    if (activeFilter === 'clinical') return ['revision', 'error'].includes(n.category);
    if (activeFilter === 'exam') return n.category === 'exam';
    if (activeFilter === 'wellness') return ['wellness', 'focus'].includes(n.category);
    return true;
  });

  const clinicalCount = visibleNotifications.filter((n) => ['revision', 'error'].includes(n.category)).length;
  const examCount = visibleNotifications.filter((n) => n.category === 'exam').length;
  const wellnessCount = visibleNotifications.filter((n) => ['wellness', 'focus'].includes(n.category)).length;

  const handleDismiss = (n: SmartNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    persistDismiss(n.id, n.condition);
  };

  const handleDismissAll = () => {
    setDismissals((prev) => {
      const next = { ...prev };
      visibleNotifications.forEach((n) => {
        next[n.id] = { hiddenAt: Date.now(), condition: n.condition };
      });
      return next;
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans text-slate-900 animate-in fade-in duration-150"
      style={{
        paddingTop: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-top, 0px)))',
        paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom, 0px)))'
      }}
    >
      <div className="relative bg-white/95 dark:bg-[#1C1D22] backdrop-blur-2xl rounded-3xl max-w-xl w-full shadow-[0_24px_64px_rgba(0,0,0,0.14)] border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[calc(100dvh-max(2.5rem,calc(1.5rem+env(safe-area-inset-top,0px)+env(safe-area-inset-bottom,0px))))] sm:max-h-[90dvh] before:absolute before:inset-0 before:bg-gradient-to-tr before:from-amber-500/[0.03] before:via-white/0 before:to-teal-500/[0.02] before:pointer-events-none animate-in zoom-in-95 duration-150">
        
        {/* Specular Top Shimmer Edge */}
        <div
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* ── 1. Apple Notification Center Intelligence Header ── */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#1C1D22]/95 backdrop-blur-md relative z-10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shadow-amber-500/25 shrink-0 ring-2 ring-white">
                <Bell className="h-6 w-6 text-white stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Study Intelligence
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40">
                    <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    {visibleNotifications.length > 0 ? `${visibleNotifications.length} Active` : 'Sentinel Live'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Diagnostic sensor monitoring clinical errors, spaced recall &amp; exam pacing
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close Study Intelligence"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* System Telemetry Intelligence Strip — 4 Apple Health Cards */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50/80 dark:bg-white/[0.04] backdrop-blur-xs rounded-2xl px-2 py-2 border border-slate-200/70 dark:border-white/10 shadow-2xs">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider block">
                Target Score
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
                {state.settings?.targetScore || 200}<span className="text-[10px] text-slate-400 font-normal">/300</span>
              </span>
            </div>

            <div className="bg-slate-50/80 dark:bg-white/[0.04] backdrop-blur-xs rounded-2xl px-2 py-2 border border-slate-200/70 dark:border-white/10 shadow-2xs">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider block">
                Countdown
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-display flex items-center justify-center gap-0.5">
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                {daysRemaining}d
              </span>
            </div>

            <div className="bg-slate-50/80 dark:bg-white/[0.04] backdrop-blur-xs rounded-2xl px-2 py-2 border border-slate-200/70 dark:border-white/10 shadow-2xs">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider block">
                Error Vault
              </span>
              <span className={`text-xs sm:text-sm font-bold font-display ${unreviewedMistakesCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {unreviewedMistakesCount} Traps
              </span>
            </div>

            <div className="bg-slate-50/80 dark:bg-white/[0.04] backdrop-blur-xs rounded-2xl px-2 py-2 border border-slate-200/70 dark:border-white/10 shadow-2xs">
              <span className="text-[9.5px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider block">
                Daily Goal
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#007AFF] dark:text-teal-400 font-display">
                {state.settings?.dailyStudyHourGoal || 6}h/d
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. iOS Segmented Pill Filter Dock ── */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
          <div className="p-1 bg-slate-200/60 dark:bg-white/10 rounded-2xl flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'mistake', label: 'Error Traps' },
              { id: 'recall', label: 'Spaced Recall' },
              { id: 'pacing', label: 'Velocity' },
              { id: 'wellness', label: 'Rest & Focus' },
            ].map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {visibleNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            >
              Dismiss All
            </button>
          )}
        </div>

        {/* Feedback Banner */}
        {wellnessLoggedToast && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{wellnessLoggedToast}</span>
          </div>
        )}

        {/* ── 3. Modal Body: Notifications & Proactive Intelligence ── */}
        <div className="p-4 sm:p-6 pb-8 sm:pb-6 overflow-y-auto flex-1 space-y-4 bg-white/50 dark:bg-[#1C1D22] min-h-[300px]">
          {filteredNotifications.length === 0 ? (
            /* Proactive System Intelligence Briefing (When all caught up) */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 sm:p-5 rounded-3xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 flex items-start gap-3.5 shadow-2xs">
                <div className="h-10 w-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-xs shadow-teal-900/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Diagnostic Sentinels Clear — No Overdue Traps
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    No urgent question traps or overdue spaced recalls require immediate remediation right now. Keep your momentum going with these recommended system actions:
                  </p>
                </div>
              </div>

              {/* 3 Proactive System Recommendations */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                  Highest-Yield Strategic Actions
                </span>

                {/* Card 1: Today's High-Yield Vignettes */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#25262B] hover:bg-slate-50/80 dark:hover:bg-[#2C2D33] border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-teal-300 dark:hover:border-teal-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#007AFF] dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/40 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] dark:text-teal-400">
                          {recommendedFocus.subjectName} (~{recommendedFocus.weightage}M)
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {recommendedFocus.topicName}
                      </h5>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchPracticeSession?.(
                        recommendedFocus.subjectId,
                        recommendedFocus.topicId,
                        recommendedFocus.topicName
                      );
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#0071E3] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98]"
                  >
                    <span>Solve 10 MCQs</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Card 2: Grand Test Diagnostic Simulation */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#25262B] hover:bg-slate-50/80 dark:hover:bg-[#2C2D33] border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Full-Length Simulation
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {state.grandTests && state.grandTests.length > 0
                          ? `Latest Mock: ${state.grandTests[0].title} (${state.grandTests[0].score}/300)`
                          : 'Benchmark Grand Test (300 Questions)'}
                      </h5>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('grandtests');
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98]"
                  >
                    <span>Open Mock Room</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Card 3: Error Vault Distractor Drill */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#25262B] hover:bg-slate-50/80 dark:hover:bg-[#2C2D33] border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-rose-300 dark:hover:border-rose-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/40 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Error Notebook Drill
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {unreviewedMistakesCount > 0
                          ? `${unreviewedMistakesCount} Unreviewed Clinical Traps`
                          : 'Zero Overdue Traps — Review Mastered Vault'}
                      </h5>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('errors');
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98]"
                  >
                    <span>Inspect Vault</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Notification Cards List — Apple iOS Grouped Cards */
            <div className="space-y-3 animate-in fade-in duration-150">
              {filteredNotifications.map((n) => {
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    className="p-4 sm:p-5 rounded-3xl bg-slate-50/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.07] backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-teal-300/70 transition-all space-y-3 group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${n.iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                              {n.badge || n.category}
                            </span>
                            {n.priority === 'high' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200/70">
                                CRITICAL
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDismiss(n, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Dismiss insight"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {n.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {n.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={n.onAction}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0071E3] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <span>{n.actionLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 4. Polished Action Footer ── */}
        <div
          className="p-4 bg-slate-50/80 dark:bg-black/20 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0"
          style={{ paddingBottom: 'max(0.875rem, calc(0.625rem + env(safe-area-inset-bottom, 0px)))' }}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sensed live from your progress &amp; schedule</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
