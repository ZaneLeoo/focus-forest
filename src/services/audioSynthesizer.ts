// Web Audio API Synthesizer for Ambient Sound Landscapes & Audio Feedback

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentSoundType: string = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private birdTimer: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSound(type: 'none' | 'rainforest' | 'breeze' | 'stream' | 'birds', volume = 0.5) {
    this.stopSound();

    if (type === 'none') {
      this.currentSoundType = 'none';
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentSoundType = type;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    switch (type) {
      case 'rainforest':
        this.createRainforest(this.masterGain);
        break;
      case 'breeze':
        this.createWind(this.masterGain);
        break;
      case 'stream':
        this.createStream(this.masterGain);
        break;
      case 'birds':
        this.createBirdsAndForest(this.masterGain);
        break;
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume * 0.4, this.ctx.currentTime, 0.1);
    }
  }

  public stopSound() {
    this.isPlaying = false;
    this.currentSoundType = 'none';

    if (this.birdTimer) {
      window.clearInterval(this.birdTimer);
      this.birdTimer = null;
    }

    this.activeNodes.forEach(node => {
      if (typeof node === 'number') {
        window.clearTimeout(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }
    });
    this.activeNodes = [];

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
  }

  // Generate pink/white noise buffer
  private createNoiseBuffer(duration = 5): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private createRainforest(target: GainNode) {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer(5);
    if (!buffer) return;

    // Continuous soft rain
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(target);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter);

    // Random raindrops
    const dropTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      const freq = 1200 + Math.random() * 1800;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      dropGain.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(dropGain);
      dropGain.connect(target);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }, 150);

    this.birdTimer = dropTimer;
  }

  private createWind(target: GainNode) {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer(5);
    if (!buffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO for swaying wind
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(target);

    noiseSource.start();
    lfo.start();

    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }

  private createStream(target: GainNode) {
    if (!this.ctx) return;
    const buffer = this.createNoiseBuffer(5);
    if (!buffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(target);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter);
  }

  private createBirdsAndForest(target: GainNode) {
    if (!this.ctx) return;
    // Gentle background breeze
    this.createWind(target);

    // Bird chirping timer
    const birdInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 2200 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq + 600, this.ctx.currentTime + 0.08);
      osc.frequency.linearRampToValueAtTime(baseFreq - 200, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.04);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(target);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }, 2500);

    this.birdTimer = birdInterval;
  }

  // Audio completion chime when timer finishes
  public playChime() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.3);
    });
  }

  public getCurrentSoundType() {
    return this.currentSoundType;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const audioSynth = new AudioSynthesizer();
