import { Vibe } from "../types";

class AmbientAudioService {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }
  }

  // Generates noise buffer (White/Pink/Brown)
  private createNoiseBuffer(type: 'white' | 'pink' | 'brown'): AudioBuffer | null {
    if (!this.context) return null;
    const bufferSize = 2 * this.context.sampleRate;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      if (type === 'white') {
        output[i] = white;
      } else if (type === 'pink') {
        const b = [0,0,0,0,0,0,0];
        b[0] = 0.99886 * b[0] + white * 0.0555179;
        b[1] = 0.99332 * b[1] + white * 0.0750759;
        b[2] = 0.96900 * b[2] + white * 0.1538520;
        b[3] = 0.86650 * b[3] + white * 0.3104856;
        b[4] = 0.55000 * b[4] + white * 0.5329522;
        b[5] = -0.7616 * b[5] - white * 0.0168980;
        output[i] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + white * 0.5362;
        output[i] *= 0.11; 
      } else if (type === 'brown') {
        const lastOut = (i > 0) ? output[i-1] : 0;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        output[i] *= 3.5; 
      }
    }
    return buffer;
  }

  public async startAmbience(vibe: Vibe) {
    this.init();
    if (this.isPlaying) return;
    if (this.context?.state === 'suspended') await this.context.resume();

    // Determine noise type based on vibe
    let noiseType: 'white' | 'pink' | 'brown' = 'brown'; // Default low focus
    let volume = 0.05;

    switch (vibe) {
        case 'social':
        case 'humorous':
        case 'charisma':
            noiseType = 'pink'; // More energy, higher freq
            volume = 0.03;
            break;
        case 'intellectual':
        case 'leadership':
        case 'negotiation':
            noiseType = 'brown'; // Deep focus, low rumble
            volume = 0.08;
            break;
        case 'empathy':
        case 'family':
        case 'parenting':
        case 'professional':
            noiseType = 'brown'; // Calming
            volume = 0.06;
            break;
    }

    const buffer = this.createNoiseBuffer(noiseType);
    if (!buffer || !this.context || !this.gainNode) return;

    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.gainNode);
    
    // Fade in
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 2);
    
    this.source.start();
    this.isPlaying = true;
  }

  public stopAmbience() {
    if (!this.isPlaying || !this.context || !this.gainNode || !this.source) return;

    // Fade out
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 1);

    setTimeout(() => {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }
        this.isPlaying = false;
    }, 1000);
  }

  public toggleMute(muted: boolean) {
      if (!this.gainNode || !this.context) return;
      if (muted) {
          this.gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
      } else {
          this.gainNode.gain.setTargetAtTime(0.05, this.context.currentTime, 0.1);
      }
  }
}

export const audioService = new AmbientAudioService();
