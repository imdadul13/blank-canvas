import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Zap,
  BookOpen,
  Sliders,
  ChevronDown,
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
        return <CloudRain className="h-3.5 w-3.5" />;
      case 'brown':
        return <Wind className="h-3.5 w-3.5" />;
      case 'gamma40':
        return <Zap className="h-3.5 w-3.5" />;
      case 'library':
        return <BookOpen className="h-3.5 w-3.5" />;
      default:
        return <CloudRain className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div ref={popoverRef} className={`relative inline-block ${className}`}>
      {/* Trigger Pill */}
      <div className="flex items-center bg-white/90 hover:bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-0.5 backdrop-blur-md transition-all">
        {/* Play / Pause toggle */}
        <button
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            isPlaying
              ? 'bg-teal-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
          title={isPlaying ? 'Pause ambient focus audio' : 'Play ambient focus audio'}
        >
          {isPlaying ? (
            <>
              {/* Equalizer animation bars */}
              <span className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '60%' }} />
                <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:0.15s]" style={{ height: '100%' }} />
                <span className="w-0.5 bg-white rounded-full animate-bounce [animation-delay:0.3s]" style={{ height: '75%' }} />
              </span>
              <span className="font-['Outfit'] text-[11px]">Focus Sound</span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-['Outfit'] text-[11px]">Ambient</span>
            </>
          )}
        </button>

        {/* Dropdown open chevron */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-1.5 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 rounded-lg transition-colors cursor-pointer"
          title="Ambient focus sound options"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 p-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl z-50 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-['Outfit']">
                <Sliders className="h-3.5 w-3.5 text-teal-700" />
                <span>Ambient Focus Generator</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Zero Bandwidth</span>
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
                        ? 'bg-teal-50 border border-teal-200/80 text-teal-950'
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
                          <span className="text-[10px] font-bold text-teal-700">Active</span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
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
                <span className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3 text-slate-400" />
                  <span>Volume</span>
                </span>
                <span>{Math.round(volume * 100)}%</span>
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
