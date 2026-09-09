import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Palette,
  Settings2,
  Clock,
  Volume2,
  VolumeX,
  HardDrive,
  ShieldAlert,
  Save,
  CheckCircle2,
  Eye,
  Brain,
  Droplet,
  Trash2,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Zap,
  Target,
  BookOpen,
  Activity,
  Check,
  Compass,
  Hourglass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, AppState } from '../types';
import { getInitialAppState } from '../data/sampleData';

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

  useEffect(() => {
    if (isOpen) {
      setSettings(state.settings);
      setSaveSuccess(false);
      setResetConfirmation('none');
      setTypedConfirm('');
    }
  }, [isOpen, state.settings]);

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
    }, 550);
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
  const previewBgUrl =
    settings.bgTheme === 'morning'
      ? '/images/study-bg/study-art-morning.jpg'
      : settings.bgTheme === 'sunset'
      ? '/images/study-bg/study-art-sunset.jpg'
      : settings.bgTheme === 'night'
      ? '/images/study-bg/study-art-night.jpg'
      : currentHour >= 5 && currentHour < 12
      ? '/images/study-bg/study-art-morning.jpg'
      : currentHour >= 12 && currentHour < 18
      ? '/images/study-bg/study-art-sunset.jpg'
      : '/images/study-bg/study-art-night.jpg';

  const previewTimePeriod =
    currentHour >= 5 && currentHour < 12
      ? 'Morning Dawn'
      : currentHour >= 12 && currentHour < 18
      ? 'Evening Dusk'
      : 'Night Moonlit';

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans'] animate-in fade-in duration-150">
      <div className="relative bg-[#FAF9F6] rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200/80 bg-gradient-to-b from-[#FAF9F5] via-white to-white flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#00685F] to-[#044E48] text-white shadow-md shadow-teal-950/15 shrink-0">
              <Settings2 className="h-5 w-5 text-emerald-50 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Newsreader',_serif] text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                  System Settings
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/10 text-[#00685F] border border-teal-500/20">
                  FMGE 2026
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Artwork atmospheres, exam pacing timers, cognitive breaks &amp; storage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection Dock */}
        <div className="px-4 sm:px-6 pt-3 pb-3 border-b border-stone-200/80 bg-[#FAF9F5] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'theme', label: 'Themes & Visuals', icon: Palette },
            { id: 'mcq', label: 'Pacing & Goals', icon: Clock },
            { id: 'wellness', label: 'Cognitive Breaks', icon: Droplet },
            { id: 'storage', label: 'Storage & Reset', icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#00685F] text-white shadow-xs font-bold'
                    : 'bg-white/80 text-stone-600 border border-stone-200/80 hover:bg-white hover:text-stone-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-teal-200' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Save feedback banner */}
        {saveSuccess && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Preferences saved and applied successfully!</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {/* ================= TAB 1: THEMES & VISUALS ================= */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Study Atmosphere Wallpaper Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685F]">
                      Study Artwork Atmosphere
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Select your ambient study scenery or sync automatically with the celestial solar arc.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                    Live Reactive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'auto',
                      label: 'Automatic Circadian',
                      desc: `Syncs with solar cycle (${previewTimePeriod})`,
                      icon: Zap,
                      gradient: 'from-amber-400 via-teal-500 to-indigo-950',
                      textColor: 'text-amber-500',
                    },
                    {
                      id: 'morning',
                      label: 'Morning Desk',
                      desc: '5 AM – 12 PM fresh morning clarity',
                      icon: Sun,
                      gradient: 'from-amber-400 to-teal-400',
                      textColor: 'text-amber-500',
                    },
                    {
                      id: 'sunset',
                      label: 'Sunset Horizon',
                      desc: '12 PM – 6 PM golden hour endurance',
                      icon: Sunset,
                      gradient: 'from-orange-500 to-rose-400',
                      textColor: 'text-orange-500',
                    },
                    {
                      id: 'night',
                      label: 'Rainy Night Lamp',
                      desc: '6 PM – 5 AM calm focus & memory lock',
                      icon: Moon,
                      gradient: 'from-slate-900 via-indigo-950 to-teal-900',
                      textColor: 'text-sky-400',
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
                            ? 'border-[#00685F] bg-[#F2F8F6] shadow-xs ring-1.5 ring-[#00685F]/25'
                            : 'border-stone-200/80 bg-white hover:bg-stone-50/80 hover:border-stone-300 text-stone-800'
                        }`}
                      >
                        {/* Mini Gradient Luster Strip */}
                        <div
                          className={`h-1 w-full rounded-full bg-gradient-to-r ${item.gradient} mb-2.5 opacity-60`}
                        />

                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-4 w-4 ${item.textColor}`} />
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          </div>
                          {selected ? (
                            <div className="h-4 w-4 rounded-full bg-[#00685F] text-white flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-stone-300 group-hover:border-stone-400" />
                          )}
                        </div>

                        <div className="text-[11px] text-stone-500 leading-snug">
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Atmosphere Preview & Visibility Opacity */}
              <div className="space-y-3 pt-4 border-t border-stone-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685F] flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-[#00685F]" />
                      Artwork Visibility &amp; Backdrop Intensity
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">Controls contrast and ambient opacity in header</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/80">
                    {Math.round((settings.bgOpacity ?? 0.8) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Subtle (40%)', val: 0.4, desc: 'Gentle ambient tint' },
                    { label: 'Vibrant (80%)', val: 0.8, desc: 'Standard vibrant artwork' },
                    { label: 'Minimal (Off)', val: 0.0, desc: 'Pure clean white surface' },
                  ].map((preset) => {
                    const active = (settings.bgOpacity ?? 0.8) === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updatePreference({ ...settings, bgOpacity: preset.val })}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          active
                            ? 'border-[#00685F] bg-[#00685F] text-white shadow-xs'
                            : 'border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-teal-100' : 'text-stone-400'}`}>
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Workspace Preview Card */}
                <div className="p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/80 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
                    <span className="font-mono uppercase tracking-wider">Live Workspace Header Preview</span>
                    <span className="text-[#00685F] font-mono font-bold">
                      {settings.bgTheme === 'morning'
                        ? 'Morning Desk'
                        : settings.bgTheme === 'sunset'
                        ? 'Sunset Horizon'
                        : settings.bgTheme === 'night'
                        ? 'Rainy Night'
                        : 'Circadian Auto'}
                    </span>
                  </div>

                  <div className="relative h-20 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-[#F0FDF9] via-[#F8FCFA] to-[#E6F4F1] flex items-center px-4 justify-between">
                    {/* Simulated Background Art */}
                    {(settings.bgOpacity ?? 0.8) > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-all duration-500"
                        style={{
                          opacity: (settings.bgOpacity ?? 0.8) * 0.45,
                          backgroundImage: `url(${previewBgUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center top',
                          filter: 'blur(1px)',
                        }}
                      />
                    )}

                    <div className="relative z-10 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#006B63]" />
                        <span className="text-[11px] font-bold text-slate-900">Dr. Aspirant • Focus Session</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium">
                        Consistency today builds the doctor you will be tomorrow.
                      </p>
                    </div>

                    <span className="relative z-10 text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white/85 text-slate-700 border border-slate-200/80 shadow-2xs">
                      {Math.round((settings.bgOpacity ?? 0.8) * 100)}% Opacity
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Yield Auto-Archive Preference */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/80 flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <BookOpen className="h-4 w-4 text-[#00685F]" />
                    <span>Auto-Save Mastered High-Yield Pearls</span>
                  </div>
                  <p className="text-xs text-stone-500">
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
                      ? 'bg-[#00685F] text-white shadow-xs'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {(settings.autoSaveHighYield ?? true) ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* FMGE Clinical Strategy Blueprint */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/70 flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Compass className="h-4 w-4 text-[#006B63]" />
                    <span>FMGE Clinical Strategy Blueprint</span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Recalibrate your exam countdown, target score safety margin, and daily study pacing with the animated onboarding blueprint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOnboarding?.();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#006B63] hover:bg-[#00544E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Recalibrate
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: MCQ & STUDY PACING ================= */}
          {activeTab === 'mcq' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Timer Pacing */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685F] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#00685F]" />
                    MCQ Practice Timer Pacing
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Standardizes question pacing to simulate NBE 1-minute exam pressure.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: '60s NBE Real Exam', val: 60, desc: 'Real exam countdown drill', icon: Zap },
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
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#00685F] bg-[#00685F] text-white shadow-xs'
                            : 'border-stone-200/80 bg-white hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`h-3.5 w-3.5 ${active ? 'text-teal-200' : 'text-stone-400'}`} />
                          <span className="text-xs font-bold">{preset.label}</span>
                        </div>
                        <div className={`text-[10px] ${active ? 'text-teal-100' : 'text-stone-400'}`}>
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Reveal Mode */}
              <div className="space-y-3 pt-4 border-t border-stone-200/80">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685F] flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-[#00685F]" />
                    Explanation Reveal Behavior
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    When to reveal clinical discriminator rationale and pearl takeaways.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            ? 'border-[#00685F] bg-[#F2F8F6] text-slate-900 ring-1.5 ring-[#00685F]/25'
                            : 'border-stone-200/80 bg-white hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{mode.label}</span>
                          {active && <CheckCircle2 className="h-4 w-4 text-[#00685F]" />}
                        </div>
                        <div className="text-[11px] text-stone-500">{mode.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Goals Pacing */}
              <div className="space-y-3 pt-4 border-t border-stone-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685F] flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-[#00685F]" />
                      Daily Target Goals
                    </h4>
                    <p className="text-xs text-stone-500">Benchmark quotas for mission control</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Daily MCQ Target */}
                  <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 block font-mono uppercase">
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
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#00685F] text-white shadow-2xs'
                                : 'bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            {q}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Study Hours */}
                  <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 block font-mono uppercase">
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
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#00685F] text-white shadow-2xs'
                                : 'bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-100'
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

          {/* ================= TAB 3: COGNITIVE BREAKS & WELLNESS ================= */}
          {activeTab === 'wellness' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00685F] flex items-center gap-1.5">
                    <Droplet className="h-3.5 w-3.5 text-[#00685F]" />
                    Hydration &amp; 20-20-20 Eye Rest Cadence
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ophthalmology rule: Every 20 minutes, look at an object 20 feet away for 20 seconds to prevent asthenopia and fatigue.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-[#00685F] bg-[#00685F] text-white shadow-xs font-bold'
                            : 'border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound & Audio Feedback */}
              <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Volume2 className="h-4 w-4 text-[#00685F]" />
                    <span>Audio Feedback &amp; Timer Chimes</span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Play subtle cue sounds on correct MCQs, timer warnings, and milestone streaks.
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
                      ? 'bg-[#00685F] text-white shadow-xs'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {(settings.hapticSoundEnabled ?? true) ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 4: STORAGE & DATA OPERATIONS ================= */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Storage Telemetry */}
              <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-mono block">
                    LOCAL ENGINE STORAGE
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Local Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 text-xs">
                    <span className="text-stone-400 text-[10px] block">Progress Ledger</span>
                    <span className="font-mono font-bold text-stone-800">~148 KB Cached</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 text-xs">
                    <span className="text-stone-400 text-[10px] block">Medical Syllabus</span>
                    <span className="font-mono font-bold text-emerald-700">19 Subjects Ready</span>
                  </div>
                </div>
              </div>

              {/* Reset Operations */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>DANGER ZONE — DATA OPERATIONS</span>
                </div>

                <div className="space-y-3">
                  {/* Reset Study Progress */}
                  <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Reset Study Progress (0% Mastery)</h4>
                      <p className="text-[11px] text-stone-500">
                        Clears notes, QBank records, and revision checkboxes across all 19 subjects while preserving custom pearls.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmation('progress')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
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
                          className="px-3 py-1 text-xs text-stone-600 bg-stone-100 rounded-lg cursor-pointer hover:bg-stone-200"
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
                  <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Full Factory Wipe</h4>
                      <p className="text-[11px] text-stone-500">
                        Permanently clears entire database including mistake notebooks and grand test results.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmation('full')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
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
                          className="px-3 py-1 text-xs text-stone-600 bg-stone-100 rounded-lg cursor-pointer hover:bg-stone-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetFullAccount}
                          disabled={typedConfirm.trim().toUpperCase() !== 'RESET'}
                          className="px-3.5 py-1 text-xs text-white bg-rose-600 rounded-lg font-bold disabled:opacity-40 cursor-pointer hover:bg-rose-700"
                        >
                          Confirm Factory Wipe
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F5] border-t border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Preferences apply live</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#00685F] hover:bg-[#00524C] text-white transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
