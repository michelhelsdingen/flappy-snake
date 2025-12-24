// Procedural sound generation using Web Audio API
export class SoundManager {
  private context: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  // Resume audio context (required for mobile after user interaction)
  resume(): void {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  // Flap sound - short rising tone
  playFlap(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  // Score sound - pleasant pling
  playScore(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();

    // Play two notes for a nicer sound
    [800, 1000].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);

      oscillator.start(ctx.currentTime + i * 0.08);
      oscillator.stop(ctx.currentTime + i * 0.08 + 0.15);
    });
  }

  // Death sound - descending boom
  playDeath(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();

    // Low impact
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    // Add noise burst for impact
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    noise.start(ctx.currentTime);
  }

  // New best score - victory fanfare
  playNewBest(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);

      oscillator.start(ctx.currentTime + i * 0.1);
      oscillator.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
