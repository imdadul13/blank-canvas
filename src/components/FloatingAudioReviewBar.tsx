import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  Headphones,
  Gauge,
} from 'lucide-react';
import { speechEngine, PlaylistState } from '../utils/speechEngine';

export const FloatingAudioReviewBar: React.FC = () => {
  const [playlistState, setPlaylistState] = useState<PlaylistState>(() =>
    speechEngine.getPlaylistState()
  );

  useEffect(() => {
    const unsubscribe = speechEngine.subscribe((_playing, _textId, pState) => {
      if (pState) {
        setPlaylistState(pState);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!playlistState.active || !playlistState.currentItem) {
    return null;
  }

  const { currentIndex, total, currentItem, isPlaying, isPaused, rate } = playlistState;

  const handleTogglePlayPause = () => {
    speechEngine.togglePauseResume();
  };

  const handleNext = () => {
    speechEngine.nextTrack();
  };

  const handlePrev = () => {
    speechEngine.prevTrack();
  };

  const handleCycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(rate) + 1) % speeds.length;
    speechEngine.setRate(speeds[nextIdx]);
  };

  const handleClose = () => {
    speechEngine.stopPlaylist();
  };

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Audio review player"
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[80] w-[92vw] max-w-lg"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl saturate-[180%] border border-black/[0.08] dark:border-white/10 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.98),0_18px_44px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06)] text-slate-900 dark:text-slate-100 select-none">
          {/* Left: Album-art Style Clinical Indicator & Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5856D6] to-[#007AFF] text-white shadow-md shadow-indigo-950/20 border border-white/20">
              <Headphones className="h-4.5 w-4.5 stroke-[2.2]" />
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#007AFF]">
                  {currentItem.subjectName || 'Clinical Recall'}
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums font-mono font-medium">
                  {currentIndex + 1} of {total}
                </span>
              </div>
              <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate tracking-tight">
                {currentItem.title}
              </h4>
            </div>
          </div>

          {/* Center/Right: Apple Music Tactile Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Speed Pill */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-95"
              title="Change playback speed"
            >
              <Gauge className="h-3 w-3 text-[#007AFF]" />
              <span>{rate}x</span>
            </button>

            {/* Prev */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-25 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-95"
              title="Previous item"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>

            {/* Play/Pause (Apple Music Signature Circle) */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold shadow-md shadow-black/20 transition-all transform active:scale-90 cursor-pointer"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="h-4 w-4 fill-current ml-0.5" /> : <Pause className="h-4 w-4 fill-current" />}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= total - 1}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-25 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-95"
              title="Next item"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all cursor-pointer ml-0.5 active:scale-95"
              title="Stop audio review"
            >
              <X className="h-4 w-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
