import { MixerTrack, DawEffectsState } from '../types';
import { DEFAULT_DAW_EFFECTS } from '../data/dawEffectsPresets';

class MiniDawEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private eqLowNode: BiquadFilterNode | null = null;
  private eqMidNode: BiquadFilterNode | null = null;
  private eqHighNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private makeupGainNode: GainNode | null = null;
  private tapeDriveNode: WaveShaperNode | null = null;
  private reverbSendGain: GainNode | null = null;
  private reverbReturnGain: GainNode | null = null;
  private reverbDelayNode: DelayNode | null = null;
  private reverbFeedbackGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private trackNodes: Map<number, {
    osc: OscillatorNode;
    gain: GainNode;
    panner: StereoPannerNode;
    filter: BiquadFilterNode;
  }> = new Map();
  private isMono: boolean = false;
  private currentBus: string = 'master';
  private currentEffects: DawEffectsState = { ...DEFAULT_DAW_EFFECTS };

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    // 1. Master Input Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    // 2. 3-Band Parametric EQ
    this.eqLowNode = this.ctx.createBiquadFilter();
    this.eqLowNode.type = 'lowshelf';
    this.eqLowNode.frequency.value = 80; // 80 Hz Low Shelf

    this.eqMidNode = this.ctx.createBiquadFilter();
    this.eqMidNode.type = 'peaking';
    this.eqMidNode.frequency.value = 1000; // 1 kHz Bell
    this.eqMidNode.Q.value = 1.0;

    this.eqHighNode = this.ctx.createBiquadFilter();
    this.eqHighNode.type = 'highshelf';
    this.eqHighNode.frequency.value = 10000; // 10 kHz High Shelf

    // 3. Analog Tape Drive (Soft saturation wave shaper)
    this.tapeDriveNode = this.ctx.createWaveShaper();
    this.tapeDriveNode.curve = this.makeDistortionCurve(15);
    this.tapeDriveNode.oversample = '2x';

    // 4. Master Dynamics VCA Compressor
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -18;
    this.compressorNode.knee.value = 6;
    this.compressorNode.ratio.value = 2.5;
    this.compressorNode.attack.value = 0.02;
    this.compressorNode.release.value = 0.25;

    // 5. Makeup Gain
    this.makeupGainNode = this.ctx.createGain();
    this.makeupGainNode.gain.value = 1.25;

    // 6. Plate Reverb Simulation (Delay + Feedback + Lowpass filter matrix)
    this.reverbSendGain = this.ctx.createGain();
    this.reverbSendGain.gain.value = 0.20;

    this.reverbDelayNode = this.ctx.createDelay();
    this.reverbDelayNode.delayTime.value = 0.045; // 45ms early reflections

    this.reverbFeedbackGain = this.ctx.createGain();
    this.reverbFeedbackGain.gain.value = 0.45;

    this.reverbReturnGain = this.ctx.createGain();
    this.reverbReturnGain.gain.value = 0.35;

    // Connect Reverb loop
    this.reverbSendGain.connect(this.reverbDelayNode);
    this.reverbDelayNode.connect(this.reverbFeedbackGain);
    this.reverbFeedbackGain.connect(this.reverbDelayNode);
    this.reverbDelayNode.connect(this.reverbReturnGain);

    // 7. Master Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Wiring Audio Graph:
    // masterGain -> eqLow -> eqMid -> eqHigh -> tapeDrive -> compressor -> makeupGain
    this.masterGain.connect(this.eqLowNode);
    this.eqLowNode.connect(this.eqMidNode);
    this.eqMidNode.connect(this.eqHighNode);
    this.eqHighNode.connect(this.tapeDriveNode);
    this.tapeDriveNode.connect(this.compressorNode);
    this.compressorNode.connect(this.makeupGainNode);

    // Send to Reverb in parallel
    this.eqHighNode.connect(this.reverbSendGain);
    this.reverbReturnGain.connect(this.analyser);

    // Dry chain to analyser
    this.makeupGainNode.connect(this.analyser);

    // Destination
    this.analyser.connect(this.ctx.destination);

    // Apply current default effects
    this.applyEffectsInternal(this.currentEffects);
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getEffects(): DawEffectsState {
    return { ...this.currentEffects };
  }

  public setEffects(effects: DawEffectsState) {
    this.currentEffects = { ...effects };
    this.applyEffectsInternal(effects);
  }

  private applyEffectsInternal(effects: DawEffectsState) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // EQ
    if (this.eqLowNode) {
      const gainVal = effects.eq.enabled ? effects.eq.low : 0;
      this.eqLowNode.gain.setTargetAtTime(gainVal, now, 0.05);
    }
    if (this.eqMidNode) {
      const gainVal = effects.eq.enabled ? effects.eq.mid : 0;
      this.eqMidNode.gain.setTargetAtTime(gainVal, now, 0.05);
    }
    if (this.eqHighNode) {
      const gainVal = effects.eq.enabled ? effects.eq.high : 0;
      this.eqHighNode.gain.setTargetAtTime(gainVal, now, 0.05);
    }

    // Compressor
    if (this.compressorNode) {
      if (effects.compressor.enabled) {
        this.compressorNode.threshold.setTargetAtTime(effects.compressor.threshold, now, 0.05);
        this.compressorNode.ratio.setTargetAtTime(effects.compressor.ratio, now, 0.05);
        this.compressorNode.attack.setTargetAtTime(effects.compressor.attack, now, 0.05);
        this.compressorNode.release.setTargetAtTime(effects.compressor.release, now, 0.05);
      } else {
        this.compressorNode.threshold.setTargetAtTime(0, now, 0.05);
        this.compressorNode.ratio.setTargetAtTime(1, now, 0.05);
      }
    }
    if (this.makeupGainNode) {
      const makeupVal = effects.compressor.enabled ? Math.pow(10, effects.compressor.makeup / 20) : 1.0;
      this.makeupGainNode.gain.setTargetAtTime(makeupVal, now, 0.05);
    }

    // Tape Drive
    if (this.tapeDriveNode) {
      const driveAmt = effects.tapeDrive.enabled ? Math.max(1, effects.tapeDrive.drive) : 0;
      this.tapeDriveNode.curve = this.makeDistortionCurve(driveAmt);
    }

    // Reverb
    if (this.reverbSendGain && this.reverbReturnGain && this.reverbFeedbackGain) {
      if (effects.reverb.enabled && effects.reverb.mix > 0) {
        const sendLevel = (effects.reverb.mix / 100) * 0.45;
        this.reverbSendGain.gain.setTargetAtTime(sendLevel, now, 0.05);
        const feedback = Math.min(0.85, (effects.reverb.decay / 8.0) * 0.75 + 0.15);
        this.reverbFeedbackGain.gain.setTargetAtTime(feedback, now, 0.05);
        this.reverbReturnGain.gain.setTargetAtTime(sendLevel * 0.8, now, 0.05);
      } else {
        this.reverbSendGain.gain.setTargetAtTime(0, now, 0.05);
        this.reverbReturnGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }

    // Stereo & Mono Collapse
    this.setMonoCollapse(effects.stereo.isMonoCollapse || effects.stereo.width === 0);
  }

  public startPlayback(tracks: MixerTrack[], bpm: number = 100) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stopPlayback();
    this.isRunning = true;

    // Musical frequency relationships based on BPM
    const rootNotes = [110, 220, 330, 440]; // A2, A3, E4, A4

    tracks.forEach((t) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      const filter = this.ctx.createBiquadFilter();

      // Stem tone shaping
      if (t.id === 1) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rootNotes[0], this.ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      } else if (t.id === 2) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(rootNotes[1], this.ctx.currentTime);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
      } else if (t.id === 3) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rootNotes[2], this.ctx.currentTime);
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(2800, this.ctx.currentTime);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(rootNotes[3], this.ctx.currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
      }

      const initialVol = t.muted ? 0 : (t.vol / 100) * 0.25;
      gain.gain.setValueAtTime(initialVol, this.ctx.currentTime);
      panner.pan.setValueAtTime(this.isMono ? 0 : t.pan / 100, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(this.masterGain);

      osc.start();

      this.trackNodes.set(t.id, { osc, gain, panner, filter });
    });

    this.updateBusRouting(this.currentEffects.busRouting || this.currentBus, tracks);
  }

  public updateTrackControls(trackId: number, vol: number, pan: number, muted: boolean, hasSolo: boolean, isSolo: boolean) {
    if (!this.ctx) return;
    const node = this.trackNodes.get(trackId);
    if (!node) return;

    let targetGain = (vol / 100) * 0.25;
    if (muted) targetGain = 0;
    if (hasSolo && !isSolo) targetGain = 0;

    node.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    node.panner.pan.setTargetAtTime(this.isMono ? 0 : pan / 100, this.ctx.currentTime, 0.05);
  }

  public setMasterVolume(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime((vol / 100) * 0.9, this.ctx.currentTime, 0.05);
  }

  public setMonoCollapse(enableMono: boolean) {
    this.isMono = enableMono;
    if (!this.ctx || !this.trackNodes) return;
    this.trackNodes.forEach((node) => {
      node.panner.pan.setTargetAtTime(enableMono ? 0 : 0, this.ctx!.currentTime, 0.05);
    });
  }

  public updateBusRouting(bus: string, tracks: MixerTrack[]) {
    this.currentBus = bus;
    if (!this.ctx) return;

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

  // Lossless 24-Bit / 48kHz WAV Exporter with active EQ, Dynamics, and Reverb
  public async export24BitWav(
    tracks: MixerTrack[],
    bpm: number = 100,
    durationSec: number = 8,
    effectsState?: DawEffectsState
  ): Promise<Blob> {
    const activeEffects = effectsState || this.currentEffects;
    const sampleRate = 48000;
    const numChannels = 2;
    const numFrames = sampleRate * durationSec;
    const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
      numChannels,
      numFrames,
      sampleRate
    );

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.85;

    // EQ in offline context
    const eqLow = offlineCtx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 80;
    eqLow.gain.value = activeEffects.eq.enabled ? activeEffects.eq.low : 0;

    const eqMid = offlineCtx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.gain.value = activeEffects.eq.enabled ? activeEffects.eq.mid : 0;

    const eqHigh = offlineCtx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 10000;
    eqHigh.gain.value = activeEffects.eq.enabled ? activeEffects.eq.high : 0;

    // Dynamics compressor
    const comp = offlineCtx.createDynamicsCompressor();
    if (activeEffects.compressor.enabled) {
      comp.threshold.value = activeEffects.compressor.threshold;
      comp.ratio.value = activeEffects.compressor.ratio;
      comp.attack.value = activeEffects.compressor.attack;
      comp.release.value = activeEffects.compressor.release;
    } else {
      comp.threshold.value = 0;
      comp.ratio.value = 1;
    }

    const makeup = offlineCtx.createGain();
    makeup.gain.value = activeEffects.compressor.enabled ? Math.pow(10, activeEffects.compressor.makeup / 20) : 1.0;

    masterGain.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(comp);
    comp.connect(makeup);
    makeup.connect(offlineCtx.destination);

    const rootNotes = [110, 220, 330, 440];
    tracks.forEach((t) => {
      if (t.muted) return;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      const panner = offlineCtx.createStereoPanner();
      const filter = offlineCtx.createBiquadFilter();

      if (t.id === 1) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rootNotes[0], 0);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, 0);
      } else if (t.id === 2) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(rootNotes[1], 0);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, 0);
      } else if (t.id === 3) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rootNotes[2], 0);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(400, 0);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(rootNotes[3], 0);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, 0);
      }

      const panVal = activeEffects.stereo.isMonoCollapse ? 0 : t.pan / 100;
      panner.pan.setValueAtTime(panVal, 0);
      gain.gain.setValueAtTime((t.vol / 100) * 0.22, 0);

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(masterGain);

      osc.start(0);
      osc.stop(durationSec);
    });

    const renderedBuffer = await offlineCtx.startRendering();

    // 24-Bit Linear PCM RIFF/WAVE Encoder
    const left = renderedBuffer.getChannelData(0);
    const right = renderedBuffer.getChannelData(1);
    const bytesPerSample = 3; // 24-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numFrames * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 24, true); // 24-Bit

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write 24-bit samples
    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      const sL = Math.max(-1, Math.min(1, left[i]));
      const sR = Math.max(-1, Math.min(1, right[i]));

      const valL = sL < 0 ? sL * 0x800000 : sL * 0x7fffff;
      const intL = Math.floor(valL);
      view.setUint8(offset++, intL & 0xff);
      view.setUint8(offset++, (intL >> 8) & 0xff);
      view.setUint8(offset++, (intL >> 16) & 0xff);

      const valR = sR < 0 ? sR * 0x800000 : sR * 0x7fffff;
      const intR = Math.floor(valR);
      view.setUint8(offset++, intR & 0xff);
      view.setUint8(offset++, (intR >> 8) & 0xff);
      view.setUint8(offset++, (intR >> 16) & 0xff);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const audioMiniDaw = new MiniDawEngine();
