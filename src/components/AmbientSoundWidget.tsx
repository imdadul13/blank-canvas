import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Activity,
  BookOpen,
  X,
  Play,
  Pause,
  Headphones,
} from 'lucide-react';
import {
  ambientAudioEngine,
  AMBIENT_MODES,
  AmbientSoundMode,
} from '../utils/ambientAudioEngine';

interface AmbientSoundWidgetProps {
  className?: string;
  onOpenZenFocus?: () => void;
}

export const AmbientSoundWidget: React.FC<AmbientSoundWidgetProps> = ({
  className = '',
  onOpenZenFocus,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<AmbientSoundMode>('rain');
  const [volume, setVolume] = useState<number>(0.35);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = ambientAudioEngine.subscribe((active, mode, vol) => {
      setIsPlaying(active);
      setCurrentMode(mode);
      setVolume(vol);
    });
    return () => unsubscribe();
  }, []);

  // Handle outside click & Escape key to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    ambientAudioEngine.toggle();
  };

  const handleSelectMode = (mode: AmbientSoundMode) => {
    if (currentMode === mode && isPlaying) {
      ambientAudioEngine.toggle();
    } else {
      ambientAudioEngine.start(mode);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    ambientAudioEngine.setVolume(newVol);
  };

  const getModeDetails = (mode: AmbientSoundMode) => {
    switch (mode) {
      case 'rain':
        return {
          icon: <CloudRain className="h-4 w-4" />,
          colorBg: 'bg-sky-50 text-sky-700 border-sky-200/80',
          activeBg: 'bg-sky-100/80 text-sky-800 border-sky-300',
        };
      case 'brown':
        return {
          icon: <Wind className="h-4 w-4" />,
          colorBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          activeBg: 'bg-amber-100/80 text-amber-800 border-amber-300',
        };
      case 'gamma40':
        return {
          icon: <Activity className="h-4 w-4" />,
          colorBg: 'bg-teal-50 text-[#006B63] border-teal-200/80',
          activeBg: 'bg-teal-100/80 text-[#004D47] border-teal-300',
        };
      case 'library':
        return {
          icon: <BookOpen className="h-4 w-4" />,
          colorBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          activeBg: 'bg-indigo-100/80 text-indigo-800 border-indigo-300',
        };
      default:
        return {
          icon: <CloudRain className="h-4 w-4" />,
          colorBg: 'bg-teal-50 text-[#006B63] border-teal-200/80',
          activeBg: 'bg-teal-100/80 text-[#004D47] border-teal-300',
        };
    }
  };

  return (
    <div ref={popoverRef} className={`relative inline-block ${className}`}>
      {/* Frosted Apple Button matching Top Bar Controls */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center h-10 w-10 rounded-full border transition-all cursor-pointer select-none ${
          isPlaying
            ? 'bg-[#006B63] text-white border-[#005750] shadow-md shadow-teal-900/20'
            : 'bg-slate-100/90 hover:bg-white border-slate-200/90 hover:border-slate-300 text-slate-600 hover:text-[#006B63] shadow-xs'
        }`}
        title={isPlaying ? 'Focus Audio Playing (Tap to configure)' : 'Focus Ambient Audio (Rain, Brown Noise, 40Hz)'}
        aria-label="Focus Audio"
        aria-expanded={isOpen}
      >
        {isPlaying ? (
          <span className="flex items-end justify-center gap-[2.5px] h-3.5 w-3.5">
            <span className="w-[2.5px] bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite] h-full" />
            <span className="w-[2.5px] bg-white rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.2s] h-3/4" />
            <span className="w-[2.5px] bg-white rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.4s] h-1/2" />
          </span>
        ) : (
          <Volume2 className="h-4.5 w-4.5 stroke-[1.8]" />
        )}
      </motion.button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute right-0 top-full mt-2.5 w-80 max-w-[calc(100vw-1.5rem)] p-4 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(0,107,99,0.14),0_2px_8px_rgba(0,0,0,0.06)] z-[110] space-y-3.5 font-sans text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#006B63] flex items-center justify-center border border-teal-200/50">
                  <Volume2 className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-['Outfit'] text-slate-900 leading-tight">
                    Focus Audio Engine
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Calibrated acoustics for study flow
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
                aria-label="Close popover"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ambient Presets Grid */}
            <div className="space-y-1.5">
              {AMBIENT_MODES.map((mode) => {
                const isActive = currentMode === mode.id && isPlaying;
                const modeDetail = getModeDetails(mode.id);

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleSelectMode(mode.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-50/90 to-emerald-50/70 border-teal-200 shadow-xs'
                        : 'bg-stone-50/50 hover:bg-white border-stone-200/60 hover:border-teal-200/80 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-xl shrink-0 border transition-colors ${
                          isActive ? modeDetail.activeBg : modeDetail.colorBg
                        }`}
                      >
                        {modeDetail.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-['Outfit'] text-slate-800 leading-tight">
                          {mode.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                          {mode.description}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isActive ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006B63] text-white text-[9px] font-bold font-mono uppercase tracking-wider shadow-2xs">
                          <span className="flex items-end gap-[1.5px] h-2">
                            <span className="w-[1.5px] bg-white rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-full" />
                            <span className="w-[1.5px] bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s] h-2/3" />
                            <span className="w-[1.5px] bg-white rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s] h-1/2" />
                          </span>
                          <span>Live</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/80 border border-stone-200 flex items-center justify-center text-slate-400 group-hover:text-[#006B63]">
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume Control */}
            <div className="pt-2 border-t border-stone-200/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Volume Output
                </span>
                <span className="font-mono text-xs font-bold text-[#006B63] tabular-nums">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#006B63]"
                />
                <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Master Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleToggle}
                className={`w-full py-2 px-3 rounded-2xl text-xs font-bold font-['Outfit'] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  isPlaying
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-[#006B63] hover:bg-[#005750] text-white shadow-teal-900/10'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Ambient Audio</span>
                  </>
                )}
              </button>

              {onOpenZenFocus && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenZenFocus();
                  }}
                  className="w-full mt-2 py-1.5 px-3 rounded-2xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-teal-700" />
                  <span>Enter Zen Focus Sanctuary</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
