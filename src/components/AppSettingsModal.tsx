import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Palette,
  Settings2,
  Clock,
  Volume2,
  HardDrive,
  ShieldAlert,
  Save,
  CheckCircle2,
  Brain,
  Droplet,
  Sun,
  Sunset,
  Moon,
  Timer,
  Target,
  BookOpen,
  Activity,
  Check,
  Compass,
  Hourglass,
  Download,
  Smartphone,
  Share,
} from 'lucide-react';
import { AppSettings, AppState } from '../types';
import { getInitialAppState } from '../data/sampleData';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetState: (freshState: AppState) => void;
  onOpenOnboarding?: () => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateSettings,
  onResetState,
  onOpenOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'mcq' | 'wellness' | 'storage'>('theme');
  const [settings, setSettings] = useState<AppSettings>(state.settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState<'none' | 'progress' | 'full'>('none');
  const [typedConfirm, setTypedConfirm] = useState('');

  const { isInstalled, canInstall, isIos, promptInstall } = usePwaInstall();

  useEffect(() => {
    if (isOpen) {
      setSettings(state.settings);
      setSaveSuccess(false);
      setResetConfirmation('none');
      setTypedConfirm('');
    }
  }, [isOpen, state.settings]);

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

  if (!isOpen) return null;

  const updatePreference = (updated: AppSettings) => {
    setSettings(updated);
    onUpdateSettings(updated);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  const handleResetProgress = () => {
    const fresh = getInitialAppState();
    const cleanProgressState: AppState = {
      ...fresh,
      settings,
      bookmarkedPearlIds: state.bookmarkedPearlIds,
      customPearls: state.customPearls,
      telegramChannels: state.telegramChannels,
      telegramQuestions: state.telegramQuestions,
      telegramAnnouncements: state.telegramAnnouncements,
    };
    onResetState(cleanProgressState);
    setResetConfirmation('none');
    onClose();
  };

  const handleResetFullAccount = () => {
    if (typedConfirm.trim().toUpperCase() !== 'RESET') return;
    const blank = getInitialAppState();
    onResetState(blank);
    setResetConfirmation('none');
    setTypedConfirm('');
    onClose();
  };

  const currentHour = new Date().getHours();
  const previewTimePeriod =
    currentHour >= 5 && currentHour < 12
      ? 'Morning Dawn'
      : currentHour >= 12 && currentHour < 18
      ? 'Evening Dusk'
      : 'Night Moonlit';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans select-none animate-in fade-in duration-150"
      style={{
        paddingTop: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-top, 0px)))',
        paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom, 0px)))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-settings-title"
    >
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full shadow-[0_24px_64px_rgba(0,0,0,0.16)] border border-slate-200/80 overflow-hidden flex flex-col max-h-[calc(100dvh-max(2.5rem,calc(1.5rem+env(safe-area-inset-top,0px)+env(safe-area-inset-bottom,0px))))] sm:max-h-[88vh] animate-in zoom-in-95 duration-150">
        {/* ── Modal Header ── */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#006B63] to-[#004D47] text-white shadow-sm shadow-teal-950/15 shrink-0">
              <Settings2 className="h-5 w-5 text-emerald-50 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="app-settings-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-display"
                >
                  Preferences &amp; Settings
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-[#006B63] border border-teal-200/70">
                  FMGE 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Circadian atmosphere, examination pacing, cognitive breaks &amp; storage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Segmented Tab Switcher (Apple HIG Style) ── */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-slate-200/80 bg-slate-50/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'theme', label: 'Atmosphere & Themes', shortLabel: 'Atmosphere', icon: Palette },
            { id: 'mcq', label: 'Pacing & Goals', shortLabel: 'Pacing', icon: Clock },
            { id: 'wellness', label: 'Wellness & Audio', shortLabel: 'Wellness', icon: Droplet },
            { id: 'storage', label: 'Storage & PWA', shortLabel: 'Storage', icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#006B63] text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-teal-100' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Save confirmation toast */}
        {saveSuccess && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Preferences saved and applied successfully.</span>
          </div>
        )}

        {/* ── Tab Body ── */}
        <div className="p-4 sm:p-6 pb-6 overflow-y-auto flex-1 space-y-5 bg-white">
          {/* ═════════════ TAB 1: THEMES & ATMOSPHERE ═════════════ */}
          {activeTab === 'theme' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Circadian Atmosphere Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#006B63]">
                      Circadian Lighting &amp; Tone
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Harmonize your workspace accent lighting with daylight phases for eye comfort.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Live Reactive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'auto',
                      label: 'Automatic Circadian',
                      desc: `Syncs with solar cycle (${previewTimePeriod})`,
                      icon: Activity,
                      textColor: 'text-amber-500',
                      badge: 'Dynamic',
                    },
                    {
                      id: 'morning',
                      label: 'Morning Desk',
                      desc: '5 AM – 12 PM fresh morning clarity',
                      icon: Sun,
                      textColor: 'text-amber-500',
                      badge: 'Daylight',
                    },
                    {
                      id: 'sunset',
                      label: 'Sunset Horizon',
                      desc: '12 PM – 6 PM golden hour endurance',
                      icon: Sunset,
                      textColor: 'text-orange-500',
                      badge: 'Warm',
                    },
                    {
                      id: 'night',
                      label: 'Night Focus',
                      desc: '6 PM – 5 AM calm focus & memory lock',
                      icon: Moon,
                      textColor: 'text-sky-400',
                      badge: 'Nocturnal',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const selected = (settings.bgTheme || 'auto') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updatePreference({ ...settings, bgTheme: item.id as any })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          selected
                            ? 'border-[#006B63] bg-[#E8F5F3]/50 shadow-2xs ring-1 ring-[#006B63]/30'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${item.textColor}`} />
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          </div>
                          {selected ? (
                            <div className="h-4 w-4 rounded-full bg-[#006B63] text-white flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">{item.badge}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug">
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* High-Yield Auto-Archive Preference */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <BookOpen className="h-4 w-4 text-[#006B63]" />
                    <span>Auto-Save Mastered High-Yield Pearls</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Automatically bookmark discriminator clinical pearls to your Pearls Vault when answered correctly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreference({
                      ...settings,
                      autoSaveHighYield: !(settings.autoSaveHighYield ?? true),
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    (settings.autoSaveHighYield ?? true)
                      ? 'bg-[#006B63] text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {(settings.autoSaveHighYield ?? true) ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* FMGE Clinical Strategy Blueprint */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/70 flex items-center justify-between gap-3">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Compass className="h-4 w-4 text-[#006B63]" />
                    <span>FMGE Clinical Strategy Blueprint</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Recalibrate your exam countdown, target score safety margin, and daily study pacing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOnboarding?.();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#00544E] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  Recalibrate
                </button>
              </div>
            </div>
          )}

          {/* ═════════════ TAB 2: MCQ & STUDY PACING ═════════════ */}
          {activeTab === 'mcq' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Timer Pacing */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#006B63] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#006B63]" />
                    MCQ Practice Timer Pacing
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standardize question pacing to simulate NBE 1-minute exam pressure.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: '60s Real Exam', val: 60, desc: 'Real exam countdown drill', icon: Timer },
                    { label: '120s Deep Learning', val: 120, desc: 'Detailed case analysis', icon: Hourglass },
                    { label: 'Untimed Flow', val: 0, desc: 'Zero pressure study', icon: Compass },
                  ].map((preset) => {
                    const Icon = preset.icon;
                    const active = (settings.mcqTimerSeconds ?? 60) === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updatePreference({ ...settings, mcqTimerSeconds: preset.val })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#006B63] bg-[#006B63] text-white shadow-2xs'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`h-3.5 w-3.5 ${active ? 'text-teal-200' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">{preset.label}</span>
                        </div>
                        <div className={`text-[10px] ${active ? 'text-teal-100' : 'text-slate-400'}`}>
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Reveal Mode */}
              <div className="space-y-3 pt-3 border-t border-slate-200/80">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#006B63] flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-[#006B63]" />
                    Explanation Reveal Behavior
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When to reveal clinical discriminator rationale and pearl takeaways.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'instant', label: 'Instant Reveal on Click', desc: 'Immediate learning feedback after answering' },
                    { id: 'summary', label: 'Session End Summary', desc: 'Authentic exam simulation with end-of-test review' },
                  ].map((mode) => {
                    const active = (settings.explanationMode || 'instant') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updatePreference({ ...settings, explanationMode: mode.id as any })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#006B63] bg-[#E8F5F3]/50 text-slate-900 ring-1 ring-[#006B63]/30'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{mode.label}</span>
                          {active && <CheckCircle2 className="h-4 w-4 text-[#006B63]" />}
                        </div>
                        <div className="text-[11px] text-slate-500">{mode.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Goals Pacing */}
              <div className="space-y-3 pt-3 border-t border-slate-200/80">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#006B63] flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-[#006B63]" />
                    Daily Target Goals
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Benchmark quotas for mission control</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Daily MCQ Target */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block font-mono uppercase">
                      Daily Questions Target
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[25, 50, 75, 100].map((q) => {
                        const selected = (settings.dailyQuestionGoal ?? 50) === q;
                        return (
                          <button
                            key={q}
                            type="button"
                            onClick={() => updatePreference({ ...settings, dailyQuestionGoal: q })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#006B63] text-white shadow-2xs'
                                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {q}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Study Hours */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block font-mono uppercase">
                      Daily Study Hours
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[3, 5, 6, 8].map((h) => {
                        const selected = (settings.dailyStudyHourGoal ?? 6) === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => updatePreference({ ...settings, dailyStudyHourGoal: h })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#006B63] text-white shadow-2xs'
                                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {h}h
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════ TAB 3: WELLNESS & AUDIO ═════════════ */}
          {activeTab === 'wellness' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#006B63] flex items-center gap-1.5">
                    <Droplet className="h-3.5 w-3.5 text-[#006B63]" />
                    Hydration &amp; 20-20-20 Eye Rest Cadence
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ophthalmology protocol: Every 20 minutes, focus on an object 20 feet away for 20 seconds to prevent digital asthenopia.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Every 30m', val: 30 },
                    { label: 'Every 45m', val: 45 },
                    { label: 'Every 60m', val: 60 },
                    { label: 'Disabled', val: 0 },
                  ].map((preset) => {
                    const active = (settings.breakReminderInterval ?? 45) === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updatePreference({ ...settings, breakReminderInterval: preset.val })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-[#006B63] bg-[#006B63] text-white shadow-2xs font-bold'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound & Audio Feedback */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Volume2 className="h-4 w-4 text-[#006B63]" />
                    <span>Audio Feedback &amp; Timer Chimes</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Play subtle sound cues on correct MCQs, timer countdown warnings, and streak milestones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePreference({
                      ...settings,
                      hapticSoundEnabled: !(settings.hapticSoundEnabled ?? true),
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    (settings.hapticSoundEnabled ?? true)
                      ? 'bg-[#006B63] text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {(settings.hapticSoundEnabled ?? true) ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>
          )}

          {/* ═════════════ TAB 4: STORAGE & PWA APPLICATION ═════════════ */}
          {activeTab === 'storage' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* PWA Application Installation Status Card */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#006B63] text-white flex items-center justify-center shadow-2xs shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-display">
                        Progressive Web App (PWA)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Zero-lag offline access on iOS, Android &amp; macOS
                      </p>
                    </div>
                  </div>
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Installed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800">
                      Standalone Ready
                    </span>
                  )}
                </div>

                {!isInstalled && (
                  <div className="pt-1 text-xs text-slate-600 space-y-2">
                    {canInstall && (
                      <button
                        type="button"
                        onClick={promptInstall}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#00544E] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install ONE SHOT FMGE</span>
                      </button>
                    )}

                    {isIos && !canInstall && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 border border-teal-200/60 text-[11px] text-slate-600">
                        <Share className="w-4 h-4 text-[#006B63] shrink-0 mt-0.5" />
                        <span>
                          To install on iPhone/iPad: tap the Safari <strong>Share</strong> button in the toolbar, then scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Storage Telemetry */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                    CLIENT STORAGE INTEGRITY
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs">
                    <span className="text-slate-400 text-[10px] block">Progress Ledger</span>
                    <span className="font-mono font-bold text-slate-800">
                      ~{Math.round((JSON.stringify(state).length / 1024) * 10) / 10} KB Cached
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs">
                    <span className="text-slate-400 text-[10px] block">Medical Curriculum</span>
                    <span className="font-mono font-bold text-emerald-700">19 Subjects Ready</span>
                  </div>
                </div>
              </div>

              {/* Reset Operations */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>DATA OPERATIONS &amp; RESET</span>
                </div>

                <div className="space-y-2.5">
                  {/* Reset Study Progress */}
                  <div className="p-3 rounded-xl bg-white border border-rose-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Reset Study Progress (0% Mastery)</h4>
                      <p className="text-[11px] text-slate-500">
                        Clears notes, QBank records, and revision checkboxes across all 19 subjects while preserving custom pearls.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmation('progress')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                    >
                      Reset Progress
                    </button>
                  </div>

                  {resetConfirmation === 'progress' && (
                    <div className="p-3.5 bg-white rounded-xl border border-rose-300 space-y-2 animate-in fade-in">
                      <p className="text-xs text-rose-700 font-medium">
                        Are you sure you want to reset all 19 subject checkboxes to 0%? This action cannot be undone.
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setResetConfirmation('none')}
                          className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetProgress}
                          className="px-3 py-1 text-xs text-white bg-rose-600 rounded-lg font-bold cursor-pointer hover:bg-rose-700"
                        >
                          Yes, Reset to 0%
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full Wipe */}
                  <div className="p-3 rounded-xl bg-white border border-rose-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Full Factory Wipe</h4>
                      <p className="text-[11px] text-slate-500">
                        Permanently clears entire database including mistake notebooks and grand test results.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmation('full')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
                    >
                      Wipe Data
                    </button>
                  </div>

                  {resetConfirmation === 'full' && (
                    <div className="p-3.5 bg-white rounded-xl border border-rose-300 space-y-2 animate-in fade-in">
                      <p className="text-xs text-rose-700 font-medium">
                        Type <span className="font-bold">RESET</span> to confirm complete factory wipe:
                      </p>
                      <input
                        type="text"
                        value={typedConfirm}
                        onChange={(e) => setTypedConfirm(e.target.value)}
                        placeholder="RESET"
                        className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs font-mono focus:outline-rose-500"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setResetConfirmation('none')}
                          className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetFullAccount}
                          disabled={typedConfirm.trim().toUpperCase() !== 'RESET'}
                          className="px-3.5 py-1 text-xs text-white bg-rose-600 rounded-lg font-bold disabled:opacity-40 cursor-pointer hover:bg-rose-700"
                        >
                          Confirm Wipe
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="p-3.5 sm:p-4 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between"
          style={{ paddingBottom: 'max(0.875rem, calc(0.625rem + env(safe-area-inset-bottom, 0px)))' }}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Preferences sync live</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#006B63] hover:bg-[#00544E] text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
