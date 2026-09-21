/**
 * FMGE Medical Audio Read-Aloud Engine.
 * Powered by the browser's native Web Speech Synthesis API.
 * Enables hands-free, eye-strain-free auditory recall for high-yield clinical pearls and faculty explanations.
 */

type SpeechStateListener = (isPlaying: boolean, activeTextId?: string) => void;

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeTextId: string | undefined = undefined;
  private listeners: Set<SpeechStateListener> = new Set();
  private speechRate: number = 1.0;

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
    listener(this.isPlaying(), this.activeTextId);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const playing = this.isPlaying();
    this.listeners.forEach((listener) => listener(playing, this.activeTextId));
  }

  public isPlaying(id?: string): boolean {
    if (!this.synth) return false;
    const busy = this.synth.speaking && !this.synth.paused;
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
  }

  public getRate(): number {
    return this.speechRate;
  }

  /**
   * Speak a clinical text passage.
   * If the same text is already playing, calling speak will toggle/stop it.
   */
  public speak(id: string, text: string, rateMultiplier?: number) {
    if (!this.synth) return;

    // Toggle off if currently speaking the same item
    if (this.isPlaying(id)) {
      this.stop();
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    // Clean text of markdown formatting (*, #, _, `, etc.) for clear pronunciation
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rateMultiplier ?? this.speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick natural-sounding English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Arthur'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.activeTextId = id;
    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.notify();
    };

    utterance.onend = () => {
      this.activeTextId = undefined;
      this.currentUtterance = null;
      this.notify();
    };

    utterance.onerror = () => {
      this.activeTextId = undefined;
      this.currentUtterance = null;
      this.notify();
    };

    this.synth.speak(utterance);
    this.notify();
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.activeTextId = undefined;
    this.currentUtterance = null;
    this.notify();
  }
}

export const speechEngine = new SpeechEngine();
