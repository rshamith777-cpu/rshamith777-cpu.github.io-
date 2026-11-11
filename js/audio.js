/**
 * Procedural Web Audio API Sound System
 * Synthesizes arcade retro effects, UI clicks, swing whooshes, and fanfare in real-time.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.25;

    // Load user preference
    const saved = localStorage.getItem('portfolio_sound_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('portfolio_sound_enabled', this.enabled);
    if (this.enabled) {
      this.play('blip', 600);
    }
    return this.enabled;
  }

  play(type, param) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.volume, now);
      master.connect(this.ctx.destination);

      switch (type) {
        case 'click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.05);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'hover': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(param || 440, now);
          osc.frequency.linearRampToValueAtTime((param || 440) + 60, now + 0.04);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.04);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'blip': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(param || 520, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'swing': {
          // Low whoosh for the hanging badge
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          const startF = 180 + Math.random() * 50;
          osc.frequency.setValueAtTime(startF, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.18);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }

        case 'laser': {
          // Game laser pew
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.12);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'explosion': {
          // Noise explosion for arcade game
          const bufferSize = this.ctx.sampleRate * 0.2;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.linearRampToValueAtTime(50, now + 0.2);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(master);
          noise.start(now);
          noise.stop(now + 0.2);
          break;
        }

        case 'coin': {
          // Mario-style coin chime
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.setValueAtTime(0.3, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'fanfare': {
          // Level up / achievement fanfare
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.09);
            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.3, now + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
            osc.connect(gain);
            gain.connect(master);
            osc.start(now + i * 0.09);
            osc.stop(now + i * 0.09 + 0.25);
          });
          break;
        }
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

window.soundEngine = new SoundEngine();
