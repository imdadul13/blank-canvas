import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Award,
  CheckCircle2,
  Clock,
  Flame,
  ChevronRight,
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
  // Timer State
  const [selectedDuration, setSelectedDuration] = useState<number>(25); // minutes
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  // Ambient Audio State
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [ambientMode, setAmbientMode] = useState<AmbientSoundMode>('rain');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);

  // Rotating Recall Pearl State
  const [pearlIndex, setPearlIndex] = useState<number>(0);
  const [isPearlRevealed, setIsPearlRevealed] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Subscribe to Ambient Engine
  useEffect(() => {
    const unsubscribe = ambientAudioEngine.subscribe((active, mode, vol) => {
      setIsAudioActive(active);
      setAmbientMode(mode);
      setAmbientVolume(vol);
    });
    return () => unsubscribe();
  }, []);

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
  }, [isRunning]);

  // Session Completion Handler
  const handleSessionComplete = () => {
    setIsRunning(false);
    setCompletedSessions((c) => c + 1);
    playGentleChime();

    // Log study time
    if (onUpdateDailyLog && state) {
      const todayStr = getLocalDateKey();
      const existingMinutes = state.studyLogs?.[todayStr]?.studyMinutes || 0;
      onUpdateDailyLog(todayStr, {
        studyMinutes: existingMinutes + selectedDuration,
      });
    }

    // Reset to duration
    setSecondsLeft(selectedDuration * 60);
  };

  // Play gentle completion sound via Web Audio API
  const playGentleChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = selectedDuration * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentPearl = INITIAL_PEARLS[pearlIndex % INITIAL_PEARLS.length];

  const handleSelectDuration = (mins: number) => {
    setSelectedDuration(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
  };

  const handleToggleAmbientMode = (mode: AmbientSoundMode) => {
    ambientAudioEngine.start(mode);
  };

  const handleNextPearl = () => {
    setIsPearlRevealed(false);
    setPearlIndex((prev) => (prev + 1) % INITIAL_PEARLS.length);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl text-slate-100 font-['Plus_Jakarta_Sans'] select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col items-center"
      >
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Exit Zen Room (Esc)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-6">
          <div className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wider uppercase font-mono flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Zen Clinical Study Sanctuary</span>
          </div>
          {completedSessions > 0 && (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1 font-mono">
              <Flame className="h-3.5 w-3.5" />
              <span>{completedSessions} Block{completedSessions > 1 ? 's' : ''} Mastered</span>
            </div>
          )}
        </div>

        {/* Duration Selectors */}
        <div className="flex items-center gap-2 mb-6">
          {[15, 25, 50].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleSelectDuration(mins)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedDuration === mins
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {mins}m Focus
            </button>
          ))}
        </div>

        {/* Circular Countdown Display */}
        <div className="relative flex items-center justify-center my-2">
          <svg width="260" height="260" className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              stroke="#14B8A6"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-mono text-5xl font-black tracking-tight text-white tabular-nums drop-shadow-sm">
              {formattedTime}
            </span>
            <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-widest mt-1">
              {isRunning ? 'Deep Immersion' : 'Ready to Begin'}
            </span>
          </div>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex items-center gap-3 mt-4 mb-6">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>Start Session</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(selectedDuration * 60);
            }}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Procedural Ambient Sound Controls */}
        <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-800/60 border border-white/10 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <Volume2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Acoustic Atmosphere</span>
            </div>
            <button
              type="button"
              onClick={() => ambientAudioEngine.toggle()}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
            >
              {isAudioActive ? 'Mute' : 'Turn On'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {AMBIENT_MODES.map((m) => {
              const active = isAudioActive && ambientMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleToggleAmbientMode(m.id)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold text-center truncate transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-500/30 text-teal-200 border border-teal-400/40'
                      : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {m.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rotating Active Recall Prompt Card */}
        {currentPearl && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 to-slate-900/80 border border-teal-500/30 text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                Active Recall Reflection • {currentPearl.subjectId}
              </span>
              <button
                type="button"
                onClick={handleNextPearl}
                className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-slate-100 mb-2">
              {currentPearl.title}
            </h4>

            {isPearlRevealed ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-400/20 text-xs text-teal-100 space-y-1"
              >
                <div className="font-bold text-teal-300">★ Key Takeaway:</div>
                <div className="leading-relaxed">{currentPearl.highYieldKey}</div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPearlRevealed(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-xs font-semibold text-center cursor-pointer transition-colors"
              >
                Tap to Reveal Clinical Takeaway
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};
