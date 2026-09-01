import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Sparkles,
  Droplet,
  Brain,
  Eye,
  Coffee,
  Check,
  Zap
} from 'lucide-react';
import { AppState } from '../types';
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

interface SmartNotification {
  id: string;
  category: 'revision' | 'wellness' | 'focus' | 'error' | 'exam';
  title: string;
  description: string;
  time: string;
  actionLabel: string;
  onAction: () => void;
  icon: React.ElementType;
  iconColor: string;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigateTab,
  onSelectSubject,
  onLaunchPracticeSession,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'clinical' | 'wellness'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [wellnessLoggedToast, setWellnessLoggedToast] = useState<string | null>(null);

  // Dynamic time-based smart notifications
  const allNotifications: SmartNotification[] = useMemo(() => {
    const list: SmartNotification[] = [
      {
        id: 'notif-wellness-water',
        category: 'wellness',
        title: 'Hydration & 20-20-20 Visual Rest',
        description: '45-minute continuous study block reached. Drink 250ml water and glance 20 feet away for 20 seconds to prevent cognitive fatigue.',
        time: 'Just now',
        actionLabel: 'Drink Water & Refresh',
        onAction: () => {
          setWellnessLoggedToast('Great job! 250ml hydration & eye rest logged. Cognitive stamina restored.');
          setTimeout(() => setWellnessLoggedToast(null), 3500);
        },
        icon: Droplet,
        iconColor: 'text-sky-600 bg-sky-50 border-sky-200/80',
      },
      {
        id: 'notif-focus-circadian',
        category: 'focus',
        title: 'Circadian Focus Booster Protocol',
        description: 'Switch from passive note reading to high-intensity active recall: 10 quick clinical MCQs to trigger dopamine-mediated consolidation.',
        time: '5m ago',
        actionLabel: 'Start 10-MCQ Sprint',
        onAction: () => {
          onClose();
          onLaunchPracticeSession?.('pharmacology', 'pharm-1', 'General Pharmacology - Pharmacokinetics & Receptors');
        },
        icon: Brain,
        iconColor: 'text-purple-600 bg-purple-50 border-purple-200/80',
      },
      {
        id: 'notif-revision-r2',
        category: 'revision',
        title: 'Spaced Revision R2 Due Today',
        description: 'Pulmonology — Asthma & COPD reached its 7-day R2 retention decay threshold. Active recall now prevents memory loss.',
        time: '15m ago',
        actionLabel: 'Start R2 Revision',
        onAction: () => {
          onClose();
          onNavigateTab('revision');
        },
        icon: RotateCcw,
        iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      },
      {
        id: 'notif-error-vault',
        category: 'error',
        title: 'High-Yield Trap in Forensic Medicine',
        description: '2 recent mistakes identified in Thanatology (Post-mortem interval calculations). Review the diagnostic discriminator.',
        time: '1h ago',
        actionLabel: 'Remediate Mistake',
        onAction: () => {
          onClose();
          onNavigateTab('errors');
        },
        icon: AlertTriangle,
        iconColor: 'text-rose-600 bg-rose-50 border-rose-200/80',
      },
      {
        id: 'notif-exam-gt',
        category: 'exam',
        title: '70-Day Grand Test Milestone',
        description: 'Full 300-question NBE Mock Exam scheduled. Test test-day stamina, pacing (1 min/Q), and negative marking discipline.',
        time: 'Today',
        actionLabel: 'Open Grand Tests',
        onAction: () => {
          onClose();
          onNavigateTab('grandtests');
        },
        icon: BookOpen,
        iconColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
      },
    ];

    return list;
  }, [onClose, onNavigateTab, onLaunchPracticeSession]);

  if (!isOpen) return null;

  const activeNotifications = allNotifications.filter((n) => !dismissedIds.includes(n.id));

  const filteredNotifications = activeNotifications.filter((n) => {
    if (activeFilter === 'clinical') return ['revision', 'error', 'exam'].includes(n.category);
    if (activeFilter === 'wellness') return ['wellness', 'focus'].includes(n.category);
    return true;
  });

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleDismissAll = () => {
    setDismissedIds(allNotifications.map((n) => n.id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-bold text-slate-900 flex items-center gap-2">
                Study Intelligence & Alerts
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200">
                  {activeNotifications.length} Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time clinical triggers, spaced recall, and cognitive wellness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: `All (${activeNotifications.length})` },
              { id: 'clinical', label: 'Clinical & Revision' },
              { id: 'wellness', label: 'Focus & Breaks' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Dismiss All
            </button>
          )}
        </div>

        {/* Wellness Toast Feedback */}
        {wellnessLoggedToast && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{wellnessLoggedToast}</span>
          </div>
        )}

        {/* List of Smart Notifications */}
        <div className="p-5 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">All Caught Up!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No pending study alerts or cognitive break reminders right now. Keep up the high-yield momentum!
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="pt-4 first:pt-0 space-y-3 group">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${n.iconColor}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDismiss(n.id, e)}
                            className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            title="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pl-12">
                    <button
                      type="button"
                      onClick={n.onAction}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                    >
                      <span>{n.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Adaptive FMGE clinical scheduler
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
