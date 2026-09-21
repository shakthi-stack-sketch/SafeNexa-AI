/**
 * SAFENEXA — Audible Safety Alert / Siren Engine
 *
 * Web Audio API synthesized alarm for critical SIF precursor conditions.
 */

type SirenListener = (active: boolean, eventId: string | null) => void;

class SirenEngine {
  private audioCtx: AudioContext | null = null;
  private oscillator1: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private timer: any = null;
  private isPlaying: boolean = false;
  private activeEventId: string | null = null;
  private listeners: Set<SirenListener> = new Set();
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initAudio() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public subscribe(listener: SirenListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying, this.activeEventId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isPlaying, this.activeEventId);
      } catch (err) {
        console.error('Error in siren listener:', err);
      }
    });
  }

  /**
   * Triggers the audible alarm for a critical event.
   * Only sounds if not already muted.
   */
  public startSiren(eventId: string = 'CRITICAL-EVENT', autoStopSeconds: number = 30): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isMuted) {
      this.activeEventId = eventId;
      this.isPlaying = true;
      this.notify();
      return true;
    }

    try {
      this.initAudio();
      if (!this.audioCtx) return false;

      // Stop any existing tone before creating a new cycle
      this.stopInternalTone();

      this.activeEventId = eventId;
      this.isPlaying = true;

      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.15, this.audioCtx.currentTime); // Safe, pleasant alarm volume
      masterGain.connect(this.audioCtx.destination);
      this.gainNode = masterGain;

      // Create primary warble oscillator
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, this.audioCtx.currentTime); // High A5 tone
      osc1.connect(masterGain);
      osc1.start();
      this.oscillator1 = osc1;

      // Create sub-octave oscillator for industrial resonance
      const osc2 = this.audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc2.connect(masterGain);
      osc2.start();
      this.oscillator2 = osc2;

      // Two-tone industrial pulsing cycle (alternates frequencies every 350ms)
      let high = true;
      this.timer = setInterval(() => {
        if (!this.audioCtx || !this.oscillator1 || !this.oscillator2) return;
        const now = this.audioCtx.currentTime;
        if (high) {
          this.oscillator1.frequency.setTargetAtTime(660, now, 0.05); // E5 tone
          this.oscillator2.frequency.setTargetAtTime(330, now, 0.05);
        } else {
          this.oscillator1.frequency.setTargetAtTime(880, now, 0.05); // A5 tone
          this.oscillator2.frequency.setTargetAtTime(440, now, 0.05);
        }
        high = !high;
      }, 350);

      // Auto-silence safety timeout to avoid indefinite ringing if unattended
      if (autoStopSeconds > 0) {
        setTimeout(() => {
          if (this.isPlaying && this.activeEventId === eventId) {
            this.stopSiren();
          }
        }, autoStopSeconds * 1000);
      }

      this.notify();
      return true;
    } catch (err) {
      console.warn('[SafeNexa Siren] Audio playback blocked or unavailable:', err);
      this.isPlaying = true;
      this.activeEventId = eventId;
      this.notify();
      return false;
    }
  }

  private stopInternalTone() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.oscillator1) {
      try {
        this.oscillator1.stop();
        this.oscillator1.disconnect();
      } catch {}
      this.oscillator1 = null;
    }
    if (this.oscillator2) {
      try {
        this.oscillator2.stop();
        this.oscillator2.disconnect();
      } catch {}
      this.oscillator2 = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }

  public stopSiren() {
    this.stopInternalTone();
    this.isPlaying = false;
    this.activeEventId = null;
    this.notify();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isPlaying) {
      this.stopInternalTone();
      this.notify();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getActiveEventId(): string | null {
    return this.activeEventId;
  }
}

// Global Singleton for in-browser sound management
export const sirenController = new SirenEngine();
