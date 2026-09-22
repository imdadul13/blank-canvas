/**
 * FMGE Medical Audio Read-Aloud & Hands-Free Commute Engine.
 * Powered by the browser's native Web Speech Synthesis API.
 * Enables hands-free auditory recall for high-yield clinical pearls, faculty explanations, and audio playlists.
 */

export interface PlaylistItem {
  id: string;
  title: string;
  subtitle?: string;
  text: string;
  subjectName?: string;
}

export interface PlaylistState {
  active: boolean;
  currentIndex: number;
  total: number;
  currentItem?: PlaylistItem;
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
}

export type SpeechStateListener = (
  isPlaying: boolean,
  activeTextId?: string,
  playlistState?: PlaylistState
) => void;

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeTextId: string | undefined = undefined;
  private listeners: Set<SpeechStateListener> = new Set();
  private speechRate: number = 1.0;

  // Playlist State
  private playlist: PlaylistItem[] = [];
  private playlistIndex: number = 0;
  private isPlaylistActive: boolean = false;
  private isPausedState: boolean = false;
  private autoAdvanceTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying(), this.activeTextId, this.getPlaylistState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const playing = this.isPlaying();
    const pState = this.getPlaylistState();
    this.listeners.forEach((listener) => listener(playing, this.activeTextId, pState));
  }

  public getPlaylistState(): PlaylistState {
    const currentItem = this.playlist[this.playlistIndex];
    return {
      active: this.isPlaylistActive,
      currentIndex: this.playlistIndex,
      total: this.playlist.length,
      currentItem: this.isPlaylistActive ? currentItem : undefined,
      isPlaying: this.isPlaying(),
      isPaused: this.isPausedState,
      rate: this.speechRate,
    };
  }

  public isPlaying(id?: string): boolean {
    if (!this.synth) return false;
    const busy = this.synth.speaking && !this.synth.paused && !this.isPausedState;
    if (id !== undefined) {
      return busy && this.activeTextId === id;
    }
    return busy;
  }

  public getActiveId(): string | undefined {
    return this.activeTextId;
  }

  public setRate(rate: number) {
    this.speechRate = Math.max(0.75, Math.min(2.0, rate));
    if (this.isPlaylistActive && this.isPlaying()) {
      // Restart current track with new rate seamlessly
      const item = this.playlist[this.playlistIndex];
      if (item) {
        this.speakItemInternal(item.id, item.text);
      }
    } else {
      this.notify();
    }
  }

  public getRate(): number {
    return this.speechRate;
  }

  /**
   * Speak a clinical text passage for a single item.
   */
  public speak(id: string, text: string, rateMultiplier?: number) {
    if (this.isPlaylistActive) {
      this.stopPlaylist();
    }

    // Toggle off if currently speaking the same item
    if (this.isPlaying(id)) {
      this.stop();
      return;
    }

    this.stop();
    this.speakItemInternal(id, text, rateMultiplier);
  }

  private speakItemInternal(
    id: string,
    text: string,
    rateMultiplier?: number,
    onEndedCallback?: () => void
  ) {
    if (!this.synth) return;

    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) {
      if (onEndedCallback) onEndedCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rateMultiplier ?? this.speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const voices = this.synth.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Arthur') ||
            v.name.includes('Karen'))
      ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.activeTextId = id;
    this.currentUtterance = utterance;
    this.isPausedState = false;

    utterance.onstart = () => {
      this.notify();
    };

    utterance.onend = () => {
      this.activeTextId = undefined;
      this.currentUtterance = null;
      this.notify();
      if (onEndedCallback) {
        onEndedCallback();
      }
    };

    utterance.onerror = () => {
      this.activeTextId = undefined;
      this.currentUtterance = null;
      this.notify();
      if (onEndedCallback) {
        onEndedCallback();
      }
    };

    this.synth.speak(utterance);
    this.notify();
  }

  /**
   * Start a continuous hands-free playlist of items (e.g. Pearls, DOCs, Mnemonics).
   */
  public playPlaylist(items: PlaylistItem[], startIndex: number = 0) {
    if (!items || items.length === 0) return;
    this.stop();
    this.clearAutoAdvanceTimer();

    this.playlist = [...items];
    this.playlistIndex = Math.max(0, Math.min(startIndex, items.length - 1));
    this.isPlaylistActive = true;
    this.isPausedState = false;

    this.playCurrentPlaylistItem();
  }

  private playCurrentPlaylistItem() {
    if (!this.isPlaylistActive || !this.playlist[this.playlistIndex]) {
      this.stopPlaylist();
      return;
    }

    const current = this.playlist[this.playlistIndex];
    const speechScript = `${current.title}. ${current.text}`;

    this.speakItemInternal(current.id, speechScript, this.speechRate, () => {
      if (!this.isPlaylistActive) return;

      // 1.8 second natural reflective pause before next clinical pearl
      this.autoAdvanceTimer = setTimeout(() => {
        if (!this.isPlaylistActive) return;
        if (this.playlistIndex < this.playlist.length - 1) {
          this.playlistIndex += 1;
          this.playCurrentPlaylistItem();
        } else {
          // Finished playlist
          this.stopPlaylist();
        }
      }, 1800);
    });
  }

  private clearAutoAdvanceTimer() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  public nextTrack() {
    if (!this.isPlaylistActive || this.playlist.length === 0) return;
    this.clearAutoAdvanceTimer();
    if (this.playlistIndex < this.playlist.length - 1) {
      this.playlistIndex += 1;
      this.stop();
      this.playCurrentPlaylistItem();
    } else {
      this.stopPlaylist();
    }
  }

  public prevTrack() {
    if (!this.isPlaylistActive || this.playlist.length === 0) return;
    this.clearAutoAdvanceTimer();
    if (this.playlistIndex > 0) {
      this.playlistIndex -= 1;
      this.stop();
      this.playCurrentPlaylistItem();
    } else {
      this.stop();
      this.playCurrentPlaylistItem();
    }
  }

  public togglePauseResume() {
    if (!this.synth || !this.isPlaylistActive) return;

    if (this.isPausedState) {
      this.isPausedState = false;
      this.synth.resume();
      this.notify();
    } else if (this.isPlaying()) {
      this.isPausedState = true;
      this.synth.pause();
      this.notify();
    }
  }

  public stopPlaylist() {
    this.clearAutoAdvanceTimer();
    this.isPlaylistActive = false;
    this.isPausedState = false;
    this.playlist = [];
    this.playlistIndex = 0;
    this.stop();
  }

  public stop() {
    this.clearAutoAdvanceTimer();
    if (this.synth) {
      this.synth.cancel();
    }
    this.activeTextId = undefined;
    this.currentUtterance = null;
    this.notify();
  }
}

export const speechEngine = new SpeechEngine();
