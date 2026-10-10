import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Settings2,
  Clock,
  Volume2,
  HardDrive,
  ShieldAlert,
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
import { Modal, ModalBody, ModalFooter } from './ui/Modal';

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
  const [resetConfirmation, setResetConfirmation] = useState<'none' | 'progress' | 'full'>('none');
  const [typedConfirm, setTypedConfirm] = useState('');

  const { isInstalled, canInstall, isIos, promptInstall } = usePwaInstall();

  useEffect(() => {
    if (isOpen) {
      setSettings(state.settings);
      setResetConfirmation('none');
      setTypedConfirm('');
    }
  }, [isOpen, state.settings]);

  const updatePreference = (updated: AppSettings) => {
    setSettings(updated);
    onUpdateSettings(updated);
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

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Preferences & Settings"
      description="Circadian atmosphere, examination pacing, cognitive breaks & storage"
      accent="#007AFF"
      size="xl"
      header={
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#007AFF] to-teal-500 text-white ring-2 ring-white">
            <Settings2 className="h-5 w-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="t-title-sm truncate text-slate-900">Preferences &amp; Settings</h2>
              <span className="hidden shrink-0 rounded-full border border-teal-200/70 bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#007AFF] sm:inline-flex">
                FMGE STUDY
              </span>
            </div>
            <p className="t-label mt-0.5 truncate text-slate-500">
              Circadian atmosphere, examination pacing, cognitive breaks &amp; storage
            </p>
          </div>
        </div>
      }
    >
      <div className="hairline-b flex shrink-0 items-center justify-between gap-1.5 overflow-x-auto bg-slate-50/70 px-4 py-2.5 scrollbar-none">
        <div className="flex w-full items-center gap-0.5 rounded-2xl bg-slate-200/60 p-1 sm:w-auto sm:gap-1">
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
                aria-pressed={active}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`hit-expand flex-1 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-xl px-1.5 py-1.5 text-[10px] font-semibold transition-all sm:flex-initial sm:gap-1.5 sm:inline-flex sm:px-3.5 sm:text-xs ${
                  active ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-[#007AFF]' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ModalBody className="space-y-5 bg-white p-4 sm:p-6">
        {/* ═════════════ TAB 1: THEMES & ATMOSPHERE ═════════════ */}
          {activeTab === 'theme' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Circadian Atmosphere Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#007AFF]">
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
                        aria-pressed={selected}
                        onClick={() => updatePreference({ ...settings, bgTheme: item.id as any })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          selected
                            ? 'border-[#007AFF] bg-[#E8F5F3]/50 shadow-2xs ring-1 ring-[#007AFF]/30'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${item.textColor}`} />
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          </div>
                          {selected ? (
                            <div className="h-4 w-4 rounded-full bg-[#007AFF] text-white flex items-center justify-center">
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
                    <BookOpen className="h-4 w-4 text-[#007AFF]" />
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
                  className={`hit-expand px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    (settings.autoSaveHighYield ?? true)
                      ? 'bg-[#007AFF] text-white shadow-2xs'
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
                    <Compass className="h-4 w-4 text-[#007AFF]" />
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
                  className="hit-expand px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
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
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#007AFF]" />
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
                        aria-pressed={active}
                        onClick={() => updatePreference({ ...settings, mcqTimerSeconds: preset.val })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-2xs'
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
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-[#007AFF]" />
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
                        aria-pressed={active}
                        onClick={() => updatePreference({ ...settings, explanationMode: mode.id as any })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#007AFF] bg-[#E8F5F3]/50 text-slate-900 ring-1 ring-[#007AFF]/30'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{mode.label}</span>
                          {active && <CheckCircle2 className="h-4 w-4 text-[#007AFF]" />}
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
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-[#007AFF]" />
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
                            aria-pressed={selected}
                            onClick={() => updatePreference({ ...settings, dailyQuestionGoal: q })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#007AFF] text-white shadow-2xs'
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
                            aria-pressed={selected}
                            onClick={() => updatePreference({ ...settings, dailyStudyHourGoal: h })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#007AFF] text-white shadow-2xs'
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
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                    <Droplet className="h-3.5 w-3.5 text-[#007AFF]" />
                    Study Break &amp; Eye Rest Reminders
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose when to receive break reminders. For screen comfort, the 20-20-20 rule means looking 20 feet away for 20 seconds every 20 minutes.
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
                        aria-pressed={active}
                        onClick={() => updatePreference({ ...settings, breakReminderInterval: preset.val })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-2xs font-bold'
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
                    <Volume2 className="h-4 w-4 text-[#007AFF]" />
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
                      ? 'bg-[#007AFF] text-white shadow-2xs'
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
                    <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shadow-2xs shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-display">
                        Progressive Web App (PWA)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        The app shell and visited assets can be available offline
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
                      Not installed
                    </span>
                  )}
                </div>

                {!isInstalled && (
                  <div className="pt-1 text-xs text-slate-600 space-y-2">
                    {canInstall && (
                      <button
                        type="button"
                        onClick={promptInstall}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#00544E] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install ONE SHOT FMGE</span>
                      </button>
                    )}

                    {isIos && !canInstall && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 border border-teal-200/60 text-[11px] text-slate-600">
                        <Share className="w-4 h-4 text-[#007AFF] shrink-0 mt-0.5" />
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
                    CURRENT STUDY DATA
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Loaded
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs">
                    <span className="text-slate-400 text-[10px] block">App data size (estimate)</span>
                    <span className="font-mono font-bold text-slate-800">
                      ~{Math.round((JSON.stringify(state).length / 1024) * 10) / 10} KB
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
                      <h4 className="text-xs font-bold text-slate-900">Reset Study Progress</h4>
                      <p className="text-[11px] text-slate-500">
                        Clears study progress, notes, QBank records, and revision checkboxes while preserving custom pearls.
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
                        This clears your study progress, notes, QBank records, and revision checkboxes. Custom pearls and saved Telegram content will remain. This cannot be undone.
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
                          Yes, Reset Progress
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full Wipe */}
                  <div className="p-3 rounded-xl bg-white border border-rose-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Full App Reset</h4>
                      <p className="text-[11px] text-slate-500">
                        Resets this app&apos;s study data and preferences, including mistake notebooks and grand test results.
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
                        Type <span className="font-bold">RESET</span> to confirm resetting this app&apos;s study data and preferences:
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
                          Confirm Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </ModalBody>

      <ModalFooter className="bg-slate-50/80">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Changes apply as you make them</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="hit-expand cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hit-expand inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#007AFF] px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#0071E3] active:scale-[0.98]"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Done</span>
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
