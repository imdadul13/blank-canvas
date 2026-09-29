import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudRain, Wind, Activity, BookOpen, X, Play, Pause, Volume2, VolumeX, Headphones } from 'lucide-react';
import { ambientAudioEngine, AMBIENT_MODES, AmbientSoundMode } from '../utils/ambientAudioEngine';

interface AmbientSoundWidgetProps {
  className?: string;
  onOpenZenFocus?: () => void;
  isDark?: boolean;
}

const MODE_META: Record<AmbientSoundMode, { icon: React.ReactNode; color: string; label: string }> = {
  rain:     { icon: <CloudRain className="h-3.5 w-3.5" />, color: '#5AC8FA', label: 'Rain' },
  brown:    { icon: <Wind className="h-3.5 w-3.5" />,      color: '#FF9500', label: 'Brown Noise' },
  gamma40:  { icon: <Activity className="h-3.5 w-3.5" />, color: '#BF5AF2', label: '40 Hz Gamma' },
  library:  { icon: <BookOpen className="h-3.5 w-3.5" />, color: '#30D158', label: 'Library' },
};

export const AmbientSoundWidget: React.FC<AmbientSoundWidgetProps> = ({
  className = '',
  onOpenZenFocus,
  isDark = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMode, setCurrentMode] = useState<AmbientSoundMode>('rain');
  const [volume, setVolume] = useState(0.35);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return ambientAudioEngine.subscribe((active, mode, vol) => {
      setIsPlaying(active);
      setCurrentMode(mode);
      setVolume(vol);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const meta = MODE_META[currentMode];

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {/* Trigger button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen(v => !v)}
        title={isPlaying ? `${meta.label} playing` : 'Focus Audio'}
        aria-label="Focus Audio"
        className={`relative flex items-center justify-center h-10 w-10 rounded-full cursor-pointer transition-all duration-200 ${
          isPlaying
            ? 'bg-[#007AFF] text-white shadow-[0_2px_12px_rgba(0,122,255,0.45)]'
            : isDark
            ? 'bg-white/[0.10] hover:bg-white/[0.18] text-white/70 hover:text-white'
            : 'bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1D1D1F]'
        }`}
      >
        {isPlaying ? (
          <span className="flex items-end justify-center gap-[2px] h-3.5 w-3.5">
            {[1, 0.75, 1, 0.55].map((h, i) => (
              <span
                key={i}
                className="w-[2px] bg-white rounded-full"
                style={{
                  height: `${h * 100}%`,
                  animation: `pulse ${0.8 + i * 0.15}s ease-in-out infinite ${i * 0.12}s`,
                }}
              />
            ))}
          </span>
        ) : (
          <Volume2 className="h-4 w-4 stroke-[1.8]" />
        )}
      </motion.button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="absolute right-0 top-full mt-2.5 w-72 bg-[#1C1C1E]/95 backdrop-blur-3xl border border-white/[0.10] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55),0_4px_16px_rgba(0,0,0,0.30)] z-[300] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-[#007AFF]/20 flex items-center justify-center">
                  <Volume2 className="h-3.5 w-3.5 text-[#5AC8FA]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white leading-tight">Focus Audio</p>
                  <p className="text-[10px] text-white/40 leading-tight">Calibrated for study flow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-full bg-white/[0.08] hover:bg-white/[0.16] flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Mode list */}
            <div className="p-2 space-y-0.5">
              {AMBIENT_MODES.map((mode) => {
                const m = MODE_META[mode.id];
                const isActive = currentMode === mode.id && isPlaying;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      if (currentMode === mode.id && isPlaying) ambientAudioEngine.toggle();
                      else ambientAudioEngine.start(mode.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.10]'
                        : 'hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${m.color}22`, color: m.color }}
                      >
                        {m.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-white leading-tight">{mode.label}</p>
                        <p className="text-[10px] text-white/40 truncate leading-tight">{mode.description}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="flex items-end gap-[1.5px] h-3 shrink-0 ml-2">
                        {[1, 0.6, 0.9, 0.5].map((h, i) => (
                          <span
                            key={i}
                            className="w-[1.5px] rounded-full"
                            style={{
                              height: `${h * 100}%`,
                              backgroundColor: m.color,
                              animation: `pulse ${0.7 + i * 0.15}s ease-in-out infinite ${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </span>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 ml-2">
                        <Play className="h-2.5 w-2.5 fill-white/50 text-white/50 ml-0.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume */}
            <div className="px-4 pb-3 pt-1 border-t border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Volume</span>
                <span className="text-[11px] font-bold text-white/70 tabular-nums">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <input
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={e => ambientAudioEngine.setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-[#007AFF]"
                  style={{ background: `linear-gradient(to right, #007AFF ${volume * 100}%, rgba(255,255,255,0.12) ${volume * 100}%)` }}
                />
                <Volume2 className="h-3.5 w-3.5 text-white/30 shrink-0" />
              </div>
            </div>

            {/* Actions */}
            <div className="px-2 pb-2 space-y-1.5">
              <button
                type="button"
                onClick={() => ambientAudioEngine.toggle()}
                className={`w-full py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-[#FF3B30]/15 text-[#FF3B30] hover:bg-[#FF3B30]/25'
                    : 'bg-[#007AFF] text-white hover:bg-[#0056CC] shadow-[0_2px_10px_rgba(0,122,255,0.35)]'
                }`}
              >
                {isPlaying ? <><Pause className="h-3.5 w-3.5 fill-current" /><span>Pause</span></> : <><Play className="h-3.5 w-3.5 fill-current" /><span>Start Audio</span></>}
              </button>
              {onOpenZenFocus && (
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); onOpenZenFocus(); }}
                  className="w-full py-2 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <Headphones className="h-3.5 w-3.5" />
                  <span>Zen Focus Sanctuary</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
