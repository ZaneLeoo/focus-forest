// Procedural Web Audio Engine for Ambient Sounds & Notification Beeps

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentAmbientNode: {
    stop: () => void;
    setVolume: (v: number) => void;
  } | null = null;
  private currentSoundType: string = 'none';

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play ambient audio based on type
  playAmbient(type: 'rain' | 'wind' | 'creek' | 'birds' | 'fire' | 'none', volume: number = 0.5) {
    this.initCtx();
    if (this.currentAmbientNode) {
      this.currentAmbientNode.stop();
      this.currentAmbientNode = null;
    }
    this.currentSoundType = type;

    if (type === 'none' || !this.ctx) return;

    if (type === 'rain') {
      this.currentAmbientNode = this.createRainSound(volume);
    } else if (type === 'wind') {
      this.currentAmbientNode = this.createWindSound(volume);
    } else if (type === 'creek') {
      this.currentAmbientNode = this.createCreekSound(volume);
    } else if (type === 'birds') {
      this.currentAmbientNode = this.createBirdsSound(volume);
    } else if (type === 'fire') {
      this.currentAmbientNode = this.createFireSound(volume);
    }
  }

  setVolume(volume: number) {
    if (this.currentAmbientNode) {
      this.currentAmbientNode.setVolume(volume);
    }
  }

  stopAmbient() {
    if (this.currentAmbientNode) {
      this.currentAmbientNode.stop();
      this.currentAmbientNode = null;
    }
    this.currentSoundType = 'none';
  }

  getCurrentSoundType() {
    return this.currentSoundType;
  }

  // Gentle completion chime sound
  playCompletionChime() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Peaceful major arpeggio)
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.18);

      gain.gain.setValueAtTime(0.01, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 1.25);
    });
  }

  // Soft button click feedback
  playClickSound() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Synthesize Rain Sound (Pink Noise through Low Pass + High Pass)
  private createRainSound(initialVolume: number) {
    if (!this.ctx) return { stop: () => {}, setVolume: () => {} };
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

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

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.value = initialVolume * 0.3;

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();

    return {
      stop: () => {
        try { whiteNoise.stop(); } catch {}
      },
      setVolume: (v: number) => {
        gain.gain.value = v * 0.3;
      }
    };
  }

  // Synthesize Wind Sound
  private createWindSound(initialVolume: number) {
    if (!this.ctx) return { stop: () => {}, setVolume: () => {} };
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 350;
    filter.Q.value = 3;

    // LFO for howling modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.value = initialVolume * 0.25;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    lfo.start();

    return {
      stop: () => {
        try { noise.stop(); lfo.stop(); } catch {}
      },
      setVolume: (v: number) => {
        gain.gain.value = v * 0.25;
      }
    };
  }

  // Synthesize Creek / Water
  private createCreekSound(initialVolume: number) {
    if (!this.ctx) return { stop: () => {}, setVolume: () => {} };
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.value = initialVolume * 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();

    return {
      stop: () => {
        try { noise.stop(); } catch {}
      },
      setVolume: (v: number) => {
        gain.gain.value = v * 0.2;
      }
    };
  }

  // Synthesize Forest Birds
  private createBirdsSound(initialVolume: number) {
    if (!this.ctx) return { stop: () => {}, setVolume: () => {} };

    // Gentle rain base
    const baseRain = this.createRainSound(initialVolume * 0.5);

    let birdTimer: number | null = null;
    const scheduleChirp = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 2200 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 600, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 200, now + 0.16);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.08 * initialVolume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);

      birdTimer = window.setTimeout(scheduleChirp, 2000 + Math.random() * 4000);
    };

    scheduleChirp();

    return {
      stop: () => {
        baseRain.stop();
        if (birdTimer) clearTimeout(birdTimer);
      },
      setVolume: (v: number) => {
        baseRain.setVolume(v * 0.5);
      }
    };
  }

  // Synthesize Cozy Fire Crackle
  private createFireSound(initialVolume: number) {
    if (!this.ctx) return { stop: () => {}, setVolume: () => {} };
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.value = initialVolume * 0.25;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();

    return {
      stop: () => {
        try { noise.stop(); } catch {}
      },
      setVolume: (v: number) => {
        gain.gain.value = v * 0.25;
      }
    };
  }
}

export const soundEngine = new SoundEngine();
