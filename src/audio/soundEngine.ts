class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicVol = 0.4;
  private sfxVol = 0.7;
  private musicTimer: number | null = null;
  private step = 0;
  private unlocked = false;

  public unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.unlocked && this.ctx) {
      this.unlocked = true;
      this.startMusicLoop();
    }
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVol = Math.max(0, Math.min(1, music));
    this.sfxVol = Math.max(0, Math.min(1, sfx));
  }

  private startMusicLoop() {
    if (this.musicTimer !== null) return;
    // Upbeat 16-bit arcade driving bassline & lead (135 BPM -> ~111ms per 16th note)
    const bassNotes = [
      110, 110, 220, 110, 130.81, 130.81, 261.63, 130.81,
      146.83, 146.83, 293.66, 146.83, 164.81, 196.0, 220.0, 164.81,
    ];
    const leadNotes = [
      440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
      587.33, 0, 659.25, 783.99, 880, 783.99, 659.25, 523.25,
    ];

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.musicVol <= 0.01) return;
      const now = this.ctx.currentTime;
      const idx = this.step % bassNotes.length;

      // Bass triangle/saw
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassNotes[idx], now);
      bassGain.gain.setValueAtTime(0.08 * this.musicVol, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.1);

      // Lead square on even steps
      const leadFreq = leadNotes[idx];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, now);
        leadGain.gain.setValueAtTime(0.032 * this.musicVol, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + 0.095);
      }

      this.step++;
    }, 115);
  }

  public playCoin() {
    if (!this.ctx || this.sfxVol <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.055); // E6
    gain.gain.setValueAtTime(0.11 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playHorn() {
    if (!this.ctx || this.sfxVol <= 0.01) return;
    const now = this.ctx.currentTime;
    // Classic Indian auto-rickshaw dual-tone "peep-peep!"
    [0, 0.12].forEach((offset) => {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(520, now + offset);
      osc2.frequency.setValueAtTime(655, now + offset);
      gain.gain.setValueAtTime(0.11 * this.sfxVol, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.095);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(now + offset);
      osc2.start(now + offset);
      osc1.stop(now + offset + 0.1);
      osc2.stop(now + offset + 0.1);
    });
  }

  public playNitro() {
    if (!this.ctx || this.sfxVol <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.28);
    gain.gain.setValueAtTime(0.13 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playUpgrade() {
    if (!this.ctx || this.sfxVol <= 0.01) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.1 * this.sfxVol, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.13);
    });
  }

  public playFanfare() {
    if (!this.ctx || this.sfxVol <= 0.01) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5];
    const times = [0, 0.09, 0.18, 0.27, 0.36, 0.46];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + times[i]);
      gain.gain.setValueAtTime(0.12 * this.sfxVol, now + times[i]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + times[i]);
      osc.stop(now + times[i] + 0.24);
    });
  }

  public playClick() {
    if (!this.ctx || this.sfxVol <= 0.01) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620, now);
    gain.gain.setValueAtTime(0.06 * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }
}

export const soundEngine = new SoundEngine();
