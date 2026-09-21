/**
 * Procedural Ambient Sound Synthesizer.
 * Generates focus-enhancing acoustic environments via Web Audio API.
 * Requires 0 external audio files, 0 bandwidth, and runs 100% offline.
 */

export type AmbientSoundMode = 'rain' | 'brown' | 'gamma40' | 'library';

export interface AmbientModeConfig {
  id: AmbientSoundMode;
  label: string;
  description: string;
  iconName: string;
}

export const AMBIENT_MODES: AmbientModeConfig[] = [
  {
    id: 'rain',
    label: 'Gentle Rain',
    description: 'Calming rainfall with randomized acoustic drops',
    iconName: 'CloudRain',
  },
  {
    id: 'brown',
    label: 'Deep Brown Noise',
    description: 'Low-frequency rumble that cancels external distractions',
    iconName: 'Wind',
  },
  {
    id: 'gamma40',
    label: '40Hz Gamma Focus',
    description: 'Binaural carrier wave scientifically linked to alert recall',
    iconName: 'Zap',
  },
  {
    id: 'library',
    label: 'Quiet Study Hall',
    description: 'Warm, soft room presence with gentle low-pass air hum',
    iconName: 'BookOpen',
  },
];

type AudioStateListener = (isPlaying: boolean, mode: AmbientSoundMode, volume: number) => void;

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioNode | null = null;
  private currentMode: AmbientSoundMode = 'rain';
  private volume: number = 0.35;
  private active: boolean = false;
  private listeners: Set<AudioStateListener> = new Set();

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.active, this.currentMode, this.volume);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.active, this.currentMode, this.volume));
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
    }
  }

  public isPlaying(): boolean {
    return this.active;
  }

  public getCurrentMode(): AmbientSoundMode {
    return this.currentMode;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public async start(mode?: AmbientSoundMode) {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (mode) {
      this.currentMode = mode;
    }

    this.stopSource();

    if (this.currentMode === 'gamma40') {
      this.startGammaBeat();
    } else {
      this.startNoiseBuffer(this.currentMode);
    }

    this.active = true;
    this.notify();
  }

  public stop() {
    this.stopSource();
    this.active = false;
    this.notify();
  }

  public toggle(mode?: AmbientSoundMode) {
    if (this.active) {
      if (mode && mode !== this.currentMode) {
        this.start(mode);
      } else {
        this.stop();
      }
    } else {
      this.start(mode || this.currentMode);
    }
  }

  private stopSource() {
    if (this.currentSource) {
      try {
        (this.currentSource as any).stop?.();
        this.currentSource.disconnect();
      } catch (_) {}
      this.currentSource = null;
    }
  }

  private startNoiseBuffer(mode: AmbientSoundMode) {
    if (!this.ctx || !this.gainNode) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4; // 4 seconds looped
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      if (mode === 'brown') {
        // Brown noise: Integrate white noise
        lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
        lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
        left[i] = lastOutL * 3.5;
        right[i] = lastOutR * 3.5;
      } else if (mode === 'library') {
        // Soft room air / pinkish
        lastOutL = (lastOutL + 0.04 * whiteL) / 1.04;
        lastOutR = (lastOutR + 0.04 * whiteR) / 1.04;
        left[i] = lastOutL * 2.2;
        right[i] = lastOutR * 2.2;
      } else {
        // Rain: Pink-filtered noise with gentle periodic amplitude modulation
        lastOutL = (lastOutL + 0.08 * whiteL) / 1.08;
        lastOutR = (lastOutR + 0.08 * whiteR) / 1.08;
        const dropletL = Math.random() > 0.992 ? (Math.random() * 0.4) : 0;
        const dropletR = Math.random() > 0.992 ? (Math.random() * 0.4) : 0;
        left[i] = lastOutL * 1.8 + dropletL;
        right[i] = lastOutR * 1.8 + dropletR;
      }
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    // Filter to eliminate harsh highs
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = mode === 'brown' ? 380 : mode === 'library' ? 650 : 1200;

    noiseNode.connect(filter);
    filter.connect(this.gainNode);
    noiseNode.start(0);
    this.currentSource = noiseNode;
  }

  private startGammaBeat() {
    if (!this.ctx || !this.gainNode) return;

    // Carrier frequency: 216Hz, 40Hz difference for Gamma synchrony
    const merger = this.ctx.createChannelMerger(2);

    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = 216; // 216Hz

    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.value = 256; // 256Hz -> 40Hz difference

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    merger.connect(this.gainNode);

    oscLeft.start();
    oscRight.start();

    this.currentSource = {
      disconnect: () => {
        try {
          oscLeft.stop();
          oscRight.stop();
          oscLeft.disconnect();
          oscRight.disconnect();
          merger.disconnect();
        } catch (_) {}
      },
    } as any;
  }
}

export const ambientAudioEngine = new AmbientAudioEngine();
