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
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl text-white">
          {/* Left: Indicator & Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-400/30">
              <Headphones className="h-5 w-5" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  {currentItem.subjectName || 'Clinical Recall'}
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums font-mono">
                  {currentIndex + 1} of {total}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                {currentItem.title}
              </h4>
            </div>
          </div>

          {/* Center/Right: Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Speed Pill */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Change playback speed"
            >
              <Gauge className="h-3 w-3 text-teal-400" />
              <span>{rate}x</span>
            </button>

            {/* Prev */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Previous item"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/25 transition-all transform active:scale-95 cursor-pointer"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="h-4 w-4 fill-current ml-0.5" /> : <Pause className="h-4 w-4 fill-current" />}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= total - 1}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Next item"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Stop audio review"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
