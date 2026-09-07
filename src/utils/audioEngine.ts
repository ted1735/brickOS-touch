import { MixerTrack } from '../types';

class MiniDawEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private monoCollapseGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private trackNodes: Map<number, {
    osc: OscillatorNode;
    gain: GainNode;
    panner: StereoPannerNode;
    filter: BiquadFilterNode;
  }> = new Map();
  private isMono: boolean = false;
  private currentBus: string = 'master';

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public startPlayback(tracks: MixerTrack[], bpm: number = 100) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stopPlayback();
    this.isRunning = true;

    // Build stems with musical frequency relationships based on BPM
    const rootNotes = [110, 220, 330, 440]; // A2, A3, E4, A4

    tracks.forEach((t, i) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      const filter = this.ctx.createBiquadFilter();

      // Stem tone shaping
      if (t.id === 1) {
        // Master Instrumental: Warm sawtooth pad with low-pass
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rootNotes[0], this.ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      } else if (t.id === 2) {
        // Dry Vocal (UVR5): Triangle with vocal formant peak
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(rootNotes[1], this.ctx.currentTime);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
      } else if (t.id === 3) {
        // Harmonies & Ad-libs: Sine with chorus wobble
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rootNotes[2], this.ctx.currentTime);
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(2800, this.ctx.currentTime);
      } else {
        // Click & Ambient Plate: Rhythmic pulse
        osc.type = 'square';
        osc.frequency.setValueAtTime(rootNotes[3], this.ctx.currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
      }

      // Initial track gain & pan
      const initialVol = t.muted ? 0 : (t.vol / 100) * 0.25;
      gain.gain.setValueAtTime(initialVol, this.ctx.currentTime);
      panner.pan.setValueAtTime(t.pan / 100, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(this.masterGain);

      osc.start();

      this.trackNodes.set(t.id, { osc, gain, panner, filter });
    });

    this.updateBusRouting(this.currentBus, tracks);
  }

  public updateTrackControls(trackId: number, vol: number, pan: number, muted: boolean, hasSolo: boolean, isSolo: boolean) {
    if (!this.ctx) return;
    const node = this.trackNodes.get(trackId);
    if (!node) return;

    let targetGain = (vol / 100) * 0.25;
    if (muted) targetGain = 0;
    if (hasSolo && !isSolo) targetGain = 0;

    node.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    node.panner.pan.setTargetAtTime(pan / 100, this.ctx.currentTime, 0.05);
  }

  public setMasterVolume(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime((vol / 100) * 0.9, this.ctx.currentTime, 0.05);
  }

  public setMonoCollapse(enableMono: boolean) {
    this.isMono = enableMono;
    if (!this.ctx || !this.trackNodes) return;
    // Set all track panners to 0 in mono mode
    this.trackNodes.forEach((node) => {
      node.panner.pan.setTargetAtTime(enableMono ? 0 : 0, this.ctx!.currentTime, 0.05);
    });
  }

  public updateBusRouting(bus: string, tracks: MixerTrack[]) {
    this.currentBus = bus;
    if (!this.ctx) return;

    // Filter which tracks play based on audition bus
    this.trackNodes.forEach((node, id) => {
      let active = true;
      if (bus === 'vocal' && id !== 2) active = false;
      if (bus === 'instrumental' && (id === 2 || id === 3)) active = false;
      if (bus === 'suno') active = (id === 1);
      if (bus === 'ref') active = (id === 1 || id === 2);

      const target = active ? 0.2 : 0;
      node.gain.gain.setTargetAtTime(target, this.ctx!.currentTime, 0.04);
    });
  }

  public stopPlayback() {
    this.trackNodes.forEach((node) => {
      try {
        node.osc.stop();
        node.osc.disconnect();
      } catch (_) {}
    });
    this.trackNodes.clear();
    this.isRunning = false;
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const audioMiniDaw = new MiniDawEngine();
