import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  Headphones,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Award,
  BookOpen,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  AudioRecallController,
  AudioRecallItem,
  AudioRecallPlayerState,
} from '../utils/audioRecallEngine';
import {
  HIGH_YIELD_TRIADS,
  HIGH_YIELD_DOCS,
  HIGH_YIELD_FORMULAS,
} from './ExamEveCheatSheetModal';
import { AppState, ErrorNotebookItem } from '../types';

interface AudioRecallPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state?: AppState;
}

export const AudioRecallPlayerModal: React.FC<AudioRecallPlayerModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  // Playlist Category Selection
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'triads' | 'docs' | 'blunders'>('all');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Build audio items from clinical data
  const audioPlaylist = useMemo<AudioRecallItem[]>(() => {
    const items: AudioRecallItem[] = [];

    // Diagnostic Triads
    if (selectedCategory === 'all' || selectedCategory === 'triads') {
      HIGH_YIELD_TRIADS.forEach((t, i) => {
        items.push({
          id: `triad-${i}`,
          name: t.name,
          components: t.components,
          diagnosis: t.diagnosis,
          subject: 'Clinical Triad',
        });
      });
    }

    // High Yield Drugs of Choice
    if (selectedCategory === 'all' || selectedCategory === 'docs') {
      HIGH_YIELD_DOCS.forEach((d, i) => {
        items.push({
          id: `doc-${i}`,
          name: `DOC for ${d.condition}`,
          components: `Target Condition: ${d.condition}`,
          diagnosis: d.doc,
          subject: d.subject,
        });
      });
    }

    // Blunder Vault Due Errors (if available)
    if (selectedCategory === 'all' || selectedCategory === 'blunders') {
      const errorItems = state?.errorNotebook || [];
      errorItems.slice(0, 15).forEach((err: ErrorNotebookItem, i: number) => {
        if (err.questionGist && err.correctConcept) {
          items.push({
            id: `err-${err.id || i}`,
            name: `${err.topic || 'Blunder Vault'} Recall`,
            components: err.questionGist,
            diagnosis: err.correctConcept,
            subject: err.subjectId ? err.subjectId.toUpperCase() : 'Error Vault',
          });
        }
      });
    }

    // Fallback if empty
    if (items.length === 0) {
      items.push({
        id: 'fallback-1',
        name: "Beck's Triad",
        components: 'Hypotension, Muffled heart sounds, Jugular venous distension',
        diagnosis: 'Cardiac Tamponade',
        subject: 'Medicine',
      });
    }

    return items;
  }, [selectedCategory, state?.errorNotebook]);

  // Audio Engine Controller reference
  const controllerRef = useRef<AudioRecallController | null>(null);
  const [playerState, setPlayerState] = useState<AudioRecallPlayerState>({
    isPlaying: false,
    currentIndex: 0,
    totalItems: audioPlaylist.length,
    phase: 'idle',
    playbackRate: 1.0,
    recallPauseSeconds: 4,
    countdownRemaining: 4,
    currentItem: audioPlaylist[0] || null,
  });

  // Initialize or update items in controller
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new AudioRecallController(audioPlaylist, 1.0);
    } else {
      controllerRef.current.setItems(audioPlaylist);
    }

    const unsub = controllerRef.current.subscribe((s) => {
      setPlayerState(s);
    });

    return () => {
      unsub();
    };
  }, [audioPlaylist]);

  // Clean stop when modal unmounts or closes
  useEffect(() => {
    if (!isOpen && controllerRef.current) {
      controllerRef.current.stop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItem = playerState.currentItem || audioPlaylist[playerState.currentIndex] || audioPlaylist[0];

  const handleTogglePlay = () => {
    if (!controllerRef.current) return;
    if (playerState.isPlaying) {
      controllerRef.current.pause();
    } else {
      controllerRef.current.play();
    }
  };

  const handleNext = () => {
    controllerRef.current?.next();
  };

  const handlePrev = () => {
    controllerRef.current?.previous();
  };

  const handleSetRate = (rate: number) => {
    controllerRef.current?.setPlaybackRate(rate);
  };

  const handleSetPauseSeconds = (sec: number) => {
    controllerRef.current?.setRecallPauseSeconds(sec);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xl font-['Plus_Jakarta_Sans'] select-none">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/98 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-slate-100 space-y-6 overflow-hidden"
        >
          {/* Ambient Frosted Aura */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-teal-500/15 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute -bottom-24 right-10 w-72 h-40 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* Header */}
          <div className="relative flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-400/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Headphones className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-['Outfit']">
                    Hands-Free Hospital Commute Audio Recall
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-[10px] font-bold text-teal-300 uppercase tracking-wider font-mono">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Hear the clinical stem • 4s active recall pause • Revealing verified diagnosis
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close Player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All High Yields' },
              { id: 'triads', label: 'Diagnostic Triads' },
              { id: 'docs', label: 'Drugs of Choice' },
              { id: 'blunders', label: 'Blunder Vault Due' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-teal-500/20 text-teal-300 border-teal-400/40 shadow-sm shadow-teal-500/10'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active Recall Stage Card */}
          <div className="relative p-6 sm:p-7 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-5">
            {/* Top Status & Playlist Progress */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/15 border border-teal-400/30 text-teal-300 font-mono font-bold text-[11px]">
                  {currentItem?.subject || 'High Yield'}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Pearl {playerState.currentIndex + 1} of {playerState.totalItems}
                </span>
              </div>

              {/* Dynamic Phase Indicator */}
              <div className="flex items-center gap-2 font-mono text-xs">
                {playerState.phase === 'question' && (
                  <span className="flex items-center gap-1.5 text-cyan-300 animate-pulse font-medium">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Speaking Clinical Stem...</span>
                  </span>
                )}
                {playerState.phase === 'paused_for_recall' && (
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Active Recall Window ({playerState.countdownRemaining}s)</span>
                  </span>
                )}
                {playerState.phase === 'answer' && (
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <Award className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified Diagnosis Revealed</span>
                  </span>
                )}
                {playerState.phase === 'idle' || playerState.phase === 'stopped' ? (
                  <span className="text-slate-500">Ready to Play</span>
                ) : null}
              </div>
            </div>

            {/* Main Clinical Content Display */}
            <div className="space-y-3">
              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Outfit']">
                {currentItem?.name}
              </h4>
              <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5">
                {currentItem?.components}
              </p>
            </div>

            {/* Answer Reveal Card (with transition during answer phase) */}
            <AnimatePresence mode="wait">
              {playerState.phase === 'answer' ? (
                <motion.div
                  key="answer-revealed"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-400/40 space-y-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span>Diagnosis / Solution</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                    {currentItem?.diagnosis}
                  </div>
                </motion.div>
              ) : (
                <div
                  key="answer-hidden"
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-slate-500 text-xs"
                >
                  <span>Diagnosis concealed for active recall. Formulate your answer now...</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={`w-1 h-3 rounded-full ${
                          playerState.phase === 'paused_for_recall'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Circular Progress & Visual Equalizer Bar */}
            <div className="flex items-center justify-between pt-2">
              {/* Animated Equalizer Wave Bars */}
              <div className="flex items-end gap-1 h-6">
                {[12, 22, 16, 26, 14, 20, 10, 24, 18, 12].map((height, idx) => (
                  <span
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      playerState.isPlaying
                        ? 'bg-gradient-to-t from-teal-500 to-emerald-400'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: playerState.isPlaying
                        ? `${Math.max(4, Math.round(height * (idx % 2 === 0 ? 1.2 : 0.8)))}px`
                        : '4px',
                    }}
                  />
                ))}
              </div>

              {/* Active Recall Countdown Badge */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Recall Window:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  {playerState.phase === 'paused_for_recall' ? `${playerState.countdownRemaining}s` : `${playerState.recallPauseSeconds}s`}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Bar: Play / Pause, Skip, Speeds */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Speed & Pause Settings */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              {/* Playback Rate */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSetRate(rate)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      playerState.playbackRate === rate
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Pause Duration */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {[3, 4, 6].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleSetPauseSeconds(sec)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      playerState.recallPauseSeconds === sec
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`${sec} second active recall pause`}
                  >
                    {sec}s pause
                  </button>
                ))}
              </div>
            </div>

            {/* Core Playback Navigation */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Previous Pearl"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 hover:brightness-110 shadow-lg shadow-teal-500/25 active:scale-95 transition-all cursor-pointer"
                title={playerState.isPlaying ? 'Pause Audio Recall' : 'Play Audio Recall'}
              >
                {playerState.isPlaying ? (
                  <Pause className="h-5 w-5 fill-slate-950" />
                ) : (
                  <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Next Pearl"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
