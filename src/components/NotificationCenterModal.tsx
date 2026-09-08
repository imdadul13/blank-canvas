import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
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
  Zap,
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
    if (!state.settings?.examDate) return 1;
    const diff = new Date(state.settings.examDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [state.settings?.examDate]);

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
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans'] text-slate-900 animate-in fade-in duration-150">
      <div className="relative bg-[#FAF9F6] rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* ── 1. Premium Medical Intelligence Header ── */}
        <div className="p-5 sm:p-6 border-b border-stone-200/80 bg-gradient-to-b from-white via-[#FAF9F5] to-[#FAF9F5] relative z-10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-[#006B63] to-[#004D47] text-white flex items-center justify-center shadow-md shadow-teal-950/15 shrink-0">
                <Brain className="h-6 w-6 text-emerald-100 stroke-[1.8]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-['Newsreader',_serif] text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                    Study Intelligence
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-teal-500/10 text-[#00685F] border border-teal-500/20">
                    <ShieldCheck className="h-3 w-3 text-[#00685F]" />
                    {visibleNotifications.length > 0 ? `${visibleNotifications.length} Active` : 'Sentinel Live'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Diagnostic sensor monitoring clinical errors, spaced recall &amp; exam pacing
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer shrink-0"
              aria-label="Close Study Intelligence"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* System Telemetry Intelligence Strip */}
          <div className="mt-4 pt-3.5 border-t border-stone-200/60 grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-2 py-1.5 border border-stone-200/60">
              <span className="text-[9.5px] uppercase font-semibold text-stone-400 tracking-wider block">
                Target Score
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit']">
                {state.settings?.targetScore || 200}<span className="text-[10px] text-stone-400 font-normal">/300</span>
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-2 py-1.5 border border-stone-200/60">
              <span className="text-[9.5px] uppercase font-semibold text-stone-400 tracking-wider block">
                Countdown
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-600 font-['Outfit'] flex items-center justify-center gap-0.5">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                {daysRemaining}d
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-2 py-1.5 border border-stone-200/60">
              <span className="text-[9.5px] uppercase font-semibold text-stone-400 tracking-wider block">
                Error Vault
              </span>
              <span className={`text-xs sm:text-sm font-bold font-['Outfit'] ${unreviewedMistakesCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {unreviewedMistakesCount} Traps
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-xl px-2 py-1.5 border border-stone-200/60">
              <span className="text-[9.5px] uppercase font-semibold text-stone-400 tracking-wider block">
                Daily Goal
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#006B63] font-['Outfit']">
                {state.settings?.dailyStudyHourGoal || 6}h/d
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Segmented Filter Navigation Dock ── */}
        <div className="px-4 sm:px-6 pt-2.5 pb-2.5 border-b border-stone-200/80 bg-[#FAF9F5] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: `All (${visibleNotifications.length})` },
              { id: 'clinical', label: `Clinical (${clinicalCount})` },
              { id: 'exam', label: `Mocks (${examCount})` },
              { id: 'wellness', label: `Pacing (${wellnessCount})` },
            ].map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#00685F] text-white shadow-xs font-bold'
                      : 'bg-white/80 text-stone-600 border border-stone-200/80 hover:bg-white hover:text-stone-900'
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
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer shrink-0"
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-white min-h-[300px]">
          {filteredNotifications.length === 0 ? (
            /* Proactive System Intelligence Briefing (When all caught up) */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#F0FDF9] border border-teal-200/80 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#006B63] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Diagnostic Sentinels Clear — No Overdue Traps
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    No urgent question traps or overdue spaced recalls require immediate remediation right now. Keep your momentum going with these recommended system actions:
                  </p>
                </div>
              </div>

              {/* 3 Proactive System Recommendations */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
                  Highest-Yield Strategic Actions
                </span>

                {/* Card 1: Today's High-Yield Vignettes */}
                <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 hover:border-teal-300 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#006B63] border border-teal-200/70 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#006B63]">
                          {recommendedFocus.subjectName} (~{recommendedFocus.weightage}M)
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 truncate">
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
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00685F] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <span>Solve 10 MCQs</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Card 2: Grand Test Diagnostic Simulation */}
                <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 hover:border-indigo-300 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/70 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Full-Length Simulation
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 truncate">
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
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <span>Open Mock Room</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Card 3: Error Vault Distractor Drill */}
                <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 hover:border-rose-300 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/70 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                        Error Notebook Drill
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 truncate">
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
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <span>Inspect Vault</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Notification Cards List */
            <div className="space-y-3 animate-in fade-in duration-150">
              {filteredNotifications.map((n) => {
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:border-stone-300 transition-all space-y-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${n.iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-white border border-stone-200/80 text-stone-700">
                              {n.badge || n.category}
                            </span>
                            {n.priority === 'high' && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200/70">
                                CRITICAL
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-stone-400 font-mono">{n.time}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDismiss(n, e)}
                              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
                              title="Dismiss insight"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {n.title}
                        </h4>

                        <p className="text-xs text-stone-600 leading-relaxed">
                          {n.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={n.onAction}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00685F] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
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
        <div className="p-4 bg-[#FAF9F5] border-t border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sensed live from your progress &amp; schedule</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
