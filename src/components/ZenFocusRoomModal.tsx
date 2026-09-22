import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Zap,
  BookOpen,
  Sparkles,
  Flame,
  ChevronRight,
  Headphones,
  CheckCircle2,
  Sliders,
  HeartPulse,
} from 'lucide-react';
import { AppState, DailyStudyLog } from '../types';
import { ambientAudioEngine, AMBIENT_MODES, AmbientSoundMode } from '../utils/ambientAudioEngine';
import { INITIAL_PEARLS } from '../data/initialPearls';
import { getLocalDateKey } from '../utils/date';

interface ZenFocusRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  state?: AppState;
  onUpdateDailyLog?: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
}

export const ZenFocusRoomModal: React.FC<ZenFocusRoomModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateDailyLog,
}) => {
  const reducedMotion = useReducedMotion();

  // Timer State
  const [selectedDuration, setSelectedDuration] = useState<number>(25); // minutes
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Ambient Audio State
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [ambientMode, setAmbientMode] = useState<AmbientSoundMode>('rain');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);

  // Rotating Recall Pearl State
  const [pearlIndex, setPearlIndex] = useState<number>(0);
  const [isPearlRevealed, setIsPearlRevealed] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to Ambient Engine
  useEffect(() => {
    const unsubscribe = ambientAudioEngine.subscribe((active, mode, vol) => {
      setIsAudioActive(active);
      setAmbientMode(mode);
      setAmbientVolume(vol);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard Shortcuts (Esc to close, Space to toggle, R to reset)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsRunning(false);
        setSecondsLeft(selectedDuration * 60);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, selectedDuration]);

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedDuration]);

  // Session Completion Handler
  const handleSessionComplete = () => {
    setIsRunning(false);
    setCompletedSessions((c) => c + 1);
    setShowCelebration(true);
    playGentleChime();

    // Automatically hide celebration after 4 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 4000);

    // Log study time into today's ledger
    if (onUpdateDailyLog && state) {
      const todayStr = getLocalDateKey();
      const existingMinutes = state.studyLogs?.[todayStr]?.studyMinutes || 0;
      onUpdateDailyLog(todayStr, {
        studyMinutes: existingMinutes + selectedDuration,
      });
    }

    // Reset timer
    setSecondsLeft(selectedDuration * 60);
  };

  // Harmonious Web Audio chime upon session completion
  const playGentleChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    } catch (_) {}
  };

  if (!isOpen) return null;

  // Geometry calculations
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = selectedDuration * 60;
  const progressRatio = (totalSeconds - secondsLeft) / totalSeconds;
  const progressPercent = Math.min(100, Math.max(0, progressRatio * 100));

  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Orbital bead coordinates (angle in radians; start from top = -PI/2)
  const angle = (progressRatio * 2 * Math.PI) - (Math.PI / 2);
  const beadX = 130 + radius * Math.cos(angle);
  const beadY = 130 + radius * Math.sin(angle);

  const currentPearl = INITIAL_PEARLS[pearlIndex % INITIAL_PEARLS.length];

  const handleSelectDuration = (mins: number) => {
    setSelectedDuration(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const handleToggleAmbientMode = (mode: AmbientSoundMode) => {
    if (isAudioActive && ambientMode === mode) {
      ambientAudioEngine.toggle();
    } else {
      ambientAudioEngine.start(mode);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    ambientAudioEngine.setVolume(newVol);
  };

  const handleNextPearl = () => {
    setIsPearlRevealed(false);
    setPearlIndex((prev) => (prev + 1) % INITIAL_PEARLS.length);
  };

  const getAmbientModeIcon = (mode: AmbientSoundMode) => {
    switch (mode) {
      case 'rain':
        return <CloudRain className="w-4 h-4" />;
      case 'brown':
        return <Wind className="w-4 h-4" />;
      case 'gamma40':
        return <Zap className="w-4 h-4" />;
      case 'library':
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#04080B]/85 backdrop-blur-3xl select-none overflow-y-auto">
      {/* Background Animated Aurora Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={
            reducedMotion
              ? undefined
              : {
                  scale: isRunning ? [1, 1.25, 1] : [1, 1.08, 1],
                  opacity: isRunning ? [0.25, 0.45, 0.25] : [0.15, 0.22, 0.15],
                }
          }
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-600/10 blur-[100px]"
        />
        <motion.div
          animate={
            reducedMotion
              ? undefined
              : {
                  scale: isRunning ? [1.1, 0.95, 1.1] : [1, 0.92, 1],
                  opacity: isRunning ? [0.22, 0.38, 0.22] : [0.12, 0.2, 0.12],
                }
          }
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-amber-500/20 to-teal-500/15 blur-[100px]"
        />
      </div>

      {/* Main Glass Sanctuary Card Container */}
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="relative w-full max-w-xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#060D12] border border-white/[0.14] rounded-[2.25rem] p-6 sm:p-8 shadow-[0_32px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col items-center"
      >
        {/* Specular Top Shimmer Edge */}
        <div
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Header Bar */}
        <div className="w-full flex items-center justify-between mb-5 relative z-10">
          {/* Clinical Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 backdrop-blur-md shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isRunning ? 'bg-emerald-400 opacity-75' : 'bg-teal-400 opacity-40'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isRunning ? 'bg-emerald-400' : 'bg-teal-500'
                }`}
              />
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-200 font-['Outfit'] tracking-wide">
              <Headphones className="w-3.5 h-3.5 text-teal-300" />
              <span>Zen Clinical Sanctuary</span>
            </div>
          </div>

          {/* Right Header Controls: Sessions Count + Close */}
          <div className="flex items-center gap-2">
            {completedSessions > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono shadow-2xs"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>
                  {completedSessions} Block{completedSessions > 1 ? 's' : ''}
                </span>
              </motion.div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-slate-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer shadow-2xs"
              title="Close Sanctuary (Esc)"
              aria-label="Close Sanctuary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SwiftUI-Style Duration Segmented Pill */}
        <div className="relative p-1 rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl flex items-center gap-1 mb-6">
          {[15, 25, 50].map((mins) => {
            const isSelected = selectedDuration === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectDuration(mins)}
                className={`relative z-10 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold font-['Outfit'] transition-colors duration-200 cursor-pointer ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="zenDurationPill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#006B63] to-[#0D9488] shadow-md shadow-teal-900/40 border border-teal-300/30 -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span>{mins}m Focus</span>
              </button>
            );
          })}
        </div>

        {/* Apple-Grade Circular Countdown Dial with Glowing Pulse Bead */}
        <div className="relative flex items-center justify-center my-3">
          <svg width="260" height="260" className="transform -rotate-90 drop-shadow-2xl">
            <defs>
              {/* Radial gradient for glowing arc */}
              <linearGradient id="zenTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#006B63" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>

              {/* Glowing shadow filter for orbital bead */}
              <filter id="zenGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Inactive Background Track */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="9"
              fill="transparent"
            />

            {/* Glowing Active Progress Arc */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke="url(#zenTimerGradient)"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />

            {/* Orbital Tip Bead */}
            {progressPercent > 0 && progressPercent < 100 && (
              <circle
                cx={beadX}
                cy={beadY}
                r="7"
                fill="#5EEAD4"
                filter="url(#zenGlow)"
                className="transition-all duration-1000 ease-linear"
              />
            )}
          </svg>

          {/* Time & State Display in Dial Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <motion.div
              animate={isRunning ? { scale: [1, 1.015, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="font-['Outfit'] text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums drop-shadow-[0_4px_16px_rgba(20,184,166,0.3)]"
            >
              {formattedTime}
            </motion.div>

            <div className="flex items-center gap-1.5 mt-2">
              {isRunning && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                </span>
              )}
              <span className="text-[11px] font-bold tracking-widest uppercase font-['Outfit'] text-teal-300/90">
                {isRunning ? 'Deep Immersion' : 'Ready to Immerse'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Tactile Controls */}
        <div className="flex items-center gap-3.5 mt-3 mb-6">
          <motion.button
            type="button"
            whileHover={reducedMotion ? undefined : { scale: 1.03 }}
            whileTap={reducedMotion ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2.5 px-8 py-3 rounded-2xl text-sm font-extrabold font-['Outfit'] shadow-xl transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/25'
                : 'bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 hover:brightness-110 text-slate-950 shadow-teal-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current stroke-[2.5]" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current stroke-[2.5] ml-0.5" />
                <span>Start Session</span>
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            whileHover={reducedMotion ? undefined : { scale: 1.08 }}
            whileTap={reducedMotion ? undefined : { scale: 0.92, rotate: -45 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(selectedDuration * 60);
            }}
            className="p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer shadow-md"
            title="Reset Timer (R)"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Acoustic Atmosphere Studio Card */}
        <div className="w-full max-w-lg p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/20">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200 font-['Outfit'] uppercase tracking-wider">
                Acoustic Atmosphere
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAudioSettings(!showAudioSettings)}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs transition-colors cursor-pointer"
                title="Adjust Volume"
              >
                <Sliders className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => ambientAudioEngine.toggle()}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
                  isAudioActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30'
                }`}
              >
                {isAudioActive ? 'Mute' : 'Play Sound'}
              </button>
            </div>
          </div>

          {/* Volume Slider Drawer */}
          {showAudioSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]"
            >
              <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambientVolume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <Volume2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            </motion.div>
          )}

          {/* 4 Mode Pills with Animated Live Equalizer Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AMBIENT_MODES.map((m) => {
              const active = isAudioActive && ambientMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleToggleAmbientMode(m.id)}
                  className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer overflow-hidden ${
                    active
                      ? 'bg-gradient-to-b from-teal-500/25 to-teal-900/30 border-teal-400/50 shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={active ? 'text-teal-300' : 'text-slate-400'}>
                      {getAmbientModeIcon(m.id)}
                    </span>

                    {/* Animated Equalizer Waveform Bars */}
                    {active && !reducedMotion && (
                      <div className="flex items-end gap-0.5 h-3">
                        <motion.span
                          animate={{ height: ['30%', '100%', '40%'] }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-0.5 rounded-full bg-teal-400"
                        />
                        <motion.span
                          animate={{ height: ['70%', '30%', '90%'] }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                          className="w-0.5 rounded-full bg-teal-300"
                        />
                        <motion.span
                          animate={{ height: ['40%', '85%', '25%'] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                          className="w-0.5 rounded-full bg-teal-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-slate-200 font-['Outfit'] truncate">
                    {m.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Active Recall Reflection Card */}
        {currentPearl && (
          <div className="w-full max-w-lg p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-slate-950/80 border border-teal-500/25 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-teal-400/20">
                  {currentPearl.subjectId}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 font-['Outfit']">
                  Active Recall Check
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextPearl}
                className="text-[11px] font-bold text-teal-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next Pearl</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-['Outfit'] leading-relaxed mb-2.5">
              {currentPearl.title}
            </h4>

            {isPearlRevealed ? (
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-teal-500/15 border border-teal-400/30 text-xs text-teal-100 space-y-1.5"
              >
                <div className="flex items-center gap-1 font-bold text-teal-300 font-['Outfit']">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Clinical High-Yield Takeaway:</span>
                </div>
                <p className="leading-relaxed font-sans text-slate-200">{currentPearl.highYieldKey}</p>
              </motion.div>
            ) : (
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => setIsPearlRevealed(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-teal-300 text-xs font-bold font-['Outfit'] text-center cursor-pointer transition-all"
              >
                Tap to Reveal Clinical Takeaway
              </motion.button>
            )}
          </div>
        )}

        {/* Hotkey Reminder Footer */}
        <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 border border-white/[0.08]">
              Space
            </kbd>{' '}
            Toggle
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 border border-white/[0.08]">
              R
            </kbd>{' '}
            Reset
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 border border-white/[0.08]">
              Esc
            </kbd>{' '}
            Exit
          </span>
        </div>

        {/* Success Celebration Toast */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -20 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="absolute inset-x-8 top-16 z-30 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl border border-white/25 flex items-center justify-between backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-bold text-sm font-['Outfit']">Focus Block Completed!</h5>
                  <p className="text-xs text-emerald-100">
                    +{selectedDuration} minutes automatically recorded to your study log.
                  </p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-amber-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
};
