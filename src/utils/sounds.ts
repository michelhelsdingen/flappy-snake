// Procedural sound generation using Web Audio API
export class SoundManager {
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private unlocked: boolean = false;
  private musicEnabled: boolean = true;
  private currentMusicTier: number = -1;
  private musicOscillators: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private musicInterval: number | null = null;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  // Resume and unlock audio context (required for iOS)
  resume(): void {
    const ctx = this.getContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // iOS requires playing a silent buffer to unlock audio
    if (!this.unlocked) {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      this.unlocked = true;
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

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // Background music that changes based on score tier
  startMusic(tier: number = 0): void {
    if (!this.musicEnabled || !this.enabled) return;
    if (tier === this.currentMusicTier) return;

    this.stopMusic();
    this.currentMusicTier = tier;

    const ctx = this.getContext();

    // Different musical patterns for each tier
    const tierConfigs = [
      // Tier 0: Calm, slow (score 0-9)
      { tempo: 400, notes: [262, 294, 330, 294], volume: 0.03 },
      // Tier 1: Upbeat (score 10-24)
      { tempo: 300, notes: [330, 392, 440, 392, 330, 294], volume: 0.04 },
      // Tier 2: Energetic (score 25-49)
      { tempo: 200, notes: [440, 523, 587, 523, 440, 392, 349, 392], volume: 0.05 },
      // Tier 3: Intense (score 50+)
      { tempo: 150, notes: [523, 659, 784, 659, 523, 587, 659, 587], volume: 0.06 },
    ];

    const config = tierConfigs[Math.min(tier, tierConfigs.length - 1)];
    let noteIndex = 0;

    const playNote = () => {
      if (!this.musicEnabled || this.currentMusicTier !== tier) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      const freq = config.notes[noteIndex % config.notes.length];
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(config.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (config.tempo / 1000) * 0.9);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + (config.tempo / 1000));

      noteIndex++;
    };

    // Play first note immediately
    playNote();

    // Schedule subsequent notes
    this.musicInterval = window.setInterval(playNote, config.tempo);
  }

  updateMusicTier(score: number): void {
    let tier = 0;
    if (score >= 50) tier = 3;
    else if (score >= 25) tier = 2;
    else if (score >= 10) tier = 1;

    if (tier !== this.currentMusicTier) {
      this.startMusic(tier);
    }
  }

  stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicTier = -1;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
