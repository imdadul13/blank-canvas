export interface AudioRecallItem {
  id: string;
  name: string;
  components: string;
  diagnosis: string;
  subject?: string;
}

export type AudioRecallPhase = 'idle' | 'question' | 'paused_for_recall' | 'answer' | 'stopped';

export interface AudioRecallPlayerState {
  isPlaying: boolean;
  currentIndex: number;
  totalItems: number;
  phase: AudioRecallPhase;
  playbackRate: number; // 0.8, 1.0, 1.25, 1.5
  recallPauseSeconds: number; // 3, 4, 6
  countdownRemaining: number;
  currentItem: AudioRecallItem | null;
}

export class AudioRecallController {
  private items: AudioRecallItem[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private recallPauseSeconds: number = 4;
  private phase: AudioRecallPhase = 'idle';
  private countdownRemaining: number = 0;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private autoAdvanceTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Array<(state: AudioRecallPlayerState) => void> = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechEpoch: number = 0;

  constructor(items: AudioRecallItem[] = [], initialRate: number = 1.0) {
    this.items = items;
    this.playbackRate = initialRate;
  }

  public setItems(items: AudioRecallItem[]) {
    this.items = items;
    this.emitState();
  }

  public subscribe(callback: (state: AudioRecallPlayerState) => void): () => void {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public getState(): AudioRecallPlayerState {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      totalItems: this.items.length,
      phase: this.phase,
      playbackRate: this.playbackRate,
      recallPauseSeconds: this.recallPauseSeconds,
      countdownRemaining: this.countdownRemaining,
      currentItem: this.items[this.currentIndex] || null,
    };
  }

  private emitState() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    this.emitState();
  }

  public setRecallPauseSeconds(seconds: number) {
    this.recallPauseSeconds = seconds;
    this.emitState();
  }

  private cancelActiveSpeech() {
    this.speechEpoch++;
    this.clearTimers();
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public play(index?: number) {
    this.cancelActiveSpeech();
    if (typeof index === 'number' && index >= 0 && index < this.items.length) {
      this.currentIndex = index;
    }
    this.isPlaying = true;
    this.speakCurrentQuestion();
  }

  public pause() {
    this.isPlaying = false;
    this.cancelActiveSpeech();
    this.phase = 'stopped';
    this.emitState();
  }

  public next() {
    this.cancelActiveSpeech();
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // loop around
    }
    if (this.isPlaying) {
      this.speakCurrentQuestion();
    } else {
      this.phase = 'idle';
      this.emitState();
    }
  }

  public previous() {
    this.cancelActiveSpeech();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = Math.max(0, this.items.length - 1);
    }
    if (this.isPlaying) {
      this.speakCurrentQuestion();
    } else {
      this.phase = 'idle';
      this.emitState();
    }
  }

  public stop() {
    this.isPlaying = false;
    this.cancelActiveSpeech();
    this.phase = 'idle';
    this.emitState();
  }

  private clearTimers() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }
  }

  private speakText(text: string, onEnd: () => void) {
    this.cancelActiveSpeech();
    const epoch = this.speechEpoch;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // In SSR or test/unsupported environments, simulate clean completion
      setTimeout(() => {
        if (epoch === this.speechEpoch && this.isPlaying) {
          onEnd();
        }
      }, 50);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.playbackRate;
    utterance.pitch = 1.0;
    this.currentUtterance = utterance;

    utterance.onend = () => {
      if (epoch !== this.speechEpoch || !this.isPlaying) return;
      this.currentUtterance = null;
      onEnd();
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // Never trigger onEnd if utterance was canceled, interrupted, or superseded!
      if (e?.error === 'canceled' || e?.error === 'interrupted' || epoch !== this.speechEpoch || !this.isPlaying) {
        return;
      }
      this.currentUtterance = null;
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  private speakCurrentQuestion() {
    const epoch = this.speechEpoch;
    this.clearTimers();
    const current = this.items[this.currentIndex];
    if (!current || !this.isPlaying || epoch !== this.speechEpoch) return;

    this.phase = 'question';
    this.countdownRemaining = this.recallPauseSeconds;
    this.emitState();

    const textToSpeak = `Clinical Recall Pearl: ${current.name}. Key clinical findings: ${current.components}. What is the diagnosis?`;

    this.speakText(textToSpeak, () => {
      if (!this.isPlaying || epoch !== this.speechEpoch) return;
      this.startRecallPause();
    });
  }

  private startRecallPause() {
    const epoch = this.speechEpoch;
    this.phase = 'paused_for_recall';
    this.countdownRemaining = this.recallPauseSeconds;
    this.emitState();

    this.countdownTimer = setInterval(() => {
      if (epoch !== this.speechEpoch || !this.isPlaying) {
        this.clearTimers();
        return;
      }
      this.countdownRemaining--;
      this.emitState();

      if (this.countdownRemaining <= 0) {
        this.clearTimers();
        this.speakCurrentAnswer();
      }
    }, 1000);
  }

  private speakCurrentAnswer() {
    const epoch = this.speechEpoch;
    const current = this.items[this.currentIndex];
    if (!current || !this.isPlaying || epoch !== this.speechEpoch) return;

    this.phase = 'answer';
    this.emitState();

    const answerText = `Diagnosis: ${current.diagnosis}. High yield NBE repeat concept.`;

    this.speakText(answerText, () => {
      if (!this.isPlaying || epoch !== this.speechEpoch) return;

      // 2.5 second gap before automatically moving to the next pearl
      this.autoAdvanceTimeout = setTimeout(() => {
        if (!this.isPlaying || epoch !== this.speechEpoch) return;
        this.next();
      }, 2500);
    });
  }
}
