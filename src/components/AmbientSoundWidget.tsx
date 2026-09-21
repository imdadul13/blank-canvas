import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Activity,
  BookOpen,
  Sliders,
  X,
  Play,
  Pause,
} from 'lucide-react';
import {
  ambientAudioEngine,
  AMBIENT_MODES,
  AmbientSoundMode,
} from '../utils/ambientAudioEngine';

interface AmbientSoundWidgetProps {
  className?: string;
}

export const AmbientSoundWidget: React.FC<AmbientSoundWidgetProps> = ({ className = '' }) => {
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

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    ambientAudioEngine.toggle();
  };

  const handleSelectMode = (mode: AmbientSoundMode) => {
    ambientAudioEngine.start(mode);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    ambientAudioEngine.setVolume(newVol);
  };

  const getModeIcon = (mode: AmbientSoundMode) => {
    switch (mode) {
      case 'rain':
        return <CloudRain className="h-4 w-4" />;
      case 'brown':
        return <Wind className="h-4 w-4" />;
      case 'gamma40':
        return <Activity className="h-4 w-4" />;
      case 'library':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <CloudRain className="h-4 w-4" />;
    }
  };

  return (
    <div ref={popoverRef} className={`relative inline-block ${className}`}>
      {/* Circular Frosted Button matching Notification Bell */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center h-10 w-10 rounded-full border transition-all cursor-pointer ${
          isPlaying
            ? 'bg-[#006B63] text-white border-[#005750] shadow-sm shadow-teal-700/20'
            : 'bg-white/80 backdrop-blur-xl border-white/85 text-slate-600 hover:text-[#006B63] hover:border-teal-300 hover:bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,107,99,0.03)]'
        }`}
        title={isPlaying ? 'Focus Audio Playing (Tap to configure)' : 'Focus Audio (Rain, Brown Noise, 40Hz)'}
        aria-label="Focus Audio"
      >
        {isPlaying ? (
          <span className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '60%' }} />
            <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:0.15s]" style={{ height: '100%' }} />
            <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:0.3s]" style={{ height: '75%' }} />
          </span>
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2.5 w-72 p-3.5 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-xl z-50 space-y-3 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-900 font-['Outfit']">
                  Focus Audio Engine
                </div>
                <div className="text-[10px] text-slate-400">
                  Acoustic focus for medical study
                </div>
              </div>

              {/* Master Play/Pause Toggle */}
              <button
                type="button"
                onClick={handleToggle}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3 w-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-1">
              {AMBIENT_MODES.map((mode) => {
                const isActive = currentMode === mode.id && isPlaying;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode.id)}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 border border-teal-200 text-teal-950 font-semibold'
                        : 'hover:bg-slate-50 border border-transparent text-slate-700'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center h-7 w-7 rounded-lg shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {getModeIcon(mode.id)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-['Outfit'] flex items-center justify-between">
                        <span>{mode.label}</span>
                        {isActive && (
                          <span className="text-[9.5px] font-bold text-teal-700 uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {mode.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1 text-slate-500">
                  <Sliders className="h-3 w-3 text-slate-400" />
                  <span>Volume</span>
                </span>
                <span className="font-mono text-slate-700">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
